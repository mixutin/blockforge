// Block rendering (DOM), palette, and drag & drop.
import { DEFS, CAT_COLOR, parseSpec, isReporterType, isCap, newBlock, clone } from './blocks.js';
import { FLAME_SVG } from './art.js';

const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const catOf = b => (b.op === 'call' || b.op === 'define' || b.op === 'param') ? 'myblocks' : DEFS[b.op]?.cat || 'control';

export class Blocks {
  constructor(app) {
    this.app = app; this.zoom = 1;
    this.ws = document.getElementById('ws'); this.canvas = document.getElementById('ws-canvas');
    this.palette = document.getElementById('palette');
    this.indicator = h('div', 'drop-indicator'); this.dragLayer = document.getElementById('drag-layer');
    this.scriptEls = new Map();
    for (const root of [this.ws, this.palette]) root.addEventListener('pointerdown', e => this.onDown(e, root === this.palette));
    this.ws.addEventListener('contextmenu', e => this.onContext(e, false));
    this.palette.addEventListener('contextmenu', e => this.onContext(e, true));
  }
  get target() { return this.app.target; }

  // ---------------- rendering ----------------
  renderBlock(b, ctx) {
    const d = DEFS[b.op]; const type = d ? d.type : 'stack';
    const el = h('div', `block t-${type}`); el._block = b;
    const cat = catOf(b); el.style.setProperty('--c', CAT_COLOR[cat]); el.dataset.cat = cat; el.dataset.op = b.op;
    if (isReporterType(type)) { el.classList.add('rep'); el.appendChild(this.renderRow(b, d.text, ctx)); return el; }
    if (isCap(b)) el.classList.add('cap');
    if (b.op === 'define') el.appendChild(this.renderDefine(b, ctx));
    else if (b.op === 'call') el.appendChild(this.renderCall(b, ctx));
    else el.appendChild(this.renderRow(b, d.text, ctx));
    if (type === 'c' || type === 'cc') {
      el.appendChild(this.renderMouth(b, 'body', ctx));
      if (type === 'cc') { const r = h('div', 'row'); r.appendChild(h('span', 'lbl', d.elseText)); el.appendChild(r); el.appendChild(this.renderMouth(b, 'body2', ctx)); }
      el.appendChild(h('div', 'foot'));
    }
    return el;
  }
  renderMouth(b, key, ctx) { const m = h('div', 'mouth'); m.appendChild(this.renderStack(b[key] ||= [], ctx)); return m; }
  renderStack(arr, ctx, script) {
    const s = h('div', 'stack'); s._arr = arr; s._script = script || null;
    arr.forEach((b, i) => { const e = this.renderBlock(b, ctx); e._meta = { arr, index: i, script }; s.appendChild(e); });
    return s;
  }
  renderDefine(b, ctx) {
    const r = h('div', 'row'); r.appendChild(h('span', 'lbl', 'define')); r.appendChild(h('span', 'lbl name', b.name));
    for (const p of b.params || []) {
      const chip = h('span', 'block t-reporter rep param-chip'); chip.style.setProperty('--c', CAT_COLOR.myblocks);
      chip.appendChild(h('span', 'lbl', p)); chip._paramName = p; r.appendChild(chip);
    }
    if (b.warp) r.appendChild(h('span', 'lbl warp', '⚡ no refresh'));
    return r;
  }
  renderCall(b, ctx) {
    const r = h('div', 'row'); r.appendChild(h('span', 'lbl name', b.name));
    const def = this.app.findDefine(b.name); const params = def?.params || b.args.map((_, i) => 'arg' + (i + 1));
    while (b.args.length < params.length) b.args.push('');
    params.forEach((p, i) => { r.appendChild(h('span', 'lbl small', p + ':')); r.appendChild(this.renderInput(b, i, 's', null, ctx)); });
    return r;
  }
  renderRow(b, text, ctx) {
    const r = h('div', 'row');
    for (const part of parseSpec(text)) {
      if (part.t === 'text') r.appendChild(h('span', 'lbl', part.v));
      else if (part.t === 'icon') { const s = h('span', 'icon'); s.innerHTML = FLAME_SVG; r.appendChild(s); }
      else if (part.t === 'label') r.appendChild(h('span', 'lbl name', b.args[0]));
      else r.appendChild(this.renderInput(b, part.idx, part.kind, part.menu, ctx));
    }
    return r;
  }
  renderInput(b, idx, kind, menu, ctx) {
    const v = b.args[idx];
    if (v && typeof v === 'object' && v.op) { const e = this.renderBlock(v, ctx); e._meta = { owner: b, idx }; return e; }
    if (kind === 'b') { const e = h('span', 'bslot'); e._slot = { owner: b, idx, kind }; return e; }
    if (kind === 'k') {
      const e = h('input', 'in color'); e.type = 'color'; e.value = /^#[0-9a-f]{6}$/i.test(v) ? v : '#000000';
      e.addEventListener('input', () => { b.args[idx] = e.value; this.app.changed(false); }); return e;
    }
    if (kind === 'm') {
      const sel = h('select', 'in menu'); const opts = this.app.menuOptions(menu, this.target, v, b);
      for (const [label, val] of opts) { const o = h('option', '', label); o.value = val; sel.appendChild(o); }
      sel.value = v ?? ''; if (sel.selectedIndex < 0 && sel.options.length) { sel.selectedIndex = 0; if (!ctx.palette) b.args[idx] = sel.value; }
      sel.addEventListener('change', async () => {
        if (sel.value === '__new__') {
          const n = await this.app.prompt('New message name:', 'message' + (this.app.allMessages().length + 1));
          if (n) b.args[idx] = n; this.app.refresh(); return;
        }
        b.args[idx] = sel.value; this.app.changed(false);
      });
      return sel;
    }
    const e = h('input', 'in ' + (kind === 'n' ? 'num' : 'txt')); e.value = v ?? ''; e.spellcheck = false;
    const size = () => (e.style.width = `calc(${Math.max(kind === 'n' ? 1.5 : 2.5, String(e.value).length * 0.95 + 0.3)}ch + 16px)`); size();
    e.addEventListener('input', () => { b.args[idx] = e.value; size(); this.app.changed(false); });
    e.addEventListener('keydown', ev => { if (ev.key === 'Enter') e.blur(); ev.stopPropagation(); });
    e._slot = { owner: b, idx, kind }; return e;
  }

