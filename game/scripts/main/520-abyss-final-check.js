/* Abyss Omega is the final boss: it measures the whole loadout. Anything short of six maxed
   top-tier items (Mythic or Bloodforged, Celestial 13, Abyss item level) makes it tougher and
   harder-hitting. Nothing about this is shown to the player. */
function abyssItemReadiness(g) {
  if (!g || g.broken) return 0;
  const top = g.rar === 5 || g.unique === "bloodforged";
  const rarity = top ? 1 : [0.05, 0.1, 0.2, 0.35, 0.55][Math.max(0, Math.min(4, g.rar || 0))],
    level = Math.max(0, Math.min(1, ((g.ilvl || 1) - 140) / 45)),
    plus = Math.max(0, Math.min(1, (g.plus || 0) / 20)),
    cel = Math.max(0, Math.min(1, (g.celestial || 0) / 13));
  return rarity * 0.35 + level * 0.2 + plus * 0.15 + cel * 0.3;
}
function abyssLoadoutReadiness() {
  return SLOTS.reduce((sum, s) => sum + abyssItemReadiness(S.gear && S.gear[s.key]), 0) / SLOTS.length;
}
function abyssFinalProfile() {
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const score = abyssLoadoutReadiness(),
    need = T.finalNeed != null ? T.finalNeed : 1,
    gap = Math.max(0, need - score);
  return {
    score,
    healthMult: 1 + gap * (T.finalHp != null ? T.finalHp : 25),
    incomingMult: 1 + gap * (T.finalDmg != null ? T.finalDmg : 10)
  };
}
{
  const nextWaveBeforeAbyssFinal = nextWave;
  nextWave = function () {
    const r = nextWaveBeforeAbyssFinal.apply(this, arguments);
    try {
      if (run && !run.hunt && run.a && run.a.abyss && run.ai === 16 && run.wave > run.total) {
        const boss = run.foes && run.foes.find(f => f.boss && f.hp > 0);
        if (boss && !boss.abyssFinalCheck) {
          const p = abyssFinalProfile();
          boss.abyssFinalCheck = p.score;
          boss.max = Math.round(boss.max * p.healthMult);
          boss.hp = boss.max;
          boss.atk = Math.round(boss.atk * p.incomingMult);
          buildFoeBars();
          drawBars();
        }
      }
    } catch (e) {}
    return r;
  };
}
