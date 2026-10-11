// Kindlr interpreter: cooperative generator threads, one per running script.
import { DEFS, isCap } from './blocks.js';
import { W, H, costumeOf, bounds, touchingSprite, touchingEdge, pointInSprite, touchingColor, drawSprite, drawBubble, getImg, setRenderScale } from './stage.js';
import { LIMITS, capStr } from './limits.js';
import { has, get, put, dict } from './safe.js';
import { playSound, playTone, stopAll as stopAllSounds } from './audio.js';

class StopThread { }
// ---- compiled block records -------------------------------------------------------------------------------------
// Each block is "compiled" once into a small record stored under a non-enumerable Symbol (never serialized, not copied
// by spread/structuredClone): the handler resolved from the op Map, whether it is a generator, and ONE argument
// evaluator closure. No source code is generated (no eval / new Function); records only hold references to the
// fixed handler functions below. Args are still read live from the block, so editing a block in the editor is safe.
const C = Symbol('kindlr.compiled');
const GenFn = Object.getPrototypeOf(function* () { }).constructor;
const num = v => { if (typeof v === 'number') return isNaN(v) ? 0 : v; if (v === true) return 1; if (!v) return 0; const n = Number(v); return isNaN(n) ? 0 : n; };
const str = v => (v === null || v === undefined ? '' : typeof v === 'number' ? String(Math.round(v * 1e10) / 1e10) : typeof v === 'object' ? JSON.stringify(v) : String(v));
const bool = v => v === true || (typeof v === 'number' ? v !== 0 : !(v === false || v === null || v === undefined || v === '' || v === '0' || String(v).toLowerCase() === 'false'));
function cmp(a, b) {
  const na = Number(a), nb = Number(b);
  const isNum = x => x !== '' && x !== null && !(typeof x === 'string' && /^\s*$/.test(x));
  if (isNum(a) && isNum(b) && !isNaN(na) && !isNaN(nb)) return na - nb;
  const sa = str(a).toLowerCase(), sb = str(b).toLowerCase(); return sa < sb ? -1 : sa > sb ? 1 : 0;
}
const now = () => performance.now();
const wrapDir = d => { d = ((d + 179) % 360 + 360) % 360 - 179; return d; };
const keyName = e => ({ ' ': 'space', ArrowUp: 'up arrow', ArrowDown: 'down arrow', ArrowLeft: 'left arrow', ArrowRight: 'right arrow' }[e.key] || (e.key.length === 1 ? e.key.toLowerCase() : e.key));

export class Runtime {
  constructor(app) {
    this.app = app; this.threads = []; this.clones = []; this.keys = new Set();
    this.mouse = { x: 0, y: 0, down: false }; this.timerStart = now(); this.answer = ''; this.redraw = true;
    this.ask = null; this.timerHatState = new Map();
    this.camera = { x: 0, y: 0 }; this.drawQueue = []; this.widgets = new Map(); this.widgetsVersion = 0; this.ops = 0; this.everyState = new Map(); this.running = false;   // running: between Ignite and Stop (gates every(...) hats)
    this.pen = document.createElement('canvas'); this.pen.width = W * 2; this.pen.height = H * 2;
    this.penCtx = this.pen.getContext('2d'); this.penCtx.scale(2, 2); this.penCtx.lineCap = 'round';
  }
  // `redraw` (scheduler: a visual change ends a non-turbo frame) also marks the stage `dirty`; the render loop only
  // repaints when dirty (plus a slow safety-net repaint), so an idle or non-visual project costs ~nothing per frame.
  get redraw() { return this._redraw; }
  set redraw(v) { this._redraw = v; if (v) this.dirty = true; }
  get project() { return this.app.project; }
  get stage() { return this.project.targets[0]; }
  sprites() { return this.project.targets.filter(t => !t.isStage); }
  allTargets() { return [this.stage, ...this.drawOrder()]; }
  drawOrder() {
    const orig = this.sprites(); const res = [];
    // order: by layer, clones directly after their tracked layer
    const all = [...orig, ...this.clones]; all.sort((a, b) => (a.layer || 0) - (b.layer || 0)); return all;
  }
  normalizeLayers() { this.drawOrder().forEach((s, i) => (s.layer = i)); }
  isRunning() { return this.threads.length > 0; }
  scriptsOf(t) { return (t.base || t).scripts; }

