/** Stable unique id for entries. crypto.randomUUID is available in all PWA
 *  target browsers over HTTPS; the fallback keeps dev over plain http happy. */
export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
