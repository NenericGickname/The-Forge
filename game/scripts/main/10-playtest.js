/* Playtest presets and developer helpers. */

// Developer mode convenience grant. Activating it replaces the active loadout with a complete endgame test set.
function activateDeveloperMode() {
  if (S.developerMode) return;
  S.developerMode = true;
  S.gold = Math.max(S.gold, 10000000);
  S.shards = Math.max(S.shards, 10000000);
  S.slotsOpen = SLOTS.length;
  S.gear = {};
  SLOTS.forEach(sd => {
    const g = makeGear(sd.key, 80, 4);
    g.plus = 20;
    g.celestial = 6;
    g.reforges = 0;
    delete g.broken;
    S.gear[sd.key] = g;
  });
  S.sel = "weapon";
  beep(760, 0.14, "triangle");
  setTimeout(() => beep(1040, 0.18, "triangle"), 90);
  flash(cvar("--legendary"));
  saveGame(true);
}

function makePresetWeapon(type, effect, level, plus, celestial) {
  const g = makeWeapon(level, 4, type, effect);
  g.plus = plus;
  g.celestial = celestial;
  g.stats[effect] = maxBaseRoll(g, effect);
  g.name = "Playtest " + weaponTypeName(g) + " · " + STAT_LABEL[effect].replace(/^[^A-Za-z]+/, "");
  return g;
}

/* Playtest presets (Options → Playtest). Each needs an access code. Only a
   scrambled fingerprint of each code is stored, so the codes are not readable
   in the page source. (Anyone who edits the page can still skip this check.) */
function playtestCodeHash(str) {
  let h1 = 0xdeadbeef ^ 7,
    h2 = 0x41c6ce57 ^ 7;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}

/* One code guards the whole Playtest menu (asked when the menu opens, mobile.js); the presets
   inside load without a code (Doc, 2026-10-02). */
const PLAYTEST_GATE_HASH = "2057vwp4rpc";
function playtestGateOk(entered) {
  return entered != null && playtestCodeHash(String(entered).trim().toLowerCase()) === PLAYTEST_GATE_HASH;
}
window.playtestGateOk = playtestGateOk;

function requestPlaytestPresetV20(kind) {
  if (kind === "late")
    buildTestCharV91(); // item-inspection test character (defined in V91)
  else if (kind === "superlate") applySuperLatePreset();
  else applyPlaytestPresetV18(kind);
  grantPlaytestActivePoints();
  try {
    renderShop();
  } catch (e) {}
}

// A preset jumps straight to a high level, so give the active skill points that level would
// have earned (one per level after the first), minus any already invested.
function grantPlaytestActivePoints() {
  try {
    const a = S.actV111 || {};
    let invested = 0;
    ["pow", "dur", "cd"].forEach(k => Object.values(a[k] || {}).forEach(v => (invested += Number(v) || 0)));
    S.spA = Math.max(0, (S.heroLevel || 1) - 1 - invested);
    try {
      refreshBadges();
    } catch (e) {}
    saveGame(true);
  } catch (e) {}
}

// Super Late = the end of the Abyss: Mythic items at Abyss Omega's level, +20 ✦13 (Doc, 2026-10-01).
// window.__presetGear = { ilvl, cel } lets test tools build earlier stages of the climb.
function superLateGear() {
  const o = (typeof window !== "undefined" && window.__presetGear) || {};
  return { ilvl: o.ilvl || 240, cel: o.cel != null ? o.cel : 13 };
}

function makeSuperLateItem(slot, affix, effect, index) {
  let g;
  if (slot === "weapon") {
    const type =
      effect === "bleed"
        ? "sword"
        : effect === "poison"
          ? "bow"
          : effect === "frost"
            ? "dagger"
            : effect === "doom"
              ? "bow"
              : "sword";
    g = makeWeapon(superLateGear().ilvl, 5, type, effect);
    g.stats[effect] = maxBaseRoll(g, effect);
  } else g = makeGear(slot, superLateGear().ilvl, 5);
  g.mythicAffix = affix;
  g.variant = (index || 0) % 5;
  return maximizePlaytestItem(g);
}

function superLateInventory() {
  const items = [],
    effects = ["bleed", "poison", "burn", "frost", "doom"];
  MYTHIC_AFFIXES.weapon.forEach((affix, ai) =>
    effects.forEach((effect, ei) =>
      items.push(makeSuperLateItem("weapon", affix, effect, ai * effects.length + ei))
    )
  );
  ["helm", "boots", "armor", "gloves", "amulet"].forEach(slot =>
    MYTHIC_AFFIXES[slot].forEach((affix, i) => items.push(makeSuperLateItem(slot, affix, null, i)))
  );
  return items;
}

