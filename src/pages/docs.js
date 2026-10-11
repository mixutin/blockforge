// Docs page: Markdown pages from docs/site (bundled at build time), language switch (en/fi), sidebar navigation.
// Everything is rendered with textContent by md.js; images only from the bundled docs/site/images folder.
import { chrome, $, h } from './common.js';
import { renderMarkdown } from './md.js';
import { pages, languages, defaultLang, images } from 'virtual:kindlr-docs';
chrome('docs');
const qs = new URLSearchParams(location.search);
const LANG_KEY = 'kindlr.lang';
const pick = l => (l && Object.hasOwn(languages, l) ? l : null);
const lang = pick(qs.get('lang')) || pick(localStorage.getItem(LANG_KEY)) || defaultLang;
const legacy = { script: 'kindlr-script' };                       // old ?doc=script|blocks links
const want = qs.get('page') || legacy[qs.get('doc')] || qs.get('doc') || pages[0]?.slug;
const page = pages.find(p => p.slug === want) || pages[0];
const T = { en: { onThisPage: 'On this page', pages: 'Pages', lang: 'Language', untranslated: 'This page is not translated into English yet; showing the original.' },
  fi: { onThisPage: 'Tällä sivulla', pages: 'Sivut', lang: 'Kieli', untranslated: 'Tätä sivua ei ole vielä käännetty suomeksi, joten se näytetään englanniksi.' } };
const t = k => (T[lang] || T.en)[k];
const href = (slug, l = lang) => `?lang=${encodeURIComponent(l)}&page=${encodeURIComponent(slug)}`;
document.documentElement.lang = lang;

// language switch
const sw = $('doc-lang'); sw.setAttribute('aria-label', t('lang'));
for (const [code, name] of Object.entries(languages)) {
  const a = h('a', code === lang ? 'on' : '', name); a.href = href(page.slug, code); a.hreflang = code; a.lang = code;
  if (code === lang) a.setAttribute('aria-current', 'true');
  a.onclick = () => localStorage.setItem(LANG_KEY, code); sw.appendChild(a);
}
// sidebar: pages, with the current page's headings nested under it
const nav = $('toc'); nav.setAttribute('aria-label', t('pages'));
const fileToSlug = new Map(); for (const p of pages) for (const f of Object.values(p.files || {})) fileToSlug.set(f, p.slug);
const curFile = (page.files || {})[lang] || (page.files || {})[defaultLang] || 'index.md';
const GH = 'https://github.com/mixutin/kindlr/blob/main/';
// Relative links resolve against the current page's path under docs/; other docs pages stay in-site, other repo files go to GitHub.
const linkFix = l => {
  if (/^([a-z][a-z0-9+.-]*:|#|\/\/)/i.test(l)) return l;
  const u = new URL(l, 'https://docs.invalid/docs/' + curFile); if (u.origin !== 'https://docs.invalid') return l;
  const rel = decodeURIComponent(u.pathname).replace(/^\/docs\//, ''); const key = rel.toLowerCase();
  if (u.pathname.startsWith('/docs/') && fileToSlug.has(key)) return href(fileToSlug.get(key)) + u.hash;
  return GH + (u.pathname.startsWith('/docs/') ? 'docs/' + rel : u.pathname.slice(1)) + u.hash;
};
const image = src => { const k = src.replace(/^\.\//, '').replace(/^\.\.\/images\//, 'images/'); return Object.hasOwn(images, k) ? images[k] : null; };
const md = page.md[lang] ?? page.md[defaultLang] ?? Object.values(page.md)[0] ?? '';
const { node, toc } = renderMarkdown(md, { linkFix, image });
const art = $('doc'); art.replaceChildren();
if (page.md[lang] === undefined) { art.lang = defaultLang; art.appendChild(h('p', 'note-box', t('untranslated'))); }
art.appendChild(node);
for (const p of pages) {
  const title = p.title[lang] || p.title[defaultLang] || p.slug; const a = h('a', 'l1' + (p === page ? ' on' : ''), title); a.href = href(p.slug);
  if (p === page) a.setAttribute('aria-current', 'page'); nav.appendChild(a);
  if (p === page) for (const [lvl, text, id] of toc) if (lvl === 2) { const s = h('a', 'l2', text); s.href = '#' + id; nav.appendChild(s); }
}
document.title = (page.title[lang] || page.title[defaultLang] || 'Docs') + ' · Kindlr';
if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
