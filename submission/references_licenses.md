# 参考来源与素材许可（References & Licenses）

## 一、研究灵感（仅思想启发，未使用其素材）

| 来源 | 用途 | 使用方式 | 备注 |
|---|---|---|---|
| Erik Demaine — The Fold-and-Cut Problem · https://erikdemaine.org/foldcut/ | 理解"一般平折 + 一刀直线"的定理与其适用条件 | 阅读公开页面，独立实现几何引擎 | 未使用其图片、插图、谜题、源码 |
| Erik & Martin Demaine — Simple Fold & Cut Font · https://erikdemaine.org/fonts/simplefoldcut/ | 了解"用折叠简化切割路径"的思路 | 仅阅读 | 未复制字体或字形 |
| Erik & Martin Demaine — SoCG 2026 folding puzzle · https://erikdemaine.org/puzzles/SoCG2026/ | 了解折叠谜题的题目组织方式 | 仅阅读 | 未复制谜题 |
| MIT 相关 computational origami 课程资料 | 背景知识 | 仅阅读 | 未复制讲义 |

### 声明

本项目**不是** MIT 官方产品，与 Erik Demaine、Martin Demaine 及其合作者**无合作、无背书关系**。
所有关卡、文案、视觉与几何实现均为独立创作。

## 二、第三方代码依赖

| 依赖 | 版本 | 许可证 | 用途 | 是否修改 |
|---|---|---|---|---|
| react / react-dom | 19.3.1 | MIT | UI 渲染 | 否 |
| polygon-clipping | 0.15.7 | MIT | 多边形布尔运算（union / intersection / difference / xor） | 否（仅在 `src/geometry/ops.ts` 外包一层防御与降级） |
| motion | 14.8.0 | MIT | UI 微交互与页面过渡 | 否 |
| vite | 8.3.5 | MIT | 构建与开发服务器 | 否 |
| @vitejs/plugin-react | 6.1.2 | MIT | React 编译 | 否 |
| typescript | 7.0.2 | Apache-2.0 | 类型系统 | 否 |
| tailwindcss / @tailwindcss/vite | 4.3.3 | MIT | 样式工具链 | 否 |
| vitest | 5.0.5 | MIT | 单元测试 | 否 |
| jsdom | 30.1.3 | MIT | 测试环境 | 否 |

> `polygon-clipping` 的定位是**布尔运算内核**，不是折纸引擎。折叠分区、层序、逆映射、
> 剪切语义与评分全部由本项目实现（见 `docs/GEOMETRY_SPEC.md`）。

## 三、字体与图像

| 资源 | 来源 | 许可 |
|---|---|---|
| 中文字体 | 系统字体栈（Songti SC / STSong / PingFang SC / Microsoft YaHei / SimSun） | 随操作系统授权，**未打包、未分发字体文件** |
| 拉丁衬线 | 系统 Georgia / serif | 同上 |
| 图标 | 手写 SVG 路径，位于 `src/components/ui.tsx` | 本项目原创 |
| favicon / 品牌图形 | 本项目原创（`public/favicon.svg`） | 本项目原创 |
| 纸张纹理 | 纯 CSS 渐变与重复线性渐变，无位图 | 本项目原创 |
| 截图 | 由 `tools/ui_check.py` 在真实浏览器中捕获 | 本项目原创 |

**没有使用任何第三方图片、纹理、插画、音乐或 3D 模型。**

## 四、本项目代码的许可

本仓库**尚未选择开源许可证**，版权归作者所有，保留一切权利。
选择许可证是版权所有者的决定，不由代理代选。

若未来需要开源，候选方案见下（供所有者决策，尚未生效）：

| 方案 | 适用场景 | 影响 |
|---|---|---|
| MIT | 希望被广泛复用、二次创作 | 允许商用与闭源衍生，需保留版权声明 |
| Apache-2.0 | 希望被企业采用 | 额外含专利授权条款 |
| CC BY-NC-SA 4.0 | 只允许非商业使用 | 不是软件许可证，不建议用于代码 |

## 五、引用规范

若在文章、演示或答辩中引用本项目，建议使用：

```
Foldyssey（一刀万象）· Computational Paper Art Lab · 2026
https://github.com/0xaiio/foldyssey
```

若引用 Fold-and-Cut 定理本身，请直接引用 Erik Demaine 等人的原始工作，而不是本项目。
