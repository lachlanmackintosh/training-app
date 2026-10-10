/* Ask AI food log. Pure helpers: no DOM, no network, no API key.
   GEMINI_MODEL is the free-tier Flash id. Change this one line to swap models.
   Oct 2026: gemini-3.8-flash is the current free Flash (gemini-2.5-flash still works on older keys).
   The model returns add / remove / update operations. This file applies them.
   Grams x the food library is the only maths. */
const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';
const MAX_ACTIONS = 24;
const MAX_ITEMS = 40;
const LIB = FOOD_PLAN.library;
const MEALS = FOOD_PLAN.meals;
const SWAPS = FOOD_PLAN.swaps;
const SILLZ = FOOD_PLAN.sillz;
const NUTS = FOOD_PLAN.nutrients;
const TARGETS = FOOD_PLAN.targets;
const PREFERRED = {};
for (const id of FOOD_PLAN.preferred) PREFERRED[id] = 1;
const MACRO_KEYS = ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g'];
const ALL_KEYS = MACRO_KEYS.concat(NUTS.map(n => n.key));
const EXCLUDE_RE = /natto|pumpkin|chia|sardine|almond|cacao|cocoa|brazil/i;
const OLD_PROTEIN = { mince: 'beef_mince', thigh: 'chicken_thigh', salmon: 'salmon_wild', venison: 'venison', bison: 'bison', steak: 'steak' };
const OLD_FRUIT = { kiwi: 'kiwi_gold', mango: 'mango', banana: 'banana', apple: 'apple', mandarin: 'mandarin', orange: 'orange', pineapple: 'pineapple' };
let _uidn = 0;

