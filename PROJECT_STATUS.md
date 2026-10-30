# 项目状态（PROJECT_STATUS）

> 交接文档。上下文被压缩、模型被切换、任务被中断时，**先读这份文件与 `TASKS.md`，再看 `git status`**，
> 不要凭记忆重建已完成模块。

## 快照

| 项 | 值 |
|---|---|
| 当前里程碑 | **M4 收尾（投稿材料已备，公开发布受阻）** |
| 分支 | `main`（已推送，`git ls-remote` 与本地 HEAD 一致） |
| 构建 | ✅ `npm run build` |
| 测试 | ✅ 57/57（`npm test`） |
| 关卡通关 | ✅ 6/6（真实浏览器，IoU 0.9996–1.0000） |
| 发布地址 | ⛔ **无**：本会话无 `workbuddy_sites_deploy` |
| 技术栈 | React 19 · TypeScript 7 · Vite 8 · Tailwind 4 · polygon-clipping · Vitest |

## 已交付

| 模块 | 状态 |
|---|---|
| 几何内核（折/剪/展/评分/路径） | ✅ 完整，45 条几何与关卡断言 |
| 一刀挑战（6 关 + 七态状态机 + 判定 + 提示 + 进度） | ✅ 完整 |
| 剪纸工坊（多刀 + 撤销重做 + 预设 + 配色 + SVG/PNG + 制作卡） | ✅ 完整 |
| 我的作品（本地增删改查） | ✅ 完整 |
| 纸艺中的数学（4 个实验 + 定理卡） | ✅ 完整 |
| 关于（能力边界 + AI 披露 + 致谢） | ✅ 完整 |
| 文档体系（16 份） | ✅ 完整 |
| 投稿材料（9 份 + 9 张真实截图） | ✅ 完整 |
| 运行时 AI | ⛔ 未实现（有意为之） |
| 公开发布 | ⛔ 受阻 |

## 关键领域约定（改动前必读）

1. **坐标**：模型空间 y 向上，纸为 `[-1,1]²`；SVG 用 `scale(1,-1)` 翻转；指针经 `getScreenCTM()` 逆变换再取负 y。
2. **`Patch.source` 永远是原始纸面上的区域**；**展开 = 各层 `source` 的并集**，绝不能再乘一次 `transform`。
3. **剪切 = 半平面移除**：`D_i = f_i(P_i) ∩ H⁻`，`P_i' = P_i \ f_i⁻¹(D_i)`。
4. **`Patch.history` 不可丢**：动画、复现、手工制作卡都依赖它。
5. **`StraightCut.offset` 是直线到纸心的有符号距离**（法向量已归一化），与 `x+y=d` 里的 `d` 差 `√2` 倍。
6. **状态机**：`revealed` 必须对应 `anim = 0`（完全展开）；写成默认 `setAnim(1)` 会让纸永远停在纸包状态。
7. **展开完成后用合并后的单一多边形渲染**，否则四条折痕会出现可见接缝。

## 下一步（如果继续）

1. **发布**：在 WorkBuddy 内执行「代码开发 → 网站开发 → 发布」，把链接写入 `submission/publish_verification.md`，按其中清单核验。
2. 录制 60 秒演示视频（脚本已备）。
3. 真机 iOS/Android 冒烟测试。
4. 若要加 AI：先搭服务端代理，按 `docs/AI_INTEGRATION.md` §3 实现，**不要让密钥进前端**。

## 命令

```bash
npm run dev      # http://localhost:5173（不要用 127.0.0.1）
npm test
npm run build
npx vite preview --port 4173
python tools/ui_check.py   --url http://localhost:5173/ --out ./.artifacts
python tools/level_check.py --url http://localhost:5173/ --out ./.artifacts
```

## 待用户完成

- [ ] WorkBuddy 公开发布（需要账号授权）
- [ ] 赛事表单：姓名、手机号、邮箱、参赛声明
- [ ] 演示视频录制
