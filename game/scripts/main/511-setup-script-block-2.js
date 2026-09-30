/* ================= script block 2 ================= */

/* ============================================================
   V70 · BUILD IDENTITIES, GUILD, DISCOVERY, ITEM LEGACY,
   PERSISTENT PITY, MEANINGFUL AUTO RUN STOPS, AND POLISH
   ============================================================ */
window.__forgeV7Boot = "starting";
window.addEventListener("error", function (event) {
  if (window.__forgeV7Boot === "ready" || document.getElementById("v7booterror")) return;
  var box = document.createElement("div");
  box.id = "v7booterror";
  box.style.cssText =
    "position:fixed;left:12px;right:12px;bottom:12px;z-index:999999;padding:12px 15px;border:2px solid #ff6f61;border-radius:10px;background:#210d0ded;color:#ffd8d2;font:700 12px/1.45 system-ui;box-shadow:0 8px 30px #000";
  box.textContent =
    "Version 7 startup stopped: " +
    (event.message || "unknown error") +
    ". The base game remains available, but the new systems did not finish loading.";
  document.body.appendChild(box);
});
ensureV70State();

const treeNodeCanBuyBase = treeNodeCanBuy;
treeNodeCanBuy = function (node) {
  return regularSkillSpendV70() < SKILL_BUDGET && treeNodeCanBuyBase(node);
};
resetSkillCost = function () {
  const n = investedSkillPoints();
  return n ? Math.round(250 * Math.pow(n, 1.35)) : 0;
};

/* ==== skillBonuses ==== */
/* ==== skillBonuses ==== */
/* ==== skillBonuses ==== */
/* ==== skillBonuses ==== */
/* ==== skillBonuses ==== */
/* ==== skillBonuses ==== */
const skillBonusesBase = skillBonuses;
skillBonuses = function () {
  let prevResult86;
  prev86: {
    const b = skillBonusesBase(),
      r = id => Number(S.skills && S.skills[id]) || 0,
      p = S.boonPctV51 || emptyBoonPct();
    b.dropChance = (b.dropChance || 0) + (p.dropChance || 0) / 100;
    b.bossDamage = (b.bossDamage || 0) + 0.25 * r("c6a");
    b.critDmg = (b.critDmg || 0) + 20 * r("c6a");
    b.statusPower = (b.statusPower || 0) + 0.35 * r("c6c");
    b.pierce = (b.pierce || 0) + 0.08 * r("c6c");
    b.atkSpeed = (b.atkSpeed || 0) + 20 * r("c6d");
    b.eleMult = (b.eleMult || 1) * (1 + 0.15 * r("c6d"));
    b.defMult = (b.defMult || 1) * (1 + 0.08 * r("h5b"));
    if (r("h6c")) {
      b.hpMult = (b.hpMult || 1) * 1.15;
      b.damageTaken = (b.damageTaken == null ? 1 : b.damageTaken) * 0.85;
    }
    if (r("h6d")) {
      b.healPower = (b.healPower || 1) + 0.35;
      b.healCdrSkill = (b.healCdrSkill || 0) + 25;
    }
    prevResult86 = b;
    break prev86;
  }
  const b = prevResult86;
  const r = id => Math.min(1, Number(S.skills && S.skills[id]) || 0),
    a = r("c6a"),
    c = r("c6c"),
    d = r("c6d");
  b.bossDamage = Math.max(0, (b.bossDamage || 0) - 0.35 * a);
  b.critDmg = Math.max(0, (b.critDmg || 0) - 23 * a);
  b.statusPower = Math.max(0, (b.statusPower || 0) - 0.5 * c);
  b.pierce = Math.max(0, (b.pierce || 0) - 0.13 * c);
  b.atkSpeed = (b.atkSpeed || 0) - 35 * d;
  if (d) {
    const withoutV51 = (b.eleMult || 1) / (1 + 0.15 * d),
      withoutOldCap = withoutV51 - 0.2 * d;
    b.eleMult = withoutOldCap + 0.12 * d;
  }
  return b;
};
/* Bulwark had two stacked implementations, yielding about 44% health and 25% reduction.
   Normalize the single point to 20% maximum health and 10% final damage reduction. */
