// Real-time frame/long-task profile of rerunning a stage, CPU throttled to mimic a phone.
const { chromium } = require('playwright'); const fs = require('fs');
const [snapF, stage, reruns] = process.argv.slice(2);
const snap = JSON.parse(fs.readFileSync(snapF, 'utf8'));
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 } }); const p = await ctx.newPage();
  await p.addInitScript(st => { if (!sessionStorage.getItem('r')) { localStorage.clear(); for (const k in st) localStorage.setItem(k, st[k]); sessionStorage.setItem('r', 1); } }, snap.storage);
  await p.addInitScript(`HTMLMediaElement.prototype.play=function(){return Promise.resolve()};`);
  await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +(process.env.THROTTLE || 4) });
  await p.evaluate(() => {
    for (const t of document.querySelectorAll('.on')) if (/tip/.test(t.id)) t.classList.remove('on');
    window.__log = [];
    const mark = () => (run ? (run.over ? 'over' : (run.foes || []).some(f => f.boss && f.hp > 0) ? 'boss' : 'wave') : 'town');
    new PerformanceObserver(l => l.getEntries().forEach(e => __log.push({ k: 'long', d: Math.round(e.duration), ph: mark(), t: Math.round(e.startTime) }))).observe({ type: 'longtask', buffered: true });
    let last = performance.now();
    const f = now => { const d = now - last; last = now; if (d > 50) __log.push({ k: 'frame', d: Math.round(d), ph: mark(), t: Math.round(now) }); requestAnimationFrame(f); };
    requestAnimationFrame(f);
    // time well-known heavy functions
    const wrap = name => { const o = window[name]; if (typeof o !== 'function') return; window[name] = function () { const s = performance.now(); try { return o.apply(this, arguments); } finally { const d = performance.now() - s; if (d > 8) __log.push({ k: 'fn', f: name, d: Math.round(d), ph: mark(), t: Math.round(s) }); } }; };
    ['startRun', 'saveGame', 'scheduleSave', 'renderTown', 'buildFoeBars', 'drawBars', 'nextWave', 'openLootScreen', 'prepareRunDrops', 'renderGear', 'heroStats', 'killFoe', 'updateStatusFx', 'renderStatPanel', 'draw', 'tick', 'floatDmg', 'showCombatRecap', 'heroDown'].forEach(wrap);
    window.__saveBytes = (localStorage.getItem(Object.keys(localStorage).find(k => /save/i.test(k)) || '') || '').length;
  });
  for (let i = 0; i < +reruns; i++) {
    await p.evaluate(s => { for (const id of ['clear', 'dead', 'lootopen']) document.getElementById(id).classList.remove('on'); window.__t0 = performance.now(); startRun(s); }, +stage);
    await p.waitForFunction(() => !run || run.over || document.getElementById('lootopen').classList.contains('on'), null, { timeout: 240000, polling: 500 }).catch(() => {});
    console.log('run', i, await p.evaluate(() => ({ ms: Math.round(performance.now() - __t0), wave: run && run.wave, total: run && run.total, over: run && run.over })));
    await p.waitForTimeout(1500);
    // press loot "rerun" like a player would
    await p.evaluate(() => { const b = document.getElementById('lootrerun'); if (document.getElementById('lootopen').classList.contains('on') && b) b.click(); });
    await p.waitForTimeout(1500);
  }
  const L = await p.evaluate(() => ({ log: __log, bytes: __saveBytes, keys: Object.keys(localStorage).map(k => k + ':' + Math.round(localStorage.getItem(k).length / 1024) + 'KB') }));
  console.log('localStorage', L.keys.join(' '));
  const agg = {};
  for (const e of L.log) { const k = e.k + ' ' + (e.f || '') + ' [' + e.ph + ']'; const a = agg[k] = agg[k] || { n: 0, sum: 0, max: 0 }; a.n++; a.sum += e.d; a.max = Math.max(a.max, e.d); }
  Object.entries(agg).sort((x, y) => y[1].sum - x[1].sum).slice(0, 30).forEach(([k, a]) => console.log(k.padEnd(34), 'n', String(a.n).padStart(4), 'total', String(a.sum).padStart(6), 'ms  max', a.max));
  await b.close();
})();
