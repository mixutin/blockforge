// Runtime prototype-safety tests: unknown/prototype op names never dispatch, and variable / map / storage keys
// like "__proto__", "constructor" or "toString" behave as plain data. Uses a tiny DOM stub (no browser needed).
const noop = () => {};
const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = typeof k === 'string' && /^(canvas|lineCap|fillStyle|strokeStyle|globalAlpha|filter|font|lineWidth)$/.test(k) ? undefined : noop)), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
globalThis.Image = class { set src(v) { } };
const { Runtime } = await import('../src/runtime.js');
const { DEFS, isKnownOp } = await import('../src/blocks.js');
const { has, get, put, dict } = await import('../src/safe.js');
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? '✔' : '✘', m); };

const stage = { name: 'Stage', isStage: true, costumes: [], costume: 0, variables: dict(), lists: dict(), scripts: [], effects: dict() };
const sprite = { name: 'S', isStage: false, costumes: [], costume: 0, x: 0, y: 0, direction: 90, size: 100, visible: true, variables: dict(), lists: dict(), scripts: [], effects: dict() };
const app = { project: { targets: [stage, sprite], monitors: [] }, print: noop, clearConsole: noop, toast: noop };
const rt = new Runtime(app);
Object.defineProperty(rt, 'stage', { get: () => stage, configurable: true });
const th = { target: sprite, frames: [], warp: 0, done: false };
const run = b => { const g = rt.exec(b, th); let r; do { r = g.next(); } while (!r.done); };
const ev = b => rt.evalBlock(b, th);

for (const op of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf'])
  ok(!isKnownOp(op) && DEFS[op] === undefined, `DEFS has no "${op}" (null prototype)`);
let threw = false; try { for (const op of ['constructor', 'toString', '__proto__', 'nope']) { run({ op, args: [] }); ev({ op, args: [] }); } } catch (e) { threw = e; }
ok(!threw, 'unknown/prototype ops are ignored by the interpreter, never dispatched' + (threw ? ' → ' + threw.message : ''));
ok(ev({ op: 'constructor', args: [] }) === '', 'reporter "constructor" evaluates to empty, not Object()');

// variables named like prototype keys created dynamically at runtime (e.g. via "for each" names)
run({ op: 'va_set', args: ['constructor', 42] }); run({ op: 'va_set', args: ['__proto__', 'x'] }); run({ op: 'va_change', args: ['toString', 5] });
ok(ev({ op: 'var', args: ['constructor'] }) === 42, 'variable "constructor" stores data');
ok(ev({ op: 'var', args: ['__proto__'] }) === 'x' && has(stage.variables, '__proto__'), 'variable "__proto__" is an own data property');
ok(ev({ op: 'var', args: ['toString'] }) === 5, 'changing an undefined "toString" variable starts at 0');
ok(Object.getPrototypeOf(stage.variables) === null, 'variables dictionary still has a null prototype');

// maps
run({ op: 'dt_newmap', args: ['m'] });
for (const k of ['__proto__', 'constructor', 'toString']) run({ op: 'dt_mapset', args: ['m', k, 'v-' + k] });
ok(ev({ op: 'dt_mapget', args: ['__proto__', 'm'] }) === 'v-__proto__' && ev({ op: 'dt_mapget', args: ['constructor', 'm'] }) === 'v-constructor', 'map keys "__proto__"/"constructor" are plain data');
ok(ev({ op: 'dt_maphas', args: ['m', 'hasOwnProperty'] }) === false && ev({ op: 'dt_mapget', args: ['valueOf', 'm'] }) === '', 'map lookups never see inherited keys');
ok(ev({ op: 'dt_mapsize', args: ['m'] }) === 3, 'map size counts the 3 own keys');
run({ op: 'dt_mapdel', args: ['__proto__', 'm'] }); ok(ev({ op: 'dt_mapsize', args: ['m'] }) === 2, 'deleting "__proto__" key works');
run({ op: 'dt_fromjson', args: ['j', '{"__proto__":{"polluted":1},"constructor":"c"}'] });
const j = get(stage.variables, 'j'); ok(j && has(j, '__proto__') && get(j, 'constructor') === 'c' && Object.getPrototypeOf(j) === null, 'from-JSON map keeps "__proto__" as data');

// lists named like prototype keys
run({ op: 'li_add', args: ['a', 'constructor'] }); ok(ev({ op: 'li_length', args: ['constructor'] }) === 1, 'list "constructor" works as a normal list');
// effects + sounds + "of" reporter with odd names
run({ op: 'lo_cheffect', args: ['__proto__', 10] }); ok(Object.getPrototypeOf(sprite.effects) === null && get(sprite.effects, '__proto__') === 10, 'effect key "__proto__" stored as data');
ok(ev({ op: 'se_of', args: ['constructor', 'S'] }) === 0 || ev({ op: 'se_of', args: ['constructor', 'S'] }) === '', '"of" reporter with "constructor" property returns no function');
ok(ev({ op: 'se_current', args: ['constructor'] }) === 0, '"current" with unknown key returns 0');

ok(({}).polluted === undefined && Object.prototype.polluted === undefined && typeof ({}).constructor === 'function', 'Object.prototype untouched');
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
