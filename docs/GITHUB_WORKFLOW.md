# Git 与 GitHub 工作流（GITHUB_WORKFLOW）

## 仓库

- 本地：`D:/code-repo/foldyssey`
- 远程：`https://github.com/0xaiio/foldyssey.git`（`origin`）
- 主分支：`main`（单人项目，不加额外分支；如需并行实验用 `feature/<topic>`）

## 初始化（已执行，留档备查）

```bash
git init -b main
git remote add origin https://github.com/0xaiio/foldyssey.git
git ls-remote --heads https://github.com/0xaiio/foldyssey.git   # 确认远程状态
```

> 远程为空仓库（无分支）时，首次 `git push -u origin main` 会创建 `main`。
> 若远程已有历史，**先 fetch 再合并**，禁止 `push --force` / `reset --hard`。

## 提交规范（Conventional Commits）

```text
<type>(<scope>): <subject>

type: feat | fix | docs | test | chore | refactor | perf | build | ci
scope: repo | geometry | game | studio | gallery | explore | release | docs
```

示例：

```text
chore(repo): initialize Foldyssey app and engineering docs
feat(geometry): implement validated fold-cut-unfold diamond case
feat(game): add playable puzzle flow and scoring
feat(studio): implement editable papercut studio and SVG export
chore(release): verify published app and prepare contest submission
```

## 提交前检查单

1. `git status` —— 确认没有 `node_modules/`、`dist/`、`.env`、临时截图、个人数据。
2. `npx tsc --noEmit` —— 类型必须干净。
3. `npm test` —— 全绿。
4. `npm run build` —— 生产构建通过。
5. 更新 `TASKS.md` / `PROJECT_STATUS.md` / `CHANGELOG.md` 与相关设计文档。
6. `git diff --cached` 人工过一遍。
7. `git commit -m "..."`，然后 `git rev-parse HEAD` 记录**完整 SHA**。

## 里程碑记录

每个里程碑在 `TASKS.md` 的表格里登记：

| 里程碑 | 摘要 | Commit SHA | 分支 | 测试 | 文档 | Push |
|---|---|---|---|---|---|---|

**本地提交成功 ≠ 推送成功 ≠ 发布成功**，三者分别记录、分别验证。

## 冲突处理

- 先 `git fetch origin`，看差异再决定 merge 还是 rebase。
- 冲突时保留双方的工作成果，手工合并后再跑测试。
- 禁止为了"快"而 `push --force`、`git clean -fd`、`git reset --hard`。

## 凭据

- 使用系统凭据管理器或 `gh auth login`，**不要**把 PAT/密码/私钥写进聊天、提交、代码或 `.env`。
- `.env.example` 只放占位符；`.env*` 已在 `.gitignore` 中。
