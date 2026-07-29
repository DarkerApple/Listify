import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Filter, Item } from './types';
import { useItems } from './hooks/useItems';
import { useTheme } from './hooks/useTheme';
import { byMonth, dayGroups, filterItems, inMonth, monthSummaries } from './lib/group';
import type { MonthSummary } from './lib/group';
import { currentMonthKey, monthLabel } from './lib/time';
import { exportJSON, parseImport } from './lib/storage';
import { Composer } from './components/Composer';
import { MonthTabs } from './components/MonthTabs';
import { MonthNote } from './components/MonthNote';
import { NoteRow } from './components/NoteRow';
import { FilterTabs } from './components/FilterTabs';
import { SearchBar } from './components/SearchBar';
import { EmptyState } from './components/EmptyState';
import { UndoToast } from './components/UndoToast';
import { Menu } from './components/Menu';
import { ChevronLeftIcon, ChevronRightIcon, MoonIcon, SearchIcon, SunIcon } from './components/icons';

const EMPTY_MONTH = (key: string): MonthSummary => ({ key, total: 0, done: 0, open: 0, threads: 0 });

export default function App() {
  const {
    items,
    capture,
    toggle,
    edit,
    remove,
    lastRemoved,
    undoRemove,
    dismissUndo,
    reply,
    removeReply,
    promoteReply,
    clearDone,
    replaceAll,
  } = useItems();
  const { theme, toggle: toggleTheme } = useTheme();

  const thisMonth = currentMonthKey();
  const [activeMonth, setActiveMonth] = useState(thisMonth);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const justCaptured = useRef(false);

  // The current month always has a page, even before anything is written on it.
  const months = useMemo(() => {
    const list = monthSummaries(items);
    if (!list.some((m) => m.key === thisMonth)) list.push(EMPTY_MONTH(thisMonth));
    return list.sort((a, b) => a.key.localeCompare(b.key));
  }, [items, thisMonth]);

  // A month can disappear when its last item is deleted — land somewhere real.
  useEffect(() => {
    if (!months.some((m) => m.key === activeMonth)) {
      setActiveMonth(months[months.length - 1]?.key ?? thisMonth);
    }
  }, [months, activeMonth, thisMonth]);

  const summary = months.find((m) => m.key === activeMonth);
  const monthItems = useMemo(() => inMonth(items, activeMonth), [items, activeMonth]);

  const counts = useMemo(() => {
    const done = monthItems.filter((i) => i.done).length;
    return { all: monthItems.length, open: monthItems.length - done, done };
  }, [monthItems]);

  const trimmedQuery = query.trim();
  const searchMode = searching && trimmedQuery.length > 0;

  const days = useMemo(
    () => dayGroups(filterItems(monthItems, filter, '')),
    [monthItems, filter],
  );

  const results = useMemo(() => {
    if (!searchMode) return [];
    return byMonth(filterItems(items, filter, trimmedQuery));
  }, [items, filter, trimmedQuery, searchMode]);
  const resultCount = results.reduce((sum, group) => sum + group.items.length, 0);

  const textById = useMemo(() => new Map(items.map((i) => [i.id, i.text])), [items]);

  const focusComposer = useCallback(() => {
    composerRef.current?.focus();
  }, []);

  function handleCapture(text: string) {
    const added = capture(text);
    if (!added) return;
    // A new thought belongs to today, so follow it to the current month's page.
    setActiveMonth(thisMonth);
    setSearching(false);
    setQuery('');
    justCaptured.current = true;
  }

  // Newest lines sit at the bottom of the page — scroll to them after capture.
  useEffect(() => {
    if (!justCaptured.current) return;
    justCaptured.current = false;
    requestAnimationFrame(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' }),
    );
  }, [items]);

  const step = useCallback(
    (direction: -1 | 1) => {
      const index = months.findIndex((m) => m.key === activeMonth);
      const next = months[index + direction];
      if (!next) return;
      setActiveMonth(next.key);
      setExpandedId(null);
      window.scrollTo({ top: 0 });
    },
    [months, activeMonth],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (typing) {
        if (e.key === 'Escape' && searching) setSearching(false);
        return;
      }
      if (e.key === 'n' || e.key === 'c') {
        e.preventDefault();
        focusComposer();
      } else if (e.key === '/') {
        e.preventDefault();
        setSearching(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      } else if (e.key === 'ArrowLeft') {
        step(-1);
      } else if (e.key === 'ArrowRight') {
        step(1);
      } else if (e.key === 'Escape') {
        if (expandedId) setExpandedId(null);
        else if (searching) setSearching(false);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusComposer, step, expandedId, searching]);

  // Swipe left/right to change month — the gesture a phone user reaches for.
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  }
  function onTouchEnd(e: React.TouchEvent) {
    const start = touch.current;
    touch.current = null;
    if (!start || searchMode) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // Horizontal, decisive, and clearly not a scroll.
    if (Math.abs(dx) < 64 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - start.t > 600) return;
    step(dx < 0 ? 1 : -1);
  }

  function handleExport() {
    const blob = new Blob([exportJSON(items)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listify-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    const parsed = parseImport(await file.text());
    if (!parsed) {
      window.alert("That file doesn't look like a Listify backup.");
      return;
    }
    const ok = window.confirm(
      `Replace your ${items.length} current ${items.length === 1 ? 'item' : 'items'} with ${parsed.length} from this backup?`,
    );
    if (ok) replaceAll(parsed);
  }

  const renderRow = (item: Item, showFullDate = false) => (
    <NoteRow
      key={item.id}
      item={item}
      expanded={expandedId === item.id}
      onToggleExpand={() => setExpandedId((current) => (current === item.id ? null : item.id))}
      onToggle={() => toggle(item.id)}
      onEdit={(text) => edit(item.id, text)}
      onRemove={() => remove(item.id)}
      onReply={(text) => reply(item.id, text)}
      onRemoveReply={(replyId) => removeReply(item.id, replyId)}
      onPromoteReply={(replyId) => promoteReply(item.id, replyId)}
      parentText={item.parentId ? textById.get(item.parentId) : undefined}
      showFullDate={showFullDate}
    />
  );

  const index = months.findIndex((m) => m.key === activeMonth);
  const isEmptyEverywhere = items.length === 0;

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-30"
        style={{ height: 'var(--header-h)', backgroundColor: 'rgb(var(--paper))' }}
      >
        <div className="mx-auto flex h-full max-w-2xl items-center gap-1 px-3 sm:px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white dark:bg-accent-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M4 8l2.2 2.2L11 5.5" />
              <path d="M14.5 8.5H20" />
              <path d="M4 16.5l2.2 2.2L11 14" />
              <path d="M14.5 17H20" />
            </svg>
          </span>
          <span className="ml-1.5 text-[15px] font-semibold tracking-tight">Listify</span>

          <div className="ml-auto flex items-center gap-0.5">
            {/* Month arrows are pointer-friendly; touch users swipe or tap a tab. */}
            <button
              type="button"
              onClick={() => step(-1)}
              disabled={index <= 0}
              aria-label="Previous month"
              className="muted hidden h-9 w-9 items-center justify-center rounded-xl transition hover:text-[rgb(var(--text))] disabled:opacity-25 sm:flex"
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={index >= months.length - 1}
              aria-label="Next month"
              className="muted hidden h-9 w-9 items-center justify-center rounded-xl transition hover:text-[rgb(var(--text))] disabled:opacity-25 sm:flex"
            >
              <ChevronRightIcon />
            </button>
            <button
              type="button"
              onClick={() => {
                setSearching((v) => !v);
                requestAnimationFrame(() => searchRef.current?.focus());
              }}
              aria-label="Search"
              aria-pressed={searching}
              className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                searching ? 'text-accent-700 dark:text-accent-300' : 'muted hover:text-[rgb(var(--text))]'
              }`}
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="muted flex h-9 w-9 items-center justify-center rounded-xl transition hover:text-[rgb(var(--text))]"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Menu
              doneCount={items.filter((i) => i.done).length}
              onClearDone={clearDone}
              onExport={handleExport}
              onImport={handleImport}
            />
          </div>
        </div>
      </header>

      {searching ? (
        <SearchBar
          ref={searchRef}
          query={query}
          onQuery={setQuery}
          onClose={() => {
            setSearching(false);
            setQuery('');
          }}
          resultCount={resultCount}
        />
      ) : (
        <MonthTabs
          months={months}
          activeKey={activeMonth}
          onSelect={(key) => {
            setActiveMonth(key);
            setExpandedId(null);
            window.scrollTo({ top: 0 });
          }}
        />
      )}

      <main
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="mx-auto max-w-2xl px-3 pb-36 pt-4 sm:px-4 sm:pt-6"
      >
        {searchMode ? (
          <div className="space-y-4">
            <p className="muted px-1 text-[12px]">
              {resultCount} {resultCount === 1 ? 'match' : 'matches'} for “{trimmedQuery}”
            </p>
            {results.length === 0 ? (
              <div className="surface hairline rounded-2xl border shadow-sheet">
                <EmptyState kind="search" />
              </div>
            ) : (
              results.map((group) => (
                <section key={group.key} className="surface hairline overflow-hidden rounded-2xl border shadow-sheet">
                  <h2 className="hairline border-b px-4 py-3 font-display text-[19px] sm:px-6">
                    {monthLabel(group.key)}
                  </h2>
                  <ul>{group.items.map((item) => renderRow(item, true))}</ul>
                </section>
              ))
            )}
          </div>
        ) : (
          <MonthNote
            monthKey={activeMonth}
            summary={summary}
            days={days}
            renderItem={(item) => renderRow(item)}
            empty={
              <EmptyState
                kind={isEmptyEverywhere ? 'fresh' : counts.all === 0 ? 'month' : 'filtered'}
                onReset={() => setFilter('all')}
              />
            }
          >
            {counts.all > 0 && <FilterTabs filter={filter} onFilter={setFilter} counts={counts} />}
          </MonthNote>
        )}

        {!searchMode && (
          <p className="muted mt-6 text-center text-[11px]">
            <span className="hidden sm:inline">
              ← → for months · N to capture · / to search ·{' '}
            </span>
            <span className="sm:hidden">Swipe left or right for other months · </span>
            saved in this browser only
          </p>
        )}
      </main>

      <div
        className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-3"
        style={{ bottom: 'calc(env(safe-area-inset-bottom) + 84px)' }}
      >
        {lastRemoved && (
          <UndoToast text={lastRemoved.item.text} onUndo={undoRemove} onDismiss={dismissUndo} />
        )}
      </div>

      <Composer ref={composerRef} onCapture={handleCapture} viewingPast={activeMonth !== thisMonth} />
    </div>
  );
}
