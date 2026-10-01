# Lockie's Baki Training (PWA)

A mobile-first, offline-capable web app for a 3-day full body + fighter HIIT plan.
Plain HTML/CSS/JS with no build step, hosted on GitHub Pages.

- `data.js`: the plan (days, exercises, sets × reps, rest, swaps, cues, HIIT intervals, nutrition targets)
- `app.js`, `styles.css`, `index.html`: the app
- `sw.js`, `manifest.webmanifest`, `icons/`: offline + Add to Home Screen
- `img/`: demo images from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, see `img/LICENSE-free-exercise-db.md`)

Training logs are stored only in the phone's localStorage. Nothing is uploaded.
On iPhone: open in Safari → Share → Add to Home Screen, then always launch from the icon.
