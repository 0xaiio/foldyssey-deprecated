# 文档索引（INDEX）

> 读者：开发者（自己/未来的你）、评审、以及"下一次接着干的模型"。
> 维护约定：**代码变更 → 改文档 → 改 CHANGELOG → 提交**，四件事同一批完成。

## 从哪里开始

| 你想知道 | 去看 |
|---|---|
| 这是什么产品、怎么跑起来 | [`../README.md`](../README.md) |
| 现在做到哪一步、下一步做什么 | [`../PROJECT_STATUS.md`](../PROJECT_STATUS.md) |
| 每一项任务的真实状态与证据 | [`../TASKS.md`](../TASKS.md) |
| 需求编号与验收标准 | [`REQUIREMENTS.md`](REQUIREMENTS.md) |
| 为什么这样设计 | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| 折叠/剪切的数学定义与不变量 | [`GEOMETRY_SPEC.md`](GEOMETRY_SPEC.md) |
| 测试怎么跑、覆盖了什么 | [`TESTING.md`](TESTING.md) + [`../TEST_REPORT.md`](../TEST_REPORT.md) |
| 怎么发布、怎么回滚 | [`DEPLOYMENT.md`](DEPLOYMENT.md) |
| Git 规范与里程碑记录 | [`GITHUB_WORKFLOW.md`](GITHUB_WORKFLOW.md) |
| 密钥、隐私、依赖安全 | [`SECURITY.md`](SECURITY.md) |
| 歧义与我的假设 | [`ASSUMPTIONS.md`](ASSUMPTIONS.md) |
| 关键决策记录 | [`adr/`](adr/) |
| 参赛材料 | [`../submission/`](../submission/) |

## 文档清单与维护责任

| 文档 | 内容 | 更新时机 | 责任人 |
|---|---|---|---|
| `README.md` | 定位、真实功能、命令、边界 | 每次发布或主要功能调整 | 开发 |
| `docs/INDEX.md` | 导航与维护约定 | 增删文档时 | 开发 |
| `docs/REQUIREMENTS.md` | 需求编号、优先级、验收 | 需求变化时 | 产品 |
| `docs/ASSUMPTIONS.md` | 歧义 → 假设 → 风险 → 可撤销 | 产生歧义时 | 开发 |
| `docs/ARCHITECTURE.md` | 分层、数据流、边界 | 架构/API 变更时 | 开发 |
| `docs/GEOMETRY_SPEC.md` | 数学模型、不变量、黄金样例 | 几何算法变更时 | 开发 |
| `docs/DEVELOPMENT.md` | 环境、脚本、约定 | 流程变化时 | 开发 |
| `docs/TESTING.md` | 测试矩阵与门槛 | 测试范围变化时 | QA |
| `docs/DEPLOYMENT.md` | 发布、更新发布、回滚、线上核验 | 上线流程变化时 | 上线 |
| `docs/GITHUB_WORKFLOW.md` | 分支、提交、推送、冲突 | Git 规则变化时 | 开发 |
| `docs/SECURITY.md` | 密钥、隐私、依赖、漏洞披露 | 安全边界变化时 | 开发 |
| `docs/AI_INTEGRATION.md` | 运行时 AI（仅在实现时） | AI 功能变化时 | 开发 |
| `docs/adr/ADR-*.md` | 关键决策 | 做出/改变决策时 | 开发 |
| `TASKS.md` | 逐项状态 + 证据 + SHA | 每个里程碑 | 开发 |
| `PROJECT_STATUS.md` | 当前状态快照 | 每个里程碑 / 交接前 | 开发 |
| `TEST_REPORT.md` | 真实执行记录 | 每个里程碑 | QA |
| `CHANGELOG.md` | 版本变更 | 每次发布 | 开发 |
| `CONTRIBUTING.md` | 贡献流程与检查单 | 工作流变化时 | 开发 |
| `submission/*` | 参赛材料 | 每次材料变化 | 产品 |

## 阅读顺序建议

1. `README.md` → 建立产品印象
2. `docs/GEOMETRY_SPEC.md` → 理解"为什么这个应用不会骗人"
3. `docs/ARCHITECTURE.md` → 理解代码为什么长这样
4. `TASKS.md` → 知道哪些是真的、哪些还没做
