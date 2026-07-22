import { useEffect, useState } from 'react';
import type { Note } from '../storage/types';
import { listByTag } from '../lib/queries';
import { useJournalStore } from '../store/useJournalStore';
import { BackBar } from '../components/BackBar';
import { NoteGrid } from '../components/NoteGrid';

export function TagScreen({ tag }: { tag: string }) {
  const revision = useJournalStore((s) => s.revision);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    let live = true;
    void listByTag(tag).then((n) => live && setNotes(n));
    return () => {
      live = false;
    };
  }, [tag, revision]);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title={`#${tag}`} subtitle={`${notes.length} ${notes.length === 1 ? 'day' : 'days'}`} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
        {notes.length === 0 ? (
          <p className="mt-16 text-center font-serif text-lg italic text-ink-faint">
            No days tagged #{tag} yet.
          </p>
        ) : (
          <NoteGrid notes={notes} />
        )}
      </div>
    </div>
  );
}