function blankFoodDay() { return { items: [], skip: [] }; }
function isExcludedFood(id, name) { return EXCLUDE_RE.test(String(id || '')) || EXCLUDE_RE.test(String(name || '')); }
function cleanFoodName(v) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
function safeUid(id) { return typeof id === 'string' && /^[a-zA-Z0-9_-]{2,24}$/.test(id) ? id : ''; }
function newUid() {
  _uidn += 1;
  const r = Math.floor(Math.random() * 1e6).toString(36);
  return ('f' + _uidn.toString(36) + r).slice(0, 24);
}
function clampG(v) {
  const n = Math.round(Number(v));
  if (!isFinite(n) || n <= 0 || n > 2500) return 0;
  return n;
}
function finite(v, max) {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!isFinite(n) || n < 0 || n > max) return null;
  return n;
}
function foodName(id) { return (LIB[id] && LIB[id].short) || String(id || ''); }
function mealById(id) {
  for (const m of MEALS) if (m.id === id) return m;
  return null;
}
function mealIdOf(v) {
  const raw = String(v || '').trim().toLowerCase();
  const s = raw.replace(/[\s&_-]+/g, '');
  if (s === 'yoghurt' || s === 'yogurt' || s === 'breakfast' || s === 'brekkie' || s === 'yoghurtbowl') return 'yoghurt';
  if (s === 'egg' || s === 'eggs' || s === 'lunch' || s === 'eggmeal') return 'egg';
  if (s === 'bowl' || s === 'third' || s === 'dinner' || s === 'proteinbowl') return 'bowl';
  if (s === 'snacks' || s === 'snack' || s === 'drinks' || s === 'snacksdrinks') return 'snacks';
  for (const m of MEALS) if (m.id === raw || m.name.toLowerCase() === raw) return m.id;
  return '';
}
function slotIdOf(v) {
  const s = String(v || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (s === 'cooking_fat' || s === 'fat') return 'fat';
  if (s === 'seasonal_fruit' || s === 'fruit') return 'fruit';
  return SWAPS[s] ? s : '';
}
function resolveFoodId(v) {
  const s = String(v || '').trim();
  if (!s) return '';
  if (LIB[s] && !isExcludedFood(s, LIB[s].name)) return s;
  const l = s.toLowerCase();
  const hits = [];
  for (const id of Object.keys(LIB)) {
    if (isExcludedFood(id, LIB[id].name)) continue;
    if (id.toLowerCase() === l || LIB[id].short.toLowerCase() === l || LIB[id].name.toLowerCase() === l) hits.push(id);
  }
  return hits.length === 1 ? hits[0] : '';
}
function normalisePicks(raw, snackSel) {
  const p = { protein: 'beef_mince', carb: 'rice', cheese: 'raw_cheddar', fat: 'butter', milk: 'milk_cow', fruit: 'kiwi_gold', mushrooms: false };
  const src = raw && typeof raw === 'object' ? raw : {};
  if (SWAPS.protein.grams[src.protein] != null) p.protein = src.protein;
  else if (OLD_PROTEIN[src.protein]) p.protein = OLD_PROTEIN[src.protein];
  if (src.meal3 === 'steak' && SWAPS.protein.grams.steak != null) p.protein = 'steak';
  if (SWAPS.carb.grams[src.carb] != null) p.carb = src.carb;
  else if (src.carb === 'sweet') p.carb = 'sweet_potato';
  if (SWAPS.cheese.grams[src.cheese] != null) p.cheese = src.cheese;
  if (SWAPS.fat.grams[src.fat] != null) p.fat = src.fat;
  if (SWAPS.milk.grams[src.milk] != null) p.milk = src.milk;
  if (SWAPS.fruit.grams[src.fruit] != null) p.fruit = src.fruit;
  else if (snackSel && OLD_FRUIT[snackSel.fruit] && SWAPS.fruit.grams[src.fruit] == null) p.fruit = OLD_FRUIT[snackSel.fruit];
  if (src.mushrooms === true || src.mushrooms === 'true') p.mushrooms = true;
  return p;
}
function resolveItem(item, picks) {
  if (!item.slot) return { id: item.id, g: item.g, slot: '' };
  const slot = item.slot;
  const chosen = picks && SWAPS[slot] && SWAPS[slot].grams[picks[slot]] != null ? picks[slot] : item.id;
  const g = SWAPS[slot] && SWAPS[slot].grams[chosen] != null ? SWAPS[slot].grams[chosen] : item.g;
  return { id: chosen, g: g, slot: slot };
}
function resolveMeal(meal, picks) {
  const p = normalisePicks(picks);
  return {
    id: meal.id, name: meal.name, when: meal.when || '',
    items: meal.items.map(it => resolveItem(it, p)),
    optional: (meal.optional || []).map(it => ({ id: it.id, g: it.g, slot: '' }))
  };
}
function skipKey(meal, id) { return meal + ':' + id; }
function isSkipped(day, meal, id) {
  return !!(day && Array.isArray(day.skip) && day.skip.indexOf(skipKey(meal, id)) !== -1);
}
function addSkip(day, meal, id) {
  if (!meal || !id) return;
  const key = skipKey(meal, id);
  if (day.skip.indexOf(key) === -1 && day.skip.length < 40) day.skip.push(key);
}
function clearSkip(day, meal, id) {
  const key = skipKey(meal, id);
  day.skip = day.skip.filter(k => k !== key);
}
function makeItem(spec, meal) {
  return {
    uid: newUid(), id: spec.id, g: spec.g,
    meal: meal || spec.meal || '', slot: spec.slot || '', edited: false
  };
}
function planGrams(id, meal, picks) {
  if (meal) {
    const m = mealById(meal);
    if (m) {
      const plan = resolveMeal(m, picks);
      for (const it of plan.items) if (it.id === id) return it.g;
      for (const it of plan.optional) if (it.id === id) return it.g;
    }
  }
  for (const slot of Object.keys(SWAPS)) {
    if (picks && picks[slot] === id && SWAPS[slot].grams[id] != null) return SWAPS[slot].grams[id];
  }
  return LIB[id] ? LIB[id].g : 0;
}
function sanitiseItem(raw, seen) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.estimate) {
    const name = cleanFoodName(raw.name);
    if (!name) return null;
    const uid = safeUid(raw.uid) && !seen[raw.uid] ? raw.uid : newUid();
    seen[uid] = 1;
    if (raw.flat && raw.tot && typeof raw.tot === 'object') {
      const tot = {};
      let any = false;
      for (const k of ALL_KEYS) {
        const n = finite(raw.tot[k], 100000);
        if (n != null && n > 0) { tot[k] = n; any = true; }
      }
      if (!any || tot.kcal == null) return null;
      return { uid, estimate: true, flat: true, name, g: 0, tot, per: {}, meal: '', slot: '' };
    }
    const g = clampG(raw.g);
    if (!g) return null;
    const per = {};
    const src = raw.per && typeof raw.per === 'object' ? raw.per : {};
    for (const k of ALL_KEYS) {
      const n = finite(src[k], 100000);
      if (n != null) per[k] = n;
    }
    if (per.kcal == null) return null;
    return { uid, estimate: true, name, g, per, meal: '', slot: '' };
  }
  const id = resolveFoodId(raw.id);
  if (!id) return null;
  const g = clampG(raw.g);
  if (!g) return null;
  const uid = safeUid(raw.uid) && !seen[raw.uid] ? raw.uid : newUid();
  seen[uid] = 1;
  const meal = mealIdOf(raw.meal);
  const slot = slotIdOf(raw.slot);
  return { uid, id, g, meal, slot, edited: !!raw.edited };
}
function legacyCustom(c) {
  if (!c || typeof c !== 'object' || c.eaten === false) return null;
  const name = cleanFoodName(c.name);
  const kcal = finite(c.kcal, 4000), p = finite(c.p, 300), carbs = finite(c.c, 500), f = finite(c.f, 300);
  if (!name || kcal == null || p == null || carbs == null || f == null) return null;
  return { uid: safeUid(c.id) || newUid(), estimate: true, flat: true, name, g: 0, tot: { kcal, protein_g: p, carbs_g: carbs, fat_g: f }, per: {}, meal: '', slot: '' };
}
function legacySnackItem(id, portion) {
  const p = portion && portion !== true && portion !== false ? String(portion) : '';
  if (id === 'carrot') return makeItem({ id: 'carrot', g: 100, slot: '' }, 'snacks');
  if (id === 'broth') return makeItem({ id: 'bone_broth', g: 250, slot: '' }, 'snacks');
  if (id === 'cheddar') return makeItem({ id: 'raw_cheddar', g: 30, slot: '' }, '');
  if (id === 'parmesan') return makeItem({ id: 'raw_parmesan', g: 30, slot: '' }, '');
  if (id === 'fruit') {
    const fid = OLD_FRUIT[p] || 'kiwi_gold';
    return makeItem({ id: fid, g: SWAPS.fruit.grams[fid] || 200, slot: 'fruit' }, 'snacks');
  }
  if (id === 'oj') {
    const ml = p === '250' ? 250 : 150;
    return makeItem({ id: 'orange_juice', g: Math.round(258 * ml / 250), slot: '' }, 'snacks');
  }
  if (id === 'kefir') return makeItem({ id: 'kefir', g: p === '100' ? 100 : 200, slot: '' }, '');
  if (id === 'xmilk') {
    const ml = p === '250' ? 250 : 150;
    return makeItem({ id: 'milk_cow', g: Math.round(258 * ml / 250), slot: '' }, '');
  }
  if (id === 'dates') {
    const n = p === '1' ? 1 : p === '3' ? 3 : 2;
    const kcal = [0, 65, 135, 200][n];
    const g = n * 24;
    return { uid: newUid(), estimate: true, name: n + ' Medjool date' + (n > 1 ? 's' : ''), g, per: { kcal: kcal * 100 / g, protein_g: 0, carbs_g: (kcal / 4) * 100 / g, fat_g: 0 }, meal: '', slot: '' };
  }
  const est = {
    pom: ['Pomegranate', 100, 85, 2, 15, 1],
    berries: ['Extra berries', 100, 45, 1, 7, 0],
    gorgonzola: ['Gorgonzola', 30, 105, 6, 1, 9],
    pomjuice: ['Pomegranate juice', 150, 80, 0, 20, 0],
    cherry: ['Tart-cherry juice', 150, 80, 0, 18, 0],
    pollen: ['Bee pollen', 5, 20, 1, 2, 0],
    ferment: ['Ferment', 50, 10, 0, 1, 0],
    ice: ['Ice cream', 60, 125, 2, 14, 7]
  }[id];
  if (!est) return null;
  const g = est[1];
  const per = { kcal: est[2] * 100 / g, protein_g: est[3] * 100 / g, carbs_g: est[4] * 100 / g, fat_g: est[5] * 100 / g };
  return { uid: newUid(), estimate: true, name: est[0], g, per, meal: '', slot: '' };
}
function pushMealItems(day, mealId, picks) {
  const meal = mealById(mealId);
  if (!meal) return 0;
  const plan = resolveMeal(meal, picks);
  let n = 0;
  const list = plan.items.slice();
  if (mealId === 'egg' && picks.mushrooms) list.push.apply(list, plan.optional);
  for (const it of list) {
    if (isSkipped(day, mealId, it.id)) continue;
    const existing = day.items.find(x => x.id === it.id && x.meal === mealId);
    if (existing) {
      if (!existing.edited && existing.g !== it.g) { existing.g = it.g; existing.slot = it.slot || ''; n++; }
      continue;
    }
    if (day.items.length >= MAX_ITEMS) break;
    day.items.push(makeItem(it, mealId));
    n++;
  }
  return n;
}
function legacyDay(raw, picks, snackSel) {
  const day = blankFoodDay();
  const meals = raw.meals && typeof raw.meals === 'object' ? raw.meals : {};
  if (meals.yoghurt) pushMealItems(day, 'yoghurt', picks);
  if (meals.egg) pushMealItems(day, 'egg', picks);
  if (meals.third) pushMealItems(day, 'bowl', picks);
  const eaten = raw.snacks && typeof raw.snacks === 'object' && !Array.isArray(raw.snacks) ? raw.snacks : {};
  const sel = snackSel || {};
  for (const id of Object.keys(eaten)) {
    if (!eaten[id]) continue;
    const item = legacySnackItem(id, sel[id]);
    if (!item) continue;
    if (item.id && day.items.some(x => x.id === item.id && x.meal === item.meal)) continue;
    if (day.items.length < MAX_ITEMS) day.items.push(item);
  }
  const custom = Array.isArray(raw.custom) ? raw.custom : [];
  custom.forEach(c => {
    const item = legacyCustom(c);
    if (item && day.items.length < MAX_ITEMS) day.items.push(item);
  });
  return day;
}
function normaliseFoodDay(raw, picks, snackSel) {
  const p = normalisePicks(picks, snackSel);
  if (!raw || typeof raw !== 'object') return blankFoodDay();
  if (Array.isArray(raw.items)) {
    const day = blankFoodDay();
    const seen = {};
    for (const item of raw.items) {
      if (day.items.length >= MAX_ITEMS) break;
      const clean = sanitiseItem(item, seen);
      if (clean) day.items.push(clean);
    }
    if (Array.isArray(raw.skip)) {
      for (const s of raw.skip) {
        if (typeof s === 'string' && /^[a-z]+:[a-z0-9_]+$/.test(s) && day.skip.indexOf(s) === -1 && day.skip.length < 40) day.skip.push(s);
      }
    }
    return day;
  }
  if (raw.meals || raw.snacks || raw.custom) return legacyDay(raw, p, snackSel);
  return blankFoodDay();
}
function loadFoodState(src) {
  const raw = src && typeof src === 'object' ? src : {};
  const snackSel = raw.v === 4 ? null : (raw.snacks && typeof raw.snacks === 'object' && !Array.isArray(raw.snacks) ? raw.snacks : null);
  const picks = normalisePicks(raw.picks, snackSel);
  const checksIn = raw.checks && typeof raw.checks === 'object' && !Array.isArray(raw.checks) ? raw.checks : {};
  const checks = {};
  for (const k of Object.keys(checksIn)) if (checksIn[k]) checks[String(k).slice(0, 40)] = true;
  const daysIn = raw.days && typeof raw.days === 'object' && !Array.isArray(raw.days) ? raw.days : {};
  const days = {};
  for (const k of Object.keys(daysIn)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) continue;
    days[k] = normaliseFoodDay(daysIn[k], picks, snackSel);
  }
  return { picks, checks, days };
}
function cloneFoodState(st) {
  return loadFoodState({ picks: st && st.picks, snacks: st && st.snacks, checks: st && st.checks, days: st && st.days, v: st && st.v });
}
function ensureDay(state, date) {
  if (!state.days[date]) state.days[date] = blankFoodDay();
  return state.days[date];
}
function itemNutrients(item) {
  const out = {};
  for (const k of ALL_KEYS) out[k] = 0;
  if (!item) return out;
  if (item.flat && item.tot) {
    for (const k of ALL_KEYS) {
      const v = Number(item.tot[k]);
      if (isFinite(v) && v > 0) out[k] = v;
    }
    return out;
  }
  const per = item.estimate ? item.per : (LIB[item.id] && LIB[item.id].per);
  const g = Number(item.g) || 0;
  if (!per || !g) return out;
  for (const k of ALL_KEYS) {
    const v = Number(per[k]);
    if (isFinite(v) && v > 0) out[k] = v * g / 100;
  }
  return out;
}
function sumNutrients(list) {
  const out = {};
  for (const k of ALL_KEYS) out[k] = 0;
  for (const n of list) for (const k of ALL_KEYS) out[k] += n[k] || 0;
  return out;
}
function formatAmount(n) {
  if (!isFinite(n)) return '0';
  const r = Math.abs(n) >= 20 ? Math.round(n) : Math.round(n * 10) / 10;
  return String(r);
}
function nutrientPct(value, target) {
  if (!target) return 0;
  return Math.max(0, Math.round(value / target * 100));
}
function servingAmount(id, key) {
  const food = LIB[id];
  if (!food) return 0;
  const v = Number(food.per[key]);
  if (!isFinite(v) || v <= 0) return 0;
  return v * food.g / 100;
}
function suggestionsFor(key, eaten) {
  const target = SILLZ[key];
  if (!target) return [];
  const rows = [];
  for (const id of Object.keys(LIB)) {
    if (eaten && eaten[id]) continue;
    if (isExcludedFood(id, LIB[id].name)) continue;
    const amt = servingAmount(id, key);
    if (!(amt > 0)) continue;
    rows.push({ id, amt, preferred: !!PREFERRED[id], label: LIB[id].short + ', ' + LIB[id].g + ' g' });
  }
  function take(minFrac) {
    const min = target * minFrac;
    const pool = rows.filter(r => r.amt >= min);
    pool.sort((a, b) => (a.preferred === b.preferred ? b.amt - a.amt : (a.preferred ? -1 : 1)));
    return pool.slice(0, 2);
  }
  const best = take(0.05);
  return best.length ? best : take(0.02);
}
function mealTickState(day, meal, picks) {
  const d = day || blankFoodDay();
  const plan = resolveMeal(meal, picks);
  const logged = d.items.filter(i => i.meal === meal.id);
  if (!logged.length) return 'off';
  const need = plan.items.filter(it => !isSkipped(d, meal.id, it.id));
  const have = need.filter(it => logged.some(l => l.id === it.id)).length;
  if (need.length && have >= need.length) return 'on';
  return 'part';
}
function dayReport(st, date) {
  const state = loadFoodState(st && st.days ? { picks: st.picks, snacks: st.snacks, checks: st.checks, days: st.days, v: st.v } : (st || {}));
  const day = state.days[date] || blankFoodDay();
  const sum = sumNutrients(day.items.map(itemNutrients));
  const eaten = {};
  let estimate = false;
  for (const item of day.items) {
    if (item.id) eaten[item.id] = 1;
    if (item.estimate) estimate = true;
  }
  const macros = { kcal: sum.kcal, p: sum.protein_g, c: sum.carbs_g, f: sum.fat_g };
  const macroBars = [
    { key: 'kcal', name: 'Calories', value: macros.kcal, target: TARGETS.kcal, unit: '', pct: nutrientPct(macros.kcal, TARGETS.kcal) },
    { key: 'p', name: 'Protein', value: macros.p, target: TARGETS.protein, unit: 'g', pct: nutrientPct(macros.p, TARGETS.protein) },
    { key: 'c', name: 'Carbs', value: macros.c, target: TARGETS.carbs, unit: 'g', pct: nutrientPct(macros.c, TARGETS.carbs) },
    { key: 'f', name: 'Fat', value: macros.f, target: TARGETS.fat, unit: 'g', pct: nutrientPct(macros.f, TARGETS.fat) }
  ];
  for (const b of macroBars) b.hit = b.pct >= 100;
  const nutrients = NUTS.map(n => {
    const value = sum[n.key] || 0;
    const pct = nutrientPct(value, SILLZ[n.key]);
    return { key: n.key, name: n.name, unit: n.unit, value, target: SILLZ[n.key], pct, hit: pct >= 100, hard: !!n.hard, note: FOOD_PLAN.hardNotes[n.key] || '' };
  });
  const lows = nutrients.filter(n => !n.hard && !n.hit).map(n => {
    const copy = Object.assign({}, n);
    copy.suggestions = suggestionsFor(n.key, eaten).map(s => ({ id: s.id, label: s.label }));
    return copy;
  });
  lows.sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name));
  return {
    hasLog: day.items.length > 0, estimate, macros, targets: TARGETS, macroBars,
    nutrients, lows, hard: nutrients.filter(n => n.hard), day, picks: state.picks
  };
}
function lowReply(st, date) {
  const r = dayReport(st, date);
  if (!r.hasLog) return 'Nothing logged yet. Tick a meal, or tell me what you ate.';
  const lines = r.lows.slice(0, 4).map(n => {
    const sug = n.suggestions.slice(0, 2).map(s => s.label).join(' or ');
    return n.name + ' is at ' + n.pct + '%' + (sug ? '. ' + sug + ' would help' : '');
  });
  let text = lines.length ? lines.join('. ') + '.' : 'The Sillz targets you can hit with food are covered.';
  const hardLow = r.hard.filter(h => !h.hit);
  if (hardLow.length) text += ' Vitamin D and K2 are the known hard ones: K2 is about 12% without natto, and vitamin D needs sun or salmon.';
  return text;
}
function macroReply(st, date, which) {
  const r = dayReport(st, date);
  if (which === 'kcal') {
    const left = r.targets.kcal - r.macros.kcal;
    if (!r.hasLog) return 'Nothing logged yet. The day is about 2,750 kcal.';
    if (left >= 0) return 'About ' + Math.round(left) + ' kcal left of the 2,750 kcal day.';
    return 'About ' + Math.round(-left) + ' kcal over the 2,750 kcal day.';
  }
  const left = r.targets.protein - r.macros.p;
  if (!r.hasLog) return 'Nothing logged yet. Protein target is 178 g.';
  if (left >= 0) return 'Protein left today is about ' + Math.round(left) + ' g of the 178 g target.';
  return 'Protein is about ' + Math.round(-left) + ' g over the 178 g target.';
}
function localFoodAnswer(text, st, date) {
  const t = String(text || '').toLowerCase();
  if (!t.trim()) return '';
  const logging = /\d+\s*g\b|\b(had|ate|eaten|skip|skipped|instead|brekkie|breakfast|lunch|dinner|snack|yoghurt|yogurt)\b/.test(t);
  if (logging) return '';
  if (/\b(low|short|missing|gap|deficient)\b|micronutrient|what am i low|what(?:'s| is) low/.test(t)) return lowReply(st, date);
  if (/protein/.test(t) && /(left|remain|target|how much|have i)/.test(t)) return macroReply(st, date, 'protein');
  if (/(calor|kcal|energy)/.test(t) && /(left|remain|target|how much|have i)/.test(t)) return macroReply(st, date, 'kcal');
  return '';
}

function upsertFood(state, date, spec) {
  const id = resolveFoodId(spec.id);
  if (!id) return { skip: 'Unknown food' };
  if (isExcludedFood(id, LIB[id].name)) return { skip: foodName(id) + ' is not in the plan' };
  const meal = mealIdOf(spec.meal);
  const g = clampG(spec.grams != null ? spec.grams : spec.g) || planGrams(id, meal, state.picks);
  if (!g) return { skip: 'Need an amount in grams' };
  const day = ensureDay(state, date);
  const slot = slotIdOf(spec.slot);
  let item = meal
    ? day.items.find(x => x.id === id && x.meal === meal)
    : day.items.find(x => x.id === id);
  if (item && item.g === g && (!meal || item.meal === meal) && (!slot || item.slot === slot)) return {};
  if (meal) clearSkip(day, meal, id);
  if (item) {
    item.g = g;
    if (meal) item.meal = meal;
    if (slot) item.slot = slot;
    item.edited = true;
    return { change: foodName(id) + ' set to ' + g + ' g' };
  }
  if (day.items.length >= MAX_ITEMS) return { skip: 'Too many foods today' };
  day.items.push(makeItem({ id, g, slot }, meal));
  return { change: foodName(id) + ' ' + g + ' g added' };
}
function removeFood(state, date, spec) {
  const day = ensureDay(state, date);
  if (spec.uid) {
    const item = day.items.find(x => x.uid === spec.uid);
    if (!item) return { skip: 'That food is not on today' };
    day.items = day.items.filter(x => x.uid !== spec.uid);
    if (item.meal && item.id) addSkip(day, item.meal, item.id);
    if (item.id === 'uv_mushrooms') state.picks.mushrooms = false;
    return { change: (item.estimate ? item.name : foodName(item.id)) + ' removed' };
  }
  const id = resolveFoodId(spec.id);
  if (!id) return { skip: 'Unknown food' };
  const meal = mealIdOf(spec.meal);
  const before = day.items.length;
  day.items = day.items.filter(x => !(x.id === id && (!meal || x.meal === meal)));
  if (meal) addSkip(day, meal, id);
  else {
    for (const m of MEALS) if (m.items.some(it => it.id === id) || (m.optional || []).some(it => it.id === id)) addSkip(day, m.id, id);
  }
  const mushWas = state.picks.mushrooms;
  if (id === 'uv_mushrooms') state.picks.mushrooms = false;
  if (day.items.length === before) return mushWas && id === 'uv_mushrooms' ? { change: 'Mushrooms left off' } : {};
  return { change: foodName(id) + ' removed' };
}
function addEstimate(state, date, action) {
  const day = ensureDay(state, date);
  if (day.items.length >= MAX_ITEMS) return { skip: 'Too many foods today' };
  const name = cleanFoodName(action.name);
  const g = clampG(action.grams != null ? action.grams : action.g);
  const kcal = finite(action.kcal, 4000);
  const p = finite(action.protein_g != null ? action.protein_g : action.p, 300);
  const c = finite(action.carbs_g != null ? action.carbs_g : action.c, 500);
  const f = finite(action.fat_g != null ? action.fat_g : action.f, 300);
  if (!name || !g || kcal == null || p == null || c == null || f == null) return { skip: 'An estimate needs a name, grams, calories, protein, carbs and fat' };
  const portion = { kcal, protein_g: p, carbs_g: c, fat_g: f };
  if (action.fibre_g != null || action.fibre != null) portion.fibre_g = finite(action.fibre_g != null ? action.fibre_g : action.fibre, 200) || 0;
  for (const n of NUTS) {
    if (action[n.key] != null) {
      const v = finite(action[n.key], 100000);
      if (v != null) portion[n.key] = v;
    }
  }
  const per = {};
  for (const k of Object.keys(portion)) per[k] = portion[k] * 100 / g;
  day.items.push({ uid: newUid(), estimate: true, name, g, per, meal: '', slot: '' });
  return { change: 'Added estimate: ' + name + ', about ' + Math.round(kcal) + ' kcal' };
}
function applyOne(state, action, date) {
  if (!action || typeof action !== 'object') return { skip: 'Empty action' };
  const op = String(action.op || action.type || '');
  if (op === 'add' || op === 'update') return upsertFood(state, date, action);
  if (op === 'remove' || op === 'delete') return removeFood(state, date, action);
  if (op === 'add_estimate') return addEstimate(state, date, action);
  if (op === 'add_meal') {
    const meal = mealIdOf(action.meal);
    if (!meal) return { skip: 'Unknown meal' };
    const on = aiOn(action.mushrooms);
    if (meal === 'egg' && on === true) state.picks.mushrooms = true;
    if (meal === 'egg' && on === false) {
      state.picks.mushrooms = false;
      addSkip(ensureDay(state, date), 'egg', 'uv_mushrooms');
    }
    const n = pushMealItems(ensureDay(state, date), meal, state.picks);
    return n ? { change: mealById(meal).name + ' logged' } : {};
  }
  if (op === 'clear_meal') {
    const meal = mealIdOf(action.meal);
    if (!meal) return { skip: 'Unknown meal' };
    const day = ensureDay(state, date);
    const before = day.items.length;
    day.items = day.items.filter(i => i.meal !== meal);
    if (day.items.length === before) return {};
    return { change: mealById(meal).name + ' cleared' };
  }
  if (op === 'set_swap') {
    const slot = slotIdOf(action.slot || action.key);
    const id = resolveFoodId(action.id || action.value);
    if (!slot || !SWAPS[slot]) return { skip: 'Unknown swap' };
    if (!id || SWAPS[slot].grams[id] == null) return { skip: 'That swap is not on the plate' };
    const prev = state.picks[slot];
    const day = ensureDay(state, date);
    let replaced = 0;
    if (prev !== id) state.picks[slot] = id;
    for (const item of day.items) {
      if (item.slot !== slot && !(item.id === prev && item.slot === slot)) continue;
      if (item.id === id && item.g === SWAPS[slot].grams[id]) continue;
      item.id = id;
      item.g = SWAPS[slot].grams[id];
      item.slot = slot;
      item.edited = false;
      replaced++;
    }
    if (prev === id && !replaced) return {};
    let msg = SWAPS[slot].label + ' set to ' + foodName(id);
    if (replaced) msg += ' on today\'s log';
    return { change: msg };
  }
  if (op === 'set_mushrooms') {
    const on = aiOn(action.on != null ? action.on : action.mushrooms);
    if (on == null) return { skip: 'Say whether mushrooms are in' };
    const day = ensureDay(state, date);
    if (on) {
      const was = state.picks.mushrooms;
      state.picks.mushrooms = true;
      clearSkip(day, 'egg', 'uv_mushrooms');
      const eggOn = day.items.some(i => i.meal === 'egg');
      const has = day.items.some(i => i.id === 'uv_mushrooms' && i.meal === 'egg');
      if (eggOn && !has && day.items.length < MAX_ITEMS) {
        day.items.push(makeItem({ id: 'uv_mushrooms', g: 100, slot: '' }, 'egg'));
        return { change: 'Mushrooms added' };
      }
      return was || has ? {} : { change: 'Mushrooms will be included with the egg meal' };
    }
    const was = state.picks.mushrooms;
    state.picks.mushrooms = false;
    addSkip(day, 'egg', 'uv_mushrooms');
    const before = day.items.length;
    day.items = day.items.filter(i => !(i.id === 'uv_mushrooms' && (!i.meal || i.meal === 'egg')));
    const removed = day.items.length !== before;
    if (!removed && !was) return {};
    return { change: removed ? 'Mushrooms removed' : 'Mushrooms left off' };
  }
  return { skip: 'Unknown action' };
}
function aiOn(v) {
  if (v === true || v === 'true' || v === 1 || v === '1') return true;
  if (v === false || v === 'false' || v === 0 || v === '0') return false;
  return null;
}
function applyFoodActions(st, actions, date) {
  const state = cloneFoodState(st || {});
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date || ''))) return { state, changes: [], skipped: ['Bad date'], changed: false };
  ensureDay(state, date);
  const changes = [], skipped = [];
  const list = Array.isArray(actions) ? actions : [];
  if (list.length > MAX_ACTIONS) skipped.push('Extra actions were ignored');
  for (const action of list.slice(0, MAX_ACTIONS)) {
    const r = applyOne(state, action, date);
    if (r.change) changes.push(r.change);
    if (r.skip) skipped.push(r.skip);
  }
  return { state, changes, skipped, changed: changes.length > 0 };
}
function setItemGrams(st, date, uid, grams) {
  const state = cloneFoodState(st || {});
  const day = state.days[date];
  const item = day && day.items.find(i => i.uid === uid);
  const g = clampG(grams);
  if (!item || item.flat || !g || item.g === g) return { state, changed: false };
  item.g = g;
  item.edited = true;
  return { state, changed: true };
}
function removeItem(st, date, uid) {
  return applyFoodActions(st, [{ op: 'remove', uid }], date);
}

