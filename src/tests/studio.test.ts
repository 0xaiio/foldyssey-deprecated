import { beforeEach, describe, expect, it } from 'vitest';
import { foldCutUnfold } from '../geometry/cut';
import { multiPolygonArea } from '../geometry/polygon';
import { squarePolygon } from '../geometry/polygon';
import { buildSvgDocument, exportFileName, slugify } from '../services/export';
import {
  ARTWORK_SCHEMA_VERSION,
  createArtwork,
  deleteArtwork,
  duplicateArtwork,
  getArtwork,
  listArtworks,
  normalizeArtwork,
  saveArtwork,
  withComputedPreview,
  type ArtworkDraft,
} from '../studio/artwork';
import { KEYS } from '../services/storage';
import { STUDIO_PRESETS } from '../studio/presets';

const DRAFT: ArtworkDraft = {
  title: '测试窗花',
  foldPreset: 'orthogonal2',
  cuts: [
    { nx: Math.SQRT1_2, ny: Math.SQRT1_2, offset: 0.62 / Math.SQRT2, removedSide: 'negative' },
    { nx: Math.SQRT1_2, ny: Math.SQRT1_2, offset: 1.2 / Math.SQRT2, removedSide: 'positive' },
  ],
  style: { paperColor: '#B93645', backgroundColor: '#F8F3E9' },
};

describe('artwork persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saves, lists and reloads an artwork from its parameters', () => {
    const artwork = createArtwork(DRAFT);
    const { ok, artwork: stored } = saveArtwork(artwork);
    expect(ok).toBe(true);
    expect(stored.previewPath.length).toBeGreaterThan(10);
    expect(stored.area).toBeGreaterThan(0);
    expect(stored.area).toBeLessThan(4);

    const all = listArtworks();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('测试窗花');
    expect(all[0].schemaVersion).toBe(ARTWORK_SCHEMA_VERSION);
    expect(all[0].cuts).toHaveLength(2);
  });

  it('recomputes the geometry instead of trusting the cached path', () => {
    const artwork = createArtwork(DRAFT);
    const { artwork: stored } = saveArtwork(artwork);
    const tampered = { ...stored, previewPath: 'M0 0L1 1Z', area: 999 };
    // Overwrite with a corrupted cache; the loader must keep the parameters and
    // recompute geometry, not crash and not trust the bogus area.
    window.localStorage.setItem(KEYS.gallery, JSON.stringify([tampered]));
    const reloaded = listArtworks()[0];
    expect(reloaded.cuts).toHaveLength(2);
    const recomputed = withComputedPreview(reloaded);
    expect(recomputed.area).toBeLessThan(4);
    expect(Math.abs(recomputed.area - stored.area)).toBeLessThan(1e-9);
  });

  it('rejects documents with an unknown schema version', () => {
    expect(normalizeArtwork({ schemaVersion: 99, id: 'x', title: 'y' })).toBeNull();
    expect(normalizeArtwork({ id: 'x', title: 'y' })).toBeNull();
    expect(normalizeArtwork(null)).toBeNull();
    expect(normalizeArtwork('nope')).toBeNull();
  });

  it('drops invalid cuts and falls back to safe colours', () => {
    const doc = normalizeArtwork({
      schemaVersion: 1,
      id: 'a1',
      title: 'ok',
      foldPreset: 'vertical',
      cuts: [
        { nx: 0, ny: 0, offset: 0, removedSide: 'negative' },
        { nx: 1, ny: 0, offset: 0.5, removedSide: 'positive' },
      ],
      style: { paperColor: 'red', backgroundColor: '#123456' },
    });
    expect(doc).not.toBeNull();
    // The degenerate cut is filtered out; the valid one survives.
    expect(doc?.cuts.length).toBe(1);
    expect(doc?.style.paperColor).toBe('#B93645');
    expect(doc?.style.backgroundColor).toBe('#123456');
  });

  it('deletes and duplicates artworks', () => {
    const { artwork } = saveArtwork(createArtwork(DRAFT));
    const copy = duplicateArtwork(artwork.id);
    expect(copy).not.toBeNull();
    expect(listArtworks()).toHaveLength(2);
    deleteArtwork(artwork.id);
    expect(listArtworks()).toHaveLength(1);
    expect(getArtwork(artwork.id)).toBeUndefined();
  });

  it('keeps createdAt when updating an existing artwork', () => {
    const { artwork } = saveArtwork(createArtwork(DRAFT));
    const updated = createArtwork({ ...DRAFT, title: '改名' }, artwork.id);
    expect(updated.createdAt).toBe(artwork.createdAt);
    saveArtwork(updated);
    const all = listArtworks();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('改名');
  });

  it('does not crash when localStorage holds garbage', () => {
    window.localStorage.setItem(KEYS.gallery, '{{{not json');
    expect(listArtworks()).toEqual([]);
    window.localStorage.setItem(KEYS.gallery, JSON.stringify([{ schemaVersion: 1 }, 42, null]));
    expect(listArtworks()).toEqual([]);
  });
});

