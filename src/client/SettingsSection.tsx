/**
 * The settings section for the `floor-limiter` namespace: an enable switch
 * plus two number inputs (trigger floors M, keep floors N), each in its own
 * card. Number edits are staged locally and committed on blur/Enter — one
 * durable write per committed value; the runtime already reads the scope
 * live, so a change applies at the next pre-step without a restart. Product
 * copy rides the `floor-limiter` locale namespace.
 */
import { useState } from 'react'
import type { PropsLocale, PropsRuntime, InjectFace } from '@deepseek-ai/dsh-client-ui-slots'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'
import type { FloorLimiterSettings } from '../contract.ts'

/** Injected business face: the live scope and the three write verbs. */
export interface FloorLimiterSectionInjected {
  hooks: { scope: SettingsScope<FloorLimiterSettings> }
  setEnabled: (enabled: boolean) => Promise<void>
  setTriggerFloors: (value: number) => Promise<void>
  setKeepFloors: (value: number) => Promise<void>
}

/** Full section props: runtime share + injected face + the locale seat. */
export type FloorLimiterSectionProps =
  PropsRuntime<'settings.section'>
  & InjectFace<FloorLimiterSectionInjected>
  & PropsLocale<'floor-limiter'>

/**
 * Render the section: one enable card plus two threshold cards.
 * @param props - runtime share, the bound scope hook, the write verbs, and `t`.
 * @returns the section element tree.
 */
export function FloorLimiterSection({ useScope, setEnabled, setTriggerFloors, setKeepFloors, t }: FloorLimiterSectionProps) {
  const settings = useScope(snapshot => snapshot.value)
  const enabled = settings?.enabled ?? true
  const trigger = settings?.triggerFloors ?? 20
  const keep = settings?.keepFloors ?? 5

  // Staged drafts: the input shows the draft while its owner is being edited
  // and re-syncs to the scope value once a commit (or a rejected edit, which
  // leaves the snapshot unchanged) leaves the field.
  const [triggerDraft, setTriggerDraft] = useState<string | null>(null)
  const [keepDraft, setKeepDraft] = useState<string | null>(null)

  /** Commit one staged draft as a finite integer; an unparseable draft resets the field. */
  const commit = (raw: string, fallback: number, write: (value: number) => Promise<void>, clear: () => void): void => {
    const n = Number(raw)
    if (raw.trim() === '' || !Number.isFinite(n)) {
      clear()
      return
    }
    void write(Math.trunc(n))
    clear()
  }

  return (
    <section className="dsh_floorLimiter_section" aria-labelledby="floor-limiter-settings-title">
      <h2 id="floor-limiter-settings-title" className="dsh_floorLimiter_title">{t('settings.title')}</h2>
      <p className="dsh_floorLimiter_subtitle">{t('settings.subtitle')}</p>

      <label className="dsh_floorLimiter_card dsh_floorLimiter_card--toggle">
        <input
          type="checkbox"
          className="dsh_floorLimiter_checkbox"
          checked={enabled}
          onChange={(event) => { void setEnabled(event.target.checked) }}
        />
        <span className="dsh_floorLimiter_cardText">
          <span className="dsh_floorLimiter_cardTitle">{t('settings.enabled')}</span>
          <span className="dsh_floorLimiter_cardDesc">{t('settings.enabledDesc')}</span>
        </span>
      </label>

      <div className="dsh_floorLimiter_card">
        <div className="dsh_floorLimiter_numberRow">
          <label className="dsh_floorLimiter_cardText" style={{ flex: 1 }}>
            <span className="dsh_floorLimiter_cardTitle">{t('settings.triggerFloors')}</span>
            <span className="dsh_floorLimiter_cardDesc">{t('settings.triggerFloorsDesc')}</span>
          </label>
          <input
            type="number"
            className="dsh_floorLimiter_numberInput"
            min={1}
            step={1}
            value={triggerDraft ?? trigger}
            onChange={(event) => { setTriggerDraft(event.target.value) }}
            onBlur={(event) => { commit(event.target.value, trigger, setTriggerFloors, () => setTriggerDraft(null)) }}
            onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
          />
        </div>
      </div>

      <div className="dsh_floorLimiter_card">
        <div className="dsh_floorLimiter_numberRow">
          <label className="dsh_floorLimiter_cardText" style={{ flex: 1 }}>
            <span className="dsh_floorLimiter_cardTitle">{t('settings.keepFloors')}</span>
            <span className="dsh_floorLimiter_cardDesc">{t('settings.keepFloorsDesc')}</span>
          </label>
          <input
            type="number"
            className="dsh_floorLimiter_numberInput"
            min={0}
            step={1}
            value={keepDraft ?? keep}
            onChange={(event) => { setKeepDraft(event.target.value) }}
            onBlur={(event) => { commit(event.target.value, keep, setKeepFloors, () => setKeepDraft(null)) }}
            onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
          />
        </div>
      </div>
    </section>
  )
}
