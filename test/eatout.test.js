/* node test/eatout.test.js — Eaten out: request shape, parsing, logging, errors (mocked OpenAI). */
const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const root = path.join(__dirname, '..');
const context = { console, Math, JSON, Date, Number, String, Object, Array, isFinite, parseInt, Error, Promise };
vm.createContext(context);
for (const f of ['food-plan.js', 'food-log.js', 'eatout.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), context, { filename: f });
const g = n => vm.runInContext(n, context);
const DATE = '2026-10-13';
const KEYS = g('eatoutKeys()');
function nut(kcal, extra) { const n = {}; for (const k of KEYS) n[k] = 1; n.kcal = kcal; return Object.assign(n, extra || {}); }
const REPLY = { note: 'Pub portions.', items: [
  { name: 'Chicken parmy', portion: '1 schnitzel ~300 g', nutrients: nut(800, { protein_g: 55, iron_mg: 3 }) },
  { name: 'Chips', portion: '1 side', nutrients: nut(400, { protein_g: 5, iron_mg: 1 }) }] };
function mockFetch(status, body, seen) {
  return async (url, opts) => { if (seen) { seen.url = url; seen.opts = opts; } return { ok: status < 300, status, json: async () => body }; };
}
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('schema covers every tracked nutrient, strict', () => {
  const s = g('eatoutSchema()');
  assert.strictEqual(s.strict, true);
  const req = s.schema.properties.items.items.properties.nutrients.required;
  assert.strictEqual(req.length, 5 + g('FOOD_PLAN').nutrients.length);
  for (const n of g('FOOD_PLAN').nutrients) assert.ok(req.includes(n.key), n.key);
});
test('request: model, json_schema, bearer key, Australian portions, person', async () => {
  const seen = {};
  const est = await g('estimateEatout')('parmy and chips', 'TESTPERSON', 'sk-test-0123456789abcdefXYZ', mockFetch(200, { choices: [{ message: { content: JSON.stringify(REPLY) } }] }, seen));
  assert.strictEqual(seen.url, 'https://api.openai.com/v1/chat/completions');
  assert.strictEqual(seen.opts.headers.Authorization, 'Bearer sk-test-0123456789abcdefXYZ');
  const body = JSON.parse(seen.opts.body);
  assert.strictEqual(body.model, 'gpt-4.1-mini');
  assert.strictEqual(body.response_format.type, 'json_schema');
  assert.ok(/Australian/.test(body.messages[0].content) && /TESTPERSON/.test(body.messages[0].content));
  assert.strictEqual(est.items.length, 2);
  assert.strictEqual(est.items[0].n.protein_g, 55);
});
test('parse: tolerates code fences, drops junk/zero-kcal items, clamps negatives', () => {
  const p = g('parseEatoutEstimate')('```json\n' + JSON.stringify({ note: '', items: [{ name: 'X', portion: '', nutrients: nut(0) }, { name: 'Y', portion: 'p', nutrients: nut(100, { iron_mg: -5 }) }, null] }) + '\n```');
  assert.strictEqual(p.items.length, 1);
  assert.strictEqual(p.items[0].n.iron_mg, 0);
  assert.throws(() => g('parseEatoutEstimate')('not json'), /readable/);
  assert.throws(() => g('parseEatoutEstimate')({ items: [], note: 'That is not food.' }), /not food/);
});
test('key/model cleaning: whitespace, newlines, zero-width, Bearer prefix, quotes; model typo-tolerant', () => {
  assert.strictEqual(g('cleanEatoutKey')('  Bearer sk-abc\u200b123\n '), 'sk-abc123');
  assert.strictEqual(g('cleanEatoutKey')('\u201csk-abc\u201d'), 'sk-abc');
  assert.match(g('eatoutKeyProblem')('sk-ab\u2026cdefghijklmnopqrstuvwxyz'), /strange character/);
  assert.match(g('eatoutKeyProblem')('abc-0123456789012345678'), /start with sk-/);
  assert.strictEqual(g('eatoutKeyProblem')('sk-proj-0123456789abcdefghij'), '');
  assert.strictEqual(g('cleanEatoutModel')(' GPT\u20114.1 mini '), 'gpt-4.1-mini');
  assert.strictEqual(g('cleanEatoutModel')(''), 'gpt-4.1-mini');
  assert.strictEqual(g('cleanEatoutModel')('gpt-4o'), 'gpt-4o');
});
test('dirty key is sent clean; user model honoured', async () => {
  const seen = {};
  await g('estimateEatout')('steak', 'P', ' sk-test-0123456789abcdefXYZ\n', mockFetch(200, { choices: [{ message: { content: JSON.stringify(REPLY) } }] }, seen), ' gpt-4o ');
  assert.strictEqual(seen.opts.headers.Authorization, 'Bearer sk-test-0123456789abcdefXYZ');
  assert.strictEqual(JSON.parse(seen.opts.body).model, 'gpt-4o');
});
test('network failure (CORS-less 401) is diagnosed via /v1/models and shows real detail', async () => {
  const calls = [];
  const f = async (url, opts) => { calls.push(url); if (opts.method === 'POST') throw new TypeError('Load failed');
    return { ok: false, status: 401, json: async () => ({ error: { message: 'Incorrect API key provided: sk-test-****XYZ.', code: 'invalid_api_key' } }) }; };
  await assert.rejects(g('estimateEatout')('steak', 'P', 'sk-test-0123456789abcdefXYZ', f), e => /rejected that API key/.test(e.message) && /401/.test(e.message) && !/sk-test-\*/.test(e.message));
  assert.strictEqual(calls[1], 'https://api.openai.com/v1/models/gpt-4.1-mini');
});
test('network failure with healthy key shows the raw error', async () => {
  const f = async (url, opts) => { if (opts.method === 'POST') throw new TypeError('Load failed'); return { ok: true, status: 200, json: async () => ({ id: 'gpt-4.1-mini' }) }; };
  await assert.rejects(g('estimateEatout')('steak', 'P', 'sk-test-0123456789abcdefXYZ', f), /Couldn't reach OpenAI \(TypeError: Load failed\)/);
});
test('model 404 detail', async () => {
  await assert.rejects(g('estimateEatout')('steak', 'P', 'sk-test-0123456789abcdefXYZ', mockFetch(404, { error: { message: 'The model gpt-9 does not exist', code: 'model_not_found' } })), /isn't available.*404: The model gpt-9/);
});

test('log: one estimate entry, multiplier + removal respected, counted in day + week', () => {
  const est = g('parseEatoutEstimate')(REPLY);
  est.items[0].mult = 0.5; // half the parmy
  const res = g('addEatoutEntry')(g('loadFoodState')({}), DATE, est);
  assert.ok(res.changed);
  const day = res.state.days[DATE];
  assert.strictEqual(day.items.length, 1);
  const it = day.items[0];
  assert.ok(it.estimate && it.flat && it.out);
  assert.strictEqual(it.tot.kcal, 800);
  assert.strictEqual(it.parts.length, 2);
  const rep = g('dayReport')(res.state, DATE, 20);
  assert.strictEqual(Math.round(rep.macros.kcal), 800);
  assert.strictEqual(Math.round(rep.macros.p), 33);
  assert.ok(rep.estimate);
  assert.strictEqual(Math.round(rep.nutrients.find(n => n.key === 'iron_mg').value * 10) / 10, 2.5);
  const wk = g('weekReport')(res.state, DATE, DATE);
  assert.strictEqual(Math.round(wk.macros[0].value), 800);
  // survives a save/load round trip
  const again = g('loadFoodState')(JSON.parse(JSON.stringify(res.state)));
  assert.ok(again.days[DATE].items[0].out);
  assert.strictEqual(again.days[DATE].items[0].tot.kcal, 800);
  // removing an item before logging
  const est2 = g('parseEatoutEstimate')(REPLY); est2.items.splice(1, 1);
  assert.strictEqual(g('addEatoutEntry')(g('loadFoodState')({}), DATE, est2).state.days[DATE].items[0].tot.kcal, 800);
  assert.strictEqual(g('addEatoutEntry')(g('loadFoodState')({}), DATE, { items: [] }).changed, false);
});
test('errors: no key, bad key, no credit, offline/network, refusal', async () => {
  const est = g('estimateEatout');
  await assert.rejects(est('pizza', 'p', '', mockFetch(200, {})), /API key/);
  await assert.rejects(est('pizza', 'p', 'sk-test-0123456789abcdefXYZ', mockFetch(401, { error: { message: 'bad' } })), /rejected/);
  await assert.rejects(est('pizza', 'p', 'sk-test-0123456789abcdefXYZ', mockFetch(429, { error: { code: 'insufficient_quota' } })), /credit/);
  await assert.rejects(est('pizza', 'p', 'sk-test-0123456789abcdefXYZ', async () => { throw new TypeError('Failed to fetch'); }), /reach OpenAI/);
  await assert.rejects(est('pizza', 'p', 'sk-test-0123456789abcdefXYZ', mockFetch(200, { choices: [{ message: { refusal: 'no' } }] })), /declined/);
  await assert.rejects(est('  ', 'p', 'sk-test-0123456789abcdefXYZ', mockFetch(200, {})), /what you ate/);
  assert.strictEqual(await g('testEatoutKey')('sk-test-0123456789abcdefXYZ', mockFetch(200, { choices: [] })), true);
});
(async () => {
  for (const [name, fn] of tests) {
    try { await fn(); console.log('ok', name); }
    catch (e) { console.error('FAIL', name, String(e.message).split('\n').slice(0, 4).join(' ')); process.exitCode = 1; }
  }
})();
