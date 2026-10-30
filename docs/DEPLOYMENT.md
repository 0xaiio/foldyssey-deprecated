# 发布与回滚（DEPLOYMENT）

> 目标：把 `dist/` 变成**公开 HTTPS 链接**，并证明未登录用户能从首页玩到通关。
> **本地预览成功不等于线上已更新**——两者必须分别记录。

---

## 1. 构建产物

```bash
npm ci          # 或 npm install
npm run build   # tsc -b && vite build
```

产物在 `dist/`：

| 文件 | 说明 |
|---|---|
| `dist/index.html` | 入口，`base: './'` 相对路径，可挂在任意子路径下 |
| `dist/assets/*.js` | 单页应用（React + 几何引擎），约 310 kB / gzip 98 kB |
| `dist/assets/*.css` | Tailwind 产物，约 34 kB / gzip 7 kB |
| `dist/favicon.svg` | 品牌图标 |

纯静态、无服务端、无环境变量、无外部请求（字体用系统字体）。
因此可以部署到任意静态托管：WorkBuddy 网站应用、对象存储、Nginx、GitHub Pages。

### 本地核验生产构建

```bash
npx vite preview --port 4173 --strictPort
# 打开 http://localhost:4173/
```

> Vite 只监听 `::1`，请用 `localhost` 而不是 `127.0.0.1`。

## 2. WorkBuddy 网站应用发布流程（预期路径）

1. 在 WorkBuddy 选择 **代码开发 → 网站开发**，工作目录指向本项目根目录。
2. 预览确认首页、关卡、工坊可用。
3. 执行**发布**，得到一个公开 HTTPS 分享链接。
4. 用**无痕窗口 / 未登录状态**打开该链接，从首页进入第 1 关并通关。
5. 后续任何改动都要再次执行**更新发布**（链接不变，内容更新），然后重新核验同一链接。

## 3. 当前发布状态（真实）

| 项 | 状态 | 证据 |
|---|---|---|
| 生产构建 | ✅ 通过 | `npm run build`，见 `TEST_REPORT.md` |
| 生产构建本地服务 | ✅ 通过 | `vite preview` + `tools/ui_check.py` 全流程通关，`errors: []` |
| WorkBuddy 公开链接 | **受阻** | 本会话无 `workbuddy_sites_deploy` 工具 |

### 阻塞详情

尝试调用发布工具时返回：

```
Tool "workbuddy_sites_deploy" is not available in the current environment or configuration.
```

当前会话可用的工具集中不存在该部署工具（仅有 `workbuddy_miniprogram_scaffold`），
因此**无法在本会话内创建公开链接**。按项目规范，此处如实记为「受阻」，
不虚构 URL，也不用 `localhost` 冒充公开地址。

### 需要用户执行的动作

1. 在 WorkBuddy 中打开本工作区（`D:/code-repo/foldyssey`）。
2. 进入 **代码开发 → 网站开发**，选择发布；首次发布会创建应用并返回分享链接。
3. 把链接填入 `submission/publish_verification.md` 的「正式 URL」一栏。
4. 若界面提示需要登录或授权，按提示完成——这一步无法由代理代替。

## 4. 回滚

- **代码**：`git revert <sha>` 或在发布面板回退到上一个成功发布的版本；不使用 `push --force`。
- **内容**：重新执行一次「更新发布」，链接不变。
- **数据**：作品与进度都在用户浏览器的 localStorage，服务端无状态，回滚不影响用户数据。

## 5. 线上核验清单

| # | 检查 | 方法 |
|---|---|---|
| 1 | 链接可打开（未登录） | 无痕窗口直接访问 |
| 2 | 首页渲染正确 | 标题 `Foldyssey · 一刀万象`，主视觉为纸 |
| 3 | 关卡可玩 | 折叠 → 剪 → 展开 → 出现判定 |
| 4 | 工坊可导出 | 导出 SVG，用矢量软件打开确认孔洞 |
| 5 | 移动端 | 手机或 390×844 视口 |
| 6 | 控制台 | 无 error |
| 7 | 版本一致 | 页面内容与当前 `main` 的 `dist` 一致 |

## 6. 已知限制

- 应用为纯前端，首次加载需要下载约 98 kB（gzip）JS；无图片资源。
- 无 Service Worker，离线打开需要浏览器缓存命中。
- 作品保存在浏览器本地，换设备不会同步（设计如此）。
