import { useCallback, useMemo, useRef, useState } from 'react';
import type { FoldAxis } from '../geometry/matrix';
import { patchTransformAt, type Patch } from '../geometry/fold';
import { multiPolygonArea, multiPolygonToPath } from '../geometry/polygon';
import { toSvgMatrix } from '../geometry/matrix';
import type { StraightCut } from '../geometry/cut';
import type { MultiPolygon, Vec2 } from '../geometry/types';

const VIEW_HALF = 1.2;
const RECT_HALF = 1.16;

function toSvgMatrixString(m: [number, number, number, number, number, number]) {
  return toSvgMatrix(m);
}

/** Liang–Barsky: the segment of an infinite line inside the square [-H, H]^2. */
export function lineSegmentInSquare(
  cut: StraightCut,
  half = RECT_HALF,
): { a: Vec2; b: Vec2 } | null {
  const len = Math.hypot(cut.nx, cut.ny);
  if (!Number.isFinite(len) || len < 1e-9) return null;
  const nx = cut.nx / len;
  const ny = cut.ny / len;
  const c = cut.offset / len;
  const p0 = { x: nx * c, y: ny * c };
  const dir = { x: -ny, y: nx };
  let t0 = -Infinity;
  let t1 = Infinity;
  for (const axis of ['x', 'y'] as const) {
    const d = dir[axis];
    const p = p0[axis];
    if (Math.abs(d) < 1e-12) {
      if (Math.abs(p) > half) return null;
      continue;
    }
    let ta = (-half - p) / d;
    let tb = (half - p) / d;
    if (ta > tb) [ta, tb] = [tb, ta];
    t0 = Math.max(t0, ta);
    t1 = Math.min(t1, tb);
  }
  if (t0 > t1) return null;
  return {
    a: { x: p0.x + dir.x * t0, y: p0.y + dir.y * t0 },
    b: { x: p0.x + dir.x * t1, y: p0.y + dir.y * t1 },
  };
}

export type PaperStageProps = {
  patches: Patch[];
  /** Per-patch fold animation progress (0 = flat, 1 = folded). */
  progress?: number[][];
  paperColor?: string;
  creases?: FoldAxis[];
  cut?: StraightCut | null;
  /** Region removed by the current cut, in packet coordinates. */
  removedPreview?: MultiPolygon | null;
  onCutChange?: (cut: StraightCut) => void;
  angleLocked?: number | null;
  maxAbsOffset?: number;
  showHandles?: boolean;
  target?: MultiPolygon | null;
  showTarget?: boolean;
  className?: string;
  ariaLabel?: string;
  shadow?: boolean;
  opacityOf?: (patch: Patch) => number;
  /** Draw the outline of the original sheet behind the paper for context. */
  ghost?: boolean;
  /** Extra SVG content drawn inside the model-space group (e.g. diff overlay). */
  overlay?: React.ReactNode;
};

/**
 * SVG renderer for the paper.
 *
 * Model space is y-up; the content group is flipped once with `scale(1,-1)`, so
 * every path, crease and handle can use the geometric coordinates directly.
 * Pointer input is converted back through `getScreenCTM()`, which keeps touch
 * accurate on phones where CSS scales the canvas.
 */
