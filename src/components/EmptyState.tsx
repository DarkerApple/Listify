interface Props {
  kind: 'fresh' | 'filtered' | 'month' | 'search';
  onReset?: () => void;
}

const COPY: Record<Props['kind'], { title: string; body: string; action?: string }> = {
  fresh: {
    title: 'A blank page',
    body: 'Type a thought below and press Enter — it lands on this month’s page as a checkbox. Paste a whole brain-dump and every line becomes its own item.',
  },
  month: {
    title: 'Nothing this month',
    body: 'This page is empty. Anything you capture now files into the current month.',
  },
  filtered: {
    title: 'Nothing to show',
    body: 'No notes on this page match the current filter.',
    action: 'Show all notes',
  },
  search: {
    title: 'No matches',
    body: 'Nothing in any month matches that — item text and thread messages are both searched.',
  },
};

/** Empty pages still look like pages, so the layout never jumps. */
export function EmptyState({ kind, onReset }: Props) {
  const copy = COPY[kind];
  return (
    <div className="px-6 py-14 text-center sm:py-16">
      <p className="font-display text-[19px]">{copy.title}</p>
      <p className="muted mx-auto mt-2 max-w-sm text-[13px] leading-relaxed">{copy.body}</p>
      {copy.action && onReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-full bg-accent-600 px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accent-700 dark:bg-accent-500 dark:hover:bg-accent-400"
        >
          {copy.action}
        </button>
      )}
    </div>
  );
}
