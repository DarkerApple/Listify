import { create } from 'zustand';

// App-level preferences. Small, non-journal state — kept in localStorage rather
// than IndexedDB so it loads synchronously before first paint.

interface SettingsState {
  /** When ON, sealed notes freeze completely (even tags/mood/star). Default OFF. */
  freezeSealedCompletely: boolean;
  setFreezeSealedCompletely(v: boolean): void;
}

const KEY = 'listify.settings.v1';

function load(): { freezeSealedCompletely: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { freezeSealedCompletely: false, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { freezeSealedCompletely: false };
}

function persist(v: { freezeSealedCompletely: boolean }) {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...load(),
  setFreezeSealedCompletely(v) {
    set({ freezeSealedCompletely: v });
    persist({ freezeSealedCompletely: get().freezeSealedCompletely });
  },
}));
