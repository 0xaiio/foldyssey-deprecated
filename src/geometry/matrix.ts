import type { Vec2 } from './types';

/**
 * Affine transform stored in SVG order [a, b, c, d, e, f]:
 *
 *   x' = a*x + c*y + e
 *   y' = b*x + d*y + f
 *
 * This matches `transform="matrix(a,b,c,d,e,f)"` exactly, so a `Mat` can be
 * handed to the SVG renderer without conversion. All transforms produced by
 * this module are isometries (det = +1 or -1), which is what folding means:
 * the paper never stretches.
 */
export type Mat = [number, number, number, number, number, number];

export const IDENTITY: Mat = [1, 0, 0, 1, 0, 0];

/** m1 ∘ m2 — apply m2 first, then m1. */
export function multiply(m1: Mat, m2: Mat): Mat {
  const [a1, b1, c1, d1, e1, f1] = m1;
  const [a2, b2, c2, d2, e2, f2] = m2;
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

export function apply(m: Mat, p: Vec2): Vec2 {
  return {
    x: m[0] * p.x + m[2] * p.y + m[4],
    y: m[1] * p.x + m[3] * p.y + m[5],
  };
}

export function determinant(m: Mat): number {
  return m[0] * m[3] - m[1] * m[2];
}

export function invert(m: Mat): Mat {
  const det = determinant(m);
  if (!Number.isFinite(det) || Math.abs(det) < 1e-12) {
    throw new Error('Cannot invert a singular transform');
  }
  const [a, b, c, d, e, f] = m;
  const ia = d / det;
  const ib = -b / det;
  const ic = -c / det;
  const id = a / det;
  return [ia, ib, ic, id, -(ia * e + ic * f), -(ib * e + id * f)];
}

export type FoldAxis = 'vertical' | 'horizontal';

export function reflection(axis: FoldAxis): Mat {
  return axis === 'vertical' ? [-1, 0, 0, 1, 0, 0] : [1, 0, 0, -1, 0, 0];
}

/**
 * A reflection about the axis with an animation progress p in [0, 1].
 * p = 0 -> identity, p = 1 -> full reflection. Intermediate values are the
 * orthographic projection of a flap rotating 180° about the crease, which is
 * what makes the 2.5D fold animation faithful rather than decorative.
 */
export function partialReflection(axis: FoldAxis, p: number): Mat {
  const k = 1 - 2 * p;
  return axis === 'vertical' ? [k, 0, 0, 1, 0, 0] : [1, 0, 0, k, 0, 0];
}

export function toSvgMatrix(m: Mat): string {
  return `matrix(${m.map((n) => round(n, 9)).join(' ')})`;
}

export function round(n: number, digits = 6): number {
  const f = 10 ** digits;
  const r = Math.round(n * f) / f;
  return Object.is(r, -0) ? 0 : r;
}
