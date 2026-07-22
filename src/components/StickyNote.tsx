import { Lock, Star } from 'lucide-react';
import type { Note } from '../storage/types';
import { parseISODate } from '../lib/date';
import { stickyTint } from '../lib/mood';
import { EntryText } from './EntryText';
import { TagChip } from './TagChip';

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * A day rendered as a physical sticky note: mood-tinted paper, a folded corner,
 * the day's number, a few entry previews and its tags. Used in the notestack
 * pile, the month spread, and the search/highlights reels.
 */
export function StickyNote({
  note,
  onClick,
  className = '',
  style,
}: {
  note: Note;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const d = parseISODate(note.date);
  const preview = note.entries.slice(0, 4);
  const extra = note.entries.length - preview.length;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ background: stickyTint(note.mood), ...style }}
      className={`relative flex flex-col overflow-hidden rounded-[14px] p-4 text-left shadow-[0_10px_28px_rgba(40,30,15,0.16),0_2px_6px_rgba(40,30,15,0.10)] ring-1 ring-black/5 ${className}`}
    >
      {/* Folded corner */}
      <span
        className="pointer-events-none absolute right-0 top-0 h-6 w-6"
        style={{
          background: 'linear-gradient(225deg, rgba(0,0,0,0.10), transparent 55%)',
          borderTopRightRadius: 14,
        }}
      />

      {/* Header */}
      <div className="mb-2 flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-hand text-3xl leading-none text-ink">{d.getDate()}</span>
          <span className="font-mono text-[0.7rem] uppercase tracking-wide text-ink-soft">
            {WEEKDAY[d.getDay()]}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {note.private && <Lock size={14} className="text-ink-soft" />}
          {note.starred && <Star size={15} className="text-accent" fill="currentColor" />}
        </div>
      </div>

      {/* Entry previews */}
      <div className="min-h-0 flex-1 space-y-1.5 overflow-hidden">
        {note.private ? (
          <p className="font-serif text-sm italic text-ink-soft">🔒 private note</p>
        ) : preview.length === 0 ? (
          <p className="font-serif text-sm italic text-ink-faint">Empty day</p>
        ) : (
          preview.map((e) => (
            <p
              key={e.id}
              className="truncate font-serif text-[0.9rem] leading-snug text-ink/90"
            >
              {e.type === 'todo' && (
                <span className={e.todoState === 'done' ? 'text-accent' : 'text-ink-faint'}>
                  {e.todoState === 'done' ? '✓ ' : '○ '}
                </span>
              )}
              <EntryText text={e.text} muted={e.type === 'todo' && e.todoState === 'done'} />
            </p>
          ))
        )}
        {extra > 0 && <p className="font-mono text-[0.7rem] text-ink-faint">+{extra} more</p>}
      </div>

      {/* Tags */}
      {note.tags.length > 0 && !note.private && (
        <div className="mt-2 flex flex-wrap gap-1">
          {note.tags.slice(0, 4).map((t) => (
            <TagChip key={t} tag={t} />
          ))}
        </div>
      )}
    </button>
  );
}
