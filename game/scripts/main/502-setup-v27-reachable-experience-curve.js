// ============ V27 REACHABLE EXPERIENCE CURVE ============
const legacyXpFor = lv => Math.round(30 * Math.pow(1.5, Math.max(1, lv) - 1));

const MYTHIC_AFFIXES = {
  weapon: ["mythicCrit", "mythicCritDmg", "mythicStatus"],
  helm: ["hardHat", "sneaky", "hotHeaded"],
  boots: ["nimble", "goldBoots", "swagger"],
  armor: ["ironSkin", "mythicThorns", "elementalWard"],
  gloves: ["kleptomaniac", "threeFingerJoe", "healingHands"],
  amulet: ["temper", "holyMission", "reborn"]
};

const MYTHIC_INFO = {
  mythicCrit: ["Keen Myth", "25% additional critical chance"],
  mythicCritDmg: ["Cruel Myth", "50% additional critical damage"],
  mythicStatus: ["Ancient Affliction", "Weapon status effects and their Celestial forms are 35% stronger"],
  hardHat: ["Hard Hat", "Blocks the first enemy attack once every two rooms"],
  sneaky: ["Sneaky", "Adds a flat 10% dodge chance after normal diminishing returns"],
  hotHeaded: ["Hot Headed", "Reduces the Enrage cooldown by 30%"],
  nimble: ["Nimble", "15% chance to resist an incoming negative status effect"],
  goldBoots: ["Gold Boots", "30% more gold from every kill"],
  swagger: ["Swagger", "Leaves a rainbow trail beneath the hero"],
  ironSkin: ["Iron Skin", "15% less damage after normal Defense reduction"],
  mythicThorns: ["Thorns", "Reflects 35% of received damage"],
  elementalWard: ["Elemental Ward", "Adds 35 Fire, Ice, and Lightning resistance rating"],
  kleptomaniac: ["Kleptomaniac", "20% additional loot chance"],
  threeFingerJoe: [
    "Three Finger Joe",
    "Each non Ultra hit adds 0.1% Ultra Crit chance until an Ultra Crit occurs"
  ],
  healingHands: ["Healing Hands", "Healing strength is increased by 10% additively"],
  temper: ["Temper", "Each kill grants 1% attack for the current area, up to 30%"],
  holyMission: [
    "Holy Mission",
    "25% more regular, Epic, and Celestial shards from all sources, rounded down"
  ],
  reborn: ["Reborn", "Revives once per area with 10% health"]
};

let reforgeLockStat = "";

const CELESTIAL_AREA_START = 13;

const l4aV32 = V6_TREES.loot.nodes.find(n => n.id === "l4a"),
  l6aV32 = V6_TREES.loot.nodes.find(n => n.id === "l6a");

