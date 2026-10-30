# 项目状态（PROJECT_STATUS）

> 给"下一次接着干的自己 / 下一个模型"看的交接文档。
> 上下文被压缩、模型被切换、任务被中断时，**先读这份文件，再读 `git status` 与 `git diff`**，不要凭记忆重建已完成模块。

## 快照

| 项 | 值 |
|---|---|
| 当前里程碑 | **M0 工程基线** |
| 分支 | `main` |
| 最近提交 | 见 `git log -3 --oneline` |
| 构建 | ✅ `npm run build` 通过 |
| 测试 | ⬜ 尚未建立（M1 引入） |
| 发布地址 | ⬜ 尚未发布 |
| 技术栈 | React 19 · TypeScript 7 · Vite 8 · Tailwind 4 · polygon-clipping · Vitest |

## 已通过的能力

- 品牌外壳：首页、导航、页脚、中文排版、纸感背景与色彩令牌
- 路由：`#/`、`#/puzzle`、`#/studio`、`#/gallery`、`#/explore`、`#/about`
- 构建链路：类型检查 + Vite 生产构建
- 文档体系：README、INDEX、REQUIREMENTS、ARCHITECTURE、ASSUMPTIONS、DEVELOPMENT、GITHUB_WORKFLOW、SECURITY、TASKS、本文件

## 未完成 / 失败项

| 项 | 现状 | 下一步 |
|---|---|---|
| 几何引擎 | 未提交（工作区有实现） | 完成黄金测试后提交 M1 |
| 可玩关卡 | 占位页 | M2 |
| 工坊 / 作品集 / 数学页 | 占位页 | M3 |
| 公开链接 | 无 | M2 首次发布 |
| 运行时 AI | 未实现 | 见 `docs/ASSUMPTIONS.md` A-001 |

## 重要领域约定（改动前必读）

1. **坐标**：模型空间 y 向上，纸为 `[-1,1]²`；SVG 用 `scale(1,-1)` 翻转。
2. **`Patch.source` 永远是原始纸面上的区域**；`transform` 把它送到折叠位置；展开 = `source` 的并集。
3. **剪切 = 半平面移除**，逐层裁剪后经逆变换回到 `source` 坐标系。
4. **折叠顺序不可丢**：`Patch.history` 是动画与复现的唯一依据。
5. **单刀距离语义**：`StraightCut.offset` 是直线到纸心的**有符号距离**（法向量已归一化），
   不是 `x+y=d` 里的 `d`（两者差 `√2` 倍）。

## 下个阶段的入口

```bash
# 入口文件
src/geometry/fold.ts     # 折叠分区
src/geometry/cut.ts      # 半刀裁剪与展开
src/tests/geometry.test.ts
src/pages/Puzzle.tsx

# 命令
npm run dev      # http://localhost:5173 （注意不要用 127.0.0.1）
npm test
npm run build
```

## 待用户授权 / 需要人工完成

- [ ] WorkBuddy 网站应用发布（需要账号授权与应用创建）
- [ ] GitHub 首次推送（需要仓库写权限）
- [ ] 赛事表单的身份、联系方式与授权项
