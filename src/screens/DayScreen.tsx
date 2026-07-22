import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { ChevronLeft, ChevronRight, Stamp } from 'lucide-react';
import type { ISODate } from '../storage/types';
import { useJournalStore } from '../store/useJournalStore';
import { addDaysISO, formatClock, formatLongDate, isToday, todayISO } from '../lib/date';
import { navigate } from '../router/route';
import { thunk } from '../lib/haptics';
import { EntryRow } from '../components/EntryRow';
import { Composer } from '../components/Composer';
import { Toolbar } from '../components/Toolbar';
import { SealStamp } from '../components/SealStamp';
import { MoodStar } from '../components/MoodStar';

function gapFor(prevTs: number | null, ts: number): number {
  if (prevTs === null) return 4;
  const minutes = (ts - prevTs) / 60_000;
  return Math.min(52, Math.max(10, 10 + minutes * 0.7));
}

function goToDate(target: ISODate) {
  navigate(target === todayISO() ? { name: 'today' } : { name: 'day', date: target });
}

export function DayScreen({ date }: { date: ISODate }) {
  const note = useJournalStore((s) => s.note);
  const loading = useJournalStore((s) => s.loading);
  const activeDate = useJournalStore((s) => s.date);
  const loadDate = useJournalStore((s) => s.loadDate);
  const commitEntry = useJournalStore((s) => s.commitEntry);
  const cycleTodo = useJournalStore((s) => s.cycleTodo);
  const removeEntry = useJournalStore((s) => s.removeEntry);
  const seal = useJournalStore((s) => s.seal);

  const [sealing, setSealing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Sync the viewed date into the store.
  useEffect(() => {
    if (activeDate !== date || !note) void loadDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const entries = note?.entries ?? [];
  const today = isToday(date);
  const sealed = !!note?.sealed;
  const editable = today && !sealed;
  const canNext = date < todayISO();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length, date]);

  // Keyboard day-nav (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') goToDate(addDaysISO(date, -1));
      else if (e.key === 'ArrowRight' && canNext) goToDate(addDaysISO(date, 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [date, canNext]);

  // Horizontal swipe = prev/next day; vertical scroll passes through (pan-y).
  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], last }) => {
      if (last) {
        const passed = Math.abs(mx) > 90 || vx > 0.5;
        if (passed && mx > 0) goToDate(addDaysISO(date, -1));
        else if (passed && mx < 0 && canNext) goToDate(addDaysISO(date, 1));
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
      } else {
        x.set(mx * 0.4);
      }
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } },
  );

  function handleSeal() {
    thunk();
    setSealing(true);
    void seal(date);
  }

  return (
    <div className="relative h-full overflow-hidden">
      <div {...bind()} style={{ touchAction: 'pan-y' }} className="h-full">
      <motion.div
        style={{ x }}
        className="paper-grid mx-auto flex h-full w-full max-w-2xl flex-col"
      >
        {/* Header */}
        <header className="shrink-0 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => goToDate(addDaysISO(date, -1))}
                aria-label="Previous day"
                className="rounded-full p-1.5 text-ink-faint transition-colors hover:text-accent hover:bg-rule/30"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="px-1">
                <h1 className="font-hand text-2xl leading-tight text-ink">{formatLongDate(date)}</h1>
                <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-ink-faint">
                  {today ? 'Today' : sealed ? 'Sealed' : 'A past day'}
                </p>
              </div>
              <button
                onClick={() => canNext && goToDate(addDaysISO(date, 1))}
                disabled={!canNext}
                aria-label="Next day"
                className="rounded-full p-1.5 text-ink-faint transition-colors hover:text-accent hover:bg-rule/30 disabled:opacity-30 disabled:hover:text-ink-faint"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <Toolbar date={date} />
          </div>
          {note && <MoodStar note={note} />}
        </header>

        {/* Entries */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {loading ? null : entries.length === 0 ? (
            <p className="mt-10 text-center font-serif text-lg italic text-ink-faint">
              {today ? 'Anything worth remembering today?' : 'Nothing was written this day.'}
            </p>
          ) : (
            <motion.div key={date} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
            </motion.div>
          )}
        </div>

        {/* Composer / seal footer */}
        <div className="shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
          {editable ? (
            <>
              {entries.length > 0 && (
                <div className="mb-2 flex justify-end">
                  <button
                    onClick={handleSeal}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs text-ink-faint transition-colors hover:text-accent"
                  >
                    <Stamp size={14} /> Seal the day
                  </button>
                </div>
              )}
              <Composer key={date} onCommit={commitEntry} />
            </>
          ) : (
            <div className="flex items-center justify-center gap-2 py-3 font-mono text-xs text-ink-faint">
              <Stamp size={14} className="text-accent/70" />
              {sealed && note?.sealedAt
                ? `Sealed · ${formatClock(note.sealedAt)}`
                : 'This day is read-only.'}
            </div>
          )}
        </div>
      </motion.div>
      </div>

      <SealStamp show={sealing} onDone={() => setSealing(false)} />
    </div>
  );
}
