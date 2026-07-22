import Dexie, { type Table } from 'dexie';
import type { Note } from './types';

/**
 * IndexedDB schema. Notes are keyed by their ISO date (one per day). We index
 * `date` and `updatedAt` for month-range and recency queries; entries and tags
 * live inside each note record (searched in memory for now — the dataset is a
 * handful of notes per month).
 */
export interface MetaRow {
  key: string;
  value: unknown;
}

export class ListifyDB extends Dexie {
  notes!: Table<Note, string>;
  meta!: Table<MetaRow, string>;

  constructor() {
    super('listify');
    this.version(1).stores({
      notes: 'id, date, updatedAt',
    });
    // v2 adds a key-value table for security config (app lock / vault records).
    this.version(2).stores({
      notes: 'id, date, updatedAt',
      meta: 'key',
    });
  }
}

export const db = new ListifyDB();