const skillBonusesBeforeV61 = skillBonuses;
skillBonuses = function () {
  let prevResult87;
  prev87: {
    const b = skillBonusesBeforeV61(),
      rank = Math.min(1, Number(S.skills && S.skills.h6c) || 0);
    if (rank) {
      b.hpMult = b.hpMult / 1.15 - 0.25 + 0.2;
      b.damageTaken = (b.damageTaken / (0.88 * 0.85)) * 0.9;
    }
    prevResult87 = b;
    break prev87;
  }
  const b = prevResult87;
  const m = ensureTreeMastery(),
    combat = masteryTotal("combat", m.combat),
    loot = masteryTotal("loot", m.loot),
    faith = masteryTotal("heal", m.heal),
    smith = masteryTotal("smith", m.smith);
  b.atkMult = (b.atkMult || 1) * (1 + combat / 100);
  b.dropChance = (b.dropChance || 0) + loot / 100;
  b.hpMult = (b.hpMult || 1) * (1 + faith / 100);
  b.silverCritSuccess = (b.silverCritSuccess || 0) + smith / 100;
  return b;
};
const skillBonusesBeforeV70 = skillBonuses;
skillBonuses = function () {
  const b = skillBonusesBeforeV70(),
    c = contractKeyV70();
  if (c === "blood") b.dropChance = (b.dropChance || 0) + 0.06;
  if (c === "onslaught") {
    b.lootGold = (b.lootGold || 1) * 1.15;
    b.bossBags = (b.bossBags || 0) + 1;
  }
  if (c === "mastery") {
    b.bossBags = (b.bossBags || 0) + 3;
    b.rarityBoost = (b.rarityBoost || 0) + 2;
  } else if (c === "glass") b.rarityBoost = (b.rarityBoost || 0) + 1;
  if (c === "blood" || c === "mastery") b.healPower = (b.healPower || 1) * 0.5;
  return b;
};

/* ==== heroStats ==== */
/* ==== heroStats ==== */
/* ==== heroStats ==== */
/* ==== heroStats ==== */
/* ==== heroStats ==== */
/* ==== heroStats ==== */
const heroStatsBase = heroStats;
heroStats = function () {
  let prevResult88;
  prev88: {
    const h = heroStatsBase(),
      w = S.gear.weapon,
      helm = S.gear.helm,
      boots = S.gear.boots,
      armor = S.gear.armor,
      amulet = S.gear.amulet;
    if (w && w.mythicAffix === "mythicCrit") h.critChance += 25;
    if (w && w.mythicAffix === "mythicCritDmg") h.critDmg += 50;
    if (boots && boots.mythicAffix === "goldBoots") h.goldBoost = (h.goldBoost || 0) + 30;
    if (armor && armor.mythicAffix === "elementalWard") {
      h.fireRes += 35;
      h.iceRes += 35;
      h.lightRes += 35;
    }
    if (run && !run.over) {
      if (run.temperStacks && amulet && amulet.mythicAffix === "temper")
        h.atk *= 1 + Math.min(30, run.temperStacks) / 100;
      if (run.purityUntil > run.time) h.critChance *= 0.35;
      if (run.celestialSlowUntil > run.time) h.atkSpeed -= 25;
    }
    h._enrageCdMult = helm && helm.mythicAffix === "hotHeaded" ? 0.7 : 1;
    prevResult88 = h;
    break prev88;
  }
  const h = prevResult88;
  let power = 0;
  for (const slot of ["gloves", "amulet"]) {
    if (run && !run.over && run.suppressedSlot === slot && run.suppressedUntil > run.time) continue;
    const g = S.gear && S.gear[slot];
    if (g) power += gStat(g, "attackPower");
  }
  h.atk *= 1 + power / 100;
  h.attackPower = power;
  return h;
};
const heroStatsBeforeV51 = heroStats;
/* Elemental Ward now supplies a separate ten percent final reduction to Fire, Ice, and Lightning
   damage. Remove the obsolete rating grant so it cannot double dip with the new final layer. */
