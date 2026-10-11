import './migrate.js';
import './style.css';
import { CATEGORIES, DEFS, DEF_LIST, MENUS_STATIC, newBlock, clone, isReporterType } from './blocks.js';
import { Runtime } from './runtime.js';
import { Blocks } from './workspace.js';
import { targetToText, parseKls, highlight } from './kls.js';
import { blankProject, exampleProjects, makeTarget, layoutScripts } from './project.js';
import { getImg, costumeOf, W, H } from './stage.js';
import * as art from './art.js';
import { cloud, shareUrl, embedUrl, pageUrl } from './cloud.js';
import { ICONS, iconize } from './icons.js';
import { validateProject } from './limits.js';
// Lazy chunks (code-split; not needed for the editor's first paint): paint editor, QR code, sandboxed player host.
const lazyPaint = () => import('./paint.js');
const lazyQr = () => import('./qr.js');
const openPlayer = (...args) => import('./playerhost.js').then(m => m.openPlayer(...args));
import { syncWidgets } from './widgets.js';
import { LIMITS } from './limits.js';
import { has, get, put, dict, RESERVED_NAMES } from './safe.js';

const $ = id => document.getElementById(id);
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const AUTOSAVE = 'kindlr.autosave.v1';
const CLOUDREF = 'kindlr.cloudref.v1';
const SPECIAL = { _random_: 'random position', _mouse_: 'mouse-pointer', _edge_: 'edge', _myself_: 'myself', _stage_: 'Stage' };

class App {
  constructor() {
    this.categories = CATEGORIES; this.runtime = new Runtime(this);
    this.blocks = new Blocks(this); this.paint = null;
    // warm the lazy chunks once the editor is idle, so the first click on Costumes / Share / Player is instant
    const idle = window.requestIdleCallback || (f => setTimeout(f, 1500)); idle(() => { lazyPaint(); lazyQr(); import('./playerhost.js'); });
    this.tab = 'blocks'; this.dirty = false; this.stageScale = 1;
    this.initChrome(); this.initStage(); this.initText(); this.initCostumes();
    const saved = this.readAutosave();
    const share = location.hash.match(/share=([\w-]+)/);
    if (share) this.loadShared(share[1]);
    this.loadProject(saved || exampleProjects()[0], !!saved, saved ? this.readCloudRef() : null);
    this.openFromHash();
    window.addEventListener('hashchange', () => { const m = location.hash.match(/share=([\w-]+)/); if (m) this.loadShared(m[1]); else this.openFromHash(); });
    requestAnimationFrame(() => this.frame());
    if (localStorage.getItem('kindlr.cloud') && !/cloud=/.test(location.hash)) cloud.me().then(u => this.setUser(u)).catch(() => this.setUser(null));
  }

