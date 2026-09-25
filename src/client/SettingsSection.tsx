/** The floor-limiter settings page: the three thresholds of this plugin's own Config. */
// Type-only: the Plugins page's SlotMap merge is not what this page registers, but
// the settings shell's is — the 'settings.section' declaration lives there.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
import { SettingsForm, SettingsValueField } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { formLabels } from './locales.ts'
import type { FloorLimiterSectionFace } from './form-controller.ts'

/** Props the settings shell binds for this page. */
export type FloorLimiterSectionProps =
  PropsRuntime<'settings.section'>
  & PropsLocale<'floor-limiter'>
  & InjectFace<FloorLimiterSectionFace>

/**
 * Render the page: the enable switch and the two floor thresholds.
 * @param props - shell share, locale copy, the form snapshot, and its actions.
 * @returns the settings page element tree.
 */
export function FloorLimiterSection(props: FloorLimiterSectionProps) {
  const { t } = props
  const state = props.useFloorLimiter(snapshot => snapshot)
  const disabled = !state.writable
  return (
    <SettingsForm labels={formLabels(t)} state={state} onSave={props.save} onDiscard={props.discard}>
      <SettingsValueField
        id="floor-limiter-enabled"
        label={t('enabled')}
        hint={t('enabledHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidBoolean')}
        disabled={disabled}
        {...state.enabled}
        onEdit={(text) => { props.edit('enabled', text) }}
        onReset={() => { props.resetField('enabled') }}
      />
      <SettingsValueField
        id="floor-limiter-trigger"
        label={t('triggerFloors')}
        hint={t('triggerFloorsHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={disabled}
        {...state.triggerFloors}
        onEdit={(text) => { props.edit('triggerFloors', text) }}
        onReset={() => { props.resetField('triggerFloors') }}
      />
      <SettingsValueField
        id="floor-limiter-keep"
        label={t('keepFloors')}
        hint={t('keepFloorsHint')}
        overriddenLabel={t('overridden')}
        resetLabel={t('reset')}
        invalidLabel={t('invalidNumber')}
        numeric
        disabled={disabled}
        {...state.keepFloors}
        onEdit={(text) => { props.edit('keepFloors', text) }}
        onReset={() => { props.resetField('keepFloors') }}
      />
    </SettingsForm>
  )
}
