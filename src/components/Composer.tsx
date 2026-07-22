import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft } from 'lucide-react';
import { useJournalStore } from '../store/useJournalStore';

const TRAILING_TAG = /#([\p{L}\p{N}_-]*)$/u;

/**
 * The capture input. Bottom-anchored for thumb reach; Return commits the
 * current line as a timestamped entry and clears for the next. A leading "- "
 * makes the entry a todo. Typing "#" opens tag autocomplete (Tab accepts).
 */
export function Composer({ onCommit }: { onCommit: (text: string) => void }) {
  const knownTags = useJournalStore((s) => s.knownTags);
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  // Zero taps to start: focus on mount.
  useEffect(() => {
    ref.current?.focus();
  }, []);

  const partial = useMemo(() => {
    const m = value.match(TRAILING_TAG);
    return m ? m[1].toLowerCase() : null;
  }, [value]);

  const suggestions = useMemo(() => {
    if (partial === null) return [];
    return knownTags
      .filter((t) => t.startsWith(partial) && t !== partial)
      .slice(0, 5);
  }, [partial, knownTags]);

  function commit() {
    const text = value.trim();
    if (!text) return;
    onCommit(text);
    setValue('');
  }

  function acceptSuggestion(tag: string) {
    setValue((v) => v.replace(TRAILING_TAG, `#${tag} `));
    ref.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      acceptSuggestion(suggestions[0]);
      return;
    }
    // Return commits; Shift+Return inserts a newline within an entry.
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      commit();
    }
  }

  return (
    <div className="relative">
      {suggestions.length > 0 && (
        <ul className="absolute bottom-full left-0 mb-2 overflow-hidden rounded-xl border border-rule bg-paper shadow-lg">
          {suggestions.map((tag, i) => (
            <li key={tag}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  acceptSuggestion(tag);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-sm text-ink-soft hover:bg-rule/40"
              >
                <span className="text-accent">#{tag}</span>
                {i === 0 && <span className="ml-auto text-[0.65rem] text-ink-faint">Tab</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2 rounded-2xl border border-rule bg-paper/80 px-3 py-2 shadow-sm backdrop-blur focus-within:border-accent/50">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Anything worth remembering…"
          className="max-h-40 min-h-[1.6rem] flex-1 resize-none bg-transparent font-serif text-[1.05rem] leading-relaxed outline-none placeholder:text-ink-faint"
        />
        <button
          type="button"
          onClick={commit}
          aria-label="Add entry"
          className="mb-0.5 shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:text-accent active:scale-90"
        >
          <CornerDownLeft size={18} />
        </button>
      </div>
    </div>
  );
}
