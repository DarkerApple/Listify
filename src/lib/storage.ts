import type { AppState, Item } from '../types';

const KEY = 'listify.v1';
export const THEME_KEY = 'listify.theme';

/** Anything read from disk is untrusted — coerce it into a valid Item or drop it. */
function reviveItem(raw: unknown): Item | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.text !== 'string') return null;
  const createdAt = typeof o.createdAt === 'number' ? o.createdAt : Date.now();
  const replies = Array.isArray(o.replies)
    ? o.replies.flatMap((r) => {
        if (!r || typeof r !== 'object') return [];
        const x = r as Record<string, unknown>;
        if (typeof x.id !== 'string' || typeof x.text !== 'string') return [];
        return [{ id: x.id, text: x.text, createdAt: typeof x.createdAt === 'number' ? x.createdAt : createdAt }];
      })
    : [];
  return {
    id: o.id,
    text: o.text,
    createdAt,
    done: o.done === true,
    doneAt: typeof o.doneAt === 'number' ? o.doneAt : null,
    replies,
    parentId: typeof o.parentId === 'string' ? o.parentId : null,
  };
}

export function loadItems(): Item[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.items)) return [];
    return parsed.items.flatMap((i) => {
      const item = reviveItem(i);
      return item ? [item] : [];
    });
  } catch {
    // Corrupt or unavailable storage shouldn't blank the app — start empty.
    return [];
  }
}

export function saveItems(items: Item[]): void {
  try {
    const state: AppState = { version: 1, items };
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or private mode: keep running in memory rather than crashing.
  }
}

/** Serialized backup the user can download. */
export function exportJSON(items: Item[]): string {
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), items }, null, 2);
}

/** Parse a backup file; returns null when the file isn't a Listify export. */
export function parseImport(text: string): Item[] | null {
  try {
    const parsed = JSON.parse(text) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed.items.flatMap((i) => {
      const item = reviveItem(i);
      return item ? [item] : [];
    });
  } catch {
    return null;
  }
}
