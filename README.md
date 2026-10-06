# Lockie Training Program (PWA)

Shows as "Baki Program" inside the app. A mobile-first, offline-capable web app for a 3-session full body + fighter HIIT plan,
with tempo cues, a HIIT menu with interval timers, a guided daily mobility session, and a Food tab (daily meals with selectable swaps, snacks and drinks, plus a weekly shopping checklist). Plain HTML/CSS/JS with no build step, hosted on GitHub Pages.

- `data.js`: the plan (sessions, exercises, sets × reps, rest, swaps, tempo, cues), HIIT menu + weekly rotation, mobility sessions, nutrition targets, demo video IDs
- `app.js`, `styles.css`, `index.html`: the app
- `sw.js`, `manifest.webmanifest`, `icons/`: offline + Add to Home Screen
- Demo videos: embedded YouTube (youtube-nocookie) demos from their original channels, loaded only when you tap play (needs internet)
- `img/`: offline still images from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, see `img/LICENSE-free-exercise-db.md`)

Training logs are stored only in the phone's localStorage. Nothing is uploaded.
On iPhone: open in Safari → Share → Add to Home Screen, then always launch from the icon.
