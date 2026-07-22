import { BackBar } from '../components/BackBar';

/** Temporary stand-in for screens built in a later stage. */
export function Placeholder({ title, note }: { title: string; note: string }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col">
      <BackBar title={title} />
      <div className="grid flex-1 place-items-center px-6">
        <p className="text-center font-serif text-lg italic text-ink-faint">{note}</p>
      </div>
    </div>
  );
}
