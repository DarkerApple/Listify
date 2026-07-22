import { create } from 'zustand';
import { storage } from '../storage/dexieAdapter';
import type { Entry, ISODate, Note, TodoState } from '../storage/types';
import { todayISO } from '../lib/date';
import { newId } from '../lib/id';
import { parseTags, STARTER_TAGS } from '../lib/tags';
import { tick } from '../lib/haptics';

const TODO_CYCLE: Exclude<TodoState, null>[] = ['want', 'have-to', 'done'];

function emptyNote(date: ISODate): Note {
  const now = Date.now();
  return {
    id: date,
    date,
    entries: [],
    mood: null,
    tags: [],
    starred: false,
    private: false,
    sealed: false,
    sealedAt: null,
    createdAt: now,
    updatedAt: now,
  };
}

/** Detect a leading list marker ("- buy milk") → a todo entry. */
function detectTodo(raw: string): { text: string; isTodo: boolean } {
  const m = raw.match(/^\s*-\s+(.*)$/s);
  if (m) return { text: m[1], isTodo: true };
  return { text: raw, isTodo: false };
}

/** Union of every entry's tags — the note-level tag set. */
function aggregateTags(entries: Entry[]): string[] {
  return [...new Set(entries.flatMap((e) => e.tags))];
}

interface JournalState {
  date: ISODate;
  note: Note | null;
  loading: boolean;
  knownTags: string[]; // for #hashtag autocomplete

  init(): Promise<void>;
  loadDate(date: ISODate): Promise<void>;
  commitEntry(raw: string): Promise<void>;
  cycleTodo(entryId: string): Promise<void>;
  removeEntry(entryId: string): Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  date: todayISO(),
  note: null,
  loading: true,
  knownTags: STARTER_TAGS,

  async init() {
    // Gather known tags from all prior notes for autocomplete.
    const bundle = await storage.export();
    const tags = new Set<string>(STARTER_TAGS);
    for (const n of bundle.notes) n.tags.forEach((t) => tags.add(t));
    set({ knownTags: [...tags].sort() });
    await get().loadDate(todayISO());
  },

  async loadDate(date) {
    set({ loading: true });
    const note = (await storage.getNote(date)) ?? null;
    set({ date, note, loading: false });
  },

  async commitEntry(raw) {
    const text = raw.trim();
    if (!text) return;

    const { date } = get();
    let note = get().note ?? emptyNote(date);
    if (note.sealed) return; // immutable once sealed (Stage 2)

    const { text: body, isTodo } = detectTodo(text);
    const entry: Entry = {
      id: newId(),
      text: body,
      createdAt: Date.now(),
      type: isTodo ? 'todo' : 'text',
      todoState: isTodo ? 'want' : null,
      tags: parseTags(body),
    };

    const entries = [...note.entries, entry];
    note = { ...note, entries, tags: aggregateTags(entries), updatedAt: Date.now() };

    await storage.upsertNote(note);
    const knownTags = [...new Set([...get().knownTags, ...entry.tags])].sort();
    set({ note, knownTags });
    tick();
  },

  async cycleTodo(entryId) {
    const note = get().note;
    if (!note || note.sealed) return;

    const entries = note.entries.map((e) => {
      if (e.id !== entryId || e.type !== 'todo') return e;
      const i = TODO_CYCLE.indexOf((e.todoState ?? 'want') as Exclude<TodoState, null>);
      const next = TODO_CYCLE[(i + 1) % TODO_CYCLE.length];
      return { ...e, todoState: next };
    });

    const updated = { ...note, entries, updatedAt: Date.now() };
    await storage.upsertNote(updated);
    set({ note: updated });
    tick();
  },

  async removeEntry(entryId) {
    // Today's note is freely editable until sealed (spec §5).
    const note = get().note;
    if (!note || note.sealed) return;

    const entries = note.entries.filter((e) => e.id !== entryId);
    const updated = { ...note, entries, tags: aggregateTags(entries), updatedAt: Date.now() };
    await storage.upsertNote(updated);
    set({ note: updated });
  },
}));
