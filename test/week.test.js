/* node test/week.test.js — Brisbane day rollover + weekly aggregation */
const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const root = path.join(__dirname, '..');
const ctx = { console, Math, JSON, Date, Number, String, Object, Array, isFinite, parseInt };
vm.createContext(ctx);
for (const f of ['food-plan.js', 'food-log.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const g = n => vm.runInContext(n, ctx);
const bris = g('brisbaneYmd'), ws = g('weekStartYmd'), wr = g('weekReport'), apply = g('applyFoodActions'), dayReport = g('dayReport'), load = g('loadFoodState'), FP = g('FOOD_PLAN');
let fail = 0; const t = (n, f) => { try { f(); console.log('ok', n); } catch (e) { fail = 1; console.error('FAIL', n, e.message); } };
t('Brisbane day boundary is 14:00 UTC', () => {
  assert.strictEqual(bris(Date.UTC(2026, 9, 13, 13, 59)), '2026-10-13');
  assert.strictEqual(bris(Date.UTC(2026, 9, 13, 14, 0)), '2026-10-14');
  assert.strictEqual(bris(Date.UTC(2026, 11, 31, 14, 30)), '2027-01-01');
});
t('week starts Monday', () => {
  assert.strictEqual(ws('2026-10-13'), '2026-10-12');
  assert.strictEqual(ws('2026-10-18'), '2026-10-12');
  assert.strictEqual(ws('2026-10-19'), '2026-10-19');
  assert.strictEqual(ws('2026-11-01'), '2026-10-26');
});
const opt = FP.options ? (Array.isArray(FP.options) ? FP.options[0].id : Object.keys(FP.options)[0]) : null;
t('new day starts empty, yesterday kept', () => {
  let st = load({});
  const r = apply(st, [{ op: 'add_meal', meal: 'yoghurt' }], '2026-10-12');
  st = r.state || r;
  const y = dayReport(st, '2026-10-12'), td = dayReport(st, '2026-10-13');
  assert.ok(y.hasLog, 'yesterday logged');
  assert.ok(!td.hasLog, 'today empty');
  assert.ok(st.days['2026-10-12']);
});
t('week aggregation sums days and targets x7', () => {
  let st = load({});
  for (const d of ['2026-10-12', '2026-10-14']) { const r = apply(st, [{ op: 'add_meal', meal: 'yoghurt' }], d); st = r.state || r; }
  const r9 = apply(st, [{ op: 'add_meal', meal: 'yoghurt' }], '2026-10-09'); st = r9.state || r9; // previous week
  const one = dayReport(st, '2026-10-12').macros.kcal;
  const w = wr(st, '2026-10-15', '2026-10-15');
  assert.strictEqual(w.start, '2026-10-12'); assert.strictEqual(w.end, '2026-10-18');
  assert.strictEqual(w.logged, 2);
  assert.ok(Math.abs(w.macros[0].value - 2 * one) < 1e-6);
  assert.strictEqual(w.macros[0].target, FP.targets.kcal * 7);
  assert.strictEqual(w.micros.length, FP.nutrients.length);
  assert.ok(w.strip[2].has && !w.strip[1].has && w.strip[4].future && w.strip[3].today);
  assert.strictEqual(wr(st, '2026-10-05', '2026-10-15').logged, 1);
});
process.exitCode = fail;
