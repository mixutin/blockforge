// E2E: email verification, password reset, Share dialog (two-step publish, link/embed/QR, unshare), Explore,
// public project page (textContent only, Remix, sandbox), embed page, and the two security-review bugs:
// (1) Save never overwrites an unrelated cloud project, (2) unknown / prototype ops are rejected.
// Needs: vite preview on :5180 and the API in dev mode (links logged to API_LOG).
import { chromium } from 'playwright';
import fs from 'node:fs';
const URL = process.env.URL || 'http://localhost:5180/'; const API_LOG = process.env.API_LOG || '/tmp/bf-api.log';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1500, height: 940 } });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new globalThis.URL(URL).origin });
const p = await ctx.newPage(); const errs = []; let expectHttpErrors = false;
const watch = pg => { pg.on('console', m => { if (m.type() !== 'error' && m.type() !== 'warning') return; const t = m.text(); if (expectHttpErrors && /Failed to load resource/.test(t)) return; errs.push(m.type() + ': ' + t); }); pg.on('pageerror', e => errs.push('pageerror: ' + e.message)); };
watch(p);
const assert = (c, m) => { console.log(c ? '✔' : '✘ FAIL', m); if (!c) process.exitCode = 1; };
const sleep = ms => p.waitForTimeout(ms);
const example = async i => { await p.click('#btn-examples'); await p.click(`#examples-menu button:nth-child(${i})`); await sleep(400); };
const link = async (email, kind) => { for (let i = 0; i < 40; i++) { const lines = fs.readFileSync(API_LOG, 'utf8').split('\n').filter(l => l.includes(`to=${email} `) && l.includes(kind)); if (lines.length) return lines.at(-1).match(/link=(\S+)/)[1]; await sleep(100); } return null; };
const api = (method, path, body) => p.evaluate(async ([m, pa, bo]) => { const r = await fetch('/api/' + pa, { method: m, headers: bo ? { 'Content-Type': 'application/json' } : {}, body: bo ? JSON.stringify(bo) : undefined }); return { status: r.status, json: await r.json().catch(() => null) }; }, [method, path, body]);
const modal = () => p.locator('.modal').last();
const closeModals = async () => { for (let i = 0; i < 4 && await p.locator('.modal-bg').count(); i++) await p.keyboard.press('Escape').catch(() => {}), await p.evaluate(() => document.querySelectorAll('.modal-bg').forEach(e => e.remove())); };
const uid = Date.now().toString(36).slice(-6); const user = 'tester_' + uid, email = `tester+${uid}@example.org`, pw = 'forge password 1';

await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); await sleep(600);

// ---------------------------------------------------------------- sign up (email) → unverified
await p.click('#btn-account'); await modal().locator('.auth-tabs button', { hasText: 'Create account' }).click();
await modal().locator('input[type=text]').fill(user); await modal().locator('input[type=email]').fill(email); await modal().locator('input[type=password]').fill(pw);
await p.screenshot({ path: 'screenshots/16-signup-with-email.png' });
await modal().locator('button.primary').click(); await sleep(1200);
assert((await p.textContent('#btn-account')).includes('⚠ ' + user), 'signed up; account button flags unverified email');
const vlink = await link(email, '/verify?token='); assert(!!vlink && vlink.startsWith('http://localhost:5180/verify?token='), 'dev mode logs the verification link instead of sending mail');

// unverified: Share shows verify notice, publishing blocked
await p.click('#btn-share'); await sleep(500);
assert(await modal().getByText('Verify your email address before publishing').count() === 1, 'unverified user: Share dialog asks to verify first');
await modal().locator('button', { hasText: 'Resend verification email' }).click(); await sleep(500);
assert(/Sent to/.test(await modal().textContent()), 'resend button works');
await closeModals();
await p.click('#btn-account'); await sleep(600);
assert(await modal().locator('button', { hasText: 'Create token' }).isDisabled(), 'unverified user: Create token disabled');
await p.screenshot({ path: 'screenshots/17-account-unverified.png' }); await closeModals();

// ---------------------------------------------------------------- verify page (button, single-use)
const vlink2 = await link(email, '/verify?token=');   // newest link (after resend)
const vp = await ctx.newPage(); watch(vp); await vp.goto(vlink2); await vp.waitForTimeout(500);
assert(!vp.url().includes('token='), 'verify page strips the token from the address bar');
await vp.click('#go'); await vp.waitForTimeout(800);
assert((await vp.textContent('#msg')).includes('verified'), 'verify page confirms the email');
await vp.screenshot({ path: 'screenshots/18-verify-page.png' });
expectHttpErrors = true; await vp.goto(vlink2); await vp.click('#go'); await vp.waitForTimeout(800); expectHttpErrors = false;
assert(/invalid or has expired/.test(await vp.textContent('#msg')), 'verification link is single-use (UI)'); await vp.close();
await p.reload(); await sleep(900);
assert((await p.textContent('#btn-account')).includes('👤 ' + user), 'editor shows verified account');

