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

// Mount a sandboxed player iframe into `container`. Only the project JSON crosses the boundary.
export function mountPlayer(container, projectJson, { runtimeUrl = RUNTIME_URL, onStatus = () => {}, onToast = () => {}, onStore } = {}) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts'); iframe.setAttribute('referrerpolicy', 'no-referrer');
  iframe.setAttribute('allow', 'fullscreen'); iframe.title = 'Kindlr sandboxed player'; iframe.className = 'player-frame';
  let port = null;
  const onMsg = e => {
    if (!validHello(e, iframe)) return;
    window.removeEventListener('message', onMsg);
    port = e.ports[0];
    port.onmessage = ev => {
      const m = ev.data; if (!validOut(m)) return;
      if (m.type === 'loaded') onStatus('Running in an isolated sandbox (no access to your account or storage).', 'loaded');
      if (m.type === 'error') onStatus('Player error: ' + m.message, 'error');
      if (m.type === 'toast') onToast(m.message);
      if (m.type === 'store' && onStore) onStore(m.key, m.value);
    };
    port.postMessage({ type: 'load', project: projectJson });
  };
  window.addEventListener('message', onMsg);
  iframe.src = runtimeUrl;
  container.appendChild(iframe);
  return {
    iframe,
    ignite: () => port && port.postMessage({ type: 'ignite' }),
    stop: () => port && port.postMessage({ type: 'stop' }),
    destroy: () => { window.removeEventListener('message', onMsg); try { port && port.close(); } catch (e) { } iframe.remove(); },
  };
}

export function openPlayer(app, projectJson, { title = 'Player', onSeeInside, onStore } = {}) {
  const { box, close } = app.modal(title); box.classList.add('player-modal');
  const holder = document.createElement('div'); holder.className = 'player-holder';
  const status = document.createElement('div'); status.className = 'hint'; status.textContent = 'Starting sandboxed player…';
  const act = document.createElement('div'); act.className = 'actions';
  box.append(holder, status, act);
  const pl = mountPlayer(holder, projectJson, { onStatus: t => { status.textContent = t; }, onToast: t => app.toast(t), onStore });
  const mk = (label, fn, cls = '') => { const b = document.createElement('button'); b.textContent = label; b.className = cls; b.onclick = fn; act.appendChild(b); return b; };
  mk('🔥 Ignite', pl.ignite, 'primary');
  mk('■ Stop', pl.stop);
  if (onSeeInside) mk('See inside (open in editor)', () => { pl.destroy(); close(); onSeeInside(); });
  mk('Close', () => { pl.destroy(); close(); });
  return { iframe: pl.iframe, close: () => { pl.destroy(); close(); } };
}
