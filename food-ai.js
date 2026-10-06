/* Ask AI food actions. Pure helpers: no DOM, no network, no API key.
   GEMINI_MODEL is the free-tier Flash id. Change this one line to swap models.
   Oct 2026: gemini-3.8-flash is the current free Flash (gemini-2.5-flash still works on older keys). */
const GEMINI_MODEL = 'gemini-3.8-flash';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';
const MEAL_IDS = ['yoghurt', 'egg', 'third'];
const PICK_OK = {
  sweetener: { maple: 1, honey: 1 },
  meal3: { bowl: 1, steak: 1 },
  protein: { mince: 1, thigh: 1, salmon: 1, venison: 1, bison: 1 },
  carb: { rice: 1, sweet: 1 }
};
const MAX_ACTIONS = 8;
const MAX_CUSTOM = 8;

function blankFoodDay() {
  return { meals: { yoghurt: false, egg: false, third: false }, snacks: {}, custom: [] };
}
function aiMacro(v, max) {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).trim());
  if (!Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n);
}
function cleanFoodName(v) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}
function safeCustomId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{4,24}$/.test(id) ? id : '';
}
function fallbackCustomId(name, kcal, i) {
  let h = 0;
  const s = name + '|' + kcal + '|' + i;
  for (let k = 0; k < s.length; k++) h = (h * 33 + s.charCodeAt(k)) >>> 0;
  return ('c_' + h.toString(36)).slice(0, 24);
}
function normaliseCustom(c, i) {
  if (!c || typeof c !== 'object') return null;
  const name = cleanFoodName(c.name);
  if (!name) return null;
  const kcal = aiMacro(c.kcal, 4000), p = aiMacro(c.p, 300), carbs = aiMacro(c.c, 500), f = aiMacro(c.f, 300);
  if (kcal == null || p == null || carbs == null || f == null) return null;
  return {
    id: safeCustomId(c.id) || fallbackCustomId(name, kcal, i),
    name, kcal, p, c: carbs, f,
    estimate: true,
    eaten: c.eaten !== false
  };
}
function normaliseFoodDay(raw) {
  const day = blankFoodDay();
  if (!raw || typeof raw !== 'object') return day;
  const meals = raw.meals && typeof raw.meals === 'object' ? raw.meals : {};
  for (const id of MEAL_IDS) day.meals[id] = !!meals[id];
  const snacks = raw.snacks && typeof raw.snacks === 'object' && !Array.isArray(raw.snacks) ? raw.snacks : {};
  for (const id of Object.keys(snacks)) {
    if (FOOD.snackById[id] && snacks[id]) day.snacks[id] = true;
  }
  if (Array.isArray(raw.custom)) {
    const seen = {};
    raw.custom.forEach((c, i) => {
      const item = normaliseCustom(c, i);
      if (!item || seen[item.id]) return;
      seen[item.id] = true;
      if (day.custom.length < MAX_CUSTOM) day.custom.push(item);
    });
  }
  return day;
}
function eatenDayMacros(plate, day) {
  const d = day || blankFoodDay();
  let m = { kcal: 0, p: 0, c: 0, f: 0 };
  if (d.meals.yoghurt) m = foodAdd(m, plate.yoghurt);
  if (d.meals.egg) m = foodAdd(m, plate.egg);
  if (d.meals.third) m = foodAdd(m, plate.third);
  for (const item of plate.snack.picked) {
    if (d.snacks[item.id]) m = foodAdd(m, item.macros);
  }
  for (const c of d.custom) {
    if (c.eaten) m = foodAdd(m, { kcal: c.kcal, p: c.p, c: c.c, f: c.f });
  }
  return m;
}
function plannedDayMacros(plate, day) {
  const d = day || blankFoodDay();
  let extra = { kcal: 0, p: 0, c: 0, f: 0 };
  for (const c of d.custom) extra = foodAdd(extra, { kcal: c.kcal, p: c.p, c: c.c, f: c.f });
  return foodAdd(plate.day, extra);
}
function cloneFoodState(st) {
  return {
    picks: Object.assign({}, st.picks),
    snacks: st.snacks ? Object.assign({}, st.snacks) : null,
    checks: Object.assign({}, st.checks || {}),
    days: JSON.parse(JSON.stringify(st.days || {}))
  };
}
function mealLabel(id, plate) {
  if (id === 'yoghurt') return 'Yoghurt bowl';
  if (id === 'egg') return 'Egg meal';
  return plate && plate.meal3 === 'steak' ? 'Steak plate' : 'Protein bowl';
}
function pickLabel(key, value) {
  if (key === 'sweetener') return value === 'honey' ? 'honey' : 'maple';
  if (key === 'meal3') return value === 'steak' ? 'steak plate' : 'protein bowl';
  if (key === 'carb') return value === 'sweet' ? 'sweet potato' : 'rice';
  return (FOOD.proteins[value] && FOOD.proteins[value].short) || value;
}
function snackPortionName(item, portion) {
  const p = item.portions[portion];
  return (p && (p.short || p.name)) || item.short || item.name;
}

