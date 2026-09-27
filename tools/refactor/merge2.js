// Merge layered functions:  [base def]  const P = X;  X = function(params){ ... P(...) ... }
// The saved copy P is called exactly once, somewhere in straight-line code of the new layer
// (possibly inside plain or labeled blocks, not inside if/loop/try/functions). The call is
// replaced by the old body, with its `return`s turned into `break`s out of a labeled block.
// usage: node merge2.js in.html out.html
const fs = require('fs'), espree = require('espree'), escope = require('eslint-scope');
const [,, IN, OUT] = process.argv;
let html = fs.readFileSync(IN, 'utf8');

const isFn = n => /Function/.test(n.type);
function walkNoFn(node, cb) { (function rec(n) { if (!n || typeof n.type !== 'string') return; if (isFn(n)) return; cb(n);
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v.type === 'string') rec(v); } })(node); }
function countIdent(node, name) { let c = 0; (function rec(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'Identifier' && n.name === name) c++;
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v.type === 'string') rec(v); } })(node); return c; }
function fnOf(stmt) {
  if (stmt.type === 'FunctionDeclaration') return {fn: stmt, name: stmt.id.name, decl: true};
  if (stmt.type === 'ExpressionStatement' && stmt.expression.type === 'AssignmentExpression' && stmt.expression.operator === '=' &&
      stmt.expression.left.type === 'Identifier' && stmt.expression.right.type === 'FunctionExpression') return {fn: stmt.expression.right, name: stmt.expression.left.name, decl: false};
  return null;
}
// find the statement that directly holds the single P call, anywhere in the layer except
// inside nested functions. Also report whether it sits in a statement list.
function findCall(fnBody, P) {
  let found = null, listParent = false;
  (function rec(n, parent, key) {
    if (!n || typeof n.type !== 'string' || found) return;
    if (/Function/.test(n.type)) return;
    const isCallOfP = e => e && e.type === 'CallExpression' && (
      (e.callee.type === 'Identifier' && e.callee.name === P) ||
      (e.callee.type === 'MemberExpression' && e.callee.object.type === 'Identifier' && e.callee.object.name === P));
    if ((n.type === 'ExpressionStatement' && isCallOfP(n.expression)) || (n.type === 'ReturnStatement' && isCallOfP(n.argument)) ||
        (n.type === 'VariableDeclaration' && n.declarations.some(d => isCallOfP(d.init)))) {
      found = n; listParent = parent && (parent.type === 'BlockStatement' || parent.type === 'Program' || parent.type === 'SwitchCase') && Array.isArray(parent[key]);
      return;
    }
    for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => rec(c, n, k)); else if (v && typeof v.type === 'string') rec(v, n, k); }
  })(fnBody, null, null);
  return found ? {st: found, listParent} : null;
}
function maxLabel(text) { let mx = 0; text.replace(/\bprev(\d+):/g, (_, d) => { mx = Math.max(mx, +d); }); return mx; }
let labelN = maxLabel(html);

