import { validateCut, type FoldPresetId, type StraightCut } from '../geometry';
import { multiPolygonArea, multiPolygonToPath } from '../geometry/polygon';
import { foldCutUnfold } from '../geometry/cut';
import { KEYS, readJson, writeJson } from '../services/storage';

export const ARTWORK_SCHEMA_VERSION = 1;

export type Manufacturing = 'verified' | 'digital-only' | 'unchecked';

export type ArtworkStyle = { paperColor: string; backgroundColor: string };

export type Artwork = {
  schemaVersion: number;
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  foldPreset: FoldPresetId;
  cuts: StraightCut[];
  style: ArtworkStyle;
  manufacturability: Manufacturing;
  /** Cached SVG path of the unfolded artwork (derived, for fast thumbnails). */
  previewPath: string;
  /** Area of the finished artwork, model units². */
  area: number;
  /** Nominal sheet half-size, model units. */
  paperHalf: number;
};

export type ArtworkDraft = {
  title: string;
  foldPreset: FoldPresetId;
  cuts: StraightCut[];
  style: ArtworkStyle;
};

const HEX = /^#[0-9a-fA-F]{6}$/;

function isCut(value: unknown): value is StraightCut {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  const res = validateCut({
    nx: Number(c.nx),
    ny: Number(c.ny),
    offset: Number(c.offset),
    removedSide: (c.removedSide === 'positive' ? 'positive' : 'negative') as StraightCut['removedSide'],
  });
  return res.ok;
}

/**
 * Rebuild an artwork from a persisted document. The geometry is recomputed from
 * the structured parameters, never restored from a cached image — that is what
 * makes an artwork editable after reload.
 */
export function normalizeArtwork(raw: unknown): Artwork | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const version = Number(r.schemaVersion ?? 0);
  if (!Number.isFinite(version) || version < 1 || version > ARTWORK_SCHEMA_VERSION) return null;

  const id = typeof r.id === 'string' && r.id.length > 0 ? r.id : null;
  const title = typeof r.title === 'string' && r.title.trim().length > 0 ? r.title.trim() : null;
  const foldPreset = r.foldPreset;
  if (!id || !title) return null;
  if (foldPreset !== 'none' && foldPreset !== 'vertical' && foldPreset !== 'horizontal' && foldPreset !== 'orthogonal2') {
    return null;
  }
  const cuts = Array.isArray(r.cuts) ? r.cuts.filter(isCut) : [];
  const styleRaw = (r.style ?? {}) as Record<string, unknown>;
  const paperColor = typeof styleRaw.paperColor === 'string' && HEX.test(styleRaw.paperColor) ? styleRaw.paperColor : '#B93645';
  const backgroundColor =
    typeof styleRaw.backgroundColor === 'string' && HEX.test(styleRaw.backgroundColor) ? styleRaw.backgroundColor : '#F8F3E9';

  return {
    schemaVersion: ARTWORK_SCHEMA_VERSION,
    id,
    title,
    createdAt: Number(r.createdAt) || Date.now(),
    updatedAt: Number(r.updatedAt) || Date.now(),
    foldPreset,
    cuts: cuts.map((c) => {
      const v = validateCut(c);
      return v.ok ? v.cut : { nx: 1, ny: 0, offset: 0, removedSide: 'negative' as const };
    }),
    style: { paperColor, backgroundColor },
    manufacturability:
      r.manufacturability === 'digital-only' || r.manufacturability === 'unchecked'
        ? r.manufacturability
        : 'verified',
    previewPath: typeof r.previewPath === 'string' ? r.previewPath : '',
    area: Number(r.area) || 0,
    paperHalf: Number(r.paperHalf) || 1,
  };
}

export function createArtwork(draft: ArtworkDraft, existingId?: string): Artwork {
  const now = Date.now();
  const id = existingId ?? `aw-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const previous = existingId ? getArtwork(existingId) : undefined;
  return {
    schemaVersion: ARTWORK_SCHEMA_VERSION,
    id,
    title: draft.title.trim() || '未命名剪纸',
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
    foldPreset: draft.foldPreset,
    cuts: draft.cuts,
    style: draft.style,
    manufacturability: 'verified',
    previewPath: '',
    area: 0,
    paperHalf: 1,
  };
}

export function withComputedPreview(artwork: Artwork): Artwork {
  const { unfolded } = foldCutUnfold(
    [
      [
        [
          { x: -artwork.paperHalf, y: -artwork.paperHalf },
          { x: artwork.paperHalf, y: -artwork.paperHalf },
          { x: artwork.paperHalf, y: artwork.paperHalf },
          { x: -artwork.paperHalf, y: artwork.paperHalf },
        ],
      ],
    ],
    artwork.foldPreset,
    artwork.cuts,
  );
  return {
    ...artwork,
    previewPath: multiPolygonToPath(unfolded, 4),
    area: multiPolygonArea(unfolded),
  };
}

export function listArtworks(): Artwork[] {
  const raw = readJson<unknown[]>(KEYS.gallery);
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeArtwork)
    .filter((a): a is Artwork => a !== null)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getArtwork(id: string): Artwork | undefined {
  return listArtworks().find((a) => a.id === id);
}

export function saveArtwork(artwork: Artwork): { ok: boolean; artwork: Artwork } {
  const computed = withComputedPreview(artwork);
  const all = listArtworks();
  const idx = all.findIndex((a) => a.id === computed.id);
  const next = idx >= 0 ? all.map((a) => (a.id === computed.id ? computed : a)) : [computed, ...all];
  const ok = writeJson(KEYS.gallery, next.slice(0, 120));
  return { ok, artwork: computed };
}

export function deleteArtwork(id: string): void {
  const all = listArtworks().filter((a) => a.id !== id);
  writeJson(KEYS.gallery, all);
}

export function duplicateArtwork(id: string): Artwork | null {
  const src = getArtwork(id);
  if (!src) return null;
  const now = Date.now();
  const copy: Artwork = {
    ...src,
    id: `aw-${now.toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title: `${src.title} 副本`,
    createdAt: now,
    updatedAt: now,
  };
  const { artwork } = saveArtwork(copy);
  return artwork;
}