  render() {
    const t = this.target; this.canvas.innerHTML = ''; this.scriptEls.clear();
    let maxX = 0, maxY = 0;
    for (const s of t.scripts) {
      const se = h('div', 'script'); se.style.left = s.x + 'px'; se.style.top = s.y + 'px'; se._script = s;
      se.appendChild(this.renderStack(s.blocks, { palette: false }, s)); this.canvas.appendChild(se); this.scriptEls.set(s, se);
      maxX = Math.max(maxX, s.x + 400); maxY = Math.max(maxY, s.y + 400);
    }
    this.canvas.style.width = Math.max(maxX + 400, this.ws.clientWidth / this.zoom) + 'px';
    this.canvas.style.height = Math.max(maxY + 400, this.ws.clientHeight / this.zoom) + 'px';
    this.canvas.style.transform = `scale(${this.zoom})`;
    this.updateRunning(this.app.runningScripts());
    document.getElementById('ws-empty').style.display = t.scripts.length ? 'none' : 'flex';
  }
  updateRunning(set) { for (const [s, el] of this.scriptEls) el.classList.toggle('running', set.has(s)); }

  renderPalette() {
    const t = this.target, P = this.palette, scroll = P.scrollTop; P.innerHTML = '';
    const ctx = { palette: true };
    const addBlock = b => { const w = h('div', 'pal-item'); const e = this.renderBlock(b, ctx); e._palette = true; w.appendChild(e); P.appendChild(w); return e; };
    const button = (label, fn) => { const bt = h('button', 'pal-btn', label); bt.onclick = fn; P.appendChild(bt); };
    for (const cat of this.app.categories) {
      const hd = h('div', 'pal-head', cat.name); hd.id = 'pal-' + cat.id; hd.style.setProperty('--c', cat.color); P.appendChild(hd);
      if (cat.id === 'variables') {
        button('+ Make a Variable', () => this.app.makeVariable('var'));
        const vars = this.app.visibleVars(t, 'variables');
        for (const v of vars) {
          const row = h('div', 'pal-var'); const cb = h('input'); cb.type = 'checkbox'; cb.title = 'Show monitor on stage';
          cb.checked = !!this.app.findMonitor('var', v, t)?.visible; cb.onchange = () => this.app.setMonitor('var', v, t, cb.checked);
          row.appendChild(cb); const e = this.renderBlock({ op: 'var', args: [v] }, ctx); e._palette = true; e._varName = v; e._varKind = 'variables'; row.appendChild(e); P.appendChild(row);
        }
        if (!vars.length) { P.appendChild(h('div', 'pal-note', 'No variables yet.')); continue; }
      }
      if (cat.id === 'lists') {
        button('+ Make a List', () => this.app.makeVariable('list'));
        const lists = this.app.visibleVars(t, 'lists');
        for (const v of lists) {
          const row = h('div', 'pal-var'); const cb = h('input'); cb.type = 'checkbox'; cb.title = 'Show monitor on stage';
          cb.checked = !!this.app.findMonitor('list', v, t)?.visible; cb.onchange = () => this.app.setMonitor('list', v, t, cb.checked);
          row.appendChild(cb); const e = this.renderBlock({ op: 'list', args: [v] }, ctx); e._palette = true; e._varName = v; e._varKind = 'lists'; row.appendChild(e); P.appendChild(row);
        }
        if (!lists.length) { P.appendChild(h('div', 'pal-note', 'No lists yet.')); continue; }
      }
      if (cat.id === 'myblocks') {
        button('+ Make a Block', () => this.app.makeBlock());
        for (const s of t.scripts) { const d = s.blocks[0]; if (d?.op === 'define') addBlock({ op: 'call', name: d.name, args: (d.params || []).map(() => '') }); }
        continue;
      }
      for (const d of this.app.paletteDefs(cat.id, t)) addBlock(this.app.paletteBlock(d.op, t));
    }
    P.scrollTop = scroll;
  }

