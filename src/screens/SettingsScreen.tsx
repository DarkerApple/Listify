import { useState } from 'react';
import { KeyRound, Lock, ShieldCheck } from 'lucide-react';
import { BackBar } from '../components/BackBar';
import { VaultDialog } from '../components/VaultDialog';
import { useSettings } from '../store/useSettings';
import { useSecurity } from '../store/useSecurity';

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <span
      role="switch"
      aria-checked={on}
      tabIndex={0}
      onClick={() => onChange(!on)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(!on)}
      className={`mt-1 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors ${on ? 'bg-accent' : 'bg-rule'}`}
    >
      <span className={`h-5 w-5 rounded-full bg-paper shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
    </span>
  );
}

function AppLockSetting() {
  const hasAppLock = useSecurity((s) => s.hasAppLock);
  const setAppPasscode = useSecurity((s) => s.setAppPasscode);
  const removeAppLock = useSecurity((s) => s.removeAppLock);
  const lockApp = useSecurity((s) => s.lockApp);
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [err, setErr] = useState('');

  async function save() {
    setErr('');
    if (hasAppLock) {
      const ok = await removeAppLock(pw);
      if (!ok) return setErr('Wrong passcode.');
    } else {
      if (pw.length < 4) return setErr('Use at least 4 characters.');
      if (pw !== confirm) return setErr('Passcodes do not match.');
      await setAppPasscode(pw);
    }
    setPw('');
    setConfirm('');
    setOpen(false);
  }

  return (
    <div className="rounded-2xl border border-rule p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Lock size={18} className="mt-0.5 text-accent" />
          <div>
            <div className="font-serif text-[1.02rem] text-ink">App passcode</div>
            <div className="text-sm text-ink-soft">
              {hasAppLock ? 'Required each time Listify opens.' : 'Lock the whole app behind a passcode.'}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {hasAppLock && (
            <button onClick={lockApp} className="rounded-full border border-rule px-3 py-1 font-mono text-xs text-ink-soft hover:border-accent/50">
              Lock now
            </button>
          )}
          <button onClick={() => setOpen((v) => !v)} className="rounded-full border border-rule px-3 py-1 font-mono text-xs text-ink-soft hover:border-accent/50">
            {hasAppLock ? 'Remove' : 'Set'}
          </button>
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-2 border-t border-rule pt-3">
          <input type="password" inputMode="numeric" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} placeholder={hasAppLock ? 'Current passcode' : 'New passcode'} className="w-full rounded-xl border border-rule bg-paper px-3 py-2 outline-none focus:border-accent/60" />
          {!hasAppLock && (
            <input type="password" inputMode="numeric" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm passcode" className="w-full rounded-xl border border-rule bg-paper px-3 py-2 outline-none focus:border-accent/60" />
          )}
          {err && <p className="font-mono text-xs text-red-500">{err}</p>}
          <button onClick={save} className="rounded-full bg-accent px-4 py-1.5 font-mono text-xs text-white hover:brightness-95">
            {hasAppLock ? 'Remove passcode' : 'Save passcode'}
          </button>
        </div>
      )}
    </div>
  );
}

function VaultSetting() {
  const hasVault = useSecurity((s) => s.hasVault);
  const vaultKey = useSecurity((s) => s.vaultKey);
  const lockVault = useSecurity((s) => s.lockVault);
  const [dialog, setDialog] = useState<'setup' | 'unlock' | null>(null);

  return (
    <div className="rounded-2xl border border-rule p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <KeyRound size={18} className="mt-0.5 text-accent" />
          <div>
            <div className="font-serif text-[1.02rem] text-ink">Private vault</div>
            <div className="text-sm text-ink-soft">
              {hasVault
                ? vaultKey
                  ? 'Unlocked. Mark any day private from its page.'
                  : 'Locked. Encrypts private notes at rest.'
                : 'A separate password encrypts notes you mark private.'}
            </div>
          </div>
        </div>
        <div className="shrink-0">
          {!hasVault ? (
            <button onClick={() => setDialog('setup')} className="rounded-full border border-rule px-3 py-1 font-mono text-xs text-ink-soft hover:border-accent/50">
              Set up
            </button>
          ) : vaultKey ? (
            <button onClick={lockVault} className="rounded-full border border-rule px-3 py-1 font-mono text-xs text-ink-soft hover:border-accent/50">
              Lock
            </button>
          ) : (
            <button onClick={() => setDialog('unlock')} className="rounded-full border border-rule px-3 py-1 font-mono text-xs text-ink-soft hover:border-accent/50">
              Unlock
            </button>
          )}
        </div>
      </div>
      <VaultDialog mode={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}

export function SettingsScreen() {
  const frozen = useSettings((s) => s.freezeSealedCompletely);
  const setFrozen = useSettings((s) => s.setFreezeSealedCompletely);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title="Settings" />
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-4">
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-ink-faint">
            <ShieldCheck size={13} /> Privacy &amp; security
          </h2>
          <AppLockSetting />
          <VaultSetting />
        </section>

        <section className="space-y-2">
          <h2 className="font-mono text-xs uppercase tracking-wide text-ink-faint">Permanence</h2>
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-rule p-4">
            <span>
              <span className="block font-serif text-[1.02rem] text-ink">Freeze sealed notes completely</span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                By default a sealed day's words are permanent but its tags, mood, and star can still
                change. Turn this on to freeze everything.
              </span>
            </span>
            <Toggle on={frozen} onChange={setFrozen} />
          </label>
        </section>
      </div>
    </div>
  );
}