describe('svg export', () => {
  it('writes a real vector path with the hole preserved', () => {
    const { unfolded } = foldCutUnfold([squarePolygon(1)], 'orthogonal2', [DRAFT.cuts[0]]);
    const svg = buildSvgDocument({
      region: unfolded,
      paperColor: '#B93645',
      backgroundColor: '#F8F3E9',
      title: '菱形 <测试>',
    });
    expect(svg.startsWith('<?xml')).toBe(true);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('fill-rule="evenodd"');
    // Two subpaths: outer boundary + inner hole ring.
    expect((svg.match(/M/g) ?? []).length).toBe(2);
    // No raster fallback, no external asset references.
    expect(svg).not.toContain('<image');
    expect(svg).not.toContain('xlink:href');
    expect(svg).not.toContain('href="http');
    // Title is XML-escaped, never injected raw.
    expect(svg).toContain('&lt;测试&gt;');
    expect(svg).not.toContain('<测试>');
  });

  it('omits the background rectangle when transparent is requested', () => {
    const { unfolded } = foldCutUnfold([squarePolygon(1)], 'none', []);
    const opaque = buildSvgDocument({ region: unfolded, paperColor: '#000000', backgroundColor: '#ffffff', title: 'x' });
    const clear = buildSvgDocument({ region: unfolded, paperColor: '#000000', backgroundColor: null, title: 'x' });
    expect(opaque).toContain('<rect');
    expect(clear).not.toContain('<rect');
    expect(clear).toContain('fill-rule="evenodd"');
  });

  it('produces filenames with a date and a safe slug', () => {
    expect(slugify('八角 窗花 / Test')).toMatch(/^[a-z0-9\u4e00-\u9fa5-]+$/);
    const name = exportFileName('八角窗花', 'svg');
    expect(name).toMatch(/^foldyssey-.+-\d{8}\.svg$/);
  });
});

describe('studio presets', () => {
  it('every preset produces a non-degenerate artwork', () => {
    const paper = [squarePolygon(1)];
    for (const preset of STUDIO_PRESETS) {
      const { unfolded } = foldCutUnfold(paper, preset.foldPreset, preset.cuts);
      const area = multiPolygonArea(unfolded);
      expect(area, preset.id).toBeGreaterThan(0.2);
      expect(area, preset.id).toBeLessThan(4);
    }
  });

  it('the diamond wreath preset really is a detached ring', () => {
    const wreath = STUDIO_PRESETS.find((p) => p.id === 'diamond-wreath');
    expect(wreath).toBeDefined();
    if (!wreath) return;
    const { unfolded } = foldCutUnfold([squarePolygon(1)], wreath.foldPreset, wreath.cuts);
    expect(unfolded).toHaveLength(1);
    expect(unfolded[0]).toHaveLength(2); // outer + hole
    const expected = 2 * 0.78 ** 2 - 2 * 0.34 ** 2;
    expect(Math.abs(multiPolygonArea(unfolded) - expected)).toBeLessThan(1e-9);
  });
});
