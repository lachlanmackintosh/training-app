/* Food log. Pure helpers: no DOM, no network.
   Meal options, snacks and supplements are applied as add / remove / select operations.
   Grams x the food library is the only maths. Built-in gap suggester (no AI) at closeGaps(). */
const MAX_ACTIONS = 24;
const MAX_ITEMS = 40;
const LIB = FOOD_PLAN.library;
const MEALS = FOOD_PLAN.meals;
const SWAPS = FOOD_PLAN.swaps;
const SILLZ = FOOD_PLAN.sillz;
const NUTS = FOOD_PLAN.nutrients;
const TARGETS = FOOD_PLAN.targets;
const SLOTS = FOOD_PLAN.slots || [];
const SNACK_OPTS = FOOD_PLAN.snacks || [];
const SUPP_OPTS = FOOD_PLAN.supplements || [];
const OPTS = {};
for (const sl of SLOTS) for (const o of sl.options) OPTS[o.id] = { opt: o, meal: sl.id };
for (const o of SNACK_OPTS) OPTS[o.id] = { opt: o, meal: 'snacks' };
for (const o of SUPP_OPTS) OPTS[o.id] = { opt: o, meal: 'supps' };

const SEASON = {}; // libId -> months (1-12), from seasonal snack options
for (const o of SNACK_OPTS) if (Array.isArray(o.season)) SEASON[o.items[0].id] = o.season;
function monthOf(date) { const m = /^\d{4}-(\d{2})-\d{2}$/.exec(String(date || '')); return m ? Number(m[1]) : new Date().getMonth() + 1; }
function inSeason(o, date) { return !Array.isArray(o && o.season) || o.season.indexOf(monthOf(date)) !== -1; }
function snackOrder(list, date) { // in-season seasonal fruit first, out-of-season last; others keep place
  const fixed = list.filter(o => !Array.isArray(o.season)), fr = list.filter(o => Array.isArray(o.season));
  const ins = fr.filter(o => inSeason(o, date)), outs = fr.filter(o => !inSeason(o, date));
  const at = list.findIndex(o => Array.isArray(o.season));
  if (at < 0) return list.slice();
  const before = list.slice(0, at).filter(o => !Array.isArray(o.season)), after = fixed.filter(o => before.indexOf(o) === -1);
  return before.concat(ins, outs, after);
}
const PREFERRED = {};
for (const id of FOOD_PLAN.preferred) PREFERRED[id] = 1;
const MACRO_KEYS = ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g'];
const ALL_KEYS = MACRO_KEYS.concat(NUTS.map(n => n.key));
const EXCLUDE_RE = /natto|pumpkin|chia|sardine|almond|brazil/i;
const OLD_PROTEIN = { mince: 'beef_mince', thigh: 'chicken_thigh', salmon: 'salmon_wild', venison: 'venison', bison: 'bison', steak: 'steak' };
const OLD_FRUIT = { kiwi: 'kiwi_gold', mango: 'mango', banana: 'banana', apple: 'apple', mandarin: 'mandarin', orange: 'orange', pineapple: 'pineapple' };
let _uidn = 0;

