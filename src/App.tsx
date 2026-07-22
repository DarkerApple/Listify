import { useEffect, useReducer } from 'react';
import { useJournalStore } from './store/useJournalStore';
import { useRoute } from './router/useRoute';
import { todayISO } from './lib/date';
import { DayScreen } from './screens/DayScreen';
import { MonthScreen } from './screens/MonthScreen';
import { YearScreen } from './screens/YearScreen';
import { SearchScreen } from './screens/SearchScreen';
import { HighlightsScreen } from './screens/HighlightsScreen';
import { TagScreen } from './screens/TagScreen';
import { SettingsScreen } from './screens/SettingsScreen';

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
  const route = useRoute();
  const [, forceTick] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    void init();
  }, [init]);

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
