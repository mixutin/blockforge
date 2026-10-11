// Cross-origin embed test against the REAL nginx config (deploy/nginx.example.conf + snippets, adapted only to
// plain http on port 8088; run it with tests/run-embed-xorigin.sh). Three origins (all mapped to 127.0.0.1):
//   editor  http://editor.example.com:8088   runtime http://run.example.com:8088   third party http://thirdparty.test:8088
// Checks: /embed/<id> plays inside a third-party page (nested runtime via /embed-player/), every other Kindlr page
// and the normal runtime path refuse to be framed, the embed never sends cookies, and has no account/editor actions.
import { chromium } from 'playwright';
import fs from 'node:fs';
const P = 8088, EDH = process.env.ED_HOST || 'kindlr.0x11a.org', RUNH = process.env.RUN_HOST || 'run.0x11a.org';
const ED = `http://${EDH}:${P}`, RUN = `http://${RUNH}:${P}`, TP = `http://thirdparty.test:${P}`;
const SID = process.env.SID; if (!SID) throw new Error('SID env var (public share id) required');
const THIRD = process.env.THIRD || '/tmp/ngx/third';
const page3 = (name, src) => fs.writeFileSync(`${THIRD}/${name}.html`, `<!doctype html><title>Third party</title><h1>A blog</h1><iframe id="f" src="${src}" width="482" height="412" style="border:0"></iframe>`);
page3('embed', `${ED}/embed/${SID}`); page3('editor', `${ED}/`); page3('project', `${ED}/p?id=${SID}`); page3('legacy', `${ED}/embed?id=${SID}`);
page3('run', `${RUN}/`); page3('runembed', `${RUN}/embed-player/`); page3('api', `${ED}/api/embed/${SID}`);

const b = await chromium.launch({ args: [`--host-resolver-rules=MAP ${EDH} 127.0.0.1, MAP ${RUNH} 127.0.0.1, MAP thirdparty.test 127.0.0.1`] });
const ctx = await b.newContext({ viewport: { width: 900, height: 700 } });
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? '✔' : '✘ FAIL', m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const frameState = async (pg, urlPart) => {      // 'loaded' | 'blocked' for the first child frame
  await sleep(900);
  const f = pg.frames().find(fr => fr !== pg.mainFrame());
  if (!f) return 'missing';
  if (f.url().startsWith('chrome-error://')) return 'blocked';
  try { const t = await f.evaluate(() => document.body ? document.body.innerText.length : -1); return t >= 0 ? 'loaded' : 'blocked'; } catch { return 'blocked'; }
};

