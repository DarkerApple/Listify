import { useEffect, useRef, useState } from 'react';
import { animate, motion, useMotionValue } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { ChevronLeft, ChevronRight, Lock, LockOpen, Stamp } from 'lucide-react';
import type { Entry, ISODate } from '../storage/types';
import { useJournalStore } from '../store/useJournalStore';
import { useSecurity } from '../store/useSecurity';
import { MONTH_NAMES, addDaysISO, formatClock, formatLongDate, isToday, todayISO } from '../lib/date';
import { navigate } from '../router/route';
import { thunk } from '../lib/haptics';
import { EntryRow } from '../components/EntryRow';
import { Composer } from '../components/Composer';
import { SealStamp } from '../components/SealStamp';
import { MoodStar } from '../components/MoodStar';
import { TagEditor } from '../components/TagEditor';
import { VaultDialog } from '../components/VaultDialog';
import { Banners } from '../components/Banners';

function gapFor(prevTs: number | null, ts: number): number {
  if (prevTs === null) return 4;
  const minutes = (ts - prevTs) / 60_000;
  return Math.min(52, Math.max(10, 10 + minutes * 0.7));
}

function goToDate(target: ISODate) {
  navigate(target === todayISO() ? { name: 'today' } : { name: 'day', date: target });
}

