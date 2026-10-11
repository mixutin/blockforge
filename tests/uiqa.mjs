// UI QA: screenshot every screen in both themes at 1280x800, 1920x1080, 1024x768 and 390x844 (phone).
// Usage: node tests/uiqa.mjs <outdir>   (needs vite preview on :5180 + dev API logging links to /tmp/bf-api.log)
// Also runs automatic checks: horizontal overflow, clipped text, focus visibility, Esc closes dialogs, focus trap.
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
const OUT = process.argv[2] || 'screenshots/ui-qa/after'; fs.mkdirSync(OUT, { recursive: true });
const URL = process.env.URL || 'http://localhost:5180/'; const API_LOG = process.env.API_LOG || '/tmp/bf-api.log';
const ONLY = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
const VIEWPORTS = [['1280x800', 1280, 800], ['1920x1080', 1920, 1080], ['1024x768', 1024, 768], ['phone-390x844', 390, 844]];
const THEMES = ['dark', 'light'];
const issues = []; const errs = [];
const b = await chromium.launch();
const sleep = ms => new Promise(r => setTimeout(r, ms));
const link = async (email, kind) => { for (let i = 0; i < 50; i++) { const l = fs.readFileSync(API_LOG, 'utf8').split('\n').filter(x => x.includes(`to=${email} `) && x.includes(kind)); if (l.length) return l.at(-1).match(/link=(\S+)/)[1]; await sleep(100); } return null; };

// ---- one verified account with a public project and a private one
const setup = await b.newPage(); await setup.goto(URL);
const uid = Date.now().toString(36).slice(-6); const user = 'qa_' + uid, email = `qa+${uid}@example.org`, pw = 'qa password 123';
const call = (m, pa, bo) => setup.evaluate(async ([m, pa, bo]) => { const r = await fetch('/api/' + pa, { method: m, headers: bo ? { 'Content-Type': 'application/json' } : {}, body: bo ? JSON.stringify(bo) : undefined }); return r.json(); }, [m, pa, bo]);
await call('POST', 'signup', { username: user, email, password: pw });
const vt = new globalThis.URL(await link(email, '/verify?token=')).searchParams.get('token'); await call('POST', 'verify', { token: vt });
await setup.waitForFunction(() => !!localStorage.getItem('kindlr.autosave.v1'), null, { timeout: 15000 });
const projData = await setup.evaluate(() => localStorage.getItem('kindlr.autosave.v1'));
const seed = JSON.parse(projData || 'null');
let shareId = null;
if (seed) {
  seed.name = 'Star Catcher';
  const a = await call('POST', 'projects', { name: 'Star Catcher', data: JSON.stringify(seed) });
  const s = await call('POST', `projects/${a.id}/share`, { public: true, confirm: true, description: 'Catch the falling stars before they reach the ground. Every catch makes them fall a little faster!', notes: 'Press Ignite to start.\nUse the ← and → arrow keys to move the paddle.\nYou have 5 lives.' });
  shareId = s.share_id;
  await call('POST', 'projects', { name: 'Notes App (draft)', data: JSON.stringify(seed) });
}
const cookies = await setup.context().cookies(); await setup.close();
// fresh tokens for the verify/reset pages (not consumed)
await (async () => { const pg = await b.newPage(); await pg.goto(URL); await pg.evaluate(async e => fetch('/api/password/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: e }) }), email); await pg.close(); })();
const resetLink = await link(email, '/reset?token=');
const verifyLink = URL + 'verify?token=' + 'A'.repeat(43);

async function shot(page, name, tag) {
  const file = `${OUT}/${tag}--${name}.png`; await page.screenshot({ path: file });
  // automatic layout checks
  const r = await page.evaluate(() => {
    const out = []; const W = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > W + 2 && getComputedStyle(document.body).overflowX !== 'hidden') out.push('page scrolls horizontally (' + document.documentElement.scrollWidth + ' > ' + W + ')');
    for (const el of document.querySelectorAll('button, .btn, h1, h3, label, .modal p')) {
      const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetParent) continue;
      const rc = el.getBoundingClientRect(); if (rc.width === 0) continue;
      if (el.scrollWidth > el.clientWidth + 2 && cs.overflow !== 'visible' && cs.textOverflow !== 'ellipsis' && el.textContent.trim()) out.push('clipped text: ' + el.tagName.toLowerCase() + ' "' + el.textContent.trim().slice(0, 40) + '"');
      if (rc.right > W + 1 && cs.position !== 'fixed') out.push('off-screen: ' + el.tagName.toLowerCase() + ' "' + el.textContent.trim().slice(0, 30) + '"');
    }
    return [...new Set(out)].slice(0, 8);
  });
  for (const x of r) issues.push(`${tag}/${name}: ${x}`);
}
async function dialogChecks(page, tag, name) {
  const res = await page.evaluate(async () => {
    const box = document.querySelector('.modal'); if (!box) return 'no dialog';
    const f = document.activeElement; const inside = box.contains(f);
    return inside ? 'ok' : 'focus not inside dialog (' + (f && f.tagName) + ')';
  });
  if (res !== 'ok') issues.push(`${tag}/${name}: ${res}`);
  for (let i = 0; i < 25; i++) await page.keyboard.press('Tab');
  const trapped = await page.evaluate(() => { const box = document.querySelector('.modal'); return !!box && box.contains(document.activeElement); });
  if (!trapped) issues.push(`${tag}/${name}: Tab moves focus out of the dialog (no focus trap)`);
  const outline = await page.evaluate(() => { const e = document.activeElement; if (!e || e === document.body) return 'none'; const cs = getComputedStyle(e); return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 1 ? 'ok' : cs.boxShadow !== 'none' ? 'ok' : 'no visible focus on ' + e.tagName + ' "' + (e.textContent || '').trim().slice(0, 20) + '"'; });
  if (outline !== 'ok') issues.push(`${tag}/${name}: ${outline}`);
  await page.keyboard.press('Escape'); await sleep(150);
  if (await page.locator('.modal').count()) { issues.push(`${tag}/${name}: Esc does not close the dialog`); await page.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove())); }
}

