/**
 * floor-limiter client plugin: the browser half. Registers the settings page
 * (设置 → 楼层限制器) bound to the `floor-limiter` namespace and its locale
 * dictionaries. The Host half does the actual compaction; this half only
 * edits the thresholds. A committed change is read live by the runtime at
 * the next pre-step — no restart needed.
 */
// Type-only: the ctx.locale Context merge.
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the ctx.settingsScope Context merge and the scope contract.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { FloorLimiterSettings } from '../contract.ts'
import { FloorLimiterSection, type FloorLimiterSectionInjected } from './SettingsSection.tsx'
import { NS, en, zh } from './locales.ts'
import { adoptStyles } from './styles.ts'

/** Required services: the settings shell, locale, and the settings scope. */
export const inject = ['slots', 'locale', 'settingsScope']

/**
 * Mount the settings page.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  adoptStyles()
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'floor-limiter: dictionaries')

  const scope: SettingsScope<FloorLimiterSettings> =
    ctx.settingsScope.bind<FloorLimiterSettings>({ namespace: 'floor-limiter' })

  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'floor-limiter',
    order: 60,
    label: () => ctx.locale.bind(NS)('nav'),
    locale: NS,
    inject: (): FloorLimiterSectionInjected => ({
      hooks: { scope },
      setEnabled: async (enabled: boolean) => { await scope.set('enabled', enabled) },
      setTriggerFloors: async (value: number) => { await scope.set('triggerFloors', value) },
      setKeepFloors: async (value: number) => { await scope.set('keepFloors', value) },
    }),
  }, FloorLimiterSection))
}
