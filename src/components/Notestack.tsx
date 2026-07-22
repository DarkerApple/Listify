import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Note } from '../storage/types';
import { StickyNote } from './StickyNote';
import { tick } from '../lib/haptics';

// Deterministic small rotation per note so the pile looks hand-stacked but
// stable across renders (no Math.random in render).
function jitter(seed: string, spread: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) % 1000;
  return ((h / 1000) * 2 - 1) * spread;
}

/**
 * A month as a physical pile of stickynotes, newest on top. Drag the top card
 * (or use the flip controls) to riffle through the days; tap it to open. The
 * number of layered edges behind reflects the month's activity.
 */
export function Notestack({ notes, onOpen }: { notes: Note[]; onOpen: (date: string) => void }) {
  // notes are ascending by date; newest (last) sits on top.
  const [index, setIndex] = useState(notes.length - 1);
  const dir = useRef(0); // -1 older, +1 newer, for enter/exit direction

  useEffect(() => {
    setIndex(notes.length - 1);
  }, [notes.length]);

  if (notes.length === 0) return null;

  const top = notes[index];
  const depth = Math.min(index, 5); // visible layered edges below the top card

  function flip(step: number) {
    const ni = index + step;
    if (ni < 0 || ni >= notes.length) return;
    dir.current = step;
    setIndex(ni);
    tick();
  }

  function onDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x > 80 || info.velocity.x > 500) flip(-1); // reveal older
    else if (info.offset.x < -80 || info.velocity.x < -500) flip(1); // reveal newer
  }

  const cardVariants = {
    enter: (d: number) => ({ x: d >= 0 ? 60 : -60, opacity: 0, scale: 0.96 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d >= 0 ? -80 : 80, opacity: 0, scale: 0.94 }),
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[360px] w-[min(86vw,330px)]">
        {/* Layered edges behind the top card = thickness */}
        {Array.from({ length: depth }).map((_, i) => {
          const back = index - i - 1;
          const n = notes[back];
          const off = (i + 1) * 4;
          return (
            <div
              key={n?.date ?? i}
              className="absolute inset-0 rounded-[14px] bg-paper shadow-[0_6px_16px_rgba(40,30,15,0.10)] ring-1 ring-black/5"
              style={{
                transform: `translateY(${off}px) rotate(${jitter(n?.date ?? String(i), 2.4)}deg) scale(${1 - (i + 1) * 0.012})`,
                zIndex: -i - 1,
              }}
            />
          );
        })}

        {/* Top card */}
        <AnimatePresence custom={dir.current} initial={false} mode="popLayout">
          <motion.div
            key={top.date}
            custom={dir.current}
            className="absolute inset-0"
            style={{ rotate: jitter(top.date, 2) }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={onDragEnd}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <StickyNote note={top} onClick={() => onOpen(top.date)} className="h-full w-full" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Flip controls (accessible / desktop equivalent of the riffle drag) */}
      <div className="mt-4 flex items-center gap-4">
        <button
          onClick={() => flip(-1)}
          disabled={index <= 0}
          aria-label="Older day"
          className="rounded-full p-2 text-ink-faint transition-colors hover:text-accent disabled:opacity-30"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-mono text-xs tabular-nums text-ink-soft">
          {index + 1} / {notes.length}
        </span>
        <button
          onClick={() => flip(1)}
          disabled={index >= notes.length - 1}
          aria-label="Newer day"
          className="rounded-full p-2 text-ink-faint transition-colors hover:text-accent disabled:opacity-30"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