function libraryLines() {
  return Object.keys(LIB).map(id => id + ' | ' + LIB[id].short + ' | ' + LIB[id].g + ' g').join('\n');
}
function foodAiContext(st, date) {
  const state = loadFoodState(st && st.days ? st : {});
  const report = dayReport(state, date);
  const day = state.days[date] || blankFoodDay();
  return {
    date,
    targets: TARGETS,
    sillz: SILLZ,
    eaten: { kcal: Math.round(report.macros.kcal), protein: Math.round(report.macros.p), carbs: Math.round(report.macros.c), fat: Math.round(report.macros.f) },
    proteinLeft: Math.round(TARGETS.protein - report.macros.p),
    kcalLeft: Math.round(TARGETS.kcal - report.macros.kcal),
    picks: state.picks,
    log: day.items.map(item => ({
      id: item.estimate ? '' : item.id,
      name: item.estimate ? item.name : foodName(item.id),
      grams: item.g,
      meal: item.meal || '',
      estimate: !!item.estimate
    })),
    low: report.lows.map(n => ({ name: n.name, pct: n.pct, suggestions: n.suggestions.map(s => s.label) })),
    hard: report.hard.filter(h => !h.hit).map(h => ({ name: h.name, pct: h.pct, note: h.note })),
    meals: MEALS.map(m => {
      const plan = resolveMeal(m, state.picks);
      return { id: m.id, name: m.name, items: plan.items.map(it => ({ id: it.id, grams: it.g })), optional: plan.optional.map(it => ({ id: it.id, grams: it.g })) };
    }),
    swaps: {
      protein: SWAPS.protein.ids, carb: SWAPS.carb.ids, cheese: SWAPS.cheese.ids,
      fat: SWAPS.fat.ids, milk: SWAPS.milk.ids, fruit: SWAPS.fruit.ids
    }
  };
}
function foodAiSystem(st, date) {
  const today = foodAiContext(st, date);
  return [
    'You are Ask AI in Lockie\'s training app. He tells you what he ate, or asks about today. Reply in Australian English. One or two short sentences. Say yoghurt, not yogurt.',
    'Call update_food every time. The reply is what he reads. The actions list is the only way to change the log. Use an empty actions list for questions. Never claim a change that is not in actions.',
    'The app multiplies the food library by grams. Never invent calorie or nutrient totals. If he asks what he is low on, answer from TODAY.low and TODAY.hard only. K2 and vitamin D are known hard gaps: mention the note, do not nag.',
    'Library ids (id | name | default grams):',
    libraryLines(),
    'Operations. food id must be a library id. grams are the amount he ate, not per 100 g:',
    '{"op":"add","id":"<id>","grams":0,"meal":"yoghurt|egg|bowl|snacks"} — sets that food to this amount. Does not stack on what is already logged.',
    '{"op":"update","id":"<id>","grams":0,"meal":"..."}',
    '{"op":"remove","id":"<id>","meal":"..."} — skip that food. Use this for "no mushrooms" (id uv_mushrooms, meal egg).',
    '{"op":"add_meal","meal":"yoghurt|egg|bowl|snacks","mushrooms":false} — log the current plate. Mushrooms are optional and off unless he includes them.',
    '{"op":"set_swap","slot":"protein|carb|cheese|fat|milk|fruit","id":"<id from TODAY.swaps>"} — mango instead of kiwi is slot fruit, id mango.',
    '{"op":"add_estimate","name":"...","grams":0,"kcal":0,"protein_g":0,"carbs_g":0,"fat_g":0} — only for food that is not in the library. Values are for the amount he ate. Add a micronutrient field only when you can give a fair number. The app marks it as an estimate.',
    'Do not add natto, pumpkin seeds, chia, sardines, almonds, cacao, or Brazil nuts. They are not in this plan. If he mentions pumpkin seeds, ignore them.',
    'Brekkie is the yoghurt bowl (berries already include blackberries). Lunch is the egg meal. Dinner is the protein bowl. Snacks are seasonal fruit, carrot, orange juice, bone broth, and milk.',
    'No markdown. Do not undo; the app has Undo.',
    'TODAY:',
    JSON.stringify(today)
  ].join('\n');
}

