// Turn a gathered layer chain into plain named function declarations:
//   function X(){A}  const P1 = X;  X = function(){...P1()...};  const P2 = X;  X = function(){...P2()...};
// becomes
//   function P1(){A}  function P2(){...P1()...}  function X(){...P2()...}
// Only when nothing reads X (or any Pi) during page load before the chain, directly or through
// other functions, so hoisting the final version cannot change what start-up code sees.
// usage: node declify.js in.html out.html
const fs = require('fs'), espree = require('espree');
const [,, IN, OUT] = process.argv;
const html = fs.readFileSync(IN, 'utf8');
const m = /<script>([\s\S]*?)<\/script>/.exec(html);
const start = m.index + '<script>'.length, src = m[1];
const ast = espree.parse(src, {ecmaVersion: 'latest', range: true});
const body = ast.body;
function kids(n, cb) { for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && cb(c, k)); else if (v && typeof v.type === 'string') cb(v, k); } }
// function reach graph (all definitions of a name)
const fnRefs = new Map();
function addRefs(name, node) { const set = fnRefs.get(name) || new Set(); (function rec(n) { if (n.type === 'Identifier') set.add(n.name); kids(n, rec); })(node); fnRefs.set(name, set); }
(function collect(n) { if (n.type === 'FunctionDeclaration' && n.id) addRefs(n.id.name, n.body);
  if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier' && /Function/.test(n.right.type)) addRefs(n.left.name, n.right.body);
  if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && /Function/.test(n.init.type)) addRefs(n.id.name, n.init.body);
  kids(n, collect); })(ast);
const reachCache = new Map();
function reach(name) { if (reachCache.has(name)) return reachCache.get(name); const seen = new Set([name]); const st = [name];
  while (st.length) { const x = st.pop(); for (const y of fnRefs.get(x) || []) if (!seen.has(y)) { seen.add(y); st.push(y); } } reachCache.set(name, seen); return seen; }
function loadReads(stmt) { const out = new Set(); if (stmt.type === 'FunctionDeclaration') return out;
  (function rec(n, top) { if (/Function/.test(n.type) && !top) return; if (n.type === 'Identifier') out.add(n.name);
    kids(n, (c, k) => rec(c, n.type === 'CallExpression' && k === 'callee' && /Function/.test(c.type))); })(stmt, true);
  const all = new Set(out); for (const x of out) if (fnRefs.has(x)) for (const y of reach(x)) all.add(y); return all; }
const reads = body.map(loadReads);
// direct non-call uses during load (x = X, f(X), {k: X}): these save the function value itself
function captures(stmt) { const out = new Set(); if (stmt.type === 'FunctionDeclaration') return out;
  (function rec(n, parent, key, top) { if (/Function/.test(n.type) && !top) return;
    if (n.type === 'Identifier') { const called = parent && parent.type === 'CallExpression' && key === 'callee'; const typeofCheck = parent && parent.type === 'UnaryExpression' && parent.operator === 'typeof';
      const member = parent && parent.type === 'MemberExpression' && key === 'object'; if (!called && !typeofCheck && !member) out.add(n.name); return; }
    kids(n, (c, k) => rec(c, n, k, n.type === 'CallExpression' && k === 'callee' && /Function/.test(c.type))); })(stmt, null, null, true); return out; }
const capturedBefore = []; { const acc = new Set(); body.forEach((st, i) => { capturedBefore.push(new Set(acc)); for (const x of captures(st)) acc.add(x); }); }
const cumulative = []; { const acc = new Set(); body.forEach((st, i) => { cumulative.push(new Set(acc)); for (const x of reads[i]) acc.add(x); }); }

function capOf(st) { if (st.type === 'VariableDeclaration' && st.declarations.length === 1) { const d = st.declarations[0];
  if (d.id.type === 'Identifier' && d.init && d.init.type === 'Identifier') return {P: d.id.name, X: d.init.name}; } return null; }
function asgOf(st) { if (st.type === 'ExpressionStatement' && st.expression.type === 'AssignmentExpression' && st.expression.operator === '=' &&
  st.expression.left.type === 'Identifier' && st.expression.right.type === 'FunctionExpression' && !st.expression.right.id) return {X: st.expression.left.name, fn: st.expression.right}; return null; }
const countId = (node, name) => { let c = 0; (function rec(n) { if (n.type === 'Identifier' && n.name === name) c++; kids(n, rec); })(node); return c; };

const edits = []; let chains = 0, fns = 0;
for (let i = 0; i < body.length; i++) {
  const b = body[i]; if (b.type !== 'FunctionDeclaration') continue;
  const X = b.id.name;
  const parts = []; let j = i + 1;
  while (j + 1 < body.length) { const c = capOf(body[j]), a = asgOf(body[j + 1]); if (!c || !a || c.X !== X || a.X !== X) break; parts.push({cap: c, asg: a, ci: j, ai: j + 1}); j += 2; }
  if (!parts.length) continue;
  // no other definition of X anywhere else (otherwise the order of definitions matters)
  let otherDefs = 0; body.forEach((st, k) => { if (k >= i && k < j) return; const a = asgOf(st); if ((a && a.X === X) || (st.type === 'FunctionDeclaration' && st.id.name === X)) otherDefs++; });
  if (otherDefs) continue;
  const names = [X, ...parts.map(p => p.cap.P)];
  if (!process.env.FORCE && names.some(n => cumulative[i].has(n))) continue;   // used during load before the chain
  if (names.some(n => capturedBefore[i].has(n))) continue;                         // saved as a value before the chain: never
  // each Pi used only by the next layer
  let ok = true; for (const p of parts) { let uses = 0; body.forEach(st => { uses += countId(st, p.cap.P); }); if (uses !== 2) ok = false; }
  if (!ok) continue;
  // rewrite
  const t = r => src.slice(r[0], r[1]);
  const first = parts[0].cap.P;
  edits.push([b.id.range[0], b.id.range[1], first]);
  parts.forEach((p, k) => {
    const name = k + 1 < parts.length ? parts[k + 1].cap.P : X;
    const fn = p.asg.fn;
    edits.push([body[p.ci].range[0], body[p.ci].range[1], '']);
    edits.push([body[p.ai].range[0], body[p.ai].range[1], '// @chain ' + X + '\nfunction ' + name + src.slice(fn.params.length ? fn.range[0] + src.slice(fn.range[0], fn.range[1]).indexOf('(') : fn.range[0] + src.slice(fn.range[0], fn.range[1]).indexOf('('), fn.range[1])]);
    fns++;
  });
  edits.push([b.range[0], b.range[0], '// @chain ' + X + '\n']);
  chains++; i = j - 1;
}
edits.sort((a, b) => b[0] - a[0] || b[1] - a[1]);
let s = src; for (const [a, b, r] of edits) s = s.slice(0, a) + r + s.slice(b);
fs.writeFileSync(OUT, html.slice(0, start) + s + html.slice(start + src.length));
console.log('chains turned into named functions:', chains, 'functions:', fns);
