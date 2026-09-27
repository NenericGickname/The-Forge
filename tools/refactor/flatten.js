// Remove nesting left behind by merging:
//  * labels that nothing breaks out of
//  * plain `{ ... }` blocks inside a statement list, when unwrapping cannot change what any name means
//  * empty blocks
// usage: node flatten.js in.html out.html
const fs = require('fs'), espree = require('espree');
const [,, IN, OUT] = process.argv;
const html = fs.readFileSync(IN, 'utf8');
const m = /<script>([\s\S]*?)<\/script>/.exec(html);
const start = m.index + '<script>'.length; let src = m[1];
const isFn = n => /Function/.test(n.type);
function kids(n, cb) { for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && cb(c, k, true)); else if (v && typeof v.type === 'string') cb(v, k, false); } }

let total = {labels: 0, blocks: 0, empty: 0};
for (let round = 0; round < 40; round++) {
  const ast = espree.parse(src, {ecmaVersion: 'latest', range: true});
  const edits = [];
  // collect identifiers per enclosing function for name checks
  const fnStack = [];
  const idsByFn = new Map();
  (function collect(n, fn) { if (n.type === 'Identifier') { const a = idsByFn.get(fn) || []; a.push(n); idsByFn.set(fn, a); } kids(n, c => collect(c, isFn(c) ? c : fn)); })(ast, ast);
  const busy = []; // ranges already edited this round
  const overlaps = (a, b) => busy.some(([x, y]) => a < y && b > x);
  (function rec(n, parent, key, inList, fn) {
    if (isFn(n)) fn = n;
    if (n.type === 'LabeledStatement') {
      const L = n.label.name; let used = false;
      (function f(x) { if ((x.type === 'BreakStatement' || x.type === 'ContinueStatement') && x.label && x.label.name === L) used = true; if (!isFn(x)) kids(x, f); })(n.body);
      if (!used && !overlaps(n.range[0], n.range[1])) { edits.push([n.range[0], n.body.range[0], '']); busy.push([n.range[0], n.body.range[0]]); total.labels++; }
    }
    if (n.type === 'BlockStatement' && inList && parent && parent.type !== 'LabeledStatement' && !overlaps(n.range[0], n.range[1])) {
      if (n.body.length === 0) { edits.push([n.range[0], n.range[1], '']); busy.push([n.range[0], n.range[1]]); total.empty++; return; }
      const lex = [];
      n.body.forEach(s => {
        if (s.type === 'VariableDeclaration' && s.kind !== 'var') s.declarations.forEach(d => (function pat(p){ if (!p) return; if (p.type === 'Identifier') lex.push(p.name); else if (p.type === 'ObjectPattern') p.properties.forEach(q => pat(q.value || q.argument)); else if (p.type === 'ArrayPattern') p.elements.forEach(pat); else if (p.type === 'AssignmentPattern') pat(p.left); else if (p.type === 'RestElement') pat(p.argument); })(d.id));
        if (s.type === 'FunctionDeclaration' || s.type === 'ClassDeclaration') lex.push(s.id.name);
      });
      const ids = idsByFn.get(fn) || [];
      const clash = lex.some(nm => ids.some(id => id.name === nm && (id.range[0] < n.range[0] || id.range[1] > n.range[1])));
      // function declarations directly inside the block would become visible to the whole function: only if no clash
      if (!clash) {
        edits.push([n.range[0], n.range[0] + 1, '']); edits.push([n.range[1] - 1, n.range[1], '']);
        busy.push([n.range[0], n.range[0] + 1], [n.range[1] - 1, n.range[1]]);
        total.blocks++;
      }
    }
    kids(n, (c, k, arr) => rec(c, n, k, arr && (n.type === 'BlockStatement' || n.type === 'Program' || n.type === 'SwitchCase') && (k === 'body' || k === 'consequent'), fn));
  })(ast, null, null, false, ast);
  if (!edits.length) break;
  edits.sort((a, b) => b[0] - a[0]);
  for (const [a, b, t] of edits) src = src.slice(0, a) + t + src.slice(b);
}
fs.writeFileSync(OUT, html.slice(0, start) + src + html.slice(start + m[1].length));
console.log(total);
