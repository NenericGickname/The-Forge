// Find dead global function definitions in the game HTML.
// usage: node analyze.js <game.html> <coverage.json> [--apply out.html]
// A definition of global X is removed when:
//  (1) a later definition of X unconditionally replaces it during page load,
//  (2) nothing reads X at load time between the two (no `prev = X`, no `X()`, no `onclick = X`),
//  (3) coverage shows its body never ran in any harness scenario.
const fs = require('fs'), crypto = require('crypto');
const espree = require('espree'), escope = require('eslint-scope');
const [,, FILE, COVFILE] = process.argv;
const APPLY = process.argv.includes('--apply') ? process.argv[process.argv.indexOf('--apply') + 1] : null;
const html = fs.readFileSync(FILE, 'utf8');
function hash(s){ return crypto.createHash('sha1').update(s).digest('hex').slice(0,12); }
const cov = JSON.parse(fs.readFileSync(COVFILE, 'utf8'));
const REF = process.argv.includes('--ref') ? process.argv[process.argv.indexOf('--ref') + 1] : FILE;
// function source text -> executed?  (from the file the coverage was recorded on)
const ranText = new Map();
{ const rh = fs.readFileSync(REF, 'utf8'); const rr = /<script>([\s\S]*?)<\/script>/g; let mm;
  while ((mm = rr.exec(rh))) { const c = cov[hash(mm[1])]; if (!c) continue;
    for (const k in c.fns) { const [a, b] = k.split('-').map(Number); const t = mm[1].slice(a, b);
      ranText.set(t, (ranText.get(t) || 0) + c.fns[k]); } } }

// inline script blocks in order
const blocks = [];
const re = /<script>([\s\S]*?)<\/script>/g; let m;
while ((m = re.exec(html))) blocks.push({src: m[1], start: m.index + '<script>'.length});


// events: ordered list of {name, kind:'def'|'read', blockIdx, pos, node, uncond, fnNode, stmt}
const events = [];
const fnInfo = [];
blocks.forEach((b, bi) => {
  const ast = espree.parse(b.src, {ecmaVersion: 'latest', sourceType: 'script', range: true});
  const sm = escope.analyze(ast, {ecmaVersion: 2022, sourceType: 'script'});
  b.ast = ast; b.hash = hash(b.src);
  const covB = cov[b.hash];
  b.covered = covB;
  const g = sm.globalScope;

  // Which nodes run at load time: Program body, bodies of IIFEs called at load time.
  // Walk manually with context flags.
  const parents = new Map();
  (function link(node, parent){
    if (!node || typeof node.type !== 'string') return;
    parents.set(node, parent);
    for (const k in node) { if (k === 'range') continue; const v = node[k];
      if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && link(c, node));
      else if (v && typeof v.type === 'string') link(v, node); }
  })(ast, null);

  const isFn = n => /Function/.test(n.type);
  function isIIFE(fn){
    let p = parents.get(fn);
    while (p && (p.type === 'UnaryExpression' || (p.type === 'SequenceExpression'))) p = parents.get(p);
    return p && p.type === 'CallExpression' && (p.callee === fn || (p.callee.type === 'MemberExpression' && p.callee.object === fn && /^(call|apply)$/.test(p.callee.property.name)));
  }
  // loadInfo(node): {load: bool, uncond: bool}
  function loadInfo(node){
    let uncond = true, n = node, p = parents.get(n);
    while (p) {
      if (isFn(p)) {
        if (p === node) {} else if (isIIFE(p)) { /* continue out */ } else return {load:false, uncond:false};
      }
      if (p.type === 'IfStatement' || p.type === 'ConditionalExpression' || p.type === 'LogicalExpression' || p.type === 'SwitchCase' ||
          p.type === 'ForStatement' || p.type === 'WhileStatement' || p.type === 'ForInStatement' || p.type === 'ForOfStatement' || p.type === 'CatchClause') uncond = false;
      n = p; p = parents.get(n);
    }
    return {load: true, uncond};
  }
  function covCount(fn){
    const t = b.src.slice(fn.range[0], fn.range[1]);
    if (!ranText.has(t)) return null;   // unknown function text: be safe
    return ranText.get(t);
  }
  // global variables (declared at top level or implicit)
  const globalRefs = [];
  g.variables.forEach(v => { v.defs.forEach(d => {
      if (d.type === 'FunctionName' && d.node.type === 'FunctionDeclaration' && parents.get(d.node) === ast) {
        events.push({name: v.name, kind: 'def', bi, pos: -1 + d.node.range[0] * 0 - 1, order: [bi, -1, d.node.range[0]], node: d.node, fnNode: d.node, stmt: d.node, uncond: true, cov: covCount(d.node), decl: true});
      }
    });
    v.references.forEach(r => globalRefs.push({name: v.name, ref: r}));
  });
  g.through.forEach(r => globalRefs.push({name: r.identifier.name, ref: r}));
  globalRefs.forEach(({name, ref}) => {
    const id = ref.identifier, li = loadInfo(id);
    const par = parents.get(id);
    if (ref.isWrite() && par.type === 'AssignmentExpression' && par.left === id && par.operator === '=' && /Function/.test(par.right.type)) {
      const stmt = parents.get(par);
      events.push({name, kind: 'def', bi, order: [bi, 0, id.range[0]], node: par, fnNode: par.right,
        stmt: stmt && stmt.type === 'ExpressionStatement' ? stmt : null, uncond: li.load && li.uncond, load: li.load, cov: covCount(par.right)});
    } else if (ref.isRead()) {
      if (li.load) events.push({name, kind: 'read', bi, order: [bi, 0, id.range[0]], node: id});
    } else if (ref.isWrite()) {
      // some other write (e.g. X = prev) — treat as an unknown write that also reads nothing but keeps previous alive
      events.push({name, kind: 'otherwrite', bi, order: [bi, 0, id.range[0]], node: id, load: li.load});
    }
  });
});
const cmp = (a, b) => a.order[0] - b.order[0] || a.order[1] - b.order[1] || a.order[2] - b.order[2];
events.sort(cmp);
const byName = {};
events.forEach(e => (byName[e.name] = byName[e.name] || []).push(e));

