import { ChevronLeft } from 'lucide-react';
import { navigate } from '../router/route';

/**
 * Header for secondary screens. `root` screens are reachable from the tab bar,
 * so they show just a title; pushed screens (year, tag) show a back affordance.
 */
export function BackBar({ title, subtitle, root }: { title: string; subtitle?: string; root?: boolean }) {
  function back() {
    if (window.history.length > 1) window.history.back();
    else navigate({ name: 'today' });
  }
  return (
    <header className="flex items-center gap-2 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
      {!root && (
        <button
          onClick={back}
          aria-label="Back"
          className="-ml-1.5 rounded-full p-1.5 text-ink-faint transition-colors hover:text-accent hover:bg-rule/30"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      <div>
        <h1 className="font-hand text-2xl leading-tight text-ink">{title}</h1>
        {subtitle && <p className="font-mono text-[0.7rem] uppercase tracking-wide text-ink-faint">{subtitle}</p>}
      </div>
    </header>
  );
}
