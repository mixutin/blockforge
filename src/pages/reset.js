import { chrome, $, h } from './common.js';
import { cloud, pageUrl } from '../cloud.js';
chrome('', { account: false });
const token = new URLSearchParams(location.search).get('token') || '';
history.replaceState(null, '', location.pathname);
const msg = $('msg'), btn = $('go'), p1 = $('p1'), p2 = $('p2'), form = $('form');
if (!/^[A-Za-z0-9_-]{43}$/.test(token)) { msg.className = 'err'; msg.textContent = 'This reset link is incomplete. Request a new one from Sign in › Forgot password in the editor.'; form.hidden = true; }
form.onsubmit = async e => {
  e.preventDefault(); msg.className = 'err'; msg.textContent = '';
  if (p1.value.length < 8) { msg.textContent = 'Use at least 8 characters.'; return; }
  if (p1.value !== p2.value) { msg.textContent = 'The passwords do not match.'; return; }
  btn.disabled = true;
  try { await cloud.reset(token, p1.value); form.hidden = true; msg.className = 'ok'; msg.textContent = '✓ Password changed. You were signed out on all devices; sign in with your new password.';
    const a = h('a', 'btn primary', 'Go to the editor'); a.href = pageUrl('./'); $('box').appendChild(a); }
  catch (err) { msg.textContent = err.message; btn.disabled = false; }
};
