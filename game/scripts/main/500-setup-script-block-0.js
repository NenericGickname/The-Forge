/* ================= script block 0 ================= */
"use strict";
var celestialLeechReductionV50, finalBossRoll, allItemsV70;

/* ================= constant data (hoisted) ================= */

// procedural 8-bit medieval loop (composed here => copyright-free)
const NT = {
  _: 0,
  D2: 73.42,
  E2: 82.41,
  F2: 87.31,
  G2: 98,
  A2: 110,
  B2: 123.47,
  C3: 130.81,
  D3: 146.83,
  E3: 164.81,
  F3: 174.61,
  G3: 196,
  A3: 220,
  B3: 246.94,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392,
  A4: 440,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25
};

// long 4-phrase (A-B-C-D) minor melody, 64 steps, so the loop runs ~16s and feels less repetitive
const LEAD = [
  // A
  NT.A4,
  NT._,
  NT.E4,
  NT.F4,
  NT.E4,
  NT._,
  NT.C4,
  NT.D4,
  NT.F4,
  NT._,
  NT.A4,
  NT.G4,
  NT.F4,
  NT.E4,
  NT.D4,
  NT._,
  // B
  NT.G4,
  NT._,
  NT.D4,
  NT.E4,
  NT.D4,
  NT._,
  NT.B3,
  NT.C4,
  NT.A4,
  NT._,
  NT.C4,
  NT.E4,
  NT.A4,
  NT.G4,
  NT.E4,
  NT._,
  // C (lift)
  NT.C5,
  NT._,
  NT.B4,
  NT.A4,
  NT.B4,
  NT._,
  NT.G4,
  NT.A4,
  NT.F4,
  NT._,
  NT.A4,
  NT.C5,
  NT.B4,
  NT.A4,
  NT.G4,
  NT._,
  // D (resolve)
  NT.E4,
  NT._,
  NT.A4,
  NT.G4,
  NT.F4,
  NT._,
  NT.E4,
  NT.D4,
  NT.C4,
  NT.E4,
  NT.A3,
  NT.C4,
  NT.D4,
  NT.E4,
  NT.F4,
  NT._
];

// a soft counter-harmony a third/fifth above, sparse, for warmth
const HARM = [
  NT._,
  NT._,
  NT.A4,
  NT._,
  NT._,
  NT._,
  NT.E4,
  NT._,
  NT.A4,
  NT._,
  NT._,
  NT._,
  NT.A4,
  NT._,
  NT.F4,
  NT._,
  NT._,
  NT._,
  NT.G4,
  NT._,
  NT._,
  NT._,
  NT.D4,
  NT._,
  NT.C5,
  NT._,
  NT._,
  NT._,
  NT.C5,
  NT._,
  NT.G4,
  NT._,
  NT._,
  NT._,
  NT.E5,
  NT._,
  NT._,
  NT._,
  NT.B4,
  NT._,
  NT.A4,
  NT._,
  NT._,
  NT._,
  NT.D5,
  NT._,
  NT.B4,
  NT._,
  NT._,
  NT._,
  NT.C5,
  NT._,
  NT._,
  NT._,
  NT.A4,
  NT._,
  NT.E4,
  NT._,
  NT._,
  NT._,
  NT.A4,
  NT._,
  NT.A4,
  NT._
];

// bass root per half-bar (32 roots over 64 steps), walking the progression
const BASSROOT = [
  NT.A2,
  NT.A2,
  NT.F2,
  NT.C3,
  NT.G2,
  NT.D3,
  NT.A2,
  NT.E3,
  NT.F2,
  NT.C3,
  NT.D3,
  NT.G2,
  NT.A2,
  NT.F2,
  NT.E3,
  NT.A2,
  NT.F2,
  NT.C3,
  NT.G2,
  NT.A2,
  NT.D3,
  NT.A2,
  NT.F2,
  NT.G2,
  NT.A2,
  NT.E3,
  NT.F2,
  NT.C3,
  NT.G2,
  NT.D3,
  NT.E2,
  NT.A2
];

let music = { on: true, step: 0, timer: null, started: false };

let musicMs = 260;

const $ = id => document.getElementById(id);

// ============ DATA ============
const RAR = [
  { k: "common", col: "--common", m: 1 },
  { k: "uncommon", col: "--uncommon", m: 1.4 },
  { k: "rare", col: "--rare", m: 2 },
  { k: "epic", col: "--epic", m: 2.8 },
  { k: "legendary", col: "--legendary", m: 4 }
];

