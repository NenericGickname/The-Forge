// ============ V16 CRIT CHAINS / SKILL RESET REPAIR ============
var shouldDropSkullToken;

$("resetskills").onclick = resetSkills;

// ============ V17 THE END ============
Object.assign(ENEMIES, {
  endwalker: {
    n: "Endwalker",
    c: "#d9cbff",
    sz: 1.08,
    shape: "biped",
    hpM: 1.18,
    atkM: 1.18,
    defM: 1.08,
    res: { fire: 0.12, ice: 0.12, lightning: 0.12 },
    design: "starborn"
  },
  nullreaper: {
    n: "Null Reaper",
    c: "#76539c",
    sz: 1.08,
    shape: "ghost",
    hpM: 1.05,
    atkM: 1.35,
    defM: 0.88,
    res: { fire: -0.12, ice: 0.2, lightning: 0.3 },
    design: "astralseer"
  },
  lastremnant: {
    n: "Last Remnant",
    c: "#34244f",
    sz: 1.16,
    shape: "blob",
    hpM: 1.42,
    atkM: 1.06,
    defM: 1.32,
    res: { fire: 0.22, ice: -0.12, lightning: 0.22 },
    design: "voidling"
  }
});
AREAS.push({
  n: "The End?",
  sp: "❔",
  lvl: 102,
  waves: 25,
  pool: ["endwalker", "nullreaper", "lastremnant", "shaman", "plaguefrog", "thornback"],
  boss: "The Last Question",
  weak: "no weakness · lifesteal reduced to 5%",
  gimmick: "end",
  bg: ["#100a1c", "#020104"],
  gr: "#160e24",
  deco: "stars",
  bossLines: [
    "You reached the end. Why are you still moving?",
    "Every answer creates another question.",
    "Show me what remains after everything else is gone."
  ]
});
BOSSCOL.push("#e2d2ff");
MECHS.push({
  id: "verdict",
  name: "Final Verdict",
  icon: "❔",
  dur: 2400,
  cd: 5600,
  col: "#d6b8ff",
  onSpawn: b => {
    b.phase = 0;
  },
  onHit: b => {
    const ratio = b.hp / b.max;
    if (ratio <= 0.66 && b.phase < 1) {
      b.phase = 1;
      b.atk = Math.round(b.atk * 1.12);
      b.hasteMul = 0.86;
      flash("#c69cff");
      sayBoss("The first answer was insufficient.");
    } else if (ratio <= 0.33 && b.phase < 2) {
      b.phase = 2;
      b.atk = Math.round(b.atk * 1.14);
      b.hasteMul = 0.72;
      flash("#f0dcff");
      sayBoss("There is only one question left.");
    }
  },
  tick: (b, dt) => {
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2,
        r = 24 + Math.random() * 45;
      particles.push({
        x: b._x + Math.cos(a) * r,
        y: GY - 30 + Math.sin(a) * r * 0.55,
        vx: -Math.cos(a) * 1.6,
        vy: -Math.sin(a) * 0.8,
        life: 1,
        sz: 2,
        col: i % 2 ? "#d6b8ff" : "#ffffff"
      });
    }
  },
  resolve: b => {
    flash("#d6b8ff");
    softShake();
    run.healLockedUntil = run.time + 8500;
    abilityHitHero(run.hero.max * (0.28 + b.phase * 0.06), "❔ FINAL VERDICT · HEAL SEALED", "#e5d2ff");
  }
});

const updateHealBeforeEnd = updateHeal,
  healClickBeforeEnd = $("healbtn").onclick;
updateHeal = function () {
  updateHealBeforeEnd();
  const hb = $("healbtn");
  if (hb && run && !run.over && run.a && run.a.gimmick === "end" && run.healLockedUntil > run.time) {
    hb.disabled = true;
    hb.textContent = "❔ Heal Sealed";
  }
};
$("healbtn").onclick = function () {
  if (run && !run.over && run.a && run.a.gimmick === "end" && run.healLockedUntil > run.time) {
    floatDmg("hero", "HEAL SEALED", 0, "#d6b8ff");
    return;
  }
  return healClickBeforeEnd.call(this);
};

