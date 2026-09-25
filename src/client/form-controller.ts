/** The floor-limiter form: the plugin's own Config fields, staged on the settings page. */
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import {
  SettingsFormModel, settingsNumberField,
  type SettingsFieldSpec, type SettingsFieldState, type SettingsFormActions,
  type SettingsFormScope, type SettingsFormShell,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type { FloorLimiterSettings } from '../contract.ts'

/** The Loader entry id: the settings namespace the Host serves and the page this section edits. */
export const NS = 'floor-limiter'

/**
 * A boolean field. The shared field specs cover numbers and free text only, so a
 * switch-shaped value is edited as its `true`/`false` spelling; an empty draft
 * clears the field back to the schema default.
 * @param field - field name inside the namespace section.
 * @returns the field's conversion spec.
 */
export function settingsBooleanField(field: string): SettingsFieldSpec {
  return {
    field,
    format: value => typeof value === 'boolean' ? String(value) : '',
    parse: (text) => {
      const trimmed = text.trim().toLowerCase()
      if (trimmed === '') return { kind: 'clear' }
      if (trimmed === 'true') return { kind: 'set', value: true }
      if (trimmed === 'false') return { kind: 'set', value: false }
      return undefined
    },
  }
}

/** What the floor-limiter settings page renders. */
export interface FloorLimiterSectionState extends SettingsFormShell {
  /** Whether the limiter runs at all. */
  enabled: SettingsFieldState
  /** Real user floors that trigger one compaction. */
  triggerFloors: SettingsFieldState
  /** Newest floors kept verbatim. */
  keepFloors: SettingsFieldState
}

/** The registration-side face the section's slot entry injects. */
export interface FloorLimiterSectionFace extends SettingsFormActions {
  hooks: {
    /** Page snapshot bound by the renderer as useFloorLimiter. */
    floorLimiter: SnapshotStore<FloorLimiterSectionState>
  }
}

/** Bridges the floor-limiter entry's shared form onto the page's staged form. */
export class FloorLimiterFormController {
  private readonly form: SettingsFormModel<FloorLimiterSettings>
  private readonly store: SnapshotStore<FloorLimiterSectionState>

  /** @param scope - the shared configuration form of the floor-limiter entry. */
  constructor(scope: SettingsFormScope<FloorLimiterSettings>) {
    this.form = new SettingsFormModel(scope, [
      settingsBooleanField('enabled'),
      settingsNumberField('triggerFloors'),
      settingsNumberField('keepFloors'),
    ])
    this.store = this.form.bind(() => this.projection())
  }

  private projection(): FloorLimiterSectionState {
    return {
      ...this.form.shell(),
      enabled: this.form.field('enabled'),
      triggerFloors: this.form.field('triggerFloors'),
      keepFloors: this.form.field('keepFloors'),
    }
  }

  /**
   * Build the face the section's slot registration injects.
   * @returns the page's snapshot and its form actions.
   */
  inject(): FloorLimiterSectionFace {
    return { hooks: { floorLimiter: this.store }, ...this.form.actions() }
  }

  /** Release the form subscription. */
  dispose(): void { this.form.dispose() }
}
