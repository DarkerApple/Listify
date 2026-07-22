import { useEffect, useState } from 'react';
import { Layers, NotebookPen, Search, Settings, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useRoute } from '../router/useRoute';
import { navigate, type Route } from '../router/route';
import { todayISO } from '../lib/date';

type TabKey = 'today' | 'stacks' | 'highlights' | 'search' | 'settings';

const TABS: { key: TabKey; label: string; icon: LucideIcon; to: () => Route; active: (r: Route) => boolean }[] = [
  { key: 'today', label: 'Today', icon: NotebookPen, to: () => ({ name: 'today' }), active: (r) => r.name === 'today' || r.name === 'day' },
  {
    key: 'stacks',
    label: 'Stacks',
    icon: Layers,
    to: () => {
      const d = new Date(todayISO());
      return { name: 'month', year: d.getFullYear(), month: d.getMonth() };
    },
    active: (r) => r.name === 'month' || r.name === 'year',
  },
  { key: 'highlights', label: 'Highlights', icon: Sparkles, to: () => ({ name: 'highlights' }), active: (r) => r.name === 'highlights' },
  { key: 'search', label: 'Search', icon: Search, to: () => ({ name: 'search' }), active: (r) => r.name === 'search' || r.name === 'tag' },
  { key: 'settings', label: 'Settings', icon: Settings, to: () => ({ name: 'settings' }), active: (r) => r.name === 'settings' },
];

/**
 * Persistent labeled navigation. Always mounted; it renders nothing while a
 * text field is focused so the composer can sit flush to the keyboard.
 */
export function TabBar() {
  const route = useRoute();
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    // Only the composer (a textarea) hides the bar, so it can sit flush to the
    // mobile keyboard. Search/tag inputs keep the bar visible.
    const isComposer = (el: EventTarget | null) => (el as HTMLElement | null)?.tagName === 'TEXTAREA';
    const onIn = (e: FocusEvent) => isComposer(e.target) && setTyping(true);
    const onOut = (e: FocusEvent) => isComposer(e.target) && setTyping(false);
    document.addEventListener('focusin', onIn);
    document.addEventListener('focusout', onOut);
    return () => {
      document.removeEventListener('focusin', onIn);
      document.removeEventListener('focusout', onOut);
    };
  }, []);

  if (typing) return null;

  return (
    <nav
      aria-label="Primary"
      className="shrink-0 border-t border-rule bg-paper/90 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <div className="mx-auto flex max-w-2xl">
        {TABS.map((tab) => {
          const active = tab.active(route);
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.to())}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${active ? 'text-accent' : 'text-ink-faint hover:text-ink-soft'}`}
            >
              <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
              <span className="text-[0.66rem] font-medium tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
