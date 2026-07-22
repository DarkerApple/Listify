import { tagHue } from '../lib/tags';

/** A small colored mono chip for a #hashtag. Color is derived, not stored. */
export function TagChip({ tag }: { tag: string }) {
  return (
    <span
      className="tag-chip rounded px-1.5 py-0.5 font-mono text-[0.72em] leading-none"
      style={{ ['--h' as string]: String(tagHue(tag)) }}
    >
      #{tag}
    </span>
  );
}
