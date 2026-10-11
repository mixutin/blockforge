// Build-time configuration (set via environment variables when running `vite build`).
// VITE_RUNTIME_URL: URL of the sandboxed player page. Default: same host, ./player/
// e.g. VITE_RUNTIME_URL=https://run.example.com/
export const RUNTIME_URL = import.meta.env.VITE_RUNTIME_URL || new URL('./player/', location.href).href;
export const RUNTIME_ORIGIN = new URL(RUNTIME_URL, location.href).origin;