  // ---------- thread management ----------
  startThread(target, script, from = 0) {
    if (this.threads.length >= LIMITS.maxThreads) { this.app.toast?.('Too many scripts running'); return { done: true }; }
    const th = { target, script, done: false, warp: 0, warpStart: 0, lc: 0, frames: [], gen: null };
    th.gen = this.threadGen(th, script.blocks, from); this.threads.push(th); return th;
  }
  *threadGen(th, blocks, from) { yield* this.runBlocks(blocks, th, from); }
  toggleScript(target, script) {
    const ex = this.threads.find(t => t.script === script && t.target === target && !t.done);
    if (ex) { ex.done = true; this.threads = this.threads.filter(t => !t.done); return; }
    const top = script.blocks[0]; const d = top && DEFS[top.op];
    if (!d) return;
    if (d.type === 'reporter' || d.type === 'boolean') { this.app.showReport(script, this.evalBlock(top, { target, frames: [] })); return; }
    if (top.op === 'define') return;
    this.startThread(target, script, d.type === 'hat' ? 1 : 0);
  }
  startHats(op, match, only, skipRunning) {
    const started = [];
    if (!this.hatUsed(op)) return started;     // fast path: nobody listens for this hat (no target sort, no scans)
    for (const tg of this.allTargets()) {
      if (only && tg !== only) continue;
      for (const s of this.scriptsOf(tg)) {
        const top = s.blocks[0]; if (!top || top.op !== op) continue;
        if (match && !match(top, tg)) continue;
        const ex = this.threads.find(t => t.script === s && t.target === tg && !t.done);
        if (ex) { if (op === 'ev_key' || skipRunning) continue; ex.done = true; }
        started.push(this.startThread(tg, s, 1));
      }
    }
    return started;
  }
  // Does any script start with this hat? A plain scan of script tops (clones share their original's scripts), so it is
  // always current and much cheaper than building/sorting the full target list and scanning threads.
  hatUsed(op) {
    const ts = this.project.targets;
    for (let i = 0; i < ts.length; i++) { const sc = ts[i].scripts; for (let j = 0; j < sc.length; j++) { const top = sc[j].blocks[0]; if (top !== undefined && top.op === op) return true; } }
    return false;
  }
  ignite() {
    this.frameNo = (this.frameNo || 0) + 1;
    this.stopAll(); this.timerStart = now();
    for (const t of this.allTargets()) { t.effects = dict(); t.vx = 0; t.vy = 0; t.physics = false; t.gravity = 0; t.friction = 0; }
    this.camera = { x: 0, y: 0 }; this.everyState.clear(); this.running = true;
    this.redraw = true; this.startHats('ev_ignite');
  }
  stopAll() {
    for (const t of this.threads) t.done = true; this.threads = []; this.running = false; this.everyState.clear();
    this.clones = []; for (const t of this.allTargets()) t.bubble = null;
    stopAllSounds(); this.ask = null; this.app.hideAsk(); this.redraw = true; this.normalizeLayers();
    this.widgets.clear(); this.widgetsVersion++; this.drawQueue = [];
  }
  broadcast(msg) { msg = str(msg); return this.startHats('ev_receive', b => str(b.args[0]).toLowerCase() === msg.toLowerCase()); }
  keyDown(e) {
    const k = keyName(e); this.keys.add(k);
    this.startHats('ev_key', b => b.args[0] === k || b.args[0] === 'any');
  }
  keyUp(e) { this.keys.delete(keyName(e)); }
  clickAt(cx, cy) { // canvas coords; returns sprite hit
    cx += this.camera.x; cy -= this.camera.y;
    const order = this.drawOrder().slice().reverse();
    for (const s of order) if (pointInSprite(s, cx, cy)) { this.startHats('ev_click', null, s); return s; }
    this.startHats('ev_stageclick', null, this.stage); return null;
  }

  // ---------- scheduler ----------
  step() {
    const start = now(); this.redraw = false; this.ops = 0; this.frameNo = (this.frameNo || 0) + 1;
    this.checkTimerHats(); this.stepPhysics();
    if (this.drawQueue.length) this.dirty = true;
    this.drawQueue = []; for (const th of this.startHats('ga_draw', null, null, true)) { th.warp = 1; th.warpStart = start; }
    let guard = 0;
    while (this.threads.length && guard++ < 10000) {
      let active = false;
      for (const th of this.threads.slice()) {
        if (th.done) continue; this.cur = th;
        const t0 = now();
        try { const r = th.gen.next(); if (r.done) th.done = true; else if (r.value !== 'wait') active = true; }
        catch (e) { th.done = true; if (!(e instanceof StopThread)) { console.warn('[Kindlr runtime]', e); this.app.toast('Runtime error: ' + e.message); } }
        if (now() - t0 > LIMITS.watchdogMs) { this.stopAll(); this.app.toast('Watchdog: project stopped (a script ran too long without pausing)'); return; }
      }
      this.threads = this.threads.filter(t => !t.done);
      if (!active || this.redraw || now() - start > 14 || this.ops > LIMITS.maxOpsPerFrame) break;
    }
  }
  checkTimerHats() {
    const hasTimer = this.hatUsed('ev_timer'), hasEvery = this.hatUsed('ev_every');
    if (!hasTimer && !hasEvery) return;      // fast path: no timer hats → no per-frame target sort / scans
    const t = (now() - this.timerStart) / 1000;
    for (const tg of this.allTargets()) for (const s of this.scriptsOf(tg)) {
      const top = s.blocks[0]; if (!top || top.op !== 'ev_timer') continue;
      const key = s; const v = t > num(this.evalArg(top.args[0], { target: tg, frames: [] }));
      const prev = this.timerHatState.get(key) || false; this.timerHatState.set(key, v);
      if (v && !prev && !tg.isClone) this.startHats('ev_timer', b => b === top, tg);
    }
    if (!this.running) return;               // every(...) fires only after Ignite, until Stop (even with no other scripts running)
    for (const tg of this.allTargets()) for (const s of this.scriptsOf(tg)) {
      const top = s.blocks[0]; if (!top || top.op !== 'ev_every') continue;
      const period = Math.max(0.02, num(this.evalArg(top.args[0], { target: tg, frames: [] }))) * 1000;
      const key = tg.isClone ? null : s; if (!key) continue;
      const last = this.everyState.get(key); if (last === undefined) { this.everyState.set(key, now()); continue; }
      if (now() - last >= period) { this.everyState.set(key, now()); this.startHats('ev_every', b => b === top, tg, true); }
    }
  }
  stepPhysics() {
    for (const s of this.drawOrder()) {
      if (!s.physics) continue;
      s.vy = (s.vy || 0) - (s.gravity || 0); const f = 1 - Math.max(0, Math.min(1, s.friction || 0)); s.vx = (s.vx || 0) * f; s.vy *= f;
      if (s.vx || s.vy) this.moveTo(s, s.x + s.vx, s.y + s.vy);
    }
  }