// ============ V18 DAGGERS / WEAPON EFFECTS / PLAYTEST PRESETS ============
Object.assign(STAT_LABEL, { burn: "🔥Burn", frost: "❄Frost", doom: "☾Doom" });
["burn", "frost", "doom"].forEach(st => {
  if (!OFFSTATS.includes(st)) OFFSTATS.push(st);
  EXCL.add(st);
});
["bleed", "burn", "frost", "doom"].forEach(st => {
  if (!weaponSlot.affixes.includes(st)) weaponSlot.affixes.push(st);
});

addAffix = function (g) {
  if (g.slot !== "weapon") {
    const sd = SLOTS.find(s => s.key === g.slot),
      pool = sd.affixes.filter(st => st !== sd.main && !(st in g.stats));
    if (!pool.length) return null;
    const st = pool[Math.floor(Math.random() * pool.length)];
    g.stats[st] = statRoll(st, g.ilvl, g.rar);
    return st;
  }
  const pool = weaponPool(g),
    st = weightedAffix(g, pool);
  if (!st) return null;
  g.stats[st] = statRoll(st, g.ilvl, g.rar);
  return st;
};
/* ---- addAffix: later layers (moved here) ---- */

const addAffixBase = addAffix;
addAffix = function (g) {
  if (!g) return null;
  if ((g.celestial || 0) >= 10 && !g.celestialAffixGranted) {
    g.celestialAffixGranted = true;
    return addAffixBase(g);
  }
  const milestone = (g.plus || 0) >= 20 ? 20 : (g.plus || 0) >= 10 ? 10 : 0;
  if (milestone) {
    const reached = Math.max(0, g.maxPlusReached || 0);
    if (reached >= milestone) return null;
    g.maxPlusReached = milestone;
  }
  return addAffixBase(g);
};

makeBloodforged = function (slot, ilvl) {
  const g = makeGear(slot, ilvl, 4),
    type = slot === "weapon" ? weaponTypeName(g) : SLOTS.find(s => s.key === slot).label;
  g.name = "Bloodforged " + type;
  g.unique = "bloodforged";
  g.growth = { kills: 0 };
  g.stats.lifesteal = Math.max(g.stats.lifesteal || 0, 1.2);
  return g;
};
itemIcon = function (g) {
  return gearArt(g);
};
var celestialEffectDescription;
var renderPlaytestPanel;
$("exportsave").onclick = exportPortableSave;
$("importsave").onclick = () => $("savefileinput").click();
$("savefileinput").onchange = e => importPortableSave(e.target.files && e.target.files[0]);

setInterval(() => {
  if ($("shop").classList.contains("on")) renderShop();
  renderStatPanel();
}, 1000);
const openShopBase = $("shopbtn").onclick,
  closeShopBase = $("closeshop").onclick;
$("shopbtn").onclick = () => {
  openShopBase();
  speakRockKeeper();
};
$("closeshop").onclick = () => {
  closeShopBase();
  $("shopkeeperbubble").classList.remove("on");
};
$("rockkeeper").onclick = pokeRockKeeper;
xpFor = function (lv) {
  lv = Math.max(1, Math.floor(Number(lv) || 1));
  return Math.round(30 + 20 * lv + 1.6 * lv * lv);
};

