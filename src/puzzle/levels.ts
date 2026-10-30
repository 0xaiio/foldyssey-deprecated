import {
  DEFAULT_TOLERANCE,
  foldCutUnfold,
  multiPolygonArea,
  type FoldPresetId,
  type MultiPolygon,
  type StraightCut,
  type Tolerance,
} from '../geometry';
import { squarePolygon } from '../geometry/polygon';

export type Localized = { zh: string; en: string };

export type LevelHints = {
  observe: Localized;
  adjust: Localized;
  solution: Localized;
};

export type CutLimits = {
  /** When set, the cut angle is fixed for this level (radians, 0 = normal +x). */
  angleLocked: number | null;
  /** Maximum |offset| the sliders allow. */
  maxAbsOffset: number;
};

export type PuzzleLevel = {
  id: string;
  order: number;
  titleZh: string;
  titleEn: string;
  subtitleZh: string;
  subtitleEn: string;
  difficulty: 1 | 2 | 3;
  foldPreset: FoldPresetId;
  /** Cut that produces the target by forward construction (never hand-drawn). */
  canonicalCut: StraightCut;
  target: MultiPolygon;
  targetArea: number;
  limits: CutLimits;
  tolerance: Tolerance;
  hints: LevelHints;
  knowledgeZh: string;
  knowledgeEn: string;
  initialCut: StraightCut;
  version: number;
  /** Deterministic seed for the (non-random) construction, kept for provenance. */
  seed: number;
};

export const PAPER: MultiPolygon = [squarePolygon(1)];
export const PAPER_AREA = 4;

const SQRT1_2 = Math.SQRT1_2;

type LevelSpec = Omit<PuzzleLevel, 'target' | 'targetArea' | 'order' | 'version' | 'seed'>;

