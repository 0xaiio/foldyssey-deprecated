# 项目状态（PROJECT_STATUS）

> 给"下一次接着干的自己 / 下一个模型"看的交接文档。
> 上下文被压缩、模型被切换、任务被中断时，**先读这份文件，再读 `git status` 与 `git diff`**，不要凭记忆重建已完成模块。

## 快照

| 项 | 值 |
|---|---|
| 当前里程碑 | **M1 几何内核 + 黄金闭环** |
| 分支 | `main` |
| 最近提交 | 见 `git log -3 --oneline` |
| 构建 | ✅ `npm run build` |
| 测试 | ✅ 45/45（`npm test`） |
| 发布地址 | ⬜ 尚未发布（M2） |
| 技术栈 | React 19 · TypeScript 7 · Vite 8 · Tailwind 4 · polygon-clipping · Vitest |

## 已通过的能力

- **几何内核**：四种固定折法、逐层半平面裁剪、逆映射展开、IoU 评分、SVG 路径（含孔洞）
- **黄金样例**：正交双折 + `u+v<d` → `|x|+|y|<d`，面积 `2d²`，四重镜像对称，误差 < 1e-9
- **六个关卡数据**：目标由标准解正向构造，逐关自动验证可通关
- **首页实时动画**：折叠 → 剪切 → 展开，逐帧来自引擎，支持 `prefers-reduced-motion`
- 品牌外壳与路由；文档体系（含 GEOMETRY_SPEC / TESTING / TEST_REPORT）

## 未完成 / 失败项

| 项 | 现状 | 下一步 |
|---|---|---|
| 可玩关卡 UI | 占位页 | M2：状态机、切线交互、评分面板 |
| 工坊 / 作品集 / 数学页 | 占位页 | M3 |
| 公开链接 | 无 | M2 首次发布 |
| 运行时 AI | 未实现 | 见 `docs/ASSUMPTIONS.md` A-001 |
| Playwright / 真机 | 未执行 | 以 Edge CDP + 视口模拟代替 |

## 重要领域约定（改动前必读）

1. **坐标**：模型空间 y 向上，纸为 `[-1,1]²`；SVG 用 `scale(1,-1)` 翻转。
2. **`Patch.source` 永远是原始纸面上的区域**；`transform` 把它送到折叠位置；**展开 = `source` 的并集**（不要再乘 transform）。
3. **剪切 = 半平面移除**，逐层裁剪后经逆变换回到 `source` 坐标系。
4. **折叠顺序不可丢**：`Patch.history` 是动画与复现的唯一依据。
5. **`StraightCut.offset` 是直线到纸心的有符号距离**（法向量已归一化），
   与 `x+y=d` 里的 `d` 差 `√2` 倍。UI 滑块显示的是**距离**。
6. **层序**：折叠时翻过去的一组落在栈顶且内部顺序反转。

## 下个阶段的入口

```bash
# 入口文件
src/geometry/fold.ts        # 折叠分区（buildFoldState）
src/geometry/cut.ts         # applyCut / foldCutUnfold
src/components/PaperStage.tsx  # 渲染 + 切线交互（含 lineSegmentInSquare）
src/puzzle/levels.ts        # 6 关数据
src/pages/Puzzle.tsx        # 待替换为真实关卡页

# 命令
npm run dev      # http://localhost:5173（不要用 127.0.0.1）
npm test
npm run build
python tools/ui_check.py --url http://localhost:5173/ --out ./.artifacts
```

## 待用户授权 / 需要人工完成

- [ ] WorkBuddy 网站应用发布（需要账号授权与应用创建）
- [ ] 赛事表单的身份、联系方式与授权项
