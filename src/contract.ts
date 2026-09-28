/**
 * The floor-limiter wire contract: the settings shape shared by the settings
 * register surface and the runtime.
 *
 * At runtime the loader hands `apply` the volatile CONFIG REFS, not plain
 * values: every `.volatile()` field arrives as `{ get() }` (dsh 0.1.7 config
 * references). Comparing or doing arithmetic on such a ref directly silently
 * yields `[object Object]` — which is exactly the bug that kept this plugin from
 * ever compacting (24 floors, threshold `[object Object]`, `24 < ref` is always
 * false, so the limiter never fired).
 */
/** A volatile config reference: read the current snapshot through `get()`. */
export interface ConfigRef<T> {
  get(): T
}

/** What `apply` receives: one volatile reference per schema field. */
export interface FloorLimiterConfig {
  /** Whether the floor limiting is enabled; false disables compaction entirely. */
  readonly enabled: ConfigRef<boolean>
  /** Trigger: compact once this many real user floors are on the surface. */
  readonly triggerFloors: ConfigRef<number>
  /** Keep verbatim: the newest N floors stay untouched; only older ones are compacted. */
  readonly keepFloors: ConfigRef<number>
}

/** The RESOLVED settings the limiter works with (plain values, re-read per wake). */
export interface FloorLimiterSettings {
  /** Whether the floor limiting is enabled; false disables compaction entirely. */
  readonly enabled: boolean
  /** Trigger: compact once this many real user floors are on the surface. */
  readonly triggerFloors: number
  /** Keep verbatim: the newest N floors stay untouched; only older ones are compacted. */
  readonly keepFloors: number
}
