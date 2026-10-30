import { useMemo, useRef, useState } from 'react';
import { Icon, Tag } from '../components/ui';
import {
  apply,
  buildFoldState,
  cutFromAngle,
  foldCutUnfold,
  multiPolygonArea,
  multiPolygonToPath,
  partialReflection,
  type Vec2,
} from '../geometry';
import { PAPER } from '../puzzle/levels';

function useSvgPoint(ref: React.RefObject<SVGSVGElement | null>) {
  return (e: React.PointerEvent): Vec2 | null => {
    const svg = ref.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: -loc.y };
  };
}

function Card({
  index,
  title,
  subtitle,
  children,
  text,
}: {
  index: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  text: React.ReactNode;
}) {
  return (
    <article className="sheet-card flex flex-col p-5">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="font-mono text-[0.7rem] text-gold">{index}</span>
        <h2 className="font-display text-[1.12rem] text-ink">{title}</h2>
      </div>
      <p className="text-[0.68rem] uppercase tracking-[0.16em] text-ink-faint">{subtitle}</p>
      <div className="mt-3 flex-1 text-[0.83rem] leading-relaxed text-ink-soft">{text}</div>
      <div className="mx-auto mt-3 w-full max-w-[300px] rounded-xl border border-rule/70 bg-white/45 p-2">{children}</div>
    </article>
  );
}

/** 1. Reflection */
function ReflectionWidget() {
  const ref = useRef<SVGSVGElement>(null);
  const toModel = useSvgPoint(ref);
  const [p, setP] = useState<Vec2>({ x: 0.62, y: 0.44 });

  const move = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const q = toModel(e);
    if (!q) return;
    setP({ x: Math.max(-0.95, Math.min(0.95, q.x)), y: Math.max(-0.95, Math.min(0.95, q.y)) });
  };

  return (
    <div>
      <svg
        ref={ref}
        viewBox="-1.1 -1.1 2.2 2.2"
        className="block w-full touch-none"
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture?.(e.pointerId);
          move(e);
        }}
        onPointerMove={move}
        role="img"
        aria-label="拖动一个点，观察它关于竖直中线的镜像"
      >
        <g transform="scale(1,-1)">
          <rect x="-1" y="-1" width="2" height="2" fill="#F1E9DA" stroke="#cbbca2" strokeWidth="0.015" />
          <line x1="0" y1="-1" x2="0" y2="1" stroke="#8a6a34" strokeWidth="0.012" strokeDasharray="0.05 0.05" />
          <line x1={-p.x} y1={p.y} x2={p.x} y2={p.y} stroke="#B93645" strokeWidth="0.008" strokeDasharray="0.03 0.03" />
          <circle cx={p.x} cy={p.y} r="0.055" fill="#B93645" />
          <circle cx={-p.x} cy={p.y} r="0.055" fill="#378C86" />
        </g>
      </svg>
      <p className="mt-1 text-center font-mono text-[0.68rem] text-ink-faint">
        P({p.x.toFixed(2)}, {p.y.toFixed(2)}) → P′({(-p.x).toFixed(2)}, {p.y.toFixed(2)})
      </p>
    </div>
  );
}

/** 2. Folding makes two points coincide */
function FoldWidget() {
  const [t, setT] = useState(0.0);
  const m = partialReflection('vertical', t);
  const left = { x: -0.6, y: 0.35 };
  const moved = apply(m, left);
  const distance = Math.hypot(moved.x - 0.6, moved.y - 0.35);

  return (
    <div>
      <svg viewBox="-1.1 -1.1 2.2 2.2" className="block w-full" role="img" aria-label="折叠进度滑块，两个点逐渐重合">
        <g transform="scale(1,-1)">
          <rect x="-1" y="-1" width="2" height="2" fill="#F1E9DA" stroke="#cbbca2" strokeWidth="0.015" />
          <line x1="0" y1="-1" x2="0" y2="1" stroke="#8a6a34" strokeWidth="0.012" strokeDasharray="0.05 0.05" />
          <circle cx={0.6} cy={0.35} r="0.055" fill="#378C86" />
          <circle cx={moved.x} cy={moved.y} r="0.05" fill="#B93645" opacity={0.9} />
        </g>
      </svg>
      <input
        type="range"
        className="slider mt-1"
        min={0}
        max={1}
        step={0.01}
        value={t}
        onChange={(e) => setT(Number(e.target.value))}
        aria-label="折叠进度"
      />
      <p className="text-center font-mono text-[0.68rem] text-ink-faint">
        折叠 {Math.round(t * 100)}% · 两点相距 {distance.toFixed(3)}
      </p>
    </div>
  );
}

