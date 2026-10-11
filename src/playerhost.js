// Editor side of the sandboxed player. The iframe gets sandbox="allow-scripts" only (never allow-same-origin),
// so it runs in an opaque origin with no access to editor cookies, storage, or DOM. Only project JSON is sent.
import { RUNTIME_URL, RUNTIME_ORIGIN } from './config.js';
import { LIMITS } from './limits.js';
const OUT = { // schema of messages accepted from the player
  loaded: m => Object.keys(m).length === 1,
  error: m => typeof m.message === 'string' && m.message.length <= 300 && Object.keys(m).length === 2,
  toast: m => typeof m.message === 'string' && m.message.length <= 300 && Object.keys(m).length === 2,
  store: m => typeof m.key === 'string' && m.key.length > 0 && m.key.length <= LIMITS.maxNameLength && Object.keys(m).length === 3 &&
    (typeof m.value === 'number' ? isFinite(m.value) : typeof m.value === 'boolean' || (typeof m.value === 'string' && m.value.length <= LIMITS.maxStringLength)),
};
export function validHello(e, iframe) {
  if (e.source !== iframe.contentWindow) return false;
  // A sandboxed frame without allow-same-origin always reports the opaque origin "null".
  if (e.origin !== 'null' && e.origin !== RUNTIME_ORIGIN) return false;
  const d = e.data; return !!d && typeof d === 'object' && d.type === 'bf-hello' && d.v === 1 && Object.keys(d).length === 2 && e.ports.length === 1;
}
export function validOut(m) { return !!m && typeof m === 'object' && !Array.isArray(m) && typeof m.type === 'string' && Object.prototype.hasOwnProperty.call(OUT, m.type) && OUT[m.type](m); }

export function openPlayer(app, projectJson, { title = 'Player', onSeeInside, onStore } = {}) {
  const { box, close } = app.modal(title); box.classList.add('player-modal');
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts'); iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.setAttribute('allow', 'fullscreen'); iframe.title = 'Blockforge sandboxed player'; iframe.className = 'player-frame';
  const status = document.createElement('div'); status.className = 'hint'; status.textContent = 'Starting sandboxed player…';
  const act = document.createElement('div'); act.className = 'actions';
  let port = null;
  const mk = (label, fn, cls = '') => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = fn; act.appendChild(b); return b; };
  mk('🔥 Ignite', () => port && port.postMessage({ type: 'ignite' }), 'primary');
  mk('■ Stop', () => port && port.postMessage({ type: 'stop' }));
  if (onSeeInside) mk('See inside (open in editor)', () => { cleanup(); close(); onSeeInside(); });
  mk('Close', () => { cleanup(); close(); });
  const onMsg = e => {
    if (!validHello(e, iframe)) return;
    window.removeEventListener('message', onMsg);
    port = e.ports[0];
    port.onmessage = ev => {
      const m = ev.data; if (!validOut(m)) return;
      if (m.type === 'loaded') status.textContent = 'Running in an isolated sandbox (no access to your account or storage).';
      if (m.type === 'error') status.textContent = 'Player error: ' + m.message;
      if (m.type === 'toast') app.toast(m.message);
      if (m.type === 'store' && onStore) onStore(m.key, m.value);
    };
    port.postMessage({ type: 'load', project: projectJson });
  };
  const cleanup = () => { window.removeEventListener('message', onMsg); try { port && port.close(); } catch (e) { } iframe.remove(); };
  window.addEventListener('message', onMsg);
  iframe.src = RUNTIME_URL;
  box.append(iframe, status, act);
  return { iframe, close: () => { cleanup(); close(); } };
}
