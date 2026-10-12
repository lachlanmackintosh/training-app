/* node test/food.test.js — food log, Sillz totals, suggestions, mocked Gemini. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const path = require('path');
const root = path.join(__dirname, '..');
const context = { console, Math, JSON, Date, Number, String, Object, Array, isFinite, parseInt };
vm.createContext(context);
function load(file) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}
load('food-plan.js');
load('food-log.js');
const g = {};
for (const name of ['FOOD_PLAN', 'applyFoodActions', 'sumNutrients', 'itemNutrients', 'dayReport', 'mealTickState', 'suggestionsFor', 'isExcludedFood', 'setItemGrams', 'loadFoodState', 'closeGaps', 'friendlyAmount']) {
  g[name] = vm.runInContext(name, context);
}
const DATE = '2026-10-10';

function ids(day) { return (day.items || []).map(i => i.id).filter(Boolean); }
function has(day, id) { return day.items.some(i => i.id === id); }

function test(name, fn) {
  try { fn(); console.log('ok', name); }
  catch (e) { console.error('FAIL', name); throw e; }
}

test('v6 plan has breakfast, lunch, dinner options, snacks and supplements', () => {
  const P = g.FOOD_PLAN;
  assert.strictEqual(P.slots.map(s => s.label).join(), 'Morning snack,Meal 1,Meal 2,Meal 3');
  assert.strictEqual(P.slots[3].options.length, 10);
  assert.strictEqual(P.slots[3].options.filter(o => o.tags === 'Slow cooker').length, 3);
  assert.ok(P.slots[3].options.some(o => /Pho/.test(o.name)));
  assert.ok(!P.slots[3].options.some(o => /lamb|mussel/i.test(o.name)));
  for (const sl of P.slots) for (const o of sl.options) {
    assert.ok(o.method && o.items.length && o.partner.length, o.id);
    for (const it of o.items.concat(o.partner)) assert.ok(P.library[it.id], it.id);
  }
  assert.ok(P.supplements.some(o => o.items[0].id === 'clo' && o.items[0].g === 5));
  assert.ok(P.supplements.some(o => o.items[0].id === 'd3k2_2drops' && o.items[0].g === 2));
  assert.strictEqual(P.targets.protein, 175);
  assert.strictEqual(P.targets.fibre, 30);
  assert.ok(P.people.partner.micros.iron_mg === 18);
  for (const k of ['choline_mg', 'iodine_ug', 'EPA_DHA_mg']) assert.ok(P.nutrients.some(n => n.key === k) && P.sillz[k] > 0, k);
});

test('a full selected day hits every target except K2', () => {
  let st = { days: {} };
  for (const meal of ['wake', 'yoghurt', 'egg', 'bowl', 'snacks', 'supps']) st = g.applyFoodActions(st, [{ op: 'add_meal', meal }], DATE).state;
  const day = st.days[DATE];
  assert.strictEqual(day.sel.yoghurt, 'b_berry');
  assert.strictEqual(day.sel.egg, 'l_egg');
  assert.strictEqual(day.sel.bowl, 'd6'); // Sat 10 Oct = night 6
  const r = g.dayReport(st, DATE);
  const low = r.nutrients.filter(n => n.pct < 100).map(n => n.key);
  assert.strictEqual(low.join(), 'K2_ug');
  assert.ok(r.macroBars.find(b => b.key === 'p').pct >= 100);
  assert.ok(r.macroBars.find(b => b.key === 'fib').pct >= 100);
  assert.ok(r.gaps.k2 < 100 && !r.gaps.gaps.some(x => x.key === 'K2_ug'));
});

test('one option per meal slot, snacks are multi, gaps ranked', () => {
  let st = g.applyFoodActions({}, [{ op: 'select_option', option: 'd1' }], DATE).state;
  st = g.applyFoodActions(st, [{ op: 'select_option', option: 'd7' }], DATE).state;
  let day = st.days[DATE];
  assert.strictEqual(day.sel.bowl, 'd7');
  assert.ok(has(day, 'rice_noodles'));
  assert.ok(!has(day, 'chicken_thigh'));
  st = g.applyFoodActions(st, [{ op: 'select_option', option: 's_kiwi' }, { op: 'select_option', option: 's_carrot' }], DATE).state;
  day = st.days[DATE];
  assert.ok(has(day, 'kiwi_gold') && has(day, 'carrot'));
  st = g.applyFoodActions(st, [{ op: 'unselect_option', option: 's_kiwi' }], DATE).state;
  assert.ok(!has(st.days[DATE], 'kiwi_gold'));
  const r = g.dayReport(st, DATE);
  assert.ok(Array.isArray(r.gaps.ideas));
  const whey = g.applyFoodActions(st, [{ op: 'add_meal', meal: 'yoghurt' }], DATE).state;
  const item = whey.days[DATE].items.find(i => i.id === 'whey');
  const doubled = g.setItemGrams(whey, DATE, item.uid, 90);
  assert.ok(doubled.changed);
  const back = g.loadFoodState(JSON.parse(JSON.stringify(doubled.state)));
  assert.strictEqual(back.days[DATE].sel.bowl, 'd7');
  assert.ok(back.days[DATE].items.some(i => i.opt === 's_carrot'));
});

test('suggestions stay inside his library and prefer the plan', () => {
  assert.ok(g.isExcludedFood('pumpkin_seeds', 'Pumpkin seeds'));
  assert.ok(g.isExcludedFood('sardines', 'Sardines'));
  assert.ok(g.isExcludedFood('brazil_nuts', 'Brazil nuts'));
  const k2 = g.suggestionsFor('K2_ug', {});
  assert.ok(k2.length >= 1 && k2.length <= 2);
    assert.ok(k2.every(s => !g.isExcludedFood(s.id, s.label)));
  const d = g.suggestionsFor('D_ug', {});
  assert.ok(d.some(s => s.id === 'uv_mushrooms'));
  assert.ok(!d.some(s => /sardine|natto|pumpkin|chia|almond|brazil/i.test(s.id + s.label)));
  const partial = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'yoghurt' }], DATE).state;
  const report = g.dayReport(partial, DATE);
  assert.ok(report.lows.length > 0);
  for (const n of report.lows) {
    for (const s of n.suggestions) assert.ok(!g.isExcludedFood(s.id, s.label), s.label);
  }
  assert.ok(report.hard.some(h => h.key === 'K2_ug' && !h.hit));
  assert.ok(report.hard.every(h => h.key === 'K2_ug'));
});

test('off-library food is an estimate and scales with grams', () => {
  const applied = g.applyFoodActions({}, [{
    op: 'add_estimate', name: 'Cafe pie', grams: 120, kcal: 350, protein_g: 8, carbs_g: 40, fat_g: 16, C_mg: 12
  }], DATE);
  assert.ok(applied.changed);
  const item = applied.state.days[DATE].items[0];
  assert.strictEqual(item.estimate, true);
  const report = g.dayReport(applied.state, DATE);
  assert.ok(report.estimate);
  assert.ok(Math.abs(report.macros.kcal - 350) < 0.01);
  assert.ok(Math.abs(report.nutrients.find(n => n.key === 'C_mg').value - 12) < 0.01);
  const half = g.setItemGrams(applied.state, DATE, item.uid, 60);
  const again = g.dayReport(half.state, DATE);
  assert.ok(Math.abs(again.macros.kcal - 175) < 0.01);
});

test('rejected foods never enter the log', () => {
  const bad = g.applyFoodActions({}, [
    { op: 'add', id: 'pumpkin_seeds', grams: 20 },
    { op: 'add', id: 'natto', grams: 40 },
    { op: 'add', id: 'chia', grams: 15 },
    { op: 'add', id: 'sardines', grams: 80 }
  ], DATE);
  assert.strictEqual(bad.changed, false);
  assert.ok(bad.skipped.length >= 1);
  assert.strictEqual(bad.state.days[DATE].items.length, 0);
});

test('old food storage migrates without the dropped foods', () => {
  const st = g.loadFoodState({
    picks: { sweetener: 'maple', meal3: 'bowl', protein: 'thigh', carb: 'sweet' },
    snacks: { fruit: 'mango', carrot: '100', oj: '150' },
    checks: { yoghurt: true, cottage: true },
    days: {
      '2026-10-09': {
        meals: { yoghurt: true, egg: true, third: true },
        snacks: { fruit: true, carrot: true },
        custom: [{ id: 'c_testpie1', name: 'Pie', kcal: 300, p: 5, c: 40, f: 12, estimate: true, eaten: true }]
      }
    }
  });
  assert.strictEqual(st.picks.protein, 'chicken_thigh');
  assert.strictEqual(st.picks.carb, 'sweet_potato');
  assert.strictEqual(st.picks.fruit, 'mango');
  assert.strictEqual(st.picks.cheese, 'raw_cheddar');
  assert.ok(st.checks.yoghurt && st.checks.cottage);
  const day = st.days['2026-10-09'];
  assert.ok(has(day, 'greek_yoghurt'));
  assert.ok(has(day, 'blackberries'));
  assert.ok(has(day, 'egg'));
  assert.ok(!has(day, 'cottage_cheese'));
  assert.ok(has(day, 'dark_choc')); // legacy yoghurt tick maps to today's bowl
  assert.ok(has(day, 'carrot'));
  assert.ok(day.items.some(i => i.estimate && i.name === 'Pie'));
  const report = g.dayReport(st, '2026-10-09');
  assert.ok(report.macros.kcal > 2000);
  assert.ok(report.estimate);
});

test('service worker cache is the tracker build', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(sw.indexOf("baki-v21-supp-value") !== -1);
  assert.ok(sw.indexOf('./food-plan.js') !== -1);
  assert.ok(sw.indexOf('./food-log.js') !== -1);
});

test('suggester uses pantry foods only, ignores K2, assumes tonight\'s dinner', () => {
  const P = g.FOOD_PLAN;
  const pantry = {};
  for (const p of P.pantry) pantry[p.id] = 1;
  let st = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'yoghurt' }, { op: 'add_meal', meal: 'egg' }, { op: 'remove', id: 'whey', meal: 'yoghurt' }], DATE).state;
  let r = g.dayReport(st, DATE);
  assert.ok(/Beef burger/.test(r.gaps.assumed)); // Sat = night 6
  assert.ok(!r.gaps.gaps.some(x => x.key === 'K2_ug'));
  assert.ok(r.gaps.ideas.length >= 1 && r.gaps.ideas.length <= 3);
  for (const i of r.gaps.ideas) {
    assert.ok(i.items.length >= 1 && i.items.length <= 3);
    for (const it of i.items) assert.ok(pantry[it.id], it.id);
    assert.ok(!g.isExcludedFood(i.items[0].id, i.label));
  }
  const first = r.gaps.ideas[0];
  const after = g.applyFoodActions(st, first.items.map(x => ({ op: 'add_more', id: x.id, grams: x.g })), DATE).state;
  const r2 = g.dayReport(after, DATE);
  const sumGap = rr => rr.gaps.gaps.reduce((a, x) => a + (100 - Math.min(100, x.pct)), 0);
  assert.ok(sumGap(r2) < sumGap(r), 'adding the top idea shrinks the gap');
  st = g.applyFoodActions(st, [{ op: 'select_option', option: 'd2' }], DATE).state;
  assert.strictEqual(g.dayReport(st, DATE).gaps.assumed, '');
  // only the yoghurt bowl + supplements: vitamin A/D should not be pushed over upper limits
  const lean = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'yoghurt' }, { op: 'add_meal', meal: 'supps' }], DATE).state;
  const rl = g.dayReport(lean, DATE);
  for (const i of rl.gaps.ideas) assert.ok(i.items.every(it => it.id !== 'beef_liver'));
});

test('friendly measures for herbs, spices, salad and fats; grams for protein and starch', () => {
  const fa = g.friendlyAmount;
  assert.strictEqual(fa('cinnamon', 2.6), '1 tsp');
  assert.strictEqual(fa('cinnamon', 1.5), '½ tsp');
  assert.strictEqual(fa('dark_choc', 15), '2 squares · 15 g');
  assert.strictEqual(fa('garlic', 3), '1 clove');
  assert.strictEqual(fa('cucumber', 60), '½ cucumber');
  assert.strictEqual(fa('dill', 5), 'small handful');
  assert.strictEqual(fa('evoo', 10), '2 tsp');
  assert.strictEqual(fa('beef_liver', 20), '20 g');
  assert.strictEqual(fa('rice', 150), '150 g');
  assert.strictEqual(fa('greek_yoghurt', 300), '300 g');
  // nutrition still uses the exact grams
  const st = g.applyFoodActions({}, [{ op: 'select_option', option: 'b_berry' }], DATE).state;
  const c = st.days[DATE].items.find(i => i.id === 'cinnamon');
  assert.strictEqual(c.g, 2.6);
  assert.strictEqual(g.loadFoodState(JSON.parse(JSON.stringify(st))).days[DATE].items.find(i => i.id === 'cinnamon').g, 2.6);
});

test('gap ideas are time-aware, diverse, explained and within upper limits', () => {
  // Meal 1 without its whey: protein is short, Meal 2 is next
  const base = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'wake' }, { op: 'add_meal', meal: 'yoghurt' }, { op: 'remove', id: 'whey', meal: 'yoghurt' }], DATE).state;
  const mid = g.dayReport(base, DATE, 11).gaps;
  assert.ok(/Egg meal/.test(mid.assumed) && mid.assumedSupps);
  assert.strictEqual(mid.next, 'egg');
  assert.ok(mid.ideas.length >= 1 && mid.ideas.length <= 3);
  const seen = {};
  for (const i of mid.ideas) {
    assert.ok(/\d+% → \d+%/.test(i.why), i.why);
    for (const it of i.items) { assert.ok(!seen[it.id], 'no shared food across ideas: ' + it.id); }
    for (const it of i.items) seen[it.id] = 1;
    assert.ok(i.items.every(it => it.meal !== 'yoghurt'), 'Meal 1 is past at 11 am');
    for (const it of i.items) assert.ok(['egg', 'bowl', 'snacks', 'supps'].indexOf(it.meal) !== -1, it.meal); // meals 1 is past
  }
  // evening, after Meal 3: small snacks/drinks only
  // Meal 2 skipped, pho for Meal 3: evening ideas are small snacks/drinks only
  const full = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'wake' }, { op: 'add_meal', meal: 'yoghurt' }, { op: 'select_option', option: 'd7' }], DATE).state;
  const eve = g.dayReport(full, DATE, 21).gaps;
  assert.ok(eve.evening && eve.ideas.length >= 2);
  for (const i of eve.ideas) for (const it of i.items) {
    assert.ok(it.meal === 'snacks' || it.meal === 'supps', it.id);
    assert.ok(['broccoli', 'potato', 'rice', 'egg', 'avocado'].indexOf(it.id) === -1, it.id);
  }
  // upper limits incl. manganese never pushed over by an idea
  const UL = { manganese_mg: 11, iron_mg: 45, copper_mg: 10, A_ug: 3000, zinc_mg: 40 };
  for (const hr of [8, 11, 15, 21]) {
    const r = g.dayReport(full, DATE, hr);
    for (const i of r.gaps.ideas) {
      const add = g.sumNutrients(i.items.map(it => g.itemNutrients({ id: it.id, g: it.g })));
      for (const k of Object.keys(UL)) assert.ok(r.sum[k] + add[k] <= Math.max(UL[k], r.sum[k] + 1e-9) + 1e-9 || add[k] === 0, k);
    }
  }
  // repeat guard: eggs already at 300 g, never more than 400 g suggested
  for (const i of mid.ideas) for (const it of i.items) if (it.id === 'egg') assert.ok(it.g <= 100);
  for (const i of eve.ideas) for (const it of i.items) assert.ok(g.itemNutrients({ id: it.id, g: it.g }).kcal <= 250, it.id);
});

test('extras added to a meal survive picking that meal, and a full day needs nothing', () => {
  let st = g.applyFoodActions({}, [{ op: 'add_more', id: 'broccoli', grams: 100, meal: 'bowl' }], DATE).state;
  st = g.applyFoodActions(st, [{ op: 'select_option', option: 'd1' }], DATE).state;
  const bro = st.days[DATE].items.filter(i => i.id === 'broccoli');
  assert.ok(bro.some(i => i.extra && i.g === 100));
  let all = { days: {} };
  for (const meal of ['wake', 'yoghurt', 'egg', 'bowl', 'snacks', 'supps']) all = g.applyFoodActions(all, [{ op: 'add_meal', meal }], DATE).state;
  const r = g.dayReport(all, DATE, 21).gaps;
  assert.strictEqual(r.status, 'done');
  assert.strictEqual(r.ideas.length, 0);
});

console.log('all food tests passed');