/** 3. Preimages of a packet point */
function LayerWidget() {
  const ref = useRef<SVGSVGElement>(null);
  const toModel = useSvgPoint(ref);
  const [p, setP] = useState<Vec2>({ x: 0.55, y: 0.38 });
  const state = useMemo(() => buildFoldState(PAPER, 'orthogonal2'), []);
  const colors = ['#B93645', '#378C86', '#C9A46A', '#242725'];

  const preimages = state.patches.map((patch, i) => ({
    point: apply(patch.inverse, p),
    color: colors[i % colors.length],
    id: patch.id,
  }));

  const move = (e: React.PointerEvent) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const q = toModel(e);
    if (!q) return;
    setP({ x: Math.max(0.03, Math.min(0.97, q.x)), y: Math.max(0.03, Math.min(0.97, q.y)) });
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-1">
        <div>
          <svg
            ref={ref}
            viewBox="-0.06 -0.06 1.12 1.12"
            className="block w-full touch-none rounded-lg bg-[#f1e9da]"
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture?.(e.pointerId);
              move(e);
            }}
            onPointerMove={move}
            role="img"
            aria-label="折叠纸包，点击查看该点来自纸面的哪些位置"
          >
            <g transform="scale(1,-1)">
              <rect x="0" y="0" width="1" height="1" fill="#EFE3CE" stroke="#cbbca2" strokeWidth="0.008" />
              <circle cx={p.x} cy={p.y} r="0.035" fill="#242725" />
            </g>
          </svg>
          <p className="mt-0.5 text-center text-[0.62rem] text-ink-faint">纸包（点击/拖动）</p>
        </div>
        <div>
          <svg viewBox="-1.06 -1.06 2.12 2.12" className="block w-full rounded-lg bg-[#f7f1e5]" role="img" aria-label="展开纸面上的四个原像">
            <g transform="scale(1,-1)">
              <rect x="-1" y="-1" width="2" height="2" fill="#F8F3E9" stroke="#cbbca2" strokeWidth="0.01" />
              <line x1="0" y1="-1" x2="0" y2="1" stroke="#cbbca2" strokeWidth="0.006" strokeDasharray="0.04 0.04" />
              <line x1="-1" y1="0" x2="1" y2="0" stroke="#cbbca2" strokeWidth="0.006" strokeDasharray="0.04 0.04" />
              {preimages.map((pi) => (
                <circle key={pi.id} cx={pi.point.x} cy={pi.point.y} r="0.055" fill={pi.color} />
              ))}
            </g>
          </svg>
          <p className="mt-0.5 text-center text-[0.62rem] text-ink-faint">展开后的四个原像</p>
        </div>
      </div>
      <p className="mt-1 text-center font-mono text-[0.66rem] text-ink-faint">
        u,v = ({p.x.toFixed(2)}, {p.y.toFixed(2)}) → (±{p.x.toFixed(2)}, ±{p.y.toFixed(2)})
      </p>
    </div>
  );
}

/** 4. One straight cut adds exactly one edge */
function CutWidget() {
  const [s, setS] = useState(0.55);
  const cut = cutFromAngle(Math.PI / 4, s, 'positive');
  const { unfolded } = useMemo(() => foldCutUnfold(PAPER, 'none', [cut]), [cut]);
  const area = multiPolygonArea(unfolded);

  return (
    <div>
      <svg viewBox="-1.1 -1.1 2.2 2.2" className="block w-full" role="img" aria-label="一刀切掉一个角，新增一条直边">
        <g transform="scale(1,-1)">
          <rect x="-1" y="-1" width="2" height="2" fill="none" stroke="#cbbca2" strokeWidth="0.012" strokeDasharray="0.05 0.05" />
          <path d={multiPolygonToPath(unfolded, 4)} fill="#B93645" fillRule="evenodd" opacity="0.9" />
        </g>
      </svg>
      <input
        type="range"
        className="slider mt-1"
        min={0.2}
        max={1.35}
        step={0.01}
        value={s}
        onChange={(e) => setS(Number(e.target.value))}
        aria-label="切线到中心的距离"
      />
      <p className="text-center font-mono text-[0.68rem] text-ink-faint">
        剩余面积 {area.toFixed(4)} / 4.0000 · 新增直边 1 条
      </p>
    </div>
  );
}