heroStats = function () {
  let prevResult89;
  prev89: {
    const h = heroStatsBeforeV51(),
      b = S.boonPctV51 || emptyBoonPct();
    h.atk *= 1 + (b.atk || 0) / 100;
    h.hp *= 1 + (b.hp || 0) / 100;
    h.def *= 1 + (b.def || 0) / 100;
    h.atkSpeed += b.atkSpeed || 0;
    h.critChance += b.critChance || 0;
    h.critDmg += b.critDmg || 0;
    h.dodge *= 1 + (b.dodge || 0) / 100;
    h.goldBoost = (h.goldBoost || 0) + (b.goldBoost || 0);
    prevResult89 = h;
    break prev89;
  }
  const h = prevResult89;
  if (S.gear && S.gear.armor && S.gear.armor.mythicAffix === "elementalWard") {
    h.fireRes = Math.max(0, (h.fireRes || 0) - 35);
    h.iceRes = Math.max(0, (h.iceRes || 0) - 35);
    h.lightRes = Math.max(0, (h.lightRes || 0) - 35);
  }
  return h;
};
const heroStatsBeforeV70 = heroStats;
heroStats = function () {
  const h = heroStatsBeforeV70(),
    w = S.gear && S.gear.weapon,
    d = activeDiscipline();
  if (d.active && regularSkillSpendV70() >= 20) {
    if (d.key === "fury") {
      h.def *= 0.85;
      h._berserk = (h._berserk || 1) * 1.3;
    } else if (d.key === "tempo") {
      h.atkSpeed = (h.atkSpeed || 0) + 14;
      h.dodge = (h.dodge || 0) + 8;
      h.hp *= 0.88;
    } else if (d.key === "bulwark") {
      h.def *= 1.22;
      h.hp *= 1.18;
      h.atk *= 0.82;
    } else if (d.key === "hunter") {
      h._bossDamage = (h._bossDamage || 0) + 0.24;
      h._woundDamage = (h._woundDamage || 0) + 0.12;
      h.atkSpeed = (h.atkSpeed || 0) - 10;
    } else if (d.key === "occult") {
      ["bleed", "poison", "burn", "frost", "doom"].forEach(k => (h[k] = (h[k] || 0) * 1.38));
      h.atk *= 0.84;
    }
  }
  const c = contractKeyV70();
  if (c === "blood" || c === "mastery") h.lifesteal = (h.lifesteal || 0) * 0.5;
  if (c === "glass" || c === "mastery") h.hp *= 0.7;
  return h;
};
const celestialAmpBase = celestialAmp;
celestialAmp = function (g) {
  return celestialAmpBase(g) * (g && g.mythicAffix === "mythicStatus" ? 1.35 : 1);
};
// weapon status-effect amplification was capped at celestial 10 — extend it to 13.
celestialAmp = function (g) {
  return 1 + Math.max(0, Math.min(8, ((g && g.celestial) || 0) - 5)) * 0.1;
};
// re-apply the V36 mythicStatus multiplier on top (it wrapped the old celestialAmpV18)
const celAmp = celestialAmp;
celestialAmp = function (g) {
  return celAmp(g) * (g && g.mythicAffix === "mythicStatus" ? 1.35 : 1);
};
const celestialAmpBeforeV70 = celestialAmp;
celestialAmp = function (g) {
  return (
    celestialAmpBeforeV70(g) *
    (activeDiscipline().active && S.disciplineV70 === "frost" && g && g.stats && g.stats.frost ? 1.4 : 1)
  );
};

window.forgeV70AxeCleaveBonus = function () {
  return 0;
};

