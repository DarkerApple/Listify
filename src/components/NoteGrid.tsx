import type { Note } from '../storage/types';
import { StickyNote } from './StickyNote';
import { openDay } from '../router/route';

/** A responsive grid of sticky-note cards. Used by search, tag, and highlights. */
export function NoteGrid({ notes }: { notes: Note[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {notes.map((n) => (
        <StickyNote key={n.date} note={n} onClick={() => openDay(n.date)} className="h-48" />
      ))}
    </div>
  );
}