const SPECS: LevelSpec[] = [
  {
    id: 'corner-first',
    titleZh: '角落初探',
    titleEn: 'Corner First',
    subtitleZh: '不折叠，一刀切掉一个角。',
    subtitleEn: 'No fold. One cut, one corner.',
    difficulty: 1,
    foldPreset: 'none',
    canonicalCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 1.55 * SQRT1_2, removedSide: 'positive' },
    limits: { angleLocked: null, maxAbsOffset: 1.7 },
    tolerance: { iouPerfect: 0.995, iouClose: 0.96 },
    hints: {
      observe: {
        zh: '目标纸形缺了一个角：那是右上角 (1, 1)。',
        en: 'The target silhouette is missing a corner: the top-right one at (1, 1).',
      },
      adjust: {
        zh: '把切线移到右上角外面，并让被剪掉的一侧朝向角外。',
        en: 'Push the line past the top-right corner and shade the side facing outwards.',
      },
      solution: {
        zh: '切线 x + y = 1.55，剪去 x + y > 1.55 的一侧。',
        en: 'Cut along x + y = 1.55 and remove the side where x + y > 1.55.',
      },
    },
    knowledgeZh: '一刀切出一条直线边界：切线位置决定留下多少，保留侧决定切掉哪一边。',
    knowledgeEn: 'One cut produces one straight edge. Offset sets how much stays; the kept side sets which part goes.',
    initialCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 1.2, removedSide: 'positive' },
  },
  {
    id: 'mirror-gate',
    titleZh: '镜像之门',
    titleEn: 'Mirror Gate',
    subtitleZh: '竖直对折一次，一刀剪出左右对称的斜顶。',
    subtitleEn: 'Fold once vertically. One cut, two mirrored corners.',
    difficulty: 1,
    foldPreset: 'vertical',
    canonicalCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 1.2 * SQRT1_2, removedSide: 'positive' },
    limits: { angleLocked: null, maxAbsOffset: 1.7 },
    tolerance: { iouPerfect: 0.995, iouClose: 0.94 },
    hints: {
      observe: {
        zh: '目标关于竖直中线对称：两个顶角同时被削掉。',
        en: 'The target is mirror-symmetric about the vertical centre line: both top corners are gone.',
      },
      adjust: {
        zh: '折好后只需处理纸包的右上角，另一侧会自动镜像。',
        en: 'Once folded you only cut the packet’s top-right corner; the mirror side comes for free.',
      },
      solution: {
        zh: '纸包内切线 u + v = 1.2，剪去 u + v > 1.2（纸包外侧）的一侧。',
        en: 'In the packet cut along u + v = 1.2, removing u + v > 1.2.',
      },
    },
    knowledgeZh: '折叠把两个位置重合：纸包上的一个角，展开后变成两个对称的角。',
    knowledgeEn: 'A fold makes two places coincide: one corner in the packet becomes two mirrored corners in the sheet.',
    initialCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 0.95, removedSide: 'positive' },
  },
  {
    id: 'diamond-miracle',
    titleZh: '菱形奇迹',
    titleEn: 'Diamond Miracle',
    subtitleZh: '正交双折，剪掉纸包的内角，展开是一枚菱形孔洞。',
    subtitleEn: 'Two folds, cut the packet corner, unfold a diamond hole.',
    difficulty: 2,
    foldPreset: 'orthogonal2',
    canonicalCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 0.34 * SQRT1_2, removedSide: 'negative' },
    limits: { angleLocked: null, maxAbsOffset: 1.2 },
    tolerance: DEFAULT_TOLERANCE,
    hints: {
      observe: {
        zh: '纸包的内角 (0, 0) 就是整张纸的中心。',
        en: 'The packet’s inner corner (0, 0) is the centre of the whole sheet.',
      },
      adjust: {
        zh: '把切线斜放在内角附近，让被剪掉的三角形贴着纸包的内角。',
        en: 'Place the line near the inner corner so the removed triangle hugs it.',
      },
      solution: {
        zh: '切线 u + v = d，d ≈ 0.34，剪去 u + v < d 的一侧；展开得 |x| + |y| < 0.34 的菱形，面积 2d²。',
        en: 'Cut u + v = d with d ≈ 0.34 and remove u + v < d. The hole is |x| + |y| < 0.34 with area 2d².',
      },
    },
    knowledgeZh: '纸包的内角映射到纸的中心，因此“切掉纸包的一个角”会在纸中央留下孔洞。',
    knowledgeEn: 'The packet’s inner corner maps to the sheet’s centre, so cutting that corner opens a hole in the middle.',
    initialCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 0.55, removedSide: 'negative' },
  },
  {
    id: 'size-riddle',
    titleZh: '大小之谜',
    titleEn: 'Size Riddle',
    subtitleZh: '角度已锁定，只调一个数：让孔洞刚好长大。',
    subtitleEn: 'Angle locked. One number to tune: grow the hole exactly.',
    difficulty: 2,
    foldPreset: 'orthogonal2',
    canonicalCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 0.62 * SQRT1_2, removedSide: 'negative' },
    limits: { angleLocked: Math.PI / 4, maxAbsOffset: 1.2 },
    tolerance: { iouPerfect: 0.995, iouClose: 0.97 },
    hints: {
      observe: {
        zh: '形状对了，只是比上一关的孔大得多。',
        en: 'The shape is right — the hole is simply much larger than before.',
      },
      adjust: {
        zh: '角度固定 45°，只拖动切线位置。孔洞面积 = 2d²，d 就是切线的偏移量。',
        en: 'Angle is fixed at 45°; only move the line. Hole area = 2d², where d is the offset.',
      },
      solution: {
        zh: '切线 u + v = 0.62，剪去 u + v < 0.62 的一侧。',
        en: 'Cut u + v = 0.62 and remove u + v < 0.62.',
      },
    },
    knowledgeZh: '孔洞面积随偏移量平方增长：d 翻倍，孔洞面积变四倍。',
    knowledgeEn: 'Hole area grows with the square of the offset: double d, quadruple the hole.',
    initialCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 0.2, removedSide: 'negative' },
  },
  {
    id: 'angle-riddle',
    titleZh: '角度之谜',
    titleEn: 'Angle Riddle',
    subtitleZh: '同一种折法，换个角度，菱形被拉长。',
    subtitleEn: 'Same fold, different angle: the diamond stretches.',
    difficulty: 3,
    foldPreset: 'orthogonal2',
    canonicalCut: { nx: Math.cos(Math.PI / 6), ny: Math.sin(Math.PI / 6), offset: 0.3, removedSide: 'negative' },
    limits: { angleLocked: null, maxAbsOffset: 1.2 },
    tolerance: DEFAULT_TOLERANCE,
    hints: {
      observe: {
        zh: '孔洞比宽更高：竖直方向的顶点离中心更远。',
        en: 'The hole is taller than it is wide: the vertical vertices sit further from the centre.',
      },
      adjust: {
        zh: '旋转切线。法向量与竖直方向越接近，竖直方向的菱形越容易被拉长。',
        en: 'Rotate the cut. The closer the normal is to vertical, the more the diamond stretches vertically.',
      },
      solution: {
        zh: '法向量取 30°（0.866, 0.5），偏移 0.3：孔洞顶点为 (±0.346, 0) 与 (0, ±0.6)。',
        en: 'Normal at 30° (0.866, 0.5), offset 0.3: vertices at (±0.346, 0) and (0, ±0.6).',
      },
    },
    knowledgeZh: '正交双折下，任何包含中心的半平面切口都会展开成菱形；角度只改变它的长宽比。',
    knowledgeEn: 'With two orthogonal folds, any half-plane containing the centre unfolds to a rhombus; the angle only changes its aspect ratio.',
    initialCut: { nx: Math.cos(Math.PI / 3), ny: Math.sin(Math.PI / 3), offset: 0.5, removedSide: 'negative' },
  },
  {
    id: 'diamond-from-square',
    titleZh: '方中取菱',
    titleEn: 'Diamond from Square',
    subtitleZh: '反过来想：不是挖洞，而是把四个角一次剪掉。',
    subtitleEn: 'Think in reverse: cut the four corners away at once.',
    difficulty: 3,
    foldPreset: 'orthogonal2',
    canonicalCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 1.0 * SQRT1_2, removedSide: 'positive' },
    limits: { angleLocked: null, maxAbsOffset: 1.7 },
    // This level moves the whole silhouette, so IoU is far more sensitive to a
    // 0.001 slider step than the hole levels. 0.99 still means "visually exact".
    tolerance: { iouPerfect: 0.99, iouClose: 0.95 },
    hints: {
      observe: {
        zh: '目标不是孔洞，而是整张纸的轮廓：一个内接菱形。',
        en: 'The target is not a hole — it is the silhouette: an inscribed diamond.',
      },
      adjust: {
        zh: '保留侧要选“内侧”。切线在纸包外角附近，切掉的才是四个外角。',
        en: 'Keep the inner side. With the line near the packet’s outer corner, the four outer corners fall away.',
      },
      solution: {
        zh: '切线 u + v = 1（正对纸包外角 (1, 1)），剪去 u + v > 1 的一侧；展开后纸形为 |x| + |y| ≤ 1，面积 2。',
        en: 'Cut u + v = 1 through the packet’s outer corner and remove u + v > 1: the sheet becomes |x| + |y| ≤ 1, area 2.',
      },
    },
    knowledgeZh: '同一个折叠预设，保留侧一换，结果就从“挖一个洞”变成“留下一个形状”；四个角由一刀同时决定。',
    knowledgeEn: 'Same fold preset: flipping the kept side turns “carve a hole” into “keep a shape”. One cut decides all four corners.',
    initialCut: { nx: SQRT1_2, ny: SQRT1_2, offset: 0.45, removedSide: 'positive' },
  },
];

function buildLevel(spec: LevelSpec, index: number): PuzzleLevel {
  const { unfolded } = foldCutUnfold(PAPER, spec.foldPreset, [spec.canonicalCut]);
  const targetArea = multiPolygonArea(unfolded);

  if (targetArea <= 1e-9) {
    throw new Error(`Level "${spec.id}" has a degenerate target`);
  }

  return {
    ...spec,
    order: index + 1,
    target: unfolded,
    targetArea,
    version: 1,
    seed: 20261030 + index,
  };
}

export const LEVELS: PuzzleLevel[] = SPECS.map(buildLevel);

export function levelById(id: string): PuzzleLevel | undefined {
  return LEVELS.find((l) => l.id === id);
}
