/* Game state: defaults, migrations, local save, portable save files. */

function saveGame(quiet) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 5, state: S, lastArea }));
    if (!quiet) {
      const b = $("savebtn");
      if (b) {
        b.textContent = "✓";
        clearTimeout(b._t);
        b._t = setTimeout(() => (b.textContent = "💾"), 650);
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveGame(true), 180);
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    normalizeStateV5(JSON.parse(raw));
    return true;
  } catch (e) {
    return false;
  }
}

function migrateItemVariants() {
  [S.gear, S.gear2].forEach(set => {
    for (const k in set) ensureItemVariant(set[k]);
  });
  S.bag.forEach(ensureItemVariant);
}

function migrateEnrage() {
  S.flags = S.flags || {};
  if (S.flags.enrageV11) return;
  [S.gear, S.gear2].forEach(set => {
    for (const key in set) {
      const g = set[key];
      if (g && g.stats && g.stats.enrage != null)
        g.stats.enrage = Math.min(g.stats.enrage, maxBaseRoll(g, "enrage"));
    }
  });
  (S.bag || []).forEach(g => {
    if (g && g.stats && g.stats.enrage != null)
      g.stats.enrage = Math.min(g.stats.enrage, maxBaseRoll(g, "enrage"));
  });
  S.flags.enrageV11 = true;
}

function migrateWeapons() {
  S.flags = S.flags || {};
  if (S.flags.weaponsV18) return;
  const clean = g => {
    if (!g || g.slot !== "weapon") return;
    if (!["sword", "bow", "dagger"].includes(g.wtype)) g.wtype = "sword";
    if (g.wtype === "sword") delete g.stats.poison;
    if (g.wtype === "bow") delete g.stats.bleed;
    g.name =
      (g.unique === "bloodforged"
        ? "Bloodforged "
        : RAR[g.rar].k[0].toUpperCase() + RAR[g.rar].k.slice(1) + " ") + weaponTypeName(g);
  };
  [S.gear, S.gear2].forEach(set => {
    for (const k in set) clean(set[k]);
  });
  (S.bag || []).forEach(clean);
  S.flags.weaponsV18 = true;
}

function portableGearSet(raw) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  SLOTS.forEach(sd => {
    const g = portableItem(raw[sd.key]);
    if (g) out[sd.key] = g;
  });
  return out;
}

function portableBag(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 500).map(portableItem).filter(Boolean);
}

function exportPortableSave() {
  try {
    saveGame(true);
    const json = JSON.stringify(buildPortableSaveV19(), null, 2),
      blob = new Blob([json], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a"),
      stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "_");
    a.href = url;
    a.download = "The_Forge_Save_" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    beep(720, 0.08, "triangle");
    showTip(
      "SAVE FILE DOWNLOADED",
      "Keep this JSON file somewhere safe. A newer release of The Forge can load it with <b>LOAD FILE</b>."
    );
  } catch (e) {
    showTip(
      "SAVE FILE FAILED",
      "The browser could not create the download. Try opening the game in a normal browser window."
    );
  }
}

function importPortableSave(file) {
  if (!file) return;
  if (file.size > PORTABLE_SAVE_MAX_BYTES) {
    showTip(
      "SAVE FILE TOO LARGE",
      "Portable saves are small data files. This file is larger than 2 MB and was not opened."
    );
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "")),
        next = stateFromPortableV19(parsed);
      if (!confirm("Load this save file and replace the progress currently stored in this browser?")) return;
      clearInterval(timer);
      run = null;
      normalizeStateV5({ version: 5, state: next, lastArea: null });
      migrateSkillTree();
      migrateItemVariants();
      migrateEnrage();
      migrateWeapons();
      migrateEndArea();
      saveGame(true);
      document.querySelectorAll(".overlay.on").forEach(el => el.classList.remove("on"));
      $("run").style.display = "none";
      $("town").style.display = "grid";
      renderTown();
      renderStatPanel();
      beep(760, 0.12, "triangle");
      flash("#7fe0a0");
      showTip(
        "SAVE LOADED",
        "Your equipment, inventory, level, skills, resources, purchases, and cleared stages were restored using the current game rules."
      );
    } catch (e) {
      showTip(
        "SAVE FILE NOT LOADED",
        textV19(e && e.message, 180) || "The file is damaged or is not a compatible The Forge save."
      );
    } finally {
      $("savefileinput").value = "";
    }
  };
  reader.onerror = () => {
    showTip("SAVE FILE NOT LOADED", "The browser could not read this file.");
    $("savefileinput").value = "";
  };
  reader.readAsText(file);
}

function migrateXpBuff() {
  S.flags = S.flags || {};
  if (!S.flags.xpTimerV22) {
    const charges = Math.max(0, S.xpBuff || 0);
    if (charges) S.xpBuffUntil = Math.max(Date.now(), S.xpBuffUntil || 0) + charges * XP_BUFF_DURATION;
    S.flags.xpTimerV22 = true;
  }
  S.xpBuff = 0;
}

function migrateXpCurve() {
  S.flags = S.flags || {};
  if (S.flags.xpCurveV27) return;
  const lv = Math.max(1, Math.floor(Number(S.heroLevel) || 1)),
    oldNeed = legacyXpFor(lv),
    oldXp = Math.max(0, Number(S.xp) || 0),
    progress = Number.isFinite(oldNeed) && oldNeed > 0 ? Math.min(0.999, oldXp / oldNeed) : 0;
  S.xp = Math.round(xpFor(lv) * progress);
  S.flags.xpCurveV27 = true;
}

function migrateCritBalance(state = S) {
  state.flags = state.flags || {};
  if (state.flags.critBalanceV32) return state;
  const clean = g => {
    if (!g || !g.stats || g.stats.critChance == null) return;
    const cap =
      g.slot === "weapon" && g.wtype === "bow" ? bowBaseCrit(g.rar, 1.1) : maxBaseRoll(g, "critChance");
    g.stats.critChance = Math.min(Math.max(0, Number(g.stats.critChance) || 0), cap);
  };
  [state.gear, state.gear2].forEach(set => {
    for (const key in set || {}) clean(set[key]);
  });
  (state.bag || []).forEach(clean);
  state.flags.critBalanceV32 = true;
  return state;
}

