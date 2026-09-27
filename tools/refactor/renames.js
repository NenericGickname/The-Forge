// Give global names without version tags where that is safe:
//   defaultStateV5 -> defaultState, renderTownV50Extras -> renderTownExtras, ensureState_p21 -> ensureState
// A name is only renamed when the new name is unused everywhere (code, strings, HTML, phone layers,
// browser globals), and the old name never appears as a property or in a string (window.X, "X").
// usage: node renames.js in.html out.html keep1.js keep2.js ...   (files whose used names must stay)
const fs = require('fs'), espree = require('espree'), escope = require('eslint-scope');
const [,, IN, OUT, ...KEEPFILES] = process.argv;
const html = fs.readFileSync(IN, 'utf8');
const reserved = JSON.parse(fs.readFileSync(__dirname + '/reserved.json', 'utf8'));
const RESERVED = new Set([...reserved.names, ...reserved.ids]);
const keepText = KEEPFILES.map(f => fs.readFileSync(f, 'utf8')).join('\n');
const m = /<script>([\s\S]*?)<\/script>/.exec(html);
const start = m.index + '<script>'.length, src = m[1];
const ast = espree.parse(src, {ecmaVersion: 'latest', range: true});
const sm = escope.analyze(ast, {ecmaVersion: 2022});
const htmlOutside = html.slice(0, m.index) + html.slice(m.index + m[0].length);
const P = new Map(); (function rec(n, p) { P.set(n, p); for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && rec(c, n)); else if (v && typeof v.type === 'string') rec(v, n); } })(ast, null);

// every name that exists anywhere
const used = new Set();
(function rec(n) { if (n.type === 'Identifier') used.add(n.name); if (n.type === 'Literal' && typeof n.value === 'string') used.add(n.value);
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && rec(c)); else if (v && typeof v.type === 'string') rec(v); } })(ast);
const words = s => new Set(s.match(/[A-Za-z_$][\w$]*/g) || []);
const outsideWords = words(htmlOutside), keepWords = words(keepText);

function clean(name) {
  let n = name;
  n = n.replace(/_(?:v|p|t|g)\d+(?:_\d+)?$/, '');                 // unify/normalize suffixes
  n = n.replace(/_V\d{1,3}(?=_|$)/g, '');
  n = n.replace(/(Before)?(?:V\d{1,3})(?=[A-Z]|$)/g, (mm, before) => (before ? 'Before' : ''));
  n = n.replace(/Before$/, 'Base');
  return n;
}
const g = sm.globalScope;
const plan = [];
const taken = new Set([...used, ...RESERVED, ...outsideWords, ...keepWords]);
// properties / strings that mention a name block renaming it
const propOrString = new Set();
(function rec(n) {
  if (n.type === 'MemberExpression' && !n.computed && n.property.type === 'Identifier') propOrString.add(n.property.name);
  if (n.type === 'Property' && !n.computed && n.key.type === 'Identifier' && !n.shorthand) propOrString.add(n.key.name);
  if (n.type === 'Literal' && typeof n.value === 'string') words(n.value).forEach(w => propOrString.add(w));
  if (n.type === 'TemplateElement') words(n.value.raw).forEach(w => propOrString.add(w));
  for (const k in n) { if (k === 'range') continue; const v = n[k]; if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && rec(c)); else if (v && typeof v.type === 'string') rec(v); } })(ast);

for (const v of g.variables) {
  const nn = clean(v.name);
  if (nn === v.name || !/^[A-Za-z_$][\w$]*$/.test(nn) || nn.length < 2) continue;
  if (keepWords.has(v.name) || outsideWords.has(v.name) || propOrString.has(v.name)) continue;
  if (taken.has(nn)) continue;
  taken.add(nn);
  plan.push([v, nn]);
}
const edits = [];
const throughBy = new Map(); g.through.forEach(r => { const a = throughBy.get(r.identifier.name) || []; a.push(r.identifier); throughBy.set(r.identifier.name, a); });
for (const [v, nn] of plan) {
  new Set([...v.identifiers, ...v.references.map(r => r.identifier), ...(throughBy.get(v.name) || [])]).forEach(id => {
    const par = P.get(id);
    if (par && par.type === 'Property' && par.shorthand) edits.push([par.range[0], par.range[1], v.name + ': ' + nn]);
    else edits.push([id.range[0], id.range[1], nn]);
  });
}
edits.sort((a, b) => b[0] - a[0]);
let s = src;
for (const [a, b, t] of edits) s = s.slice(0, a) + t + s.slice(b);
fs.writeFileSync(OUT, html.slice(0, start) + s + html.slice(start + src.length));
console.log('renamed globals:', plan.length);
console.log(plan.slice(0, 50).map(([v, n]) => v.name + '→' + n).join(' '));
