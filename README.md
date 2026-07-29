# Listify

Catch a thought, get a checklist.

Listify is a web app for the thoughts that arrive at the wrong moment. You type one in, it becomes a
checkbox. If it turns out to be an idea rather than a task, you open a thread on it and keep
thinking. Each month is a single page you keep adding to, and you move between months with tabs or a
swipe.

Everything is stored in your browser's `localStorage`. No account, no server, no sync.

## The four ideas

**You just write.** There's no composer, no send button, no "new note" to press first — the last
line of the page is a live caret. `Enter` breaks the line, so a thought can run as long as it wants;
`Enter` twice ends that thought and starts the next, the way a blank line separates them on paper.
Whatever you've written is saved when you look away, so nothing is ever lost mid-sentence.

**Notes are already a checklist.** Every thought you finish is a checkbox; that's the automatic part.
Paste a bulleted list and each line becomes its own item, with leading bullets, numbers and `[ ]`
boxes stripped, in the order you wrote them.

**Ideas get threads.** Tapping any line opens its thread, where you can elaborate over time. When
the thinking produces an actual next step, one tap promotes that message into its own checklist item,
labelled with the thought it came from.

**A month is one page.** Items aren't cards floating in a feed — they're ruled lines on a single
sheet, headed by the month, its note count and a completion percentage, and divided by day rules
(`TODAY · Wednesday 29`, `TUE 21`). Every line's time sits in a small grey margin column on the
right, sharing one edge all the way down the page, including the line you're currently writing.

## Navigating

Month tabs sit under the header, oldest on the left, each with a badge for how many items are still
open. The active tab always scrolls itself into view.

| Move | How |
| --- | --- |
| Change month | Tap a tab, swipe the page left/right, or `←` / `→` |
| Filter the page | **All** / **To do** / **Done** on the sheet |
| Search every month | The 🔍 button, or `/` |
| Jump to the writing line | `N` (or `C`), or tap the empty page below the last note |
| Finish a note | `Enter` twice, `Ctrl`/`⌘`+`Enter`, or just look away |
| Close a thread or search | `Esc` |

Writing always belongs to today, so older months are read-only pages with a `Write on July 2026's
page →` link at the bottom; `N` from anywhere takes you to the same place.

## Using a line

Tap the text to open its thread. Inside are **Edit note**, **Delete** and **Close** — no action
depends on hovering, which is what makes the same layout work on a phone. Pointer users also get a
hover delete on the row and double-click to edit.

Deleting is undoable for 8 seconds. The ⋮ menu clears completed items and exports or imports a JSON
backup — worth doing occasionally, since clearing site data clears notes.

## Mobile

Built for a phone first: 44px touch targets around every control, 16px inputs so iOS never zooms on
focus, horizontal swipe between months (ignored when the gesture is really a scroll), sticky day
headings, the writing line scrolled clear of a rising keyboard, and no horizontal page scroll at any
width.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # typecheck + production build into dist/
npm run preview  # serve the production build
```

## Deploying

Pushing to the default branch builds and publishes to GitHub Pages via
`.github/workflows/deploy.yml`. One-time setup: **Settings → Pages → Source = GitHub Actions**. The
workflow passes `BASE_PATH=/<repo>/` so assets resolve on a project site.

## How it's built

React 18 + TypeScript + Vite + Tailwind. No state library, no UI kit, no icon package — two runtime
dependencies in total.

```
src/
  App.tsx              layout, month switching, swipe, keyboard shortcuts
  types.ts             Item + Reply
  hooks/useItems.ts    every mutation, persisted to localStorage on change
  hooks/useTheme.ts    light/dark, applied pre-paint in index.html
  lib/parse.ts         what you wrote -> notes (blank line splits, lists split)
  lib/group.ts         month summaries, day sections, filtering, search
  lib/time.ts          month/day keys, day rules, short time stamps
  lib/storage.ts       load/save/export/import, with validation on read
  components/
    MonthTabs.tsx      the navigation
    MonthNote.tsx      the month sheet: title, progress, day rules
    NoteRow.tsx        one ruled line + its expanded panel
    InlineComposer.tsx the live last line of the page
    Thread.tsx         elaboration, and promoting a message to an item
    FilterTabs, SearchBar, EmptyState, UndoToast, Menu, icons
```

Surfaces are CSS variables (`--paper`, `--card`, `--line`, `--row`), so light and dark are one
definition rather than two sets of classes. Stored data is validated field-by-field when read, so a
corrupt or hand-edited `localStorage` entry degrades to an empty list instead of a blank screen.