  // ---------- evaluation ----------
  // compile a block once (see C above); `rt.cur` is the running thread whenever a handler or its `a(i)` runs.
  compile(b, map) {
    const f = map.get(b.op) || null; const rt = this;
    const rec = {
      b, f, map, gen: f !== null && f instanceof GenFn,
      // a(i): evaluate input i of THIS block for the current thread; literal inputs are returned as-is.
      a: i => { const x = b.args[i]; return x !== null && typeof x === 'object' && x.op !== undefined ? rt.evalBlock(x, rt.cur) : x; },
      def: null, defBase: null, defFrame: -1,
    };
    Object.defineProperty(b, C, { value: rec, configurable: true, writable: true, enumerable: false });
    return rec;
  }
  evalArg(a, th) { return a !== null && typeof a === 'object' && a.op !== undefined ? this.evalBlock(a, th) : a; }
  evalBlock(b, th) {
    let c = b[C]; if (c === undefined || c.b !== b || c.map !== REP_MAP) c = this.compile(b, REP_MAP);
    if (c.f === null) return '';
    this.cur = th; return c.f.call(this, b, th, c.a);
  }
  *exec(b, th) { yield* this.runBlocks([b], th, 0); }
  // The statement loop: plain (non-generator) handlers run inline with no generator allocation per block;
  // only generator handlers (loops, waits, custom blocks…) are delegated with yield*.
  *runBlocks(blocks, th, from) {
    for (let i = from; i < blocks.length; i++) {
      const b = blocks[i];
      if (th.done) throw new StopThread();
      if (++this.ops > LIMITS.maxOpsPerFrame) yield 'budget';
      let c = b[C]; if (c === undefined || c.b !== b || c.map !== STACK_MAP) c = this.compile(b, STACK_MAP);
      if (c.f === null) continue;
      this.cur = th;
      if (c.gen) yield* c.f.call(this, b, th, c.a);
      else { const r = c.f.call(this, b, th, c.a); if (r !== undefined && r !== null && typeof r.next === 'function') yield* r; }
    }
  }
  *runBody(blocks, th) { if (blocks) yield* this.runBlocks(blocks, th, 0); }
  // Should a loop iteration yield to the scheduler? In no-refresh (define!) mode only after 500 ms; the clock is read
  // every 32 iterations so tight loops don't pay for performance.now() each time.
  loopShouldYield(th) {
    if (th.warp > 0) { if ((th.lc = (th.lc + 1) & 31) !== 0) return false; return now() - th.warpStart >= 500; }
    return true;
  }
  *loopYield(th) { if (this.loopShouldYield(th)) yield; }
  *waitSecs(secs) { const end = now() + Math.max(0, secs) * 1000; do { yield 'wait'; } while (now() < end); }

  // ---------- variables ----------
  varHost(t, name, kind = 'variables') {
    if (has(t[kind], name)) return t[kind];
    const st = this.stage[kind]; if (!has(st, name)) put(st, name, kind === 'lists' ? [] : 0);
    return st;
  }
  getVar(t, n) { return get(this.varHost(t, n), n); }
  setVar(t, n, v) { put(this.varHost(t, n), n, capStr(v)); }
  getList(t, n) { const h = this.varHost(t, n, 'lists'); let l = get(h, n); if (!Array.isArray(l)) l = put(h, n, []); return l; }

  // ---------- sprite helpers ----------
  findSprite(name) { return this.sprites().find(s => s.name === name); }
  moveTo(s, x, y) {
    const ox = s.x, oy = s.y; s.x = x; s.y = y; this.fence(s);
    if (s.penDown) { const c = this.penCtx; c.strokeStyle = s.penColor || '#4C7EF3'; c.lineWidth = s.penSize || 1;
      c.beginPath(); c.moveTo(W / 2 + ox, H / 2 - oy); c.lineTo(W / 2 + s.x + 0.01, H / 2 - s.y); c.stroke(); }
    this.redraw = true;
  }
  fence(s) {
    const B = bounds(s), inset = Math.min(15, Math.floor((B.r - B.l) / 2), Math.floor((B.b - B.t) / 2));
    let dx = 0, dy = 0;
    if (B.r < inset) dx = inset - B.r; else if (B.l > W - inset) dx = W - inset - B.l;
    if (B.b < inset) dy = inset - B.b; else if (B.t > H - inset) dy = H - inset - B.t;
    s.x += dx; s.y -= dy;
  }
  target(name, self) {
    if (name === '_mouse_') return { x: this.mouse.x, y: this.mouse.y };
    if (name === '_random_') return { x: Math.round(Math.random() * W - W / 2), y: Math.round(Math.random() * H - H / 2) };
    const s = this.findSprite(name); return s ? { x: s.x, y: s.y } : null;
  }
  setCostume(t, v) {
    const cs = (t.base || t).costumes; if (!cs.length) return;
    if (typeof v === 'object' && v && v.op) v = '';
    const byName = cs.findIndex(c => c.name === str(v));
    if (byName >= 0) t.costume = byName;
    else if (v === 'next costume' || v === 'next backdrop') t.costume = (t.costume + 1) % cs.length;
    else if (v === 'previous costume' || v === 'previous backdrop') t.costume = (t.costume - 1 + cs.length) % cs.length;
    else if (v === 'random backdrop') t.costume = Math.floor(Math.random() * cs.length);
    else if (str(v) !== '' && !isNaN(Number(v))) t.costume = ((Math.round(num(v)) - 1) % cs.length + cs.length) % cs.length;
    this.redraw = true;
    if (t.isStage) { const name = cs[t.costume].name; return this.startHats('ev_backdrop', b => str(b.args[0]) === name); }
    return [];
  }
  makeClone(src) {
    if (this.clones.length >= LIMITS.maxClones) return;
    const base = src.base || src;
    const c = { ...src, base, isClone: true, variables: dict(structuredClone(src.variables || {})), lists: dict(structuredClone(src.lists || {})), effects: dict(src.effects), bubble: null, layer: (src.layer || 0) - 0.5 };
    delete c.scripts; delete c.costumes;
    this.clones.push(c); this.normalizeLayers(); this.startHats('ct_cloned', null, c); this.redraw = true;
  }
  deleteClone(c) {
    if (!c.isClone) return; this.clones = this.clones.filter(x => x !== c);
    for (const t of this.threads) if (t.target === c) t.done = true; this.redraw = true;
  }

