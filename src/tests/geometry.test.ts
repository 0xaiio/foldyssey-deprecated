import { describe, expect, it } from 'vitest';
import {
  apply,
  applyCut,
  buildFoldState,
  cutFromAngle,
  difference,
  foldCutUnfold,
  invert,
  multiPolygonArea,
  multiply,
  pointInMulti,
  reflection,
  scoreRegions,
  squarePolygon,
  unfoldPatches,
  validateCut,
  type MultiPolygon,
  type StraightCut,
} from '../geometry';

const PAPER: MultiPolygon = [squarePolygon(1)];
const PAPER_AREA = 4;

const dCut = (d: number): StraightCut => ({
  nx: Math.SQRT1_2,
  ny: Math.SQRT1_2,
  offset: d * Math.SQRT1_2,
  removedSide: 'negative',
});

function expectClose(actual: number, expected: number, tol = 1e-9) {
  expect(Math.abs(actual - expected)).toBeLessThan(tol);
}

describe('paper model', () => {
  it('no fold and no cut returns the full sheet', () => {
    const { unfolded } = foldCutUnfold(PAPER, 'none', []);
    expectClose(multiPolygonArea(unfolded), PAPER_AREA);
    expect(unfolded).toHaveLength(1);
    expect(unfolded[0]).toHaveLength(1);
  });

  it('a single reflection is an isometry and its inverse restores vertices', () => {
    const r = reflection('vertical');
    const inv = invert(r);
    const pts = [
      { x: 0.3, y: -0.7 },
      { x: -1, y: 1 },
      { x: 0.25, y: 0.5 },
    ];
    for (const p of pts) {
      const q = apply(r, p);
      const back = apply(inv, p);
      expectClose(q.x, -p.x);
      expectClose(q.y, p.y);
      expectClose(back.x, -p.x);
    }
    const a = apply(r, pts[0]);
    const b = apply(r, pts[1]);
    expectClose(Math.hypot(a.x - b.x, a.y - b.y), Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y));
  });

  it('two orthogonal folds without a cut unfold back to the full sheet', () => {
    const state = buildFoldState(PAPER, 'orthogonal2');
    expect(state.patches).toHaveLength(4);
    expectClose(state.packetArea, 1); // packet = first quadrant
    const unfolded = unfoldPatches(state.patches);
    expectClose(multiPolygonArea(unfolded), PAPER_AREA, 1e-9);
  });

  it('composing two reflections equals the composed patch transform', () => {
    const state = buildFoldState(PAPER, 'orthogonal2');
    for (const patch of state.patches) {
      let m: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];
      for (const op of patch.history) m = multiply(reflection(op.axis), m);
      for (let i = 0; i < 6; i++) expectClose(m[i], patch.transform[i]);
    }
  });
});

