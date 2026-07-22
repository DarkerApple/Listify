import { tokenizeText } from '../lib/tags';
import { TagChip } from './TagChip';

/** Renders an entry's body, turning inline #hashtags into colored chips. */
export function EntryText({ text, muted }: { text: string; muted?: boolean }) {
  const tokens = tokenizeText(text);
  return (
    <span className={muted ? 'text-ink-soft line-through decoration-ink-faint/60' : ''}>
      {tokens.map((t, i) =>
        t.kind === 'tag' ? (
          <TagChip key={i} tag={t.value} />
        ) : (
          <span key={i} className="whitespace-pre-wrap">
            {t.value}
          </span>
        ),
      )}
    </span>
  );
}
