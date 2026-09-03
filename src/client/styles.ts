/**
 * The floor-limiter settings stylesheet, hand-written as a template string
 * and injected once by the plugin body: the web server serves exactly one
 * file per client plugin, so no separate CSS artifact may exist. Tokens come
 * only from the shared `--dsw-alias-*` design platform (no literal colors);
 * class names carry the `dsh_floorLimiter` prefix to stay unique in the
 * assembled shell.
 */

/** Stable `<style>` element id (idempotent injection across HMR re-runs). */
export const STYLE_ID = 'dsh-floor-limiter-style'

/** The settings stylesheet text. */
export const cssText = `
.dsh_floorLimiter_section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  max-width: 560px;
}
.dsh_floorLimiter_title {
  margin: 0;
  color: var(--dsw-alias-label-primary);
  font-size: 18px;
  line-height: 26px;
  font-weight: 600;
}
.dsh_floorLimiter_subtitle {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsh_floorLimiter_card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsh_floorLimiter_card--toggle {
  flex-direction: row;
  align-items: flex-start;
}
.dsh_floorLimiter_checkbox {
  flex: none;
  width: 18px;
  height: 18px;
  margin: 2px 0 0;
  accent-color: var(--dsw-alias-brand-primary);
  cursor: pointer;
}
.dsh_floorLimiter_cardText {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.dsh_floorLimiter_cardTitle {
  color: var(--dsw-alias-label-primary);
  font-size: 14px;
  line-height: 22px;
}
.dsh_floorLimiter_cardDesc {
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsh_floorLimiter_numberRow {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dsh_floorLimiter_numberInput {
  flex: none;
  width: 96px;
  height: 32px;
  padding: 0 10px;
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2);
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  line-height: 18px;
}
.dsh_floorLimiter_numberInput:focus {
  outline: 2px solid var(--dsw-alias-brand-primary);
  outline-offset: -1px;
}
.dsh_floorLimiter_numberInput::-webkit-inner-spin-button {
  margin-left: 2px;
}
`

/**
 * Inject the settings stylesheet once (stable id; HMR-safe).
 */
export function adoptStyles(): void {
  if (document.getElementById(STYLE_ID) !== null) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = cssText
  document.head.appendChild(style)
}
