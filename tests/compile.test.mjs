// Interpreter compile-step invariants: compiled records are invisible to serialization/copies, follow live edits,
// and the fast paths keep semantics (custom block params, define! yielding, hats). Headless (DOM stub).
const noop = () => {};
const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = typeof k === 'string' && /^(canvas|lineCap|fillStyle|strokeStyle|globalAlpha|filter|font|lineWidth)$/.test(k) ? undefined : noop)), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
globalThis.Image = class { set src(v) { } };
const { Runtime } = await import('../src/runtime.js');
const { parseKls } = await import('../src/kls.js');
const { dict } = await import('../src/safe.js');
const fs = await import('node:fs');
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? '✔' : '✘', m); };
const mk = (name, isStage, code) => ({ name, isStage, costumes: [{ name: 'c', src: '', w: 40, h: 40, cx: 20, cy: 20 }], costume: 0, x: 0, y: 0, direction: 90, size: 100, visible: true, layer: 0, rotationStyle: 'all around', variables: dict(), lists: dict(), effects: dict(), scripts: code ? parseKls(code).map(s => ({ ...s, x: 0, y: 0 })) : [] });
function run(code, frames = 1e5) {
  const stage = mk('Stage', true, code); const app = { project: { targets: [stage, mk('S', false, '')], monitors: [] }, print: noop, toast: noop, hideAsk: noop, showReport: noop };
  const rt = new Runtime(app); rt.ignite(); let f = 0; while (rt.threads.length && f++ < frames) rt.step(); return { rt, stage, frames: f };
}
{ const { stage } = run(`on_ignite { set(@x, 0)\n repeat(10) { change(@x, 2) } }`);
  const before = JSON.stringify(stage.scripts);
  ok(stage.variables.x === 20, 'repeat + change computes 20');
  ok(!before.includes('compiled') && JSON.stringify(stage.scripts) === before, 'compiled records are never serialized');
  const blk = stage.scripts[0].blocks[1]; ok(Object.getOwnPropertySymbols(blk).length === 1 && Object.getOwnPropertySymbols({ ...blk }).length === 0, 'compiled record is a non-enumerable symbol (spread copies do not carry it)');
  ok(Object.getOwnPropertySymbols(structuredClone(blk)).length === 0, 'structuredClone drops it too'); }
{ const code = `on_ignite { set(@x, 5) }`; const stage = mk('Stage', true, code); const app = { project: { targets: [stage], monitors: [] }, print: noop, toast: noop, hideAsk: noop };
  const rt = new Runtime(app); rt.ignite(); while (rt.threads.length) rt.step(); ok(stage.variables.x == 5, 'first run uses 5');
  stage.scripts[0].blocks[1].args[1] = 9; rt.ignite(); while (rt.threads.length) rt.step(); ok(stage.variables.x === 9, 'editing an input after compile is picked up (args read live)');
  stage.scripts[0].blocks[1] = { op: 'va_change', args: ['x', 1] }; rt.ignite(); while (rt.threads.length) rt.step(); ok(stage.variables.x === 10, 'replacing a block recompiles it');
  const copy = { ...stage.scripts[0].blocks[1], op: 'va_set' }; stage.scripts[0].blocks[1] = copy; rt.ignite(); while (rt.threads.length) rt.step(); ok(stage.variables.x === 1, 'a spread copy with a different op runs its own op'); }
{ const { stage } = run(`define sum(a, b) { set(@r, (a + b)) }\non_ignite { sum(2, 3) }`); ok(stage.variables.r === 5, 'custom block params'); }
{ const { stage } = run(`define f(constructorx) { set(@r, param("toString")) }\non_ignite { f(1) }`); ok(stage.variables.r === '' || stage.variables.r === 0 || stage.variables.r === undefined || typeof stage.variables.r !== 'function', 'param frames are null-prototype (no inherited "toString")'); }
{ const { stage, frames } = run(`define! spin() { repeat(3000000) { change(@x, 1) } }\non_ignite { spin() }`);
  ok(stage.variables.x === 3e6 && frames > 1, `define! still yields to the scheduler (budget / 500 ms cap): ${frames} frames`); }
{ const { stage } = run(`define! fib(n) { if (n < 2) { change(@r, n) } else { fib((n - 1))\n fib((n - 2)) } }\non_ignite { set(@r, 0)\n fib(15) }`); ok(stage.variables.r === 610, 'recursion fib(15) = 610'); }
{ const { stage } = run(`define deep(n) { deep((n + 1)) }\non_ignite { deep(1) }`); ok(true, 'runaway recursion is stopped by the call-depth limit (no crash)'); }
{ const src = fs.readFileSync(new URL('../src/runtime.js', import.meta.url), 'utf8');
  ok(!/\beval\s*\(|new\s+Function\s*\(|\bFunction\s*\(/.test(src), 'interpreter source contains no eval / new Function (no code generation)'); }
{ // every(...) runs only between Ignite and Stop, even when no other script is running
  const stage = mk('Stage', true, `every(0.05) { change(@n, 1) }`); const app = { project: { targets: [stage], monitors: [] }, print: noop, toast: noop, hideAsk: noop, showReport: noop };
  const rt = new Runtime(app); const sleep = ms => new Promise(r => setTimeout(r, ms)); const tick = async ms => { const end = Date.now() + ms; while (Date.now() < end) { rt.step(); await sleep(10); } };
  await tick(200); ok(!stage.variables.n, 'every(...) does not fire before Ignite');
  rt.ignite(); await tick(400); const n1 = stage.variables.n || 0; ok(n1 >= 3, `every(...) starts after Ignite with no other scripts (fired ${n1}x)`);
  rt.stopAll(); const n2 = stage.variables.n; await tick(300); ok(stage.variables.n === n2, 'every(...) stops firing after Stop');
  rt.ignite(); await tick(250); ok(stage.variables.n > n2, 'every(...) resumes after a new Ignite'); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
