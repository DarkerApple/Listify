import Dexie, { type Table } from 'dexie';
import type { Note } from './types';

/**
 * IndexedDB schema. Notes are keyed by their ISO date (one per day). We index
 * `date` and `updatedAt` for month-range and recency queries; entries and tags
 * live inside each note record (searched in memory for now — the dataset is a
 * handful of notes per month).
 */
export class ListifyDB extends Dexie {
  notes!: Table<Note, string>;

  constructor() {
    super('listify');
    this.version(1).stores({
      notes: 'id, date, updatedAt',
    });
  }
}

export const db = new ListifyDB();
