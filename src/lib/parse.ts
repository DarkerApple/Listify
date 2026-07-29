/**
 * Turning a brain-dump into a checklist.
 *
 * One thought per line. Bullets, dashes, numbers and "[ ]" boxes are stripped so
 * pasting a rough list from anywhere produces clean, tickable items instead of
 * one blob with punctuation in it.
 */
const BULLET = /^\s*(?:[-*•+—–]|\d+[.)]|\(\d+\))\s+/;
const CHECKBOX = /^\s*\[[ xX]?\]\s*/;

export function cleanLine(line: string): string {
  let out = line.trim();
  // A line can carry both markers: "- [ ] buy milk".
  out = out.replace(BULLET, '');
  out = out.replace(CHECKBOX, '');
  return out.trim();
}

/** Split raw composer text into the items it should become (in typed order). */
export function splitIntoItems(raw: string): string[] {
  return raw
    .split('\n')
    .map(cleanLine)
    .filter((line) => line.length > 0);
}
