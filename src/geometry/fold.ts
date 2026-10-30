import { apply, invert, multiply, reflection, type FoldAxis, type Mat } from './matrix';
import { union, difference, intersection } from './ops';
import {
  boundsOfMulti,
  clipConvexByHalfPlane,
  multiPolygonArea,
  transformMulti,
} from './polygon';
import type { MultiPolygon, Polygon, Vec2 } from './types';

export type FoldPresetId = 'none' | 'vertical' | 'horizontal' | 'orthogonal2';

export type FoldSide = 'negative' | 'positive';

export type FoldOperation = {
  id: string;
  axis: FoldAxis;
  /** The half of the sheet that travels. */
  from: FoldSide;
  /** The half it lands on. */
  to: FoldSide;
  labelZh: string;
  labelEn: string;
};

export const FOLD_VERTICAL: FoldOperation = {
  id: 'fold-v',
  axis: 'vertical',
  from: 'negative',
  to: 'positive',
  labelZh: '沿竖直中线：左半折向右半',
  labelEn: 'Fold the left half onto the right half',
};

export const FOLD_HORIZONTAL: FoldOperation = {
  id: 'fold-h',
  axis: 'horizontal',
  from: 'negative',
  to: 'positive',
  labelZh: '沿水平中线：下半折向上半',
  labelEn: 'Fold the bottom half onto the top half',
};

export type FoldPreset = {
  id: FoldPresetId;
  labelZh: string;
  labelEn: string;
  descriptionZh: string;
  descriptionEn: string;
  ops: FoldOperation[];
  /** Symmetry group of the flat-folded sheet, used for copy only. */
  symmetryZh: string;
};

export const FOLD_PRESETS: Record<FoldPresetId, FoldPreset> = {
  none: {
    id: 'none',
    labelZh: '不折叠',
    labelEn: 'Flat sheet',
    descriptionZh: '整张纸平铺，一刀只会切出一条直线边界。',
    descriptionEn: 'One straight cut, one straight edge.',
    ops: [],
    symmetryZh: '无（仅一刀直线）',
  },
  vertical: {
    id: 'vertical',
    labelZh: '竖直对折',
    labelEn: 'Vertical fold',
    descriptionZh: '左右两半重合，展开后图案关于竖直中线镜像。',
    descriptionEn: 'Mirror symmetry across the vertical centre line.',
    ops: [FOLD_VERTICAL],
    symmetryZh: '关于 x = 0 镜像',
  },
  horizontal: {
    id: 'horizontal',
    labelZh: '水平对折',
    labelEn: 'Horizontal fold',
    descriptionZh: '上下两半重合，展开后图案关于水平中线镜像。',
    descriptionEn: 'Mirror symmetry across the horizontal centre line.',
    ops: [FOLD_HORIZONTAL],
    symmetryZh: '关于 y = 0 镜像',
  },
  orthogonal2: {
    id: 'orthogonal2',
    labelZh: '正交双折',
    labelEn: 'Two orthogonal folds',
    descriptionZh: '先左折右，再下折上；四层纸包重合于第一象限，展开后同时关于两条中线镜像。',
    descriptionEn: 'Left onto right, then bottom onto top: four layers in the first quadrant.',
    ops: [FOLD_VERTICAL, FOLD_HORIZONTAL],
    symmetryZh: '关于 x = 0、y = 0 镜像（四重）',
  },
};

export const FOLD_PRESET_IDS: FoldPresetId[] = ['none', 'vertical', 'horizontal', 'orthogonal2'];

/**
 * A physical layer of paper: a region of the original sheet together with the
 * isometry that currently places it inside the folded packet.
 *
 * `history` records the fold operations that moved this specific layer, in
 * order. It is never derived from the geometry afterwards: losing it would make
 * the unfold animation and the reproducibility of a saved artwork impossible.
 */
export type Patch = {
  id: string;
  /** Region of the original sheet still present (possibly after cuts). */
  source: MultiPolygon;
  /** source -> folded packet coordinates. */
  transform: Mat;
  inverse: Mat;
  history: FoldOperation[];
  /** Painting order, 0 = bottom of the stack. */
  layer: number;
};

export type FoldedState = {
  presetId: FoldPresetId;
  ops: FoldOperation[];
  patches: Patch[];
  /** Union of all transformed sources: the physical folded packet. */
  packet: MultiPolygon;
  /** Area of the folded packet (layer stack counted once). */
  packetArea: number;
};

export function presetOf(id: FoldPresetId): FoldPreset {
  return FOLD_PRESETS[id] ?? FOLD_PRESETS.none;
}

