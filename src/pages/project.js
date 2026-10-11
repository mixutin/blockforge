import { chrome, $, h, fmtDate } from './common.js';
import { cloud, shareUrl, embedUrl, pageUrl } from '../cloud.js';
import { validateProject } from '../limits.js';
import { mountPlayer } from '../playerhost.js';
chrome('explore');
const id = new URLSearchParams(location.search).get('id') || '';
const info = $('info'), stage = $('stage'), status = $('status');
async function main() {
  if (!/^[A-Za-z0-9_-]{22}$/.test(id)) throw new Error('This link is not valid');
  const r = await cloud.shared(id);
  const json = JSON.stringify(validateProject(r.data));          // validated before it goes anywhere near the sandbox
  document.title = r.title + ' · Kindlr';
  const pl = mountPlayer(stage, json, { onStatus: t => { status.textContent = t; } });
  const ig = h('button', 'primary', '🔥 Ignite'); ig.onclick = pl.ignite;
  const st = h('button', '', '■ Stop'); st.onclick = pl.stop;
  const fs = h('button', '', '⛶ Fullscreen'); fs.onclick = () => pl.iframe.requestFullscreen?.();
  const ctl = h('div', 'row ctl'); ctl.append(ig, st, fs); stage.after(ctl);
  // info column: textContent only
  const remix = h('button', 'primary', '🔀 Remix'); const rmsg = h('div', 'muted');
  remix.onclick = async () => {
    remix.disabled = true; rmsg.textContent = '';
    try { const x = await cloud.remix(id); location.href = pageUrl('./') + '#cloud=' + encodeURIComponent(x.id); }
    catch (e) { remix.disabled = false; rmsg.textContent = e.status === 401 ? 'Sign in in the editor first, then come back and press Remix.' : e.message; }
  };
  const inside = h('a', 'btn', 'See inside'); inside.href = pageUrl('./') + '#share=' + encodeURIComponent(id);
  const copy = h('button', '', '🔗 Copy link'); copy.onclick = () => navigator.clipboard?.writeText(shareUrl(id)).then(() => (copy.textContent = '✓ Copied'));
  info.append(h('h1', '', r.title), h('div', 'muted', 'by ' + r.author + ' · shared ' + fmtDate(r.shared_at) + (r.updated_at > r.shared_at ? ' · updated ' + fmtDate(r.updated_at) : '')));
  const act = h('div', 'row'); act.style.margin = '14px 0'; act.append(remix, inside, copy); info.append(act, rmsg);
  if (r.description) info.append(h('h2', '', 'About'), h('p', 'prewrap', r.description));
  if (r.notes) info.append(h('h2', '', 'Notes & instructions'), h('p', 'prewrap', r.notes));
  const emb = h('details'); emb.append(h('summary', '', 'Embed this project'));
  const code = h('input'); code.readOnly = true; code.value = `<iframe src="${embedUrl(id)}" width="482" height="412" style="border:0;border-radius:12px;max-width:100%" allowfullscreen loading="lazy" title="Kindlr project"></iframe>`; code.onclick = () => code.select();
  emb.appendChild(code); info.append(h('h2', '', 'Share'), emb);
}
main().catch(e => { info.replaceChildren(h('h1', '', 'Project not found'), h('p', 'muted', e.status === 404 ? 'It may have been unshared by its author.' : e.message)); status.textContent = ''; });
