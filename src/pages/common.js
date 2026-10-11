import '../migrate.js';
// Shared chrome for public pages. All user-provided text is inserted with textContent only.
import '../pages.css';
import { LOGO_SVG } from '../art.js';
import { cloud, pageUrl } from '../cloud.js';
export const $ = id => document.getElementById(id);
export const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
export function theme() { document.documentElement.dataset.theme = localStorage.getItem('kindlr.theme') || 'dark'; }
export function chrome(active, { account = true } = {}) {
  theme();
  const top = h('header', 'top');
  const brand = h('a', 'brand'); brand.href = pageUrl('./');
  const logo = h('span'); logo.innerHTML = LOGO_SVG;               // static, trusted SVG constant (no user data)
  const word = h('span'); word.style.color = 'var(--text)'; word.append('Kind', h('span', '', 'lr'));
  brand.append(logo, word);
  const nav = h('nav'); const link = (label, href, key) => { const a = h('a', active === key ? 'on' : '', label); a.href = href; nav.appendChild(a); };
  link('Editor', pageUrl('./'), 'editor'); link('Explore', pageUrl('explore'), 'explore'); link('Docs', pageUrl('docs'), 'docs');
  const who = h('span', 'who');
  top.append(brand, nav, h('div', 'spacer'), who);
  document.body.prepend(top);
  if (account) cloud.me().then(u => { who.textContent = u ? 'Signed in as ' + u.username : ''; }).catch(() => {});
  return { who };
}
export const fmtDate = ms => (ms ? new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '');
/** Original generative thumbnail: three Kindlr-style blocks coloured from the share id. */
export function thumb(seed, w = 480, hgt = 270) {
  let x = 2166136261; for (const c of seed) { x ^= c.charCodeAt(0); x = Math.imul(x, 16777619) >>> 0; }
  const rnd = () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; };
  const pal = ['#4C7EF3', '#3DBE6A', '#F28A2E', '#9966FF', '#E9468B', '#2BB8C9', '#FFBF00', '#FF6680'];
  const cv = document.createElement('canvas'); cv.width = w; cv.height = hgt; const g = cv.getContext('2d');
  const bg = g.createLinearGradient(0, 0, w, hgt); bg.addColorStop(0, '#1d2033'); bg.addColorStop(1, '#2a2050'); g.fillStyle = bg; g.fillRect(0, 0, w, hgt);
  g.globalAlpha = .18; for (let i = 0; i < 26; i++) { g.fillStyle = '#fff'; g.beginPath(); g.arc(rnd() * w, rnd() * hgt, rnd() * 2 + .5, 0, 7); g.fill(); } g.globalAlpha = 1;
  const rr = (X, Y, W, H, r) => { g.beginPath(); g.moveTo(X + r, Y); g.arcTo(X + W, Y, X + W, Y + H, r); g.arcTo(X + W, Y + H, X, Y + H, r); g.arcTo(X, Y + H, X, Y, r); g.arcTo(X, Y, X + W, Y, r); g.fill(); };
  for (let i = 0; i < 3; i++) { const W = 120 + rnd() * 140, X = 40 + i * 26 + rnd() * 40, Y = 50 + i * 62; g.fillStyle = pal[Math.floor(rnd() * pal.length)]; rr(X, Y, W, 48, 10); g.fillStyle = 'rgba(255,255,255,.85)'; rr(X + 14, Y + 18, W * .45, 10, 5); }
  g.fillStyle = '#FF8C42'; g.beginPath(); const fx = w - 90, fy = hgt - 70; g.moveTo(fx, fy - 40); g.bezierCurveTo(fx + 30, fy - 10, fx + 28, fy + 26, fx, fy + 30); g.bezierCurveTo(fx - 28, fy + 26, fx - 30, fy - 4, fx - 8, fy - 18); g.bezierCurveTo(fx - 6, fy - 6, fx, fy - 2, fx + 2, fy); g.fill();
  return cv;
}
