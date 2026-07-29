import type { MonthGroup } from '../lib/group';
import { monthLabel } from '../lib/time';

interface Props {
  group: MonthGroup;
  children: React.ReactNode;
  registerRef: (key: string, node: HTMLElement | null) => void;
}

/** One month of thoughts, under a sticky heading with its completion count. */
export function MonthSection({ group, children, registerRef }: Props) {
  const pct = group.total ? Math.round((group.done / group.total) * 100) : 0;

  return (
    <section
      ref={(node) => registerRef(group.key, node)}
      // Offset so the sticky app header never covers the heading after a jump.
      className="scroll-mt-[76px]"
      aria-labelledby={`month-${group.key}`}
    >
      <div
        className="sticky top-[56px] z-10 mb-2 flex items-center gap-3 py-2"
        style={{ backgroundColor: 'rgb(var(--paper))' }}
      >
        <h2
          id={`month-${group.key}`}
          className="text-[13px] font-semibold uppercase tracking-[0.14em]"
        >
          {monthLabel(group.key)}
        </h2>
        <span className="muted text-[11px] tabular-nums">
          {group.done}/{group.total} done
        </span>
        <div className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-ink-200 dark:bg-ink-800">
          <div
            className="h-full rounded-full bg-accent-500 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">{children}</ul>
    </section>
  );
}
