import { create } from 'zustand';

// App-level preferences. Small, non-journal state — kept in localStorage rather
// than IndexedDB so it loads synchronously before first paint.

interface Persisted {
  freezeSealedCompletely: boolean;
  sealedSinceBackup: number; // days sealed since the last export (backup nudge)
  onboarded: boolean;
}

interface SettingsState extends Persisted {
  setFreezeSealedCompletely(v: boolean): void;
  noteSealed(): void;
  markBackedUp(): void;
  setOnboarded(): void;
}

const KEY = 'listify.settings.v1';
const DEFAULTS: Persisted = {
  freezeSealedCompletely: false,
  sealedSinceBackup: 0,
  onboarded: false,
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULTS };
}

export const useSettings = create<SettingsState>((set, get) => {
  function persist() {
    const { freezeSealedCompletely, sealedSinceBackup, onboarded } = get();
    try {
      localStorage.setItem(KEY, JSON.stringify({ freezeSealedCompletely, sealedSinceBackup, onboarded }));
    } catch {
      /* ignore */
    }
  }

  return {
    ...load(),
    setFreezeSealedCompletely(v) {
      set({ freezeSealedCompletely: v });
      persist();
    },
    noteSealed() {
      set({ sealedSinceBackup: get().sealedSinceBackup + 1 });
      persist();
    },
    markBackedUp() {
      set({ sealedSinceBackup: 0 });
      persist();
    },
    setOnboarded() {
      set({ onboarded: true });
      persist();
    },
  };
});
