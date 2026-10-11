# API guide (for scripts and AI tools)

Kindlr has a small JSON API under `/api/`. Scripts use an **API token**; the browser uses a session cookie.

## 1. Get an API token

1. Sign in and **verify your email** (tokens need a verified account).
2. Open **Sign in → account settings → API tokens**, type a name and click **Create token**.
3. Copy the token (`kl_` + 43 characters). It is shown **once** and stored only as a hash. Max 20 tokens. A password reset revokes all tokens.

Use it like this:

```text
Authorization: Bearer kl_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Tokens only work on `/api/projects*`. Every other route needs the browser session (and returns `401 API tokens can only be used with /api/projects`). Old `bf_` tokens still work.

In the examples, `$K` is your site (e.g. `https://kindlr.0x11a.org`) and `$TOKEN` your token.

## 2. Errors

Errors are JSON with an HTTP status:

```text
{"error": "Verify your email address to publish projects", "code": "unverified"}
```

| Status | Typical message |
|---|---|
| 400 | `Invalid JSON body`, `Missing project data`, validation messages |
| 401 | `Please sign in`, `Invalid API token`, `Wrong username or password` |
| 403 | `Verify your email address to …` (`code: "unverified"`), `Project limit reached (200)`, `Origin not allowed` |
| 404 | `Not found` (also for other people's projects) |
| 405 | `Method not allowed` |
| 409 | `That username is taken` |
| 413 / 415 | `Request too large` / `Expected application/json` |
| 422 | the project failed validation, e.g. `Unknown block “foo”: this project uses a block that Kindlr doesn't have` |
| 429 | rate limits (resend, email change) |

Request bodies must be `Content-Type: application/json`. Cookie-based writes also need an allowed `Origin` header; bearer requests don't.

## 3. Projects (token or session)

```bash
# list my projects
curl -s $K/api/projects -H "Authorization: Bearer $TOKEN"
# → {"projects":[{"id":"…","name":"…","is_public":false,"share_id":null,"description":"","notes":"","updated_at":1760000000000}]}

# read one (data is the .kindlr project JSON as a string)
curl -s $K/api/projects/PROJECT_ID -H "Authorization: Bearer $TOKEN"

# create  → 201 {"id":"…"}
curl -s -X POST $K/api/projects -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My game","data":"<project JSON as a string>","description":"","notes":""}'

# replace name + data (+ optional description/notes)
curl -s -X PUT $K/api/projects/PROJECT_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"My game","data":"<project JSON as a string>"}'

# change only name / description / notes
curl -s -X PATCH $K/api/projects/PROJECT_ID -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"description":"A clicker game"}'

# delete
curl -s -X DELETE $K/api/projects/PROJECT_ID -H "Authorization: Bearer $TOKEN"

# publish (verified accounts; confirm must be true)  → {"id","is_public":true,"share_id","url"}
curl -s -X POST $K/api/projects/PROJECT_ID/share -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"public":true,"confirm":true,"title":"My game","description":"…","notes":"Press Ignite"}'

# unpublish (old link dies for good)
curl -s -X DELETE $K/api/projects/PROJECT_ID/share -H "Authorization: Bearer $TOKEN"
```

Limits: 200 projects per user; project JSON ≤ 5 MB; description ≤ 1000, notes ≤ 5000 characters.

## 4. Public routes (no auth)

```bash
curl -s "$K/api/explore?page=1&per=24"        # newest public projects, has_more for paging (per ≤ 48)
curl -s $K/api/shared/SHARE_ID                 # a public project (title, author, description, notes, data)
curl -s $K/api/embed/SHARE_ID                  # data for the embed player; ignores cookies/tokens
curl -s $K/api/health                          # {"ok":true}
```

Public responses carry an `ETag` and answer `304` to `If-None-Match`. `POST /api/shared/SHARE_ID/remix` (signed in) copies a public project into your account.

## 5. Account routes (browser session only)

`POST /api/signup {username,email,password}`, `POST /api/login {username,password}`, `POST /api/logout`, `GET /api/me`, `POST /api/verify {token}`, `POST /api/verify/resend`, `POST /api/password/forgot {email}`, `POST /api/password/reset {token,password}`, `POST /api/account/password {current_password,new_password}`, `POST /api/account/email {email,password}`, `POST /api/account/delete {password,confirm:<username>}`, `GET/POST /api/tokens`, `DELETE /api/tokens/{id}`. The full schema is in `openapi.yaml` on the site.

## 6. The project format

`data` is a JSON string like this (the first target must be the Stage):

```text
{
  "format": "kindlr", "version": 1, "name": "My game", "monitors": [], "storage": {},
  "targets": [
    { "name": "Stage", "isStage": true, "x": 0, "y": 0, "direction": 90, "size": 100, "visible": true, "costume": 0,
      "rotationStyle": "all around", "layer": 0, "volume": 100, "tempo": 90,
      "variables": { "score": 0 }, "lists": {}, "costumes": [ <costume> ], "scripts": [ <script> ] },
    { "name": "Sparky", "isStage": false, ... same fields ... }
  ]
}
```

- A **costume** is `{ "name", "src": "data:image/svg+xml;…" or png/jpeg/gif/webp data URL, "w", "h", "cx", "cy" }`. Only embedded `data:image` URLs are allowed.
- A **script** is `{ "x", "y", "blocks": [ … ] }`; a **block** is `{ "op": "mo_move", "args": ["10"] }`, C blocks add `"body"` (and `"body2"` for else). The `op` names are in [mapping.md](mapping.md).
- The server validates everything (op allow-list, sizes, names) and answers `422` with the reason.

## 7. Creating a project from Kindlr Script

There is **no server endpoint that takes Kindlr Script text, and no separate validate endpoint** (TODO: confirm if one is planned). Convert the text with the open-source parser (`src/kls.js` in the Kindlr repo), then upload JSON. `parseKls` throws the same errors as the editor, so it is also your validator. Costumes are easiest to copy from an existing project (e.g. one you downloaded as `.kindlr`).

```js
// node make.mjs  (run inside a checkout of github.com/mixutin/kindlr, Node 22)
import fs from 'node:fs';
import { parseKls } from './src/kls.js';
import { validateProject } from './src/limits.js';

const base = JSON.parse(fs.readFileSync('template.kindlr', 'utf8'));   // a project with Stage + one sprite
const code = fs.readFileSync('sparky.kls', 'utf8');
base.targets[1].scripts = parseKls(code).map((s, i) => ({ x: 24, y: 24 + i * 200, ...s }));   // throws "Line N: …" on errors
base.name = 'Made by a script';
const data = JSON.stringify(validateProject(base));                     // same checks as the server

const r = await fetch(process.env.K + '/api/projects', { method: 'POST',
  headers: { Authorization: 'Bearer ' + process.env.TOKEN, 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: base.name, data }) });
console.log(r.status, await r.json());
```

Variables used in the script should exist in `variables` / `lists` (the editor creates them automatically on **Apply to blocks**; the runtime also creates missing ones on the Stage when they are first used).
