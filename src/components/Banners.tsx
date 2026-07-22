import { useState } from 'react';
import { Download, Info, X } from 'lucide-react';
import { useSettings } from '../store/useSettings';
import { navigate } from '../router/route';

const NUDGE_THRESHOLD = 5;

/**
 * Gentle, dismissible notices on Today: a one-time note about local storage,
 * and a soft backup nudge after several days have sealed since the last export.
 * Never nagging — each dismisses for good (onboarding) or the session (nudge).
 */
export function Banners() {
  const onboarded = useSettings((s) => s.onboarded);
  const setOnboarded = useSettings((s) => s.setOnboarded);
  const sealedSinceBackup = useSettings((s) => s.sealedSinceBackup);
  const [nudgeDismissed, setNudgeDismissed] = useState(
    () => sessionStorage.getItem('listify.nudgeDismissed') === '1',
  );

  if (!onboarded) {
    return (
      <div className="mb-3 flex items-start gap-2 rounded-2xl border border-rule bg-accent/[0.06] p-3">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" />
        <p className="text-sm text-ink-soft">
          Listify keeps your journal privately on this device — no account, works offline. Install
          it to your home screen, and export a backup now and then, since clearing browser data
          would erase it.
        </p>
        <button onClick={setOnboarded} aria-label="Dismiss" className="shrink-0 text-ink-faint hover:text-ink">
          <X size={16} />
        </button>
      </div>
    );
  }

  if (sealedSinceBackup >= NUDGE_THRESHOLD && !nudgeDismissed) {
    return (
      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-rule bg-accent/[0.06] p-3">
        <Download size={16} className="shrink-0 text-accent" />
        <p className="flex-1 text-sm text-ink-soft">
          {sealedSinceBackup} days have sealed since your last backup.{' '}
          <button onClick={() => navigate({ name: 'settings' })} className="font-semibold text-accent underline-offset-2 hover:underline">
            Export a copy
          </button>
          .
        </p>
        <button
          onClick={() => {
            sessionStorage.setItem('listify.nudgeDismissed', '1');
            setNudgeDismissed(true);
          }}
          aria-label="Dismiss"
          className="shrink-0 text-ink-faint hover:text-ink"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
}
