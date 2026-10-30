import polygonClipping from 'polygon-clipping';
import { fromClipper, multiPolygonArea, sanitizeMulti, toClipper } from './polygon';
import type { MultiPolygon } from './types';

/**
 * Thin, defensive wrapper around polygon-clipping.
 *
 * polygon-clipping is a robust boolean-ops kernel, but it is *not* an origami
 * engine: it has no notion of layers, folds or inverse maps. Everything that
 * gives Foldyssey its folding semantics is implemented in `fold.ts` / `cut.ts`.
 *
 * Degenerate input (zero-area rings, self-touching output, collinear edges)
 * can make the library throw or emit slivers, so every call is sanitized on the
 * way in and on the way out, and failures degrade to a documented fallback
 * instead of crashing the interactive canvas.
 */

function norm(mp: MultiPolygon): MultiPolygon {
  return sanitizeMulti(mp);
}

export type BoolOp = 'union' | 'intersection' | 'difference' | 'xor';

export function applyBoolOp(op: BoolOp, a: MultiPolygon, b: MultiPolygon): MultiPolygon {
  const A = norm(a);
  if (A.length === 0) {
    if (op === 'union') return norm(b);
    return [];
  }
  const B = norm(b);
  if (B.length === 0) {
    if (op === 'intersection') return [];
    return A;
  }
  try {
    const ca = toClipper(A) as never;
    const cb = toClipper(B) as never;
    const result = polygonClipping[op](ca, cb);
    return fromClipper(result);
  } catch {
    return fallback(op, A, B);
  }
}

/**
 * Deterministic fallback when the boolean kernel rejects the input.
 * `union` falls back to the concatenation of both operands (a superset that is
 * still valid geometry for display), `difference` keeps the subject, and
 * `intersection` returns empty. The failure is surfaced by callers that care
 * (see `lastBooleanFallback` counters used in tests).
 */
function fallback(op: BoolOp, a: MultiPolygon, b: MultiPolygon): MultiPolygon {
  booleanFallbackCount += 1;
  switch (op) {
    case 'union':
      return norm([...a, ...b]);
    case 'difference':
      return a;
    case 'intersection':
    case 'xor':
    default:
      return [];
  }
}

export let booleanFallbackCount = 0;
export function resetBooleanFallbackCount(): void {
  booleanFallbackCount = 0;
}

export function union(a: MultiPolygon, ...rest: MultiPolygon[]): MultiPolygon {
  let acc = a;
  for (const m of rest) acc = applyBoolOp('union', acc, m);
  return acc;
}

export function intersection(a: MultiPolygon, b: MultiPolygon): MultiPolygon {
  return applyBoolOp('intersection', a, b);
}

export function difference(a: MultiPolygon, b: MultiPolygon): MultiPolygon {
  return applyBoolOp('difference', a, b);
}

export function xor(a: MultiPolygon, b: MultiPolygon): MultiPolygon {
  return applyBoolOp('xor', a, b);
}

export function isEmpty(mp: MultiPolygon): boolean {
  return multiPolygonArea(mp) < 1e-12;
}