const PCT = {
  critChance: [2, 3, 4, 6, 8],
  critDmg: [2, 3, 5, 7, 10],
  atkSpeed: [3, 6, 9, 12, 16],
  lifesteal: [0.1, 0.18, 0.28, 0.4, 0.55],
  enrage: [4, 6, 8, 10, 12],
  dodge: [2, 3, 4, 5, 7],
  lootChance: [1, 1.5, 2, 3, 4],
  fireRes: [3, 5, 8, 11, 15],
  iceRes: [3, 5, 8, 11, 15],
  lightRes: [3, 5, 8, 11, 15],
  healCdr: [3, 5, 7, 10, 14],
  xpBoost: [2, 4, 6, 8, 11],
  goldBoost: [3, 5, 8, 11, 15],
  elementAmp: [2, 3, 5, 7, 9]
};

const STAT_LABEL = {
  atk: "Atk",
  def: "Def",
  hp: "HP",
  critChance: "Crit%",
  critDmg: "CritDmg",
  atkSpeed: "Spd",
  lifesteal: "Leech",
  fire: "🔥Fire",
  ice: "❄Ice",
  lightning: "⚡Lgt",
  poison: "☠Psn",
  bleed: "🩸Bld",
  enrage: "😡Enr",
  dodge: "Dodge",
  lootChance: "Loot%",
  fireRes: "🔥Res",
  iceRes: "❄Res",
  lightRes: "⚡Res",
  healCdr: "CDR",
  xpBoost: "XP%",
  goldBoost: "Gold%",
  elementAmp: "ElemAmp"
};

const PERCENT = new Set([
  "critChance",
  "critDmg",
  "atkSpeed",
  "lifesteal",
  "enrage",
  "dodge",
  "lootChance",
  "fireRes",
  "iceRes",
  "lightRes",
  "healCdr",
  "xpBoost",
  "goldBoost",
  "elementAmp"
]);

const OFFSTATS = [
  "atk",
  "critChance",
  "critDmg",
  "atkSpeed",
  "fire",
  "ice",
  "lightning",
  "poison",
  "bleed",
  "enrage",
  "lifesteal",
  "elementAmp"
];

const DEFSTATS = ["hp", "def", "dodge", "fireRes", "iceRes", "lightRes"];

const UTILSTATS = ["lootChance", "goldBoost", "xpBoost", "healCdr"];

const STATCAT = {};

// a weapon may carry at most ONE of these "specials"; only enrage may sit alongside an element
const EXCL = new Set(["lightning", "poison", "bleed", "burn", "frost", "doom"]);

// dodge & resistances use a def-like diminishing curve, so high values need enormous investment
const CURVED = new Set(["dodge", "fireRes", "iceRes", "lightRes"]);

const SLOTS = [
  {
    key: "weapon",
    label: "Weapon",
    ic: "⚔️",
    main: "atk",
    affixes: ["critChance", "critDmg", "atkSpeed", "lightning", "lifesteal", "poison", "enrage", "elementAmp"]
  },
  {
    key: "armor",
    label: "Armor",
    ic: "🛡️",
    main: "def",
    affixes: ["hp", "dodge", "lootChance", "fireRes", "iceRes", "lightRes", "lifesteal", "critChance"]
  },
  {
    key: "helm",
    label: "Helm",
    ic: "⛑️",
    main: "hp",
    affixes: [
      "def",
      "dodge",
      "lootChance",
      "critDmg",
      "enrage",
      "fireRes",
      "iceRes",
      "lightRes",
      "critChance"
    ]
  },
  {
    key: "gloves",
    label: "Gloves",
    ic: "🧤",
    main: "critChance",
    affixes: ["atkSpeed", "critDmg", "enrage", "lifesteal", "dodge", "lootChance", "elementAmp"]
  },
  {
    key: "boots",
    label: "Boots",
    ic: "🥾",
    main: "atkSpeed",
    affixes: ["hp", "def", "dodge", "fireRes", "iceRes", "lightRes", "critChance"]
  },
  {
    key: "amulet",
    label: "Amulet",
    ic: "📿",
    main: "critDmg",
    affixes: [
      "critChance",
      "enrage",
      "healCdr",
      "lootChance",
      "xpBoost",
      "goldBoost",
      "lifesteal",
      "elementAmp"
    ]
  }
];

