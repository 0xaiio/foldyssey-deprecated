# Foldyssey · 一刀万象

> **Fold. Snip. Unfold. Wow!**
> 一张纸，千种可能；一把剪刀，万象展开。

一座可以玩的数字折剪纸实验室。折一次、剪一刀、再展开 —— 你看到的图案不是画上去的，而是由计算几何算出来的。

- 中文名：**一刀万象**
- 英文名：**Foldyssey**（Fold + Odyssey）
- 学术副标题：Computational Paper Art Lab

---

## 现在能做什么

> 本节只描述**已经实现并验证**的能力。计划中的功能见 [Roadmap](#roadmap)。

- **一刀挑战（6 关）**：四种已验证折法、单条直线切口、逐层展开动画、
  目标对照、几何判定（IoU）、差异可视化、三级提示、本地进度。
- **黄金样例**：正交双折 + 剪去纸包内角 → 中心菱形孔洞，面积 `2d²`，
  四重镜像对称，误差 < 1e-9，由 22 条数学断言锁死。
- **剪纸工坊**：折叠纸包编辑 + 实时展开预览、多刀叠加、撤销/重做、
  4 套美学预设、自定义配色、SVG / PNG 导出、手工制作卡。
- **我的作品**：本地作品集，可再次编辑、复制、导出、删除。
- **纸艺中的数学**：5 张可交互卡片（镜像、折叠、层叠原像、一刀的边界、Fold-and-Cut 定理）。
- **移动端**：390px 可用，切线可拖动，无横向溢出。

**运行时不含任何 AI 调用**：没有入口、没有密钥、没有网络请求。原因见
[`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md)。

## 快速开始

```bash
npm install
npm run dev        # http://localhost:5173（Vite 只监听 ::1，请用 localhost）
npm run build      # 生产构建（tsc + vite build）
npm test           # Vitest：57 条断言
npx vite preview --port 4173   # 预览生产构建
```

浏览器端到端检查（Edge headless + CDP，含截图与通关验证）：

```bash
python tools/ui_check.py --url http://localhost:5173/ --out ./.artifacts
```

要求 Node.js ≥ 20。

## 项目结构

```text
src/
├─ app/          # 路由与应用外壳
├─ components/   # 品牌 UI、纸张渲染、动画
├─ geometry/     # 点/多边形/变换/折叠/裁剪/展开/评分（纯函数，无 React）
├─ puzzle/       # 关卡定义、评分、进度
├─ studio/       # 工坊数据模型、美学预设、作品文档
├─ services/     # 本地存储、导出
├─ pages/        # 首页 / 挑战 / 工坊 / 作品 / 数学 / 关于
└─ tests/        # 数学与集成测试
```

## 设计原则

1. **数学正确优先**：最终纸形必须来自明确的几何运算；动画只描述过程，不构造第二套结果状态。
2. **一刀就是一刀**：一次剪切 = 折叠纸包中的一条完整直线 + 明确的移除半平面。
3. **拒绝伪完成**：没有验证过的折叠不声称可复现；没有接入的模型不放按钮。
4. **本地优先**：无账号、无追踪，作品保存在浏览器里。

## 能力边界

- 只支持四种固定折法：不折、竖直对折、水平对折、正交双折。
- 只支持直线切口；不支持曲线、多段折线、任意轮廓。
- 不做纸张物理仿真（厚度、弹性、起皱）；折叠动画是正交投影下的真实变换，不是物理模拟。
- 运行时**不调用**大模型；所有图案由确定性几何引擎生成。
- 作品存在浏览器 localStorage，换设备不同步；清缓存会丢失，请先导出 SVG。
- 尚未在真机 iOS / Android 上验证，仅有 390×844 视口模拟。

## Roadmap

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M0 | 工程基线、品牌外壳、文档体系 | ✅ 完成 |
| M1 | 几何引擎 + 黄金菱形孔洞 + 数学测试 | ✅ 完成 |
| M2 | 可玩关卡 + 生产构建核验 | ✅ 完成（公开发布受阻，见下） |
| M3 | 剪纸工坊、导出、作品集、数学页 | ✅ 完成 |
| M4 | 投稿材料、最终核验 | 进行中 |

### 公开发布状态

生产构建已通过端到端验证（`vite preview` + 真实浏览器操作通关，控制台 0 错误），
但**本次会话不具备 WorkBuddy 部署工具**（`workbuddy_sites_deploy` 不可用），
因此**尚未取得公开 HTTPS 链接**。详见 [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) §3。

## 文档

完整文档索引见 [`docs/INDEX.md`](docs/INDEX.md)。任务追踪见 [`TASKS.md`](TASKS.md)，当前状态见 [`PROJECT_STATUS.md`](PROJECT_STATUS.md)。

## 致谢与声明

本项目受 Erik Demaine 与 Martin Demaine 在计算折纸、Fold-and-Cut 问题与折叠谜题方面的公开研究启发。
**不是 MIT 官方产品，与作者无合作或背书关系**，未使用其谜题图片、教材插图、字体或源代码。

## 许可

本仓库尚未选择开源许可证，版权归作者所有，保留一切权利。第三方依赖许可见
[`submission/references_licenses.md`](submission/references_licenses.md)。