gainXP = function (rawAmount) {
  const amount = Math.max(0, Number(rawAmount) || 0);
  if (!amount) return 0;
  if (!Number.isFinite(S.xp) || S.xp < 0) S.xp = 0;
  if (!Number.isFinite(S.heroLevel) || S.heroLevel < 1) S.heroLevel = 1;
  const boost = Math.max(0, Number(heroStats().xpBoost) || 0),
    baseAward = Math.max(1, Math.round(amount * 1.05 * (1 + boost / 100))),
    award = baseAward * (xpBuffActive() ? 2 : 1);
  S.xp += award;
  let levels = 0;
  while (S.xp >= xpFor(S.heroLevel)) {
    S.xp -= xpFor(S.heroLevel);
    S.heroLevel++;
    S.sp++;
    levels++;
    beep(700, 0.1, "triangle");
    setTimeout(() => beep(950, 0.14, "triangle"), 90);
    flash(cvar("--epic"));
  }
  if (run && run.hero && !run.over) {
    if (levels) {
      run.hero.max = heroStats().hp;
      run.hero.hp = run.hero.max;
      $("rmsg").className = "msg big";
      $("rmsg").innerHTML =
        "⭐ LEVEL " + S.heroLevel + "! +" + levels + " skill point" + (levels === 1 ? "" : "s");
    }
    drawBars();
  } else renderTown();
  scheduleSave();
  return award;
};

makeElite = function (f, forceSuper = false) {
  if (!f) return f;
  const superElite = !!forceSuper,
    areaIndex = run && Number.isInteger(run.ai) ? run.ai : 0,
    baseMax = f.max,
    baseAtk = f.atk,
    baseDef = f.def;
  f.elite = true;
  f.superElite = superElite;
  f.name = (superElite ? "✦ Super Elite " : "◆ Elite ") + f.name;
  f.max = Math.round(baseMax * (superElite ? 2.15 : 1.55));
  f.atk = Math.round(baseAtk * (superElite ? 1.25 : 1.12));
  f.def = Math.round(baseDef * (superElite ? 1.15 : 1.08));
  if (areaIndex >= 0 && areaIndex < 12) {
    const boss = campaignBossProfile(areaIndex);
    f.max = Math.min(f.max, Math.round(boss.hp * (superElite ? 0.9 : 0.7)));
    f.atk = Math.min(f.atk, Math.round(boss.atk * (superElite ? 0.95 : 0.82)));
  }
  f.hp = f.max;
  f.draw.sz *= superElite ? 1.18 : 1.1;
  if (f.specialCd != null) {
    f.specialCd = superElite ? 350 : 500;
    f.specialCdMax = f.specialCd;
  }
  return f;
};
var bowBaseCrit;

/* ==== xpFor ==== */
/* ==== xpFor ==== */
/* ==== xpFor ==== */
/* ==== xpFor ==== */
/* ==== xpFor ==== */
/* ==== xpFor ==== */
const xpForBase = xpFor;
xpFor = function (lv) {
  lv = Math.max(1, Math.floor(Number(lv) || 1));
  const late = Math.max(0, lv - 25),
    beyond = Math.max(0, lv - 60),
    base = 30 + 20 * lv + 1.6 * lv * lv + 0.09 * late * late * late;
  return Math.round(base * Math.pow(1.1, beyond));
};
const xpForBeforeV34 = xpFor;
xpFor = function (lv) {
  lv = Math.max(1, Math.floor(Number(lv) || 1));
  const softCeiling = Math.pow(1.1, Math.max(0, lv - 60));
  return Math.round(expectedClearXp(lv) * targetClears(lv) * softCeiling);
};

// ============ V36 MYTHIC ITEMS, FORGE MILESTONES, AND REFORGING ============
RAR.push({ k: "mythic", col: "--mythic", m: 2.35 });
Object.values(PCT).forEach(a => a.push(Math.round(a[4] * 1.22 * 100) / 100));

/* ==== itemMarks ==== */
/* ==== itemMarks ==== */
/* ==== itemMarks ==== */
/* ==== itemMarks ==== */
/* ==== itemMarks ==== */
/* ==== itemMarks ==== */
const itemMarksBase = itemMarks;
itemMarks = function (g) {
  let m = itemMarksBase(g);
  if (g.stats && g.stats.burn) m += '<span title="Burn" style="color:#ff8a3a">🔥</span>';
  if (g.stats && g.stats.frost) m += '<span title="Frost" style="color:#8fe0ff">❄</span>';
  if (g.stats && g.stats.doom) m += '<span title="Doom" style="color:#8c43c9">☾</span>';
  const ce = celestialEffectName(g);
  if (ce) m += '<span title="' + ce + '" style="color:#d8c2ff">✧</span>';
  return m;
};
const itemMarksBeforeV36 = itemMarks;
itemMarks = function (g) {
  return (
    itemMarksBeforeV36(g) +
    (g && g.rar === 5
      ? '<span title="Mythic" style="color:#30d4c5;text-shadow:0 0 8px #0a8f87">✺</span>'
      : "")
  );
};

