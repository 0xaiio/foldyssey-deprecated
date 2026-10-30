# 任务追踪（TASKS）

> 状态取值只有五种：`已完成`、`部分完成`、`未完成`、`受阻`、`不适用`。
> **"已完成"必须有可执行的成果与证据**；没有证据的一律不算完成。
> 本表在 M0–M4 每个里程碑结束时更新，SHA 来自 `git rev-parse HEAD`。

当前里程碑：**M2（可玩关卡）**

---

## 里程碑记录

| 里程碑 | 摘要 | Commit SHA | 分支 | 测试结果 | 文档更新 | Push |
|---|---|---|---|---|---|---|
| M0 | 仓库基线、品牌外壳、文档体系 | `7c5e996aa57c1a192fa8a796f9a9f452075451dc` | main | build ✅ | README、docs/*、TASKS、STATUS | ✅ 已推送（远端 main 一致） |
| M1 | 几何引擎 + 黄金菱形 + 数学测试 | `20292e2e587a55c9bd3b2a003184957212e99abb` | main | 45/45 通过 · build ✅ | GEOMETRY_SPEC、TESTING、TEST_REPORT | ✅ 已推送 |
| M2 | 可玩关卡 + 生产构建核验 + 发布尝试 | 见下一条目 | main | 45/45 · E2E 通关 · build ✅ | DEPLOYMENT、TEST_REPORT | ⚠️ 发布受阻（无部署工具） |
| M3 | 工坊 / 作品集 / 数学页 | — | — | — | — | — |
| M4 | 打磨、投稿材料、线上核验 | — | — | — | — | — |

---

## 逐项状态

### 几何内核

| ID | 任务/验收条件 | 优先级 | 里程碑 | 状态 | 实现文件/思路 | 验证证据 | 遗留 |
|---|---|---|---|---|---|---|---|
| REQ-GEO-001 | 纸张模型 `[-1,1]²`，y 向上 | P0 | M1 | 已完成 | `geometry/types.ts`、`polygon.ts:squarePolygon` | `geometry.test.ts` 面积 4.0000 | — |
| REQ-GEO-002 | 等距变换 + 逆 + 折叠历史 + 层序 | P0 | M1 | 已完成 | `geometry/matrix.ts`、`fold.ts:Patch` | 「反射是等距」「合成等于 patch.transform」 | — |
| REQ-GEO-003 | 四种固定折法 | P0 | M1 | 已完成 | `fold.ts:FOLD_PRESETS/buildFoldState` | 正交双折 4 层、纸包面积 1.0 | — |
| REQ-GEO-004 | 直线切 = 半平面，逐层裁剪 | P0 | M1 | 已完成 | `cut.ts:applyCut` | 「每层独立裁剪」剪下总面积 = 2d² | — |
| REQ-GEO-005 | 展开 = 各层 source 并集 | P0 | M1 | 已完成 | `fold.ts:unfoldPatches` | 「两折不剪恢复整张纸」 | — |
| REQ-GEO-006 | 黄金菱形孔洞 `2d²` | P0 | M1 | 已完成 | `cut.ts` + `puzzle/levels.ts` | d=0.2/0.35/0.6 三组面积、顶点、对称断言 | — |
| REQ-GEO-007 | 布尔运算封装 + 降级 | P0 | M1 | 已完成 | `ops.ts` | 失败计数 + 确定性降级；退化输入不崩溃 | — |
| REQ-GEO-008 | IoU / 对称差评分 | P0 | M1 | 已完成 | `metrics.ts:scoreRegions` | 相同 IoU=1、错解 <0.9、空集有定义 | — |
| REQ-GEO-009 | SVG 路径（含孔洞） | P0 | M1 | 已完成 | `polygon.ts:multiPolygonToPath` | 「孔洞在序列化数据中仍是内环」 | — |
| REQ-GEO-010 | 退化输入防护 | P0 | M1 | 已完成 | `cut.ts:validateCut`、`polygon.ts:sanitize*` | 零法向量/NaN/Infinity 用例 | — |

### 游戏

| ID | 任务/验收条件 | 优先级 | 里程碑 | 状态 | 实现文件/思路 | 验证证据 | 遗留 |
|---|---|---|---|---|---|---|---|
| REQ-GAME-001 | 6 关，标准解正向构造 | P0 | M1 | 已完成 | `puzzle/levels.ts`（target 由 `foldCutUnfold` 生成） | `levels.test.ts` 逐关 IoU=1 | 可玩 UI 待 M2 |
| REQ-GAME-002 | 关卡数据结构完整 | P0 | M1 | 已完成 | `puzzle/levels.ts:PuzzleLevel` | 6 关 × 字段断言（id/难度/容差/提示/seed） | — |
| REQ-GAME-003 | 七态状态机 + 防竞态 | P0 | M2 | 已完成 | `pages/Puzzle.tsx`（ready→folding→folded→cutting→cut→unfolding→revealed） | 动画期间按钮 `disabled`；E2E 连点无异常 | — |
| REQ-GAME-004 | 切线交互（拖拽 + 滑块） | P0 | M2 | 已完成 | `PaperStage.tsx`（端点旋转/中点平移/滑块/换侧） | E2E 拖动：偏移 1.200→1.061 | — |
| REQ-GAME-005 | 目标对照 + 差异层 | P0 | M2 | 已完成 | `Puzzle.tsx:GoalPanel/ResultPanel` + `overlay` | 目标缩略图 + 差异区域可切换 | — |
| REQ-GAME-006 | 几何化反馈 | P0 | M2 | 已完成 | `geometry/metrics.ts:explainScore` | 剪多了/剪少了/位置角度/保留侧反了 四类文案 | — |
| REQ-GAME-007 | 三级提示 | P0 | M2 | 已完成 | `Puzzle.tsx` 提示面板逐条揭示 | 未揭示显示占位，逐步展开 | — |
| REQ-GAME-008 | 本地进度 | P1 | M2 | 已完成 | `puzzle/progress.ts` + 关卡栏打勾 | localStorage `foldyssey.progress.v1` | — |

### 工坊

| ID | 任务/验收条件 | 优先级 | 里程碑 | 状态 | 实现文件/思路 | 验证证据 | 遗留 |
|---|---|---|---|---|---|---|---|
| REQ-STD-001 | 双视图 | P0 | M3 | 未完成 | — | — | 待实现 |
| REQ-STD-002 | 多刀叠加 | P0 | M3 | 未完成 | — | — | 待实现 |
| REQ-STD-003 | 撤销/重做/重置 | P0 | M3 | 未完成 | — | — | 待实现 |
| REQ-STD-004 | 4 套预设 + 自定义配色 | P1 | M3 | 未完成 | — | — | 待实现 |
| REQ-STD-005 | SVG 导出 | P0 | M3 | 未完成 | — | — | 待实现 |
| REQ-STD-006 | PNG 导出 | P0 | M3 | 未完成 | — | — | 待实现 |
| REQ-STD-007 | 作品保存/载入/删除 | P0 | M3 | 未完成 | — | — | 待实现 |
| REQ-STD-008 | 手工制作卡 | P1 | M3 | 未完成 | — | — | 待实现 |

### 运行时 AI

| ID | 任务/验收条件 | 优先级 | 里程碑 | 状态 | 实现文件/思路 | 验证证据 | 遗留 |
|---|---|---|---|---|---|---|---|
| REQ-AI-001 | 真实接入运行时模型 | P1 | — | 未完成 | 无可确认的无密钥安全通道 | 见 `docs/ASSUMPTIONS.md` A-001 | 不提供入口 |
| REQ-AI-002 | 结构化参数 + Schema 校验 | P1 | — | 未完成 | 依赖 A-001 | — | — |
| REQ-AI-003 | 失败降级 | P1 | — | 未完成 | 依赖 A-001 | — | — |
| REQ-AI-004 | 密钥不入仓库/客户端 | P0 | M0 | 已完成 | `.gitignore` 排除 `.env*`；仓库内无密钥 | `git ls-files` 无 `.env`；全局搜索无 `sk-`/`apiKey` | — |

### 平台 / 体验

| ID | 任务/验收条件 | 优先级 | 里程碑 | 状态 | 实现文件/思路 | 验证证据 | 遗留 |
|---|---|---|---|---|---|---|---|
| REQ-PLAT-001 | 首页品牌与入口 | P0 | M0 | 已完成 | `src/pages/Home.tsx` | 浏览器 1440×900 截图 | 主视觉仍为静态草图，M1 替换 |
| REQ-PLAT-002 | 首页真实几何动画 | P0 | M1 | 已完成 | `components/GoldenDemo.tsx`（逐帧由引擎计算，尊重 reduced-motion） | 首页截图 8 条纸张路径 + 运行时无报错 | — |
| REQ-PLAT-003 | 移动端 390px 可用 | P0 | M2 | 部分完成 | 响应式栅格 + 触控手柄 | 390×844 无横向溢出、手柄可拖 | 未在真机验证 |
| REQ-PLAT-004 | 可访问性 | P1 | M3 | 未完成 | — | — | 待实现 |
| REQ-PLAT-005 | 数学解释 5 卡片 | P1 | M3 | 未完成 | — | — | 待实现 |
| REQ-PLAT-006 | About 能力边界 | P0 | M3 | 未完成 | — | — | 待实现 |

### 发布 / 治理

| ID | 任务/验收条件 | 优先级 | 里程碑 | 状态 | 实现文件/思路 | 验证证据 | 遗留 |
|---|---|---|---|---|---|---|---|
| REQ-REL-001 | 生产构建 | P0 | M0 | 已完成 | `npm run build` | `dist/` 产物；vite 构建成功 | — |
| REQ-REL-002 | 单元测试 | P0 | M1 | 已完成 | `src/tests/geometry.test.ts`、`levels.test.ts` | 45/45 通过（见 TEST_REPORT T2） | — |
| REQ-REL-003 | 公开 HTTPS 链接 | P0 | M2 | 受阻 | — | 工具 `workbuddy_sites_deploy` 在本会话不可用 | 需用户在 WorkBuddy 内发布 |
| REQ-REL-004 | 线上核验 | P0 | M4 | 未完成 | — | — | 待执行 |
| REQ-DOC-001 | 文档体系 | P0 | M0 | 已完成 | `README.md` + `docs/*` | 8 份基线文档 | 几何/测试文档随 M1 补 |
| REQ-DOC-002 | 任务表 + 证据 + SHA | P0 | 全程 | 部分完成 | 本文件 | 逐项状态已登记 | SHA 待各里程碑回填 |
| REQ-DOC-003 | 测试报告 | P0 | M1 | 已完成 | `TEST_REPORT.md`、`docs/TESTING.md` | 记录命令、输出、未执行项 | — |
| REQ-GIT-001 | 关联 origin | P0 | M0 | 已完成 | `git remote add origin …` | `git remote -v` 指向 `0xaiio/foldyssey` | — |
| REQ-GIT-002 | M0–M4 提交 | P0 | 全程 | 部分完成 | M0、M1 已提交 | `git log --oneline` | M2–M4 待做 |
| REQ-GIT-003 | 推送核验 | P0 | 全程 | 部分完成 | M0 已推送 | `git ls-remote --heads origin` = 7c5e996… | M1–M4 待推送 |
| REQ-SUB-001 | 九份投稿材料 | P1 | M4 | 未完成 | — | — | 待编写 |
| REQ-SUB-002 | 真实截图 | P0 | M4 | 未完成 | `tools/ui_check.py` 截图 | 已有 M0 截图 | 需重拍最终版 |
| REQ-SUB-003 | AI 披露 | P0 | M4 | 未完成 | — | — | 待编写 |
| REQ-SUB-004 | 版权清单 | P0 | M4 | 未完成 | — | — | 待编写 |
| REQ-SUB-005 | 60 秒脚本 | P1 | M4 | 未完成 | — | — | 待编写 |

---

## 阻塞与风险

| 事项 | 状态 | 说明 |
|---|---|---|
| 赛事表单字段 | 待人工核验 | 活动页需登录；不编造字段 |
| WorkBuddy 发布授权 | 待执行 | 发布时需要应用 ID 与账号授权 |
| GitHub 推送权限 | 待验证 | 首次 push 时确认 |
| 运行时 AI | 未实现 | 无可确认的无密钥通道；不提供假入口 |