function migrateXpCurveV33(state = S) {
  state.flags = state.flags || {};
  if (state.flags.xpCurveV33) return state;
  const lv = Math.max(1, Math.floor(Number(state.heroLevel) || 1)),
    oldNeed = xpForBase(lv),
    progress = oldNeed > 0 ? Math.min(0.999, Math.max(0, Number(state.xp) || 0) / oldNeed) : 0;
  state.xp = Math.round(xpFor(lv) * progress);
  state.flags.xpCurveV33 = true;
  return state;
}

function migrateXpCurveV34(state = S) {
  state.flags = state.flags || {};
  if (state.flags.xpCurveV34) return state;
  const lv = Math.max(1, Math.floor(Number(state.heroLevel) || 1)),
    oldNeed = xpForBeforeV34(lv),
    progress = oldNeed > 0 ? Math.min(0.999, Math.max(0, Number(state.xp) || 0) / oldNeed) : 0;
  state.xp = Math.round(xpFor(lv) * progress);
  state.flags.xpCurveV34 = true;
  return state;
}

function migrateDaggerAffixes(state = S) {
  state.flags = state.flags || {};
  if (state.flags.daggerAffixesV35) return state;
  const clean = g => {
    if (!g || g.slot !== "weapon" || g.wtype !== "dagger" || (g.plus || 0) > 0 || (g.celestial || 0) > 0)
      return;
    const extras = Object.keys(g.stats || {}).filter(k => k !== "atk" && k !== "atkSpeed"),
      allowed = Math.max(0, Math.min(4, g.rar || 0));
    if (extras.length <= allowed) return;
    const priority = [
        "doom",
        "bleed",
        "poison",
        "burn",
        "frost",
        "fire",
        "ice",
        "lightning",
        "enrage",
        "lifesteal",
        "critDmg",
        "critChance"
      ],
      keep = new Set(
        priority
          .filter(k => extras.includes(k))
          .concat(extras.filter(k => !priority.includes(k)))
          .slice(0, allowed)
      );
    extras.forEach(k => {
      if (!keep.has(k)) delete g.stats[k];
    });
  };
  [state.gear, state.gear2].forEach(set => {
    for (const key in set || {}) clean(set[key]);
  });
  (state.bag || []).forEach(clean);
  state.flags.daggerAffixesV35 = true;
  return state;
}

function migrateForgeMilestones(state = S) {
  state.flags = state.flags || {};
  if (state.flags.forgeMilestonesV36) return state;
  const clean = g => {
    if (!g) return;
    const mandatory = new Set(mandatoryStats(g)),
      extras = Object.keys(g.stats || {}).filter(k => !mandatory.has(k)).length,
      bonus = Math.max(0, extras - baseAffixAllowance(g));
    let reached = Math.max(0, Math.min(20, g.plus || 0));
    if ((g.plus || 0) === 9 && bonus > 0) reached = Math.max(reached, 10);
    if ((g.plus || 0) === 19 && bonus > 1) reached = Math.max(reached, 20);
    g.maxPlusReached = Math.max(g.maxPlusReached || 0, reached);
    if ((g.celestial || 0) >= 10) g.celestialAffixGranted = true;
  };
  [state.gear, state.gear2].forEach(set => {
    for (const k in set || {}) clean(set[k]);
  });
  (state.bag || []).forEach(clean);
  state.flags.forgeMilestonesV36 = true;
  return state;
}

function migrateMythicBalance(state = S, scaleExisting = true) {
  state.flags = state.flags || {};
  if (state.flags.mythicBalanceV39) return state;
  state.flags.mythicBalanceV39 = true;
  return state;
}

function migrateItemDistribution(state = S) {
  state.flags = state.flags || {};
  const clean = g => applyItemDistribution(g, false, false);
  [state.gear, state.gear2].forEach(set => {
    for (const key in set || {}) clean(set[key]);
  });
  (state.bag || []).forEach(clean);
  state.flags.itemDistributionV45 = true;
  return state;
}

function migrateEndArea() {
  if (S.clearedAreas.includes(11)) S.areaMax = Math.max(S.areaMax, 12);
}

function migrateItem(g) {
  if (!g || !g.stats) return g;
  const isAccessory = accessory(g);
  if (isAccessory && !g.accessoryScalingV56) {
    Object.keys(g.stats).forEach(stat => {
      if (stat === "attackPower") return;
      const oldMax = g.accessoryScalingV54
          ? legacyAccessoryAffixMax(g, stat)
          : stat === "enrage"
            ? oldEnrageMax(g)
            : maxBaseRollBeforeV54(g, stat),
        newMax = accessoryAffixMaxV54(g, stat),
        ratio = Math.max(0.7 / 1.3, Math.min(1, (g.stats[stat] || 0) / Math.max(0.0001, oldMax)));
      g.stats[stat] = roundRaw(stat, newMax * ratio);
    });
    if (g.stats.attackPower == null) g.stats.attackPower = 1;
    g.accessoryScalingV54 = true;
    g.accessoryScalingV56 = true;
    g.enrageScalingV54 = true;
  } else if (g.stats.enrage != null && !g.enrageScalingV54) {
    const ratio = Math.max(0.7 / 1.3, Math.min(1, (g.stats.enrage || 0) / Math.max(0.0001, oldEnrageMax(g))));
    g.stats.enrage = roundRaw("enrage", maxBaseRoll(g, "enrage") * ratio);
    g.enrageScalingV54 = true;
  }
  return g;
}

function migrateItems(state = S) {
  [state.gear, state.gear2].forEach(set => {
    for (const key in set || {}) migrateItem(set[key]);
  });
  (state.bag || []).forEach(migrateItem);
  state.flags = state.flags || {};
  state.flags.accessoryScalingV54 = true;
  return state;
}