function aiBool(v) {
  if (v === true || v === 'true') return true;
  if (v === false || v === 'false') return false;
  return null;
}
function applyOneFoodAction(state, action, date) {
  if (!action || typeof action !== 'object') return { skip: 'Empty action' };
  const type = action.type;
  const day = state.days[date];
  if (type === 'set_snack') return applySnackAction(state, action, date);
  if (type === 'set_pick') {
    const key = action.key, value = String(action.value == null ? '' : action.value).toLowerCase();
    if (!PICK_OK[key] || !PICK_OK[key][value]) return { skip: 'That swap is not on the plate' };
    const bits = [];
    if (key === 'protein' && state.picks.meal3 === 'steak') {
      state.picks.meal3 = 'bowl';
      bits.push('Third meal set to the protein bowl');
    }
    if (state.picks[key] !== value) {
      state.picks[key] = value;
      const what = key === 'sweetener' ? 'Sweetener' : key === 'carb' ? 'Carb' : key === 'meal3' ? 'Third meal' : 'Protein';
      bits.push(what + ' set to ' + pickLabel(key, value));
    }
    return bits.length ? { change: bits.join('. ') } : {};
  }
  if (type === 'set_eaten_meal') {
    const meal = action.meal;
    if (MEAL_IDS.indexOf(meal) === -1) return { skip: 'Unknown meal' };
    const on = aiBool(action.eaten);
    if (on == null) return { skip: 'Say whether the meal was eaten' };
    if (!!day.meals[meal] === on) return {};
    day.meals[meal] = on;
    const plate = foodPlate(state.picks, state.snacks);
    const name = mealLabel(meal, plate);
    return { change: name + (on ? ' marked eaten' : ' marked not eaten') };
  }
  if (type === 'add_custom') {
    if (day.custom.length >= MAX_CUSTOM) return { skip: 'Too many added foods today' };
    const item = normaliseCustom({
      name: action.name, kcal: action.kcal, p: action.p, c: action.c, f: action.f,
      eaten: aiBool(action.eaten) !== false, estimate: true
    }, day.custom.length);
    if (!item) return { skip: 'Could not add that food. Need a name and kcal, protein, carbs and fat.' };
    item.id = safeCustomId(action.id) || fallbackCustomId(item.name, item.kcal, day.custom.length + Date.now() % 1000);
    if (day.custom.some(c => c.id === item.id)) item.id = fallbackCustomId(item.name, item.kcal, day.custom.length + 7);
    day.custom.push(item);
    return { change: 'Added estimate: ' + item.name + ', about ' + item.kcal + ' kcal' };
  }
  if (type === 'delete_custom') {
    const id = safeCustomId(action.id) || String(action.id || '');
    const idx = day.custom.findIndex(c => c.id === id);
    if (idx < 0) return { skip: 'That added food is not on today' };
    const name = day.custom[idx].name;
    day.custom.splice(idx, 1);
    return { change: 'Removed ' + name };
  }
  if (type === 'set_custom_eaten') {
    const id = String(action.id || '');
    const item = day.custom.find(c => c.id === id);
    if (!item) return { skip: 'That added food is not on today' };
    const on = aiBool(action.eaten);
    if (on == null) return { skip: 'Say whether that food was eaten' };
    if (item.eaten === on) return {};
    item.eaten = on;
    return { change: item.name + (on ? ' marked eaten' : ' marked not eaten') };
  }
  return { skip: 'Unknown action' };
}

