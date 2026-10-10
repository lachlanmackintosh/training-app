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
load('food-ai.js');
const g = {};
for (const name of ['FOOD_PLAN', 'applyFoodActions', 'sumNutrients', 'itemNutrients', 'dayReport', 'mealTickState', 'suggestionsFor', 'isExcludedFood', 'setItemGrams', 'mockGeminiFood', 'loadFoodState', 'localFoodAnswer', 'parseGeminiFood', 'geminiRequestBody', 'geminiErrorText']) {
  g[name] = vm.runInContext(name, context);
}
const DATE = '2026-10-10';

function ids(day) { return (day.items || []).map(i => i.id).filter(Boolean); }
function has(day, id) { return day.items.some(i => i.id === id); }

function test(name, fn) {
  try { fn(); console.log('ok', name); }
  catch (e) { console.error('FAIL', name); throw e; }
}

test('v4 plate drops the old defaults', () => {
  const used = [];
  for (const m of g.FOOD_PLAN.meals) {
    for (const it of m.items) used.push(it.id);
    assert.ok(m.id === 'yoghurt' || m.id === 'egg' || m.id === 'bowl' || m.id === 'snacks');
  }
  for (const gone of ['cottage_cheese', 'maple', 'honey', 'gouda', 'pumpkin_seeds', 'natto', 'chia']) {
    assert.ok(used.indexOf(gone) === -1, gone);
  }
  assert.ok(used.indexOf('raw_cheddar') !== -1);
  assert.ok(used.indexOf('blackberries') !== -1);
  assert.ok(used.indexOf('butter') !== -1);
  assert.strictEqual(g.FOOD_PLAN.meals.find(m => m.id === 'egg').optional[0].id, 'uv_mushrooms');
  assert.strictEqual(g.FOOD_PLAN.targets.kcal, 2750);
  assert.strictEqual(g.FOOD_PLAN.targets.protein, 178);
  assert.strictEqual(g.FOOD_PLAN.swaps.cheese.ids[0], 'raw_cheddar');
  assert.ok(g.FOOD_PLAN.swaps.fruit.ids.indexOf('kiwi_gold') === 0);
  assert.ok(g.FOOD_PLAN.swaps.fruit.ids.indexOf('mango') !== -1);
});

test('full day matches the v4 totals', () => {
  let st = { picks: null, days: {} };
  for (const meal of ['yoghurt', 'egg', 'bowl', 'snacks']) {
    st = g.applyFoodActions(st, [{ op: 'add_meal', meal }], DATE).state;
  }
  const day = st.days[DATE];
  assert.ok(!has(day, 'uv_mushrooms'));
  const sum = g.sumNutrients(day.items.map(g.itemNutrients));
  assert.ok(Math.abs(sum.kcal - 2732.78) < 0.05, sum.kcal);
  assert.ok(Math.abs(sum.protein_g - 174.72) < 0.05, sum.protein_g);
  assert.ok(Math.abs(sum.K2_ug - 24.38) < 0.05, sum.K2_ug);
  assert.ok(Math.abs(sum.D_ug - 4.67) < 0.05, sum.D_ug);
  const report = g.dayReport(st, DATE);
  assert.strictEqual(report.nutrients.find(n => n.key === 'K2_ug').pct, 12);
  assert.strictEqual(report.nutrients.find(n => n.key === 'D_ug').pct, 31);
  assert.ok(report.hard.every(h => h.note));
  const withM = g.applyFoodActions(st, [{ op: 'set_mushrooms', on: true }], DATE).state;
  const sumM = g.sumNutrients(withM.days[DATE].items.map(g.itemNutrients));
  assert.ok(Math.abs(sumM.kcal - 2754.78) < 0.05, sumM.kcal);
  assert.ok(Math.abs(sumM.D_ug - 30.87) < 0.05, sumM.D_ug);
  assert.ok(g.dayReport(withM, DATE).nutrients.find(n => n.key === 'D_ug').hit);
});