// 1) the embed works inside a third-party page, with its nested player on run's /embed-player/
{
  const pg = await ctx.newPage(); const errs = []; const reqs = [];
  pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); pg.on('pageerror', e => errs.push(e.message));
  pg.on('request', r => reqs.push(r)); const bad = [];
  pg.on('response', r => { if (r.status() >= 400 && !(r.url() === `${TP}/favicon.ico`)) bad.push(r.status() + ' ' + r.url()); });
  await pg.goto(`${TP}/embed.html`);
  const ef = pg.frameLocator('#f');
  await ef.locator('#title').filter({ hasText: 'Star Catcher' }).waitFor({ timeout: 15000 });
  ok(true, 'third-party page frames /embed/<share-id> (frame-ancestors *)');
  const player = ef.frameLocator('iframe');
  const pframe = pg.frames().find(f => f.url().startsWith(`${RUN}/embed-player/`));
  ok(!!pframe, 'nested player loads from the runtime /embed-player/ path: ' + (pframe && pframe.url()));
  const sandbox = await ef.locator('iframe').getAttribute('sandbox');
  ok(sandbox === 'allow-scripts', `nested player iframe sandbox is exactly "allow-scripts" (got "${sandbox}")`);
  await ef.locator('#ig:not([disabled])').waitFor({ timeout: 10000 });
  await ef.locator('#ig').click(); await sleep(800);
  const pf = pg.frames().find(f => f.url().startsWith(`${RUN}/embed-player/`));
  const st = await pf.evaluate(() => ({ canvas: !!document.getElementById('stage'), msgHidden: document.getElementById('msg')?.hidden, title: document.getElementById('title')?.textContent }));
  ok(st.canvas && st.msgHidden === true && /Star Catcher/.test(st.title || ''), `player accepted its parent (the Kindlr embed page) and loaded the project (${JSON.stringify(st)})`);
  const remix = ef.locator('#remix');
  ok(await remix.getAttribute('target') === '_blank' && /noopener/.test(await remix.getAttribute('rel')) && (await remix.getAttribute('href')).startsWith(`${ED}/p?id=${SID}`), 'Remix is a new-tab link (target=_blank rel=noopener) to the project page, not a POST');
  ok(await ef.locator('form, input[type=password], textarea').count() === 0, 'embed page has no forms, login, or editor inputs');
  const api = reqs.filter(r => r.url().includes('/api/'));
  ok(api.length === 1 && api[0].url() === `${ED}/api/embed/${SID}` && api[0].method() === 'GET', 'embed makes exactly one API call: GET /api/embed/<id> (' + api.map(r => r.method() + ' ' + r.url()).join(', ') + ')');
  const runReqs = reqs.filter(r => r.url().startsWith(RUN));
  ok(runReqs.every(r => !r.url().includes('/api/')), 'the runtime frame makes no API calls');
  ok(bad.length === 0, 'every request of the embed succeeded' + (bad.length ? ': ' + bad.join(', ') : ''));
  ok(errs.filter(e => !/Failed to load resource/.test(e) || bad.length).length === 0, 'no console errors in the working embed' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await pg.close();
}
// 2) everything else refuses to be framed by a third party
for (const [name, what] of [['editor', 'editor /'], ['project', 'public project page /p'], ['legacy', 'legacy /embed?id= (not the embed route)'], ['run', "runtime / (frame-ancestors kindlr only)"]]) {
  const pg = await ctx.newPage(); await pg.goto(`${TP}/${name}.html`);
  ok(await frameState(pg) === 'blocked', `third-party framing of ${what} is blocked`); await pg.close();
}
{ const pg = await ctx.newPage(); await pg.goto(`${TP}/runembed.html`); await sleep(900);
  const f = pg.frames().find(fr => fr.url().startsWith(`${RUN}/embed-player/`));
  const msg = f ? await f.evaluate(() => document.getElementById('msg')?.textContent || '') : '';
  ok(!!f && /only be embedded/.test(msg), 'runtime /embed-player/ framed DIRECTLY by a third party loads but refuses to talk to it (parent origin not allow-listed)'); await pg.close(); }
// 3) no cookies: even with a session cookie present for the Kindlr host, the embed request carries none
{
  await ctx.addCookies([{ name: 'bf_dev_session', value: 'should-never-be-sent', domain: EDH, path: '/' }]);
  const pg = await ctx.newPage(); let apiReq = null;
  pg.on('request', r => { if (r.url().includes('/api/embed/')) apiReq = r; });
  const docResp = await pg.goto(`${ED}/embed/${SID}`); await pg.locator('#title').filter({ hasText: 'Star Catcher' }).waitFor({ timeout: 15000 });
  const h = apiReq ? await apiReq.allHeaders() : {};
  ok(apiReq && !('cookie' in h), 'embed data request sends no Cookie even when the browser has one for the Kindlr host (credentials: omit)');
  ok(docResp.status() === 200 && !(await docResp.allHeaders())['set-cookie'] && !(await docResp.allHeaders())['x-frame-options'], 'embed page response: 200, sets no cookie, no X-Frame-Options');
  // the normal editor (top-level) DOES send cookies, i.e. the test cookie is real
  let meReq = null; pg.on('request', r => { if (r.url().endsWith('/api/me')) meReq = r; });
  await pg.goto(`${ED}/explore`); await sleep(1200);
  ok(meReq && /should-never-be-sent/.test((await meReq.allHeaders()).cookie || ''), 'control: normal pages do send the cookie (so the embed check above is meaningful)');
  await pg.close();
}
await b.close();
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
