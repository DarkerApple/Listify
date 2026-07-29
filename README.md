# Listify

Catch a thought, get a checklist.

Listify is a single-screen web app for the thoughts that arrive at the wrong moment. You type one
in, it becomes a checkbox. If it turns out to be an idea rather than a task, you open a thread on it
and keep thinking. Everything files itself by month, with a plain date and time on every line.

Everything is stored in your browser's `localStorage`. No account, no server, no sync.

## The four ideas

**Capture is one step.** The composer is focused the moment the page opens, sits at the top of the
screen, and files a thought with `Enter`. There is no "new note" button to press first and no type
to choose.

**Notes are already a checklist.** Every captured thought is a checkbox — that is the automatic part.
Paste a whole brain-dump and each line becomes its own item; leading bullets, numbers and `[ ]`
boxes are stripped, so a rough list copied from anywhere lands clean.

**Ideas get threads.** Any item opens into a thread where you can elaborate over time. When the
thinking produces an actual next step, one click promotes that message into its own checklist item,
tagged with the thought it came from.

**Months are the navigation.** Items group under sticky month headings with a done-count and progress
bar, and a jump bar scrolls to any month in one tap. Each line carries a short stamp —
`Today · 2:14 PM`, `Sun 26 · 9:03 AM` — with the full date on hover.

## Using it

| Action | How |
| --- | --- |
| Capture a thought | Type in the composer, press `Enter` |
| New line instead of filing | `Shift`+`Enter` |
| Capture several at once | Paste multiple lines — one item per line |
| Focus the composer | `N` (or `C`), or the ⊕ button once you've scrolled |
| Search notes *and* threads | `/` |
| Edit an item | Double-click its text |
| Open a thread | **Elaborate** on any item |
| Promote a thread message to a task | The ☑ button on that message |
| Close a thread | `Esc` |
| Undo a delete | **Undo** in the toast (8 seconds) |

Filter tabs switch between **To do**, **Done** and **All**. The ⋮ menu clears completed items and
exports or imports a JSON backup — worth doing occasionally, since clearing site data clears notes.

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
  App.tsx              screen layout, keyboard shortcuts, active-month tracking
  types.ts             Item + Reply
  hooks/useItems.ts    every mutation, persisted to localStorage on change
  hooks/useTheme.ts    light/dark, applied pre-paint in index.html
  lib/parse.ts         brain-dump -> checklist items
  lib/group.ts         month bucketing, filtering, search
  lib/time.ts          month keys and the short date/time stamps
  lib/storage.ts       load/save/export/import, with validation on read
  components/          Composer, ItemRow, Thread, MonthSection, MonthNav, Toolbar, ...
```

Stored data is validated field-by-field when read, so a corrupt or hand-edited `localStorage` entry
degrades to an empty list instead of a blank screen.
