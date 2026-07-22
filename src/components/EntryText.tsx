import { tokenizeText } from '../lib/tags';
import { TagChip } from './TagChip';

/**
 * Renders an entry's body, turning inline #hashtags into colored chips.
 * `interactiveTags` makes those chips tappable filters — enabled in the day
 * view, off inside cards (which are themselves buttons).
 */
export function EntryText({
  text,
  muted,
  interactiveTags,
}: {
  text: string;
  muted?: boolean;
  interactiveTags?: boolean;
}) {
  const tokens = tokenizeText(text);
  return (
    <span className={muted ? 'text-ink-soft line-through decoration-ink-faint/60' : ''}>
      {tokens.map((t, i) =>
        t.kind === 'tag' ? (
          <TagChip key={i} tag={t.value} interactive={interactiveTags} />
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {t.value}
          </span>
        ),
      )}
    </span>
  );
}