makeReforgeCandidate = function (old) {
  const g = { slot: old.slot, ilvl: old.ilvl, rar: old.rar, plus: 0, stats: {} };
  if (old.wtype) g.wtype = old.wtype;
  Object.keys(old.stats || {}).forEach(
    st => (g.stats[st] = st === reforgeLockStat ? old.stats[st] : rerollStat(old, st))
  );
  g.name = old.name;
  g.variant = old.variant;
  g.mythicAffix = old.mythicAffix;
  g.celestialDrop = old.celestialDrop;
  return g;
};

const openReforgeBase = openReforge;
openReforge = function () {
  reforgeLockStat = "";
  openReforgeBase();
  const g = reforgePending && reforgePending.g,
    sel = $("reforgelock");
  if (!g || !sel) return;
  sel.innerHTML =
    '<option value="">No locked stat</option>' +
    Object.keys(g.stats || {})
      .map(st => '<option value="' + st + '">Lock ' + STAT_LABEL[st] + "</option>")
      .join("");
  sel.value = "";
  sel.onchange = () => {
    reforgeLockStat = sel.value;
  };
};
$("rfbtn").onclick = openReforge;

$("strikebtn").addEventListener("click", () => setTimeout(updateForgeBalances, 0));

// ============ V36 CELESTIAL GUARDIANS ============
Object.assign(ENEMIES, {
  lumenwisp: {
    n: "Lumen Wisp",
    c: "#f8ffff",
    sz: 0.92,
    shape: "ghost",
    hpM: 0.88,
    atkM: 1.18,
    defM: 0.82,
    res: { fire: 0.18, ice: 0.18, lightning: 0.35 },
    design: "lumenwisp"
  },
  pearlseraph: {
    n: "Pearl Seraph",
    c: "#eefcf9",
    sz: 1.08,
    shape: "biped",
    hpM: 1.12,
    atkM: 1.12,
    defM: 1.18,
    res: { fire: 0.22, ice: 0.22, lightning: 0.22 },
    design: "pearlseraph"
  },
  prismhound: {
    n: "Prism Hound",
    c: "#d7ffff",
    sz: 1.04,
    shape: "beast",
    hpM: 0.95,
    atkM: 1.34,
    defM: 0.78,
    res: { fire: 0.1, ice: 0.28, lightning: 0.1 },
    design: "prismhound"
  },
  oathkeeper: {
    n: "Oathkeeper",
    c: "#f3f1e5",
    sz: 1.18,
    shape: "block",
    hpM: 1.42,
    atkM: 0.96,
    defM: 1.55,
    res: { fire: 0.3, ice: 0.15, lightning: 0.15 },
    design: "oathkeeper"
  },
  celoracle: {
    n: "Celestial Oracle",
    c: "#ffffff",
    sz: 1.04,
    shape: "biped",
    hpM: 1.1,
    atkM: 0.92,
    defM: 1.1,
    res: { fire: 0.18, ice: 0.18, lightning: 0.32 },
    design: "celoracle"
  },
  celpurifier: {
    n: "Purifier",
    c: "#e8ffff",
    sz: 1.08,
    shape: "ghost",
    hpM: 1.08,
    atkM: 1.18,
    defM: 1.02,
    res: { fire: 0.12, ice: 0.28, lightning: 0.24 },
    design: "celpurifier"
  },
  celwarden: {
    n: "Ivory Warden",
    c: "#fff9df",
    sz: 1.2,
    shape: "block",
    hpM: 1.48,
    atkM: 1.02,
    defM: 1.62,
    res: { fire: 0.3, ice: 0.2, lightning: 0.2 },
    design: "celwarden"
  }
});
[
  {
    n: "Celestial Guardians · Alpha",
    sp: "α",
    lvl: 112,
    waves: 25,
    pool: ["lumenwisp", "pearlseraph", "prismhound", "celoracle"],
    boss: "Celestial Alpha",
    weak: "the first law of heaven",
    bg: ["#eafcff", "#829ea8"],
    gr: "#dbeeed",
    deco: "stars",
    bossLines: [
      "You survived the ending. That was not permission to continue.",
      "I am the first law written in light.",
      "Your forged metal is very loud here."
    ]
  },
  {
    n: "Celestial Guardians · Beta",
    sp: "β",
    lvl: 126,
    waves: 25,
    pool: ["pearlseraph", "oathkeeper", "celpurifier", "prismhound"],
    boss: "Celestial Beta",
    weak: "adapt or be erased",
    bg: ["#f8ffff", "#718c99"],
    gr: "#d6e7e7",
    deco: "stars",
    bossLines: [
      "Alpha measured your strength. I measure your limits.",
      "Time bends more easily than you do.",
      "Your second set will not save you from judgement."
    ]
  },
  {
    n: "Celestial Guardians · Gamma",
    sp: "γ",
    lvl: 142,
    waves: 25,
    pool: ["oathkeeper", "celoracle", "celpurifier", "lumenwisp"],
    boss: "Celestial Gamma",
    weak: "survive the seal",
    bg: ["#fffdf0", "#7c9097"],
    gr: "#e7e4d8",
    deco: "stars",
    bossLines: [
      "Healing is a privilege. I revoke it.",
      "Three guardians. One verdict.",
      "You are almost worthy of being noticed."
    ]
  },
  {
    n: "Celestial Guardians · Omega",
    sp: "Ω",
    lvl: 158,
    waves: 25,
    pool: ["celwarden", "celpurifier", "celoracle", "pearlseraph", "prismhound"],
    boss: "OMEGA",
    weak: "nothing less than perfection",
    bg: ["#ffffff", "#536b75"],
    gr: "#edf5f2",
    deco: "stars",
    bossLines: [
      "ALPHA. BETA. GAMMA. ALL WERE WARNINGS.",
      "I AM THE LAST LETTER.",
      "YOUR BUILD WILL BE REMEMBERED OR REMOVED."
    ]
  }
].forEach(a => AREAS.push(a));
["#efffff", "#d9ffff", "#fffbd9", "#ffffff"].forEach(c => BOSSCOL.push(c));
MECHS.push(
  {
    id: "alpharay",
    name: "Law of Light",
    icon: "☀",
    dur: 2100,
    cd: 6400,
    col: "#ffffff",
    resolve: b => {
      flash("#ffffff");
      abilityHitHero(run.hero.max * 0.18, "☀ LAW OF LIGHT", "#fff4b0", "lightning");
      if (celestialDebuffAllowed()) {
        run.celestialVulnerabilityUntil = run.time + 5200;
        floatDmg("hero", "◇ EXPOSED", 0, "#ffffff");
      } else floatDmg("hero", "NIMBLE", 0, "#78fff1");
    }
  },
  {
    id: "betafracture",
    name: "Fractured Second",
    icon: "⌛",
    dur: 1950,
    cd: 6000,
    col: "#dffcff",
    resolve: b => {
      abilityHitHero(run.hero.max * 0.12, "⌛ TIME FRACTURE", "#dffcff", "ice");
      if (celestialDebuffAllowed()) {
        run.celestialSlowUntil = run.time + 6500;
        run.slowStacks = Math.min(4, (run.slowStacks || 0) + 1);
      } else floatDmg("hero", "NIMBLE", 0, "#78fff1");
    }
  },
  {
    id: "gammaseal",
    name: "Seal of Purity",
    icon: "✥",
    dur: 2300,
    cd: 6700,
    col: "#fff8cb",
    resolve: b => {
      abilityHitHero(run.hero.max * 0.15, "✥ PURITY SEAL", "#fff8cb");
      if (celestialDebuffAllowed()) {
        run.healLockedUntil = run.time + 9000;
        floatDmg("hero", "HEALING SEALED", 0, "#fff4bd");
      } else floatDmg("hero", "NIMBLE", 0, "#78fff1");
    }
  },
  {
    id: "omegaedict",
    name: "OMEGA EDICT",
    icon: "Ω",
    dur: 2450,
    cd: 5100,
    col: "#ffffff",
    onSpawn: b => {
      b.omegaCycle = 0;
      b.phase = 0;
    },
    onHit: b => {
      const q = b.hp / b.max;
      if (q <= 0.75 && b.phase < 1) {
        b.phase = 1;
        b.hasteMul = 0.88;
        sayBoss("THE FIRST SEAL BREAKS.");
      } else if (q <= 0.5 && b.phase < 2) {
        b.phase = 2;
        b.hasteMul = 0.74;
        sayBoss("PERFECTION REQUIRES PRESSURE.");
      } else if (q <= 0.25 && b.phase < 3) {
        b.phase = 3;
        b.hasteMul = 0.62;
        sayBoss("OMEGA IS NOT A NAME. IT IS AN OUTCOME.");
      }
    },
    resolve: b => {
      b.omegaCycle = (b.omegaCycle || 0) + 1;
      const mode = b.omegaCycle % 4;
      if (mode === 0) {
        abilityHitHero(run.hero.max * (0.24 + b.phase * 0.025), "Ω NULL VERDICT", "#ffffff", "lightning");
      } else if (mode === 1) {
        if (celestialDebuffAllowed()) {
          run.frozenUntil = run.time + 1800;
          run.celestialSlowUntil = run.time + 6500;
          floatDmg("hero", "◇ TIME LOCK", 0, "#dfffff");
        } else floatDmg("hero", "NIMBLE", 0, "#78fff1");
      } else if (mode === 2) {
        b.shieldUntil = run.time + 4200;
        b.reflectUntil = run.time + 3200;
        floatDmg("foe", "◇ ABSOLUTE MIRROR", 0, "#ffffff", b._x);
      } else {
        if (celestialDebuffAllowed()) {
          run.healLockedUntil = run.time + 8500;
          run.suppressedSlot = ["weapon", "armor", "helm", "gloves", "boots", "amulet"][
            Math.floor(Math.random() * 6)
          ];
          run.suppressedUntil = run.time + 4800;
          floatDmg("hero", "Ω LOADOUT SEALED", 0, "#fffbd7");
        } else floatDmg("hero", "NIMBLE", 0, "#78fff1");
      }
    }
  }
);