let total = 0;
for (let pass = 0; pass < 80; pass++) {
  let merged = 0;
  const re = /<script>([\s\S]*?)<\/script>/g; let m; const edits = [];
  while ((m = re.exec(html))) {
    const base = m.index + '<script>'.length, src = m[1];
    let ast; try { ast = espree.parse(src, {ecmaVersion: 'latest', range: true}); } catch (e) { console.error('parse error', e.message); process.exit(1); }
    const sm = escope.analyze(ast, {ecmaVersion: 2022, sourceType: 'script'});
    const lists = [];
    (function collect(n) { if (!n || typeof n.type !== 'string') return;
      if (n.type === 'Program' || n.type === 'BlockStatement') lists.push(n.body);
      for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(collect); else if (v && typeof v.type === 'string') collect(v); } })(ast);
    const used = new Set();
    for (const list of lists) {
      for (let i = 0; i + 2 < list.length; i++) {
        if ([i, i + 1, i + 2].some(x => used.has(list[x]))) continue;
        const a = fnOf(list[i]); if (!a) continue;
        const cap = list[i + 1];
        if (!(cap.type === 'VariableDeclaration' && cap.declarations.length === 1 && cap.declarations[0].init &&
              cap.declarations[0].init.type === 'Identifier' && cap.declarations[0].init.name === a.name && cap.declarations[0].id.type === 'Identifier')) continue;
        const P = cap.declarations[0].id.name;
        const b = fnOf(list[i + 2]); if (!b || b.decl || b.name !== a.name) continue;
        if (a.fn.async || a.fn.generator || b.fn.async || b.fn.generator) continue;
        if (!a.fn.params.every(p => p.type === 'Identifier') || !b.fn.params.every(p => p.type === 'Identifier')) continue;
        const pa = a.fn.params.map(p => p.name), pb = b.fn.params.map(p => p.name);
        const body0 = a.fn.body.body;
        if (body0.some(s => s.directive) || b.fn.body.body.some(s => s.directive)) continue;
        let uses = 0; for (let j = i + 1; j < list.length; j++) uses += countIdent(list[j], P);
        if (uses !== 2 || countIdent(b.fn, P) !== 1) continue;           // declaration + one call
        const fc = findCall(b.fn.body, P); if (!fc) continue; const call = fc.st;
        // recognise the call
        let ce = null, mode = null, resultName = null, resultKind = null, extraDecl = '';
        if (call.type === 'ExpressionStatement' && call.expression.type === 'CallExpression') { ce = call.expression; mode = 'stmt'; }
        else if (call.type === 'ReturnStatement' && call.argument && call.argument.type === 'CallExpression') { ce = call.argument; mode = 'return'; }
        let beforeDecl = '';
        if (call.type === 'VariableDeclaration') {
          const di = call.declarations.findIndex(d => countIdent(d, P) > 0);
          const d = call.declarations[di];
          if (d && d.id.type === 'Identifier' && d.init && d.init.type === 'CallExpression' && countIdent(d, P) === 1) {
            ce = d.init; mode = 'decl'; resultName = d.id.name; resultKind = call.kind;
            const txt = ds => ds.map(x => src.slice(x.range[0], x.range[1])).join(',');
            if (di > 0) beforeDecl = call.kind + ' ' + txt(call.declarations.slice(0, di)) + ';\n';
            if (di < call.declarations.length - 1) extraDecl = call.kind + ' ' + txt(call.declarations.slice(di + 1)) + ';';
          }
        }
        if (!ce) continue;
        if (mode === 'decl' && !fc.listParent) continue;
        let isApply = false, argsOk = false;
        if (ce.callee.type === 'Identifier' && ce.callee.name === P)
          argsOk = ce.arguments.length === pb.length && ce.arguments.every((x, q) => x.type === 'Identifier' && x.name === pb[q]);
        else if (ce.callee.type === 'MemberExpression' && ce.callee.object.type === 'Identifier' && ce.callee.object.name === P &&
                 !ce.callee.computed && ce.callee.property.name === 'apply' && ce.arguments.length === 2 && ce.arguments[0].type === 'ThisExpression' &&
                 ce.arguments[1].type === 'Identifier' && ce.arguments[1].name === 'arguments') { argsOk = true; isApply = true; }
        if (!argsOk) continue;
        if (pa.length > pb.length) continue;
        const renames = [];   // A's parameter names that must take B's names
        for (let q = 0; q < pa.length; q++) if (pa[q] !== pb[q]) renames.push([pa[q], pb[q]]);
        // scopes
        const sa = sm.acquire(a.fn), sb = sm.acquire(b.fn); if (!sa || !sb) continue;
        const freeA = new Set(sa.through.map(r => r.identifier.name));
        const freeB = new Set(sb.through.map(r => r.identifier.name).filter(n => n !== P));
        const declB = new Set();
        (function scopes(sc) { if (sc !== sb && sc.type === 'function') return; sc.variables.forEach(v => { if (v.name !== 'arguments' && !v.defs.some(d => d.type === 'Parameter')) declB.add(v.name); }); sc.childScopes.forEach(scopes); })(sb);
        if (renames.length) {
          // B's name must not already mean something inside A
          const namesInA = new Set(); (function all(sc) { sc.variables.forEach(v => namesInA.add(v.name)); sc.through.forEach(r => namesInA.add(r.identifier.name)); sc.childScopes.forEach(all); })(sa);
          if (renames.some(([, to]) => namesInA.has(to))) continue;
          if (renames.some(([, to]) => pb.filter(x => x === to).length > 1)) continue;
        }
        const varsA = sa.variables.filter(v => v.defs.some(d => d.type === 'Variable' && d.parent && d.parent.kind === 'var')).map(v => v.name);
        if ([...declB].some(n => freeA.has(n))) continue;
        if (pb.slice(pa.length).some(n => freeA.has(n))) continue;
        if (varsA.some(n => freeB.has(n) || declB.has(n))) continue;
        if (resultName && freeA.has(resultName)) continue;
        let usesThisA = false, usesArgsA = false;
        body0.forEach(st => walkNoFn(st, n => { if (n.type === 'ThisExpression') usesThisA = true; if (n.type === 'Identifier' && n.name === 'arguments') usesArgsA = true; }));
        if ((usesThisA || usesArgsA) && !isApply) continue;
        // build the inlined old body
        const off = body0.length ? body0[0].range[0] : 0;
        let inner = body0.length ? src.slice(body0[0].range[0], body0[body0.length - 1].range[1]) : '';
        const idEdits = [];
        let shorthandHit = false;
        for (const [from, to] of renames) {
          const v = sa.variables.find(x => x.name === from && x.defs.some(d => d.type === 'Parameter')); if (!v) { shorthandHit = true; break; }
          v.references.forEach(r => { const id = r.identifier; if (id.range[0] < off || id.range[1] > (body0.length ? body0[body0.length - 1].range[1] : 0)) return; idEdits.push([id.range[0], id.range[1], to]); });
        }
        if (shorthandHit) continue;
        // shorthand properties like {f} would change the key: refuse
        if (renames.length && renames.some(([from]) => new RegExp('[{,]\\s*' + from + '\\s*[,}]').test(inner))) continue;
        // text of an original source range with the parameter renames applied
        const renamed = (a0, b0) => { let t = src.slice(a0, b0); idEdits.filter(e => e[0] >= a0 && e[1] <= b0).sort((x, y) => y[0] - x[0]).forEach(([s0, e0, r]) => { t = t.slice(0, s0 - a0) + r + t.slice(e0 - a0); }); return t; };
        const bodyEnd = body0.length ? body0[body0.length - 1].range[1] : off;
        const rets = []; body0.forEach(st => walkNoFn(st, n => { if (n.type === 'ReturnStatement') rets.push(n); }));
        // readability limit: do not nest early-exit blocks more than MAXDEPTH deep
        const depth0 = (() => { let mx = 0; (function rec(n, d) { if (!n || typeof n.type !== 'string' || isFn(n)) return; const dd = n.type === 'LabeledStatement' ? d + 1 : d; if (dd > mx) mx = dd;
          for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => rec(c, dd)); else if (v && typeof v.type === 'string') rec(v, dd); } })({type: 'X', body: body0}, 0); return mx; })();
        const MAXDEPTH = +(process.env.MAXDEPTH || 1);
        if (mode !== 'return' && (rets.length || mode === 'decl') && depth0 >= MAXDEPTH) continue;
        let repl;
        if (mode === 'return') {
          inner = renamed(off, bodyEnd);
          repl = '{' + inner + '\n}\nreturn;';
        } else {
          const L = 'prev' + (++labelN), H = 'prevResult' + labelN;
          // all edits in original coordinates: return statements (with renamed arguments) and renames outside them
          const all = rets.map(r => { const arg = r.argument ? renamed(r.argument.range[0], r.argument.range[1]) : null;
            const rep = mode === 'decl' ? '{' + H + '=' + (arg || 'undefined') + ';break ' + L + ';}' : (arg ? '{' + arg + ';break ' + L + ';}' : 'break ' + L + ';');
            return [r.range[0], r.range[1], rep]; });
          idEdits.forEach(e => { if (!rets.some(r => e[0] >= r.range[0] && e[1] <= r.range[1])) all.push(e); });
          all.sort((x, y) => y[0] - x[0]);
          inner = src.slice(off, bodyEnd);
          for (const [s0, e0, t] of all) inner = inner.slice(0, s0 - off) + t + inner.slice(e0 - off);
          if (!rets.length) inner = renamed(off, bodyEnd);
          const blockTxt = rets.length ? L + ':{' + inner + '\n}' : '{' + inner + '\n}';
          repl = mode === 'decl' ? beforeDecl + 'let ' + H + ';\n' + blockTxt + '\n' + resultKind + ' ' + resultName + '=' + H + ';' + (extraDecl ? '\n' + extraDecl : '') : blockTxt;
          if (mode === 'decl' && !rets.length) repl = repl.replace('let ' + H + ';', 'let ' + H + ';');
        }
        if (mode !== 'decl') repl = '{' + repl + '}';
        const bBody = b.fn.body;
        const bodyTxt = src.slice(bBody.range[0] + 1, call.range[0]) + repl + src.slice(call.range[1], bBody.range[1] - 1);
        const head = a.decl ? 'function ' + a.name + '(' + pb.join(',') + ')' : a.name + '=function(' + pb.join(',') + ')';
        const gap = src.slice(list[i].range[1], list[i + 2].range[0]);
        const comments = (gap.match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g) || []).join('\n');
        const newText = (comments ? comments + '\n' : '') + head + '{' + bodyTxt + '}' + (a.decl ? '' : ';');
        edits.push([base + list[i].range[0], base + list[i + 2].range[1], newText]);
        used.add(list[i]); used.add(list[i + 1]); used.add(list[i + 2]);
        merged++;
      }
    }
  }
  edits.sort((x, y) => y[0] - x[0]);
  for (const [s, e, r] of edits) html = html.slice(0, s) + r + html.slice(e);
  total += merged;
  if (!merged) break;
}
fs.writeFileSync(OUT, html);
console.log('layers merged:', total, 'size', html.length);
