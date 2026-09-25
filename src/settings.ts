/**
 * The `floor-limiter` configuration schema: the durable enable switch plus the
 * two floors thresholds, editable from the Web settings page (Settings →
 * 插件配置 → floor-limiter).
 *
 * dsh 0.1.7 dropped the `settings.register` namespace API and the client
 * `settingsScope` service: a Loader entry's own Config schema IS the settings
 * surface now — the settings service projects it into a form, a committed edit
 * rewrites the profile patch and reloads this entry, so `apply` always reads
 * the committed values.
 */
import z from '@deepseek-ai/schemastery'

/** Schemastery schema of the plugin's editable configuration.
 * Every field is `.volatile()`: the settings service only projects volatile
 * fields into the generated form (`volatileForm`), a plain schema shows nothing. */
export const FloorLimiterSettingsSchema = z.object({
  enabled: z.boolean().default(true).volatile(),
  /** Trigger: compact when this many real user floors are on the surface. */
  triggerFloors: z.number().step(1).min(1).default(20).volatile(),
  /** Keep verbatim: the newest N floors are left untouched; only older ones are compacted. */
  keepFloors: z.number().step(1).min(0).default(5).volatile(),
})
