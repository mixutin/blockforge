// Generates docs/BLOCKS.md (every block with its Ember text form) from src/blocks.js.
import fs from 'node:fs';
import { CATEGORIES, DEF_LIST, argKinds } from '../src/blocks.js';
const kindName = { n: 'number', s: 'text', b: 'boolean', k: 'color "#rrggbb"' };
let md = '# Blockforge block & Ember reference\n\n_Generated from `src/blocks.js` by `npm run docs`. Every block has an exact Ember text equivalent; both compile to the same tree and run on the same interpreter._\n\n';
md += 'Notation: `@name` = variable, `@@name` = list, menu arguments are strings (e.g. `"space"`). Shapes: **hat** starts a script, **C** wraps a body `{ }`, **reporter** returns a value, **boolean** returns true/false.\n\n';
for (const c of CATEGORIES) {
  const defs = DEF_LIST.filter(d => d.cat === c.id && !['var', 'list', 'param', 'define', 'call'].includes(d.op));
  md += `## ${c.name}\n\n| Block | Ember | Shape | Inputs |\n|---|---|---|---|\n`;
  for (const d of defs) {
    const kinds = argKinds(d.op);
    const label = d.text.replace(/%i/g, '🔥').replace(/%m\.(\w+)/g, '[$1 ▾]').replace(/%n/g, '( )').replace(/%s/g, '[ ]').replace(/%b/g, '< >').replace(/%k/g, '(color)').replace(/\|/g, '\\|');
    const args = kinds.map((k, i) => k.menu ? (k.menu === 'var' ? `@var` : k.menu === 'list' ? '@@list' : `"${d.def[i] ?? ''}"`) : String(d.def[i] ?? (k.kind === 'b' ? 'false' : '0')).replace(/^(.*[^\d.-].*)$/, '"$1"'));
    let ember = d.infix ? `a ${d.infix} b` : d.op === 'op_not' ? 'not a' : args.length ? `${d.kw}(${args.join(', ')})` : d.kw;
    if (d.type === 'c' || d.type === 'cc' || d.type === 'hat') ember += ' { … }'; if (d.type === 'cc') ember += ' else { … }';
    const shape = { hat: 'hat', c: 'C', cc: 'C (if/else)', cap: 'cap', stack: 'stack', reporter: 'reporter', boolean: 'boolean' }[d.type] + (d.sprite ? ' · sprite only' : '') + (d.stage ? ' · stage only' : '');
    md += `| ${label} | \`${ember.replace(/\|/g, '\\|')}\` | ${shape} | ${kinds.map(k => k.menu ? 'menu: ' + k.menu : kindName[k.kind] || k.kind).join(', ') || '—'} |\n`;
  }
  md += '\n';
}
md += '## My Blocks\n\n| Form | Ember |\n|---|---|\n| define a block | `define name(a, b) { … }` |\n| define, run without screen refresh | `define! name(a, b) { … }` |\n| call it | `name(1, "x")` |\n| use an input inside the body | `a` (bare identifier) |\n\n## Variables & lists\n\n| Form | Ember |\n|---|---|\n| variable reporter | `@score` or `@"my score"` |\n| list reporter | `@@items` or `@@"my items"` |\n';
fs.writeFileSync('docs/BLOCKS.md', md); console.log('wrote docs/BLOCKS.md', md.length, 'bytes');
