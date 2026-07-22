import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageDown, Layers, LayoutGrid, Rows3 } from 'lucide-react';
import type { Note } from '../storage/types';
import { useJournalStore } from '../store/useJournalStore';
import { listMonth } from '../lib/queries';
import { downloadMonthKeepsake } from '../lib/keepsake';
import { MONTH_NAMES, daysInMonth, todayISO } from '../lib/date';
import { navigate } from '../router/route';
import { BackBar } from '../components/BackBar';
import { Notestack } from '../components/Notestack';
import { StickyNote } from '../components/StickyNote';
import { MoodRibbon } from '../components/MoodRibbon';

function openDay(date: string) {
  navigate(date === todayISO() ? { name: 'today' } : { name: 'day', date });
}

export function MonthScreen({ year, month }: { year: number; month: number }) {
  const revision = useJournalStore((s) => s.revision);
  const [notes, setNotes] = useState<Note[]>([]);
  const [spread, setSpread] = useState(false);

  useEffect(() => {
    let live = true;
    void listMonth(year, month).then((n) => live && setNotes(n));
    return () => {
      live = false;
    };
  }, [year, month, revision]);

  function shift(delta: number) {
    let y = year;
    let m = month + delta;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    navigate({ name: 'month', year: y, month: m });
  }

  const total = notes.reduce((s, n) => s + n.entries.length, 0);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title={`${MONTH_NAMES[month]}`} subtitle={`${year} · notestacks`} />

      {/* Month nav + view toggle */}
      <div className="flex items-center justify-between px-4 pb-1">
        <div className="flex items-center gap-1">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="rounded-full p-1.5 text-ink-faint hover:text-accent">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => navigate({ name: 'year', year })}
            className="rounded-full px-3 py-1 font-mono text-xs text-ink-soft hover:text-accent"
            title="Up to the year shelf"
          >
            {notes.length} {notes.length === 1 ? 'day' : 'days'} · {total} entries
          </button>
          <button onClick={() => shift(1)} aria-label="Next month" className="rounded-full p-1.5 text-ink-faint hover:text-accent">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-1.5">
          {notes.length > 0 && (
            <button
              onClick={() => downloadMonthKeepsake(year, month, notes)}
              aria-label="Save this month as an image"
              title="Save as image"
              className="rounded-full border border-rule p-1.5 text-ink-soft hover:border-accent/50"
            >
              <ImageDown size={15} />
            </button>
          )}
          <button
            onClick={() => setSpread((v) => !v)}
            aria-label={spread ? 'Stack view' : 'Spread view'}
            title={spread ? 'Stack view' : 'Spread view'}
            className="flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 font-mono text-xs text-ink-soft hover:border-accent/50"
          >
            {spread ? <Layers size={15} /> : <Rows3 size={15} />}
            {spread ? 'Stack' : 'Spread'}
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
        {notes.length === 0 ? (
          <p className="mt-16 text-center font-serif text-lg italic text-ink-faint">
            No notes this month yet.
          </p>
        ) : spread ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...notes].reverse().map((n) => (
              <StickyNote key={n.date} note={n} onClick={() => openDay(n.date)} className="h-44" />
            ))}
          </div>
        ) : (
          <div className="pt-4">
            <Notestack notes={notes} onOpen={openDay} />
          </div>
        )}
      </div>

      {/* Month recap ribbon */}
      {notes.length > 0 && (
        <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1">
          <div className="mb-1 flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">
            <LayoutGrid size={12} /> the month in mood
          </div>
          <MoodRibbon notes={notes} daysInMonth={daysInMonth(year, month)} year={year} month={month} />
        </div>
      )}
    </div>
  );
}
