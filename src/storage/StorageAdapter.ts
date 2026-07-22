import type { ExportBundle, ISODate, Note } from './types';

/**
 * The single seam between Listify and where its data lives.
 *
 * Everything in the app talks to storage through this interface — never to
 * Dexie/IndexedDB directly. Today it is backed by IndexedDB (DexieStorageAdapter);
 * a future server-sync layer can implement the same contract without touching
 * the UI or store. Keep it small and intention-revealing.
 */
export interface StorageAdapter {
  /** The one note for a given day, or undefined if nothing was written. */
  getNote(date: ISODate): Promise<Note | undefined>;

  /** Create or replace a note wholesale. Callers own immutability rules. */
  upsertNote(note: Note): Promise<void>;

  /** All notes in a calendar month. `month` is 0-indexed (0 = January). */
  listNotesByMonth(year: number, month: number): Promise<Note[]>;

  /** Plain-text search over non-private notes (vault search added in Stage 5). */
  search(query: string): Promise<Note[]>;

  /** Everything, as a portable bundle — the backup safety net. */
  export(): Promise<ExportBundle>;

  /** Merge a bundle back in. Existing days are overwritten by imported ones. */
  import(bundle: ExportBundle): Promise<void>;
}
