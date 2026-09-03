# floor-limiter

楼层限制器：给 DeepSeek Harness 的会话加一层「楼层滚动 + 摘要压缩」。

- **M（触发层数，默认 20）**：模型表面攒够 M 个真实用户楼层（一次用户提问 + 它引发的全部回复/工具调用 = 1 层）时触发一次压缩。
- **N（保留层数，默认 5）**：触发时保留最近 N 层原文，只把更早的历史压成一条摘要。
- 设置路径：设置 → 楼层限制器（左侧独立入口）；`enabled` / `triggerFloors` / `keepFloors` 全部**在线生效**，改完下一轮 pre-step 就用新值，无需重启。

## 安装

作为本地 vendor 插件挂到 DSH 的 profile（以 `web` profile 为例）：

1. 把本目录复制到 `<DSH_HOME>\profiles\web\vendor\floor-limiter\`。
2. 在 `<DSH_HOME>\profiles\web\package.json` 里（**两处都要**，只加 dependencies 不会加载）：
   - `dependencies`：`"floor-limiter": "file:./vendor/floor-limiter"`
   - `dsh.profile.bundles`：`"floor-limiter"`
3. 在 **profile 根**（不是 vendor 子目录）跑 `pnpm install`，然后重启 DSH。

> 插件依赖运行时提供的 `@deepseek-ai/dsh-*` 服务（settings / agents / agentPresets / compaction），不需要 `npm install` 额外依赖即可运行；`devDependencies` 只用于开发构建与自检。

## 机制

监听 `agent/pre-step`（每次用户提问进入、助手回复开始前的边界），此时上一轮已完整落盘：

1. 数楼层：表面 `user/message` 中 `source.kind === 'user'` 的数量（摘要替换节点是 plugin source，不算层，不会自我触发）。
2. 楼层数 ≥ M → 选区间：保留最近 N 层，压缩 `[表面头, 第 N 层之前的边界]`。
3. 调 `ctx.compaction.compactRegion(start, end, agent, signal)` 压成摘要。
4. 任何失败（边界不平衡、已有压缩中、摘要不小于原文、取消）→ 吞掉、跳过本轮，下轮再试，绝不打断对话。

## 与官方压缩的关系

**不是两套独立压缩，是同一个压缩引擎（`ctx.compaction`）的两个触发者**：

- 官方触发者：上下文 token 压力 → `compactIfNeeded` 调 `compactRegion`（保留尾部 + 压更早）。
- 楼层限制器：楼层数 → 调同一个 `compactRegion`（保留最近 N 层 + 压更早）。

共享压缩引擎与锁（`compaction/start` 标记）：同时触发时先到先得，后到者跳过本轮，不会双重压缩。`enabled` 开关只关闭楼层触发，官方压力压缩不受影响。

## 结构

```
├── src\                  # TypeScript 源码
│   ├── index.ts          # host 入口：agent/pre-step 监听 + compaction seam
│   ├── limiter.ts        # 楼层计数 / 区间选择 / 压缩执行
│   ├── settings.ts       # 设置 schema（enabled / triggerFloors / keepFloors）
│   ├── contract.ts       # wire contract
│   └── client\           # 设置页 UI（浏览器半件）
├── lib\                  # esbuild 构建产物（index.js host / client.js browser）
├── tests\selftest.ts     # 核心逻辑自检（无框架，node:assert）
├── build.mjs             # esbuild 构建脚本
├── cordis.patch.yml      # Loader 注册声明
└── dsh.plugin.json       # 插件元数据
```

## 开发

```bash
npm install        # devDependencies: esbuild / tsx / typescript
node build.mjs     # esbuild 构建 host (lib/index.js) + client (lib/client.js)
npm test           # 核心逻辑自检（node --import tsx tests/selftest.ts）
```

- 构建产物语义：host 半件做压缩，client 半件只提供设置页。
- 从 profile 根跑自检时，依赖从 profile 的 hoisted node_modules 解析；仓库内 `npm test` 则用仓库自己的 tsx。
- 客户端 bundle 更新后浏览器需要**硬刷新**（旧 client.js 有缓存）。

## License

[MIT](LICENSE) © 2026 MengXinSu