function migrateCombatCapstonesV56() {
  S.flags = S.flags || {};
  if (S.flags.combatCapstonesV56) return 0;
  let refund = 0;
  Object.keys(COMBAT_CAPSTONES).forEach(id => {
    const rank = Math.max(0, Number(S.skills && S.skills[id]) || 0);
    if (rank > 1) {
      refund += rank - 1;
      S.skills[id] = 1;
    }
  });
  S.sp = (S.sp || 0) + refund;
  S.flags.combatCapstonesV56 = true;
  return refund;
}

// Earlier version of carryIdentity(), extended by the functions that follow.
function carryIdentityBase(ng, old) {
  let g;
  prev5: {
    ng.plus = old.plus || 0;
    ng.celestial = Math.min(10, old.celestial || 0);
    ng.reforges = (old.reforges || 0) + 1;
    if (old.unique) {
      ng.unique = old.unique;
      ng.name = old.name;
      ng.growth = JSON.parse(JSON.stringify(old.growth || { kills: 0 }));
    }
    g = ng;
    break prev5;
  }
  /* ---- carryIdentity: later layers (moved here) ---- */
  g.variant = ensureItemVariant(old);
  return g;
}

// Earlier version of carryIdentity(), extended by the functions that follow.
function carryIdentityBeforeV36(ng, old) {
  let prevResult49;
  prev49: {
    const result = carryIdentityBase(ng, old);
    if (old.slot === "weapon") {
      result.wtype = old.wtype;
      if (!old.unique)
        result.name =
          RAR[result.rar].k[0].toUpperCase() +
          RAR[result.rar].k.slice(1) +
          " " +
          (old.wtype === "bow" ? "Bow" : "Sword");
    }
    prevResult49 = result;
    break prev49;
  }
  const result = prevResult49;
  if (old.slot === "weapon") {
    result.wtype = old.wtype;
    if (!old.unique)
      result.name =
        RAR[result.rar].k[0].toUpperCase() + RAR[result.rar].k.slice(1) + " " + weaponTypeName(result);
  }
  return result;
}

// Earlier version of carryIdentity(), extended by the functions that follow.
function carryIdentityBeforeV70(ng, old) {
  let prevResult50;
  prev50: {
    const g = carryIdentityBeforeV36(ng, old);
    g.maxPlusReached = old.maxPlusReached || old.plus || 0;
    g.celestialAffixGranted = !!old.celestialAffixGranted;
    g.mythicAffix = old.mythicAffix;
    g.celestialDrop = !!old.celestialDrop;
    prevResult50 = ensureMythic(g);
    break prev50;
  }
  const result = prevResult50;
  if (result) result.distributionV45 = true;
  return result;
}

function carryIdentity(next, old) {
  const g = carryIdentityBeforeV70(next, old);
  if (old) {
    g.itemIdV70 = old.itemIdV70;
    g.historyV70 = old.historyV70;
  }
  ensureHistory(g);
  return g;
}

// Earlier version of portableItemV19(), extended by the functions that follow.
function portableItemBase(raw) {
  let prevResult94;
  prev94: {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      prevResult94 = null;
      break prev94;
    }
    const slots = new Set(SLOTS.map(s => s.key));
    if (!slots.has(raw.slot)) {
      prevResult94 = null;
      break prev94;
    }
    const g = {
      slot: raw.slot,
      ilvl: int(raw.ilvl, 1, 1000, 1),
      rar: int(raw.rar, 0, 5, 0),
      plus: int(raw.plus, 0, 1000, 0),
      stats: numericMap(raw.stats, new Set(Object.keys(STAT_LABEL)), 1e9)
    };
    if (!Object.keys(g.stats).length) {
      prevResult94 = null;
      break prev94;
    }
    if (raw.slot === "weapon") g.wtype = ["sword", "bow", "dagger"].includes(raw.wtype) ? raw.wtype : "sword";
    const name = textV19(raw.name, 100);
    if (name) g.name = name;
    if (raw.unique === "bloodforged") {
      g.unique = "bloodforged";
      g.growth = { kills: int(raw.growth && raw.growth.kills, 0, 1e9, 0) };
    }
    if (raw.celestial != null) g.celestial = int(raw.celestial, 0, 100, 0);
    if (raw.reforges != null) g.reforges = int(raw.reforges, 0, 100000, 0);
    if (raw.variant != null) g.variant = int(raw.variant, 0, 100, 0);
    if (raw.maxPlusReached != null) g.maxPlusReached = int(raw.maxPlusReached, 0, 20, g.plus);
    if (raw.mythicAffix != null) g.mythicAffix = textV19(raw.mythicAffix, 40);
    if (raw.celestialDrop) g.celestialDrop = true;
    if (raw.broken) g.broken = true;
    if (raw.locked) g.locked = true;
    prevResult94 = g;
    break prev94;
  }
  const g = prevResult94;
  if (g && raw) {
    if (raw.celestialAffixGranted) g.celestialAffixGranted = true;
    if (raw.maxPlusReached != null) g.maxPlusReached = int(raw.maxPlusReached, 0, 20, g.plus || 0);
    if (raw.mythicAffix) g.mythicAffix = textV19(raw.mythicAffix, 40);
    if (raw.celestialDrop) g.celestialDrop = true;
  }
  return g;
}

// Earlier version of portableItemV19(), extended by the functions that follow.
function portableItemBeforeV70(raw) {
  let prevResult95;
  prev95: {
    const g = portableItemBase(raw);
    if (g && raw && raw.distributionV45) g.distributionV45 = true;
    prevResult95 = g;
    break prev95;
  }
  const g = prevResult95;
  if (g && raw) {
    if (raw.accessoryScalingV54) g.accessoryScalingV54 = true;
    if (raw.accessoryScalingV56) g.accessoryScalingV56 = true;
    if (raw.enrageScalingV54) g.enrageScalingV54 = true;
  }
  return g;
}

