#!/usr/bin/env bash
# Verify the Kindlr nginx response headers against the expected set for each path.
# Usage: ./check-headers.sh [EDITOR_BASE] [RUN_BASE] [OLD_BASE] [SHARE_ID]
#   defaults: https://editor.example.com https://run.example.com https://old.example.com
#   SHARE_ID: a real public share id makes /embed/<id> and /api/embed/<id> return 200 (optional).
set -u
ED="${1:-https://editor.example.com}"; RUN="${2:-https://run.example.com}"; OLD="${3:-https://old.example.com}"; SID="${4:-AAAAAAAAAAAAAAAAAAAAAA}"
CURL=(curl -sS -o /dev/null -D - --max-time 15 ${CURL_EXTRA:-})
pass=0; fail=0
hdrs() { "${CURL[@]}" "$1" | tr -d '\r'; }
hv() { printf '%s\n' "$1" | awk -v k="$(echo "$2" | tr A-Z a-z)" 'BEGIN{FS=": "} tolower($1)==k { sub(/^[^:]*: /, ""); print }'; }
status() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$1" | tail -1; }
code() { local c; c="$(status "$2")"; if [[ "$c" == "$3" ]]; then ok "$1: HTTP $c"; else bad "$1: HTTP $c (expected $3)"; fi; }
if [[ -t 1 ]]; then G=$'[32m'; Rd=$'[31m'; N=$'[0m'; else G=; Rd=; N=; fi
ok() { pass=$((pass+1)); printf '  %sok%s   %s\n' "$G" "$N" "$1"; }
bad() { fail=$((fail+1)); printf '  %sFAIL%s %s\n' "$Rd" "$N" "$1"; }
expect() { # name headers header regex
  local v; v="$(hv "$2" "$3")"
  if [[ -n "$v" && "$v" =~ $4 ]]; then ok "$1: $3"; else bad "$1: $3 = '${v}' (expected /$4/)"; fi; }
absent() { local v; v="$(hv "$2" "$3")"; if [[ -z "$v" ]]; then ok "$1: no $3"; else bad "$1: unexpected $3: $v"; fi; }
once() { local n; n="$(printf '%s\n' "$2" | grep -ic "^$3:")"; if [[ "$n" == 1 ]]; then ok "$1: $3 sent once"; else bad "$1: $3 sent $n times"; fi; }
common() { expect "$1" "$2" Strict-Transport-Security 'max-age=[0-9]+'; expect "$1" "$2" X-Content-Type-Options '^nosniff$'
  expect "$1" "$2" Referrer-Policy '^no-referrer$'; expect "$1" "$2" Permissions-Policy 'camera=\(\)'; once "$1" "$2" X-Content-Type-Options; }
noframe() { expect "$1" "$2" X-Frame-Options '^DENY$'; expect "$1" "$2" Content-Security-Policy "frame-ancestors 'none'"; }

check_page() { local name="$1" url="$2" h; echo "$name  ($url)"; h="$(hdrs "$url")"; common "$name" "$h"; noframe "$name" "$h"; }
for p in / /index.html /explore /docs /verify /reset /p /this-page-does-not-exist; do check_page "editor $p" "$ED$p"; done
for p in / /explore /docs /verify /reset /p /favicon.svg /llms.txt; do code "editor $p" "$ED$p" 200; done
code "editor unknown path" "$ED/this-page-does-not-exist" 404
code "editor /player/ (only on runtime host)" "$ED/player/" 404

echo "editor /assets/*"; A="$(curl -sS --max-time 15 ${CURL_EXTRA:-} "$ED/" | grep -oE '(\./|/)assets/[^"]+\.js' | head -1 | sed 's#^\./#/#')"
if [[ -n "$A" ]]; then h="$(hdrs "$ED$A")"; common "assets" "$h"; noframe "assets" "$h"; expect "assets" "$h" Cache-Control 'immutable'; else bad "no /assets/*.js found in index.html"; fi

echo "editor /api/*"; for p in /api/health /api/me /api/explore "/api/embed/$SID"; do
  h="$(hdrs "$ED$p")"; common "api $p" "$h"; noframe "api $p" "$h"; done
h="$(hdrs "$ED/api/me")"; expect "api /api/me" "$h" Cache-Control '^no-store$'

echo "editor /embed/<share-id>  (the only framable page)"; h="$(hdrs "$ED/embed/$SID")"; code "embed /embed/<id>" "$ED/embed/$SID" 200
common "embed" "$h"; absent "embed" "$h" X-Frame-Options; expect "embed" "$h" Content-Security-Policy 'frame-ancestors \*'
expect "embed" "$h" Content-Security-Policy "frame-src $RUN"; absent "embed" "$h" Set-Cookie
h="$(hdrs "$ED/embed")"; noframe "editor /embed (no id)" "$h"

echo "runtime /"; h="$(hdrs "$RUN/")"; common "run /" "$h"; absent "run /" "$h" X-Frame-Options
expect "run /" "$h" Content-Security-Policy "connect-src 'none'"; expect "run /" "$h" Content-Security-Policy "frame-ancestors $ED\$"
echo "runtime /embed-player/"; h="$(hdrs "$RUN/embed-player/")"; common "run /embed-player/" "$h"; absent "run /embed-player/" "$h" X-Frame-Options
expect "run /embed-player/" "$h" Content-Security-Policy "connect-src 'none'"; expect "run /embed-player/" "$h" Content-Security-Policy 'frame-ancestors \*'
code "run /" "$RUN/" 200; code "run /player.js" "$RUN/player.js" 200; code "run /embed-player/" "$RUN/embed-player/" 200
  code "run /embed-player/player.js" "$RUN/embed-player/player.js" 200; code "run /embed-player/player.css" "$RUN/embed-player/player.css" 200
  code "run /embed-player/nope.js" "$RUN/embed-player/nope.js" 404
  h="$(hdrs "$RUN/embed-player/player.js")"; expect "run /embed-player/player.js" "$h" Content-Type 'javascript'
h="$("${CURL[@]}" -w '%{http_code}' "$RUN/api/health" | tail -1)"; [[ "$h" == 404 ]] && ok "run /api/* → 404" || bad "run /api/* returned $h"

if [[ -n "$OLD" && "$OLD" != "-" ]]; then echo "old domain"; h="$(hdrs "$OLD/verify?token=x")"
  expect "old" "$h" Location "^$ED/verify\\?token=x$"; printf '%s\n' "$h" | head -1 | grep -q ' 301' && ok "old: 301" || bad "old: not a 301"; fi

echo; echo "$pass passed, $fail failed"; [[ $fail == 0 ]]
