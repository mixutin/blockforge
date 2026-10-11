# Security model

## Language and interpreter
- Blocks and Ember text both produce the same JSON block tree. A single **tree-walking interpreter** (`src/runtime.js`) executes it. No code is ever generated, `eval`'d, or passed to `Function`.
- Ember identifiers can only name built-in blocks, your own `define`d blocks, or inputs. Unknown names are parse errors. `eval(...)` in Ember is only a wrapper for showing a single reporter expression, and it never executes text.
- The interpreter is cooperative: every loop iteration yields, a per-frame step budget (`maxOpsPerFrame`) forces yields even inside `define!` blocks, no-refresh bursts are capped at 500 ms, recursion depth is capped, and a watchdog stops the project if a single step blocks for more than 1 s. The **Stop** button always works.
- Memory caps: list length, string length, map size, clone count, thread count, widget count, draw commands per frame. See `src/limits.js`.

## Input validation (client and server)
`validateProject()` in `src/limits.js` is used by the editor (open file, cloud load, shared links), by the sandboxed player, and by the server before storing anything. It enforces size, depth, block count, sprites, variables, list lengths and string lengths. It also requires costumes to be embedded `data:image/...` URLs, so remote and `javascript:` URLs are rejected.

## Sandboxed player
- Untrusted projects (share links) open in `player/index.html` inside `<iframe sandbox="allow-scripts">`, **never** with `allow-same-origin`. The frame runs in an opaque origin and cannot read editor cookies, localStorage, or DOM.
- Recommended deployment: serve the player from its own origin (e.g. `run.example.com`). It's configured at build time with `VITE_RUNTIME_URL` (editor) and `PLAYER_EDITOR_ORIGINS` (player allow-list).
- Player CSP: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'`, sent as a header plus `frame-ancestors <editor origin>` (header only; it is ignored in `<meta>`). WebAudio and canvas need no CSP exceptions. The player is built as a classic (non-module) script so it loads in an opaque origin without CORS.
- **postMessage protocol.** The player sends exactly one message, `{type:'bf-hello', v:1}`, to the parent with `targetOrigin` set to the allow-listed editor origin (never `'*'`), and transfers a `MessagePort`. The editor accepts it only if `event.source` is its own iframe, `event.origin` is `"null"` (the opaque sandbox origin) or the configured runtime origin, and the schema matches exactly. All later traffic uses that private port, so no `targetOrigin` is needed.
  - Editor → player: `load {project: string ≤ 5 MB}`, `ignite`, `stop`. The player schema-checks each message and re-validates the project.
  - Player → editor: `loaded`, `error {message ≤ 300}`, `toast {message ≤ 300}`, `store {key ≤ 120, value: primitive}`. The editor schema-checks each one, and storage writes are only accepted for the user's own current project.
  - Only project JSON crosses the boundary. No cookies, tokens, or account data are sent to the frame.

## Server
- Auth endpoints are exactly `POST /api/signup`, `POST /api/login`, `POST /api/logout` (rate-limit these at the proxy). All other routes are under `/api/`.
- Passwords are hashed with bcrypt (cost 12). Login timing is equalised with a dummy hash.
- Sessions use 256-bit random tokens, and only their SHA-256 is stored. Cookie: `__Host-blocks_session`, `Secure; HttpOnly; SameSite=Strict; Path=/`, no `Domain`. `BLOCKS_DEV=1` switches to `blocks_session` without `Secure`, for plain-http local development only.
- CSRF: SameSite=Strict, plus an `Origin` check (`ALLOWED_ORIGIN`) on every state-changing request.
- Body size limits (10 KB auth, ~5.1 MB projects), strict JSON content type, `no-store` caching, `nosniff`.
- Project access is owner-only. Shared projects are read-only through `/api/shared/:id`.
