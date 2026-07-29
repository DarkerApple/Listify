import { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { ArrowUpIcon } from './icons';
import { splitIntoItems } from '../lib/parse';

interface Props {
  onCapture: (text: string) => void;
}

/**
 * The front door. Focused on load, always at the top, Enter to file the thought.
 * Anything multi-line becomes multiple checklist items, and the hint below says
 * so before you commit.
 */
export const Composer = forwardRef<HTMLTextAreaElement, Props>(function Composer({ onCapture }, ref) {
  const [text, setText] = useState('');
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  // Grow to fit the text instead of scrolling inside a fixed box.
  useLayoutEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [text]);

  const pending = splitIntoItems(text).length;

  function submit() {
    if (!text.trim()) return;
    onCapture(text);
    setText('');
    innerRef.current?.focus();
  }

  return (
    <div className="surface hairline rounded-2xl border shadow-sm transition-shadow focus-within:shadow-md">
      <div className="flex items-end gap-2 p-2.5 sm:p-3">
        <textarea
          ref={(node) => {
            innerRef.current = node;
            if (typeof ref === 'function') ref(node);
            else if (ref) ref.current = node;
          }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
            if (e.key === 'Escape') e.currentTarget.blur();
          }}
          rows={1}
          autoFocus
          placeholder="What's on your mind?"
          aria-label="Capture a thought"
          className="autosize min-h-[2.5rem] flex-1 bg-transparent px-2 py-2 text-[15px] leading-relaxed placeholder:text-ink-400 focus:outline-none dark:placeholder:text-ink-500"
        />
        <button
          type="button"
          onClick={submit}
          disabled={pending === 0}
          aria-label={pending > 1 ? `Add ${pending} items` : 'Add item'}
          className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-500 text-white transition enabled:hover:bg-accent-600 enabled:active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowUpIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <p className="muted hairline border-t px-4 py-2 text-xs">
        {pending > 1 ? (
          <span className="text-accent-600 dark:text-accent-300">
            Adds {pending} checklist items — one per line.
          </span>
        ) : (
          <>
            <Key>Enter</Key> to add · <Key>Shift</Key>+<Key>Enter</Key> for a new line · every line
            becomes its own checkbox
          </>
        )}
      </p>
    </div>
  );
});

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="hairline surface rounded border px-1 py-px font-sans text-[11px] font-medium">
      {children}
    </kbd>
  );
}
