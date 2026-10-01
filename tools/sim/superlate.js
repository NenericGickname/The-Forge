// Super Late playtest character (the "End game" test build), active skills used like a player:
// offensive skills on cooldown during boss waves, heal below 55% health. Hero can die.
// node superlate.js <target> <tries>   target: mirror | omega | stage:<n> (Abyss)
const { chromium } = require('playwright'); const fs = require('fs');
const [target, tries] = process.argv.slice(2);
const CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8');
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext()).newPage();
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 150)));
  if (process.env.TUNE) await p.addInitScript(`window.__abyssTune=${process.env.TUNE};`);
  await p.addInitScript(CLOCK);
  await p.addInitScript(`(()=>{let a=${process.env.SEED || 5};Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};HTMLMediaElement.prototype.play=function(){return Promise.resolve()};})();`);
  await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(400);
  const r = await p.evaluate(([target, tries, loadout]) => {
    __advance(2000);
    applySuperLatePreset();
    __advance(3000);
    document.querySelectorAll('.on').forEach(e => /tip/.test(e.id) && e.classList.remove('on'));
    const a = ensureState_p21();
    a.loadout = loadout.slice();
    for (const id of loadout) { a.pow[id] = 10; a.dur[id] = 10; a.cd[id] = 10; }
    const hs = heroStats();
    const out = { hp: Math.round(hs.hp), atk: Math.round(hs.atk), amp: Math.round(hs.elementAmp || 0), crit: Math.round(hs.critChance), cdmg: Math.round(hs.critDmg),
      weapon: S.gear.weapon.name + ' ' + Object.entries(S.gear.weapon.stats).map(([k, v]) => k + Math.round(v)).join(' '), arch: SLOTS.map(s => S.gear[s.key].archetype).join(','), runs: [] };
    for (let i = 0; i < tries; i++) {
      for (const id of ['clear', 'dead', 'lootopen']) document.getElementById(id).classList.remove('on');
      if (target === 'mirror') startMirrorPlane(true);
      else window.abyssAPIv50.enterAbyss(target === 'omega' ? 16 : +target.split(':')[1]);
      const split = {}; let doomExec = 0;
      const ofd = floatDmg;
      floatDmg = function (side, val, tier, color) {
        if (side === 'foe' && run && run.foes.some(f => f.boss && f.hp > 0)) {
          const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
          const c = String(color).toLowerCase();
          const k = { '#7fe07f': 'poison', '#9be07f': 'poison', '#ff8a3a': 'burn', '#ffe14d': 'lightning', '#fff2a0': 'lightning', '#b91430': 'bleed', '#dce8ff': 'echo' }[c] || (/DOOM/.test(String(val)) ? 'x' : 'hit');
          if (n && k !== 'x') split[k] = (split[k] || 0) + n;
        }
        return ofd.apply(this, arguments);
      };
      let t = 0, bossT = null, bossMax = 0;
      while (run && !run.over && t < 1800) {
        const bossUp = run.foes.some(f => f.boss && f.hp > 0);
        if (bossUp && bossT == null) { bossT = t; bossMax = run.foes.filter(f => f.boss).reduce((s, f) => s + f.max, 0); }
        // doom executes: remember the health they remove
        run.foes.forEach(f => { if (f.boss && f.doomExploded && !f.__counted) { f.__counted = true; doomExec += f.__lastHp || 0; } if (f.hp > 0) f.__lastHp = f.hp; });
        for (const id of a.loadout) {
          if (id === 'heal') { if (run.hero.hp < run.hero.max * 0.55) activate(id); }
          else if (bossUp || id === 'toughen' || id === 'ninja') activate(id);
        }
        __advance(250); t += 0.25;
        document.querySelectorAll('#boons > *').forEach((x, k) => k === 0 && x.click());
        const tip = document.getElementById('tipok'); if (tip && tip.offsetParent) tip.click();
        if (document.getElementById('huntchoice').classList.contains('on')) document.getElementById('huntleave').click();
      }
      floatDmg = ofd;
      const dead = document.getElementById('dead').classList.contains('on');
      const tot = Object.values(split).reduce((x, y) => x + y, 0) + doomExec;
      if (doomExec) split['doom execute'] = doomExec;
      out.runs.push({ won: !dead && run && run.over, wave: run && run.wave, min: Math.round(t / 6) / 10, bossSecs: bossT == null ? null : Math.round(t - bossT), bossHpM: Math.round(bossMax / 1e6),
        split: Object.entries(split).sort((x, y) => y[1] - x[1]).map(([k, v]) => k + ' ' + Math.round(100 * v / (tot || 1)) + '%').join(', ') });
      __advance(6000);
      if (document.getElementById('lootopen').classList.contains('on')) { document.getElementById('lootleave').click(); __advance(1500); }
      if (run) run.over = true;
    }
    return out;
  }, [target, +tries, (process.env.LOADOUT || 'elementAmp,berserk,toughen,heal').split(',')]);
  console.log(JSON.stringify(r, null, 1), errs.slice(0, 3));
  await b.close();
})();
