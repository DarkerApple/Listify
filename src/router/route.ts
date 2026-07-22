import type { ISODate } from '../storage/types';

// A tiny hash-based route model. Hash routing is deliberate: it resolves on a
// hard refresh from GitHub Pages with no server config or 404.html shim.

export type Route =
  | { name: 'today' }
  | { name: 'day'; date: ISODate }
  | { name: 'month'; year: number; month: number } // month is 0-indexed
  | { name: 'year'; year: number }
  | { name: 'search' }
  | { name: 'highlights' }
  | { name: 'settings' }
  | { name: 'tag'; tag: string };

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

export function toHash(route: Route): string {
  switch (route.name) {
    case 'today':
      return '#/';
    case 'day':
      return `#/d/${route.date}`;
    case 'month':
      return `#/m/${route.year}-${pad(route.month + 1)}`;
    case 'year':
      return `#/y/${route.year}`;
    case 'search':
      return '#/search';
    case 'highlights':
      return '#/highlights';
    case 'settings':
      return '#/settings';
    case 'tag':
      return `#/tag/${encodeURIComponent(route.tag)}`;
  }
}

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '');
  const [seg, ...rest] = path.split('/');

  switch (seg) {
    case 'd': {
      const date = rest[0];
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return { name: 'day', date };
      return { name: 'today' };
    }
    case 'm': {
      const m = rest[0]?.match(/^(\d{4})-(\d{2})$/);
      if (m) return { name: 'month', year: +m[1], month: +m[2] - 1 };
      return { name: 'today' };
    }
    case 'y': {
      const y = rest[0]?.match(/^(\d{4})$/);
      if (y) return { name: 'year', year: +y[1] };
      return { name: 'today' };
    }
    case 'search':
      return { name: 'search' };
    case 'highlights':
      return { name: 'highlights' };
    case 'settings':
      return { name: 'settings' };
    case 'tag': {
      const tag = rest[0] ? decodeURIComponent(rest[0]) : '';
      return tag ? { name: 'tag', tag } : { name: 'today' };
    }
    default:
      return { name: 'today' };
  }
}

export function navigate(route: Route): void {
  const next = toHash(route);
  if (window.location.hash !== next) window.location.hash = next;
}
