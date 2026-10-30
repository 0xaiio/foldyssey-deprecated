# 变更日志（CHANGELOG）

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)；版本遵循语义化版本。

## [0.3.0] — 2026-10-30 · Milestone 2

### 新增
- **可玩关卡页**：`ready → folding → folded → cutting → cut → unfolding → revealed` 七态状态机
- 切线交互：拖动端点旋转、拖动中点平移、角度/偏移滑块、一键换保留侧；动画期间按钮禁用防竞态
- 判定面板：IoU、对称差比例、实得面积、几何化反馈文案、差异区域可视化
- 三级提示（观察 / 操作 / 解答）逐步揭示
- 本地进度：尝试次数、最佳 IoU、通关标记（localStorage）
- 关卡栏：六关切换 + 通关打勾；判定出现时自动滚动到结果

### 工程
- 生产构建端到端验证：`vite preview` + CDP 全流程通关，控制台 0 错误
- 新增 `docs/DEPLOYMENT.md`，如实记录发布阻塞

### 已知限制
- WorkBuddy 公开发布在本会话**受阻**（部署工具不可用），未取得公开链接

## [0.2.0] — 2026-10-30 · Milestone 1

### 新增
- **几何内核**（`src/geometry/`）：纸张模型、等距变换与逆、四种固定折法、
  逐层半平面裁剪、逆映射展开、IoU/对称差评分、SVG 路径生成（含孔洞）
- **黄金样例**：正交双折剪去纸包内角 → 中心菱形孔洞，面积 `2d²`，四重镜像对称
- **六个关卡数据**：目标由标准解正向构造，逐关自动验证
- **首页实时动画**：真实折叠 → 剪切 → 展开，逐帧由引擎计算；`prefers-reduced-motion` 下降级为静帧
- 文档：`docs/GEOMETRY_SPEC.md`、`docs/TESTING.md`、`TEST_REPORT.md`

### 修复（开发期）
- 展开曾误用 `transform(source)` 而非 `source`，导致四层被折叠两次、展开面积只剩 1/4。
  已由 INV-2 测试锁死，并写入 `docs/GEOMETRY_SPEC.md` §5。

### 测试
- `npm test`：45/45 通过（geometry 22 + levels 23）

## [0.1.0] — 2026-10-30 · Milestone 0

### 新增
- 品牌与应用外壳：中文/英文双语命名（一刀万象 / Foldyssey）、首页、导航、页脚
- 视觉系统：宣纸背景、纸张质感、中国红/暖金/墨黑/青绿令牌（Tailwind 4 `@theme`）
- 路由骨架：首页 / 一刀挑战 / 剪纸工坊 / 我的作品 / 纸艺中的数学 / 关于
- 工程文档体系：README、docs/INDEX、REQUIREMENTS、ARCHITECTURE、ASSUMPTIONS、
  DEVELOPMENT、GITHUB_WORKFLOW、SECURITY、TASKS、PROJECT_STATUS
- 构建链路：TypeScript 7 严格模式 + Vite 8 生产构建

### 说明
- 首页主视觉为**静态品牌草图**，不是几何计算结果；M1 会替换为引擎驱动的动画。
- 除首页外，其余页面为占位页。

### 已知限制
- 无几何引擎、无测试、无发布。
