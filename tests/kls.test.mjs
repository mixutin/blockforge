import { exampleProjects } from '../src/project.js';
import { targetToText, parseKls, scriptToText } from '../src/kls.js';
let ok = 0, bad = 0;
for (const p of exampleProjects()) for (const t of p.targets) {
  const txt = targetToText(t); const re = parseKls(txt);
  const a = JSON.stringify(t.scripts.map(s => s.blocks)), b = JSON.stringify(re.map(s => s.blocks));
  const txt2 = targetToText({ ...t, scripts: re });
  if (txt === txt2) ok++; else { bad++; console.log('MISMATCH', p.name, t.name); console.log(txt); console.log(txt2); }
}
console.log(exampleProjects()[2].targets[1].scripts.map(scriptToText).join('\n\n'));
// error reporting
try { parseKls('on_ignite { move(10 }'); } catch (e) { console.log('err ok:', e.message); }
try { parseKls('on_ignite { flyy(10) }'); } catch (e) { console.log('err ok:', e.message); }
const x = parseKls('script { set(@x, not 1 + 2 * 3 = 7 and @y != 2) }'); console.log(scriptToText(x[0]));
console.log('roundtrip ok', ok, 'bad', bad); if (bad) process.exit(1);
