// Reruns one stage N times on a late save and reports what accumulates between runs.
const { chromium } = require('playwright'); const fs = require('fs');
const [snapF, stage, n, how] = process.argv.slice(2);
const snap = JSON.parse(fs.readFileSync(snapF, 'utf8'));
const CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8').replace('const timers = new Map();', 'const timers = new Map(); window.__timers = timers;');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 120)));
  await p.addInitScript(`window.__simStart=${Date.parse('2026-01-01T10:00:00Z') + snap.t};`);
  await p.addInitScript(st => { localStorage.clear(); for (const k in st) localStorage.setItem(k, st[k]); }, snap.storage);
  await p.addInitScript(CLOCK);
  await p.addInitScript(`HTMLMediaElement.prototype.play=function(){return Promise.resolve()};`);
  await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(300);
  const rows = await p.evaluate(([stage, n, how]) => {
    __advance(2000);
    const out = [];
    const snapshot = i => {
      const groups = {};
      for (const [, t] of __timers) {
        const k = (t.every ? 'I ' : 'T ') + String(t.fn).replace(/\s+/g, ' ').slice(0, 70);
        groups[k] = (groups[k] || 0) + 1;
      }
      const t0 = performance.now(); const r0 = Date.now();
      const real0 = window.__realNow ? 0 : 0;
      return { i, timers: __timers.size, intervals: [...__timers.values()].filter(t => t.every).length, dom: document.getElementsByTagName('*').length,
        particles: (window.particles || []).length, arrows: (window.arrows || []).length, groups };
    };
    let last = null;
    if (how === 'auto') {
      launchAutoRunV54(+stage, false);
      let runs = 0, prev = run, t = 0;
      while (runs < n && t < 3 * 3600) {
        __advance(1000); t++;
        document.querySelectorAll('#boons > *').forEach((x, k) => k === 0 && x.click());
        const tip = document.getElementById('tipok'); if (tip && tip.offsetParent) tip.click();
        if (run !== prev) { prev = run; runs++; if (runs === 1 || runs % 5 === 0) out.push(snapshot(runs)); }
        if (!autoRunState && t % 30 === 0) { launchAutoRunV54(+stage, false); }
      }
      out.push(snapshot(runs)); out.push({ i: 'seconds', timers: t });
      return out;
    }
    for (let i = 0; i < n; i++) {
      if (how === 'auto') { if (i === 0) launchAutoRunV54(+stage, false); }
      else { for (const id of ['clear','dead','lootopen']) document.getElementById(id).classList.remove('on'); startRun(+stage); }
      const s = performance.now();
      let guard = 0;
      while (guard++ < 600) {
        __advance(1000);
        document.querySelectorAll('#boons > *').forEach((x, k) => k === 0 && x.click());
        const tip = document.getElementById('tipok'); if (tip && tip.offsetParent) tip.click();
        if (how !== 'auto' && (!run || run.over)) break;
        if (how === 'auto' && run && run.__seen !== true && run.over) { run.__seen = true; break; }
      }
      if (how === 'auto') __advance(4000);
      last = snapshot(i);
      if (i === 0 || i === n - 1 || i % 5 === 4) out.push(last);
    }
    return out;
  }, [stage, +n, how || 'manual']);
  // compare first and last timer groups
  const a = rows[0].groups, z = rows.at(-2).groups;
  for (const r of rows) console.log(r.i, 'timers', r.timers, 'intervals', r.intervals, 'dom', r.dom, 'particles', r.particles, 'arrows', r.arrows);
  console.log('grew:'); for (const k in z) if ((z[k] || 0) > (a[k] || 0) + 1) console.log(' ', a[k] || 0, '->', z[k], k);
  console.log('errors', errs.slice(0, 5));
  await b.close();
})();
