# 架构（ARCHITECTURE）

> 目标：几何纯函数与 React UI 彻底分离；渲染层不得持有第二套"结果状态"。
> 任何影响用户、API 或数据格式的改动，必须同时更新本文与 `GEOMETRY_SPEC.md`。

---

## 1. 分层

```text
┌──────────────────────────────────────────────┐
│ pages/            Home · Puzzle · Studio · Gallery · Explore · About
│ components/       PaperStage · GoldenDemo · ui
├──────────────────────────────────────────────┤
│ puzzle/           关卡定义、评分包装、本地进度
│ studio/           工坊文档模型、美学预设
│ services/         本地存储、导出（SVG/PNG）
├──────────────────────────────────────────────┤
│ geometry/         纯函数：点/多边形/变换/折叠/裁剪/展开/评分
└──────────────────────────────────────────────┘
```

依赖方向**单向向下**：`geometry` 不 import 任何上层模块，也不 import React。
这保证几何可以被 Node 直接测试（`vitest` 在 node/jsdom 下运行，无需浏览器）。

## 2. 几何子模块职责

| 文件 | 职责 | 不负责 |
|---|---|---|
| `types.ts` | `Vec2 / Ring / Polygon / MultiPolygon`、容差常量 | 任何运算 |
| `matrix.ts` | 仿射矩阵（SVG 顺序 `[a,b,c,d,e,f]`）、逆、复合、反射、动画用部分反射 | 多边形 |
| `polygon.ts` | 面积、包围盒、清洗、clipper 转换、路径生成、半平面裁剪、点包含 | 折叠语义 |
| `ops.ts` | `polygon-clipping` 的防御式封装 + 失败降级 | 层/折叠 |
| `fold.ts` | 折叠预设、纸包分区、层序、逐层变换、动画位姿 | 剪切 |
| `cut.ts` | 直线切 = 半平面，逐层裁剪、逆映射、展开 | 评分 |
| `metrics.ts` | IoU、对称差、几何化反馈文案 | 渲染 |

## 3. 关键流程

### 3.1 折叠

```text
buildFoldState(paper, presetId)
  patches = [{ source: paper, transform: I, history: [] }]
  for op of preset.ops:
    for patch of patches:
      image   = transform(patch.source, patch.transform)
      moving  = image ∩ halfPlane(op)         // 会翻过去的一半
      staying = image \ halfPlane(op)
      staying.source = inverse(staying),  transform 不变
      moving.source  = inverse(moving),   transform = R(op) ∘ transform
      moving.history = [...history, op]
  层序：折叠的层落在栈顶；整体翻转时该组的内部顺序反转
```

**`Patch.source` 始终是"原始纸面上的区域"**，`transform` 把它送到当前折叠位置。
因此展开 = 各层 `source` 的并集（不需要再乘一次变换）。

> 这是本项目最容易写错的一处：早期实现把展开写成 `transform(source)`，导致四层被折叠两次、
> 展开面积只剩 1/4。`src/tests/geometry.test.ts` 的「两次正交折叠后展开恢复整张纸」就是为了锁死这一点。

### 3.2 剪切

```text
applyCut(state, cut)
  H⁻ = 有限矩形 ∩ 半平面
  for patch:
    D_i  = transform(patch.source) ∩ H⁻
    P_i' = patch.source \ inverse(D_i)
  返回：保留的 layers、纸包内的剪下区域、逐层的剪下区域（原始坐标）
```

只有 `D_i` 非空的层才会被裁剪；`removedPaperArea` 是各层之和，`removedPacketArea` 是纸包上的投影面积。

### 3.3 展开与评分

- 展开：`unfoldPatches(patches)` = 各层 `source` 的并集（布尔 union）。
- 评分：`scoreRegions(actual, target, paperArea)` → IoU、对称差比、差异区域。
- 反馈：`explainScore` 依据面积差与 IoU 生成确定性文案，不调用模型。

### 3.4 动画

`PaperStage` 接收 `progress: number[][]`，每个 patch 的每个折叠操作有一个 0..1 进度；
`patchTransformAt` 把反射矩阵插值为 `diag(1-2p, 1)` 或 `diag(1, 1-2p)`。

> `p = 0.5` 时缩放为 0，正是"翻起的纸边正对观察者"的正交投影。因此这是**真实的 2.5D 折叠**，
> 不是淡入淡出。折叠线始终经过原点（四种预设都满足），所以插值不需要移动折痕。

## 4. 坐标系

| 空间 | 约定 |
|---|---|
| 模型空间 | 原点在纸心，y 向上，纸为 `[-1,1]²` |
| SVG 用户空间 | 与模型同尺度，通过 `<g transform="scale(1,-1)">` 翻转 |
| 屏幕空间 | 由 `viewBox` 缩放；指针输入经 `svg.getScreenCTM().inverse()` 回到用户空间再取负 y |
| 导出空间 | 带 4% 边距的 `viewBox`，y 同样翻转 |

## 5. 状态管理

- **单一可信源**：`Patch[]`（含 `source / transform / history`）。渲染、导出、评分都从它派生。
- 页面状态用 React `useState`；工坊用带合并窗口的历史栈（`useHistory`）实现撤销/重做。
- 不做全局 store：页面之间不共享几何状态，作品通过 `Artwork` 文档在 localStorage 中传递。

## 6. 持久化格式

```ts
type Artwork = {
  schemaVersion: 1;
  id: string;
  title: string;
  createdAt: number; updatedAt: number;
  foldPreset: 'none' | 'vertical' | 'horizontal' | 'orthogonal2';
  cuts: StraightCut[];
  style: { paperColor: string; backgroundColor: string };
  manufacturability: 'verified' | 'digital-only' | 'unchecked';
  previewPath: string;   // 派生缓存，仅用于列表缩略图
  area: number; paperHalf: number;
};
```

读取时逐字段校验 + 版本检查；未知版本返回 `null` 而不是崩溃。
`previewPath` 是**缓存**，编辑与导出始终从 `foldPreset + cuts` 重新计算。

## 7. 依赖与边界

| 依赖 | 用途 | 边界 |
|---|---|---|
| `polygon-clipping` | 多边形布尔运算 | 只是布尔内核，**不是折纸引擎**；所有折叠/层/逆映射由本项目实现 |
| `motion` | 页面过渡与卡片微交互 | 不承担纸张动画（纸张动画由 SVG 矩阵驱动，需要逐帧精确控制） |
| `react` / `react-dom` | UI | — |
| Tailwind CSS 4 | 样式 | 视觉令牌集中在 `styles/index.css` 的 `@theme` |

明确**不引入**：Three.js / 物理引擎 / 服务端框架 / 运行时模型 SDK。
