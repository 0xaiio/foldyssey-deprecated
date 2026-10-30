# 测试执行记录（TEST_REPORT）

> 只记录**实际执行过**的命令与真实结果。未执行的项写"未执行"，失败项写失败原因。
> 环境：Windows 11 · Node v22.22.2 · npm 10.9.7 · Edge headless（CDP）

---

## 2026-10-30 · Milestone 1（几何内核）

### T1 类型检查

```bash
npx tsc --noEmit
```

- 退出码：`0`
- 结果：**通过**，无错误。

### T2 单元测试

```bash
npm test        # vitest run
```

```
✓ src/tests/geometry.test.ts (22 tests) 55ms
✓ src/tests/levels.test.ts (23 tests) 36ms

Test Files  2 passed (2)
     Tests  45 passed (45)
  Duration  917ms
```

- 结果：**45/45 通过**。
- 覆盖：黄金菱形孔洞（`d = 0.2 / 0.35 / 0.6`）、展开面积守恒、四重镜像对称、
  逐层逆映射、切线未命中、非法法向量、确定性、孔洞内环、IoU/对称差、
  六关标准解可通关、初始切线不通关、无关切线被判 miss。

### T3 生产构建

```bash
npm run build
```

```
dist/index.html                   1.15 kB │ gzip:   0.66 kB
dist/assets/index-upTmoOXo.css   31.38 kB │ gzip:   6.96 kB
dist/assets/index-BcgXIkVK.js   292.09 kB │ gzip:  92.44 kB
✓ built in 850ms
```

- 结果：**通过**。

### T4 浏览器端到端（首页动画 + 关卡流程）

```bash
python tools/ui_check.py --url http://localhost:5173/ --out ./.artifacts
```

结果摘要（真实 `report.json`）：

| 检查 | 结果 |
|---|---|
| 页面标题 | `Foldyssey · 一刀万象` ✅ |
| 首页 h1 | `一刀万象` ✅ |
| 首页纸张路径数 | 8（4 层 × 填充 + 高光） ✅ |
| 桌面 1440×900 横向溢出 | `false` ✅ |
| 折叠按钮可点 | `true` ✅ |
| 剪一刀按钮可点 | `true` ✅ |
| 展开按钮可点 | `true` ✅ |
| 出现判定文案 | `true` ✅ |
| 手机 390×844 横向溢出 | `false` ✅ |
| 手机切线手柄数 | 1（中点手柄）+ 2 端点 ✅ |
| 控制台错误 | `[]` ✅ |

- 截图：`.artifacts/01-home-desktop.png` … `09-puzzle-mobile-folded.png`
- 结果：**通过**（无 console error / 未捕获异常）。

### 已知问题

- 关卡页在 900px 高的桌面视口下需要滚动才能看到"当前折叠方案"信息卡；
  主操作按钮在首屏内可见，不影响通关。
- `tools/ui_check.py` 中的 `iouText` 正则未取到数值（DOM 结构变化），
  判定文案已通过 `innerText` 命中；**该正则失效不影响结论**，后续修正。

---

## 未执行（如实记录）

| 项 | 原因 |
|---|---|
| Playwright 多浏览器 E2E | 未安装；改用 Edge CDP 脚本覆盖同等场景 |
| 真机 iOS / Android 测试 | 无设备；以 390×844 视口 + 触控事件模拟代替 |
| Lighthouse 性能评分 | 未执行 |
| 无障碍自动化扫描（axe） | 未执行；仅做人工焦点与对比度检查 |

---

## 2026-10-30 · Milestone 2（可玩关卡 + 生产构建核验）

### T5 生产构建端到端（不是开发服务器）

```bash
npm run build
npx vite preview --port 4173 --strictPort
python tools/ui_check.py --url http://localhost:4173/ --out ./.artifacts-prod
```

结果（真实 `report.json`）：

| 检查 | 结果 |
|---|---|
| `GET /` | `200` ✅ |
| 首页标题 / h1 | `Foldyssey · 一刀万象` / `一刀万象` ✅ |
| 折叠 → 剪 → 展开 三个按钮均可点 | ✅ |
| **拖动切线中点手柄改变偏移** | `1.200 → 1.061` ✅ |
| **按标准解（45°, 1.095, 正侧）通关** | 判定 `完全吻合` ✅ |
| 桌面 1440×900 横向溢出 | `false` ✅ |
| 手机 390×844 横向溢出 | `false` ✅ |
| 控制台错误 | `[]` ✅ |

> 这是关键证据：关卡**可以通过真实 UI 被解开**，不是只有单元测试里的数学断言。

### T6 WorkBuddy 公开发布

```text
DeferExecuteTool: workbuddy_sites_deploy
→ Tool "workbuddy_sites_deploy" is not available in the current environment or configuration.
```

- 结果：**受阻**。当前会话没有该部署工具，无法创建公开链接。
- 处理：如实记录，不虚构 URL；见 `docs/DEPLOYMENT.md` §3。

### 已知问题（M2）

- 判定出现时页面会自动滚动使结果卡进入视口；在极矮视口（<600px 高）下滚动幅度较大。
- 关卡页在 1440×900 下需要滚动才能同时看到纸与"几何读数"卡片，主操作始终可见。

---

## 2026-10-30 · Milestone 3（工坊 / 作品集 / 数学页）

### T7 单元测试（新增）

```bash
npm test
```

```
✓ src/tests/geometry.test.ts (22 tests)
✓ src/tests/levels.test.ts (23 tests)
✓ src/tests/studio.test.ts (12 tests)

Test Files  3 passed (3)
     Tests  57 passed (57)
```

`studio.test.ts` 覆盖：作品保存→列表→重新载入、篡改缓存后仍按参数重算、
非法 schemaVersion 拒绝、非法切线被过滤、复制/删除、`createdAt` 保留、
localStorage 垃圾数据不崩溃、SVG 导出（2 个子路径 + evenodd + 标题转义 + 无外链）、
透明底、文件名规则、4 套预设几何有效、菱形花环确实是环。

### T8 浏览器端到端（工坊 + 作品集 + 数学页）

```bash
python tools/ui_check.py --url http://localhost:5173/ --out ./.artifacts
```

| 检查 | 结果 |
|---|---|
| 工坊预览路径数 | 36 ✅ |
| 点「加一刀」后切线数 | `2 → 3` ✅ |
| 点「保存作品」 | localStorage 出现 `foldyssey.gallery.v1` ✅ |
| 点「导出 SVG」 | 触发下载、无异常 ✅ |
| 工坊剩余面积读数 | `1.3505`（实时） ✅ |
| 作品集卡片数 / 缩略图 | 1 / 3 条 path（含按钮图标） ✅ |
| 数学页卡片 / 实验 SVG | 6 / 6 ✅ |
| About 含「没有调用任何大模型」 | `true` ✅ |
| 控制台错误 | `[]` ✅ |

截图：`.artifacts/06-studio.png`、`06b-studio-added.png`、`06c-gallery.png`、
`07-explore.png`、`07b-about.png`。

### 已知问题（M3）

- PNG 导出在无头浏览器中无法自动校验文件内容（下载目录不可控），
  仅验证点击不抛错；SVG 导出已用字符串断言覆盖。
- 工坊左栏在「正交双折」下只占四分之一画面，靠浅网格与虚线原始轮廓提供空间参照。
- 未做 axe 无障碍扫描；仅人工检查焦点与标签。
