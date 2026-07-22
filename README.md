# 🗒️ Listify — daily notes

A tiny web app for keeping **one note a day**. Each **day is a note**, each
**month is a notepad**, and every note remembers **when you wrote it** — so the
app can plot the time of day you tend to write.

No accounts, no server, no build step. Open `index.html` and start writing.
Your notes are saved in the browser's local storage.

## The idea

| Concept | In the app |
|---|---|
| A **note** | One block of text you write for a day |
| A **day** | Holds a single note |
| A **month** | A notepad — a calendar grid of that month's days |
| **When you wrote** | The first time you type a note, the moment is stamped; the plot shows it |

## Features

- **Notepad view** — a month laid out as a ruled-paper calendar. Each day shows
  a snippet of its note and the time it was written.
- **One note per day** — click any day to open its page and write. Notes
  auto-save as you type (and on blur).
- **Month-to-month navigation** — prev / next buttons, a **Today** shortcut, and
  ← / → arrow keys. Each month is its own notepad.
- **"When you wrote" plot** — a scatter of writing time-of-day (y) against day of
  month (x) for the current notepad. Hover or focus a dot for the date, time and
  a snippet; click it to jump to that day.
- **At-a-glance stats** — days written this month, word count, and your typical
  writing time.
- **Light / dark theme** — follows your system by default, with a manual toggle.
- **Export / Import** — download all notes as JSON, or load them back (handy for
  backups or moving between browsers).

## Running it

It's a static site. Any of these work:

```bash
# 1. Just open the file
open index.html          # macOS  (xdg-open on Linux)

# 2. Or serve it (recommended so the browser treats it as a normal origin)
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Markup / structure |
| `styles.css` | Styling and light/dark theme tokens |
| `app.js` | All behaviour: storage, calendar, editor, the plot |

## Notes on data & privacy

Everything is stored client-side under the `listify.notes.v1` key in
`localStorage`. Nothing leaves your machine. Clearing your browser data clears
your notes — use **Export** first if you want a copy.

## How the plot reads

- **x-axis** — day of the month (1 → end of month).
- **y-axis** — time of day, midnight at the bottom to midnight at the top
  (12 AM · 6 AM · 12 PM · 6 PM · 12 AM).
- **each dot** — one note, placed at the day it belongs to and the time it was
  first written. A dot low on the chart means an early-morning note; high means
  late at night.
