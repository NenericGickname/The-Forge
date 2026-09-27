#!/usr/bin/env bash
# Regression test: plays scripted sessions with fixed dice rolls in the ORIGINAL game
# (archive/) and in the CURRENT build (game/), then compares game state, screen text and
# screenshots. Output "IDENTICAL" means nothing changed. Any difference is listed.
# Usage (from the repo root):  bash tools/test/regress.sh
set -e
cd "$(dirname "$0")"
[ -d node_modules ] || { npm install --silent; npx playwright install chromium; }
mkdir -p www
python3 - <<'PY'
import re, sys, os
sys.path.insert(0, '..'); import build
silent = lambda s: re.sub(r'src="(?:audio/[^"]+\.mp3|data:audio/mpeg;base64,[A-Za-z0-9+/=]+)"', 'src="silent.mp3"', s)
open('www/base.html', 'w', encoding='utf-8').write(silent(open('../../archive/The_Forge_reference.html', encoding='utf-8').read()))
open('www/current.html', 'w', encoding='utf-8').write(silent(build.assemble()))
PY
export PORT=$(python3 -c "import socket;s=socket.socket();s.bind(('',0));print(s.getsockname()[1])")
(cd www && exec python3 -m http.server $PORT >/dev/null 2>&1) &
SERVER=$!; sleep 1
rm -rf out_base out_current
node harness.js base.html out_base > /dev/null & A=$!
node harness.js current.html out_current > /dev/null
wait $A
node compare.js out_base out_current
kill $SERVER 2>/dev/null || true
