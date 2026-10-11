// Shared safety limits — imported by the editor, the sandboxed player, and the server.
export const LIMITS = {
  maxTextBytes: 1_000_000,       // Ember source text accepted by the parser
  maxJsonBytes: 5_000_000,       // serialized project JSON
  maxDepth: 64,                  // nesting depth of blocks (C-blocks + reporters)
  maxBlocks: 20_000,             // total blocks in a project
  maxTargets: 101,               // stage + 100 sprites
  maxCostumesPerTarget: 100,
  maxScriptsPerTarget: 2_000,
  maxVariables: 1_000,           // per target (variables + lists)
  maxListLength: 200_000,        // items in one list (also enforced at runtime)
  maxStringLength: 100_000,      // any string value (runtime + stored values)
  maxNameLength: 120,            // sprite/variable/costume/block names
  maxClones: 300,                // live clones at runtime
  maxCallDepth: 400,             // custom-block recursion depth at runtime
  maxThreads: 2_000,             // concurrent scripts at runtime
  maxMapKeys: 10_000,            // keys in one map value
  maxOpsPerFrame: 100_000,       // block executions per frame before a forced yield (step budget)
  watchdogMs: 1_000,             // a single uninterrupted thread step longer than this stops the project
  maxStorageKeys: 500,           // per-project key/value storage
  maxConsoleLines: 500,
};
const byteLen = s => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s).length : Buffer.byteLength(s));
export class LimitError extends Error { constructor(m) { super(m); this.name = 'LimitError'; } }
const fail = m => { throw new LimitError(m); };

export function checkTextSize(text) { if (typeof text !== 'string') fail('Text must be a string'); if (byteLen(text) > LIMITS.maxTextBytes) fail(`Text is larger than ${LIMITS.maxTextBytes / 1e6} MB`); }

/** Parse + validate a project JSON string (or object). Throws LimitError on any violation. */
export function validateProject(input) {
  let p = input;
  if (typeof input === 'string') { if (byteLen(input) > LIMITS.maxJsonBytes) fail(`Project is larger than ${LIMITS.maxJsonBytes / 1e6} MB`); try { p = JSON.parse(input); } catch (e) { fail('Project is not valid JSON'); } }
  if (!p || typeof p !== 'object' || Array.isArray(p)) fail('Project must be an object');
  if (!Array.isArray(p.targets) || p.targets.length < 1) fail('Project has no targets');
  if (p.targets.length > LIMITS.maxTargets) fail(`Too many sprites (max ${LIMITS.maxTargets - 1})`);
  if (p.name !== undefined && (typeof p.name !== 'string' || p.name.length > LIMITS.maxNameLength)) fail('Bad project name');
  let blocks = 0;
  const str = (v, what) => { if (typeof v === 'string' && v.length > LIMITS.maxStringLength) fail(`${what} is too long`); };
  const name = (v, what) => { if (typeof v !== 'string' || v.length > LIMITS.maxNameLength) fail(`Bad ${what} name`); };
  const visitBlock = (b, depth) => {
    if (depth > LIMITS.maxDepth) fail(`Blocks nested too deeply (max ${LIMITS.maxDepth})`);
    if (!b || typeof b !== 'object' || Array.isArray(b) || typeof b.op !== 'string' || b.op.length > 40) fail('Malformed block');
    if (++blocks > LIMITS.maxBlocks) fail(`Too many blocks (max ${LIMITS.maxBlocks})`);
    if (b.args !== undefined && !Array.isArray(b.args)) fail('Malformed block args');
    if ((b.args || []).length > 20) fail('Too many block inputs');
    for (const a of b.args || []) { if (a && typeof a === 'object') visitBlock(a, depth + 1); else if (a !== null && !['string', 'number', 'boolean'].includes(typeof a)) fail('Malformed block input'); else str(a, 'Input'); }
    for (const k of ['body', 'body2']) if (b[k] !== undefined) { if (!Array.isArray(b[k])) fail('Malformed block body'); b[k].forEach(x => visitBlock(x, depth + 1)); }
    if (b.name !== undefined) name(b.name, 'block');
    if (b.params !== undefined) { if (!Array.isArray(b.params) || b.params.length > 20) fail('Too many block parameters'); b.params.forEach(x => name(x, 'parameter')); }
  };
  p.targets.forEach((t, i) => {
    if (!t || typeof t !== 'object') fail('Malformed target');
    name(t.name, 'sprite');
    if (i === 0 && !t.isStage) fail('First target must be the stage');
    const cs = t.costumes || []; if (!Array.isArray(cs) || cs.length > LIMITS.maxCostumesPerTarget) fail('Too many costumes');
    for (const c of cs) {
      if (!c || typeof c.src !== 'string' || !/^data:image\/(png|jpeg|gif|webp|svg\+xml)[;,]/.test(c.src)) fail('Costumes must be embedded data:image URLs');
      name(c.name, 'costume'); for (const k of ['w', 'h', 'cx', 'cy']) if (typeof c[k] !== 'number' || !isFinite(c[k]) || Math.abs(c[k]) > 1e5) fail('Bad costume geometry');
    }
    const vars = Object.entries(t.variables || {}), lists = Object.entries(t.lists || {});
    if (vars.length + lists.length > LIMITS.maxVariables) fail(`Too many variables (max ${LIMITS.maxVariables})`);
    vars.forEach(([k, v]) => { name(k, 'variable'); str(v, 'Variable value'); if (v && typeof v === 'object') checkMap(v); });
    lists.forEach(([k, v]) => { name(k, 'list'); if (!Array.isArray(v) || v.length > LIMITS.maxListLength) fail(`List too long (max ${LIMITS.maxListLength})`); v.forEach(x => { if (x && typeof x === 'object') fail('List items must be plain'); str(x, 'List item'); }); });
    const sc = t.scripts || []; if (!Array.isArray(sc) || sc.length > LIMITS.maxScriptsPerTarget) fail('Too many scripts');
    for (const s of sc) { if (!s || !Array.isArray(s.blocks)) fail('Malformed script'); s.blocks.forEach(b => visitBlock(b, 0)); }
  });
  if (p.storage !== undefined) { if (!p.storage || typeof p.storage !== 'object' || Array.isArray(p.storage)) fail('Bad storage'); const e = Object.entries(p.storage); if (e.length > LIMITS.maxStorageKeys) fail('Too many storage keys'); e.forEach(([k, v]) => { name(k, 'storage key'); if (v && typeof v === 'object') fail('Storage values must be plain'); str(v, 'Storage value'); }); }
  if (p.monitors !== undefined && (!Array.isArray(p.monitors) || p.monitors.length > 2000)) fail('Bad monitors');
  return p;
}
function checkMap(v) {
  if (Array.isArray(v)) fail('Variable values must be plain or maps');
  const e = Object.entries(v); if (e.length > LIMITS.maxMapKeys) fail(`Map too large (max ${LIMITS.maxMapKeys} keys)`);
  for (const [k, x] of e) { if (k.length > LIMITS.maxNameLength * 10) fail('Map key too long'); if (x && typeof x === 'object') fail('Map values must be plain'); if (typeof x === 'string' && x.length > LIMITS.maxStringLength) fail('Map value too long'); }
}
export const capStr = v => (typeof v === 'string' && v.length > LIMITS.maxStringLength ? v.slice(0, LIMITS.maxStringLength) : v);