for (const [vname, w, hgt] of VIEWPORTS) for (const theme of THEMES) {
  const tag = `${vname}-${theme}`; const phone = w < 600;
  if (ONLY && !ONLY.test(tag)) continue;
  const mk = async signedIn => {
    const ctx = await b.newContext({ viewport: { width: w, height: hgt }, deviceScaleFactor: 1, ...(phone ? { isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent } : {}) });
    await ctx.addInitScript(([t, si]) => { try { if (!sessionStorage.getItem('qa-init')) { localStorage.clear(); localStorage.setItem('kindlr.theme', t); if (si) localStorage.setItem('kindlr.cloud', '1'); localStorage.setItem('kindlr.mobile-ok', ''); sessionStorage.setItem('qa-init', '1'); } } catch (e) { } }, [theme, signedIn]);
    if (signedIn) await ctx.addCookies(cookies);
    const pg = await ctx.newPage(); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(tag + ': ' + m.text()); }); pg.on('pageerror', e => errs.push(tag + ': pageerror ' + e.message));
    return { ctx, pg };
  };
  // ---------- signed out
  let { ctx, pg } = await mk(false);
  await pg.goto(URL); await sleep(900);
  await shot(pg, '01-editor', tag);
  if (phone) { const ok = pg.locator('#mobile-notice button', { hasText: /editor anyway/i }); if (await ok.count()) { await ok.click(); await sleep(300); } await shot(pg, '01b-editor-after-notice', tag); }
  await pg.locator('.tab[data-tab="text"]').click({ force: true }).catch(() => {}); await sleep(400); await shot(pg, '02-script-view', tag);
  await pg.locator('.tab[data-tab="costumes"]').click({ force: true }).catch(() => {}); await sleep(500); await shot(pg, '03-paint-editor', tag);
  await pg.locator('.tab[data-tab="blocks"]').click({ force: true }).catch(() => {});
  await pg.click('#btn-account', { force: true }); await sleep(300); await shot(pg, '04-login', tag); await dialogChecks(pg, tag, 'login');
  await pg.click('#btn-account', { force: true }); await sleep(200); await pg.locator('.modal .auth-tabs button').nth(1).click(); await sleep(150); await shot(pg, '05-signup', tag);
  await pg.locator('.modal button.primary').click(); await sleep(400); await shot(pg, '05b-signup-error', tag);
  await pg.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove()));
  await pg.click('#btn-account', { force: true }); await sleep(200); await pg.locator('.modal button', { hasText: /forgot/i }).click(); await sleep(200); await shot(pg, '06-forgot-password', tag);
  await pg.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove()));
  await pg.setInputFiles('#file-input', { name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{"targets":[{"name":"Stage","isStage":true,"costumes":[],"scripts":[{"blocks":[{"op":"hack_me","args":[]}]}]}]}') });
  await sleep(250); await shot(pg, '07-error-toast', tag);
  await sleep(2600);
  await pg.click('#btn-player', { force: true }); await sleep(1500); await shot(pg, '08-player', tag); await pg.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove()));
  await pg.click('#btn-share', { force: true }); await sleep(300); await shot(pg, '09-share-signed-out', tag); await pg.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove()));
  await pg.goto(verifyLink); await sleep(500); await shot(pg, '10-verify-page', tag);
  await pg.click('#go').catch(() => {}); await sleep(600); await shot(pg, '10b-verify-error', tag);
  await pg.goto(URL + 'verify'); await sleep(400); await shot(pg, '10c-verify-missing-token', tag);
  await pg.goto(resetLink); await sleep(500); await shot(pg, '11-reset-page', tag);
  await pg.fill('#p1', 'abc').catch(() => {}); await pg.fill('#p2', 'abcd').catch(() => {}); await pg.click('#go').catch(() => {}); await sleep(300); await shot(pg, '11b-reset-validation', tag);
  await pg.goto(URL + 'explore'); await sleep(900); await shot(pg, '12-explore', tag);
  await pg.route('**/api/explore*', r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"projects":[],"page":1,"per":24,"has_more":false}' }));
  await pg.goto(URL + 'explore'); await sleep(600); await shot(pg, '12b-explore-empty', tag); await pg.unroute('**/api/explore*');
  await pg.route('**/api/explore*', r => r.fulfill({ status: 502, contentType: 'text/html', body: 'bad gateway' }));
  await pg.goto(URL + 'explore'); await sleep(600); await shot(pg, '12c-explore-error', tag); await pg.unroute('**/api/explore*');
  await pg.route('**/api/explore*', async r => { await sleep(3000); r.continue(); });
  await pg.goto(URL + 'explore'); await sleep(300); await shot(pg, '12d-explore-loading', tag); await pg.unroute('**/api/explore*');
  if (shareId) { await pg.goto(URL + 'p?id=' + shareId); await sleep(1800); await shot(pg, '13-project-page', tag); }
  await pg.goto(URL + 'p?id=' + 'Z'.repeat(22)); await sleep(700); await shot(pg, '13b-project-not-found', tag);
  if (shareId) { await pg.goto(URL + 'embed/' + shareId); await sleep(1500); await shot(pg, '14-embed', tag); }
  await pg.goto(URL + 'docs'); await sleep(700); await shot(pg, '15-docs', tag);
  await pg.goto(URL + 'this-page-does-not-exist'); await sleep(600); await shot(pg, '16-404', tag);
  await ctx.close();
  // ---------- signed in
  ({ ctx, pg } = await mk(true));
  await pg.goto(URL); await sleep(1000);
  if (phone) { const ok = pg.locator('#mobile-notice button', { hasText: /editor anyway/i }); if (await ok.count()) { await ok.click(); await sleep(300); } }
  await pg.click('#btn-account', { force: true }); await sleep(900); await shot(pg, '17-account-settings', tag); await dialogChecks(pg, tag, 'account');
  await pg.click('#btn-cloud', { force: true }); await sleep(900); await shot(pg, '18-my-projects', tag); await dialogChecks(pg, tag, 'my-projects');
  await pg.click('#btn-share', { force: true }); await sleep(1500); await shot(pg, '19-share-dialog-private', tag);
  await pg.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove()));
  await pg.click('#btn-cloud', { force: true }); await sleep(700); await pg.locator('.cloud-row', { hasText: 'Star Catcher' }).locator('button', { hasText: 'Open' }).click().catch(() => {}); await sleep(700);
  await pg.click('#btn-share', { force: true }); await sleep(1500); await shot(pg, '20-share-dialog-public', tag); await dialogChecks(pg, tag, 'share');
  await ctx.close();
  // empty state: brand-new user with no projects
  ({ ctx, pg } = await mk(false)); await pg.goto(URL); await sleep(500);
  const nu = 'qe_' + Math.random().toString(36).slice(2, 8);
  await pg.evaluate(async ([u]) => fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, email: u + '@example.org', password: 'empty state pw 1' }) }), [nu]);
  await pg.reload(); await sleep(600);
  if (phone) { const ok = pg.locator('#mobile-notice button', { hasText: /editor anyway/i }); if (await ok.count()) { await ok.click(); await sleep(300); } }
  await pg.evaluate(() => localStorage.setItem('kindlr.cloud', '1')); await pg.reload(); await sleep(800);
  if (phone) { const ok = pg.locator('#mobile-notice button', { hasText: /editor anyway/i }); if (await ok.count()) { await ok.click(); await sleep(300); } }
  await pg.click('#btn-cloud', { force: true }); await sleep(800); await shot(pg, '21-my-projects-empty', tag);
  await pg.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove()));
  await pg.click('#btn-share', { force: true }); await sleep(600); await shot(pg, '22-share-unverified', tag);
  await ctx.close();
  console.log('done', tag);
}
await b.close();
fs.writeFileSync(`${OUT}/_issues.txt`, [...new Set(issues)].join('\n') + '\n' + (errs.length ? '\nCONSOLE ERRORS:\n' + errs.join('\n') + '\n' : ''));
console.log(`\n${new Set(issues).size} automatic issues, ${errs.length} console errors → ${OUT}/_issues.txt`);
