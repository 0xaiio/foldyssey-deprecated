# 发布与线上验证（Publish Verification）

> 规则：**没有真实链接就不写链接**。本地预览、`localhost`、预览面板地址都不算公开地址。

## 结论

| 项 | 结果 |
|---|---|
| 生产构建 | ✅ 通过 |
| 生产构建本地服务 + 真实浏览器全流程 | ✅ 通过（折叠 → 拖拽 → 修参数 → 展开 → 判定"完全吻合"） |
| WorkBuddy 公开发布 | ⛔ **受阻**，未取得公开链接 |
| 未登录访问验证 | ⛔ 无法执行（无链接） |

## 正式 URL

```
（待填写 —— 本会话未能发布）
```

## 阻塞原因（真实错误）

尝试调用部署工具时返回：

```
Tool "workbuddy_sites_deploy" is not available in the current environment or configuration.
```

当前会话的工具集中不存在该部署能力（仅有 `workbuddy_miniprogram_scaffold`）。
按项目规范，此处如实记为「受阻」，**不虚构 URL，也不用本地地址冒充**。

## 已完成的替代验证

### 1. 生产构建

```bash
npm run build
# dist/index.html 1.15 kB / dist/assets/*.js 353.96 kB (gzip 109.80 kB)
# dist/assets/*.css 39.58 kB (gzip 8.11 kB)
```

### 2. 以生产产物启动本地服务并驱动真实交互

```bash
npx vite preview --port 4173 --strictPort
python tools/ui_check.py --url http://localhost:4173/ --out ./.artifacts-prod
```

| 检查 | 结果 |
|---|---|
| `GET /` | 200 |
| 首页标题 | `Foldyssey · 一刀万象` |
| 折叠 / 剪 / 展开 | 三个按钮均可点击并推进状态 |
| 拖动切线中点 | 偏移 1.200 → 1.061 |
| 按标准解通关 | 判定「完全吻合」 |
| 1440×900 横向溢出 | false |
| 390×844 横向溢出 | false |
| 控制台错误 | `[]` |

### 3. 六关逐关通关（开发服务器 + 生产构建均验证过开发侧）

```bash
python tools/level_check.py --url http://localhost:5173/ --out ./.artifacts
```

```
corner-first          完全吻合  IoU 1.0000
mirror-gate           完全吻合  IoU 0.9997
diamond-miracle       完全吻合  IoU 0.9998
size-riddle           完全吻合  IoU 0.9996
angle-riddle          完全吻合  IoU 1.0000
diamond-from-square   完全吻合  IoU 0.9997
allPerfect: true      errors: []
```

## 需要用户完成的动作

1. 在 WorkBuddy 打开本工作区（`D:/code-repo/foldyssey`）。
2. 选择 **代码开发 → 网站开发**，执行发布（首次发布会创建应用并返回分享链接）。
3. 如提示登录/授权，按界面完成。
4. 把得到的 HTTPS 链接填到上面的「正式 URL」。
5. 用**无痕窗口**打开该链接，按下面的清单逐项打勾。

## 线上核验清单（拿到链接后执行）

| # | 检查 | 方法 | 结果 |
|---|---|---|---|
| 1 | 未登录可打开 | 无痕窗口直接访问 | 待执行 |
| 2 | 标题正确 | 标签页显示 `Foldyssey · 一刀万象` | 待执行 |
| 3 | 首页主视觉 | 红纸 + 中心菱形孔洞 | 待执行 |
| 4 | 进入第 1 关并通关 | 折叠 → 剪 → 展开 → 判定 | 待执行 |
| 5 | 第 3 关黄金菱形 | 同上 | 待执行 |
| 6 | 工坊导出 SVG | 下载后打开，孔洞为空 | 待执行 |
| 7 | 手机访问 | 390 宽视口，无横向滚动 | 待执行 |
| 8 | 控制台 | 无 error | 待执行 |
| 9 | 更新发布 | 改一处文案后重新发布，链接不变、内容更新 | 待执行 |

## 更新发布提醒

WorkBuddy 的线上版本**不会自动跟随本地修改**。任何改动后必须再次执行「更新发布」，
链接保持不变，然后重新核验同一链接。仅在预览面板里看到新版本 ≠ 线上已更新。
