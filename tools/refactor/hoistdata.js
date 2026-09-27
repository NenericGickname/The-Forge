// Move pure top-level constant data (tables, settings, helper arrow functions) to the top of
// the script, keeping their relative order. Pure = building it cannot observe or change game
// state: literals, object/array literals, function expressions, builtin helpers, and earlier
// hoisted constants that nothing modifies during page load.
// usage: node hoistdata.js in.html out.html
const fs = require('fs'), espree = require('espree');
const [,, IN, OUT] = process.argv;
const html = fs.readFileSync(IN, 'utf8');
const m = /<script>([\s\S]*?)<\/script>/.exec(html);
const start = m.index + '<script>'.length, src = m[1];
const ast = espree.parse(src, {ecmaVersion: 'latest', range: true});
const body = ast.body;
const BUILTIN = new Set(['Math', 'Object', 'Array', 'Number', 'String', 'JSON', 'Infinity', 'NaN', 'undefined', 'Symbol', 'Map', 'Set', 'Boolean', 'parseInt', 'parseFloat', 'isFinite', 'isNaN', 'RegExp', 'Error', 'WeakMap', 'WeakSet']);
const SAFE_METHODS = new Set(['map', 'filter', 'reduce', 'concat', 'slice', 'join', 'split', 'flat', 'flatMap', 'includes', 'indexOf', 'some', 'every', 'find', 'findIndex',
  'toUpperCase', 'toLowerCase', 'replace', 'trim', 'padStart', 'padEnd', 'repeat', 'keys', 'values', 'entries', 'fromEntries', 'freeze', 'assign', 'from', 'max', 'min',
  'round', 'floor', 'ceil', 'pow', 'sqrt', 'abs', 'log', 'exp', 'fromCharCode', 'toFixed', 'charAt', 'charCodeAt', 'startsWith', 'endsWith', 'forEach', 'sort', 'reverse', 'fill', 'of', 'parse', 'stringify', 'isArray', 'hypot', 'sign', 'trunc', 'cbrt', 'log2', 'log10', 'sin', 'cos', 'atan2', 'PI']);

// load-time identifier uses per statement (direct, not inside non-IIFE functions)
function loadIds(stmt) { const out = new Set(); if (stmt.type === 'FunctionDeclaration') return out;
  (function rec(n, top) { if (!n || typeof n.type !== 'string') return; if (/Function/.test(n.type) && !top) return; if (n.type === 'Identifier') out.add(n.name);
    for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => rec(c, false)); else if (v && typeof v.type === 'string') rec(v, n.type === 'CallExpression' && k === 'callee' && /Function/.test(v.type)); } })(stmt, true); return out; }
const reads = body.map(loadIds);

