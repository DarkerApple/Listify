import { tagHue } from '../lib/tags';
import { navigate } from '../router/route';

/**
 * A small colored mono chip for a #hashtag. When `interactive`, tapping filters
 * the app to that tag. Color is derived from the tag name, never stored.
 */
export function TagChip({ tag, interactive }: { tag: string; interactive?: boolean }) {
  const style = { ['--h' as string]: String(tagHue(tag)) };
  const base = 'tag-chip rounded px-1.5 py-0.5 font-mono text-[0.72em] leading-none';

  if (interactive) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          navigate({ name: 'tag', tag });
        }}
        className={`${base} align-baseline transition hover:brightness-95`}
        style={style}
      >
        #{tag}
      </button>
    );
  }
  return (
    <span className={base} style={style}>
      #{tag}
    </span>
  );
}
