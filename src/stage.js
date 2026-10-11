// Stage renderer + geometry/collision helpers.
export const W = 480, H = 360;
const imgCache = new Map();
export function getImg(src, onload) {
  let im = imgCache.get(src);
  if (!im) { im = new Image(); im.onload = () => { im._ok = true; onload && onload(); }; im.src = src; imgCache.set(src, im); }
  return im;
}
// Costume bitmap cache: vector (SVG) costumes are rasterized ONCE per scale bucket into an OffscreenCanvas (or a
// canvas) and drawn from that bitmap, instead of re-rasterizing the SVG on every drawImage. Buckets are powers of two
// (1x…8x) chosen from the on-screen scale, so sprites stay sharp when enlarged or on HiDPI screens.
const bitmapCache = new Map();   // src -> Map(bucket -> canvas)
let bitmapBytes = 0; const BITMAP_MAX_BYTES = 192 * 1024 * 1024;
export function costumeBitmap(c, im, scale) {
  if (!im._ok || !(c.w > 0 && c.h > 0)) return im;
  const bucket = Math.min(8, Math.max(1, 2 ** Math.ceil(Math.log2(Math.max(1, scale)))));
  let per = bitmapCache.get(c.src); if (!per) { per = new Map(); bitmapCache.set(c.src, per); }
  let bm = per.get(bucket);
  if (bm === undefined) {
    const w = Math.min(4096, Math.ceil(c.w * bucket)), h = Math.min(4096, Math.ceil(c.h * bucket));
    if (bitmapBytes + w * h * 4 > BITMAP_MAX_BYTES) { bitmapCache.clear(); bitmapBytes = 0; per = new Map(); bitmapCache.set(c.src, per); }
    bm = typeof OffscreenCanvas === 'function' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
    const g = bm.getContext('2d');
    if (g) { try { g.drawImage(im, 0, 0, w, h); } catch (e) { bm = null; } } else bm = null;
    per.set(bucket, bm || im); if (bm) bitmapBytes += w * h * 4;
    bm = bm || im;
  }
  return bm;
}
let renderScale = 2;                       // device pixels per stage unit, set by the renderer each frame
export function setRenderScale(s) { renderScale = s > 0 ? s : 2; }
export function costumeOf(t) { const cs = (t.base || t).costumes; return cs[Math.max(0, Math.min(cs.length - 1, t.costume | 0))]; }