// ============ V36 MYTHIC COMBAT, ECONOMY, UI, AND SKILL SPECIALIZATIONS ============
const V36_SKILL_TEXT = {
  c1: ["Tempered Edge", "10% more total attack per rank"],
  c2: ["Quickened Form", "6% attack speed per rank"],
  c3: ["Killing Intent", "5% critical chance per rank"],
  c4a: ["Executioner", "18% critical damage and 10% boss damage per rank"],
  c4b: ["Affliction", "15% stronger weapon status effects and 12% elemental damage per rank"],
  c5a: ["Cull", "3% critical chance and 10% more damage against wounded enemies per rank"],
  c5b: ["Catalyst", "10% attack speed and another 10% status power per rank"],
  c6a: ["Apex Hunter", "30% boss damage and 15% critical damage"],
  c6b: ["Blood Engine", "Strong Leech, higher Leech cap, and 25% stronger Bleed"],
  c6c: ["Plague Crown", "50% status power and 15% resistance pierce"],
  c6d: ["Tempest", "40% attack speed and 20% elemental damage"],
  l1: ["Fortune", "10% drop chance per rank"],
  l2: ["Prospector", "An additional rarity roll per rank"],
  l3: ["Salvager", "60% more salvage yield per rank"],
  l4a: ["Boss Plunder", "15% extra boss bag chance per rank"],
  l4b: ["Golden Path", "35% more gold per rank"],
  l5a: ["Relic Sense", "8% drop chance and better elite loot per rank"],
  l5b: ["Scholar's Luck", "12% more experience per rank"],
  l6a: ["Trophy Hunter", "20% additional boss bag chance"],
  l6b: ["Myth Seeker", "One extra rarity roll and twice the natural Mythic drop chance"],
  l6c: ["Midas", "60% more gold"],
  l6d: ["Insight", "35% more experience"],
  h1: ["Field Medic", "Unlock Heal"],
  h2: ["Greater Heal", "12% healing strength per rank"],
  h3: ["Swift Grace", "12 cooldown rating per rank"],
  h4a: ["Lifedrinker", "Restore 1% max health per kill per rank"],
  h4b: ["Sacred Armor", "10% max health per rank"],
  h5a: ["Crimson Grace", "2 Leech rating per rank"],
  h5b: ["Sanctuary", "12% total Defense per rank"],
  h6a: ["Feast", "Kills restore another 2% max health"],
  h6b: ["Sanguine", "5 Leech rating and double the Leech cap"],
  h6c: ["Bulwark", "25% max health and 12% less damage received"],
  h6d: ["Miracle", "40 cooldown rating and 35% healing strength"],
  s1: ["Steady Hand", "7% forge success per rank"],
  s2: ["Efficient", "15% lower forge costs per rank"],
  s8: ["True Aim", "Wider forge zones per rank"],
  s4a: ["Lucky Strike", "5% critical forge chance per rank"],
  s4b: ["Careful Temper", "5% lower shatter risk per rank"],
  s5a: ["Reforger", "An additional reforge roll per rank"],
  s5b: ["Masterwork", "25% affix milestone chance per rank"],
  s6a: ["Perfect Rhythm", "Another 8% critical forge chance"],
  s6b: ["Silver Hand", "Much wider silver and gold zones"],
  s6c: ["Unbreakable", "Items can never shatter"],
  s6d: ["Frugal Master", "Another 20% lower forge costs"]
};

// ============ V38 MYTHIC REFERENCE AND HERO BUFF ICONS ============
const MYTHIC_ICONS = {
  mythicCrit: "🎯",
  mythicCritDmg: "💥",
  mythicStatus: "✺",
  hardHat: "⛑",
  sneaky: "🥷",
  hotHeaded: "😡",
  nimble: "🪽",
  goldBoots: "🪙",
  swagger: "🌈",
  ironSkin: "🛡",
  mythicThorns: "✹",
  elementalWard: "🔰",
  kleptomaniac: "💰",
  threeFingerJoe: "👌",
  healingHands: "✋",
  temper: "⚔",
  holyMission: "✨",
  reborn: "♻"
};

const MYTHIC_DEBUFF_FIELDS = [
  "frozenUntil",
  "heroPoisonUntil",
  "heroPoisonDmg",
  "slowStacks",
  "chainHits",
  "chainUntil",
  "suppressedSlot",
  "suppressedUntil",
  "healLockedUntil",
  "purityUntil",
  "celestialSlowUntil",
  "celestialVulnerabilityUntil"
];

const MYTHIC_AUDIT = {
  mythicCrit: "heroStats adds 25 critical chance",
  mythicCritDmg: "heroStats adds 50 critical damage",
  mythicStatus: "status values and Celestial forms gain 35% power",
  hardHat: "first enemy attack blocked once every two rooms",
  sneaky: "10 flat dodge after diminishing returns",
  hotHeaded: "Enrage cooldown runs 30% faster",
  nimble: "15% chance to resist hostile debuffs",
  goldBoots: "30% additional gold",
  swagger: "rainbow combat trail",
  ironSkin: "15% final damage reduction",
  mythicThorns: "35% received damage reflected",
  elementalWard: "35 elemental resistance rating",
  kleptomaniac: "20% additional drop chance",
  threeFingerJoe: "0.1% Ultra Crit chance per non Ultra hit",
  healingHands: "10% additive healing strength",
  temper: "1% attack per area kill up to 30",
  holyMission: "25% additional shard yield rounded down",
  reborn: "one revive per area at 10% health"
};

