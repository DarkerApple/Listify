import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { KeyRound, ShieldAlert, X } from 'lucide-react';
import { useSecurity } from '../store/useSecurity';

type Mode = 'setup' | 'unlock';

/** Modal for creating or unlocking the vault. Closed by the parent. */
export function VaultDialog({
  mode,
  onClose,
  onDone,
}: {
  mode: Mode | null;
  onClose: () => void;
  onDone?: () => void;
}) {
  const setupVault = useSecurity((s) => s.setupVault);
  const openVault = useSecurity((s) => s.openVault);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function reset() {
    setPw('');
    setConfirm('');
    setError('');
    setBusy(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !pw) return;
    setBusy(true);
    try {
      if (mode === 'setup') {
        if (pw.length < 4) throw new Error('Use at least 4 characters.');
        if (pw !== confirm) throw new Error('Passwords do not match.');
        await setupVault(pw);
      } else {
        const ok = await openVault(pw);
        if (!ok) throw new Error('Wrong vault password.');
      }
      reset();
      onDone?.();
      onClose();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.form
            onClick={(e) => e.stopPropagation()}
            onSubmit={submit}
            initial={{ scale: 0.95, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm rounded-3xl border border-rule bg-paper p-6 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-accent">
                <KeyRound size={20} />
                <h2 className="font-hand text-xl text-ink">
                  {mode === 'setup' ? 'Set up your vault' : 'Unlock the vault'}
                </h2>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="text-ink-faint hover:text-ink">
                <X size={18} />
              </button>
            </div>

            {mode === 'setup' && (
              <div className="mb-4 flex gap-2 rounded-xl bg-accent/10 p-3 text-xs text-ink-soft">
                <ShieldAlert size={28} className="shrink-0 text-accent" />
                <p>
                  This password encrypts your private notes. It is never stored. If you lose it,
                  those notes are <b>permanently unrecoverable</b>.
                </p>
              </div>
            )}

            <input
              autoFocus
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError('');
              }}
              placeholder={mode === 'setup' ? 'New vault password' : 'Vault password'}
              className="mb-2 w-full rounded-xl border border-rule bg-paper px-3 py-2.5 outline-none focus:border-accent/60"
            />
            {mode === 'setup' && (
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm password"
                className="mb-2 w-full rounded-xl border border-rule bg-paper px-3 py-2.5 outline-none focus:border-accent/60"
              />
            )}
            {error && <p className="mb-2 font-mono text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={busy || !pw}
              className="mt-2 w-full rounded-full bg-accent py-2.5 font-mono text-sm text-white transition-colors hover:brightness-95 disabled:opacity-50"
            >
              {busy ? 'Working…' : mode === 'setup' ? 'Create vault' : 'Unlock'}
            </button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
