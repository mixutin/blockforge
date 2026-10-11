import { chromium } from 'playwright';
const URL = process.env.URL || 'http://localhost:5180/';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1600, height: 950 } });
const p = await ctx.newPage(); const errs = [];
const watch = pg => { pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); }); pg.on('pageerror', e => errs.push('pageerror: ' + e.message)); };
watch(p);
const assert = (c, m) => { console.log(c ? '✔' : '✘ FAIL', m); if (!c) process.exitCode = 1; };
const example = async i => { await p.click('#btn-examples'); await p.click(`#examples-menu button:nth-child(${i})`); await p.waitForTimeout(400); };
await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(600);

// ---- sandboxed player
await p.click('#btn-player'); await p.waitForTimeout(1500);
const sb = await p.getAttribute('.player-frame', 'sandbox'); assert(sb === 'allow-scripts', 'player iframe sandbox="' + sb + '" (no allow-same-origin)');
const fr = p.frames().find(f => f.url().includes('/player/'));
assert(!!fr, 'player frame loaded from ' + (fr && fr.url()));
assert((await fr.textContent('#title')) === 'Hello Sparky', 'project delivered over validated MessagePort');
const origin = await fr.evaluate(() => self.origin); assert(origin === 'null', 'player runs in an opaque origin: ' + origin);
const cookieAccess = await fr.evaluate(() => { try { return document.cookie; } catch (e) { return 'blocked:' + e.name; } });
assert(String(cookieAccess).startsWith('blocked'), 'player cannot read cookies (' + cookieAccess + ')');
const storageAccess = await fr.evaluate(() => { try { localStorage.length; return 'open'; } catch (e) { return 'blocked'; } });
assert(storageAccess === 'blocked', 'player cannot access editor localStorage');
const fetchBlocked = await fr.evaluate(async () => { try { await fetch('/api/me'); return 'allowed'; } catch (e) { return 'blocked'; } });
assert(fetchBlocked === 'blocked', 'player network access blocked by CSP connect-src none');
errs.splice(0); // the CSP probe above logs an expected violation
const forged = await fr.evaluate(() => { try { window.parent.postMessage({ type: 'bf-hello', v: 1 }, '*'); return 'sent'; } catch (e) { return 'err'; } });
await p.locator('.player-modal .actions button.primary').click(); await p.waitForTimeout(1500);
assert(await fr.evaluate(() => !document.querySelector('#ignite').classList.contains('x')), 'player Ignite via port');
await p.screenshot({ path: 'screenshots/11-sandboxed-player.png' });
await p.locator('.player-modal .actions button', { hasText: 'Close' }).click();

// ---- program mode example
await example(4); await p.click('#btn-ignite'); await p.waitForTimeout(600);
await p.fill('#widgets .w-textbox', 'Buy milk'); await p.click('#widgets .w-button >> text=Add note'); await p.waitForTimeout(300);
await p.fill('#widgets .w-textbox', 'Ship Blockforge'); await p.click('#widgets .w-button >> text=Add note'); await p.waitForTimeout(300);
const con = await p.textContent('#console-out');
assert(con.includes('Added: Buy milk') && con.includes('Welcome!'), 'console output + widget click events');
const notes = await p.evaluate(() => blockforge.project.targets[0].lists.notes);
assert(notes.length === 2, 'notes list filled: ' + JSON.stringify(notes));
const stats = await p.evaluate(() => JSON.stringify(blockforge.project.targets[0].variables.stats));
assert(stats === '{"added":2}', 'map value updated: ' + stats);
assert(await p.evaluate(() => blockforge.project.storage.visits) == 1, 'project storage saved (visits=1)');
await p.locator('#widgets .w-slider').fill('5'); await p.locator('#widgets .w-slider').dispatchEvent('change'); await p.waitForTimeout(300);
assert((await p.textContent('#widgets .w-label >> nth=1')).includes('5'), 'slider change event updates label');
assert(await p.evaluate(() => blockforge.runtime.drawQueue.length) >= 5, 'draw event drew shapes this frame');
await p.screenshot({ path: 'screenshots/12-program-mode-notes-app.png' });
await p.click('#btn-ignite'); await p.waitForTimeout(400);
assert(await p.evaluate(() => blockforge.project.storage.visits) == 2, 'storage persists across runs (visits=2)');

