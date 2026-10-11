// Integration tests for the Kindlr API. Spawns the server against a temp DB with MAIL_TRANSPORT=log,
// so verification / reset links are read from the server's stdout instead of a real mailbox.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import Database from 'better-sqlite3';
import { exampleProjects } from '../src/project.js';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-')); const PORT = 18787; const BASE = `http://127.0.0.1:${PORT}`; const ORIGIN = 'https://blocks.example.com';
const DB = path.join(dir, 't.db');
const srv = spawn(process.execPath, ['index.js'], { env: { ...process.env, PORT, DB_PATH: DB, ALLOWED_ORIGIN: ORIGIN, PUBLIC_URL: ORIGIN, MAIL_TRANSPORT: 'log', BLOCKS_DEV: '' }, stdio: ['ignore', 'pipe', 'inherit'] });
const mails = []; let buf = '';
srv.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i); buf = buf.slice(i + 1); const mm = /^\[mail\] to=(\S+) subject="([^"]*)"(?: link=(\S+))?/.exec(line); if (mm) mails.push({ to: mm[1], subject: mm[2], link: mm[3] }); } });
await new Promise(r => srv.stdout.once('data', r));
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? '✔' : '✘', m); };
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function mailTo(addr, kind, n = 1) { for (let i = 0; i < 40; i++) { const l = mails.filter(x => x.to === addr && x.link?.includes(kind)); if (l.length >= n) return l[l.length - 1]; await sleep(25); } return null; }
const tokenOf = link => new URL(link).searchParams.get('token');
let jar = '';
async function call(method, p, body, { origin = ORIGIN, cookie = jar, raw, auth } = {}) {
  const h = {}; if (origin) h.Origin = origin; if (cookie) h.Cookie = cookie; if (auth) h.Authorization = auth; if (body !== undefined || raw) h['Content-Type'] = 'application/json';
  const r = await fetch(BASE + p, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const sc = r.headers.get('set-cookie'); const txt = await r.text(); let json = null; try { json = JSON.parse(txt); } catch { }
  return { status: r.status, json, text: txt, setCookie: sc, headers: r.headers };
}
const cookieOf = r => r.setCookie.split(';')[0];
const proj = JSON.stringify(exampleProjects()[0]);
try {
  // ---------------------------------------------------------------- signup / login basics
  let r = await call('POST', '/api/signup', { username: 'mika', email: 'mika@example.org', password: 'short' }); ok(r.status === 400, 'signup rejects short password');
  r = await call('POST', '/api/signup', { username: 'mika', email: 'not-an-email', password: 'correct horse battery' }); ok(r.status === 400, 'signup rejects invalid email');
  r = await call('POST', '/api/signup', { username: 'mika', email: 'mika@example.org', password: 'correct horse battery' }, { origin: 'https://evil.example' }); ok(r.status === 403, 'signup rejects foreign Origin (CSRF)');
  r = await call('POST', '/api/signup', { username: 'mika', email: 'Mika@Example.ORG', password: 'correct horse battery' });
  ok(r.status === 201 && r.json.user.username === 'mika' && r.json.user.email_verified === false, 'POST /api/signup creates an unverified account');
  ok(r.json.user.email === 'Mika@example.org', 'email domain is normalised to lower case');
  ok(/^__Host-blocks_session=[\w-]+; Path=\/; HttpOnly; SameSite=Strict; Max-Age=\d+; Secure$/.test(r.setCookie) && !/Domain=/i.test(r.setCookie), 'session cookie is __Host-, Secure, HttpOnly, SameSite=Strict, Path=/, no Domain');
  jar = cookieOf(r);
  const v1 = await mailTo('Mika@example.org', '/verify?token=');
  ok(v1 && v1.link.startsWith(ORIGIN + '/verify?token='), 'signup sends a verification email with PUBLIC_URL/verify?token=');
  const vtok = tokenOf(v1.link); ok(/^[A-Za-z0-9_-]{43}$/.test(vtok) && Buffer.from(vtok, 'base64url').length === 32, 'verification token is 32 random bytes (base64url)');
  const sdb = new Database(DB, { readonly: true });
  const stored = sdb.prepare('SELECT token_hash FROM email_tokens').all().map(x => x.token_hash);
  ok(stored.length === 1 && !stored.includes(vtok) && /^[0-9a-f]{64}$/.test(stored[0]), 'tokens are stored hashed (SHA-256), never in plain text');
  r = await call('POST', '/api/signup', { username: 'MIKA', email: 'x@example.org', password: 'another password' }); ok(r.status === 409, 'usernames are unique (case-insensitive)');
  r = await call('GET', '/api/me'); ok(r.json.user?.username === 'mika' && r.json.user.email_verified === false, 'GET /api/me returns the user with verification state');

  // ---------------------------------------------------------------- unverified users: private saves OK, no publishing / tokens
  r = await call('POST', '/api/projects', { name: 'Hello', data: proj, description: 'A first project' }); ok(r.status === 201 && r.json.id, 'unverified user can save a private project'); const id = r.json.id;
  r = await call('POST', `/api/projects/${id}/share`, { public: true, confirm: true }); ok(r.status === 403 && r.json.code === 'unverified', 'unverified user cannot publish/share');
  r = await call('POST', '/api/tokens', { name: 'ci' }); ok(r.status === 403 && r.json.code === 'unverified', 'unverified user cannot create API tokens');
  r = await call('GET', '/api/explore'); ok(r.json.projects.length === 0, 'nothing on Explore yet');

  // ---------------------------------------------------------------- resend rate limit + verification
  for (let i = 0; i < 3; i++) r = await call('POST', '/api/verify/resend'); ok(r.status === 200 && r.json.remaining === 0, 'resend works 3 times');
  r = await call('POST', '/api/verify/resend'); ok(r.status === 429, '4th resend within an hour is rate-limited (429)');
  const v4 = await mailTo('Mika@example.org', '/verify?token=', 4); const vtok4 = tokenOf(v4.link);
  r = await call('POST', '/api/verify', { token: vtok }, { cookie: '' }); ok(r.status === 400, 'older verification links stop working after a resend');
  r = await call('POST', '/api/verify', { token: 'A'.repeat(43) }, { cookie: '' }); ok(r.status === 400, 'random token rejected');
  r = await call('POST', '/api/verify', { token: vtok4 }, { cookie: '' }); ok(r.status === 200 && r.json.email_verified, 'POST /api/verify verifies the email (no session needed)');
  r = await call('POST', '/api/verify', { token: vtok4 }, { cookie: '' }); ok(r.status === 400, 'verification token is single-use');
  r = await call('GET', '/api/me'); ok(r.json.user.email_verified === true, 'account now verified');

  // ---------------------------------------------------------------- expiry (24 h) via DB clock rewind
  const wdb = new Database(DB);
  r = await call('POST', '/api/signup', { username: 'slowpoke', email: 'slow@example.org', password: 'slow password 1' }, { cookie: '' }); const slowJar = cookieOf(r);
  const sv = tokenOf((await mailTo('slow@example.org', '/verify?token=')).link);
  const row = wdb.prepare("SELECT created_at, expires_at FROM email_tokens WHERE kind='verify' AND email='slow@example.org'").get();
  ok(row.expires_at - row.created_at === 24 * 3600_000, 'verification token expires after 24 h');
  wdb.prepare("UPDATE email_tokens SET expires_at = ? WHERE email='slow@example.org'").run(Date.now() - 1);
  r = await call('POST', '/api/verify', { token: sv }, { cookie: '' }); ok(r.status === 400, 'expired verification token rejected');

  // ---------------------------------------------------------------- sharing (verified)
  r = await call('POST', `/api/projects/${id}/share`, { public: true }); ok(r.status === 400, 'publishing requires explicit confirm:true');
  r = await call('POST', `/api/projects/${id}/share`, { public: true, confirm: true, description: 'Desc <b>', notes: 'Press Ignite' });
  ok(r.status === 200 && r.json.is_public === true, 'verified user can publish'); const sid = r.json.share_id;
  ok(/^[A-Za-z0-9_-]{22}$/.test(sid) && Buffer.from(sid, 'base64url').length === 16, 'share ID is 128 random bits, base64url');
  ok(sid !== id && !sid.includes(id) && !/^\d+$/.test(sid), 'share ID is unrelated to the project id');
  ok(r.json.url === `${ORIGIN}/p?id=${sid}`, 'share URL uses PUBLIC_URL');
  r = await call('POST', `/api/projects/${id}/share`, { public: true, confirm: true }); ok(r.json.share_id === sid, 're-publishing keeps the same link');
  r = await call('GET', `/api/shared/${sid}`, undefined, { cookie: '' });
  ok(r.status === 200 && r.json.data === proj && r.json.author === 'mika' && r.json.title === 'Hello' && r.json.description === 'Desc <b>' && r.json.notes === 'Press Ignite', 'public project readable anonymously with title/author/description/notes');
  r = await call('GET', `/api/shared/${id}`, undefined, { cookie: '' }); ok(r.status === 404, 'project id is not a share id');
  { const e1 = await call('GET', `/api/embed/${sid}`, undefined, { cookie: '' });
    ok(e1.status === 200 && e1.json.data && e1.json.author && !('notes' in e1.json) && !e1.headers.get('set-cookie'), 'embed route serves public project data without cookies');
    const e2 = await call('GET', `/api/embed/${sid}`, undefined, { cookie: 'bf_dev_session=garbage; __Host-blocks_session=garbage' });
    ok(e2.status === 200 && !e2.headers.get('set-cookie'), 'embed route ignores any session cookie sent (no 401, no Set-Cookie)');
    const e3 = await call('POST', `/api/embed/${sid}`, {}); ok(e3.status === 405, 'embed route is read-only');
    const e4 = await call('GET', `/api/embed/${id}`, undefined, { cookie: '' }); ok(e4.status === 404, 'embed route needs a share id, not a project id'); }
  { const a = await call('GET', `/api/shared/${sid}`, undefined, { cookie: '' }); const et = a.headers.get('etag');
    ok(et && /must-revalidate/.test(a.headers.get('cache-control')) && !a.headers.get('set-cookie'), 'public shared project has an ETag + revalidation, no cookie');
    const c = await fetch(BASE + `/api/shared/${sid}`, { headers: { 'If-None-Match': et } }); ok(c.status === 304, 'If-None-Match → 304 Not Modified');
    const me = await call('GET', `/api/projects/${id}`); ok(me.headers.get('cache-control') === 'no-store' && !me.headers.get('etag'), 'session responses stay no-store (no ETag)');
    await call('PUT', `/api/projects/${id}`, { name: 'Hello', data: proj, description: 'changed' }); await new Promise(r => setTimeout(r, 2));
    const d = await call('GET', `/api/shared/${sid}`, undefined, { cookie: '' }); ok(d.headers.get('etag') !== et && d.json.description === 'changed', 'cache/ETag change after an update'); }
  r = await call('GET', '/api/explore'); ok(r.json.projects.length === 1 && r.json.projects[0].share_id === sid && !('data' in r.json.projects[0]) && !('id' in r.json.projects[0]), 'Explore lists the project (no data, no private id)');
  // randomness across many shares
  const ids = new Set(); for (let i = 0; i < 12; i++) { const c = await call('POST', '/api/projects', { name: 'p' + i, data: proj }); const s = await call('POST', `/api/projects/${c.json.id}/share`, { public: true, confirm: true }); ids.add(s.json.share_id); }
  const all = [...ids]; const chars = new Set(all.join(''));
  ok(ids.size === 12 && all.every(s => SHARE_OK(s)) && chars.size > 30, '12 share IDs are distinct, well-formed and high-entropy');
  function SHARE_OK(s) { return /^[A-Za-z0-9_-]{22}$/.test(s); }
  r = await call('GET', '/api/explore?page=1&per=5'); ok(r.json.projects.length === 5 && r.json.has_more === true, 'Explore paginates (page 1)');
  r = await call('GET', '/api/explore?page=3&per=5'); ok(r.json.projects.length === 3 && r.json.has_more === false, 'Explore paginates (last page)');
  // unshare
  r = await call('DELETE', `/api/projects/${id}/share`); ok(r.status === 200 && r.json.is_public === false, 'Unshare (DELETE …/share)');
  r = await call('GET', `/api/shared/${sid}`, undefined, { cookie: '' }); ok(r.status === 404, 'old share link is revoked after unshare');
  r = await call('POST', `/api/projects/${id}/share`, { public: true, confirm: true }); ok(r.json.share_id && r.json.share_id !== sid, 're-sharing creates a fresh link');
  const sid2 = r.json.share_id;

  // ---------------------------------------------------------------- remix + ownership
  const other = await call('POST', '/api/signup', { username: 'eve', email: 'eve@example.org', password: 'evil password 1' }, { cookie: '' }); const eveJar = cookieOf(other);
  r = await call('GET', `/api/projects/${id}`, undefined, { cookie: eveJar }); ok(r.status === 404, 'other users cannot read my projects');
  r = await call('DELETE', `/api/projects/${id}`, undefined, { cookie: eveJar }); ok(r.status === 404, 'other users cannot delete my projects');
  r = await call('POST', `/api/projects/${id}/share`, { public: false }, { cookie: eveJar }); ok(r.status === 404, 'other users cannot unshare my projects');
  r = await call('POST', `/api/shared/${sid2}/remix`, {}, { cookie: '' }); ok(r.status === 401, 'remix requires sign-in');
  r = await call('POST', `/api/shared/${sid2}/remix`, {}, { cookie: eveJar }); ok(r.status === 201 && r.json.name === 'Remix of Hello', 'Remix copies a public project into your account (even unverified, as private)');
  const rid = r.json.id; r = await call('GET', `/api/projects/${rid}`, undefined, { cookie: eveJar }); ok(r.json.data === proj && r.json.is_public === false, 'remix is a private copy');

  // ---------------------------------------------------------------- API tokens
  r = await call('POST', '/api/tokens', { name: 'ci' }); ok(r.status === 201 && /^kl_[\w-]{43}$/.test(r.json.token), 'verified user creates an API token (shown once)'); const tok = r.json.token, tokId = r.json.id;
  r = await call('GET', '/api/tokens'); ok(r.json.tokens.length === 1 && !JSON.stringify(r.json).includes(tok), 'token list never returns the secret');
  r = await call('GET', '/api/projects', undefined, { cookie: '', origin: '', auth: 'Bearer ' + tok }); ok(r.status === 200 && r.json.projects.length >= 1, 'Bearer token can list projects');
  r = await call('POST', '/api/projects', { name: 'via api', data: proj }, { cookie: '', origin: '', auth: 'Bearer ' + tok }); ok(r.status === 201, 'Bearer token can create projects (no Origin needed, not CSRF-able)');
  r = await call('GET', '/api/me', undefined, { cookie: '', auth: 'Bearer ' + tok }); ok(r.status === 401, 'Bearer tokens are limited to /api/projects');
  r = await call('DELETE', `/api/tokens/${tokId}`); r = await call('GET', '/api/projects', undefined, { cookie: '', auth: 'Bearer ' + tok }); ok(r.status === 401, 'revoked token stops working');

  // ---------------------------------------------------------------- forgot password: enumeration resistance
  const before = mails.length;
  const f1 = await call('POST', '/api/password/forgot', { email: 'mika@EXAMPLE.org' }, { cookie: '' });
  const f2 = await call('POST', '/api/password/forgot', { email: 'nobody@example.org' }, { cookie: '' });
  ok(f1.status === 200 && f2.status === 200 && f1.text === f2.text, 'forgot-password returns an identical response for existing and unknown emails');
  const strip = h => JSON.stringify([...h].filter(([k]) => k !== 'date'));
  ok(strip(f1.headers) === strip(f2.headers), 'forgot-password headers are identical too');
  const time = async e => { const t = performance.now(); await call('POST', '/api/password/forgot', { email: e }, { cookie: '' }); return performance.now() - t; };
  let tk = 0, tu = 0; for (let i = 0; i < 6; i++) { tk += await time('eve@example.org'); tu += await time(`ghost${i}@example.org`); }
  ok(Math.abs(tk - tu) / 6 < 25, `forgot-password timing does not reveal accounts (avg diff ${(Math.abs(tk - tu) / 6).toFixed(1)} ms)`);
  const rm = await mailTo('Mika@example.org', '/reset?token='); ok(rm && mails.length > before && !mails.some(x => x.to === 'nobody@example.org'), 'reset mail only goes to real accounts');
  const rtok = tokenOf(rm.link);
  const rrow = wdb.prepare("SELECT created_at, expires_at FROM email_tokens WHERE kind='reset' AND user_id=(SELECT id FROM users WHERE username='mika')").get();
  ok(rrow.expires_at - rrow.created_at === 3600_000, 'reset token expires after 1 h');
  for (let i = 0; i < 4; i++) await call('POST', '/api/password/forgot', { email: 'slow@example.org' }, { cookie: '' });
  await sleep(150); ok(mails.filter(x => x.to === 'slow@example.org' && x.link?.includes('/reset')).length === 3, 'reset mails are throttled to 3/hour per account (silently)');

  // ---------------------------------------------------------------- reset
  const mikaJar2 = cookieOf(await call('POST', '/api/login', { username: 'mika', password: 'correct horse battery' }, { cookie: '' }));
  r = await call('POST', '/api/password/reset', { token: rtok, password: 'short' }, { cookie: '' }); ok(r.status === 400, 'reset validates the new password');
  r = await call('POST', '/api/password/reset', { token: rtok, password: 'brand new password' }, { cookie: '' }); ok(r.status === 200, 'POST /api/password/reset sets a new password');
  r = await call('POST', '/api/password/reset', { token: rtok, password: 'another new password' }, { cookie: '' }); ok(r.status === 400, 'reset token is single-use');
  r = await call('GET', '/api/me', undefined, { cookie: jar }); const r2 = await call('GET', '/api/me', undefined, { cookie: mikaJar2 });
  ok(r.json.user === null && r2.json.user === null, 'reset invalidates all existing sessions');
  r = await call('POST', '/api/login', { username: 'mika', password: 'correct horse battery' }, { cookie: '' }); ok(r.status === 401, 'old password no longer works');
  r = await call('POST', '/api/login', { username: 'mika', password: 'brand new password' }, { cookie: '' }); ok(r.status === 200, 'new password works'); jar = cookieOf(r);
  wdb.prepare("UPDATE email_tokens SET expires_at = ? WHERE kind='reset'").run(Date.now() - 1);
  const sr = await mailTo('slow@example.org', '/reset?token=');
  r = await call('POST', '/api/password/reset', { token: tokenOf(sr.link), password: 'whatever password' }, { cookie: '' }); ok(r.status === 400, 'expired reset token rejected');

  // ---------------------------------------------------------------- account settings
  r = await call('POST', '/api/account/password', { current_password: 'wrong', new_password: 'third password!' }); ok(r.status === 403, 'change password requires the current password');
  const otherSession = cookieOf(await call('POST', '/api/login', { username: 'mika', password: 'brand new password' }, { cookie: '' }));
  r = await call('POST', '/api/account/password', { current_password: 'brand new password', new_password: 'third password!' }); ok(r.status === 200 && r.setCookie, 'change password works and issues a fresh session');
  const fresh = cookieOf(r);
  ok((await call('GET', '/api/me', undefined, { cookie: otherSession })).json.user === null && (await call('GET', '/api/me', undefined, { cookie: fresh })).json.user?.username === 'mika', 'change password signs out other sessions');
  jar = fresh;
  r = await call('POST', '/api/account/email', { password: 'third password!', email: 'mika.new@example.org' });
  ok(r.status === 200 && r.json.user.email_verified === false, 'change email resets verification');
  ok(await mailTo('mika.new@example.org', '/verify?token=') && mails.some(x => x.to === 'Mika@example.org' && /changed/.test(x.subject)), 'change email sends a verify link to the new address and a notice to the old one');
  r = await call('POST', `/api/projects/${id}/share`, { public: true, confirm: true }); ok(r.status === 403, 'after changing email, publishing needs re-verification');
  r = await call('POST', '/api/account/delete', { password: 'third password!', confirm: 'wrong' }); ok(r.status === 400, 'delete account needs username confirmation');
  r = await call('POST', '/api/account/delete', { password: 'nope nope nope', confirm: 'mika' }); ok(r.status === 403, 'delete account needs the password');
  r = await call('POST', '/api/account/delete', { password: 'third password!', confirm: 'mika' }); ok(r.status === 200 && /Max-Age=0/.test(r.setCookie), 'delete account works');
  ok(!wdb.prepare('SELECT 1 FROM users WHERE username = ?').get('mika') && !wdb.prepare('SELECT 1 FROM projects WHERE id = ?').get(id), 'account data (projects) removed');
  r = await call('GET', `/api/shared/${sid2}`, undefined, { cookie: '' }); ok(r.status === 404, 'shared links of a deleted account are gone');

  // ---------------------------------------------------------------- op allow-list / prototype keys via the API
  const evil = op => { const q = JSON.parse(proj); q.targets[1].scripts.push({ x: 0, y: 0, blocks: [{ op, args: [] }] }); return JSON.stringify(q); };
  for (const op of ['__proto__', 'constructor', 'toString', 'zz_unknown']) {
    r = await call('POST', '/api/projects', { name: 'evil', data: evil(op) }, { cookie: eveJar }); ok(r.status === 422 && /Unknown block/.test(r.json.error), `API rejects unknown op "${op}" (422)`);
  }
  r = await call('POST', '/api/projects', undefined, { cookie: eveJar, raw: JSON.stringify({ name: 'x', data: proj }).replace('{', '{"__proto__":{"isAdmin":true},') });
  ok(r.status === 201 && ({}).isAdmin === undefined, '__proto__ in the request body is inert');
  const vproto = JSON.parse(proj); vproto.targets[0].variables = JSON.parse('{"__proto__":1}');
  r = await call('POST', '/api/projects', { name: 'x', data: JSON.stringify(vproto) }, { cookie: eveJar }); ok(r.status === 422 && /reserved name/.test(r.json.error), 'API rejects a variable named "__proto__"');
  // ownership on update: another user's PUT/PATCH can't overwrite someone else's project
  const eveP = (await call('POST', '/api/projects', { name: 'Eve only', data: proj }, { cookie: eveJar })).json.id;
  const zed = cookieOf(await call('POST', '/api/signup', { username: 'zed', email: 'zed@example.org', password: 'zed password 1' }, { cookie: '' }));
  r = await call('PUT', `/api/projects/${eveP}`, { name: 'hijack', data: proj }, { cookie: zed }); ok(r.status === 404, "PUT can't overwrite another user's project");
  r = await call('PATCH', `/api/projects/${eveP}`, { name: 'hijack' }, { cookie: zed }); ok(r.status === 404, "PATCH can't rename another user's project");
  r = await call('GET', `/api/projects/${eveP}`, undefined, { cookie: eveJar }); ok(r.json.name === 'Eve only', 'project unchanged after hijack attempts');

  // ---------------------------------------------------------------- misc
  r = await call('POST', '/api/projects', { name: 'bad', data: JSON.stringify({ targets: [{ name: 'Stage', isStage: true, costumes: [{ name: 'x', src: 'https://evil/x.png', w: 1, h: 1, cx: 0, cy: 0 }] }] }) }, { cookie: eveJar }); ok(r.status === 422, 'server validates projects with shared limits (remote URL rejected)');
  r = await call('POST', '/api/projects', undefined, { raw: '{"data":"' + 'x'.repeat(5_200_000) + '"}', cookie: eveJar }); ok(r.status === 413, 'server rejects oversized bodies');
  r = await call('POST', '/api/logout', undefined, { cookie: eveJar }); ok(r.status === 200 && /Max-Age=0/.test(r.setCookie), 'POST /api/logout clears cookie');
  r = await call('GET', '/api/projects', undefined, { cookie: eveJar }); ok(r.status === 401, 'session invalid after logout');
  r = await call('POST', '/api/login', { username: 'eve', password: 'wrong password' }, { cookie: '' }); ok(r.status === 401, 'login rejects wrong password');
  r = await call('GET', '/api/../etc/passwd', undefined, {}); ok(r.status === 404, 'unknown paths 404');
  // ---- username rules for new accounts
  { const su = (username, email) => call('POST', '/api/signup', { username, email, password: 'profile pass 123' }, { cookie: '' });
    for (const bad of ['ab', 'a'.repeat(21), 'bad-name', 'bad name', 'émile', '<script>']) { const r = await su(bad, `x${Math.random().toString(36).slice(2, 8)}@example.org`); ok(r.status === 400, `username "${bad}" rejected`); }
    for (const resv of ['admin', 'Root', 'SUPPORT', 'kindlr', 'api', 'www']) { const r = await su(resv, `r${Math.random().toString(36).slice(2, 8)}@example.org`); ok(r.status === 400 && /reserved/.test(r.json.error), `reserved username "${resv}" rejected`); }
    let r = await su('Pro_File1', 'pf1@example.org'); ok(r.status === 201 && r.json.user.username === 'pro_file1', 'mixed-case username is stored lowercase');
    r = await su('PRO_FILE1', 'pf2@example.org'); ok(r.status === 409, 'usernames are unique case-insensitively');
  }
  sdb.close(); wdb.close();
} finally { srv.kill(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
