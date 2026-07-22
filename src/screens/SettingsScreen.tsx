import { BackBar } from '../components/BackBar';
import { useSettings } from '../store/useSettings';

export function SettingsScreen() {
  const frozen = useSettings((s) => s.freezeSealedCompletely);
  const setFrozen = useSettings((s) => s.setFreezeSealedCompletely);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title="Settings" />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <section className="space-y-1">
          <h2 className="font-mono text-xs uppercase tracking-wide text-ink-faint">Permanence</h2>
          <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-rule p-4">
            <span>
              <span className="block font-serif text-[1.02rem] text-ink">
                Freeze sealed notes completely
              </span>
              <span className="mt-0.5 block text-sm text-ink-soft">
                By default, a sealed day's words are permanent but its tags, mood, and star can
                still change. Turn this on to freeze everything.
              </span>
            </span>
            <span
              role="switch"
              aria-checked={frozen}
              tabIndex={0}
              onClick={() => setFrozen(!frozen)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setFrozen(!frozen)}
              className={[
                'mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors',
                frozen ? 'bg-accent' : 'bg-rule',
              ].join(' ')}
            >
              <span
                className={[
                  'h-5 w-5 rounded-full bg-paper shadow transition-transform',
                  frozen ? 'translate-x-5' : 'translate-x-0',
                ].join(' ')}
              />
            </span>
          </label>
        </section>

        <p className="mt-8 text-center font-mono text-[0.7rem] text-ink-faint">
          App lock, the vault, and backups arrive in later stages.
        </p>
      </div>
    </div>
  );
}
