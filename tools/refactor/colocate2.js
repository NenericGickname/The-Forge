// Gather the layers of each function chain by moving them DOWN to the last layer of their
// segment. A segment ends where any other top-level statement reads the function (or one of
// the chain's saved copies) while the page loads. So every load-time use still sees exactly
// the same version of the function as before.
// usage: node colocate2.js in.html out.html
const fs = require('fs'), espree = require('espree');
const [,, IN, OUT] = process.argv;
const html = fs.readFileSync(IN, 'utf8');
const m = /<script>([\s\S]*?)<\/script>/.exec(html);
const start = m.index + '<script>'.length, src = m[1];
const ast = espree.parse(src, {ecmaVersion: 'latest', range: true});
const body = ast.body;
const chunkFrom = i => (i ? body[i - 1].range[1] : 0);

function loadIds(stmt) {
  const out = new Set();
  if (stmt.type === 'FunctionDeclaration') return out;
  (function rec(node, top) {
    if (!node || typeof node.type !== 'string') return;
    if (/Function/.test(node.type) && !top) return;
    if (node.type === 'Identifier') out.add(node.name);
    for (const k in node) { if (k === 'range') continue; const v = node[k];
      if (Array.isArray(v)) v.forEach(c => rec(c, false));
      else if (v && typeof v.type === 'string') {
        const iife = node.type === 'CallExpression' && k === 'callee' && /Function/.test(v.type);
        rec(iife ? v : v, iife);
      } }
  })(stmt, true);
  return out;
}
function classify(s) {
  if (s.type === 'FunctionDeclaration') return {kind: 'base', name: s.id.name};
  if (s.type === 'VariableDeclaration' && s.declarations.length === 1) {
    const d = s.declarations[0];
    if (d.init && d.init.type === 'Identifier' && d.id.type === 'Identifier') return {kind: 'cap', name: d.init.name, P: d.id.name};
  }
  if (s.type === 'ExpressionStatement' && s.expression.type === 'AssignmentExpression' && s.expression.operator === '=' &&
      s.expression.left.type === 'Identifier' && /Function/.test(s.expression.right.type)) return {kind: 'asg', name: s.expression.left.name};
  return null;
}
const info = body.map(classify);
const FORCE = n => { const f = process.env.FORCE || ''; return f === '*' ? true : f.split(',').includes(n); };
const directReads = body.map(loadIds);
// statements that save the function value at load time (x = X, {k: X}, f(X), X passed along): these always block
const directCapture = body.map(st => { const out = new Set(); if (st.type === 'FunctionDeclaration') return out;
  (function rec(n, parent, key, top) { if (!n || typeof n.type !== 'string') return; if (/Function/.test(n.type) && !top) return;
    if (n.type === 'Identifier') { const called = parent && parent.type === 'CallExpression' && key === 'callee';
      const typeofCheck = parent && parent.type === 'UnaryExpression' && parent.operator === 'typeof';
      const member = parent && parent.type === 'MemberExpression' && key === 'object';
      if (!called && !typeofCheck && !member) out.add(n.name); return; }
    for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => rec(c, n, k, false)); else if (v && typeof v.type === 'string') rec(v, n, k, n.type === 'CallExpression' && k === 'callee' && /Function/.test(v.type)); } })(st, null, null, true);
  return out; });
// what each function (all of its definitions) can reach when called
const fnRefs = new Map();
function addRefs(name, node) { const set = fnRefs.get(name) || new Set(); (function rec(n){ if (!n || typeof n.type !== 'string') return; if (n.type === 'Identifier') set.add(n.name);
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v.type === 'string') rec(v); } })(node); fnRefs.set(name, set); }
(function collect(n){ if (!n || typeof n.type !== 'string') return;
  if (n.type === 'FunctionDeclaration' && n.id) addRefs(n.id.name, n.body);
  if (n.type === 'AssignmentExpression' && n.left.type === 'Identifier' && /Function/.test(n.right.type)) addRefs(n.left.name, n.right.body);
  if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && /Function/.test(n.init.type)) addRefs(n.id.name, n.init.body);
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v.type === 'string') collect(v); } })(ast);
const reachCache = new Map();
function reach(name) { if (reachCache.has(name)) return reachCache.get(name); const seen = new Set([name]); const stack = [name];
  while (stack.length) { const x = stack.pop(); const r = fnRefs.get(x); if (!r) continue; for (const y of r) if (!seen.has(y)) { seen.add(y); stack.push(y); } }
  reachCache.set(name, seen); return seen; }
