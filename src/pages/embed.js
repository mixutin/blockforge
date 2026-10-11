// Embeddable player page: /embed/<share-id>. The only Kindlr page that may be framed by other sites.
// It plays a public project and nothing else: no cookies (credentials: 'omit', the API route ignores sessions),
// no login, no save, no editor actions. "Remix" is a plain link that opens Kindlr in a new tab.
import '../pages.css';
import { validateProject } from '../limits.js';
import { mountPlayer } from '../playerhost.js';
import { EMBED_RUNTIME_URL } from '../config.js';
const $ = id => document.getElementById(id);
const m = location.pathname.match(/\/embed\/([A-Za-z0-9_-]{22})\/?$/);
const id = m ? m[1] : (new URLSearchParams(location.search).get('id') || '');
const link = $('title'), remix = $('remix');
const site = new URL('/', location.href);
(async () => {
  if (!/^[A-Za-z0-9_-]{22}$/.test(id)) throw new Error('invalid link');
  const res = await fetch(new URL('/api/embed/' + id, location.href), { credentials: 'omit', cache: 'no-cache', referrerPolicy: 'no-referrer' });
  if (!res.ok) throw new Error(res.status === 404 ? 'not found or no longer shared' : 'could not load');
  const r = await res.json();
  const page = new URL('/p?id=' + encodeURIComponent(id), site).href;
  link.textContent = `${r.title} · by ${r.author}`; link.href = page; link.title = 'Open on Kindlr (new tab)';
  remix.href = page; remix.hidden = false;
  document.title = `${r.title} · Kindlr`;
  const pl = mountPlayer($('stage'), JSON.stringify(validateProject(r.data)), { runtimeUrl: EMBED_RUNTIME_URL });
  $('ig').onclick = pl.ignite; $('st').onclick = pl.stop; $('ig').disabled = $('st').disabled = false;
})().catch(e => { link.textContent = 'Project unavailable (' + e.message + ')'; link.removeAttribute('href'); });
