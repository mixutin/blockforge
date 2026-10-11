// Docs Markdown renderer safety: raw HTML stays text, only allow-listed images render, no javascript: links.
class Node_ { constructor(tag) { this.tag = tag; this.children = []; this.attrs = {}; this._text = ''; }
  appendChild(c) { this.children.push(c); return c; } append(...cs) { for (const c of cs) this.children.push(typeof c === 'string' ? { tag: '#text', text: c } : c); }
  set textContent(v) { this.children = [{ tag: '#text', text: String(v) }]; } get textContent() { return this.children.map(c => c.tag === '#text' ? c.text : c.textContent).join(''); }
  set innerHTML(v) { throw new Error('innerHTML used'); } }
for (const k of ['src', 'href', 'alt', 'id', 'className', 'target', 'rel', 'loading', 'decoding'])
  Object.defineProperty(Node_.prototype, k, { set(v) { this.attrs[k] = v; }, get() { return this.attrs[k]; } });
globalThis.document = { createElement: t => new Node_(t), createDocumentFragment: () => new Node_('#frag') };
const { renderMarkdown } = await import('../src/pages/md.js');
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? '✔' : '✘', m); };
const all = n => [n, ...(n.children || []).flatMap(all)];
const image = src => src === 'images/ok.png' ? '/assets/ok-123.png' : null;
const { node } = renderMarkdown([
  '# Title <script>alert(1)</script>',
  'Para with <img src=x onerror=alert(1)> and <b>bold?</b>',
  '![good](images/ok.png)',
  'Inline ![remote](https://evil.example/x.png) and ![js](javascript:alert(1)) and ![data](data:image/svg+xml,<svg onload=alert(1)>)',
  '[bad link](javascript:alert(1)) [ok](https://example.com) [rel](blocks.md)',
].join('\n\n'), { image, linkFix: h => h });
const nodes = all(node);
ok(!nodes.some(n => n.tag === 'script' || n.tag === 'b'), 'raw HTML tags never become elements');
ok(node.textContent.includes('<script>alert(1)</script>') && node.textContent.includes('<img src=x onerror=alert(1)>'), 'raw HTML is shown as plain text');
const imgs = nodes.filter(n => n.tag === 'img');
ok(imgs.length === 1 && imgs[0].attrs.src === '/assets/ok-123.png' && imgs[0].attrs.alt === 'good', 'only the bundled image renders (resolved to its hashed asset URL)');
ok(nodes.some(n => n.tag === 'figure') && nodes.some(n => n.tag === 'figcaption'), 'an image-only paragraph becomes a figure with a caption');
ok(nodes.filter(n => n.attrs?.className === 'img-missing').length >= 2 && !imgs.some(i => /^(https?:|javascript:|data:)/.test(i.attrs.src)), 'remote / javascript: / data: images never become <img> (alt text only)');
const links = nodes.filter(n => n.tag === 'a');
ok(links.find(a => a.textContent === 'bad link') && !links.find(a => a.textContent === 'bad link').attrs.href, 'javascript: links get no href');
ok(links.find(a => a.textContent === 'ok').attrs.rel === 'noopener' && links.find(a => a.textContent === 'ok').attrs.target === '_blank', 'external links open in a new tab with rel=noopener');
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
