# Docs site sources

The `/docs` page is built from this folder at build time (see `vite.config.js` → `kindlrDocs()`).

- `pages.json`: languages, sidebar order and titles. `file` paths are relative to this folder.
  A page missing in a language falls back to English with a "not translated yet" note.
- `<lang>/*.md`: any other Markdown file is added automatically after the listed pages
  (slug = file name without an `NN-` prefix and `.md`; title = first `#` heading).
- `images/`: images referenced as `![alt text](images/name.png)` (png, jpg, webp, gif, svg).
  Only files inside this folder can be shown. Remote URLs and paths outside the folder render as their alt text.
- Links to other pages: `[text](blocks.md)` or `[text](../BLOCKS.md)` (resolved by file name).

Rendering is safe by construction: Markdown is turned into DOM nodes with `textContent`. Raw HTML in a Markdown file is
displayed as text, never parsed. Supported syntax: headings, paragraphs, lists, tables, fenced code, blockquotes,
**bold**, _italic_, `code`, links, and images.