  // ---------- rendering ----------
  drawScene(ctx, exclude, order) {
    const bd = costumeOf(this.stage);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    if (bd) { const im = getImg(bd.src, () => (this.redraw = true)); if (im._ok) { ctx.save(); ctx.filter = 'none'; drawSprite(ctx, { ...this.stage, x: 0, y: 0, size: 100, direction: 90, rotationStyle: "don't rotate", effects: this.stage.effects }); ctx.restore(); } }
    ctx.save(); ctx.translate(-this.camera.x, this.camera.y);
    ctx.drawImage(this.pen, 0, 0, W, H);
    for (const s of order || this.drawOrder()) if (s !== exclude && s.visible) { const c = costumeOf(s); if (c) getImg(c.src, () => (this.redraw = true)); drawSprite(ctx, s); }
    if (!exclude) this.drawShapes(ctx);
    ctx.restore();
  }
  drawShapes(ctx) {
    for (const d of this.drawQueue) {
      ctx.fillStyle = ctx.strokeStyle = d.c; ctx.lineWidth = 2;
      const X = x => W / 2 + x, Y = y => H / 2 - y;
      if (d.k === 'rect') ctx.fillRect(X(d.x), Y(d.y) - d.h, d.w, d.h);
      else if (d.k === 'circle') { ctx.beginPath(); ctx.arc(X(d.x), Y(d.y), Math.max(0, d.r), 0, Math.PI * 2); ctx.fill(); }
      else if (d.k === 'line') { ctx.beginPath(); ctx.moveTo(X(d.x), Y(d.y)); ctx.lineTo(X(d.x2), Y(d.y2)); ctx.stroke(); }
      else if (d.k === 'text') { ctx.font = '600 16px system-ui, sans-serif'; ctx.fillText(d.t, X(d.x), Y(d.y)); }
    }
  }
  render(ctx) {
    const tf = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null; setRenderScale(tf && tf.a);
    const order = this.drawOrder();          // sorted once per frame, shared by sprites and bubbles
    this.drawScene(ctx, null, order);
    ctx.save(); ctx.translate(-this.camera.x, this.camera.y); for (const s of order) if (s.bubble) drawBubble(ctx, s); ctx.restore();
    this.dirty = false; this.lastRender = now();
  }
  // Should the render loop repaint this frame?
  needsRender() { return this.dirty || now() - (this.lastRender || 0) > 500; }
  queueDraw(d) { if (this.drawQueue.length < 5000) { this.drawQueue.push(d); this.redraw = true; } }
  widget(name) { return this.widgets.get(str(name)); }
  addWidget(w) { if (this.widgets.size >= 100 && !this.widgets.has(w.name)) return; this.widgets.set(w.name, w); this.widgetsVersion++; }
  widgetEvent(name, kind, value) {
    const w = this.widgets.get(name); if (!w) return;
    if (value !== undefined) w.value = capStr(String(value));
    this.startHats(kind === 'click' ? 'ui_clicked' : 'ui_changed', b => str(b.args[0]) === name);
  }
}

