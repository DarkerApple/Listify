import { ChevronLeft } from 'lucide-react';
import { navigate } from '../router/route';

/** Slim header for secondary screens with a back affordance. */
export function BackBar({ title, subtitle }: { title: string; subtitle?: string }) {
  function back() {
    if (window.history.length > 1) window.history.back();
    else navigate({ name: 'today' });
  }
  return (
    <header className="flex items-center gap-2 px-3 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
      <button
        onClick={back}
        aria-label="Back"
        className="rounded-full p-1.5 text-ink-faint transition-colors hover:text-accent hover:bg-rule/30"
      >
        <ChevronLeft size={22} />
      </button>
      <div>
        <h1 className="font-hand text-xl leading-tight text-ink">{title}</h1>
        {subtitle && <p className="font-mono text-[0.7rem] uppercase tracking-wide text-ink-faint">{subtitle}</p>}
      </div>
    </header>
  );
}
