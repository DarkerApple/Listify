import { useEffect, useReducer } from 'react';
import { useJournalStore } from './store/useJournalStore';
import { useSecurity } from './store/useSecurity';
import { useRoute } from './router/useRoute';
import { todayISO } from './lib/date';
import { DayScreen } from './screens/DayScreen';
import { MonthScreen } from './screens/MonthScreen';
import { YearScreen } from './screens/YearScreen';
import { SearchScreen } from './screens/SearchScreen';
import { HighlightsScreen } from './screens/HighlightsScreen';
import { TagScreen } from './screens/TagScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LockScreen } from './screens/LockScreen';

/** ms until the next local midnight. */
function untilMidnight(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
  return next.getTime() - now.getTime();
}

export default function App() {
  const init = useJournalStore((s) => s.init);
  const sweep = useJournalStore((s) => s.sweepAutoSeal);
  const loadDate = useJournalStore((s) => s.loadDate);
  const secInit = useSecurity((s) => s.init);
  const secReady = useSecurity((s) => s.ready);
  const appLocked = useSecurity((s) => s.appLocked);
  const lockVault = useSecurity((s) => s.lockVault);
  const route = useRoute();
  const [, forceTick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    void secInit();
    void init();
  }, [secInit, init]);

  // Wipe the in-memory vault key when the app is backgrounded (spec §6).
  useEffect(() => {
    function onHide() {
      if (document.visibilityState === 'hidden') lockVault();
    }
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', lockVault);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', lockVault);
    };
  }, [lockVault]);

  // At local midnight: seal yesterday, roll the "today" view over.
  useEffect(() => {
    let timer: number;
    const arm = () => {
      timer = window.setTimeout(async () => {
        await sweep();
        await loadDate(todayISO());
        forceTick();
        arm();
      }, untilMidnight());
    };
    arm();
    return () => window.clearTimeout(timer);
  }, [sweep, loadDate]);

  // Hold rendering until we know the lock state, then gate behind the passcode.
  if (!secReady) return <div className="paper-grid h-full" />;
  if (appLocked) return <LockScreen />;

  return (
    <div className="h-full">
      {(() => {
        switch (route.name) {
          case 'today':
            return <DayScreen date={todayISO()} />;
          case 'day':
            return <DayScreen date={route.date} />;
          case 'settings':
            return <SettingsScreen />;
          case 'month':
            return <MonthScreen year={route.year} month={route.month} />;
          case 'year':
            return <YearScreen year={route.year} />;
          case 'search':
            return <SearchScreen />;
          case 'highlights':
            return <HighlightsScreen />;
          case 'tag':
            return <TagScreen tag={route.tag} />;
        }
      })()}
    </div>
  );
}