const FOOD_AI_TOOL = {
  name: 'update_food',
  description: 'Answer Lockie and optionally update today\'s food log. Always call this. Leave actions empty when nothing should change. Amounts are grams of a library food. The app calculates nutrients.',
  parameters: {
    type: 'OBJECT',
    properties: {
      reply: { type: 'STRING', description: 'One or two short sentences in Australian English. No markdown.' },
      actions: {
        type: 'ARRAY',
        description: 'Log changes. Empty for a question.',
        items: {
          type: 'OBJECT',
          properties: {
            op: { type: 'STRING', enum: ['add', 'remove', 'update', 'add_meal', 'clear_meal', 'set_swap', 'set_mushrooms', 'add_estimate'] },
            id: { type: 'STRING' },
            grams: { type: 'NUMBER' },
            meal: { type: 'STRING', enum: ['yoghurt', 'egg', 'bowl', 'snacks'] },
            slot: { type: 'STRING', enum: ['protein', 'carb', 'cheese', 'fat', 'milk', 'fruit'] },
            mushrooms: { type: 'BOOLEAN' },
            on: { type: 'BOOLEAN' },
            name: { type: 'STRING' },
            kcal: { type: 'NUMBER' },
            protein_g: { type: 'NUMBER' },
            carbs_g: { type: 'NUMBER' },
            fat_g: { type: 'NUMBER' },
            fibre_g: { type: 'NUMBER' },
            A_ug: { type: 'NUMBER' }, B1_mg: { type: 'NUMBER' }, B2_mg: { type: 'NUMBER' }, B3_mg: { type: 'NUMBER' },
            B5_mg: { type: 'NUMBER' }, B6_mg: { type: 'NUMBER' }, folate_ug: { type: 'NUMBER' }, B12_ug: { type: 'NUMBER' },
            C_mg: { type: 'NUMBER' }, D_ug: { type: 'NUMBER' }, E_mg: { type: 'NUMBER' }, K1_ug: { type: 'NUMBER' }, K2_ug: { type: 'NUMBER' },
            calcium_mg: { type: 'NUMBER' }, copper_mg: { type: 'NUMBER' }, iron_mg: { type: 'NUMBER' }, magnesium_mg: { type: 'NUMBER' },
            manganese_mg: { type: 'NUMBER' }, phosphorus_mg: { type: 'NUMBER' }, potassium_mg: { type: 'NUMBER' }, selenium_ug: { type: 'NUMBER' }, zinc_mg: { type: 'NUMBER' }
          },
          required: ['op']
        }
      }
    },
    required: ['reply', 'actions']
  }
};

