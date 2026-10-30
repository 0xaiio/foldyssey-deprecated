# 安全与隐私（SECURITY）

## 密钥

- 仓库内**不存在**任何 API Key、令牌、私钥。
- `.env.example` 只含占位符；`.env`、`.env.local`、`*.pem`、`*.key` 已在 `.gitignore`。
- 运行时 AI **未接入**，因此客户端没有需要保护的模型凭据。若未来接入，必须走服务端代理，
  密钥只存在于服务端环境变量，绝不进入前端 bundle。

## 数据

| 数据 | 存放位置 | 是否上传 |
|---|---|---|
| 作品（折叠方案 + 切线参数 + 配色） | `localStorage: foldyssey.gallery.v1` | 否 |
| 关卡进度（尝试次数、最佳 IoU） | `localStorage: foldyssey.progress.v1` | 否 |
| 用户输入的标题 | 同上 | 否 |

- 无账号、无埋点、无第三方脚本、无 Cookie 追踪。
- 作品只保存**结构化参数**与一份派生路径缓存，不保存位图。
- 删除路径：清空站点数据即可；UI 也提供单件删除。

## 输入校验

- `localStorage` 读取：逐字段类型 + 枚举 + 正则（颜色 `#RRGGBB`）校验，非法条目丢弃。
- `Artwork.schemaVersion` 高于当前版本 → 拒绝载入（不猜测未来格式）。
- 切口参数：`validateCut` 拒绝非有限数、零法向量、非法 `removedSide`，并把法向量归一化。
- 导出 SVG：标题经 XML 转义（`& < > " '`），路径数据全部由数值生成，不拼接用户字符串。

## 渲染安全

- 不使用 `dangerouslySetInnerHTML`，不注入任意 SVG 字符串。
- 所有图形由 React 元素 + 数值属性生成，天然免疫标签注入。

## 第三方依赖

| 依赖 | 许可证 | 用途 |
|---|---|---|
| polygon-clipping | MIT | 多边形布尔运算 |
| react / react-dom | MIT | UI |
| motion | MIT | 动画（UI 层） |
| vite / vitest / typescript / tailwindcss | MIT | 构建与测试 |

- `npm audit` 在安装时报告 0 vulnerabilities（2026-10-30）。
- 不引入需要联网的运行时资源：字体用系统字体，无 CDN 依赖。

## 已知风险

| 风险 | 影响 | 缓解 |
|---|---|---|
| 浏览器清理数据导致作品丢失 | 用户创作丢失 | UI 提示 + SVG 导出留档 |
| localStorage 容量上限（~5MB） | 保存失败 | `saveArtwork` 返回 `ok:false` 并提示 |
| 隐私模式下 localStorage 不可用 | 无法保存 | 降级到内存存储并提示 |
| 极端参数导致布尔运算退化 | 渲染异常 | 输入清洗 + 降级 + 失败计数 |

## 漏洞披露

本项目为参赛作品，无生产用户数据。如发现安全问题，请通过仓库 Issue 反馈，不要公开利用细节。
