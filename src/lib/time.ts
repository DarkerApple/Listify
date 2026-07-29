/**
 * Time helpers. Two jobs: bucket items into months, and render a short,
 * glanceable date/time next to every item.
 */

/** Sortable month bucket, e.g. "2026-07". */
export function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** "July 2026" — the month section heading. */
export function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

/** "Jul" / "Jul '25" — the compact label used by the month jump bar. */
export function monthLabelShort(key: string, now = Date.now()): string {
  const [year, month] = key.split('-').map(Number);
  const d = new Date(year, month - 1, 1);
  const short = d.toLocaleDateString(undefined, { month: 'short' });
  const currentYear = new Date(now).getFullYear();
  return year === currentYear ? short : `${short} '${String(year).slice(2)}`;
}

function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "2:14 PM" (locale-aware). */
export function timeLabel(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** "Today", "Yesterday", "Mon 27", or "Jul 29, 2025" for other years. */
export function dayLabel(ts: number, now = Date.now()): string {
  const days = Math.round((startOfDay(now) - startOfDay(ts)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  const d = new Date(ts);
  if (d.getFullYear() !== new Date(now).getFullYear()) {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  // Weekday first, then the date. Asking the formatter for both at once yields
  // "26 Sun" in some locales, which reads like a typo.
  const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
  return `${weekday} ${d.getDate()}`;
}

/** "Today · 2:14 PM" — the stamp shown on every item and reply. */
export function stamp(ts: number, now = Date.now()): string {
  return `${dayLabel(ts, now)} · ${timeLabel(ts)}`;
}

/** Full date for tooltips / screen readers. */
export function fullStamp(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