function geminiContents(history, userText) {
  const turns = [];
  const prior = Array.isArray(history) ? history.slice(-6) : [];
  for (const m of prior) {
    if (!m || m.local) continue;
    if (m.role !== 'user' && m.role !== 'model') continue;
    const role = m.role === 'model' ? 'model' : 'user';
    const text = String(m.text || '').slice(0, 500);
    if (!text) continue;
    if (turns.length && turns[turns.length - 1].role === role) turns[turns.length - 1].parts[0].text += '\n' + text;
    else turns.push({ role, parts: [{ text }] });
  }
  const text = String(userText || '').slice(0, 1000);
  if (turns.length && turns[turns.length - 1].role === 'user') turns[turns.length - 1].parts[0].text += '\n' + text;
  else turns.push({ role: 'user', parts: [{ text }] });
  while (turns.length && turns[0].role === 'model') turns.shift();
  return turns;
}
function geminiRequestBody(st, date, history, userText) {
  return {
    systemInstruction: { parts: [{ text: foodAiSystem(st, date) }] },
    contents: geminiContents(history, userText),
    tools: [{ functionDeclarations: [FOOD_AI_TOOL] }],
    toolConfig: { functionCallingConfig: { mode: 'ANY', allowedFunctionNames: ['update_food'] } },
    generationConfig: { temperature: 0.2, maxOutputTokens: 2048, thinkingConfig: { thinkingLevel: 'LOW' } }
  };
}
function parseGeminiFood(data) {
  if (!data || typeof data !== 'object') {
    const err = new Error('empty'); err.code = 'empty'; throw err;
  }
  if (data.error) {
    const err = new Error(data.error.message || 'api');
    err.code = data.error.code || data.error.status || 0;
    throw err;
  }
  const cand = data.candidates && data.candidates[0];
  if (!cand) {
    const err = new Error('empty'); err.code = 'empty'; throw err;
  }
  const parts = (cand.content && cand.content.parts) || [];
  for (const p of parts) {
    const call = p.functionCall || p.function_call;
    if (!call) continue;
    if (call.name !== 'update_food') continue;
    let args = call.args || {};
    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch (e) { args = {}; }
    }
    const reply = String(args.reply || '').trim().slice(0, 600);
    const actions = Array.isArray(args.actions) ? args.actions : [];
    return { reply, actions };
  }
  const text = parts.map(p => p.text || '').join('').trim().slice(0, 600);
  if (text) {
    try {
      const j = JSON.parse(text);
      if (j && typeof j.reply === 'string') return { reply: j.reply.trim().slice(0, 600), actions: Array.isArray(j.actions) ? j.actions : [] };
    } catch (e) { /* plain text */ }
    return { reply: text, actions: [] };
  }
  const err = new Error('empty'); err.code = 'empty'; throw err;
}
function geminiErrorText(status, online) {
  if (online === false) return 'Ask AI needs internet.';
  if (status === 429) return 'Gemini is rate-limiting requests. Wait a minute and try again.';
  if (status === 401 || status === 403) return 'That API key was rejected. Check it, or remove it and paste a new one.';
  if (status === 400) return 'Gemini could not read that request. Try again in a moment.';
  if (status === 0) return 'Ask AI needs internet.';
  return 'Ask AI could not reply just then. Try again.';
}

