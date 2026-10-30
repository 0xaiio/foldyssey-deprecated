import { useCallback, useMemo, useRef, useState } from 'react';
import { navigate } from '../app/router';
import { PaperStage } from '../components/PaperStage';
import { Icon, SliderRow, Tag } from '../components/ui';
import {
  applyCut,
  cutAngle,
  cutFromAngle,
  cutHalfPlane,
  intersection,
  multiPolygonArea,
  multiPolygonToPath,
  unionOfPatches,
  unfoldPatches,
  type FoldPresetId,
  type FoldedState,
  type StraightCut,
} from '../geometry';
import { FOLD_PRESET_IDS, FOLD_PRESETS, buildFoldState } from '../geometry/fold';
import { PAPER } from '../puzzle/levels';
import {
  createArtwork,
  getArtwork,
  saveArtwork,
  type Artwork,
  type ArtworkStyle,
} from '../studio/artwork';
import { BACKGROUND_SWATCHES, PAPER_SWATCHES, STUDIO_PRESETS, presetById } from '../studio/presets';
import { copyText, downloadPng, downloadSvg } from '../services/export';

type StudioDoc = {
  title: string;
  foldPreset: FoldPresetId;
  cuts: StraightCut[];
  style: ArtworkStyle;
};

function docFromPreset(id: string): StudioDoc {
  const preset = presetById(id) ?? STUDIO_PRESETS[0];
  return {
    title: preset.titleZh,
    foldPreset: preset.foldPreset,
    cuts: preset.cuts.map((c) => ({ ...c })),
    style: { ...preset.style },
  };
}

function docFromArtwork(a: Artwork): StudioDoc {
  return {
    title: a.title,
    foldPreset: a.foldPreset,
    cuts: a.cuts.map((c) => ({ ...c })),
    style: { ...a.style },
  };
}