const OMEGA_STUN = {
  id: "omegastun",
  name: "Stillness of Omega",
  icon: "◇",
  dur: 1350,
  cd: 300,
  col: "#dfffff",
  resolve: function (b) {
    b.omegaStunAt = run.time + 13000;
    if (celestialDebuffAllowed()) {
      run.frozenUntil = run.time + 1500;
      floatDmg("hero", "◇ STUNNED 1.5s", 0, "#dfffff");
      flash("#dfffff");
    } else floatDmg("hero", "NIMBLE", 0, "#78fff1");
    omegaFinishAbility(this, b);
  }
};

const OMEGA_HEAL = {
  id: "omegaheal",
  name: "Perfect Restoration",
  icon: "✦",
  dur: 1850,
  cd: 300,
  col: "#fff4b0",
  resolve: function (b) {
    b.omegaHealAt = run.time + 27000;
    const amount = b.max * 0.05;
    b.hp = Math.min(b.max, b.hp + amount);
    b.healGlowUntil = run.time + 1800;
    for (let i = 0; i < 24; i++) {
      const ang = Math.random() * Math.PI * 2,
        rad = 8 + Math.random() * 38;
      particles.push({
        x: b._x + Math.cos(ang) * rad,
        y: GY - 33 + Math.sin(ang) * rad * 0.5,
        vx: -Math.cos(ang) * 0.45,
        vy: -0.5 - Math.random() * 0.5,
        life: 1,
        sz: 2.5,
        col: i % 2 ? "#ffffff" : "#fff1a8"
      });
    }
    floatDmg("foe", "✦ +" + Math.round(amount) + " HP", 0, "#fff4b0", b._x);
    drawBars();
    omegaFinishAbility(this, b);
  }
};

const OMEGA_SUMMON = {
  id: "omegasummon",
  name: "Final Constellation",
  icon: "Ω",
  dur: 2850,
  cd: 300,
  col: "#ffffff",
  resolve: function (b) {
    b.omegaSummonAt = run.time + 50000;
    omegaSummonGuards(b);
    omegaFinishAbility(this, b);
  }
};

const OMEGA_CONTROLLER = {
  id: "omegatriad",
  name: "OMEGA",
  icon: "Ω",
  dur: 1000,
  cd: 300,
  col: "#ffffff",
  onSpawn: b => {
    b.omegaStunAt = run.time + 7500;
    b.omegaHealAt = run.time + 22000;
    b.omegaSummonAt = run.time + 50000;
    b.phase = 0;
    run.nextCastAt = b.omegaStunAt;
  },
  onHit: b => {
    const q = b.hp / b.max;
    if (q <= 0.75 && b.phase < 1) {
      b.phase = 1;
      sayBoss("THE FIRST SEAL BREAKS.");
    } else if (q <= 0.5 && b.phase < 2) {
      b.phase = 2;
      sayBoss("PERFECTION REQUIRES PRESSURE.");
    } else if (q <= 0.25 && b.phase < 3) {
      b.phase = 3;
      sayBoss("OMEGA IS NOT A NAME. IT IS AN OUTCOME.");
    }
  }
};

// ============ V41 FIELD CLARITY, MYTHIC PROGRESSION, RECAP, AND TRAINING ==========
const FUTURE_CONTENT_NOTE = Object.freeze(["Spell Book", "Spear", "Great Axe"]);

const STATUS_LANES = [
  [-3, -18],
  [-42, -8],
  [36, -8],
  [-66, 14],
  [60, 14],
  [-25, 30],
  [20, 30]
];

