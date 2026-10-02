/* Abyss monster strength vs item level (Doc, 2026-10-02).
   Abyss stages are level 180 to 240 and drop items of that level, but monster attack grows about
   2.4% per level against 0.6% for items, so level 240 monsters hit 77% harder than the old level
   214 ones. Monsters are therefore built at the old strength level (178 to 214) and only carry the
   new level as their displayed and drop level; the per-stage growth in abyssDamageMul,
   abyssBossHP and the mob health multiplier controls difficulty.
   Knobs: window.__abyssTune.statLevelBase (178), statLevelSpan (36). */
{
  const buildFoeBeforeStatLevel = buildFoe;
  buildFoe = function (key, lvl, hpMul, boss, name) {
    if (!(run && run.a && run.a.abyss) || !(lvl > 0)) return buildFoeBeforeStatLevel.apply(this, arguments);
    const T = (typeof window !== "undefined" && window.__abyssTune) || {},
      lb = T.levelBase != null ? T.levelBase : 180,
      ls = T.levelSpan != null ? T.levelSpan : 60,
      sb = T.statLevelBase != null ? T.statLevelBase : 178,
      ss = T.statLevelSpan != null ? T.statLevelSpan : 36,
      statLvl = Math.round(sb + ((lvl - lb) / ls) * ss);
    const f = buildFoeBeforeStatLevel.call(this, key, statLvl, hpMul, boss, name);
    if (f) f.lvl = lvl;
    return f;
  };
}
