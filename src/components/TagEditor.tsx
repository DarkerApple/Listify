import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Note } from '../storage/types';
import { useJournalStore } from '../store/useJournalStore';
import { useSettings } from '../store/useSettings';
import { TagChip } from './TagChip';

/**
 * Add/remove a day's tags — allowed even after sealing (metadata), unless
 * "freeze completely" is on. This is the always-available equivalent of the
 * long-press-to-tag gesture.
 */
export function TagEditor({ note }: { note: Note }) {
  const addTag = useJournalStore((s) => s.addTag);
  const removeTag = useJournalStore((s) => s.removeTag);
  const knownTags = useJournalStore((s) => s.knownTags);
  const frozen = useSettings((s) => s.freezeSealedCompletely);
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');

  const editable = !note.sealed || !frozen;
  const suggestions = value
    ? knownTags.filter((t) => t.startsWith(value.toLowerCase()) && !note.tags.includes(t)).slice(0, 4)
    : [];

  function commit(tag: string) {
    void addTag(note.date, tag);
    setValue('');
    setAdding(false);
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      {note.tags.map((t) => (
        <span key={t} className="inline-flex items-center gap-0.5">
          <TagChip tag={t} interactive />
          {editable && (
            <button
              onClick={() => removeTag(note.date, t)}
              aria-label={`Remove #${t}`}
              className="text-ink-faint hover:text-accent"
            >
              <X size={12} />
            </button>
          )}
        </span>
      ))}

      {editable &&
        (adding ? (
          <span className="relative">
            <input
              autoFocus
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\p{L}\p{N}_-]/gu, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && value) commit(value);
                if (e.key === 'Escape') setAdding(false);
              }}
              onBlur={() => setTimeout(() => setAdding(false), 120)}
              placeholder="tag"
              className="w-20 rounded border border-rule bg-paper px-1.5 py-0.5 font-mono text-xs outline-none focus:border-accent/50"
            />
            {suggestions.length > 0 && (
              <ul className="absolute left-0 top-full z-20 mt-1 overflow-hidden rounded-lg border border-rule bg-paper shadow-lg">
                {suggestions.map((s) => (
                  <li key={s}>
                    <button
                      onMouseDown={(e) => {
                        e.preventDefault();
                        commit(s);
                      }}
                      className="block w-full px-2 py-1 text-left font-mono text-xs text-accent hover:bg-rule/40"
                    >
                      #{s}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </span>
        ) : (
          <button
            onClick={() => setAdding(true)}
            aria-label="Add tag"
            className="flex items-center gap-0.5 rounded-full border border-dashed border-rule px-1.5 py-0.5 font-mono text-[0.7rem] text-ink-faint hover:border-accent/50 hover:text-accent"
          >
            <Plus size={11} /> tag
          </button>
        ))}
    </div>
  );
}
