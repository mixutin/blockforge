# Security model

## Language and interpreter
- Kindlr Blocks and Kindlr Script both produce the same JSON block tree. A single **tree-walking interpreter** (`src/runtime.js`) executes it. No code is ever generated, `eval`'d, or passed to `Function`.
- **Op allow-list.** Every block `op` must be one of the block definitions in `src/blocks.js` (`isKnownOp`, backed by a `Set`). `validateProject()` / `validateScripts()` reject anything else (for example `__proto__`, `constructor`, `toString` or made-up ops) with a clear "Unknown block" error. The same check runs in the Kindlr Script parser, on JSON import, in the sandboxed player and on the server (API).
- **No prototype lookups.** `DEFS` is a frozen null-prototype object. The interpreter dispatches through `Map`s built from its own op tables, so an op can never resolve to an inherited function. Variables, lists, effects, project storage and maps are null-prototype dictionaries. All reads use `hasOwnProperty` (`src/safe.js`: `has`/`get`), and all writes use `Object.defineProperty` (`put`), so keys like `__proto__`, `constructor` or `toString` are plain data. The names `__proto__`, `constructor` and `prototype` are reserved and rejected for variables, lists, sprites, costumes, custom blocks, parameters and storage keys. Map keys created at runtime may be anything and are stored safely.
- Kindlr Script identifiers can only name built-in blocks, your own `define`d blocks, or inputs. Unknown names are parse errors. `eval(...)` in Kindlr Script is only a wrapper for showing a single reporter expression, and it never executes text.
- The interpreter is cooperative: every loop iteration yields, a per-frame step budget (`maxOpsPerFrame`) forces yields even inside `define!` blocks, no-refresh bursts are capped at 500 ms, recursion depth is capped, and a watchdog stops the project if a single step blocks for more than 1 s. The **Stop** button always works.
- Memory caps: list length, string length, map size, clone count, thread count, widget count, draw commands per frame. See `src/limits.js`.
- Tests: `tests/limits.test.mjs` (allow-list, reserved names, sizes), `tests/proto.test.mjs` (runtime prototype safety), `server/test.mjs` (the same checks through the API).

## Input validation (client and server)
`validateProject()` in `src/limits.js` is used by the editor (open file, cloud load, shared links), by the sandboxed player, and by the server before storing anything. It enforces size, depth, block count, sprites, variables, list lengths and string lengths, plus the op allow-list and reserved names. It also requires costumes to be embedded `data:image/...` URLs, so remote and `javascript:` URLs are rejected.