test('tick, skip, swap, and gram edits', () => {
  let applied = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'yoghurt' }], DATE);
  assert.ok(applied.changed);
  assert.ok(has(applied.state.days[DATE], 'blackberries'));
  applied = g.applyFoodActions(applied.state, [{ op: 'remove', id: 'blueberries', meal: 'yoghurt' }], DATE);
  assert.ok(!has(applied.state.days[DATE], 'blueberries'));
  assert.ok(applied.state.days[DATE].skip.indexOf('yoghurt:blueberries') !== -1);
  applied = g.applyFoodActions(applied.state, [{ op: 'add_meal', meal: 'yoghurt' }], DATE);
  assert.ok(!has(applied.state.days[DATE], 'blueberries'));
  const whey = applied.state.days[DATE].items.find(i => i.id === 'whey');
  const doubled = g.setItemGrams(applied.state, DATE, whey.uid, 80);
  assert.ok(doubled.changed);
  const before = g.itemNutrients(whey).kcal;
  const after = g.itemNutrients(doubled.state.days[DATE].items.find(i => i.id === 'whey')).kcal;
  assert.ok(Math.abs(after - before * 2) < 0.01);
  applied = g.applyFoodActions(doubled.state, [{ op: 'add_meal', meal: 'snacks' }], DATE);
  applied = g.applyFoodActions(applied.state, [{ op: 'set_swap', slot: 'fruit', id: 'mango' }], DATE);
  assert.strictEqual(applied.state.picks.fruit, 'mango');
  assert.ok(has(applied.state.days[DATE], 'mango'));
  assert.ok(!has(applied.state.days[DATE], 'kiwi_gold'));
  const egg = g.applyFoodActions(applied.state, [{ op: 'add_meal', meal: 'egg' }], DATE);
  assert.ok(has(egg.state.days[DATE], 'egg'));
  assert.ok(!has(egg.state.days[DATE], 'uv_mushrooms'));
  assert.strictEqual(g.mealTickState(egg.state.days[DATE], g.FOOD_PLAN.meals.find(m => m.id === 'egg'), egg.state.picks), 'on');
});

test('suggestions stay inside his library and prefer the plan', () => {
  assert.ok(g.isExcludedFood('pumpkin_seeds', 'Pumpkin seeds'));
  assert.ok(g.isExcludedFood('sardines', 'Sardines'));
  assert.ok(g.isExcludedFood('brazil_nuts', 'Brazil nuts'));
  const k2 = g.suggestionsFor('K2_ug', {});
  assert.ok(k2.length >= 1 && k2.length <= 2);
  assert.ok(k2.some(s => s.id === 'gouda'));
  assert.ok(k2.every(s => !g.isExcludedFood(s.id, s.label)));
  const d = g.suggestionsFor('D_ug', {});
  assert.ok(d.some(s => s.id === 'uv_mushrooms'));
  assert.ok(!d.some(s => /sardine|natto|pumpkin|chia|almond|cacao|brazil/i.test(s.id + s.label)));
  const partial = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'yoghurt' }], DATE).state;
  const report = g.dayReport(partial, DATE);
  assert.ok(report.lows.length > 0);
  for (const n of report.lows) {
    for (const s of n.suggestions) assert.ok(!g.isExcludedFood(s.id, s.label), s.label);
  }
  assert.ok(report.hard.some(h => h.key === 'K2_ug' && !h.hit));
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

