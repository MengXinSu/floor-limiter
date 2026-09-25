/**
 * floor-limiter client half: the 设置 → 楼层限制器 page.
 *
 * dsh 0.1.7 dropped the client `settingsScope` service this half used before;
 * the entry's own Config schema (see `../settings.ts`) IS the settings surface
 * now, read and written through the shared `configForms` service. The page
 * registers into `settings.section` — the same seat the official settings pages
 * take — and edits the namespace the Host serves for this entry. A committed
 * save rewrites the profile patch and reloads the entry, so the Host half reads
 * the new values without a restart.
 */
// Type-only: the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the ctx.configForms Context merge and the 'settings.section' declaration.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { FloorLimiterSection } from './SettingsSection.tsx'
import { FloorLimiterFormController, NS } from './form-controller.ts'
import { en, zh, type FloorLimiterLocaleKey } from './locales.ts'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Floor-limiter page copy. */
    'floor-limiter': FloorLimiterLocaleKey
  }
}

/** Required services (cordis fiber inject). */
export const inject = ['slots', 'locale', 'configForms']

/**
 * Mount the settings page.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  const t = ctx.locale.bind(NS)
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'floor-limiter: dictionaries')
  const controller = new FloorLimiterFormController(ctx.configForms.get(NS))
  ctx.effect(() => () => { controller.dispose() }, 'floor-limiter: form subscription')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: NS,
    order: 60,
    label: () => t('nav'),
    locale: NS,
    inject: () => controller.inject(),
  }, FloorLimiterSection))
}
