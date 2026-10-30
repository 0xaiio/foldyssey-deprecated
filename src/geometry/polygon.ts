import { EPS, SNAP, type MultiPolygon, type Polygon, type Ring, type Vec2 } from './types';

export function ringSignedArea(ring: Ring): number {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    s += a.x * b.y - b.x * a.y;
  }
  return s / 2;
}

export function ringArea(ring: Ring): number {
  return Math.abs(ringSignedArea(ring));
}

export function polygonArea(poly: Polygon): number {
  if (poly.length === 0) return 0;
  let area = ringArea(poly[0]);
  for (let i = 1; i < poly.length; i++) area -= ringArea(poly[i]);
  return Math.max(0, area);
}

export function multiPolygonArea(mp: MultiPolygon): number {
  let total = 0;
  for (const p of mp) total += polygonArea(p);
  return total;
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

export function boundsOfMulti(mp: MultiPolygon): Bounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const poly of mp) {
    for (const ring of poly) {
      for (const p of ring) {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      }
    }
  }
  if (!Number.isFinite(minX)) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  return { minX, minY, maxX, maxY };
}

export function squarePolygon(half: number): Polygon {
  const h = Math.abs(half);
  return [
    [
      { x: -h, y: -h },
      { x: h, y: -h },
      { x: h, y: h },
      { x: -h, y: h },
    ],
  ];
}

/**
 * Remove duplicated / collinear / degenerate vertices so that boolean
 * operations never receive malformed input. Returns [] for degenerate rings.
 */
export function sanitizeRing(ring: Ring, eps = SNAP): Ring {
  const pts: Vec2[] = [];
  for (const raw of ring) {
    if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y)) continue;
    const p = { x: raw.x, y: raw.y };
    const last = pts[pts.length - 1];
    if (last && Math.abs(last.x - p.x) <= eps && Math.abs(last.y - p.y) <= eps) continue;
    pts.push(p);
  }
  while (pts.length > 1) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (Math.abs(first.x - last.x) <= eps && Math.abs(first.y - last.y) <= eps) pts.pop();
    else break;
  }
  // Drop collinear vertices (keeps boolean input small and stable).
  const out: Vec2[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = out.length > 0 ? out[out.length - 1] : pts[(i - 1 + pts.length) % pts.length];
    const cur = pts[i];
    const next = pts[(i + 1) % pts.length];
    const cross =
      (cur.x - prev.x) * (next.y - prev.y) - (cur.y - prev.y) * (next.x - prev.x);
    const scale =
      Math.hypot(cur.x - prev.x, cur.y - prev.y) + Math.hypot(next.x - cur.x, next.y - cur.y);
    if (out.length === 0 || Math.abs(cross) > eps * Math.max(scale, 1) * 1e-3) {
      out.push(cur);
    }
  }
  if (out.length < 3) return [];
  if (Math.abs(ringSignedArea(out)) < EPS) return [];
  return out;
}

export function sanitizePolygon(poly: Polygon, eps = SNAP): Polygon {
  const rings: Ring[] = [];
  for (const r of poly) {
    const s = sanitizeRing(r, eps);
    if (s.length >= 3) rings.push(s);
  }
  return rings;
}

export function sanitizeMulti(mp: MultiPolygon, eps = SNAP): MultiPolygon {
  const out: MultiPolygon = [];
  for (const poly of mp) {
    const p = sanitizePolygon(poly, eps);
    if (p.length > 0 && polygonArea(p) > EPS) out.push(p);
  }
  return out;
}

/** Convert to the tuple format expected by polygon-clipping (closed rings). */
export function toClipper(mp: MultiPolygon): number[][][][] {
  return mp.map((poly) =>
    poly.map((ring) => {
      const closed = ring.map((p) => [p.x, p.y] as [number, number]);
      closed.push([ring[0].x, ring[0].y]);
      return closed;
    }),
  );
}

/** Convert from polygon-clipping output (rings are open, first != last). */
export function fromClipper(input: unknown): MultiPolygon {
  if (!Array.isArray(input)) return [];
  const out: MultiPolygon = [];
  for (const poly of input as number[][][][]) {
    if (!Array.isArray(poly)) continue;
    const rings: Ring[] = [];
    for (const ring of poly) {
      if (!Array.isArray(ring)) continue;
      const pts: Vec2[] = [];
      for (const pt of ring) {
        if (Array.isArray(pt) && pt.length >= 2) {
          const x = Number(pt[0]);
          const y = Number(pt[1]);
          if (Number.isFinite(x) && Number.isFinite(y)) pts.push({ x, y });
        }
      }
      // drop duplicated closing vertex
      if (pts.length > 1) {
        const a = pts[0];
        const b = pts[pts.length - 1];
        if (Math.abs(a.x - b.x) < 1e-12 && Math.abs(a.y - b.y) < 1e-12) pts.pop();
      }
      if (pts.length >= 3) rings.push(pts);
    }
    if (rings.length > 0) out.push(rings);
  }
  return sanitizeMulti(out);
}

/** Map an affine transform over every vertex of a multipolygon. */
export function transformMulti(
  mp: MultiPolygon,
  f: (p: Vec2) => Vec2,
): MultiPolygon {
  return mp.map((poly) => poly.map((ring) => ring.map((p) => f(p))));
}

/** SVG path data. Rings are rendered with fill-rule="evenodd" so holes work. */
export function multiPolygonToPath(mp: MultiPolygon, digits = 5): string {
  const parts: string[] = [];
  const num = (n: number) => {
    const r = Number(n.toFixed(digits));
    return Object.is(r, -0) ? '0' : String(r);
  };
  for (const poly of mp) {
    for (const ring of poly) {
      if (ring.length < 3) continue;
      parts.push(`M${num(ring[0].x)} ${num(ring[0].y)}`);
      for (let i = 1; i < ring.length; i++) parts.push(`L${num(ring[i].x)} ${num(ring[i].y)}`);
      parts.push('Z');
    }
  }
  return parts.join('');
}

/** Sutherland–Hodgman clipping of a convex polygon by a half plane. */
export function clipConvexByHalfPlane(
  poly: Ring,
  nx: number,
  ny: number,
  offset: number,
  keep: 'negative' | 'positive',
  eps = 1e-12,
): Ring {
  const inside = (p: Vec2) => {
    const d = nx * p.x + ny * p.y - offset;
    return keep === 'negative' ? d <= eps : d >= -eps;
  };
  const out: Ring = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const next = poly[(i + 1) % poly.length];
    const curIn = inside(cur);
    const nextIn = inside(next);
    if (curIn) out.push(cur);
    if (curIn !== nextIn) {
      const dc = nx * cur.x + ny * cur.y - offset;
      const dn = nx * next.x + ny * next.y - offset;
      const denom = dc - dn;
      if (Math.abs(denom) > 1e-15) {
        const t = dc / denom;
        out.push({ x: cur.x + (next.x - cur.x) * t, y: cur.y + (next.y - cur.y) * t });
      }
    }
  }
  return out;
}

/** Point-in-multipolygon test using the even-odd rule. */
export function pointInMulti(mp: MultiPolygon, p: Vec2): boolean {
  let inside = false;
  for (const poly of mp) {
    for (const ring of poly) {
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const a = ring[i];
        const b = ring[j];
        if (a.y > p.y !== b.y > p.y) {
          const x = ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x;
          if (p.x < x) inside = !inside;
        }
      }
    }
  }
  return inside;
}
