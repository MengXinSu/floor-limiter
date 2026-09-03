window.__ModuleLoader__.load({ id: 'floor-limiter', factory: (require) => { var module = { exports: {} }; var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/SettingsSection.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
function FloorLimiterSection({ useScope, setEnabled, setTriggerFloors, setKeepFloors, t }) {
  const settings = useScope((snapshot) => snapshot.value);
  const enabled = settings?.enabled ?? true;
  const trigger = settings?.triggerFloors ?? 20;
  const keep = settings?.keepFloors ?? 5;
  const [triggerDraft, setTriggerDraft] = (0, import_react.useState)(null);
  const [keepDraft, setKeepDraft] = (0, import_react.useState)(null);
  const commit = (raw, fallback, write, clear) => {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) {
      clear();
      return;
    }
    void write(Math.trunc(n));
    clear();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "dsh_floorLimiter_section", "aria-labelledby": "floor-limiter-settings-title", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { id: "floor-limiter-settings-title", className: "dsh_floorLimiter_title", children: t("settings.title") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "dsh_floorLimiter_subtitle", children: t("settings.subtitle") }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_floorLimiter_card dsh_floorLimiter_card--toggle", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "checkbox",
          className: "dsh_floorLimiter_checkbox",
          checked: enabled,
          onChange: (event) => {
            void setEnabled(event.target.checked);
          }
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "dsh_floorLimiter_cardText", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_floorLimiter_cardTitle", children: t("settings.enabled") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_floorLimiter_cardDesc", children: t("settings.enabledDesc") })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_floorLimiter_card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_floorLimiter_numberRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_floorLimiter_cardText", style: { flex: 1 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_floorLimiter_cardTitle", children: t("settings.triggerFloors") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_floorLimiter_cardDesc", children: t("settings.triggerFloorsDesc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "number",
          className: "dsh_floorLimiter_numberInput",
          min: 1,
          step: 1,
          value: triggerDraft ?? trigger,
          onChange: (event) => {
            setTriggerDraft(event.target.value);
          },
          onBlur: (event) => {
            commit(event.target.value, trigger, setTriggerFloors, () => setTriggerDraft(null));
          },
          onKeyDown: (event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }
        }
      )
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "dsh_floorLimiter_card", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "dsh_floorLimiter_numberRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { className: "dsh_floorLimiter_cardText", style: { flex: 1 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_floorLimiter_cardTitle", children: t("settings.keepFloors") }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "dsh_floorLimiter_cardDesc", children: t("settings.keepFloorsDesc") })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
        "input",
        {
          type: "number",
          className: "dsh_floorLimiter_numberInput",
          min: 0,
          step: 1,
          value: keepDraft ?? keep,
          onChange: (event) => {
            setKeepDraft(event.target.value);
          },
          onBlur: (event) => {
            commit(event.target.value, keep, setKeepFloors, () => setKeepDraft(null));
          },
          onKeyDown: (event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }
        }
      )
    ] }) })
  ] });
}

// src/client/locales.ts
var zh = {
  "nav": "\u697C\u5C42\u9650\u5236\u5668",
  "settings.title": "\u697C\u5C42\u9650\u5236\u5668",
  "settings.subtitle": "\u697C\u5C42\u6570\u6512\u5230\u89E6\u53D1\u5C42\u6570\u65F6\uFF0C\u628A\u66F4\u65E9\u7684\u5386\u53F2\u538B\u6210\u6458\u8981\uFF0C\u4FDD\u7559\u6700\u8FD1\u8FD9\u51E0\u5C42\u539F\u6587\u3002",
  "settings.enabled": "\u542F\u7528\u697C\u5C42\u538B\u7F29",
  "settings.enabledDesc": "\u5173\u95ED\u540E\u672C\u63D2\u4EF6\u4E0D\u518D\u751F\u6548\u3002",
  "settings.triggerFloors": "\u89E6\u53D1\u5C42\u6570\uFF08M\uFF09",
  "settings.triggerFloorsDesc": "\u6A21\u578B\u8868\u9762\u6512\u591F\u591A\u5C11\u5C42\u771F\u5B9E\u7528\u6237\u63D0\u95EE\u65F6\u89E6\u53D1\u4E00\u6B21\u538B\u7F29\u3002",
  "settings.keepFloors": "\u4FDD\u7559\u5C42\u6570\uFF08N\uFF09",
  "settings.keepFloorsDesc": "\u538B\u7F29\u65F6\u4FDD\u7559\u6700\u8FD1 N \u5C42\u539F\u6587\u4E0D\u538B\uFF0C\u53EA\u628A\u66F4\u65E9\u7684\u538B\u6210\u6458\u8981\u3002\u8BBE\u4E3A 0 \u8868\u793A\u5168\u90E8\u538B\u7F29\u3002"
};
var en = {
  "nav": "Floor limiter",
  "settings.title": "Floor limiter",
  "settings.subtitle": "When the floor count reaches the trigger, older history is collapsed into a summary while the newest N floors stay verbatim.",
  "settings.enabled": "Enable floor compaction",
  "settings.enabledDesc": "Turning this off disables this plugin.",
  "settings.triggerFloors": "Trigger floors (M)",
  "settings.triggerFloorsDesc": "Compact once this many real user floors are on the surface.",
  "settings.keepFloors": "Keep floors (N)",
  "settings.keepFloorsDesc": "Keep the newest N floors verbatim when compacting; only older history is collapsed. 0 compacts everything."
};
var NS = "floor-limiter";

// src/client/styles.ts
var STYLE_ID = "dsh-floor-limiter-style";
var cssText = `
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
`;
function adoptStyles() {
  if (document.getElementById(STYLE_ID) !== null) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = cssText;
  document.head.appendChild(style);
}

// src/client/index.ts
var inject = ["slots", "locale", "settingsScope"];
function apply(ctx) {
  adoptStyles();
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "floor-limiter: dictionaries");
  const scope = ctx.settingsScope.bind({ namespace: "floor-limiter" });
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: "floor-limiter",
    order: 60,
    label: () => ctx.locale.bind(NS)("nav"),
    locale: NS,
    inject: () => ({
      hooks: { scope },
      setEnabled: async (enabled) => {
        await scope.set("enabled", enabled);
      },
      setTriggerFloors: async (value) => {
        await scope.set("triggerFloors", value);
      },
      setKeepFloors: async (value) => {
        await scope.set("keepFloors", value);
      }
    })
  }, FloorLimiterSection));
}
return module.exports; } });
//# sourceMappingURL=client.js.map
