// Simple bitmap costume editor (2x internal resolution; rotation center = canvas center).
import { getImg } from './stage.js';
const R = 2, CW = 480, CH = 360;
export class Paint {
  constructor(app) {
    this.app = app; this.tool = 'brush'; this.color = '#FF8C42'; this.size = 8; this.filled = true; this.undo = [];
    this.cv = document.getElementById('paint-canvas'); this.cv.width = CW * R; this.cv.height = CH * R;
    this.ctx = this.cv.getContext('2d', { willReadFrequently: true });
    const tb = document.getElementById('paint-tools');
    tb.querySelectorAll('[data-tool]').forEach(b => b.onclick = () => { this.tool = b.dataset.tool; tb.querySelectorAll('[data-tool]').forEach(x => x.classList.toggle('on', x === b)); });
    document.getElementById('paint-color').oninput = e => (this.color = e.target.value);
    document.getElementById('paint-size').oninput = e => (this.size = +e.target.value);
    document.getElementById('paint-fill').onchange = e => (this.filled = e.target.checked);
    document.getElementById('paint-undo').onclick = () => this.doUndo();
    document.getElementById('paint-clear').onclick = () => { this.pushUndo(); this.ctx.clearRect(0, 0, this.cv.width, this.cv.height); this.commit(); };
    this.cv.addEventListener('pointerdown', e => this.down(e));
  }
  pos(e) { const r = this.cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * this.cv.width / r.width, y: (e.clientY - r.top) * this.cv.height / r.height }; }
  load(costume) {
    this.costume = costume; this.undo = []; const c = this.ctx; c.clearRect(0, 0, this.cv.width, this.cv.height);
    if (!costume) return;
    const im = getImg(costume.src, () => this.costume === costume && this.load(costume));
    if (im._ok) c.drawImage(im, (CW / 2 - costume.cx) * R, (CH / 2 - costume.cy) * R, costume.w * R, costume.h * R);
  }
  pushUndo() { this.undo.push(this.ctx.getImageData(0, 0, this.cv.width, this.cv.height)); if (this.undo.length > 25) this.undo.shift(); }
  doUndo() { const d = this.undo.pop(); if (d) { this.ctx.putImageData(d, 0, 0); this.commit(); } }
  down(e) {
    if (!this.costume) return; e.preventDefault(); this.cv.setPointerCapture(e.pointerId);
    const c = this.ctx, p0 = this.pos(e); this.pushUndo(); const snap = this.undo[this.undo.length - 1];
    c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = c.fillStyle = this.color; c.lineWidth = this.size * R;
    if (this.tool === 'fill') { this.flood(Math.floor(p0.x), Math.floor(p0.y)); this.commit(); return; }
    let last = p0;
    const move = ev => {
      const p = this.pos(ev);
      if (this.tool === 'brush' || this.tool === 'eraser') {
        c.globalCompositeOperation = this.tool === 'eraser' ? 'destination-out' : 'source-over';
        c.beginPath(); c.moveTo(last.x, last.y); c.lineTo(p.x + 0.01, p.y); c.stroke(); c.globalCompositeOperation = 'source-over'; last = p;
      } else {
        c.putImageData(snap, 0, 0); c.beginPath();
        if (this.tool === 'line') { c.moveTo(p0.x, p0.y); c.lineTo(p.x, p.y); c.stroke(); return; }
        if (this.tool === 'rect') c.rect(p0.x, p0.y, p.x - p0.x, p.y - p0.y);
        if (this.tool === 'ellipse') c.ellipse((p0.x + p.x) / 2, (p0.y + p.y) / 2, Math.abs(p.x - p0.x) / 2, Math.abs(p.y - p0.y) / 2, 0, 0, Math.PI * 2);
        this.filled ? c.fill() : c.stroke();
      }
    };
    const up = () => { this.cv.removeEventListener('pointermove', move); this.cv.removeEventListener('pointerup', up); this.commit(); };
    this.cv.addEventListener('pointermove', move); this.cv.addEventListener('pointerup', up); move(e);
  }
  flood(x, y) {
    const { width: w, height: h } = this.cv; const img = this.ctx.getImageData(0, 0, w, h), d = img.data;
    const n = parseInt(this.color.slice(1), 16), fc = [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
    const i0 = (y * w + x) * 4, tc = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
    if (tc.every((v, i) => v === fc[i])) return;
    const match = i => Math.abs(d[i] - tc[0]) + Math.abs(d[i + 1] - tc[1]) + Math.abs(d[i + 2] - tc[2]) + Math.abs(d[i + 3] - tc[3]) < 60;
    const stack = [[x, y]];
    while (stack.length) {
      let [cx, cy] = stack.pop(); let i = (cy * w + cx) * 4;
      while (cx >= 0 && match(i)) { cx--; i -= 4; } cx++; i += 4; let up = false, dn = false;
      while (cx < w && match(i)) {
        d[i] = fc[0]; d[i + 1] = fc[1]; d[i + 2] = fc[2]; d[i + 3] = 255;
        if (cy > 0) { const m = match(i - w * 4); if (m && !up) { stack.push([cx, cy - 1]); up = true; } else if (!m) up = false; }
        if (cy < h - 1) { const m = match(i + w * 4); if (m && !dn) { stack.push([cx, cy + 1]); dn = true; } else if (!m) dn = false; }
        cx++; i += 4;
      }
    }
    this.ctx.putImageData(img, 0, 0);
  }
  commit() {
    const { width: w, height: h } = this.cv; const d = this.ctx.getImageData(0, 0, w, h).data;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const c = this.costume; const out = document.createElement('canvas');
    if (x1 < 0) { out.width = out.height = 2; x0 = w / 2 - 1; y0 = h / 2 - 1; }
    else { x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(w - 1, x1 + 2); y1 = Math.min(h - 1, y1 + 2); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1; out.getContext('2d').drawImage(this.cv, -x0, -y0); }
    c.src = out.toDataURL('image/png'); c.w = out.width / R; c.h = out.height / R; c.cx = (w / 2 - x0) / R; c.cy = (h / 2 - y0) / R;
    getImg(c.src, () => this.app.costumesChanged(false));
  }
}
