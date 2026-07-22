import { AnimatePresence, motion } from 'framer-motion';

/**
 * The wax-seal stamp that plays when a day is sealed: a seal presses down,
 * settles with a spring, then fades. Purely visual — the parent flips `show`
 * and calls onDone when the animation completes.
 */
export function SealStamp({ show, onDone }: { show: boolean; onDone: () => void }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-50 grid place-items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 2.1, rotate: -22, opacity: 0 }}
            animate={{ scale: 1, rotate: -8, opacity: 1 }}
            exit={{ scale: 1, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 520, damping: 15, mass: 0.7 }}
            onAnimationComplete={() => setTimeout(onDone, 620)}
            className="grid h-28 w-28 place-items-center rounded-full text-center font-hand text-lg leading-tight text-white shadow-xl"
            style={{
              background: 'radial-gradient(circle at 35% 30%, hsl(12 55% 52%), hsl(8 60% 40%))',
              boxShadow: '0 10px 30px hsl(8 60% 25% / 0.5), inset 0 2px 6px hsl(20 60% 70% / 0.5)',
            }}
          >
            <span>
              sealed
              <br />
              <span className="text-2xl">✦</span>
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