// Earlier version of portableItemV19(), extended by the functions that follow.
function portableItem(raw) {
  const g = portableItemBeforeV70(raw);
  if (g && raw) {
    g.itemIdV70 = textV19(raw.itemIdV70, 80) || undefined;
    if (raw.historyV70 && typeof raw.historyV70 === "object")
      g.historyV70 = {
        foundIn: textV19(raw.historyV70.foundIn, 100) || "Unknown",
        source: textV19(raw.historyV70.source, 100) || "Unknown",
        acquiredAt: finite(raw.historyV70.acquiredAt, 0, 9e15, Date.now()),
        kills: int(raw.historyV70.kills, 0, 1e12, 0),
        bosses: int(raw.historyV70.bosses, 0, 1e12, 0),
        highestHit: finite(raw.historyV70.highestHit, 0, 1e18, 0),
        victories: Array.isArray(raw.historyV70.victories)
          ? raw.historyV70.victories
              .slice(0, 8)
              .map(x => textV19(x, 80))
              .filter(Boolean)
          : []
      };
    ensureHistory(g);
  }
  return g;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultStateBase() {
  let prevResult119;
  prev119: {
    prevResult119 = {
      gold: 0,
      shards: 0,
      epicShards: 0,
      skullTokens: 0,
      gear: {},
      gear2: {},
      gearSetUnlocked: false,
      activeSet: 1,
      bag: [],
      bagCap: 5,
      autoSalvageRar: -1,
      sel: null,
      slotsOpen: 2,
      boons: {
        atk: 0,
        def: 0,
        hp: 0,
        critChance: 0,
        critDmg: 0,
        atkSpeed: 0,
        lifesteal: 0,
        fire: 0,
        ice: 0,
        lightning: 0
      },
      areaMax: 0,
      boonList: [],
      heroLevel: 1,
      xp: 0,
      sp: 0,
      skills: {},
      clearedAreas: [],
      guards: { low: 0, med: 0, high: 0, vhigh: 0 },
      xpBuff: 0,
      xpBuffUntil: 0,
      developerMode: false,
      roomsSeen: 0,
      flags: { breakWarn: false, bagWarn: false, skillTreeV6: false },
      totalKills: 0
    };
    break prev119;
  }
  const d = prevResult119;
  d.celestialShards = 0;
  return d;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultStateBeforeV54() {
  let prevResult120;
  prev120: {
    const d = defaultStateBase();
    d.abyssUnlocked = false;
    d.abyssMode = false;
    d.abyssMax = 0;
    d.abyssCleared = [];
    d.abyssTokens = 0;
    d.musicTrack = 1;
    prevResult120 = d;
    break prev120;
  }
  const d = prevResult120;
  d.boonPctV51 = emptyBoonPct();
  d.areaClearsV51 = {};
  d.abyssAreaClearsV51 = {};
  d.areaMedalClaimsV51 = {};
  d.abyssAreaMedalClaimsV51 = {};
  d.guards = d.guards || {};
  d.guards.ultra = 0;
  return d;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultStateBeforeV66() {
  let prevResult121;
  prev121: {
    const d = defaultStateBeforeV54();
    d.musicVolume = 0.34;
    d.sfxVolume = 1;
    d.musicChoice = "random";
    d.musicEnabled = true;
    prevResult121 = d;
    break prev121;
  }
  const d = prevResult121;
  d.treeMasteryV65 = emptyTreeMastery();
  return d;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultStateBeforeV70() {
  const d = defaultStateBeforeV66();
  d.celestialExchangeUnlockedV66 = false;
  return d;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultBase() {
  let prevResult122;
  prev122: {
    prevResult122 = ensureV70State(defaultStateBeforeV70());
    break prev122;
  }
  const d = prevResult122;
  d.questV74 = emptyQuestState();
  return d;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultBeforeV79() {
  let prevResult123;
  prev123: {
    const d = defaultBase();
    d.guildOffersV75 = { regular: [], abyss: [] };
    prevResult123 = d;
    break prev123;
  }
  const d = prevResult123;
  d.dummyKillsV78 = 0;
  return d;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultBeforeV83() {
  let prevResult124;
  prev124: {
    const d = defaultBeforeV79();
    d.onboardingV79 = blankOnboarding();
    prevResult124 = d;
    break prev124;
  }
  const d = prevResult124;
  d.gearBagUnlockedV82 = false;
  d.gearBagV82 = [];
  return d;
}

// Earlier version of defaultStateV5(), extended by the functions that follow.
function defaultState() {
  const d = defaultBeforeV83();
  d.mineV83 = freshMine();
  return d;
}

// Earlier version of normalizeStateV5(), extended by the functions that follow.
function normalizeStateBase(raw) {
  let prevResult126;
  prev126: {
    prev179: {
      const d = defaultState(),
        x = raw && raw.state ? raw.state : raw || {};
      S = Object.assign(d, x);
      S.gear = x.gear || {};
      S.gear2 = x.gear2 || {};
      S.bag = Array.isArray(x.bag) ? x.bag : [];
      S.boons = Object.assign(d.boons, x.boons || {});
      S.skills = Object.assign({}, x.skills || {});
      S.guards = Object.assign(d.guards, x.guards || {});
      S.flags = Object.assign(d.flags, x.flags || {});
      S.clearedAreas = Array.isArray(x.clearedAreas) ? x.clearedAreas : [];
      S.boonList = Array.isArray(x.boonList)
        ? x.boonList.map(b => (typeof b === "string" ? { n: b } : b))
        : [];
      if (S.skills.h5) {
        S.sp += S.skills.h5 || 0;
        delete S.skills.h5;
      }
      lastArea = raw && raw.lastArea != null ? raw.lastArea : null;
      S.celestialShards = Math.max(0, Number(S.celestialShards) || 0);
      S;
      break prev179;
    }
    S.abyssUnlocked = !!S.abyssUnlocked;
    S.abyssMode = !!S.abyssMode;
    S.abyssMax = Math.max(0, Number(S.abyssMax) || 0);
    S.abyssCleared = Array.isArray(S.abyssCleared) ? S.abyssCleared : [];
    S.abyssTokens = Math.max(0, Number(S.abyssTokens) || 0);
    S.musicTrack = S.musicTrack == null ? 1 : Math.max(0, Math.min(3, Number(S.musicTrack) || 0));
    try {
      migrateSkillCapsV50();
    } catch (e) {}
    prevResult126 = S;
    break prev126;
  }
  const result = prevResult126;
  ensureV51State();
  return result;
}

// Earlier version of normalizeStateV5(), extended by the functions that follow.
function normalizeStateBeforeV66(raw) {
  let prevResult127;
  prev127: {
    const state = normalizeStateBase(raw);
    ensureAudioState();
    prevResult127 = state;
    break prev127;
  }
  const result = prevResult127;
  ensureTreeMastery();
  return result;
}

// Earlier version of normalizeStateV5(), extended by the functions that follow.
function normalizeBase(raw) {
  let prevResult128;
  prev128: {
    const result = normalizeStateBeforeV66(raw);
    recordCelestialExchangeUnlock();
    prevResult128 = result;
    break prev128;
  }
  const result = prevResult128;
  ensureV70State();
  return result;
}

// Earlier version of normalizeStateV5(), extended by the functions that follow.
function normalizeBeforeV79(raw) {
  let prevResult129;
  prev129: {
    const result = normalizeBase(raw);
    ensureQuestState();
    prevResult129 = result;
    break prev129;
  }
  const result = prevResult129;
  ensureGuildOffers();
  return result;
}

// Earlier version of normalizeStateV5(), extended by the functions that follow.
function normalizeBeforeV83(raw) {
  let prevResult130;
  prev130: {
    const result = normalizeBeforeV79(raw);
    ensureOnboarding();
    prevResult130 = result;
    break prev130;
  }
  const result = prevResult130;
  ensureGearBag();
  return result;
}

function normalizeStateV5(raw) {
  const result = normalizeBeforeV83(raw);
  ensureMine();
  return result;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBase(data) {
  let prevResult56;
  prev56: {
    if (!data || typeof data !== "object" || data.format !== PORTABLE_SAVE_FORMAT)
      throw Error("This is not a The Forge portable save file.");
    if (int(data.saveVersion, 1, 100000, 0) < 1) throw Error("The save format version is invalid.");
    const p = data.player;
    if (!p || typeof p !== "object") throw Error("The player data is missing.");
    const eq = p.equipment || {},
      inv = p.inventory || {},
      lv = p.level || {},
      res = p.resources || {},
      buy = p.purchases || {},
      prog = p.progress || {},
      rewards = prog.stageRewards || {},
      d = defaultState(),
      next = defaultState();
    next.gear = portableGearSet(eq.active);
    next.gear2 = portableGearSet(eq.reserve);
    next.activeSet = eq.activeSet === 2 ? 2 : 1;
    next.gearSetUnlocked = !!eq.set2Unlocked;
    next.bag = portableBag(inv.items);
    next.bagCap = Math.max(next.bag.length, int(inv.capacity, 5, 500, 5));
    next.autoSalvageRar = int(inv.autoSalvageRarity, -1, 4, -1);
    next.heroLevel = int(lv.hero, 1, 10000, 1);
    next.xp = finite(lv.xp, 0, 1e15, 0);
    next.sp = int(lv.unspentSkillPoints, 0, 100000, 0);
    next.skills = numericMap(lv.skills, null, 100);
    next.gold = finite(res.gold, 0, 1e18, 0);
    next.shards = finite(res.shards, 0, 1e18, 0);
    next.epicShards = finite(res.epicShards, 0, 1e18, 0);
    next.celestialShards = finite(res.celestialShards, 0, 1e18, 0);
    next.skullTokens = int(res.bossTokens, 0, 1e9, 0);
    next.slotsOpen = int(buy.slotsOpen, 2, SLOTS.length, 2);
    next.guards = Object.assign(
      d.guards,
      numericMap(buy.guards, new Set(["low", "med", "high", "vhigh"]), 1e9)
    );
    next.xpBuff = int(buy.xpBuff, 0, 1e9, 0);
    next.clearedAreas = Array.isArray(prog.clearedStages)
      ? [...new Set(prog.clearedStages.map(v => int(v, 0, AREAS.length - 1, 0)))]
      : [];
    next.areaMax = int(
      prog.highestArea,
      0,
      AREAS.length - 1,
      next.clearedAreas.length ? Math.min(AREAS.length - 1, Math.max(...next.clearedAreas) + 1) : 0
    );
    next.boons = portableBoons(rewards.boons);
    next.boonList = portableBoonList(rewards.boonList);
    prevResult56 = next;
    break prev56;
  }
  const next = prevResult56;
  const buy = (data && data.player && data.player.purchases) || {},
    remaining = int(buy.xpBuffRemainingMs, 0, 604800000, 0),
    legacyCharges = int(buy.xpBuff, 0, 1000, 0),
    total = Math.min(604800000, remaining + legacyCharges * XP_BUFF_DURATION);
  next.xpBuff = 0;
  next.xpBuffUntil = total ? Date.now() + total : 0;
  next.flags = next.flags || {};
  next.flags.xpTimerV22 = true;
  return next;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV32(data) {
  const next = stateFromPortableBase(data);
  next.flags = next.flags || {};
  if (Number(data && data.gameVersion) >= 27) {
    next.xp = Math.min(Math.max(0, Number(next.xp) || 0), Math.max(0, xpFor(next.heroLevel) - 1));
  } else {
    const oldNeed = legacyXpFor(next.heroLevel),
      progress =
        Number.isFinite(oldNeed) && oldNeed > 0
          ? Math.min(0.999, Math.max(0, Number(next.xp) || 0) / oldNeed)
          : 0;
    next.xp = Math.round(xpFor(next.heroLevel) * progress);
  }
  next.flags.xpCurveV27 = true;
  return next;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV34(data) {
  let prevResult57;
  prev57: {
    prevResult57 = migrateCritBalance(stateFromPortableBeforeV32(data));
    break prev57;
  }
  const next = prevResult57;
  const version = Number(data && data.gameVersion) || 0;
  if (version >= 27 && version < 33) migrateXpCurveV33(next);
  else {
    next.xp = Math.min(Math.max(0, Number(next.xp) || 0), Math.max(0, xpFor(next.heroLevel) - 1));
    next.flags = next.flags || {};
    next.flags.xpCurveV33 = true;
  }
  return next;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV35(data) {
  const next = stateFromPortableBeforeV34(data),
    version = Number(data && data.gameVersion) || 0;
  if (version >= 27 && version < 34) migrateXpCurveV34(next);
  else {
    next.xp = Math.min(Math.max(0, Number(next.xp) || 0), Math.max(0, xpFor(next.heroLevel) - 1));
    next.flags = next.flags || {};
    next.flags.xpCurveV34 = true;
  }
  return next;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV36(data) {
  return migrateDaggerAffixes(stateFromPortableBeforeV35(data));
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV41(data) {
  let prevResult58;
  prev58: {
    prevResult58 = migrateForgeMilestones(stateFromPortableBeforeV36(data));
    break prev58;
  }
  const next = prevResult58;
  const old = (Number(data && data.gameVersion) || 0) < 39;
  return migrateMythicBalance(next, old);
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV45(data) {
  const next = stateFromPortableBeforeV41(data),
    disc = data && data.player && data.player.progress && data.player.progress.discoveries;
  next.flags = next.flags || {};
  if (disc && disc.mythicUpgradeGuide) next.flags.mythicUpgradeGuideV41 = true;
  return next;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV50(data) {
  let prevResult59;
  prev59: {
    prevResult59 = migrateItemDistribution(stateFromPortableBeforeV45(data));
    break prev59;
  }
  const next = prevResult59;
  const disc = data && data.player && data.player.progress && data.player.progress.discoveries;
  next.flags = next.flags || {};
  if (disc && disc.firstCombatStarted) next.flags.firstCombatStartedV49 = true;
  return next;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV65(data) {
  let prevResult131;
  prev131: {
    let prevResult197;
    prev197: {
      const next = stateFromPortableBeforeV50(data);
      try {
        const ab = data && data.player && data.player.abyss;
        if (ab) {
          next.abyssUnlocked = !!ab.unlocked;
          next.abyssMax = Math.max(0, ab.max | 0);
          next.abyssCleared = Array.isArray(ab.cleared) ? ab.cleared : [];
          next.abyssTokens = Math.max(0, ab.tokens | 0);
        }
      } catch (e) {}
      prevResult197 = next;
      break prev197;
    }
    const next = prevResult197;
    const p = (data && data.player && data.player.progress) || {},
      r = p.stageRewards || {},
      m = p.areaMastery || {},
      guards = (data && data.player && data.player.purchases && data.player.purchases.guards) || {};
    next.boonPctV51 = Object.assign(emptyBoonPct(), r.boonPercentages || {});
    next.areaClearsV51 = Object.assign({}, m.regular || {});
    next.abyssAreaClearsV51 = Object.assign({}, m.abyss || {});
    next.areaMedalClaimsV51 = Object.assign({}, m.regularClaims || {});
    next.abyssAreaMedalClaimsV51 = Object.assign({}, m.abyssClaims || {});
    next.guards = next.guards || {};
    next.guards.ultra = Math.max(0, Number(guards.ultra) || 0);
    prevResult131 = next;
    break prev131;
  }
  const state = prevResult131;
  const a = (data && data.player && data.player.audio) || {};
  if (a.musicVolume != null) state.musicVolume = a.musicVolume;
  if (a.sfxVolume != null) state.sfxVolume = a.sfxVolume;
  if (a.musicChoice != null) state.musicChoice = a.musicChoice;
  if (a.musicEnabled != null) state.musicEnabled = !!a.musicEnabled;
  return state;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function stateFromPortableBeforeV70(data) {
  let prevResult132;
  prev132: {
    const state = stateFromPortableBeforeV65(data),
      m = data && data.player && data.player.level && data.player.level.treeMastery;
    state.treeMasteryV65 = Object.assign(emptyTreeMastery(), m || {});
    ensureTreeMastery(state);
    prevResult132 = state;
    break prev132;
  }
  const state = prevResult132;
  const res = data && data.player && data.player.resources;
  state.celestialExchangeUnlockedV66 =
    !!(res && res.celestialExchangeUnlocked) || celestialExchangeHistory(state);
  return state;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function statePortableBase(data) {
  let prevResult133;
  prev133: {
    const state = stateFromPortableBeforeV70(data),
      x = (data && data.player && data.player.progress && data.player.progress.psychologyV70) || {};
    state.pityV70 = Object.assign(emptyPity(), x.pity || {});
    state.disciplineV70 = "none";
    state.activeContractV70 = x.activeContract;
    state.contractCompletionsV70 = Object.assign({}, x.contractCompletions || {});
    state.contractStageV72 = Object.assign({}, x.contractStages || {});
    state.contractCooldownV73 = Object.assign({}, x.contractCooldowns || {});
    state.statsFoldedV72 = !!x.statsFolded;
    state.bestiaryKillsV70 = Object.assign({}, x.bestiaryKills || {});
    state.mythicSeenV70 = Array.isArray(x.mythicSeen) ? x.mythicSeen.slice() : [];
    state.goalIndexV70 = Number(x.goalIndex) || 0;
    prevResult133 = ensureV70State(state);
    break prev133;
  }
  const state = prevResult133;
  const raw = data && data.player && data.player.progress && data.player.progress.questV74;
  state.questV74 = raw
    ? {
        points: Number(raw.points) || 0,
        completed: Object.assign({}, raw.completed || {}),
        ready: Object.assign({}, raw.ready || {}),
        tracked: Array.isArray(raw.tracked) ? raw.tracked.slice(-3) : [],
        stats: Object.assign({}, raw.stats || {})
      }
    : emptyQuestState();
  return ensureQuestState(state) && state;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function statePortableBeforeV79(data) {
  let prevResult134;
  prev134: {
    const state = statePortableBase(data),
      raw = data && data.player && data.player.progress && data.player.progress.guildOffersV75;
    state.guildOffersV75 =
      raw && typeof raw === "object" ? JSON.parse(JSON.stringify(raw)) : { regular: [], abyss: [] };
    ensureGuildOffers(state);
    prevResult134 = state;
    break prev134;
  }
  const state = prevResult134;
  const v = data && data.player && data.player.progress && data.player.progress.dummyKillsV78;
  state.dummyKillsV78 = Math.max(0, Math.floor(Number(v) || 0));
  return state;
}

// Earlier version of stateFromPortableV19(), extended by the functions that follow.
function statePortableBeforeV83(data) {
  let prevResult135;
  prev135: {
    const state = statePortableBeforeV79(data),
      raw = data && data.player && data.player.progress && data.player.progress.onboardingV79;
    if (raw) state.onboardingV79 = raw;
    ensureOnboarding(state);
    prevResult135 = state;
    break prev135;
  }
  const state = prevResult135;
  const inv = (data && data.player && data.player.inventory) || {};
  state.gearBagUnlockedV82 = !!inv.gearBagUnlockedV82;
  state.gearBagV82 = portableBag(inv.gearBagV82);
  return ensureGearBag(state);
}

function stateFromPortableV19(data) {
  const state = statePortableBeforeV83(data),
    saved = data && data.player && data.player.progress && data.player.progress.mineV83;
  state.mineV83 = Object.assign(freshMine(), saved || {});
  return state;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBase() {
  let prevResult51;
  prev51: {
    prevResult51 = {
      format: PORTABLE_SAVE_FORMAT,
      saveVersion: PORTABLE_SAVE_VERSION,
      gameVersion: 41,
      exportedAt: new Date().toISOString(),
      player: {
        equipment: {
          active: portableGearSet(S.gear),
          reserve: portableGearSet(S.gear2),
          activeSet: S.activeSet === 2 ? 2 : 1,
          set2Unlocked: !!S.gearSetUnlocked
        },
        inventory: {
          items: portableBag(S.bag),
          capacity: int(S.bagCap, 5, 500, 5),
          autoSalvageRarity: int(S.autoSalvageRar, -1, 4, -1)
        },
        level: {
          hero: int(S.heroLevel, 1, 10000, 1),
          xp: finite(S.xp, 0, 1e15, 0),
          unspentSkillPoints: int(S.sp, 0, 100000, 0),
          skills: numericMap(S.skills, null, 100)
        },
        resources: {
          gold: finite(S.gold, 0, 1e18, 0),
          shards: finite(S.shards, 0, 1e18, 0),
          epicShards: finite(S.epicShards, 0, 1e18, 0),
          celestialShards: finite(S.celestialShards, 0, 1e18, 0),
          bossTokens: int(S.skullTokens, 0, 1e9, 0)
        },
        purchases: {
          slotsOpen: int(S.slotsOpen, 2, SLOTS.length, 2),
          guards: numericMap(S.guards, new Set(["low", "med", "high", "vhigh"]), 1e9),
          xpBuff: int(S.xpBuff, 0, 1e9, 0),
          xpBuffRemainingMs: int(Math.max(0, (S.xpBuffUntil || 0) - Date.now()), 0, 604800000, 0)
        },
        progress: {
          highestArea: int(S.areaMax, 0, 10000, 0),
          clearedStages: Array.isArray(S.clearedAreas)
            ? [...new Set(S.clearedAreas.map(v => int(v, 0, 10000, 0)))]
            : [],
          stageRewards: { boons: portableBoons(S.boons), boonList: portableBoonList(S.boonList) }
        }
      }
    };
    break prev51;
  }
  const data = prevResult51;
  data.gameVersion = 41;
  data.player.progress.discoveries = { mythicUpgradeGuide: !!(S.flags && S.flags.mythicUpgradeGuideV41) };
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV44() {
  let prevResult52;
  prev52: {
    const data = buildPortableSaveBase();
    data.gameVersion = 42;
    prevResult52 = data;
    break prev52;
  }
  const data = prevResult52;
  data.gameVersion = 43;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV46() {
  let prevResult53;
  prev53: {
    const data = buildPortableSaveBeforeV44();
    data.gameVersion = 44;
    prevResult53 = data;
    break prev53;
  }
  const data = prevResult53;
  data.gameVersion = 45;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV48() {
  let prevResult54;
  prev54: {
    const data = buildPortableSaveBeforeV46();
    data.gameVersion = 46;
    prevResult54 = data;
    break prev54;
  }
  const data = prevResult54;
  data.gameVersion = 47;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV50() {
  let prevResult55;
  prev55: {
    const data = buildPortableSaveBeforeV48();
    data.gameVersion = 48;
    prevResult55 = data;
    break prev55;
  }
  const data = prevResult55;
  data.gameVersion = 49;
  const progress = data.player && data.player.progress;
  if (progress) {
    progress.discoveries = Object.assign({}, progress.discoveries, {
      firstCombatStarted: !!(S.flags && S.flags.firstCombatStartedV49)
    });
  }
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV53() {
  let prevResult156;
  prev156: {
    let prevResult198;
    prev198: {
      const data = buildPortableSaveBeforeV50();
      data.gameVersion = 50;
      try {
        data.player = data.player || {};
        data.player.abyss = {
          unlocked: !!S.abyssUnlocked,
          max: S.abyssMax || 0,
          cleared: S.abyssCleared || [],
          tokens: S.abyssTokens || 0
        };
      } catch (e) {}
      prevResult198 = data;
      break prev198;
    }
    const data = prevResult198;
    data.gameVersion = 51;
    const p = data.player.progress || (data.player.progress = {}),
      r = p.stageRewards || (p.stageRewards = {});
    r.boonPercentages = Object.assign({}, S.boonPctV51);
    p.areaMastery = {
      regular: Object.assign({}, S.areaClearsV51),
      abyss: Object.assign({}, S.abyssAreaClearsV51),
      regularClaims: Object.assign({}, S.areaMedalClaimsV51),
      abyssClaims: Object.assign({}, S.abyssAreaMedalClaimsV51)
    };
    data.player.purchases.guards.ultra = S.guards.ultra || 0;
    prevResult156 = data;
    break prev156;
  }
  const data = prevResult156;
  data.gameVersion = 52;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV55() {
  let prevResult157;
  prev157: {
    const data = buildPortableSaveBeforeV53();
    data.gameVersion = 53;
    prevResult157 = data;
    break prev157;
  }
  const data = prevResult157;
  data.gameVersion = 54;
  data.player = data.player || {};
  data.player.audio = {
    musicVolume: S.musicVolume,
    sfxVolume: S.sfxVolume,
    musicChoice: S.musicChoice,
    musicEnabled: music.on
  };
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV57() {
  let prevResult158;
  prev158: {
    const data = buildPortableSaveBeforeV55();
    data.gameVersion = 55;
    prevResult158 = data;
    break prev158;
  }
  const data = prevResult158;
  data.gameVersion = 56;
  return data;
}

/* V58 · Remove unused Celestial gear checkpoints and clarify Celestial outcome odds. */
// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV59() {
  let prevResult159;
  prev159: {
    const data = buildPortableSaveBeforeV57();
    data.gameVersion = 57;
    prevResult159 = data;
    break prev159;
  }
  const data = prevResult159;
  data.gameVersion = 58;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV61() {
  let prevResult160;
  prev160: {
    const data = buildPortableSaveBeforeV59();
    data.gameVersion = 59;
    prevResult160 = data;
    break prev160;
  }
  const data = prevResult160;
  data.gameVersion = 60;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV63() {
  let prevResult161;
  prev161: {
    const data = buildPortableSaveBeforeV61();
    data.gameVersion = 61;
    prevResult161 = data;
    break prev161;
  }
  const data = prevResult161;
  data.gameVersion = 62;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV65() {
  let prevResult162;
  prev162: {
    const data = buildPortableSaveBeforeV63();
    data.gameVersion = 63;
    prevResult162 = data;
    break prev162;
  }
  const data = prevResult162;
  data.gameVersion = 64;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function buildPortableSaveBeforeV67() {
  let prevResult163;
  prev163: {
    const data = buildPortableSaveBeforeV65();
    data.gameVersion = 65;
    data.player.level.treeMastery = Object.assign({}, ensureTreeMastery());
    prevResult163 = data;
    break prev163;
  }
  const data = prevResult163;
  data.gameVersion = 66;
  data.player.resources.celestialExchangeUnlocked = recordCelestialExchangeUnlock();
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function portableBase() {
  let prevResult164;
  prev164: {
    const data = buildPortableSaveBeforeV67();
    data.gameVersion = 67;
    prevResult164 = data;
    break prev164;
  }
  const data = prevResult164;
  data.gameVersion = GAME_VERSION;
  data.player.progress.psychologyV70 = {
    pity: Object.assign({}, S.pityV70),
    discipline: "none",
    activeContract: S.activeContractV70,
    contractCompletions: Object.assign({}, S.contractCompletionsV70),
    contractStages: Object.assign({}, S.contractStageV72),
    contractCooldowns: Object.assign({}, S.contractCooldownV73),
    statsFolded: !!S.statsFoldedV72,
    bestiaryKills: Object.assign({}, S.bestiaryKillsV70),
    mythicSeen: (S.mythicSeenV70 || []).slice(),
    goalIndex: S.goalIndexV70
  };
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function portableBeforeV76() {
  let prevResult165;
  prev165: {
    const data = portableBase();
    data.gameVersion = 74;
    data.player = data.player || {};
    data.player.progress = data.player.progress || {};
    const qs = ensureQuestState();
    data.player.progress.questV74 = {
      points: qs.points,
      completed: Object.assign({}, qs.completed),
      ready: Object.assign({}, qs.ready),
      tracked: qs.tracked.slice(),
      stats: Object.assign({}, qs.stats)
    };
    prevResult165 = data;
    break prev165;
  }
  const data = prevResult165;
  data.gameVersion = 75;
  data.player.progress = data.player.progress || {};
  data.player.progress.guildOffersV75 = JSON.parse(JSON.stringify(ensureGuildOffers()));
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function portableBeforeV78() {
  let prevResult166;
  prev166: {
    const data = portableBeforeV76();
    data.gameVersion = 76;
    prevResult166 = data;
    break prev166;
  }
  const data = prevResult166;
  data.gameVersion = 77;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function portableBeforeV80() {
  let prevResult167;
  prev167: {
    const data = portableBeforeV78();
    data.gameVersion = 78;
    data.player = data.player || {};
    data.player.progress = data.player.progress || {};
    data.player.progress.dummyKillsV78 = Math.max(0, Number(S.dummyKillsV78) || 0);
    prevResult167 = data;
    break prev167;
  }
  const data = prevResult167;
  data.gameVersion = 79;
  data.player = data.player || {};
  data.player.progress = data.player.progress || {};
  data.player.progress.onboardingV79 = JSON.parse(JSON.stringify(ensureOnboarding()));
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function portableBeforeV82() {
  let prevResult168;
  prev168: {
    const data = portableBeforeV80();
    data.gameVersion = 80;
    prevResult168 = data;
    break prev168;
  }
  const data = prevResult168;
  data.gameVersion = 81;
  return data;
}

// Earlier version of buildPortableSaveV19(), extended by the functions that follow.
function portableBeforeV85() {
  settleMineV83();
  let prevResult169;
  prev169: {
    const data = portableBeforeV82();
    data.gameVersion = 82;
    data.player = data.player || {};
    data.player.inventory = data.player.inventory || {};
    data.player.inventory.gearBagUnlockedV82 = !!S.gearBagUnlockedV82;
    data.player.inventory.gearBagV82 = portableBag(ensureGearBag().gearBagV82);
    prevResult169 = data;
    break prev169;
  }
  const data = prevResult169;
  data.gameVersion = 84;
  data.player = data.player || {};
  data.player.progress = data.player.progress || {};
  data.player.progress.mineV83 = JSON.parse(JSON.stringify(ensureMine()));
  return data;
}

function buildPortableSaveV19() {
  const data = portableBeforeV85();
  data.gameVersion = 90;
  return data;
}
