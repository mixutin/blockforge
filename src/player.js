// Blockforge sandboxed player. Runs inside <iframe sandbox="allow-scripts"> on the runtime origin.
// Protocol: player -> parent: {type:'bf-hello', v:1} + MessagePort (targetOrigin = an allowed editor origin, never '*').
// All further traffic goes over the private MessagePort. Every message is schema-checked in both directions.
import './player.css';
import { Runtime } from './runtime.js';
import { getImg, W, H } from './stage.js';
import { validateProject, LIMITS, capStr } from './limits.js';
import { syncWidgets } from './widgets.js';

/* global __EDITOR_ORIGINS__ */
const $ = id => document.getElementById(id);
const ALLOWED = String(typeof __EDITOR_ORIGINS__ !== 'undefined' && __EDITOR_ORIGINS__ ? __EDITOR_ORIGINS__ : new URL(location.href).origin).split(',').map(s => s.trim()).filter(Boolean);
const IN = { // schema of messages accepted from the editor
  load: m => typeof m.project === 'string' && m.project.length <= LIMITS.maxJsonBytes && Object.keys(m).length === 2,
  ignite: m => Object.keys(m).length === 1,
  stop: m => Object.keys(m).length === 1,
};
let port = null;
const send = msg => port && port.postMessage(msg);

class PlayerApp {
  constructor() {
    this.runtime = new Runtime(this); this.cv = $('stage'); this.ctx = this.cv.getContext('2d'); this.scale = 1; this._project = null;
    $('ignite').onclick = () => this._project && this.runtime.ignite();
    $('stop').onclick = () => this._project && this.runtime.stopAll();
    $('full').onclick = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.().catch(() => {}));
    const toStage = e => { const r = this.cv.getBoundingClientRect(); return { cx: (e.clientX - r.left) / r.width * W, cy: (e.clientY - r.top) / r.height * H }; };
    this.cv.addEventListener('pointermove', e => { const p = toStage(e); this.runtime.mouse.x = p.cx - W / 2; this.runtime.mouse.y = H / 2 - p.cy; });
    this.cv.addEventListener('pointerdown', e => { const p = toStage(e); this.runtime.mouse.down = true; this._project && this.runtime.clickAt(p.cx, p.cy); });
    addEventListener('pointerup', () => (this.runtime.mouse.down = false));
    document.addEventListener('keydown', e => { if (e.target.closest('input')) return; if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault(); if (this._project && !e.repeat) this.runtime.keyDown(e); });
    document.addEventListener('keyup', e => this.runtime.keyUp(e));
    $('ask-form').addEventListener('submit', e => { e.preventDefault(); const cb = this._askCb; this.hideAsk(); cb && cb($('ask-input').value); });
    new ResizeObserver(() => this.resize()).observe($('wrap')); this.resize();
    const loop = () => { try { if (this._project) { this.runtime.step(); const s = this.scale * devicePixelRatio; this.ctx.setTransform(s, 0, 0, s, 0, 0); this.runtime.render(this.ctx); this.renderMonitors(); syncWidgets($('widgets'), this.runtime); $('ignite').classList.toggle('active', this.runtime.isRunning()); } } catch (e) { console.warn(e); } requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }
  get project() { return this._project; }
  resize() {
    const w = $('wrap'), s = Math.max(0.2, Math.min(w.clientWidth / W, w.clientHeight / H)); this.scale = s;
    this.cv.style.width = W * s + 'px'; this.cv.style.height = H * s + 'px'; this.cv.width = Math.round(W * s * devicePixelRatio); this.cv.height = Math.round(H * s * devicePixelRatio);
    const o = $('overlay'); o.style.transform = `scale(${s})`; o.style.left = (w.clientWidth - W * s) / 2 + 'px'; o.style.top = (w.clientHeight - H * s) / 2 + 'px'; this.runtime.redraw = true;
  }
  load(json) {
    const p = validateProject(json);
    for (const t of p.targets) { Object.assign(t, { x: 0, y: 0, direction: 90, size: 100, visible: true, costume: 0, rotationStyle: 'all around', layer: 0, variables: {}, lists: {}, scripts: [], costumes: [], ...t }); t.effects = {}; t.bubble = null; t.costumes.forEach(c => getImg(c.src, () => (this.runtime.redraw = true))); }
    p.monitors ||= []; this.storage = Object.assign(Object.create(null), p.storage || {}); if (this._project) this.runtime.stopAll(); this._project = p; this.runtime.stopAll(); this.runtime.penCtx.clearRect(0, 0, W, H);
    $('title').textContent = p.name || 'Untitled'; $('msg').hidden = true; $('monitors').innerHTML = ''; this._mon = new Map();
  }
  toast(m) { send({ type: 'toast', message: String(m).slice(0, 300) }); }
  showAsk(q, cb) { $('ask').hidden = false; $('ask-q').textContent = q; $('ask-input').value = ''; this._askCb = cb; $('ask-input').focus(); }
  hideAsk() { $('ask').hidden = true; this._askCb = null; }
  showReport() {}
  print(t) { const c = $('console'); c.hidden = false; const d = document.createElement('div'); d.textContent = String(t).slice(0, 2000); c.appendChild(d); while (c.childNodes.length > LIMITS.maxConsoleLines) c.firstChild.remove(); c.scrollTop = c.scrollHeight; this.resize(); }
  clearConsole() { $('console').innerHTML = ''; }
  storeGet(k) { return this.storage[k]; }
  storeSet(k, v) { // persisted only through the editor; the player never makes network calls
    if (typeof v !== 'number' && typeof v !== 'boolean') v = capStr(typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''));
    if (!(k in this.storage) && Object.keys(this.storage).length >= LIMITS.maxStorageKeys) return;
    this.storage[k] = v; send({ type: 'store', key: k, value: v });
  }
  setMonitor(type, name, t, visible) {
    const owner = !t.isStage && Object.prototype.hasOwnProperty.call(type === 'list' ? t.lists : t.variables, name) ? (t.base || t).name : null;
    let m = this._project.monitors.find(x => x.type === type && x.name === name && (x.owner || null) === owner);
    if (!m) { m = { type, name, owner, x: 6, y: 6 + this._project.monitors.length * 30 }; this._project.monitors.push(m); }
    m.visible = visible;
  }
  renderMonitors() {
    for (const m of this._project.monitors) {
      const key = m.type + ':' + (m.owner || '') + ':' + m.name; let el = this._mon.get(key);
      if (!m.visible) { if (el) { el.remove(); this._mon.delete(key); } continue; }
      const owner = m.owner ? this._project.targets.find(t => t.name === m.owner) : this._project.targets[0]; if (!owner) continue;
      if (!el) { el = document.createElement('div'); el.className = 'monitor' + (m.type === 'list' ? ' list' : ''); el.style.left = m.x + 'px'; el.style.top = m.y + 'px';
        const l = document.createElement('span'); l.textContent = (m.owner ? m.owner + ': ' : '') + m.name; const v = document.createElement(m.type === 'list' ? 'div' : 'span'); v.className = m.type === 'list' ? 'items' : 'val'; el.append(l, v); $('monitors').appendChild(el); this._mon.set(key, el); }
      if (m.type === 'var') { const v = owner.variables[m.name]; const s = typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : v && typeof v === 'object' ? JSON.stringify(v).slice(0, 200) : String(v ?? ''); if (el.lastChild.textContent !== s) el.lastChild.textContent = s; }
      else { const l = owner.lists[m.name] || []; const sig = l.length + '|' + l.slice(0, 50).join('\u0001'); if (el._sig !== sig) { el._sig = sig; el.lastChild.innerHTML = ''; l.slice(0, 50).forEach(x => { const d = document.createElement('div'); d.className = 'item'; const s = document.createElement('span'); s.textContent = String(x); d.appendChild(s); el.lastChild.appendChild(d); }); } }
    }
  }
}
const app = new PlayerApp();

