import { Icon, SectionLabel, Stat, Tag } from '../components/ui';

/**
 * Milestone-0 home page: brand, hero and the fold-cut-unfold promise.
 * The paper shown here is a static brand sketch; the live geometry demo lands
 * with the geometry engine in Milestone 1.
 */
export function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-14 md:grid-cols-[1.02fr_0.98fr] md:gap-14 md:pt-16">
        <div className="rise-in">
          <SectionLabel>Computational Paper Art Lab</SectionLabel>
          <h1 className="font-display text-[3.1rem] leading-[1.05] text-ink sm:text-[3.8rem]">一刀万象</h1>
          <p className="mt-3 font-display text-[1.35rem] tracking-[0.02em] text-red">Fold. Snip. Unfold. Wow!</p>
          <p className="mt-5 max-w-md text-[1.02rem] leading-relaxed text-ink-soft">
            一张纸，千种可能；一把剪刀，万象展开。
          </p>
          <p className="mt-2 max-w-md text-[0.9rem] leading-relaxed text-ink-faint">
            折一次、剪一刀、再展开。你看到的每一个孔洞，都是几何算出来的，不是画上去的。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#/puzzle" className="btn btn-primary">
              <Icon name="scissors" size={17} />
              立即剪一刀
            </a>
            <a href="#/studio" className="btn btn-ghost">
              进入剪纸工坊
              <Icon name="arrow-right" size={16} />
            </a>
          </div>
          <div className="mt-9 grid max-w-md grid-cols-3 gap-3 border-t border-rule pt-6 sm:gap-5">
            <Stat label="折法" value="4" hint="固定且已验证" />
            <Stat label="孔洞面积" value="2d²" hint="菱形精确解" />
            <Stat label="导出" value="SVG/PNG" hint="真矢量路径" />
          </div>
        </div>

        <div className="rise-in" style={{ animationDelay: '120ms' }}>
          <div className="stage-card px-4 py-6 sm:px-7">
            <div className="mb-2 flex items-center justify-between">
              <Tag tone="gold">品牌草图</Tag>
              <span className="text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">4 layers · 1 cut</span>
            </div>
            <svg viewBox="-1.2 -1.2 2.4 2.4" className="block w-full" role="img" aria-label="一刀万象品牌图形">
              <g transform="scale(1,-1)">
                <rect x="-1" y="-1" width="2" height="2" fill="none" stroke="rgba(140,112,74,0.28)" strokeWidth="0.008" strokeDasharray="0.05 0.05" />
                <path
                  d="M-1 -1 H1 V1 H-1 Z M0 -0.34 L0.34 0 L0 0.34 L-0.34 0 Z"
                  fill="#B93645"
                  fillRule="evenodd"
                />
              </g>
            </svg>
            <p className="mt-3 text-center font-mono text-[0.72rem] text-ink-soft">
              正交双折 · 剪去 u + v &lt; d · 展开得 |x| + |y| &lt; d
            </p>
          </div>
          <p className="mt-3 text-center text-[0.72rem] text-ink-faint">
            这是品牌草图；Milestone 1 会把它换成真实几何驱动的动画。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rule mb-10" />
        <div className="grid gap-3 md:grid-cols-3">
          {[
            { href: '#/puzzle', title: '一刀挑战', en: 'One-Cut Puzzle', text: '六个原创目标，一条直线，一次剪切。' },
            { href: '#/studio', title: '剪纸工坊', en: 'Paper Art Studio', text: '编辑切线、实时展开、导出矢量图。' },
            { href: '#/explore', title: '纸艺中的数学', en: 'The Maths', text: '镜像、平折、逆映射与半平面。' },
          ].map((c) => (
            <a key={c.href} href={c.href} className="sheet-card p-6 transition-all hover:-translate-y-0.5">
              <h3 className="font-display text-[1.2rem] text-ink">{c.title}</h3>
              <p className="mt-1 text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint">{c.en}</p>
              <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-soft">{c.text}</p>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
