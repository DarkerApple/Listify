import type { Note } from '../storage/types';
import { moodRibbonColor } from '../lib/mood';

/**
 * The month recap: a thin ribbon of each day's mood color — a color band, never
 * a graph. Days without a note are a faint neutral.
 */
export function MoodRibbon({
  notes,
  daysInMonth,
  year,
  month,
}: {
  notes: Note[];
  daysInMonth: number;
  year: number;
  month: number;
}) {
  const byDay = new Map<number, Note>();
  for (const n of notes) byDay.set(new Date(`${n.date}T00:00:00`).getDate(), n);

  return (
    <div
      className="flex h-3 w-full overflow-hidden rounded-full ring-1 ring-black/5"
      role="img"
      aria-label="Mood across the month"
    >
      {Array.from({ length: daysInMonth }).map((_, i) => {
        const note = byDay.get(i + 1);
        const color = note ? moodRibbonColor(note.mood) : 'rgb(var(--rule))';
        return (
          <div
            key={`${year}-${month}-${i}`}
            className="h-full flex-1"
            style={{ background: color }}
            title={`${i + 1}`}
          />
        );
      })}
    </div>
  );
}
