import type { Mood } from '../storage/types';

// A one-tap emotional palette. Each mood carries a restrained pastel hue used to
// tint that day's sticky note — so a month's notestack becomes a soft color
// gradient, never a chart (spec §9).

export interface MoodDef {
  key: string;
  label: string;
  face: string; // expressive glyph
  hue: number; // HSL hue for the sticky tint
}

export const MOODS: MoodDef[] = [
  { key: 'radiant', label: 'Radiant', face: '😄', hue: 40 },
  { key: 'good', label: 'Good', face: '🙂', hue: 135 },
  { key: 'calm', label: 'Calm', face: '😌', hue: 200 },
  { key: 'meh', label: 'Meh', face: '😐', hue: 52 },
  { key: 'low', label: 'Low', face: '😔', hue: 232 },
  { key: 'rough', label: 'Rough', face: '😣', hue: 4 },
];

/** Build the stored Mood object from a definition. Color is an HSL string. */
export function moodFromDef(def: MoodDef): Mood {
  return { color: `hsl(${def.hue} 62% 62%)`, label: def.label };
}

export function moodDefByLabel(label: string | undefined): MoodDef | undefined {
  return MOODS.find((m) => m.label === label);
}

/** The sticky-card tint for a note's mood, or a restrained neutral fallback. */
export function stickyTint(mood: Mood | null, alpha = 1): string {
  const def = moodDefByLabel(mood?.label ?? undefined);
  if (!def) return `hsl(45 30% 88% / ${alpha})`; // warm paper fallback
  return `hsl(${def.hue} 64% 90% / ${alpha})`;
}

/** A stronger version of the tint for the mood ribbon in the month recap. */
export function moodRibbonColor(mood: Mood | null): string {
  const def = moodDefByLabel(mood?.label ?? undefined);
  if (!def) return 'hsl(45 20% 82%)';
  return `hsl(${def.hue} 60% 72%)`;
}
