/* Playtest build sets (Doc, 2026-10-01): three styles at two moments of the game.
   Styles:  crit (Precise items), hybrid (Balanced items), elemental (Elemental items)
   Moments: campaign end (ilvl 160, +20 ✦10, Omega open, Abyss locked)
            abyss end    (ilvl 240, +20 ✦13, every Abyss stage open)
   Every set comes with a bag holding each weapon type with each effect it can carry, all in the
   set's style, so weapons and effects can be swapped freely. Campaign sets use the END GAME
   access code, Abyss sets the SUPER LATE code. Picked from Options → Playtest (mobile.js). */
const PLAYTEST_BUILDS = {
  crit: {
    label: "⚔ Crit",
    arch: "crit",
    weapon: ["sword", "bleed"],
    wMythic: "mythicCritDmg",
    gloves: "threeFingerJoe",
    order: ["critDmg", "critChance"]
  },
  hybrid: {
    label: "⚖ Hybrid",
    arch: "balanced",
    weapon: ["dagger", "poison"],
    wMythic: "mythicCrit",
    gloves: "threeFingerJoe",
    order: ["elementAmp", "critDmg"]
  },
  elemental: {
    label: "✨ Elemental",
    arch: "elemental",
    weapon: ["dagger", "burn"],
    wMythic: "mythicStatus",
    gloves: "healingHands",
    order: ["elementAmp"]
  }
};
const PLAYTEST_MOMENTS = {
  campaign: { label: "Campaign end · Omega", ilvl: 160, cel: 10, armourRar: 4, code: "late" },
  abyss: { label: "Abyss end", ilvl: 240, cel: 13, armourRar: 5, code: "superlate" }
};
// every style shares the same defensive tail; styles differ only in their offensive affixes
const PLAYTEST_COMMON_AFFIXES = ["atkSpeed", "lifesteal", "hp", "def", "dodge", "fireRes", "iceRes", "lightRes", "enrage", "lootChance"];
const PLAYTEST_ARMOUR_MYTHIC = { helm: "hardHat", boots: "nimble", armor: "ironSkin", amulet: "reborn" };

// Rebuild an item's affixes for a style: keep the main stat (and a weapon's effect), then fill the
// item's affix count from the style's priority list, every stat at its best roll.
function shapePlaytestItem(g, build, moment, effect) {
  const sd = SLOTS.find(s => s.key === g.slot),
    pool = g.slot === "weapon" ? weaponSlot.affixes : sd.affixes,
    // built-in stats every item of the slot carries (armour and boots health, accessory attack power)
    base = { armor: ["hp"], boots: ["hp"], gloves: ["attackPower"], amulet: ["attackPower"] }[g.slot] || [],
    count = Math.max(1, g.rar || 4); // a full set of affixes: 5 on Mythic items, 4 on Legendary
  g.archetype = build.arch;
  g.archRolled = true;
  const old = g.stats;
  g.stats = { [sd.main]: old[sd.main] || 1 };
  base.forEach(k => (g.stats[k] = old[k] || 1));
  if (g.slot === "weapon" && g.wtype === "bow") g.stats.critChance = 1; // bows always carry crit
  if (effect) g.stats[effect] = 1;
  let n = count - (effect ? 1 : 0);
  for (const st of build.order.concat(PLAYTEST_COMMON_AFFIXES)) {
    if (n <= 0) break;
    if (st in g.stats || !pool.includes(st) || EXCL.has(st)) continue;
    if (st === "elementAmp" && build.arch === "crit") continue;
    g.stats[st] = 1;
    n--;
  }
  Object.keys(g.stats).forEach(st => {
    try {
      const v = maxBaseRoll(g, st);
      if (v > 0) g.stats[st] = v;
    } catch (e) {}
  });
  g.ilvl = moment.ilvl;
  g.plus = 20;
  g.maxPlusReached = 20;
  g.celestial = moment.cel;
  g.celestialAffixGranted = true;
  g.celestialDrop = true;
  g.distributionV45 = true;
  delete g.broken;
  delete g.locked;
  return g;
}

function makePlaytestBuildWeapon(build, moment, type, effect, index) {
  const g = makeWeapon(moment.ilvl, 5, type, effect || undefined);
  g.mythicAffix = type === "greataxe" ? "mythicCritDmg" : effect ? build.wMythic : build.wMythic === "mythicStatus" ? "mythicCritDmg" : build.wMythic;
  g.variant = (index || 0) % 5;
  shapePlaytestItem(g, build, moment, effect);
  const info = typeof mythicInfo === "function" && mythicInfo(g);
  g.name =
    "Mythic " + weaponTypeName(g) + (effect ? " · " + { bleed: "Bleed", poison: "Poison", burn: "Burn", frost: "Frost", lightning: "Lightning", doom: "Doom" }[effect] : "") + (info ? " · " + info[0] : "");
  return g;
}

