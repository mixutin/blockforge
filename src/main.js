import './style.css';
import { CATEGORIES, DEFS, DEF_LIST, MENUS_STATIC, newBlock, clone, isReporterType } from './blocks.js';
import { Runtime } from './runtime.js';
import { Blocks } from './workspace.js';
import { Paint } from './paint.js';
import { targetToText, parseEmber, highlight } from './ember.js';
import { blankProject, exampleProjects, makeTarget, layoutScripts } from './project.js';
import { getImg, costumeOf, W, H } from './stage.js';
import * as art from './art.js';
import { cloud } from './cloud.js';
import { validateProject } from './limits.js';
import { openPlayer } from './playerhost.js';
import { syncWidgets } from './widgets.js';
import { LIMITS } from './limits.js';

const $ = id => document.getElementById(id);
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const AUTOSAVE = 'blockforge.autosave.v1';
const SPECIAL = { _random_: 'random position', _mouse_: 'mouse-pointer', _edge_: 'edge', _myself_: 'myself', _stage_: 'Stage' };

class App {
  constructor() {
    this.categories = CATEGORIES; this.runtime = new Runtime(this);
    this.blocks = new Blocks(this); this.paint = new Paint(this);
    this.tab = 'blocks'; this.dirty = false; this.stageScale = 1;
    this.initChrome(); this.initStage(); this.initText(); this.initCostumes();
    const saved = this.readAutosave();
    const share = location.hash.match(/share=([\w-]+)/);
    if (share) this.loadShared(share[1]);
    this.loadProject(saved || exampleProjects()[0], !!saved);
    requestAnimationFrame(() => this.frame());
    if (localStorage.getItem('blockforge.cloud')) cloud.me().then(u => this.setUser(u)).catch(() => this.setUser(null));
  }

