// node tools/sim/analyze.js sim1.json [sim2.json ...]  -> milestone table (minutes since start)
const files = process.argv.slice(2);
const runs = files.map(f => require(require('path').resolve(f)));
const AREAS = ["Goblin Warrens","Frost Caverns","Stone Bastion","Shadow Keep","Ember Depths","Sunken Ruins","Haunted Spire","Dragon's Roost","The Abyss","Frozen Throne","Infernal Gate","Astral Spire","The End?","Celestial Alpha","Celestial Beta","Celestial Gamma","Celestial Omega"];
function first(L, k, pred) { const e = L.events.find(e => e.k === k && pred(e)); return e ? e.t / 60000 : null; }
const rows = [];
AREAS.forEach((n, a) => rows.push({ what: 'Clear ' + n, v: runs.map(L => first(L, 'areaClear', e => e.a === a)) }));
for (let p = 1; p <= 20; p++) rows.push({ what: 'All gear +' + p, v: runs.map(L => first(L, 'allPlus', e => e.p === p)) });
for (let c = 1; c <= 13; c++) rows.push({ what: 'All gear ✦' + c, v: runs.map(L => first(L, 'allCel', e => e.c === c)) });
const fmt = m => m == null ? '—' : m < 60 ? m.toFixed(0) + 'm' : (m / 60).toFixed(1) + 'h';
if (process.env.JSON) { console.log(JSON.stringify(rows)); process.exit(0); }
rows.forEach(r => console.log(r.what.padEnd(22), r.v.map(fmt).map(x => x.padStart(7)).join('')));
runs.forEach((L, i) => { const c = {}; L.events.forEach(e => c[e.k] = (c[e.k] || 0) + 1); console.log('run', i, JSON.stringify(c)); });
