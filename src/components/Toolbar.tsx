import { Layers, Search, Settings, Sparkles } from 'lucide-react';
import type { ISODate } from '../storage/types';
import { parseISODate } from '../lib/date';
import { navigate } from '../router/route';

const btn =
  'rounded-full p-2 text-ink-faint transition-colors hover:text-accent hover:bg-rule/30 active:scale-90';

/** Quiet top-right nav cluster on the day screen. Gestures are primary; these
 *  are the accessible, desktop-friendly equivalents. */
export function Toolbar({ date }: { date: ISODate }) {
  const d = parseISODate(date);
  return (
    <nav className="flex items-center gap-0.5" aria-label="Navigate">
      <button
        className={btn}
        title="This month's notestacks"
        aria-label="Open this month's notestacks"
        onClick={() => navigate({ name: 'month', year: d.getFullYear(), month: d.getMonth() })}
      >
        <Layers size={18} />
      </button>
      <button
        className={btn}
        title="Search"
        aria-label="Search"
        onClick={() => navigate({ name: 'search' })}
      >
        <Search size={18} />
      </button>
      <button
        className={btn}
        title="Highlights"
        aria-label="Highlights"
        onClick={() => navigate({ name: 'highlights' })}
      >
        <Sparkles size={18} />
      </button>
      <button
        className={btn}
        title="Settings"
        aria-label="Settings"
        onClick={() => navigate({ name: 'settings' })}
      >
        <Settings size={18} />
      </button>
    </nav>
  );
}
