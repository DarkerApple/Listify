interface Props {
  text: string;
  onUndo: () => void;
  onDismiss: () => void;
}

/** Deleting is one click, so it always comes with a way back. */
export function UndoToast({ text, onUndo, onDismiss }: Props) {
  return (
    <div
      role="status"
      className="animate-slide-up pointer-events-auto surface hairline flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-full border py-2 pl-4 pr-2 shadow-lg"
    >
      <span className="truncate text-[13px]">
        Deleted <span className="muted">“{text}”</span>
      </span>
      <button
        type="button"
        onClick={onUndo}
        className="shrink-0 rounded-full bg-accent-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-accent-600"
      >
        Undo
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="muted shrink-0 pr-1 text-xs transition hover:text-ink-900 dark:hover:text-ink-100"
      >
        ✕
      </button>
    </div>
  );
}
