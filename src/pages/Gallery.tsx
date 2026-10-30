import { useCallback, useEffect, useState } from 'react';
import { navigate } from '../app/router';
import { Icon, Tag } from '../components/ui';
import { foldCutUnfold } from '../geometry/cut';
import { deleteArtwork, duplicateArtwork, listArtworks, type Artwork } from '../studio/artwork';
import { FOLD_PRESETS } from '../geometry/fold';
import { downloadSvg } from '../services/export';

export function GalleryPage() {
  const [items, setItems] = useState<Artwork[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(() => setItems(listArtworks()), []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onDelete = (id: string) => {
    deleteArtwork(id);
    refresh();
    setNotice('已删除该作品');
  };

  const onDuplicate = (id: string) => {
    const copy = duplicateArtwork(id);
    refresh();
    setNotice(copy ? `已复制为「${copy.title}」` : '复制失败');
  };

  const onExport = (a: Artwork) => {
    // Re-export from the stored parameters, not from the cached thumbnail path.
    const { unfolded } = foldCutUnfold(
      [
        [
          [
            { x: -a.paperHalf, y: -a.paperHalf },
            { x: a.paperHalf, y: -a.paperHalf },
            { x: a.paperHalf, y: a.paperHalf },
            { x: -a.paperHalf, y: a.paperHalf },
          ],
        ],
      ],
      a.foldPreset,
      a.cuts,
    );
    const name = downloadSvg({
      region: unfolded,
      paperColor: a.style.paperColor,
      backgroundColor: a.style.backgroundColor,
      title: a.title,
    });
    setNotice(`已导出 ${name}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Local gallery</p>
          <h1 className="font-display text-[1.9rem] leading-tight text-ink">我的作品</h1>
          <p className="mt-1 max-w-xl text-[0.84rem] leading-relaxed text-ink-soft">
            全部保存在这台设备的浏览器里，不上传、不需要账号。每件作品只保存折叠方案与切线参数，
            打开时会由几何引擎重新算出图案。
          </p>
        </div>
        <a href="#/studio" className="btn btn-primary py-2 text-[0.84rem]">
          <Icon name="scissors" size={15} />
          新建作品
        </a>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-teal/30 bg-teal/8 px-3 py-2 text-[0.78rem] text-teal">
          {notice}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-rule bg-white/35 px-6 py-16 text-center">
          <div className="mb-4 opacity-70">
            <Icon name="grid" size={34} />
          </div>
          <p className="font-display text-[1.15rem] text-ink">还没有作品</p>
          <p className="mt-1 max-w-sm text-[0.82rem] leading-relaxed text-ink-soft">
            去工坊折一张纸、剪一刀，然后把结果存下来。保存的作品可以再次编辑，也能导出矢量图。
          </p>
          <a href="#/studio" className="btn btn-ghost mt-5">
            进入剪纸工坊
          </a>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <article key={a.id} className="sheet-card overflow-hidden">
              <div
                className="relative aspect-square"
                style={{ background: a.style.backgroundColor }}
              >
                <svg viewBox="-1.06 -1.06 2.12 2.12" className="block h-full w-full">
                  <g transform="scale(1,-1)">
                    <path d={a.previewPath} fill={a.style.paperColor} fillRule="evenodd" />
                  </g>
                </svg>
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-[1.05rem] text-ink">{a.title}</h2>
                    <p className="mt-0.5 text-[0.7rem] text-ink-faint">
                      {FOLD_PRESETS[a.foldPreset].labelZh} · {a.cuts.length} 刀 · {new Date(a.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Tag tone="gold">v{a.schemaVersion}</Tag>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5 text-[0.74rem]">
                  <button
                    type="button"
                    className="btn btn-ghost px-2.5 py-1 text-[0.74rem]"
                    onClick={() => navigate({ name: 'studio', artworkId: a.id })}
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet px-2.5 py-1 text-[0.74rem]"
                    onClick={() => onExport(a)}
                  >
                    <Icon name="download" size={13} />
                    SVG
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet px-2.5 py-1 text-[0.74rem]"
                    onClick={() => onDuplicate(a.id)}
                  >
                    复制
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet ml-auto px-2 py-1 text-[0.74rem] text-ink-faint hover:text-red"
                    onClick={() => onDelete(a.id)}
                    aria-label={`删除 ${a.title}`}
                  >
                    <Icon name="trash" size={13} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="mt-8 text-[0.74rem] leading-relaxed text-ink-faint">
        存储位置：浏览器 localStorage，键名 <code className="font-mono">foldyssey.gallery.v1</code>。
        清理浏览器数据会一并删除作品，请先用 SVG 导出留档。
      </p>
    </div>
  );
}