export function PaperStage({
  patches,
  progress,
  paperColor = '#B93645',
  creases = [],
  cut = null,
  removedPreview = null,
  onCutChange,
  angleLocked = null,
  maxAbsOffset = 1.7,
  showHandles = false,
  target = null,
  showTarget = false,
  className,
  ariaLabel = 'Folded paper canvas',
  shadow = true,
  opacityOf,
  ghost = false,
  overlay,
}: PaperStageProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<'rotate' | 'slide' | null>(null);
  const dragRef = useRef<{ mode: 'rotate' | 'slide'; anchor?: Vec2 } | null>(null);

  const toModel = useCallback((clientX: number, clientY: number): Vec2 | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const loc = pt.matrixTransform(ctm.inverse());
    return { x: loc.x, y: -loc.y };
  }, []);

  const segment = useMemo(() => (cut ? lineSegmentInSquare(cut) : null), [cut]);

  const handleA = segment
    ? { x: segment.a.x + (segment.b.x - segment.a.x) * 0.08, y: segment.a.y + (segment.b.y - segment.a.y) * 0.08 }
    : null;
  const handleB = segment
    ? { x: segment.b.x + (segment.a.x - segment.b.x) * 0.08, y: segment.b.y + (segment.a.y - segment.b.y) * 0.08 }
    : null;

  const emit = (next: StraightCut) => {
    if (!onCutChange) return;
    const clamped: StraightCut = {
      ...next,
      offset: Math.max(-maxAbsOffset, Math.min(maxAbsOffset, next.offset)),
    };
    onCutChange(clamped);
  };

  const applyRotate = (p: Vec2, anchor: Vec2) => {
    if (angleLocked !== null) return;
    const dx = p.x - anchor.x;
    const dy = p.y - anchor.y;
    if (Math.hypot(dx, dy) < 0.06) return;
    const nx = -dy;
    const ny = dx;
    const len = Math.hypot(nx, ny);
    const unx = nx / len;
    const uny = ny / len;
    emit({
      nx: unx,
      ny: uny,
      offset: unx * anchor.x + uny * anchor.y,
      removedSide: cut?.removedSide ?? 'negative',
    });
  };

  const onPointerDown = (mode: 'rotate' | 'slide', anchor?: Vec2) => (e: React.PointerEvent) => {
    if (!onCutChange) return;
    e.stopPropagation();
    e.preventDefault();
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* synthetic pointer capture can fail; dragging still works via move events */
    }
    dragRef.current = { mode, anchor };
    setDragging(mode);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || !cut || !onCutChange) return;
    const p = toModel(e.clientX, e.clientY);
    if (!p) return;
    if (drag.mode === 'rotate' && drag.anchor) {
      applyRotate(p, drag.anchor);
    } else if (drag.mode === 'slide') {
      const len = Math.hypot(cut.nx, cut.ny) || 1;
      const nx = cut.nx / len;
      const ny = cut.ny / len;
      emit({ ...cut, nx, ny, offset: nx * p.x + ny * p.y });
    }
  };

  const endDrag = () => {
    dragRef.current = null;
    setDragging(null);
  };

  const paperPath = (patch: Patch) => multiPolygonToPath(patch.source, 5);

  return (
    <svg
      ref={svgRef}
      className={`paper-svg ${className ?? ''}`}
      viewBox={`${-VIEW_HALF} ${-VIEW_HALF} ${VIEW_HALF * 2} ${VIEW_HALF * 2}`}
      role="img"
      aria-label={ariaLabel}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={endDrag}
    >
      <defs>
        <linearGradient id="paperSheen" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.07" />
        </linearGradient>
        <filter id="paperShadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0.035" stdDeviation="0.035" floodColor="#4a3520" floodOpacity="0.22" />
        </filter>
      </defs>

      <g transform="scale(1,-1)">
        {ghost && (
          <rect
            x="-1"
            y="-1"
            width="2"
            height="2"
            fill="none"
            stroke="rgba(140, 112, 74, 0.28)"
            strokeWidth={1}
            strokeDasharray="4 5"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}
        {showTarget && target && (
          <path
            d={multiPolygonToPath(target, 4)}
            fill="rgba(201,164,106,0.20)"
            stroke="rgba(160,120,55,0.75)"
            strokeWidth={1.2}
            strokeDasharray="5 4"
            fillRule="evenodd"
            vectorEffect="non-scaling-stroke"
          />
        )}

        <g filter={shadow ? 'url(#paperShadow)' : undefined}>
          {patches.map((patch, index) => {
            const m = progress ? patchTransformAt(patch, progress[index] ?? []) : patch.transform;
            const area = multiPolygonArea(patch.source);
            if (area < 1e-12) return null;
            return (
              <g key={patch.id} transform={toSvgMatrixString(m)} opacity={opacityOf ? opacityOf(patch) : 1}>
                <path
                  className="paper-face"
                  d={paperPath(patch)}
                  fill={paperColor}
                  fillRule="evenodd"
                  stroke="rgba(40, 22, 16, 0.22)"
                  strokeWidth={0.9}
                  vectorEffect="non-scaling-stroke"
                  strokeLinejoin="round"
                />
                <path d={paperPath(patch)} fill="url(#paperSheen)" fillRule="evenodd" pointerEvents="none" />
              </g>
            );
          })}
        </g>

        {creases.map((axis) => (
          <line
            key={axis}
            className="crease"
            x1={axis === 'vertical' ? 0 : -1.05}
            y1={axis === 'vertical' ? -1.05 : 0}
            x2={axis === 'vertical' ? 0 : 1.05}
            y2={axis === 'vertical' ? 1.05 : 0}
            strokeWidth={1.1}
          />
        ))}

        {removedPreview && removedPreview.length > 0 && (
          <path
            d={multiPolygonToPath(removedPreview, 4)}
            fill="rgba(24, 26, 24, 0.16)"
            stroke="rgba(24, 26, 24, 0.38)"
            strokeWidth={1}
            strokeDasharray="4 4"
            fillRule="evenodd"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
          />
        )}

        {cut && segment && (
          <g>
            <line
              x1={segment.a.x}
              y1={segment.a.y}
              x2={segment.b.x}
              y2={segment.b.y}
              stroke="rgba(253, 248, 240, 0.9)"
              strokeWidth={5}
              className="cut-line"
              pointerEvents="none"
            />
            <line
              x1={segment.a.x}
              y1={segment.a.y}
              x2={segment.b.x}
              y2={segment.b.y}
              stroke="#242725"
              strokeWidth={1.7}
              strokeDasharray="7 5"
              className="cut-line"
              style={{ cursor: onCutChange ? 'grab' : 'default' }}
              onPointerDown={onCutChange ? onPointerDown('slide') : undefined}
            />
          </g>
        )}

        {showHandles && cut && onCutChange && handleA && handleB && (
          <g>
            <Handle
              p={handleA}
              active={dragging === 'rotate'}
              cursor={angleLocked !== null ? 'ns-resize' : 'grab'}
              onPointerDown={onPointerDown('rotate', handleB)}
              testId="handle-a"
            />
            <Handle
              p={handleB}
              active={dragging === 'rotate'}
              cursor={angleLocked !== null ? 'ns-resize' : 'grab'}
              onPointerDown={onPointerDown('rotate', handleA)}
              testId="handle-b"
            />
            {segment && (
              <circle
                cx={(segment.a.x + segment.b.x) / 2}
                cy={(segment.a.y + segment.b.y) / 2}
                r={0.055}
                fill="#F8F3E9"
                stroke="#242725"
                strokeWidth={1.4}
                vectorEffect="non-scaling-stroke"
                className="cut-handle"
                data-handle="mid"
                onPointerDown={onPointerDown('slide')}
              >
                <title>拖动平移切线 / Drag to slide the cut</title>
              </circle>
            )}
          </g>
        )}

        {overlay}
      </g>
    </svg>
  );
}

function Handle({
  p,
  onPointerDown,
  cursor,
  active,
  testId,
}: {
  p: Vec2;
  onPointerDown: (e: React.PointerEvent) => void;
  cursor: string;
  active: boolean;
  testId: string;
}) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={0.1} fill="transparent" style={{ cursor }} onPointerDown={onPointerDown} />
      <circle
        cx={p.x}
        cy={p.y}
        r={active ? 0.065 : 0.052}
        fill="#F8F3E9"
        stroke="#B93645"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        style={{ cursor }}
        data-handle={testId}
        onPointerDown={onPointerDown}
      />
    </g>
  );
}
