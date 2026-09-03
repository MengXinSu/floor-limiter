/**
 * The floor-limiter wire contract: the settings shape shared by the settings
 * register surface and the runtime. No client half — this plugin is host-only.
 */
/** Durable settings shape of the `floor-limiter` namespace. */
export interface FloorLimiterSettings {
  /** Whether the floor limiting is enabled; false disables compaction entirely. */
  readonly enabled: boolean
  /** Trigger: compact once this many real user floors are on the surface. */
  readonly triggerFloors: number
  /** Keep verbatim: the newest N floors stay untouched; only older ones are compacted. */
  readonly keepFloors: number
}