  // ---------------- drag & drop ----------------
  toCanvas(cx, cy) { const r = this.canvas.getBoundingClientRect(); return { x: (cx - r.left) / this.zoom, y: (cy - r.top) / this.zoom }; }
  onDown(e, fromPalette) {
    if (e.button !== 0) return;
    if (e.target.closest('input,select,button,textarea')) return;
    const el = e.target.closest('.block'); if (!el) return;
    e.preventDefault();
    const st = { el, fromPalette, x0: e.clientX, y0: e.clientY, dragging: false };
    const move = ev => {
      if (!st.dragging && Math.hypot(ev.clientX - st.x0, ev.clientY - st.y0) > 4) { st.dragging = true; this.beginDrag(st, ev); }
      if (st.dragging) this.moveDrag(st, ev);
    };
    const up = ev => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      if (st.dragging) this.endDrag(st, ev); else this.click(el, fromPalette);
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
  }
  click(el, fromPalette) {
    if (el.classList.contains('param-chip')) return;
    if (fromPalette) { this.app.runPaletteBlock(el._block, el); return; }
    const se = el.closest('.script'); if (se) this.app.runtime.toggleScript(this.target, se._script);
  }
  beginDrag(st, ev) {
    const el = st.el, rect = el.getBoundingClientRect();
    st.offX = (ev.clientX - rect.left); st.offY = (ev.clientY - rect.top);
    let list;
    if (el.classList.contains('param-chip')) { list = [{ op: 'param', args: [el._paramName] }]; const r2 = el.getBoundingClientRect(); st.offX = ev.clientX - r2.left; st.offY = ev.clientY - r2.top; }
    else if (st.fromPalette) list = [clone(el._block)];
    else if (el._meta?.owner) { const { owner, idx } = el._meta; list = [owner.args[idx]]; owner.args[idx] = this.app.defaultArg(owner, idx); }
    else if (el._meta?.arr) {
      const { arr, index, script } = el._meta; list = arr.splice(index);
      if (script && script.blocks === arr && arr.length === 0) this.target.scripts.splice(this.target.scripts.indexOf(script), 1);
    } else return;
    st.list = list; st.isRep = isReporterType(DEFS[list[0].op]?.type);
    st.isBool = DEFS[list[0].op]?.type === 'boolean';
    // drag visual
    this.dragLayer.innerHTML = ''; const holder = h('div', 'drag-holder');
    holder.appendChild(st.isRep ? this.renderBlock(list[0], { palette: false }) : this.renderStack(list, { palette: false }));
    holder.style.transform = `scale(${this.zoom})`; this.dragLayer.appendChild(holder); st.holder = holder;
    if (!st.fromPalette) this.render();
    st.targets = this.collectTargets(st);
    this.canvas.appendChild(this.indicator); this.indicator.style.display = 'none';
    document.body.classList.add('dragging');
  }
  collectTargets(st) {
    const out = [], toC = r => ({ l: (r.left - this.canvas.getBoundingClientRect().left) / this.zoom, t: (r.top - this.canvas.getBoundingClientRect().top) / this.zoom, r: (r.right - this.canvas.getBoundingClientRect().left) / this.zoom, b: (r.bottom - this.canvas.getBoundingClientRect().top) / this.zoom });
    const list = st.list, first = list[0], last = list[list.length - 1];
    if (st.isRep) {
      for (const s of this.canvas.querySelectorAll('.in.num, .in.txt, .bslot')) {
        const slot = s._slot; if (!slot) continue; if (slot.kind === 'b' && !st.isBool) continue;
        out.push({ kind: 'slot', slot, rect: toC(s.getBoundingClientRect()) });
      }
      return out;
    }
    const firstHat = DEFS[first.op]?.type === 'hat', lastCap = isCap(last);
    for (const sEl of this.canvas.querySelectorAll('.stack')) {
      const arr = sEl._arr, top = !!sEl._script, kids = [...sEl.children], n = kids.length; const sr = toC(sEl.getBoundingClientRect());
      for (let i = 0; i <= n; i++) {
        const above = top && i === 0;
        if (firstHat && !(above && n && DEFS[arr[0].op]?.type !== 'hat')) continue;
        if (above && n && DEFS[arr[0].op]?.type === 'hat') continue;
        if (i < n && lastCap && !above) continue;
        if (above && lastCap) continue;
        if (i > 0 && isCap(arr[i - 1])) continue;
        if (top && i === 0 && n === 0) continue;
        const y = i < n ? toC(kids[i].getBoundingClientRect()).t : n ? toC(kids[n - 1].getBoundingClientRect()).b : sr.t;
        out.push({ kind: 'stack', arr, index: i, above, script: sEl._script, x: sr.l, y });
      }
    }
    return out;
  }
  moveDrag(st, ev) {
    st.holder.style.left = (ev.clientX - st.offX) + 'px'; st.holder.style.top = (ev.clientY - st.offY) + 'px';
    const p = this.toCanvas(ev.clientX - st.offX, ev.clientY - st.offY); const hr = st.holder.getBoundingClientRect(); const hh = hr.height / this.zoom;
    st.overPalette = this.isOverPalette(ev);
    let best = null, bd = 30;
    if (!st.overPalette) for (const t of st.targets) {
      let d;
      if (t.kind === 'slot') { const r = t.rect; const cy = p.y + hh / 2; if (cy < r.t - 10 || cy > r.b + 10) continue; d = Math.abs(p.x - r.l); if (p.x > r.l && p.x < r.r) d = Math.min(d, 6); }
      else d = t.above ? Math.hypot(p.x - t.x, p.y + hh - t.y) : Math.hypot(p.x - t.x, p.y - t.y);
      if (d < bd) { bd = d; best = t; }
    }
    st.best = best; st.pos = p; st.h = hh;
    document.querySelectorAll('.slot-hover').forEach(x => x.classList.remove('slot-hover'));
    const ind = this.indicator;
    if (best && best.kind === 'stack') { ind.style.display = 'block'; ind.style.left = best.x + 'px'; ind.style.top = (best.y - 3) + 'px'; }
    else ind.style.display = 'none';
    if (best && best.kind === 'slot') { const el = [...this.canvas.querySelectorAll('.in.num, .in.txt, .bslot')].find(e => e._slot === best.slot); el && el.classList.add('slot-hover'); }
    this.palette.classList.toggle('trash', !!st.overPalette);
  }
  isOverPalette(ev) { const r = this.palette.getBoundingClientRect(); return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom; }
  endDrag(st, ev) {
    document.body.classList.remove('dragging'); this.dragLayer.innerHTML = ''; this.indicator.remove(); this.palette.classList.remove('trash');
    if (!st.list) return;
    const t = this.target, best = st.best;
    if (st.overPalette || this.isOverPalette(ev)) { /* deleted */ }
    else if (best && best.kind === 'slot') best.slot.owner.args[best.slot.idx] = st.list[0];
    else if (best && best.kind === 'stack') {
      if (best.above) { best.arr.unshift(...st.list); best.script.y -= st.h; best.script.x = Math.round(st.pos.x); }
      else best.arr.splice(best.index, 0, ...st.list);
    } else {
      const p = st.pos || this.toCanvas(ev.clientX, ev.clientY);
      t.scripts.push({ x: Math.max(0, Math.round(p.x)), y: Math.max(0, Math.round(p.y)), blocks: st.list });
    }
    this.render(); this.app.changed(true);
  }

