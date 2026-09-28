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
import type { SessionEvent, Session, SessionSeq } from '@deepseek-ai/dsh-session'
import { toolPairingBalancedAfter, toolPairingBalancedBefore, type CompactionEngine } from '@deepseek-ai/dsh-compaction'

/** The user-source kind that marks a real user floor. */
const USER_SOURCE_KIND = 'user'

/**
 * 放弃阈值：压缩失败后，至少再走过这么多事件才允许重试。
 *
 * 没有它就是一个死循环——`countUserFloors` 是每轮实时数出来的，失败后下一轮
 * pre-step 会算出同样的楼层数，于是每轮都重试一次、每轮都真调一次摘要 LLM
 * （2026-09-28 那条老会话连烧 9 次就是这么来的）。
 *
 * 200 个事件大约相当于十几层对话，足够区分「一次偶发失败」和「这个会话已经脏了」：
 * 前者很快重试，后者不会死磕。
 */
const ABANDON_STRIDE_EVENTS = 200

/**
 * 已放弃压缩的会话 → 放弃时的会话位置（事件数）。
 *
 * 用 `WeakMap` 而**不是** `Map<sessionId, …>`：以 session 对象本身作 key，会话被
 * 回收时条目自动消失。所以它不驻留、不泄漏、不写盘，进程死了一起死；对同一个
 * 会话最多只存一条记录。
 */
const abandonedSessions = new WeakMap<object, number>()

/** 当前会话位置（事件数），用作放弃判定与重试的单调时钟。 */
function sessionPosition(session: Session): number {
  return readEvents(session).length
}

/**
 * 这个会话是否还处于「放弃期」（失败后还没走够 {@link ABANDON_STRIDE_EVENTS}）。
 * @param session - 被检查的会话。
 * @returns true 表示本轮应当跳过压缩尝试。
 */
function isCompactionAbandoned(session: Session): boolean {
  if (typeof session !== 'object' || session === null) return false
  const since = abandonedSessions.get(session)
  return since !== undefined && sessionPosition(session) - since < ABANDON_STRIDE_EVENTS
}

/**
 * 记录一次压缩失败：该会话在当前位置之后的一段时间内不再尝试。
 * 判定见 {@link isCompactionAbandoned}；记录随会话对象一起被 GC 回收。
 * @param session - 压缩失败的会话。
 */