/* ==== liveStats ==== */
/* ==== liveStats ==== */
/* ==== liveStats ==== */
/* ==== liveStats ==== */
/* ==== liveStats ==== */
/* ==== liveStats ==== */
const liveStatsBase = liveStats;
liveStats = function () {
  const active = xpBuffActive();
  if (run) run.xpMult = 1;
  let prevResult90;
  prev90: {
    const result = liveStatsBase(),
      g = S.gear.weapon,
      desc = celestialEffectDescription(g);
    if (desc) result.mods.push({ t: "✧ " + desc, c: "#caa8ff" });
    prevResult90 = result;
    break prev90;
  }
  const result = prevResult90;
  if (run) run.xpMult = active ? 2 : 1;
  if (active)
    result.mods.push({ t: "📖 Double XP · " + xpBuffTime(xpBuffRemaining()) + " remaining", c: "#7fe0a0" });
  return result;
};
const liveStatsBeforeV36 = liveStats;
liveStats = function () {
  let prevResult91;
  prev91: {
    const result = liveStatsBeforeV36();
    if (run && !run.over) {
      if (run.temperStacks && S.gear.amulet && S.gear.amulet.mythicAffix === "temper")
        result.mods.push({
          t: "✺ Temper ×" + run.temperStacks + " · +" + run.temperStacks + "% attack",
          c: "#45ded0"
        });
      if (run.joeStacks && S.gear.gloves && S.gear.gloves.mythicAffix === "threeFingerJoe")
        result.mods.push({
          t:
            "✺ Three Finger Joe ×" +
            run.joeStacks +
            " · " +
            (run.joeStacks * 0.1).toFixed(1) +
            "% Ultra Crit",
          c: "#45ded0"
        });
    }
    prevResult91 = result;
    break prev91;
  }
  const r = prevResult91;
  if (run && !run.over) {
    const red = celestialLeechReduction();
    r.mods = (r.mods || []).filter(m => !/Lifesteal reduced to 5%/.test(m.t));
    if (red > 0)
      r.mods.push({ t: "🩸 Lifesteal −" + Math.round(red * 100) + "% in this realm", c: "#d695b0" });
    if (deadlyActive()) r.mods.push({ t: "☠ Deadly enemies: −30 dodge chance", c: "#ff8a6a" });
  }
  return r;
};
const liveStatsBeforeV70 = liveStats;
liveStats = function () {
  const result = liveStatsBeforeV70(),
    d = activeDiscipline(),
    c = contractV70_v70();
  if (d.key !== "none")
    result.mods.push({
      t: d.cfg.icon + " " + d.cfg.name + (d.active ? " active" : " dormant"),
      c: d.active ? "#d6a8ff" : "#8b6d70"
    });
  if (c) result.mods.push({ t: c.icon + " Contract: " + c.name, c: c.color });
  return result;
};

/* Persistent pity is applied once to each completed item drop. Internal rarity rerolls stay pure. */
rollRarity = function (level) {
  let w = [100, 16, 3.6, 0.6, 0.09].map((x, i) => x * (1 + level * 0.013 * i)),
    t = w.reduce((a, b) => a + b, 0),
    x = Math.random() * t;
  for (let i = 0; i < w.length; i++) {
    if ((x -= w[i]) <= 0) return i;
  }
  return 0;
};
/* ---- makeDrop: later layers (moved here) ---- */
const makeDropBase = makeDrop;
/* high-roll (85-95%) mythic armor for the End guaranteed drop */
makeDrop = function (bag) {
  if (bag && bag.guaranteedMythicV50) {
    const g = makeGear(bag.slot, bag.lvl, 5);
    Object.keys(g.stats).forEach(st => {
      const mx = maxBaseRoll(g, st);
      g.stats[st] =
        mx > 3
          ? Math.round(mx * (0.85 + Math.random() * 0.1))
          : Math.round(mx * (0.85 + Math.random() * 0.1) * 10) / 10;
    });
    try {
      ensureMythic(g);
    } catch (e) {}
    return g;
  }
  {
    if (!bag) return makeDropBase(bag);
    let g;
    if (bag.unique === "bloodforged" && bag.rar === 5) {
      g = makeGear(bag.slot, bag.lvl, 5);
      g.unique = "bloodforged";
      g.growth = { kills: 0 };
      g.stats.lifesteal = Math.max(g.stats.lifesteal || 0, 1.5);
      ensureMythic(g);
    } else g = makeDropBase(bag);
    if (bag.celestialDrop) g.celestialDrop = true;
    if (bag.celestial != null) g.celestial = Math.max(g.celestial || 0, bag.celestial);
    return ensureMythic(g);
  }
  return;
};
const makeDropBeforeV70 = makeDrop;
makeDrop = function (bag) {
  if (bag && bag._preparedDropV70) return bag._preparedDropV70;
  let sourceBag = bag;
  if (bag && run && run.contractV70 === "iron")
    sourceBag = Object.assign({}, bag, { lvl: (Number(bag.lvl) || 1) + 2 });
  const g = makeDropBeforeV70(sourceBag);
  if (g)
    ensureHistory(g, {
      foundIn: run && run.a ? run.a.n : "Unknown area",
      source: bag && bag.boss && run && run.a ? run.a.boss : "Battlefield",
      acquiredAt: Date.now()
    });
  if (bag) bag._preparedDropV70 = g;
  return g;
};