  // ------------------------------------------------ project
  get project() { return this._project; }
  normalize(p) {
    if (!p || !Array.isArray(p.targets) || !p.targets.length) throw new Error('Not a Kindlr project');
    p.monitors ||= []; p.name ||= 'Untitled project';
    for (const t of p.targets) {
      Object.assign(t, { ...makeTarget(t.name, []), ...t, costumes: t.costumes || [], scripts: t.scripts || [], variables: dict(t.variables), lists: dict(t.lists) });
      if (!t.costumes.length) t.costumes.push(clone(t.isStage ? art.backdrops.blank : art.ball[0]));
      t.effects = dict(); t.bubble = null;
    }
    if (!p.targets[0].isStage) throw new Error('First target must be the stage');
    return p;
  }
  /** cloudRef: only pass { id, name, user } when loading the signed-in user's own cloud project. Anything else unlinks. */
  loadProject(p, quiet, cloudRef = null) {
    try { validateProject(p); p = this.normalize(clone(p)); } catch (e) { this.toast('Can’t open this project: ' + e.message); return false; }
    this.setCloudRef(cloudRef);
    if (this._project) this.runtime.stopAll(); this._project = p; this.runtime.stopAll(); this.runtime.penCtx.clearRect(0, 0, W, H); this.runtime.normalizeLayers();
    for (const t of p.targets) for (const c of t.costumes) getImg(c.src, () => { this.runtime.redraw = true; this.renderTargets(); });
    this.target = p.targets[1] || p.targets[0]; this.clearConsole();
    $('project-name').value = p.name; this.refresh(); this.blocks.ws.scrollTo(0, 0);
    if (!quiet) this.toast(`Loaded “${p.name}”`);
    this.changed(false); return true;
  }
  serialize() {
    const skip = new Set(['bubble', 'base', 'isClone', 'penDown', 'effects']);
    return JSON.stringify({ ...this.project, format: 'kindlr', version: 1 }, (k, v) => (skip.has(k) ? undefined : v));
  }
  changed(structural = true) {
    this.dirty = true; clearTimeout(this._saveT); this._saveT = setTimeout(() => this.autosave(), 800);
    $('save-status').textContent = 'Unsaved changes…';
    if (structural) { this.blocks.renderPalette(); this.renderTargets(); }
  }
  autosave() {
    try { localStorage.setItem(AUTOSAVE, this.serialize()); this.dirty = false; $('save-status').textContent = 'Autosaved ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
    catch (e) { $('save-status').textContent = 'Autosave failed (storage full?)'; }
  }
  readAutosave() { try { const s = localStorage.getItem(AUTOSAVE); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
  refresh() {
    this.blocks.renderPalette(); this.blocks.render(); this.renderTargets(); this.renderSpriteInfo(true); this.renderMonitors(true);
    if (this.tab === 'text') this.textFromBlocks(); if (this.tab === 'costumes') this.renderCostumes();
    $('editing-label').textContent = 'Editing: ' + (this.target.isStage ? 'Stage' : this.target.name);
    $('tab-costumes').textContent = this.target.isStage ? 'Backdrops' : 'Costumes';
  }
  select(t) { this.target = t; this.refresh(); }

  // ------------------------------------------------ palette support
  paletteDefs(cat, t) {
    return DEF_LIST.filter(d => d.cat === cat && !['var', 'list', 'param', 'define', 'call'].includes(d.op) && !(t.isStage && d.sprite) && !(!t.isStage && d.stage));
  }
  paletteBlock(op, t) {
    const b = newBlock(op), d = DEFS[op];
    const parts = d.text.match(/%(n|s|b|k|m\.\w+)/g) || [];
    parts.forEach((p, i) => {
      const m = p.startsWith('%m.') ? p.slice(3) : null; if (!m) return;
      const first = v => (v !== undefined ? v : b.args[i]);
      if (m === 'costume') b.args[i] = first(t.costumes[0]?.name);
      if (m === 'backdrop') b.args[i] = first(this.project.targets[0].costumes[0]?.name);
      if (m === 'message') b.args[i] = first(this.allMessages()[0] || 'message1');
      if (m === 'var') b.args[i] = first(this.visibleVars(t, 'variables')[0] || '');
      if (m === 'list') b.args[i] = first(this.visibleVars(t, 'lists')[0] || '');
      if (m === 'object' && op === 'se_of') b.args[i] = '_stage_';
    });
    if (op === 'se_of') b.args[0] = 'backdrop #';
    return b;
  }
  defaultArg(owner, idx) { if (owner.op === 'call') return ''; const d = DEFS[owner.op]?.def?.[idx]; return d === undefined ? '' : d; }
  findDefine(name, t = this.target) { return (t.base || t).scripts.map(s => s.blocks[0]).find(b => b?.op === 'define' && b.name === name); }
  visibleVars(t, kind) { const st = this.project.targets[0]; const names = Object.keys(st[kind]); if (!t.isStage) names.push(...Object.keys(t[kind]).filter(n => !names.includes(n))); return names; }
  walkBlocks(fn) {
    const visit = (b, owner) => { if (!b || typeof b !== 'object' || !b.op) return; fn(b, owner); (b.args || []).forEach(a => visit(a, b)); (b.body || []).forEach(x => visit(x)); (b.body2 || []).forEach(x => visit(x)); };
    for (const t of this.project.targets) for (const s of t.scripts) s.blocks.forEach(b => visit(b));
  }
  allMessages() {
    const set = new Set(); this.walkBlocks(b => { if (['ev_receive', 'ev_broadcast', 'ev_broadcastwait'].includes(b.op) && typeof b.args[0] === 'string' && b.args[0]) set.add(b.args[0]); });
    return [...set].sort();
  }
  menuOptions(menu, t, cur, block) {
    const sprites = this.project.targets.filter(x => !x.isStage).map(x => x.name);
    const others = sprites.filter(n => n !== t.name); const sp = v => [get(SPECIAL, v) || v, v];
    let o;
    switch (menu) {
      case 'goto': o = ['_random_', '_mouse_', ...others].map(sp); break;
      case 'towards': o = ['_mouse_', ...others].map(sp); break;
      case 'touch': o = ['_mouse_', '_edge_', ...others].map(sp); break;
      case 'cloneOf': o = ['_myself_', ...others].map(sp); if (t.isStage) o.shift(); break;
      case 'object': o = ['_stage_', ...sprites].map(sp); break;
      case 'costume': o = t.costumes.map(c => [c.name, c.name]); break;
      case 'backdrop': o = this.project.targets[0].costumes.map(c => [c.name, c.name]); if (block?.op === 'lo_backdrop') o.push(['next backdrop', 'next backdrop'], ['previous backdrop', 'previous backdrop'], ['random backdrop', 'random backdrop']); break;
      case 'message': { const ms = this.allMessages(); if (!ms.length) ms.push('message1'); o = ms.map(m => [m, m]); o.push(['New message…', '__new__']); break; }
      case 'var': o = this.visibleVars(t, 'variables').map(v => [v, v]); break;
      case 'list': o = this.visibleVars(t, 'lists').map(v => [v, v]); break;
      default: o = (MENUS_STATIC[menu] || []).map(v => [v, v]);
    }
    if (cur !== undefined && cur !== null && cur !== '' && typeof cur !== 'object' && !o.some(x => x[1] === cur)) o.unshift([SPECIAL[cur] || String(cur), String(cur)]);
    return o;
  }
  runningScripts() { const s = new Set(); for (const th of this.runtime.threads) if ((th.target.base || th.target) === this.target) s.add(th.script); return s; }
  runPaletteBlock(b, el) {
    const d = DEFS[b.op]; if (!d || d.type === 'hat') return;
    if (isReporterType(d.type)) { this.bubbleAt(el, this.runtime.evalBlock(b, { target: this.target, frames: [] })); return; }
    this.runtime.startThread(this.target, { blocks: [clone(b)] });
  }
  showReport(script, v) { const el = this.blocks.scriptEls.get(script); if (el) this.bubbleAt(el.firstChild.firstChild, v); }
  bubbleAt(el, v) {
    const r = el.getBoundingClientRect(); const b = h('div', 'report-bubble', typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : String(v));
    b.style.left = r.left + 'px'; b.style.top = (r.bottom + 6) + 'px'; document.body.appendChild(b); setTimeout(() => b.remove(), 2200);
  }

  // ------------------------------------------------ variables, lists, custom blocks
  async makeVariable(kind) {
    const isList = kind === 'list', key = isList ? 'lists' : 'variables';
    const res = await this.form(isList ? 'New list' : 'New variable', [{ name: 'name', label: 'Name', value: '' }, ...(this.target.isStage ? [] : [{ name: 'scope', type: 'radio', options: [['all', 'For all sprites'], ['local', 'For this sprite only']], value: 'all' }])]);
    if (!res || !res.name.trim()) return; const name = res.name.trim();
    if (RESERVED_NAMES.has(name) || name.length > LIMITS.maxNameLength) { this.toast('That name is reserved or too long'); return; }
    if (this.visibleVars(this.target, key).includes(name)) { this.toast('That name is already used'); return; }
    const host = res.scope === 'local' ? this.target : this.project.targets[0];
    put(host[key], name, isList ? [] : 0);
    this.setMonitor(isList ? 'list' : 'var', name, this.target, true);
    this.changed(true);
  }
  async renameVariable(key, old) {
    const n = (await this.prompt('Rename to:', old))?.trim(); if (!n || n === old) return;
    if (RESERVED_NAMES.has(n) || n.length > LIMITS.maxNameLength) { this.toast('That name is reserved or too long'); return; }
    for (const t of this.project.targets) if (has(t[key], old)) { put(t[key], n, t[key][old]); delete t[key][old]; }
    const rop = key === 'lists' ? 'list' : 'var', menu = key === 'lists' ? 'list' : 'var';
    this.walkBlocks(b => {
      if (b.op === rop && b.args[0] === old) b.args[0] = n;
      const d = DEFS[b.op]; if (!d) return; let i = 0; for (const m of d.text.matchAll(/%(n|s|b|k|v|m\.(\w+))/g)) { if (m[2] === menu && b.args[i] === old) b.args[i] = n; i++; }
    });
    for (const m of this.project.monitors) if (m.name === old && m.type === rop) m.name = n;
    this.refresh(); this.changed(true);
  }
  deleteVariable(key, name) {
    for (const t of this.project.targets) if (has(t[key], name)) delete t[key][name];
    this.project.monitors = this.project.monitors.filter(m => !(m.name === name && m.type === (key === 'lists' ? 'list' : 'var')));
    this.refresh(); this.changed(true); this.toast(`Deleted “${name}”`);
  }
  async makeBlock() {
    const res = await this.form('Make a Block', [
      { name: 'name', label: 'Block name (letters, digits, _)', value: 'my_block' },
      { name: 'params', label: 'Inputs, comma separated (optional)', value: '' },
      { name: 'warp', type: 'checkbox', label: 'Run without screen refresh (fast)', value: false }]);
    if (!res) return;
    const ident = s => s.trim().replace(/\W+/g, '_').replace(/^(\d)/, '_$1');
    let name = ident(res.name || 'my_block') || 'my_block';
    const kw = new Set(DEF_LIST.map(d => d.kw)); if (kw.has(name) || ['define', 'script', 'else', 'and', 'or', 'not', 'eval', 'param', 'true', 'false'].includes(name)) name = 'my_' + name;
    if (this.findDefine(name)) { this.toast('A block with that name exists'); return; }
    const params = res.params.split(',').map(ident).filter(Boolean);
    const maxY = Math.max(0, ...this.target.scripts.map(s => s.y + 120));
    this.target.scripts.push({ x: 30 + this.blocks.ws.scrollLeft, y: Math.max(maxY, this.blocks.ws.scrollTop + 30), blocks: [{ op: 'define', name, params, warp: !!res.warp, args: [] }] });
    this.blocks.render(); this.changed(true); this.toast(`Created block “${name}” — find it under My Blocks`);
  }

  // ------------------------------------------------ monitors
  monitorOwner(type, name, t) { const key = type === 'list' ? 'lists' : 'variables'; return !t.isStage && Object.prototype.hasOwnProperty.call(t[key], name) ? (t.base || t).name : null; }
  findMonitor(type, name, t) { const owner = this.monitorOwner(type, name, t); return this.project.monitors.find(m => m.type === type && m.name === name && (m.owner || null) === owner); }
  setMonitor(type, name, t, visible) {
    let m = this.findMonitor(type, name, t);
    if (!m) { const n = this.project.monitors.length; m = { type, name, owner: this.monitorOwner(type, name, t), visible, x: type === 'list' ? 370 : 6, y: 6 + (n % 10) * 30 }; this.project.monitors.push(m); }
    m.visible = visible; this.renderMonitors(true); this.dirty = true;
  }
  renderMonitors(force) {
    const root = $('monitors'); if (force) { root.innerHTML = ''; this._monEls = new Map(); }
    for (const m of this.project.monitors) {
      const key = m.type + ':' + (m.owner || '') + ':' + m.name; let el = this._monEls.get(key);
      if (!m.visible) { if (el) { el.remove(); this._monEls.delete(key); } continue; }
      const owner = m.owner ? this.project.targets.find(t => t.name === m.owner) : this.project.targets[0]; if (!owner) continue;
      const label = (m.owner ? m.owner + ': ' : '') + m.name;
      if (!el) {
        el = h('div', 'monitor' + (m.type === 'list' ? ' list' : '')); el.style.left = m.x + 'px'; el.style.top = m.y + 'px';
        if (m.type === 'list') { el.append(h('div', '', label), h('div', 'items'), h('div', 'len')); } else el.append(h('span', '', label), h('span', 'val'));
        this.dragMonitor(el, m); root.appendChild(el); this._monEls.set(key, el);
      }
      if (m.type === 'var') { const v = owner.variables[m.name]; const s = typeof v === 'number' ? String(Math.round(v * 1e6) / 1e6) : v && typeof v === 'object' ? JSON.stringify(v).slice(0, 200) : String(v ?? ''); const ve = el.lastChild; if (ve.textContent !== s) ve.textContent = s; }
      else {
        const l = owner.lists[m.name] || []; const sig = l.length + '|' + l.slice(0, 100).join('\u0001');
        if (el._sig !== sig) { el._sig = sig; const items = el.children[1]; items.innerHTML = ''; l.slice(0, 100).forEach((v, i) => { const it = h('div', 'item'); it.append(h('i', '', i + 1), h('span', '', String(v))); items.appendChild(it); }); el.children[2].textContent = 'length ' + l.length; }
      }
    }
  }
  dragMonitor(el, m) {
    el.addEventListener('pointerdown', e => {
      e.preventDefault(); const sx = e.clientX, sy = e.clientY, ox = m.x, oy = m.y;
      const mv = ev => { m.x = Math.max(0, Math.min(W - 40, ox + (ev.clientX - sx) / this.stageScale)); m.y = Math.max(0, Math.min(H - 20, oy + (ev.clientY - sy) / this.stageScale)); el.style.left = m.x + 'px'; el.style.top = m.y + 'px'; };
      const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); this.changed(false); };
      window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
    });
  }

  // ------------------------------------------------ stage
  initStage() {
    this.cv = $('stage'); this.ctx = this.cv.getContext('2d');
    const toStage = e => { const r = this.cv.getBoundingClientRect(); return { cx: (e.clientX - r.left) / r.width * W, cy: (e.clientY - r.top) / r.height * H }; };
    this.cv.addEventListener('pointermove', e => { const p = toStage(e); this.runtime.mouse.x = Math.max(-240, Math.min(240, p.cx - W / 2)); this.runtime.mouse.y = Math.max(-180, Math.min(180, H / 2 - p.cy)); });
    this.cv.addEventListener('pointerdown', e => {
      const p = toStage(e); this.runtime.mouse.down = true; const s = this.runtime.clickAt(p.cx, p.cy);
      if (s && !document.body.classList.contains('fullstage')) {
        const base = s.base || s; if (!s.isClone && base !== this.target) this.select(base);
        const ox = s.x - (p.cx - W / 2), oy = s.y - (H / 2 - p.cy); this.cv.setPointerCapture(e.pointerId); let moved = false;
        const mv = ev => { const q = toStage(ev); if (!moved && Math.hypot(q.cx - p.cx, q.cy - p.cy) < 3) return; moved = true; s.x = Math.round(q.cx - W / 2 + ox); s.y = Math.round(H / 2 - q.cy + oy); this.runtime.redraw = true; };
        const up = () => { this.cv.removeEventListener('pointermove', mv); this.cv.removeEventListener('pointerup', up); if (moved) this.changed(false); };
        this.cv.addEventListener('pointermove', mv); this.cv.addEventListener('pointerup', up);
      }
    });
    window.addEventListener('pointerup', () => (this.runtime.mouse.down = false));
    document.addEventListener('keydown', e => {
      if (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]')) return;
      if (document.querySelector('.modal-bg')) return;
      if (e.key === 'Escape' && document.body.classList.contains('fullstage')) { this.toggleFull(false); return; }
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.runtime.keyDown(e); else this.runtime.keys.add(e.key === ' ' ? 'space' : e.key.toLowerCase());
    });
    document.addEventListener('keyup', e => this.runtime.keyUp(e));
    window.addEventListener('blur', () => this.runtime.keys.clear());
    new ResizeObserver(() => this.resizeStage()).observe($('stage-wrap')); this.resizeStage();
    $('ask-form').addEventListener('submit', e => { e.preventDefault(); const cb = this._askCb; this.hideAsk(); cb && cb($('ask-input').value); });
  }
  resizeStage() {
    const wrap = $('stage-wrap'); const full = document.body.classList.contains('fullstage');
    let w = wrap.clientWidth, hh = wrap.clientHeight, s = Math.min(w / W, hh / H);
    if (full) { const fw = W * s, fh = H * s; wrap.style.setProperty('--fw', fw + 'px'); wrap.style.setProperty('--fh', fh + 'px'); wrap.style.setProperty('--fl', (w - fw) / 2 + 'px'); wrap.style.setProperty('--ft', (hh - fh) / 2 + 'px'); }
    this.stageScale = s; const dpr = window.devicePixelRatio || 1;
    this.cv.width = Math.round(W * s * dpr); this.cv.height = Math.round(H * s * dpr);
    $('overlay').style.transform = `scale(${s})`; this.runtime.redraw = true;
  }
  toggleFull(on = !document.body.classList.contains('fullstage')) { document.body.classList.toggle('fullstage', on); this.resizeStage(); }
  showAsk(q, cb) { $('ask').hidden = false; $('ask-q').textContent = q; $('ask-input').value = ''; this._askCb = cb; setTimeout(() => $('ask-input').focus(), 0); }
  withPaint(fn) {
    if (this.paint) return fn(this.paint);
    this._paintP ||= lazyPaint().then(m => (this.paint = new m.Paint(this)));
    return this._paintP.then(fn);
  }
  hideAsk() { $('ask').hidden = true; this._askCb = null; }
  frame() {
    try {
      this.runtime.step();
      if (this.runtime.needsRender()) {      // repaint only when something visual changed
        const s = this.stageScale * (window.devicePixelRatio || 1); this.ctx.setTransform(s, 0, 0, s, 0, 0); this.ctx.imageSmoothingEnabled = true;
        this.runtime.render(this.ctx);
      }
      this.renderMonitors(false); syncWidgets($('widgets'), this.runtime);
      const running = this.runtime.isRunning(); $('btn-ignite').classList.toggle('active', running);
      this.blocks.updateRunning(this.runningScripts());
      if ((this._fc = (this._fc || 0) + 1) % 10 === 0) { this.renderSpriteInfo(false); if (running && this._fc % 30 === 0) this.renderTargets(); }
    } catch (e) { console.warn(e); }
    requestAnimationFrame(() => this.frame());
  }

  // ------------------------------------------------ sprite pane
  renderSpriteInfo(force) {
    const t = this.target, box = $('sprite-info');
    if (force || box._t !== t) {
      box._t = t; box.innerHTML = '';
      const field = (label, key, type = 'text', cls = '') => {
        const l = h('label', '', label); const i = h('input'); i.type = type; i.dataset.key = key; if (cls) i.className = cls;
        i.addEventListener('change', () => {
          if (key === 'name') { const n = i.value.trim(); if (!n || this.project.targets.some(o => o !== t && o.name === n)) { i.value = t.name; this.toast('Name must be unique'); return; } this.renameSprite(t, n); }
          else if (type === 'checkbox') t[key] = i.checked; else t[key] = Number(i.value) || 0;
          this.runtime.redraw = true; this.changed(key === 'name');
        });
        box.append(l, i); return i;
      };
      if (t.isStage) { box.append(h('b', 'wide', 'Stage'), h('span', 'wide', `${t.costumes.length} backdrop(s) · click a sprite to edit it`)); return; }
      field('Sprite', 'name', 'text', 'wide').parentNode; box.lastChild.classList.add('wide'); box.children[0].style.gridColumn = 'span 1';
      field('Show', 'visible', 'checkbox');
      field('x', 'x', 'number'); field('y', 'y', 'number'); field('Size', 'size', 'number'); field('Dir', 'direction', 'number');
      const rl = h('label', '', 'Rotate'); const rs = h('select'); for (const o of MENUS_STATIC.rotStyle) { const op = h('option', '', o); op.value = o; rs.appendChild(op); }
      rs.value = t.rotationStyle; rs.onchange = () => { t.rotationStyle = rs.value; this.runtime.redraw = true; this.changed(false); }; rs.className = 'in-select'; rs.style.gridColumn = 'span 3'; box.append(rl, rs);
    }
    if (t.isStage) return;
    for (const i of box.querySelectorAll('input')) {
      if (document.activeElement === i) continue; const k = i.dataset.key; const v = t[k];
      if (i.type === 'checkbox') i.checked = !!v; else { const s = typeof v === 'number' ? String(Math.round(v)) : v; if (i.value !== s) i.value = s; }
    }
  }
  renameSprite(t, n) {
    const old = t.name; t.name = n;
    this.walkBlocks(b => { const d = DEFS[b.op]; if (!d) return; let i = 0; for (const m of d.text.matchAll(/%(n|s|b|k|v|m\.(\w+))/g)) { if (['goto', 'towards', 'touch', 'cloneOf', 'object'].includes(m[2]) && b.args[i] === old) b.args[i] = n; i++; } });
    for (const m of this.project.monitors) if (m.owner === old) m.owner = n;
    this.refresh();
  }
  renderTargets() {
    const list = $('sprite-list'); list.innerHTML = '';
    const sprites = this.project.targets.filter(t => !t.isStage);
    for (const s of sprites) {
      const tile = h('div', 'stile' + (s === this.target ? ' on' : '')); const img = h('img'); img.src = costumeOf(s)?.src || ''; img.alt = '';
      tile.append(img, h('span', 'nm', s.name)); tile.onclick = () => this.select(s);
      const x = h('button', 'x', '×'); x.title = 'Delete sprite'; x.onclick = async ev => { ev.stopPropagation(); if (await this.confirm(`Delete sprite “${s.name}”?`)) this.deleteSprite(s); }; tile.appendChild(x);
      tile.oncontextmenu = e => { e.preventDefault(); this.contextMenu(e.clientX, e.clientY, [['Duplicate', () => this.duplicateSprite(s)], ['Delete', () => this.deleteSprite(s)]]); };
      list.appendChild(tile);
    }
    const add = h('div', 'stile add', '+'); add.title = 'Add a sprite'; add.onclick = () => this.addSpriteDialog(); list.appendChild(add);
    const st = this.project.targets[0], box = $('stage-tile'); box.innerHTML = '';
    const tile = h('div', 'stile' + (st === this.target ? ' on' : '')); const img = h('img'); img.src = costumeOf(st)?.src || '';
    tile.append(img, h('span', 'nm', 'Stage'), h('small', '', `${st.costumes.length} backdrop${st.costumes.length > 1 ? 's' : ''}`)); tile.onclick = () => this.select(st);
    const ab = h('button', '', '+ Backdrop'); ab.onclick = () => this.libraryDialog(true);
    box.append(tile, ab);
  }
  uniqueName(base) { let n = base, i = 2; while (this.project.targets.some(t => t.name === n)) n = base + i++; return n; }
  addSprite(name, costumes) {
    const layer = Math.max(0, ...this.project.targets.filter(t => !t.isStage).map(t => t.layer + 1));
    const s = makeTarget(this.uniqueName(name), costumes, { x: Math.round(Math.random() * 200 - 100), y: Math.round(Math.random() * 140 - 70), layer });
    s.costumes.forEach(c => getImg(c.src, () => { this.runtime.redraw = true; this.renderTargets(); }));
    this.project.targets.push(s); this.runtime.normalizeLayers(); this.select(s); this.changed(true); return s;
  }
  duplicateSprite(s) { const c = clone({ ...s, bubble: null }); c.name = this.uniqueName(s.name); c.x += 20; c.y -= 20; c.layer = 1e6; this.project.targets.push(c); this.runtime.normalizeLayers(); this.select(c); this.changed(true); }
  deleteSprite(s) {
    this.runtime.stopAll(); const i = this.project.targets.indexOf(s); if (i > 0) this.project.targets.splice(i, 1);
    this.project.monitors = this.project.monitors.filter(m => m.owner !== s.name);
    this.target = this.project.targets[Math.min(i, this.project.targets.length - 1)]; this.refresh(); this.changed(true);
  }
  addSpriteDialog() {
    const { bg, box, close } = this.modal('Add a sprite');
    const row = h('div', 'actions'); row.style.justifyContent = 'flex-start'; row.style.marginTop = '0';
    const paint = h('button', '', '🖌 Paint a new sprite'); paint.onclick = () => { close(); this.addSprite('Sprite', [{ name: 'costume1', src: art.svgUrl(2, 2, ''), w: 1, h: 1, cx: 0.5, cy: 0.5 }]); this.switchTab('costumes'); };
    const up = h('button', '', '⤒ Upload image'); up.onclick = () => { close(); this.uploadImage(c => this.addSprite(c.name, [c])); };
    row.append(paint, up); box.appendChild(row); box.appendChild(h('p', 'hint', 'Or pick an original Kindlr character:'));
    const grid = h('div', 'lib-grid');
    for (const it of art.SPRITE_LIBRARY) { const d = h('div', 'lib-item'); const im = h('img'); im.src = it.costumes[0].src; d.append(im, h('div', '', it.name)); d.onclick = () => { close(); this.addSprite(it.name, it.costumes); }; grid.appendChild(d); }
    box.appendChild(grid);
  }
  libraryDialog(backdrop) {
    const { box, close } = this.modal(backdrop ? 'Choose a backdrop' : 'Choose a costume'); const grid = h('div', 'lib-grid');
    const items = backdrop ? Object.values(art.backdrops).map(c => ({ name: c.name, c })) : art.SPRITE_LIBRARY.flatMap(s => s.costumes.map(c => ({ name: c.name, c })));
    for (const it of items) { const d = h('div', 'lib-item'); const im = h('img'); im.src = it.c.src; d.append(im, h('div', '', it.name)); d.onclick = () => { close(); this.addCostume(clone(it.c), backdrop ? this.project.targets[0] : this.target); }; grid.appendChild(d); }
    box.appendChild(grid);
  }
  addCostume(c, t = this.target) {
    const names = new Set(t.costumes.map(x => x.name)); let n = c.name, i = 2; while (names.has(n)) n = c.name + i++; c.name = n;
    t.costumes.push(c); t.costume = t.costumes.length - 1; getImg(c.src, () => (this.runtime.redraw = true));
    if (t !== this.target) this.select(t); else this.refresh(); this.changed(true);
  }
  uploadImage(cb) {
    const inp = $('cos-file'); inp.value = ''; inp.onchange = () => {
      const f = inp.files[0]; if (!f) return; const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 460 / im.width, 340 / im.height); const w = im.width * s, hh = im.height * s; cb({ name: f.name.replace(/\.\w+$/, '').slice(0, 30) || 'image', src: r.result, w, h: hh, cx: w / 2, cy: hh / 2 }); }; im.src = r.result; };
      r.readAsDataURL(f);
    }; inp.click();
  }

  // ------------------------------------------------ costumes pane
  initCostumes() {
    $('cos-paint').onclick = () => this.addCostume({ name: this.target.isStage ? 'backdrop' : 'costume', src: art.svgUrl(2, 2, ''), w: 1, h: 1, cx: 0.5, cy: 0.5 });
    $('cos-lib').onclick = () => this.libraryDialog(this.target.isStage);
    $('cos-upload').onclick = () => this.uploadImage(c => this.addCostume(c));
  }
  renderCostumes() {
    const t = this.target, box = $('costume-tiles'); box.innerHTML = '';
    t.costumes.forEach((c, i) => {
      const tile = h('div', 'ctile' + (i === t.costume ? ' on' : '')); const th = h('div', 'thumb'); const im = h('img'); im.src = c.src; th.appendChild(im);
      const nm = h('input'); nm.value = c.name; nm.onchange = () => { const old = c.name; c.name = nm.value.trim() || old; this.walkBlocks(b => { if (['lo_costume', 'lo_backdrop', 'ev_backdrop'].includes(b.op) && b.args[0] === old) b.args[0] = c.name; }); this.changed(true); this.blocks.render(); };
      tile.append(h('span', 'n', i + 1), th, nm);
      const x = h('button', 'x', '×'); x.title = 'Delete'; x.onclick = e => { e.stopPropagation(); if (t.costumes.length < 2) { this.toast('Keep at least one costume'); return; } t.costumes.splice(i, 1); t.costume = Math.min(t.costume, t.costumes.length - 1); this.renderCostumes(); this.changed(true); this.runtime.redraw = true; };
      const dup = h('button', 'dup', '⧉'); dup.title = 'Duplicate'; dup.onclick = e => { e.stopPropagation(); const cc = clone(c); t.costumes.splice(i + 1, 0, cc); cc.name += ' copy'; t.costume = i + 1; this.renderCostumes(); this.changed(true); };
      tile.append(dup, x); tile.onclick = e => { if (e.target === nm) return; t.costume = i; this.runtime.redraw = true; this.renderCostumes(); this.renderTargets(); };
      box.appendChild(tile);
    });
    this.withPaint(p => p.load(t.costumes[t.costume]));
  }
  costumesChanged() {
    this.runtime.redraw = true; const t = this.target; const tiles = $('costume-tiles').querySelectorAll('.ctile img');
    const c = t.costumes[t.costume]; if (tiles[t.costume] && c) tiles[t.costume].src = c.src; this.renderTargets(); this.changed(false);
  }

  // ------------------------------------------------ text (Kindlr Script)
  initText() {
    const ta = $('code'), hl = $('code-hl');
    const sync = () => { hl.innerHTML = highlight(ta.value) + '\n'; hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; };
    ta.addEventListener('input', () => { sync(); this._textDirty = true; $('text-status').textContent = 'Edited — click “Apply to blocks”'; $('text-status').className = ''; });
    ta.addEventListener('scroll', () => { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.setRangeText('  ', s, ta.selectionEnd, 'end'); sync(); }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.textToBlocks(); }
    });
    this._syncText = sync;
    $('text-refresh').onclick = () => this.textFromBlocks();
    $('text-apply').onclick = () => this.textToBlocks();
    $('text-help-btn').onclick = e => { e.preventDefault(); $('text-help').hidden = !$('text-help').hidden; };
  }
  textFromBlocks() { $('code').value = targetToText(this.target); this._syncText(); this._textDirty = false; $('text-status').textContent = 'In sync with blocks'; $('text-status').className = 'ok'; }
  textToBlocks() {
    try {
      const scripts = parseKls($('code').value);
      const defs = new Set(scripts.map(s => s.blocks[0]).filter(b => b?.op === 'define').map(b => b.name));
      // auto-create any variables/lists referenced in text
      const visit = b => { if (!b || typeof b !== 'object' || !b.op) return;
        const d = DEFS[b.op]; if (b.op === 'var' && !this.visibleVars(this.target, 'variables').includes(b.args[0])) put(this.project.targets[0].variables, b.args[0], 0);
        if (b.op === 'list' && !this.visibleVars(this.target, 'lists').includes(b.args[0])) put(this.project.targets[0].lists, b.args[0], []);
        if (d) { let i = 0; for (const m of d.text.matchAll(/%(n|s|b|k|v|m\.(\w+))/g)) { const v = b.args[i]; if (typeof v === 'string' && v) { if (m[2] === 'var' && !this.visibleVars(this.target, 'variables').includes(v)) put(this.project.targets[0].variables, v, 0); if (m[2] === 'list' && !this.visibleVars(this.target, 'lists').includes(v)) put(this.project.targets[0].lists, v, []); } i++; } }
        if (b.op === 'call' && !defs.has(b.name)) throw new Error(`unknown block '${b.name}' (define it with define ${b.name}(...) { })`);
        (b.args || []).forEach(visit); (b.body || []).forEach(visit); (b.body2 || []).forEach(visit); };
      scripts.forEach(s => s.blocks.forEach(visit));
      this.runtime.stopAll();
      this.target.scripts = layoutScripts(scripts, this.target.scripts.map(s => ({ x: s.x, y: s.y })));
      this.refresh(); this.changed(true); this._textDirty = false;
      $('text-status').textContent = `✓ Applied ${scripts.length} script(s) to blocks`; $('text-status').className = 'ok';
    } catch (e) { $('text-status').textContent = '✗ ' + e.message; $('text-status').className = 'err'; }
  }
  switchTab(tab) {
    if (this.tab === 'text' && tab !== 'text' && this._textDirty) this.toast('Text edits not applied (use “Apply to blocks”)');
    this.tab = tab; document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === tab));
    document.querySelectorAll('.pane').forEach(p => p.classList.toggle('on', p.id === 'pane-' + tab));
    if (tab === 'text') this.textFromBlocks(); if (tab === 'costumes') this.renderCostumes(); if (tab === 'blocks') this.blocks.render();
  }

  // ------------------------------------------------ chrome
  initChrome() {
    const theme = localStorage.getItem('kindlr.theme') || 'dark'; document.documentElement.dataset.theme = theme;
    $('logo').innerHTML = art.LOGO_SVG; $('ignite-icon').innerHTML = art.FLAME_SVG;
    document.querySelectorAll('[data-icon]').forEach(el => iconize(el, el.dataset.icon, el.textContent.trim() || null));
    $('btn-examples').insertAdjacentHTML('beforeend', ICONS.caret);
    this.initMobileNotice();
    $('btn-theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; localStorage.setItem('kindlr.theme', t); };
    const cats = $('cats');
    for (const c of CATEGORIES) { const b = h('button', 'cat'); b.style.setProperty('--c', c.color); b.append(h('i'), h('span', '', c.name)); b.onclick = () => { const el = $('pal-' + c.id); if (el) $('palette').scrollTo({ top: el.offsetTop - 6, behavior: 'smooth' }); }; cats.appendChild(b); }
    $('palette').addEventListener('scroll', () => { const P = $('palette'); let cur = CATEGORIES[0].id; for (const c of CATEGORIES) { const el = $('pal-' + c.id); if (el && el.offsetTop - 30 <= P.scrollTop) cur = c.id; } cats.querySelectorAll('.cat').forEach((b, i) => b.classList.toggle('on', CATEGORIES[i].id === cur)); });
    document.querySelectorAll('.tab').forEach(b => (b.onclick = () => this.switchTab(b.dataset.tab)));
    $('btn-ignite').onclick = () => this.runtime.ignite();
    $('btn-stop').onclick = () => this.runtime.stopAll();
    $('btn-full').onclick = () => this.toggleFull(); $('exit-full').onclick = () => this.toggleFull(false);
    $('z-in').onclick = () => this.blocks.setZoom(this.blocks.zoom + 0.15); $('z-out').onclick = () => this.blocks.setZoom(this.blocks.zoom - 0.15);
    $('z-reset').onclick = () => this.blocks.setZoom(1); $('z-clean').onclick = () => this.blocks.cleanUp();
    $('project-name').onchange = e => { this.project.name = e.target.value.trim() || 'Untitled project'; this.changed(false); };
    $('btn-new').onclick = async () => { if (await this.confirm('Start a new project? Unsaved changes will be lost (download a copy with Save first).')) this.loadProject(blankProject()); };
    $('btn-save').onclick = () => this.download();
    $('btn-open').onclick = () => { const f = $('file-input'); f.value = ''; f.click(); };
    $('file-input').onchange = e => { const f = e.target.files[0]; if (!f) return; this.openFile(f); };
    $('text-open').onclick = () => { const f = $('file-input'); f.value = ''; f.accept = '.kls,text/plain'; f.click(); setTimeout(() => (f.accept = '.kindlr,.kls,.json,application/json'), 0); };
    $('text-download').onclick = () => this.saveFile(new Blob([$('code').value], { type: 'text/plain' }), this.fileBase() + '-' + this.target.name.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.kls', 'Kindlr Script downloaded');
    const dd = $('btn-examples').parentNode, menu = $('examples-menu');
    const blurbs = ['Meet Sparky & Bolt: events, broadcasts, sounds, effects', 'A mini game: clones, keys, score & lives', 'Pen art with a custom block and a list', 'Program mode: widgets, console, maps, storage', 'Gravity, velocity & the draw event'];
    exampleProjects().forEach((p, i) => { const b = h('button'); b.append(h('b', '', p.name), h('small', '', blurbs[i])); b.onclick = () => { dd.classList.remove('open'); this.loadProject(exampleProjects()[i]); }; menu.appendChild(b); });
    const setDD = open => { dd.classList.toggle('open', open); $('btn-examples').setAttribute('aria-expanded', String(open)); if (open) menu.querySelector('button')?.focus(); };
    menu.querySelectorAll('button').forEach(b => b.setAttribute('role', 'menuitem'));
    $('btn-examples').onclick = e => { e.stopPropagation(); setDD(!dd.classList.contains('open')); };
    menu.addEventListener('keydown', e => {
      const items = [...menu.querySelectorAll('button')]; const i = items.indexOf(document.activeElement);
      if (e.key === 'Escape') { setDD(false); $('btn-examples').focus(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
    });
    document.addEventListener('click', () => setDD(false));
    $('btn-account').onclick = () => this.accountDialog();
    $('btn-cloud').onclick = () => this.cloudDialog();
    $('btn-share').onclick = () => this.shareDialog();
    $('btn-player').onclick = () => openPlayer(this, this.serialize(), { title: 'Sandboxed player — ' + this.project.name, onStore: (k, v) => this.storeSet(k, v) });
    $('con-clear').onclick = () => this.clearConsole(); $('con-toggle').onclick = () => $('console').classList.toggle('collapsed');
    window.addEventListener('beforeunload', () => { if (this.dirty) this.autosave(); });
  }
  // Phones: the editor needs a big screen. Offer the sandboxed player (works well on phones) or continue anyway.
  initMobileNotice() {
    const small = () => window.matchMedia('(max-width: 760px)').matches;
    if (small()) { document.documentElement.classList.add('small-screen'); document.body.classList.add('small-screen'); }   // editor on a phone: desktop layout, pannable (see style.css)
    if (!small() || localStorage.getItem('kindlr.mobile-ok') === '1') return;
    const box = h('div'); box.id = 'mobile-notice'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'mn-title');
    const card = h('div', 'mn-card'); const logo = h('div', 'mn-logo'); logo.innerHTML = art.LOGO_SVG;
    const play = h('button', 'primary', 'Play this project'); const ex = h('a', 'btn', 'Explore shared projects'); ex.href = './explore';
    const go = h('button', 'link', 'Open the editor anyway');
    card.append(logo, Object.assign(h('h2', '', 'Kindlr works best on a bigger screen'), { id: 'mn-title' }),
      h('p', '', 'Building with blocks needs room to drag. On a phone you can still play projects in the sandboxed player, or browse what others made.'), play, ex, go);
    box.appendChild(card); document.body.appendChild(box);
    const close = () => box.remove();
    play.onclick = () => { close(); openPlayer(this, this.serialize(), { title: this.project.name }); };
    go.onclick = () => { localStorage.setItem('kindlr.mobile-ok', '1'); close(); };
    setTimeout(() => play.focus(), 50);
  }
  fileBase() { return (this.project.name || 'project').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') || 'project'; }
  saveFile(blob, name, msg) { const a = h('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); this.toast(msg); }
  download() { this.saveFile(new Blob([this.serialize()], { type: 'application/json' }), this.fileBase() + '.kindlr', 'Project downloaded as ' + this.fileBase() + '.kindlr'); }
  /** .kindlr / old .bforge.json / .json → project; .kls → Kindlr Script text for the current sprite. */
  async openFile(f) {
    if (f.size > LIMITS.maxJsonBytes) { this.toast(`That file is too big (max ${LIMITS.maxJsonBytes / 1e6} MB)`); return; }
    const t = await f.text();
    if (/\.kls$/i.test(f.name)) {
      if (t.length > LIMITS.maxTextBytes) { this.toast('That script is too big (max 1 MB)'); return; }
      this.switchTab('text'); $('code').value = t; this._syncText(); this._textDirty = true;
      $('text-status').textContent = `Loaded ${f.name}. Press “Apply to blocks” to use it for ${this.target.name}`; $('text-status').className = ''; return;
    }
    try { this.loadProject(validateProject(t)); } catch (err) { this.toast('Can’t open this file: ' + err.message); }
  }

  // ------------------------------------------------ cloud (optional server)
  // cloudRef = { id, name, user } of the cloud project the editor is *currently* showing, or null.
  // It is cleared by every load that isn't "open my own cloud project" (New, Open file, examples, See inside,
  // shared/remix views), so Save can never overwrite an unrelated cloud project or its public share.
  setCloudRef(ref) {
    this.cloudRef = ref && typeof ref.id === 'string' ? { id: ref.id, name: String(ref.name || ''), user: String(ref.user || '') } : null;
    try { if (this.cloudRef) localStorage.setItem(CLOUDREF, JSON.stringify(this.cloudRef)); else localStorage.removeItem(CLOUDREF); } catch (e) { }
    $('save-status').title = this.cloudRef ? `Linked to cloud project “${this.cloudRef.name}”` : 'Not linked to a cloud project';
  }
  readCloudRef() { try { const r = JSON.parse(localStorage.getItem(CLOUDREF) || 'null'); return r && typeof r.id === 'string' ? r : null; } catch (e) { return null; } }
  setUser(u) {
    this.user = u; if (u) localStorage.setItem('kindlr.cloud', '1'); else localStorage.removeItem('kindlr.cloud');
    const b = $('btn-account'); iconize(b, u ? (u.email_verified ? 'user' : 'warn') : 'user', u ? u.username : 'Sign in');
    b.dataset.state = u ? (u.email_verified ? 'verified' : 'unverified') : 'signed-out';
    b.title = u ? (u.email_verified ? `Signed in as ${u.username}. Account settings` : 'Your email is not verified yet. Open your account to resend the link') : 'Sign in or create an account';
    if (this.cloudRef && (!u || this.cloudRef.user !== u.username)) this.setCloudRef(null);   // never save into another account's project
  }
  async openFromHash() {
    const m = location.hash.match(/(?:^#|&)cloud=([\w-]{8,32})/); if (!m) return;
    history.replaceState(null, '', location.pathname + location.search);
    try { const u = await cloud.me(); this.setUser(u); if (!u) { this.toast('Sign in to open that project'); return; } await this.openCloudProject(m[1]); }
    catch (e) { this.toast('Could not open cloud project: ' + e.message); }
  }
  async openCloudProject(id) {
    const r = await cloud.meta(id); const p = validateProject(r.data);
    if (this.loadProject(p, false, { id, name: r.name, user: this.user.username })) { if (p.name !== r.name) { this.project.name = r.name; $('project-name').value = r.name; } return true; }
    return false;
  }
  /** Save to the cloud. Overwrites only the linked project of the signed-in user, after confirming any doubt. */
  async saveToCloud({ asNew = false } = {}) {
    if (!this.user) { this.accountDialog('Sign in to save to the cloud'); return null; }
    const name = this.project.name, data = this.serialize();
    let ref = asNew ? null : this.cloudRef;
    if (ref && ref.user !== this.user.username) ref = null;
    if (ref && ref.name !== name) {
      const c = await this.choose('Overwrite cloud project?', `The editor is linked to your cloud project “${ref.name}”, but this project is called “${name}”. Overwrite “${ref.name}” (including its public link, if shared), or save a new copy?`,
        [['cancel', 'Cancel'], ['new', 'Save as new'], ['over', `Overwrite “${ref.name}”`, 'danger']]);
      if (c === 'cancel' || !c) return null; if (c === 'new') ref = null;
    }
    try {
      const r = await cloud.save(ref ? ref.id : null, name, data);
      this.setCloudRef({ id: r.id, name, user: this.user.username }); this.toast(ref ? 'Saved to cloud' : 'Saved as a new cloud project'); return r.id;
    } catch (e) {
      if (ref && e.status === 404) {   // deleted elsewhere or not ours: never guess; offer a fresh copy
        this.setCloudRef(null);
        if (await this.confirm('That cloud project no longer exists in your account. Save this as a new cloud project instead?')) return this.saveToCloud({ asNew: true });
        return null;
      }
      this.toast('Save failed: ' + e.message); return null;
    }
  }
  accountDialog(note) {
    if (this.user) return this.accountSettings();
    const { box, close } = this.modal('Kindlr Cloud'); box.classList.add('auth-modal');
    if (note) box.appendChild(h('p', 'hint', note));
    const tabs = h('div', 'auth-tabs'); const tLogin = h('button', 'on', 'Log in'), tSign = h('button', '', 'Create account'); tabs.append(tLogin, tSign);
    const u = h('input'); u.type = 'text'; u.placeholder = 'username'; u.autocomplete = 'username'; u.maxLength = 24;
    const em = h('input'); em.type = 'email'; em.placeholder = 'you@example.com'; em.autocomplete = 'email'; em.maxLength = 254;
    const p = h('input'); p.type = 'password'; p.placeholder = 'at least 8 characters'; p.autocomplete = 'current-password'; p.maxLength = 200;
    const emLab = h('label', '', 'Email (for verification and password reset)');
    const err = h('div', 'err-text');
    box.append(tabs, h('label', '', 'Username'), u, emLab, em, h('label', '', 'Password'), p, err);
    const act = h('div', 'actions'); const forgot = h('button', 'link', 'Forgot password?'); const go = h('button', 'primary', 'Log in'); act.append(forgot, go); box.appendChild(act);
    let mode = 'login';
    const setMode = m => { mode = m; tLogin.className = m === 'login' ? 'on' : ''; tSign.className = m === 'signup' ? 'on' : ''; emLab.hidden = em.hidden = m !== 'signup'; go.textContent = m === 'login' ? 'Log in' : 'Create account'; p.autocomplete = m === 'login' ? 'current-password' : 'new-password'; err.textContent = ''; };
    tLogin.onclick = () => setMode('login'); tSign.onclick = () => setMode('signup'); setMode('login');
    go.onclick = async () => {
      err.textContent = ''; go.disabled = true;
      try {
        const user = mode === 'login' ? await cloud.login(u.value.trim(), p.value) : await cloud.signup(u.value.trim(), em.value.trim(), p.value);
        this.setUser(user); close();
        this.toast(mode === 'signup' ? `Welcome, ${user.username}! Check ${user.email} for a link to verify your email.` : 'Welcome back, ' + user.username + '!');
      } catch (e) { err.textContent = e.message; } finally { go.disabled = false; }
    };
    p.onkeydown = e => { if (e.key === 'Enter') go.click(); };
    forgot.onclick = () => { close(); this.forgotDialog(u.value.includes('@') ? u.value : ''); };
    setTimeout(() => u.focus(), 0);
  }
  forgotDialog(prefill = '') {
    const { box, close } = this.modal('Reset your password');
    box.appendChild(h('p', 'hint', 'Enter the email address on your account. If it matches an account, we will send a link to choose a new password (valid for 1 hour).'));
    const em = h('input'); em.type = 'email'; em.value = prefill; em.placeholder = 'you@example.com'; em.autocomplete = 'email';
    const msg = h('div', 'hint'); const err = h('div', 'err-text'); box.append(h('label', '', 'Email'), em, err, msg);
    const act = h('div', 'actions'); const c = h('button', '', 'Close'), s = h('button', 'primary', 'Send reset link'); act.append(c, s); box.appendChild(act);
    c.onclick = close;
    s.onclick = async () => { err.textContent = ''; s.disabled = true; try { const r = await cloud.forgot(em.value.trim()); msg.textContent = r.message; s.textContent = 'Sent'; } catch (e) { err.textContent = e.message; s.disabled = false; } };
    em.onkeydown = e => { if (e.key === 'Enter') s.click(); }; setTimeout(() => em.focus(), 0);
  }
  async accountSettings() {
    try { const fresh = await cloud.me(); this.setUser(fresh); if (!fresh) return this.accountDialog('Your session ended. Please sign in again.'); } catch (e) { }
    const user = this.user;
    const { box, close } = this.modal('Account'); box.classList.add('account-modal');
    const section = (title, cls = '') => { const s = h('section', 'acct ' + cls); s.appendChild(h('h4', '', title)); box.appendChild(s); return s; };
    const row = (...els) => { const r = h('div', 'row'); r.append(...els); return r; };
    const input = (type, ph, ac) => { const i = h('input'); i.type = type; i.placeholder = ph; if (ac) i.autocomplete = ac; i.maxLength = type === 'email' ? 254 : 200; return i; };
    // profile + verification
    const prof = section('Profile');
    prof.appendChild(row(h('b', '', user.username), h('span', 'muted', user.email || 'no email on file'),
      h('span', 'badge ' + (user.email_verified ? 'ok' : 'warn'), user.email_verified ? 'Verified' : 'Not verified')));
    if (!user.email_verified) {
      const note = h('p', 'hint', 'You can sign in, use the editor and save private projects. Verify your email to publish/share projects and create API tokens.');
      const resend = h('button', '', 'Resend verification email'); const rmsg = h('span', 'hint');
      resend.onclick = async () => { resend.disabled = true; try { const r = await cloud.resendVerification(); rmsg.textContent = r.already_verified ? 'Already verified.' : `Sent to ${user.email}. ${r.remaining} resend${r.remaining === 1 ? '' : 's'} left this hour.`; } catch (e) { rmsg.textContent = e.message; } finally { setTimeout(() => (resend.disabled = false), 4000); } };
      prof.append(note, row(resend, rmsg));
    }
    // change password
    const pw = section('Change password');
    const cur = input('password', 'current password', 'current-password'), nw = input('password', 'new password (8+ characters)', 'new-password'); const pmsg = h('div', 'hint');
    const pbtn = h('button', '', 'Change password');
    pbtn.onclick = async () => { pmsg.textContent = ''; try { await cloud.changePassword(cur.value, nw.value); cur.value = nw.value = ''; pmsg.textContent = 'Password changed. Other devices were signed out.'; } catch (e) { pmsg.textContent = e.message; } };
    pw.append(cur, nw, row(pbtn, pmsg));
    // change email
    const ce = section('Change email');
    const ne = input('email', 'new email address', 'email'), cep = input('password', 'current password', 'current-password'); const emsg = h('div', 'hint');
    const ebtn = h('button', '', 'Change email');
    ebtn.onclick = async () => { emsg.textContent = ''; try { const u2 = await cloud.changeEmail(ne.value.trim(), cep.value); this.setUser(u2); emsg.textContent = `Saved. We sent a verification link to ${u2.email}; publishing is paused until you verify it.`; ne.value = cep.value = ''; } catch (e) { emsg.textContent = e.message; } };
    ce.append(ne, cep, row(ebtn, emsg));
    // API tokens
    const tk = section('API tokens');
    tk.appendChild(h('p', 'hint', 'Tokens let scripts read and write your projects via /api/projects with "Authorization: Bearer <token>". They are shown once and stored hashed.'));
    const tlist = h('div', 'token-list'); const tname = input('text', 'token name, e.g. backup script'); tname.maxLength = 60; const tmsg = h('div', 'hint');
    const tbtn = h('button', '', 'Create token'); tbtn.disabled = !user.email_verified; if (!user.email_verified) tbtn.title = 'Verify your email first';
    const loadTokens = async () => { tlist.replaceChildren(h('div', 'loading', 'Loading tokens…')); try { const ts = await cloud.tokens(); tlist.replaceChildren(); if (!ts.length) tlist.appendChild(h('div', 'muted', 'No tokens yet.')); for (const t of ts) { const del = h('button', 'small', 'Revoke'); del.onclick = async () => { if (await this.confirm(`Revoke token “${t.name}”? Scripts using it will stop working.`)) { await cloud.deleteToken(t.id); loadTokens(); } }; tlist.appendChild(row(h('b', '', t.name), h('span', 'muted', 'created ' + new Date(t.created_at).toLocaleDateString() + (t.last_used_at ? ' · used ' + new Date(t.last_used_at).toLocaleDateString() : ' · never used')), del)); } } catch (e) { tlist.appendChild(h('div', 'err-text', e.message)); } };
    tbtn.onclick = async () => { tmsg.replaceChildren(); try { const r = await cloud.createToken(tname.value.trim()); tname.value = ''; const out = h('input'); out.readOnly = true; out.value = r.token; out.className = 'mono'; const cp = h('button', 'small', 'Copy'); cp.onclick = () => this.copy(r.token, 'Token copied'); tmsg.append(h('div', '', 'Copy your new token now. It will not be shown again:'), row(out, cp)); loadTokens(); } catch (e) { tmsg.textContent = e.message; } };
    tk.append(tlist, row(tname, tbtn), tmsg); loadTokens();
    // danger zone
    const dz = section('Delete account', 'danger');
    dz.appendChild(h('p', 'hint', 'Permanently deletes your account, all cloud projects and their public links, and API tokens. This cannot be undone.'));
    const dconf = input('text', `type your username (${user.username}) to confirm`), dpw = input('password', 'current password', 'current-password'); const dmsg = h('div', 'err-text');
    const dbtn = h('button', 'danger', 'Delete my account');
    dbtn.onclick = async () => { dmsg.textContent = ''; try { await cloud.deleteAccount(dpw.value, dconf.value.trim()); this.setUser(null); this.setCloudRef(null); close(); this.toast('Your account was deleted'); } catch (e) { dmsg.textContent = e.message; } };
    dz.append(dconf, dpw, row(dbtn), dmsg);
    const act = h('div', 'actions'); const lo = h('button', '', 'Log out'), cl = h('button', 'primary', 'Done');
    lo.onclick = async () => { await cloud.logout().catch(() => {}); this.setUser(null); close(); this.toast('Logged out'); }; cl.onclick = close;
    act.append(lo, cl); box.appendChild(act);
  }
  async cloudDialog() {
    if (!this.user) { this.accountDialog('Sign in to save projects to the cloud'); return; }
    const { box, close } = this.modal('Cloud projects'); const list = h('div', 'cloud-list'); const err = h('div', 'err-text');
    const linked = this.cloudRef ? `Linked to “${this.cloudRef.name}”` : 'This project is not saved to the cloud yet';
    box.appendChild(h('p', 'hint', linked));
    const bar = h('div', 'row');
    const save = h('button', 'primary', this.cloudRef ? 'Save' : 'Save to cloud'); const saveNew = h('button', '', 'Save as new');
    save.onclick = async () => { if (await this.saveToCloud()) { close(); this.cloudDialog(); } };
    saveNew.onclick = async () => { if (await this.saveToCloud({ asNew: true })) { close(); this.cloudDialog(); } };
    bar.append(save, saveNew); box.append(bar, err, list);
    const load = async () => {
      list.replaceChildren(h('div', 'loading', 'Loading your projects…'));
      try {
        const items = await cloud.list(); list.replaceChildren();
        if (!items.length) { const e = h('div', 'empty'); e.append(h('b', '', 'No cloud projects yet'), 'Press “Save to cloud” to keep this project in your account and open it on any computer.'); list.appendChild(e); }
        for (const it of items) {
          const row = h('div', 'cloud-row' + (this.cloudRef?.id === it.id ? ' current' : '')); const t = h('div', 't');
          t.append(h('b', '', it.name), h('br'), h('small', '', new Date(it.updated_at).toLocaleString() + (it.is_public ? ' · public' : '') + (this.cloudRef?.id === it.id ? ' · open now' : '')));
          const open = h('button', '', 'Open'); open.onclick = async () => { try { if (await this.openCloudProject(it.id)) close(); } catch (e) { err.textContent = e.message; } };
          const del = h('button', '', '🗑'); del.title = 'Delete'; del.onclick = async () => { if (await this.confirm(`Delete “${it.name}” from the cloud? Its public link (if any) stops working.`)) { await cloud.remove(it.id); if (this.cloudRef?.id === it.id) this.setCloudRef(null); load(); } };
          row.append(t, open, del); list.appendChild(row);
        }
      } catch (e) { list.replaceChildren(); err.textContent = 'Couldn’t load your projects: ' + e.message; }
    };
    load();
  }
  // ---- Share: two-step "Make public", then link / embed / QR / unshare
  async shareDialog() {
    if (!this.user) { try { this.setUser(await cloud.me()); } catch (e) { this.toast(e.message); return; } }
    if (!this.user) { this.accountDialog('Sign in to share your project'); return; }
    const { box, close } = this.modal('Share “' + this.project.name + '”'); box.classList.add('share-modal');
    const body = h('div'); box.appendChild(body);
    const footer = h('div', 'actions'); const done = h('button', '', 'Close'); done.onclick = close; footer.appendChild(done); box.appendChild(footer);
    const show = (...els) => body.replaceChildren(...els);
    const user = this.user;
    if (!user.email_verified) {
      const resend = h('button', '', 'Resend verification email'); const m = h('div', 'hint');
      resend.onclick = async () => { resend.disabled = true; try { const r = await cloud.resendVerification(); m.textContent = r.already_verified ? 'Already verified. Reopen this dialog.' : `Sent to ${user.email}.`; } catch (e) { m.textContent = e.message; } };
      const save = h('button', 'primary', 'Save privately to cloud'); save.onclick = async () => { if (await this.saveToCloud()) close(); };
      show(h('p', '', 'Verify your email address before publishing. Check your inbox for the link we sent to ' + (user.email || 'your address') + '.'), h('p', 'hint', 'Until then you can still save the project privately.'), m, row(resend, save));
      return;
    }
    function row(...els) { const r = h('div', 'row'); r.append(...els); return r; }
    // make sure the latest version is in the cloud (asks before overwriting / offers Save as new)
    show(h('div', 'loading', 'Saving the latest version to your cloud…'));
    const id = await this.saveToCloud(); if (!id) { close(); return; }
    let meta; try { meta = await cloud.meta(id); } catch (e) { show(h('div', 'err-text', 'Couldn’t load sharing details: ' + e.message)); return; }
    const sharedView = shareId => {
      const url = shareUrl(shareId), emb = embedUrl(shareId);
      const link = h('input'); link.readOnly = true; link.value = url; link.className = 'mono share-link';
      const copyL = h('button', 'primary', 'Copy link'); copyL.onclick = () => this.copy(url, 'Link copied');
      const openP = h('a', 'btn', 'Open page ↗'); openP.href = url; openP.target = '_blank'; openP.rel = 'noopener';
      const snippet = `<iframe src="${emb}" width="482" height="412" style="border:0;border-radius:12px;max-width:100%" allowfullscreen loading="lazy" title="${this.project.name.replace(/[<>&"]/g, '')} (Kindlr)"></iframe>`;
      const ta = h('textarea', 'mono embed-code'); ta.readOnly = true; ta.value = snippet; ta.rows = 3;
      const copyE = h('button', '', 'Copy embed code'); copyE.onclick = () => this.copy(snippet, 'Embed code copied');
      let qr = h('div', 'qr-placeholder loading', 'QR code…');
      const dl = h('button', 'small', 'Download QR'); dl.disabled = true; dl.onclick = () => { const a = h('a'); a.href = qr.toDataURL('image/png'); a.download = 'kindlr-qr.png'; a.click(); };
      lazyQr().then(m => { const c = m.qrCanvas(url, { size: 200 }); qr.replaceWith(c); qr = c; dl.disabled = false; }).catch(() => { qr.textContent = 'QR code unavailable'; });
      const unshare = h('button', 'danger', 'Unshare (revoke link)');
      unshare.onclick = async () => { if (!(await this.confirm('Unshare? The link, embeds and QR code stop working and the project leaves Explore. Sharing again later creates a new link.'))) return; try { await cloud.unshare(id); this.toast('Link revoked'); formView({ ...meta, is_public: false, share_id: null }); } catch (e) { this.toast(e.message); } };
      const qrBox = h('div', 'qr-box'); qrBox.append(qr, dl);
      const left = h('div', 'share-left');
      left.append(h('p', 'ok-text', '✓ Public. Anyone with the link can view, run and remix it.'), h('label', '', 'Link'), row(link, copyL, openP), h('label', '', 'Embed on a website'), ta, row(copyE), row(unshare));
      const grid = h('div', 'share-grid'); grid.append(left, qrBox); show(grid);
    };
    const formView = m => {
      const title = h('input'); title.value = m.name || this.project.name; title.maxLength = LIMITS.maxNameLength;
      const desc = h('textarea'); desc.rows = 2; desc.maxLength = 1000; desc.value = m.description || ''; desc.placeholder = 'What is this project? (shown on the public page and Explore)';
      const notes = h('textarea'); notes.rows = 3; notes.maxLength = 5000; notes.value = m.notes || ''; notes.placeholder = 'Instructions, e.g. "Press Ignite, then use the arrow keys."';
      const agree = h('input'); agree.type = 'checkbox'; agree.id = 'share-agree';
      const lab = h('label', 'check'); lab.append(agree, ' I understand this makes the project public: anyone with the link can see, run and remix it, and it will be listed on Explore.');
      const step = h('button', 'primary', 'Make public…'); step.disabled = true; const err = h('div', 'err-text');
      let armed = false;
      agree.onchange = () => { step.disabled = !agree.checked; if (!agree.checked) { armed = false; step.textContent = 'Make public…'; } };
      step.onclick = async () => {
        if (!armed) { armed = true; step.textContent = 'Yes, publish now'; step.classList.add('danger'); return; }   // explicit second click
        step.disabled = true; err.textContent = '';
        try { const r = await cloud.publish(id, { title: title.value.trim(), description: desc.value, notes: notes.value }); meta = { ...meta, is_public: true, share_id: r.share_id, name: title.value.trim() || meta.name, description: desc.value, notes: notes.value };
          if (title.value.trim() && title.value.trim() !== this.project.name) { this.project.name = title.value.trim(); $('project-name').value = this.project.name; this.setCloudRef({ ...this.cloudRef, name: this.project.name }); this.changed(false); }
          this.toast('Project is public'); sharedView(r.share_id); }
        catch (e) { err.textContent = e.message; step.disabled = false; armed = false; step.textContent = 'Make public…'; step.classList.remove('danger'); }
      };
      show(h('p', 'hint', 'Your project is private. Add details, then publish to get a link, an embed code and a QR code.'),
        h('label', '', 'Title'), title, h('label', '', 'Description'), desc, h('label', '', 'Notes & instructions'), notes, lab, err, row(step));
    };
    if (meta.is_public && meta.share_id) sharedView(meta.share_id); else formView(meta);
  }
  copy(text, msg) { (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => this.toast(msg), () => this.toast('Copy failed: select the text and copy it manually')); }
  choose(title, msg, buttons) {
    return new Promise(res => { const { box, close } = this.modal(title); box.appendChild(h('p', '', msg)); const a = h('div', 'actions');
      for (const [v, label, cls] of buttons) { const b = h('button', cls || (v === buttons[buttons.length - 1][0] ? 'primary' : ''), label); b.onclick = () => { close(); res(v); }; a.appendChild(b); }
      box.appendChild(a); });
  }
  async loadShared(id) {
    try { const r = await cloud.shared(id); const p = validateProject(r.data); const json = JSON.stringify(p);
      // "See inside" loads a copy that is NOT linked to any cloud project (Save creates a new one).
      openPlayer(this, json, { title: `${r.title} by ${r.author}`, onSeeInside: () => this.loadProject(p, false, null) }); }
    catch (e) { this.toast('Could not open shared project: ' + e.message); }
  }

  // ------------------------------------------------ console & storage
  print(text) {
    const out = $('console-out'); $('console').classList.remove('collapsed');
    const line = document.createElement('div'); line.textContent = String(text).slice(0, 2000); out.appendChild(line);
    while (out.childNodes.length > LIMITS.maxConsoleLines) out.firstChild.remove();
    $('con-count').textContent = out.childNodes.length + ' line' + (out.childNodes.length === 1 ? '' : 's'); out.scrollTop = out.scrollHeight;
  }
  clearConsole() { $('console-out').innerHTML = ''; $('con-count').textContent = ''; }
  storeGet(k) { return get(this.project.storage, k); }
  storeSet(k, v) {
    if (v && typeof v === 'object') v = JSON.stringify(v);
    const st = this.project.storage || (this.project.storage = {});
    if (RESERVED_NAMES.has(k)) return;
    if (!has(st, k) && Object.keys(st).length >= LIMITS.maxStorageKeys) { this.toast('Project storage is full'); return; }
    put(st, k, v); this.changed(false);
  }

  // ------------------------------------------------ dialogs
  modal(title) {
    const prev = document.activeElement;
    const bg = h('div', 'modal-bg'), box = h('div', 'modal'); const id = 'dlg-' + Math.random().toString(36).slice(2, 8);
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', id); box.tabIndex = -1;
    const head = h('div', 'modal-head'); const t = h('h3', '', title); t.id = id;
    const x = h('button', 'ghost modal-x', '×'); x.setAttribute('aria-label', 'Close dialog'); x.title = 'Close (Esc)';
    head.append(t, x); box.appendChild(head); bg.appendChild(box); $('modal-root').appendChild(bg);
    const focusables = () => [...box.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(e => !e.disabled && !e.hidden && e.offsetParent !== null);
    const close = () => { if (!bg.isConnected) return; bg.remove(); if (prev && prev.isConnected && typeof prev.focus === 'function') prev.focus(); };
    x.onclick = close;
    bg.addEventListener('pointerdown', e => { if (e.target === bg) close(); });
    bg.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') {   // keep focus inside the dialog
        const f = focusables(); if (!f.length) { e.preventDefault(); return; }
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && (document.activeElement === first || !box.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && (document.activeElement === last || !box.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
      }
      e.stopPropagation();
    });
    // initial focus: first form field, else first non-close button, else the dialog itself
    setTimeout(() => { if (!bg.isConnected || box.contains(document.activeElement)) return; const f = focusables().filter(e => e !== x); (f.find(e => /^(INPUT|TEXTAREA|SELECT)$/.test(e.tagName)) || f[0] || box).focus(); }, 0);
    return { bg, box, close };
  }
  form(title, fields) {
    return new Promise(res => {
      const { box, close } = this.modal(title); const inputs = {};
      for (const f of fields) {
        if (f.type === 'radio') { for (const [v, l] of f.options) { const lab = h('label'); const r = h('input'); r.type = 'radio'; r.name = f.name; r.value = v; r.checked = v === f.value; lab.append(r, ' ' + l); box.appendChild(lab); } inputs[f.name] = () => box.querySelector(`input[name=${f.name}]:checked`)?.value; }
        else if (f.type === 'checkbox') { const lab = h('label'); const c = h('input'); c.type = 'checkbox'; c.checked = !!f.value; lab.append(c, ' ' + f.label); box.appendChild(lab); inputs[f.name] = () => c.checked; }
        else { box.appendChild(h('label', '', f.label)); const i = h('input'); i.type = 'text'; i.value = f.value; box.appendChild(i); inputs[f.name] = () => i.value; }
      }
      const act = h('div', 'actions'); const cancel = h('button', '', 'Cancel'), ok = h('button', 'primary', 'OK');
      const done = v => { close(); res(v); };
      cancel.onclick = () => done(null); ok.onclick = () => done(Object.fromEntries(Object.entries(inputs).map(([k, f]) => [k, f()])));
      box.addEventListener('keydown', e => { if (e.key === 'Enter') ok.click(); });
      act.append(cancel, ok); box.appendChild(act); setTimeout(() => box.querySelector('input[type=text]')?.focus(), 0);
    });
  }
  async prompt(label, value = '') { const r = await this.form(label, [{ name: 'v', label: '', value }]); return r ? r.v : null; }
  confirm(msg) {
    return new Promise(res => { const { box, close } = this.modal('Are you sure?'); box.appendChild(h('p', '', msg)); const a = h('div', 'actions'); const c = h('button', '', 'Cancel'), o = h('button', 'primary', 'Yes'); c.onclick = () => { close(); res(false); }; o.onclick = () => { close(); res(true); }; a.append(c, o); box.appendChild(a); });
  }
  contextMenu(x, y, items) {
    document.querySelectorAll('.ctx').forEach(e => e.remove()); const m = h('div', 'ctx');
    for (const [label, fn] of items) { const b = h('button', '', label); b.onclick = () => { m.remove(); fn(); }; m.appendChild(b); }
    m.style.left = x + 'px'; m.style.top = y + 'px'; document.body.appendChild(m);
    setTimeout(() => document.addEventListener('pointerdown', function off(e) { if (!m.contains(e.target)) { m.remove(); document.removeEventListener('pointerdown', off); } }), 0);
  }
  toast(msg, kind) { const t = $('toast'); t.textContent = msg; t.setAttribute('role', 'status'); t.classList.toggle('err', kind === 'err' || (!kind && /^(Could not|Can’t|Cannot|Save failed|That file|That script|Copy failed)/.test(msg))); t.classList.add('show'); clearTimeout(this._toastT); this._toastT = setTimeout(() => t.classList.remove('show'), t.classList.contains('err') ? 5000 : 2600); }
}

window.kindlr = new App();
