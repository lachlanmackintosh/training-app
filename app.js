/* Lockie's Baki Training — plain JS, no build step. Data in data.js. */
(() => {
'use strict';
const LS = { log: 'lockie.log.v1', draft: 'lockie.draft.v1', settings: 'lockie.settings.v1', timer: 'lockie.timer.v1' };
const DEFAULT_SETTINGS = { start: '2026-10-05', rampEveryBlock: true, deload: false, swaps: {} };
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

let settings = Object.assign({}, DEFAULT_SETTINGS, load(LS.settings, {}));
let log = load(LS.log, []);
let draft = load(LS.draft, {});
const ui = { short: false };

/* ---------- dates (local, never UTC) ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
function today() {
  const q = new URLSearchParams(location.search).get('today'); // test override, e.g. ?today=2026-10-05
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return parseYmd(q);
  const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 12);
}
const todayStr = () => ymd(today());
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Australian style, no commas: "Mon 5 Oct", with year: "Mon 5 Oct 2026" (or '26 when short)
const fmt = (s, opt = {}) => { const d = parseYmd(s); return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}${opt.year === 'numeric' ? ' ' + d.getFullYear() : opt.year === '2-digit' ? ' ' + String(d.getFullYear()).slice(2) : ''}`; };
const fmtLong = d => `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
const dayName = d => DAYS[d.getDay()];
const daysBetween = (a, b) => Math.round((b - a) / 86400000);

/* ---------- block / phase ---------- */
const PHASES = {
  pre: { name: 'Before the block', cls: 'ramp', short: 'Block not started yet. Ramp-in rules apply if you train.' },
  ramp: { name: 'Ramp-in', cls: 'ramp', short: '2 sets of everything. Stop each set 3 reps short of failure. Find your weights.' },
  normal: { name: 'Normal week', cls: 'normal', short: 'Main lifts 1–2 RIR, accessories 0–1 RIR. Add reps first, then weight.' },
  heavy: { name: 'Heavy week', cls: 'heavy', short: 'Main lifts (bold) 3 × 3–6, heavier than normal. Accessories stay the same.' },
  deload: { name: 'Deload week', cls: 'deload', short: 'Same exercises, half the sets, same weights or 10% lighter. HIIT = easy cycling.' }
};
function blockInfo(d = today()) {
  const days = daysBetween(parseYmd(settings.start), d);
  if (days < 0) return { pre: true, daysTo: -days, week: 0, block: 0, phase: settings.deload ? 'deload' : 'pre' };
  const wi = Math.floor(days / 7), block = Math.floor(wi / 5) + 1, week = (wi % 5) + 1;
  let phase = week <= 2 ? 'ramp' : week <= 4 ? 'normal' : 'heavy';
  if (phase === 'ramp' && block > 1 && !settings.rampEveryBlock) phase = 'normal';
  if (settings.deload) phase = 'deload';
  return { pre: false, week, block, totalWeek: wi + 1, phase };
}

/* ---------- exercise helpers ---------- */
const sessionFor = d => WEEK[d.getDay()];
const isSwapped = ex => !!settings.swaps[ex.id];
const partsOf = ex => isSwapped(ex) ? ex.swap.parts : ex.parts;
function target(ex, phase) {
  const sw = isSwapped(ex) ? ex.swap : {};
  let sets = sw.sets || ex.sets, min = sw.min || ex.min, max = sw.max || ex.max;
  const maxTime = ex.maxTime || sw.holdTime;
  if (phase === 'ramp' || phase === 'pre') sets = Math.min(sets, 2);
  if (phase === 'heavy' && ex.main) { sets = 3; min = 3; max = 6; }
  if (phase === 'deload') sets = Math.max(1, Math.ceil(sets / 2));
  const metric = MOV[partsOf(ex)[0]].metric || 'reps';
  let reps;
  if (ex.maxTime) reps = 'max time';
  else if (sw.holdTime) reps = 'hold';
  else if (metric === 'm') reps = `${max} m`;
  else reps = min === max ? `${min}` : `${min}–${max}`;
  if (ex.each && !maxTime) reps += ` ${ex.each}`;
  return { sets, min, max, reps, maxTime, text: `${sets} × ${reps}` };
}
function targetText(t) { // e.g. "3 sets × 8–10 reps", "3 sets × 30 m", "1 set × max time"
  const sets = `${t.sets} set${t.sets === 1 ? '' : 's'}`;
  if (t.maxTime || / m$/.test(t.reps)) return `${sets} × ${t.reps}`;
  const [n, ...rest] = t.reps.split(' ');
  return `${sets} × ${n} reps${rest.length ? ' ' + rest.join(' ') : ''}`;
}
function rowTarget(t) { return t.maxTime ? (t.reps === 'hold' ? 'hold' : 'max time') : t.reps; }
const restText = s => !s ? 'No rest' : s >= 60 ? (s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`) : `${s} s`;
const ytUrl = name => 'https://www.youtube.com/results?search_query=' + encodeURIComponent(name + ' form').replace(/%20/g, '+');
const metricOf = m => (MOV[m].metric || 'reps');
const unitLabel = m => ({ reps: 'reps', sec: 'sec', m: 'm' }[metricOf(m)]);
const kgText = (kg, m) => kg == null || kg === '' ? 'BW' : (MOV[m] && MOV[m].added ? `+${kg}` : `${kg}`);
const setText = (e) => `${kgText(e.kg, e.m)}${e.kg == null ? '' : ' kg'} × ${e.r ?? '–'}${metricOf(e.m) === 'reps' ? '' : ' ' + unitLabel(e.m)}`;

/* ---------- log ---------- */
const keyOf = (d, m, s) => `${d}|${m}|${s}`;
const saveLog = () => save(LS.log, log);
const findEntry = (d, m, s) => log.find(e => e.d === d && e.m === m && e.s === s);
function lastTime(m, before) {
  const prev = log.filter(e => e.m === m && e.d < before);
  if (!prev.length) return null;
  const d = prev.reduce((a, e) => e.d > a ? e.d : a, '');
  return { d, sets: prev.filter(e => e.d === d).sort((a, b) => a.s - b.s) };
}
function bestEver(m, before) { // heaviest set (then most reps); longest time for holds. Earlier sessions only.
  const prev = log.filter(e => e.m === m && e.d < before && e.r != null);
  if (!prev.length) return null;
  const timed = metricOf(m) === 'sec';
  return prev.reduce((best, e) => {
    const k = e.kg ?? -1, bk = best.kg ?? -1;
    if (timed) return (e.r > best.r || (e.r === best.r && k > bk)) ? e : best;
    return (k > bk || (k === bk && e.r > best.r)) ? e : best;
  });
}
const kgLabel = (kg, m) => kg == null || kg === '' ? 'BW' : `${MOV[m] && MOV[m].added ? '+' : ''}${kg} kg`;
const repLabel = (r, m) => `${r ?? '–'}${metricOf(m) === 'sec' ? ' s' : metricOf(m) === 'm' ? ' m' : ''}`;
// "60 kg × 10, 10, 9" when every set used the same weight, otherwise "60 kg × 10, 62.5 kg × 8"
function lastSummary(m, sets) {
  const same = sets.every(e => (e.kg ?? null) === (sets[0].kg ?? null));
  if (same) return `${kgLabel(sets[0].kg, m)} × ${sets.map(e => repLabel(e.r, m)).join(', ')}`;
  return sets.map(e => `${kgLabel(e.kg, m)} × ${repLabel(e.r, m)}`).join(', ');
}
function hintFor(m, ex, tgt, last) {
  const mv = MOV[m], timed = tgt.maxTime || metricOf(m) === 'sec';
  if (!last) return { cls: 'beat', html: timed ? 'First time: hold as long as you can with good form.' : ex.group === 'explosive' ? 'First time: every rep fast, stop if speed drops.' : 'First time: find a weight you can do with good form.' };
  if (timed) return { cls: 'beat', html: 'Beat your time' };
  if (mv.bw && ex.group === 'explosive') return { cls: 'beat', html: 'Every rep fast. Jump further or higher, stop if speed drops.' };
  const allTop = last.sets.length > 0 && last.sets.every(e => Number(e.r) >= tgt.max);
  if (allTop) return { cls: 'up', html: `Go up: try ${mv.lower ? '+2.5–5 kg' : '+1–2.5 kg'}` };
  return { cls: 'beat', html: 'Same weight, beat your reps' };
}

/* ---------- audio / vibration ---------- */
let actx = null;
function unlockAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const b = actx.createBuffer(1, 1, 22050), s = actx.createBufferSource(); s.buffer = b; s.connect(actx.destination); s.start(0);
  } catch (e) { /* no audio */ }
}
function beep(freq = 880, dur = 0.18, delay = 0, vol = 0.4) {
  if (!actx) return;
  try {
    const t = actx.currentTime + delay, o = actx.createOscillator(), g = actx.createGain();
    o.type = 'square'; o.frequency.value = freq; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
  } catch (e) {}
}
const buzz = p => { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
function alarm() { beep(988, .2, 0); beep(988, .2, .3); beep(1319, .45, .6); buzz([400, 150, 400, 150, 400]); }

/* ---------- toast ---------- */
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add('hidden'), 2200); }

/* ---------- rest timer ---------- */
let timer = load(LS.timer, null), timerIv = null, restWake = null;
async function restWakeLock(on) { // keep the screen awake during rest (iOS pauses JS when locked)
  try { if (on && !restWake && 'wakeLock' in navigator) { restWake = await navigator.wakeLock.request('screen'); restWake.addEventListener('release', () => { restWake = null; }); } else if (!on && restWake) { await restWake.release(); restWake = null; } } catch (e) {}
}
function startRest(secs, label) {
  if (!secs) return;
  timer = { end: Date.now() + secs * 1000, total: secs, label }; save(LS.timer, timer); runTimer(); restWakeLock(true);
}
function stopRest() { restWakeLock(false); timer = null; localStorage.removeItem(LS.timer); clearInterval(timerIv); timerIv = null; $('#timer').classList.add('hidden'); $('#timer').classList.remove('zero'); document.body.classList.remove('timer-on'); }
function runTimer() {
  clearInterval(timerIv); if (!timer) return;
  const el = $('#timer'); el.classList.remove('hidden', 'zero'); document.body.classList.add('timer-on');
  $('#timer-label').textContent = 'Rest · ' + timer.label; $('#timer-skip').textContent = 'Skip';
  const tick = () => {
    const left = Math.max(0, Math.ceil((timer.end - Date.now()) / 1000));
    $('#timer-time').textContent = `${Math.floor(left / 60)}:${pad(left % 60)}`;
    $('#timer-fill').style.width = `${Math.min(100, left / timer.total * 100)}%`;
    if (left <= 3 && left > 0 && timer.lastBeep !== left) { timer.lastBeep = left; beep(660, .08); }
    if (left === 0) {
      clearInterval(timerIv); timerIv = null; alarm();
      el.classList.add('zero'); $('#timer-label').textContent = 'Rest done. Go!'; $('#timer-skip').textContent = 'Close';
      localStorage.removeItem(LS.timer);
      setTimeout(() => { if (el.classList.contains('zero')) stopRest(); }, 6000);
    }
  };
  tick(); timerIv = setInterval(tick, 250);
}


/* ---------- views ---------- */
const view = () => $('#view');
function phaseChip(bi) { const p = PHASES[bi.phase]; return `<span class="chip ${p.cls}">${p.name}</span>`; }
function weekLine(bi) {
  if (bi.pre) return `Block 1 starts ${fmt(settings.start, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })} (in ${bi.daysTo} day${bi.daysTo === 1 ? '' : 's'})`;
  return `Block ${bi.block} · Week ${bi.week} of 5`;
}
function sessionTitle(k) { return k === 'H' ? 'HIIT' : k === 'R' ? 'Recovery' : PROGRAM[k].title; }
function sessionSub(k) { return k === 'H' ? 'Saturday · Fighter HIIT (20 min)' : k === 'R' ? '' : `${PROGRAM[k].day} · ${PROGRAM[k].focus}`; }
function nextSession(d) { for (let i = 1; i <= 7; i++) { const n = new Date(d); n.setDate(n.getDate() + i); const k = sessionFor(n); if (k !== 'R') return { k, d: n }; } }

function renderHome() {
  const d = today(), bi = blockInfo(d), k = sessionFor(d), ds = ymd(d);
  const loggedToday = log.filter(e => e.d === ds);
  let todayHtml;
  if (k === 'A' || k === 'B' || k === 'C') {
    const p = PROGRAM[k]; const total = p.exercises.reduce((a, ex) => a + target(ex, bi.phase).sets, 0);
    const done = p.exercises.reduce((a, ex) => a + countDoneSets(ex, ds, bi.phase), 0);
    todayHtml = `<div class="muted small">Today</div><h2 style="margin:4px 0 2px">${esc(p.title)}</h2><div class="subt">${esc(sessionSub(k))}</div>
      <div class="muted small">${p.exercises.length} exercises · about 60 min · ${done}/${total} sets done</div>
      <a class="btn" style="margin-top:14px" href="#/workout/${k}">${done ? 'Continue workout' : 'Start workout'}</a>`;
  } else if (k === 'H') {
    todayHtml = `<div class="muted small">Today</div><h2 style="margin:4px 0 2px">HIIT</h2><div class="subt">${esc(sessionSub('H'))}</div>
      <div class="muted small">${bi.phase === 'deload' ? 'Deload week: easy cycling instead.' : 'Bag work or bike/rower intervals. Legs cooked from Friday? Do bag work or easy cycling.'}</div>
      <a class="btn" style="margin-top:14px" href="#/hiit">Open HIIT timer</a>`;
  } else {
    const n = nextSession(d);
    todayHtml = `<div class="muted small">Today</div><h2 style="margin:4px 0 6px">Recovery</h2>
      <div class="muted small">${d.getDay() === 2 ? 'Walk, sun, surf.' : 'Walk, stretch, sleep 8 hours.'} Next up: <b>${esc(sessionTitle(n.k))}</b> (${esc(n.k === 'H' ? 'Fighter HIIT' : PROGRAM[n.k].focus)}) on ${dayName(n.d)}.</div>`;
  }
  const n = NUTRITION;
  view().innerHTML = `
  <div class="row between"><div><div class="muted small">${esc(fmtLong(d))}</div><h1>${esc(APP_NAME)}</h1><div class="muted small">G'day Lockie</div></div>
    <a class="iconbtn" href="#/settings" aria-label="Settings">⚙️</a></div>
  <div class="card"><div class="row between wrap"><b>${esc(weekLine(bi))}</b>${phaseChip(bi)}</div>
    <div class="muted small" style="margin-top:6px">${esc(PHASES[bi.phase].short)}</div></div>
  <div class="card hero">${todayHtml}</div>
  <div class="card"><div class="row between"><b>Nutrition: daily targets</b><span class="muted small">every day</span></div>
    <div class="grid4" style="margin-top:10px">
      <div class="stat"><b>${n.kcal}</b><span>kcal</span></div><div class="stat"><b>${n.protein}</b><span>g protein</span></div>
      <div class="stat"><b>~${n.carbs}</b><span>g carbs</span></div><div class="stat"><b>~${n.fat}</b><span>g fat</span></div></div>
    <div class="muted small" style="margin-top:10px">Sleep 8 hours. No phone during rest: breathe and drink water.</div></div>
  <div class="card"><div class="muted small" style="margin-bottom:8px">Missed a session? Don't double up. Do the next one.</div>
    <div class="grid2">
      <a class="btn ghost small" href="#/workout/A">Session 1</a><a class="btn ghost small" href="#/workout/B">Session 2</a>
      <a class="btn ghost small" href="#/workout/C">Session 3</a><a class="btn ghost small" href="#/hiit">HIIT</a></div></div>
  ${loggedToday.length ? `<div class="muted small" style="text-align:center">${loggedToday.length} set${loggedToday.length > 1 ? 's' : ''} logged today</div>` : ''}`;
}

function countDoneSets(ex, ds, phase) {
  const t = target(ex, phase), parts = partsOf(ex); let c = 0;
  for (let s = 0; s < t.sets; s++) if (parts.every(m => findEntry(ds, m, s))) c++;
  return c;
}

function renderProgram() {
  const bi = blockInfo();
  const dayCard = p => `<div class="card"><div class="row between"><div><h3>${esc(p.title)}</h3><div class="subt">${esc(p.day)} · ${esc(p.focus)}</div></div></div>
    ${p.exercises.map(ex => { const t = target(ex, bi.phase); return `<div class="ex-mini"><div class="row between"><div><b>${esc(ex.parts.join(' + '))}</b>${ex.main ? '<span class="badge">Main</span>' : ''}${ex.superset && ex.parts.length > 1 ? '<span class="badge ss">Superset</span>' : ''}</div></div>
      <div class="small"><span class="target">${esc(targetText(target(Object.assign({}, ex, { id: '_' }), bi.phase)))}</span> · <span class="muted">${ex.rest ? 'rest ' + restText(ex.rest) : 'no rest'}</span></div>
      <div class="sw">Swap: ${esc(ex.swap.label)}</div></div>`; }).join('')}
    <a class="btn" style="margin-top:12px" href="#/workout/${p.key}">Open ${esc(p.title)}</a></div>`;
  view().innerHTML = `<h1>Program</h1>
  <div class="row between wrap"><span class="muted small">${esc(weekLine(bi))}</span>${phaseChip(bi)}</div>
  <div class="card"><b>The week</b><ul class="list">${WEEK_TABLE.map(([d, s]) => `<li class="row between"><span>${d}</span><span class="muted">${esc(s)}</span></li>`).join('')}</ul>
   <div class="muted small">All three gym days are full body. The name just shows the focus.</div></div>
  <div class="card"><b>Every gym session (about 60 min)</b><ol class="bul small">
   <li>Warm-up: 5 min easy bike, then 2 light sets of your first main lift</li><li>Explosive: 2 moves, done fast and fresh</li>
   <li>Main lifts: 2 heavy exercises</li><li>Muscle work: accessories and supersets</li><li>Finisher: neck and grip</li></ol>
   <div class="muted small">Superset = do the two exercises back to back, then rest.</div></div>
  ${['A', 'B', 'C'].map(k => dayCard(PROGRAM[k])).join('')}
  <div class="card"><h3>HIIT</h3><div class="subt">Saturday · Fighter HIIT (20 min)</div><ul class="bul small">
   <li><b>Option 1: Bag work.</b> 5 rounds × 3 min hard, 1 min rest.</li>
   <li><b>Option 2: Bike or rower.</b> 5 min easy, then 8 rounds × 30 s all-out / 90 s easy, then 5 min easy.</li>
   <li>Legs cooked from Friday? Do bag work, or easy cycling instead.</li></ul>
   <a class="btn" href="#/hiit">Open HIIT timer</a></div>`;
}

const dur = n => `${Math.floor(n / 60)}:${pad(n % 60)}`;
// Still image shows instantly (and offline); the YouTube player only loads when tapped.
function demoHtml(m) {
  const mv = MOV[m], v = VIDEO[m];
  const still = mv.img ? `<img src="img/${mv.img}/0.jpg" alt="${esc(m)} still" loading="lazy">` : '<div class="nolink">No still image</div>';
  if (!v) return `<div class="part"><div class="demo">${still}</div><div class="demo-cap"><span>No verified video.</span><a class="yt" href="${ytUrl(m)}" target="_blank" rel="noopener">Search YouTube</a></div><p class="cue">${esc(mv.cue)}</p></div>`;
  return `<div class="part" data-m="${esc(m)}">
    <div class="demo vid" data-vid="${v.id}">${still}
      <button class="play" data-act="play" aria-label="Play demo video: ${esc(m)}"><span class="pbtn">▶</span><span class="ptxt">Play demo${v.secs ? ' · ' + dur(v.secs) : ''}</span></button></div>
    <div class="demo-cap"><span>${v.note ? `<span class="closest">Closest:</span> ${esc(v.note)}. ` : ''}${esc(v.title)} · <b>${esc(v.ch)}</b></span><a class="yt" href="https://www.youtube.com/watch?v=${v.id}" target="_blank" rel="noopener">YouTube ↗</a></div>
    <p class="cue">${esc(mv.cue)}</p></div>`;
}
function playVideo(btn) {
  const demo = btn.closest('.demo'), part = btn.closest('.part'), m = part.dataset.m, v = VIDEO[m];
  if (!navigator.onLine) { toast('Videos need internet. Showing the still image.'); return; }
  const src = `https://www.youtube-nocookie.com/embed/${v.id}?playsinline=1&autoplay=1&rel=0&modestbranding=1`;
  demo.classList.add('playing'); part.classList.add('playing');
  demo.innerHTML = `<iframe src="${src}" title="${esc(m)}: ${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
    <button class="closevid" data-act="closevid" aria-label="Close video">✕</button>`;
}
function closeVideo(btn) {
  const part = btn.closest('.part'), tmp = document.createElement('div');
  tmp.innerHTML = demoHtml(part.dataset.m); part.replaceWith(tmp.firstElementChild);
}

function exerciseCard(ex, ds, phase, idx) {
  const t = target(ex, phase), parts = partsOf(ex), sw = isSwapped(ex), two = parts.length > 1;
  const lasts = parts.map(m => ({ m, last: lastTime(m, ds), best: bestEver(m, ds) }));
  const lastHtml = lasts.map(({ m, last, best }) => {
    const h = hintFor(m, ex, t, last);
    return `<div class="lb">${two ? `<div class="lbname">${esc(m)}</div>` : ''}
      <div class="lbline"><span class="lbk">Last time</span> ${last ? `<b>${esc(lastSummary(m, last.sets))}</b> <span class="muted">(${esc(fmt(last.d))})</span>` : '<span class="muted">No log yet</span>'}</div>
      <div class="lbline"><span class="lbk">Best</span> ${best ? `<b>${esc(kgLabel(best.kg, m))} × ${esc(repLabel(best.r, m))}</b> <span class="muted">(${esc(fmt(best.d))})</span>` : '<span class="muted">–</span>'}</div>
      <div class="hint ${h.cls}">${h.html}</div></div>`;
  }).join('');
  let rows = '';
  for (let s = 0; s < t.sets; s++) {
    const done = parts.every(m => findEntry(ds, m, s));
    rows += `<div class="setrow${done ? ' done' : ''}" data-ex="${ex.id}" data-set="${s}"><div class="setno">Set ${s + 1}<small>${esc(rowTarget(t))}</small></div><div class="setin">`;
    for (const m of parts) {
      const e = findEntry(ds, m, s), dr = draft[keyOf(ds, m, s)] || {}, lt = lasts.find(x => x.m === m).last;
      const ls = lt && (lt.sets.find(x => x.s === s) || lt.sets[lt.sets.length - 1]);
      const kgV = e ? (e.kg ?? '') : (dr.kg ?? ''), rV = e ? (e.r ?? '') : (dr.r ?? '');
      const kgPh = ls && ls.kg != null ? ls.kg : (MOV[m].bw || MOV[m].added ? 'BW' : '–');
      const rPh = ls && ls.r != null ? ls.r : (t.maxTime || metricOf(m) === 'sec' ? 'sec' : (metricOf(m) === 'm' ? t.max : t.min));
      rows += `<div class="pline">${two ? `<div class="plabel">${esc(m)}</div>` : ''}
        <label class="fld"><input type="number" inputmode="decimal" step="any" min="0" data-m="${esc(m)}" data-f="kg" value="${esc(kgV)}" placeholder="${esc(kgPh)}" aria-label="${esc(m)} set ${s + 1} weight"><span>${MOV[m].added ? '+kg' : 'kg'}</span></label>
        <label class="fld"><input type="number" inputmode="numeric" step="1" min="0" data-m="${esc(m)}" data-f="r" value="${esc(rV)}" placeholder="${esc(rPh)}" aria-label="${esc(m)} set ${s + 1} ${unitLabel(m)}"><span>${t.maxTime ? 'sec' : unitLabel(m)}</span></label></div>`;
    }
    rows += `</div><button class="tick" data-act="tick" aria-label="Mark set ${s + 1} done">✓</button></div>`;
  }
  const doneAll = countDoneSets(ex, ds, phase) === t.sets;
  return `<section class="ex${doneAll ? ' complete' : ''}" id="ex-${ex.id}">
    <h3>${esc(parts.join(' + '))}${ex.main ? '<span class="badge">Main</span>' : ''}${two ? '<span class="badge ss">Superset</span>' : ''}</h3>
    <div class="target big">${esc(targetText(t))}</div>
    <div class="muted small">${ex.rest ? 'Rest ' + restText(ex.rest) + (two ? ' after both' : '') : 'No rest'}</div>
    <div class="last">${lastHtml}</div>
    <div class="sets">${rows}</div>
    <button class="swap${sw ? ' on' : ''}" data-act="swap" data-ex="${ex.id}">⇄ ${sw ? `Swapped. Tap for original: ${esc(ex.parts.join(' + '))}` : `Swap: ${esc(ex.swap.label)}`}</button>
    <div class="parts${two ? ' two' : ''}">${parts.map(demoHtml).join('')}</div>
    ${parts.map(m => `<a class="hist-link" href="#/history/${encodeURIComponent(m)}">History: ${esc(m)}</a>`).join('')}
  </section>`;
}

function renderWorkout(k) {
  const p = PROGRAM[k]; if (!p) return go('#/home');
  const d = today(), ds = ymd(d), bi = blockInfo(d), ph = PHASES[bi.phase];
  let html = `<div class="topbar"><a class="back" href="#/home" aria-label="Back">‹</a><div style="flex:1"><div class="muted small">${esc(weekLine(bi))}</div><h1 style="font-size:22px;margin:0">${esc(p.title)}</h1><div class="subt">${esc(p.day)} · ${esc(p.focus)}</div></div>${phaseChip(bi)}</div>
    <div class="note ${ph.cls}"><b>${ph.name}:</b> ${esc(ph.short)}</div>
    <div class="note"><b>Warm-up:</b> 5 min easy bike, then 2 light sets of your first main lift.</div>
    <label class="toggle card" style="padding:10px 16px"><span><b>Short on time?</b><br><span class="muted small">Explosive moves and the 2 main lifts only</span></span><input type="checkbox" data-act="short" ${ui.short ? 'checked' : ''}></label>`;
  let lastGroup = '';
  p.exercises.forEach((ex, i) => {
    if (ui.short && !(ex.group === 'explosive' || ex.group === 'main')) return;
    if (ex.group !== lastGroup) { html += `<div class="group-h">${GROUP_LABEL[ex.group]}</div>`; lastGroup = ex.group; }
    html += exerciseCard(ex, ds, bi.phase, i);
  });
  html += `<a class="btn" style="margin-top:16px" href="#/home" data-act="finish">Finish session</a>
    <p class="muted small" style="text-align:center">Every set you tick is saved on this phone straight away.</p>`;
  view().innerHTML = html;
  view().dataset.day = k;
}

function renderHIIT() {
  const bi = blockInfo(), opt = hiit.opt, o = HIIT[opt];
  const total = o.phases.reduce((a, p) => a + p.secs, 0);
  view().innerHTML = `<h1>HIIT</h1><div class="subt" style="margin-bottom:6px">Saturday · Fighter HIIT (20 min)</div>
    ${bi.phase === 'deload' ? '<div class="note deload"><b>Deload week:</b> HIIT becomes easy cycling.</div>' : ''}
    <div class="seg"><button data-act="hiit-opt" data-v="bag" class="${opt === 'bag' ? 'on' : ''}">🥊 Bag work</button><button data-act="hiit-opt" data-v="bike" class="${opt === 'bike' ? 'on' : ''}">🚴 Bike / rower</button></div>
    <div class="muted small">${esc(o.name)}: ${esc(o.desc)} · ${Math.round(total / 60)} min total</div>
    <div class="hiit-clock" id="hiit-clock"><div class="hiit-phase" id="hiit-phase">Ready</div><div class="hiit-time" id="hiit-time">0:00</div><div class="hiit-sub" id="hiit-sub"></div></div>
    <div class="grid2"><button class="btn" data-act="hiit-start" id="hiit-start">Start</button><button class="btn ghost" data-act="hiit-reset">Reset</button></div>
    <button class="btn ghost" style="margin-top:10px" data-act="hiit-skip">Skip to next interval</button>
    <div class="card"><b>Plan</b><ul class="bul small">${o.phases.map((p, i) => `<li id="hp-${i}">${esc(p.label)}${p.round ? ` ${p.round}/${p.of}` : ''}: ${p.secs >= 60 ? p.secs / 60 + ' min' : p.secs + ' s'}</li>`).join('')}</ul>
    <div class="muted small">Legs cooked from Friday? Do bag work, or easy cycling instead.</div></div>`;
  hiitPaint();
}

/* HIIT engine */
const hiit = { opt: 'bag', idx: 0, end: 0, left: null, running: false, iv: null, lastBeep: null, done: false, wake: null };
function hiitPhases() { return HIIT[hiit.opt].phases; }
function hiitLeft() { if (hiit.running) return Math.max(0, (hiit.end - Date.now()) / 1000); return hiit.left == null ? hiitPhases()[hiit.idx].secs : hiit.left; }
async function wakeLock(on) {
  try { if (on && 'wakeLock' in navigator) hiit.wake = await navigator.wakeLock.request('screen'); else if (!on && hiit.wake) { await hiit.wake.release(); hiit.wake = null; } } catch (e) {}
}
function hiitStartPause() {
  unlockAudio();
  if (hiit.done) hiitReset();
  if (hiit.running) { hiit.left = hiitLeft(); hiit.running = false; clearInterval(hiit.iv); wakeLock(false); }
  else { hiit.end = Date.now() + hiitLeft() * 1000; hiit.left = null; hiit.running = true; if (hiit.idx === 0 && hiitLeft() >= hiitPhases()[0].secs - 1) beep(1319, .3); hiit.iv = setInterval(hiitTick, 200); wakeLock(true); }
  hiitPaint();
}
function hiitNext() {
  const ph = hiitPhases();
  if (hiit.idx >= ph.length - 1) { hiit.running = false; hiit.done = true; clearInterval(hiit.iv); hiit.left = 0; alarm(); wakeLock(false); hiitPaint(); return; }
  hiit.idx++; const secs = ph[hiit.idx].secs;
  if (hiit.running) hiit.end = Date.now() + secs * 1000; else hiit.left = secs;
  const k = ph[hiit.idx].kind; if (k === 'hard') { beep(1319, .25); beep(1319, .25, .3); buzz([300, 100, 300]); } else { beep(660, .4); buzz(400); }
  hiitPaint();
}
function hiitTick() {
  const left = hiitLeft(), s = Math.ceil(left);
  if (s <= 3 && s > 0 && hiit.lastBeep !== `${hiit.idx}-${s}`) { hiit.lastBeep = `${hiit.idx}-${s}`; beep(880, .08); }
  if (left <= 0) hiitNext(); else hiitPaint();
}
function hiitReset() { clearInterval(hiit.iv); hiit.idx = 0; hiit.left = null; hiit.running = false; hiit.done = false; wakeLock(false); hiitPaint(); }
function hiitPaint() {
  const el = $('#hiit-clock'); if (!el) return;
  const ph = hiitPhases(), p = ph[hiit.idx], s = Math.ceil(hiitLeft());
  const remain = s + ph.slice(hiit.idx + 1).reduce((a, x) => a + x.secs, 0);
  el.className = 'hiit-clock ' + (hiit.done ? 'rest' : (hiit.running || hiit.left != null ? p.kind : ''));
  $('#hiit-phase').textContent = hiit.done ? 'Done. Good work!' : `${p.label}${p.round ? ` · Round ${p.round}/${p.of}` : ''}`;
  $('#hiit-time').textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
  const nx = ph[hiit.idx + 1];
  $('#hiit-sub').textContent = hiit.done ? '' : `Next: ${nx ? nx.label : 'finish'} · ${Math.floor(remain / 60)}:${pad(remain % 60)} left in session`;
  $('#hiit-start').textContent = hiit.running ? 'Pause' : (hiit.left != null && !hiit.done ? 'Resume' : 'Start');
  ph.forEach((_, i) => { const li = $('#hp-' + i); if (li) li.style.color = i === hiit.idx && !hiit.done ? 'var(--accent)' : i < hiit.idx || hiit.done ? 'var(--muted)' : ''; });
}

function renderHistory(m) {
  if (m) {
    const entries = log.filter(e => e.m === m);
    const days = [...new Set(entries.map(e => e.d))].sort().reverse();
    view().innerHTML = `<div class="topbar"><a class="back" href="#/history" aria-label="Back">‹</a><h1 style="font-size:22px;margin:0">${esc(m)}</h1></div>
      <div class="card">${days.length ? `<table class="hist"><tbody>${days.map(d => `<tr><td>${esc(fmt(d, { year: 'numeric' }))}</td><td>${entries.filter(e => e.d === d).sort((a, b) => a.s - b.s).map(e => esc(setText(e))).join('<br>')}</td></tr>`).join('')}</tbody></table>` : '<div class="muted">No sets logged yet.</div>'}</div>`;
    return;
  }
  const byM = {};
  for (const e of log) { if (!byM[e.m] || e.d > byM[e.m]) byM[e.m] = e.d; }
  const ms = Object.keys(byM).sort((a, b) => byM[b].localeCompare(byM[a]) || a.localeCompare(b));
  view().innerHTML = `<h1>History</h1>
    <div class="muted small">${log.length} sets logged · ${new Set(log.map(e => e.d)).size} sessions</div>
    <div class="card">${ms.length ? `<ul class="list">${ms.map(x => `<li><a class="item" href="#/history/${encodeURIComponent(x)}"><span>${esc(x)}</span><span class="muted small">${esc(fmt(byM[x]))} ›</span></a></li>`).join('')}</ul>` : '<div class="muted">Nothing logged yet. Tick a set in a workout and it shows up here.</div>'}</div>
    <div class="card"><b>Backup</b><div class="muted small" style="margin:4px 0 10px">Your log lives on this phone only. Export it now and then.</div>
      <div class="grid2"><button class="btn ghost" data-act="export">Export JSON</button><button class="btn ghost" data-act="import">Import JSON</button></div></div>`;
}

function renderRules() {
  view().innerHTML = `<h1>The Rules</h1>
  <div class="card"><h3>Effort</h3><ul class="bul">
    <li><b>RIR</b> (reps in reserve) = how many more good reps you could have done.</li>
    <li>Main lifts: stop at 1–2 RIR. Accessories: 0–1 RIR.</li>
    <li>Explosive moves: every rep fast. Stop the set if speed drops.</li>
    <li>Lower for about 2 s, then drive up hard.</li></ul></div>
  <div class="card"><h3>Ramp-in (weeks 1–2)</h3><ul class="bul">
    <li>Do <b>2 sets</b> of everything instead of 3.</li><li>Stop each set <b>3 reps short</b> of failure.</li>
    <li>Find the weights you'll use from week 3.</li></ul></div>
  <div class="card"><h3>Going up (progressive overload)</h3><ul class="bul">
    <li><b>Add reps first.</b> For 3 × 8–10: 8, 8, 8 → 9, 9, 8 → 10, 10, 10.</li>
    <li><b>Then add weight</b> once every set hits the top of the range with good form.</li>
    <li>Upper body: <b>+1–2.5 kg</b>. Lower body: <b>+2.5–5 kg</b>.</li>
    <li>Reps drop back to the bottom of the range. Build them up again.</li></ul></div>
  <div class="card"><h3>Heavy week (every 5th week)</h3><ul class="bul">
    <li>Main lifts (marked <span class="badge" style="margin:0">Main</span>): <b>3 × 3–6</b>, heavier than normal.</li>
    <li>Accessories stay the same. Then start the next block.</li></ul></div>
  <div class="card"><h3>Back off (deload) if any of these happen</h3><ul class="bul">
    <li>Lifts go backwards two sessions in a row.</li><li>Joints are sore (not just muscle soreness).</li>
    <li>Sleep is poor or you feel flat for a week.</li>
    <li>Lighter week = <b>same exercises, half the sets, same weights or 10% lighter</b>. HIIT becomes easy cycling. Then back to normal.</li>
    <li>Turn on <a href="#/settings">Deload week</a> in Settings and the app halves your sets.</li></ul></div>
  <div class="card"><h3>Missed or busy days</h3><ul class="bul">
    <li>Missed a session? Don't double up. Do the next one.</li>
    <li>Short on time? Explosive moves and the 2 main lifts only.</li></ul></div>
  <div class="card"><h3>Habits</h3><ul class="bul">
    <li>Protein 175 g and 2500 kcal a day.</li><li>Sleep 8 hours, up with the sun.</li>
    <li>No phone during rest. Breathe and drink water.</li><li>12+ months for a real transformation. Be better, not perfect.</li></ul></div>`;
}

function renderSettings() {
  const bi = blockInfo();
  view().innerHTML = `<div class="topbar"><a class="back" href="#/home" aria-label="Back">‹</a><h1 style="font-size:22px;margin:0">Settings</h1></div>
  <div class="card"><label><b>Block start date</b><div class="muted small" style="margin:2px 0 8px">Week 1 starts on this day. Pick a Monday.</div>
    <input type="date" id="set-start" value="${esc(settings.start)}"></label>
    <div class="muted small" style="margin-top:8px">Now: ${esc(weekLine(bi))} · ${PHASES[bi.phase].name}</div></div>
  <div class="card">
    <label class="toggle"><span><b>Ramp-in every block</b><br><span class="muted small">On: weeks 1–2 of every 5-week block are ramp-in. Off: only the first block.</span></span><input type="checkbox" id="set-ramp" ${settings.rampEveryBlock ? 'checked' : ''}></label>
    <label class="toggle"><span><b>Deload week</b><br><span class="muted small">Half the sets, same weights or 10% lighter. Turn off when you're back to normal.</span></span><input type="checkbox" id="set-deload" ${settings.deload ? 'checked' : ''}></label></div>
  <div class="card"><b>Backup</b><div class="grid2" style="margin-top:10px"><button class="btn ghost" data-act="export">Export JSON</button><button class="btn ghost" data-act="import">Import JSON</button></div>
    <div class="muted small" style="margin-top:8px">${log.length} sets stored on this phone. Import merges with what's here.</div></div>
  <div class="card small muted">Exercise images: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a> (public domain). Works offline once installed: Safari → Share → Add to Home Screen.</div>`;
  $('#set-start').addEventListener('change', e => { if (e.target.value) { settings.start = e.target.value; save(LS.settings, settings); renderSettings(); toast('Start date saved'); } });
  $('#set-ramp').addEventListener('change', e => { settings.rampEveryBlock = e.target.checked; save(LS.settings, settings); renderSettings(); });
  $('#set-deload').addEventListener('change', e => { settings.deload = e.target.checked; save(LS.settings, settings); renderSettings(); toast(settings.deload ? 'Deload week on' : 'Deload week off'); });
}

/* ---------- export / import ---------- */
function exportLog() {
  const data = { app: 'lockie-training', version: 1, exported: new Date().toISOString(), settings, log };
  const name = `lockie-training-log-${todayStr()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const file = typeof File === 'function' ? new File([blob], name, { type: 'application/json' }) : null;
  if (file && navigator.canShare && navigator.canShare({ files: [file] })) { navigator.share({ files: [file], title: name }).catch(() => {}); return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Log exported');
}
function importLog() {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json,.json';
  inp.onchange = async () => {
    try {
      const data = JSON.parse(await inp.files[0].text());
      const incoming = Array.isArray(data) ? data : data.log;
      if (!Array.isArray(incoming)) throw new Error('bad file');
      const map = new Map(log.map(e => [keyOf(e.d, e.m, e.s), e])); let added = 0;
      for (const e of incoming) { if (!e || !e.d || !e.m || typeof e.s !== 'number') continue; const k = keyOf(e.d, e.m, e.s); if (!map.has(k)) added++; map.set(k, e); }
      log = [...map.values()]; saveLog();
      if (data.settings && data.settings.start) { settings = Object.assign({}, DEFAULT_SETTINGS, data.settings); save(LS.settings, settings); }
      toast(`Imported: ${added} new set${added === 1 ? '' : 's'}`); route();
    } catch (err) { toast('Could not read that file'); }
  };
  inp.click();
}

/* ---------- events ---------- */
document.addEventListener('input', e => {
  const t = e.target; if (!t.dataset || !t.dataset.f) return;
  const row = t.closest('.setrow'); const ds = todayStr(), s = Number(row.dataset.set), m = t.dataset.m;
  const k = keyOf(ds, m, s); draft[k] = Object.assign({}, draft[k], { [t.dataset.f]: t.value }); save(LS.draft, draft);
  const ent = findEntry(ds, m, s); // editing an already-ticked set updates the log
  if (ent) { const v = t.value === '' ? null : Number(t.value); ent[t.dataset.f === 'kg' ? 'kg' : 'r'] = v; saveLog(); }
});
document.addEventListener('change', e => {
  if (e.target.dataset && e.target.dataset.act === 'short') { ui.short = e.target.checked; renderWorkout(view().dataset.day); }
});
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const act = b.dataset.act;
  if (act === 'tick') {
    unlockAudio();
    const row = b.closest('.setrow'), ex = Object.values(PROGRAM).flatMap(p => p.exercises).find(x => x.id === row.dataset.ex);
    const ds = todayStr(), s = Number(row.dataset.set), parts = partsOf(ex), bi = blockInfo();
    if (row.classList.contains('done')) {
      log = log.filter(x => !(x.d === ds && x.s === s && parts.includes(x.m))); saveLog(); row.classList.remove('done');
      $('#ex-' + ex.id).classList.remove('complete'); return;
    }
    for (const inp of row.querySelectorAll('input[data-f]')) if (inp.value === '' && inp.placeholder && !isNaN(Number(inp.placeholder))) inp.value = inp.placeholder;
    for (const m of parts) {
      const kgI = row.querySelector(`input[data-m="${CSS.escape(m)}"][data-f="kg"]`), rI = row.querySelector(`input[data-m="${CSS.escape(m)}"][data-f="r"]`);
      const entry = { d: ds, m, s, kg: kgI.value === '' ? null : Number(kgI.value), r: rI.value === '' ? null : Number(rI.value), day: view().dataset.day, ph: bi.phase, t: Date.now() };
      log = log.filter(x => !(x.d === ds && x.m === m && x.s === s)); log.push(entry);
    }
    saveLog(); row.classList.add('done');
    if (countDoneSets(ex, ds, bi.phase) === target(ex, bi.phase).sets) $('#ex-' + ex.id).classList.add('complete');
    startRest(ex.rest, parts.join(' + '));
  } else if (act === 'swap') {
    const id = b.dataset.ex; settings.swaps[id] = !settings.swaps[id]; if (!settings.swaps[id]) delete settings.swaps[id]; save(LS.settings, settings);
    const y = scrollY; renderWorkout(view().dataset.day); scrollTo(0, y);
  } else if (act === 'play') playVideo(b);
  else if (act === 'closevid') closeVideo(b);
  else if (act === 'timer-skip') stopRest();
  else if (act === 'timer-add') { if (timer) { timer.end += Number(b.dataset.v) * 1000; timer.total = Math.max(timer.total, (timer.end - Date.now()) / 1000); save(LS.timer, timer); runTimer(); } }
  else if (act === 'hiit-opt') { if (hiit.running) return toast('Pause or reset first'); hiit.opt = b.dataset.v; hiitReset(); renderHIIT(); }
  else if (act === 'hiit-start') hiitStartPause();
  else if (act === 'hiit-reset') hiitReset();
  else if (act === 'hiit-skip') { unlockAudio(); hiitNext(); }
  else if (act === 'export') exportLog();
  else if (act === 'import') importLog();
  else if (act === 'finish') { const n = log.filter(x => x.d === todayStr()).length; toast(n ? `Session saved: ${n} sets. Be better, not perfect.` : 'No sets ticked today'); }
});

/* ---------- router ---------- */
function go(h) { location.hash = h; }
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'home', [p, arg] = h.split('/');
  const tab = { home: 'home', workout: 'home', settings: 'home', program: 'program', hiit: 'hiit', history: 'history', rules: 'rules' }[p] || 'home';
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (p === 'workout') renderWorkout(arg);
  else if (p === 'program') renderProgram();
  else if (p === 'hiit') renderHIIT();
  else if (p === 'history') renderHistory(arg ? decodeURIComponent(arg) : null);
  else if (p === 'rules') renderRules();
  else if (p === 'settings') renderSettings();
  else renderHome();
  if (p !== 'workout' || !route.keep) scrollTo(0, 0);
}
window.addEventListener('hashchange', route);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && timer && timerIv) runTimer(); });
route();
if (timer && timer.end > Date.now()) runTimer(); else if (timer) { timer = null; localStorage.removeItem(LS.timer); }

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  // When a new version's service worker takes over, reload once so the new files are used straight away.
  const hadController = !!navigator.serviceWorker.controller; let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
})();