/* ==== makeReforgeCandidateV13 ==== */
/* ==== makeReforgeCandidateV13 ==== */
/* ==== makeReforgeCandidateV13 ==== */
/* ---------- REFORGE: keep the base damage/main stat, tighten roll variance ---------- */
// (1) Reforge should re-roll only the affixes — the slot's main stat (weapon = Attack) is preserved.
const makeReforgeCandidateBase = makeReforgeCandidate;
makeReforgeCandidate = function (old) {
  const g = makeReforgeCandidateBase(old);
  const sd = SLOTS.find(s => s.key === (old && old.slot));
  const mainStat = sd && sd.main;
  if (g && mainStat && old && old.stats && old.stats[mainStat] != null)
    g.stats[mainStat] = old.stats[mainStat];
  return g;
};
makeReforgeCandidate = function (old) {
  let prevResult193;
  prev193: {
    const g = { slot: old.slot, ilvl: old.ilvl, rar: old.rar, plus: 0, stats: {} };
    if (old.wtype) g.wtype = old.wtype;
    Object.keys(old.stats || {}).forEach(stat => {
      g.stats[stat] =
        immutableBaseV54(old, stat) || stat === reforgeLockStat
          ? old.stats[stat]
          : uniformReforgeRoll(old, stat);
    });
    g.name = old.name;
    g.variant = old.variant;
    g.mythicAffix = old.mythicAffix;
    g.celestialDrop = old.celestialDrop;
    g.distributionV45 = old.distributionV45;
    g.accessoryScalingV54 = old.accessoryScalingV54;
    g.enrageScalingV54 = old.enrageScalingV54;
    prevResult193 = g;
    break prev193;
  }
  const g = prevResult193;
  if (old) {
    g.itemIdV70 = old.itemIdV70;
    g.historyV70 = old.historyV70;
  }
  ensureHistory(g);
  return g;
};

