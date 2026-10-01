// node tools/sim/maxtest.js <snapshot> <stage> <tries> [TUNE json via env]
// Loads a snapshot, gives the hero a maxed set (six Mythics +20 ✦13, bow), then fights one Abyss stage repeatedly.
const { chromium } = require('playwright'); const fs = require('fs');
const [snapF, stage, tries] = process.argv.slice(2);
const snap = JSON.parse(fs.readFileSync(snapF, 'utf8'));
const BOT = fs.readFileSync(__dirname + '/bot.js', 'utf8'), CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  await p.addInitScript(`window.__simStart=${Date.parse('2026-01-01T10:00:00Z') + snap.t};`);
  await p.addInitScript(`window.__wt=${JSON.stringify(process.env.WT||'sword')};window.__campaign=${process.env.CAMPAIGN?1:0};window.__relabel=${JSON.stringify(process.env.RELABEL||'')};window.__mirror=${process.env.MIRROR?1:0};`);
  if (process.env.TUNE) await p.addInitScript(`window.__abyssTune=${process.env.TUNE};`);
  await p.addInitScript(st => { localStorage.clear(); for (const k in st) localStorage.setItem(k, st[k]); }, snap.storage);
  await p.addInitScript(CLOCK);
  await p.addInitScript(`(()=>{let a=${process.env.SEED||7};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};HTMLMediaElement.prototype.play=function(){return Promise.resolve()};})();`);
  await p.addInitScript(BOT);
  await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(300);
  const res = await p.evaluate(([stage, tries, mode]) => {
    __advance(2000);
    for (const t of document.querySelectorAll('#tipmodal.on')) t.classList.remove('on');
    const WT = window.__wt || 'sword';
    if (mode !== 'asis') SLOTS.forEach(s => {
      let g = s.key === 'weapon' ? makeWeapon(190, 5, WT) : makeGear(s.key, 190, 5);
      if (mode === 'partial' && (s.key === 'weapon' || s.key === 'armor')) { g = s.key === 'weapon' ? makeWeapon(190, 4, 'bow') : makeGear(s.key, 190, 4); g.plus = 20; g.celestial = 10; delete g.broken; S.gear[s.key] = g; return; }
      if (mode === 'leg10') { g = s.key === 'weapon' ? makeWeapon(147, 4, WT) : makeGear(s.key, 147, 4); g.plus = 20; g.celestial = 10; delete g.broken; S.gear[s.key] = g; return; }
      if (mode === 'blood' && s.key !== 'weapon') { g = makeBloodforged(s.key, 190); g.rar = 5; }
      g.plus = 20; g.celestial = 13; delete g.broken; S.gear[s.key] = g;
    });
    if (window.__relabel) S.gear.weapon.wtype = window.__relabel;
    const hs = heroStats();
    const recaps = []; let wins = 0, waves = [], dur = [];
    for (let i = 0; i < tries; i++) {
      if (window.__mirror) startMirrorPlane(); else if (window.__campaign) startRun(+stage); else window.abyssAPIv50.enterAbyss(+stage);
      const t0 = Date.now(); let lastW = 0; S.abyssCleared = (S.abyssCleared || []).filter(x => x !== +stage);
      while (run && !run.over && Date.now() - t0 < 30 * 60000) {
        __advance(400);
        lastW = run.wave;
        const a = ensureState_p21(); if (a) a.loadout.forEach(id => { if (id !== 'heal' || run.hero.hp < run.hero.max * 0.55) activate(id); });
        document.querySelectorAll('#boons > *').forEach((x, k) => k === 0 && x.click());
        const tip = document.getElementById('tipok'); if (tip && tip.offsetParent) tip.click();
        if (document.getElementById('huntchoice').classList.contains('on')) document.getElementById('huntleave').click();
      }
      const rc = run && run.combatRecapV41; if (rc) recaps.push(Object.values(rc.damage).sort((a,b)=>b.amount-a.amount).slice(0,4).map(r=>r.label+' '+Math.round(r.amount/1000)+'k/'+r.hits).join(', ') + ' | heal ' + Math.round(rc.totalHealing/1000)+'k');
      if (Date.now() - t0 >= 30 * 60000) (window.__hang = window.__hang || []).push({ on: [...document.querySelectorAll('.on')].map(e => e.id || e.className).slice(0, 8), over: run && run.over, wave: run && run.wave, foes: run && run.foes.map(f => Math.round(f.hp) + '/' + f.max).join(' '), hero: run && Math.round(run.hero.hp), timerOk: typeof timer });
      const dead = document.getElementById('dead').classList.contains('on'); const won = window.__campaign ? !dead && Date.now() - t0 < 30 * 60000 && lastW >= (run ? run.total : 0) : (S.abyssCleared || []).includes(+stage) && !dead;
      if (won) wins++; waves.push(won ? 'W' : lastW); dur.push(Math.round((Date.now() - t0) / 60000));
      __advance(6000); if (document.getElementById('lootopen').classList.contains('on')) { document.getElementById('lootleave').click(); __advance(1500); }
      for (const id of ['clear', 'dead', 'lootopen']) document.getElementById(id).classList.remove('on');
      if (run) run.over = true; S.abyssCleared = (S.abyssCleared || []).filter(x => x !== +stage);
      try { renderTown(); } catch (e) {}
    }
    return { hp: Math.round(hs.hp), atk: Math.round(hs.atk), wins, waves: waves.join(' '), minutes: dur.join(' '), recaps, hang: window.__hang };
  }, [stage, +tries, process.env.MODE || 'mythic']);
  console.log(JSON.stringify(res)); await b.close();
})();