const UNLOCK = [0, 0, 300, 800, 2000, 5000];

const ENEMIES = {
  goblin: {
    n: "Goblin",
    c: "#6fae4a",
    sz: 0.85,
    shape: "biped",
    hpM: 0.8,
    atkM: 1.0,
    defM: 0.6,
    res: { fire: -0.5, ice: 0, lightning: 0 }
  },
  bat: {
    n: "Bat",
    c: "#6b5a7a",
    sz: 0.7,
    shape: "biped",
    hpM: 0.4,
    atkM: 1.4,
    defM: 0.4,
    res: { fire: 0, ice: -0.5, lightning: 0 }
  },
  demon: {
    n: "Demon",
    c: "#b0402f",
    sz: 1.2,
    shape: "biped",
    hpM: 1.2,
    atkM: 1.35,
    defM: 0.8,
    res: { fire: 0.6, ice: -0.4, lightning: 0 },
    elem: "fire"
  },
  serpent: {
    n: "Serpent",
    c: "#3a8f6a",
    sz: 1.05,
    shape: "blob",
    hpM: 1.1,
    atkM: 1.1,
    defM: 0.6,
    res: { fire: 0, ice: 0.4, lightning: -0.4 },
    elem: "ice"
  },
  revenant: {
    n: "Revenant",
    c: "#8792a3",
    sz: 1.05,
    shape: "ghost",
    hpM: 0.95,
    atkM: 1.2,
    defM: 0.7,
    res: { fire: -0.3, ice: 0, lightning: 0.4 },
    elem: "lightning"
  },
  skeleton: {
    n: "Skeleton",
    c: "#e6e6ea",
    sz: 0.95,
    shape: "biped",
    hpM: 0.9,
    atkM: 0.9,
    defM: 0.8,
    res: { fire: 0, ice: 0.5, lightning: -0.5 },
    elem: "ice"
  },
  slime: {
    n: "Slime",
    c: "#57c26a",
    sz: 1.0,
    shape: "blob",
    hpM: 2.1,
    atkM: 0.5,
    defM: 0.3,
    res: { fire: 0.5, ice: -0.5, lightning: 0 }
  },
  golem: {
    n: "Golem",
    c: "#8a8a92",
    sz: 1.25,
    shape: "block",
    hpM: 1.4,
    atkM: 1.1,
    defM: 1.9,
    res: { fire: 0, ice: 0, lightning: -0.4 }
  },
  wraith: {
    n: "Wraith",
    c: "#9a6ad0",
    sz: 1.0,
    shape: "ghost",
    hpM: 0.55,
    atkM: 1.55,
    defM: 0.5,
    res: { fire: -0.4, ice: 0, lightning: 0.3 }
  },
  orc: {
    n: "Orc",
    c: "#4f7a3a",
    sz: 1.15,
    shape: "biped",
    hpM: 1.1,
    atkM: 1.15,
    defM: 0.9,
    res: { fire: 0, ice: 0, lightning: 0 }
  }
};

