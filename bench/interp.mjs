// Interpreter benchmark suite (headless). Programs are written in Kindlr Script, parsed to the shared AST and run by
// the real scheduler (Runtime.step) until all threads finish. Usage: node bench/interp.mjs [label] [runtime-module]
const noop = () => {};
const ctx = new Proxy({}, { get: (t, k) => (k in t ? t[k] : (t[k] = typeof k === 'string' && /^(canvas|lineCap|fillStyle|strokeStyle|globalAlpha|filter|font|lineWidth)$/.test(k) ? undefined : noop)), set: (t, k, v) => { t[k] = v; return true; } });
globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => ctx, style: {} }) };
globalThis.Image = class { set src(v) { } };
const label = process.argv[2] || 'run';
const { Runtime } = await import(new URL(process.argv[3] || '../src/runtime.js', import.meta.url));
const { parseKls } = await import('../src/kls.js');
const { dict } = await import('../src/safe.js');
const fs = await import('node:fs');

function setup(stageCode, spriteCode) {
  const mk = (name, isStage, code) => ({ name, isStage, costumes: [{ name: 'c', src: '', w: 40, h: 40, cx: 20, cy: 20 }], costume: 0, x: 0, y: 0, direction: 90, size: 100, visible: true, layer: 0,
    rotationStyle: 'all around', variables: dict(), lists: dict(), effects: dict(), scripts: code ? parseKls(code).map(s => ({ ...s, x: 0, y: 0 })) : [] });
  const stage = mk('Stage', true, stageCode), sprite = mk('Hero', false, spriteCode);
  const app = { project: { targets: [stage, sprite], monitors: [] }, print: noop, clearConsole: noop, toast: m => console.log('toast:', m), hideAsk: noop, showReport: noop };
  return { rt: new Runtime(app), stage, sprite };
}
function run(name, units, unitName, stageCode, spriteCode, check) {
  const times = [];
  let last;
  for (let rep = 0; rep < 3; rep++) {
    const env = setup(stageCode, spriteCode); const { rt } = env;
    const t0 = performance.now(); rt.ignite(); let frames = 0;
    while (rt.threads.length && frames < 1e6) { rt.step(); frames++; }
    times.push(performance.now() - t0); last = { env, frames };
  }
  const best = Math.min(...times);
  const res = { name, ms: +best.toFixed(1), opsPerSec: Math.round(units / (best / 1000)), unit: unitName, frames: last.frames, ok: check ? check(last.env) : true };
  console.log(`${name.padEnd(34)} ${String(res.ms).padStart(8)} ms   ${String(res.opsPerSec.toLocaleString('en')).padStart(13)} ${unitName}/s   frames ${String(res.frames).padStart(6)}   ${res.ok ? 'ok' : 'WRONG RESULT'}`);
  return res;
}
const v = (env, n) => env.stage.variables[n];
console.log(`# interpreter benchmark: ${label} (best of 3)`);
const results = [
  run('tight loop 1M (define!)', 1e6, 'iterations', `define! work() { repeat(1000000) { change(@x, 1) } }\non_ignite { set(@x, 0)\n work() }`, '', e => v(e, 'x') === 1e6),
  run('arith loop 300k (x = x*1.0001+i%7)', 3e5, 'iterations', `define! work() { set(@i, 0)\n repeat(300000) { change(@i, 1)\n set(@x, ((@x * 1.0001) + (@i % 7))) } }\non_ignite { set(@x, 1)\n work() }`, '', e => v(e, 'i') === 3e5),
  run('recursion fib(25) (custom blocks)', 242785, 'calls', `define! fib(n) { if (n < 2) { change(@r, n) } else { fib((n - 1))\n fib((n - 2)) } }\non_ignite { set(@r, 0)\n fib(25) }`, '', e => v(e, 'r') === 75025),
  run('list ops 100k add + 100k item', 2e5, 'list ops', `define! work() { list_clear(@@L)\n repeat(100000) { list_add(random(1, 100), @@L) }\n set(@n, 0)\n repeat(100000) { change(@n, list_item(random(1, 1000), @@L)) } }\non_ignite { work() }`, '', e => e.stage.lists.L.length === 1e5),
  run('string building 20k joins', 2e4, 'joins', `define! work() { set(@s, "")\n repeat(20000) { set(@s, join(@s, "ab")) } }\non_ignite { work() }`, '', e => String(v(e, 's')).length === 4e4),
  run('300 clones x 100 frames moving', 300 * 100, 'clone-steps', '', `on_ignite { repeat(300) { clone("_myself_") } }\non_clone { repeat(100) { move(3)\n turn_right(2)\n bounce() } }`),
];
fs.mkdirSync(new URL('./results/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`./results/interp-${label}.json`, import.meta.url), JSON.stringify(results, null, 2));
