#!/usr/bin/env bash
# Full restructuring pipeline: www/final.html -> www/P_final.html (+ intermediate files in /tmp/claude-0/p)
set -e
D=/tmp/claude-0/p; mkdir -p $D
node unify.js www/final.html $D/a1.html > /dev/null
node presplit.js $D/a1.html $D/a2.html > /dev/null
node hoistdata.js $D/a2.html $D/a3.html > /dev/null
cp $D/a3.html $D/b0.html
for i in 1 2 3; do FORCE='*' node colocate2.js $D/b$((i-1)).html $D/b${i}g.html > /dev/null; node merge2.js $D/b${i}g.html $D/b$i.html; done
node normalize.js $D/b3.html $D/c1.html
node unify.js $D/c1.html $D/c2.html > /dev/null
cp $D/c2.html $D/d0.html
for i in 1 2 3; do FORCE='*' node colocate2.js $D/d$((i-1)).html $D/d${i}g.html > /dev/null; node merge2.js $D/d${i}g.html $D/d$i.html; done
node flatten.js $D/d3.html $D/e0.html
FORCE=1 node declify.js $D/e0.html $D/e1.html
node renames.js $D/e1.html $D/e2.html ../repo/mobile.js ../repo/landscape.js harness.js quick.js | head -1
cp $D/e2.html www/P_final.html
node lc.js www/P_final.html