// ---------------------------------------------------------------- Share: save → two-step publish → link/embed/QR
await example(2);   // Star Catcher
await p.click('#btn-share'); await sleep(900);
const step = modal().locator('button', { hasText: 'Make public' });
assert(await step.isDisabled(), '"Make public" disabled until the checkbox is ticked');
await modal().locator('textarea').nth(0).fill('Catch falling stars with the paddle.');
await modal().locator('textarea').nth(1).fill('Press Ignite, then use ← and →.');
await modal().locator('#share-agree').check(); await step.click(); await sleep(200);
assert(await modal().locator('.share-link').count() === 0 && (await modal().locator('button.primary').textContent()).includes('Yes, publish now'), 'first click only arms the button (explicit second click needed)');
await modal().locator('button', { hasText: 'Yes, publish now' }).click(); await sleep(900);
const shareLink = await modal().locator('.share-link').inputValue();
const sid = new globalThis.URL(shareLink).searchParams.get('id');
assert(/\/p\?id=[A-Za-z0-9_-]{22}$/.test(shareLink), 'public link uses a 22-char (128-bit) random share id: ' + shareLink);
const cref = await p.evaluate(() => JSON.parse(localStorage.getItem('kindlr.cloudref.v1')));
assert(cref && cref.id !== sid && !sid.includes(cref.id), 'share id is not the project id');
const qr = await modal().locator('canvas.qr').evaluate(c => { const g = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let dark = 0; for (let i = 0; i < g.length; i += 4) if (g[i] < 100) dark++; return { w: c.width, dark }; });
assert(qr.w >= 150 && qr.dark > 1000, 'QR code rendered client-side on a canvas');
assert((await modal().locator('.embed-code').inputValue()).startsWith('<iframe src="http://localhost:5180/embed/' + sid + '"'), 'embed snippet points at the dedicated /embed/<share-id> route');
await modal().locator('button', { hasText: 'Copy link' }).click(); await sleep(200);
assert(await p.evaluate(() => navigator.clipboard.readText()) === shareLink, 'Copy link puts the URL on the clipboard');
await p.screenshot({ path: 'screenshots/19-share-dialog.png' }); await closeModals();
const before = await api('GET', 'shared/' + sid);

// ---------------------------------------------------------------- bug 1: loads that are not "my cloud project" unlink Save
const countProjects = async () => (await api('GET', 'projects')).json.projects.length;
let n0 = await countProjects();
await example(1);   // different project
assert(await p.evaluate(() => localStorage.getItem('kindlr.cloudref.v1')) === null, 'loading an example clears the cloud link');
await p.click('#btn-cloud'); await sleep(500); await modal().locator('button', { hasText: 'Save to cloud' }).click(); await sleep(900); await closeModals();
assert(await countProjects() === n0 + 1, 'Save after loading an example creates a NEW cloud project');
const after = await api('GET', 'shared/' + sid);
assert(after.json.data === before.json.data && after.json.title === 'Star Catcher', 'the shared project was not overwritten');
// New project
await p.click('#btn-new'); await modal().locator('button.primary').click(); await sleep(300);
assert(await p.evaluate(() => localStorage.getItem('kindlr.cloudref.v1')) === null, 'New clears the cloud link');
// Open file
await p.setInputFiles('#file-input', { name: 'x.kindlr', mimeType: 'application/json', buffer: Buffer.from(before.json.data) }); await sleep(500);
assert(await p.evaluate(() => localStorage.getItem('kindlr.cloudref.v1')) === null, 'Open file clears the cloud link');
// open own cloud project, rename, save → confirm
await p.click('#btn-cloud'); await sleep(500); await modal().locator('.cloud-row', { hasText: 'Star Catcher' }).locator('button', { hasText: 'Open' }).click(); await sleep(700);
assert((await p.evaluate(() => JSON.parse(localStorage.getItem('kindlr.cloudref.v1'))))?.id === cref.id, 'opening my cloud project links it');
await p.fill('#project-name', 'Star Catcher DX'); await p.press('#project-name', 'Enter'); await sleep(200);
n0 = await countProjects();
await p.click('#btn-cloud'); await sleep(500); await modal().locator('button', { hasText: /^Save$/ }).click(); await sleep(500);
assert(await p.getByText('Overwrite cloud project?').count() === 1, 'renamed project: Save asks before overwriting');
await p.screenshot({ path: 'screenshots/20-overwrite-confirm.png' });
await modal().locator('button', { hasText: 'Save as new' }).click(); await sleep(900); await closeModals();
assert(await countProjects() === n0 + 1 && (await api('GET', 'shared/' + sid)).json.title === 'Star Catcher', '"Save as new" leaves the original (and its share) untouched');
// explicit Save as new button
n0 = await countProjects(); await p.click('#btn-cloud'); await sleep(400); await modal().locator('button', { hasText: 'Save as new' }).click(); await sleep(900); await closeModals();
assert(await countProjects() === n0 + 1, 'Cloud dialog has an explicit "Save as new"');

