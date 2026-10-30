# 任务追踪（TASKS）

> 状态只有五种：`已完成`、`部分完成`、`未完成`、`受阻`、`不适用`。
> **"已完成"必须有可执行的成果与证据**；没有证据的一律不算完成。
> Commit SHA 来自 `git rev-parse HEAD`，可用 `git show <sha>` 复核。

当前里程碑：**M4（投稿材料与最终核验）— 收尾**

---

## 里程碑记录

| 里程碑 | 摘要 | Commit SHA | 分支 | 测试结果 | 文档更新 | Push |
|---|---|---|---|---|---|---|
| M0 | 仓库基线、品牌外壳、工程文档 | `7c5e996aa57c1a192fa8a796f9a9f452075451dc` | main | build ✅ | README、docs/*（8 份） | ✅ 已推送 |
| M1 | 几何引擎 + 黄金菱形 + 数学测试 | `20292e2e587a55c9bd3b2a003184957212e99abb` | main | 45/45 · build ✅ | GEOMETRY_SPEC、TESTING、TEST_REPORT | ✅ 已推送 |
| M2 | 可玩关卡 + 生产构建 E2E | `cbfd59be6715cfaabbcff6ecc65f214193783512` | main | 45/45 · 通关 · build ✅ | DEPLOYMENT、TEST_REPORT | ✅ 已推送 |
| M3 | 工坊 / 作品集 / 数学页 / 导出 | `f2b2312f951b39679aeeaa148b4bf038aed63e0e` | main | 57/57 · E2E · build ✅ | AI_INTEGRATION、ADR×5、README | ✅ 已推送 |
| M4 | 六关逐关验证、渲染缺陷修复、投稿材料 | `f6158cdb854648c00bd6b063d7ea18130a614454` | main | 57/57 · 6/6 通关 · build ✅ | SUBMISSION×9、TEST_REPORT | ✅ 已推送 |

---

## 逐项状态

### 几何内核（10/10 已完成）

| ID | 任务 | 优先级 | 里程碑 | 状态 | 实现 | 证据 |
|---|---|---|---|---|---|---|
| REQ-GEO-001 | 纸张模型 `[-1,1]²`，y 向上 | P0 | M1 | 已完成 | `geometry/types.ts`、`polygon.ts:squarePolygon` | 面积 4.0000 断言 |
| REQ-GEO-002 | 等距变换 + 逆 + 折叠历史 + 层序 | P0 | M1 | 已完成 | `matrix.ts`、`fold.ts:Patch` | 反射等距 / 合成一致性测试 |
| REQ-GEO-003 | 四种固定折法 | P0 | M1 | 已完成 | `fold.ts:FOLD_PRESETS` | 双折 4 层、纸包面积 1.0 |
| REQ-GEO-004 | 直线切 = 半平面，逐层裁剪 | P0 | M1 | 已完成 | `cut.ts:applyCut` | 逐层剪下总面积 = 2d² |
| REQ-GEO-005 | 展开 = 各层 source 并集 | P0 | M1 | 已完成 | `fold.ts:unfoldPatches` | 两折不剪恢复整张纸 |
| REQ-GEO-006 | 黄金菱形孔洞 `2d²` | P0 | M1 | 已完成 | `cut.ts` + `levels.ts` | d=0.2/0.35/0.6 面积、顶点、对称 |
| REQ-GEO-007 | 布尔运算封装 + 降级 | P0 | M1 | 已完成 | `ops.ts` | 失败计数 + 确定性降级 |
| REQ-GEO-008 | IoU / 对称差评分 | P0 | M1 | 已完成 | `metrics.ts:scoreRegions` | IoU=1 / 错解 <0.9 / 空集 |
| REQ-GEO-009 | SVG 路径（含孔洞） | P0 | M1 | 已完成 | `polygon.ts:multiPolygonToPath` | 内环保留 + evenodd |
| REQ-GEO-010 | 退化输入防护 | P0 | M1 | 已完成 | `validateCut`、`sanitize*` | NaN/Inf/零法向量用例 |

### 游戏（8/8 已完成）

| ID | 任务 | 优先级 | 里程碑 | 状态 | 实现 | 证据 |
|---|---|---|---|---|---|---|
| REQ-GAME-001 | 6 关，标准解正向构造 | P0 | M1 | 已完成 | `puzzle/levels.ts` | 逐关 IoU=1；浏览器 6/6 通关 |
| REQ-GAME-002 | 关卡数据结构完整 | P0 | M1 | 已完成 | `PuzzleLevel` | 字段断言 + seed |
| REQ-GAME-003 | 七态状态机 + 防竞态 | P0 | M2 | 已完成 | `pages/Puzzle.tsx` | 动画期间按钮禁用；连点无异常 |
| REQ-GAME-004 | 切线交互 | P0 | M2 | 已完成 | `PaperStage.tsx` | 拖动 offset 1.200→1.061 |
| REQ-GAME-005 | 目标对照 + 差异层 | P0 | M2 | 已完成 | `Puzzle.tsx` + `overlay` | 缩略图 + 差异区域可切换 |
| REQ-GAME-006 | 几何化反馈 | P0 | M2 | 已完成 | `explainScore` | 四类文案 |
| REQ-GAME-007 | 三级提示 | P0 | M2 | 已完成 | `Puzzle.tsx` | 逐条揭示 |
| REQ-GAME-008 | 本地进度 | P1 | M2 | 已完成 | `puzzle/progress.ts` | localStorage + 关卡栏打勾 |

### 工坊（8/8 已完成）

| ID | 任务 | 优先级 | 里程碑 | 状态 | 实现 | 证据 |
|---|---|---|---|---|---|---|
| REQ-STD-001 | 双视图 | P0 | M3 | 已完成 | `pages/Studio.tsx` | 预览与导出同源 |
| REQ-STD-002 | 多刀叠加 | P0 | M3 | 已完成 | stages 逐刀应用 | E2E 2→3 刀 |
| REQ-STD-003 | 撤销/重做/重置 | P0 | M3 | 已完成 | `useHistory` | 栈状态与按钮同步 |
| REQ-STD-004 | 4 套预设 + 配色 | P1 | M3 | 已完成 | `studio/presets.ts` | 单测 4 套均有效 |
| REQ-STD-005 | SVG 导出 | P0 | M3 | 已完成 | `services/export.ts` | 2 子路径 / evenodd / 转义 |
| REQ-STD-006 | PNG 导出 | P0 | M3 | 已完成 | `downloadPng` | E2E 点击无异常 |
| REQ-STD-007 | 作品保存/载入/删除 | P0 | M3 | 已完成 | `artwork.ts` + `storage.ts` | 7 条持久化测试 |
| REQ-STD-008 | 手工制作卡 | P1 | M3 | 已完成 | `Studio.tsx` | 与切线数据同源 |

### 运行时 AI（1/4 已完成，3 项未实现）

| ID | 任务 | 优先级 | 状态 | 说明 |
|---|---|---|---|---|
| REQ-AI-001 | 真实接入运行时模型 | P1 | 未完成 | 无可确认的无密钥服务端通道；**不提供入口**，见 `docs/AI_INTEGRATION.md` |
| REQ-AI-002 | Schema 校验 | P1 | 未完成 | 依赖 A-001；契约草案已写入 AI_INTEGRATION §3.2 |
| REQ-AI-003 | 失败降级 | P1 | 未完成 | 依赖 A-001 |
| REQ-AI-004 | 密钥不入仓库/客户端 | P0 | 已完成 | `.gitignore` 排除 `.env*`；仓库与 bundle 内无密钥 |

### 平台 / 体验（4 完成 / 2 部分）

| ID | 任务 | 优先级 | 状态 | 证据 |
|---|---|---|---|---|
| REQ-PLAT-001 | 首页品牌与入口 | P0 | 已完成 | 截图 `01-home-desktop.png` |
| REQ-PLAT-002 | 首页真实几何动画 | P0 | 已完成 | `GoldenDemo.tsx`，逐帧由引擎计算；reduced-motion 降级为静帧 |
| REQ-PLAT-003 | 移动端 390px | P0 | 部分完成 | 无横向溢出、手柄可拖；**未真机验证** |
| REQ-PLAT-004 | 可访问性 | P1 | 部分完成 | 语义标签 / aria / focus-visible；未跑 axe |
| REQ-PLAT-005 | 数学解释 5 卡片 | P1 | 已完成 | 4 个可交互实验 + 定理卡 |
| REQ-PLAT-006 | About 能力边界 | P0 | 已完成 | 含"非 MIT 官方产品"与"无运行时 AI" |

### 发布（2 完成 / 2 受阻）

| ID | 任务 | 优先级 | 状态 | 证据 |
|---|---|---|---|---|
| REQ-REL-001 | 生产构建 | P0 | 已完成 | `dist/` 354 kB JS / gzip 110 kB |
| REQ-REL-002 | 单元测试 | P0 | 已完成 | 57/57 |
| REQ-REL-003 | 公开 HTTPS 链接 | P0 | **受阻** | `workbuddy_sites_deploy` 在本会话不可用，见 `docs/DEPLOYMENT.md` §3 |
| REQ-REL-004 | 线上核验 | P0 | **受阻** | 无链接可核验；本地生产构建 E2E 已通过 |

### 工程治理 / 投稿（11 完成 / 1 未完成）

| ID | 任务 | 优先级 | 状态 | 证据 |
|---|---|---|---|---|
| REQ-DOC-001 | 文档体系 | P0 | 已完成 | 16 份文档，见 `docs/INDEX.md` |
| REQ-DOC-002 | 任务表 + 证据 + SHA | P0 | 已完成 | 本文件 |
| REQ-DOC-003 | 测试报告 | P0 | 已完成 | `TEST_REPORT.md`（T1–T10） |
| REQ-GIT-001 | 关联 origin | P0 | 已完成 | `git remote -v` |
| REQ-GIT-002 | M0–M4 提交 | P0 | 已完成 | 5 个里程碑提交 |
| REQ-GIT-003 | 推送核验 | P0 | 已完成 | `git ls-remote` 与本地 HEAD 一致 |
| REQ-SUB-001 | 九份投稿材料 | P1 | 已完成 | `submission/*` |
| REQ-SUB-002 | 真实截图 | P0 | 已完成 | 9 张，由 CDP 自动捕获 |
| REQ-SUB-003 | AI 披露 | P0 | 已完成 | `ai_usage_disclosure.md` |
| REQ-SUB-004 | 版权清单 | P0 | 已完成 | `references_licenses.md` |
| REQ-SUB-005 | 60 秒脚本 | P1 | 已完成 | `demo_script_60s.md` |
| REQ-SUB-006 | 演示视频 | P1 | 未完成 | 有脚本，无录制条件 |

---

## 汇总

| 状态 | 数量 |
|---|---|
| 已完成 | 44 |
| 部分完成 | 2（移动端真机、可访问性扫描） |
| 未完成 | 4（运行时 AI 三项、演示视频） |
| 受阻 | 2（公开发布、线上核验） |
| 不适用 | 4（小程序、账号体系、物理引擎、云同步） |

## 阻塞与风险

| 事项 | 状态 | 需要谁 |
|---|---|---|
| WorkBuddy 公开发布 | 阻塞 | 用户：在 WorkBuddy 内执行「网站开发 → 发布」 |
| 赛事表单字段 | 待核验 | 用户：登录活动页确认 |
| 真机测试 | 未做 | 有设备时补 |
| 演示视频 | 未录 | 有录屏条件时按脚本录制 |
