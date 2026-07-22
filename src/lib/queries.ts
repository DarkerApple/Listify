import { storage } from '../storage/dexieAdapter';
import type { Note } from '../storage/types';

// Read-only views over storage for the notestacks/shelf/search/highlights
// screens. They call the StorageAdapter directly and are re-run by screens
// whenever the journal store's `revision` changes.

export async function listMonth(year: number, month: number): Promise<Note[]> {
  return storage.listNotesByMonth(year, month);
}

export async function listYearCounts(
  year: number,
): Promise<{ month: number; notes: Note[] }[]> {
  const out: { month: number; notes: Note[] }[] = [];
  for (let m = 0; m < 12; m++) {
    out.push({ month: m, notes: await storage.listNotesByMonth(year, m) });
  }
  return out;
}

export async function search(query: string): Promise<Note[]> {
  return storage.search(query);
}

export async function listStarred(): Promise<Note[]> {
  const bundle = await storage.export();
  return bundle.notes
    .filter((n) => n.starred)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export async function listByTag(tag: string): Promise<Note[]> {
  const t = tag.toLowerCase();
  const bundle = await storage.export();
  return bundle.notes
    .filter((n) => !n.private && n.tags.includes(t))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Total entries in a set of notes — used for stack thickness. */
export function activityOf(notes: Note[]): number {
  return notes.reduce((sum, n) => sum + n.entries.length, 0);
}
