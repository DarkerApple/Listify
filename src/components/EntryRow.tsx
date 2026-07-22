import { useState } from 'react';
import { X } from 'lucide-react';
import type { Entry } from '../storage/types';
import { formatClock } from '../lib/date';
import { EntryText } from './EntryText';
import { TodoIcon } from './TodoIcon';

/**
 * One entry line: a quiet timestamp gutter on the left, the body on the right.
 * The gutter sharpens for the active (latest) entry; the vertical gap above the
 * row is proportional to real elapsed time (computed by the parent).
 */
export function EntryRow({
  entry,
  active,
  editable,
  gapPx,
  onCycle,
  onRemove,
}: {
  entry: Entry;
  active: boolean;
  editable: boolean;
  gapPx: number;
  onCycle: () => void;
  onRemove: () => void;
}) {
  const [hover, setHover] = useState(false);
  const done = entry.type === 'todo' && entry.todoState === 'done';

  return (
    <div
      className="entry-in group flex gap-3"
      style={{ marginTop: gapPx }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Timestamp gutter */}
      <time
        className={[
          'w-16 shrink-0 select-none pt-[0.2em] text-right font-mono text-[0.7rem] tabular-nums transition-colors',
          active ? 'text-ink-soft' : 'text-ink-faint',
        ].join(' ')}
        dateTime={new Date(entry.createdAt).toISOString()}
      >
        {formatClock(entry.createdAt)}
      </time>

      {/* Body */}
      <div className="flex min-w-0 flex-1 items-start gap-2">
        {entry.type === 'todo' && (
          <TodoIcon state={entry.todoState} onCycle={onCycle} disabled={!editable} />
        )}
        <p className="min-w-0 flex-1 font-serif text-[1.02rem] leading-relaxed">
          <EntryText text={entry.text} muted={done} />
        </p>

        {editable && (
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove entry"
            className={[
              'mt-[0.2em] shrink-0 rounded p-0.5 text-ink-faint transition-opacity hover:text-accent',
              hover ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