if (l4aV32) l4aV32.d = "15% chance per rank for one extra boss bag";
if (l6aV32) l6aV32.d = "Another 20% chance for one extra boss bag";
allTreeNodes().forEach(n => {
  const t = V36_SKILL_TEXT[n.id];
  if (t) {
    n.name = t[0];
    n.d = t[1];
  }
});
treeNodeCanBuy = function (n) {
  const rank = S.skills[n.id] || 0;
  if (rank >= n.max || S.sp <= 0) return false;
  if (n.tier === 6 && S.heroLevel < 15) return false;
  if (
    (n.req || []).some(id => {
      const req = allTreeNodes().find(x => x.id === id);
      return (S.skills[id] || 0) < (req ? req.max : 1);
    })
  )
    return false;
  if (n.group && allTreeNodes().some(x => x.group === n.group && x.id !== n.id && (S.skills[x.id] || 0) > 0))
    return false;
  return true;
};
skillBonuses = function () {
  const r = id => S.skills[id] || 0,
    weapon = S.gear && S.gear.weapon,
    armor = S.gear && S.gear.armor,
    gloves = S.gear && S.gear.gloves;
  return {
    atkMult: 1 + 0.1 * r("c1"),
    atkSpeed: 6 * r("c2") + 10 * r("c5b") + 40 * r("c6d"),
    critChance: 5 * r("c3") + 3 * r("c5a"),
    critDmg: 18 * r("c4a") + 15 * r("c6a"),
    eleMult: 1 + 0.12 * r("c4b") + 0.2 * r("c6d"),
    statusPower:
      0.15 * r("c4b") +
      0.1 * r("c5b") +
      0.5 * r("c6c") +
      (r("c6b") && weapon && weapon.stats && weapon.stats.bleed ? 0.25 : 0),
    berserk: 1,
    bossDamage: 0.1 * r("c4a") + 0.3 * r("c6a"),
    woundDamage: 0.1 * r("c5a"),
    hpMult: 1 + 0.1 * r("h4b") + 0.25 * r("h6c"),
    defMult: 1 + 0.12 * r("h5b"),
    lifesteal: 2 * r("h5a") + 5 * r("h6b") + 3 * r("c6b"),
    leechCap: r("h6b") ? 0.08 : 0.04,
    pierce: 0.15 * r("c6c"),
    killHeal: 0.01 * r("h4a") + 0.02 * r("h6a"),
    healPower:
      1 + 0.12 * r("h2") + 0.35 * r("h6d") + (gloves && gloves.mythicAffix === "healingHands" ? 0.1 : 0),
    healCdrSkill: 12 * r("h3") + 40 * r("h6d"),
    damageTaken: (1 - 0.12 * r("h6c")) * (armor && armor.mythicAffix === "ironSkin" ? 0.85 : 1),
    lowHpGuard: 0,
    regen: 0,
    dropChance: 0.1 * r("l1") + 0.08 * r("l5a") + (gloves && gloves.mythicAffix === "kleptomaniac" ? 0.2 : 0),
    rarityBoost: r("l2") + r("l6b"),
    mythicFind: r("l6b") ? 2 : 1,
    salvageMult: 1 + 0.6 * r("l3"),
    bossBags: 0,
    bossBagChance: 0.15 * r("l4a") + 0.2 * r("l6a"),
    lootGold: 1 + 0.35 * r("l4b") + 0.6 * r("l6c"),
    xpBoost: 12 * r("l5b") + 35 * r("l6d"),
    forgeOdds: 0.07 * r("s1"),
    forgeCost: Math.max(0.35, 1 - 0.15 * r("s2") - 0.2 * r("s6d")),
    affixChance: 0.25 * r("s5b"),
    reforgeHigh: r("s5a"),
    insured: r("s6c") > 0,
    critSuccess: 0.05 * r("s4a") + 0.08 * r("s6a"),
    critFailCut: 0.05 * r("s4b"),
    zoneBonus: 7 * r("s8") + 16 * r("s6b")
  };
};