const AREAS = [
  {
    n: "Goblin Warrens",
    sp: "🏕️",
    lvl: 1,
    waves: 5,
    pool: ["goblin", "wraith"],
    boss: "Goblin King",
    weak: "🔥 Fire",
    bg: ["#2a3320", "#12160c"],
    gr: "#2c3a1e",
    deco: "trees",
    bossLines: [
      "You call THAT a sword? My nan forges better!",
      "Ooh, fresh meat! I mean... welcome, traveler.",
      "Nobody out-greeds the Goblin King. NOBODY!"
    ]
  },
  {
    n: "Frost Caverns",
    sp: "🧊",
    lvl: 4,
    waves: 6,
    pool: ["slime", "skeleton"],
    boss: "Ice Troll",
    weak: "❄ Ice / ⚡ Lightning (slimes resist fire!)",
    bg: ["#22384a", "#0d1824"],
    gr: "#28394a",
    deco: "ice",
    bossLines: [
      "Brrr... you're letting the cold air in.",
      "I'd offer you a drink but everything's frozen.",
      "Cool guys don't look at explosions. I AM the cool guy."
    ]
  },
  {
    n: "Stone Bastion",
    sp: "🏰",
    lvl: 8,
    waves: 7,
    pool: ["golem", "orc"],
    boss: "Colossus",
    weak: "⚡ Lightning + Attack (armored!)",
    bg: ["#2e2e3a", "#13131c"],
    gr: "#38383f",
    deco: "pillars",
    bossLines: [
      "I am rock. You are... squishy.",
      "It took me 400 years to learn to move. Worth it.",
      "Please knock next time. This wall is load-bearing."
    ]
  },
  {
    n: "Shadow Keep",
    sp: "🌑",
    lvl: 13,
    waves: 8,
    pool: ["wraith", "skeleton", "orc"],
    boss: "The Lich",
    weak: "⚡ Lightning favored",
    bg: ["#241a32", "#0e0a18"],
    gr: "#281f38",
    deco: "stars",
    bossLines: [
      "Ah, a visitor! I haven't had lunch in centuries.",
      "I put the 'die' in 'dedication'.",
      "Death is just a phase. You'll learn."
    ]
  },
  {
    n: "Ember Depths",
    sp: "🌋",
    lvl: 18,
    waves: 10,
    pool: ["demon", "orc"],
    boss: "Balrog",
    weak: "❄ Ice (demons resist fire!)",
    bg: ["#3a1a12", "#160806"],
    gr: "#3a1e14",
    deco: "lava",
    bossLines: [
      "You SHALL not... oh wait, wrong franchise.",
      "Is it hot in here, or is it just me? It's me.",
      "I moisturize with magma. Feel the glow."
    ]
  },
  {
    n: "Sunken Ruins",
    sp: "🌊",
    lvl: 24,
    waves: 10,
    pool: ["serpent", "slime"],
    boss: "Leviathan",
    weak: "⚡ Lightning · 🫧 mind your AIR!",
    gimmick: "drown",
    bg: ["#123a3a", "#07201f"],
    gr: "#1c3a38",
    deco: "bubbles",
    bossLines: [
      "You're a long way from the surface, snack.",
      "Glub glub. That's ancient for 'run'.",
      "I've swallowed whole fleets. You're an appetizer."
    ]
  },
  {
    n: "Haunted Spire",
    sp: "🏚️",
    lvl: 30,
    waves: 12,
    pool: ["revenant", "wraith", "bat"],
    boss: "Banshee",
    weak: "🔥 Fire",
    bg: ["#1e2a20", "#0b130e"],
    gr: "#243020",
    deco: "stars",
    bossLines: [
      "SCREEEE— sorry, indoor voice.",
      "You have such a lovely soul. May I keep it?",
      "I'd scream, but I don't want to wake the neighbors."
    ]
  },
  {
    n: "Dragon's Roost",
    sp: "🐉",
    lvl: 38,
    waves: 12,
    pool: ["demon", "golem"],
    boss: "Elder Wyrm",
    weak: "❄ Ice / ⚡ Lightning",
    bg: ["#3a241a", "#170d08"],
    gr: "#3a281a",
    deco: "lava",
    bossLines: [
      "A knight! I do love a crunchy snack.",
      "My hoard called — it wants your gold too.",
      "Careful, I just had these teeth polished."
    ]
  },
  {
    n: "The Abyss",
    sp: "🕳️",
    lvl: 48,
    waves: 15,
    pool: ["revenant", "demon", "golem", "serpent"],
    boss: "Void Titan",
    weak: "bring your best",
    bg: ["#181226", "#050310"],
    gr: "#181430",
    deco: "stars",
    bossLines: [
      "You are but a rounding error in the void.",
      "I have stared into you. You blinked.",
      "Welcome to the end. Mind the gap."
    ]
  },
  {
    n: "Frozen Throne",
    sp: "👑",
    lvl: 58,
    waves: 13,
    pool: ["skeleton", "wraith", "golem"],
    boss: "Lich Queen",
    weak: "🔥 Fire",
    bg: ["#1c2c40", "#0a1420"],
    gr: "#233a52",
    deco: "ice",
    bossLines: [
      "Kneel before the frost, warmblood.",
      "I'll add your soul to my collection.",
      "Winter is not coming — winter is HERE."
    ]
  },
  {
    n: "Infernal Gate",
    sp: "😈",
    lvl: 70,
    waves: 14,
    pool: ["demon", "orc"],
    boss: "Archfiend",
    weak: "❄ Ice / ⚡ Lightning",
    bg: ["#3a1410", "#160604"],
    gr: "#3a1a12",
    deco: "lava",
    bossLines: [
      "Welcome to the gate. Wipe your feet — in lava.",
      "I've got a HELL of a welcome for you.",
      "Your armor warranty? Voided."
    ]
  },
  {
    n: "Astral Spire",
    sp: "🌌",
    lvl: 85,
    waves: 16,
    pool: ["revenant", "demon", "golem", "serpent", "wraith"],
    boss: "The Architect",
    weak: "bring everything",
    bg: ["#141033", "#04030f"],
    gr: "#191345",
    deco: "stars",
    bossLines: [
      "You are a variable I did not account for.",
      "Reality is my draft. You are a typo.",
      "I built this cosmos. I can unbuild you."
    ]
  }
];

