// Test helper: create a verified user + public project through the API, print its share id.
import { exampleProjects } from '../src/project.js';
import Database from '../server/node_modules/better-sqlite3/lib/index.js';
const B = process.env.API, O = process.env.ORIGIN;
const j = async (m, p, body, cookie) => { const r = await fetch(B + p, { method: m, headers: { Origin: O, 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) }, body: body && JSON.stringify(body) }); return { r, json: await r.json().catch(() => null) }; };
const su = await j('POST', '/api/signup', { username: 'embedder', email: 'e@example.org', password: 'embed password 1' });
const cookie = su.r.headers.get('set-cookie').split(';')[0];
const { json: { id } } = await j('POST', '/api/projects', { name: 'Star Catcher', data: JSON.stringify(exampleProjects()[1]) }, cookie);
const d = new Database(process.env.DB); d.prepare('UPDATE users SET email_verified = 1').run(); d.close();
const r = await j('POST', `/api/projects/${id}/share`, { public: true, confirm: true }, cookie);
console.log(r.json.share_id);