// ---------------------------------------------------------------- XSS-ish title, Explore, project page
const evil = '<img src=x onerror="window.__pwn=1">Title';
const proj = JSON.parse(before.json.data); proj.name = evil;
const c = await api('POST', 'projects', { name: evil, data: JSON.stringify(proj) });
await api('POST', `projects/${c.json.id}/share`, { public: true, confirm: true, description: '<b>bold?</b>', notes: '<script>window.__pwn=2</script>' });
const ep = await ctx.newPage(); watch(ep); await ep.goto(URL + 'explore'); await ep.waitForTimeout(900);
assert(await ep.locator('.pcard').count() >= 2, 'Explore lists recent public projects');
assert(await ep.locator('.pcard img').count() === 0 && await ep.evaluate(() => window.__pwn) === undefined && (await ep.locator('.pcard b').first().textContent()) === evil, 'Explore renders titles as text (no HTML injection)');
await ep.screenshot({ path: 'screenshots/21-explore.png' });
await ep.goto(shareLink); await ep.waitForTimeout(2000);
assert((await ep.textContent('h1')) === 'Star Catcher' && (await ep.textContent('.info')).includes('by ' + user), 'project page shows title and author');
assert((await ep.textContent('.info')).includes('Press Ignite, then use ← and →.') && (await ep.textContent('.info')).includes('Catch falling stars'), 'project page shows description and notes');
assert(await ep.getAttribute('.player-frame', 'sandbox') === 'allow-scripts', 'project page uses the sandboxed player (allow-scripts only)');
const pf = ep.frames().find(f => f.url().includes('/player/')); assert(pf && (await pf.textContent('#title')) === 'Star Catcher', 'player received the shared project');
await ep.screenshot({ path: 'screenshots/22-project-page.png' });
const sid2 = (await api('GET', 'projects')).json.projects.find(x => x.id === c.json.id).share_id;
await ep.goto(URL + 'p?id=' + sid2); await ep.waitForTimeout(800);
assert(await ep.locator('.info img, .info script, .info b b').count() === 0 && await ep.evaluate(() => window.__pwn) === undefined && (await ep.textContent('h1')) === evil, 'project page renders title/description/notes with textContent');
// Remix → editor opens a private copy linked to the remix
await ep.goto(shareLink); await ep.waitForTimeout(1200); await ep.click('text=Remix'); await ep.waitForTimeout(2000);
assert(ep.url().endsWith('/') || ep.url().endsWith('/#') || !ep.url().includes('cloud='), 'Remix navigates to the editor (hash consumed)');
const rref = await ep.evaluate(() => JSON.parse(localStorage.getItem('kindlr.cloudref.v1')));
assert(rref && rref.name === 'Remix of Star Catcher' && rref.id !== cref.id, 'remix opens as my own new cloud project');
// See inside → editor, not linked
await ep.goto(URL + '#share=' + sid); await ep.waitForTimeout(1500); await ep.locator('.player-modal button', { hasText: 'See inside' }).click(); await ep.waitForTimeout(500);
assert(await ep.evaluate(() => localStorage.getItem('kindlr.cloudref.v1')) === null, '"See inside" loads an unlinked copy (Save can\'t overwrite anything)');
await ep.close();
// embed page
const em = await ctx.newPage(); watch(em); await em.goto(URL + 'embed/' + sid); await em.waitForTimeout(1800);
assert(await em.getAttribute('.player-frame', 'sandbox') === 'allow-scripts' && (await em.textContent('#title')).includes('Star Catcher'), 'embed page shows the sandboxed player');
await em.screenshot({ path: 'screenshots/23-embed-page.png' }); await em.close();

