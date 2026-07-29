import { forwardRef } from 'react';
import type { Filter } from '../types';
import { CloseIcon, SearchIcon } from './icons';

interface Props {
  filter: Filter;
  onFilter: (filter: Filter) => void;
  query: string;
  onQuery: (query: string) => void;
  counts: { all: number; open: number; done: number };
}

const TABS: { id: Filter; label: string }[] = [
  { id: 'open', label: 'To do' },
  { id: 'done', label: 'Done' },
  { id: 'all', label: 'All' },
];

/** Filter tabs plus search — the only two knobs in the app. */
export const Toolbar = forwardRef<HTMLInputElement, Props>(function Toolbar(
  { filter, onFilter, query, onQuery, counts },
  ref,
) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="tablist"
        aria-label="Filter items"
        className="surface hairline flex rounded-full border p-0.5"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={filter === tab.id}
            onClick={() => onFilter(tab.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter === tab.id ? 'bg-accent-500 text-white' : 'muted hover:text-ink-900 dark:hover:text-ink-100'
            }`}
          >
            {tab.label}
            <span className="ml-1 tabular-nums opacity-70">{counts[tab.id]}</span>
          </button>
        ))}
      </div>

      {/* Full width of its own row on phones, inline beside the tabs from sm up. */}
      <div className="surface hairline flex w-full items-center gap-2 rounded-full border px-3 py-1.5 focus-within:border-accent-400 sm:w-auto sm:min-w-[10rem] sm:flex-1">
        <SearchIcon className="muted h-4 w-4 shrink-0" />
        <input
          ref={ref}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              onQuery('');
              e.currentTarget.blur();
            }
          }}
          placeholder="Search notes and threads"
          aria-label="Search notes and threads"
          className="w-full bg-transparent text-[13px] placeholder:text-ink-400 focus:outline-none dark:placeholder:text-ink-500 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQuery('')}
            aria-label="Clear search"
            className="muted shrink-0 transition hover:text-ink-900 dark:hover:text-ink-100"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
});
