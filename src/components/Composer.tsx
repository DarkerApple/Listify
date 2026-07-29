import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpIcon } from './icons';
import { splitIntoItems } from '../lib/parse';

interface Props {
  onCapture: (text: string) => void;
  /** True when the reader is on a past month — capture still lands in today's. */
  viewingPast: boolean;
}

/**
 * Docked to the bottom of the screen, where a thumb already is. Enter files the
 * thought; multi-line input becomes one checklist item per line.
 */
export const Composer = forwardRef<HTMLTextAreaElement, Props>(function Composer(
  { onCapture, viewingPast },
  ref,
) {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  // Grow with the text rather than scrolling inside a fixed box.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [text]);

  const pending = splitIntoItems(text).length;

  function submit() {
    if (!text.trim()) return;
    onCapture(text);
    setText('');
    innerRef.current?.focus();
  }

  const hint = pending > 1 ? `Adds ${pending} items — one per line` : null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md"
      style={{
        borderColor: 'rgb(var(--line))',
        backgroundColor: 'rgb(var(--paper) / 0.92)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="mx-auto max-w-2xl px-3 py-2.5 sm:px-4 sm:py-3">
        {(hint || (viewingPast && focused)) && (
          <p className="animate-fade-in mb-1.5 px-1 text-[11px] text-accent-700 dark:text-accent-300">
            {hint ?? 'New thoughts file into this month'}
          </p>
        )}
        <div className="surface hairline flex items-end gap-2 rounded-2xl border p-1.5 shadow-sm transition focus-within:border-accent-400 focus-within:shadow-lift">
          <textarea
            ref={(node) => {
              innerRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
              if (e.key === 'Escape') e.currentTarget.blur();
            }}
            rows={1}
            placeholder="What's on your mind?"
            aria-label="Capture a thought"
            className="min-h-[38px] flex-1 resize-none bg-transparent px-2.5 py-2 leading-snug placeholder:text-ink-400 focus:outline-none dark:placeholder:text-ink-500"
          />
          <button
            type="button"
            onClick={submit}
            disabled={pending === 0}
            aria-label={pending > 1 ? `Add ${pending} items` : 'Add item'}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-accent-600 text-white transition enabled:hover:bg-accent-700 enabled:active:scale-95 disabled:opacity-25 dark:bg-accent-500 dark:enabled:hover:bg-accent-400"
          >
            <ArrowUpIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </div>
  );
});