export function ExplorePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="max-w-2xl">
        <p className="eyebrow mb-1">The mathematics of paper</p>
        <h1 className="font-display text-[2rem] leading-tight text-ink">纸艺中的数学</h1>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
          五张小卡片，每张都能动手。这里没有需要背下来的定义，只有可以拖动、可以验证的关系。
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card
          index="01"
          title="镜像：一点与它的影子"
          subtitle="Reflection"
          text={
            <>
              沿 x = 0 对折，纸面上每个点 (x, y) 都会落到 (−x, y)。
              这不是“画一个对称的图案”，而是同一个点在两个位置各出现一次。拖动红点，绿点永远在它的镜面上。
            </>
          }
        >
          <ReflectionWidget />
        </Card>

        <Card
          index="02"
          title="折叠：两个点变成一个点"
          subtitle="Two points, one place"
          text={
            <>
              折叠是一种等距变换：折叠前后，纸上任意两点之间的距离不变。
              当折叠进行到 100%，左边那个点正好落在右边那个点上——纸包之所以“变厚”，就是因为多层重合。
            </>
          }
        >
          <FoldWidget />
        </Card>

        <Card
          index="03"
          title="层叠：一个点，四个出身"
          subtitle="Layers & inverse maps"
          text={
            <>
              正交双折后，纸包上的每一点都叠着四层纸。点击纸包任意位置，右侧会亮起它在展开纸面上的四个原像。
              这正是引擎“逐层裁剪、再逆映射回去”的依据。
            </>
          }
        >
          <LayerWidget />
        </Card>

        <Card
          index="04"
          title="一刀：直线只带来一条边"
          subtitle="One straight cut"
          text={
            <>
              一条直线与一张纸相交，只会产生一条新的直边。想让轮廓“拐弯”，就必须靠折叠把多个位置叠在一起，
              让同一条直线在不同层上留下不同方向的边。
            </>
          }
        >
          <CutWidget />
        </Card>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
        <article className="sheet-card p-6">
          <div className="mb-2 flex items-baseline gap-2">
            <span className="font-mono text-[0.7rem] text-gold">05</span>
            <h2 className="font-display text-[1.12rem] text-ink">Fold-and-Cut：定理与它的边界</h2>
          </div>
          <p className="text-[0.84rem] leading-relaxed text-ink-soft">
            Fold-and-Cut 问题问的是：给定任意一个由直线段组成的图形，是否存在一种“一般平折”（general
            flat folding），使得剪一刀直线就能剪出它？Erik Demaine 与 Martin Demaine 的研究给出了肯定的结论与构造方法。
            但那个结论依赖<strong className="text-ink">任意折叠</strong>，而不是折两次。
          </p>
          <p className="mt-3 text-[0.84rem] leading-relaxed text-ink-soft">
            本作只实现了四种固定折法（不折、竖直、水平、正交双折）。因此在正交双折下，
            任何包含中心的半平面切口都只会展开成菱形——这是一个漂亮的结论，但它离“任意图案”还很远。
            我们不会声称两次对折能剪出任意形状。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Tag tone="teal">本作：4 种预设折叠</Tag>
            <Tag tone="gold">定理：任意一般平折</Tag>
            <Tag>差距：折法自由度</Tag>
          </div>
        </article>

        <article className="sheet-card p-6">
          <p className="eyebrow mb-2">正交双折下的孔洞定理</p>
          <p className="text-[0.84rem] leading-relaxed text-ink-soft">
            若切口半平面包含纸包内角（即纸的中心），展开后孔洞必为
          </p>
          <p className="mt-2 rounded-lg bg-white/60 px-3 py-2 font-mono text-[0.82rem] text-ink">
            H = {'{'} (x, y) : n₁|x| + n₂|y| &lt; c {'}'}
          </p>
          <p className="mt-2 text-[0.84rem] leading-relaxed text-ink-soft">
            这是一个以原点为中心、四条边两两对称的菱形。法向量取 45° 时它退化为正方形（旋转 45°），
            面积恰好是 2d²。
          </p>
          <p className="mt-3 flex items-center gap-1.5 text-[0.76rem] text-teal">
            <Icon name="check" size={14} />
            已在 <code className="font-mono">src/tests/geometry.test.ts</code> 中断言
          </p>
        </article>
      </div>
    </div>
  );
}
