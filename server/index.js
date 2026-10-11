// Blockforge Cloud API — accounts, project storage and sharing.
// Zero framework: node:http + better-sqlite3 (prebuilt binaries for Node 22) + bcryptjs (pure JS).
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { validateProject, LIMITS } from './limits.js';

const env = process.env;
const PORT = Number(env.PORT || 8795);
const HOST = env.HOST || '127.0.0.1';
const DB_PATH = env.DB_PATH || path.resolve('data/blocks.db');
const DEV = env.BLOCKS_DEV === '1';                          // local http:// development only
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const COOKIE = DEV ? 'blocks_session' : '__Host-blocks_session';
const SESSION_DAYS = 30, MAX_PROJECTS_PER_USER = 200;
const AUTH_BODY = 10_000, PROJECT_BODY = LIMITS.maxJsonBytes + 100_000;

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, pass_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, data TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS projects_user ON projects(user_id, updated_at DESC);
`);
const q = {
  userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
  addUser: db.prepare('INSERT INTO users (username, pass_hash, created_at) VALUES (?, ?, ?)'),
  addSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
  session: db.prepare('SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?'),
  delSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  prune: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  list: db.prepare('SELECT id, name, is_public, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC'),
  count: db.prepare('SELECT COUNT(*) AS n FROM projects WHERE user_id = ?'),
  get: db.prepare('SELECT * FROM projects WHERE id = ?'),
  add: db.prepare('INSERT INTO projects (id, user_id, name, data, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)'),
  update: db.prepare('UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  share: db.prepare('UPDATE projects SET is_public = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  del: db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?'),
};
setInterval(() => q.prune.run(Date.now()), 3600_000).unref();
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
function send(res, status, obj, headers = {}) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(body);
}
function readJson(req, limit) {
  return new Promise((resolve, reject) => {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) return reject(new HttpError(415, 'Expected application/json'));
    const len = Number(req.headers['content-length'] || 0); if (len > limit) return reject(new HttpError(413, 'Request too large'));
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new HttpError(413, 'Request too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { const v = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); if (!v || typeof v !== 'object' || Array.isArray(v)) throw 0; resolve(v); } catch { reject(new HttpError(400, 'Invalid JSON body')); } });
    req.on('error', reject);
  });
}
function cookies(req) { const out = {}; for (const part of (req.headers.cookie || '').split(';')) { const i = part.indexOf('='); if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } return out; }
function sessionCookie(token, maxAge) {
  // __Host- prefix: Secure, Path=/, and no Domain attribute (enforced by browsers). Dev mode drops Secure for http://localhost.
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${DEV ? '' : '; Secure'}`;
}
function currentUser(req) { const t = cookies(req)[COOKIE]; if (!t || t.length > 200) return null; return q.session.get(sha(t), Date.now()) || null; }
function requireUser(req) { const u = currentUser(req); if (!u) throw new HttpError(401, 'Please sign in'); return u; }
function checkOrigin(req) {
  // CSRF defence in depth (cookie is SameSite=Strict too): state-changing requests must come from an allowed origin.
  const origin = req.headers.origin; if (!origin) throw new HttpError(403, 'Missing Origin');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const ok = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.includes(origin) : (() => { try { return new URL(origin).host === host; } catch { return false; } })();
  if (!ok) throw new HttpError(403, 'Origin not allowed');
}
function startSession(res, userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  q.addSession.run(sha(token), userId, Date.now() + SESSION_DAYS * 864e5);
  return sessionCookie(token, SESSION_DAYS * 86400);
}
const USER_RE = /^[A-Za-z0-9_]{3,24}$/;
function creds(body) {
  const { username, password } = body;
  if (typeof username !== 'string' || !USER_RE.test(username)) throw new HttpError(400, 'Username must be 3–24 letters, digits or _');
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) throw new HttpError(400, 'Password must be 8–200 characters');
  return { username, password };
}
function projectInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, LIMITS.maxNameLength) || 'Untitled project' : 'Untitled project';
  if (typeof body.data !== 'string') throw new HttpError(400, 'Missing project data');
  try { validateProject(body.data); } catch (e) { throw new HttpError(422, e.message); }
  return { name, data: body.data };
}
const ID_RE = /^[A-Za-z0-9_-]{8,32}$/;