// ===== unique boss mechanics (one per area) — each channels an ability with a cast bar =====
const MECHS = [
  // 0 Goblin Warrens — summons minions
  {
    id: "rally",
    name: "Rally the Warrens",
    icon: "📯",
    dur: 1900,
    cd: 8000,
    col: "#8fd06a",
    resolve: b => {
      const lv = Math.max(1, run.a.lvl + run.total - 3);
      const xs = [310, 500];
      let n = 0;
      for (const x of xs) {
        if (summonFoe("goblin", lv, 0.5, x)) {
          n++;
        }
      }
      if (n) {
        beep(300, 0.2, "square", 0.12);
        $("rmsg").className = "msg big";
        $("rmsg").innerHTML = "📯 The King calls in " + n + " goblin" + (n > 1 ? "s" : "") + "!";
      }
    }
  },
  // 1 Frost Caverns — freezes the hero
  {
    id: "permafrost",
    name: "Permafrost",
    icon: "❄️",
    dur: 1700,
    cd: 7000,
    col: "#6cd0ff",
    onCast: b => {
      for (let i = 0; i < 6; i++)
        particles.push({
          x: 150 + (Math.random() - 0.5) * 26,
          y: GY - 30 - Math.random() * 20,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -0.3 - Math.random() * 0.6,
          life: 1,
          sz: 2,
          col: "#bfe6ff"
        });
    },
    resolve: b => {
      run.frozenUntil = run.time + 2600;
      flash("#6cd0ff");
      beep(200, 0.3, "sine", 0.12);
      floatDmg("hero", "❄ FROZEN", 0, "#bfe6ff");
      for (let i = 0; i < 16; i++)
        particles.push({
          x: 150 + (Math.random() - 0.5) * 34,
          y: GY - 34 - Math.random() * 24,
          vx: (Math.random() - 0.5) * 1.2,
          vy: -0.4 - Math.random() * 1,
          life: 1,
          sz: 2,
          col: "#bfe6ff"
        });
    }
  },
  // 2 Stone Bastion — hardens into a shield
  {
    id: "stoneskin",
    name: "Stoneskin",
    icon: "🪨",
    dur: 1900,
    cd: 9500,
    col: "#b9c4d6",
    resolve: b => {
      b.shieldUntil = run.time + 4500;
      beep(150, 0.3, "triangle", 0.13);
      floatDmg("foe", "🪨 SHIELDED", 0, "#d6dce6", b._x);
    }
  },
  // 3 Shadow Keep — cloaks (evasion) and poisons the hero
  {
    id: "veil",
    name: "Veil of Shadows",
    icon: "🌑",
    dur: 1600,
    cd: 7500,
    col: "#a06bff",
    resolve: b => {
      b.evadeUntil = run.time + 4200;
      run.heroPoisonUntil = run.time + 5000;
      run.heroPoisonDmg = Math.max(2, run.hero.max * 0.016);
      flash("#a06bff");
      beep(260, 0.25, "sawtooth", 0.11);
      floatDmg("foe", "🌑 VEILED", 0, "#c9a6ff", b._x);
      floatDmg("hero", "☠ CURSED", 0, "#9be07f");
    }
  },
  // 4 Ember Depths — erupts the lava floor
  {
    id: "eruption",
    name: "Eruption",
    icon: "🌋",
    dur: 2500,
    cd: 8000,
    col: "#ff5a1e",
    tick: (b, dt) => {
      for (let i = 0; i < 2; i++)
        particles.push({
          x: Math.random() * 560,
          y: GY + 2,
          vx: (Math.random() - 0.5) * 1.4,
          vy: -1 - Math.random() * 2.2,
          life: 1,
          sz: 2 + Math.random() * 2,
          col: ["#ff5a1e", "#ffb03a", "#ff7a2f"][i % 3]
        });
    },
    resolve: b => {
      const d = run.hero.max * 0.2;
      flash("#ff5a1e");
      shake();
      beep(90, 0.4, "sawtooth", 0.18);
      for (let i = 0; i < 26; i++)
        particles.push({
          x: Math.random() * 560,
          y: GY,
          vx: (Math.random() - 0.5) * 4,
          vy: -2 - Math.random() * 4,
          life: 1,
          sz: 2 + Math.random() * 2,
          col: ["#ff5a1e", "#ffb03a", "#ff3b1e"][i % 3]
        });
      abilityHitHero(d, "🌋 ERUPTION", "#ff7a2f", "fire");
    }
  },
  // 5 Sunken Ruins — NO boss cast; the stage-wide drown/air timer is the gimmick (see run.air). Leviathan is a beefy damage-sponge.
  null,
  // 6 Haunted Spire — wails, raising ghosts that revive once
  {
    id: "wail",
    name: "Wail of the Dead",
    icon: "👻",
    dur: 2000,
    cd: 8500,
    col: "#c6b5e6",
    resolve: b => {
      const lv = Math.max(1, run.a.lvl + run.total - 3);
      const xs = [310, 500];
      let n = 0;
      for (const x of xs) {
        if (summonFoe("wraith", lv, 0.5, x, { revive: 1 })) {
          n++;
        }
      }
      if (n) {
        beep(260, 0.3, "sawtooth", 0.12);
        $("rmsg").className = "msg big";
        $("rmsg").innerHTML = "👻 Ghosts rise — they revive once when slain!";
      }
    }
  },
  // 7 Dragon's Roost — breathes fire; hardens through 3 stages at 66% / 33% HP
  {
    id: "wyrmbreath",
    name: "Wyrmbreath",
    icon: "🔥",
    dur: 2200,
    cd: 7000,
    col: "#ff7a2f",
    onSpawn: b => {
      b.phase = 0;
    },
    onHit: b => {
      const fr = b.hp / b.max;
      if (fr <= 0.66 && b.phase < 1) {
        b.phase = 1;
        dragonPhase(b, 2);
      } else if (fr <= 0.33 && b.phase < 2) {
        b.phase = 2;
        dragonPhase(b, 3);
      }
    },
    resolve: b => {
      const d = run.hero.max * (0.15 + b.phase * 0.03);
      flash("#ff7a2f");
      shake();
      beep(120, 0.35, "sawtooth", 0.16);
      for (let i = 0; i < 18; i++)
        particles.push({
          x: 150 + (Math.random() - 0.2) * 90,
          y: GY - 24 - Math.random() * 20,
          vx: 2 + Math.random() * 4,
          vy: (Math.random() - 0.5) * 2,
          life: 1,
          sz: 2 + Math.random() * 2,
          col: ["#ff5a1e", "#ffb03a", "#ff7a2f"][i % 3]
        });
      abilityHitHero(d, "🔥 WYRMBREATH", "#ff7a2f", "fire");
    }
  },
  // 8 The Abyss — event horizon stacks that slow the hero's swing
  {
    id: "horizon",
    name: "Event Horizon",
    icon: "🕳️",
    dur: 2400,
    cd: 6500,
    col: "#b06bff",
    tick: (b, dt) => {
      const cx = b._x;
      for (let i = 0; i < 3; i++) {
        const ang = Math.random() * Math.PI * 2,
          r = 30 + Math.random() * 30;
        particles.push({
          x: cx + Math.cos(ang) * r,
          y: GY - 24 + Math.sin(ang) * r * 0.5,
          vx: -Math.cos(ang) * 2,
          vy: -Math.sin(ang) * 1,
          life: 1,
          sz: 2,
          col: "#c9a6ff"
        });
      }
    },
    resolve: b => {
      run.slowStacks = (run.slowStacks || 0) + 1;
      flash("#b06bff");
      beep(140, 0.3, "sawtooth", 0.14);
      floatDmg("hero", "🕳️ SLOWED ×" + run.slowStacks, 0, "#c9a6ff");
      const d = run.hero.max * 0.06;
      abilityHitHero(d, "", "#c9a6ff");
    }
  },
  // 9 Frozen Throne — Blizzard: freeze + ice damage
  {
    id: "blizzard",
    name: "Blizzard",
    icon: "❄️",
    dur: 2100,
    cd: 7500,
    col: "#8fd8ff",
    tick: (b, dt) => {
      for (let i = 0; i < 3; i++)
        particles.push({
          x: Math.random() * 560,
          y: -2,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.9 + Math.random() * 1.3,
          life: 1,
          sz: 2,
          col: "#dff2ff"
        });
    },
    resolve: b => {
      run.frozenUntil = run.time + 2200;
      flash("#8fd8ff");
      shake();
      beep(200, 0.35, "sine", 0.13);
      floatDmg("hero", "❄ FROZEN", 0, "#bfe6ff");
      abilityHitHero(run.hero.max * 0.1, "❄ BLIZZARD", "#8fe0ff", "ice");
    }
  },
  // 10 Infernal Gate — Meteor: big fire AoE
  {
    id: "meteor",
    name: "Meteor",
    icon: "☄️",
    dur: 2600,
    cd: 8000,
    col: "#ff6a2f",
    tick: (b, dt) => {
      for (let i = 0; i < 2; i++)
        particles.push({
          x: Math.random() * 560,
          y: -2,
          vx: -1 - Math.random(),
          vy: 2 + Math.random() * 3,
          life: 1,
          sz: 2 + Math.random() * 2,
          col: ["#ff5a1e", "#ffb03a"][i % 2]
        });
    },
    resolve: b => {
      const d = run.hero.max * 0.23;
      flash("#ff5a1e");
      shake();
      setTimeout(shake, 120);
      beep(80, 0.45, "sawtooth", 0.2);
      for (let i = 0; i < 28; i++)
        particles.push({
          x: 150 + (Math.random() - 0.5) * 80,
          y: GY,
          vx: (Math.random() - 0.5) * 5,
          vy: -2 - Math.random() * 5,
          life: 1,
          sz: 2 + Math.random() * 2,
          col: ["#ff5a1e", "#ffb03a", "#ff3b1e"][i % 3]
        });
      abilityHitHero(d, "☄ METEOR", "#ff7a2f", "fire");
    }
  },
  // 11 Astral Spire — The Architect: 3-phase + Singularity (slow stack + damage)
  {
    id: "singularity",
    name: "Singularity",
    icon: "🌌",
    dur: 2400,
    cd: 6500,
    col: "#b79fff",
    onSpawn: b => {
      b.phase = 0;
    },
    onHit: b => {
      const fr = b.hp / b.max;
      if (fr <= 0.66 && b.phase < 1) {
        b.phase = 1;
        architectPhase(b, 2);
      } else if (fr <= 0.33 && b.phase < 2) {
        b.phase = 2;
        architectPhase(b, 3);
      }
    },
    tick: (b, dt) => {
      const cx = b._x;
      for (let i = 0; i < 3; i++) {
        const ang = Math.random() * Math.PI * 2,
          r = 28 + Math.random() * 34;
        particles.push({
          x: cx + Math.cos(ang) * r,
          y: GY - 26 + Math.sin(ang) * r * 0.5,
          vx: -Math.cos(ang) * 2.2,
          vy: -Math.sin(ang) * 1.1,
          life: 1,
          sz: 2,
          col: "#c9b6ff"
        });
      }
    },
    resolve: b => {
      run.slowStacks = (run.slowStacks || 0) + 1;
      flash("#b79fff");
      shake();
      beep(130, 0.32, "sawtooth", 0.15);
      floatDmg("hero", "🌌 SLOWED ×" + run.slowStacks, 0, "#c9b6ff");
      abilityHitHero(run.hero.max * 0.09, "", "#c9b6ff");
    }
  }
];

