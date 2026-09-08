/**
 * The `floor-limiter` settings namespace: the durable enable switch plus the
 * two floors thresholds, editable from the Web settings page (Settings →
 * 插件配置 → 楼层限制器). Registered with applies: 'live' so a change takes
 * effect on the next pre-step without a restart; the runtime reads the owner
 * scope's live value on every call.
 */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import type { SettingsScope } from '@deepseek-ai/dsh-settings'
import type { FloorLimiterSettings } from './contract.ts'

/** The namespace name (the Web allowlist must list the same string). */
export const FLOOR_LIMITER_NAMESPACE = 'floor-limiter'

/** Schemastery schema of the `floor-limiter` namespace section. */
export const FloorLimiterSettingsSchema: z<FloorLimiterSettings> = z.object({
  enabled: z.boolean().default(true),
  /** Trigger: compact when this many real user floors are on the surface. */
  triggerFloors: z.number().step(1).min(1).default(20),
  /** Keep verbatim: the newest N floors are left untouched; only older ones are compacted. */
  keepFloors: z.number().step(1).min(0).default(5),
})

/**
 * Register the namespace with the settings provider and return its owner scope.
 * @param ctx - the plugin context carrying the settings provider.
 * @returns the owner scope backing the runtime's live threshold reads.
 */
export function registerFloorLimiterSettings(ctx: Context): SettingsScope<FloorLimiterSettings> {
  return ctx.settings.register(FLOOR_LIMITER_NAMESPACE, FloorLimiterSettingsSchema, {
    applies: 'live',
  })
}
