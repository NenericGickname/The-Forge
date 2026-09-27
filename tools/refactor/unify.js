// Unwrap the patch IIFEs and join all script blocks into one strict script.
// usage: node unify.js in.html out.html
// Safety rules:
//  * Only IIFEs with no parameters, no top-level `return`, no `this`/`arguments` at their top level.
//  * A name declared at the IIFE's top level keeps its name only if nothing outside that IIFE
//    mentions the name (as an identifier anywhere, a DOM id, or a browser global). Otherwise it
//    is renamed (name_vNN) everywhere inside the IIFE, so every reference resolves exactly as before.
const fs = require('fs'), espree = require('espree'), escope = require('eslint-scope');
const [,, IN, OUT] = process.argv;
const html = fs.readFileSync(IN, 'utf8');
const reserved = JSON.parse(fs.readFileSync(__dirname + '/reserved.json', 'utf8'));
const RESERVED = new Set([...reserved.names, ...reserved.ids, 'undefined', 'NaN', 'Infinity', 'eval', 'arguments']);

const blocks = []; const re = /<script>([\s\S]*?)<\/script>/g; let m;
while ((m = re.exec(html))) blocks.push({src: m[1], start: m.index, end: m.index + m[0].length});

function parentsOf(ast) { const P = new Map(); (function rec(n, p) { if (!n || typeof n.type !== 'string') return; P.set(n, p);
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => rec(c, n)); else if (v && typeof v.type === 'string') rec(v, n); } })(ast, null); return P; }
function iifeFn(st) { if (st.type !== 'ExpressionStatement') return null; let e = st.expression; if (e.type === 'UnaryExpression') e = e.argument;
  if (e.type === 'CallExpression' && /Function/.test(e.callee.type) && e.arguments.length === 0 && e.callee.params.length === 0 && !e.callee.async && !e.callee.generator && e.callee.body.type === 'BlockStatement') return e.callee; return null; }
function topScan(stmts, cb) { stmts.forEach(s => (function rec(n) { if (!n || typeof n.type !== 'string') return; if (/Function/.test(n.type)) return; cb(n);
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v.type === 'string') rec(v); } })(s)); }

// identifier mentions per block-region, to decide renames
const allIdents = []; // {name, block, pos}
const parsed = blocks.map((b, bi) => {
  const ast = espree.parse(b.src, {ecmaVersion: 'latest', range: true});
  (function rec(n) { if (!n || typeof n.type !== 'string') return; if (n.type === 'Identifier') allIdents.push({name: n.name, bi, pos: n.range[0]});
    for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(rec); else if (v && typeof v.type === 'string') rec(v); } })(ast);
  return ast;
});
const htmlOutside = html.replace(/<script>[\s\S]*?<\/script>/g, '');

let out = '"use strict";\n';
const implicit = new Set();
const stats = {unwrapped: 0, kept: 0, renamed: 0};
const renameLog = [];
blocks.forEach((b, bi) => {
  const src = b.src, ast = parsed[bi];
  const sm = escope.analyze(ast, {ecmaVersion: 2022, sourceType: 'script'});
  sm.globalScope.through.forEach(r => { if (r.isWrite()) implicit.add(r.identifier.name); });
  const P = parentsOf(ast);
  const edits = []; // [start, end, text]
  for (const st of ast.body) {
    const fn = iifeFn(st); if (!fn) continue;
    const body = fn.body.body;
    let bad = false; topScan(body, n => { if (n.type === 'ReturnStatement' || n.type === 'ThisExpression' || (n.type === 'Identifier' && n.name === 'arguments')) bad = true; });
    if (bad) { stats.kept++; continue; }
    const fsc = sm.acquire(fn);
    const tagm = src.slice(Math.max(0, st.range[0] - 300), st.range[0] + 600).match(/V(\d{1,3})/);
    const tag = tagm ? 'v' + tagm[1] : 'p' + bi;
    const inside = (pos) => pos >= fn.range[0] && pos < fn.range[1];
    for (const v of fsc.variables) {
      if (v.name === 'arguments') continue;
      const mentionedElsewhere = allIdents.some(x => x.name === v.name && !(x.bi === bi && inside(x.pos))) || RESERVED.has(v.name) ||
        new RegExp('\\b' + v.name.replace(/\$/g, '\\$') + '\\b').test(htmlOutside);
      if (!mentionedElsewhere) continue;
      let nn = v.name + '_' + tag, k = 2; while (allIdents.some(x => x.name === nn) || RESERVED.has(nn)) nn = v.name + '_' + tag + '_' + (k++);
      allIdents.push({name: nn, bi: -1, pos: -1});
      stats.renamed++; renameLog.push(v.name + '→' + nn);
      const ids = new Set([...v.identifiers, ...v.references.map(r => r.identifier)]);
      for (const id of ids) {
        const par = P.get(id);
        if (par && par.type === 'Property' && par.shorthand && par.value === id) edits.push([par.range[0], par.range[1], v.name + ': ' + nn]);
        else if (par && par.type === 'Property' && par.shorthand && par.value && par.value.type === 'AssignmentPattern' && par.value.left === id) edits.push([id.range[0], id.range[1], v.name + ': ' + nn]);
        else edits.push([id.range[0], id.range[1], nn]);
      }
    }
    // unwrap: replace the whole statement with the function body contents (minus directives)
    const inner = body.filter(s => !s.directive);
    const innerStart = inner.length ? inner[0].range[0] : fn.body.range[0] + 1, innerEnd = inner.length ? inner[inner.length - 1].range[1] : fn.body.range[0] + 1;
    edits.push([st.range[0], innerStart, '/* ---- (patch scope opened) ---- */\n', 'open']);
    edits.push([innerEnd, st.range[1], '\n', 'close']);
    stats.unwrapped++;
  }
  // apply edits (non-overlapping by construction except open/close around renamed ids)
  edits.sort((a, c) => c[0] - a[0] || c[1] - a[1]);
  let s = src;
  for (const [a, e, t] of edits) s = s.slice(0, a) + t + s.slice(e);
  out += '\n/* ================= script block ' + bi + ' ================= */\n' + s + '\n;\n';
});
// names assigned without declaration (sloppy-mode globals) must be declared for strict mode
const declaredGlobal = new Set();
parsed.forEach(ast => escope.analyze(ast, {ecmaVersion: 2022}).globalScope.variables.forEach(v => declaredGlobal.add(v.name)));
const needVar = [...implicit].filter(n => !declaredGlobal.has(n));
out = out.replace('"use strict";\n', '"use strict";\nvar ' + (needVar.length ? needVar.join(', ') : '__none') + ';\n');
// remove every script block and put the joined script where the LAST block was,
// so all the page markup exists before any code runs (as it did for the later blocks)
let res = '', pos = 0;
blocks.forEach((b, i) => { res += html.slice(pos, b.start); if (i === blocks.length - 1) res += '<script>' + out + '</script>'; pos = b.end; });
res += html.slice(pos);
fs.writeFileSync(OUT, res);
console.log(stats, 'implicit globals declared:', needVar.join(','));
console.log('renames:', renameLog.length, renameLog.slice(0, 60).join(' '));
