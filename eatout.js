/* Eaten out: AI estimate of a restaurant meal (OpenAI, called straight from the browser with the user's own key).
   Pure helpers + one network call with an injectable fetch, so tests can mock it. Key lives only in localStorage. */
const EATOUT_MODEL = 'gpt-4.1-mini';
const EATOUT_MODELS_URL = 'https://api.openai.com/v1/models';
const EATOUT_URL = 'https://api.openai.com/v1/chat/completions';
const EATOUT_MULTS = [0.5, 0.75, 1, 1.25, 1.5, 2];
function eatoutKeys() { return ['kcal', 'protein_g', 'carbs_g', 'fat_g', 'fibre_g'].concat(FOOD_PLAN.nutrients.map(n => n.key)); }
function eatoutUnits() {
  const u = { kcal: 'kcal', protein_g: 'g', carbs_g: 'g', fat_g: 'g', fibre_g: 'g' };
  for (const n of FOOD_PLAN.nutrients) u[n.key] = n.unit.replace('µ', 'u') + ' (' + n.name + ')';
  return u;
}
function eatoutSchema() {
  const props = {}, keys = eatoutKeys();
  for (const k of keys) props[k] = { type: 'number' };
  return {
    name: 'meal_estimate', strict: true,
    schema: {
      type: 'object', additionalProperties: false, required: ['items', 'note'],
      properties: {
        note: { type: 'string' },
        items: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['name', 'portion', 'nutrients'],
          properties: { name: { type: 'string' }, portion: { type: 'string' },
            nutrients: { type: 'object', additionalProperties: false, required: keys, properties: props } } } }
      }
    }
  };
}
function eatoutMessages(text, person) {
  const units = eatoutUnits();
  const sys = 'You are a sports dietitian estimating nutrition for a meal eaten at an Australian restaurant, cafe, pub or takeaway. ' +
    'Assume typical Australian restaurant portions and cooking (oil/butter, sauces, dressings included) unless the description says otherwise. ' +
    'The eater: ' + person + '. Estimate the portion THIS person actually ate (if the text says shared/half/a few bites, scale it). ' +
    'Split the meal into separate items (each dish, side and drink). For each item give a short name, the estimated portion in plain words (e.g. "1 schnitzel ~250 g", "1 schooner"), ' +
    'and your best-estimate FULL nutrient profile for that portion using standard food composition data (AUSNUT/USDA). Never leave a micronutrient at 0 unless it is genuinely ~0 for that food; give a realistic best estimate. ' +
    'Units: ' + Object.keys(units).map(k => k + '=' + units[k]).join(', ') + '. Alcohol calories go in kcal. ' +
    'note: one short sentence on key assumptions. If the text is not food, return items: [] and say so in note.';
  return [{ role: 'system', content: sys }, { role: 'user', content: String(text).slice(0, 1500) }];
}
function eatoutRequestBody(text, person, model) {
  return { model: model || EATOUT_MODEL, temperature: 0.2, messages: eatoutMessages(text, person), response_format: { type: 'json_schema', json_schema: eatoutSchema() } };
}
function eatoutNum(v, max) { const n = Number(v); return isFinite(n) && n > 0 ? Math.min(n, max) : 0; }
function cleanEatoutText(v, len) { return String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, len); }
/* Parse the model's JSON (string or object) into { items:[{name, portion, mult, n:{key:value}}], note }. Throws with a friendly message. */
function parseEatoutEstimate(raw) {
  let obj = raw;
  if (typeof raw === 'string') {
    const s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
    try { obj = JSON.parse(s); } catch (e) { throw new Error('The AI reply wasn\'t readable. Try again.'); }
  }
  if (!obj || !Array.isArray(obj.items)) throw new Error('The AI reply had no food items. Try describing the meal again.');
  const keys = eatoutKeys(), items = [];
  for (const it of obj.items.slice(0, 15)) {
    if (!it || typeof it !== 'object') continue;
    const name = cleanEatoutText(it.name, 60);
    const src = it.nutrients && typeof it.nutrients === 'object' ? it.nutrients : it;
    const n = {};
    for (const k of keys) n[k] = eatoutNum(src[k], k === 'kcal' ? 5000 : 100000);
    if (!name || !n.kcal) continue;
    items.push({ name, portion: cleanEatoutText(it.portion, 60), mult: 1, n });
  }
  if (!items.length) throw new Error(cleanEatoutText(obj.note, 160) || 'Couldn\'t find any food in that. Try describing what you ate.');
  return { items, note: cleanEatoutText(obj.note, 200) };
}
function eatoutTotals(est) {
  const tot = {};
  for (const k of eatoutKeys()) tot[k] = 0;
  for (const it of (est && est.items) || []) {
    const m = EATOUT_MULTS.indexOf(Number(it.mult)) >= 0 ? Number(it.mult) : 1;
    for (const k of Object.keys(tot)) tot[k] += (it.n[k] || 0) * m;
  }
  for (const k of Object.keys(tot)) tot[k] = Math.round(tot[k] * 100) / 100;
  return tot;
}
/* Log the whole estimate as ONE flat estimate entry in that day's food log. Returns { state, changed, change }. */
function addEatoutEntry(state, date, est, label) {
  const st = cloneFoodState(state);
  const items = ((est && est.items) || []).filter(it => it && it.name);
  if (!items.length) return { state: st, changed: false };
  const day = ensureDay(st, date);
  if (day.items.length >= 40) return { state: st, changed: false, skip: 'Too many foods today' };
  const tot = eatoutTotals({ items });
  const names = items.map(it => it.name + (Number(it.mult) && Number(it.mult) !== 1 ? ' ×' + it.mult : '')).join(', ');
  const name = cleanFoodName((label ? cleanEatoutText(label, 40) + ': ' : 'Eaten out: ') + names);
  const parts = items.slice(0, 15).map(it => ({ name: it.name, portion: it.portion || '', mult: Number(it.mult) || 1, kcal: Math.round((it.n.kcal || 0) * (Number(it.mult) || 1)) }));
  const clean = sanitiseItem({ estimate: true, flat: true, out: true, name, tot, parts }, {});
  if (!clean) return { state: st, changed: false };
  day.items.push(clean);
  return { state: st, changed: true, change: 'Logged eaten-out meal (~' + Math.round(tot.kcal) + ' kcal)' };
}
function eatoutErrorMessage(status, body) {
  const msg = body && body.error && body.error.message ? String(body.error.message) : '';
  const code = body && body.error && (body.error.code || body.error.type) ? String(body.error.code || body.error.type) : '';
  const det = msg ? ' (' + status + ': ' + cleanEatoutText(msg, 140).replace(/sk-[A-Za-z0-9_*-]+/g, 'sk-…') + ')' : ' (' + status + ')';
  if (status === 403) return 'OpenAI refused the request for this key/project. Check the key\'s permissions at platform.openai.com.' + det;
  if (status === 401) return 'OpenAI rejected that API key. Re-copy it from platform.openai.com → API keys and paste it in Settings.' + det;
  if (status === 429 && /quota|billing/i.test(code + msg)) return 'Your OpenAI account has no credit. Add a few dollars at platform.openai.com → Billing.' + det;
  if (status === 429) return 'OpenAI is rate-limiting. Wait a few seconds and try again.' + det;
  if (status === 404 || code === 'model_not_found') return 'That model isn\'t available on your key. Clear the Model box in Settings to use ' + EATOUT_MODEL + '.' + det;
  if (status >= 500) return 'OpenAI is having trouble right now. Try again shortly.' + det;
  return 'AI request failed (' + status + ')' + (msg ? ': ' + msg.slice(0, 140) : '');
}
/* Keys pasted on a phone often carry spaces, newlines, zero-width or smart characters. Header values must be plain ASCII. */
function cleanEatoutKey(k) {
  return String(k == null ? '' : k).replace(/^\s*(?:bearer\s+)?/i, '').replace(/[\s\u200b-\u200d\u2060\ufeff\u00a0]+/g, '').replace(/^["'\u2018\u2019\u201c\u201d]+|["'\u2018\u2019\u201c\u201d]+$/g, '');
}
function eatoutKeyProblem(k) {
  if (!k) return 'Add your OpenAI API key first (Settings in the Eaten out sheet).';
  if (/[^\x21-\x7e]/.test(k)) return 'Your API key has a strange character in it (often from copy/paste). Re-copy it from OpenAI and paste it again in Settings.';
  if (!/^sk-/.test(k)) return 'That doesn\'t look like an OpenAI API key (it should start with sk-). Check it in Settings.';
  if (k.length < 20) return 'That API key looks cut short. Re-copy the whole key from OpenAI.';
  return '';
}
function cleanEatoutModel(m) {
  const s = String(m == null ? '' : m).trim().toLowerCase().replace(/[\u2010-\u2015]/g, '-').replace(/\s+/g, '-');
  return /^[a-z0-9][a-z0-9._:-]{1,63}$/.test(s) ? s : EATOUT_MODEL;
}
/* OpenAI's chat endpoint answers some errors (e.g. a wrong key) WITHOUT CORS headers, so the browser reports them as a
   network failure. /v1/models does send CORS headers, so after a failure we ask it what's actually wrong. */
async function eatoutDiagnose(key, model, f) {
  let res, data = null;
  try { res = await f(EATOUT_MODELS_URL + '/' + encodeURIComponent(model || EATOUT_MODEL), { method: 'GET', headers: { Authorization: 'Bearer ' + key } }); }
  catch (e) { return ''; }
  try { data = await res.json(); } catch (e) { data = null; }
  if (res.ok) return '';
  return eatoutErrorMessage(res.status, data);
}
async function eatoutCall(body, key, fetchFn) {
  const f = fetchFn || (typeof fetch === 'function' ? fetch : null);
  key = cleanEatoutKey(key);
  const bad = eatoutKeyProblem(key);
  if (bad) throw new Error(bad);
  if (body && body.model) body.model = cleanEatoutModel(body.model);
  if (typeof navigator !== 'undefined' && navigator && navigator.onLine === false) throw new Error('You\'re offline. Connect to the internet to estimate a meal.');
  let res;
  try {
    res = await f(EATOUT_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(body) });
  } catch (e) {
    const why = await eatoutDiagnose(key, body && body.model, f);
    if (why) throw new Error(why);
    const detail = cleanEatoutText((e && (e.name ? e.name + ': ' : '') + (e.message || '')) || String(e), 120);
    throw new Error('Couldn\'t reach OpenAI (' + (detail || 'network error') + '). Your key and model look fine, so try again in a moment.');
  }
  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }
  if (!res.ok) throw new Error(eatoutErrorMessage(res.status, data));
  return data;
}
async function estimateEatout(text, person, key, fetchFn, model) {
  if (!cleanEatoutText(text, 1500)) throw new Error('Type or say what you ate first.');
  const data = await eatoutCall(eatoutRequestBody(text, person, model), key, fetchFn);
  const choice = data && data.choices && data.choices[0];
  if (choice && choice.message && choice.message.refusal) throw new Error('The AI declined that one. Try rewording it.');
  const content = choice && choice.message && choice.message.content;
  if (!content) throw new Error('Empty reply from the AI. Try again.');
  return parseEatoutEstimate(content);
}
async function testEatoutKey(key, fetchFn, model) {
  const body = { model: model || EATOUT_MODEL, max_tokens: 1, messages: [{ role: 'user', content: 'Reply with OK' }] };
  await eatoutCall(body, key, fetchFn);
  return true;
}