function onPortMessage(e) {
  const m = e.data;
  if (!m || typeof m !== 'object' || Array.isArray(m) || typeof m.type !== 'string' || !Object.prototype.hasOwnProperty.call(IN, m.type) || !IN[m.type](m)) { send({ type: 'error', message: 'Rejected malformed message' }); return; }
  try {
    if (m.type === 'load') { app.load(m.project); send({ type: 'loaded' }); }
    if (m.type === 'ignite') app.runtime.ignite();
    if (m.type === 'stop') app.runtime.stopAll();
  } catch (err) { send({ type: 'error', message: String(err.message || err).slice(0, 300) }); }
}
function handshake() {
  if (window.parent === window) { $('msg').textContent = 'Blockforge Player — open a project from the Blockforge editor.'; return; }
  // Determine the embedding editor's origin and only talk to it if it is allow-listed.
  let parentOrigin = null;
  try { parentOrigin = location.ancestorOrigins?.[0] || null; } catch (e) { }
  if (!parentOrigin && ALLOWED.length === 1) parentOrigin = ALLOWED[0];
  if (!parentOrigin || !ALLOWED.includes(parentOrigin)) { $('msg').textContent = 'This player can only be embedded by the Blockforge editor.'; return; }
  const ch = new MessageChannel(); port = ch.port1; port.onmessage = onPortMessage;
  window.parent.postMessage({ type: 'bf-hello', v: 1 }, parentOrigin, [ch.port2]);
}
handshake();
