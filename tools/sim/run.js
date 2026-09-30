// node tools/sim/run.js <hours> <outfile> [hitRate silverRate]
// Plays the real game with a bot against a virtual clock. The page is reloaded from its own save every SEG hours
// (keeps browser memory in check and exercises save/load).
const { chromium } = require('playwright');
const fs = require('fs');
const [hours, out, hitRate, silverRate] = process.argv.slice(2);
const BOT = fs.readFileSync(__dirname + '/bot.js', 'utf8');
const CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8');
const SEG = (+process.env.SEG || 1.5) * 3600e3, START = Date.parse('2026-01-01T10:00:00Z');
const seed = Number(process.env.SEED || 42);
const mkSeed = s => `(()=>{let a=${s};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
 HTMLMediaElement.prototype.play=function(){return Promise.resolve()};try{window.AudioContext=undefined;window.webkitAudioContext=undefined}catch(e){}
 try{window.speechSynthesis&&(window.speechSynthesis.speak=function(){})}catch(e){}})();`;
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const errs = {};
  const log = { events: [], samples: [], stuck: [] };
  let state = null, t = 0, snapped = false, restore = null;
  if (process.env.FROM) {
    const snap = JSON.parse(fs.readFileSync(process.env.FROM, 'utf8'));
    state = snap.state; t = snap.t; restore = snap.storage; snapped = true;
    log.events.push(...snap.events); log.samples.push(...snap.samples);
  }
  const total = +hours * 3600e3, chunk = 60e3, t0 = Date.now();
  while (t < total) {
    const p = await c.newPage();
    p.on('pageerror', e => { const k = e.message.slice(0, 120); errs[k] = (errs[k] || 0) + 1; });
    p.on('dialog', d => d.accept());
    await p.addInitScript(`window.__simStart=${START + t};`);
    if (restore) { await p.addInitScript(st => { if (!sessionStorage.getItem('__restored')) { localStorage.clear(); for (const k in st) localStorage.setItem(k, st[k]); sessionStorage.setItem('__restored', '1'); } }, restore); restore = null; }
    await p.addInitScript(CLOCK);
    await p.addInitScript(mkSeed(seed * 1000 + Math.round(t / chunk)));
    await p.addInitScript(BOT);
    await p.goto('http://localhost:' + (process.env.PORT || 8766) + '/index.html');
    await p.waitForTimeout(300);
    await p.evaluate(() => __advance(2000));
    t += 2000;
    await p.evaluate(c => window.__bot.start(c), { hitRate: +(hitRate || 1), silverRate: +(silverRate || 1), offset: t, state });
    const segEnd = Math.min(total, t + SEG);
    for (; t < segEnd; t += chunk) {
      await p.evaluate(ms => { for (let i = 0; i < ms / 5000; i++) __advance(5000); }, chunk);
      if ((t / chunk) % 30 === 29) await p.evaluate(() => __bot.sample());
    }
    await p.evaluate(() => { __bot.sample(); try { saveGame(true); } catch (e) {} });
    const seg = await p.evaluate(() => ({ log: __simLog, state: __bot.state(), terr: window.__timerErr || {}, s: { cleared: (S.clearedAreas || []).length, abyss: (S.abyssCleared || []).length, lvl: S.heroLevel, gear: Object.values(S.gear || {}).map(g => g && (g.plus || 0) + (g.celestial ? '*' + g.celestial : '')).join(',') } }));
    // the page's log restarts every segment; seen milestones carry over so events are not duplicated
    log.events.push(...seg.log.events); log.samples.push(...seg.log.samples); log.stuck.push(...seg.log.stuck.slice(-20));
    Object.entries(seg.terr).forEach(([k, v]) => errs['timer: ' + k] = (errs['timer: ' + k] || 0) + v);
    state = seg.state;
    if (!snapped && log.events.some(e => e.k === 'abyssOpen')) {
      snapped = true;
      const storage = await p.evaluate(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
      fs.writeFileSync(out.replace(/\.json$/, '') + '.abyss-start.json', JSON.stringify({ t, state, storage, events: log.events, samples: log.samples }));
      console.log('snapshot saved at Abyss unlock');
    }
    console.log(`game ${(t / 3600e3).toFixed(1)}h real ${((Date.now() - t0) / 60e3).toFixed(1)}m`, JSON.stringify(seg.s));
    log.errors = errs;
    fs.writeFileSync(out, JSON.stringify(log));
    await p.close();
  }
  console.log('done', Object.keys(errs).length, 'error kinds');
  await b.close();
})();
