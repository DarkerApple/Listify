import { useLayoutEffect, useRef, useState } from 'react';
import type { Item } from '../types';
import { fullStamp, stamp } from '../lib/time';
import { ArrowUpIcon, PromoteIcon, TrashIcon } from './icons';

interface Props {
  item: Item;
  onReply: (text: string) => void;
  onRemoveReply: (replyId: string) => void;
  onPromoteReply: (replyId: string) => void;
}

/**
 * An item's thread: the place to keep thinking out loud about one idea. Any
 * message in it can be promoted into its own checklist item.
 */
export function Thread({ item, onReply, onRemoveReply, onPromoteReply }: Props) {
  const [draft, setDraft] = useState('');
  const boxRef = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [draft]);

  // Opening a thread should put the cursor where you'd type next.
  useLayoutEffect(() => {
    boxRef.current?.focus();
  }, []);

  function submit() {
    if (!draft.trim()) return;
    onReply(draft);
    setDraft('');
    boxRef.current?.focus();
  }

  return (
    <div className="animate-slide-up pb-3 pl-9 pr-3 pt-1 sm:pl-12">
      <ol className="space-y-2">
        {item.replies.map((reply) => (
          <li
            key={reply.id}
            className="group/reply hairline relative rounded-xl border border-dashed px-3 py-2"
          >
            <p className="whitespace-pre-wrap break-words text-[14px] leading-relaxed">
              {reply.text}
            </p>
            <div className="mt-1 flex items-center gap-1">
              <time
                className="muted text-[11px] tabular-nums"
                dateTime={new Date(reply.createdAt).toISOString()}
                title={fullStamp(reply.createdAt)}
              >
                {stamp(reply.createdAt)}
              </time>
              <div className="ml-auto flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/reply:opacity-100">
                <button
                  type="button"
                  onClick={() => onPromoteReply(reply.id)}
                  title="Turn this into a checklist item"
                  className="muted rounded-lg p-1.5 transition hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-300"
                >
                  <PromoteIcon className="h-[15px] w-[15px]" />
                  <span className="sr-only">Turn into a checklist item</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveReply(reply.id)}
                  title="Delete this message"
                  className="muted rounded-lg p-1.5 transition hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
                >
                  <TrashIcon className="h-[15px] w-[15px]" />
                  <span className="sr-only">Delete message</span>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-2 flex items-end gap-2">
        <textarea
          ref={boxRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={item.replies.length ? 'Keep going…' : 'Elaborate on this idea…'}
          aria-label="Add to this thread"
          className="autosize hairline min-h-[2.25rem] flex-1 rounded-xl border bg-transparent px-3 py-2 text-[14px] leading-relaxed placeholder:text-ink-400 focus:border-accent-400 focus:outline-none dark:placeholder:text-ink-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="Add to thread"
          className="mb-px flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-500 text-white transition enabled:hover:bg-accent-600 enabled:active:scale-95 disabled:opacity-25"
        >
          <ArrowUpIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