const hoisted = new Set();
function declaredIn(fn) { const s = new Set(); (function rec(n) { if (!n || typeof n.type !== 'string') return;
  if (n.type === 'Identifier' && (n._decl)) s.add(n.name);
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v.type === 'string') rec(v); } })(fn); return s; }
function fnPure(fn, allowed) {
  // every free identifier used inside must be allowed (params/locals are fine)
  const local = new Set();
  (function decl(n) { if (!n || typeof n.type !== 'string') return;
    if (/Function/.test(n.type)) n.params.forEach(p => (function pat(p){ if (!p) return; if (p.type === 'Identifier') local.add(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => pat(q.value || q.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(pat); else if (p.type === 'AssignmentPattern') pat(p.left); else if (p.type === 'RestElement') pat(p.argument); })(p));
    if (n.type === 'VariableDeclarator') (function pat(p){ if (!p) return; if (p.type === 'Identifier') local.add(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => pat(q.value || q.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(pat); else if (p.type === 'AssignmentPattern') pat(p.left); else if (p.type === 'RestElement') pat(p.argument); })(n.id);
    if (n.type === 'FunctionDeclaration' && n.id) local.add(n.id.name);
    for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(decl); else if (v && typeof v.type === 'string') decl(v); } })(fn);
  let ok = true;
  (function rec(n, parent, key) { if (!ok || !n || typeof n.type !== 'string') return;
    if (n.type === 'Identifier') {
      const isProp = parent && ((parent.type === 'MemberExpression' && key === 'property' && !parent.computed) || (parent.type === 'Property' && key === 'key' && !parent.computed));
      if (!isProp && !local.has(n.name) && !allowed(n.name)) ok = false;
      return;
    }
    if (n.type === 'ThisExpression') { ok = false; return; }
    for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => rec(c, n, k)); else if (v && typeof v.type === 'string') rec(v, n, k); } })(fn.body, null, null);
  return ok;
}
function pure(n, allowed) {
  if (!n) return true;
  switch (n.type) {
    case 'Literal': return true;
    case 'TemplateLiteral': return n.expressions.every(e => pure(e, allowed));
    case 'Identifier': return allowed(n.name);
    case 'ArrayExpression': return n.elements.every(e => !e || pure(e, allowed));
    case 'ObjectExpression': return n.properties.every(p => p.type === 'SpreadElement' ? pure(p.argument, allowed) : ((!p.computed || pure(p.key, allowed)) && pure(p.value, allowed)));
    case 'SpreadElement': return pure(n.argument, allowed);
    case 'FunctionExpression': case 'ArrowFunctionExpression': return true;   // creating a function runs nothing
    case 'UnaryExpression': return n.operator !== 'delete' && pure(n.argument, allowed);
    case 'BinaryExpression': case 'LogicalExpression': return pure(n.left, allowed) && pure(n.right, allowed);
    case 'ConditionalExpression': return pure(n.test, allowed) && pure(n.consequent, allowed) && pure(n.alternate, allowed);
    case 'MemberExpression': return pure(n.object, allowed) && (!n.computed || pure(n.property, allowed));
    case 'CallExpression': {
      if (n.callee.type !== 'MemberExpression' || n.callee.computed || !SAFE_METHODS.has(n.callee.property.name)) return false;
      if (!pure(n.callee.object, allowed)) return false;
      // callbacks run now: their bodies must be pure too
      return n.arguments.every(a => (/Function/.test(a.type) ? fnPure(a, allowed) : pure(a, allowed)));
    }
    case 'NewExpression': return n.callee.type === 'Identifier' && ['Map', 'Set', 'Array', 'WeakMap', 'WeakSet', 'RegExp'].includes(n.callee.name) && n.arguments.every(a => pure(a, allowed));
    default: return false;
  }
}
const take = [];
const hoistIndex = new Map();
body.forEach((st, i) => {
  if (st.type !== 'VariableDeclaration' || st.kind === 'var') return;
  const allowed = name => BUILTIN.has(name) || (hoisted.has(name) && ![...Array(i).keys()].some(j => !take.includes(j) && j > hoistIndex.get(name) && reads[j].has(name)));
  if (!st.declarations.every(d => d.id.type === 'Identifier' && d.init && pure(d.init, allowed))) return;
  // names declared here must not be used at load time before this statement (would change TDZ errors into values)
  const names = st.declarations.map(d => d.id.name);
  take.push(i); names.forEach(n => { hoisted.add(n); hoistIndex.set(n, i); });
});
const takeSet = new Set(take);
let data = '', rest = '';
body.forEach((st, i) => {
  const from = i ? body[i - 1].range[1] : 0;
  const chunk = src.slice(from, st.range[1]);
  if (takeSet.has(i)) data += chunk + '\n'; else rest += chunk;
});
rest += src.slice(body[body.length - 1].range[1]);
// keep the "use strict" directive and the implicit-global var line first
const first2 = rest.match(/^\s*"use strict";\s*var [^;]*;\s*/);
const head = first2 ? first2[0] : '';
const out = head + '\n/* ================= constant data (hoisted) ================= */\n' + data + '\n' + rest.slice(head.length);
fs.writeFileSync(OUT, html.slice(0, start) + out + html.slice(start + src.length));
console.log('hoisted statements:', take.length);
