import { useEffect } from 'react';
import { useJournalStore } from './store/useJournalStore';
import { Today } from './screens/Today';

export default function App() {
  const init = useJournalStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  return (
    <div className="h-full">
      <Today />
    </div>
  );
}
