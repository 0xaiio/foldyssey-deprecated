# 开发指南（DEVELOPMENT）

## 环境

| 项 | 版本（实测） |
|---|---|
| Node.js | v22.22.2 |
| npm | 10.9.7 |
| OS | Windows 11（Git Bash 作为 shell） |
| 浏览器（验证） | Microsoft Edge（headless + CDP） |

依赖版本以 `package-lock.json` 为准：

| 包 | 版本 | 说明 |
|---|---|---|
| react / react-dom | 19.3.x | UI |
| vite | 8.3.x | 构建与开发服务器 |
| typescript | 7.0.x | 类型检查 |
| tailwindcss + @tailwindcss/vite | 4.3.x | 样式（`@theme` 令牌） |
| polygon-clipping | 0.15.7 | 多边形布尔运算 |
| motion | 14.8.x | UI 微交互 |
| vitest | 5.0.x | 单元测试 |

## 常用命令

```bash
npm install          # 安装依赖
npm run dev          # 开发服务器（默认 http://localhost:5173）
npm run build        # tsc -b && vite build
npm run preview      # 预览生产构建
npm test             # vitest run
npm run test:watch   # vitest 监听
npx tsc --noEmit     # 只做类型检查
```

> 注意：本机 Vite 默认只监听 `::1`（IPv6 localhost）。浏览器请用 `http://localhost:5173/`，
> 用 `http://127.0.0.1:5173/` 会连接失败。

## 代码约定

- **几何代码是纯函数**：不 import React，不读写 DOM，不访问 localStorage。
- **单位与坐标**：模型坐标 y 向上，纸为 `[-1,1]²`。渲染翻转集中在两处：`PaperStage` 与 `services/export`。
- **不要新增"结果状态"**：任何图案都必须能从 `Patch[]` 或 `Artwork` 文档重新算出。
- **类型**：禁止用 `unknown` 或 `any` 替代核心几何结构；外部输入（localStorage、URL 参数）先校验再使用。
- **命名**：几何文件用数学词汇（`reflect`, `offset`, `removal`），UI 文件用产品词汇（`stage`, `cut`, `reveal`）。
- **提交前必过**：`npx tsc --noEmit && npm test && npm run build`。

## 目录约定

```text
src/geometry/   纯数学，无副作用
src/puzzle/     关卡数据（构建时由引擎生成 target）
src/studio/     工坊文档与预设
src/services/   副作用边界（存储、下载）
src/components/ 可复用渲染组件
src/pages/      路由页面
src/tests/      *.test.ts
tools/          本地验证脚本（浏览器 CDP、截图）
```

## 调试入口

- **几何问题**：写一个临时 Vitest 用例打印面积/顶点，比在浏览器里看更快。
  ```ts
  console.log(JSON.stringify(foldCutUnfold(PAPER, 'orthogonal2', [cut]).unfolded));
  ```
- **渲染问题**：在 `PaperStage` 里给 `<g>` 加 `data-patch={patch.id}`，再在 CDP 中查询。
- **触控坐标问题**：确认 `svg.getScreenCTM()` 非空；若 SVG 被 `display:none` 隐藏会返回 `null`。

## 已知环境坑

1. Vite 只绑 `::1`：用 `localhost` 而不是 `127.0.0.1`。
2. 后台进程：用工具的 `run_in_background`，不要 `nohup ... &`，否则进程会被回收。
3. `polygon-clipping` 是**默认导出**（`import polygonClipping from 'polygon-clipping'`），
   类型声明却写成命名导出；运行时用默认导出，类型用自建包装。
4. Vitest 5 移除了 `environmentMatchGlobs`，统一用单独的 `vitest.config.ts`。
