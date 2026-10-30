import { useEffect, useMemo, useState } from 'react';
import { foldCutUnfold } from '../geometry';
import type { Patch } from '../geometry/fold';
import { LEVELS, PAPER } from '../puzzle/levels';
import { usePrefersReducedMotion } from '../app/router';
import { PaperStage } from './PaperStage';

type Phase = 'fold' | 'cut' | 'unfold' | 'hold';

const TIMING: Record<Phase, number> = {
  fold: 1150,
  cut: 820,
  unfold: 1500,
  hold: 2500,
};

const ORDER: Phase[] = ['fold', 'cut', 'unfold', 'hold'];

function progressFor(patch: Patch, pv: number, ph: number): number[] {
  return patch.history.map((op) => (op.axis === 'vertical' ? pv : ph));
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

/**
 * The home-page reel: a real fold → cut → unfold of the golden diamond level.
 * Every frame is produced by the geometry engine, so the animation can never
 * drift away from the maths it illustrates.
 */
export function GoldenDemo({ className = '' }: { className?: string }) {
  const level = LEVELS[2];
  const reduced = usePrefersReducedMotion();

  const { uncut, cutPatches, removed } = useMemo(() => {
    const { folded, result } = foldCutUnfold(PAPER, level.foldPreset, [level.canonicalCut]);
    return { uncut: folded.patches, cutPatches: result.patches, removed: result.removedInPacket };
  }, [level]);

  const [phase, setPhase] = useState<Phase>('fold');
  const [t, setT] = useState(0);

  useEffect(() => {
    if (reduced) {
      setPhase('hold');
      setT(1);
      return;
    }
    let raf = 0;
    let last = 0;
    let current: Phase = 'fold';
    let elapsed = 0;
    const tick = (now: number) => {
      if (last === 0) last = now;
      elapsed += now - last;
      last = now;
      let duration = TIMING[current];
      let guard = 0;
      while (elapsed >= duration && guard++ < 8) {
        elapsed -= duration;
        current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
        duration = TIMING[current];
      }
      setPhase(current);
      setT(clamp01(elapsed / duration));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const { patches, progress, showRemoved } = useMemo(() => {
    if (reduced) {
      return { patches: cutPatches, progress: undefined, showRemoved: false };
    }
    if (phase === 'fold') {
      const pv = easeInOut(clamp01(t * 2));
      const ph = easeInOut(clamp01((t - 0.5) * 2));
      return {
        patches: uncut,
        progress: uncut.map((p) => progressFor(p, pv, ph)),
        showRemoved: false,
      };
    }
    if (phase === 'cut') {
      return {
        patches: uncut,
        progress: uncut.map((p) => progressFor(p, 1, 1)),
        showRemoved: true,
      };
    }
    if (phase === 'unfold') {
      const ph = 1 - easeInOut(clamp01(t * 2));
      const pv = 1 - easeInOut(clamp01((t - 0.5) * 2));
      return {
        patches: cutPatches,
        progress: cutPatches.map((p) => progressFor(p, pv, ph)),
        showRemoved: false,
      };
    }
    return {
      patches: cutPatches,
      progress: cutPatches.map((p) => progressFor(p, 0, 0)),
      showRemoved: false,
    };
  }, [phase, t, uncut, cutPatches, reduced]);

  return (
    <div className={`relative ${className}`}>
      <PaperStage
        patches={patches}
        progress={progress}
        creases={phase === 'unfold' || phase === 'hold' ? [] : ['vertical', 'horizontal']}
        paperColor="#B93645"
        removedPreview={showRemoved ? removed : null}
        ghost
        ariaLabel="折纸、剪一刀、展开出中心菱形孔洞的实时演示"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
        <span className="text-[0.68rem] uppercase tracking-[0.2em] text-ink-faint">
          {reduced
            ? '菱形孔洞 · Diamond hole'
            : phase === 'fold'
              ? '折叠 · Fold'
              : phase === 'cut'
                ? '剪一刀 · Snip'
                : phase === 'unfold'
                  ? '展开 · Unfold'
                  : '菱形孔洞 · Diamond hole'}
        </span>
      </div>
    </div>
  );
}
