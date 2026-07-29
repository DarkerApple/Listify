import { monthLabelShort, monthLabel } from '../lib/time';

interface Props {
  months: string[];
  activeKey: string | null;
  onJump: (key: string) => void;
}

/**
 * Horizontal month jump bar. With months as the only real navigation in the app,
 * this is the whole nav — one tap to any month, newest on the left.
 */
export function MonthNav({ months, activeKey, onJump }: Props) {
  if (months.length < 2) return null;

  return (
    <nav aria-label="Jump to month" className="-mx-4 px-4">
      <ul className="flex snap-x gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {months.map((key) => {
          const active = key === activeKey;
          return (
            <li key={key} className="snap-start">
              <button
                type="button"
                onClick={() => onJump(key)}
                aria-current={active ? 'true' : undefined}
                title={monthLabel(key)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-accent-500 text-white'
                    : 'surface hairline muted border hover:text-ink-900 dark:hover:text-ink-100'
                }`}
              >
                {monthLabelShort(key)}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
