# 变更日志（CHANGELOG）

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)；版本遵循语义化版本。

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
