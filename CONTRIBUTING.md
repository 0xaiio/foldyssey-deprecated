# 贡献指南（CONTRIBUTING）

## 开始之前

1. 读 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) 与 [`docs/GEOMETRY_SPEC.md`](docs/GEOMETRY_SPEC.md)。
2. 读 [`TASKS.md`](TASKS.md)，确认你要做的事没有被标为"受阻"。
3. `npm install && npm run dev`，确认本地能跑。

## 代码规范

- **几何纯函数**：`src/geometry/**` 不 import React、不碰 DOM、不读 localStorage。
- **不改可信源**：不要让渲染层缓存或改写"最终纸形"；一切从 `Patch[]` 派生。
- **类型优先**：外部输入先校验；核心结构不用 `any`/`unknown` 占位。
- **提交前**：`npx tsc --noEmit && npm test && npm run build` 三件套必须通过。

## 测试要求

- 修 Bug：先加一个会失败的回归测试，再修。
- 改几何：必须更新 `docs/GEOMETRY_SPEC.md` 与 `src/tests/geometry.test.ts`。
- 加关卡：必须提供 `canonicalCut`，并在 `src/tests/levels.test.ts` 中证明它能通关。

## 文档同步清单

- [ ] 需求变化 → `docs/REQUIREMENTS.md`
- [ ] 架构/数据格式变化 → `docs/ARCHITECTURE.md`
- [ ] 几何语义变化 → `docs/GEOMETRY_SPEC.md`
- [ ] 用户可见变化 → `CHANGELOG.md` + `README.md`
- [ ] 任务状态 → `TASKS.md`
- [ ] 测试执行 → `TEST_REPORT.md`

## 提交信息

Conventional Commits，见 [`docs/GITHUB_WORKFLOW.md`](docs/GITHUB_WORKFLOW.md)。

## 不要做

- 不要提交 `node_modules/`、`dist/`、`.env*`、真实密钥、含个人信息的录屏原件。
- 不要为了"看起来完成"而保留未实现的入口。
- 不要用 AI 生成的示意图冒充真实运行截图。