// ---------------- block implementations ----------------
const STACK = {
  // events
  ev_broadcast(b, th, a) { this.broadcast(a(0)); },
  *ev_broadcastwait(b, th, a) { const ts = this.broadcast(a(0)); do { yield 'wait'; } while (ts.some(t => !t.done)); },
  // motion
  mo_move(b, th, a) { const s = th.target; if (s.isStage) return; const r = (90 - s.direction) * Math.PI / 180, n = num(a(0)); this.moveTo(s, s.x + n * Math.cos(r), s.y + n * Math.sin(r)); },
  mo_turnr(b, th, a) { th.target.direction = wrapDir(th.target.direction + num(a(0))); this.redraw = true; },
  mo_turnl(b, th, a) { th.target.direction = wrapDir(th.target.direction - num(a(0))); this.redraw = true; },
  mo_goto(b, th, a) { const p = this.target(str(a(0))); if (p) this.moveTo(th.target, p.x, p.y); },
  mo_gotoxy(b, th, a) { this.moveTo(th.target, num(a(0)), num(a(1))); },
  *mo_glide(b, th, a) { yield* glide.call(this, th.target, num(a(0)), num(a(1)), num(a(2))); },
  *mo_glideto(b, th, a) { const p = this.target(str(a(1))); if (p) yield* glide.call(this, th.target, num(a(0)), p.x, p.y); },
  mo_point(b, th, a) { th.target.direction = wrapDir(num(a(0))); this.redraw = true; },
  mo_towards(b, th, a) { const s = th.target, p = this.target(str(a(0))); if (!p) return; const dx = p.x - s.x, dy = p.y - s.y; if (dx || dy) s.direction = wrapDir(90 - Math.atan2(dy, dx) * 180 / Math.PI); this.redraw = true; },
  mo_chx(b, th, a) { this.moveTo(th.target, th.target.x + num(a(0)), th.target.y); },
  mo_setx(b, th, a) { this.moveTo(th.target, num(a(0)), th.target.y); },
  mo_chy(b, th, a) { this.moveTo(th.target, th.target.x, th.target.y + num(a(0))); },
  mo_sety(b, th, a) { this.moveTo(th.target, th.target.x, num(a(0))); },
  mo_bounce(b, th) {
    const s = th.target, B = bounds(s); const d = { l: B.l, r: W - B.r, t: B.t, b: H - B.b };
    const min = Math.min(d.l, d.r, d.t, d.b); if (min > 0) return;
    const r = (90 - s.direction) * Math.PI / 180; let dx = Math.cos(r), dy = -Math.sin(r);
    if (min === d.l) dx = Math.max(0.2, Math.abs(dx)); else if (min === d.t) dy = Math.max(0.2, Math.abs(dy));
    else if (min === d.r) dx = -Math.max(0.2, Math.abs(dx)); else dy = -Math.max(0.2, Math.abs(dy));
    s.direction = wrapDir(90 - Math.atan2(-dy, dx) * 180 / Math.PI);
    const B2 = bounds(s); if (B2.l < 0) s.x -= B2.l; if (B2.r > W) s.x -= B2.r - W; if (B2.t < 0) s.y += B2.t; if (B2.b > H) s.y += B2.b - H;
    this.redraw = true;
  },
  mo_rotstyle(b, th, a) { th.target.rotationStyle = str(a(0)); this.redraw = true; },
  // looks
  *lo_sayfor(b, th, a) { const s = th.target; const bub = { text: str(a(0)), type: 'say' }; s.bubble = bub; this.redraw = true; yield* this.waitSecs(num(a(1))); if (s.bubble === bub) s.bubble = null; this.redraw = true; },
  lo_say(b, th, a) { th.target.bubble = { text: str(a(0)), type: 'say' }; this.redraw = true; },
  *lo_thinkfor(b, th, a) { const s = th.target; const bub = { text: str(a(0)), type: 'think' }; s.bubble = bub; this.redraw = true; yield* this.waitSecs(num(a(1))); if (s.bubble === bub) s.bubble = null; this.redraw = true; },
  lo_think(b, th, a) { th.target.bubble = { text: str(a(0)), type: 'think' }; this.redraw = true; },
  lo_costume(b, th, a) { this.setCostume(th.target, a(0)); },
  lo_nextcostume(b, th) { this.setCostume(th.target, 'next costume'); },
  lo_backdrop(b, th, a) { this.setCostume(this.stage, a(0)); },
  lo_nextbackdrop() { this.setCostume(this.stage, 'next backdrop'); },
  lo_chsize(b, th, a) { th.target.size = Math.max(5, Math.min(500, th.target.size + num(a(0)))); this.redraw = true; },
  lo_setsize(b, th, a) { th.target.size = Math.max(5, Math.min(500, num(a(0)))); this.redraw = true; },
  lo_cheffect(b, th, a) { const e = th.target.effects ||= dict(); const k = str(a(0)); put(e, k, (num(get(e, k)) || 0) + num(a(1))); this.redraw = true; },
  lo_seteffect(b, th, a) { const e = th.target.effects ||= dict(); put(e, str(a(0)), num(a(1))); this.redraw = true; },
  lo_cleareffects(b, th) { th.target.effects = dict(); this.redraw = true; },
  lo_show(b, th) { th.target.visible = true; this.redraw = true; },
  lo_hide(b, th) { th.target.visible = false; this.redraw = true; },
  lo_front(b, th, a) { th.target.layer = a(0) === 'back' ? -1e9 : 1e9; this.normalizeLayers(); this.redraw = true; },
  lo_layers(b, th, a) { const n = num(a(1)) * (a(0) === 'backward' ? -1 : 1); th.target.layer += n + Math.sign(n) * 0.5; this.normalizeLayers(); this.redraw = true; },
  // sound
  *so_playwait(b, th, a) { const d = playSound(str(a(0)), th.target.volume ?? 100); yield* this.waitSecs(d); },
  so_play(b, th, a) { playSound(str(a(0)), th.target.volume ?? 100); },
  *so_note(b, th, a) { const secs = num(a(1)) * 60 / (this.stage.tempo || 90); playTone(440 * Math.pow(2, (num(a(0)) - 69) / 12), secs, th.target.instrument || 'square', th.target.volume ?? 100); yield* this.waitSecs(secs); },
  *so_tone(b, th, a) { const secs = num(a(1)); playTone(num(a(0)), secs, th.target.instrument || 'square', th.target.volume ?? 100); yield* this.waitSecs(secs); },
  so_inst(b, th, a) { th.target.instrument = str(a(0)); },
  so_stop() { stopAllSounds(); },
  so_chvol(b, th, a) { th.target.volume = Math.max(0, Math.min(100, (th.target.volume ?? 100) + num(a(0)))); },
  so_setvol(b, th, a) { th.target.volume = Math.max(0, Math.min(100, num(a(0)))); },
  so_tempo(b, th, a) { this.stage.tempo = Math.max(20, Math.min(500, num(a(0)))); },
  // control
  *ct_wait(b, th, a) { yield* this.waitSecs(num(a(0))); },
  *ct_repeat(b, th, a) { const n = Math.round(num(a(0))); for (let i = 0; i < n; i++) { if (b.body) yield* this.runBlocks(b.body, th, 0); if (this.loopShouldYield(th)) yield; } },
  *ct_forever(b, th) { for (;;) { if (b.body) yield* this.runBlocks(b.body, th, 0); if (this.loopShouldYield(th)) yield; } },
  *ct_if(b, th, a) { if (bool(a(0)) && b.body) yield* this.runBlocks(b.body, th, 0); },
  *ct_ifelse(b, th, a) { const body = bool(a(0)) ? b.body : b.body2; if (body) yield* this.runBlocks(body, th, 0); },
  *ct_waituntil(b, th, a) { while (!bool(a(0))) yield 'wait'; },
  *ct_until(b, th, a) { while (!bool(a(0))) { if (b.body) yield* this.runBlocks(b.body, th, 0); if (this.loopShouldYield(th)) yield; } },
  *ct_while(b, th, a) { while (bool(a(0))) { if (b.body) yield* this.runBlocks(b.body, th, 0); if (this.loopShouldYield(th)) yield; } },
  *ct_for(b, th, a) { const name = str(a(0)); const n = Math.round(num(a(1))); for (let i = 1; i <= n; i++) { this.setVar(th.target, name, i); if (b.body) yield* this.runBlocks(b.body, th, 0); if (this.loopShouldYield(th)) yield; } },
  ct_stop(b, th, a) {
    const o = str(a(0));
    if (o === 'all') { this.stopAll(); throw new StopThread(); }
    if (o === 'this script') throw new StopThread();
    for (const t of this.threads) if (t.target === th.target && t !== th) t.done = true;
  },
  ct_clone(b, th, a) { const n = str(a(0)); const src = n === '_myself_' ? th.target : this.findSprite(n); if (src && !src.isStage) this.makeClone(src); },
  ct_delclone(b, th) { if (th.target.isClone) { this.deleteClone(th.target); throw new StopThread(); } },
  // sensing
  *se_ask(b, th, a) {
    while (this.ask) yield 'wait';
    const q = str(a(0)); const s = th.target; const showBubble = !s.isStage && s.visible;
    if (showBubble) { s.bubble = { text: q, type: 'say' }; this.redraw = true; }
    const req = { done: false }; this.ask = req; this.app.showAsk(showBubble ? '' : q, v => { this.answer = v; req.done = true; });
    while (!req.done) yield 'wait';
    if (this.ask === req) this.ask = null; if (showBubble) s.bubble = null; this.redraw = true;
  },
  se_resettimer() { this.timerStart = now(); },
  // variables
  va_set(b, th, a) { this.setVar(th.target, str(a(0)), a(1)); },
  va_change(b, th, a) { const n = str(a(0)); const h = this.varHost(th.target, n); put(h, n, capStr(num(get(h, n)) + num(a(1)))); },
  va_show(b, th, a) { this.app.setMonitor('var', str(a(0)), th.target, true); },
  va_hide(b, th, a) { this.app.setMonitor('var', str(a(0)), th.target, false); },
  // lists
  li_add(b, th, a) { const l = this.getList(th.target, str(a(1))); if (l.length < LIMITS.maxListLength) l.push(capStr(a(0))); },
  li_delete(b, th, a) { const l = this.getList(th.target, str(a(1))); const v = a(0); if (v === 'all') { l.length = 0; return; } const i = v === 'last' ? l.length : Math.round(num(v)); if (i >= 1 && i <= l.length) l.splice(i - 1, 1); },
  li_clear(b, th, a) { this.getList(th.target, str(a(0))).length = 0; },
  li_insert(b, th, a) { const l = this.getList(th.target, str(a(2))); const v = a(1); const i = v === 'last' ? l.length + 1 : Math.round(num(v)); if (i >= 1 && i <= l.length + 1 && l.length < LIMITS.maxListLength) l.splice(i - 1, 0, capStr(a(0))); },
  li_replace(b, th, a) { const l = this.getList(th.target, str(a(1))); const v = a(0); const i = v === 'last' ? l.length : Math.round(num(v)); if (i >= 1 && i <= l.length) l[i - 1] = capStr(a(2)); },
  li_show(b, th, a) { this.app.setMonitor('list', str(a(0)), th.target, true); },
  li_hide(b, th, a) { this.app.setMonitor('list', str(a(0)), th.target, false); },
  // pen
  pe_clear() { this.penCtx.clearRect(0, 0, W, H); this.redraw = true; },
  pe_stamp(b, th) { drawSprite(this.penCtx, th.target); this.redraw = true; },
  pe_down(b, th) { const s = th.target; s.penDown = true; this.moveTo(s, s.x, s.y); },
  pe_up(b, th) { th.target.penDown = false; },
  pe_color(b, th, a) { th.target.penColor = str(a(0)); th.target.penHue = undefined; },
  pe_chhue(b, th, a) { const s = th.target; if (s.penHue === undefined) s.penHue = hexHue(s.penColor || '#4C7EF3'); s.penHue = (s.penHue + num(a(0)) * 1.8) % 360; s.penColor = `hsl(${s.penHue},85%,55%)`; },
  pe_size(b, th, a) { th.target.penSize = Math.max(1, Math.min(200, num(a(0)))); },
  pe_chsize(b, th, a) { th.target.penSize = Math.max(1, Math.min(200, (th.target.penSize || 1) + num(a(0)))); },
  // my blocks
  *call(b, th) {
    const base = th.target.base || th.target;
    // definition lookup cached on the call block's record, revalidated once per frame (scripts may change in the editor)
    const c = b[C]; let def = c && c.b === b && c.defBase === base && c.defFrame === this.frameNo ? c.def : undefined;
    if (def === undefined) {
      def = null; const sc = base.scripts;
      for (let i = 0; i < sc.length; i++) { const top = sc[i].blocks[0]; if (top && top.op === 'define' && top.name === b.name) { def = sc[i]; break; } }
      if (c && c.b === b) { c.def = def; c.defBase = base; c.defFrame = this.frameNo; }
    }
    if (!def) return; const d = def.blocks[0];
    if (th.frames.length >= LIMITS.maxCallDepth) throw new Error(`Custom block recursion deeper than ${LIMITS.maxCallDepth}`);
    const frame = Object.create(null); const params = d.params;
    if (params) for (let i = 0; i < params.length; i++) frame[params[i]] = this.evalArg(b.args[i], th);
    th.frames.push(frame); if (d.warp) { if (!th.warp) th.warpStart = now(); th.warp++; }
    try { yield* this.runBlocks(def.blocks, th, 1); }
    finally { th.frames.pop(); if (d.warp) th.warp--; this.cur = th; }
  },
};
const getMap = (rt, t, n) => { const h = rt.varHost(t, n); let v = get(h, n); if (!v || typeof v !== 'object' || Array.isArray(v)) v = put(h, n, Object.create(null)); return v; };
function plainFromJson(text) {
  const v = JSON.parse(String(text).slice(0, LIMITS.maxStringLength));
  if (v === null || typeof v !== 'object') return v;
  const out = Object.create(null); let n = 0;
  for (const [k, x] of Object.entries(v)) { if (++n > LIMITS.maxMapKeys) break; put(out, k, x !== null && typeof x === 'object' ? JSON.stringify(x) : capStr(x)); }
  return out;
}
Object.assign(STACK, {
  pr_print(b, th, a) { this.app.print?.(str(a(0))); },
  pr_clear() { this.app.clearConsole?.(); },
  ui_button(b, th, a) { this.addWidget({ name: str(a(0)), type: 'button', text: str(a(1)), x: num(a(2)), y: num(a(3)), value: '' }); },
  ui_label(b, th, a) { this.addWidget({ name: str(a(0)), type: 'label', text: str(a(1)), x: num(a(2)), y: num(a(3)), value: str(a(1)) }); },
  ui_textbox(b, th, a) { this.addWidget({ name: str(a(0)), type: 'textbox', text: '', x: num(a(1)), y: num(a(2)), value: '' }); },
  ui_slider(b, th, a) { const lo = num(a(1)), hi = num(a(2)); this.addWidget({ name: str(a(0)), type: 'slider', min: lo, max: hi, x: num(a(3)), y: num(a(4)), value: String(lo) }); },
  ui_settext(b, th, a) { const w = this.widget(a(0)); if (w) { w.text = str(a(1)); if (w.type !== 'button') w.value = w.text; this.widgetsVersion++; } },
  ui_remove(b, th, a) { this.widgets.delete(str(a(0))); this.widgetsVersion++; },
  ui_clear() { this.widgets.clear(); this.widgetsVersion++; },
  st_set(b, th, a) { this.app.storeSet?.(str(a(0)).slice(0, LIMITS.maxNameLength), capStr(a(1))); },
  dt_split(b, th, a) { const l = this.getList(th.target, str(a(2))); const sep = str(a(1)); const parts = str(a(0)).split(sep === '' ? '' : sep).slice(0, LIMITS.maxListLength); l.length = 0; l.push(...parts); },
  dt_newmap(b, th, a) { this.varHost(th.target, str(a(0)))[str(a(0))] = Object.create(null); },
  dt_mapset(b, th, a) { const m = getMap(this, th.target, str(a(0))); const k = str(a(1)); if (!has(m, k) && Object.keys(m).length >= LIMITS.maxMapKeys) return; put(m, k, capStr(a(2))); },
  dt_mapdel(b, th, a) { const m = getMap(this, th.target, str(a(1))); const k = str(a(0)); if (has(m, k)) delete m[k]; },
  dt_mapkeys(b, th, a) { const l = this.getList(th.target, str(a(1))); l.length = 0; l.push(...Object.keys(getMap(this, th.target, str(a(0))))); },
  dt_fromjson(b, th, a) { let v; try { v = plainFromJson(a(1)); } catch (e) { throw new Error('Invalid JSON'); } this.setVar(th.target, str(a(0)), v); },
  ga_rect(b, th, a) { this.queueDraw({ k: 'rect', x: num(a(0)), y: num(a(1)), w: num(a(2)), h: num(a(3)), c: str(a(4)) }); },
  ga_circle(b, th, a) { this.queueDraw({ k: 'circle', x: num(a(0)), y: num(a(1)), r: num(a(2)), c: str(a(3)) }); },
  ga_line(b, th, a) { this.queueDraw({ k: 'line', x: num(a(0)), y: num(a(1)), x2: num(a(2)), y2: num(a(3)), c: str(a(4)) }); },
  ga_text(b, th, a) { this.queueDraw({ k: 'text', t: str(a(0)).slice(0, 500), x: num(a(1)), y: num(a(2)), c: str(a(3)) }); },
  ga_physics(b, th, a) { th.target.physics = str(a(0)) !== 'off'; },
  ga_setvel(b, th, a) { th.target.vx = num(a(0)); th.target.vy = num(a(1)); },
  ga_chvel(b, th, a) { th.target.vx = (th.target.vx || 0) + num(a(0)); th.target.vy = (th.target.vy || 0) + num(a(1)); },
  ga_speed(b, th, a) { const r = (90 - th.target.direction) * Math.PI / 180, n = num(a(0)); th.target.vx = n * Math.cos(r); th.target.vy = n * Math.sin(r); },
  ga_gravity(b, th, a) { th.target.gravity = num(a(0)); },
  ga_friction(b, th, a) { th.target.friction = num(a(0)); },
  ga_camera(b, th, a) { this.camera = { x: num(a(0)), y: num(a(1)) }; this.redraw = true; },
  ga_chcamera(b, th, a) { this.camera.x += num(a(0)); this.camera.y += num(a(1)); this.redraw = true; },
  ga_follow(b, th) { this.camera = { x: th.target.x, y: th.target.y }; this.redraw = true; },
  ga_room(b, th, a) { this.setCostume(this.stage, a(0)); },
});
function* glide(s, secs, x, y) {
  const x0 = s.x, y0 = s.y, start = now(), dur = secs * 1000;
  while (true) { const t = dur > 0 ? Math.min(1, (now() - start) / dur) : 1; this.moveTo(s, x0 + (x - x0) * t, y0 + (y - y0) * t); if (t >= 1) break; yield 'wait'; }
}
function hexHue(h) {
  const n = parseInt(String(h).replace('#', ''), 16) || 0; const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (!d) return 0;
  let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (hh * 60 + 360) % 360;
}
const REPORTERS = {
  mo_x(b, th) { return Math.round(th.target.x * 1e6) / 1e6; },
  mo_y(b, th) { return Math.round(th.target.y * 1e6) / 1e6; },
  mo_dir(b, th) { return th.target.direction; },
  lo_costumeof(b, th, a) { const t = th.target; return a(0) === 'name' ? costumeOf(t)?.name : t.costume + 1; },
  lo_backdropof(b, th, a) { const t = this.stage; return a(0) === 'name' ? costumeOf(t)?.name : t.costume + 1; },
  lo_size(b, th) { return Math.round(th.target.size); },
  so_vol(b, th) { return th.target.volume ?? 100; },
  se_touching(b, th, a) {
    const s = th.target, n = str(a(0)); if (s.isStage || !s.visible) return false;
    if (n === '_edge_') return touchingEdge(s);
    if (n === '_mouse_') return pointInSprite(s, this.mouse.x + W / 2, H / 2 - this.mouse.y);
    const others = [...this.sprites(), ...this.clones].filter(o => o !== s && (o.base || o).name === n);
    return others.some(o => touchingSprite(s, o));
  },
  se_touchcolor(b, th, a) { return touchingColor(th.target, str(a(0)), (ctx, ex) => this.drawScene(ctx, ex)); },
  se_distance(b, th, a) { const p = this.target(str(a(0))); if (!p) return 10000; return Math.hypot(p.x - th.target.x, p.y - th.target.y); },
  se_answer() { return this.answer; },
  se_key(b, th, a) { const k = str(a(0)); return k === 'any' ? this.keys.size > 0 : this.keys.has(k); },
  se_mousedown() { return this.mouse.down; },
  se_mousex() { return Math.round(this.mouse.x); },
  se_mousey() { return Math.round(this.mouse.y); },
  se_timer() { return Math.round((now() - this.timerStart) / 10) / 100; },
  se_of(b, th, a) {
    const p = str(a(0)), o = str(a(1)); const t = o === '_stage_' ? this.stage : this.findSprite(o); if (!t) return 0;
    if (t.isStage) return p === 'backdrop #' ? t.costume + 1 : p === 'backdrop name' ? costumeOf(t)?.name : p === 'volume' ? t.volume ?? 100 : (get(t.variables, p) ?? 0);
    return get({ 'x position': t.x, 'y position': t.y, direction: t.direction, 'costume #': t.costume + 1, 'costume name': costumeOf(t)?.name, size: t.size, volume: t.volume ?? 100 }, p) ?? (get(t.variables, p) ?? 0);
  },
  se_current(b, th, a) { const d = new Date(); return get({ year: d.getFullYear(), month: d.getMonth() + 1, date: d.getDate(), 'day of week': d.getDay() + 1, hour: d.getHours(), minute: d.getMinutes(), second: d.getSeconds() }, str(a(0))) ?? 0; },
  se_days() { return (Date.now() - Date.UTC(2000, 0, 1)) / 86400000; },
  op_add(b, th, a) { return num(a(0)) + num(a(1)); },
  op_sub(b, th, a) { return num(a(0)) - num(a(1)); },
  op_mul(b, th, a) { return num(a(0)) * num(a(1)); },
  op_div(b, th, a) { return num(a(0)) / num(a(1)); },
  op_mod(b, th, a) { const n = num(a(0)), m = num(a(1)); return ((n % m) + m) % m; },
  op_random(b, th, a) {
    const x = a(0), y = a(1); let lo = num(x), hi = num(y); if (lo > hi) [lo, hi] = [hi, lo];
    const isInt = v => Number.isInteger(num(v)) && !String(v).includes('.');
    return isInt(x) && isInt(y) ? lo + Math.floor(Math.random() * (hi - lo + 1)) : lo + Math.random() * (hi - lo);
  },
  op_gt(b, th, a) { return cmp(a(0), a(1)) > 0; },
  op_lt(b, th, a) { return cmp(a(0), a(1)) < 0; },
  op_eq(b, th, a) { return cmp(a(0), a(1)) === 0; },
  op_and(b, th, a) { return bool(a(0)) && bool(a(1)); },
  op_or(b, th, a) { return bool(a(0)) || bool(a(1)); },
  op_not(b, th, a) { return !bool(a(0)); },
  op_join(b, th, a) { return capStr(str(a(0)) + str(a(1))); },
  op_letter(b, th, a) { const s = str(a(1)), i = Math.round(num(a(0))); return s[i - 1] ?? ''; },
  op_length(b, th, a) { return str(a(0)).length; },
  op_contains(b, th, a) { return str(a(0)).toLowerCase().includes(str(a(1)).toLowerCase()); },
  op_round(b, th, a) { return Math.round(num(a(0))); },
  op_math(b, th, a) {
    const n = num(a(1)), r = Math.PI / 180;
    const v = ({ abs: Math.abs(n), floor: Math.floor(n), ceiling: Math.ceil(n), sqrt: Math.sqrt(n), sin: Math.sin(n * r), cos: Math.cos(n * r), tan: Math.tan(n * r),
      asin: Math.asin(n) / r, acos: Math.acos(n) / r, atan: Math.atan(n) / r, ln: Math.log(n), log: Math.log10(n), 'e ^': Math.exp(n), '10 ^': Math.pow(10, n) })[str(a(0))];
    return typeof v === 'number' ? Math.round(v * 1e10) / 1e10 : 0;
  },
  var(b, th) { return this.getVar(th.target, str(b.args[0])); },
  list(b, th) { const l = this.getList(th.target, str(b.args[0])); return l.every(x => str(x).length <= 1) ? l.map(str).join('') : l.map(str).join(' '); },
  li_item(b, th, a) { const l = this.getList(th.target, str(a(1))); const v = a(0); const i = v === 'last' ? l.length : v === 'random' ? 1 + Math.floor(Math.random() * l.length) : Math.round(num(v)); return l[i - 1] ?? ''; },
  li_index(b, th, a) { const l = this.getList(th.target, str(a(1))); const v = str(a(0)).toLowerCase(); return l.findIndex(x => str(x).toLowerCase() === v) + 1; },
  li_length(b, th, a) { return this.getList(th.target, str(a(0))).length; },
  li_contains(b, th, a) { const l = this.getList(th.target, str(a(0))); const v = str(a(1)).toLowerCase(); return l.some(x => str(x).toLowerCase() === v); },
  param(b, th) { const f = th.frames[th.frames.length - 1]; const n = str(b.args[0]); return f !== undefined && has(f, n) ? f[n] : ''; },
};
Object.assign(REPORTERS, {
  ui_value(b, th, a) { const w = this.widget(a(0)); return w ? (w.type === 'slider' ? num(w.value) : w.value) : ''; },
  st_get(b, th, a) { return this.app.storeGet?.(str(a(0))) ?? ''; },
  dt_true() { return true; }, dt_false() { return false; },
  dt_typeof(b, th, a) { const v = a(0); if (typeof v === 'boolean') return 'boolean'; if (v && typeof v === 'object') return 'map'; if (typeof v === 'number' || (str(v).trim() !== '' && !isNaN(Number(v)))) return 'number'; return 'text'; },
  dt_upper(b, th, a) { return str(a(0)).toUpperCase(); },
  dt_lower(b, th, a) { return str(a(0)).toLowerCase(); },
  dt_trim(b, th, a) { return str(a(0)).trim(); },
  dt_replace(b, th, a) { const f = str(a(0)); return f ? capStr(str(a(2)).split(f).join(str(a(1)))) : str(a(2)); },
  dt_sub(b, th, a) { const s = str(a(2)); return s.slice(Math.max(0, Math.round(num(a(0))) - 1), Math.max(0, Math.round(num(a(1))))); },
  dt_index(b, th, a) { return str(a(1)).toLowerCase().indexOf(str(a(0)).toLowerCase()) + 1; },
  dt_joinlist(b, th, a) { return capStr(this.getList(th.target, str(a(0))).map(str).join(str(a(1)))); },
  dt_mapget(b, th, a) { const m = getMap(this, th.target, str(a(1))); const k = str(a(0)); return has(m, k) ? m[k] : ''; },
  dt_maphas(b, th, a) { return has(getMap(this, th.target, str(a(0))), str(a(1))); },
  dt_mapsize(b, th, a) { return Object.keys(getMap(this, th.target, str(a(0)))).length; },
  dt_tojson(b, th, a) { return capStr(JSON.stringify(this.getVar(th.target, str(a(0))) ?? '')); },
  ga_vx(b, th) { return th.target.vx || 0; }, ga_vy(b, th) { return th.target.vy || 0; },
  ga_camx() { return this.camera.x; }, ga_camy() { return this.camera.y; },
  ga_roomname() { return costumeOf(this.stage)?.name || ''; },
});
export { str as toStr, keyName };
// Op dispatch via Maps built from own keys only: an op like "constructor" or "__proto__" never resolves to a function.
const STACK_MAP = new Map(Object.entries(STACK));
const REP_MAP = new Map(Object.entries(REPORTERS));
