import { useSyncExternalStore } from 'react';
import { parseHash, type Route } from './route';

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

/** Current route, re-rendering on every hash change. */
export function useRoute(): Route {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => '',
  );
  return parseHash(hash);
}