## Sandboxed player
- Untrusted projects (share links, Explore, embeds) run in `player/index.html` inside `<iframe sandbox="allow-scripts">`, **never** with `allow-same-origin`. The frame runs in an opaque origin and cannot read editor cookies, localStorage, or DOM.
- Recommended deployment: serve the player from its own origin (e.g. `run.example.com`). It's configured at build time with `VITE_RUNTIME_URL` (editor) and `PLAYER_EDITOR_ORIGINS` (player allow-list).
- Player CSP: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'none'; base-uri 'none'; form-action 'none'`, sent as a header plus `frame-ancestors <editor origin>` (header only; it is ignored in `<meta>`). WebAudio and canvas need no CSP exceptions. The player is built as a classic (non-module) script so it loads in an opaque origin without CORS.
- **Framing policy.** Every Kindlr page and API response sends `X-Frame-Options: DENY` and `frame-ancestors 'none'`. The one exception is the dedicated embed route **`/embed/<share-id>`**, which sends `frame-ancestors *` and no X-Frame-Options. Old `/embed?id=…` URLs are not framable.
- **Embed page.** `/embed/<share-id>` plays a public project and nothing else. It reads and sends no cookies: its only request is `fetch('/api/embed/<id>', { credentials: 'omit' })`, and the server handles `/api/embed/*` *before* any cookie or bearer parsing, so a session is ignored even if one is sent. It has no login, save, or editor actions, and no remix POST: "Remix on Kindlr" is a `target=_blank rel=noopener` link to the project page.
- **Embed player path (the one runtime CSP adjustment).** CSP `frame-ancestors` checks *every* ancestor. A player nested in `/embed/<id>` on a third-party site would therefore be blocked by the runtime's `frame-ancestors <editor origin>`. So embeds use a separate entry path on the runtime origin, `VITE_EMBED_RUNTIME_URL` (e.g. `https://run.example.com/embed-player/`), served with `frame-ancestors *`. Everything else in its CSP is identical (`default-src 'none'`, `connect-src 'none'`), the iframe sandbox is still `allow-scripts` only, and the player still talks only to a direct parent whose origin is the allow-listed editor (checked with `location.ancestorOrigins`). Framed directly by any other site, it refuses to handshake. The normal runtime path keeps `frame-ancestors <editor origin>`.
- **Verification.** `deploy/check-headers.sh` checks each path's headers with curl. `tests/run-embed-xorigin.sh` starts real nginx with `deploy/nginx.example.conf` and runs Playwright from a third-party origin: the embed plays; the editor, project page, legacy embed URL and normal runtime path are blocked from framing; the embed sends no cookie; and it makes exactly one GET.
- **postMessage protocol.** The player sends exactly one message, `{type:'bf-hello', v:1}`, to the parent with `targetOrigin` set to the allow-listed editor origin (never `'*'`), and transfers a `MessagePort`. The editor accepts it only if `event.source` is its own iframe, `event.origin` is `"null"` (the opaque sandbox origin) or the configured runtime origin, and the schema matches exactly. All later traffic uses that private port, so no `targetOrigin` is needed. (The `bf-` prefix is kept from the old name for compatibility.)
  - Editor → player: `load {project: string ≤ 5 MB}`, `ignite`, `stop`. The player schema-checks each message and re-validates the project.
  - Player → editor: `loaded`, `error {message ≤ 300}`, `toast {message ≤ 300}`, `store {key ≤ 120, value: primitive}`. The editor schema-checks each one, and storage writes are only accepted for the user's own current project.
  - Only project JSON crosses the boundary. No cookies, tokens, or account data are sent to the frame.

## Accounts and sessions
- Auth endpoints are exactly `POST /api/signup`, `POST /api/login`, `POST /api/logout`. All other routes are under `/api/`. Rate-limit the auth-like routes at the proxy (see "Rate limits").
- Passwords are hashed with bcrypt (cost 12). Login timing is equalised with a dummy hash.
- Sessions use 256-bit random tokens, and only their SHA-256 is stored. Cookie: `__Host-blocks_session`, `Secure; HttpOnly; SameSite=Strict; Path=/`, no `Domain`. `BLOCKS_DEV=1` switches to `blocks_session` without `Secure`, for plain-http local development only.
- CSRF: SameSite=Strict, plus an `Origin` check (`ALLOWED_ORIGIN`) on every state-changing cookie request.
- Body size limits (10 KB auth, ~5.1 MB projects), strict JSON content type, `no-store` caching, `nosniff`.

## Email verification and password reset
- Tokens are **32 random bytes** (base64url, 43 chars). Only their SHA-256 is stored, in `email_tokens`.
- They are **single-use**: they're consumed with an atomic `DELETE … RETURNING`, so a token is gone even if it turns out to be expired.
- Verification links expire after **24 h**, reset links after **1 h**. A newer verification link invalidates older ones, and a verification link only works for the email address it was sent to.
- **Unverified accounts** can sign in, use the editor and save private projects, but can't publish/share (`403 code: unverified`) or create API tokens. Changing the email address makes the account unverified again, and a notice goes to the old (verified) address.
- **Resend** is limited to 3 per hour per account (`429`). Reset mails are silently throttled to 3 per hour per account, and email changes to 3 per hour.
- **No account enumeration:** `POST /api/password/forgot` returns the same status, body and headers for every well-formed address. Mail is sent asynchronously, so response time doesn't depend on whether an account exists (the tests check bodies, headers and timing). Email addresses aren't unique across accounts, so signup doesn't reveal them either; a reset mail goes to each account (max 5) that uses the address.
- A successful **reset** sets the new password, deletes **all sessions and API tokens** of the account, and kills every other outstanding reset link. **Changing the password** while signed in signs out all other sessions.
- The verify and reset pages take the token from the URL and immediately remove it from the address bar (`history.replaceState`). They send `Referrer-Policy: no-referrer`, and verification needs a button click, so mail scanners that prefetch links can't use up the token.
- Mail goes through a local MTA on loopback (`SMTP_HOST=127.0.0.1`, port 25, no auth, no STARTTLS on loopback), via nodemailer with file and URL access disabled. In dev mode (`BLOCKS_DEV=1` or `MAIL_TRANSPORT=log`), links are printed to stdout instead.

## Sharing
- A share ID is a **separate random token**: 16 bytes (128 bits) from `crypto.randomBytes`, base64url (22 chars). It isn't derived from the project id or user id and isn't sequential. It's stored in its own unique column, and `/api/shared/:id` only accepts that format.
- Publishing needs a verified email and an explicit `confirm: true`. The UI also asks for a checkbox plus a second click ("Make public…" → "Yes, publish now").
- **Unshare** (`DELETE /api/projects/:id/share`) clears the share ID, so the old link, embeds and QR codes die for good. Sharing again issues a fresh ID.
- Public pages (project page, Explore, embed) render all user text (title, author, description, notes) with `textContent`. QR codes are generated in the browser, with no external services.
- **Remix** copies a public project into the signed-in user's account as a new private project.

## Saving safely (editor)
- The editor remembers which cloud project it is showing (`kindlr.cloudref.v1`: id, name, owner). That link is **cleared** by every load that isn't "open my own cloud project": New, Open file, examples, See inside, shared/remix views, sign-out or a different account. So **Save** can't overwrite an unrelated cloud project or its public share.
- Before overwriting a linked project whose title differs from the current one, the editor asks: Overwrite / **Save as new** / Cancel. **Save as new** is also always available in My projects.
- The server checks ownership on every read, update, publish, unshare and delete (`WHERE id = ? AND user_id = ?`). Another user's id returns `404`.

## API tokens
- Created only by verified accounts. The format is `kl_` + 32 random bytes, shown once and stored as SHA-256. `bf_` tokens from before the rename still work.
- Accepted only as `Authorization: Bearer …` on `/api/projects*`. Account routes need the cookie session. Bearer requests skip the Origin check because browsers can't send that header cross-site without CORS (which the API doesn't offer).
- Max 20 per account. They can be revoked in Account settings and are revoked automatically by a password reset.

## Rate limits (proxy)
Use the strict auth zone (`burst=5`) for: `/api/login`, `/api/signup`, `/api/password/forgot`, `/api/password/reset`, `/api/verify`, `/api/verify/resend`, `/api/account/password`, `/api/account/email`, `/api/account/delete`. Use the general API zone for everything else under `/api/`. The server keeps its own per-account limits for mail as well.
