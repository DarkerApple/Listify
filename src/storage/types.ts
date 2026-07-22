// Core data model — see the Listify spec §4.
// `notestacks` (month) and `shelf` (year) are DERIVED views, grouped at query
// time; they are intentionally not stored.

export type ISODate = string; // "2026-12-24"
export type Timestamp = number; // epoch ms
export type TodoState = 'want' | 'have-to' | 'done' | null;

export interface Entry {
  id: string;
  text: string; // ciphertext when the owning note is private (Stage 5)
  createdAt: Timestamp; // auto-captured — the moment the user committed it
  type: 'text' | 'todo';
  todoState: TodoState; // cycles want → have-to → done
  tags: string[]; // parsed from inline #hashtags
}

export interface Mood {
  color: string;
  label: string;
}

export interface Note {
  id: ISODate; // one note per day, keyed by date
  date: ISODate;
  entries: Entry[];
  mood: Mood | null;
  tags: string[];
  starred: boolean; // "monumental" — joins the Highlights reel
  private: boolean; // if true, entry text is encrypted (vault)
  sealed: boolean;
  sealedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Backup bundle shape used by export()/import(). Kept versioned so the format
// can evolve without breaking older backups.
export interface ExportBundle {
  app: 'listify';
  version: 1;
  exportedAt: Timestamp;
  notes: Note[];
}
