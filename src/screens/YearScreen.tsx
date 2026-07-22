import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Note } from '../storage/types';
import { useJournalStore } from '../store/useJournalStore';
import { listYearCounts } from '../lib/queries';
import { MONTH_NAMES } from '../lib/date';
import { stickyTint } from '../lib/mood';
import { navigate } from '../router/route';
import { BackBar } from '../components/BackBar';

const MONTH_ABBR = MONTH_NAMES.map((m) => m.slice(0, 3));

/** A month rendered as a side-on pile of sheets; the pile grows with activity. */
function MonthPile({ year, month, notes }: { year: number; month: number; notes: Note[] }) {
  const sheets = Math.min(notes.length, 14); // one sheet per written day, capped
  const tint = notes.length ? stickyTint(notes[notes.length - 1].mood) : 'transparent';

  return (
    <button
      onClick={() => navigate({ name: 'month', year, month })}
      className="group flex flex-col items-center gap-2"
      aria-label={`${MONTH_NAMES[month]} ${year}, ${notes.length} days`}
    >
      <div className="relative flex h-24 w-20 items-end justify-center">
        {notes.length === 0 ? (
          <div className="mb-0 h-1.5 w-14 rounded-full border border-dashed border-rule" />
        ) : (
          <div className="relative mb-0" style={{ width: 56, height: sheets * 3 + 14 }}>
            {Array.from({ length: sheets }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 rounded-[3px] ring-1 ring-black/5"
                style={{
                  bottom: i * 3,
                  width: 56 - (i % 2) * 3,
                  left: (i % 2) * 1.5,
                  height: 12,
                  background: i === sheets - 1 ? tint : 'rgb(var(--paper))',
                  boxShadow: '0 1px 1px rgba(40,30,15,0.08)',
                }}
              />
            ))}
          </div>
        )}
      </div>
      {/* shelf line */}
      <div className="h-px w-full bg-rule" />
      <div className="text-center">
        <div className="font-mono text-xs text-ink-soft group-hover:text-accent">{MONTH_ABBR[month]}</div>
        <div className="font-mono text-[0.65rem] tabular-nums text-ink-faint">
          {notes.length || '—'}
        </div>
      </div>
    </button>
  );
}

export function YearScreen({ year }: { year: number }) {
  const revision = useJournalStore((s) => s.revision);
  const [months, setMonths] = useState<{ month: number; notes: Note[] }[]>([]);

  useEffect(() => {
    let live = true;
    void listYearCounts(year).then((m) => live && setMonths(m));
    return () => {
      live = false;
    };
  }, [year, revision]);

  const total = months.reduce((s, m) => s + m.notes.length, 0);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title={`${year}`} subtitle="the shelf" />

      <div className="flex items-center justify-center gap-6 pb-2">
        <button onClick={() => navigate({ name: 'year', year: year - 1 })} aria-label="Previous year" className="rounded-full p-1.5 text-ink-faint hover:text-accent">
          <ChevronLeft size={18} />
        </button>
        <span className="font-mono text-xs text-ink-soft">{total} days written</span>
        <button onClick={() => navigate({ name: 'year', year: year + 1 })} aria-label="Next year" className="rounded-full p-1.5 text-ink-faint hover:text-accent">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 pt-4">
        <div className="grid grid-cols-3 gap-x-2 gap-y-7 sm:grid-cols-4">
          {months.map((m) => (
            <MonthPile key={m.month} year={year} month={m.month} notes={m.notes} />
          ))}
        </div>
      </div>
    </div>
  );
}
