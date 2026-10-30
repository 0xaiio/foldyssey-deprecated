import { useEffect } from 'react';
import { useRoute } from './router';
import { HomePage } from '../pages/Home';
import { PuzzlePage } from '../pages/Puzzle';
import { StudioPage } from '../pages/Studio';
import { GalleryPage } from '../pages/Gallery';
import { ExplorePage } from '../pages/Explore';
import { AboutPage } from '../pages/About';
import { Icon } from '../components/ui';

const NAV = [
  { href: '#/puzzle', label: '一刀挑战' },
  { href: '#/studio', label: '剪纸工坊' },
  { href: '#/gallery', label: '我的作品' },
  { href: '#/explore', label: '纸艺中的数学' },
  { href: '#/about', label: '关于' },
];

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="3" y="3" width="34" height="34" rx="3" fill="#B93645" />
      <path d="M3 3h17v17H3z" fill="#D84A49" />
      <path d="M3 3h17v17H3z" fill="#ffffff" opacity="0.08" />
      <path
        d="M20 8l12 12-12 12-12-12z"
        fill="#F8F3E9"
        opacity="0.92"
      />
      <path d="M20 8l12 12-12 12-12-12z" fill="none" stroke="#8e2531" strokeWidth="1" opacity="0.5" />
      <path d="M20 3v34" stroke="#F8F3E9" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.55" />
    </svg>
  );
}

export default function App() {
  const route = useRoute();

  useEffect(() => {
    const titles: Record<string, string> = {
      home: 'Foldyssey · 一刀万象',
      puzzle: '一刀挑战 · Foldyssey',
      studio: '剪纸工坊 · Foldyssey',
      gallery: '我的作品 · Foldyssey',
      explore: '纸艺中的数学 · Foldyssey',
      about: '关于 · Foldyssey',
    };
    document.title = titles[route.name] ?? 'Foldyssey · 一刀万象';
  }, [route.name]);

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2"
      >
        跳到主要内容
      </a>
      <header className="sticky top-0 z-30 border-b border-rule/70 bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 md:gap-4 md:px-5 md:py-3">
          <a href="#/" className="flex shrink-0 items-center gap-2.5" aria-label="Foldyssey 首页">
            <BrandMark size={26} />
            <span className="leading-none">
              <span className="font-display block text-[1.15rem] text-ink">一刀万象</span>
              <span className="mt-1 block text-[0.6rem] uppercase tracking-[0.32em] text-ink-faint">
                Foldyssey
              </span>
            </span>
          </a>
          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="主导航">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-[0.86rem] transition-colors ${
                  (item.href === '#/puzzle' && route.name === 'puzzle') ||
                  (item.href === '#/studio' && route.name === 'studio') ||
                  (item.href === '#/gallery' && route.name === 'gallery') ||
                  (item.href === '#/explore' && route.name === 'explore') ||
                  (item.href === '#/about' && route.name === 'about')
                    ? 'bg-ink/5 text-ink'
                    : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>
          <a href="#/puzzle" className="btn btn-primary ml-auto px-3 py-1.5 text-[0.78rem] md:ml-0 md:px-4 md:py-2 md:text-[0.85rem]">
            <Icon name="scissors" size={14} />
            立即剪一刀
          </a>
        </div>
        <nav
          className="flex gap-1 overflow-x-auto px-3 pb-1.5 md:hidden [scrollbar-width:none] [mask-image:linear-gradient(90deg,transparent,black_6px,black_calc(100%-18px),transparent)]"
          aria-label="主导航（移动端）"
        >
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-full px-3 py-1 text-[0.78rem] text-ink-soft"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      <main id="main" className="flex-1">
        {route.name === 'home' && <HomePage />}
        {route.name === 'puzzle' && <PuzzlePage levelId={route.levelId} />}
        {route.name === 'studio' && <StudioPage artworkId={route.artworkId} />}
        {route.name === 'gallery' && <GalleryPage />}
        {route.name === 'explore' && <ExplorePage />}
        {route.name === 'about' && <AboutPage />}
      </main>

      <footer className="mt-16 border-t border-rule/70 bg-paper-deep/40">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <BrandMark size={26} />
              <span className="font-display text-lg">一刀万象 · Foldyssey</span>
            </div>
            <p className="mt-3 max-w-sm text-[0.82rem] leading-relaxed text-ink-soft">
              一座可以玩的数字折剪纸实验室。图案来自可验证的计算几何，而不是预先准备的图片。
            </p>
            <p className="mt-3 text-[0.72rem] text-ink-faint">
              Fold. Snip. Unfold. Wow! — 一张纸，千种可能；一把剪刀，万象展开。
            </p>
          </div>
          <div>
            <p className="eyebrow mb-3">开始</p>
            <ul className="space-y-1.5 text-[0.84rem] text-ink-soft">
              <li><a className="link-underline" href="#/puzzle">一刀挑战</a></li>
              <li><a className="link-underline" href="#/studio">剪纸工坊</a></li>
              <li><a className="link-underline" href="#/gallery">我的作品</a></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow mb-3">了解</p>
            <ul className="space-y-1.5 text-[0.84rem] text-ink-soft">
              <li><a className="link-underline" href="#/explore">纸艺中的数学</a></li>
              <li><a className="link-underline" href="#/about">关于与致谢</a></li>
              <li>
                <span className="text-ink-faint">无账号 · 无追踪 · 作品存本地</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-rule/60 px-5 py-4">
          <p className="mx-auto max-w-6xl text-[0.7rem] leading-relaxed text-ink-faint">
            受 Erik Demaine 与 Martin Demaine 的计算折纸研究启发，非 MIT 官方产品，与作者无合作或背书关系。
            本作未使用其谜题图片、教材插图或源码。几何引擎为独立实现。
          </p>
        </div>
      </footer>
    </div>
  );
}
