import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Filter } from './types';
import { useItems } from './hooks/useItems';
import { useTheme } from './hooks/useTheme';
import { allMonthKeys, groupByMonth } from './lib/group';
import { exportJSON, parseImport } from './lib/storage';
import { Composer } from './components/Composer';
import { Toolbar } from './components/Toolbar';
import { MonthNav } from './components/MonthNav';
import { MonthSection } from './components/MonthSection';
import { ItemRow } from './components/ItemRow';
import { EmptyState } from './components/EmptyState';
import { UndoToast } from './components/UndoToast';
import { Menu } from './components/Menu';
import { MoonIcon, PlusIcon, SunIcon } from './components/icons';

/** Height of the sticky top bar; month headings and jump targets align to it. */
const HEADER_OFFSET = 56;

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

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeMonth, setActiveMonth] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const sectionRefs = useRef(new Map<string, HTMLElement>());

  const groups = useMemo(() => groupByMonth(items, filter, query), [items, filter, query]);
  const months = useMemo(() => allMonthKeys(items), [items]);
  const counts = useMemo(() => {
    const done = items.filter((i) => i.done).length;
    return { all: items.length, open: items.length - done, done };
  }, [items]);

  // Parent text for items that were split out of a thread.
  const textById = useMemo(() => new Map(items.map((i) => [i.id, i.text])), [items]);

  const registerRef = useCallback((key: string, node: HTMLElement | null) => {
    if (node) sectionRefs.current.set(key, node);
    else sectionRefs.current.delete(key);
  }, []);

  // Track which month is under the header so the jump bar shows where you are.
  useEffect(() => {
    let frame = 0;
    function update() {
      frame = 0;
      setScrolled(window.scrollY > 120);
      let current: string | null = null;
      for (const group of groups) {
        const node = sectionRefs.current.get(group.key);
        if (node && node.getBoundingClientRect().top <= HEADER_OFFSET + 24) current = group.key;
      }
      setActiveMonth(current ?? groups[0]?.key ?? null);
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [groups]);

  const focusComposer = useCallback(() => {
    window.scrollTo({ top: 0 });
    // Wait for the scroll to start before focusing, or mobile keyboards fight it.
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  // Keyboard shortcuts. They're deliberately few, and never steal a real keystroke.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '');
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'n' || e.key === 'c') {
        e.preventDefault();
        focusComposer();
      } else if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape') {
        setExpandedId(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focusComposer]);

  function jumpToMonth(key: string) {
    sectionRefs.current.get(key)?.scrollIntoView({ block: 'start' });
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

  const nothingYet = items.length === 0;

  return (
    <div className="min-h-dvh">
      <header
        className="sticky top-0 z-20 h-14"
        style={{ backgroundColor: 'rgb(var(--paper))' }}
      >
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0 });
            }}
            className="flex items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500 text-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                <path d="M4 8l2.2 2.2L11 5.5" />
                <path d="M14.5 8.5H20" />
                <path d="M4 16.5l2.2 2.2L11 14" />
                <path d="M14.5 17H20" />
              </svg>
            </span>
            <span className="text-[15px] font-semibold tracking-tight">Listify</span>
          </a>

          <span className="muted ml-1 hidden text-[12px] sm:inline">
            catch a thought · get a checklist
          </span>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="surface hairline muted flex h-9 w-9 items-center justify-center rounded-full border transition hover:text-ink-900 dark:hover:text-ink-100"
            >
              {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
            <Menu
              doneCount={counts.done}
              onClearDone={clearDone}
              onExport={handleExport}
              onImport={handleImport}
            />
          </div>
        </div>
      </header>

      <main id="top" className="mx-auto max-w-2xl px-4 pb-32">
        <div className="space-y-3 pb-4 pt-1">
          <Composer ref={composerRef} onCapture={(text) => capture(text)} />
          {!nothingYet && (
            <>
              <Toolbar
                ref={searchRef}
                filter={filter}
                onFilter={setFilter}
                query={query}
                onQuery={setQuery}
                counts={counts}
              />
              <MonthNav months={months} activeKey={activeMonth} onJump={jumpToMonth} />
            </>
          )}
        </div>

        {nothingYet ? (
          <EmptyState kind="fresh" onReset={() => undefined} />
        ) : groups.length === 0 ? (
          <EmptyState
            kind="filtered"
            onReset={() => {
              setFilter('all');
              setQuery('');
            }}
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <MonthSection key={group.key} group={group} registerRef={registerRef}>
                {group.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    expanded={expandedId === item.id}
                    onToggleExpand={() =>
                      setExpandedId((current) => (current === item.id ? null : item.id))
                    }
                    onToggle={() => toggle(item.id)}
                    onEdit={(text) => edit(item.id, text)}
                    onRemove={() => remove(item.id)}
                    onReply={(text) => reply(item.id, text)}
                    onRemoveReply={(replyId) => removeReply(item.id, replyId)}
                    onPromoteReply={(replyId) => promoteReply(item.id, replyId)}
                    parentText={item.parentId ? textById.get(item.parentId) : undefined}
                  />
                ))}
              </MonthSection>
            ))}
          </div>
        )}

        {!nothingYet && (
          <p className="muted mt-10 text-center text-[11px]">
            Press <kbd className="font-sans font-medium">N</kbd> to capture ·{' '}
            <kbd className="font-sans font-medium">/</kbd> to search · saved in this browser only
          </p>
        )}
      </main>

      {/* Back to the composer once the list has scrolled past it. */}
      {scrolled && (
        <button
          type="button"
          onClick={focusComposer}
          aria-label="Capture a new thought"
          className="animate-pop-in fixed bottom-6 right-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg transition hover:bg-accent-600 active:scale-95 sm:bottom-8 sm:right-8"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-30 flex justify-center px-4">
        {lastRemoved && (
          <UndoToast text={lastRemoved.item.text} onUndo={undoRemove} onDismiss={dismissUndo} />
        )}
      </div>
    </div>
  );
}
