import { BrandMark } from '../app/App';
import { Tag } from '../components/ui';
import { LEVELS } from '../puzzle/levels';

const REAL = [
  '四种固定折法的折叠—剪切—展开，逐层几何计算',
  `${LEVELS.length} 个原创关卡，全部由标准解正向构造并自动校验`,
  '正交双折的菱形黄金样例：孔洞面积 2d²，含符号级断言',
  '工坊：多刀编辑、撤销/重做、4 套美学预设、SVG / PNG 导出',
  '作品保存在本地浏览器，可再次编辑，不依赖任何账号',
  '移动端触控：切线可拖动，坐标经 CTM 逆变换校准',
];

const NOT_REAL = [
  '运行时大模型（AI 灵感设计师）——本次未接入，因此界面不提供入口',
  '任意折叠：不支持斜向折线或自由拖拽折痕',
  '曲线切口、多段折线切口、以“一刀”名义的任意轮廓',
  '纸张物理仿真（厚度、弹性、起皱、重力）',
  '服务端账号体系、云同步、在线作品广场',
];

export function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-5 py-10">
      <div className="flex items-center gap-4">
        <BrandMark size={52} />
        <div>
          <h1 className="font-display text-[2rem] leading-none text-ink">一刀万象</h1>
          <p className="mt-1.5 text-[0.78rem] uppercase tracking-[0.3em] text-ink-faint">Foldyssey</p>
        </div>
      </div>

      <p className="mt-5 max-w-2xl font-display text-[1.25rem] leading-relaxed text-ink">
        让复杂的纸艺之美，从几条几何规则里自己长出来。
      </p>
      <p className="mt-3 max-w-2xl text-[0.9rem] leading-relaxed text-ink-soft">
        这不是一个折纸教程，也不是一个画板。你面对的是真实的纸张模型：折起来、剪一刀、再展开，
        每一次结果都由多边形布尔运算和等距变换算出来。同一个输入永远得到同一个结果。
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <section className="sheet-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">已经做到</p>
            <Tag tone="teal">已验证</Tag>
          </div>
          <ul className="space-y-2 text-[0.83rem] leading-relaxed text-ink-soft">
            {REAL.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="sheet-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">没有做到</p>
            <Tag tone="red">明确边界</Tag>
          </div>
          <ul className="space-y-2 text-[0.83rem] leading-relaxed text-ink-soft">
            {NOT_REAL.map((t) => (
              <li key={t} className="flex gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red/60" />
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="sheet-card mt-4 p-6">
        <p className="eyebrow mb-2">关于 AI</p>
        <p className="text-[0.85rem] leading-relaxed text-ink-soft">
          这个项目在<strong className="text-ink">开发阶段</strong>由 WorkBuddy 的编程模型协助完成：需求拆解、几何推导、
          代码编写、测试与文档。这是“用 AI 造工具”，不是“工具里跑了 AI”。
        </p>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-soft">
          作品<strong className="text-ink">运行时</strong>没有调用任何大模型：没有 API Key，没有服务端推理，也不会把你的作品发到任何地方。
          所有图案都由确定性的几何引擎生成。因此断网、限流、模型下线都不会影响这里任何一个功能。
        </p>
        <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-faint">
          原计划中有一个“AI 灵感设计师”模块（把自然语言转成受约束的设计参数）。在无法确认安全、无密钥的运行时模型通道前，
          我们选择不提供入口，而不是放一个假按钮。
        </p>
      </section>

      <section className="sheet-card mt-4 p-6">
        <p className="eyebrow mb-2">研究灵感与致谢</p>
        <p className="text-[0.85rem] leading-relaxed text-ink-soft">
          本作受 Erik Demaine 与 Martin Demaine 在计算折纸（computational origami）、
          Fold-and-Cut 问题与折叠谜题方面的公开研究启发。几何引擎、关卡、文案与视觉均为独立实现。
        </p>
        <p className="mt-2 text-[0.85rem] leading-relaxed text-ink-soft">
          本项目<strong className="text-ink">不是</strong> MIT 官方产品，与上述研究者无合作、无背书关系；
          未使用其谜题图片、教材插图、字体或源代码。
        </p>
        <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-faint">
          多边形布尔运算使用 polygon-clipping（MIT）。动画与交互使用 React、Motion。字体使用系统字体，不加载远端资源。
        </p>
      </section>

      <section className="sheet-card mt-4 p-6">
        <p className="eyebrow mb-2">隐私与数据</p>
        <p className="text-[0.85rem] leading-relaxed text-ink-soft">
          没有账号、没有埋点、没有第三方脚本。作品与关卡进度存在浏览器 localStorage 中，
          键名为 <code className="font-mono text-[0.8rem]">foldyssey.gallery.v1</code> 与{' '}
          <code className="font-mono text-[0.8rem]">foldyssey.progress.v1</code>。
          清除站点数据会一并删除它们，请先用 SVG 导出留档。
        </p>
      </section>

      <section className="sheet-card mt-4 p-6">
        <p className="eyebrow mb-2">许可</p>
        <p className="text-[0.85rem] leading-relaxed text-ink-soft">
          本仓库尚未选择开源许可证，版权归作者所有，保留一切权利。第三方依赖的许可证见{' '}
          <code className="font-mono text-[0.8rem]">submission/references_licenses.md</code>。
        </p>
      </section>

      <p className="mt-8 text-center text-[0.72rem] uppercase tracking-[0.24em] text-ink-faint">
        Fold. Snip. Unfold. Wow!
      </p>
    </div>
  );
}
