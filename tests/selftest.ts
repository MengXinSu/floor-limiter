/**
 * floor-limiter core self-check: exercises `countUserFloors` /
 * `selectCompactionRange` against a real `session.surface` fold built from a
 * synthetic append-only event log. Run with:
 *
 *   node --import tsx tests/selftest.ts
 *
 * No framework: `node:assert/strict`, non-zero exit on failure.
 */
import assert from 'node:assert/strict'
import { Session, type SessionEvent } from '@deepseek-ai/dsh-session'
import {
  countUserFloors,
  selectCompactionRange,
} from '../src/limiter.ts'

/** One synthetic surface event spec. */
interface Spec {
  readonly type: string
  readonly source?: 'user' | 'plugin'
}

/**
 * One real floor in TRUE DSH pairing shape: user → assistant (may carry one
 * tool-call) → tool/result. A tool call must be answered by a tool/result, so
 * `withTool` emits assistant(tool-call) then tool/result.
 */
function floor(withTool = false): Spec[] {
  const out: Spec[] = [{ type: 'user/message' }]
  out.push({ type: 'assistant/message', withTool })
  if (withTool) out.push({ type: 'tool/result' })
  return out
}

/**
 * One `system/message`: the surface head that holds the system prompt.
 * It only accepts a `system/message` over exactly itself, so a compaction range
 * must start after it — the case that used to make every compaction fail with
 * "node 0 holds the system prompt".
 */
function systemHead(): Spec[] {
  return [{ type: 'system/message' }]
}

/**
 * Build a live-format Session from specs (append-only, surfaceOp: 'append').
 *
 * The seed boundary of dsh 0.1.7 validates far more than 0.1.2 did, so every
 * event below carries the fields the current `Session.create` requires:
 * - `surfaceOp` on every surface-eligible event;
 * - `assistant/message` data with `turn` / `step` (safe non-negative integers)
 *   and a `stream` array — `[]` is accepted, the elements are opaque at seed
 *   time (session/src/index.ts assertAssistantSettlementShape);
 * - `tool/result` whose message carries `role: 'tool'`, a top-level
 *   `toolCallId` equal to `source.callId`, and a `content` array;
 * - `seq` contiguous from 0.
 * `assistant/message` must NOT carry `sourceEventSeqs`.
 */
function makeSession(specs: readonly Spec[]): Session {
  const events: SessionEvent[] = []
  let seq = 0
  let turn = 0
  let openCallId: string | undefined
  for (const spec of specs) {
    const envelope = { seq: seq++, time: 1, surfaceOp: 'append' as const }
    if (spec.type === 'system/message') {
      events.push({
        ...envelope,
        type: 'system/message' as const,
        data: {
          message: {
            id: `s${seq}`,
            role: 'system' as const,
            source: { kind: 'system-prompt' as const },
            content: [{ type: 'text' as const, text: 'system prompt' }],
          },
        },
      } as unknown as SessionEvent)
    } else if (spec.type === 'user/message') {
      turn += 1
      openCallId = undefined
      events.push({
        ...envelope,
        type: 'user/message' as const,
        data: {
          id: `m${seq}`,
          role: 'user' as const,
          source: spec.source === 'plugin'
            ? { kind: 'plugin' as const, plugin: 'compaction' }
            : { kind: 'user' as const },
          content: [{ type: 'text' as const, text: `u${seq}` }],
        },
      } as unknown as SessionEvent)
    } else if (spec.type === 'assistant/message') {
      const callId = `c${seq}`
      const content = spec.withTool
        ? [{ type: 'tool-call' as const, id: callId, name: 'mock', arguments: '{}' }]
        : [{ type: 'text' as const, text: `a${seq}` }]
      openCallId = spec.withTool ? callId : undefined
      events.push({
        ...envelope,
        type: 'assistant/message' as const,
        data: {
          turn,
          step: 1,
          stream: [],
          message: {
            id: `a${seq}`,
            role: 'assistant' as const,
            source: { kind: 'model' as const, provider: 'mock', model: 'mock' },
            content,
          },
        },
      } as unknown as SessionEvent)
    } else if (spec.type === 'tool/result') {
      const callId = openCallId ?? `c${seq - 1}`
      events.push({
        ...envelope,
        type: 'tool/result' as const,
        data: {
          turn,
          step: 1,
          message: {
            id: `t${seq}`,
            role: 'tool' as const,
            toolCallId: callId,
            source: { kind: 'tool' as const, callId },
            content: [{ type: 'text' as const, text: 'ok' }],
          },
        },
      } as unknown as SessionEvent)
    } else {
      events.push({ ...envelope, type: spec.type as SessionEvent['type'], data: {} } as unknown as SessionEvent)
    }
  }
  return Session.create('selftest' as never, events) as unknown as Session
}

