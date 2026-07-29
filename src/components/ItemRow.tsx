import { useLayoutEffect, useRef, useState } from 'react';
import type { Item } from '../types';
import { fullStamp, stamp } from '../lib/time';
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
  /** Text of the item this one was split out of, if any. */
  parentText?: string;
}

/** One captured thought: a checkbox, the text, its time, and its thread. */
export function ItemRow({
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
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const editRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = editRef.current;
    if (!editing || !el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [editing, draft]);

  function commitEdit() {
    setEditing(false);
    if (draft.trim() && draft.trim() !== item.text) onEdit(draft);
    else setDraft(item.text);
  }

  const timestamp = item.done && item.doneAt ? item.doneAt : item.createdAt;

  return (
    <li className="animate-pop-in">
      <div
        className={`group surface hairline rounded-xl border transition-colors ${
          expanded ? 'border-accent-300 dark:border-accent-800' : 'hover:border-ink-300 dark:hover:border-ink-700'
        }`}
      >
        <div className="flex items-start gap-2.5 p-2.5 sm:gap-3 sm:p-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={item.done}
            onClick={onToggle}
            aria-label={item.done ? `Mark "${item.text}" as not done` : `Mark "${item.text}" as done`}
            className={`mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md border-[1.5px] transition active:scale-90 ${
              item.done
                ? 'border-accent-500 bg-accent-500 text-white'
                : 'hairline hover:border-accent-400 hover:bg-accent-500/5'
            }`}
          >
            {item.done && <CheckIcon className="h-[14px] w-[14px]" />}
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
                className="autosize hairline w-full rounded-lg border bg-transparent px-2 py-1 text-[15px] leading-relaxed focus:border-accent-400 focus:outline-none"
              />
            ) : (
              <p
                onDoubleClick={() => {
                  setDraft(item.text);
                  setEditing(true);
                }}
                title="Double-click to edit"
                className={`whitespace-pre-wrap break-words text-[15px] leading-relaxed transition-colors ${
                  item.done ? 'muted line-through decoration-1' : ''
                }`}
              >
                {item.text}
              </p>
            )}

            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <time
                className="muted text-[11px] tabular-nums"
                dateTime={new Date(timestamp).toISOString()}
                title={
                  item.done && item.doneAt
                    ? `Done ${fullStamp(item.doneAt)} · added ${fullStamp(item.createdAt)}`
                    : fullStamp(item.createdAt)
                }
              >
                {item.done && item.doneAt ? `Done ${stamp(item.doneAt)}` : stamp(item.createdAt)}
              </time>

              <button
                type="button"
                onClick={onToggleExpand}
                aria-expanded={expanded}
                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition ${
                  item.replies.length
                    ? 'text-accent-600 hover:bg-accent-500/10 dark:text-accent-300'
                    : 'muted opacity-0 hover:bg-accent-500/10 hover:text-accent-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:text-accent-300'
                }`}
              >
                <ThreadIcon className="h-[13px] w-[13px]" />
                {item.replies.length > 0
                  ? `${item.replies.length} in thread`
                  : expanded
                    ? 'Close'
                    : 'Elaborate'}
              </button>

              <button
                type="button"
                onClick={onRemove}
                aria-label={`Delete "${item.text}"`}
                className="muted ml-auto rounded-md p-1 opacity-0 transition hover:bg-red-500/10 hover:text-red-600 focus-visible:opacity-100 group-hover:opacity-100 dark:hover:text-red-400"
              >
                <TrashIcon className="h-[15px] w-[15px]" />
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <Thread
            item={item}
            onReply={onReply}
            onRemoveReply={onRemoveReply}
            onPromoteReply={onPromoteReply}
          />
        )}
      </div>
    </li>
  );
}