function expandedRect(bounds: { minX: number; minY: number; maxX: number; maxY: number }): Polygon {
  const pad = Math.max(1, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  const minX = bounds.minX - pad;
  const minY = bounds.minY - pad;
  const maxX = bounds.maxX + pad;
  const maxY = bounds.maxY + pad;
  return [
    [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ],
  ];
}

/** The half-plane region that travels during a fold, in folded coordinates. */
export function foldMovingHalf(op: FoldOperation, target: MultiPolygon): MultiPolygon {
  const b = boundsOfMulti(target);
  const rect = expandedRect(b);
  const nx = op.axis === 'vertical' ? 1 : 0;
  const ny = op.axis === 'vertical' ? 0 : 1;
  const ring = clipConvexByHalfPlane(rect[0], nx, ny, 0, op.from);
  if (ring.length < 3) return [];
  return [[ring]];
}

function makePatch(
  id: string,
  source: MultiPolygon,
  transform: Mat,
  history: FoldOperation[],
  layer: number,
): Patch {
  return { id, source, transform, inverse: invert(transform), history, layer };
}

/**
 * Build the folded packet from an unfolded sheet by applying each fold in order.
 *
 * The split of every layer is computed geometrically (boolean intersection with
 * the travelling half-plane), never assumed. That keeps the door open for
 * additional validated creases later without rewriting the pipeline.
 */
export function buildFoldState(paper: MultiPolygon, presetId: FoldPresetId): FoldedState {
  const preset = presetOf(presetId);
  let patches: Patch[] = [makePatch('p0', paper, [1, 0, 0, 1, 0, 0], [], 0)];

  for (const op of preset.ops) {
    const next: Patch[] = [];
    let counter = 0;
    for (const patch of patches) {
      const image = transformMulti(patch.source, (p) => apply(patch.transform, p));
      const movingHalf = foldMovingHalf(op, image);
      if (movingHalf.length === 0) {
        next.push(patch);
        continue;
      }
      const moving = intersection(image, movingHalf);
      const staying = difference(image, movingHalf);
      if (multiPolygonArea(staying) > 1e-12) {
        const source = transformMulti(staying, (p) => apply(patch.inverse, p));
        next.push(makePatch(`${patch.id}s${counter++}`, source, patch.transform, patch.history, 0));
      }
      if (multiPolygonArea(moving) > 1e-12) {
        const source = transformMulti(moving, (p) => apply(patch.inverse, p));
        const transform = multiply(reflection(op.axis), patch.transform);
        next.push(
          makePatch(`${patch.id}m${counter++}`, source, transform, [...patch.history, op], 0),
        );
      }
    }
    patches = next;
  }

  // Stacking order. Folded flaps land on top of the stack, and a flipped stack
  // reverses its own internal order — exactly what happens with real paper.
  const order: string[] = [];
  for (const p of patches) order.push(p.id);
  for (const op of preset.ops) {
    const moving: string[] = [];
    const staying: string[] = [];
    for (const id of order) {
      const patch = patches.find((p) => p.id === id)!;
      if (patch.history.includes(op)) moving.push(id);
      else staying.push(id);
    }
    order.length = 0;
    order.push(...staying, ...moving.reverse());
  }
  order.forEach((id, i) => {
    const patch = patches.find((p) => p.id === id)!;
    patch.layer = i;
  });

  patches.sort((a, b) => a.layer - b.layer);

  const pieces = patches.map((p) => transformMulti(p.source, (q) => apply(p.transform, q)));
  const packet = pieces.length > 0 ? union(pieces[0], ...pieces.slice(1)) : [];

  return {
    presetId,
    ops: preset.ops,
    patches,
    packet,
    packetArea: multiPolygonArea(packet),
  };
}

/**
 * Position of a patch at an arbitrary point of the fold animation.
 * `progress[i]` is the completion of `patch.history[i]`, 0..1.
 */
export function patchTransformAt(patch: Patch, progress: number[]): Mat {
  let m: Mat = [1, 0, 0, 1, 0, 0];
  for (let i = 0; i < patch.history.length; i++) {
    const op = patch.history[i];
    const p = progress[i] ?? 1;
    const s = 1 - 2 * Math.min(1, Math.max(0, p));
    const step: Mat = op.axis === 'vertical' ? [s, 0, 0, 1, 0, 0] : [1, 0, 0, s, 0, 0];
    m = multiply(step, m);
  }
  return m;
}

/**
 * Unfold every layer back to its original position and union the result.
 *
 * `Patch.source` is already expressed in sheet coordinates (it is the preimage
 * of the layer's folded position), so unfolding is the set union of the layer
 * sources. Applying `patch.transform` here would fold the sheet *again* — the
 * classic double-mapping mistake this function exists to avoid.
 */
export function unfoldPatches(patches: Patch[]): MultiPolygon {
  const pieces = patches
    .filter((p) => multiPolygonArea(p.source) > 1e-12)
    .map((p) => p.source);
  if (pieces.length === 0) return [];
  return union(pieces[0], ...pieces.slice(1));
}

/** Distance from a point to the crease axis (used by hints / diagnostics). */
export function axisDistance(axis: FoldAxis, p: Vec2): number {
  return axis === 'vertical' ? Math.abs(p.x) : Math.abs(p.y);
}
