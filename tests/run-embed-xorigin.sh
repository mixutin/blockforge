#!/usr/bin/env bash
# End-to-end check of the embed security design with real nginx (needs nginx installed, no root):
# builds a test dist, starts the API + nginx from deploy/nginx.example.conf, publishes a project, then runs
# deploy/check-headers.sh and tests/embed-xorigin.mjs (third-party origin framing /embed/<id>).
set -euo pipefail
cd "$(dirname "$0")/.."; W="${W:-/tmp/kindlr-xo}"; NGINX="${NGINX:-$(command -v nginx || echo /usr/sbin/nginx)}"
rm -rf "$W"; mkdir -p "$W"
VITE_RUNTIME_URL=http://run.example.com:8088/ VITE_EMBED_RUNTIME_URL=http://run.example.com:8088/embed-player/ \
  PLAYER_EDITOR_ORIGINS=http://editor.example.com:8088 npx vite build --outDir "$W/www" --emptyOutDir --logLevel warn
python3 tests/ngx-local.py "$W"
(cd server && PORT=18795 DB_PATH="$W/x.db" ALLOWED_ORIGIN=http://editor.example.com:8088 PUBLIC_URL=http://editor.example.com:8088 MAIL_TRANSPORT=log node index.js > "$W/api.log" 2>&1 & echo $! > "$W/api.pid")
"$NGINX" -c "$W/nginx.conf" -p "$W" 
trap '"$NGINX" -s stop -c "$W/nginx.conf" -p "$W" 2>/dev/null || true; kill $(cat "$W/api.pid") 2>/dev/null || true' EXIT
sleep 1
SID=$(DB="$W/x.db" API=http://127.0.0.1:18795 ORIGIN=http://editor.example.com:8088 node tests/mkshare.mjs)
CURL_EXTRA="--resolve editor.example.com:8088:127.0.0.1 --resolve run.example.com:8088:127.0.0.1 --resolve old.example.com:8088:127.0.0.1" \
  bash deploy/check-headers.sh http://editor.example.com:8088 http://run.example.com:8088 http://old.example.com:8088 "$SID" | tail -1
ED_HOST=editor.example.com RUN_HOST=run.example.com SID="$SID" THIRD="$W/third" node tests/embed-xorigin.mjs
