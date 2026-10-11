// Tiny Markdown → DOM renderer for our own docs (headings, paragraphs, lists, tables, code blocks, inline code,
// bold, italic, links, images). Builds DOM nodes with textContent: no innerHTML, so nothing in the text is ever parsed as HTML.
const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
export const slug = t => t.toLowerCase().replace(/[`*]/g, '').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
// Images: only URLs returned by opts.image(src) are used (e.g. files bundled from docs/site/images); anything else
// (remote URLs, javascript:, data:, paths outside the folder) is shown as its alt text.
function inline(parent, text, linkFix, image) {
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(!\[[^\]]*\]\([^)\s]+\))|(\[[^\]]+\]\([^)\s]+\))|(_[^_]+_)/g; let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) parent.append(text.slice(last, m.index));
    const t = m[0];
    if (m[1]) parent.appendChild(el('code', '', t.slice(1, -1)));
    else if (m[2]) parent.appendChild(el('strong', '', t.slice(2, -2)));
    else if (m[5]) parent.appendChild(el('em', '', t.slice(1, -1)));
    else if (m[3]) { const mm = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(t); const url = image ? image(mm[2]) : null;
      if (url) { const img = el('img'); img.src = url; img.alt = mm[1]; img.loading = 'lazy'; img.decoding = 'async'; parent.appendChild(img); }
      else parent.appendChild(el('span', 'img-missing', mm[1] ? `[${mm[1]}]` : '')); }
    else { const mm = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(t); const a = el('a', '', mm[1]); const href = linkFix(mm[2]); if (/^(https?:|#|\?|\.\/|[\w-]+(\?|$))/.test(href)) a.href = href; if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; } parent.appendChild(a); }
    last = re.lastIndex;
  }
  if (last < text.length) parent.append(text.slice(last));
}
export function renderMarkdown(md, { linkFix = h => h, image = null } = {}) {
  const root = document.createDocumentFragment(); const lines = md.replace(/\r/g, '').split('\n'); const toc = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) { const buf = []; i++; while (i < lines.length && !/^```/.test(lines[i])) buf.push(lines[i++]); i++; const pre = el('pre'); pre.appendChild(el('code', '', buf.join('\n'))); root.appendChild(pre); continue; }
    const hm = /^(#{1,4})\s+(.*)$/.exec(line);
    if (hm) { const hEl = el('h' + Math.min(6, hm[1].length + 1)); inline(hEl, hm[2], linkFix, image); hEl.id = slug(hm[2]); if (hm[1].length <= 2) toc.push([hm[1].length, hm[2].replace(/[`*]/g, ''), hEl.id]); root.appendChild(hEl); i++; continue; }
    if (/^\|/.test(line)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) rows.push(lines[i++]);
      const cells = r => r.replace(/^\||\|$/g, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'));
      const wrap = el('div', 'table-wrap'); const t = el('table'); const head = el('tr');
      cells(rows[0]).forEach(c => { const th = el('th'); inline(th, c, linkFix, image); head.appendChild(th); }); t.appendChild(el('thead')).appendChild(head);
      const tb = el('tbody'); rows.slice(2).forEach(r => { const tr = el('tr'); cells(r).forEach(c => { const td = el('td'); inline(td, c, linkFix, image); tr.appendChild(td); }); tb.appendChild(tr); });
      t.appendChild(tb); wrap.appendChild(t); root.appendChild(wrap); continue;
    }
    if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line); const list = el(ordered ? 'ol' : 'ul');
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) { const li = el('li'); inline(li, lines[i].replace(/^\s*([-*]|\d+\.)\s+/, ''), linkFix, image); list.appendChild(li); i++; }
      root.appendChild(list); continue;
    }
    if (/^>\s?/.test(line)) { const q = el('blockquote'); inline(q, line.replace(/^>\s?/, ''), linkFix, image); root.appendChild(q); i++; continue; }
    if (!line.trim()) { i++; continue; }
    const buf = [line]; i++; while (i < lines.length && lines[i].trim() && !/^(#|```|\||\s*[-*]\s|\s*\d+\.\s|>)/.test(lines[i])) buf.push(lines[i++]);
    const para = buf.join(' ');
    if (/^!\[[^\]]*\]\([^)\s]+\)$/.test(para.trim())) { const fig = el('figure'); inline(fig, para.trim(), linkFix, image); const alt = /^!\[([^\]]*)\]/.exec(para.trim())[1]; if (alt) fig.appendChild(el('figcaption', '', alt)); root.appendChild(fig); continue; }
    const pEl = el('p'); inline(pEl, para, linkFix, image); root.appendChild(pEl);
  }
  return { node: root, toc };
}
