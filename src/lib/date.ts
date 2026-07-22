import type { ISODate, Timestamp } from '../storage/types';

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Local-time ISO date key, e.g. "2026-12-24". */
export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayISO(): ISODate {
  return toISODate(new Date());
}

export function parseISODate(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Inclusive [firstDay, lastDay] ISO bounds for a month. `month` is 0-indexed. */
export function monthRange(year: number, month: number): [ISODate, ISODate] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  return [toISODate(first), toISODate(last)];
}

/** Add days to an ISO date, returning a new ISO date (used by day nav). */
export function addDaysISO(iso: ISODate, days: number): ISODate {
  const d = parseISODate(iso);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** "9:07 AM" — quiet timestamp label for an entry's gutter. */
export function formatClock(ts: Timestamp): string {
  const d = new Date(ts);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${pad(d.getMinutes())} ${ampm}`;
}

/** A warm, human date header, e.g. "Thursday, December 24". */
export function formatLongDate(iso: ISODate): string {
  const d = parseISODate(iso);
  return d.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function isToday(iso: ISODate): boolean {
  return iso === todayISO();
}
