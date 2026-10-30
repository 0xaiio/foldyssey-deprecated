/**
 * Core geometric types for Foldyssey.
 *
 * Coordinate system (model space):
 *   - Origin at the centre of the paper.
 *   - x to the right, y upwards (mathematical convention).
 *   - The initial sheet is the square P = [-a, a] x [-a, a] with a = 1.
 *
 * SVG rendering flips y (`scale(1, -1)`), so renderers must convert.
 * Rings are implicitly closed: the last point must NOT repeat the first point.
 */

export type Vec2 = { x: number; y: number };

/** A simple closed ring (implicitly closed). */
export type Ring = Vec2[];

/** First ring is the outer boundary, subsequent rings are holes. */
export type Polygon = Ring[];

export type MultiPolygon = Polygon[];

/** Absolute tolerance for area / point comparisons in model units. */
export const EPS = 1e-9;

/** Tolerance used when snapping coincident vertices after a boolean op. */
export const SNAP = 1e-7;

export const PAPER_HALF_SIZE = 1;

export function v(x: number, y: number): Vec2 {
  return { x, y };
}

export function isFiniteVec(p: Vec2): boolean {
  return Number.isFinite(p.x) && Number.isFinite(p.y);
}
