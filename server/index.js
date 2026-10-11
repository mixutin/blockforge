// Kindlr Cloud API: accounts, email verification, password reset, project storage, sharing and explore.
// Zero framework: node:http + better-sqlite3 (prebuilt binaries for Node 22) + bcryptjs (pure JS) + nodemailer (pure JS).
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { validateProject, LIMITS } from './limits.js';
import { createMailer } from './mailer.js';
import { checkNewUsername } from './username-rules.js';

const env = process.env;
const PORT = Number(env.PORT || 8795);
const HOST = env.HOST || '127.0.0.1';
const DB_PATH = env.DB_PATH || path.resolve('data/blocks.db');
const DEV = env.BLOCKS_DEV === '1';                          // local http:// development only
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
const PUBLIC_URL = (env.PUBLIC_URL || ALLOWED_ORIGINS[0] || 'http://localhost:5180').replace(/\/+$/, '');
const COOKIE = DEV ? 'blocks_session' : '__Host-blocks_session';
const SESSION_DAYS = 30, MAX_PROJECTS_PER_USER = 200, MAX_TOKENS_PER_USER = 20;
const VERIFY_TTL = 24 * 3600_000, RESET_TTL = 3600_000, HOUR = 3600_000;
const RESEND_PER_HOUR = 3, RESET_MAILS_PER_HOUR = 3, EMAIL_CHANGES_PER_HOUR = 3;
const AUTH_BODY = 10_000, META_BODY = 20_000, PROJECT_BODY = LIMITS.maxJsonBytes + 100_000;
const MAX_DESC = 1000, MAX_NOTES = 5000;

const mailer = createMailer({
  logOnly: DEV || env.MAIL_TRANSPORT === 'log',
  host: env.SMTP_HOST || '127.0.0.1', port: Number(env.SMTP_PORT || 25),
  from: env.MAIL_FROM || 'Kindlr <noreply@example.com>', publicUrl: PUBLIC_URL,
});

