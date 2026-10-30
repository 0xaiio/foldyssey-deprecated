import { KEYS, readJson, writeJson } from '../services/storage';

export type LevelProgress = {
  attempts: number;
  bestIou: number;
  cleared: boolean;
  updatedAt: number;
};

export type ProgressState = {
  version: 1;
  levels: Record<string, LevelProgress>;
};

const EMPTY: ProgressState = { version: 1, levels: {} };

export function loadProgress(): ProgressState {
  const raw = readJson<ProgressState>(KEYS.progress);
  if (!raw || typeof raw !== 'object' || raw.version !== 1 || typeof raw.levels !== 'object') {
    return { ...EMPTY, levels: {} };
  }
  const levels: Record<string, LevelProgress> = {};
  for (const [id, value] of Object.entries(raw.levels ?? {})) {
    const v = value as Partial<LevelProgress>;
    levels[id] = {
      attempts: Number(v.attempts) || 0,
      bestIou: Number(v.bestIou) || 0,
      cleared: Boolean(v.cleared),
      updatedAt: Number(v.updatedAt) || 0,
    };
  }
  return { version: 1, levels };
}

export function recordAttempt(levelId: string, iou: number, cleared: boolean): ProgressState {
  const state = loadProgress();
  const prev = state.levels[levelId];
  state.levels[levelId] = {
    attempts: (prev?.attempts ?? 0) + 1,
    bestIou: Math.max(prev?.bestIou ?? 0, iou),
    cleared: Boolean(prev?.cleared || cleared),
    updatedAt: Date.now(),
  };
  writeJson(KEYS.progress, state);
  return state;
}

export function resetProgress(): void {
  writeJson(KEYS.progress, EMPTY);
}

export function clearedCount(state: ProgressState): number {
  return Object.values(state.levels).filter((l) => l.cleared).length;
}