function makePlaytestBuildArmour(build, moment, slot, index) {
  const g = makeGear(slot, moment.ilvl, moment.armourRar);
  if (moment.armourRar === 5) {
    g.mythicAffix = slot === "gloves" ? build.gloves : PLAYTEST_ARMOUR_MYTHIC[slot];
    g.variant = (index || 0) % 5;
  } else delete g.mythicAffix;
  g.rar = moment.armourRar;
  shapePlaytestItem(g, build, moment, null);
  const info = moment.armourRar === 5 && typeof mythicInfo === "function" && mythicInfo(g);
  g.name = (moment.armourRar === 5 ? "Mythic " : "Legendary ") + SLOTS.find(s => s.key === slot).label + (info ? " · " + info[0] : "");
  return g;
}

function applyPlaytestBuild(style, momentKey) {
  const build = PLAYTEST_BUILDS[style],
    moment = PLAYTEST_MOMENTS[momentKey];
  if (!build || !moment) return;
  // currencies, legal max skill tree and story flags come from the Super Late preset
  applySuperLatePreset();
  S.playtestPreset = momentKey + "-" + style;
  const gear = {};
  SLOTS.forEach((sd, i) => {
    gear[sd.key] =
      sd.key === "weapon"
        ? makePlaytestBuildWeapon(build, moment, build.weapon[0], build.weapon[1], i)
        : makePlaytestBuildArmour(build, moment, sd.key, i);
  });
  S.gear = gear;
  S.gear2 = {};
  const bag = [];
  ["sword", "bow", "dagger"].forEach(type =>
    legalWeaponEffects(type).forEach(effect => {
      if (type === build.weapon[0] && effect === build.weapon[1]) return;
      bag.push(makePlaytestBuildWeapon(build, moment, type, effect, bag.length));
    })
  );
  bag.push(makePlaytestBuildWeapon(build, moment, "greataxe", null, bag.length));
  S.bag = bag;
  S.bagCap = Math.max(50, bag.length + 20);
  S.autoSalvageRar = -1;
  if (momentKey === "campaign") {
    // campaign end: everything up to Celestial Gamma cleared, Omega open, the Abyss not yet reached
    S.areaMax = AREAS.length - 1;
    S.clearedAreas = Array.from({ length: AREAS.length - 1 }, (_, i) => i);
    S.abyssUnlocked = false;
    S.abyssMode = false;
    S.abyssCleared = [];
    S.abyssMax = 0;
  } else {
    S.abyssUnlocked = true;
    S.abyssMode = true;
  }
  S.sel = "weapon";
  try {
    saveGame(true);
  } catch (e) {}
  try {
    renderTown();
  } catch (e) {}
  try {
    showTip(
      "PLAYTEST · " + build.label.toUpperCase() + " · " + moment.label.toUpperCase(),
      "Six " +
        (moment.armourRar === 5 ? "Mythic" : "items (Mythic weapon, Legendary armour)") +
        (moment.armourRar === 5 ? " items" : "") +
        " at item level " +
        moment.ilvl +
        ", +20 ✦" +
        moment.cel +
        ", all " +
        ARCHETYPES[build.arch].n +
        ". Your bag holds every weapon type with every effect it can carry, plus a Great Axe, in the same style." +
        (momentKey === "campaign" ? " Omega is open; the Abyss is still locked." : " Every Abyss stage is open.")
    );
  } catch (e) {}
}

{
  const requestBeforeBuilds = requestPlaytestPresetV20;
  requestPlaytestPresetV20 = function (kind) {
    const m = /^(campaign|abyss)-(crit|hybrid|elemental)$/.exec(String(kind || ""));
    if (!m) return requestBeforeBuilds.apply(this, arguments);
    const entered = prompt("Enter playtest access code");
    if (entered == null) return;
    if (playtestCodeHash(String(entered).trim().toLowerCase()) !== PLAYTEST_CODE_HASHES[PLAYTEST_MOMENTS[m[1]].code]) {
      try {
        beep(120, 0.12, "square", 0.05);
      } catch (e) {}
      showTip("ACCESS DENIED", "The playtest code is incorrect.");
      return;
    }
    applyPlaytestBuild(m[2], m[1]);
    grantPlaytestActivePoints();
    try {
      renderShop();
    } catch (e) {}
  };

  window.applyPlaytestBuild = applyPlaytestBuild;
}