describe('golden case: orthogonal folds + corner triangle cut -> central diamond hole', () => {
  for (const d of [0.2, 0.35, 0.6]) {
    it(`produces the diamond hole |x|+|y| < ${d} with area 2d^2`, () => {
      const { result, unfolded } = foldCutUnfold(PAPER, 'orthogonal2', [dCut(d)]);
      expect(result.hit).toBe(true);

      const remainingArea = multiPolygonArea(unfolded);
      expectClose(remainingArea, PAPER_AREA - 2 * d * d, 1e-9);

      const hole = difference(PAPER, unfolded);
      expectClose(multiPolygonArea(hole), 2 * d * d, 1e-9);

      // Centre and axis points inside the diamond are removed.
      for (const p of [
        { x: 0, y: 0 },
        { x: d * 0.9, y: 0 },
        { x: 0, y: -d * 0.9 },
      ]) {
        expect(pointInMulti(hole, p)).toBe(true);
        expect(pointInMulti(unfolded, p)).toBe(false);
      }

      // Points outside the diamond are kept, including near the square corners.
      // (Exact boundary points such as (1,1) are excluded: on-edge queries are
      // ambiguous by definition and must not drive pass/fail.)
      for (const p of [
        { x: d * 1.1, y: 0 },
        { x: d * 0.75, y: d * 0.75 },
        { x: 0.98, y: 0.98 },
        { x: -0.98, y: 0.02 },
      ]) {
        expect(pointInMulti(hole, p)).toBe(false);
        expect(pointInMulti(unfolded, p)).toBe(true);
      }

      // The four diamond vertices must be actual vertices of the hole boundary.
      const vertices = hole.flatMap((poly) => poly.flat());
      const expected = [
        { x: d, y: 0 },
        { x: -d, y: 0 },
        { x: 0, y: d },
        { x: 0, y: -d },
      ];
      for (const e of expected) {
        const found = vertices.some((v) => Math.hypot(v.x - e.x, v.y - e.y) < 1e-6);
        expect(found, `vertex (${e.x}, ${e.y})`).toBe(true);
      }
    });
  }

  it('is symmetric under reflection about both axes', () => {
    const d = 0.4;
    const { unfolded } = foldCutUnfold(PAPER, 'orthogonal2', [dCut(d)]);
    const mirroredX = unfolded.map((poly) => poly.map((ring) => ring.map((p) => ({ x: -p.x, y: p.y }))));
    const mirroredY = unfolded.map((poly) => poly.map((ring) => ring.map((p) => ({ x: p.x, y: -p.y }))));
    expect(multiPolygonArea(difference(unfolded, mirroredX))).toBeLessThan(1e-9);
    expect(multiPolygonArea(difference(mirroredX, unfolded))).toBeLessThan(1e-9);
    expect(multiPolygonArea(difference(unfolded, mirroredY))).toBeLessThan(1e-9);
    expect(multiPolygonArea(difference(mirroredY, unfolded))).toBeLessThan(1e-9);
  });

  it('changing d changes the geometry (no static artwork)', () => {
    const a = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.25)]).unfolded;
    const b = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.5)]).unfolded;
    expect(multiPolygonArea(difference(a, b))).toBeGreaterThan(0.05);
    expectClose(multiPolygonArea(a) - multiPolygonArea(b), 2 * (0.25 * 0.25 - 0.5 * 0.5) * -1);
  });

  it('every layer is cut independently and its inverse map is consistent', () => {
    const state = buildFoldState(PAPER, 'orthogonal2');
    const result = applyCut(state, dCut(0.3));
    expect(result.removedPerLayer).toHaveLength(4);
    const totalRemoved = result.removedPerLayer.reduce(
      (sum, l) => sum + multiPolygonArea(l.region),
      0,
    );
    // Each of the 4 layers loses one quarter of the diamond.
    expectClose(totalRemoved, 2 * 0.3 * 0.3, 1e-9);
    for (const layer of result.removedPerLayer) {
      expectClose(multiPolygonArea(layer.region), (2 * 0.3 * 0.3) / 4, 1e-9);
      // Removed source regions live inside the original sheet.
      expect(multiPolygonArea(difference(layer.region, PAPER))).toBeLessThan(1e-9);
    }
  });
});

