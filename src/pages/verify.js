import { chrome, $, h } from './common.js';
import { cloud, pageUrl } from '../cloud.js';
chrome('', { account: false });
const token = new URLSearchParams(location.search).get('token') || '';
history.replaceState(null, '', location.pathname);   // keep the single-use token out of history / screenshots
const box = $('box'), msg = $('msg'), btn = $('go');
if (!/^[A-Za-z0-9_-]{43}$/.test(token)) { msg.className = 'err'; msg.textContent = 'This verification link is incomplete. Open the newest link from your email, or resend it from Account in the editor.'; btn.hidden = true; }
// A button (not auto-submit) so mail scanners that prefetch links can't burn the single-use token.
btn.onclick = async () => {
  btn.disabled = true; msg.className = 'muted'; msg.textContent = 'Verifying…';
  try { await cloud.verify(token); msg.className = 'ok'; msg.textContent = '✓ Your email is verified. You can now publish projects and create API tokens.'; btn.hidden = true;
    const a = h('a', 'btn primary', 'Open the editor'); a.href = pageUrl('./'); box.appendChild(a); }
  catch (e) { msg.className = 'err'; msg.textContent = e.message + '. You can request a new link from Account in the editor.'; btn.hidden = true; }
};