// Earlier version of maximizePlaytestItemV37(), extended by the functions that follow.
function maximizePlaytestItemBase(g) {
  let prevResult48;
  prev48: {
    if (!g) {
      prevResult48 = g;
      break prev48;
    }
    g.rar = 5;
    g.ilvl = superLateGear().ilvl;
    g.plus = 20;
    g.celestial = superLateGear().cel;
    g.maxPlusReached = 20;
    g.celestialAffixGranted = true;
    g.celestialDrop = true;
    delete g.broken;
    delete g.locked;
    Object.keys(g.stats || {}).forEach(stat => (g.stats[stat] = maxBaseRoll(g, stat)));
    ensureMythic(g);
    const info = mythicInfo(g);
    if (info)
      g.name =
        "Mythic " +
        (g.slot === "weapon" ? weaponTypeName(g) : SLOTS.find(s => s.key === g.slot).label) +
        " · " +
        info[0];
    prevResult48 = g;
    break prev48;
  }
  const item = prevResult48;
  if (item && item.slot === "weapon") item.stats.atk = maxBaseRoll(item, "atk");
  return item;
}

// Earlier version of maximizePlaytestItemV37(), extended by the functions that follow.
function maximizePlaytestItem(g) {
  if (g) g.distributionV45 = false;
  const item = maximizePlaytestItemBase(g);
  return applyItemDistribution(item, false, true);
}

function applySuperLatePreset() {
  const amount = 100000000;
  S.playtestPreset = "superlate";
  S.developerMode = false;
  S.heroLevel = 160;
  S.xp = 0;
  S.sp = 100;
  S.skills = {};
  S.gold = amount;
  S.shards = amount;
  S.epicShards = amount;
  S.celestialShards = amount;
  S.skullTokens = amount;
  S.guards = { low: amount, med: amount, high: amount, vhigh: amount };
  S.xpBuff = 0;
  S.xpBuffUntil = 0;
  S.slotsOpen = SLOTS.length;
  S.bagCap = 50;
  S.autoSalvageRar = -1;
  S.gearSetUnlocked = true;
  S.activeSet = 1;
  S.areaMax = AREAS.length - 1;
  S.clearedAreas = Array.from({ length: AREAS.length - 1 }, (_, i) => i);
  const active = {
    weapon: ["mythicStatus", "doom"],
    helm: ["hardHat"],
    boots: ["nimble"],
    armor: ["ironSkin"],
    gloves: ["threeFingerJoe"],
    amulet: ["reborn"]
  };
  const reserve = {
    weapon: ["mythicCritDmg", "burn"],
    helm: ["hotHeaded"],
    boots: ["goldBoots"],
    armor: ["mythicThorns"],
    gloves: ["kleptomaniac"],
    amulet: ["holyMission"]
  };
  S.gear = {};
  S.gear2 = {};
  SLOTS.forEach((sd, i) => {
    S.gear[sd.key] = makeSuperLateItem(sd.key, active[sd.key][0], active[sd.key][1], i);
    S.gear2[sd.key] = makeSuperLateItem(sd.key, reserve[sd.key][0], reserve[sd.key][1], i + 1);
  });
  S.bag = superLateInventory();
  S.sel = "weapon";
  saveGame(true);
  beep(820, 0.12, "triangle");
  flash("#30d4c5");
  renderTown();

  S.abyssUnlocked = true;
  S.abyssMode = false;
  S.abyssMax = AREAS.length - 1;
  S.abyssCleared = Array.from({ length: AREAS.length }, (_, i) => i);
  S.abyssTokens = 100000000;
  S.flags = S.flags || {};
  S.flags.endMythicGivenV50 = true;
  S.flags.firstShatterV50 = true;
  // Legally max the skill tree: respect each node's real max rank, prerequisites, the tier-6
  // level gate, and the exclusive-branch groups (one capstone per group). The old preset set most
  // nodes to rank 5 when the real cap is 3 (or 2), which displayed "more points than allowed" and
  // made the tester illegally overpowered.
  S.skills = {};
  S.sp = 999;
  try {
    let changed = true,
      guard = 0;
    while (changed && guard++ < 400) {
      changed = false;
      allTreeNodes().forEach(n => {
        if ((S.skills[n.id] || 0) < n.max && treeNodeCanBuy(n)) {
          S.skills[n.id] = (S.skills[n.id] || 0) + 1;
          S.sp--;
          changed = true;
        }
      });
    }
  } catch (e) {}
  S.sp = 0;
  [S.gear, S.gear2].forEach(set => {
    for (const k in set) {
      const g = set[k];
      if (g && g.rar === 5) {
        g.celestial = 13;
        g.maxPlusReached = 20;
      }
    }
  });
  try {
    const gax = makeWeapon(180, 5, "greataxe");
    gax.mythicAffix = "mythicCritDmg";
    if (typeof maximizePlaytestItem === "function") maximizePlaytestItem(gax);
    gax.celestial = 13;
    S.bag = S.bag || [];
    S.bag.unshift(gax);
  } catch (e) {}
  try {
    saveGame(true);
  } catch (e) {}
  try {
    renderTown();
  } catch (e) {}
}

