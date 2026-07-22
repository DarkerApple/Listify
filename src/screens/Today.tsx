import { useEffect, useRef } from 'react';
import { useJournalStore } from '../store/useJournalStore';
import { formatLongDate, isToday } from '../lib/date';
import { EntryRow } from '../components/EntryRow';
import { Composer } from '../components/Composer';

/** Map real elapsed time between two entries to a breathing vertical gap. */
function gapFor(prevTs: number | null, ts: number): number {
  if (prevTs === null) return 4;
  const minutes = (ts - prevTs) / 60_000;
  return Math.min(52, Math.max(10, 10 + minutes * 0.7));
}

export function Today() {
  const { date, note, loading, commitEntry, cycleTodo, removeEntry } = useJournalStore();
  const entries = note?.entries ?? [];
  const editable = !note?.sealed;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest entry in view as the list grows.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div className="paper-grid mx-auto flex h-full w-full max-w-2xl flex-col">
      {/* Date header */}
      <header className="shrink-0 px-5 pb-2 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="font-hand text-2xl text-ink">{formatLongDate(date)}</h1>
        <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-ink-faint">
          {isToday(date) ? 'Today' : 'A past day'}
        </p>
      </header>

      {/* Entries */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
        {loading ? null : entries.length === 0 ? (
          <p className="mt-10 text-center font-serif text-lg italic text-ink-faint">
            Anything worth remembering today?
          </p>
        ) : (
          <div>
            {entries.map((entry, i) => (
              <EntryRow
                key={entry.id}
                entry={entry}
                active={i === entries.length - 1}
                editable={editable}
                gapPx={gapFor(i === 0 ? null : entries[i - 1].createdAt, entry.createdAt)}
                onCycle={() => cycleTodo(entry.id)}
                onRemove={() => removeEntry(entry.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Composer, bottom-anchored + keyboard/safe-area aware */}
      <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        {editable ? (
          <Composer onCommit={commitEntry} />
        ) : (
          <p className="py-3 text-center font-mono text-xs text-ink-faint">
            This day is sealed.
          </p>
        )}
      </div>
    </div>
  );
}
