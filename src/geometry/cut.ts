import { apply } from './matrix';
import { difference, intersection, union } from './ops';
import {
  boundsOfMulti,
  clipConvexByHalfPlane,
  multiPolygonArea,
  transformMulti,
} from './polygon';
import type { MultiPolygon, Polygon, Vec2 } from './types';
import {
  unfoldPatches,
  type FoldedState,
  type FoldPresetId,
  type Patch,
  buildFoldState,
} from './fold';

/**
 * A single straight cut through the folded packet, expressed as a half-plane:
 *
 *   L = { p : n·p = offset },   removed region = { p : n·p < offset }   (negative)
 *                               removed region = { p : n·p > offset }   (positive)
 *
 * `n` is a unit normal in folded-packet coordinates. The cut removes *area*
 * (a half-plane), never a zero-width segment — subtracting a line would not
 * produce a hole, and claiming otherwise is the classic fold-and-cut mistake.
 */
export type StraightCut = {
  nx: number;
  ny: number;
  offset: number;
  removedSide: 'negative' | 'positive';
};

export type CutValidation = { ok: true; cut: StraightCut } | { ok: false; reason: string };

export function validateCut(input: StraightCut): CutValidation {
  const { nx, ny, offset } = input;
  if (![nx, ny, offset].every((n) => Number.isFinite(n))) {
    return { ok: false, reason: 'non-finite' };
  }
  const len = Math.hypot(nx, ny);
  if (len < 1e-9) return { ok: false, reason: 'zero-normal' };
  if (input.removedSide !== 'negative' && input.removedSide !== 'positive') {
    return { ok: false, reason: 'bad-side' };
  }
  return {
    ok: true,
    cut: { nx: nx / len, ny: ny / len, offset: offset / len, removedSide: input.removedSide },
  };
}

export function cutFromAngle(angleRad: number, distance: number, removedSide: StraightCut['removedSide']): StraightCut {
  return {
    nx: Math.cos(angleRad),
    ny: Math.sin(angleRad),
    offset: distance,
    removedSide,
  };
}

export function cutAngle(cut: StraightCut): number {
  return Math.atan2(cut.ny, cut.nx);
}

/** Signed distance from a point to the cut line. */
export function signedDistance(cut: StraightCut, p: Vec2): number {
  return cut.nx * p.x + cut.ny * p.y - cut.offset;
}

export function flipSide(cut: StraightCut): StraightCut {
  return { ...cut, removedSide: cut.removedSide === 'negative' ? 'positive' : 'negative' };
}

export type LayerRemoval = {
  patchId: string;
  /** Removed region expressed back in unfolded sheet coordinates. */
  region: MultiPolygon;
};

export type CutResult = {
  patches: Patch[];
  /** Removed area inside the packet (folded coordinates). */
  removedInPacket: MultiPolygon;
  /** Per-layer removed regions, unfolded coordinates (used for scraps + audit). */
  removedPerLayer: LayerRemoval[];
  /** False when the line does not touch any paper in the packet. */
  hit: boolean;
  /** Area removed from the packet (counts each layer once). */
  removedPacketArea: number;
  /** Total paper area removed across all layers. */
  removedPaperArea: number;
};

function expandedRect(bounds: { minX: number; minY: number; maxX: number; maxY: number }): Polygon {
  const pad = Math.max(1, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY);
  return [
    [
      { x: bounds.minX - pad, y: bounds.minY - pad },
      { x: bounds.maxX + pad, y: bounds.minY - pad },
      { x: bounds.maxX + pad, y: bounds.maxY + pad },
      { x: bounds.minX - pad, y: bounds.maxY + pad },
    ],
  ];
}

/** The removed half-plane, clipped to a finite box around the packet. */
export function cutHalfPlane(cut: StraightCut, packet: MultiPolygon): MultiPolygon {
  const rect = expandedRect(boundsOfMulti(packet));
  const ring = clipConvexByHalfPlane(rect[0], cut.nx, cut.ny, cut.offset, cut.removedSide);
  if (ring.length < 3) return [];
  return [[ring]];
}

/**
 * Apply one straight cut to every layer that the line actually crosses.
 *
 * For layer i with isometry f_i and source region P_i:
 *   D_i   = f_i(P_i) ∩ H⁻        (removed in packet space)
 *   P_i'  = P_i \ f_i⁻¹(D_i)
 *
 * The subtraction happens in the layer's own source coordinates, so a cut that
 * crosses several coincident layers removes the correct (possibly different)
 * region from each of them.
 */
export function applyCut(state: FoldedState, rawCut: StraightCut): CutResult {
  const validation = validateCut(rawCut);
  const cut = validation.ok
    ? validation.cut
    : { nx: 1, ny: 0, offset: Number.POSITIVE_INFINITY, removedSide: 'negative' as const };

  const halfPlane = cutHalfPlane(cut, state.packet);
  const removedInPacket = halfPlane.length > 0 ? intersection(state.packet, halfPlane) : [];

  const patches: Patch[] = [];
  const removedPerLayer: LayerRemoval[] = [];
  let removedPaperArea = 0;

  for (const patch of state.patches) {
    if (multiPolygonArea(patch.source) <= 1e-12) continue;
    const image = transformMulti(patch.source, (p) => apply(patch.transform, p));
    const layerRemovedInPacket = halfPlane.length > 0 ? intersection(image, halfPlane) : [];
    if (multiPolygonArea(layerRemovedInPacket) <= 1e-12) {
      patches.push(patch);
      continue;
    }
    const removedSource = transformMulti(layerRemovedInPacket, (p) => apply(patch.inverse, p));
    const remaining = difference(patch.source, removedSource);
    removedPaperArea += multiPolygonArea(removedSource);
    removedPerLayer.push({ patchId: patch.id, region: removedSource });
    if (multiPolygonArea(remaining) > 1e-12) {
      patches.push({ ...patch, source: remaining });
    }
  }

  return {
    patches,
    removedInPacket,
    removedPerLayer,
    hit: multiPolygonArea(removedInPacket) > 1e-12,
    removedPacketArea: multiPolygonArea(removedInPacket),
    removedPaperArea,
  };
}

export type FoldCutUnfold = {
  folded: FoldedState;
  result: CutResult;
  /** Final unfolded sheet after all cuts. */
  unfolded: MultiPolygon;
};

/** Convenience pipeline used by both the puzzle and the studio. */
export function foldCutUnfold(
  paper: MultiPolygon,
  presetId: FoldPresetId,
  cuts: StraightCut[],
): FoldCutUnfold {
  const folded = buildFoldState(paper, presetId);
  let patches = folded.patches;
  let lastResult: CutResult = {
    patches,
    removedInPacket: [],
    removedPerLayer: [],
    hit: false,
    removedPacketArea: 0,
    removedPaperArea: 0,
  };
  for (const cut of cuts) {
    const state: FoldedState = { ...folded, patches, packet: unionOfPatches(patches) };
    lastResult = applyCut(state, cut);
    patches = lastResult.patches;
  }
  return {
    folded: { ...folded, patches, packet: unionOfPatches(patches) },
    result: lastResult,
    unfolded: unfoldPatches(patches),
  };
}

export function unionOfPatches(patches: Patch[]): MultiPolygon {
  const pieces = patches
    .filter((p) => multiPolygonArea(p.source) > 1e-12)
    .map((p) => transformMulti(p.source, (q) => apply(p.transform, q)));
  if (pieces.length === 0) return [];
  // The packet is a set union of layers; overlapping layers must be merged.
  return union(pieces[0], ...pieces.slice(1));
}
