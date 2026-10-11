import { defineConfig } from 'vite';
import { build as esbuild } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

// The sandboxed player is built as a classic (non-module) IIFE script so it loads inside an
// opaque-origin sandboxed iframe without CORS, under a strict CSP (script-src 'self').
function playerBuild() {
  let out = 'dist';
  return {
    name: 'kindlr-player',
    configResolved(c) { out = c.build.outDir; },
    async closeBundle() {
      fs.mkdirSync(`${out}/player`, { recursive: true });
      await esbuild({
        entryPoints: ['src/player.js'], bundle: true, format: 'iife', minify: true, target: 'es2020',
        outfile: `${out}/player/player.js`, logLevel: 'warning',
        define: { __EDITOR_ORIGINS__: JSON.stringify(process.env.PLAYER_EDITOR_ORIGINS || '') },
      });
      fs.copyFileSync('player/index.html', `${out}/player/index.html`);
      // 404.html is served by nginx for ANY missing path (e.g. /a/b/c), so its URLs must be root-absolute.
      if (fs.existsSync(`${out}/404.html`)) fs.writeFileSync(`${out}/404.html`, fs.readFileSync(`${out}/404.html`, 'utf8').replace(/(src|href)="\.\//g, '$1="/'));
      // embed.html is served at /embed/<share-id>, so its asset URLs must be root-absolute too.
      if (fs.existsSync(`${out}/embed.html`)) fs.writeFileSync(`${out}/embed.html`, fs.readFileSync(`${out}/embed.html`, 'utf8').replace(/(src|href)="\.\//g, '$1="/'));
    },
  };
}

// Docs site: bundle docs/site (pages.json + <lang>/*.md + images/) into a virtual module at build time.
// Markdown stays text (rendered later with textContent by src/pages/md.js); images go through Vite (hashed /assets/ URLs).
function kindlrDocs() {
  const VID = 'virtual:kindlr-docs', RID = '\0' + VID, ROOT = path.resolve('docs/site');
  return {
    name: 'kindlr-docs',
    resolveId(id) { return id === VID ? RID : null; },
    load(id) {
      if (id !== RID) return null;
      const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'pages.json'), 'utf8'));
      const langs = Object.keys(cfg.languages); const pages = [];
      const read = rel => { const f = path.resolve(ROOT, rel); this.addWatchFile(f); return fs.readFileSync(f, 'utf8'); };
      const used = new Set(); const docRel = f => path.relative(path.resolve('docs'), f).split(path.sep).join('/').toLowerCase();   // file key: path under docs/
      for (const pg of cfg.pages) { const md = {}; for (const l of langs) if (pg.file?.[l]) { md[l] = read(pg.file[l]); used.add(path.resolve(ROOT, pg.file[l])); }
        const title = { ...(pg.title || {}) }; for (const l in md) if (!title[l]) title[l] = (/^#\s+(.+)$/m.exec(md[l]) || [, pg.slug])[1].replace(/[`*_]/g, '');
        pages.push({ slug: pg.slug, title, md, files: Object.fromEntries(Object.entries(pg.file || {}).map(([l, f]) => [l, docRel(path.resolve(ROOT, f))])) }); }
      for (const l of langs) {
        const dir = path.join(ROOT, l); if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.md')).sort()) {
          const full = path.join(dir, f); if (used.has(full)) continue;
          const slug = f.replace(/^\d+[-_]/, '').replace(/\.md$/, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
          let pg = pages.find(p => p.slug === slug); if (!pg) { pg = { slug, title: {}, md: {}, files: {} }; pages.push(pg); }
          const text = read(path.relative(ROOT, full)); pg.md[l] = text; pg.files[l] = docRel(full);
          if (!pg.title[l]) pg.title[l] = (/^#\s+(.+)$/m.exec(text) || [, slug])[1].replace(/[`*_]/g, '');
        }
      }
      const imgs = []; const IMG = /\.(png|jpe?g|webp|gif|svg)$/i;
      const walk = d => { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (IMG.test(f)) imgs.push(p); } };
      walk(path.join(ROOT, 'images'));
      const imports = imgs.map((p, i) => `import i${i} from ${JSON.stringify(p + '?url')};`).join('\n');
      const map = imgs.map((p, i) => `${JSON.stringify(path.relative(ROOT, p).split(path.sep).join('/'))}: i${i}`).join(',\n');
      return `${imports}\nexport const images = Object.freeze(Object.assign(Object.create(null), {${map}}));\nexport const languages = ${JSON.stringify(cfg.languages)};\nexport const defaultLang = ${JSON.stringify(cfg.default || langs[0])};\nexport const pages = ${JSON.stringify(pages)};\n`;
    },
  };
}
// Clean URLs for the public pages in dev/preview (nginx does the same with try_files $uri $uri.html).
const PAGES = ['verify', 'reset', 'explore', 'p', 'embed', 'docs', '404'];
function cleanUrls() {
  const mw = (req, res, next) => { const u = new URL(req.url, 'http://x'); const name = u.pathname.replace(/^\/+|\/+$/g, ''); if (PAGES.includes(name)) req.url = '/' + name + '.html' + u.search;
    else if (/^embed\/[A-Za-z0-9_-]{1,64}$/.test(name)) req.url = '/embed.html';
    else if (name && !name.includes('.') && !/^(api|src|node_modules|@vite|@id|@fs|player|assets)(\/|$)/.test(name)) req.url = '/404.html';
    next(); };
  return { name: 'kindlr-clean-urls', configureServer(s) { s.middlewares.use(mw); }, configurePreviewServer(s) { s.middlewares.use(mw); } };
}
export default defineConfig({
  base: './',
  plugins: [cleanUrls(), playerBuild(), kindlrDocs()],
  build: {
    outDir: 'dist', assetsDir: 'assets', target: 'es2020',
    rollupOptions: { input: Object.fromEntries([['index', 'index.html'], ...PAGES.map(n => [n, n + '.html'])]) },
  },
  server: { proxy: { '/api': process.env.BLOCKS_API || 'http://127.0.0.1:8795' } },
  preview: { proxy: { '/api': process.env.BLOCKS_API || 'http://127.0.0.1:8795' } },
});