const BOONS = [
  { n: "Keen Edge", i: "🗡️", d: "+8% Crit Damage", f: s => (s.critDmg += 8) },
  { n: "Vigor", i: "❤️", d: "+70 Health", f: s => (s.hp += 70) },
  {
    n: "Ironhide",
    i: "🛡️",
    d: "+40 Health, +6 Defense",
    f: s => {
      s.hp += 40;
      s.def += 6;
    }
  },
  { n: "Bloodthirst", i: "🩸", d: "+1.5% Lifesteal", f: s => (s.lifesteal += 1.5) },
  { n: "Swiftness", i: "💨", d: "+6% Attack Speed", f: s => (s.atkSpeed += 6) },
  {
    n: "Warlord",
    i: "👑",
    d: "+8 Attack, +4% Crit",
    f: s => {
      s.atk += 8;
      s.critChance += 4;
    }
  },
  {
    n: "Fortune",
    i: "🍀",
    d: "+6 Loot, +12% Gold",
    f: s => {
      s.lootChance = (s.lootChance || 0) + 6;
      s.goldBoost = (s.goldBoost || 0) + 12;
    }
  },
  {
    n: "Warding",
    i: "🌀",
    d: "+12 Dodge rating",
    f: s => {
      s.dodge = (s.dodge || 0) + 12;
    }
  }
];