function applySnackAction(state, action, date) {
  const item = FOOD.snackById[action.id];
  if (!item) return { skip: 'Unknown snack' };
  const day = state.days[date];
  const sel = Object.assign({}, snackState(state.snacks).sel);
  const before = sel[item.id] || null;
  const eatenBefore = !!day.snacks[item.id];
  let portion;
  const portionGiven = Object.prototype.hasOwnProperty.call(action, 'portion');
  const explicitlyOff = portionGiven && (action.portion === false || action.portion == null || action.portion === 'off' || action.portion === '');
  if (!portionGiven) portion = before;
  else if (explicitlyOff) portion = null;
  else portion = String(action.portion);
  const wantEaten = aiBool(action.eaten);
  if (!portion && wantEaten === true && !explicitlyOff) portion = item.defaultPortion;
  if (portion && !item.portions[portion]) return { skip: 'Unknown portion for ' + item.name };
  if (!portionGiven && wantEaten == null) return { skip: 'No snack change' };
  sel[item.id] = portion;
  state.snacks = snacksToStore(sel);
  if (portion && wantEaten === true) day.snacks[item.id] = true;
  else if (wantEaten === false || !portion) delete day.snacks[item.id];
  else if (!portion) delete day.snacks[item.id];
  const now = portion;
  const eatenNow = !!day.snacks[item.id];
  if (before === now && eatenBefore === eatenNow) return {};
  const name = now ? snackPortionName(item, now) : (item.short || item.name);
  if (!now) return { change: (item.short || item.name) + ' turned off' };
  if (before !== now && eatenNow && !eatenBefore) return { change: name + ' on and marked eaten' };
  if (before !== now && wantEaten === false) return { change: name + ' on, not marked eaten' };
  if (before !== now) return { change: name + ' on' };
  return { change: name + (eatenNow ? ' marked eaten' : ' marked not eaten') };
}

function applyFoodActions(st, actions, date) {
  const state = cloneFoodState(st || {});
  if (!state.picks) state.picks = { sweetener: 'maple', meal3: 'bowl', protein: 'mince', carb: 'rice' };
  state.days[date] = normaliseFoodDay(state.days[date]);
  const changes = [];
  const skipped = [];
  const list = Array.isArray(actions) ? actions : [];
  if (list.length > MAX_ACTIONS) skipped.push('Extra actions were ignored');
  for (const action of list.slice(0, MAX_ACTIONS)) {
    const type = action && action.type;
    const r = applyOneFoodAction(state, action, date);
    if (r.change) changes.push(r.change);
    if (r.skip) skipped.push(r.skip);
  }
  return { state, changes, skipped, changed: changes.length > 0 };
}

function foodAiContext(st, date) {
  const plate = foodPlate(st.picks, st.snacks);
  const day = normaliseFoodDay(st.days && st.days[date]);
  const eaten = eatenDayMacros(plate, day);
  const planned = plannedDayMacros(plate, day);
  const snacks = FOOD.snackItems.map(it => {
    const on = plate.snack.sel[it.id] || null;
    return {
      id: it.id,
      name: it.name,
      on,
      eaten: !!day.snacks[it.id],
      portions: Object.keys(it.portions).map(pid => {
        const p = it.portions[pid];
        return { id: pid, label: p.label, short: p.short || p.name || it.short, kcal: p.macros.kcal, p: p.macros.p, c: p.macros.c, f: p.macros.f };
      })
    };
  });
  return {
    date,
    targets: { kcal: NUTRITION.kcal, protein: NUTRITION.protein, carbs: NUTRITION.carbs, fat: NUTRITION.fat },
    eaten, planned,
    proteinLeft: NUTRITION.protein - eaten.p,
    kcalLeft: NUTRITION.kcal - eaten.kcal,
    picks: { sweetener: plate.sweetener, meal3: plate.meal3, protein: plate.protein, carb: plate.carb },
    pickOptions: { sweetener: ['maple', 'honey'], meal3: ['bowl', 'steak'], protein: ['mince', 'thigh', 'salmon', 'venison', 'bison'], carb: ['rice', 'sweet'] },
    meals: {
      yoghurt: { meal: 'yoghurt', name: 'Yoghurt bowl', sweetener: plate.sweetener, macros: plate.yoghurt, eaten: day.meals.yoghurt },
      egg: { meal: 'egg', name: 'Egg meal', macros: plate.egg, eaten: day.meals.egg },
      third: { meal: 'third', name: mealLabel('third', plate), protein: plate.proteinId, carb: plate.carb, macros: plate.third, eaten: day.meals.third }
    },
    snacks,
    custom: day.custom
  };
}