describe('cut semantics and robustness', () => {
  it('a cut that misses the packet removes nothing and reports no hit', () => {
    const state = buildFoldState(PAPER, 'vertical');
    const miss: StraightCut = { nx: 1, ny: 0, offset: 5, removedSide: 'positive' };
    const result = applyCut(state, miss);
    expect(result.hit).toBe(false);
    expectClose(multiPolygonArea(unfoldPatches(result.patches)), PAPER_AREA);
  });

  it('rejects invalid normals but never throws', () => {
    expect(validateCut({ nx: 0, ny: 0, offset: 0, removedSide: 'negative' }).ok).toBe(false);
    expect(validateCut({ nx: NaN, ny: 0, offset: 0, removedSide: 'negative' }).ok).toBe(false);
    expect(
      validateCut({ nx: Infinity, ny: 0, offset: 0, removedSide: 'negative' }).ok,
    ).toBe(false);
    const state = buildFoldState(PAPER, 'orthogonal2');
    expect(() => applyCut(state, { nx: 0, ny: 0, offset: 0, removedSide: 'negative' })).not.toThrow();
  });

  it('normalizes non-unit normals', () => {
    const a = validateCut({ nx: 3, ny: 4, offset: 5, removedSide: 'positive' });
    expect(a.ok).toBe(true);
    if (a.ok) {
      expectClose(Math.hypot(a.cut.nx, a.cut.ny), 1);
      expectClose(a.cut.offset, 1);
    }
  });

  it('debris and kept paper partition the sheet; the remainder is a subset', () => {
    const state = buildFoldState(PAPER, 'orthogonal2');
    const cut: StraightCut = { nx: 0.6, ny: 0.8, offset: 0.45, removedSide: 'negative' };
    const result = applyCut(state, cut);
    const kept = unfoldPatches(result.patches);
    const removed = difference(PAPER, kept);
    expectClose(multiPolygonArea(kept) + multiPolygonArea(removed), PAPER_AREA, 1e-9);
    expect(multiPolygonArea(difference(kept, PAPER))).toBeLessThan(1e-9);
    expect(multiPolygonArea(kept)).toBeLessThanOrEqual(PAPER_AREA + 1e-9);
    expect(multiPolygonArea(kept)).toBeGreaterThan(0);
  });

  it('is deterministic for identical inputs and seeds', () => {
    const a = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.33)]).unfolded;
    const b = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.33)]).unfolded;
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('keeps the hole open in serialized SVG path data', () => {
    const { unfolded } = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.3)]);
    // The unfolded sheet must be one polygon with an inner ring (hole).
    expect(unfolded).toHaveLength(1);
    expect(unfolded[0].length).toBe(2);
    const outer = multiPolygonArea([unfolded[0].slice(0, 1)]);
    const hole = outer - multiPolygonArea(unfolded);
    expectClose(hole, 2 * 0.3 * 0.3, 1e-9);
  });

  it('handles an oblique cut without blowing up', () => {
    const cut = cutFromAngle(Math.PI / 5, 0.35, 'negative');
    const { unfolded } = foldCutUnfold(PAPER, 'orthogonal2', [cut]);
    const area = multiPolygonArea(unfolded);
    expect(area).toBeGreaterThan(0);
    expect(area).toBeLessThan(PAPER_AREA);
  });

  it('reports no hit for a degenerate knife-edge cut at the packet border', () => {
    const state = buildFoldState(PAPER, 'orthogonal2');
    const edge: StraightCut = { nx: 1, ny: 0, offset: 1, removedSide: 'positive' };
    const result = applyCut(state, edge);
    expect(result.removedPacketArea).toBeLessThan(1e-9);
    expectClose(multiPolygonArea(unfoldPatches(result.patches)), PAPER_AREA);
  });
});

describe('scoring', () => {
  it('gives IoU 1 and zero symmetric difference for an identical region', () => {
    const { unfolded } = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.3)]);
    const score = scoreRegions(unfolded, unfolded, PAPER_AREA);
    expectClose(score.iou, 1, 1e-9);
    expectClose(score.symDiffRatio, 0, 1e-9);
    expect(score.verdict).toBe('perfect');
  });

  it('does not accept an obviously wrong solution', () => {
    const target = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.3)]).unfolded;
    const wrong = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.85)]).unfolded;
    const score = scoreRegions(wrong, target, PAPER_AREA);
    expect(score.iou).toBeLessThan(0.9);
    expect(score.verdict).toBe('miss');
    expect(score.symDiffRatio).toBeGreaterThan(0.01);
  });

  it('distinguishes too-much from too-little', () => {
    const target = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.4)]).unfolded;
    const biggerHole = foldCutUnfold(PAPER, 'orthogonal2', [dCut(0.6)]).unfolded;
    const score = scoreRegions(biggerHole, target, PAPER_AREA);
    expect(score.actualArea).toBeLessThan(score.targetArea);
    expect(score.verdict).toBe('miss');
    expect(score.diff.onlyTarget.length).toBeGreaterThan(0);
  });

  it('handles empty regions without dividing by zero', () => {
    const score = scoreRegions([], [], PAPER_AREA);
    expectClose(score.iou, 1);
    expect(score.verdict).toBe('perfect');
    const score2 = scoreRegions([], PAPER, PAPER_AREA);
    expectClose(score2.iou, 0);
    expect(score2.verdict).toBe('miss');
  });
});
