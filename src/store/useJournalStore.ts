import { create } from 'zustand';
import { storage } from '../storage/dexieAdapter';
import type { Entry, ISODate, Mood, Note, TodoState } from '../storage/types';
import { addDaysISO, todayISO } from '../lib/date';
import { newId } from '../lib/id';
import { parseTags, STARTER_TAGS } from '../lib/tags';
import { tick } from '../lib/haptics';
import { useSettings } from './useSettings';

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

function detectTodo(raw: string): { text: string; isTodo: boolean } {
  const m = raw.match(/^\s*-\s+(.*)$/s);
  return m ? { text: m[1], isTodo: true } : { text: raw, isTodo: false };
}

function aggregateTags(entries: Entry[], extra: string[] = []): string[] {
  return [...new Set([...entries.flatMap((e) => e.tags), ...extra])];
}

/** Metadata (tags/mood/star) may still change after sealing unless the user
 *  has turned on "freeze completely" (spec §5). */
function metaEditable(note: Note): boolean {
  if (!note.sealed) return true;
  return !useSettings.getState().freezeSealedCompletely;
}

/** Local-midnight timestamp that ends a given day (when it auto-seals). */
function sealBoundary(date: ISODate): number {
  return new Date(`${addDaysISO(date, 1)}T00:00:00`).getTime();
}

interface JournalState {
  date: ISODate;
  note: Note | null;
  loading: boolean;
  knownTags: string[];
  revision: number; // bumped on every write so other screens can reload

  init(): Promise<void>;
  loadDate(date: ISODate): Promise<void>;
  refresh(): Promise<void>;

  // Entry edits — blocked once sealed.
  commitEntry(raw: string): Promise<void>;
  cycleTodo(entryId: string): Promise<void>;
  removeEntry(entryId: string): Promise<void>;

  // Sealing.
  seal(date?: ISODate): Promise<void>;
  sweepAutoSeal(): Promise<void>;

  // Metadata edits (by date) — allowed after sealing unless frozen.
  setMood(date: ISODate, mood: Mood | null): Promise<void>;
  toggleStar(date: ISODate): Promise<void>;
  addTag(date: ISODate, tag: string): Promise<void>;
  removeTag(date: ISODate, tag: string): Promise<void>;
}

export const useJournalStore = create<JournalState>((set, get) => {
  /** Load a note by date, edit it, persist, and sync active state. */
  async function mutate(
    date: ISODate,
    mutator: (note: Note) => Note | null, // return null to abort
    createIfMissing = false,
  ): Promise<void> {
    const current = get();
    let note =
      date === current.date && current.note
        ? current.note
        : (await storage.getNote(date)) ?? (createIfMissing ? emptyNote(date) : undefined);
    if (!note) return;

    const next = mutator(note);
    if (!next) return;

    await storage.upsertNote(next);
    set((s) => ({
      revision: s.revision + 1,
      note: date === s.date ? next : s.note,
      knownTags: [...new Set([...s.knownTags, ...next.tags])].sort(),
    }));
  }

  return {
    date: todayISO(),
    note: null,
    loading: true,
    knownTags: STARTER_TAGS,
    revision: 0,

    async init() {
      await get().sweepAutoSeal();
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

    async refresh() {
      const note = (await storage.getNote(get().date)) ?? null;
      set({ note });
    },

    async commitEntry(raw) {
      const text = raw.trim();
      if (!text) return;
      const { date } = get();
      const { text: body, isTodo } = detectTodo(text);

      await mutate(
        date,
        (note) => {
          if (note.sealed) return null;
          const entry: Entry = {
            id: newId(),
            text: body,
            createdAt: Date.now(),
            type: isTodo ? 'todo' : 'text',
            todoState: isTodo ? 'want' : null,
            tags: parseTags(body),
          };
          const entries = [...note.entries, entry];
          return { ...note, entries, tags: aggregateTags(entries), updatedAt: Date.now() };
        },
        true,
      );
      tick();
    },

    async cycleTodo(entryId) {
      await mutate(get().date, (note) => {
        if (note.sealed) return null;
        const entries = note.entries.map((e) => {
          if (e.id !== entryId || e.type !== 'todo') return e;
          const i = TODO_CYCLE.indexOf((e.todoState ?? 'want') as Exclude<TodoState, null>);
          return { ...e, todoState: TODO_CYCLE[(i + 1) % TODO_CYCLE.length] };
        });
        return { ...note, entries, updatedAt: Date.now() };
      });
      tick();
    },

    async removeEntry(entryId) {
      await mutate(get().date, (note) => {
        if (note.sealed) return null;
        const entries = note.entries.filter((e) => e.id !== entryId);
        return { ...note, entries, tags: aggregateTags(entries), updatedAt: Date.now() };
      });
    },

    async seal(date = get().date) {
      await mutate(date, (note) => {
        if (note.sealed || note.entries.length === 0) return null;
        return { ...note, sealed: true, sealedAt: Date.now(), updatedAt: Date.now() };
      });
    },

    async sweepAutoSeal() {
      const today = todayISO();
      const bundle = await storage.export();
      const stale = bundle.notes.filter((n) => n.date < today && !n.sealed && n.entries.length > 0);
      for (const n of stale) {
        await storage.upsertNote({ ...n, sealed: true, sealedAt: sealBoundary(n.date) });
      }
      if (stale.length) {
        set((s) => ({ revision: s.revision + 1 }));
        await get().refresh();
      }
    },

    async setMood(date, mood) {
      await mutate(
        date,
        (note) => (metaEditable(note) ? { ...note, mood, updatedAt: Date.now() } : null),
        true,
      );
    },

    async toggleStar(date) {
      await mutate(date, (note) =>
        metaEditable(note) ? { ...note, starred: !note.starred, updatedAt: Date.now() } : null,
      );
    },

    async addTag(date, tag) {
      const clean = tag.replace(/^#/, '').trim().toLowerCase();
      if (!clean) return;
      await mutate(
        date,
        (note) => {
          if (!metaEditable(note) || note.tags.includes(clean)) return null;
          return { ...note, tags: [...note.tags, clean], updatedAt: Date.now() };
        },
        true,
      );
    },

    async removeTag(date, tag) {
      await mutate(date, (note) => {
        if (!metaEditable(note)) return null;
        return { ...note, tags: note.tags.filter((t) => t !== tag), updatedAt: Date.now() };
      });
    },
  };
});
