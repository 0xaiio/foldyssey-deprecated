import { difference, intersection, union } from './ops';
import { multiPolygonArea } from './polygon';
import type { MultiPolygon } from './types';

export type Verdict = 'perfect' | 'close' | 'miss';

export type Score = {
  /** Area(A ∩ T) / Area(A ∪ T). */
  iou: number;
  /** Area(A △ T) / Area(P) — the symmetric-difference error against the sheet. */
  symDiffRatio: number;
  intersectionArea: number;
  unionArea: number;
  actualArea: number;
  targetArea: number;
  paperArea: number;
  verdict: Verdict;
  diff: {
    overlap: MultiPolygon;
    onlyActual: MultiPolygon;
    onlyTarget: MultiPolygon;
  };
};

export type Tolerance = { iouPerfect: number; iouClose: number };

export const DEFAULT_TOLERANCE: Tolerance = { iouPerfect: 0.995, iouClose: 0.9 };

/**
 * Compare two *sets of points* (not pixels). Both are polygonal regions in the
 * unfolded sheet, so IoU is computed exactly through boolean area operations.
 */
export function scoreRegions(
  actual: MultiPolygon,
  target: MultiPolygon,
  paperArea: number,
  tolerance: Tolerance = DEFAULT_TOLERANCE,
): Score {
  const overlap = actual.length && target.length ? intersection(actual, target) : [];
  const unionRegion = union(actual, target);
  const intersectionArea = multiPolygonArea(overlap);
  const unionArea = multiPolygonArea(unionRegion);
  const actualArea = multiPolygonArea(actual);
  const targetArea = multiPolygonArea(target);

  let iou: number;
  if (unionArea < 1e-12) {
    iou = actualArea < 1e-12 && targetArea < 1e-12 ? 1 : 0;
  } else {
    iou = Math.min(1, Math.max(0, intersectionArea / unionArea));
  }

  const onlyActual = difference(actual, target);
  const onlyTarget = difference(target, actual);
  const symDiffArea =
    multiPolygonArea(onlyActual) + multiPolygonArea(onlyTarget);
  const symDiffRatio = paperArea > 1e-12 ? symDiffArea / paperArea : 0;

  let verdict: Verdict = 'miss';
  if (iou >= tolerance.iouPerfect) verdict = 'perfect';
  else if (iou >= tolerance.iouClose) verdict = 'close';

  return {
    iou,
    symDiffRatio,
    intersectionArea,
    unionArea,
    actualArea,
    targetArea,
    paperArea,
    verdict,
    diff: { overlap, onlyActual, onlyTarget },
  };
}

export type Feedback = {
  code: 'perfect' | 'close' | 'too-much' | 'too-little' | 'misplaced' | 'empty';
  zh: string;
  en: string;
  /** Relative area delta, negative when too much paper was removed. */
  areaDelta: number;
};

/**
 * Geometric, explainable feedback. No model is involved: the wording is derived
 * from measurable differences, so it is reproducible and honest.
 */
export function explainScore(score: Score, tolerance: Tolerance = DEFAULT_TOLERANCE): Feedback {
  const areaDelta =
    score.targetArea > 1e-12 ? (score.actualArea - score.targetArea) / score.targetArea : 0;

  if (score.iou >= tolerance.iouPerfect) {
    return {
      code: 'perfect',
      zh: '完全吻合：在几何容差内与目标一致。',
      en: 'Exact match: identical to the target within tolerance.',
      areaDelta,
    };
  }
  if (score.actualArea < 1e-9) {
    return {
      code: 'empty',
      zh: '纸被整片剪掉了：切线的保留侧选反了。',
      en: 'The whole sheet was cut away — the kept side is inverted.',
      areaDelta,
    };
  }
  if (areaDelta < -0.06) {
    return {
      code: 'too-much',
      zh: `剪多了：你的纸比目标少 ${Math.round(Math.abs(areaDelta) * 100)}%，切口应更靠近折叠边。`,
      en: `Too much removed: ${Math.round(Math.abs(areaDelta) * 100)}% less paper than the target.`,
      areaDelta,
    };
  }
  if (areaDelta > 0.06) {
    return {
      code: 'too-little',
      zh: `剪少了：你的纸比目标多 ${Math.round(areaDelta * 100)}%，切口可以再切深一点。`,
      en: `Not enough removed: ${Math.round(areaDelta * 100)}% more paper than the target.`,
      areaDelta,
    };
  }
  if (score.iou >= tolerance.iouClose) {
    return {
      code: 'close',
      zh: '非常接近：面积正确，边缘还有细微偏差。',
      en: 'Very close: correct area, slightly off along the edges.',
      areaDelta,
    };
  }
  return {
    code: 'misplaced',
    zh: '面积接近但位置或角度不对：检查切线与折痕的夹角。',
    en: 'Similar area but misplaced: check the angle between the cut and the crease.',
    areaDelta,
  };
}
