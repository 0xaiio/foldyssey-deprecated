/**
 * Local persistence. Everything stays on the device: no account, no server,
 * no analytics. All access is defensive because `localStorage` can be disabled,
 * full, or contain data written by an older schema.
 */

const GALLERY_KEY = 'foldyssey.gallery.v1';
const PROGRESS_KEY = 'foldyssey.progress.v1';

let memory: Record<string, string> = {};

function backend(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const probe = '__foldyssey_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      return window.localStorage;
    }
  } catch {
    // fall through to memory
  }
  return {
    getItem: (k) => (k in memory ? memory[k] : null),
    setItem: (k, v) => {
      memory[k] = v;
    },
    removeItem: (k) => {
      delete memory[k];
    },
  };
}

export function readJson<T>(key: string): T | null {
  try {
    const raw = backend().getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  try {
    backend().setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    backend().removeItem(key);
  } catch {
    /* ignore */
  }
}

export const KEYS = { gallery: GALLERY_KEY, progress: PROGRESS_KEY };

export function isStoragePersistent(): boolean {
  return backend() === (typeof window !== 'undefined' ? window.localStorage : null);
}
