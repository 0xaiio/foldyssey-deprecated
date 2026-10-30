import { GoldenDemo } from '../components/GoldenDemo';
import { Icon, SectionLabel, Stat, Tag } from '../components/ui';
import { LEVELS } from '../puzzle/levels';

const STEPS = [
  { n: '01', zh: '折叠', en: 'Fold', text: '选择一种已验证的折叠方案，纸包在眼前合拢。' },
  { n: '02', zh: '剪一刀', en: 'Snip', text: '在纸包上拖动一条直线，一条完整的直线，只此一刀。' },
  { n: '03', zh: '展开', en: 'Unfold', text: '按折叠的逆序逐层打开，孔洞由几何自己长出来。' },
  { n: '04', zh: '带走', en: 'Keep', text: '导出真正的矢量文件，或者存进本地作品集。' },
];

export function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 pt-10 pb-14 md:grid-cols-[1.02fr_0.98fr] md:gap-14 md:pt-16">
        <div className="rise-in">
          <SectionLabel>Computational Paper Art Lab</SectionLabel>
          <h1 className="font-display text-[3.1rem] leading-[1.05] text-ink sm:text-[3.8rem]">
            一刀万象
          </h1>
          <p className="mt-3 font-display text-[1.35rem] tracking-[0.02em] text-red">
            Fold. Snip. Unfold. Wow!
          </p>
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
            <Stat label="已验证关卡" value={`${LEVELS.length}`} hint="标准解自动校验" />
            <Stat label="孔洞面积" value="2d²" hint="菱形精确解" />
            <Stat label="导出" value="SVG/PNG" hint="真矢量路径" />
          </div>
        </div>

        <div className="rise-in" style={{ animationDelay: '120ms' }}>
          <div className="stage-card px-4 py-5 sm:px-7 sm:py-7">
            <div className="mb-1 flex items-center justify-between">
              <Tag tone="gold">实时几何演示</Tag>
              <span className="text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">
                4 layers · 1 cut
              </span>
            </div>
            <GoldenDemo className="mx-auto max-w-[420px]" />
            <div className="mt-2 rounded-xl bg-white/45 px-3 py-2 text-center">
              <p className="font-mono text-[0.72rem] text-ink-soft">
                正交双折 · 剪去 u + v &lt; d · 展开得 |x| + |y| &lt; d
              </p>
            </div>
          </div>
          <p className="mt-3 text-center text-[0.72rem] text-ink-faint">
            上面这段动画的每一帧都由几何引擎计算，同一个 d 永远得到同一个孔洞。
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5">
        <div className="rule mb-10" />
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <SectionLabel>Three ways in</SectionLabel>
            <h2 className="font-display text-[1.7rem] text-ink">三种进入方式</h2>
          </div>
          <p className="hidden max-w-xs text-right text-[0.8rem] leading-relaxed text-ink-faint sm:block">
            挑战、创作、理解 —— 同一套几何引擎，三种不同的玩法。
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <a
            href="#/puzzle"
            className="sheet-card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-red/10 text-red">
                <Icon name="scissors" size={19} />
              </span>
              <Tag tone="red">P0 核心</Tag>
            </div>
            <h3 className="mt-5 font-display text-[1.24rem] text-ink">一刀挑战</h3>
            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-ink-faint">One-Cut Puzzle</p>
            <p className="mt-3 flex-1 text-[0.86rem] leading-relaxed text-ink-soft">
              只有一条直线、四个折叠方案和六个原创目标。看目标、调切线、剪一刀，让展开的纸形与目标重合。
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[0.84rem] text-red">
              从第 1 关开始 <Icon name="arrow-right" size={15} />
            </span>
          </a>

          <a
            href="#/studio"
            className="sheet-card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal/10 text-teal">
                <Icon name="grid" size={19} />
              </span>
              <Tag tone="teal">可导出</Tag>
            </div>
            <h3 className="mt-5 font-display text-[1.24rem] text-ink">剪纸工坊</h3>
            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-ink-faint">Paper Art Studio</p>
            <p className="mt-3 flex-1 text-[0.86rem] leading-relaxed text-ink-soft">
              左边是纸包，右边是实时展开图。叠加多刀、换配色、保存，再把真正的 SVG 或高清 PNG 带走。
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[0.84rem] text-teal">
              打开工作台 <Icon name="arrow-right" size={15} />
            </span>
          </a>

          <a
            href="#/explore"
            className="sheet-card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/15 text-[#8a6a34]">
                <Icon name="info" size={19} />
              </span>
              <Tag>可动手</Tag>
            </div>
            <h3 className="mt-5 font-display text-[1.24rem] text-ink">纸艺中的数学</h3>
            <p className="mt-1 text-[0.72rem] uppercase tracking-[0.18em] text-ink-faint">The Maths</p>
            <p className="mt-3 flex-1 text-[0.86rem] leading-relaxed text-ink-soft">
              镜像、平折、逆映射、半平面 —— 五张小卡片，每张都配一个能动的小实验，而不是一段定义。
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[0.84rem] text-[#8a6a34]">
              去看定理 <Icon name="arrow-right" size={15} />
            </span>
          </a>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-5">
        <div className="stage-card px-6 py-8 sm:px-10 sm:py-10">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div>
              <SectionLabel>How a cut works</SectionLabel>
              <h2 className="font-display text-[1.6rem] leading-snug text-ink">
                一刀，从来不是<br className="hidden sm:block" />“画一个轮廓”
              </h2>
              <p className="mt-4 text-[0.88rem] leading-relaxed text-ink-soft">
                一次剪切 = 折叠纸包中的一条完整直线 + 明确的移除半平面。
                引擎逐层计算“这一层被剪掉了哪块”，再用逆变换把每层送回原位。
                孔洞不是减掉一条线，而是真的少了一块面积。
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-2xl border border-rule/80 bg-white/45 p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[0.7rem] text-gold">{s.n}</span>
                    <span className="font-display text-[1rem] text-ink">{s.zh}</span>
                    <span className="text-[0.64rem] uppercase tracking-[0.2em] text-ink-faint">{s.en}</span>
                  </div>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft">{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-5">
        <div className="grid gap-6 rounded-2xl border border-rule/80 bg-white/35 px-6 py-7 sm:px-8 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <SectionLabel>Golden case</SectionLabel>
            <p className="font-mono text-[0.86rem] leading-7 text-ink">
              正交双折后剪去 u + v &lt; d
              <br />
              展开得 H = {'{'} (x, y) : |x| + |y| &lt; d {'}'}
              <br />
              <span className="text-ink-soft">Area(H) = 2d²，剩余面积 = 4a² − 2d²</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Tag tone="red">顶点 (±d, 0) (0, ±d)</Tag>
            <Tag tone="teal">四重镜像对称</Tag>
            <Tag tone="gold">面积误差 &lt; 1e-9</Tag>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-6xl px-5 text-center">
        <h2 className="font-display text-[1.9rem] text-ink">十秒上手，三十秒见惊喜</h2>
        <p className="mx-auto mt-3 max-w-xl text-[0.9rem] leading-relaxed text-ink-soft">
          不需要注册、不需要说明书。点开第一关，拖动那条线，然后按下“剪一刀”。
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <a href="#/puzzle" className="btn btn-primary">
            <Icon name="play" size={15} />
            开始第一关
          </a>
          <a href="#/studio" className="btn btn-ghost">
            我想自己设计
          </a>
        </div>
      </section>
    </div>
  );
}