function blankFoodDay() { return { items: [], skip: [], sel: {} }; }
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
  const n = Math.round(Number(v) * 10) / 10;
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
  if (s === 'supps' || s === 'supplements' || s === 'supplement' || s === 'supp') return 'supps';
  if (s === 'wake' || s === 'wakeup' || s === 'pretraining' || s === 'meal0') return 'wake';
  if (s === 'meal1') return 'yoghurt';
  if (s === 'meal2') return 'egg';
  if (s === 'meal3') return 'bowl';
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
  const out = { uid, id, g, meal, slot, edited: !!raw.edited };
  if (typeof raw.opt === 'string' && OPTS[raw.opt]) out.opt = raw.opt;
  if (raw.extra === true) out.extra = true;
  return out;
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
    if (raw.sel && typeof raw.sel === 'object') {
      for (const sl of SLOTS) {
        const v = raw.sel[sl.id];
        if (typeof v === 'string' && OPTS[v] && OPTS[v].meal === sl.id) day.sel[sl.id] = v;
      }
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
/* Friendly measures for foods where precision doesn't matter. Nutrition always uses the grams underneath. */
const FRACS = [[0.125, '⅛'], [0.25, '¼'], [1 / 3, '⅓'], [0.5, '½'], [2 / 3, '⅔'], [0.75, '¾'], [1, '1'], [1.5, '1½'], [2, '2'], [2.5, '2½'], [3, '3'], [4, '4']];
function nearFrac(x) {
  let best = FRACS[0];
  for (const f of FRACS) if (Math.abs(f[0] - x) < Math.abs(best[0] - x)) best = f;
  return best;
}
function countOf(g, per, one, many) {
  const f = nearFrac(g / per);
  return f[1] + ' ' + (f[0] > 1 ? many : one);
}
const CASUAL = {
  cinnamon: g => countOf(g, 2.6, 'tsp', 'tsp'),
  garlic: g => { const n = Math.max(1, Math.round(g / 4)); return n + (n > 1 ? ' cloves' : ' clove'); },
  lemon: g => countOf(g, 10, 'wedge', 'wedges'),
  lime: g => countOf(g, 10, 'wedge', 'wedges'),
  dill: g => g <= 6 ? 'small handful' : 'handful',
  coriander: g => g <= 6 ? 'small handful' : g <= 15 ? 'handful' : 'big handful',
  spring_onion: g => countOf(g, 15, 'spring onion', 'spring onions'),
  cos: g => g <= 35 ? 'handful' : g <= 70 ? '2 handfuls' : '3 handfuls',
  rocket: g => g <= 25 ? 'handful' : '2 handfuls',
  red_onion: g => g <= 20 ? '2 tbsp diced' : countOf(g, 150, 'onion', 'onions'),
  cucumber: g => countOf(g, 130, 'cucumber', 'cucumbers'),
  tomato: g => countOf(g, 120, 'tomato', 'tomatoes'),
  capsicum: g => countOf(g, 160, 'capsicum', 'capsicums'),
  evoo: g => g >= 15 ? countOf(g, 18, 'tbsp', 'tbsp') : countOf(g, 5, 'tsp', 'tsp'),
  butter: g => g >= 15 ? countOf(g, 18, 'tbsp', 'tbsp') : countOf(g, 5, 'tsp', 'tsp'),
  ghee: g => g >= 15 ? countOf(g, 18, 'tbsp', 'tbsp') : countOf(g, 5, 'tsp', 'tsp'),
  tallow: g => g >= 15 ? countOf(g, 18, 'tbsp', 'tbsp') : countOf(g, 5, 'tsp', 'tsp'),
  honey: g => (g >= 18 ? countOf(g, 21, 'tbsp', 'tbsp') : countOf(g, 7, 'tsp', 'tsp')) + ' · ' + formatAmount(g) + ' g',
  maple: g => countOf(g, 6.5, 'tsp', 'tsp') + ' · ' + formatAmount(g) + ' g',
  dark_choc: g => countOf(g, 7.5, 'square', 'squares') + ' · ' + formatAmount(g) + ' g'
};
function friendlyAmount(id, g) {
  const fn = CASUAL[id];
  if (fn && g > 0) return fn(Number(g));
  const unit = (LIB[id] && LIB[id].unit) || 'g';
  return formatAmount(Number(g)) + ' ' + unit;
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
function dayReport(st, date, hour) {
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
    { key: 'f', name: 'Fat', value: macros.f, target: TARGETS.fat, unit: 'g', pct: nutrientPct(macros.f, TARGETS.fat) },
    { key: 'fib', name: 'Fibre', value: sum.fibre_g, target: TARGETS.fibre || 30, unit: 'g', pct: nutrientPct(sum.fibre_g, TARGETS.fibre || 30) }
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
  const out = {
    hasLog: day.items.length > 0, estimate, macros, targets: TARGETS, macroBars,
    nutrients, lows, hard: nutrients.filter(n => n.hard), day, picks: state.picks, sum
  };
  out.gaps = closeGaps(out, date, hour);
  return out;
}
/* Built-in gap suggester (no AI), time-of-day aware.
   Pool = foods on the plan / shopping list in sensible steps (FOOD_PLAN.pantry). Each food knows which meals it fits.
   Before Meal 3 is picked, today's rotation dinner is assumed. Ideas go into the next meal that is still to come
   (e.g. +1 egg at Meal 2, broccoli at Meal 3); after Meal 3 only small snacks and drinks. K2 is ignored.
   Hard limits: daily upper limits (incl. manganese) and a normal daily amount per food. Top 3 never share a food. */
const UPPER = { A_ug: 3000, D_ug: 80, E_mg: 300, B6_mg: 50, selenium_ug: 400, zinc_mg: 40, iron_mg: 45, copper_mg: 10, manganese_mg: 11, calcium_mg: 2500, iodine_ug: 1100, phosphorus_mg: 4000 };
const SLOT_END = { wake: 7, yoghurt: 10, egg: 14, bowl: 20 }; // a meal is still "to come" before this hour
const PANTRY_META = {
  clo: { kind: 'supp', group: 'supp' }, d3k2_2drops: { kind: 'supp', group: 'supp' },
  milk_cow: { kind: 'snack', group: 'dairy', max: 650 }, orange_juice: { kind: 'snack', group: 'juice', max: 260 },
  coconut_water: { kind: 'snack', group: 'drink', max: 500 }, bone_broth: { kind: 'snack', group: 'broth', fits: ['wake'], max: 250 },
  kiwi_gold: { kind: 'snack', group: 'fruit', fits: ['yoghurt'], max: 300 }, mango: { kind: 'snack', group: 'fruit', fits: ['yoghurt'], max: 250 },
  nectarine: { kind: 'snack', group: 'fruit', fits: ['yoghurt'], max: 300 }, peach: { kind: 'snack', group: 'fruit', fits: ['yoghurt'], max: 300 },
  watermelon: { kind: 'snack', group: 'fruit', max: 500 }, rockmelon: { kind: 'snack', group: 'fruit', max: 400 },
  pineapple: { kind: 'snack', group: 'fruit', fits: ['yoghurt'], max: 300 }, mandarin: { kind: 'snack', group: 'fruit', max: 300 },
  kiwi_green: { kind: 'snack', group: 'fruit', fits: ['yoghurt'], max: 300 },
  pom_juice: { kind: 'snack', group: 'juice', max: 260 }, tart_cherry_conc: { kind: 'snack', group: 'tart', max: 40 },
  greek_yoghurt: { kind: 'snack', group: 'dairy', fits: ['yoghurt'], max: 500 }, whey: { kind: 'snack', group: 'whey', fits: ['yoghurt'], max: 90 },
  blueberries: { kind: 'snack', group: 'berries', fits: ['yoghurt'], max: 200 }, raspberries: { kind: 'snack', group: 'berries', fits: ['yoghurt'], max: 200 },
  blackberries: { kind: 'snack', group: 'berries', fits: ['yoghurt'], max: 200 }, strawberries: { kind: 'snack', group: 'berries', fits: ['yoghurt'], max: 200 },
  raw_cheddar: { kind: 'snack', group: 'cheese', fits: ['egg'], max: 60 }, carrot: { kind: 'snack', group: 'veg', max: 200 },
  egg: { kind: 'meal', group: 'egg', fits: ['egg'], max: 400 }, avocado: { kind: 'meal', group: 'avocado', fits: ['egg', 'bowl'], max: 140 },
  broccoli: { kind: 'meal', group: 'greens', fits: ['bowl', 'egg'], max: 300 }, sourdough: { kind: 'meal', group: 'starch', fits: ['egg'], max: 100 },
  cucumber: { kind: 'meal', group: 'salad', fits: ['bowl', 'egg'], max: 200 }, tomato: { kind: 'meal', group: 'salad', fits: ['bowl', 'egg'], max: 240 },
  capsicum: { kind: 'meal', group: 'salad', fits: ['bowl', 'egg'], max: 240 }, potato: { kind: 'meal', group: 'starch', fits: ['bowl', 'egg'], max: 400 },
  rice: { kind: 'meal', group: 'starch', fits: ['bowl', 'egg'], max: 300 }
};
function foodHour(date, hour) {
  if (isFinite(Number(hour)) && hour !== null && hour !== '') return Number(hour);
  const now = new Date();
  const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  return date === today ? now.getHours() + now.getMinutes() / 60 : 12;
}
function slotLabel(id) {
  const sl = slotById(id);
  return sl ? sl.label : (id === 'snacks' ? 'Snacks' : id === 'supps' ? 'Supplements' : '');
}
function comboLabel(units) {
  const order = [], by = {};
  for (const u of units) { if (!by[u.meal]) { by[u.meal] = []; order.push(u.meal); } by[u.meal].push(u.label); }
  return order.map(m => by[m].join(', ') + (m === 'snacks' ? (by[m].length > 1 ? ' as snacks' : ' as a snack') : m === 'supps' ? '' : ' at ' + slotLabel(m))).join(' · ');
}
function closeGaps(report, date, hour) {
  const day = report.day || blankFoodDay();
  if (!day.items.length) return { gaps: [], ideas: [], assumed: '', status: 'empty' };
  const h = foodHour(date, hour);
  const base = Object.assign({}, report.sum || {});
  const had = {};
  for (const it of day.items) if (it.id) had[it.id] = (had[it.id] || 0) + (Number(it.g) || 0);
  function assume(items) {
    for (const it of items) {
      const add = itemNutrients({ id: it.id, g: it.g });
      for (const k of ALL_KEYS) base[k] = (base[k] || 0) + (add[k] || 0);
      had[it.id] = (had[it.id] || 0) + it.g;
    }
  }
  const isPicked = id => (day.sel && day.sel[id]) || day.items.some(i => i.meal === id && !i.extra);
  const bowlOn = isPicked('bowl');
  const evening = h >= SLOT_END.bowl || (bowlOn && h >= 17);
  const upcoming = SLOTS.map(s => s.id).filter(id => !evening && h < (SLOT_END[id] || 24));
  // count the plan for meals still to come that aren't picked yet (today's rotation for Meal 3)
  const assumedList = [];
  for (const id of upcoming) {
    if (isPicked(id)) continue;
    const o = optionById(defaultOption(id, date));
    if (!o) continue;
    assume(o.items);
    assumedList.push((id === 'bowl' ? '' : slotLabel(id) + ': ') + o.name);
  }
  const assumed = assumedList.join(' · ');
  // daily supplements are taken every day: count them if not ticked yet
  let assumedSupps = false;
  if (!day.items.some(i => i.meal === 'supps')) {
    for (const o of SUPP_OPTS) assume(o.items);
    assumedSupps = SUPP_OPTS.length > 0;
  }
  const goals = [];
  for (const n of NUTS) if (n.key !== 'K2_ug') goals.push({ key: n.key, name: n.name, target: SILLZ[n.key], w: 1 });
  goals.push({ key: 'protein_g', name: 'Protein', target: TARGETS.protein, w: 1.5 });
  goals.push({ key: 'fibre_g', name: 'Fibre', target: TARGETS.fibre || 30, w: 1.2 });
  const gaps = goals.filter(gl => (base[gl.key] || 0) < gl.target * 0.995);
  const k2 = NUTS.some(n => n.key === 'K2_ug') ? nutrientPct(base.K2_ug || 0, SILLZ.K2_ug) : 100;
  const out = { gaps: gaps.map(gl => ({ key: gl.key, name: gl.name, pct: nutrientPct(base[gl.key] || 0, gl.target) })), ideas: [], assumed, assumedSupps, k2, evening, next: upcoming[0] || '', status: gaps.length ? 'gaps' : 'done' };
  if (!gaps.length) return out;
  const units = [];
  for (const p of (FOOD_PLAN.pantry || [])) {
    if (!LIB[p.id]) continue;
    if (SEASON[p.id] && SEASON[p.id].indexOf(monthOf(date)) === -1) continue; // out-of-season fruit
    const meta = PANTRY_META[p.id] || { kind: 'snack', group: p.id };
    if ((p.daily || meta.kind === 'supp') && had[p.id]) continue;
    let meal = '';
    if (meta.kind === 'supp') meal = 'supps';
    else {
      meal = (meta.fits || []).find(s => upcoming.indexOf(s) !== -1) || '';
      if (!meal && meta.kind === 'snack') meal = 'snacks';
    }
    if (!meal) continue; // a meal-only food once its meals are past
    for (let n = 1; n <= (p.max || 1); n++) {
      const g = p.step * n;
      if (meta.max && (had[p.id] || 0) + g > meta.max) break;
      const nut = itemNutrients({ id: p.id, g });
      if (evening && meta.kind !== 'supp' && nut.kcal > 250) break;
      const base1 = (p.labels && p.labels[n - 1]) || (g + ' ' + (LIB[p.id].unit || 'g') + ' ' + LIB[p.id].short.toLowerCase());
      units.push({ id: p.id, g, n, meal, group: meta.group || p.id, again: !!had[p.id], label: (had[p.id] ? (/^\d/.test(base1) ? '+' : /^a /.test(base1) ? 'another ' : 'extra ') + base1.replace(/^a /, '') : base1), nut });
    }
  }
  const kcalCap = (TARGETS.kcal || 2700) * 1.08;
  function score(list) {
    let s = 0;
    const tot = {};
    for (const k of ALL_KEYS) tot[k] = base[k] || 0;
    for (const u of list) for (const k of ALL_KEYS) tot[k] += u.nut[k] || 0;
    for (const k of Object.keys(UPPER)) if (tot[k] > UPPER[k] && tot[k] > (base[k] || 0)) return { s: -9, tot };
    let gain = 0;
    for (const gl of gaps) gain += gl.w * (Math.min(1, tot[gl.key] / gl.target) - Math.min(1, (base[gl.key] || 0) / gl.target));
    if (gain < 0.03) return { s: -1, tot };
    s += gain;
    if (tot.kcal > kcalCap) s -= 0.6 * (tot.kcal - Math.max(kcalCap, base.kcal || 0)) / 250;
    for (const u of list) {
      s -= 0.04 + (u.again ? 0.02 : 0) + 0.012 * (u.nut.kcal || 0) / 100;
      if (u.meal === out.next) s += 0.03;
      else if (u.meal !== 'snacks' && u.meal !== 'supps') s += 0.015;
    }
    return { s, tot };
  }
  const singles = units.map(u => ({ list: [u], r: score([u]) })).filter(x => x.r.s > 0.01);
  singles.sort((a, b) => b.r.s - a.r.s);
  const top = singles.slice(0, 14).map(x => x.list[0]);
  const combos = singles.slice();
  for (let i = 0; i < top.length; i++) for (let j = i + 1; j < top.length; j++) {
    if (top[i].id === top[j].id) continue;
    combos.push({ list: [top[i], top[j]], r: score([top[i], top[j]]) });
    for (let k = j + 1; k < top.length; k++) {
      if (top[k].id === top[i].id || top[k].id === top[j].id) continue;
      combos.push({ list: [top[i], top[j], top[k]], r: score([top[i], top[j], top[k]]) });
    }
  }
  combos.sort((a, b) => b.r.s - a.r.s);
  const picked = [];
  for (const c of combos) {
    if (picked.length >= 3) break;
    if (c.r.s <= 0.01) break;
    const ids = c.list.map(u => u.id);
    const groups = c.list.map(u => u.group).sort().join();
    if (picked.some(p => p.list.some(u => ids.indexOf(u.id) !== -1))) continue; // no shared food across the top 3
    if (picked.some(p => p.groups === groups)) continue; // no near-duplicates (e.g. blueberries vs raspberries)
    picked.push({ list: c.list, r: c.r, groups });
  }
  out.ideas = picked.map(p => {
    const closes = [], helps = [], moves = [];
    for (const gl of gaps) {
      const before = (base[gl.key] || 0) / gl.target, after = p.r.tot[gl.key] / gl.target;
      if (after - before < 0.03) continue;
      moves.push({ name: gl.name, before: Math.round(before * 100), after: Math.round(after * 100), d: Math.min(1, after) - before });
      if (after >= 1) closes.push(gl.name);
      else helps.push(gl.name + ' +' + Math.round((after - before) * 100) + '%');
    }
    moves.sort((a, b) => b.d - a.d);
    const why = moves.slice(0, 2).map(m => m.name + ' ' + m.before + '% → ' + m.after + '%').join(' · ');
    return { label: comboLabel(p.list), items: p.list.map(u => ({ id: u.id, g: u.g, meal: u.meal })), closes, helps, why, kcal: Math.round(p.list.reduce((a, u) => a + (u.nut.kcal || 0), 0)), score: p.r.s };
  });
  return out;
}

function optionById(id) { return OPTS[id] ? OPTS[id].opt : null; }
function slotById(id) { for (const sl of SLOTS) if (sl.id === id) return sl; return null; }
function rotationNight(date) {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? new Date(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)), 12) : new Date();
  const wd = d.getDay();
  return wd === 0 ? 7 : wd;
}
function defaultOption(slotId, date) {
  const sl = slotById(slotId);
  if (!sl || !sl.options.length) return '';
  if (slotId === 'bowl') {
    const n = rotationNight(date);
    const hit = sl.options.find(o => o.tags === 'night ' + n);
    if (hit) return hit.id;
  }
  return sl.options[0].id;
}
function optionNutrients(opt) {
  if (!opt) return sumNutrients([]);
  return sumNutrients(opt.items.map(it => itemNutrients({ id: it.id, g: it.g })));
}
function selectOption(state, date, optId) {
  const hit = OPTS[optId];
  if (!hit) return { skip: 'Unknown meal option' };
  const day = ensureDay(state, date);
  const meal = hit.meal;
  if (meal === 'snacks' || meal === 'supps') {
    if (day.items.some(i => i.opt === optId)) return {};
    for (const it of hit.opt.items) if (day.items.length < MAX_ITEMS) day.items.push(Object.assign(makeItem({ id: it.id, g: it.g, slot: '' }, meal), { opt: optId }));
    return { change: hit.opt.name + ' added' };
  }
  if (day.sel[meal] === optId && day.items.some(i => i.meal === meal)) return {};
  day.items = day.items.filter(i => i.meal !== meal || i.extra);
  day.skip = day.skip.filter(k => k.indexOf(meal + ':') !== 0);
  day.sel[meal] = optId;
  for (const it of hit.opt.items) if (day.items.length < MAX_ITEMS) day.items.push(Object.assign(makeItem({ id: it.id, g: it.g, slot: '' }, meal), { opt: optId }));
  return { change: slotById(meal).label + ': ' + hit.opt.name };
}
function unselectOption(state, date, optId) {
  const hit = OPTS[optId];
  if (!hit) return { skip: 'Unknown meal option' };
  const day = ensureDay(state, date);
  const before = day.items.length;
  if (hit.meal === 'snacks' || hit.meal === 'supps') day.items = day.items.filter(i => i.opt !== optId);
  else if (day.sel[hit.meal] === optId) {
    day.items = day.items.filter(i => i.meal !== hit.meal || i.extra);
    delete day.sel[hit.meal];
  }
  return day.items.length === before ? {} : { change: hit.opt.name + ' removed' };
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
  if (op === 'select_option') return selectOption(state, date, String(action.option || action.id || ''));
  if (op === 'add_more') {
    const id = resolveFoodId(action.id);
    const g = clampG(action.grams);
    if (!id || !g) return { skip: 'Unknown food' };
    const day = ensureDay(state, date);
    if (day.items.length >= MAX_ITEMS) return { skip: 'Too many foods today' };
    const meal = action.meal === 'supps' ? 'supps' : (slotById(action.meal) ? action.meal : 'snacks');
    const item = makeItem({ id, g, slot: '' }, meal);
    if (meal !== 'snacks' && meal !== 'supps') item.extra = true;
    day.items.push(item);
    return { change: foodName(id) + ' added' + (meal !== 'snacks' && meal !== 'supps' ? ' to ' + slotLabel(meal) : '') };
  }
  if (op === 'unselect_option') return unselectOption(state, date, String(action.option || action.id || ''));
  if (op === 'add_meal') {
    const meal = mealIdOf(action.meal);
    if (!meal) return { skip: 'Unknown meal' };
    if (slotById(meal)) {
      const day = ensureDay(state, date);
      const want = action.option && OPTS[action.option] && OPTS[action.option].meal === meal ? action.option : (day.sel[meal] || defaultOption(meal, date));
      return selectOption(state, date, want);
    }
    if (meal === 'snacks' || meal === 'supps') {
      const list = meal === 'snacks' ? SNACK_OPTS.filter(o => o.tags === 'daily') : SUPP_OPTS;
      const done = list.map(o => selectOption(state, date, o.id)).filter(r => r.change);
      return done.length ? { change: (meal === 'snacks' ? 'Daily drinks' : 'Supplements') + ' logged' } : {};
    }
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
    if (day.sel) delete day.sel[meal];
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

/* ---------- calendar days + weekly stats (Australia/Brisbane, UTC+10, no DST) ---------- */
function brisbaneYmd(ms) {
  const d = new Date((ms == null ? Date.now() : Number(ms)) + 10 * 3600 * 1000);
  return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
}
function addDaysYmd(ymdStr, n) {
  const [y, m, d] = String(ymdStr).split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.getUTCFullYear() + '-' + String(t.getUTCMonth() + 1).padStart(2, '0') + '-' + String(t.getUTCDate()).padStart(2, '0');
}
function weekStartYmd(ymdStr) { // Monday of that week
  const [y, m, d] = String(ymdStr).split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 Sun
  return addDaysYmd(ymdStr, -((dow + 6) % 7));
}
function weekReport(st, anyDate, todayDate) {
  const start = weekStartYmd(anyDate);
  const state = loadFoodState(st && st.days ? { picks: st.picks, checks: st.checks, days: st.days, v: st.v } : (st || {}));
  const today = todayDate || brisbaneYmd();
  const dates = [], strip = [];
  const tot = {};
  let logged = 0;
  for (let i = 0; i < 7; i++) {
    const ds = addDaysYmd(start, i); dates.push(ds);
    const day = state.days[ds] || blankFoodDay();
    const sum = sumNutrients(day.items.map(itemNutrients));
    const has = day.items.length > 0;
    if (has) logged++;
    for (const k of Object.keys(sum)) tot[k] = (tot[k] || 0) + (Number(sum[k]) || 0);
    let microHit = 0;
    for (const n of NUTS) if (nutrientPct(sum[n.key] || 0, SILLZ[n.key]) >= 100) microHit++;
    strip.push({ date: ds, has, future: ds > today, today: ds === today, kcal: sum.kcal || 0, protein: sum.protein_g || 0, microHit, microTotal: NUTS.length });
  }
  const row = (key, name, unit, daily, upper) => {
    const value = tot[key] || 0, target = (Number(daily) || 0) * 7;
    const pct = target ? Math.round(value / target * 100) : 0;
    const over = upper ? value > upper * 7 : false;
    return { key, name, unit, value, target, avg: value / 7, avgLogged: logged ? value / logged : 0, dailyTarget: Number(daily) || 0, pct, hit: pct >= 100, short: pct < 100, over };
  };
  const macros = [
    row('kcal', 'Calories', '', TARGETS.kcal),
    row('protein_g', 'Protein', 'g', TARGETS.protein),
    row('carbs_g', 'Carbs', 'g', TARGETS.carbs),
    row('fat_g', 'Fat', 'g', TARGETS.fat),
    row('fibre_g', 'Fibre', 'g', TARGETS.fibre || 30)
  ];
  const micros = NUTS.map(n => row(n.key, n.name, n.unit, SILLZ[n.key], UPPER[n.key]));
  return { start, end: dates[6], dates, strip, logged, macros, micros, totals: tot };
}
