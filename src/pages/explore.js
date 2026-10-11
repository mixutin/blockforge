import { chrome, $, h, thumb, fmtDate } from './common.js';
import { cloud, shareUrl, pageUrl } from '../cloud.js';
chrome('explore');
const PER = 24;
const page = Math.max(1, Math.min(1000, parseInt(new URLSearchParams(location.search).get('page') || '1', 10) || 1));
const grid = $('grid'), pager = $('pager'), status = $('status');
async function load() {
  grid.replaceChildren(); pager.replaceChildren(); status.className = 'loading'; status.textContent = 'Loading projects…';
  grid.setAttribute('aria-busy', 'true');
  for (let i = 0; i < 8; i++) grid.appendChild(h('div', 'pcard skeleton'));
  try {
    const r = await cloud.explore(page, PER); grid.replaceChildren(); status.className = ''; status.textContent = '';
    if (!r.projects.length) {
      const e = h('div', 'empty'); e.append(h('b', '', page > 1 ? 'That’s everything!' : 'No shared projects yet'),
        page > 1 ? 'You reached the oldest shared projects.' : 'Be the first: open the editor, make something, and press Share.');
      const a = h('a', 'btn primary', page > 1 ? 'Back to the newest' : 'Open the editor'); a.href = page > 1 ? pageUrl('explore') : pageUrl('./'); e.appendChild(a); grid.appendChild(e);
    }
    for (const p of r.projects) {
      const a = h('a', 'pcard'); a.href = shareUrl(p.share_id);
      const b = h('div', 'b'); b.append(h('b', '', p.title), h('span', 'by', 'by ' + p.author + ' · ' + fmtDate(p.shared_at)));
      if (p.description) b.appendChild(h('p', '', p.description));
      const img = thumb(p.share_id); img.setAttribute('aria-hidden', 'true');
      a.append(img, b); grid.appendChild(a);
    }
    if (page > 1 || r.has_more) {
      const nav = (label, n, on) => { const x = h('a', 'btn', label); if (on) x.href = pageUrl('explore', { page: n }); else { x.setAttribute('aria-disabled', 'true'); x.classList.add('disabled'); } pager.appendChild(x); };
      nav('← Newer', page - 1, page > 1); pager.appendChild(h('span', 'muted', 'Page ' + page)); nav('Older →', page + 1, r.has_more);
    }
  } catch (e) {
    grid.replaceChildren(); status.className = 'error-box'; status.textContent = '';
    const retry = h('button', 'primary', 'Try again'); retry.onclick = load;
    status.append(h('b', '', 'Couldn’t load projects.'), h('span', '', e.message === 'Cloud features are not available on this host' ? 'Sharing isn’t available on this server.' : 'Check your connection and try again.'), retry);
  } finally { grid.removeAttribute('aria-busy'); }
}
load();
