/**
 * floor-limiter host plugin: counts real user floors (user turns) on each
 * agent's session surface and, once they reach the configured trigger, runs
 * one compaction that keeps the newest N floors verbatim and collapses the
 * rest into a single summary.
 *
 * Thresholds are the plugin's own Config (see `./settings.ts`): dsh 0.1.7
 * projects that schema into 设置 → 插件配置 and reloads this entry when a form
 * edit commits, so a change takes effect on the next pre-step without a
 * restart — the removed `settings.register` namespace and the client
 * `settingsScope` service are no longer involved.
 */
import { appendFileSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
// Type-only: the ctx.agentPresets Context merge. From dsh 0.1.7 on the release
// that owns the service is @deepseek-ai/dsh-agent-preset-registry — the old
// @deepseek-ai/dsh-agent-presets package no longer ships (its last npm tag is
// 0.1.5-rc.3), though the service name 'agentPresets' is unchanged.
import type {} from '@deepseek-ai/dsh-agent-preset-registry'
import type {} from '@deepseek-ai/dsh-compaction'
import type { FloorLimiterConfig, FloorLimiterSettings } from './contract.ts'
import { countUserFloors, maybeCompactSession } from './limiter.ts'
import { FloorLimiterSettingsSchema } from './settings.ts'

/** Cordis plugin name (the Loader entry id). */
export const name = 'floor-limiter'

/**
 * Services required before load: agents (lifecycle) and agentPresets
 * (per-agent realm lookup for the compaction seam).
 */
export const inject = ['agents', 'agentPresets']

/** Editable configuration, projected into the settings page by `ctx.settings`. */
export const Config: typeof FloorLimiterSettingsSchema = FloorLimiterSettingsSchema

/**
 * Mount the floor limiter on every agent. The pre-step listener is registered
 * on the root context — the same dispatch surface `dsh-agent-instructions`
 * uses — so the scope-filtered `agent/pre-step` emission always reaches it.
 *
 * The compaction service lives in the agent/preset realm (`isolate:
 * { compaction: true }` in the preset composition), NOT on the host plane —
 * injecting it here would leave this plugin `pending` forever and crash the
 * web boot. Instead the seam is read per agent at pre-step time via
 * `ctx.agentPresets.serviceFor(agent, 'compaction')` (official read
 * addressing for isolate-realm services; dsh-agent-preset-registry is
 * host-plane).
 * Any compaction failure is swallowed inside `maybeCompactSession` and the
 * turn continues with the full history until the next pre-step.
 * @param ctx - host cordis context.
 * @param config - committed configuration for this entry.
 */
/**
 * 诊断留痕：宿主把 console 输出吞掉了（desktop 端不落盘），所以自己写一个文件，
 * 便于事后回答「楼层到了为什么没压」。只在真正的决策点写，每次唤醒最多一行；
 * 文件超过 1MB 就清空重来，避免长期运行无限增长。
 *
 * 路径不含机器相关信息：优先 `DSH_FLOOR_LIMITER_LOG` 环境变量，其次落到当前
 * 用户的主目录。**不能放临时目录**——宿主进程的 TEMP 与外部工具不是同一个目录。
 */
function diag(line: string): void {
  // 两条路都走：文件给外部读（desktop 宿主不落盘 console），console 给界面日志面板看。
  console.log(line)
  try {
    const file = process.env.DSH_FLOOR_LIMITER_LOG ?? join(homedir(), '.floor-limiter-diag.log')
    try { if (statSync(file).size > 1_000_000) writeFileSync(file, '') } catch { /* 首次不存在 */ }
    appendFileSync(file, `${new Date().toISOString()} ${line}\n`)
  } catch { /* 诊断写不进去不影响主流程 */ }
}

/** Read a volatile config ref; tolerate already-resolved values (tests, older hosts). */
function readRef<T>(value: T | { get(): T } | undefined, fallback: T): T {
  if (value === undefined) return fallback
  const ref = value as { get?: () => T }
  return typeof ref.get === 'function' ? ref.get() : (value as T)
}

/**
 * Unwrap the volatile config refs into plain values.
 *
 * Runs on every wake, not once at mount: the refs are live, so reading them per
 * pre-step is what makes a settings edit take effect without a restart.
 * @param config - the volatile config refs handed to apply.
 * @returns resolved settings with plain booleans and numbers.
 */
function resolveConfig(config: FloorLimiterConfig): FloorLimiterSettings {
  return {
    enabled: readRef(config.enabled, false),
    triggerFloors: readRef(config.triggerFloors, 20),
    keepFloors: readRef(config.keepFloors, 5),
  }
}

export function apply(ctx: Context, config: FloorLimiterConfig): void {
  const resolved = resolveConfig(config)
  if (!resolved.enabled) {
    diag('[floor-limiter] disabled by config — the limiter will not run')
    return
  }
  // 运行痕迹：这条只打一次。看不到它 = 插件根本没挂载（例如 inject 未满足而
  // 永久 pending）——「楼层到了却没压缩」的第一分诊点。
  diag('[floor-limiter] mounted: pre-step listener registered')

  ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
    const compaction = ctx.agentPresets.serviceFor(agent, 'compaction')
    // 每次唤醒都记一行：会话、楼层数、阈值、引擎是否取到。
    // 上一次之所以难查，就是因为「达到阈值却没压」时是静默 skip 的。
    // session 用短 ID 标识——「换窗口后到底哪个会话在压」看这一行就能分辨。
    const session = agent.session as { id?: unknown }
    const sessionId = typeof session.id === 'string' ? session.id.slice(-8) : 'unknown'
    let floors = -1
    try { floors = countUserFloors(agent.session) } catch { /* 诊断不能影响主流程 */ }
    const live = resolveConfig(config)
    diag(`[floor-limiter] pre-step: session=${sessionId} floors=${floors} trigger=${live.triggerFloors} keep=${live.keepFloors} compaction=${compaction === undefined ? 'MISSING' : 'ok'}`)
    // 失败会让这个会话进入「放弃期」，所以结果要留痕——不然下次还是只有楼层数可看。
    // 失败还要带上引擎的原始报错：失败点可能在 append('compaction/start') 之前，
    // 那时会话日志里连一个 compaction 事件都不会有，只有这句话能指明是哪道校验拦的。
    // 传 agent（不是 agent.session）：引擎的 compactRegion 要读 `agent.session`。
    const outcome = await maybeCompactSession(agent, live, compaction, signal)
    if (outcome.outcome === 'compacted') {
      diag(`[floor-limiter] compact=compacted session=${sessionId} floors=${floors}`)
    } else if (outcome.outcome === 'failed') {
      diag(`[floor-limiter] compact=failed session=${sessionId} floors=${floors} reason=${outcome.reason.slice(0, 180)}`)
    }
    return next()
  })
}