const armorSlot = SLOTS.find(s => s.key === "armor"),
  bootsSlot = SLOTS.find(s => s.key === "boots");

/* ---------- (2) CELESTIAL LIFESTEAL REDUCTION (monotonic) ---------- */
// End 10% · Alpha 25% · Beta 50% · Gamma 75% · Omega 85% (applies in regular AND abyss, keyed on area index)
const LEECH_REDUCTION = { 12: 0.1, 13: 0.25, 14: 0.5, 15: 0.75, 16: 0.85 };

let nextRunAbyss = false;

const ABYSS_DEBUFF_FIELDS = [
  "frozenUntil",
  "celestialSlowUntil",
  "healLockedUntil",
  "heroPoisonUntil",
  "purityUntil",
  "celestialVulnerabilityUntil",
  "suppressedUntil"
];

/* Weapon base-attack multipliers — retuned for the speed-vs-power tradeoff. Fast types
   (dagger/bow) hit softer but swing faster (swingTypeMulV50); slow types (sword/greataxe)
   hit harder per swing but are slower & more exposed. Applied as a final rescale from each
   type's old baked multiplier to the new tunable one, so it also covers reforged weapons. */
const WEAPON_OLD_ATKMUL = { sword: 1.28, bow: 0.92, dagger: 0.68, greataxe: 1.42 };

/* ---------- MUSIC: selectable background tracks (default: inono) + shop selector ---------- */
const MUSIC_TRACKS = [
  {
    id: "chiptune",
    name: "Chiptune (built-in)",
    credit: "Procedurally-composed 8-bit loop — original to The Forge"
  },
  {
    id: "musInonoV50",
    name: "Game 8bit",
    credit: "“Game 8bit” by inono777 · Pixabay License (free, attribution appreciated)"
  },
  {
    id: "musDjartV50",
    name: "Return of the 8bit Era",
    credit: "“The Return of the 8bit Era” by djartmusic · Pixabay License (free, attribution appreciated)"
  },
  {
    id: "musMoodV50",
    name: "8bit Retro Game Music",
    credit: "“8bit Retro Game Music” by moodmode · Pixabay License (free, attribution appreciated)"
  }
];

const MUSIC_VOL = 0.34;

let currentMp3 = null,
  musicRate = 1.0;

// ============ V51 SPIRE, BUILD PIVOTS, MEDALS, BOONS, DEFENSE, AND SHOP ==========
/* ---- (patch scope opened) ---- */
const MEDAL_THRESHOLDS = { bronze: 3, silver: 10, gold: 25 };

const MEDAL_ICONS = { none: "", bronze: "●", silver: "●", gold: "●" };

const DEATH_LINES = {
  goblin: ["You died to a goblin. We are both surprised.", "I am putting that sword on GoblinBay."],
  bat: ["Echolocation says you are still dead.", "I barely even have hands."],
  slime: ["You have been outsmarted by soup.", "No bones. No brain. Still won."],
  skeleton: ["Skill issue. I do not even have muscles.", "I have been dead for years and looked healthier."],
  golem: ["Rock beats hero.", "That was my fast attack."],
  wraith: ["Boo. Also, you are dead.", "Your soul has terrible stats."],
  demon: ["Your warranty does not cover hellfire.", "Respawning is just dying with paperwork."],
  serpent: ["Hiss happens.", "You looked more poisonous than you were."],
  revenant: ["I came back. You did not.", "Death suits you. I would know."],
  orc: ["That build looked better in town.", "You brought numbers to an axe fight."],
  plaguefrog: ["Croaked by a frog. Beautiful.", "My poison has excellent reviews."],
  thornback: ["Stop hitting yourself.", "The bow was right there."],
  default: [
    "Your loot is safe. Mostly.",
    "That was an ambitious way to test armor.",
    "I will tell the next hero you almost had me.",
    "Have you considered dodging the damage?",
    "The forge cannot upgrade decision making."
  ]
};

