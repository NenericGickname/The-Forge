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
/* Per-effect scaling: M = c × (1 + k × amp) × tree × skill. c is what a build without
   Elemental Amp gets (small), k is how strongly amp carries the effect. Doom fills an execute
   bar from hit damage, so it gets no base factor at all. Tuned 2026-10-01 so an Elemental set
   with its best effect lands near a pure crit set. Knobs: window.__abyssTune.dot[kind]. */
const DOT_SCALE = {
  poison: { c: 6, k: 1.2 },
  burn: { c: 1.8, k: 0.85 },
  bleed: { c: 9, k: 1.1 },
  doom: { c: 7.5, k: 1.1 },
  lightning: { c: 4, k: 4 }
};
function statusMulFor(target, hs, kind) {
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const sc = Object.assign({}, DOT_SCALE[kind || "poison"], (T.dot && T.dot[kind || "poison"]) || {}),
    amp = Math.min(T.ampCap != null ? T.ampCap : 600, (hs && hs.elementAmp) || 0) / 100;
  // Doom grows with amp^2.5: a partial amp build gets little, a dedicated one a lot
  // (Doc, 2026-10-01: "50% of the damage without a dedicated amp build").
  let m =
    kind === "doom"
      ? (T.doomBase != null ? T.doomBase : 0.4) + (T.doomSq != null ? T.doomSq : 0.5) * Math.pow(amp, T.doomExp != null ? T.doomExp : 2.5)
      : sc.c * (1 + sc.k * amp);
  // lightning already carries the tree and skill bonus inside hs.lightning
  // doom is an execute: the skill helps it less (square root of the bonus)
  if (kind === "doom") m *= Math.sqrt(statusSkillMul());
  else if (kind !== "lightning") m *= statusSkillMul();
  const w = S.gear && S.gear.weapon;
  if (w && w.wtype === "dagger" && kind !== "doom" && kind !== "lightning") m *= T.daggerDot != null ? T.daggerDot : 1.15;
  return m * (1 - ((target && target.dotResist) || 0));
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

/* Status leech (Doc, 2026-10-02): poison, burn, bleed, lightning and doom damage heal through Leech
   at three quarters of the rate of weapon hits, with the same per-hit cap and the same realm reduction. Without
   it, Elemental and Hybrid sets dealt twice the crit set's damage on Abyss Omega but healed half as
   much, and died in the waves. Knob: window.__abyssTune.statusLeech (fraction, default 0.75). */
function statusLeech(dmg, hs) {
  try {
    if (!run || !run.hero || !(dmg > 0)) return;
    hs = hs || heroStats();
    if (!(hs.lifesteal > 0)) return;
    const T = (typeof window !== "undefined" && window.__abyssTune) || {},
      frac = T.statusLeech != null ? T.statusLeech : 0.75,
      lr = typeof celestialLeechReductionV50 === "function" ? celestialLeechReductionV50() : 0,
      heal = Math.min(run.hero.max * (hs._leechCap || 0.04), ((dmg * leechPct(hs.lifesteal)) / 100) * (1 - lr) * frac);
    if (heal > 0) {
      run._healingContextV41 = "Leech (effects)";
      run.hero.hp = Math.min(run.hero.max, run.hero.hp + heal);
    }
  } catch (e) {}
}
window.statusLeech = statusLeech;