// --- 1. 20 floors (each with tool result), keep 5 → compact first 15 floors ---
{
  const specs: Spec[] = []
  for (let i = 0; i < 20; i += 1) specs.push(...floor(true))
  const session = makeSession(specs)
  assert.equal(countUserFloors(session), 20, '20 real floors visible')
  const range = selectCompactionRange(session, 5)
  assert.ok(range, 'range exists')
  const nodes = session.surface.nodes
  // Each floor is 3 nodes (user, assistant, tool) → floor 15 ends at index 2*15+1 = 44.
  assert.equal(range.start, nodes[0], 'start is surface head')
  assert.equal(range.end, nodes[44], 'keeps floors 16..20; compacts 1..15 (ends on floor 15 tool/result)')
}

// --- 2. Summary (plugin source) does NOT count as a floor ---
{
  const specs: Spec[] = [{ type: 'user/message', source: 'plugin' }]
  for (let i = 0; i < 8; i += 1) specs.push(...floor())
  const session = makeSession(specs)
  assert.equal(countUserFloors(session), 8, 'summary is not a floor')
  const range = selectCompactionRange(session, 5)
  assert.ok(range, 'range exists with 8 floors and keep 5')
  const nodes = session.surface.nodes
  // flatten: [summary(0), u1(1), a1(2), u2(3), a2(4), u3(5), a3(6), ...]
  // 8 floors keep 5 → compact 3 floors → end = floor3 last node = a3 = nodes[6]
  assert.equal(range.end, nodes[6], 'compact 3 floors only')
}

// --- 3. Fewer floors than keep → null ---
{
  const specs: Spec[] = []
  for (let i = 0; i < 4; i += 1) specs.push(...floor())
  const session = makeSession(specs)
  assert.equal(countUserFloors(session), 4)
  assert.equal(selectCompactionRange(session, 5), null, 'all floors within keep → null')
}

// --- 4. keep 0 → compact the whole surface ---
{
  const specs: Spec[] = []
  for (let i = 0; i < 10; i += 1) specs.push(...floor())
  const session = makeSession(specs)
  const range = selectCompactionRange(session, 0)
  const nodes = session.surface.nodes
  assert.ok(range)
  assert.equal(range.start, nodes[0])
  assert.equal(range.end, nodes[nodes.length - 1], 'keep 0 compacts the whole surface')
}

// --- 5. 12 floors, keep 5 → compact 7 floors ---
{
  const specs: Spec[] = []
  for (let i = 0; i < 12; i += 1) specs.push(...floor())
  const session = makeSession(specs)
  const range = selectCompactionRange(session, 5)
  const nodes = session.surface.nodes
  assert.ok(range)
  // 2-node floors (user, assistant): compacting 7 floors ends at index 2*7-1 = 13 → now exactly floor 7.
  assert.equal(range.end, nodes[13], 'keeps floors 8..12 verbatim; compacts 1..7')
  assert.equal(countUserFloors(session), 12)
}

// --- 6. Open step at tail (last assistant has unpaired tool-call) → end walks left ---
{
  const specs: Spec[] = []
  for (let i = 0; i < 10; i += 1) specs.push(...floor())
  // Open step: assistant with tool-call, NO tool/result follows.
  specs.push({ type: 'assistant/message', withTool: true })
  const session = makeSession(specs)
  const range = selectCompactionRange(session, 0)
  assert.ok(range, 'range exists despite open step')
  const nodes = session.surface.nodes
  // 10 floors (2 nodes each) then open assistant at index 20. Balanced cut
  // before it (index 20) is false, so end walks left to index 19 (last
  // tool/result of floor 10 — balanced).
  assert.equal(range.end, nodes[19], 'open step excluded from compacted span')
}

// --- 7. system/message at surface node 0 must NOT be inside the range ---
// Real-session regression: with the system prompt as node 0, `start` used to be
// nodes[0], and every compaction died with
//   "surface replace: node 0 holds the system prompt and may be rewritten only
//    by a system/message over exactly that node"
// The engine keeps producing summaries and refusing to commit them, silently.
{
  const specs: Spec[] = [...systemHead()]
  for (let i = 0; i < 8; i += 1) specs.push(...floor())
  const session = makeSession(specs)
  const nodes = session.surface.nodes
  assert.equal(nodes.length, 17, '1 system head + 8 floors × 2 nodes')
  assert.equal(countUserFloors(session), 8, 'system head is not a floor')

  const range = selectCompactionRange(session, 5)
  assert.ok(range, 'range exists')
  assert.equal(range.start, nodes[1], 'range starts AFTER the system head, not at node 0')
  assert.equal(range.end, nodes[6], 'keeps floors 5..8; compacts 1..4 (ends on floor 4 last node)')
  assert.notEqual(range.start, nodes[0], 'the system prompt is never inside the range')

  // keep 0 with a system head: still starts after the head.
  const whole = selectCompactionRange(session, 0)
  assert.ok(whole)
  assert.equal(whole.start, nodes[1], 'keep 0 still skips the system head')
  assert.equal(whole.end, nodes[nodes.length - 1], 'keep 0 reaches the surface tail')
}

console.log('floor-limiter selftest: all assertions passed')
