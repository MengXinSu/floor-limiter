/**
 * floor-limiter host plugin: counts real user floors (user turns) on each
 * agent's session surface and, once they reach the configured trigger, runs
 * one compaction that keeps the newest N floors verbatim and collapses the
 * rest into a single summary. All thresholds are live-editable from the Web
 * settings page (Settings → 插件配置 → 楼层限制器) — a change applies at the
 * next pre-step without a restart.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-compaction'
import type {} from '@deepseek-ai/dsh-agent-presets'
import { registerFloorLimiterSettings } from './settings.ts'
import { maybeCompactSession } from './limiter.ts'

/** Cordis plugin name (the Loader entry id). */
export const name = 'floor-limiter'

/**
 * Services required before load: settings (own namespace), agents (lifecycle),
 * and agentPresets (per-agent realm lookup for the compaction seam).
 */
export const inject = ['settings', 'agents', 'agentPresets']

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
 * addressing for isolate-realm services; dsh-agent-presets is host-plane).
 * Any compaction failure is swallowed inside `maybeCompactSession` and the
 * turn continues with the full history until the next pre-step.
 * @param ctx - host cordis context.
 */
export function apply(ctx: Context): void {
  const settings = registerFloorLimiterSettings(ctx)
  const current = () => settings.get()

  ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
    const compaction = ctx.agentPresets.serviceFor(agent, 'compaction')
    await maybeCompactSession(ctx, agent, current(), signal, compaction)
    return next()
  })
}