/* ==== gearDesc ==== */
/* ==== gearDesc ==== */
/* ==== gearDesc ==== */
/* ==== gearDesc ==== */
/* ==== gearDesc ==== */
/* ==== gearDesc ==== */
const gearDescBase = gearDesc;
gearDesc = function (g) {
  let prevResult92;
  prev92: {
    const base = gearDescBase(g),
      extra = celestialEffectDescription(g);
    prevResult92 =
      base + (extra ? '<br><span style="color:#9fd8ff;font-weight:700">✦5 ' + extra + "</span>" : "");
    break prev92;
  }
  const base = prevResult92;
  const info = mythicInfo(g);
  return (
    base +
    (info
      ? '<br><span class="mythicaffix ' +
        (g.mythicAffix === "swagger" ? "rainbow" : "") +
        '">✺ ' +
        info[0] +
        "</span> · " +
        info[1]
      : "")
  );
};
/* Crit Chance is a normal stat now, without the old golden star treatment. */
const gearDescBeforeV51 = gearDesc;
gearDesc = function (g) {
  let prevResult93;
  prev93: {
    prevResult93 = gearDescBeforeV51(g).replace(/★(?=\+)/g, "");
    break prev93;
  }
  const base = prevResult93;
  const h = ensureHistory(g);
  if ((h.kills || 0) < 100) return base;
  const when = h.acquiredAt ? new Date(h.acquiredAt).toLocaleDateString() : "Unknown";
  return (
    base +
    '<span class="itemhistoryv70"><b>Legacy awakened</b> · ' +
    h.source +
    " in " +
    h.foundIn +
    " · " +
    when +
    "<br>" +
    fmt(h.kills || 0) +
    " kills · " +
    fmt(h.bosses || 0) +
    " bosses · best hit " +
    fmt(h.highestHit || 0) +
    (h.victories && h.victories.length ? " · " + h.victories.slice(-2).join(" · ") : "") +
    "</span>"
  );
};

const hitFeelBase = window.heroHitShakeV67;
window.heroHitShakeV67 = function (dmg, tier) {
  if (hitFeelBase) hitFeelBase(dmg, tier);
  dmg = Number(dmg) || 0;
  const w = S.gear && S.gear.weapon;
  if (w) {
    const h = ensureHistory(w);
    h.highestHit = Math.max(h.highestHit || 0, Math.round(dmg));
  }
  let base = 0;
  if (hitHistory.length >= 5) {
    const sorted = hitHistory.slice().sort((a, b) => a - b);
    base = sorted[Math.floor(sorted.length * 0.55)] || 0;
  }
  hitHistory.push(dmg);
  if (hitHistory.length > 18) hitHistory.shift();
  const ratio = base > 0 ? dmg / base : 0,
    now = performance.now();
  if (now - lastImpact < 320) return;
  if ((tier || 0) >= 3 || ratio >= 3.2) {
    lastImpact = now;
    beep(82, 0.15, "sawtooth", 0.09);
    setTimeout(() => beep(820, 0.1, "sine", 0.07), 35);
  } else if ((tier || 0) >= 2 || ratio >= 2.05) {
    lastImpact = now;
    beep(118, 0.1, "triangle", 0.065);
    setTimeout(() => beep(570, 0.07, "sine", 0.05), 28);
  }
};

/* ==== buildFoe ==== */
/* ==== buildFoe ==== */
/* ==== buildFoe ==== */
/* ==== buildFoe ==== */
/* ==== buildFoe ==== */
/* ==== buildFoe ==== */
const buildFoeBeforeCasts = buildFoe;
buildFoe = function (key, lvl, hpMul, boss, name) {
  let prevResult35;
  prev35: {
    const f = buildFoeBeforeCasts(key, lvl, hpMul, boss, name);
    if (f.specialCd != null) f.specialCdMax = f.specialCd;
    if (run) f.theme = Math.max(0, Math.min(11, run.ai || 0));
    prevResult35 = f;
    break prev35;
  }
  const f = prevResult35;
  const t = ENEMIES[key];
  if (t && t.design) f.design = t.design;
  if (!boss && f.specialCd != null) {
    f.max = Math.round(f.max * 1.25);
    f.hp = f.max;
    f.specialCd = 500;
    f.specialCdMax = 500;
  }
  return f;
};
const buildFoeBase = buildFoe;
/* Abyss monster HP. Player damage scaled up a lot (armour cap + crits into the millions), so
   Abyss trash was getting 1-2 shot. Give regular Abyss mobs a big HP bump so they take several
   hits; bosses already scale to their real Abyss level, so they only get a small bump. */
