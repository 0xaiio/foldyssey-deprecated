import { describe, expect, it } from 'vitest';
import {
  foldCutUnfold,
  multiPolygonArea,
  scoreRegions,
  type MultiPolygon,
} from '../geometry';
import { LEVELS, PAPER, PAPER_AREA, levelById } from '../puzzle/levels';

function mirror(mp: MultiPolygon, axis: 'x' | 'y'): MultiPolygon {
  return mp.map((poly) =>
    poly.map((ring) =>
      ring.map((p) => (axis === 'x' ? { x: -p.x, y: p.y } : { x: p.x, y: -p.y })),
    ),
  );
}

describe('puzzle levels', () => {
  it('ships six levels with unique ids and sequential order', () => {
    expect(LEVELS).toHaveLength(6);
    expect(new Set(LEVELS.map((l) => l.id)).size).toBe(6);
    expect(LEVELS.map((l) => l.order)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it.each(LEVELS.map((l) => [l.id, l] as const))(
    'level %s is solvable by its canonical cut',
    (_id, level) => {
      const { unfolded } = foldCutUnfold(PAPER, level.foldPreset, [level.canonicalCut]);
      const score = scoreRegions(unfolded, level.target, PAPER_AREA, level.tolerance);
      expect(score.verdict).toBe('perfect');
      expect(score.symDiffRatio).toBeLessThan(1e-9);
    },
  );

  it.each(LEVELS.map((l) => [l.id, l] as const))(
    'level %s is not pre-solved by its initial cut',
    (_id, level) => {
      const { unfolded } = foldCutUnfold(PAPER, level.foldPreset, [level.initialCut]);
      const score = scoreRegions(unfolded, level.target, PAPER_AREA, level.tolerance);
      expect(score.verdict).not.toBe('perfect');
    },
  );

  it.each(LEVELS.map((l) => [l.id, l] as const))(
    'level %s rejects an unrelated cut',
    (_id, level) => {
      const wrong = { nx: 0.2, ny: 0.98, offset: 0.05, removedSide: 'positive' as const };
      const { unfolded } = foldCutUnfold(PAPER, level.foldPreset, [wrong]);
      const score = scoreRegions(unfolded, level.target, PAPER_AREA, level.tolerance);
      expect(score.verdict).toBe('miss');
    },
  );

  it('every target is a proper region of the sheet', () => {
    for (const level of LEVELS) {
      expect(multiPolygonArea(level.target)).toBeGreaterThan(0.3);
      expect(multiPolygonArea(level.target)).toBeLessThan(PAPER_AREA - 1e-6);
    }
  });

  it('golden level: diamond hole has area 4 - 2d^2 and 4-fold symmetry', () => {
    const level = levelById('diamond-miracle');
    expect(level).toBeDefined();
    if (!level) return;
    const d = 0.34;
    expect(Math.abs(multiPolygonArea(level.target) - (PAPER_AREA - 2 * d * d))).toBeLessThan(1e-9);
    const mx = mirror(level.target, 'x');
    const my = mirror(level.target, 'y');
    const scoreX = scoreRegions(level.target, mx, PAPER_AREA);
    const scoreY = scoreRegions(level.target, my, PAPER_AREA);
    expect(scoreX.symDiffRatio).toBeLessThan(1e-9);
    expect(scoreY.symDiffRatio).toBeLessThan(1e-9);
    // The hole is one polygon with one hole ring.
    expect(level.target).toHaveLength(1);
    expect(level.target[0]).toHaveLength(2);
  });

  it('finale level keeps the inscribed diamond (no hole)', () => {
    const level = levelById('diamond-from-square');
    expect(level).toBeDefined();
    if (!level) return;
    expect(level.target).toHaveLength(1);
    expect(level.target[0]).toHaveLength(1);
    expect(level.target[0][0]).toHaveLength(4);
    expect(Math.abs(multiPolygonArea(level.target) - 2)).toBeLessThan(1e-9);
    // Vertices sit exactly on the midpoints of the original square edges.
    const verts = level.target[0][0].map((p) => `${p.x.toFixed(6)},${p.y.toFixed(6)}`).sort();
    expect(verts).toEqual(['-1.000000,0.000000', '0.000000,-1.000000', '0.000000,1.000000', '1.000000,0.000000']);
  });

  it('locked-angle levels declare a fixed angle', () => {
    const locked = LEVELS.filter((l) => l.limits.angleLocked !== null);
    expect(locked.map((l) => l.id)).toContain('size-riddle');
  });
});
