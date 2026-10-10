# Lockie Training Program (PWA)

Shows as "Baki Program" inside the app. A mobile-first, offline-capable web app for a 3-session full body + fighter HIIT plan,
with tempo cues, a HIIT menu with interval timers, a guided daily mobility session, and a Food tab (v4 daily tracker against the Sillz targets: meals, swaps, a gram log, and Ask AI). Plain HTML/CSS/JS with no build step, hosted on GitHub Pages.

- `data.js`: the plan (sessions, exercises, sets × reps, rest, swaps, tempo, cues), HIIT menu + weekly rotation, mobility sessions, nutrition targets, demo video IDs
- `food-plan.js`: v4 food library, meals, swaps, and Sillz targets. `food-ai.js`: the day log, suggestions, and Ask AI actions. `node test/food.test.js` checks them.
- `app.js`, `styles.css`, `index.html`: the app
- `sw.js`, `manifest.webmanifest`, `icons/`: offline + Add to Home Screen
- Demo videos: embedded YouTube (youtube-nocookie) demos from their original channels, loaded only when you tap play (needs internet)
- `img/`: offline still images from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, see `img/LICENSE-free-exercise-db.md`)

Training logs and food ticks stay in the phone's localStorage. Ask AI is optional: a Gemini key saved in Settings stays on the phone, and what you type or say about food is sent to Google. Nothing else is uploaded.
On iPhone: open in Safari → Share → Add to Home Screen, then always launch from the icon.
