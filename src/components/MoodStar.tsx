import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Star } from 'lucide-react';
import type { Note } from '../storage/types';
import { MOODS, moodDefByLabel, moodFromDef } from '../lib/mood';
import { useJournalStore } from '../store/useJournalStore';
import { useSettings } from '../store/useSettings';

/**
 * The day's mood + "monumental" star. Mood tints the note's sticky color; the
 * star adds it to Highlights. Both are metadata, so they remain editable after
 * sealing unless "freeze completely" is on.
 */
export function MoodStar({ note }: { note: Note }) {
  const setMood = useJournalStore((s) => s.setMood);
  const toggleStar = useJournalStore((s) => s.toggleStar);
  const frozen = useSettings((s) => s.freezeSealedCompletely);
  const [open, setOpen] = useState(false);

  const editable = !note.sealed || !frozen;
  const current = moodDefByLabel(note.mood?.label ?? undefined);

  return (
    <div className="mt-2 flex items-center gap-2">
      {/* Mood */}
      <div className="relative">
        <button
          disabled={!editable}
          onClick={() => setOpen((v) => !v)}
          aria-label={current ? `Mood: ${current.label}` : 'Set a mood'}
          className={[
            'flex items-center gap-1.5 rounded-full border border-rule px-2.5 py-1 text-sm transition-colors',
            editable ? 'hover:border-accent/50' : 'cursor-default opacity-90',
          ].join(' ')}
          style={current ? { background: `hsl(${current.hue} 64% 90%)` } : undefined}
        >
          <span className="text-base leading-none">{current ? current.face : '🙂'}</span>
          <span className="font-mono text-xs text-ink-soft">
            {current ? current.label : 'Mood'}
          </span>
        </button>

        <AnimatePresence>
          {open && editable && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute left-0 top-full z-20 mt-1.5 flex gap-1 rounded-2xl border border-rule bg-paper p-1.5 shadow-lg"
            >
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  title={m.label}
                  aria-label={m.label}
                  onClick={() => {
                    setMood(note.date, current?.key === m.key ? null : moodFromDef(m));
                    setOpen(false);
                  }}
                  className={[
                    'grid h-9 w-9 place-items-center rounded-full text-lg transition-transform hover:scale-110',
                    current?.key === m.key ? 'ring-2 ring-accent' : '',
                  ].join(' ')}
                  style={{ background: `hsl(${m.hue} 64% 90%)` }}
                >
                  {m.face}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Star */}
      <button
        disabled={!editable}
        onClick={() => toggleStar(note.date)}
        aria-label={note.starred ? 'Remove from highlights' : 'Mark as monumental'}
        aria-pressed={note.starred}
        className={[
          'rounded-full p-1.5 transition-colors',
          note.starred ? 'text-accent' : 'text-ink-faint',
          editable ? 'hover:text-accent' : 'cursor-default',
        ].join(' ')}
      >
        <Star size={18} fill={note.starred ? 'currentColor' : 'none'} />
      </button>
    </div>
  );
}