  // ------------------------------------------------ project
  get project() { return this._project; }
  normalize(p) {
    if (!p || !Array.isArray(p.targets) || !p.targets.length) throw new Error('Not a Blockforge project');
    p.monitors ||= []; p.name ||= 'Untitled project';
    for (const t of p.targets) {
      Object.assign(t, { ...makeTarget(t.name, []), ...t, costumes: t.costumes || [], scripts: t.scripts || [], variables: t.variables || {}, lists: t.lists || {} });
      if (!t.costumes.length) t.costumes.push(clone(t.isStage ? art.backdrops.blank : art.ball[0]));
      t.effects = {}; t.bubble = null;
    }
    if (!p.targets[0].isStage) throw new Error('First target must be the stage');
    return p;
  }
  loadProject(p, quiet) {
    try { validateProject(p); p = this.normalize(clone(p)); } catch (e) { this.toast('Could not load: ' + e.message); return false; }
    if (this._project) this.runtime.stopAll(); this._project = p; this.runtime.stopAll(); this.runtime.penCtx.clearRect(0, 0, W, H); this.runtime.normalizeLayers();
    for (const t of p.targets) for (const c of t.costumes) getImg(c.src, () => { this.runtime.redraw = true; this.renderTargets(); });
    this.target = p.targets[1] || p.targets[0]; this.clearConsole();
    $('project-name').value = p.name; this.refresh(); this.blocks.ws.scrollTo(0, 0);
    if (!quiet) this.toast(`Loaded “${p.name}”`);
    this.changed(false); return true;
  }
  serialize() {
    const skip = new Set(['bubble', 'base', 'isClone', 'penDown', 'effects']);
    return JSON.stringify({ ...this.project, format: 'blockforge', version: 1 }, (k, v) => (skip.has(k) ? undefined : v));
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
    const others = sprites.filter(n => n !== t.name); const sp = v => [SPECIAL[v] || v, v];
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
    if (this.visibleVars(this.target, key).includes(name)) { this.toast('That name is already used'); return; }
    const host = res.scope === 'local' ? this.target : this.project.targets[0];
    host[key][name] = isList ? [] : 0;
    this.setMonitor(isList ? 'list' : 'var', name, this.target, true);
    this.changed(true);
  }
  async renameVariable(key, old) {
    const n = (await this.prompt('Rename to:', old))?.trim(); if (!n || n === old) return;
    for (const t of this.project.targets) if (old in t[key]) { t[key][n] = t[key][old]; delete t[key][old]; }
    const rop = key === 'lists' ? 'list' : 'var', menu = key === 'lists' ? 'list' : 'var';
    this.walkBlocks(b => {
      if (b.op === rop && b.args[0] === old) b.args[0] = n;
      const d = DEFS[b.op]; if (!d) return; let i = 0; for (const m of d.text.matchAll(/%(n|s|b|k|v|m\.(\w+))/g)) { if (m[2] === menu && b.args[i] === old) b.args[i] = n; i++; }
    });
    for (const m of this.project.monitors) if (m.name === old && m.type === rop) m.name = n;
    this.refresh(); this.changed(true);
  }
  deleteVariable(key, name) {
    for (const t of this.project.targets) delete t[key][name];
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
  hideAsk() { $('ask').hidden = true; this._askCb = null; }
  frame() {
    try {
      this.runtime.step();
      const s = this.stageScale * (window.devicePixelRatio || 1); this.ctx.setTransform(s, 0, 0, s, 0, 0); this.ctx.imageSmoothingEnabled = true;
      this.runtime.render(this.ctx);
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
    row.append(paint, up); box.appendChild(row); box.appendChild(h('p', 'hint', 'Or pick an original Blockforge character:'));
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
    this.paint.load(t.costumes[t.costume]);
  }
  costumesChanged() {
    this.runtime.redraw = true; const t = this.target; const tiles = $('costume-tiles').querySelectorAll('.ctile img');
    const c = t.costumes[t.costume]; if (tiles[t.costume] && c) tiles[t.costume].src = c.src; this.renderTargets(); this.changed(false);
  }

  // ------------------------------------------------ text (Ember)
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
      const scripts = parseEmber($('code').value);
      const defs = new Set(scripts.map(s => s.blocks[0]).filter(b => b?.op === 'define').map(b => b.name));
      // auto-create any variables/lists referenced in text
      const visit = b => { if (!b || typeof b !== 'object' || !b.op) return;
        const d = DEFS[b.op]; if (b.op === 'var' && !this.visibleVars(this.target, 'variables').includes(b.args[0])) this.project.targets[0].variables[b.args[0]] = 0;
        if (b.op === 'list' && !this.visibleVars(this.target, 'lists').includes(b.args[0])) this.project.targets[0].lists[b.args[0]] = [];
        if (d) { let i = 0; for (const m of d.text.matchAll(/%(n|s|b|k|v|m\.(\w+))/g)) { const v = b.args[i]; if (typeof v === 'string' && v) { if (m[2] === 'var' && !this.visibleVars(this.target, 'variables').includes(v)) this.project.targets[0].variables[v] = 0; if (m[2] === 'list' && !this.visibleVars(this.target, 'lists').includes(v)) this.project.targets[0].lists[v] = []; } i++; } }
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
    const theme = localStorage.getItem('blockforge.theme') || 'dark'; document.documentElement.dataset.theme = theme;
    $('logo').innerHTML = art.LOGO_SVG; $('ignite-icon').innerHTML = art.FLAME_SVG;
    $('btn-theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; localStorage.setItem('blockforge.theme', t); };
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
    $('file-input').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { this.loadProject(validateProject(t)); } catch (err) { this.toast('Cannot open: ' + err.message); } }); };
    const dd = $('btn-examples').parentNode, menu = $('examples-menu');
    const blurbs = ['Meet Sparky & Bolt: events, broadcasts, sounds, effects', 'A mini game: clones, keys, score & lives', 'Pen art with a custom block and a list', 'Program mode: widgets, console, maps, storage', 'Gravity, velocity & the draw event'];
    exampleProjects().forEach((p, i) => { const b = h('button'); b.append(h('b', '', p.name), h('small', '', blurbs[i])); b.onclick = () => { dd.classList.remove('open'); this.loadProject(exampleProjects()[i]); }; menu.appendChild(b); });
    $('btn-examples').onclick = e => { e.stopPropagation(); dd.classList.toggle('open'); };
    document.addEventListener('click', () => dd.classList.remove('open'));
    $('btn-account').onclick = () => this.accountDialog();
    $('btn-cloud').onclick = () => this.cloudDialog();
    $('btn-player').onclick = () => openPlayer(this, this.serialize(), { title: 'Sandboxed player — ' + this.project.name, onStore: (k, v) => this.storeSet(k, v) });
    $('con-clear').onclick = () => this.clearConsole(); $('con-toggle').onclick = () => $('console').classList.toggle('collapsed');
    window.addEventListener('beforeunload', () => { if (this.dirty) this.autosave(); });
  }
  download() {
    const blob = new Blob([this.serialize()], { type: 'application/json' }); const a = h('a');
    a.href = URL.createObjectURL(blob); a.download = (this.project.name || 'project').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-') + '.bforge.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); this.toast('Project downloaded');
  }

  // ------------------------------------------------ cloud (optional server)
  setUser(u) { this.user = u; if (u) localStorage.setItem('blockforge.cloud', '1'); else localStorage.removeItem('blockforge.cloud'); $('btn-account').textContent = u ? '👤 ' + u.username : 'Sign in'; }
  accountDialog() {
    if (this.user) { const { box, close } = this.modal('Account'); box.appendChild(h('p', '', `Signed in as ${this.user.username}.`)); const a = h('div', 'actions'); const lo = h('button', '', 'Log out'); lo.onclick = async () => { await cloud.logout().catch(() => {}); this.setUser(null); close(); this.toast('Logged out'); }; a.appendChild(lo); box.appendChild(a); return; }
    const { box, close } = this.modal('Sign in to Blockforge Cloud');
    const u = h('input'); u.type = 'text'; u.placeholder = 'username'; u.autocomplete = 'username'; const p = h('input'); p.type = 'password'; p.placeholder = 'password (8+ characters)'; p.autocomplete = 'current-password';
    const err = h('div', 'err-text'); box.append(h('label', '', 'Username'), u, h('label', '', 'Password'), p, err);
    const act = h('div', 'actions'); const su = h('button', '', 'Create account'); const li = h('button', 'primary', 'Log in');
    const go = async fn => { err.textContent = ''; try { const user = await fn(u.value.trim(), p.value); this.setUser(user); close(); this.toast('Welcome, ' + user.username + '!'); } catch (e) { err.textContent = e.message; } };
    su.onclick = () => go(cloud.signup); li.onclick = () => go(cloud.login); p.onkeydown = e => { if (e.key === 'Enter') li.click(); };
    act.append(su, li); box.appendChild(act); setTimeout(() => u.focus(), 0);
  }
  async cloudDialog() {
    if (!this.user) { this.accountDialog(); return; }
    const { box, close } = this.modal('Cloud projects'); const list = h('div', 'cloud-list'); const err = h('div', 'err-text');
    const save = h('button', 'primary', this.cloudId ? 'Save (update cloud copy)' : 'Save current project to cloud');
    save.onclick = async () => { try { const r = await cloud.save(this.cloudId, this.project.name, this.serialize()); this.cloudId = r.id; this.toast('Saved to cloud'); load(); } catch (e) { err.textContent = e.message; } };
    box.append(save, err, list);
    const load = async () => {
      list.innerHTML = '';
      try {
        const items = await cloud.list(); if (!items.length) list.appendChild(h('div', 'pal-note', 'No cloud projects yet.'));
        for (const it of items) {
          const row = h('div', 'cloud-row'); const t = h('div', 't'); t.append(h('b', '', it.name), h('br'), h('small', '', new Date(it.updated_at).toLocaleString() + (it.is_public ? ' · shared' : '')));
          const open = h('button', '', 'Open'); open.onclick = async () => { const p = validateProject(await cloud.get(it.id)); if (this.loadProject(p)) { this.cloudId = it.id; close(); } };
          const share = h('button', '', it.is_public ? 'Unshare' : 'Share'); share.onclick = async () => { const r = await cloud.share(it.id, !it.is_public); if (r.is_public) { const url = location.origin + location.pathname + '#share=' + it.id; navigator.clipboard?.writeText(url).catch(() => {}); this.toast('Share link copied: ' + url); } load(); };
          const del = h('button', '', '🗑'); del.onclick = async () => { if (await this.confirm(`Delete “${it.name}” from the cloud?`)) { await cloud.remove(it.id); if (this.cloudId === it.id) this.cloudId = null; load(); } };
          row.append(t, open, share, del); list.appendChild(row);
        }
      } catch (e) { err.textContent = e.message; }
    };
    load();
  }
  async loadShared(id) { try { const p = validateProject(await cloud.sharedRaw(id)); const json = JSON.stringify(p); openPlayer(this, json, { title: 'Shared project: ' + (p.name || ''), onSeeInside: () => this.loadProject(p) }); } catch (e) { this.toast('Could not open shared project: ' + e.message); } }

  // ------------------------------------------------ console & storage
  print(text) {
    const out = $('console-out'); $('console').classList.remove('collapsed');
    const line = document.createElement('div'); line.textContent = String(text).slice(0, 2000); out.appendChild(line);
    while (out.childNodes.length > LIMITS.maxConsoleLines) out.firstChild.remove();
    $('con-count').textContent = out.childNodes.length + ' line' + (out.childNodes.length === 1 ? '' : 's'); out.scrollTop = out.scrollHeight;
  }
  clearConsole() { $('console-out').innerHTML = ''; $('con-count').textContent = ''; }
  storeGet(k) { return this.project.storage ? this.project.storage[k] : undefined; }
  storeSet(k, v) {
    if (v && typeof v === 'object') v = JSON.stringify(v);
    const st = this.project.storage || (this.project.storage = {});
    if (!(k in st) && Object.keys(st).length >= LIMITS.maxStorageKeys) { this.toast('Project storage is full'); return; }
    st[k] = v; this.changed(false);
  }

  // ------------------------------------------------ dialogs
  modal(title) {
    const bg = h('div', 'modal-bg'), box = h('div', 'modal'); box.appendChild(h('h3', '', title)); bg.appendChild(box); $('modal-root').appendChild(bg);
    const close = () => bg.remove(); bg.addEventListener('pointerdown', e => { if (e.target === bg) close(); });
    bg.addEventListener('keydown', e => { if (e.key === 'Escape') close(); e.stopPropagation(); });
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
  toast(msg) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._toastT); this._toastT = setTimeout(() => t.classList.remove('show'), 2600); }
}

window.blockforge = new App();