buildFoe = function (key, lvl, hpMul, boss, name) {
  let prevResult194;
  prev194: {
    const f = buildFoeBase(key, lvl, hpMul, boss, name);
    if (["celoracle", "celpurifier", "celwarden"].includes(key)) {
      f.specialCd = 500;
      f.specialCdMax = 500;
    }
    prevResult194 = f;
    break prev194;
  }
  const f = prevResult194;
  if (f && run && run.a && run.a.abyss) {
    const T = (typeof window !== "undefined" && window.__abyssTune) || {};
    const depth = typeof abyssDepthV50 === "function" ? abyssDepthV50() : 0;
    const m = boss
      ? T.bossHpMul != null ? T.bossHpMul : 1.05
      : (T.mobHpMul != null ? T.mobHpMul : 3.5) + (T.mobHpSlope != null ? T.mobHpSlope : 0.05) * depth;
    f.max = Math.round(f.max * m);
    f.hp = f.max;
  }
  return f;
};
const buildFoeBeforeV70 = buildFoe;
buildFoe = function (key, lvl, hpMul, boss, name) {
  const f = buildFoeBeforeV70(key, lvl, hpMul, boss, name);
  if ((contractKeyV70() === "iron" || contractKeyV70() === "mastery") && f) {
    f.hp = Math.round(f.hp * 1.45);
    f.max = f.hp;
    f._guildHpV70 = true;
  }
  return f;
};

window.forgeV70AutoRunStart = function () {
  if (!autoBatch.active)
    autoBatch = { active: true, clears: 0, startBag: S.bag.length, startGold: S.gold, startShards: S.shards };
};
window.forgeV70AutoRunStop = function () {
  autoBatch.active = false;
};

/* Existing Compendium button is retained, but its contents are refreshed on every opening. */
if ($("compendiumbtn")) {
  const openCompendiumBeforeV70 = $("compendiumbtn").onclick;
  $("compendiumbtn").onclick = function (e) {
    refreshCompendiumV70();
    return openCompendiumBeforeV70 && openCompendiumBeforeV70.call(this, e);
  };
}
if ($("closecompendium")) {
  const closeCompendiumBeforeV70 = $("closecompendium").onclick;
  $("closecompendium").onclick = function (e) {
    const result = closeCompendiumBeforeV70 && closeCompendiumBeforeV70.call(this, e);
    scheduleSave();
    return result;
  };
}

setupGuild();
setupGoal();
renderTown();
refreshCompendiumV70();
scheduleSave();
if (!S.flags.v7TourV710) {
  S.flags.v7TourV710 = true;
  if (false)
    setTimeout(
      () =>
        showTip(
          "VERSION 7 SYSTEMS ACTIVE",
          "<b>Focused builds:</b> the Skill Tree now has a permanent 42 point build budget.<br><br><b>Mercenaries Guild:</b> use the Guild button to accept optional danger and reward contracts.<br><br><b>Discovery:</b> the Compendium reveals Mythic effects and monster research through play.<br><br><b>Automation:</b> Auto Run pauses for meaningful loot, death, or after five quiet clears."
        ),
      260
    );
}
if (S.flags.skillBudgetRefundV70 && !S.flags.skillBudgetNoticeV70) {
  S.flags.skillBudgetNoticeV70 = true;
  setTimeout(
    () =>
      showTip(
        "BUILD POINTS REFUNDED",
        "Your previous build used <b>" +
          S.flags.skillBudgetRefundV70 +
          " regular skill points</b>. They were refunded because builds now have a permanent budget of <b>" +
          SKILL_BUDGET +
          " points</b>.<br><br>Choose a focused skill build. Tree mastery remains available after completing a path."
      ),
    450
  );
}
document.title = "THE FORGE v7.3.0";
window.__forgeV7Boot = "ready";
window.forgeV70 = {
  version: GAME_VERSION,
  skillBudget: SKILL_BUDGET,
  disciplines: DISCIPLINES,
  contracts: CONTRACTS,
  ensureState: ensureV70State,
  applyPity: applyPityV70,
  refreshCompendium: refreshCompendiumV70,
  regularSkillSpend: regularSkillSpendV70,
  renderGuild: renderGuildV70,
  contractStageRecord: contractStageRecordV72,
  masteryReady: masteryReadyV72,
  contractKey: contractKeyV70
};