function foodAiSystem(st, date) {
  const today = foodAiContext(st, date);
  return [
    'You are Ask AI in Lockie\'s training app. He tells you what he ate, or asks about today. Reply in Australian English. Be concise: one or two short sentences. Say yoghurt, not yogurt.',
    'Call update_food every time. The reply field is what he reads (and may hear). The actions list is the only way to change food. Use an empty actions list for questions. Never claim a change that is not in actions.',
    'Trust the TODAY JSON. Protein left = proteinLeft (target 175 g minus eaten protein). Energy left = kcalLeft (target 2500 kcal minus eaten kcal). If eaten protein is 0, say nothing is ticked yet. Do not invent a different total.',
    'Action shapes:',
    '{"type":"set_eaten_meal","meal":"yoghurt"|"egg"|"third","eaten":true|false}',
    '{"type":"set_snack","id":"<snack id>","portion":"<portion id, or off>","eaten":true|false} — use only ids from TODAY.snacks.',
    '{"type":"set_pick","key":"sweetener"|"meal3"|"protein"|"carb","value":"<value from pickOptions>"}',
    '{"type":"add_custom","name":"...","kcal":0,"p":0,"c":0,"f":0} — for food that is not a meal or snack. Give a reasonable estimate for the amount he said. The app labels it as an estimate.',
    '{"type":"delete_custom","id":"<custom id>"}',
    '{"type":"set_custom_eaten","id":"<custom id>","eaten":true|false}',
    'Examples:',
    'Had the egg meal and a banana → mark meal egg eaten, and set snack id fruit portion banana eaten true. Banana is the seasonal fruit, one choice. A second piece of fruit on top is add_custom.',
    'Swap mince for chicken thigh → set_pick protein thigh. That is the protein bowl.',
    'How much protein is left → actions [] and answer from proteinLeft.',
    'A café meal or anything else not in TODAY → add_custom and say it is an estimate. Do not pretend it is on the meal plan.',
    'Do not change the shopping list. Do not undo; the app has an Undo button. No markdown.',
    'TODAY:',
    JSON.stringify(today)
  ].join('\n');
}

const FOOD_AI_TOOL = {
  name: 'update_food',
  description: 'Answer Lockie and optionally update today\'s food. Always call this. Leave actions empty when nothing should change.',
  parameters: {
    type: 'OBJECT',
    properties: {
      reply: { type: 'STRING', description: 'One or two short sentences in Australian English. No markdown.' },
      actions: {
        type: 'ARRAY',
        description: 'Validated food changes. Empty for a question.',
        items: {
          type: 'OBJECT',
          properties: {
            type: { type: 'STRING', enum: ['set_eaten_meal', 'set_snack', 'set_pick', 'add_custom', 'delete_custom', 'set_custom_eaten'] },
            meal: { type: 'STRING', enum: ['yoghurt', 'egg', 'third'] },
            eaten: { type: 'BOOLEAN' },
            id: { type: 'STRING' },
            portion: { type: 'STRING' },
            key: { type: 'STRING', enum: ['sweetener', 'meal3', 'protein', 'carb'] },
            value: { type: 'STRING' },
            name: { type: 'STRING' },
            kcal: { type: 'INTEGER' },
            p: { type: 'INTEGER' },
            c: { type: 'INTEGER' },
            f: { type: 'INTEGER' }
          },
          required: ['type']
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