// ---------------------------------------------------------------- Unshare
await p.evaluate(id => { location.hash = '#cloud=' + id; }, cref.id); await sleep(1200);
assert((await p.evaluate(() => JSON.parse(localStorage.getItem('kindlr.cloudref.v1'))))?.id === cref.id, '#cloud=<id> opens my own cloud project');
await p.click('#btn-share'); await sleep(1000);
await modal().locator('button', { hasText: 'Unshare' }).click(); await sleep(200); await modal().locator('button.primary', { hasText: 'Yes' }).click(); await sleep(800);
assert(await modal().locator('#share-agree').count() === 1, 'after Unshare the dialog is back to the private state');
await closeModals();
expectHttpErrors = true; const gone = await api('GET', 'shared/' + sid); expectHttpErrors = false;
assert(gone.status === 404, 'unshared link returns 404');

// ---------------------------------------------------------------- bug 2: unknown ops / reserved names in the editor
const bad = JSON.parse(before.json.data); bad.targets[1].scripts.push({ x: 0, y: 0, blocks: [{ op: 'constructor', args: [] }] });
await p.setInputFiles('#file-input', { name: 'bad.kindlr', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bad)) }); await sleep(400);
assert(/Unknown block/.test(await p.textContent('#toast')), 'opening a file with an unknown op shows a clear error');
const bad2 = JSON.parse(before.json.data); bad2.targets[0].variables = JSON.parse('{"__proto__":{"polluted":1}}');
await p.setInputFiles('#file-input', { name: 'bad2.kindlr', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(bad2)) }); await sleep(400);
assert(/reserved name/.test(await p.textContent('#toast')) && await p.evaluate(() => ({}).polluted) === undefined, 'a "__proto__" variable is rejected; no prototype pollution');
await p.click('.tab[data-tab="text"]').catch(() => p.getByText('Kindlr Script').click()); await sleep(300);
await p.fill('#code', 'on_ignite {\n  say(constructor)\n}\n'); await p.click('#text-apply'); await sleep(300);
assert(/reserved name/.test(await p.textContent('#text-status')), 'Kindlr Script with a reserved identifier is rejected with a clear error');
await p.click('.tab[data-tab="blocks"]').catch(() => p.getByText('Blocks', { exact: true }).click());

// ---------------------------------------------------------------- forgot / reset password
await p.click('#btn-account'); await sleep(500); await modal().locator('button', { hasText: 'Log out' }).click(); await sleep(400);
await p.click('#btn-account'); await modal().locator('button', { hasText: 'Forgot password?' }).click();
await modal().locator('input[type=email]').fill('nobody-' + uid + '@example.org'); await modal().locator('button.primary').click(); await sleep(500);
const msgUnknown = await modal().locator('.hint').last().textContent();
await closeModals(); await p.click('#btn-account'); await modal().locator('button', { hasText: 'Forgot password?' }).click();
await modal().locator('input[type=email]').fill(email); await modal().locator('button.primary').click(); await sleep(500);
const msgKnown = await modal().locator('.hint').last().textContent();
assert(msgKnown === msgUnknown && /If an account uses that email/.test(msgKnown), 'forgot-password message is identical for known and unknown emails');
await closeModals();
const rlink = await link(email, '/reset?token='); assert(!!rlink, 'reset link logged (dev mode)');
const rp = await ctx.newPage(); watch(rp); await rp.goto(rlink); await rp.fill('#p1', 'brand new forge pw'); await rp.fill('#p2', 'brand new forge pw'); await rp.click('#go'); await rp.waitForTimeout(1200);
assert((await rp.textContent('#msg')).includes('Password changed'), 'reset page sets a new password');
await rp.screenshot({ path: 'screenshots/24-reset-page.png' }); await rp.close();
const li = await api('POST', 'login', { username: user, password: 'brand new forge pw' }); assert(li.status === 200, 'can sign in with the new password');

// ---------------------------------------------------------------- account settings: delete account
await p.reload(); await sleep(800); await p.click('#btn-account'); await sleep(700);
await p.screenshot({ path: 'screenshots/25-account-settings.png' });
const dz = modal().locator('section.danger');
await dz.locator('input[type=text]').fill(user); await dz.locator('input[type=password]').fill('brand new forge pw'); await dz.locator('button.danger').click(); await sleep(900);
assert((await p.textContent('#btn-account')) === 'Sign in', 'delete account signs out');
const gone2 = await api('POST', 'login', { username: user, password: 'brand new forge pw' }); assert(gone2.status === 401, 'deleted account can no longer sign in');

assert(errs.length === 0, 'no console errors or warnings' + (errs.length ? ':\n  ' + errs.join('\n  ') : ''));
await b.close();