// ------------------------------------------------------------------ database + migrations
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL'); db.pragma('foreign_keys = ON');
// Performance: WAL + synchronous=NORMAL is crash-safe (no corruption; at most the last commit is lost on power loss),
// memory-mapped reads, larger page cache, temp tables in memory, a bounded WAL.
db.pragma('synchronous = NORMAL'); db.pragma('mmap_size = 268435456'); db.pragma('cache_size = -32000');
db.pragma('temp_store = MEMORY'); db.pragma('wal_autocheckpoint = 1000'); db.pragma('busy_timeout = 3000');
db.exec(`
CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, pass_hash TEXT NOT NULL, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL, data TEXT NOT NULL,
  is_public INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS projects_user ON projects(user_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS email_tokens (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('verify','reset')), email TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS email_tokens_user ON email_tokens(user_id, kind);
CREATE TABLE IF NOT EXISTS mail_events (user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, kind TEXT NOT NULL, at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS mail_events_user ON mail_events(user_id, kind, at);
CREATE TABLE IF NOT EXISTS api_tokens (id TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL, last_used_at INTEGER);
`);
const cols = t => new Set(db.prepare(`PRAGMA table_info(${t})`).all().map(c => c.name));
const addCol = (t, c, def) => { if (!cols(t).has(c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`); };
addCol('users', 'email', 'TEXT');
addCol('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 0');
addCol('projects', 'share_id', 'TEXT');
addCol('projects', 'shared_at', 'INTEGER');
addCol('projects', 'description', "TEXT NOT NULL DEFAULT ''");
addCol('projects', 'notes', "TEXT NOT NULL DEFAULT ''");
db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS projects_share ON projects(share_id);
CREATE INDEX IF NOT EXISTS projects_explore ON projects(is_public, shared_at DESC);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS api_tokens_user ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS users_email ON users(email COLLATE NOCASE);`);
const newShareId = () => crypto.randomBytes(16).toString('base64url');   // 128 bits, base64url, unrelated to row ids
for (const r of db.prepare('SELECT id FROM projects WHERE is_public = 1 AND share_id IS NULL').all())   // legacy shared rows
  db.prepare('UPDATE projects SET share_id = ?, shared_at = updated_at WHERE id = ?').run(newShareId(), r.id);

const USER_COLS = 'u.id, u.username, u.email, u.email_verified, u.created_at';
const q = {
  userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
  userById: db.prepare('SELECT * FROM users WHERE id = ?'),
  usersByEmail: db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE ORDER BY id LIMIT 5'),
  addUser: db.prepare('INSERT INTO users (username, pass_hash, email, email_verified, created_at) VALUES (?, ?, ?, 0, ?)'),
  setPass: db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?'),
  setEmail: db.prepare('UPDATE users SET email = ?, email_verified = 0 WHERE id = ?'),
  setVerified: db.prepare('UPDATE users SET email_verified = 1 WHERE id = ? AND email = ? COLLATE NOCASE'),
  delUser: db.prepare('DELETE FROM users WHERE id = ?'),
  addSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
  session: db.prepare(`SELECT ${USER_COLS} FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`),
  delSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  delSessions: db.prepare('DELETE FROM sessions WHERE user_id = ?'),
  delOtherSessions: db.prepare('DELETE FROM sessions WHERE user_id = ? AND token_hash <> ?'),
  prune: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  addToken: db.prepare('INSERT INTO email_tokens (token_hash, user_id, kind, email, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)'),
  takeToken: db.prepare('DELETE FROM email_tokens WHERE token_hash = ? AND kind = ? RETURNING *'),   // atomic single-use
  delTokens: db.prepare('DELETE FROM email_tokens WHERE user_id = ? AND kind = ?'),
  pruneTokens: db.prepare('DELETE FROM email_tokens WHERE expires_at <= ?'),
  addEvent: db.prepare('INSERT INTO mail_events (user_id, kind, at) VALUES (?, ?, ?)'),
  countEvents: db.prepare('SELECT COUNT(*) AS n FROM mail_events WHERE user_id = ? AND kind = ? AND at > ?'),
  pruneEvents: db.prepare('DELETE FROM mail_events WHERE at <= ?'),
  apiTokenList: db.prepare('SELECT id, name, created_at, last_used_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC'),
  apiTokenCount: db.prepare('SELECT COUNT(*) AS n FROM api_tokens WHERE user_id = ?'),
  apiTokenAdd: db.prepare('INSERT INTO api_tokens (id, user_id, name, token_hash, created_at) VALUES (?, ?, ?, ?, ?)'),
  apiTokenDel: db.prepare('DELETE FROM api_tokens WHERE id = ? AND user_id = ?'),
  apiTokenDelAll: db.prepare('DELETE FROM api_tokens WHERE user_id = ?'),
  apiTokenUser: db.prepare(`SELECT ${USER_COLS}, t.id AS token_id FROM api_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = ?`),
  apiTokenTouch: db.prepare('UPDATE api_tokens SET last_used_at = ? WHERE id = ?'),
  list: db.prepare('SELECT id, name, is_public, share_id, description, notes, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC'),
  count: db.prepare('SELECT COUNT(*) AS n FROM projects WHERE user_id = ?'),
  get: db.prepare('SELECT * FROM projects WHERE id = ?'),
  add: db.prepare('INSERT INTO projects (id, user_id, name, data, description, notes, is_public, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)'),
  update: db.prepare('UPDATE projects SET name = ?, data = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  meta: db.prepare('UPDATE projects SET name = ?, description = ?, notes = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  publish: db.prepare('UPDATE projects SET is_public = 1, share_id = ?, shared_at = ? WHERE id = ? AND user_id = ?'),
  unpublish: db.prepare('UPDATE projects SET is_public = 0, share_id = NULL, shared_at = NULL WHERE id = ? AND user_id = ?'),
  del: db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?'),
  shared: db.prepare('SELECT p.*, u.username AS author FROM projects p JOIN users u ON u.id = p.user_id WHERE p.share_id = ? AND p.is_public = 1'),
  explore: db.prepare(`SELECT p.share_id, p.name AS title, p.description, p.shared_at, p.updated_at, u.username AS author
    FROM projects p JOIN users u ON u.id = p.user_id WHERE p.is_public = 1 AND p.share_id IS NOT NULL ORDER BY p.shared_at DESC, p.id LIMIT ? OFFSET ?`),
};
setInterval(() => { const now = Date.now(); q.prune.run(now); q.pruneTokens.run(now); q.pruneEvents.run(now - 2 * HOUR); }, HOUR).unref();
const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12);
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const randomToken = () => crypto.randomBytes(32).toString('base64url');   // 256 bits

// ------------------------------------------------------------------ http helpers
class HttpError extends Error { constructor(status, msg, code) { super(msg); this.status = status; this.code = code; } }
// Small LRU of serialized response bodies for project reads (keys include updated_at, so edits invalidate them).
const BODY_CACHE = new Map(); let bodyCacheBytes = 0; const BODY_CACHE_MAX = 64 * 1024 * 1024;
function cachedBody(key, make) {
  let b = BODY_CACHE.get(key);
  if (b !== undefined) { BODY_CACHE.delete(key); BODY_CACHE.set(key, b); return b; }
  b = JSON.stringify(make()); BODY_CACHE.set(key, b); bodyCacheBytes += b.length;
  while (bodyCacheBytes > BODY_CACHE_MAX && BODY_CACHE.size > 1) { const [k, v] = BODY_CACHE.entries().next().value; BODY_CACHE.delete(k); bodyCacheBytes -= v.length; }
  return b;
}
class RawJson { constructor(s) { this.s = s; } }
function send(res, status, obj, headers = {}) {
  const body = obj instanceof RawJson ? obj.s : JSON.stringify(obj);
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer', 'Content-Length': Buffer.byteLength(body), ...headers });
  res.end(body);
}
// Public, cookie-free data (shared projects, Explore) gets an ETag and is revalidated by caches/browsers.
// Anything tied to a session stays `no-store` (see send()).
function sendPublic(req, res, obj, etagSeed) {   // obj may be a RawJson
  const etag = '"' + crypto.createHash('sha1').update(etagSeed).digest('base64url').slice(0, 22) + '"';
  const headers = { 'Cache-Control': 'public, max-age=0, must-revalidate', ETag: etag, Vary: 'Accept-Encoding' };
  if (req.headers['if-none-match'] === etag) { res.writeHead(304, { ...headers, 'X-Content-Type-Options': 'nosniff' }); return res.end(); }
  return send(res, 200, obj, headers);
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
function cookies(req) { const out = {}; for (const part of (req.headers.cookie || '').split(';')) { const i = part.indexOf('='); if (i > 0) { try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { } } } return out; }
function sessionCookie(token, maxAge) {
  // __Host- prefix: Secure, Path=/, and no Domain attribute (enforced by browsers). Dev mode drops Secure for http://localhost.
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${DEV ? '' : '; Secure'}`;
}
const sessionToken = req => { const t = cookies(req)[COOKIE]; return t && t.length <= 200 ? t : null; };
function sessionUser(req) { const t = sessionToken(req); return t ? q.session.get(sha(t), Date.now()) || null : null; }
function bearer(req) {
  const h = req.headers.authorization; if (!h) return null;
  // kl_ = Kindlr tokens; bf_ = tokens issued before the rename (still accepted)
  const m = /^Bearer ((?:kl|bf)_[A-Za-z0-9_-]{43})$/.exec(h); if (!m) throw new HttpError(401, 'Invalid API token');
  const u = q.apiTokenUser.get(sha(m[1])); if (!u) throw new HttpError(401, 'Invalid API token');
  q.apiTokenTouch.run(Date.now(), u.token_id); return u;
}
function checkOrigin(req) {
  // CSRF defence in depth (cookie is SameSite=Strict too): state-changing cookie requests must come from an allowed origin.
  const origin = req.headers.origin; if (!origin) throw new HttpError(403, 'Missing Origin');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const ok = ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS.includes(origin) : (() => { try { return new URL(origin).host === host; } catch { return false; } })();
  if (!ok) throw new HttpError(403, 'Origin not allowed');
}
function startSession(userId) {
  const token = crypto.randomBytes(32).toString('base64url');
  q.addSession.run(sha(token), userId, Date.now() + SESSION_DAYS * 864e5);
  return { token, cookie: sessionCookie(token, SESSION_DAYS * 86400) };
}
const publicUser = u => ({ username: u.username, email: u.email || null, email_verified: !!u.email_verified });

// ------------------------------------------------------------------ validation
const USER_RE = /^[A-Za-z0-9_]{3,24}$/;          // login: also accepts accounts created before the stricter signup rule
const EMAIL_RE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]{1,64}@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const ID_RE = /^[A-Za-z0-9_-]{8,32}$/;
const SHARE_RE = /^[A-Za-z0-9_-]{22}$/;
function username(v) { if (typeof v !== 'string' || !USER_RE.test(v)) throw new HttpError(400, 'Username must be 3–24 letters, digits or _'); return v; }
function password(v, label = 'Password') { if (typeof v !== 'string' || v.length < 8 || v.length > 200) throw new HttpError(400, `${label} must be 8–200 characters`); return v; }
function email(v) {
  const e = typeof v === 'string' ? v.trim() : '';
  if (e.length > 254 || !EMAIL_RE.test(e)) throw new HttpError(400, 'Please enter a valid email address');
  const at = e.lastIndexOf('@'); return e.slice(0, at) + '@' + e.slice(at + 1).toLowerCase();
}
function token(v) { if (typeof v !== 'string' || !TOKEN_RE.test(v)) throw new HttpError(400, 'This link is invalid or has expired'); return v; }
const text = (v, max) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').slice(0, max) : undefined);
function projectInput(body) {
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, LIMITS.maxNameLength) || 'Untitled project' : 'Untitled project';
  if (typeof body.data !== 'string') throw new HttpError(400, 'Missing project data');
  try { validateProject(body.data); } catch (e) { throw new HttpError(422, e.message); }
  return { name, data: body.data, description: text(body.description, MAX_DESC), notes: text(body.notes, MAX_NOTES) };
}
async function checkPassword(user, pw) {
  const row = q.userById.get(user.id);
  if (typeof pw !== 'string' || pw.length > 200 || !(await bcrypt.compare(pw, row.pass_hash))) throw new HttpError(403, 'Current password is incorrect');
}
function requireVerified(u, what) { if (!u.email_verified) throw new HttpError(403, `Verify your email address to ${what}`, 'unverified'); }

// ------------------------------------------------------------------ mail flows
function issueToken(userId, kind, addr, ttl) {
  const t = randomToken(); const now = Date.now();
  q.addToken.run(sha(t), userId, kind, addr, now, now + ttl); return t;
}
function sendVerification(user, addr) {
  q.delTokens.run(user.id, 'verify');                         // only the newest verification link works
  const t = issueToken(user.id, 'verify', addr, VERIFY_TTL);
  mailer.sendVerify(addr, user.username, t);                  // not awaited: response time doesn't depend on SMTP
}
const recent = (uid, kind) => q.countEvents.get(uid, kind, Date.now() - HOUR).n;
const FORGOT_RESPONSE = { ok: true, message: 'If an account uses that email address, we sent a link to reset its password. Check your inbox (and spam folder).' };

// ------------------------------------------------------------------ routes
async function route(req, res) {
  const url = new URL(req.url, 'http://x'); const p = url.pathname; const m = req.method;
  // ---- embed data: public projects only, handled BEFORE any auth so cookies / bearer tokens are never read here
  // (the embeddable page fetches with credentials: 'omit'; this route ignores a session even if one is sent).
  { const em = p.match(/^\/api\/embed\/([^/]+)$/);
    if (em) {
      if (m !== 'GET' && m !== 'HEAD') throw new HttpError(405, 'Method not allowed');
      const row = SHARE_RE.test(em[1]) ? q.shared.get(em[1]) : null;
      if (!row) throw new HttpError(404, 'Not found');
      const key = `e:${row.share_id}:${row.updated_at}:${row.author}`;
      return sendPublic(req, res, new RawJson(cachedBody(key, () => ({ share_id: row.share_id, title: row.name, author: row.author, data: row.data, updated_at: row.updated_at }))), key);
    } }
  const api = bearer(req);                                    // Authorization: Bearer kl_… (project routes only)
  const isProjectRoute = p === '/api/projects' || p.startsWith('/api/projects/');
  if (api && !isProjectRoute) throw new HttpError(401, 'API tokens can only be used with /api/projects');
  // Bearer requests can't be forged cross-site (no CORS), so only cookie-authenticated writes need the Origin check.
  if (m !== 'GET' && m !== 'HEAD' && !api) checkOrigin(req);
  const user = () => { const u = api || sessionUser(req); if (!u) throw new HttpError(401, 'Please sign in'); return u; };

  // ---- auth (exact paths, rate-limited at the proxy)
  if (p === '/api/signup' && m === 'POST') {
    const b = await readJson(req, AUTH_BODY);
    const nu = checkNewUsername(b.username); if (nu.error) throw new HttpError(400, nu.error);
    const name = nu.name, addr = email(b.email), pw = password(b.password);
    if (q.userByName.get(name)) throw new HttpError(409, 'That username is taken');
    const hash = await bcrypt.hash(pw, 12);
    let id; try { id = q.addUser.run(name, hash, addr, Date.now()).lastInsertRowid; } catch { throw new HttpError(409, 'That username is taken'); }
    sendVerification({ id, username: name }, addr);
    return send(res, 201, { user: { username: name, email: addr, email_verified: false } }, { 'Set-Cookie': startSession(id).cookie });
  }
  if (p === '/api/login' && m === 'POST') {
    const b = await readJson(req, AUTH_BODY);
    const name = username(b.username); if (typeof b.password !== 'string' || b.password.length > 200) throw new HttpError(400, 'Password required');
    const u = q.userByName.get(name);
    const good = await bcrypt.compare(b.password, u ? u.pass_hash : DUMMY_HASH);
    if (!u || !good) throw new HttpError(401, 'Wrong username or password');
    return send(res, 200, { user: publicUser(u) }, { 'Set-Cookie': startSession(u.id).cookie });
  }
  if (p === '/api/logout' && m === 'POST') {
    const t = sessionToken(req); if (t) q.delSession.run(sha(t));
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }
  if (p === '/api/me' && m === 'GET') { const u = sessionUser(req); return send(res, 200, { user: u ? publicUser(u) : null }); }
  if (p === '/api/health' && m === 'GET') return send(res, 200, { ok: true });

  // ---- email verification
  if (p === '/api/verify' && m === 'POST') {
    const t = token((await readJson(req, AUTH_BODY)).token);
    const row = q.takeToken.get(sha(t), 'verify');            // consumed even if expired: single use
    if (!row || row.expires_at <= Date.now()) throw new HttpError(400, 'This link is invalid or has expired');
    const changed = q.setVerified.run(row.user_id, row.email).changes;
    if (!changed) throw new HttpError(400, 'This link is for an email address that is no longer on the account');
    return send(res, 200, { ok: true, email_verified: true });
  }
  if (p === '/api/verify/resend' && m === 'POST') {
    const u = user(); if (u.email_verified) return send(res, 200, { ok: true, already_verified: true });
    if (!u.email) throw new HttpError(400, 'Add an email address first');
    if (recent(u.id, 'verify-resend') >= RESEND_PER_HOUR) throw new HttpError(429, `You can resend the verification email ${RESEND_PER_HOUR} times per hour. Please try again later.`);
    q.addEvent.run(u.id, 'verify-resend', Date.now()); sendVerification(u, u.email);
    return send(res, 200, { ok: true, remaining: RESEND_PER_HOUR - recent(u.id, 'verify-resend') });
  }

  // ---- password reset (no account enumeration: identical response for every well-formed address)
  if (p === '/api/password/forgot' && m === 'POST') {
    const addr = email((await readJson(req, AUTH_BODY)).email);
    for (const u of q.usersByEmail.all(addr)) {
      if (recent(u.id, 'reset') >= RESET_MAILS_PER_HOUR) continue;   // silently throttled
      q.addEvent.run(u.id, 'reset', Date.now());
      mailer.sendReset(u.email, u.username, issueToken(u.id, 'reset', u.email, RESET_TTL));
    }
    return send(res, 200, FORGOT_RESPONSE);
  }
  if (p === '/api/password/reset' && m === 'POST') {
    const b = await readJson(req, AUTH_BODY); const t = token(b.token); const pw = password(b.password, 'New password');
    const row = q.takeToken.get(sha(t), 'reset');
    if (!row || row.expires_at <= Date.now()) throw new HttpError(400, 'This link is invalid or has expired');
    const hash = await bcrypt.hash(pw, 12);
    db.transaction(() => {
      q.setPass.run(hash, row.user_id);
      q.delSessions.run(row.user_id);                         // sign out everywhere
      q.apiTokenDelAll.run(row.user_id);                      // and revoke API tokens
      q.delTokens.run(row.user_id, 'reset');                  // other outstanding reset links die too
      q.setVerified.run(row.user_id, row.email);              // the link proved control of the address
    })();
    return send(res, 200, { ok: true });
  }

  // ---- account settings (cookie session only)
  if (p === '/api/account/password' && m === 'POST') {
    const u = user(); const b = await readJson(req, AUTH_BODY); const pw = password(b.new_password, 'New password');
    await checkPassword(u, b.current_password);
    q.setPass.run(await bcrypt.hash(pw, 12), u.id);
    q.delSessions.run(u.id); const s = startSession(u.id);   // every other session is signed out
    return send(res, 200, { ok: true }, { 'Set-Cookie': s.cookie });
  }
  if (p === '/api/account/email' && m === 'POST') {
    const u = user(); const b = await readJson(req, AUTH_BODY); const addr = email(b.email);
    await checkPassword(u, b.password);
    if (recent(u.id, 'email-change') >= EMAIL_CHANGES_PER_HOUR) throw new HttpError(429, 'Too many email changes. Please try again later.');
    q.addEvent.run(u.id, 'email-change', Date.now());
    const old = u.email, wasVerified = !!u.email_verified;
    q.setEmail.run(addr, u.id); sendVerification(u, addr);
    if (old && wasVerified && old.toLowerCase() !== addr.toLowerCase()) mailer.sendEmailChanged(old, u.username);
    return send(res, 200, { user: { username: u.username, email: addr, email_verified: false } });
  }
  if (p === '/api/account/delete' && m === 'POST') {
    const u = user(); const b = await readJson(req, AUTH_BODY);
    if (b.confirm !== u.username) throw new HttpError(400, 'Type your username to confirm');
    await checkPassword(u, b.password);
    q.delUser.run(u.id);                                      // cascades: sessions, projects, tokens
    return send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  // ---- API tokens (verified accounts only)
  if (p === '/api/tokens' && m === 'GET') { const u = user(); return send(res, 200, { tokens: q.apiTokenList.all(u.id) }); }
  if (p === '/api/tokens' && m === 'POST') {
    const u = user(); requireVerified(u, 'create API tokens');
    const name = (text((await readJson(req, AUTH_BODY)).name, 60) || '').trim() || 'API token';
    if (q.apiTokenCount.get(u.id).n >= MAX_TOKENS_PER_USER) throw new HttpError(403, `Token limit reached (${MAX_TOKENS_PER_USER})`);
    const secret = 'kl_' + randomToken(); const id = crypto.randomBytes(9).toString('base64url');
    q.apiTokenAdd.run(id, u.id, name, sha(secret), Date.now());
    return send(res, 201, { id, name, token: secret });      // shown once; only the hash is stored
  }
  let mm;
  if ((mm = p.match(/^\/api\/tokens\/([A-Za-z0-9_-]{12})$/)) && m === 'DELETE') { const u = user(); q.apiTokenDel.run(mm[1], u.id); return send(res, 200, { ok: true }); }

  // ---- projects
  if (p === '/api/projects' && m === 'GET') { const u = user(); return send(res, 200, { projects: q.list.all(u.id).map(r => ({ ...r, is_public: !!r.is_public })) }); }
  if (p === '/api/projects' && m === 'POST') {
    const u = user(); const { name, data, description, notes } = projectInput(await readJson(req, PROJECT_BODY));
    if (q.count.get(u.id).n >= MAX_PROJECTS_PER_USER) throw new HttpError(403, `Project limit reached (${MAX_PROJECTS_PER_USER})`);
    const id = crypto.randomBytes(9).toString('base64url'); const now = Date.now(); q.add.run(id, u.id, name, data, description || '', notes || '', now, now);
    return send(res, 201, { id });
  }
  if ((mm = p.match(/^\/api\/projects\/([^/]+)(\/share)?$/))) {
    const id = mm[1]; if (!ID_RE.test(id)) throw new HttpError(404, 'Not found');
    const u = user(); const row = q.get.get(id); if (!row || row.user_id !== u.id) throw new HttpError(404, 'Not found');
    if (mm[2]) {
      const unshare = () => { q.unpublish.run(id, u.id); return send(res, 200, { id, is_public: false, share_id: null }); };
      if (m === 'DELETE') return unshare();
      if (m !== 'POST') throw new HttpError(405, 'Method not allowed');
      const b = await readJson(req, META_BODY);
      if (b.public !== true) return unshare();
      requireVerified(u, 'publish projects');
      if (b.confirm !== true) throw new HttpError(400, 'Publishing needs explicit confirmation (confirm: true)');
      const d = text(b.description, MAX_DESC), n = text(b.notes, MAX_NOTES), t = typeof b.title === 'string' ? b.title.trim().slice(0, LIMITS.maxNameLength) : '';
      if (d !== undefined || n !== undefined || t) q.meta.run(t || row.name, d ?? row.description, n ?? row.notes, Date.now(), id, u.id);
      const shareId = row.share_id || newShareId();
      if (!row.share_id) q.publish.run(shareId, Date.now(), id, u.id);
      return send(res, 200, { id, is_public: true, share_id: shareId, url: `${PUBLIC_URL}/p?id=${shareId}` });
    }
    if (m === 'GET') return send(res, 200, new RawJson(cachedBody(`o:${id}:${row.updated_at}:${row.share_id}`, () => ({ id, name: row.name, data: row.data, description: row.description, notes: row.notes, is_public: !!row.is_public, share_id: row.share_id }))));
    if (m === 'PUT') {
      const { name, data, description, notes } = projectInput(await readJson(req, PROJECT_BODY)); q.update.run(name, data, Date.now(), id, u.id);
      if (description !== undefined || notes !== undefined) q.meta.run(name, description ?? row.description, notes ?? row.notes, Date.now(), id, u.id);
      return send(res, 200, { id });
    }
    if (m === 'PATCH') {
      const b = await readJson(req, META_BODY);
      const name = typeof b.name === 'string' ? b.name.trim().slice(0, LIMITS.maxNameLength) || row.name : row.name;
      q.meta.run(name, text(b.description, MAX_DESC) ?? row.description, text(b.notes, MAX_NOTES) ?? row.notes, Date.now(), id, u.id);
      return send(res, 200, { id });
    }
    if (m === 'DELETE') { q.del.run(id, u.id); return send(res, 200, { ok: true }); }
    throw new HttpError(405, 'Method not allowed');
  }

  // ---- public sharing
  if ((mm = p.match(/^\/api\/shared\/([^/]+)(\/remix)?$/))) {
    const sid = mm[1]; const row = SHARE_RE.test(sid) ? q.shared.get(sid) : null;
    if (!row) throw new HttpError(404, 'Not found');
    if (!mm[2] && m === 'GET') {
      const key = `s:${row.share_id}:${row.updated_at}:${row.author}`;
      return sendPublic(req, res, new RawJson(cachedBody(key, () => ({ share_id: row.share_id, title: row.name, author: row.author, description: row.description,
        notes: row.notes, data: row.data, shared_at: row.shared_at, updated_at: row.updated_at }))), key);
    }
    if (mm[2] && m === 'POST') {
      const u = user(); if (q.count.get(u.id).n >= MAX_PROJECTS_PER_USER) throw new HttpError(403, `Project limit reached (${MAX_PROJECTS_PER_USER})`);
      const id = crypto.randomBytes(9).toString('base64url'); const now = Date.now();
      const name = ('Remix of ' + row.name).slice(0, LIMITS.maxNameLength);
      q.add.run(id, u.id, name, row.data, `Remixed from “${row.name}” by @${row.author}.`.slice(0, MAX_DESC), row.notes, now, now);
      return send(res, 201, { id, name });
    }
    throw new HttpError(405, 'Method not allowed');
  }
  if (p === '/api/explore' && m === 'GET') {
    const page = Math.min(1000, Math.max(1, parseInt(url.searchParams.get('page') || '1', 10) || 1));
    const per = Math.min(48, Math.max(1, parseInt(url.searchParams.get('per') || '24', 10) || 24));
    const rows = q.explore.all(per + 1, (page - 1) * per);
    const body = { projects: rows.slice(0, per), page, per, has_more: rows.length > per };
    return sendPublic(req, res, body, JSON.stringify(body));
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
    if (!res.headersSent) send(res, status, { error: status === 500 ? 'Internal error' : e.message, ...(e.code ? { code: e.code } : {}) });
  }
});
server.requestTimeout = 30_000; server.headersTimeout = 15_000;
server.listen(PORT, HOST, () => console.log(`Kindlr API on http://${HOST}:${PORT} (db: ${DB_PATH}${DEV ? ', DEV cookies' : ''}; links: ${PUBLIC_URL})`));
const shutdown = () => { server.close(); db.close(); process.exit(0); };
process.on('SIGTERM', shutdown); process.on('SIGINT', shutdown);
