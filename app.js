/* Baki Program (Lockie Training Program) — plain JS, no build step. Data in data.js. */
(() => {
'use strict';
const LS = { log: 'lockie.log.v1', draft: 'lockie.draft.v1', settings: 'lockie.settings.v1', timer: 'lockie.timer.v1', food: 'lockie.food.v1' };
const DEFAULT_SETTINGS = { start: '2026-10-05', rampEveryBlock: true, deload: false, swaps: {} };
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const comma = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
function foodState() {
  const v = load(LS.food, {});
  const checks = v && v.checks && typeof v.checks === 'object' && !Array.isArray(v.checks) ? v.checks : {};
  return { carb: v && v.carb === 'sweet' ? 'sweet' : 'rice', checks };
}
function saveFood(st) { save(LS.food, st); }

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
  pre: { name: 'Before the block', cls: 'ramp', short: 'Block starts Monday. Full sets from day one.' },
  normal: { name: 'Normal week', cls: 'normal', short: 'Main lifts 1–2 RIR, accessories 0–1 RIR. Add reps first, then weight.' },
  heavy: { name: 'Heavy week', cls: 'heavy', short: 'Main lifts (bold) 3 × 3–6, heavier than normal. Accessories stay the same.' },
  deload: { name: 'Deload week', cls: 'deload', short: 'Same exercises, half the sets, same weights or 10% lighter. HIIT = easy cycling.' }
};
function blockInfo(d = today()) {
  const days = daysBetween(parseYmd(settings.start), d);
  if (days < 0) return { pre: true, daysTo: -days, week: 0, block: 0, phase: settings.deload ? 'deload' : 'pre' };
  const wi = Math.floor(days / 7), block = Math.floor(wi / 5) + 1, week = (wi % 5) + 1;
  let phase = week <= 4 ? 'normal' : 'heavy';
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
const mvOf = m => MOV[m] || MOB[m];
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
function sessionSub(k) { return k === 'H' ? 'Saturday · Fighter conditioning' : k === 'R' ? '' : `${PROGRAM[k].day} · ${PROGRAM[k].focus}`; }
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
    const pk = hiitPick(d), o = HIIT[pk];
    todayHtml = `<div class="muted small">Today</div><h2 style="margin:4px 0 2px">HIIT</h2><div class="subt">This week: <b>${esc(o.name)}</b></div>
      <div class="muted small">${esc(o.desc)} · about ${mins(o.phases)} min · ${esc(GOALS[o.goal].label)}${bi.phase === 'deload' ? ' · Deload week: keep it easy' : ''}</div>
      <a class="btn" style="margin-top:14px" href="#/hiit/${pk}">Start ${esc(o.name)}</a>
      <a class="small" style="display:inline-block;margin-top:10px;min-height:36px;line-height:36px" href="#/hiit">See all HIIT sessions</a>`;
  } else {
    const n = nextSession(d);
    todayHtml = `<div class="muted small">Today</div><h2 style="margin:4px 0 6px">Recovery</h2>
      <div class="muted small">${d.getDay() === 2 ? 'Walk, sun, surf.' : 'Walk, stretch, sleep 8 hours.'} Next up: <b>${esc(sessionTitle(n.k))}</b> (${esc(n.k === 'H' ? 'Fighter conditioning' : PROGRAM[n.k].focus)}) on ${dayName(n.d)}.</div>
      <div class="muted small" style="margin-top:6px">Optional: <a href="#/hiit/z2">Zone 2, 30–45 min</a> on the bike or rower. Easy, talk-test pace.</div>`;
  }
  const mk = mobKeyFor(d), mo = MOBILITY[mk];
  const n = NUTRITION;
  const food = foodState(), ft = FOOD.totals[food.carb];
  view().innerHTML = `
  <div class="row between"><div><div class="muted small">${esc(fmtLong(d))}</div><h1 class="apph">${esc(APP_HEADING)}</h1></div>
    <a class="iconbtn" href="#/settings" aria-label="Settings">⚙️</a></div>
  <div class="card"><div class="row between wrap"><b>${esc(weekLine(bi))}</b>${phaseChip(bi)}</div>
    <div class="muted small" style="margin-top:6px">${esc(PHASES[bi.phase].short)}</div></div>
  <div class="card hero">${todayHtml}</div>
  <div class="card mobcard"><div class="row between"><b>Today's mobility</b><span class="muted small">${mobMins(mk)} min</span></div>
    <div style="margin-top:4px;font-weight:700;font-size:17px">${esc(mo.name)}</div>
    <div class="muted small">${esc(mo.moves.slice(0, 4).map(x => x[0]).join(' · '))} …</div>
    <a class="btn ghost" style="margin-top:10px" href="#/mobility/${mk}">Start mobility</a></div>
  <div class="card foodcard"><div class="row between"><b>Today's meals</b><span class="muted small">${food.carb === 'rice' ? 'Rice day' : 'Sweet-potato day'}</span></div>
    <div style="margin-top:4px;font-weight:700;font-size:17px">Yoghurt bowl · Egg meal · Protein bowl</div>
    <div class="muted small">~${comma(ft.kcal)} kcal · ${ft.p} g protein on this day. The target board below is still 2,500 kcal.</div>
    <a class="btn ghost" style="margin-top:10px" href="#/food">Open meals</a>
    <a class="small" style="display:inline-block;margin-top:8px;min-height:36px;line-height:36px" href="#/food/shop">Shopping list</a></div>
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
      <div class="tline">${tempoChips(ex.parts)}</div>
      <div class="sw">Swap: ${esc(ex.swap.label)} ${tempoChips(ex.swap.parts)}</div></div>`; }).join('')}
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
  <div class="card"><h3>HIIT</h3><div class="subt">Saturday · Fighter conditioning</div><ul class="bul small">
   <li>One session a week, rotating: <b>${HIIT_ROTATION.map(k => esc(HIIT[k].name)).join(' → ')}</b>, then repeat.</li>
   <li>This week: <b>${esc(HIIT[hiitPick()].name)}</b>. 8 sessions to choose from in the HIIT tab.</li>
   <li>Deload week: Zone 2 instead. Optional Zone 2 on recovery days.</li></ul>
   <a class="btn" href="#/hiit">Open HIIT</a></div>
  <div class="card"><h3>Mobility</h3><div class="subt">Every day · 15–20 min follow-along</div>
   <ul class="list">${MOB_ORDER.map(k => `<li class="row between"><span>${DAYS[MOBILITY[k].day]}</span><span class="muted">${esc(MOBILITY[k].name)}</span></li>`).join('')}</ul>
   <a class="btn ghost" href="#/mobility">Open mobility</a></div>`;
}

const dur = n => `${Math.floor(n / 60)}:${pad(n % 60)}`;
/* tempo chips */
const tchip = k => `<span class="tchip ${TEMPO_INFO[k].cls}">${TEMPO_INFO[k].label}</span>`;
const tempoChips = parts => [...new Set(parts.map(m => MOV[m].tempo))].map(tchip).join(' ');
function tempoHtml(parts) {
  const ts = [...new Set(parts.map(m => MOV[m].tempo))];
  if (ts.length === 1) return `<div class="tempo">${tchip(ts[0])}<span class="tcue">${esc(TEMPO_INFO[ts[0]].cue)}</span></div>`;
  return parts.map(m => `<div class="tempo"><span class="tname">${esc(m)}</span>${tchip(MOV[m].tempo)}<span class="tcue">${esc(TEMPO_INFO[MOV[m].tempo].cue)}</span></div>`).join('');
}
// Still image shows instantly (and offline); the YouTube player only loads when tapped.
function demoHtml(m) {
  const mv = mvOf(m), v = VIDEO[m];
  const still = mv.img ? `<img src="img/${mv.img}/0.jpg" alt="${esc(m)} still" loading="lazy">`
    : `<div class="nolink">${esc(m)}<br><small>Video thumbnail needs internet</small></div>${v ? `<img class="thumb" src="https://i.ytimg.com/vi/${v.id}/hqdefault.jpg" alt="${esc(m)} video thumbnail" loading="lazy" onerror="this.remove()">` : ''}`;
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
    ${tempoHtml(parts)}
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

/* ---------- HIIT menu ---------- */
const mins = ph => Math.round(ph.reduce((a, x) => a + x.secs, 0) / 60);
function hiitPick(d = today()) { // one recommended session each week; deload = Zone 2
  const bi = blockInfo(d); if (bi.phase === 'deload') return 'z2';
  return HIIT_ROTATION[(bi.pre ? 0 : bi.totalWeek - 1) % HIIT_ROTATION.length];
}
function rotationAhead(d) { const bi = blockInfo(d), w = bi.pre ? 0 : bi.totalWeek - 1; return [1, 2].map(i => HIIT_ROTATION[(w + i) % HIIT_ROTATION.length]); }
const goalChip = g => `<span class="goal ${GOALS[g].cls}">${GOALS[g].label}</span>`;
function effortCard() {
  return `<div class="card"><b>How hard? (RPE out of 10)</b><table class="effort">${EFFORT.map(([n, l, d]) => `<tr><td class="rpe">${n}</td><td><b>${l}</b><div class="muted small">${esc(d)}</div></td></tr>`).join('')}</table></div>`;
}
function renderHIIT() {
  const d = today(), bi = blockInfo(d), pk = hiitPick(d), o = HIIT[pk], [n1, n2] = rotationAhead(d);
  view().innerHTML = `<h1>HIIT</h1><div class="subt">Saturday · one session a week. No jogging, ever.</div>
    <div class="card hero" id="hiit-pick"><div class="muted small">This week's pick</div><h2 style="margin:4px 0 4px">${esc(o.name)}</h2>
      <div class="row wrap" style="gap:6px">${goalChip(o.goal)}<span class="chip">${mins(o.phases)} min</span></div>
      <div class="muted small" style="margin-top:6px">${esc(o.desc)}. ${esc(o.equip)}.</div>
      ${bi.phase === 'deload' ? '<div class="note deload"><b>Deload week:</b> Zone 2 instead of hard intervals.</div>' : HIIT_ALT[pk] ? `<div class="muted small" style="margin-top:6px">Can't do it? Swap for ${esc(HIIT_ALT[pk])}.</div>` : ''}
      <a class="btn" style="margin-top:12px" href="#/hiit/${pk}">Start ${esc(o.name)}</a>
      <div class="muted small" style="margin-top:10px">Rotation: ${HIIT_ROTATION.map(k => esc(HIIT[k].name)).join(' → ')}, then repeat. Next week: <b>${esc(HIIT[n1].name)}</b>, then ${esc(HIIT[n2].name)}.</div></div>
    <div class="note"><b>Recovery days (Tue, Thu, Sun):</b> optional <a href="#/hiit/z2">Zone 2, 30–45 min</a> on the bike or rower. Easy, talk-test pace. Good for aerobic base and HRV.</div>
    <h2>All sessions</h2>
    ${Object.keys(HIIT).filter(k => !HIIT[k].hidden).map(k => { const x = HIIT[k]; return `<a class="card hcard${k === pk ? ' pick' : ''}" href="#/hiit/${k}" data-k="${k}">
      <div class="row between"><b class="hname">${esc(x.name)}</b>${k === pk ? '<span class="badge">This week</span>' : ''}</div>
      <div class="row wrap" style="gap:6px;margin-top:6px">${goalChip(x.goal)}<span class="chip">${k === 'z2' ? '30–45' : mins(x.phases)} min</span></div>
      <div class="small" style="margin-top:6px">${esc(x.desc)}</div><div class="muted small">🧰 ${esc(x.equip)}</div></a>`; }).join('')}
    ${effortCard()}`;
}
function renderHIITSession(key) {
  const o = HIIT[key]; if (!o) return go('#/hiit');
  if (!pSet('hiit', key)) { toast('Pause or reset the running timer first'); return go(pHash()); }
  const bi = blockInfo(), base = o.variantOf || key, B = HIIT[base];
  view().innerHTML = `<div class="topbar"><a class="back" href="#/hiit" aria-label="Back">‹</a><div style="flex:1"><h1 style="font-size:22px;margin:0">${esc(o.name)}</h1><div class="subt">${esc(o.desc)}</div></div></div>
    <div class="row wrap" style="gap:6px">${goalChip(o.goal)}<span class="chip" id="hiit-mins">${mins(o.phases)} min</span>${key === hiitPick() ? '<span class="badge" style="margin:0">This week</span>' : ''}</div>
    <div class="muted small" style="margin-top:6px">🧰 ${esc(o.equip)}</div>
    ${bi.phase === 'deload' && o.goal !== 'aero' ? '<div class="note deload"><b>Deload week:</b> do <a href="#/hiit/z2">Zone 2</a> instead.</div>' : ''}
    ${B.lengths ? `<div class="seg">${Object.entries(B.lengths).map(([k, m]) => `<button data-act="hiit-len" data-v="${k}" class="${k === key ? 'on' : ''}">${m} min</button>`).join('')}</div>` : ''}
    <div class="hiit-clock" id="hiit-clock"><div class="hiit-phase" id="hiit-phase">Ready</div><div class="hiit-time" id="hiit-time">0:00</div><div class="hiit-sub" id="hiit-sub"></div></div>
    <div class="grid2"><button class="btn" data-act="hiit-start" id="hiit-start">Start</button><button class="btn ghost" data-act="hiit-reset">Reset</button></div>
    <button class="btn ghost" style="margin-top:10px" data-act="hiit-skip">Skip to next interval</button>
    <div class="card"><b>How to</b><ol class="bul small">${o.how.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    ${o.demos ? `<div class="card"><b>Technique demos</b><div class="parts">${o.demos.map(demoHtml).join('')}</div></div>` : ''}
    ${effortCard()}
    <details class="card"><summary><b>Full timer plan</b> <span class="muted small">(${o.phases.length} intervals)</span></summary><ul class="bul small">${o.phases.map((p, i) => `<li id="hp-${i}">${esc(p.label)}${p.round ? ` ${p.round}/${p.of}` : ''}: ${p.secs >= 60 ? (p.secs % 60 ? `${Math.floor(p.secs / 60)} min ${p.secs % 60} s` : p.secs / 60 + ' min') : p.secs + ' s'}</li>`).join('')}</ul></details>`;
  pPaint();
}

/* ---------- mobility ---------- */
const mobKeyFor = d => MOB_ORDER.find(k => MOBILITY[k].day === d.getDay());
const mobMins = k => Math.round(MOBILITY[k].moves.reduce((a, x) => a + x[1], 0) / 60);
const moveTime = ([, s, sides]) => `${s >= 60 ? (s % 60 ? `${Math.floor(s / 60)} min ${s % 60} s` : `${s / 60} min`) : `${s} s`}${sides ? ' · both sides' : ''}`;
function renderMobility() {
  const d = today(), tk = mobKeyFor(d), mo = MOBILITY[tk];
  view().innerHTML = `<h1>Mobility</h1><div class="subt">Every day · 15–20 min · follow along</div>
    <div class="card hero"><div class="muted small">Today · ${DAYS[mo.day]}</div><h2 style="margin:4px 0 2px">${esc(mo.name)}</h2>
      <div class="muted small">${mobMins(tk)} min · ${mo.moves.length} moves · neck-hump drills included</div>
      <a class="btn" style="margin-top:12px" href="#/mobility/${tk}">Start ${esc(mo.name)}</a></div>
    <h2>Pick any session</h2>
    <div class="card"><ul class="list">${MOB_ORDER.map(k => `<li><a class="item mobitem" href="#/mobility/${k}" data-k="${k}"><span><b>${DAYS[MOBILITY[k].day]}</b><br><span class="muted small">${esc(MOBILITY[k].name)}</span></span><span class="muted small">${mobMins(k)} min ›</span></a></li>`).join('')}</ul></div>
    <div class="card"><b>Posture cues (Alexander Technique)</b><ul class="bul small">${AT_CUES.map(c => `<li>${esc(c)}</li>`).join('')}</ul>
      <div class="muted small">Think the cue, don't force it. End every session lying in semi-supine.</div></div>
    <div class="card"><b>How to</b><ul class="bul small">
      <li>Breathe slowly. Ease into each stretch: mild tension, never pain.</li>
      <li>Gym days: do it after training or in the evening, not right before heavy or explosive work.</li>
      <li>Through the day: screen at eye level, and a few chin tucks every hour.</li>
      <li>Progress slowly. Range comes from doing a little most days.</li></ul></div>`;
}
function renderMobSession(key) {
  const mo = MOBILITY[key]; if (!mo) return go('#/mobility');
  if (!pSet('mob', key)) { toast('Pause or reset the running timer first'); return go(pHash()); }
  view().innerHTML = `<div class="topbar"><a class="back" href="#/mobility" aria-label="Back">‹</a><div style="flex:1"><h1 style="font-size:22px;margin:0">${esc(DAYS[mo.day])} · ${esc(mo.name)}</h1><div class="subt">${mobMins(key)} min · ${mo.moves.length} moves · follow along</div></div></div>
    <div class="hiit-clock mobclock" id="hiit-clock"><div class="hiit-phase" id="hiit-phase">Ready</div><div class="hiit-time" id="hiit-time">0:00</div><div class="hiit-sub" id="hiit-sub"></div></div>
    <div class="grid3"><button class="btn ghost" data-act="mob-prev" aria-label="Previous move">‹ Back</button><button class="btn" data-act="hiit-start" id="hiit-start">Start</button><button class="btn ghost" data-act="hiit-skip" aria-label="Next move">Next ›</button></div>
    <div class="card mobnow" id="mob-now"></div>
    <div class="card"><div class="row between"><b>Moves</b><button class="linkbtn" data-act="hiit-reset">Reset</button></div><ol class="moblist">${mo.moves.map((x, i) => `<li id="mp-${i}"><span>${esc(x[0])}${MOB[x[0]].neck ? ' <span class="neck">posture</span>' : ''}</span><span class="muted small">${moveTime(x)}</span></li>`).join('')}</ol></div>`;
  $('#mob-now').dataset.mi = '';
  pPaint();
}
function mobNowPaint() {
  const box = $('#mob-now'); if (!box) return;
  const ph = pPhases(), p = ph[Math.min(P.idx, ph.length - 1)], mi = Math.max(0, p.mi), mv = MOBILITY[P.key].moves[mi], m = mv[0];
  if (box.dataset.mi !== String(mi)) {
    box.dataset.mi = String(mi);
    box.innerHTML = `<div class="muted small">Move ${mi + 1} of ${MOBILITY[P.key].moves.length} · ${esc(moveTime(mv))}</div><h2 class="mobname">${esc(m)}</h2>
      <div class="parts">${demoHtml(m)}</div>
      <div class="atcue">🧘 ${esc(AT_CUES[mi % AT_CUES.length])}</div>`;
  }
  MOBILITY[P.key].moves.forEach((_, i) => { const li = $('#mp-' + i); if (li) li.className = i === mi && !P.done ? 'on' : (i < mi || P.done ? 'past' : ''); });
}

/* ---------- interval player (HIIT + mobility) ---------- */
const P = { mode: 'hiit', key: 'n44', idx: 0, end: 0, left: null, running: false, iv: null, lastBeep: null, done: false, wake: null };
const mobCache = {};
function mobPhases(key) {
  if (mobCache[key]) return mobCache[key];
  const p = [{ label: 'Get ready', kind: 'easy', secs: 10, mi: 0 }];
  MOBILITY[key].moves.forEach(([m, secs, sides], mi) => {
    if (sides) { const h = Math.round(secs / 2); p.push({ label: m, m, mi, side: 1, kind: 'mob', secs: h }); p.push({ label: m, m, mi, side: 2, kind: 'mob', secs: secs - h }); }
    else p.push({ label: m, m, mi, kind: 'mob', secs });
  });
  return (mobCache[key] = p);
}
const pPhases = () => P.mode === 'mob' ? mobPhases(P.key) : HIIT[P.key].phases;
const pHash = () => P.mode === 'mob' ? '#/mobility/' + P.key : '#/hiit/' + P.key;
function pSet(mode, key) {
  if (P.mode === mode && P.key === key) return true;
  if (P.running) return false;
  clearInterval(P.iv); wakeLock(false);
  Object.assign(P, { mode, key, idx: 0, left: null, running: false, done: false, lastBeep: null }); return true;
}
function pLeft() { if (P.running) return Math.max(0, (P.end - Date.now()) / 1000); return P.left == null ? pPhases()[P.idx].secs : P.left; }
async function wakeLock(on) {
  try { if (on && 'wakeLock' in navigator) P.wake = await navigator.wakeLock.request('screen'); else if (!on && P.wake) { await P.wake.release(); P.wake = null; } } catch (e) {}
}
function pStartPause() {
  unlockAudio();
  if (P.done) pReset();
  if (P.running) { P.left = pLeft(); P.running = false; clearInterval(P.iv); wakeLock(false); }
  else { P.end = Date.now() + pLeft() * 1000; P.left = null; P.running = true; if (P.idx === 0 && pLeft() >= pPhases()[0].secs - 1) beep(1319, .3); P.iv = setInterval(pTick, 200); wakeLock(true); }
  pPaint();
}
function pCue(prev, cur) { // sound + vibration when the interval changes
  if (P.mode === 'mob') {
    if (prev && prev.mi === cur.mi && cur.side === 2) { beep(660, .35); buzz(300); }
    else { beep(1047, .15); beep(1319, .25, .2); buzz([200, 80, 200]); }
  } else if (cur.kind === 'hard') { beep(1319, .25); beep(1319, .25, .3); buzz([300, 100, 300]); }
  else { beep(660, .4); buzz(400); }
}
function pNext(auto) {
  const ph = pPhases();
  if (P.idx >= ph.length - 1) { P.running = false; P.done = true; clearInterval(P.iv); P.left = 0; alarm(); wakeLock(false); pPaint(); return; }
  const prev = ph[P.idx]; P.idx++; const secs = ph[P.idx].secs;
  if (P.running) P.end = auto ? P.end + secs * 1000 : Date.now() + secs * 1000; else P.left = secs;
  pCue(prev, ph[P.idx]); pPaint();
}
function pPrev() {
  const ph = pPhases(); let i = P.idx;
  if (P.mode === 'mob') { // back = restart this move; tap again within 2 s = previous move
    const mi = ph[i].mi, first = ph.findIndex(x => x.kind === 'mob' && x.mi === mi), elapsed = ph[i].secs - pLeft();
    if (ph[i].kind !== 'mob') i = 0;
    else if (i > first || elapsed > 2) i = first;
    else i = mi > 0 ? ph.findIndex(x => x.kind === 'mob' && x.mi === mi - 1) : first;
  } else i = Math.max(0, i - 1);
  P.idx = i; P.done = false; const secs = ph[i].secs;
  if (P.running) P.end = Date.now() + secs * 1000; else P.left = secs;
  pPaint();
}
function pTick() {
  let guard = 0; // catch up if the phone slept through several intervals
  while (P.running && pLeft() <= 0 && guard++ < 200) pNext(true);
  if (!P.running) return;
  const s = Math.ceil(pLeft());
  if (s <= 3 && s > 0 && P.lastBeep !== `${P.idx}-${s}`) { P.lastBeep = `${P.idx}-${s}`; beep(880, .08); }
  pPaint();
}
function pReset() { clearInterval(P.iv); P.idx = 0; P.left = null; P.running = false; P.done = false; wakeLock(false); pPaint(); }
function pPaint() {
  const el = $('#hiit-clock'); if (!el) return;
  const ph = pPhases(), p = ph[P.idx], s = Math.ceil(pLeft());
  const remain = s + ph.slice(P.idx + 1).reduce((a, x) => a + x.secs, 0);
  const active = P.running || P.left != null;
  el.className = 'hiit-clock' + (P.mode === 'mob' ? ' mobclock' : '') + ' ' + (P.done ? 'rest' : (active ? p.kind : ''));
  const nx = ph[P.idx + 1];
  if (P.mode === 'mob') {
    $('#hiit-phase').textContent = P.done ? 'Done. Nice work!' : p.kind === 'mob' ? `${p.label}${p.side ? ` · side ${p.side} of 2` : ''}` : (active ? 'Get ready' : 'Ready');
    $('#hiit-sub').textContent = P.done ? 'Finish with a glass of water.' : `Next: ${nx ? (nx.mi === p.mi && nx.side === 2 ? 'switch sides' : nx.label) : 'finish'} · ${Math.floor(remain / 60)}:${pad(remain % 60)} left`;
  } else {
    $('#hiit-phase').textContent = P.done ? 'Done. Good work!' : `${p.label}${p.round ? ` · Round ${p.round}/${p.of}` : ''}`;
    $('#hiit-sub').textContent = P.done ? '' : `Next: ${nx ? nx.label : 'finish'} · ${Math.floor(remain / 60)}:${pad(remain % 60)} left in session`;
  }
  $('#hiit-time').textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
  $('#hiit-start').textContent = P.running ? 'Pause' : (P.left != null && !P.done ? 'Resume' : 'Start');
  if (P.mode === 'mob') mobNowPaint();
  else ph.forEach((_, i) => { const li = $('#hp-' + i); if (li) li.style.color = i === P.idx && !P.done ? 'var(--accent)' : i < P.idx || P.done ? 'var(--muted)' : ''; });
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

/* ---------- food ---------- */
function macroLine(m) {
  return `<div class="macros"><b>~${comma(m.kcal)} kcal</b><span>${m.p} g protein · ${m.c} g carbs · ${m.f} g fat</span></div>`;
}
function portionsHtml(items) {
  return `<ul class="portions">${items.map(it => {
    const cls = [it.optional ? 'opt' : '', it.carb ? 'carb' : ''].filter(Boolean).join(' ');
    return `<li class="${cls}">${it.optional ? 'Optional, uncounted: ' : ''}${esc(it.text)}</li>`;
  }).join('')}</ul>`;
}
function mealCard(meal, n) {
  return `<div class="card"><h3>${n ? n + ' · ' : ''}${esc(meal.name)}</h3>${macroLine(meal)}${portionsHtml(meal.items)}</div>`;
}
function foodSeg(mode) {
  return `<div class="seg foodseg">
    <button type="button" class="${mode === 'meals' ? 'on' : ''}" data-act="food-view" data-v="meals">Meals</button>
    <button type="button" class="${mode === 'shop' ? 'on' : ''}" data-act="food-view" data-v="shop">Shopping</button>
  </div>`;
}
function shopStats(checks) {
  let total = 0, done = 0;
  for (const g of SHOP) for (const [id] of g.items) { total++; if (checks[id]) done++; }
  return { total, done };
}
function renderShop() {
  const st = foodState(), { total, done } = shopStats(st.checks);
  const groups = SHOP.map(g => {
    const items = g.items.map(([id, text]) => {
      const on = !!st.checks[id];
      return `<label class="check${on ? ' on' : ''}"><input type="checkbox" data-shop="${esc(id)}"${on ? ' checked' : ''}><span>${esc(text)}</span></label>`;
    }).join('');
    return `<div class="group-h">${esc(g.title)}</div><div class="card" style="margin-top:4px">${g.note ? `<div class="muted small">${esc(g.note)}</div>` : ''}${items}</div>`;
  }).join('');
  return `<div class="row between" style="margin-top:14px"><div><b id="shop-count">${done} of ${total} ticked</b>
      <div class="muted small">Buy the calculated base first. Alternatives are swaps, not extras.</div></div></div>
    <button class="btn ghost" style="margin-top:10px" data-act="shop-reset">Reset for new week</button>
    ${groups}`;
}
function microHtml() {
  const m = FOOD.micros;
  const rows = m.rows.map(r => {
    const warn = r[4].indexOf('Gap') === 0 || r[2] === 'Unresolved' || r[3] === 'Unresolved';
    return `<div class="micron"><div class="row between"><b>${esc(r[0])}</b><span class="small ${warn ? 'gap' : 'muted'}">${esc(r[4])}</span></div>
      <div class="muted small">Guide ${esc(r[1])} · Rice ${esc(r[2])} · Sweet potato ${esc(r[3])}</div></div>`;
  }).join('');
  return `<div class="card"><b>Micronutrients</b>
    <div class="muted small" style="margin-top:4px">Likely covered against the Sillz guide. These are estimates, not lab results.</div>
    <div class="chips">${m.covered.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>
    <div class="group-h">Gaps</div>
    <ul class="bul small">
      <li><b class="gap">Vitamin E</b> — about 10–11 mg on both days, against a 15 mg guide. Roughly 4–5 mg short.</li>
      <li><b class="gap">Magnesium</b> — rice day 335 mg (about 65 mg short). Sweet-potato day 393 mg (about 7 mg short). Guide 400 mg.</li>
      <li><b>Vitamin D, B6 and K2</b> — unresolved. A blank here is not zero intake.</li>
      <li><b>Omega-3</b> — salmon in the protein bowl about twice a week. No daily sardines in this plan.</li>
    </ul>
    <div class="muted small">Iodine about 275 µg on a rice day and 270 µg on a sweet-potato day (dairy-dependent). Fibre about 28 g rice / 37 g sweet potato.</div>
    <details class="micro-more"><summary>Full comparison</summary>
      ${rows}
      <ul class="bul small">${m.footnotes.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    </details></div>`;
}
function renderMeals(carb) {
  const bowl = FOOD.bowl, spec = bowl[carb], other = carb === 'rice' ? 'sweet' : 'rice';
  const items = [bowl.items[0], { text: spec.carb, carb: true }, ...bowl.items.slice(1)];
  const totals = ['rice', 'sweet'].map(k => {
    const t = FOOD.totals[k], on = k === carb;
    return `<div class="dayrow${on ? ' on' : ''}"><div class="row between"><b>${k === 'rice' ? 'Rice day' : 'Sweet-potato day'}</b>${on ? '<span class="chip">Selected</span>' : ''}</div>
      <div class="grid4" style="margin-top:8px">
        <div class="stat"><b>~${comma(t.kcal)}</b><span>kcal</span></div>
        <div class="stat"><b>${t.p}</b><span>g protein</span></div>
        <div class="stat"><b>${t.c}</b><span>g carbs</span></div>
        <div class="stat"><b>${t.f}</b><span>g fat</span></div>
      </div></div>`;
  }).join('');
  return `<div class="seg">
      <button type="button" class="${carb === 'rice' ? 'on' : ''}" data-act="carb" data-v="rice">Rice day</button>
      <button type="button" class="${carb === 'sweet' ? 'on' : ''}" data-act="carb" data-v="sweet">Sweet-potato day</button>
    </div>
    ${FOOD.meals.map((meal, i) => mealCard(meal, i + 1)).join('')}
    <div class="card"><div class="row between"><h3>3 · ${esc(bowl.name)}</h3><span class="muted small">${carb === 'rice' ? 'Rice' : 'Sweet potato'}</span></div>
      ${macroLine(spec)}
      ${portionsHtml(items)}
      <div class="muted small" style="margin-top:8px">Other day: ${esc(bowl[other].carb)}</div>
      <div class="note">${esc(bowl.note)}</div>
    </div>
    ${mealCard(FOOD.extras)}
    <div class="card"><b>Day totals</b>
      <div class="muted small" style="margin-top:4px">Calculated meals. Each line is rounded on its own, so the meals may not add exactly to these totals.</div>
      ${totals}
      <div class="muted small" style="margin-top:10px">${esc(FOOD.optionalRice)}</div>
    </div>
    ${microHtml()}
    <div class="card"><b>How to eat this</b><ul class="bul small">${FOOD.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>`;
}
function renderFood(arg) {
  const mode = arg === 'shop' ? 'shop' : 'meals';
  view().innerHTML = `<div class="row between"><h1 style="margin:0">Food</h1><span class="muted small">Locked ${esc(FOOD.locked)}</span></div>
    <div class="muted small" style="margin-top:4px">${esc(FOOD.board)}</div>
    ${foodSeg(mode)}
    ${mode === 'shop' ? renderShop() : renderMeals(foodState().carb)}`;
}
function foodArg() {
  return (location.hash.replace(/^#\/?/, '').split('/')[1]) || '';
}

function renderRules() {
  view().innerHTML = `<h1>The Rules</h1>
  <div class="card"><h3>Effort</h3><ul class="bul">
    <li><b>RIR</b> (reps in reserve) = how many more good reps you could have done.</li>
    <li>Main lifts: stop at 1–2 RIR. Accessories: 0–1 RIR.</li>
    <li>Explosive moves: every rep fast. Stop the set if speed drops.</li>
    <li>Every exercise shows a tempo chip. Follow it.</li></ul></div>
  <div class="card"><h3>Tempo</h3><ul class="list">${Object.keys(TEMPO_INFO).map(k => `<li>${tchip(k)}<div class="small" style="margin-top:6px">${esc(TEMPO_INFO[k].cue)}</div></li>`).join('')}</ul></div>
  <div class="card"><h3>Week 1: find your weights</h3><ul class="bul">
    <li>Full sets from day one.</li><li>Pick weights you could do <b>2–3 more reps</b> with. Log them.</li>
    <li>From week 2, push to the normal effort targets and start adding reps.</li></ul></div>
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
    <label class="toggle"><span><b>Deload week</b><br><span class="muted small">Half the sets, same weights or 10% lighter. Turn off when you're back to normal.</span></span><input type="checkbox" id="set-deload" ${settings.deload ? 'checked' : ''}></label></div>
  <div class="card"><b>Backup</b><div class="grid2" style="margin-top:10px"><button class="btn ghost" data-act="export">Export JSON</button><button class="btn ghost" data-act="import">Import JSON</button></div>
    <div class="muted small" style="margin-top:8px">${log.length} sets stored on this phone. Import merges with what's here.</div></div>
  <div class="card small muted">Exercise images: <a href="https://github.com/yuhonas/free-exercise-db" target="_blank" rel="noopener">free-exercise-db</a> (public domain). Demo videos: YouTube, credited to each channel. Works offline once installed: Safari → Share → Add to Home Screen.</div>`;
  $('#set-start').addEventListener('change', e => { if (e.target.value) { settings.start = e.target.value; save(LS.settings, settings); renderSettings(); toast('Start date saved'); } });
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
  if (e.target.dataset && e.target.dataset.shop) {
    const st = foodState(), id = e.target.dataset.shop;
    if (e.target.checked) st.checks[id] = true; else delete st.checks[id];
    saveFood(st);
    const lab = e.target.closest('.check');
    if (lab) lab.classList.toggle('on', e.target.checked);
    const { total, done } = shopStats(st.checks);
    const n = $('#shop-count'); if (n) n.textContent = `${done} of ${total} ticked`;
  }
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
  else if (act === 'hiit-len') { if (P.running) return toast('Pause or reset first'); go('#/hiit/' + b.dataset.v); }
  else if (act === 'hiit-start') pStartPause();
  else if (act === 'hiit-reset') pReset();
  else if (act === 'hiit-skip') { unlockAudio(); pNext(false); }
  else if (act === 'mob-prev') { unlockAudio(); pPrev(); }
  else if (act === 'food-view') go(b.dataset.v === 'shop' ? '#/food/shop' : '#/food');
  else if (act === 'carb') {
    const st = foodState(); st.carb = b.dataset.v === 'sweet' ? 'sweet' : 'rice'; saveFood(st);
    const y = scrollY; renderFood(foodArg()); scrollTo(0, y);
  } else if (act === 'shop-reset') {
    const st = foodState();
    if (!Object.keys(st.checks).length) { toast('Nothing to clear'); return; }
    if (!confirm('Clear every tick for a new week?')) return;
    st.checks = {}; saveFood(st); renderFood('shop'); scrollTo(0, 0); toast('Shopping list cleared');
  } else if (act === 'export') exportLog();
  else if (act === 'import') importLog();
  else if (act === 'finish') { const n = log.filter(x => x.d === todayStr()).length; toast(n ? `Session saved: ${n} sets. Be better, not perfect.` : 'No sets ticked today'); }
});

/* ---------- router ---------- */
function go(h) { location.hash = h; }
function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'home', [p, arg] = h.split('/');
  const tab = { home: 'home', workout: 'home', settings: 'home', program: 'program', hiit: 'hiit', mobility: 'mobility', food: 'food', history: 'history', rules: 'rules' }[p] || 'home';
  document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  if (p === 'workout') renderWorkout(arg);
  else if (p === 'program') renderProgram();
  else if (p === 'hiit') arg ? renderHIITSession(arg) : renderHIIT();
  else if (p === 'mobility') arg ? renderMobSession(arg) : renderMobility();
  else if (p === 'food') renderFood(arg);
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
