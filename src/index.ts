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
import type { Context } from '@deepseek-ai/cordis'
// Type-only: the ctx.agentPresets Context merge. From dsh 0.1.7 on the release
// that owns the service is @deepseek-ai/dsh-agent-preset-registry — the old
// @deepseek-ai/dsh-agent-presets package no longer ships (its last npm tag is
// 0.1.5-rc.3), though the service name 'agentPresets' is unchanged.
import type {} from '@deepseek-ai/dsh-agent-preset-registry'
import type {} from '@deepseek-ai/dsh-compaction'
import type { FloorLimiterSettings } from './contract.ts'
import { maybeCompactSession } from './limiter.ts'
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
export function apply(ctx: Context, config: FloorLimiterSettings): void {
  if (!config.enabled) return

  ctx.on('agent/pre-step', async ({ agent, signal }, next) => {
    const compaction = ctx.agentPresets.serviceFor(agent, 'compaction')
    await maybeCompactSession(ctx, agent, config, signal, compaction)
    return next()
  })
}
