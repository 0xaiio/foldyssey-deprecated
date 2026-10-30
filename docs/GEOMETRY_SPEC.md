# 几何规范（GEOMETRY_SPEC）

> 这份文档定义"什么算正确"。代码可以改，这里的定义不能悄悄改：
> 任何语义变化必须同时更新本文件、`src/tests/*.test.ts` 与 `CHANGELOG.md`。

---

## 1. 坐标与单位

- **模型空间**：原点在纸心，x 向右，**y 向上**（数学约定）。
- **纸张**：`P = [-a, a] × [-a, a]`，本作固定 `a = 1`，`Area(P) = 4`。
- **单位**：长度单位为"纸的半边长"，面积单位为纸面积的 1/4。
- **渲染**：SVG 用户空间与模型同尺度，通过 `<g transform="scale(1,-1)">` 翻转 y。
- **导出**：`viewBox` 含 4% 边距，同样翻转 y。

> 屏幕像素与模型坐标**没有**固定比例：任何交互都必须经 `getScreenCTM().inverse()` 换算，
> 再取 `y → -y`。

## 2. 纸张分层模型

初始纸张被划分成若干**片区**（patch）。每个片区记录：

```ts
type Patch = {
  id: string;
  source: MultiPolygon;      // 原始纸面上的区域（不相交，并集 = 当前纸张）
  transform: Mat;            // source → 折叠纸包
  inverse: Mat;              // transform⁻¹
  history: FoldOperation[];  // 该层经历过的折叠，按顺序
  layer: number;             // 叠放顺序，0 = 最底层
};
```

`transform` 是等距变换：`f(x) = R x + t`，`RᵀR = I`，`det R = ±1`（负值表示已被翻面）。

### 关键不变量

| 编号 | 不变量 | 测试 |
|---|---|---|
| INV-1 | `Area(source)` 之和 = 当前纸张面积 | `debris and kept paper partition the sheet` |
| INV-2 | 展开 = 各层 `source` 的并集，**不再乘 transform** | `two orthogonal folds without a cut unfold back to the full sheet` |
| INV-3 | `transform = R_k ∘ … ∘ R_1`（按 history 顺序左乘） | `composing two reflections equals the composed patch transform` |
| INV-4 | 剪切后每层结果 ⊆ 原纸张 | `debris and kept paper partition the sheet` |
| INV-5 | 面积单调不增，且不为负 | 同上 |
| INV-6 | 相同输入 → 逐字节相同的输出几何 | `is deterministic for identical inputs and seeds` |

## 3. 折叠预设

四种，折叠方向固定：

| id | 操作序列 | 纸包 | 展开对称性 |
|---|---|---|---|
| `none` | — | `[-1,1]²` | 无 |
| `vertical` | 左半 → 右半，沿 `x=0` | `[0,1]×[-1,1]` | 关于 `x=0` 镜像 |
| `horizontal` | 下半 → 上半，沿 `y=0` | `[-1,1]×[0,1]` | 关于 `y=0` 镜像 |
| `orthogonal2` | 先竖直，再水平 | `[0,1]²` | 关于两条中线镜像（四重） |

折叠映射：

```text
R_vertical   = diag(-1, 1)      // (x,y) → (-x, y)
R_horizontal = diag(1, -1)      // (x,y) → (x, -y)
orthogonal2 的合成映射： (x,y) → (|x|, |y|)
```

### 分区算法

对每个片区，在**当前折叠坐标**下用半平面切分：

```text
image   = f(source)
moving  = image ∩ {x ≤ 0}          // 或 {y ≤ 0}
staying = image \ moving

staying.source = f⁻¹(staying),  f 不变
moving.source  = f⁻¹(moving),   f' = R_fold ∘ f,  history' = history + [fold]
```

片区不假设固定形状，分割由布尔运算得出，因此未来加入新折痕时不需要重写管线
（但**必须**先为它提供合法性验证，见第 8 节）。

### 层序

折叠时，翻过去的那一组落在栈顶，且该组内部顺序**反转**（像合上一本书）。
`buildFoldState` 按此规则重排 `layer`，渲染时按 `layer` 升序绘制。

## 4. 剪切语义

一次剪切由四元组定义：

```ts
type StraightCut = {
  nx: number; ny: number;  // 单位法向量（输入会被归一化）
  offset: number;         // 直线到原点的有符号距离：n·p = offset
  removedSide: 'negative' | 'positive';
};
```

被移除的半平面：

```text
H⁻ = { p : n·p < offset }   （removedSide = negative）
H⁻ = { p : n·p > offset }   （removedSide = positive）
```

