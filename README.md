# Baki Training App (PWA)

A mobile-first, offline-capable web app for a 3-session full body + fighter HIIT plan
(Session 1, Session 2, Session 3 and HIIT). Plain HTML/CSS/JS with no build step, hosted on GitHub Pages.

- `data.js`: the plan (sessions, exercises, sets × reps, rest, swaps, cues, HIIT intervals, nutrition targets, demo video IDs)
- `app.js`, `styles.css`, `index.html`: the app
- `sw.js`, `manifest.webmanifest`, `icons/`: offline + Add to Home Screen
- Demo videos: embedded YouTube (youtube-nocookie) form demos from their original channels, loaded only when you tap play (needs internet)
- `img/`: offline still images from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, see `img/LICENSE-free-exercise-db.md`)

Training logs are stored only in the phone's localStorage. Nothing is uploaded.
On iPhone: open in Safari → Share → Add to Home Screen, then always launch from the icon.
