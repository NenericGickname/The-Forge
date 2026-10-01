// Builds maxed sets with chosen affixes, fights an Abyss boss with an unkillable hero,
// and splits damage dealt to the boss by source.
const { chromium } = require('playwright'); const fs = require('fs');
const [snapF, stage] = process.argv.slice(2);
const snap = JSON.parse(fs.readFileSync(snapF, 'utf8'));
const CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8');
const SETS = {
  crit:   { wt: 'sword',  weapon: ['critChance', 'critDmg', 'atkSpeed'], helm: ['critDmg', 'critChance', 'def'], gloves: ['critDmg', 'atkSpeed', 'lifesteal'], amulet: ['critChance', 'lifesteal', 'enrage'] },
  status: { wt: 'dagger', weapon: ['poison', 'elementAmp', 'atkSpeed', 'lightning'], helm: ['elementAmp', 'def', 'critChance'], gloves: ['elementAmp', 'atkSpeed', 'lifesteal'], amulet: ['elementAmp', 'lifesteal', 'critChance'] },
  statusBow: { wt: 'bow', weapon: ['poison', 'elementAmp', 'atkSpeed', 'lightning'], helm: ['elementAmp', 'def', 'critChance'], gloves: ['elementAmp', 'atkSpeed', 'lifesteal'], amulet: ['elementAmp', 'lifesteal', 'critChance'] }
};
(async () => {
  const b = await chromium.launch();
  for (const [name, set] of Object.entries(SETS)) for (const skill of (process.env.SKILL === 'both' ? [false, true] : [true])) {
    const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    await p.addInitScript(`window.__simStart=${Date.parse('2026-01-01T10:00:00Z') + snap.t};`);
    await p.addInitScript(st => { localStorage.clear(); for (const k in st) localStorage.setItem(k, st[k]); }, snap.storage);
    if (process.env.TUNE) await p.addInitScript(`window.__abyssTune=${process.env.TUNE};`);
    await p.addInitScript(CLOCK);
    await p.addInitScript(`(()=>{let a=11;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};HTMLMediaElement.prototype.play=function(){return Promise.resolve()};})();`);
    await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(300);
    const r = await p.evaluate(([set, stage, skill]) => {
      __advance(2000);
      SLOTS.forEach(s => {
        const g = s.key === 'weapon' ? makeWeapon(190, 5, set.wt) : makeGear(s.key, 190, 5);
        if (set[s.key]) {
          for (const k of Object.keys(g.stats)) if (k !== s.main && k !== 'atk') delete g.stats[k];
          for (const k of set[s.key]) g.stats[k] = maxBaseRoll(g, k);
        }
        g.plus = 20; g.celestial = 13; delete g.broken; S.gear[s.key] = g;
      });
      const hs = heroStats();
      const dmg = {}; const orig = floatDmg;
      floatDmg = function (side, val, tier, color, x) {
        if (side === 'foe' && typeof val === 'number' && run && run.foes.some(f => f.boss && f.hp > 0)) {
          const c = String(color || '').toLowerCase();
          const k = { '#7fe07f': 'poison', '#9be07f': 'poison', '#ff8a3a': 'burn', '#ffe14d': 'lightning' }[c] || (tier > 0 ? 'crit hit' : 'hit ' + c);
          dmg[k] = (dmg[k] || 0) + val;
        }
        return orig.apply(this, arguments);
      };
      window.abyssAPIv50.enterAbyss(+stage);
      let t = 0, bossT = null, boss = null;
      while (run && !run.over && t < 1200) {
        __advance(500); t += 0.5;
        run.hero.hp = run.hero.max;
        document.querySelectorAll('#boons > *').forEach((x, k) => k === 0 && x.click());
        const tip = document.getElementById('tipok'); if (tip && tip.offsetParent) tip.click();
        if (!boss) { boss = run.foes.find(f => f.boss); if (boss) { bossT = t; run.foes.forEach(f => { if (!f.boss) f.hp = 0; }); } }
        if (boss && skill) { try { const a = ensureState_p21(); if (a.loadout.indexOf('elementAmp') < 0) a.loadout[0] = 'elementAmp'; a.pow.elementAmp = Math.max(a.pow.elementAmp || 0, 3); activate('elementAmp'); window.__em = Math.max(window.__em || 1, activeMods().eleMult); } catch (e) { window.__emErr = String(e); } }
        if (boss && boss.hp <= 0) break;
        if (boss && t - bossT > 180) break;
      }
      const total = Object.values(dmg).reduce((a, b) => a + b, 0);
      const secs = boss ? t - bossT : null;
      return { crit: Math.round(hs.critChance) + '% x' + (hs.critDmg | 0), atk: Math.round(hs.atk), poison: Math.round(hs.poison || 0), amp: Math.round(hs.elementAmp || 0), light: Math.round(hs.lightning || 0),
        ampSkill: (window.__em || 1) + (window.__emErr || ''), dps: Math.round(total / Math.max(1, secs) / 1000) + 'k/s', killed: boss && boss.hp <= 0, secs,
        split: Object.entries(dmg).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => k + ' ' + Math.round(100 * v / total) + '%').join(', ') };
    }, [set, stage, skill]);
    console.log(name.padEnd(9), skill ? 'amp skill on ' : 'amp skill off', JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
