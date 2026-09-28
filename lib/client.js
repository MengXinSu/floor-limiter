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
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

// src/client/locales.ts
var en = {
  nav: "Floor limiter",
  title: "Floor limiter",
  description: "Compact old history once enough real user floors accumulate, keeping the newest N verbatim.",
  enabled: "Enabled",
  enabledHint: "Type true or false. While false the limiter never compacts.",
  triggerFloors: "Trigger floors",
  triggerFloorsHint: "Compact once this many real user floors are on the surface.",
  keepFloors: "Floors kept verbatim",
  keepFloorsHint: "The newest N floors stay untouched; older ones collapse into one summary.",
  overridden: "Overridden",
  reset: "Reset to default",
  readOnly: "This deployment stores settings read-only.",
  unavailable: "This plugin is not loaded, so it cannot be configured right now.",
  save: "Save",
  saving: "Saving\u2026",
  saveFailed: "The deployment did not accept these values; they were left for you to correct.",
  invalidNumber: "Enter a whole number, or leave blank to use the default.",
  invalidBoolean: "Enter true or false, or leave blank to use the default."
};
var zh = {
  nav: "\u697C\u5C42\u9650\u5236\u5668",
  title: "\u697C\u5C42\u9650\u5236\u5668",
  description: "\u771F\u5B9E\u7528\u6237\u697C\u5C42\u6512\u591F\u6570\u91CF\u540E\u538B\u7F29\u4E00\u6B21\u65E7\u5386\u53F2\uFF0C\u4FDD\u7559\u6700\u65B0\u7684 N \u5C42\u539F\u6587\u3002",
  enabled: "\u542F\u7528",
  enabledHint: "\u586B true \u6216 false\uFF1Bfalse \u65F6\u4E0D\u518D\u89E6\u53D1\u538B\u7F29\u3002",
  triggerFloors: "\u89E6\u53D1\u697C\u5C42\u6570",
  triggerFloorsHint: "\u771F\u5B9E\u7528\u6237\u697C\u5C42\u8FBE\u5230\u8FD9\u4E2A\u6570\u91CF\u65F6\u538B\u7F29\u4E00\u6B21\u3002",
  keepFloors: "\u4FDD\u7559\u697C\u5C42\u6570",
  keepFloorsHint: "\u6700\u65B0\u7684 N \u5C42\u539F\u6587\u4FDD\u7559\uFF0C\u66F4\u65E9\u7684\u5408\u5E76\u6210\u4E00\u6761\u6458\u8981\u3002",
  overridden: "\u5DF2\u8986\u76D6",
  reset: "\u6062\u590D\u9ED8\u8BA4",
  readOnly: "\u672C\u90E8\u7F72\u7684\u8BBE\u7F6E\u4E3A\u53EA\u8BFB\u3002",
  unavailable: "\u8BE5\u63D2\u4EF6\u5F53\u524D\u672A\u52A0\u8F7D\uFF0C\u6682\u65F6\u65E0\u6CD5\u914D\u7F6E\u3002",
  save: "\u4FDD\u5B58",
  saving: "\u4FDD\u5B58\u4E2D\u2026",
  saveFailed: "\u672C\u90E8\u7F72\u6CA1\u6709\u63A5\u53D7\u8FD9\u4E9B\u503C\uFF0C\u5DF2\u4FDD\u7559\u4F9B\u4F60\u4FEE\u6539\u3002",
  invalidNumber: "\u8BF7\u586B\u6574\u6570\uFF1B\u7559\u7A7A\u8868\u793A\u4F7F\u7528\u9ED8\u8BA4\u503C\u3002",
  invalidBoolean: "\u8BF7\u586B true \u6216 false\uFF1B\u7559\u7A7A\u8868\u793A\u4F7F\u7528\u9ED8\u8BA4\u503C\u3002"
};
function formLabels(t) {
  return { unavailable: t("unavailable"), readOnly: t("readOnly"), saveFailed: t("saveFailed"), save: t("save"), saving: t("saving") };
}

