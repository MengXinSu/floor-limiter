/**
 * `floor-limiter` locale namespace: settings-page copy.
 * Chinese is the product copy; English mirrors it.
 */

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'nav': '楼层限制器',
  'settings.title': '楼层限制器',
  'settings.subtitle': '楼层数攒到触发层数时，把更早的历史压成摘要，保留最近这几层原文。',
  'settings.enabled': '启用楼层压缩',
  'settings.enabledDesc': '关闭后本插件不再生效。',
  'settings.triggerFloors': '触发层数（M）',
  'settings.triggerFloorsDesc': '模型表面攒够多少层真实用户提问时触发一次压缩。',
  'settings.keepFloors': '保留层数（N）',
  'settings.keepFloorsDesc': '压缩时保留最近 N 层原文不压，只把更早的压成摘要。设为 0 表示全部压缩。',
} satisfies Record<string, string>

/** The `floor-limiter` namespace key union. */
export type FloorLimiterKey = keyof typeof zh

/** English dictionary, checked complete against the zh key set. */
export const en = {
  'nav': 'Floor limiter',
  'settings.title': 'Floor limiter',
  'settings.subtitle': 'When the floor count reaches the trigger, older history is collapsed into a summary while the newest N floors stay verbatim.',
  'settings.enabled': 'Enable floor compaction',
  'settings.enabledDesc': 'Turning this off disables this plugin.',
  'settings.triggerFloors': 'Trigger floors (M)',
  'settings.triggerFloorsDesc': 'Compact once this many real user floors are on the surface.',
  'settings.keepFloors': 'Keep floors (N)',
  'settings.keepFloorsDesc': 'Keep the newest N floors verbatim when compacting; only older history is collapsed. 0 compacts everything.',
} satisfies Record<FloorLimiterKey, string>

/** Locale namespace id registered under ctx.locale. */
export const NS = 'floor-limiter'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The floor-limiter settings copy. */
    [NS]: FloorLimiterKey
  }
}