// ---- physics example
await example(5); await p.click('#btn-ignite'); await p.waitForTimeout(400);
const y1 = await p.evaluate(() => blockforge.project.targets[1].y); await p.waitForTimeout(700);
const y2 = await p.evaluate(() => blockforge.project.targets[1].y);
assert(y2 < y1, `gravity pulls ball down (${Math.round(y1)} → ${Math.round(y2)})`);
await p.keyboard.press('Space'); await p.waitForTimeout(80);
assert(await p.evaluate(() => blockforge.project.targets[1].vy) > 0, 'space adds upward velocity');
await p.waitForTimeout(600); await p.screenshot({ path: 'screenshots/13-physics-playground.png' });
await p.click('#btn-stop');

// ---- runtime guards: infinite warp loop + runaway recursion
await p.click('#btn-new'); await p.click('.modal .primary'); await p.waitForTimeout(200);
await p.click('.tab[data-tab="text"]');
await p.fill('#code', `define! spin() {\n  forever {\n    change(@n, 1)\n  }\n}\n\ndefine deep(k) {\n  deep(k + 1)\n}\n\non_ignite {\n  spin()\n}\n\non_key("r") {\n  deep(1)\n}\n`);
await p.click('#text-apply'); await p.waitForTimeout(200);
assert((await p.textContent('#text-status')).includes('Applied'), 'guard test program applied from text');
await p.click('#btn-ignite');
const frames = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; performance.now() - t0 < 1000 ? requestAnimationFrame(f) : r(n); }; requestAnimationFrame(f); }));
assert(frames > 20, `UI stays responsive during an infinite no-refresh loop (${frames} fps)`);
assert(await p.evaluate(() => blockforge.project.targets[0].variables.n) > 1000, 'loop still makes progress under the step budget');
await p.click('.tab[data-tab="blocks"]'); await p.focus('#stage'); await p.mouse.click(1300, 200);
await p.keyboard.press('r'); await p.waitForTimeout(500);
assert((await p.textContent('#toast')).includes('recursion'), 'runaway recursion stopped: ' + await p.textContent('#toast'));
await p.click('#btn-stop'); assert(await p.evaluate(() => blockforge.runtime.threads.length) === 0, 'stop button halts everything');
errs.length = errs.filter(e => !e.includes('[Blockforge runtime]')).length ? errs.length : 0;
const filtered = errs.filter(e => !e.includes('[Blockforge runtime]')); errs.splice(0, errs.length, ...filtered);

// ---- cloud: account, save, share, open shared link in sandboxed player
const user = 'tester' + Date.now() % 100000;
await example(1);
await p.click('#btn-account'); await p.fill('.modal input[type=text]', user); await p.fill('.modal input[type=password]', 'very secret pw');
await p.click('.modal button >> text=Create account'); await p.waitForTimeout(800);
assert((await p.textContent('#btn-account')).includes(user), 'signed up via POST /api/signup');
await p.click('#btn-cloud'); await p.click('.modal button.primary'); await p.waitForTimeout(800);
assert((await p.locator('.cloud-row').count()) === 1, 'project saved to cloud');
await p.click('.cloud-row button >> text=Share'); await p.waitForTimeout(800);
await p.screenshot({ path: 'screenshots/14-cloud-projects.png' });
const cid = await p.evaluate(() => blockforge.cloudId);
const p2 = await ctx.newPage(); watch(p2); await p2.goto(URL + '#share=' + cid); await p2.waitForTimeout(1800);
assert(await p2.locator('.player-modal').count() === 1, 'shared link opens in the sandboxed player first');
await p2.screenshot({ path: 'screenshots/15-shared-link-player.png' });
await p2.click('.player-modal button >> text=See inside'); await p2.waitForTimeout(300);
assert(await p2.evaluate(() => blockforge.project.name) === 'Hello Sparky', '"See inside" loads the shared project into the editor');
console.log(errs.length ? 'CONSOLE ISSUES:\n' + errs.join('\n') : '✔ no console errors or warnings');
if (errs.length) process.exitCode = 1;
await b.close();