对第 i 层（等距变换 `f_i`，原始区域 `P_i`）：

```text
D_i    = f_i(P_i) ∩ H⁻            // 纸包坐标下的剪下部分
P_i'   = P_i \ f_i⁻¹(D_i)         // 该层剩余部分（原始坐标）
```

**不是**减去一条零宽度的线。减去线段不会产生孔洞，这是折剪问题最常见的错误。

剪下面积统计口径：

- `removedPacketArea = Area(⋃ D_i)` —— 纸包上被剪掉的投影面积；
- `removedPaperArea = Σ Area(D_i)` —— 实际剪掉的纸面积（层数越多越大）。

## 5. 展开

```text
S = ⋃_i P_i'
```

因为 `P_i'` 已经是原始纸面坐标，展开**不需要**再应用 `f_i`。再应用一次会把四层
"折第二遍"，展开面积只剩 1/4 —— 本项目早期实现踩过这个坑，现已由测试锁死（INV-2）。

## 6. 黄金样例（必须通过）

条件：`a = 1`，`orthogonal2`，`n = (1/√2, 1/√2)`，`offset = d/√2`，`removedSide = negative`。

纸包为 `[0,1]²`，被移除区域是纸包内角附近的三角形：

```text
D = { (u,v) ∈ [0,1]² : u + v < d },   0 < d < 1
```

四层分别映射回四个象限，展开后：

```text
H = { (x,y) ∈ P : |x| + |y| < d }
```

即顶点为 `(±d, 0), (0, ±d)` 的菱形孔洞。

| 量 | 期望值 |
|---|---|
| `Area(H)` | `2d²` |
| `Area(P)` | `4` |
| `Area(S)` | `4 − 2d²` |
| 对称性 | 关于 `x` 轴、`y` 轴均不变（对称差面积 < 1e-9） |
| 拓扑 | 单个多边形 + 单个内环（1 个孔） |

对 `d ∈ {0.2, 0.35, 0.6}` 逐点断言：面积、中心与轴向点被移除、`1.1d` 与 `0.75d+0.75d` 处保留、
四个顶点真实存在于边界顶点集合中。改变 `d` 必须改变几何（对称差 > 0.05），
以防"切换预置图片"式作弊。

### 菱形孔洞的推广

正交双折下，任何**包含纸包内角**的半平面切口，展开后都是

```text
H = { (x,y) : n₁|x| + n₂|y| < c }
```

即一个以原点为中心的菱形（当 `n₁ = n₂` 时为旋转 45° 的正方形）。
这不是巧合：`(|x|, |y|)` 的四重对称把半平面"复制"了四次。

## 7. 评分

```text
IoU = Area(A ∩ T) / Area(A ∪ T)
E   = Area(A △ T) / Area(P)
```

- 纯几何集合运算，不用像素相似度。
- `Area(A ∪ T) = 0` 时：两者都空 → `IoU = 1`；否则 `IoU = 0`。
- 判定阈值（可在关卡中覆写）：
  - `IoU ≥ 0.995` → `perfect`（完全吻合）
  - `IoU ≥ 0.9` → `close`（接近）
  - 否则 → `miss`（未匹配）
- 反馈文案由**面积差**与 `IoU` 推导，例如"剪多了 42%"、"面积接近但位置或角度不对"，
  不调用任何模型。

## 8. 明确不支持的输入

| 输入 | 行为 | 原因 |
|---|---|---|
| 零法向量 / NaN / Infinity | 拒绝，返回未命中 | 无定义的直线 |
| 切线不与纸包相交 | `hit = false`，纸张不变 | 空操作必须显式反馈 |
| 斜向折线、任意折痕拖拽 | 不支持 | 需先证明可平折与无穿透 |
| 曲线切口、多段折线切口 | 不支持 | 不属于"一刀直线" |
| 退化多边形（<3 点 / 零面积） | 清洗后丢弃 | 布尔运算内核要求 |

## 9. 数值策略

| 常量 | 值 | 用途 |
|---|---|---|
| `EPS` | `1e-9` | 面积是否为 0、评分相等性 |
| `SNAP` | `1e-7` | 顶点合并、重合点消除 |
| 路径精度 | 5 位小数（导出 6 位） | SVG 坐标 |

- 布尔运算失败时按操作类型降级（union → 连接两个操作数；difference → 保留被减数；
  intersection/xor → 空），并累加 `booleanFallbackCount` 供诊断。
- 顶点正好落在切线上的点属于**边界**，不参与"内部/外部"判定（测试中已避免用边界点断言）。