const dead = [];
for (const [name, evs] of Object.entries(byName)) {
  const defs = evs.filter(e => e.kind === 'def');
  if (defs.length < 2) continue;
  for (let i = 0; i < evs.length; i++) {
    const d = evs[i]; if (d.kind !== 'def') continue;
    if (d.load === false) continue;           // a def inside a runtime function; leave alone
    if (!d.stmt) continue;
    // find next unconditional load-time def
    let j = i + 1, alive = false;
    for (; j < evs.length; j++) {
      const e = evs[j];
      if (e.kind === 'read' || e.kind === 'otherwrite') { alive = true; break; }
      if (e.kind === 'def' && e.uncond && e.load !== false) break;
      if (e.kind === 'def') { alive = true; break; } // conditional redefinition: keep it simple
    }
    if (alive || j >= evs.length) continue;
    if (d.cov === null) continue;             // no coverage info for this block
    if (d.cov > 0) continue;                  // it ran at some point
    // a hoisted declaration is live from the start of its block; a read earlier in the same block would use it
    if (d.decl) {
      const earlierRead = evs.some(e => e.kind === 'read' && e.bi === d.bi && e.order[2] < d.node.range[0]);
      if (earlierRead) continue;
    }
    dead.push(d);
  }
}
// captures that nothing uses any more
const unusedCaps = [];
blocks.forEach((b, bi) => {
  const sm = escope.analyze(b.ast, {ecmaVersion: 2022, sourceType: 'script'});
  sm.scopes.forEach(sc => sc.variables.forEach(v => {
    if (v.defs.length !== 1) return; const d = v.defs[0];
    if (d.type !== 'Variable' || !d.node.init || d.node.init.type !== 'Identifier') return;
    if (d.parent.declarations.length !== 1) return;
    const reads = v.references.filter(r => r.isRead());
    if (reads.length === 0) unusedCaps.push({bi, name: v.name, stmt: d.parent});
  }));
});
// functions nobody references at all (any scope). Global names also checked against HTML attributes.
const htmlOutside = html.replace(/<script>[\s\S]*?<\/script>/g, '');
const allScriptText = blocks.map(b => b.src).join('\n');
blocks.forEach((b, bi) => {
  const sm = escope.analyze(b.ast, {ecmaVersion: 2022, sourceType: 'script'});
  sm.scopes.forEach(sc => sc.variables.forEach(v => {
    if (v.defs.length !== 1) return; const d = v.defs[0];
    if (d.type !== 'FunctionName' || d.node.type !== 'FunctionDeclaration') return;
    const outside = v.references.filter(r => !(r.identifier.range[0] >= d.node.range[0] && r.identifier.range[1] <= d.node.range[1]));
    if (outside.length) return;
    if (sc.type === 'global') {
      // referenced from another block, from HTML, or by string (window[name]) ?
      const re2 = new RegExp('\\b' + v.name + '\\b', 'g');
      const hits = (allScriptText.match(re2) || []).length;
      if (hits > 1 || re2.test(htmlOutside)) return;
    }
    unusedCaps.push({bi, name: v.name, stmt: d.node, fn: true});
  }));
});
console.log('unused captures + unreferenced functions:', unusedCaps.length, unusedCaps.filter(u=>u.fn).map(u=>u.name).slice(0,30).join(' '));
let bytes = 0; dead.forEach(d => bytes += d.stmt.range[1] - d.stmt.range[0]);
const summary = {};
dead.forEach(d => summary[d.name] = (summary[d.name] || 0) + 1);
console.log('dead definitions:', dead.length, 'bytes:', bytes);
console.log(Object.entries(summary).sort((a,b)=>b[1]-a[1]).slice(0,40).map(x=>x.join(':')).join(' '));

if (APPLY) {
  // remove statements, block by block, from the end
  const perBlock = {};
  // A removed declaration still has to create the global name when a later
  // plain assignment (not a declaration) takes over, so it becomes `var X;`.
  unusedCaps.forEach(u => (perBlock[u.bi] = perBlock[u.bi] || []).push({range: u.stmt.range, repl: ''}));
  dead.forEach(d => {
    const later = byName[d.name].filter(e => e.kind === 'def' && cmp(e, d) > 0);
    const keepBinding = d.decl && !later.some(e => e.decl);
    (perBlock[d.bi] = perBlock[d.bi] || []).push({range: d.stmt.range, repl: keepBinding ? 'var ' + d.name + ';' : ''});
  });
  let out = html;
  const edits = [];
  blocks.forEach((b, bi) => (perBlock[bi] || []).forEach(x => edits.push([b.start + x.range[0], b.start + x.range[1], x.repl])));
  edits.sort((a, b) => b[0] - a[0]);
  for (const [s, e, r] of edits) out = out.slice(0, s) + (r || '/*removed*/') + out.slice(e);
  out = out.replace(/\/\*removed\*\/;?/g, '');
  fs.writeFileSync(APPLY, out);
  console.log('wrote', APPLY, out.length);
}
