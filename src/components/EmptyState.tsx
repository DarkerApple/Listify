interface Props {
  kind: 'fresh' | 'filtered';
  onReset: () => void;
}

/** Two empty states: nothing captured yet, or nothing matching the current view. */
export function EmptyState({ kind, onReset }: Props) {
  if (kind === 'fresh') {
    return (
      <div className="hairline rounded-2xl border border-dashed px-6 py-12 text-center">
        <p className="text-[15px] font-medium">Nothing captured yet</p>
        <p className="muted mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed">
          Type a thought above and hit Enter — it becomes a checkbox straight away. Paste a whole
          brain-dump and every line becomes its own item.
        </p>
        <p className="muted mt-4 text-[12px]">
          Then hit <strong className="font-medium">Elaborate</strong> on any item to open a thread
          and think it through.
        </p>
      </div>
    );
  }

  return (
    <div className="hairline rounded-2xl border border-dashed px-6 py-12 text-center">
      <p className="text-[15px] font-medium">Nothing here</p>
      <p className="muted mt-1.5 text-[13px]">No items match this view.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-full bg-accent-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-600"
      >
        Show everything
      </button>
    </div>
  );
}