const TREE_TEXT = {
  c6a: ["Apex Hunter", "55% boss damage and 35% critical damage"],
  c6c: ["Plague Crown", "85% status power and 23% resistance pierce"],
  c6d: ["Tempest", "60% attack speed and 35% elemental damage"],
  h5b: ["Sanctuary", "20% total Defense per rank"],
  h6c: ["Bulwark", "About 44% max health and 25% less damage received"],
  h6d: ["Miracle", "65 cooldown rating and 70% healing strength"]
};

/* Stage boons are percentage based and Lifesteal is deliberately absent. */
const PERCENT_BOONS = [
  { n: "Keen Edge", i: "🗡️", d: "+6% total Attack", apply: s => (s.atk += 6) },
  { n: "Vigor", i: "❤️", d: "+7% maximum Health", apply: s => (s.hp += 7) },
  { n: "Ironhide", i: "🛡️", d: "+7% total Defense", apply: s => (s.def += 7) },
  { n: "Swiftness", i: "💨", d: "+6% Attack Speed", apply: s => (s.atkSpeed += 6) },
  {
    n: "Warlord",
    i: "👑",
    d: "+4% Critical Chance and +6% Critical Damage",
    apply: s => {
      s.critChance += 4;
      s.critDmg += 6;
    }
  },
  {
    n: "Fortune",
    i: "🍀",
    d: "+5% item drop chance and +10% Gold",
    apply: s => {
      s.dropChance += 5;
      s.goldBoost += 10;
    }
  },
  { n: "Warding", i: "🌀", d: "+10% total Dodge rating", apply: s => (s.dodge += 10) }
];

// ============ V53 FRAME RATE INDEPENDENT SMITHING SPEED ============
/* ---- (patch scope opened) ---- */
const SMITH_PLUS_NINE_SPEED = 2.6 + 9 * 0.34;

let smithFrameTime = null;

// ============ V54 ACCESSORY SCALING, FORGE FIXES, AUTO RUN, AND AUDIO SETTINGS ============
/* ---- (patch scope opened) ---- */
const glove = SLOTS.find(s => s.key === "gloves"),
  amuletV54 = SLOTS.find(s => s.key === "amulet");

/* Gold mastery unlocks continuous runs. Loot is resolved through the normal auto salvage rules. */
let autoRunState = null;

/* Music button settings. The three recorded songs can loop individually or continue randomly. */
const AUDIO_TRACKS = [
  { value: "1", id: "musInonoV50", name: "Game 8bit" },
  { value: "2", id: "musDjartV50", name: "Return of the 8bit Era" },
  { value: "3", id: "musMoodV50", name: "8bit Retro Game Music" }
];

let currentAudio = null,
  lastRandomTrack = null,
  audioRate = 1;

// ============ V56 ACCESSORY CURVE, COMBAT CAPSTONES, AND BOSS RUSH LEVELS ============
/* ---- (patch scope opened) ---- */
const COMBAT_CAPSTONES = {
  c6a: { name: "Apex Hunter", text: "20% boss damage and 12% critical damage", max: 1 },
  c6b: { name: "Blood Engine", text: "Strong Leech, a higher Leech cap, and 25% stronger Bleed", max: 1 },
  c6c: { name: "Plague Crown", text: "35% status power and 10% resistance pierce", max: 1 },
  c6d: { name: "Tempest", text: "25% attack speed and 12% elemental damage", max: 1 }
};

/* V65 · Completed tree mastery and ten clear reruns. */
/* ---- (patch scope opened) ---- */
const TREE_MASTERY_CFG = {
  combat: { first: 1, at50: 0.05, label: "Attack damage" },
  loot: { first: 5, at50: 0.05, label: "Item drop chance" },
  heal: { first: 1, at50: 0.05, label: "Maximum health" },
  smith: { first: 0.5, at50: 0.025, label: "Silver critical success" }
};

/* V67 · Slider based currency refinement. */
/* ---- (patch scope opened) ---- */
const conversionSelection = { regular: 1, epic: 1 };