async function route(req, res) {
  const url = new URL(req.url, 'http://x'); const p = url.pathname; const m = req.method;
  if (m !== 'GET' && m !== 'HEAD') checkOrigin(req);
  // ---- auth (exact paths, rate-limited at the proxy)
  if (p === '/api/signup' && m === 'POST') {
    const { username, password } = creds(await readJson(req, AUTH_BODY));
    if (q.userByName.get(username)) throw new HttpError(409, 'That username is taken');
    const hash = await bcrypt.hash(password, 12);
    let id; try { id = q.addUser.run(username, hash, Date.now()).lastInsertRowid; } catch { throw new HttpError(409, 'That username is taken'); }
    return send(res, 201, { user: { username } }, { 'Set-Cookie': startSession(res, id) });
  }
  if (p === '/api/login' && m === 'POST') {
    const { username, password } = creds(await readJson(req, AUTH_BODY));
    const u = q.userByName.get(username);
    const good = await bcrypt.compare(password, u ? u.pass_hash : DUMMY_HASH);
    if (!u || !good) throw new HttpError(401, 'Wrong username or password');
    return send(res, 200, { user: { username: u.username } }, { 'Set-Cookie': startSession(res, u.id) });
  }
  if (p === '/api/logout' && m === 'POST') {
    const t = cookies(req)[COOKIE]; if (t) q.delSession.run(sha(t));
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }
  if (p === '/api/me' && m === 'GET') { const u = currentUser(req); return send(res, 200, { user: u ? { username: u.username } : null }); }
  if (p === '/api/health' && m === 'GET') return send(res, 200, { ok: true });
  // ---- projects
  if (p === '/api/projects' && m === 'GET') { const u = requireUser(req); return send(res, 200, { projects: q.list.all(u.id).map(r => ({ ...r, is_public: !!r.is_public })) }); }
  if (p === '/api/projects' && m === 'POST') {
    const u = requireUser(req); const { name, data } = projectInput(await readJson(req, PROJECT_BODY));
    if (q.count.get(u.id).n >= MAX_PROJECTS_PER_USER) throw new HttpError(403, `Project limit reached (${MAX_PROJECTS_PER_USER})`);
    const id = crypto.randomBytes(9).toString('base64url'); const now = Date.now(); q.add.run(id, u.id, name, data, now, now);
    return send(res, 201, { id });
  }
  let mm;
  if ((mm = p.match(/^\/api\/projects\/([^/]+)(\/share)?$/))) {
    const id = mm[1]; if (!ID_RE.test(id)) throw new HttpError(404, 'Not found');
    const u = requireUser(req); const row = q.get.get(id); if (!row || row.user_id !== u.id) throw new HttpError(404, 'Not found');
    if (mm[2]) { if (m !== 'POST') throw new HttpError(405, 'Method not allowed'); const b = await readJson(req, AUTH_BODY); const pub = b.public === true ? 1 : 0; q.share.run(pub, Date.now(), id, u.id); return send(res, 200, { id, is_public: !!pub }); }
    if (m === 'GET') return send(res, 200, { id, name: row.name, data: row.data, is_public: !!row.is_public });
    if (m === 'PUT') { const { name, data } = projectInput(await readJson(req, PROJECT_BODY)); q.update.run(name, data, Date.now(), id, u.id); return send(res, 200, { id }); }
    if (m === 'DELETE') { q.del.run(id, u.id); return send(res, 200, { ok: true }); }
    throw new HttpError(405, 'Method not allowed');
  }
  if ((mm = p.match(/^\/api\/shared\/([^/]+)$/)) && m === 'GET') {
    const id = mm[1]; const row = ID_RE.test(id) && q.get.get(id); if (!row || !row.is_public) throw new HttpError(404, 'Not found');
    return send(res, 200, { id, name: row.name, data: row.data });
  }
  throw new HttpError(404, 'Not found');
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url.startsWith('/api/')) throw new HttpError(404, 'Not found');
    await route(req, res);
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) send(res, status, { error: status === 500 ? 'Internal error' : e.message });
  }
});
server.requestTimeout = 30_000; server.headersTimeout = 15_000;
server.listen(PORT, HOST, () => console.log(`Blockforge API on http://${HOST}:${PORT} (db: ${DB_PATH}${DEV ? ', DEV cookies' : ''})`));
const shutdown = () => { server.close(); db.close(); process.exit(0); };
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