/* Deterministic stand-in for Gemini. Used by tests and ?ai=mock. */
function mockGeminiFood(text) {
  const t = String(text || '').toLowerCase();
  const actions = [];
  const bits = [];
  if (/\b(brekkie|breakfast)\b/.test(t) || /\byoghurt\b/.test(t) || /\byogurt\b/.test(t)) {
    actions.push({ op: 'add_meal', meal: 'yoghurt' });
    bits.push('Yoghurt bowl logged');
  }
  if (/\b(lunch|egg meal)\b/.test(t) || /\beggs?\b/.test(t)) {
    actions.push({ op: 'add_meal', meal: 'egg', mushrooms: false });
    bits.push('Egg meal logged');
  }
  if (/\b(dinner)\b/.test(t) || /protein bowl/.test(t)) {
    actions.push({ op: 'add_meal', meal: 'bowl' });
    bits.push('Protein bowl logged');
  }
  if (/\bsnacks?\b/.test(t)) {
    actions.push({ op: 'add_meal', meal: 'snacks' });
    bits.push('Snacks logged');
  }
  if (/mushroom/.test(t) && /\b(no|skip|skipped|without|didn't|didnt|not)\b/.test(t)) {
    actions.push({ op: 'set_mushrooms', on: false });
    actions.push({ op: 'remove', id: 'uv_mushrooms', meal: 'egg' });
    bits.push('No mushrooms');
  } else if (/mushroom/.test(t) && /\b(with|add|had|include)\b/.test(t)) {
    actions.push({ op: 'set_mushrooms', on: true });
    bits.push('Mushrooms included');
  }
  if (/mango/.test(t) && /kiwi|instead|swap/.test(t)) {
    actions.push({ op: 'set_swap', slot: 'fruit', id: 'mango' });
    bits.push('Seasonal fruit is mango');
  }
  if (/sweet potato/.test(t)) {
    actions.push({ op: 'set_swap', slot: 'carb', id: 'sweet_potato' });
    bits.push('Carb is sweet potato');
  }
  const whey = t.match(/(\d+)\s*g\s*whey/);
  if (whey) actions.push({ op: 'update', id: 'whey', grams: Number(whey[1]), meal: 'yoghurt' });
  let reply = bits.join('. ');
  if (/pumpkin/.test(t)) reply = (reply ? reply + '. ' : '') + 'No pumpkin seeds in this plan.';
  if (/blackberr/.test(t)) reply = (reply ? reply + '. ' : '') + 'Blackberries stay in the berry mix.';
  if (!reply && !actions.length) reply = 'Tell me which meal you ate, or ask what you are low on.';
  else if (!reply) reply = 'Updated today.';
  return { reply, actions };
}
