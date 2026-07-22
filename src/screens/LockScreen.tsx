import { useState } from 'react';
import { Lock } from 'lucide-react';
import { useSecurity } from '../store/useSecurity';

/** Full-screen gate shown when an app passcode is set and the app is locked. */
export function LockScreen() {
  const unlockApp = useSecurity((s) => s.unlockApp);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value || busy) return;
    setBusy(true);
    const ok = await unlockApp(value);
    setBusy(false);
    if (!ok) {
      setError(true);
      setValue('');
    }
  }

  return (
    <div className="paper-grid grid h-full place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-xs text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-accent/10 text-accent">
          <Lock size={24} />
        </div>
        <h1 className="font-hand text-2xl text-ink">Listify</h1>
        <p className="mb-6 mt-1 font-mono text-xs text-ink-faint">Enter your passcode</p>
        <input
          autoFocus
          type="password"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          className={[
            'w-full rounded-2xl border bg-paper px-4 py-3 text-center font-mono text-lg tracking-widest outline-none',
            error ? 'border-red-400' : 'border-rule focus:border-accent/60',
          ].join(' ')}
          placeholder="••••"
        />
        {error && <p className="mt-2 font-mono text-xs text-red-500">Incorrect passcode.</p>}
        <button
          type="submit"
          disabled={busy || !value}
          className="mt-5 w-full rounded-full bg-accent py-3 font-mono text-sm text-white transition-colors hover:brightness-95 disabled:opacity-50"
        >
          {busy ? 'Unlocking…' : 'Unlock'}
        </button>
      </form>
    </div>
  );
}
