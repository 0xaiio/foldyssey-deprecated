import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePrefersReducedMotion, navigate } from '../app/router';
import { PaperStage } from '../components/PaperStage';
import { Icon, SliderRow, Tag } from '../components/ui';
import {
  applyCut,
  cutAngle,
  cutFromAngle,
  cutHalfPlane,
  explainScore,
  intersection,
  multiPolygonToPath,
  scoreRegions,
  unfoldPatches,
  type MultiPolygon,
  type Score,
  type StraightCut,
} from '../geometry';
import { buildFoldState, type Patch } from '../geometry/fold';
import { LEVELS, PAPER, PAPER_AREA, type PuzzleLevel } from '../puzzle/levels';
import { loadProgress, recordAttempt, type ProgressState } from '../puzzle/progress';

type Phase = 'ready' | 'folding' | 'folded' | 'cutting' | 'cut' | 'unfolding' | 'revealed';

const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

function progressFor(patch: Patch, pv: number, ph: number): number[] {
  return patch.history.map((op) => (op.axis === 'vertical' ? pv : ph));
}

export function PuzzlePage({ levelId }: { levelId?: string }) {
  const initial = useMemo(() => {
    if (levelId) return LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
    const progress = loadProgress();
    return LEVELS.find((l) => !progress.levels[l.id]?.cleared) ?? LEVELS[0];
  }, [levelId]);

  return <PuzzleRunner key={initial.id} level={initial} />;
}