function abandonCompaction(session: Session): void {
  if (typeof session !== 'object' || session === null) return
  abandonedSessions.set(session, sessionPosition(session))
}

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
 * Whether the surface head is the system prompt node.
 *
 * Such a node only accepts a `system/message` written over exactly itself; a
 * compaction summary replacing it is refused by the engine, which is why the
 * compacted range must start after it (official `systemHead` check in
 * compaction-basic's `selectCompactableRange`).
 * @param head - the event at surface node 0.
 * @returns true when node 0 is the system prompt.
 */
function isSystemHead(head: SessionEvent | undefined): boolean {
  return head?.type === 'system/message'
}

/**
 * Read the session event log across harness versions. 0.1.1 exposed an
 * `events` getter; 0.1.2 removed it in favour of `snapshotEvents()`, so a bare
 * `session.events` read returns `undefined` there and silently disables the
 * limiter.
 * @param session - session whose event log is read.
 * @returns the session's events, or an empty array when neither API exists.
 */
function readEvents(session: Session): readonly SessionEvent[] {
  const snapshot = (session as { snapshotEvents?: () => readonly SessionEvent[] }).snapshotEvents
  if (typeof snapshot === 'function') return snapshot.call(session)
  const legacy = (session as { events?: readonly SessionEvent[] }).events
  return legacy ?? []
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
  const events = readEvents(session)
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
): { start: SessionSeq; end: SessionSeq } | null {
  const nodes = session.surface.nodes
  if (nodes.length === 0) return null
  const events = readEvents(session)
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

  // 表面头可能是 system prompt（`system/message`）。它只能被另一条
  // `system/message` 精确覆盖，普通摘要替换会被引擎拒绝：
  //   "surface replace: node 0 holds the system prompt and may be rewritten
  //    only by a system/message over exactly that node"
  // 所以压缩区间从第一个**非 system** 节点开始——镜像官方
  // `selectCompactableRange` 的 `firstIdx = systemHead(...) === undefined ? 0 : 1`。
  const firstIdx = isSystemHead(bySeq.get(nodes[0]!)) ? 1 : 0
  if (firstIdx >= nodes.length) return null

  // 保留尾起始:第 (floors - keepFloors) 个 floor 的最后一个 surface position。
  // No floor to keep (keepFloors = 0) means the tail starts after the surface;
  // the walk below then bounds backward from the surface tail.
  // 保留最近 keepFloors 层：被压缩区间止于「保留区开始的前一个节点」。
  // 第 (floors - keepFloors) 层就是保留区的第一层（0-based 的 floorBegins 下标），
  // 所以切点在 floorBegins[floors - keepFloors] 的前一位。keepFloors = 0 走上面的尾部分支。
  const keepFloorOffset = Math.max(floors - keepFloors, 1)
  const cutOffset = keepFloors === 0 ? floors : floors - keepFloors
  let endIdx = keepFloors === 0
    ? nodes.length - 1
    : floorBegins[cutOffset]! - 1

  // Walk left until the cut AFTER `endIdx` is tool-pairing balanced. The
  // surface tail cut (keepFloors = 0) is balanced only after the last
  // completed step; an open step (unpaired tool-call) walks its cut back.
  // 下界是 firstIdx：区间至少要含一个可替换节点，且不得碰到 system 头。
  while (endIdx >= firstIdx) {
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
  if (endIdx < firstIdx) return null

  const start = nodes[firstIdx]!
  const end = nodes[endIdx]!
  return { start, end }
}

/**
 * 一次压缩尝试的结局。`'failed'` 与 `'skipped'` 必须区分开：只有前者该触发
 * 「放弃期」，跳过（没到阈值、没有可压区间）不应该被惩罚。
 *
 * `reason` 只在 `'failed'` 时出现，是引擎抛出的原始错误文本——**没有它就无法
 * 定位失败点**：引擎在 `session.append('compaction/start')` 之前有若干校验
 * （表面范围、计量快照、压缩锁），失败时日志里连 `compaction/start` 都不会有，
 * 只能靠这句话区分「哪一道校验拦的」。
 */
export type CompactionOutcome =
  | { readonly outcome: 'compacted' }
  | { readonly outcome: 'skipped' }
  | { readonly outcome: 'failed'; readonly reason: string }

/**
 * Run one floor-triggered compaction if the surface has enough real floors.
 * Anything that prevents a safe compaction (no range, unbalanced boundary,
 * summary not smaller, active compaction, aborted signal, missing seam)
 * yields a non-`'compacted'` outcome and never throws — the turn continues
 * untouched and a later pre-step retries.
 *
 * 失败（引擎拒绝、摘要生成不出来）会让这个会话进入「放弃期」：之后至少再走过
 * {@link ABANDON_STRIDE_EVENTS} 个事件才重试，避免每轮都白烧一次摘要 LLM。
 * @param agent - the waking agent whose session is compacted.
 * @param settings - live limiter settings.
 * @param compaction - injected compaction engine (resolved at plugin load).
 * @param signal - live turn cancellation signal.
 * @returns what this attempt actually did.
 */
export async function maybeCompactSession(
  agent: Agent,
  settings: LimiterSettings,
  compaction?: CompactionEngine,
  signal?: AbortSignal,
): Promise<CompactionOutcome>
/**
 * 只拿得到 Session 的调用方（探针、单元测试）可以走这一版，语义相同。
 * @param session - the session whose floors and ranges are inspected.
 * @param settings - live limiter settings.
 * @param compaction - injected compaction engine.
 * @param signal - live turn cancellation signal.
 * @returns what this attempt actually did.
 */
export async function maybeCompactSession(
  session: Session,
  settings: LimiterSettings,
  compaction?: CompactionEngine,
  signal?: AbortSignal,
): Promise<CompactionOutcome>
export async function maybeCompactSession(
  target: Agent | Session,
  settings: LimiterSettings,
  compaction?: CompactionEngine,
  signal?: AbortSignal,
): Promise<CompactionOutcome> {
  // 引擎的 `compactRegion(start, end, agent, signal)` 要的是 **agent**——它内部读
  // `agent.session` 交给摘要器。两者归一化后再往下走：传错对象会让引擎拿到
  // `undefined.session`（2026-09-28 的回归就是这么炸的，reason 是
  // "Cannot read properties of undefined (reading 'surface')"）。
  const agent = 'session' in target ? (target as Agent) : undefined
  const session = agent === undefined ? (target as Session) : agent.session
  if (!settings.enabled) return { outcome: 'skipped' }
  // 放弃期内直接跳过：这个会话已经在同一个位置失败过，重试只是再烧一次摘要。
  if (isCompactionAbandoned(session)) return { outcome: 'skipped' }
  const floors = countUserFloors(session)
  if (floors < settings.triggerFloors) return { outcome: 'skipped' }
  const range = selectCompactionRange(session, settings.keepFloors)
  if (range === null) {
    // 到阈值却选不出区间，说明保留量已经覆盖全部楼层——没什么可压的，不是失败。
    console.error('[floor-limiter] nothing to compact: no balanced range outside the kept tail')
    return { outcome: 'skipped' }
  }

  if (compaction === undefined) {
    const reason = 'compaction service unavailable for agent'
    console.error(`[floor-limiter] ${reason} — abandoning this session`)
    abandonCompaction(session)
    return { outcome: 'failed', reason }
  }
  try {
    // The compaction seam's Session/Agent types resolve against the repository
    // declaration graph; the runtime object is the same shape. One structural
    // cast at the seam boundary keeps the plugin type-checking while calling
    // the service exactly as the official command plugin does.
    //
    // 第三个参数必须是 agent（引擎要读 `agent.session`）。只有调用方给的就是
    // Session 时（探针/单测），才退化成把它当 agent 传——引擎在那种路径上
    // 只会碰 `agent.session`，而探针的壳会自带 session。
    type RegionArgs = Parameters<CompactionEngine['compactRegion']>
    const agentContext = (agent ?? { session }) as unknown as RegionArgs[2]
    await compaction.compactRegion(range.start, range.end, agentContext, signal)
    return { outcome: 'compacted' }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    console.error(`[floor-limiter] compactRegion failed: ${reason}`)
    abandonCompaction(session)
    return { outcome: 'failed', reason }
  }
}

/** The pre-step listener the plugin mounts per agent (for doc/typing only). */
export type PreStepListener = (
  payload: { agent: Agent; signal: AbortSignal },
  next: () => Promise<PreStepDecision>,
) => Promise<PreStepDecision>