function applyTransform(ctx, s, c) {
  ctx.translate(W / 2 + s.x, H / 2 - s.y);
  const sc = s.size / 100;
  if (s.rotationStyle === 'all around') ctx.rotate((s.direction - 90) * Math.PI / 180);
  else if (s.rotationStyle === 'left-right' && s.direction < 0) ctx.scale(-1, 1);
  ctx.scale(sc, sc);
}
function filterFor(s) {
  const e = s.effects || {}; const f = [];
  if (e.color) f.push(`hue-rotate(${(e.color * 1.8) % 360}deg)`);
  if (e.brightness) f.push(`brightness(${Math.max(0, 1 + e.brightness / 100)})`);
  if (e.saturation) f.push(`saturate(${Math.max(0, 1 + e.saturation / 100)})`);
  return f.length ? f.join(' ') : 'none';
}
export function drawSprite(ctx, s, opts = {}) {
  const c = costumeOf(s); if (!c) return; const im = getImg(c.src); if (!im._ok) return;
  ctx.save(); applyTransform(ctx, s, c);
  if (!opts.noEffects) { const g = s.effects?.ghost; if (g) ctx.globalAlpha = Math.max(0, Math.min(1, 1 - g / 100)); const f = filterFor(s); if (f !== 'none') ctx.filter = f; }
  ctx.drawImage(costumeBitmap(c, im, renderScale * (s.size || 100) / 100), -c.cx, -c.cy, c.w, c.h); ctx.restore();
}
// Axis-aligned bounds in canvas coords (y down)
export function bounds(s) {
  // allocation-free: transform the 4 costume corners with scalars (runs for every move / fence / bounce / collision)
  const c = costumeOf(s); if (!c) return { l: 0, r: 0, t: 0, b: 0 };
  const sc = s.size / 100; let cos = 1, sin = 0, fx = 1;
  if (s.rotationStyle === 'all around') { const a = (s.direction - 90) * Math.PI / 180; cos = Math.cos(a); sin = Math.sin(a); }
  else if (s.rotationStyle === 'left-right' && s.direction < 0) fx = -1;
  const ox = W / 2 + s.x, oy = H / 2 - s.y;
  const x0 = -c.cx * sc * fx, x1 = (c.w - c.cx) * sc * fx, y0 = -c.cy * sc, y1 = (c.h - c.cy) * sc;
  let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity;
  for (let i = 0; i < 4; i++) {
    const x = i & 1 ? x1 : x0, y = i & 2 ? y1 : y0;
    const px = x * cos - y * sin + ox, py = x * sin + y * cos + oy;
    if (px < l) l = px; if (px > r) r = px; if (py < t) t = py; if (py > b) b = py;
  }
  return { l, r, t, b };
}
const scratch = document.createElement('canvas');
const sctx = scratch.getContext('2d', { willReadFrequently: true });
function alphaAny(w, h, thr = 40) {
  try { const d = sctx.getImageData(0, 0, w, h).data; for (let i = 3; i < d.length; i += 4) if (d[i] > thr) return true; return false; }
  catch (e) { return true; } // tainted canvas: fall back to box collision
}
export function touchingSprite(a, b) {
  if (!a.visible || !b.visible) return false;
  const A = bounds(a), B = bounds(b);
  const l = Math.max(A.l, B.l), r = Math.min(A.r, B.r), t = Math.max(A.t, B.t), bt = Math.min(A.b, B.b);
  if (r <= l || bt <= t) return false;
  const w = Math.ceil(r - l), h = Math.ceil(bt - t); scratch.width = w; scratch.height = h;
  sctx.clearRect(0, 0, w, h); sctx.save(); sctx.translate(-l, -t); drawSprite(sctx, a, { noEffects: true });
  sctx.globalCompositeOperation = 'destination-in'; drawSprite(sctx, b, { noEffects: true }); sctx.restore();
  return alphaAny(w, h);
}
export function pointInSprite(s, px, py) { // canvas coords
  if (!s.visible) return false; const B = bounds(s);
  if (px < B.l || px > B.r || py < B.t || py > B.b) return false;
  scratch.width = 1; scratch.height = 1; sctx.clearRect(0, 0, 1, 1);
  sctx.save(); sctx.translate(-Math.floor(px), -Math.floor(py)); drawSprite(sctx, s, { noEffects: true }); sctx.restore();
  return alphaAny(1, 1, 10);
}
export function touchingEdge(s) { const B = bounds(s); return B.l < 0 || B.r > W || B.t < 0 || B.b > H; }
const hexRgb = h => { const n = parseInt(String(h).replace('#', ''), 16) || 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export function touchingColor(s, color, drawScene) {
  if (!s.visible) return false; const B = bounds(s);
  const l = Math.max(0, Math.floor(B.l)), t = Math.max(0, Math.floor(B.t)), r = Math.min(W, Math.ceil(B.r)), b = Math.min(H, Math.ceil(B.b));
  if (r <= l || b <= t) return false; const w = r - l, h = b - t;
  const scene = document.createElement('canvas'); scene.width = w; scene.height = h; const c2 = scene.getContext('2d', { willReadFrequently: true });
  c2.translate(-l, -t); drawScene(c2, s);
  scratch.width = w; scratch.height = h; sctx.clearRect(0, 0, w, h); sctx.save(); sctx.translate(-l, -t); drawSprite(sctx, s, { noEffects: true }); sctx.restore();
  try {
    const m = sctx.getImageData(0, 0, w, h).data, d = c2.getImageData(0, 0, w, h).data; const [R, G, Bc] = hexRgb(color);
    for (let i = 0; i < m.length; i += 4) if (m[i + 3] > 40 && d[i + 3] > 40 && Math.abs(d[i] - R) < 24 && Math.abs(d[i + 1] - G) < 24 && Math.abs(d[i + 2] - Bc) < 24) return true;
  } catch (e) { }
  return false;
}

function wrapText(ctx, text, maxW) {
  const words = String(text).split(/\s+/); const lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines.slice(0, 8);
}
export function drawBubble(ctx, s) {
  if (!s.bubble || !s.visible || s.bubble.text === '') return;
  const B = bounds(s); ctx.save(); ctx.font = '600 13px system-ui, sans-serif';
  const lines = wrapText(ctx, s.bubble.text, 150); const w = Math.max(40, ...lines.map(l => ctx.measureText(l).width)) + 20, h = lines.length * 16 + 14;
  let x = B.r - 6, y = B.t - h - 14; if (x + w > W) x = Math.max(0, B.l - w + 6); if (y < 2) y = 2; x = Math.max(2, Math.min(W - w - 2, x));
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9aa3b5'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke();
  if (s.bubble.type === 'think') {
    [[x + 16, y + h + 6, 5], [x + 8, y + h + 14, 3]].forEach(([cx, cy, r]) => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke(); });
  } else {
    ctx.beginPath(); ctx.moveTo(x + 14, y + h - 1); ctx.lineTo(x + 10, y + h + 12); ctx.lineTo(x + 26, y + h - 1); ctx.fill(); ctx.stroke();
    ctx.fillRect(x + 12, y + h - 3, 16, 3);
  }
  ctx.fillStyle = '#1d2333'; lines.forEach((l, i) => ctx.fillText(l, x + 10, y + 21 + i * 16)); ctx.restore();
}
