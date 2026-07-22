import { db } from './db';
import type { StorageAdapter } from './StorageAdapter';
import type { ExportBundle, ISODate, Note } from './types';
import { monthRange } from '../lib/date';

/**
 * The IndexedDB-backed implementation of StorageAdapter (Dexie).
 * The rest of the app imports the `storage` singleton at the bottom, never this
 * class directly — so swapping implementations later is a one-line change.
 */
class DexieStorageAdapter implements StorageAdapter {
  async getNote(date: ISODate): Promise<Note | undefined> {
    return db.notes.get(date);
  }

  async upsertNote(note: Note): Promise<void> {
    await db.notes.put(note);
  }

  async listNotesByMonth(year: number, month: number): Promise<Note[]> {
    const [start, end] = monthRange(year, month); // inclusive ISO bounds
    const notes = await db.notes
      .where('date')
      .between(start, end, true, true)
      .toArray();
    return notes.sort((a, b) => a.date.localeCompare(b.date));
  }

  async search(query: string): Promise<Note[]> {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const all = await db.notes.toArray();
    return all
      .filter((note) => {
        if (note.private) return false; // vault search requires unlock (Stage 5)
        const inTags = note.tags.some((t) => t.toLowerCase().includes(q));
        const inText = note.entries.some((e) => e.text.toLowerCase().includes(q));
        return inTags || inText;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async export(): Promise<ExportBundle> {
    const notes = await db.notes.toArray();
    return {
      app: 'listify',
      version: 1,
      exportedAt: Date.now(),
      notes: notes.sort((a, b) => a.date.localeCompare(b.date)),
    };
  }

  async import(bundle: ExportBundle): Promise<void> {
    if (bundle?.app !== 'listify' || !Array.isArray(bundle.notes)) {
      throw new Error('Not a Listify backup file.');
    }
    await db.notes.bulkPut(bundle.notes);
  }

  async getMeta<T>(key: string): Promise<T | undefined> {
    const row = await db.meta.get(key);
    return row?.value as T | undefined;
  }

  async setMeta<T>(key: string, value: T): Promise<void> {
    await db.meta.put({ key, value });
  }
}

export const storage: StorageAdapter = new DexieStorageAdapter();
