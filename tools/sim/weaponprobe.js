// Same maxed gear (six Mythics +20 ✦13), only the weapon type differs. Hero cannot die.
// Measures: seconds to kill the boss alone, and seconds to clear the first N waves.
const { chromium } = require('playwright'); const fs = require('fs');
const [snapF, stage, waves] = process.argv.slice(2);
const snap = JSON.parse(fs.readFileSync(snapF, 'utf8'));
const CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8');
const BUILDS = JSON.parse(process.env.BUILDS || '{"sword":"crit","bow":"crit","dagger":"crit","greataxe":"crit"}');
const AFF = {
  crit:   { arch: 'crit', weapon: ['critChance', 'critDmg', 'atkSpeed'], helm: ['critDmg', 'critChance', 'def'], gloves: ['critDmg', 'atkSpeed', 'lifesteal'], amulet: ['critChance', 'lifesteal', 'critDmg'] },
  hybrid: { arch: 'balanced', weapon: ['poison', 'elementAmp', 'critDmg', 'atkSpeed'], helm: ['elementAmp', 'critDmg', 'critChance'], gloves: ['elementAmp', 'critDmg', 'atkSpeed'], amulet: ['elementAmp', 'critDmg', 'critChance'] },
  mixed: { arch: { weapon: 'elemental', helm: 'elemental', gloves: 'crit', amulet: 'crit' }, weapon: ['poison', 'elementAmp', 'atkSpeed', 'lightning'], helm: ['elementAmp', 'def', 'critChance'], gloves: ['critDmg', 'atkSpeed', 'lifesteal'], amulet: ['critChance', 'lifesteal', 'critDmg'] },
  status: { arch: 'elemental', weapon: ['poison', 'elementAmp', 'atkSpeed', 'lightning'], helm: ['elementAmp', 'def', 'critChance'], gloves: ['elementAmp', 'atkSpeed', 'lifesteal'], amulet: ['elementAmp', 'lifesteal', 'critChance'] }
};
(async () => {
  const b = await chromium.launch();
  for (const [key, build] of Object.entries(BUILDS)) {
    const wt = key.split(':')[0];
    const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
    await p.addInitScript(`window.__simStart=${Date.parse('2026-01-01T10:00:00Z') + snap.t};`);
    await p.addInitScript(st => { localStorage.clear(); for (const k in st) localStorage.setItem(k, st[k]); }, snap.storage);
    if (process.env.MIRROR) await p.addInitScript(`window.__mirrorP=1;`);
    if (process.env.ARCH) await p.addInitScript(`window.__archTune=${process.env.ARCH};`);
    if (process.env.TUNE) await p.addInitScript(`window.__abyssTune=${process.env.TUNE};`);
    if (process.env.SPD) await p.addInitScript(`window.__spdTune=${process.env.SPD};`);
    await p.addInitScript(CLOCK);
    await p.addInitScript(`(()=>{let a=${process.env.SEED || 11};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};HTMLMediaElement.prototype.play=function(){return Promise.resolve()};})();`);
    await p.goto('http://localhost:' + (process.env.PORT || 8766) + '/index.html'); await p.waitForTimeout(300);
    const PORT = process.env.PORT || 8766;
    const r = await p.evaluate(([wt, aff, stage, waves, abyss, G]) => {
      __advance(2000);
      SLOTS.slice().sort((x, y) => (x.key === 'weapon') - (y.key === 'weapon')).forEach(s => {
        const g = s.key === 'weapon' ? makeWeapon(G.ilvl, G.rar, wt) : makeGear(s.key, G.ilvl, G.rar);
        if (aff[s.key]) {
          for (const k of Object.keys(g.stats)) if (k !== s.main && k !== 'atk' && !(wt === 'bow' && k === 'critChance')) delete g.stats[k];
          for (const k of aff[s.key]) if (!(s.key === 'weapon' && wt === 'greataxe' && k === 'poison')) g.stats[k] = maxBaseRoll(g, k);
        }
        for (const k of Object.keys(g.stats)) { try { const m = maxBaseRoll(g, k); if (m > 0) g.stats[k] = m; } catch (e) {} }
        delete g.mythicAffix;
        if (aff.arch) { g.archetype = typeof aff.arch === 'string' ? aff.arch : (aff.arch[s.key] || 'crit'); g.archRolled = true; if (g.archetype === 'crit') delete g.stats.elementAmp; }
        g.plus = G.plus; g.celestial = G.cel; delete g.broken; S.gear[s.key] = g;
      });
      const hs = heroStats(); const AMPSET = Object.values(aff).some(v => Array.isArray(v) && v.includes('elementAmp')) ? aff : null;
      const enter = () => { for (const id of ['clear', 'dead', 'lootopen']) document.getElementById(id).classList.remove('on'); window.__mirrorP ? startMirrorPlane() : abyss ? window.abyssAPIv50.enterAbyss(stage) : startRun(stage); };
      const step = () => { if (aff === AMPSET) { try { const a = ensureState_p21(); if (a.loadout.indexOf('elementAmp') < 0) a.loadout[0] = 'elementAmp'; a.pow.elementAmp = Math.max(a.pow.elementAmp || 0, 3); activate('elementAmp'); } catch (e) {} } __advance(250); if (run && run.hero) run.hero.hp = run.hero.max; document.querySelectorAll('#boons > *').forEach((x, k) => k === 0 && x.click()); const tip = document.getElementById('tipok'); if (tip && tip.offsetParent) tip.click(); };
      const measure = (group) => {
        enter(); let t = 0;
        // skip to the boss wave (single) or wave 2 (group)
        while (run && !run.over && t < 600) {
          step(); t += 0.25;
          const bs = run.foes.filter(f => f.boss && f.hp > 0);
          if (!group && bs.length) { window.__bsN = bs.map(f => f.name).join('+') + '@' + run.foes.length; break; }
          if (group && window.__mirrorP) { const al = run.foes.filter(f => f.hp > 0 && !f.boss); if (run.wave >= 2 && al.length >= 3) { al.forEach(f => (f.hp = f.max = 1e13)); break; } if (run.wave >= 2) { run.foes.forEach(f => (f.hp = 0)); } continue; }
          if (!group && window.__mirrorP && bs.length >= 2) break;
          if (!group && window.__mirrorP && bs.length === 1) continue;
          if (group && run.wave >= 2 && run.foes.some(f => f.hp > 0 && !f.boss)) { run.foes.forEach(f => { if (f.hp > 0) f.hp = f.max = 1e13; }); break; }
          if (!group) run.foes.forEach(f => { if (!f.boss) f.hp = 0; });
        }
        if (!run || run.over) return null;
        let foes = run.foes.filter(f => f.hp > 0);
        if (group && !window.__mirrorP) {
          const ok = foes.slice(0, 5);
          const tpl = ok[0] || run.foes.find(f => !f.boss) || run.foes[0];
          while (ok.length < 5) { try { summonFoe(tpl.key, tpl.lvl, 1, 60 + ok.length * 40, {}); } catch (e) {} const nf = run.foes.filter(f => f.hp > 0 && !ok.includes(f)); if (!nf.length) break; ok.push(nf[0]); }
          foes = ok; run.foes.forEach(f => { if (!foes.includes(f)) f.hp = 0; });
        }
        foes.forEach(f => { f.max = f.hp = 1e13; f.atk = 0; });
        for (let k = 0; k < 8; k++) step();
        window.__split = {}; const ofd = floatDmg; floatDmg = function (side, val, tier, color) { if (side === 'foe' && typeof val === 'number') { const c = String(color).toLowerCase(); const k = { '#7fe07f': 'poison', '#9be07f': 'poison', '#ff8a3a': 'burn', '#ffe14d': 'lightning', '#b91430': 'bleed' }[c] || 'hit'; __split[k] = (__split[k] || 0) + val; } return ofd.apply(this, arguments); };
        const hp0 = foes.map(f => f.hp); t = 0;
        while (run && !run.over && t < 60) { step(); t += 0.25; }
        floatDmg = ofd; window.__splitS = window.__splitS || __split;
        const dealt = foes.reduce((a, f, k) => a + (hp0[k] - Math.max(0, f.hp)), 0); window.__per = foes.map((f, k) => Math.round((hp0[k] - f.hp) / 60000) + (f.twinV1 ? 't' : ''));
        return Math.round(dealt / 60 / 1000);
      };
      window.__sweeps = 0; const gs0 = greataxeSweep; greataxeSweep = function () { window.__sweeps++; return gs0.apply(this, arguments); };
      const single = measure(false); const sweepsSingle = window.__sweeps; window.__perS = window.__per; const group = measure(true);
      return { bsN: window.__bsN, split: window.__splitS && Object.entries(__splitS).map(([k, v]) => k + ' ' + Math.round(v / 1000)).join(' '), poison: Math.round(hs.poison || 0), amp: Math.round(hs.elementAmp || 0), atk: Math.round(hs.atk), crit: Math.round(hs.critChance), cdmg: Math.round(hs.critDmg), spd: Math.round(hs.atkSpeed), singleK: single, groupK: group, perG: window.__per, sweepsG: window.__sweeps - sweepsSingle, sweeps: sweepsSingle, per: window.__perS, twinUp: run && run.foes.filter(f => f.boss).length };
    }, [wt, AFF[build], +stage, +waves, !process.env.CAMPAIGN, JSON.parse(process.env.GEAR || '{"ilvl":190,"rar":5,"plus":20,"cel":13}')]);
    console.log((key + ' ' + build).padEnd(18), JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
