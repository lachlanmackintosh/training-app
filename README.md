# Lockie Training Program (PWA)

Shows as "Baki Program" inside the app. A mobile-first, offline-capable web app for a 3-session full body + fighter HIIT plan,
with tempo cues, a HIIT menu with interval timers, a guided daily mobility session, and a Food tab (v6: Breakfast/Lunch/Dinner options with detail sheets, snacks, supplements, macro rings, micro bars, Close the gaps, and a built-in Close the gaps suggester). Plain HTML/CSS/JS with no build step, hosted on GitHub Pages.

- `data.js`: the plan (sessions, exercises, sets × reps, rest, swaps, tempo, cues), HIIT menu + weekly rotation, mobility sessions, nutrition targets, demo video IDs
- `food-plan.js`: v6 food library, meal options (Lockie + partner portions), snacks, supplements, person targets (generated from the couple meal library; switch `person`/targets to clone for another person). `food-log.js`: the day log, meal selections, and the no-AI gap suggester (pantry foods only). `node test/food.test.js` checks them.
- `app.js`, `styles.css`, `index.html`: the app
- `sw.js`, `manifest.webmanifest`, `icons/`: offline + Add to Home Screen
- Demo videos: embedded YouTube (youtube-nocookie) demos from their original channels, loaded only when you tap play (needs internet)
- `img/`: offline still images from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain, see `img/LICENSE-free-exercise-db.md`)

On iPhone: open in Safari → Share → Add to Home Screen, then always launch from the icon.
