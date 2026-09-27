// Normalise patch wrappers so more layers can be merged:
//  (a) top-level `try{ ...definitions... }catch(e){}`  ->  the definitions
//  (b) top-level `if(typeof X==="function"){ ... }` where X is surely a function by then -> the block body
//      (block-level names that anything else mentions are renamed, like unify.js does)
//  (c) `return c ? A : P(...)` where P is a saved previous version -> `if(c)return A;return P(...);`
// usage: node normalize.js in.html out.html
const fs = require('fs'), espree = require('espree'), escope = require('eslint-scope');
const [,, IN, OUT] = process.argv;
const html = fs.readFileSync(IN, 'utf8');
const reserved = JSON.parse(fs.readFileSync(__dirname + '/reserved.json', 'utf8'));
const RESERVED = new Set([...reserved.names, ...reserved.ids]);
const m = /<script>([\s\S]*?)<\/script>/.exec(html);
const start = m.index + '<script>'.length; let src = m[1];

function parse(s) { return espree.parse(s, {ecmaVersion: 'latest', range: true}); }
function kids(n, cb) { for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && cb(c, k)); else if (v && typeof v.type === 'string') cb(v, k); } }
function allIdents(ast) { const out = []; (function rec(n) { if (n.type === 'Identifier') out.push(n); kids(n, rec); })(ast); return out; }
function parents(ast) { const P = new Map(); (function rec(n, p) { P.set(n, p); kids(n, c => rec(c, n)); })(ast, null); return P; }

let stats = {tryUnwrapped: 0, typeofUnwrapped: 0, renamed: 0, condSplit: 0};
for (let round = 0; round < 6; round++) {
  const ast = parse(src);
  const idents = allIdents(ast);
  const sm = escope.analyze(ast, {ecmaVersion: 2022});
  const P = parents(ast);
  const edits = [];
  // names that are functions for sure: function declarations, or assigned a function at top level earlier
  const fnDecl = new Set(); ast.body.forEach(s => { if (s.type === 'FunctionDeclaration') fnDecl.add(s.id.name); });
  const assignedBefore = new Set();
  const openBlock = (blockNode, stmt, tag) => {
    // rename block-level declarations that are mentioned outside this block
    const sc = sm.acquire(blockNode);
    const inside = pos => pos >= blockNode.range[0] && pos < blockNode.range[1];
    if (sc) for (const v of sc.variables) {
      const elsewhere = idents.some(x => x.name === v.name && !inside(x.range[0])) || RESERVED.has(v.name);
      if (!elsewhere) continue;
      let nn = v.name + '_' + tag, k = 2; while (idents.some(x => x.name === nn)) nn = v.name + '_' + tag + '_' + (k++);
      idents.push({name: nn, range: [-1, -1]});
      stats.renamed++;
      new Set([...v.identifiers, ...v.references.map(r => r.identifier)]).forEach(id => {
        const par = P.get(id);
        if (par && par.type === 'Property' && par.shorthand) edits.push([par.range[0], par.range[1], v.name + ': ' + nn]);
        else edits.push([id.range[0], id.range[1], nn]);
      });
    }
    const b = blockNode.body;
    edits.push([stmt.range[0], b.length ? b[0].range[0] : blockNode.range[1], '']);
    edits.push([b.length ? b[b.length - 1].range[1] : blockNode.range[1], stmt.range[1], '']);
  };
  let changed = 0;
  for (const st of ast.body) {
    // (a)
    if (st.type === 'TryStatement' && !st.finalizer && st.handler && st.handler.body.body.length === 0 &&
        st.block.body.every(s => s.type === 'ExpressionStatement' || s.type === 'FunctionDeclaration' || s.type === 'VariableDeclaration')) {
      const tagm = src.slice(Math.max(0, st.range[0] - 200), st.range[0] + 400).match(/V(\d{1,3})/);
      openBlock(st.block, st, 't' + (tagm ? tagm[1] : st.range[0])); stats.tryUnwrapped++; changed++; continue;
    }
    // (b)
    if (st.type === 'IfStatement' && !st.alternate && st.consequent.type === 'BlockStatement' && st.test.type === 'BinaryExpression' &&
        /^===?$/.test(st.test.operator) && st.test.left.type === 'UnaryExpression' && st.test.left.operator === 'typeof' &&
        st.test.left.argument.type === 'Identifier' && st.test.right.type === 'Literal' && st.test.right.value === 'function') {
      const X = st.test.left.argument.name;
      if (fnDecl.has(X) || assignedBefore.has(X)) {
        const tagm = src.slice(Math.max(0, st.range[0] - 200), st.range[0] + 400).match(/V(\d{1,3})/);
        openBlock(st.consequent, st, 'g' + (tagm ? tagm[1] : st.range[0])); stats.typeofUnwrapped++; changed++; continue;
      }
    }
    if (st.type === 'ExpressionStatement' && st.expression.type === 'AssignmentExpression' && st.expression.left.type === 'Identifier' && /Function/.test(st.expression.right.type))
      assignedBefore.add(st.expression.left.name);
  }
  // (c) conditional returns that call a saved previous version
  const caps = new Set(); (function rec(n) { if (n.type === 'VariableDeclarator' && n.id.type === 'Identifier' && n.init && n.init.type === 'Identifier') caps.add(n.id.name); kids(n, rec); })(ast);
  (function rec(n) {
    if (n.type === 'ReturnStatement' && n.argument && n.argument.type === 'ConditionalExpression') {
      const c = n.argument, isP = e => e.type === 'CallExpression' && e.callee.type === 'Identifier' && caps.has(e.callee.name);
      if (isP(c.consequent) || isP(c.alternate)) {
        const t = x => src.slice(x.range[0], x.range[1]);
        edits.push([n.range[0], n.range[1], '{if(' + t(c.test) + ')return ' + t(c.consequent) + ';return ' + t(c.alternate) + ';}']);
        stats.condSplit++; changed++; return;
      }
    }
    kids(n, rec);
  })(ast);
  if (!changed) break;
  // apply (drop overlapping edits: keep outermost-first order safe by sorting and skipping overlaps)
  edits.sort((x, y) => y[0] - x[0] || y[1] - x[1]);
  let last = Infinity;
  for (const [a, b, t] of edits) { if (b > last) continue; src = src.slice(0, a) + t + src.slice(b); last = a; }
}
fs.writeFileSync(OUT, html.slice(0, start) + src + html.slice(start + m[1].length));
console.log(stats);
