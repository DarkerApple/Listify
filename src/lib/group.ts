import type { Filter, Item } from '../types';
import { monthKey } from './time';

export interface MonthGroup {
  key: string;
  items: Item[];
  /** Counts for the whole month, before search/filter — so progress stays honest. */
  total: number;
  done: number;
}

function matches(item: Item, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  if (item.text.toLowerCase().includes(q)) return true;
  // Searching hits thread replies too — ideas often live in the elaboration.
  return item.replies.some((r) => r.text.toLowerCase().includes(q));
}

/**
 * Newest first, bucketed by the month the thought was captured in. Filtering and
 * search narrow the visible items; a month disappears only when nothing matches.
 */
export function groupByMonth(items: Item[], filter: Filter, query: string): MonthGroup[] {
  const buckets = new Map<string, MonthGroup>();

  for (const item of [...items].sort((a, b) => b.createdAt - a.createdAt)) {
    const key = monthKey(item.createdAt);
    let group = buckets.get(key);
    if (!group) {
      group = { key, items: [], total: 0, done: 0 };
      buckets.set(key, group);
    }
    group.total += 1;
    if (item.done) group.done += 1;

    const passesFilter = filter === 'all' || (filter === 'open' ? !item.done : item.done);
    if (passesFilter && matches(item, query)) group.items.push(item);
  }

  return [...buckets.values()]
    .filter((g) => g.items.length > 0)
    .sort((a, b) => b.key.localeCompare(a.key));
}

/** Every month that holds anything, newest first — drives the jump bar. */
export function allMonthKeys(items: Item[]): string[] {
  const keys = new Set(items.map((i) => monthKey(i.createdAt)));
  return [...keys].sort((a, b) => b.localeCompare(a));
}
