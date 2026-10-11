import { validateProject, LIMITS, checkTextSize } from '../src/limits.js';
import { parseKls } from '../src/kls.js';
import { exampleProjects } from '../src/project.js';
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log('✔', m); } else { fail++; console.log('✘', m); } };
const throws = (fn, re, m) => { try { fn(); ok(false, m + ' (did not throw)'); } catch (e) { ok(re.test(e.message), m + ' → ' + e.message); } };
const base = () => JSON.parse(JSON.stringify(exampleProjects()[0]));

for (const p of exampleProjects()) ok(!!validateProject(JSON.stringify(p)), `example "${p.name}" passes validation`);
throws(() => validateProject('x'.repeat(LIMITS.maxJsonBytes + 1)), /larger than/, 'rejects JSON over 5 MB');
throws(() => validateProject('{nope'), /valid JSON/, 'rejects invalid JSON');
let deep = { op: 'op_not', args: [null] }; for (let i = 0; i < LIMITS.maxDepth + 5; i++) deep = { op: 'op_not', args: [deep] };
let p = base(); p.targets[1].scripts.push({ x: 0, y: 0, blocks: [{ op: 'lo_say', args: [deep] }] });
throws(() => validateProject(p), /nested too deeply/, 'rejects block nesting deeper than maxDepth');
p = base(); p.targets[1].scripts.push({ x: 0, y: 0, blocks: Array.from({ length: LIMITS.maxBlocks + 1 }, () => ({ op: 'lo_show', args: [] })) });
throws(() => validateProject(p), /Too many blocks/, 'rejects more than maxBlocks blocks');
p = base(); for (let i = 0; i < LIMITS.maxTargets; i++) p.targets.push({ ...p.targets[1], name: 's' + i });
throws(() => validateProject(p), /Too many sprites/, 'rejects too many sprites');
p = base(); for (let i = 0; i <= LIMITS.maxVariables; i++) p.targets[0].variables['v' + i] = 0;
throws(() => validateProject(p), /Too many variables/, 'rejects too many variables');
p = base(); p.targets[0].lists.big = new Array(LIMITS.maxListLength + 1).fill(1);
throws(() => validateProject(p), /List too long/, 'rejects over-long lists');
p = base(); p.targets[0].variables.s = 'x'.repeat(LIMITS.maxStringLength + 1);
throws(() => validateProject(p), /too long/, 'rejects over-long strings');
p = base(); p.targets[1].costumes[0].src = 'https://evil.example/x.png';
throws(() => validateProject(p), /data:image/, 'rejects non-embedded (remote) costume URLs');
p = base(); p.targets[1].costumes[0].src = 'javascript:alert(1)';
throws(() => validateProject(p), /data:image/, 'rejects javascript: costume URLs');
p = base(); p.targets[0].variables.m = Object.fromEntries(Array.from({ length: LIMITS.maxMapKeys + 1 }, (_, i) => ['k' + i, i]));
throws(() => validateProject(p), /Map too large/, 'rejects oversized map values');
p = base(); p.storage = Object.fromEntries(Array.from({ length: LIMITS.maxStorageKeys + 1 }, (_, i) => ['k' + i, i]));
throws(() => validateProject(p), /storage/i, 'rejects oversized project storage');
throws(() => checkTextSize('x'.repeat(LIMITS.maxTextBytes + 1)), /larger than/, 'rejects Kindlr Script over 1 MB');
throws(() => parseKls('// ' + 'x'.repeat(LIMITS.maxTextBytes)), /larger than/, 'parser rejects Kindlr Script over 1 MB');
throws(() => parseKls('script { ' + 'forever { '.repeat(LIMITS.maxDepth + 2) + '}'.repeat(LIMITS.maxDepth + 2) + ' }'), /nesting deeper/, 'parser rejects deep statement nesting');
throws(() => parseKls('script { say(' + 'not '.repeat(LIMITS.maxDepth + 5) + 'false) }'), /nesting deeper/, 'parser rejects deep expression nesting');
throws(() => parseKls('script { say(' + '('.repeat(5000) + '1' + ')'.repeat(5000) + ') }'), /nesting deeper/, 'parser rejects deep parentheses (no stack overflow)');
const many = 'script {\n' + 'show\n'.repeat(LIMITS.maxBlocks + 1) + '}';
throws(() => parseKls(many), /More than/, 'parser rejects too many blocks');
throws(() => parseKls('script { __import__("os") }'), /unknown block/, 'parser rejects unknown identifiers (no JS escape hatch)');
throws(() => parseKls('script { show\n eval(constructor) }'), /reporter/, 'eval() is not code execution: reporters cannot be used as statements');
throws(() => parseKls('script { eval("alert(1)") }'), /needs a reporter/, 'eval() of a string is rejected (never executed as JS)');
throws(() => parseKls('script { say(constructor) }'), /reserved name/, 'bare identifier "constructor" is rejected as a reserved name (no prototype lookups)');
const e = parseKls('script { say(health) }')[0].blocks[0].args[0];
ok(e.op === 'param' && e.args[0] === 'health', 'other bare identifiers become inert parameter lookups');

