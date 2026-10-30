import { cutFromAngle, type FoldPresetId, type StraightCut } from '../geometry';
import type { ArtworkStyle } from './artwork';

export type StudioPreset = {
  id: string;
  titleZh: string;
  titleEn: string;
  note: string;
  foldPreset: FoldPresetId;
  cuts: StraightCut[];
  style: ArtworkStyle;
  /** What the geometry actually produces, in one honest sentence. */
  resultZh: string;
};

const deg = (d: number) => (d * Math.PI) / 180;

function cut(angleDeg: number, distance: number, removedSide: StraightCut['removedSide']): StraightCut {
  return cutFromAngle(deg(angleDeg), distance, removedSide);
}

export const PAPER_SWATCHES = [
  { name: '中国红', value: '#B93645' },
  { name: '朱砂', value: '#D84A49' },
  { name: '墨黑', value: '#242725' },
  { name: '青绿', value: '#378C86' },
  { name: '暖金', value: '#C9A46A' },
  { name: '宣纸白', value: '#F2E8D5' },
];

export const BACKGROUND_SWATCHES = [
  { name: '宣纸', value: '#F8F3E9' },
  { name: '米纸', value: '#EFE6D6' },
  { name: '墨底', value: '#2E3330' },
  { name: '深青', value: '#378C86' },
  { name: '暗红', value: '#6d2029' },
];

export const STUDIO_PRESETS: StudioPreset[] = [
  {
    id: 'window-flower',
    titleZh: '中国窗花',
    titleEn: 'Window Flower',
    note: '八边形轮廓 + 中央菱形孔洞，最接近传统窗花的骨架。',
    foldPreset: 'orthogonal2',
    cuts: [cut(45, 0.62 / Math.SQRT2, 'negative'), cut(45, 1.2 / Math.SQRT2, 'positive')],
    style: { paperColor: '#B93645', backgroundColor: '#F8F3E9' },
    resultZh: '先挖出 |x|+|y| < 0.62 的菱形孔，再削掉四个角，得到八边形外框。',
  },
  {
    id: 'diamond-wreath',
    titleZh: '四方雪花',
    titleEn: 'Diamond Wreath',
    note: '两刀切出一枚悬空的菱形花环 —— 内外边界都是菱形。',
    foldPreset: 'orthogonal2',
    cuts: [cut(45, 0.34 / Math.SQRT2, 'negative'), cut(45, 0.78 / Math.SQRT2, 'positive')],
    style: { paperColor: '#F2E8D5', backgroundColor: '#378C86' },
    resultZh: '留下 0.34 ≤ |x|+|y| ≤ 0.78 的环带，纸与外界完全分离。',
  },
  {
    id: 'kaleidoscope',
    titleZh: '几何万花筒',
    titleEn: 'Kaleidoscope',
    note: '把法向量转 25°，菱形被拉长；再削角，形成细长的取景窗。',
    foldPreset: 'orthogonal2',
    cuts: [cut(25, 0.26, 'negative'), cut(45, 1.15 / Math.SQRT2, 'positive')],
    style: { paperColor: '#242725', backgroundColor: '#E5DED0' },
    resultZh: '孔洞顶点为 (±0.287, 0) 与 (0, ±0.615)，外轮廓仍是八边形。',
  },
  {
    id: 'festival-banner',
    titleZh: '节日彩旗',
    titleEn: 'Festival Banner',
    note: '水平对折，左右各剪一个 V 形缺口，像一面挂起来的旗。',
    foldPreset: 'horizontal',
    cuts: [cut(45, 1.45 / Math.SQRT2, 'positive'), cut(135, 1.45 / Math.SQRT2, 'positive')],
    style: { paperColor: '#D84A49', backgroundColor: '#F8F3E9' },
    resultZh: '左右两侧各留下一处对称的三角缺口，中间保持完整。',
  },
];

export function presetById(id: string): StudioPreset | undefined {
  return STUDIO_PRESETS.find((p) => p.id === id);
}