var installHeroHealth;
const startBossHuntBase = startBossHunt;
startBossHunt = function () {
  startBossHuntBase();
  if (run) {
    run.temperStacks = 0;
    run.joeStacks = 0;
    run.hardHatUsed = false;
    run.rebornUsed = false;
    installHeroHealth();
  }
};
$("huntstart").onclick = startBossHunt;

celestialProfile = function (g) {
  const cur = Math.min(9, g.celestial || 0),
    target = cur + 1;
  return {
    target,
    hits: target >= 7 ? 2 : 1,
    width: Math.max(11, 18 - cur * 0.55),
    speed: 4.1 + cur * 0.32,
    chance: Math.max(0.64, 0.78 - cur * 0.015)
  };
};
$("upbtn").addEventListener(
  "click",
  e => {
    const g = S.gear[S.sel],
      c = g && upCost(g);
    if (c && c.cshards > (S.celestialShards || 0)) {
      e.stopImmediatePropagation();
      $("fsel").innerHTML = '<span style="color:#ff6b6b">Not enough Celestial shards.</span>';
    }
  },
  true
);
$("celbtn").addEventListener(
  "click",
  e => {
    const g = S.gear[S.sel],
      c = g && celestialCost(g);
    if (c && c.cshards > (S.celestialShards || 0)) {
      e.stopImmediatePropagation();
      $("fsel").innerHTML = '<span style="color:#ff6b6b">Not enough Celestial shards.</span>';
    }
  },
  true
);
$("strikebtn").addEventListener(
  "click",
  () => {
    if (strikeLocked || forgeContinue || !pend || !pend.c || !pend.c.cshards) return;
    if (celestialMode) {
      if (pend.celestialShardsPaidV36) return;
      pend.celestialShardsPaidV36 = true;
    }
    S.celestialShards = Math.max(0, (S.celestialShards || 0) - pend.c.cshards);
    setTimeout(updateForgeBalances, 0);
  },
  true
);
salvageUnlockedBag = function () {
  const items = (S.bag || []).filter(g => !g.locked);
  if (!items.length) {
    beep(150, 0.07, "square", 0.04);
    return;
  }
  let sh = 0,
    ep = 0,
    ce = 0;
  items.forEach(g => {
    const r = salvageRewards(g);
    sh += r.shards;
    ep += r.epic;
    ce += r.celestial;
  });
  S.shards += sh;
  S.epicShards += ep;
  S.celestialShards = (S.celestialShards || 0) + ce;
  S.bag = S.bag.filter(g => g.locked);
  beep(420, 0.1, "triangle");
  flash(cvar("--rare"));
  if (ce) showCelestialShard(ce);
  scheduleSave();
  renderTown();
};
$("salvageall").onclick = salvageUnlockedBag;
setupUI();