function PuzzleRunner({ level }: { level: PuzzleLevel }) {
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState<Phase>('ready');
  const [anim, setAnim] = useState(0);
  const [angle, setAngle] = useState(() => cutAngle(level.initialCut));
  const [offset, setOffset] = useState(() => level.initialCut.offset);
  const [side, setSide] = useState<StraightCut['removedSide']>(level.initialCut.removedSide);
  const [hintLevel, setHintLevel] = useState(0);
  const [showDiff, setShowDiff] = useState(false);
  const [, setProgressState] = useState<ProgressState>(() => loadProgress());
  const recordedRef = useRef<string>('');
  const resultRef = useRef<HTMLDivElement | null>(null);

  const folded = useMemo(() => buildFoldState(PAPER, level.foldPreset), [level]);
  const cut: StraightCut = useMemo(() => cutFromAngle(angle, offset, side), [angle, offset, side]);

  const removedPreview = useMemo(
    () => (phase === 'folded' || phase === 'cutting' ? intersection(folded.packet, cutHalfPlane(cut, folded.packet)) : []),
    [cut, folded, phase],
  );

  const cutResult = useMemo(() => applyCut(folded, cut), [folded, cut]);
  const unfoldedRegion = useMemo(() => unfoldPatches(cutResult.patches), [cutResult]);

  const score = useMemo(
    () => scoreRegions(unfoldedRegion, level.target, PAPER_AREA, level.tolerance),
    [unfoldedRegion, level],
  );

  // ---- animation driver -------------------------------------------------
  useEffect(() => {
    if (phase === 'folding') {
      if (reduced) {
        setAnim(1);
        setPhase('folded');
        return;
      }
      let raf = 0;
      let start = 0;
      const tick = (now: number) => {
        if (!start) start = now;
        const t = clamp01((now - start) / 1050);
        setAnim(t);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setPhase('folded');
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    if (phase === 'unfolding') {
      if (reduced) {
        setAnim(0);
        setPhase('revealed');
        return;
      }
      let raf = 0;
      let start = 0;
      const tick = (now: number) => {
        if (!start) start = now;
        const t = clamp01((now - start) / 1450);
        setAnim(1 - t);
        if (t < 1) raf = requestAnimationFrame(tick);
        else setPhase('revealed');
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    }
    if (phase === 'cutting') {
      const timer = window.setTimeout(() => setPhase('cut'), reduced ? 40 : 620);
      return () => window.clearTimeout(timer);
    }
    if (phase === 'ready') {
      setAnim(0);
      return;
    }
    setAnim(1);
    return;
  }, [phase, reduced]);

  // Bring the verdict into view once the reveal animation settles: the stage is
  // tall, so on 900px-tall screens the score would otherwise sit below the fold.
  useEffect(() => {
    if (phase !== 'revealed') return;
    const t = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
    return () => window.clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'revealed') return;
    const key = `${level.id}:${cut.nx.toFixed(4)}:${cut.ny.toFixed(4)}:${cut.offset.toFixed(4)}:${cut.removedSide}`;
    if (recordedRef.current === key) return;
    recordedRef.current = key;
    setProgressState(recordAttempt(level.id, score.iou, score.verdict === 'perfect'));
  }, [phase, score, level.id, cut]);

  const usingCutPatches = phase === 'cut' || phase === 'unfolding' || phase === 'revealed';
  const patches = usingCutPatches ? cutResult.patches : folded.patches;

  const progress = useMemo(() => {
    const pv = easeInOut(clamp01(anim * 2));
    const ph = easeInOut(clamp01((anim - 0.5) * 2));
    return patches.map((p) => progressFor(p, pv, ph));
  }, [patches, anim]);

  const setCutFromStage = useCallback((next: StraightCut) => {
    setAngle(Math.atan2(next.ny, next.nx));
    setOffset(next.offset);
    setSide(next.removedSide);
  }, []);

  const resetCut = () => {
    setAngle(cutAngle(level.initialCut));
    setOffset(level.initialCut.offset);
    setSide(level.initialCut.removedSide);
  };

  const primaryAction = () => {
    if (phase === 'ready') setPhase('folding');
    else if (phase === 'folded') setPhase('cutting');
    else if (phase === 'cut') setPhase('unfolding');
    else if (phase === 'revealed') {
      setShowDiff(false);
      setAnim(1);
      setPhase('folded');
    }
  };

  const replay = () => {
    if (phase !== 'revealed') return;
    setShowDiff(false);
    setAnim(1);
    setPhase('unfolding');
  };

  const busy = phase === 'folding' || phase === 'cutting' || phase === 'unfolding';
  const nextLevel = LEVELS[level.order] ?? null;

  const actionLabel: Record<Phase, string> = {
    ready: '折叠',
    folding: '折叠中…',
    folded: '剪一刀',
    cutting: '剪切中…',
    cut: '展开',
    unfolding: '展开中…',
    revealed: '再试一次',
  };

  const actionIcon: Record<Phase, 'fold' | 'scissors' | 'unfold' | 'rotate'> = {
    ready: 'fold',
    folding: 'fold',
    folded: 'scissors',
    cutting: 'scissors',
    cut: 'unfold',
    unfolding: 'unfold',
    revealed: 'rotate',
  };

  const instruction = busy
    ? '动画进行中，请稍候 —— 重复点击不会影响几何结果。'
    : phase === 'ready'
      ? '第 1 步：把纸折起来。'
      : phase === 'folded'
        ? level.limits.angleLocked !== null
          ? '第 2 步：角度已锁定，只调整切线与中心的距离。'
          : '第 2 步：拖动切线两端旋转，拖动中点平移。'
        : phase === 'cut'
          ? '第 3 步：展开，看看几何给出了什么。'
          : '对照目标，看看差异在哪里；再试一次不会重置你的进度。';

  const diffOverlay =
    showDiff && phase === 'revealed' ? (
      <g>
        <path
          d={multiPolygonToPath(score.diff.onlyTarget, 4)}
          fill="rgba(201,164,106,0.55)"
          stroke="rgba(150,110,50,0.9)"
          strokeWidth={0.8}
          fillRule="evenodd"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
        <path
          d={multiPolygonToPath(score.diff.onlyActual, 4)}
          fill="rgba(36,39,37,0.45)"
          stroke="rgba(20,22,20,0.8)"
          strokeWidth={0.8}
          fillRule="evenodd"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
        />
      </g>
    ) : null;

  return (
    <div className="mx-auto max-w-6xl px-5 py-7">
      <LevelRail progress={loadProgress()} activeId={level.id} />

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
        <div>
          <div className="stage-card px-4 py-5 sm:px-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Tag tone="red">第 {level.order} / {LEVELS.length} 关</Tag>
                <span className="text-[0.72rem] uppercase tracking-[0.18em] text-ink-faint">
                  {'★'.repeat(level.difficulty)}
                  {'☆'.repeat(3 - level.difficulty)}
                </span>
              </div>
              <span className="text-[0.72rem] text-ink-faint">
                {phase === 'ready' ? '平铺状态' : phase === 'folded' || phase === 'cutting' ? '已折叠 · 纸包' : '展开 · 结果'}
              </span>
            </div>

            <PaperStage
              patches={patches}
              progress={progress}
              creases={phase === 'folded' || phase === 'cutting' ? ['vertical', 'horizontal'] : []}
              cut={phase === 'folded' || phase === 'cutting' ? cut : null}
              removedPreview={removedPreview}
              onCutChange={phase === 'folded' ? setCutFromStage : undefined}
              angleLocked={level.limits.angleLocked}
              maxAbsOffset={level.limits.maxAbsOffset}
              showHandles={phase === 'folded'}
              ghost
              overlay={diffOverlay}
              paperColor="#B93645"
              ariaLabel={`${level.titleZh}：折叠纸包与切线`}
            />

            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="button"
                className="btn btn-primary w-full sm:w-auto"
                onClick={primaryAction}
                disabled={busy}
              >
                <Icon name={actionIcon[phase]} size={16} />
                {actionLabel[phase]}
              </button>
              <button
                type="button"
                className="btn btn-ghost w-full sm:w-auto"
                onClick={resetCut}
                disabled={phase !== 'folded'}
              >
                重置切线
              </button>
              {phase === 'revealed' && (
                <button type="button" className="btn btn-quiet" onClick={replay}>
                  <Icon name="play" size={14} />
                  回放展开
                </button>
              )}
            </div>
            <p className="mt-3 text-[0.78rem] leading-relaxed text-ink-soft">{instruction}</p>
          </div>

          {phase === 'revealed' && (
            <div className="mt-3" ref={resultRef}>
              <ResultPanel
                score={score}
                level={level}
                showDiff={showDiff}
                onToggleDiff={() => setShowDiff((v) => !v)}
                nextLevelId={nextLevel?.id ?? null}
              />
            </div>
          )}

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="sheet-card p-4">
              <p className="eyebrow mb-1.5">当前折叠方案</p>
              <p className="text-[0.86rem] text-ink">
                {level.foldPreset === 'none'
                  ? '不折叠'
                  : level.foldPreset === 'vertical'
                    ? '竖直对折（左 → 右）'
                    : level.foldPreset === 'horizontal'
                      ? '水平对折（下 → 上）'
                      : '正交双折（左 → 右，下 → 上）'}
              </p>
              <p className="mt-1.5 text-[0.76rem] leading-relaxed text-ink-faint">
                {folded.ops.length === 0
                  ? '整张纸平铺，一刀只产生一条直边。'
                  : `纸包 ${folded.patches.length} 层，面积 ${folded.packetArea.toFixed(3)}（单位面积 ${PAPER_AREA / 4} 的 ${(folded.packetArea / (PAPER_AREA / 4)).toFixed(0)} 倍）。`}
              </p>
            </div>
            <div className="sheet-card p-4">
              <p className="eyebrow mb-1.5">几何读数（实时）</p>
              <dl className="space-y-1 text-[0.78rem]">
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-soft">切线法向量</dt>
                  <dd className="font-mono tabular-nums text-ink">
                    ({cut.nx.toFixed(3)}, {cut.ny.toFixed(3)})
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-soft">偏移（到中心距离）</dt>
                  <dd className="font-mono tabular-nums text-ink">{cut.offset.toFixed(3)}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-soft">移除侧</dt>
                  <dd className="text-ink">{cut.removedSide === 'negative' ? '负侧 n·p < c' : '正侧 n·p > c'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-ink-soft">本刀剪下面积</dt>
                  <dd className="font-mono tabular-nums text-ink">{cutResult.removedPacketArea.toFixed(4)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="sheet-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">目标</p>
                <h1 className="font-display text-[1.5rem] leading-tight text-ink">{level.titleZh}</h1>
                <p className="mt-0.5 text-[0.72rem] uppercase tracking-[0.18em] text-ink-faint">{level.titleEn}</p>
              </div>
              <div className="w-[92px] shrink-0 rounded-xl border border-rule bg-white/60 p-1.5">
                <svg viewBox="-1.08 -1.08 2.16 2.16" className="block w-full" aria-label="目标纸形">
                  <rect x="-1" y="-1" width="2" height="2" fill="none" stroke="rgba(140,120,90,0.35)" strokeWidth="0.02" strokeDasharray="0.06 0.06" />
                  <g transform="scale(1,-1)">
                    <path d={multiPolygonToPath(level.target, 3)} fill="#C9A46A" fillOpacity="0.55" stroke="#8a6a34" strokeWidth="0.025" fillRule="evenodd" />
                  </g>
                </svg>
              </div>
            </div>
            <p className="mt-3 text-[0.84rem] leading-relaxed text-ink-soft">{level.subtitleZh}</p>
            <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-faint">{level.subtitleEn}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Tag tone="gold">目标面积 {level.targetArea.toFixed(4)}</Tag>
              <Tag>容差 IoU ≥ {level.tolerance.iouPerfect}</Tag>
            </div>
          </div>

          <div className="sheet-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">调整切线</p>
              {level.limits.angleLocked !== null && <Tag tone="teal">角度已锁定</Tag>}
            </div>
            <div className="space-y-3">
              <SliderRow
                id="cut-angle"
                label="角度（法向量方向）"
                value={(angle * 180) / Math.PI}
                min={0}
                max={360}
                step={1}
                disabled={phase !== 'folded' || level.limits.angleLocked !== null}
                onChange={(v) => setAngle((v * Math.PI) / 180)}
                format={(v) => `${v.toFixed(0)}°`}
              />
              <SliderRow
                id="cut-offset"
                label="偏移（到中心的距离）"
                value={offset}
                min={-level.limits.maxAbsOffset}
                max={level.limits.maxAbsOffset}
                step={0.005}
                disabled={phase !== 'folded'}
                onChange={setOffset}
                format={(v) => v.toFixed(3)}
              />
              <button
                type="button"
                className="btn btn-ghost w-full py-2 text-[0.82rem]"
                onClick={() => setSide(side === 'negative' ? 'positive' : 'negative')}
                disabled={phase !== 'folded'}
              >
                <Icon name="flip" size={15} />
                换保留侧（当前剪去{side === 'negative' ? '负侧' : '正侧'}）
              </button>
            </div>
            <p className="mt-3 text-[0.72rem] leading-relaxed text-ink-faint">
              提示：也可以直接在纸上拖动切线两端旋转、拖动中点平移。
            </p>
          </div>

          <div className="sheet-card p-5">
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">提示</p>
              <button
                type="button"
                className="text-[0.74rem] text-red hover:underline"
                onClick={() => setHintLevel((h) => Math.min(3, h + 1))}
                disabled={hintLevel >= 3}
              >
                {hintLevel >= 3 ? '已全部展开' : `揭示第 ${hintLevel + 1} 条`}
              </button>
            </div>
            <ol className="space-y-2">
              {[
                { key: 'observe', label: '观察', text: level.hints.observe.zh },
                { key: 'adjust', label: '操作', text: level.hints.adjust.zh },
                { key: 'solution', label: '解答', text: level.hints.solution.zh },
              ].map((h, i) => (
                <li
                  key={h.key}
                  className={`rounded-xl border px-3 py-2 text-[0.79rem] leading-relaxed ${
                    hintLevel > i ? 'border-rule bg-white/60 text-ink-soft' : 'border-dashed border-rule/70 bg-transparent text-ink-faint'
                  }`}
                >
                  <span className="mr-1.5 font-mono text-[0.68rem] text-gold">{h.label}</span>
                  {hintLevel > i ? h.text : '未揭示'}
                </li>
              ))}
            </ol>
          </div>

        </aside>
      </div>
    </div>
  );
}

function LevelRail({ progress, activeId }: { progress: ProgressState; activeId: string }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      <a href="#/puzzle" className="mr-1 hidden shrink-0 text-[0.78rem] text-ink-faint hover:text-ink sm:block">
        关卡
      </a>
      {LEVELS.map((l) => {
        const cleared = progress.levels[l.id]?.cleared;
        const active = l.id === activeId;
        return (
          <a
            key={l.id}
            href={`#/puzzle/${l.id}`}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.78rem] transition-colors ${
              active
                ? 'border-red/40 bg-red/10 text-red'
                : 'border-rule bg-white/50 text-ink-soft hover:border-ink/20 hover:text-ink'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="font-mono text-[0.66rem] opacity-60">{String(l.order).padStart(2, '0')}</span>
            {l.titleZh}
            {cleared && <Icon name="check" size={12} className="text-teal" />}
          </a>
        );
      })}
    </div>
  );
}

function ResultPanel({
  score,
  level,
  showDiff,
  onToggleDiff,
  nextLevelId,
}: {
  score: Score;
  level: PuzzleLevel;
  showDiff: boolean;
  onToggleDiff: () => void;
  nextLevelId: string | null;
}) {
  const feedback = explainScore(score, level.tolerance);
  const verdictLabel =
    score.verdict === 'perfect' ? '完全吻合' : score.verdict === 'close' ? '接近' : '未匹配';
  const verdictTone = score.verdict === 'perfect' ? 'teal' : score.verdict === 'close' ? 'gold' : 'red';

  return (
    <div className="sheet-card rise-in overflow-hidden">
      <div
        className={`px-5 py-4 ${
          score.verdict === 'perfect'
            ? 'bg-teal/10'
            : score.verdict === 'close'
              ? 'bg-gold/15'
              : 'bg-red/10'
        }`}
      >
        <div className="flex items-center justify-between">
          <p className="eyebrow">判定</p>
          <Tag tone={verdictTone as 'teal' | 'gold' | 'red'}>{verdictLabel}</Tag>
        </div>
        <p className="mt-1 font-display text-[1.35rem] text-ink">{feedback.zh}</p>
        <p className="mt-1 text-[0.76rem] text-ink-soft">{feedback.en}</p>
      </div>
      <div className="grid grid-cols-3 gap-2 border-b border-rule/70 px-5 py-3 text-center">
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-ink-faint">IoU</p>
          <p className="font-mono text-[1.05rem] tabular-nums text-ink">{score.iou.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-ink-faint">对称差 / 纸面</p>
          <p className="font-mono text-[1.05rem] tabular-nums text-ink">{(score.symDiffRatio * 100).toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-[0.66rem] uppercase tracking-[0.14em] text-ink-faint">实得面积</p>
          <p className="font-mono text-[1.05rem] tabular-nums text-ink">{score.actualArea.toFixed(4)}</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-[0.8rem] leading-relaxed text-ink-soft">
          <span className="text-ink">知识点：</span>
          {level.knowledgeZh}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost py-1.5 text-[0.78rem]" onClick={onToggleDiff}>
            <Icon name="grid" size={14} />
            {showDiff ? '隐藏差异' : '查看差异区域'}
          </button>
          {nextLevelId && (
            <button
              type="button"
              className="btn btn-primary py-1.5 text-[0.78rem]"
              onClick={() => navigate({ name: 'puzzle', levelId: nextLevelId })}
            >
              下一关
              <Icon name="arrow-right" size={14} />
            </button>
          )}
        </div>
        <p className="mt-3 flex items-center gap-3 text-[0.68rem] text-ink-faint">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-gold/70" /> 目标多出的部分
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-ink/45" /> 你多剪的部分
          </span>
        </p>
      </div>
    </div>
  );
}

export function TargetPreview({ target, size = 96 }: { target: MultiPolygon; size?: number }) {
  return (
    <svg viewBox="-1.08 -1.08 2.16 2.16" width={size} height={size} aria-label="目标纸形">
      <g transform="scale(1,-1)">
        <path d={multiPolygonToPath(target, 3)} fill="#C9A46A" fillOpacity="0.55" stroke="#8a6a34" strokeWidth="0.02" fillRule="evenodd" />
      </g>
    </svg>
  );
}
