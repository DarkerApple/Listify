import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { Note } from '../storage/types';
import { listStarred } from '../lib/queries';
import { useJournalStore } from '../store/useJournalStore';
import { formatLongDate } from '../lib/date';
import { BackBar } from '../components/BackBar';
import { StickyNote } from '../components/StickyNote';
import { openDay } from '../router/route';

/** The reel of monumental (starred) days — a horizontally scrolling keepsake. */
export function HighlightsScreen() {
  const revision = useJournalStore((s) => s.revision);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    let live = true;
    void listStarred().then((n) => live && setNotes(n));
    return () => {
      live = false;
    };
  }, [revision]);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title="Highlights" subtitle="monumental days" />

      {notes.length === 0 ? (
        <div className="grid flex-1 place-items-center px-8">
          <p className="text-center font-serif text-lg italic text-ink-faint">
            <Sparkles size={22} className="mx-auto mb-3 text-ink-faint" />
            Star a day to keep it here.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-4">
            {notes.map((n) => (
              <div key={n.date} className="w-[78vw] max-w-[300px] shrink-0 snap-center">
                <div className="mb-1.5 text-center font-hand text-lg text-ink">
                  {formatLongDate(n.date)}
                </div>
                <StickyNote note={n} onClick={() => openDay(n.date)} className="h-[380px]" />
              </div>
            ))}
          </div>
          <p className="px-5 pb-6 text-center font-mono text-[0.7rem] text-ink-faint">
            {notes.length} {notes.length === 1 ? 'day' : 'days'} worth remembering · swipe to browse
          </p>
        </div>
      )}
    </div>
  );
}
