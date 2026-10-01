/* Status builds: one multiplier for all damage over time (poison, burn, bleed bursts, doom).
   It combines the Elemental Amp stat, the skill-tree elemental nodes and the Element Amp
   active skill, minus the target's resistance to damage over time. */
function statusSkillMul() {
  let m = 1;
  try {
    const b = skillBonuses();
    m *= b.eleMult || 1;
  } catch (e) {}
  try {
    if (typeof activeMods === "function") m *= activeMods().eleMult || 1;
  } catch (e) {}
  return m;
}
function statusMulFor(target, hs) {
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const amp = Math.min(T.ampCap != null ? T.ampCap : 400, (hs && hs.elementAmp) || 0),
    ampDot = T.ampDot != null ? T.ampDot : 2; // Elemental Amp counts double for damage over time
  const base = (1 + (ampDot * amp) / 100) * statusSkillMul() * (T.dotMul != null ? T.dotMul : 3.2) *
    (S.gear && S.gear.weapon && S.gear.weapon.wtype === "dagger" ? (T.daggerDot != null ? T.daggerDot : 1.15) : 1);
  return base * (1 - ((target && target.dotResist) || 0));
}
window.elemAmpMulV93 = function (hs) {
  return elemAmpMul(hs) * statusSkillMul();
};
/* Crit resistance only shrinks the bonus part of a crit. */
function resistedCritMult(target, tier, critDmg) {
  const m = critMultiplier(tier, critDmg),
    r = (target && target.critResist) || 0;
  return r > 0 && m > 1 ? 1 + (m - 1) * (1 - r) : m;
}
/* Some bosses shrug off one damage style. Keys: campaign stage index, Abyss = 100 + index.
   Never a wall: at most 40%, so every build can still win with better gear. */
const BOSS_RESIST = {
  15: { crit: 0.25 },
  105: { crit: 0.4 },
  107: { dot: 0.4 },
  109: { crit: 0.4 },
  112: { dot: 0.4 },
  114: { dot: 0.4 },
  115: { crit: 0.4 }
};
{
  const nextWaveBeforeResist = nextWave;
  nextWave = function () {
    const r = nextWaveBeforeResist.apply(this, arguments);
    try {
      if (run && !run.hunt && run.foes) {
        const key = (run.a && run.a.abyss ? 100 : 0) + run.ai,
          T = window.__abyssTune || {},
          res = (T.bossResist && T.bossResist[key]) || BOSS_RESIST[key];
        if (res)
          run.foes.forEach(f => {
            if (f.boss && !f.resistSet) {
              f.resistSet = true;
              f.critResist = res.crit || 0;
              f.dotResist = res.dot || 0;
            }
          });
      }
    } catch (e) {}
    return r;
  };
}

/* Weapon niches: the bow is the boss killer (bonus damage to bosses). */
{
  const heroStatsBeforeNiche = heroStats;
  heroStats = function () {
    const h = heroStatsBeforeNiche.apply(this, arguments);
    try {
      const w = S.gear && S.gear.weapon,
        T = window.__abyssTune || {};
      if (w && w.wtype === "bow") h._bossDamage = (h._bossDamage || 0) + (T.bowBoss != null ? T.bowBoss : 0.15);
    } catch (e) {}
    return h;
  };
}

/* Twin bosses: on these stages the boss arrives with an identical twin. Each has 60% of the
   normal health and damage, so area damage (Great Axe cleave, chain lightning, spreading
   poison) pays off. The twin drops no extra loot. Keys as in BOSS_RESIST. */
const TWIN_STAGES = { 4: 1, 9: 1, 104: 1, 108: 1, 113: 1 };
{
  const nextWaveBeforeTwin = nextWave;
  nextWave = function () {
    const r = nextWaveBeforeTwin.apply(this, arguments);
    try {
      const T = window.__abyssTune || {},
        key = run && run.a ? (run.a.abyss ? 100 : 0) + run.ai : -1,
        twins = T.twinStages || TWIN_STAGES;
      if (run && !run.hunt && !run.twinSpawned && twins[key]) {
        const boss = run.foes.find(f => f.boss && f.hp > 0);
        if (boss) {
          run.twinSpawned = true;
          const share = T.twinShare != null ? T.twinShare : 0.6;
          boss.max = Math.round(boss.max * share);
          boss.hp = Math.min(boss.hp, boss.max);
          boss.atk = Math.round(boss.atk * share);
          const twin = JSON.parse(JSON.stringify(boss));
          twin.twinV1 = true;
          twin.name = boss.name.replace(/^(\W*)/, "$1") + " II";
          twin._x = (boss._x || 405) + 62;
          twin.cd = (boss.cd || 600) + 450; // out of step with its twin
          twin.enter = 1;
          run.foes.push(twin);
          buildFoeBars();
          drawBars();
        }
      }
    } catch (e) {}
    return r;
  };
  const killFoeBeforeTwin = killFoe;
  killFoe = function (f) {
    if (f && f.twinV1 && !f.twinKilled) {
      f.twinKilled = true;
      f.boss = false; // count as an ordinary kill: no second boss loot, token or first-clear
      f.noDrop = true;
    }
    return killFoeBeforeTwin.apply(this, arguments);
  };
}