/* ---- (patch scope opened) ---- */
const GAME_VERSION = 73,
  SKILL_BUDGET = 50;

const DISCIPLINES = {
  none: {
    icon: "◇",
    name: "Unbound",
    need: () => true,
    desc: "No discipline modifiers. Every weapon behaves normally."
  },
  fury: {
    icon: "🔥",
    name: "Berserker",
    need: () => true,
    desc: "Deal 30% more damage below half health. Defense is reduced by 15%."
  },
  tempo: {
    icon: "⚡",
    name: "Duelist",
    need: () => true,
    desc: "Attack 14% faster and gain 8 Dodge rating. Maximum health is reduced by 12%."
  },
  bulwark: {
    icon: "🛡",
    name: "Bulwark",
    need: () => true,
    desc: "Gain 22% Defense and 18% maximum health. Direct attack is reduced by 18%."
  },
  hunter: {
    icon: "🎯",
    name: "Boss Hunter",
    need: () => true,
    desc: "Deal 24% more damage to bosses and 12% more to wounded enemies. Attack speed is reduced by 10%."
  },
  occult: {
    icon: "☾",
    name: "Occultist",
    need: () => true,
    desc: "All status effects are 38% stronger. Direct attack is reduced by 16%."
  }
};

const CONTRACTS = {
  blood: {
    icon: "🩸",
    name: "Blood Debt",
    risk: "Healing strength and effective Leech are reduced by 50%.",
    reward: "Reward: 6% additional item drop chance.",
    color: "#ff6f75"
  },
  onslaught: {
    icon: "⚡",
    name: "Onslaught",
    risk: "Enemies attack 30% faster.",
    reward: "Reward: 15% more gold and one additional boss bag.",
    color: "#ffd36e"
  },
  iron: {
    icon: "🛡",
    name: "The Iron Host",
    risk: "Every enemy has 45% more health.",
    reward: "Reward: items drop two levels higher and experience rises 10%.",
    color: "#8eb5ca"
  },
  glass: {
    icon: "◆",
    name: "Glass Oath",
    risk: "Maximum health is reduced by 30%.",
    reward: "Reward: one additional rarity roll and 20% more experience.",
    color: "#d69cff"
  },
  mastery: {
    icon: "★",
    name: "Mastery Contract",
    risk: "Combines every standard contract penalty.",
    reward: "Reward: three additional boss bags and two additional rarity rolls. Once per area.",
    color: "#f0d27c"
  }
};

let startingContract = null;

/* Exceptional hit audio is contrast based and rate limited. */
const hitHistory = [];
let lastImpact = 0;

/* Auto Run stops on death, meaningful loot, or after five quiet clears. */
let autoBatch = { active: false, clears: 0, startBag: 0, startGold: 0, startShards: 0 };

const portraitCache = {};

/* ---- (patch scope opened) ---- */
const QV74 = [];

const QUEST_GOLD = {
  forge1: 100,
  forge10: 5000,
  forge15: 25000,
  forge20: 100000,
  cel10: 500000,
  mythic13: 2000000,
  campaign2: 2000,
  campaign4: 7500,
  campaign6: 20000,
  campaign9: 75000,
  campaign12: 150000,
  campaign13: 225000,
  campaign15: 300000,
  campaign17: 375000,
  abyss1: 250000,
  abyss3: 400000,
  abyss6: 600000,
  abyss9: 900000,
  abyss13: 1400000,
  abyss15: 2000000,
  abyss17: 3000000
};

const MAIN_CHAIN = [
  "forge1",
  "forge10",
  "campaign2",
  "campaign4",
  "campaign6",
  "campaign9",
  "campaign12",
  "campaign13",
  "campaign15",
  "campaign17"
];

let questPopQueue = [],
  questPopBusy = false,
  questMenuPage = "Campaign";

let questDamageRefresh = false;

/* ---- (patch scope opened) ---- */
const GUILD_COOLDOWN = 600000;

let launchingGuildOffer = null;
