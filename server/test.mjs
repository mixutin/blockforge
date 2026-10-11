// Integration tests for the Blockforge API. Spawns the server against a temp DB.
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import { exampleProjects } from '../src/project.js';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-')); const PORT = 18787; const BASE = `http://127.0.0.1:${PORT}`; const ORIGIN = 'https://blocks.example.com';
const srv = spawn(process.execPath, ['index.js'], { env: { ...process.env, PORT, DB_PATH: path.join(dir, 't.db'), ALLOWED_ORIGIN: ORIGIN }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise(r => srv.stdout.once('data', r));
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? '✔' : '✘', m); };
let jar = '';
async function call(method, p, body, { origin = ORIGIN, cookie = jar, raw } = {}) {
  const h = { }; if (origin) h.Origin = origin; if (cookie) h.Cookie = cookie; if (body !== undefined || raw) h['Content-Type'] = 'application/json';
  const r = await fetch(BASE + p, { method, headers: h, body: raw ?? (body !== undefined ? JSON.stringify(body) : undefined) });
  const sc = r.headers.get('set-cookie'); return { status: r.status, json: await r.json().catch(() => null), setCookie: sc };
}
try {
  let r = await call('POST', '/api/signup', { username: 'mika', password: 'short' }); ok(r.status === 400, 'signup rejects short password');
  r = await call('POST', '/api/signup', { username: 'mika', password: 'correct horse battery' }, { origin: 'https://evil.example' }); ok(r.status === 403, 'signup rejects foreign Origin (CSRF)');
  r = await call('POST', '/api/signup', { username: 'mika', password: 'correct horse battery' });
  ok(r.status === 201 && r.json.user.username === 'mika', 'POST /api/signup creates account');
  ok(/^__Host-blocks_session=[\w-]+; Path=\/; HttpOnly; SameSite=Strict; Max-Age=\d+; Secure$/.test(r.setCookie) && !/Domain=/i.test(r.setCookie), 'session cookie is __Host-, Secure, HttpOnly, SameSite=Strict, Path=/, no Domain');
  jar = r.setCookie.split(';')[0];
  r = await call('POST', '/api/signup', { username: 'MIKA', password: 'another password' }); ok(r.status === 409, 'usernames are unique (case-insensitive)');
  r = await call('GET', '/api/me'); ok(r.json.user?.username === 'mika', 'GET /api/me returns the user');
  const proj = JSON.stringify(exampleProjects()[0]);
  r = await call('POST', '/api/projects', { name: 'Hello', data: proj }); ok(r.status === 201 && r.json.id, 'create project'); const id = r.json.id;
  r = await call('GET', '/api/projects'); ok(r.json.projects.length === 1 && r.json.projects[0].name === 'Hello', 'list projects');
  r = await call('PUT', `/api/projects/${id}`, { name: 'Hello 2', data: proj }); ok(r.status === 200, 'update project');
  r = await call('GET', `/api/projects/${id}`); ok(r.json.name === 'Hello 2' && r.json.data === proj, 'read project back');
  r = await call('POST', '/api/projects', { name: 'bad', data: JSON.stringify({ targets: [{ name: 'Stage', isStage: true, costumes: [{ name: 'x', src: 'https://evil/x.png', w: 1, h: 1, cx: 0, cy: 0 }] }] }) }); ok(r.status === 422, 'server validates projects with shared limits (remote URL rejected)');
  r = await call('POST', '/api/projects', undefined, { raw: '{"data":"' + 'x'.repeat(5_200_000) + '"}' }); ok(r.status === 413, 'server rejects oversized bodies');
  r = await call('GET', `/api/shared/${id}`, undefined, { cookie: '' }); ok(r.status === 404, 'private project not visible via /api/shared');
  r = await call('POST', `/api/projects/${id}/share`, { public: true }); ok(r.json.is_public === true, 'share project');
  r = await call('GET', `/api/shared/${id}`, undefined, { cookie: '' }); ok(r.status === 200 && r.json.data === proj, 'shared project readable anonymously');
  const other = await call('POST', '/api/signup', { username: 'eve', password: 'evil password 1' }, { cookie: '' }); const eveJar = other.setCookie.split(';')[0];
  r = await call('GET', `/api/projects/${id}`, undefined, { cookie: eveJar }); ok(r.status === 404, 'other users cannot read my projects');
  r = await call('DELETE', `/api/projects/${id}`, undefined, { cookie: eveJar }); ok(r.status === 404, 'other users cannot delete my projects');
  r = await call('POST', '/api/logout'); ok(r.status === 200 && /Max-Age=0/.test(r.setCookie), 'POST /api/logout clears cookie');
  r = await call('GET', '/api/projects'); ok(r.status === 401, 'session invalid after logout');
  r = await call('POST', '/api/login', { username: 'mika', password: 'wrong password' }, { cookie: '' }); ok(r.status === 401, 'login rejects wrong password');
  r = await call('POST', '/api/login', { username: 'mika', password: 'correct horse battery' }, { cookie: '' }); ok(r.status === 200, 'POST /api/login works'); jar = r.setCookie.split(';')[0];
  r = await call('DELETE', `/api/projects/${id}`); ok(r.status === 200, 'owner deletes project');
  r = await call('GET', '/api/../etc/passwd', undefined, {}); ok(r.status === 404, 'unknown paths 404');
  ok(!fs.readdirSync(dir).some(f => f.endsWith('.db') === false && f.includes('pass')), 'no stray files');
} finally { srv.kill(); }
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
