import { chromium } from 'playwright';
import fs from 'fs';
const URL = process.env.URL || 'http://localhost:5180/';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 950 }, acceptDownloads: true });
const p = await ctx.newPage();
const errs = []; const log = (...a) => console.log('✔', ...a);
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
p.on('pageerror', e => errs.push('pageerror: ' + e.message));
const assert = (c, m) => { if (!c) { console.log('✘ FAIL', m); process.exitCode = 1; } else log(m); };
await p.goto(URL); await p.waitForTimeout(800);
await p.evaluate(() => localStorage.clear());

// --- New blank project, then drag blocks from the palette
p.on('dialog', d => d.accept());
await p.click('#btn-new'); await p.click('.modal .primary'); await p.waitForTimeout(300);
async function dragEl(src, tx, ty) {
  const bb = await src.boundingBox(); const sx = bb.x + 12, sy = bb.y + 8;
  await p.mouse.move(sx, sy); await p.mouse.down(); await p.mouse.move(sx + 10, sy + 5, { steps: 3 });
  await p.mouse.move(tx, ty, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(150);
}
const pal = op => p.locator(`#palette .block[data-op="${op}"]`).first();
const ws = await p.locator('#ws').boundingBox();
await dragEl(pal('ev_ignite'), ws.x + 80, ws.y + 60);
// attach "say for secs" right under the hat
let hat = await p.locator('#ws .block[data-op="ev_ignite"]').boundingBox();
await pal('lo_sayfor').scrollIntoViewIfNeeded();
await dragEl(pal('lo_sayfor'), hat.x + 12, hat.y + hat.height + 10);
await pal('ct_repeat').scrollIntoViewIfNeeded();
let say = await p.locator('#ws .block[data-op="lo_sayfor"]').boundingBox();
await dragEl(pal('ct_repeat'), say.x + 12, say.y + say.height + 10);
let rep = await p.locator('#ws .block[data-op="ct_repeat"]').boundingBox();
await pal('mo_turnr').scrollIntoViewIfNeeded();
await dragEl(pal('mo_turnr'), rep.x + 28, rep.y + 44);
// drop a reporter into the say input
await pal('op_join').scrollIntoViewIfNeeded();
const slot = await p.locator('#ws .block[data-op="lo_sayfor"] input.txt').first().boundingBox();
const jb = await pal('op_join').boundingBox();
await p.mouse.move(jb.x + 5, jb.y + jb.height / 2); await p.mouse.down(); await p.mouse.move(jb.x + 20, jb.y + 20, { steps: 3 });
await p.mouse.move(slot.x + 5, slot.y + slot.height / 2, { steps: 12 }); await p.mouse.up(); await p.waitForTimeout(150);
const model = await p.evaluate(() => JSON.stringify(blockforge.target.scripts.map(s => s.blocks)));
const m = JSON.parse(model);
assert(m.length === 1 && m[0].map(x => x.op).join() === 'ev_ignite,lo_sayfor,ct_repeat', 'blocks snapped into one script: ' + m[0]?.map(x => x.op).join(' > '));
assert(m[0][2]?.body?.[0]?.op === 'mo_turnr', 'turn block nested inside repeat C-block');
assert(m[0][1]?.args?.[0]?.op === 'op_join', 'join reporter plugged into say input');
await p.screenshot({ path: 'screenshots/03-drag-built-script.png' });
await p.click('#btn-ignite'); await p.waitForTimeout(500);
const bubble = await p.evaluate(() => blockforge.project.targets[1].bubble?.text);
assert(bubble === 'apple pie', 'script ran; sprite says: ' + bubble);
await p.waitForTimeout(2200);
const dir = await p.evaluate(() => blockforge.project.targets[1].direction);
assert(dir !== 90, 'repeat/turn executed, direction now ' + dir);
// delete by dragging the repeat back to the palette
rep = await p.locator('#ws .block[data-op="ct_repeat"]').boundingBox();
const palBox = await p.locator('#palette').boundingBox();
await p.mouse.move(rep.x + 8, rep.y + 10); await p.mouse.down(); await p.mouse.move(rep.x + 30, rep.y + 30, { steps: 3 });
await p.mouse.move(palBox.x + 100, palBox.y + 300, { steps: 10 }); await p.mouse.up(); await p.waitForTimeout(150);
const ops2 = await p.evaluate(() => blockforge.target.scripts[0].blocks.map(b => b.op).join());
assert(ops2 === 'ev_ignite,lo_sayfor', 'dragging to palette deleted repeat: ' + ops2);

// --- Example 2 game: clones, keys
await p.click('#btn-examples'); await p.click('#examples-menu button:nth-child(2)'); await p.waitForTimeout(500);
await p.click('#btn-ignite'); await p.waitForTimeout(2600);
const clones0 = await p.evaluate(() => blockforge.runtime.clones.length);
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(500); await p.keyboard.up('ArrowLeft');
await p.waitForTimeout(1000);
const st = await p.evaluate(() => ({ clones: blockforge.runtime.clones.length, x: blockforge.project.targets[1].x, threads: blockforge.runtime.threads.length }));
assert(clones0 > 0 && st.threads > 0, 'Star Catcher running with clones: ' + JSON.stringify(st));
assert(st.x < 0, 'left-arrow key moved the player (x=' + Math.round(st.x) + ')');
await p.screenshot({ path: 'screenshots/04-example-star-catcher.png' });
// fullscreen
await p.click('#btn-full'); await p.waitForTimeout(500);
await p.screenshot({ path: 'screenshots/05-fullscreen-stage.png' });
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
await p.click('#btn-stop');
assert(await p.evaluate(() => blockforge.runtime.clones.length === 0 && blockforge.runtime.threads.length === 0), 'stop button halts threads & removes clones');

// --- Example 3: pen + custom block + list
await p.click('#btn-examples'); await p.click('#examples-menu button:nth-child(3)'); await p.waitForTimeout(500);
await p.click('#btn-ignite'); await p.waitForTimeout(3500);
const rings = await p.evaluate(() => blockforge.project.targets[0].variables.rings);
assert(rings >= 36, 'custom block polygon() drew all rings (rings=' + rings + ')');
const plist = await p.evaluate(() => blockforge.project.targets[0].lists.palette.length);
assert(plist === 5, 'list filled, palette length ' + plist);
await p.screenshot({ path: 'screenshots/06-example-pen-art.png' });

// --- Ember text view (blocks -> text -> blocks)
await p.click('.tab[data-tab="text"]'); await p.waitForTimeout(300);
const txt = await p.inputValue('#code');
assert(txt.includes('define! polygon(sides, length)') && txt.includes('on_ignite {'), 'blocks compiled to Ember text');
await p.screenshot({ path: 'screenshots/07-ember-text-view.png' });
await p.fill('#code', txt + '\non_click {\n  repeat(4) {\n    change_size(10)\n    wait(0.1)\n  }\n  say_for(join("size ", size), 1)\n}\n');
await p.click('#text-apply'); await p.waitForTimeout(300);
const n = await p.evaluate(() => blockforge.target.scripts.length);
assert(n === 4, 'text applied back to blocks (scripts: ' + n + ')');
await p.fill('#code', 'on_ignite {\n  move(10\n}'); await p.click('#text-apply');
const status = await p.textContent('#text-status'); assert(status.includes('Line'), 'parse errors reported: ' + status);
await p.click('.tab[data-tab="blocks"]'); await p.waitForTimeout(200);
await p.screenshot({ path: 'screenshots/08-blocks-from-text.png' });

// --- Costume paint editor
await p.click('.tab[data-tab="costumes"]'); await p.waitForTimeout(300);
await p.click('#cos-paint'); await p.waitForTimeout(200);
await p.click('.tab[data-tab="costumes"]');
const cv = await p.locator('#paint-canvas').boundingBox();
await p.click('#paint-tools [data-tool="ellipse"]');
await p.mouse.move(cv.x + 200, cv.y + 140); await p.mouse.down(); await p.mouse.move(cv.x + 290, cv.y + 220, { steps: 6 }); await p.mouse.up();
await p.click('#paint-tools [data-tool="brush"]'); await p.fill('#paint-color', '#3355ff');
await p.mouse.move(cv.x + 180, cv.y + 120); await p.mouse.down(); await p.mouse.move(cv.x + 300, cv.y + 250, { steps: 8 }); await p.mouse.up();
await p.waitForTimeout(300);
const cw = await p.evaluate(() => { const c = blockforge.target.costumes[blockforge.target.costume]; return [c.w, c.h, c.src.slice(0, 22)]; });
assert(cw[0] > 50 && cw[2].startsWith('data:image/png'), 'painted costume saved: ' + JSON.stringify(cw));
await p.screenshot({ path: 'screenshots/09-costume-paint-editor.png' });

// --- light theme + variable monitor + autosave
await p.click('.tab[data-tab="blocks"]');
await p.click('#btn-examples'); await p.click('#examples-menu button:nth-child(1)'); await p.waitForTimeout(400);
await p.click('#btn-theme'); await p.click('#btn-ignite'); await p.waitForTimeout(2500);
// click Sparky on the stage -> broadcast party
const pos = await p.evaluate(() => { const s = blockforge.project.targets[1]; return [s.x, s.y]; });
const sb = await p.locator('#stage').boundingBox();
await p.mouse.click(sb.x + (pos[0] + 240) * sb.width / 480, sb.y + (180 - pos[1]) * sb.height / 360); await p.waitForTimeout(400);
const party = await p.evaluate(() => blockforge.runtime.threads.some(t => t.script.blocks[0].op === 'ev_receive'));
assert(party, 'clicking sprite on stage triggered broadcast receivers');
await p.waitForTimeout(600);
await p.screenshot({ path: 'screenshots/10-light-theme-running.png' });
await p.waitForTimeout(1200);
const saved = await p.evaluate(() => !!localStorage.getItem('blockforge.autosave.v1'));
assert(saved, 'autosaved to localStorage');

// --- Save download & re-open
const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#btn-save')]);
const f = '/tmp/bf-test.bforge.json'; await dl.saveAs(f);
const json = JSON.parse(fs.readFileSync(f, 'utf8')); assert(json.format === 'blockforge' && json.targets.length === 3, 'saved JSON: ' + dl.suggestedFilename());
await p.click('#btn-new'); await p.click('.modal .primary'); await p.waitForTimeout(200);
await p.setInputFiles('#file-input', f); await p.waitForTimeout(500);
assert(await p.evaluate(() => blockforge.project.name === 'Hello Sparky' && blockforge.project.targets.length === 3), 'project re-opened from JSON file');
await p.click('#btn-theme');
// reload -> restores autosave
await p.reload(); await p.waitForTimeout(800);
assert(await p.evaluate(() => blockforge.project.name) === 'Hello Sparky', 'autosave restored after reload');
await p.screenshot({ path: 'screenshots/01-loaded.png' });
console.log(errs.length ? 'CONSOLE ISSUES:\n' + errs.join('\n') : '✔ no console errors or warnings');
if (errs.length) process.exitCode = 1;
await b.close();