ROCK_KEEPER_LINES.push(
  "That other rock in the acting gig is my cousin. He calls it a career.",
  "My cousin plays a rock somewhere else. Less successful. More dramatic lighting.",
  "No, I am not the actor rock. That is my cousin. I have a real shop.",
  "My cousin keeps asking whether I know any casting directors. I know a blacksmith.",
  "The acting rock says exposure is payment. I prefer gold.",
  "Celestial Guardians appeared beyond The End. Apparently endings are negotiable.",
  "Mythic gear is dark teal because legendary orange was getting too comfortable.",
  "Omega does not care about your almost perfect build. Very rude but consistent."
);

renderPlaytestPanel = function () {
  const panel = $("playtestpanel");
  if (!panel) return;
  panel.innerHTML =
    '<div class="playtestchoices"><button data-p="early">EARLY</button><button data-p="mid">MIDDLE</button><button data-p="late">END GAME</button><button data-p="superlate">SUPER LATE</button></div>';
  panel.querySelectorAll("button").forEach(btn => {
    const kind = btn.dataset.p;
    btn.classList.toggle("active", S.playtestPreset === kind);
    btn.onclick = () => requestPlaytestPresetV20(kind);
  });
};

installMythicReference();

bowBaseCrit = function (rar, roll = 1) {
  const base = (rar || 0) >= 5 ? 8 : 3.2 + Math.max(0, Math.min(4, rar || 0));
  return Math.round(base * roll * 10) / 10;
};
celestialDebuffAllowed = mythicDebuffAllowed;
MECHS.slice(0, 13).forEach(mech => {
  if (!mech || !mech.resolve || mech._nimbleV39) return;
  const resolve = mech.resolve;
  mech.resolve = function (b) {
    if (!run || !S.gear.boots || S.gear.boots.mythicAffix !== "nimble" || Math.random() >= 0.15)
      return resolve(b);
    const before = {};
    MYTHIC_DEBUFF_FIELDS.forEach(k => (before[k] = run[k]));
    const result = resolve(b);
    MYTHIC_DEBUFF_FIELDS.forEach(k => (run[k] = before[k]));
    floatDmg("hero", "NIMBLE", 0, "#78fff1");
    return result;
  };
  mech._nimbleV39 = true;
});