export function DayScreen({ date }: { date: ISODate }) {
  const note = useJournalStore((s) => s.note);
  const loading = useJournalStore((s) => s.loading);
  const activeDate = useJournalStore((s) => s.date);
  const loadDate = useJournalStore((s) => s.loadDate);
  const commitEntry = useJournalStore((s) => s.commitEntry);
  const cycleTodo = useJournalStore((s) => s.cycleTodo);
  const removeEntry = useJournalStore((s) => s.removeEntry);
  const seal = useJournalStore((s) => s.seal);
  const togglePrivate = useJournalStore((s) => s.togglePrivate);

  const vaultKey = useSecurity((s) => s.vaultKey);
  const hasVault = useSecurity((s) => s.hasVault);
  const decryptText = useSecurity((s) => s.decrypt);

  const [sealing, setSealing] = useState(false);
  const [vaultMode, setVaultMode] = useState<'setup' | 'unlock' | null>(null);
  const [decrypted, setDecrypted] = useState<Entry[] | null>(null);
  const pendingToggle = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  useEffect(() => {
    if (activeDate !== date || !note) void loadDate(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const today = isToday(date);
  const sealed = !!note?.sealed;
  const isPrivate = !!note?.private;
  const privateLocked = isPrivate && !vaultKey;
  const editable = today && !sealed && !privateLocked;
  const canNext = date < todayISO();

  // Decrypt private entries for display only while the vault is open.
  useEffect(() => {
    let live = true;
    if (note?.private && vaultKey) {
      Promise.all(
        note.entries.map(async (e) => ({ ...e, text: await decryptText(e.text) })),
      ).then((d) => live && setDecrypted(d));
    } else {
      setDecrypted(null);
    }
    return () => {
      live = false;
    };
  }, [note, vaultKey, decryptText]);

  const entries = isPrivate ? (vaultKey ? decrypted ?? [] : []) : note?.entries ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [entries.length, date]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') goToDate(addDaysISO(date, -1));
      else if (e.key === 'ArrowRight' && canNext) goToDate(addDaysISO(date, 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [date, canNext]);

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], last }) => {
      if (last) {
        const passed = Math.abs(mx) > 90 || vx > 0.5;
        if (passed && mx > 0) goToDate(addDaysISO(date, -1));
        else if (passed && mx < 0 && canNext) goToDate(addDaysISO(date, 1));
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 35 });
      } else {
        x.set(mx * 0.4);
      }
    },
    { axis: 'x', filterTaps: true, pointer: { touch: true } },
  );

  function handleSeal() {
    thunk();
    setSealing(true);
    void seal(date);
  }

  // Toggle private, guiding through vault setup/unlock as needed.
  function handlePrivateToggle() {
    if (!hasVault) {
      pendingToggle.current = true;
      setVaultMode('setup');
    } else if (!vaultKey) {
      pendingToggle.current = true;
      setVaultMode('unlock');
    } else {
      void togglePrivate(date);
    }
  }

  function onVaultDone() {
    if (pendingToggle.current) {
      pendingToggle.current = false;
      void togglePrivate(date);
    }
  }

  return (
    <div className="relative h-full overflow-hidden">
      <div {...bind()} style={{ touchAction: 'pan-y' }} className="h-full">
        <motion.div style={{ x }} className="paper-grid mx-auto flex h-full w-full max-w-2xl flex-col">
          {/* Header */}
          <header className="shrink-0 px-3 pb-2 pt-[max(0.9rem,env(safe-area-inset-top))]">
            <div className="flex items-center justify-between gap-1">
              <button onClick={() => goToDate(addDaysISO(date, -1))} aria-label="Previous day" className="rounded-full p-2 text-ink-faint transition-colors hover:text-accent hover:bg-rule/30">
                <ChevronLeft size={22} />
              </button>
              <div className="min-w-0 flex-1 text-center">
                <h1 className="truncate font-hand text-[1.6rem] leading-tight text-ink">{formatLongDate(date)}</h1>
                <button
                  onClick={() => navigate({ name: 'month', year: parseInt(date), month: parseInt(date.slice(5, 7)) - 1 })}
                  className="mt-0.5 inline-flex items-center gap-1 font-mono text-[0.72rem] uppercase tracking-wide text-ink-faint transition-colors hover:text-accent"
                >
                  {isPrivate && <Lock size={11} className="text-accent" />}
                  {today ? 'Today' : sealed ? 'Sealed' : 'Past day'} · {MONTH_NAMES[parseInt(date.slice(5, 7)) - 1]}'s stack
                </button>
              </div>
              <button onClick={() => canNext && goToDate(addDaysISO(date, 1))} disabled={!canNext} aria-label="Next day" className="rounded-full p-2 text-ink-faint transition-colors hover:text-accent hover:bg-rule/30 disabled:opacity-25 disabled:hover:text-ink-faint">
                <ChevronRight size={22} />
              </button>
            </div>
            {note && !privateLocked && (
              <div className="mt-2 flex justify-center">
                <MoodStar note={note} />
              </div>
            )}
            {note && !privateLocked && (note.entries.length > 0 || note.tags.length > 0) && (
              <div className="flex justify-center">
                <TagEditor note={note} />
              </div>
            )}
          </header>

          {/* Entries / locked panel */}
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {today && !privateLocked && <Banners />}
            {privateLocked ? (
              <div className="mt-16 flex flex-col items-center gap-4 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent">
                  <Lock size={24} />
                </div>
                <p className="font-serif text-lg italic text-ink-faint">This day is private.</p>
                <button onClick={() => setVaultMode('unlock')} className="rounded-full bg-accent px-5 py-2 font-mono text-sm text-white hover:brightness-95">
                  Unlock to read
                </button>
              </div>
            ) : loading ? null : entries.length === 0 ? (
              <p className="mt-10 text-center font-serif text-lg italic text-ink-faint">
                {today ? 'Anything worth remembering today?' : 'Nothing was written this day.'}
              </p>
            ) : (
              <motion.div key={date} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {entries.map((entry, i) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    active={i === entries.length - 1}
                    editable={editable}
                    gapPx={gapFor(i === 0 ? null : entries[i - 1].createdAt, entry.createdAt)}
                    onCycle={() => cycleTodo(entry.id)}
                    onRemove={() => removeEntry(entry.id)}
                  />
                ))}
              </motion.div>
            )}
          </div>

          {/* Composer / seal footer */}
          <div className="shrink-0 px-4 pb-2 pt-2">
            {editable ? (
              <>
                <div className="mb-2 flex justify-between">
                  <button
                    onClick={handlePrivateToggle}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs text-ink-faint transition-colors hover:text-accent"
                  >
                    {isPrivate ? <LockOpen size={14} /> : <Lock size={14} />}
                    {isPrivate ? 'Make public' : 'Make private'}
                  </button>
                  {note && note.entries.length > 0 && (
                    <button
                      onClick={handleSeal}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs text-ink-faint transition-colors hover:text-accent"
                    >
                      <Stamp size={14} /> Seal the day
                    </button>
                  )}
                </div>
                <Composer key={date} onCommit={commitEntry} />
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 py-3 font-mono text-xs text-ink-faint">
                {privateLocked ? (
                  <>
                    <Lock size={14} className="text-accent/70" /> Locked
                  </>
                ) : (
                  <>
                    <Stamp size={14} className="text-accent/70" />
                    {sealed && note?.sealedAt ? `Sealed · ${formatClock(note.sealedAt)}` : 'This day is read-only.'}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <SealStamp show={sealing} onDone={() => setSealing(false)} />
      <VaultDialog mode={vaultMode} onClose={() => setVaultMode(null)} onDone={onVaultDone} />
    </div>
  );
}