// ---- op allow-list + prototype keys (JSON import / API / player all use validateProject)
const withBlock = blk => { const q = base(); q.targets[1].scripts.push({ x: 0, y: 0, blocks: [blk] }); return q; };
for (const op of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'valueOf', 'eval', 'xx_unknown'])
  throws(() => validateProject(withBlock({ op, args: [] })), /Unknown block/, `rejects unknown op "${op}"`);
throws(() => validateProject(JSON.stringify(withBlock({ op: 'lo_say', args: [{ op: '__proto__', args: [] }] }))), /Unknown block/, 'rejects unknown op nested in an input (JSON string)');
throws(() => validateProject(withBlock({ op: 'ct_if', args: [true], body: [{ op: 'constructor', args: [] }] })), /Unknown block/, 'rejects unknown op inside a C-block body');
throws(() => validateProject('{"targets":[{"name":"Stage","isStage":true,"costumes":[],"scripts":[{"blocks":[{"op":"__proto__","args":[]}]}]}]}'), /Unknown block/, 'rejects a literal "__proto__" op from raw JSON');
for (const k of ['__proto__', 'constructor', 'prototype']) {
  let q = base(); Object.defineProperty(q.targets[0].variables, k, { value: 1, enumerable: true });
  throws(() => validateProject(JSON.stringify(q)), /reserved name/, `rejects variable named "${k}"`);
  q = base(); Object.defineProperty(q.targets[0].lists, k, { value: [], enumerable: true });
  throws(() => validateProject(JSON.stringify(q)), /reserved name/, `rejects list named "${k}"`);
}
throws(() => validateProject('{"targets":[{"name":"__proto__","isStage":true,"costumes":[]}]}'), /reserved name/, 'rejects sprite named "__proto__"');
throws(() => validateProject('{"targets":[{"name":"Stage","isStage":true,"costumes":[]}],"storage":{"__proto__":"x"}}'), /reserved name/, 'rejects storage key "__proto__"');
throws(() => validateProject(withBlock({ op: 'var', args: ['constructor'] })), /reserved name/, 'rejects variable reporter referencing "constructor"');
throws(() => parseKls('script { set(@__proto__, 1) }'), /reserved name/, 'Kindlr Script rejects @__proto__ variable');
throws(() => parseKls('define constructor(a) { }'), /reserved name/, 'Kindlr Script rejects a custom block named constructor');
throws(() => parseKls('define f(__proto__) { }'), /reserved name/, 'Kindlr Script rejects a parameter named __proto__');
ok(({}).polluted === undefined && Object.prototype.polluted === undefined, 'Object.prototype was not polluted');
console.log(`\n${pass} passed, ${fail} failed`); if (fail) process.exit(1);
