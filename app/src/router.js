import { useSyncExternalStore } from 'react';
import { getSession } from './store.js';

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());
window.addEventListener('popstate', emit);

export function usePath() {
  return useSyncExternalStore((l) => (listeners.add(l), () => listeners.delete(l)), () => window.location.pathname);
}

/** Screen name for a path: /today and /demo/today both -> "today". */
export function screenOf(path) {
  const m = path.match(/^\/(?:demo\/)?([\w-]+)/);
  return m ? m[1] : '';
}

/** Navigate to a screen, staying inside /demo/* when the session started there. */
export function go(screen) {
  const to = getSession().demo ? `/demo/${screen}` : `/${screen}`;
  if (window.location.pathname !== to) window.history.pushState(null, '', to);
  window.scrollTo(0, 0);
  emit();
}
