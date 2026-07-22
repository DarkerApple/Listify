# 🗒️ Listify

A calm, private, **offline-first daily journal** — a PWA that runs entirely in
your browser. One note per day, a month is a *notestack*, a year is a *shelf*.
No account, no server, no network required. The only organizing principle is
time.

## Highlights

- **Capture loop** — opens on Today with the cursor ready; press **Return** to
  commit a timestamped entry; a leading `- ` makes a todo that cycles
  **want → have-to → done**; inline `#hashtags` become tappable chips.
- **Permanence** — days **seal** automatically at midnight (or manually with a
  wax-stamp). Sealed words are immutable; mood/tags/star stay editable unless you
  "freeze completely".
- **Notestacks & shelf** — browse a month as a physical pile of mood-tinted
  stickies (riffle to flip, tap to open), see a year as month piles whose
  thickness reflects activity, and a month-recap **mood ribbon**.
- **Find** — search across days and tags, filter by tag, and a **Highlights**
  reel of starred "monumental" days.
- **Privacy** — an optional app passcode, and an **encrypted vault** (AES-GCM via
  Web Crypto) for private days whose text is encrypted at rest.
- **Backup & keepsakes** — export an (optionally encrypted) JSON backup, import
  it back, and save any month as a paper-style **image**.
- **PWA** — installable, offline via a service worker, light + warm-dark themes.

## Tech

Vite · React · TypeScript · Tailwind · Zustand · Dexie (IndexedDB) · Web Crypto ·
Framer Motion · @use-gesture. All storage goes through a single `StorageAdapter`
seam, so a future sync layer needs no UI changes.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build to dist/
npm run preview
```

## Deploy to GitHub Pages

> **Why the site was a blank page:** GitHub Pages serves static files, so it was
> serving the raw Vite source (`index.html` → `/src/main.tsx`), which only works
> after a build. The workflow below builds the app and publishes `dist/`.

1. In the repo: **Settings → Pages → Build and deployment → Source = "GitHub
   Actions"**.
2. Make sure this code is on the **default branch** (merge the PR). The included
   workflow (`.github/workflows/deploy.yml`) runs on pushes to `main`/`master`
   (or run it manually from the Actions tab).
3. It builds with `BASE_PATH=/<repo-name>/` so asset paths and the PWA
   scope/`start_url` match the project-site URL, then deploys.

The app uses **hash routing** (`#/…`), so deep links resolve on a hard refresh
without a `404.html` shim. Pages serves over HTTPS automatically, which Web
Crypto and service workers require.

## Privacy

Everything is stored locally in IndexedDB (`listify` database). Private notes are
encrypted at rest; the vault key is derived from a password that is **never
stored** — if you lose it, those notes are unrecoverable. The app passcode is
stored only as a salted PBKDF2 hash. Clearing browser data erases the journal, so
**export a backup** and install the PWA.