  // ---------------- context menu ----------------
  onContext(e, fromPalette) {
    e.preventDefault(); const el = e.target.closest('.block'); const items = [];
    if (fromPalette) {
      if (el && el._varName) {
        const kind = el._varKind, name = el._varName;
        items.push(['Rename ' + (kind === 'lists' ? 'list' : 'variable'), () => this.app.renameVariable(kind, name)]);
        items.push(['Delete "' + name + '"', () => this.app.deleteVariable(kind, name)]);
      }
    } else if (el && !el.classList.contains('param-chip')) {
      const m = el._meta;
      items.push(['Duplicate', () => {
        const se = el.closest('.script')._script; let copy;
        if (m.owner) copy = [clone(m.owner.args[m.idx])]; else copy = clone(m.arr.slice(m.index));
        this.target.scripts.push({ x: se.x + 30, y: se.y + 30, blocks: copy }); this.render(); this.app.changed(true);
      }]);
      items.push(['Delete block', () => {
        if (m.owner) m.owner.args[m.idx] = this.app.defaultArg(m.owner, m.idx);
        else { m.arr.splice(m.index, 1); if (m.script && !m.script.blocks.length) this.target.scripts.splice(this.target.scripts.indexOf(m.script), 1); }
        this.render(); this.app.changed(true);
      }]);
      if (m.script) items.push(['Delete whole script', () => { this.target.scripts.splice(this.target.scripts.indexOf(m.script), 1); this.render(); this.app.changed(true); }]);
    } else {
      items.push(['Clean up blocks', () => this.cleanUp()]);
      items.push(['Add comment-free script note…', null]);
      items.pop();
    }
    if (items.length) this.app.contextMenu(e.clientX, e.clientY, items);
  }
  cleanUp() {
    let y = 20; for (const s of this.target.scripts) { s.x = 20; s.y = y; const el = this.scriptEls.get(s); y += (el ? el.getBoundingClientRect().height / this.zoom : 60) + 24; }
    this.render(); this.app.changed(true);
  }
  setZoom(z) { this.zoom = Math.max(0.4, Math.min(2, z)); this.render(); }
}
