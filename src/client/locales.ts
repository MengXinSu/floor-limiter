/** Locale bundles for the floor-limiter settings card (Plugins page, this row). */
import type { SettingsFormLabels } from '@deepseek-ai/dsh-client-ui-primitives'

/** Locale keys the card renders. */
export type FloorLimiterLocaleKey =
  | 'nav' | 'title' | 'description'
  | 'enabled' | 'enabledHint'
  | 'triggerFloors' | 'triggerFloorsHint'
  | 'keepFloors' | 'keepFloorsHint'
  | 'overridden' | 'reset' | 'readOnly' | 'unavailable'
  | 'save' | 'saving' | 'saveFailed' | 'invalidNumber' | 'invalidBoolean'

/** English copy. */
export const en: Record<FloorLimiterLocaleKey, string> = {
  nav: 'Floor limiter',
  title: 'Floor limiter',
  description: 'Compact old history once enough real user floors accumulate, keeping the newest N verbatim.',
  enabled: 'Enabled',
  enabledHint: 'Type true or false. While false the limiter never compacts.',
  triggerFloors: 'Trigger floors',
  triggerFloorsHint: 'Compact once this many real user floors are on the surface.',
  keepFloors: 'Floors kept verbatim',
  keepFloorsHint: 'The newest N floors stay untouched; older ones collapse into one summary.',
  overridden: 'Overridden',
  reset: 'Reset to default',
  readOnly: 'This deployment stores settings read-only.',
  unavailable: 'This plugin is not loaded, so it cannot be configured right now.',
  save: 'Save',
  saving: 'Saving…',
  saveFailed: 'The deployment did not accept these values; they were left for you to correct.',
  invalidNumber: 'Enter a whole number, or leave blank to use the default.',
  invalidBoolean: 'Enter true or false, or leave blank to use the default.',
}

/** Simplified Chinese copy. */
export const zh: Record<FloorLimiterLocaleKey, string> = {
  nav: '楼层限制器',
  title: '楼层限制器',
  description: '真实用户楼层攒够数量后压缩一次旧历史，保留最新的 N 层原文。',
  enabled: '启用',
  enabledHint: '填 true 或 false；false 时不再触发压缩。',
  triggerFloors: '触发楼层数',
  triggerFloorsHint: '真实用户楼层达到这个数量时压缩一次。',
  keepFloors: '保留楼层数',
  keepFloorsHint: '最新的 N 层原文保留，更早的合并成一条摘要。',
  overridden: '已覆盖',
  reset: '恢复默认',
  readOnly: '本部署的设置为只读。',
  unavailable: '该插件当前未加载，暂时无法配置。',
  save: '保存',
  saving: '保存中…',
  saveFailed: '本部署没有接受这些值，已保留供你修改。',
  invalidNumber: '请填整数；留空表示使用默认值。',
  invalidBoolean: '请填 true 或 false；留空表示使用默认值。',
}

/**
 * The form frame's copy, read from this page's dictionary.
 * @param t - the page's locale reader.
 * @returns the labels the shared settings form renders.
 */
export function formLabels(t: (key: FloorLimiterLocaleKey) => string): SettingsFormLabels {
  return { unavailable: t('unavailable'), readOnly: t('readOnly'), saveFailed: t('saveFailed'), save: t('save'), saving: t('saving') }
}
