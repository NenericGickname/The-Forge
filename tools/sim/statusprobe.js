// Time to kill a real boss (hero cannot die) for every weapon effect x gear archetype x Element Amp skill.
// Reports boss HP / seconds as DPS, plus the share of damage per source.
const { chromium } = require('playwright'); const fs = require('fs');
const [snapF, stage] = process.argv.slice(2);
const snap = JSON.parse(fs.readFileSync(snapF, 'utf8'));
const CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8');
const EFFECTS = (process.env.EFFECTS || 'none,doom,poison,bleed,burn,frost,lightning').split(',');
const SETS = (process.env.SETS || 'crit,balanced,elemental').split(',');
const SKILL = (process.env.SKILL || 'off,on').split(',');
const G = JSON.parse(process.env.GEAR || '{"ilvl":190,"rar":5,"plus":20,"cel":13}');
(async () => {
  const b = await chromium.launch();
  const rows = [];
  for (const set of SETS) for (const eff of EFFECTS) for (const sk of SKILL) {
    const p = await (await b.newContext()).newPage();
    await p.addInitScript(`window.__simStart=${Date.parse('2026-01-01T10:00:00Z') + snap.t};`);
    await p.addInitScript(st => { localStorage.clear(); for (const k in st) localStorage.setItem(k, st[k]); }, snap.storage);
    if (process.env.TUNE) await p.addInitScript(`window.__abyssTune=${process.env.TUNE};`);
    await p.addInitScript(CLOCK);
    await p.addInitScript(`(()=>{let a=${process.env.SEED || 11};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};HTMLMediaElement.prototype.play=function(){return Promise.resolve()};})();`);
    await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(300);
    const r = await p.evaluate(([set, eff, sk, G, stage, abyss]) => {
      __advance(2000);
      const CRIT = { weapon: ['critChance', 'critDmg', 'atkSpeed'], helm: ['critDmg', 'critChance', 'def'], gloves: ['critDmg', 'atkSpeed', 'lifesteal'], amulet: ['critChance', 'critDmg', 'lifesteal'] };
      const AMP = { weapon: ['elementAmp', 'atkSpeed', 'critDmg'], helm: ['elementAmp', 'critDmg', 'def'], gloves: ['elementAmp', 'atkSpeed', 'critDmg'], amulet: ['elementAmp', 'critChance', 'lifesteal'] };
      const aff = set === 'crit' ? CRIT : AMP;
      SLOTS.slice().sort((x, y) => (x.key === 'weapon') - (y.key === 'weapon')).forEach(s => {
        const g = s.key === 'weapon' ? makeWeapon(G.ilvl, G.rar, 'dagger') : makeGear(s.key, G.ilvl, G.rar);
        delete g.mythicAffix;
        for (const k of Object.keys(g.stats)) if (k !== s.main && k !== 'atk') delete g.stats[k];
        for (const k of (aff[s.key] || [])) if (!(set === 'crit' && k === 'elementAmp')) g.stats[k] = maxBaseRoll(g, k);
        if (s.key === 'weapon' && eff !== 'none') g.stats[eff] = maxBaseRoll(g, eff);
        for (const k of Object.keys(g.stats)) { try { const m = maxBaseRoll(g, k); if (m > 0) g.stats[k] = m; } catch (e) {} }
        g.archetype = set; g.archRolled = true; if (set === 'crit') delete g.stats.elementAmp;
        g.plus = G.plus; g.celestial = G.cel; delete g.broken; S.gear[s.key] = g;
      });
      const hs = heroStats();
      const split = {}; const ofd = floatDmg;
      floatDmg = function (side, val, tier, color) {
        if (side === 'foe' && run && run.foes.some(f => f.boss && f.hp > 0)) {
          const c = String(color).toLowerCase(), n = typeof val === 'number' ? val : 0;
          const k = { '#7fe07f': 'poison', '#9be07f': 'poison', '#ff8a3a': 'burn', '#ffe14d': 'lightning', '#fff2a0': 'lightning', '#b91430': 'bleed' }[c] || 'hit';
          if (n) split[k] = (split[k] || 0) + n;
        }
        return ofd.apply(this, arguments);
      };
      abyss ? window.abyssAPIv50.enterAbyss(stage) : startRun(stage);
      let t = 0, boss = null, bt = 0, hp0 = 0;
      while (run && !run.over && t < 2400) {
        if (sk === 'on' && boss) { try { const a = ensureState_p21(); if (a.loadout.indexOf('elementAmp') < 0) a.loadout[0] = 'elementAmp'; a.pow.elementAmp = Math.max(a.pow.elementAmp || 0, 3); activate('elementAmp'); } catch (e) {} }
        __advance(250); t += 0.25;
        if (run.hero) run.hero.hp = run.hero.max;
        document.querySelectorAll('#boons > *').forEach((x, k) => k === 0 && x.click());
        const tip = document.getElementById('tipok'); if (tip && tip.offsetParent) tip.click();
        if (!boss) { boss = run.foes.find(f => f.boss); if (boss) { bt = t; hp0 = boss.max; boss.atk = 0; } else if (t > 0.5) run.foes.forEach(f => (f.hp = 0)); }
        if (boss) run.foes.forEach(f => { if (!f.boss) f.hp = 0; });
        if (boss && boss.hp <= 0) break;
        if (boss && t - bt > 240) break;
      }
      const secs = boss ? t - bt : null, done = boss && boss.hp <= 0;
      const dealt = boss ? hp0 - Math.max(0, boss.hp) : 0;
      const tot = Object.values(split).reduce((a, x) => a + x, 0) || 1;
      return { amp: Math.round(hs.elementAmp || 0), crit: Math.round(hs.critChance), cdmg: Math.round(hs.critDmg), dpsK: Math.round(dealt / Math.max(0.25, secs) / 1000), secs, killed: done, doomExec: !!(boss && boss.doomExploded),
        split: Object.entries(split).sort((a, x) => x[1] - a[1]).slice(0, 3).map(([k, v]) => k + ' ' + Math.round(100 * v / tot) + '%').join(' ') };
    }, [set, eff, sk, G, +stage, !process.env.CAMPAIGN]);
    rows.push([set, eff, sk, r]);
    console.log(set.padEnd(9), eff.padEnd(9), ('amp ' + sk).padEnd(7), String(r.dpsK).padStart(6) + 'k/s', (r.killed ? '' : 'NOT KILLED ') + (r.doomExec ? 'doom-exec ' : '') + 'amp' + r.amp + ' crit' + r.crit + '/' + r.cdmg, r.split);
    await p.close();
  }
  await b.close();
})();
