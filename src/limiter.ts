/**
 * The floor-limiter core: count real user floors on the session surface,
 * pick the compaction range that leaves the newest N floors verbatim, and
 * run one compaction through the backend-independent `ctx.compaction` seam.
 *
 * A "floor" is one real user turn: a `user/message` whose `source.kind` is
 * `'user'`. Assistant messages and tool results belong to the floor opened
 * by their preceding user message. A compaction summary replacement is also
 * a `user/message` but has a plugin source — it never counts as a floor and
 * never spans one, so a summary node can never re-trigger the limiter.
 */
import type { Context } from '@deepseek-ai/cordis'
import type { Agent, PreStepDecision } from '@deepseek-ai/dsh-agent'
import type { SessionEvent, Session } from '@deepseek-ai/dsh-session'
import { toolPairingBalancedAfter, toolPairingBalancedBefore, type CompactionEngine } from '@deepseek-ai/dsh-compaction'

/** The user-source kind that marks a real user floor. */
const USER_SOURCE_KIND = 'user'

/** The live settings read by the limiter on every pre-step. */
export interface LimiterSettings {
  readonly enabled: boolean
  readonly triggerFloors: number
  readonly keepFloors: number
}

/** Whether one event is a real user floor opener (never a summary node). */
function isUserFloor(event: SessionEvent | undefined): boolean {
  return event?.type === 'user/message' && event.data.source.kind === USER_SOURCE_KIND
}

/**
 * The tool-pairing seam resolves Session against the repository declaration
 * graph; the plugin compiles against the profile-graph copy. The runtime
 * objects are structurally identical, so the plugin's session is cast once
 * here and every seam call below uses the compatible view.
 */
function seamSession(session: Session): Parameters<typeof toolPairingBalancedAfter>[0] {
  return session as unknown as Parameters<typeof toolPairingBalancedAfter>[0]
}

/**
 * Count the real user floors currently on the model-visible surface.
 * @param session - session whose surface is inspected.
 * @returns how many user-sourced `user/message` nodes are on the surface.
 */
export function countUserFloors(session: Session): number {
  const events = session.events
  if (events === undefined) return 0
  const bySeq = new Map<number, SessionEvent>()
  for (const event of events) bySeq.set(event.seq, event)
  let floors = 0
  for (const seq of session.surface.nodes) {
    if (isUserFloor(bySeq.get(seq))) floors += 1
  }
  return floors
}

/**
 * Pick the inclusive surface seq range to compact so the newest `keepFloors`
 * real user floors stay verbatim. `start` is the surface head; `end` is the
 * last balanced node before the kept tail, mirroring the official
 * `selectCompactableRange` head-anchored strategy: walk the boundary left
 * from the kept tail until it is tool-pairing balanced.
 *
 * Returns `null` when nothing can be compacted (no floors, all floors within
 * the kept tail, or no balanced boundary to cut on).
 * @param session - session supplying the surface.
 * @param keepFloors - how many newest user floors stay verbatim (0 = all).
 * @returns the inclusive range, or `null` when there is nothing to compact.
 */
export function selectCompactionRange(
  session: Session,
  keepFloors: number,
): { start: number; end: number } | null {
  const nodes = session.surface.nodes
  if (nodes.length === 0) return null
  const events = session.events
  if (events === undefined) return null
  const bySeq = new Map<number, SessionEvent>()
  for (const event of events) bySeq.set(event.seq, event)

  // Surface indexes at which a real user floor begins; the kept tail starts
  // after the (floors - keepFloors)-th floor, i.e. at that floor's last node.
  const floorBegins: number[] = []
  let inFloor = false
  for (let index = 0; index < nodes.length; index += 1) {
    const event = bySeq.get(nodes[index]!)
    if (event !== undefined && isUserFloor(event)) {
      floorBegins.push(index)
      inFloor = true
    }
  }

  const floors = floorBegins.length
  if (floors <= keepFloors) return null

  // 保留尾起始:第 (floors - keepFloors) 个 floor 的最后一个 surface position。
  // No floor to keep (keepFloors = 0) means the tail starts after the surface;
  // the walk below then bounds backward from the surface tail.
  const keepFloorOffset = Math.max(floors - keepFloors, 1)
  let endIdx = keepFloors === 0
    ? nodes.length - 1
    : floorBegins[keepFloorOffset]! - 1

  // Walk left until the cut AFTER `endIdx` is tool-pairing balanced. The
  // surface tail cut (keepFloors = 0) is balanced only after the last
  // completed step; an open step (unpaired tool-call) walks its cut back.
  while (endIdx >= 0) {
    let balanced: boolean
    try {
      balanced = toolPairingBalancedAfter(seamSession(session), nodes[endIdx]!)
    } catch (error) {
      console.error(`[floor-limiter] balance check threw at idx=${endIdx} seq=${nodes[endIdx]}: ${error instanceof Error ? error.message : String(error)}`)
      return null
    }
    if (balanced) break
    endIdx -= 1
  }
  if (endIdx < 0) return null

  const start = nodes[0]!
  const end = nodes[endIdx]!
  return { start, end }
}

/**
 * Run one floor-triggered compaction if the surface has enough real floors.
 * Anything that prevents a safe compaction (no range, unbalanced boundary,
 * summary not smaller, active compaction, aborted signal, missing seam)
 * yields `false` and never throws — the turn continues untouched and a later
 * pre-step retries.
 * @param ctx - plugin context carrying the compaction seam.
 * @param agent - the waking agent whose session is compacted.
 * @param settings - live limiter settings.
 * @param signal - live turn cancellation signal.
 * @param compaction - injected compaction engine (resolved at plugin load).
 * @returns true when a compaction was committed; false when skipped.
 */
export async function maybeCompactSession(
  ctx: Context,
  agent: Agent,
  settings: LimiterSettings,
  signal: AbortSignal,
  compaction?: CompactionEngine,
): Promise<boolean> {
  if (!settings.enabled) return false
  const floors = countUserFloors(agent.session)
  if (floors < settings.triggerFloors) return false
  const range = selectCompactionRange(agent.session, settings.keepFloors)
  if (range === null) return false

  if (compaction === undefined) {
    console.error('[floor-limiter] compaction service unavailable for agent — skipping')
    return false
  }
  try {
    // The compaction seam's Session/Agent types resolve against the repository
    // declaration graph; the runtime object is the same shape. One structural
    // cast at the seam boundary keeps the plugin type-checking while calling
    // the service exactly as the official command plugin does.
    type RegionArgs = Parameters<CompactionEngine['compactRegion']>
    const agentContext = agent as unknown as RegionArgs[2]
    await compaction.compactRegion(range.start, range.end, agentContext, signal)
    return true
  } catch (error) {
    console.error(`[floor-limiter] compactRegion failed: ${error instanceof Error ? error.message : String(error)}`)
    return false
  }
}

/** The pre-step listener the plugin mounts per agent (for doc/typing only). */
export type PreStepListener = (
  payload: { agent: Agent; signal: AbortSignal },
  next: () => Promise<PreStepDecision>,
) => Promise<PreStepDecision>