function applyNormalLatePresetV50(kind) {
  const amount = 100000000;
  S.playtestPreset = kind || "late";
  S.developerMode = false;
  S.heroLevel = 160;
  S.xp = 0;
  S.gold = amount;
  S.shards = amount;
  S.epicShards = amount;
  S.celestialShards = amount;
  S.skullTokens = amount;
  S.guards = { low: amount, med: amount, high: amount, vhigh: amount };
  S.xpBuff = 0;
  S.xpBuffUntil = 0;
  S.slotsOpen = SLOTS.length;
  S.bagCap = 50;
  S.autoSalvageRar = -1;
  S.gearSetUnlocked = true;
  S.activeSet = 1;
  S.areaMax = AREAS.length - 1;
  S.clearedAreas = Array.from({ length: AREAS.length - 1 }, (_, i) => i);
  S.abyssUnlocked = true;
  S.abyssMode = false;
  S.abyssMax = AREAS.length - 1;
  S.abyssCleared = Array.from({ length: AREAS.length }, (_, i) => i);
  S.abyssTokens = amount;
  S.flags = S.flags || {};
  S.flags.endMythicGivenV50 = true;
  S.flags.firstShatterV50 = true;
  S.flags.skillCapsV50 = true;
  // legal maxed skills
  S.skills = {};
  S.sp = 999;
  try {
    let ch = true,
      g = 0;
    while (ch && g++ < 400) {
      ch = false;
      allTreeNodes().forEach(n => {
        if ((S.skills[n.id] || 0) < n.max && treeNodeCanBuy(n)) {
          S.skills[n.id] = (S.skills[n.id] || 0) + 1;
          S.sp--;
          ch = true;
        }
      });
    }
  } catch (e) {}
  S.sp = 0;
  // legendary (rar 4) gear, ilvl 160, +20, ✦10, well-rolled
  S.gear = {};
  S.gear2 = {};
  SLOTS.forEach(sd => {
    let g = sd.key === "weapon" ? makeWeapon(160, 4, "sword") : makeGear(sd.key, 160, 4);
    try {
      if (typeof maximizePlaytestItem === "function") maximizePlaytestItem(g);
    } catch (e) {}
    g.rar = 4;
    g.plus = 20;
    g.celestial = 10;
    g.maxPlusReached = 20;
    delete g.broken;
    delete g.mythicAffix;
    S.gear[sd.key] = g;
  });
  S.bag = [];
  S.sel = "weapon";
  try {
    saveGame(true);
  } catch (e) {}
  beep(720, 0.1, "triangle");
  flash("#9fd8ff");
  try {
    renderTown();
  } catch (e) {}
}

/* The "END GAME" (late) preset now gives this realistic ilvl-160 +20 ✦10 build with the Abyss
   unlocked (the old late preset was a weak lvl-80 ✦4 loadout). SUPER LATE stays the god build. */
function applyPlaytestPresetV18(kind) {
  if (kind === "late" || kind === "normallate") return applyNormalLatePresetV50("late");
  if (kind === "superlate") return applySuperLatePreset();
  const cfg =
    kind === "early"
      ? {
          level: 15,
          plus: 8,
          celestial: 0,
          hero: 15,
          area: 4,
          gold: 250000,
          shards: 50000,
          epic: 250,
          tokens: 10
        }
      : kind === "mid"
        ? {
            level: 40,
            plus: 14,
            celestial: 0,
            hero: 40,
            area: 8,
            gold: 2000000,
            shards: 500000,
            epic: 5000,
            tokens: 50
          }
        : {
            level: 80,
            plus: 20,
            celestial: 4,
            hero: 80,
            area: AREAS.length - 1,
            gold: 10000000,
            shards: 10000000,
            epic: 100000,
            tokens: 100
          };
  S.playtestPreset = kind;
  S.developerMode = false;
  S.heroLevel = cfg.hero;
  S.xp = 0;
  S.sp = Math.max(S.sp, kind === "late" ? 50 : kind === "mid" ? 28 : 12);
  S.gold = cfg.gold;
  S.shards = cfg.shards;
  S.epicShards = cfg.epic;
  S.skullTokens = cfg.tokens;
  S.slotsOpen = SLOTS.length;
  S.bagCap = kind === "late" ? 20 : Math.max(S.bagCap, 11);
  S.areaMax = cfg.area;
  S.clearedAreas = Array.from({ length: cfg.area }, (_, i) => i);
  S.gear = {};
  SLOTS.forEach(sd => {
    const g =
      sd.key === "weapon"
        ? makePresetWeapon("sword", "burn", cfg.level, cfg.plus, cfg.celestial)
        : makeGear(sd.key, cfg.level, 4);
    g.plus = cfg.plus;
    g.celestial = cfg.celestial;
    delete g.broken;
    S.gear[sd.key] = g;
  });
  S.bag = [];
  if (kind === "late") {
    S.bag = [
      makePresetWeapon("sword", "bleed", 80, 20, 4),
      makePresetWeapon("bow", "poison", 80, 20, 4),
      makePresetWeapon("dagger", "doom", 80, 20, 4),
      makePresetWeapon("sword", "burn", 80, 20, 4),
      makePresetWeapon("dagger", "frost", 80, 20, 4),
      makePresetWeapon("bow", "doom", 80, 20, 4),
      makePresetWeapon("dagger", "poison", 80, 20, 4)
    ];
  }
  S.sel = "weapon";
  saveGame(true);
  beep(720, 0.1, "triangle");
  flash("#9fd8ff");
  renderTown();

  return;

  return;
}