const SKILLS = {
  combat: {
    name: "⚔ Combat",
    col: "#ff6a5a",
    nodes: [
      { id: "c1", name: "Sharpened", d: "+12% Attack", max: 3, req: null },
      { id: "c2", name: "Haste", d: "+7% Attack Speed", max: 3, req: "c1" },
      { id: "c3", name: "Deadly", d: "+5% Crit Chance", max: 3, req: "c2" },
      { id: "c4", name: "Executioner", d: "+12% Crit Damage", max: 3, req: "c3" },
      { id: "c5", name: "Elementalist", d: "+18% Elemental", max: 3, req: "c4" },
      { id: "c6", name: "Berserker", d: "+35% dmg <50% HP", max: 2, req: "c5" }
    ]
  },
  loot: {
    name: "💰 Loot",
    col: "#5bd06a",
    nodes: [
      { id: "l1", name: "Fortune", d: "+12% drop chance", max: 3, req: null },
      { id: "l2", name: "Prospector", d: "Better rarity odds", max: 3, req: "l1" },
      { id: "l3", name: "Salvager", d: "+80% salvage shards", max: 2, req: "l2" },
      { id: "l4", name: "Big Pockets", d: "+1 bag from bosses", max: 2, req: "l3" },
      { id: "l5", name: "Greed", d: "+30% gold", max: 3, req: "l4" }
    ]
  },
  heal: {
    name: "✚ Faith",
    col: "#7fe0a0",
    nodes: [
      { id: "h1", name: "Field Medic", d: "Unlock ✚ Heal (30% HP)", max: 1, req: null },
      { id: "h2", name: "Greater Heal", d: "+8% heal power", max: 3, req: "h1" },
      { id: "h3", name: "Swift Grace", d: "-10% heal cooldown", max: 3, req: "h2" },
      { id: "h4", name: "Lifedrinker", d: "Heal 5% max HP per kill", max: 2, req: "h1" },
      { id: "h5", name: "Second Wind", d: "Regenerate HP in combat", max: 2, req: "h3" }
    ]
  },
  smith: {
    name: "⚒ Smith",
    col: "#ffcf5c",
    nodes: [
      { id: "s1", name: "Steady Hand", d: "+7% forge success", max: 3, req: null },
      { id: "s2", name: "Efficient", d: "-15% forge cost", max: 2, req: "s1" },
      { id: "s8", name: "True Aim", d: "Wider forge hit-zone", max: 3, req: "s2" },
      { id: "s6", name: "Lucky Strike", d: "+3% critical-success (grants +2)", max: 3, req: "s8" },
      { id: "s7", name: "Careful Temper", d: "-3% critical-failure risk", max: 3, req: "s6" },
      { id: "s3", name: "Reforger", d: "Reforge rolls higher", max: 2, req: "s7" },
      { id: "s4", name: "Masterwork", d: "+20% new-affix chance", max: 2, req: "s3" },
      { id: "s5", name: "Insured", d: "Upgrades never break", max: 1, req: "s4" }
    ]
  }
};

let S = {
  gold: 0,
  shards: 0,
  epicShards: 0,
  gear: {},
  bag: [],
  bagCap: 5,
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
  xpBuff: 0
};

const GUARDS = {
  low: { n: "Lesser Guard", save: 0.35, col: "--common" },
  med: { n: "Forge Guard", save: 0.6, col: "--uncommon" },
  high: { n: "Greater Guard", save: 0.85, col: "--rare" },
  vhigh: { n: "Master Guard", save: 1.0, col: "--epic" }
};

let armedGuard = null;
const ZCW = 14;
let celestialMode = false;
