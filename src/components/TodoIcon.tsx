import { CheckCircle2, Circle, Flag } from 'lucide-react';
import type { TodoState } from '../storage/types';

const LABEL: Record<Exclude<TodoState, null>, string> = {
  want: 'Want to — tap to mark as have-to',
  'have-to': 'Have to — tap to mark as done',
  done: 'Done — tap to reset to want-to',
};

/**
 * The state marker for a todo entry. Distinct icon per state; tapping cycles
 * want → have-to → done. Purely presentational — the parent wires onCycle.
 */
export function TodoIcon({
  state,
  onCycle,
  disabled,
}: {
  state: TodoState;
  onCycle: () => void;
  disabled?: boolean;
}) {
  const s = state ?? 'want';
  const Icon = s === 'done' ? CheckCircle2 : s === 'have-to' ? Flag : Circle;

  return (
    <button
      type="button"
      onClick={onCycle}
      disabled={disabled}
      aria-label={LABEL[s]}
      title={LABEL[s]}
      className={[
        'mt-[0.15em] shrink-0 rounded-full transition-colors disabled:cursor-default',
        s === 'done' ? 'text-accent' : s === 'have-to' ? 'text-accent/80' : 'text-ink-faint',
        disabled ? '' : 'hover:text-accent active:scale-90',
      ].join(' ')}
    >
      <Icon size={17} strokeWidth={s === 'want' ? 1.75 : 2} />
    </button>
  );
}