const reads = body.map(st => { const direct = loadIds(st); const all = new Set(direct); for (const n of direct) if (fnRefs.has(n)) for (const y of reach(n)) all.add(y); return all; });
const names = new Set(info.filter(x => x && x.kind === 'asg').map(x => x.name));
const owner = new Map(); // stmt index -> chain name
const groups = []; // {target, members}
for (const X of names) {
  const idx = []; info.forEach((x, i) => { if (x && x.name === X) idx.push(i); });
  // pair caps with the next assignment
  const caps = new Set(idx.filter(i => info[i].kind === 'cap').map(i => info[i].P));
  const isMember = new Set(idx);
  let seg = [];
  const flush = () => { if (seg.length >= 3) groups.push({X, members: seg.slice()}); seg = []; };
  for (let p = 0; p < idx.length; p++) {
    const i = idx[p];
    if (seg.length) {
      // barrier between previous member and this one?
      const prev = seg[seg.length - 1];
      let barrier = false;
      for (let j = prev + 1; j < i; j++) {
        if (isMember.has(j)) continue;
        const r = reads[j];
        const capRead = [...caps].some(c => directReads[j].has(c)) || directCapture[j].has(X);
        if (capRead) { barrier = true; break; }
        if (!FORCE(X) && (r.has(X) || [...caps].some(c => r.has(c)))) { barrier = true; break; }
      }
      if (barrier) {
        // a cap must stay with its assignment: if seg ends with a cap, it cannot be split off
        flush();
      }
    }
    seg.push(i);
  }
  flush();
}
// a group must not end with a lone cap (its assignment is after a barrier): trim
const plan = [];
const taken = new Set();
for (const g of groups) {
  while (g.members.length && info[g.members[g.members.length - 1]].kind === 'cap') g.members.pop();
  // when load-time calls were ignored, a first definition made by assignment must stay where it
  // is (moving it down would leave the name undefined for those calls)
  if (FORCE(g.X) && g.members.length && info[g.members[0]].kind === 'asg') g.members.shift();
  // leading assignment without base in segment is fine; need >= 3 statements
  if (g.members.length < 3) continue;
  if (g.members.some(i => taken.has(i))) continue;
  g.members.forEach(i => taken.add(i));
  plan.push(g);
}
const moveTo = new Map(); // target index -> list of member indices (in order)
const moved = new Set();
for (const g of plan) {
  const target = g.members[g.members.length - 1];
  moveTo.set(target, g.members);
  g.members.slice(0, -1).forEach(i => moved.add(i));
}
let out = '';
body.forEach((s, i) => {
  if (moved.has(i)) { out += src.slice(chunkFrom(i), body[i].range[0]).replace(/[^\n]/g, '').slice(0, 1); return; }
  if (moveTo.has(i)) {
    const g = moveTo.get(i);
    out += src.slice(chunkFrom(i), body[i].range[0]);
    out += '\n/* ==== ' + info[i].name + ' ==== */\n';
    g.forEach(j => { const lead = j === i ? '' : src.slice(chunkFrom(j), body[j].range[0]).trim(); out += (lead ? lead + '\n' : '') + src.slice(body[j].range[0], body[j].range[1]) + '\n'; });
    return;
  }
  out += src.slice(chunkFrom(i), s.range[1]);
});
out += src.slice(body[body.length - 1].range[1]);
fs.writeFileSync(OUT, html.slice(0, start) + out + html.slice(start + src.length));
console.log('chains gathered:', plan.length, 'statements moved:', moved.size);
console.log(plan.sort((a, b) => b.members.length - a.members.length).slice(0, 25).map(p => p.X + ':' + p.members.length).join(' '));