test('mocked Gemini logs speech and can be undone', () => {
  const phrase = 'for brekkie I had the yoghurt, 40 g whey and mixed berries with blackberries, no pumpkin seeds';
  const mock = g.mockGeminiFood(phrase);
  assert.ok(/pumpkin/i.test(mock.reply));
  const applied = g.applyFoodActions({}, mock.actions, DATE);
  const day = applied.state.days[DATE];
  assert.ok(has(day, 'greek_yoghurt'));
  assert.ok(has(day, 'blackberries'));
  assert.strictEqual(day.items.find(i => i.id === 'whey').g, 40);
  assert.ok(!ids(day).some(id => /pumpkin|natto|chia/.test(id)));
  const before = g.loadFoodState({});
  const lunch = g.mockGeminiFood('skipped the mushrooms at lunch');
  const ate = g.applyFoodActions(applied.state, lunch.actions, DATE);
  assert.ok(has(ate.state.days[DATE], 'egg'));
  assert.ok(!has(ate.state.days[DATE], 'uv_mushrooms'));
  const snap = { picks: applied.state.picks, days: { [DATE]: applied.state.days[DATE] }, v: 4 };
  const undone = g.loadFoodState(snap);
  assert.ok(!has(undone.days[DATE], 'egg'));
  assert.ok(has(undone.days[DATE], 'greek_yoghurt'));
  const snacks = g.applyFoodActions(ate.state, [{ op: 'add_meal', meal: 'snacks' }], DATE);
  const mango = g.applyFoodActions(snacks.state, g.mockGeminiFood('had a mango instead of kiwi').actions, DATE);
  assert.strictEqual(mango.state.picks.fruit, 'mango');
  assert.ok(has(mango.state.days[DATE], 'mango'));
  assert.ok(!has(mango.state.days[DATE], 'kiwi_gold'));
  assert.strictEqual(before.days[DATE], undefined);
});

test('what am I low on is answered from the local totals', () => {
  assert.strictEqual(g.localFoodAnswer('for brekkie I had the yoghurt', {}, DATE), '');
  const empty = g.localFoodAnswer('what am I low on?', {}, DATE);
  assert.ok(/nothing logged/i.test(empty));
  const st = g.applyFoodActions({}, [{ op: 'add_meal', meal: 'yoghurt' }], DATE).state;
  const answer = g.localFoodAnswer('what am I low on?', st, DATE);
  assert.ok(/K2|vitamin D/i.test(answer));
  assert.ok(/%/.test(answer));
  assert.ok(!/natto|pumpkin seeds|chia|sardines|almonds|cacao|Brazil/i.test(answer.replace(/without natto/i, '')));
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
  assert.ok(has(day, 'chicken_thigh'));
  assert.ok(has(day, 'sweet_potato'));
  assert.ok(!has(day, 'beef_mince'));
  assert.ok(!has(day, 'cottage_cheese'));
  assert.ok(!has(day, 'maple'));
  assert.ok(has(day, 'mango'));
  assert.ok(has(day, 'carrot'));
  assert.ok(day.items.some(i => i.estimate && i.name === 'Pie'));
  const report = g.dayReport(st, '2026-10-09');
  assert.ok(report.macros.kcal > 2000);
  assert.ok(report.estimate);
});

test('Gemini function call is parsed and applied locally', () => {
  const parsed = g.parseGeminiFood({
    candidates: [{ content: { parts: [{ functionCall: { name: 'update_food', args: {
      reply: 'Carrot logged.',
      actions: [{ op: 'add', id: 'carrot', grams: 100, meal: 'snacks' }]
    } } }] } }]
  });
  assert.strictEqual(parsed.reply, 'Carrot logged.');
  const applied = g.applyFoodActions({}, parsed.actions, DATE);
  assert.strictEqual(applied.state.days[DATE].items[0].g, 100);
  const body = g.geminiRequestBody({ picks: {}, days: {} }, DATE, [], 'had the yoghurt');
  const tool = body.tools[0].functionDeclarations[0];
  assert.strictEqual(tool.name, 'update_food');
  assert.ok(body.systemInstruction.parts[0].text.indexOf('greek_yoghurt') !== -1);
  assert.ok(body.systemInstruction.parts[0].text.indexOf('The app multiplies') !== -1);
  assert.strictEqual(g.geminiErrorText(429, true), 'Gemini is rate-limiting requests. Wait a minute and try again.');
  assert.strictEqual(g.geminiErrorText(0, false), 'Ask AI needs internet.');
  assert.throws(() => g.parseGeminiFood({ error: { code: 429, message: 'quota' } }));
});

test('service worker cache is the tracker build', () => {
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.ok(sw.indexOf("baki-v12-tracker") !== -1);
  assert.ok(sw.indexOf('./food-plan.js') !== -1);
  assert.ok(sw.indexOf('./food-ai.js') !== -1);
});

console.log('all food tests passed');
