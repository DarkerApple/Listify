import type { ReactNode } from 'react';
import type { Item } from '../types';
import type { DayGroup, MonthSummary } from '../lib/group';
import { dayHeading, monthLabel } from '../lib/time';

interface Props {
  monthKey: string;
  summary?: MonthSummary;
  days: DayGroup[];
  /** Renders one row; the sheet owns layout, the caller owns row behaviour. */
  renderItem: (item: Item) => ReactNode;
  /** Shown on the page itself when there's nothing to rule out. */
  empty?: ReactNode;
  children?: ReactNode;
}

/**
 * A month as a single sheet of paper. Everything captured that month lives on
 * one page — a title, a progress line, day rules down the margin, and the items
 * themselves as ruled lines rather than separate cards.
 */
export function MonthNote({ monthKey: key, summary, days, renderItem, empty, children }: Props) {
  const total = summary?.total ?? 0;
  const done = summary?.done ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <article className="surface hairline overflow-hidden rounded-2xl border shadow-sheet">
      <header className="hairline border-b px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-[26px] leading-none tracking-tight sm:text-[30px]">
              {monthLabel(key)}
            </h1>
            <p className="muted mt-1.5 text-[12px]">
              {total === 0
                ? 'Nothing on this page yet'
                : `${total} ${total === 1 ? 'note' : 'notes'} · ${done} done${
                    summary?.threads ? ` · ${summary.threads} with threads` : ''
                  }`}
            </p>
          </div>
          {total > 0 && (
            <div className="shrink-0 text-right">
              <span className="font-display text-[22px] leading-none tabular-nums">{pct}%</span>
              <div className="mt-1.5 h-1 w-20 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
                <div
                  className="h-full rounded-full bg-accent-600 transition-[width] duration-500 dark:bg-accent-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
        {children}
      </header>

      {days.length === 0 && empty}

      {days.map((day) => {
        const heading = dayHeading(day.at);
        return (
          <section key={day.key} className="hairline border-t first-of-type:border-t-0">
            <h2
              className="surface sticky z-10 flex items-baseline gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] sm:px-6"
              style={{ top: 'calc(var(--header-h) + var(--tabs-h))' }}
            >
              {heading.primary}
              <span className="muted font-normal normal-case tracking-normal">
                {heading.secondary}
              </span>
            </h2>
            <ul>{day.items.map((item) => renderItem(item))}</ul>
          </section>
        );
      })}
    </article>
  );
}
