import { useEffect, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import type { Note } from '../storage/types';
import { search } from '../lib/queries';
import { useJournalStore } from '../store/useJournalStore';
import { BackBar } from '../components/BackBar';
import { NoteGrid } from '../components/NoteGrid';

export function SearchScreen() {
  const revision = useJournalStore((s) => s.revision);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      void search(q).then((r) => live && setResults(r));
    }, 180);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [query, revision]);

  const q = query.trim();

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title="Search" />

      <div className="px-4 pb-2">
        <div className="flex items-center gap-2 rounded-2xl border border-rule bg-paper px-3 py-2 focus-within:border-accent/50">
          <SearchIcon size={18} className="text-ink-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your days and #tags…"
            className="flex-1 bg-transparent font-serif text-[1.02rem] outline-none placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-2">
        {!q ? (
          <p className="mt-16 text-center font-serif text-lg italic text-ink-faint">
            What are you looking for?
          </p>
        ) : results.length === 0 ? (
          <p className="mt-16 text-center font-serif text-lg italic text-ink-faint">
            Nothing found for “{q}”.
          </p>
        ) : (
          <>
            <p className="mb-3 font-mono text-xs text-ink-faint">
              {results.length} {results.length === 1 ? 'day' : 'days'}
            </p>
            <NoteGrid notes={results} />
          </>
        )}
        <p className="mt-8 text-center font-mono text-[0.65rem] text-ink-faint">
          Private notes are excluded until the vault is unlocked.
        </p>
      </div>
    </div>
  );
}
