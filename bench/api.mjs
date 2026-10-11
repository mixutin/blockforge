// API latency benchmark (autocannon): project load / save / public read / explore. Reports p50 / p95 / req/s.
// Usage: node bench/api.mjs [label]   (spawns its own server on a temp DB)
import { spawn } from 'node:child_process';
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
import autocannon from 'autocannon';
import { exampleProjects } from '../src/project.js';
const label = process.argv[2] || 'run';
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kbench-')); const PORT = 18899; const BASE = `http://127.0.0.1:${PORT}`; const ORIGIN = 'https://bench.example.com';
const srv = spawn(process.execPath, [process.env.SERVER_ENTRY || 'index.js'], { cwd: new URL('../server/', import.meta.url).pathname, env: { ...process.env, PORT, DB_PATH: path.join(dir, 'b.db'), ALLOWED_ORIGIN: ORIGIN, MAIL_TRANSPORT: 'log', BLOCKS_DEV: '' }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise(r => srv.stdout.once('data', r));
const j = async (m, p, body, cookie) => { const r = await fetch(BASE + p, { method: m, headers: { Origin: ORIGIN, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) }); return { r, json: await r.json() }; };
const su = await j('POST', '/api/signup', { username: 'bench', email: 'bench@example.org', password: 'bench password 1' });
const cookie = su.r.headers.get('set-cookie').split(';')[0];
const data = JSON.stringify(exampleProjects()[1]);
const { json: { id } } = await j('POST', '/api/projects', { name: 'Bench', data }, cookie);
const db = (await import('../server/node_modules/better-sqlite3/lib/index.js')).default; const d = new db(path.join(dir, 'b.db')); d.prepare('UPDATE users SET email_verified = 1').run(); d.close();
const { json: { share_id } } = await j('POST', `/api/projects/${id}/share`, { public: true, confirm: true }, cookie);
for (let i = 0; i < 200; i++) { const c = await j('POST', '/api/projects', { name: 'p' + i, data }, cookie); if (i % 2) await j('POST', `/api/projects/${c.json.id}/share`, { public: true, confirm: true }, cookie); }
const pct = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
async function run(name, opts) {
  const lat = [];
  const { path: pth, ...rest } = opts; let shown = false;
  const inst = autocannon({ url: BASE + pth, connections: 10, duration: Number(process.env.DUR || 8), ...rest, setupClient: c => c.on('body', b => { if (!shown && process.env.DEBUG) { shown = true; console.log('  first body:', b.toString().slice(0, 100)); } }) });
  inst.on('response', (c, code, bytes, t) => lat.push(t));
  const res = await inst; lat.sort((a, b) => a - b);
  const out = { name, rps: Math.round(res.requests.average), p50: +pct(lat, .5).toFixed(2), p95: +pct(lat, .95).toFixed(2), non2xx: res.non2xx, kb: Math.round(data.length / 1024) };
  console.log(`${name.padEnd(28)} ${String(out.rps).padStart(6)} req/s   p50 ${String(out.p50).padStart(6)} ms   p95 ${String(out.p95).padStart(6)} ms   errors ${out.non2xx}`);
  return out;
}
console.log(`# ${label}: project JSON ${Math.round(data.length / 1024)} KB, 10 connections, 8 s each`);
const results = [
  await run('GET  /api/projects/:id (load)', { method: 'GET', path: `/api/projects/${id}`, headers: { cookie } }),
  await run('PUT  /api/projects/:id (save)', { method: 'PUT', path: `/api/projects/${id}`, headers: { cookie, origin: ORIGIN, 'content-type': 'application/json' }, body: JSON.stringify({ name: 'Bench', data }) }),
  await run('GET  /api/shared/:sid', { method: 'GET', path: `/api/shared/${share_id}` }),
  await run('GET  /api/explore', { method: 'GET', path: '/api/explore?page=2' }),
  await run('GET  /api/projects (list 201)', { method: 'GET', path: '/api/projects', headers: { cookie } }),
];
fs.mkdirSync(new URL('./results/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL(`./results/api-${label}.json`, import.meta.url), JSON.stringify(results, null, 2));
srv.kill(); fs.rmSync(dir, { recursive: true, force: true });