function useHistory(initial: StudioDoc) {
  const [state, setState] = useState<{ doc: StudioDoc; past: StudioDoc[]; future: StudioDoc[] }>({
    doc: initial,
    past: [],
    future: [],
  });
  const lastKey = useRef('');
  const lastAt = useRef(0);

  const update = useCallback((next: StudioDoc, key = '') => {
    setState((s) => {
      const now = Date.now();
      const coalesce = key !== '' && key === lastKey.current && now - lastAt.current < 700;
      lastKey.current = key;
      lastAt.current = now;
      return {
        doc: next,
        past: coalesce ? s.past : [...s.past.slice(-40), s.doc],
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((s) =>
      s.past.length === 0
        ? s
        : { doc: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.doc, ...s.future] },
    );
    lastKey.current = '';
  }, []);

  const redo = useCallback(() => {
    setState((s) =>
      s.future.length === 0 ? s : { doc: s.future[0], past: [...s.past, s.doc], future: s.future.slice(1) },
    );
    lastKey.current = '';
  }, []);

  const reset = useCallback((doc: StudioDoc) => {
    setState({ doc, past: [], future: [] });
    lastKey.current = '';
  }, []);

  return {
    doc: state.doc,
    update,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

export function StudioPage({ artworkId }: { artworkId?: string }) {
  const loaded = artworkId ? getArtwork(artworkId) : undefined;
  const initial = useMemo(() => (loaded ? docFromArtwork(loaded) : docFromPreset('window-flower')), [loaded]);
  return <StudioRunner initial={initial} artworkId={loaded?.id ?? null} />;
}

function StudioRunner({ initial, artworkId }: { initial: StudioDoc; artworkId: string | null }) {
  const history = useHistory(initial);
  const doc = history.doc;
  const [selected, setSelected] = useState(() => (initial.cuts.length > 0 ? initial.cuts.length - 1 : -1));
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [transparent, setTransparent] = useState(false);
  const [showSpec, setShowSpec] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(artworkId);

  const stages: FoldedState[] = useMemo(() => {
    const folded = buildFoldState(PAPER, doc.foldPreset);
    const list: FoldedState[] = [folded];
    let patches = folded.patches;
    for (const c of doc.cuts) {
      const state: FoldedState = { ...folded, patches, packet: unionOfPatches(patches) };
      const result = applyCut(state, c);
      patches = result.patches;
      list.push({ ...folded, patches, packet: unionOfPatches(patches) });
    }
    return list;
  }, [doc.foldPreset, doc.cuts]);

  const finalStage = stages[stages.length - 1];
  const unfolded = useMemo(() => unfoldPatches(finalStage.patches), [finalStage]);
  const unfoldedArea = useMemo(() => multiPolygonArea(unfolded), [unfolded]);

  const editorIndex = selected >= 0 ? selected : 0;
  const editorStage = stages[Math.min(editorIndex, stages.length - 1)] ?? stages[0];
  const activeCut = selected >= 0 ? doc.cuts[selected] : null;

  const removedPreview = useMemo(() => {
    if (!activeCut) return [];
    return intersection(editorStage.packet, cutHalfPlane(activeCut, editorStage.packet));
  }, [activeCut, editorStage]);

  const setCut = (index: number, next: StraightCut, key?: string) => {
    history.update({ ...doc, cuts: doc.cuts.map((c, i) => (i === index ? next : c)) }, key);
  };

  const addCut = () => {
    const base = doc.cuts[doc.cuts.length - 1];
    const next: StraightCut = base
      ? { ...base, offset: Math.max(-1.5, Math.min(1.5, base.offset - 0.12)) }
      : cutFromAngle(Math.PI / 4, 0.4, 'negative');
    const cuts = [...doc.cuts, next];
    history.update({ ...doc, cuts });
    setSelected(cuts.length - 1);
  };

  const removeCut = (index: number) => {
    const cuts = doc.cuts.filter((_, i) => i !== index);
    history.update({ ...doc, cuts });
    setSelected(cuts.length - 1);
  };

  const applyPreset = (id: string) => {
    const next = docFromPreset(id);
    history.reset({ ...next, style: doc.style });
    setSelected(next.cuts.length - 1);
    setStatus(null);
  };

  const save = (asNew = false) => {
    const draft = {
      title: doc.title,
      foldPreset: doc.foldPreset,
      cuts: doc.cuts,
      style: doc.style,
    };
    const artwork = createArtwork(draft, asNew ? undefined : (currentId ?? undefined));
    const { ok, artwork: computed } = saveArtwork(artwork);
    if (ok) {
      setCurrentId(asNew ? computed.id : currentId ?? computed.id);
      setSavedAt(computed.updatedAt);
      setStatus({ kind: 'ok', text: asNew ? '已另存为新作品' : '已保存到本地作品集' });
    } else {
      setStatus({ kind: 'err', text: '本地存储不可用（可能是隐私模式或空间已满）' });
    }
  };

  const exportOpts = {
    region: unfolded,
    paperColor: doc.style.paperColor,
    backgroundColor: transparent ? null : doc.style.backgroundColor,
    title: doc.title,
  };

  const doExportSvg = () => {
    const name = downloadSvg(exportOpts);
    setStatus({ kind: 'ok', text: `已导出 ${name}` });
  };

  const doExportPng = async () => {
    try {
      const name = await downloadPng(exportOpts);
      setStatus({ kind: 'ok', text: `已导出 ${name}` });
    } catch {
      setStatus({ kind: 'err', text: 'PNG 导出失败，请改用 SVG' });
    }
  };

  const share = async () => {
    const text = [
      `《${doc.title}》 · Foldyssey 一刀万象`,
      `折叠：${FOLD_PRESETS[doc.foldPreset].labelZh}`,
      `切 ${doc.cuts.length} 刀，剩余面积 ${unfoldedArea.toFixed(4)}（原纸 4.0000）`,
      '图案由折剪几何引擎计算生成，非预置图片。',
    ].join('\n');
    const ok = await copyText(text);
    setStatus(ok ? { kind: 'ok', text: '作品参数已复制到剪贴板' } : { kind: 'err', text: '复制失败，请手动截图' });
  };

  const paperHalfCm = 10;

  return (
    <div className="mx-auto max-w-6xl px-5 py-7">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-1">Paper Art Studio</p>
          <h1 className="font-display text-[1.9rem] leading-tight text-ink">剪纸工坊</h1>
          <p className="mt-1 max-w-xl text-[0.84rem] leading-relaxed text-ink-soft">
            左边是折叠后的纸包，右边是实时展开图。每一刀都是折叠纸包中的一条完整直线，
            结果由几何引擎逐层计算——右侧预览与导出的 SVG 使用同一份数据。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-ghost py-2 text-[0.82rem]" onClick={addCut}>
            <Icon name="scissors" size={14} />
            加一刀
          </button>
          <button type="button" className="btn btn-ghost py-2 text-[0.82rem]" onClick={() => history.undo()} disabled={!history.canUndo}>
            <Icon name="undo" size={14} />
            撤销
          </button>
          <button type="button" className="btn btn-ghost py-2 text-[0.82rem]" onClick={() => history.redo()} disabled={!history.canRedo}>
            <Icon name="redo" size={14} />
            重做
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
        <div className="space-y-4">
          <div className="stage-card px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[0.78rem] text-ink-soft">
                折叠纸包 · {FOLD_PRESETS[doc.foldPreset].labelZh}
              </span>
              <span className="text-[0.7rem] text-ink-faint">{editorStage.patches.length} 层</span>
            </div>
            <PaperStage
              patches={editorStage.patches}
              cut={activeCut}
              removedPreview={removedPreview}
              onCutChange={activeCut ? (next) => setCut(selected, next, 'canvas') : undefined}
              showHandles={Boolean(activeCut)}
              creases={['vertical', 'horizontal']}
              grid
              paperColor={doc.style.paperColor}
              ariaLabel="折叠纸包与切线编辑区"
            />
            {!activeCut && (
              <p className="mt-2 text-center text-[0.78rem] text-ink-faint">
                还没有切线。点“加一刀”开始。
              </p>
            )}
          </div>

          <div className="sheet-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">折叠方案</p>
              <span className="text-[0.68rem] text-ink-faint">仅提供已验证的固定折法</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {FOLD_PRESET_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    history.update({ ...doc, foldPreset: id });
                    setStatus(null);
                  }}
                  className={`rounded-xl border px-3 py-2 text-left text-[0.78rem] transition-colors ${
                    doc.foldPreset === id
                      ? 'border-red/40 bg-red/10 text-red'
                      : 'border-rule bg-white/50 text-ink-soft hover:border-ink/20'
                  }`}
                >
                  {FOLD_PRESETS[id].labelZh}
                  <span className="mt-0.5 block text-[0.66rem] text-ink-faint">{FOLD_PRESETS[id].symmetryZh}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">切线列表</p>
              <span className="text-[0.68rem] text-ink-faint">{doc.cuts.length} 刀</span>
            </div>
            <div className="space-y-2">
              {doc.cuts.length === 0 && <p className="text-[0.78rem] text-ink-faint">暂无切线</p>}
              {doc.cuts.map((c, i) => (
                <div
                  key={i}
                  className={`rounded-xl border px-3 py-2 transition-colors ${
                    selected === i ? 'border-red/40 bg-red/5' : 'border-rule bg-white/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      className="flex-1 text-left text-[0.8rem] text-ink"
                      onClick={() => setSelected(i)}
                    >
                      第 {i + 1} 刀
                      <span className="ml-2 font-mono text-[0.72rem] text-ink-faint">
                        {((cutAngle(c) * 180) / Math.PI).toFixed(0)}° · {c.offset.toFixed(2)} ·{' '}
                        {c.removedSide === 'negative' ? '−' : '+'}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`删除第 ${i + 1} 刀`}
                      className="rounded-full p-1 text-ink-faint hover:bg-ink/5 hover:text-red"
                      onClick={() => removeCut(i)}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                  {selected === i && (
                    <div className="mt-2 space-y-2 border-t border-rule/70 pt-2">
                      <SliderRow
                        id={`studio-angle-${i}`}
                        label="角度"
                        value={(((cutAngle(c) * 180) / Math.PI) + 360) % 360}
                        min={0}
                        max={360}
                        step={1}
                        onChange={(v) => {
                          const rad = (v * Math.PI) / 180;
                          setCut(i, cutFromAngle(rad, c.offset, c.removedSide), `angle-${i}`);
                        }}
                        format={(v) => `${v.toFixed(0)}°`}
                      />
                      <SliderRow
                        id={`studio-offset-${i}`}
                        label="偏移（到中心距离）"
                        value={c.offset}
                        min={-1.6}
                        max={1.6}
                        step={0.001}
                        onChange={(v) => setCut(i, { ...c, offset: v }, `offset-${i}`)}
                        format={(v) => v.toFixed(3)}
                      />
                      <button
                        type="button"
                        className="btn btn-ghost w-full py-1.5 text-[0.76rem]"
                        onClick={() => setCut(i, { ...c, removedSide: c.removedSide === 'negative' ? 'positive' : 'negative' })}
                      >
                        <Icon name="flip" size={13} />
                        换保留侧（当前剪去{c.removedSide === 'negative' ? '负侧' : '正侧'}）
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="stage-card overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4">
              <span className="text-[0.78rem] text-ink-soft">展开预览（实时）</span>
              <Tag tone="teal">几何引擎输出</Tag>
            </div>
            <div className="p-4">
              <svg
                viewBox="-1.06 -1.06 2.12 2.12"
                className="block w-full rounded-xl"
                role="img"
                aria-label="展开后的剪纸图案预览"
              >
                {!transparent && (
                  <rect x="-1.06" y="-1.06" width="2.12" height="2.12" fill={doc.style.backgroundColor} />
                )}
                <g transform="scale(1,-1)">
                  <path
                    d={multiPolygonToPath(unfolded, 5)}
                    fill={doc.style.paperColor}
                    fillRule="evenodd"
                    stroke="rgba(40,22,16,0.12)"
                    strokeWidth={0.6}
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              </svg>
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-rule/70 px-4 py-3 text-center">
              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.12em] text-ink-faint">剩余面积</p>
                <p className="font-mono text-[0.9rem] tabular-nums text-ink">{unfoldedArea.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.12em] text-ink-faint">原纸面积</p>
                <p className="font-mono text-[0.9rem] tabular-nums text-ink">4.0000</p>
              </div>
              <div>
                <p className="text-[0.64rem] uppercase tracking-[0.12em] text-ink-faint">切口数</p>
                <p className="font-mono text-[0.9rem] tabular-nums text-ink">{doc.cuts.length}</p>
              </div>
            </div>
          </div>

          <div className="sheet-card p-4">
            <p className="eyebrow mb-2">美学预设</p>
            <div className="grid grid-cols-2 gap-2">
              {STUDIO_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.id)}
                  className="rounded-xl border border-rule bg-white/50 px-3 py-2 text-left transition-colors hover:border-ink/25"
                >
                  <span className="text-[0.8rem] text-ink">{p.titleZh}</span>
                  <span className="mt-0.5 block text-[0.66rem] leading-snug text-ink-faint">{p.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="sheet-card p-4">
            <p className="eyebrow mb-2">配色</p>
            <div className="space-y-2">
              <Swatches
                label="纸色"
                values={PAPER_SWATCHES}
                active={doc.style.paperColor}
                onChange={(v) => history.update({ ...doc, style: { ...doc.style, paperColor: v } }, 'paper')}
              />
              <Swatches
                label="底色"
                values={BACKGROUND_SWATCHES}
                active={doc.style.backgroundColor}
                onChange={(v) => history.update({ ...doc, style: { ...doc.style, backgroundColor: v } }, 'bg')}
              />
            </div>
          </div>

          <div className="sheet-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">作品</p>
              <Tag tone="gold">折剪方案已验证</Tag>
            </div>
            <label className="block text-[0.72rem] text-ink-faint" htmlFor="artwork-title">
              名称
            </label>
            <input
              id="artwork-title"
              className="mt-1 w-full rounded-xl border border-rule bg-white/70 px-3 py-2 text-[0.88rem] text-ink outline-none focus:border-teal/60"
              value={doc.title}
              maxLength={40}
              onChange={(e) => history.update({ ...doc, title: e.target.value }, 'title')}
            />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="btn btn-primary py-2 text-[0.8rem]" onClick={() => save(false)}>
                <Icon name="save" size={14} />
                {currentId ? '保存修改' : '保存作品'}
              </button>
              <button type="button" className="btn btn-ghost py-2 text-[0.8rem]" onClick={() => save(true)}>
                另存为新作品
              </button>
              <button type="button" className="btn btn-ghost py-2 text-[0.8rem]" onClick={doExportSvg}>
                <Icon name="download" size={14} />
                导出 SVG
              </button>
              <button type="button" className="btn btn-ghost py-2 text-[0.8rem]" onClick={doExportPng}>
                <Icon name="download" size={14} />
                导出 PNG
              </button>
            </div>
            <label className="mt-2 flex items-center gap-2 text-[0.74rem] text-ink-soft">
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="h-3.5 w-3.5 accent-[#378C86]"
              />
              PNG / SVG 使用透明背景
            </label>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-quiet py-1 text-[0.76rem]" onClick={share}>
                <Icon name="spark" size={13} />
                复制作品参数
              </button>
              <button type="button" className="btn btn-quiet py-1 text-[0.76rem]" onClick={() => setShowSpec((v) => !v)}>
                <Icon name="info" size={13} />
                {showSpec ? '收起制作卡' : '手工制作卡'}
              </button>
              {currentId && (
                <button
                  type="button"
                  className="btn btn-quiet py-1 text-[0.76rem]"
                  onClick={() => navigate({ name: 'gallery' })}
                >
                  去作品集
                </button>
              )}
            </div>
            {status && (
              <p className={`mt-2 text-[0.74rem] ${status.kind === 'ok' ? 'text-teal' : 'text-red'}`}>{status.text}</p>
            )}
            {savedAt && !status && (
              <p className="mt-2 text-[0.72rem] text-ink-faint">
                上次保存：{new Date(savedAt).toLocaleTimeString()}
              </p>
            )}
          </div>

          {showSpec && (
            <div className="sheet-card p-4">
              <p className="eyebrow mb-2">手工制作卡</p>
              <ol className="space-y-1.5 text-[0.78rem] leading-relaxed text-ink-soft">
                <li>
                  <span className="text-ink">纸张：</span>正方形 {paperHalfCm * 2} cm × {paperHalfCm * 2} cm（模型半边长 a = 1）
                </li>
                {FOLD_PRESETS[doc.foldPreset].ops.map((op, i) => (
                  <li key={op.id}>
                    <span className="text-ink">折叠 {i + 1}：</span>
                    {op.labelZh}
                  </li>
                ))}
                {doc.cuts.map((c, i) => {
                  const angle = ((cutAngle(c) * 180) / Math.PI + 360) % 360;
                  return (
                    <li key={i}>
                      <span className="text-ink">第 {i + 1} 刀：</span>法向量 {angle.toFixed(0)}°，
                      距折叠中心 {(Math.abs(c.offset) * paperHalfCm).toFixed(1)} cm，
                      剪去{c.removedSide === 'negative' ? '靠近中心' : '远离中心'}的一侧
                    </li>
                  );
                })}
                <li>
                  <span className="text-ink">展开预期：</span>剩余面积 {unfoldedArea.toFixed(4)}（占原纸{' '}
                  {((unfoldedArea / 4) * 100).toFixed(1)}%）
                </li>
              </ol>
              <p className="mt-2 text-[0.7rem] leading-relaxed text-ink-faint">
                纸张厚度、纤维方向与折叠精度会影响实际效果；本卡仅描述几何层可复现的折叠与剪切。
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Swatches({
  label,
  values,
  active,
  onChange,
}: {
  label: string;
  values: { name: string; value: string }[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[0.72rem] text-ink-faint">{label}</p>
      <div className="flex flex-wrap items-center gap-2">
        {values.map((s) => (
          <button
            key={s.value}
            type="button"
            title={s.name}
            aria-label={`${label}：${s.name}`}
            onClick={() => onChange(s.value)}
            className={`h-7 w-7 rounded-full border transition-transform ${
              active.toLowerCase() === s.value.toLowerCase()
                ? 'scale-110 border-ink/60 ring-2 ring-offset-1 ring-offset-paper'
                : 'border-rule hover:scale-105'
            }`}
            style={{ background: s.value }}
          />
        ))}
        <label className="ml-1 inline-flex items-center gap-1 text-[0.7rem] text-ink-faint">
          自定义
          <input
            type="color"
            value={active}
            onChange={(e) => onChange(e.target.value)}
            className="h-6 w-6 cursor-pointer rounded border border-rule bg-transparent p-0"
            aria-label={`${label}自定义颜色`}
          />
        </label>
      </div>
    </div>
  );
}
