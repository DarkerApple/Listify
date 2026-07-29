import { useLayoutEffect, useRef, useState } from 'react';
import type { Item } from '../types';
import { fullStamp, stamp, timeLabel } from '../lib/time';
import { CheckIcon, ThreadIcon, TrashIcon } from './icons';
import { Thread } from './Thread';

interface Props {
  item: Item;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggle: () => void;
  onEdit: (text: string) => void;
  onRemove: () => void;
  onReply: (text: string) => void;
  onRemoveReply: (replyId: string) => void;
  onPromoteReply: (replyId: string) => void;
  /** Shown when this item was split out of another item's thread. */
  parentText?: string;
  /** Search results span months, so those rows carry a full date. */
  showFullDate?: boolean;
}

/**
 * One line of the month's note. Rows are separated by a rule rather than boxed
 * as cards, so a month reads as a single continuous page.
 *
 * Tapping the line opens its thread — the one primary action, and the only one
 * that works identically with a finger and a mouse. Edit and delete live inside
 * that panel so nothing depends on hover.
 */
export function NoteRow({
  item,
  expanded,
  onToggleExpand,
  onToggle,
  onEdit,
  onRemove,
  onReply,
  onRemoveReply,
  onPromoteReply,
  parentText,
  showFullDate,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = editRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, draft]);

  useLayoutEffect(() => {
    if (!editing) return;
    const el = editRef.current;
    el?.focus();
    el?.setSelectionRange(el.value.length, el.value.length);
  }, [editing]);

  function startEditing() {
    setDraft(item.text);
    setEditing(true);
  }

  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== item.text) onEdit(draft);
    else setDraft(item.text);
  }

  const when = item.done && item.doneAt ? item.doneAt : item.createdAt;

  return (
    <li className={`group animate-fade-in border-t transition-colors first:border-t-0 ${expanded ? 'rowtint' : ''}`} style={{ borderColor: 'rgb(var(--line))' }}>
      <div className="flex items-start gap-3 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          role="checkbox"
          aria-checked={item.done}
          onClick={onToggle}
          aria-label={item.done ? `Mark "${item.text}" as not done` : `Mark "${item.text}" as done`}
          // 44px hit area around a 22px box: comfortable on a phone, tidy on screen.
          className="-m-2.5 shrink-0 p-2.5"
        >
          <span
            className={`flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border-[1.5px] transition ${
              item.done
                ? 'border-accent-600 bg-accent-600 text-white dark:border-accent-500 dark:bg-accent-500'
                : 'hairline group-hover:border-accent-400'
            }`}
          >
            {item.done && <CheckIcon className="h-[14px] w-[14px]" />}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          {parentText && (
            <p className="muted mb-0.5 truncate text-[11px]" title={`Split out of: ${parentText}`}>
              ↳ from “{parentText}”
            </p>
          )}

          {editing ? (
            <textarea
              ref={editRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitEdit();
                }
                if (e.key === 'Escape') {
                  setDraft(item.text);
                  setEditing(false);
                }
              }}
              rows={1}
              aria-label="Edit item"
              className="hairline w-full resize-none rounded-lg border bg-transparent px-2 py-1 text-[15px] leading-relaxed focus:border-accent-400 focus:outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={onToggleExpand}
              onDoubleClick={startEditing}
              aria-expanded={expanded}
              className="block w-full text-left"
            >
              <span
                className={`block whitespace-pre-wrap break-words text-[15px] leading-snug transition-colors ${
                  item.done ? 'muted line-through decoration-1' : ''
                }`}
              >
                {item.text}
              </span>
            </button>
          )}

          {(item.replies.length > 0 || expanded) && (
            <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-accent-700 dark:text-accent-300">
              <ThreadIcon className="h-[13px] w-[13px]" />
              {item.replies.length > 0
                ? `${item.replies.length} in thread`
                : 'Thread — say more about this'}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 pt-px">
          <time
            className="muted text-[11px] tabular-nums"
            dateTime={new Date(when).toISOString()}
            title={
              item.done && item.doneAt
                ? `Done ${fullStamp(item.doneAt)} · added ${fullStamp(item.createdAt)}`
                : fullStamp(item.createdAt)
            }
          >
            {showFullDate ? stamp(when) : timeLabel(when)}
          </time>
          {/* Shortcut for pointer users; touch users get the same action below. */}
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Delete "${item.text}"`}
            className="hover-reveal muted -mr-1 hidden rounded-lg p-1.5 transition hover:bg-red-500/10 hover:text-red-600 sm:block dark:hover:text-red-400"
          >
            <TrashIcon className="h-[15px] w-[15px]" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="animate-slide-up px-3 pb-3 sm:px-4">
          <Thread
            item={item}
            onReply={onReply}
            onRemoveReply={onRemoveReply}
            onPromoteReply={onPromoteReply}
          />
          <div className="mt-2 flex items-center gap-2 pl-9">
            <button
              type="button"
              onClick={startEditing}
              className="hairline muted rounded-full border px-3 py-1.5 text-[12px] transition hover:text-[rgb(var(--text))]"
            >
              Edit note
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="hairline muted rounded-full border px-3 py-1.5 text-[12px] transition hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={onToggleExpand}
              className="muted ml-auto rounded-full px-3 py-1.5 text-[12px] transition hover:text-[rgb(var(--text))]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