// src/client/SettingsSection.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function FloorLimiterSection(props) {
  const { t } = props;
  const state = props.useFloorLimiter((snapshot) => snapshot);
  const disabled = !state.writable;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_dsh_client_ui_primitives.SettingsForm, { labels: formLabels(t), state, onSave: props.save, onDiscard: props.discard, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.SettingsValueField,
      {
        id: "floor-limiter-enabled",
        label: t("enabled"),
        hint: t("enabledHint"),
        overriddenLabel: t("overridden"),
        resetLabel: t("reset"),
        invalidLabel: t("invalidBoolean"),
        disabled,
        ...state.enabled,
        onEdit: (text) => {
          props.edit("enabled", text);
        },
        onReset: () => {
          props.resetField("enabled");
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.SettingsValueField,
      {
        id: "floor-limiter-trigger",
        label: t("triggerFloors"),
        hint: t("triggerFloorsHint"),
        overriddenLabel: t("overridden"),
        resetLabel: t("reset"),
        invalidLabel: t("invalidNumber"),
        numeric: true,
        disabled,
        ...state.triggerFloors,
        onEdit: (text) => {
          props.edit("triggerFloors", text);
        },
        onReset: () => {
          props.resetField("triggerFloors");
        }
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      import_dsh_client_ui_primitives.SettingsValueField,
      {
        id: "floor-limiter-keep",
        label: t("keepFloors"),
        hint: t("keepFloorsHint"),
        overriddenLabel: t("overridden"),
        resetLabel: t("reset"),
        invalidLabel: t("invalidNumber"),
        numeric: true,
        disabled,
        ...state.keepFloors,
        onEdit: (text) => {
          props.edit("keepFloors", text);
        },
        onReset: () => {
          props.resetField("keepFloors");
        }
      }
    )
  ] });
}

// src/client/form-controller.ts
var import_dsh_client_ui_primitives2 = require("@deepseek-ai/dsh-client-ui-primitives");
var NS = "floor-limiter";
function settingsBooleanField(field) {
  return {
    field,
    format: (value) => typeof value === "boolean" ? String(value) : "",
    parse: (text) => {
      const trimmed = text.trim().toLowerCase();
      if (trimmed === "") return { kind: "clear" };
      if (trimmed === "true") return { kind: "set", value: true };
      if (trimmed === "false") return { kind: "set", value: false };
      return void 0;
    }
  };
}
var FloorLimiterFormController = class {
  form;
  store;
  /** @param scope - the shared configuration form of the floor-limiter entry. */
  constructor(scope) {
    this.form = new import_dsh_client_ui_primitives2.SettingsFormModel(scope, [
      settingsBooleanField("enabled"),
      (0, import_dsh_client_ui_primitives2.settingsNumberField)("triggerFloors"),
      (0, import_dsh_client_ui_primitives2.settingsNumberField)("keepFloors")
    ]);
    this.store = this.form.bind(() => this.projection());
  }
  projection() {
    return {
      ...this.form.shell(),
      enabled: this.form.field("enabled"),
      triggerFloors: this.form.field("triggerFloors"),
      keepFloors: this.form.field("keepFloors")
    };
  }
  /**
   * Build the face the section's slot registration injects.
   * @returns the page's snapshot and its form actions.
   */
  inject() {
    return { hooks: { floorLimiter: this.store }, ...this.form.actions() };
  }
  /** Release the form subscription. */
  dispose() {
    this.form.dispose();
  }
};

// src/client/index.ts
var inject = ["slots", "locale", "configForms"];
function apply(ctx) {
  const t = ctx.locale.bind(NS);
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "floor-limiter: dictionaries");
  const controller = new FloorLimiterFormController(ctx.configForms.get(NS));
  ctx.effect(() => () => {
    controller.dispose();
  }, "floor-limiter: form subscription");
  ctx.slots.inject("settings.section", () => ctx.slots.register({
    name: "settings.section",
    id: NS,
    order: 60,
    label: () => t("nav"),
    locale: NS,
    inject: () => controller.inject()
  }, FloorLimiterSection));
}
return module.exports; } });
