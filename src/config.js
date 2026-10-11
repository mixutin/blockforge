// Build-time configuration (set via environment variables when running `vite build`).
// VITE_RUNTIME_URL: URL of the sandboxed player page. Default: same host, ./player/
//   e.g. VITE_RUNTIME_URL=https://run.example.com/
// VITE_EMBED_RUNTIME_URL: player URL used by the embeddable page (/embed/<share-id>), which may itself be framed by
//   third-party sites. CSP frame-ancestors is checked against EVERY ancestor, so this must be a separate path on the
//   runtime origin served with `frame-ancestors *` (e.g. https://run.example.com/embed-player/), while the normal
//   runtime path stays editor-only. Must be on the same origin as VITE_RUNTIME_URL. Default: VITE_RUNTIME_URL (dev).
export const RUNTIME_URL = import.meta.env.VITE_RUNTIME_URL || new URL('./player/', location.href).href;
export const RUNTIME_ORIGIN = new URL(RUNTIME_URL, location.href).origin;
export const EMBED_RUNTIME_URL = import.meta.env.VITE_EMBED_RUNTIME_URL || RUNTIME_URL;
if (new URL(EMBED_RUNTIME_URL, location.href).origin !== RUNTIME_ORIGIN) throw new Error('VITE_EMBED_RUNTIME_URL must share the runtime origin');
