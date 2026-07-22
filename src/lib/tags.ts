// Inline #hashtags are the only tagging mechanism (spec §9). Parse them from
// text, and derive a stable, restrained pastel per tag so chips are consistent
// across the app without a tag manager.

const HASHTAG_RE = /#([\p{L}\p{N}_-]+)/gu;

/** All distinct, lower-cased tag names found in a string (without the '#'). */
export function parseTags(text: string): string[] {
  const found = new Set<string>();
  for (const m of text.matchAll(HASHTAG_RE)) {
    found.add(m[1].toLowerCase());
  }
  return [...found];
}

export interface TextToken {
  kind: 'text' | 'tag';
  value: string; // for a tag, the name WITHOUT '#'
}

/** Split text into plain runs and #hashtag runs for chip rendering. */
export function tokenizeText(text: string): TextToken[] {
  const tokens: TextToken[] = [];
  let last = 0;
  for (const m of text.matchAll(HASHTAG_RE)) {
    const start = m.index ?? 0;
    if (start > last) tokens.push({ kind: 'text', value: text.slice(last, start) });
    tokens.push({ kind: 'tag', value: m[1] });
    last = start + m[0].length;
  }
  if (last < text.length) tokens.push({ kind: 'text', value: text.slice(last) });
  return tokens;
}

/** Deterministic hue from a tag name → soft chip colors (light + dark aware). */
export function tagHue(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) % 360;
  return h;
}

/** The starter set surfaced in autocomplete before you've made your own. */
export const STARTER_TAGS = ['milestone', 'idea', 'grateful', 'work'];
