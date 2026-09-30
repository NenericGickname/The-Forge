// ============ RUN / GAUNTLET ============
let run = null,
  timer = null,
  hCd = 0,
  lastArea = null;

let anim = { hero: { swing: 0, hurt: 0 }, t: 0 };

let particles = [];
let arrows = [];

const GY = 184;

const CRITLBL = ["", "CRIT", "SUPER CRIT", "MEGA CRIT", "ULTRA CRIT", "GODLIKE"];

const CRITCOL = ["", "#ffd24a", "#ff9a3c", "#ff6a2f", "#ff3b6a", "#ff2fd0"];
const CANVAS_LOGICAL_W = 560,
  CANVAS_LOGICAL_H = 220,
  CANVAS_RENDER_SCALE = 1.75;

const BOSSCOL = [
  "#7ec24a",
  "#7fd8ff",
  "#9aa0ad",
  "#b06bff",
  "#ff5a1e",
  "#2fa8c0",
  "#d6c6ff",
  "#c0402a",
  "#7b4fd0",
  "#8fd8ff",
  "#ff5a1e",
  "#b79fff"
];

// Local save + migration.
const SAVE_KEY = "theForge.v5.local";
let saveTimer = null;

// Visible forge level HUD, faster input response, celestial two-strike sequence at 7+.
let strikeLocked = false,
  celHitsDone = 0,
  celHitsNeeded = 1,
  celProf = null;

// Scaled permanent boons: flat stats grow with progression; percentage boons scale more gently.
const V5_BOONS = [
  {
    n: "Keen Edge",
    i: "🗡️",
    desc: m => "+" + Math.round(7 + 3 * Math.sqrt(m)) + "% Crit Damage",
    apply: (s, m) => (s.critDmg += Math.round(7 + 3 * Math.sqrt(m)))
  },
  {
    n: "Vigor",
    i: "❤️",
    desc: m => "+" + Math.round(55 * m) + " Health",
    apply: (s, m) => (s.hp += Math.round(55 * m))
  },
  {
    n: "Ironhide",
    i: "🛡️",
    desc: m => "+" + Math.round(32 * m) + " Health, +" + Math.round(5 * m) + " Defense",
    apply: (s, m) => {
      s.hp += Math.round(32 * m);
      s.def = (s.def || 0) + Math.round(5 * m);
    }
  },
  {
    n: "Bloodthirst",
    i: "🩸",
    desc: m => "+" + (0.55 + 0.25 * Math.sqrt(m)).toFixed(1) + " Lifesteal rating",
    apply: (s, m) => (s.lifesteal += 0.55 + 0.25 * Math.sqrt(m))
  },
  {
    n: "Swiftness",
    i: "💨",
    desc: m => "+" + Math.round(5 + 2 * Math.sqrt(m)) + "% Attack Speed",
    apply: (s, m) => (s.atkSpeed += Math.round(5 + 2 * Math.sqrt(m)))
  },
  {
    n: "Warlord",
    i: "👑",
    desc: m => "+" + Math.round(6 * m) + " Attack, +" + Math.round(3 + 1.3 * Math.sqrt(m)) + "% Crit",
    apply: (s, m) => {
      s.atk += Math.round(6 * m);
      s.critChance += Math.round(3 + 1.3 * Math.sqrt(m));
    }
  },
  {
    n: "Fortune",
    i: "🍀",
    desc: m =>
      "+" +
      Math.round(4 + 1.5 * Math.sqrt(m)) +
      " Loot rating, +" +
      Math.round(8 + 3 * Math.sqrt(m)) +
      "% Gold",
    apply: (s, m) => {
      s.lootChance = (s.lootChance || 0) + Math.round(4 + 1.5 * Math.sqrt(m));
      s.goldBoost = (s.goldBoost || 0) + Math.round(8 + 3 * Math.sqrt(m));
    }
  },
  {
    n: "Warding",
    i: "🌀",
    desc: m => "+" + Math.round(10 * m) + " Dodge rating",
    apply: (s, m) => (s.dodge = (s.dodge || 0) + Math.round(10 * m))
  }
];

const V6_TREES = {
  combat: {
    name: "⚔ Combat",
    col: "#ff6a5a",
    nodes: [
      { id: "c1", tier: 1, name: "Sharpened", d: "+12% Attack", max: 3 },
      { id: "c2", tier: 2, name: "Haste", d: "+7% Attack Speed", max: 3, req: ["c1"] },
      { id: "c3", tier: 3, name: "Deadly", d: "+5% Crit Chance", max: 3, req: ["c2"] },
      {
        id: "c4a",
        tier: 4,
        name: "Executioner",
        d: "+15% Crit Damage and +8% boss damage",
        max: 3,
        req: ["c3"],
        group: "combat4"
      },
      {
        id: "c4b",
        tier: 4,
        name: "Elementalist",
        d: "+20% Elemental damage",
        max: 3,
        req: ["c3"],
        group: "combat4"
      },
      {
        id: "c5a",
        tier: 5,
        name: "Precision",
        d: "+3% Crit Chance and +6% damage to wounded foes",
        max: 3,
        req: ["c4a"]
      },
      {
        id: "c5b",
        tier: 5,
        name: "Conduit",
        d: "+9% Attack Speed and +8% Elemental damage",
        max: 3,
        req: ["c4b"]
      },
      {
        id: "c6a",
        tier: 6,
        name: "Berserker",
        d: "+45% damage and 8% less damage taken below half HP",
        max: 2,
        req: ["c5a"],
        group: "combat6a"
      },
      {
        id: "c6b",
        tier: 6,
        name: "Blood Edge",
        d: "+2.2 Leech rating and a higher Leech cap",
        max: 2,
        req: ["c5a"],
        group: "combat6a"
      },
      {
        id: "c6c",
        tier: 6,
        name: "Overload",
        d: "+22% Crit Damage and elemental resistance pierce",
        max: 2,
        req: ["c5b"],
        group: "combat6b"
      },
      {
        id: "c6d",
        tier: 6,
        name: "Storm Hand",
        d: "+15% Attack Speed",
        max: 2,
        req: ["c5b"],
        group: "combat6b"
      }
    ]
  },
  loot: {
    name: "💰 Loot",
    col: "#5bd06a",
    nodes: [
      { id: "l1", tier: 1, name: "Fortune", d: "+12% drop chance", max: 3 },
      { id: "l2", tier: 2, name: "Prospector", d: "Better rarity rolls", max: 3, req: ["l1"] },
      { id: "l3", tier: 3, name: "Salvager", d: "+80% salvage shards", max: 2, req: ["l2"] },
      {
        id: "l4a",
        tier: 4,
        name: "Boss Plunder",
        d: "+1 boss loot bag",
        max: 2,
        req: ["l3"],
        group: "loot4"
      },
      { id: "l4b", tier: 4, name: "Golden Path", d: "+30% gold", max: 3, req: ["l3"], group: "loot4" },
      { id: "l5a", tier: 5, name: "Deep Pockets", d: "+8% drop chance", max: 3, req: ["l4a"] },
      { id: "l5b", tier: 5, name: "Scholar's Luck", d: "+10% XP", max: 3, req: ["l4b"] },
      { id: "l6a", tier: 6, name: "Trophy Hunter", d: "+1 boss bag", max: 1, req: ["l5a"], group: "loot6a" },
      { id: "l6b", tier: 6, name: "Rare Eye", d: "Extra rarity roll", max: 1, req: ["l5a"], group: "loot6a" },
      { id: "l6c", tier: 6, name: "Midas", d: "+45% gold", max: 1, req: ["l5b"], group: "loot6b" },
      { id: "l6d", tier: 6, name: "Insight", d: "+25% XP", max: 1, req: ["l5b"], group: "loot6b" }
    ]
  },
  heal: {
    name: "✚ Faith",
    col: "#7fe0a0",
    nodes: [
      { id: "h1", tier: 1, name: "Field Medic", d: "Unlock Heal", max: 1 },
      { id: "h2", tier: 2, name: "Greater Heal", d: "+12% heal power", max: 3, req: ["h1"] },
      { id: "h3", tier: 3, name: "Swift Grace", d: "+10 cooldown rating", max: 3, req: ["h2"] },
      {
        id: "h4a",
        tier: 4,
        name: "Lifedrinker",
        d: "Heal 1% max HP per kill",
        max: 2,
        req: ["h3"],
        group: "faith4"
      },
      { id: "h4b", tier: 4, name: "Sacred Armor", d: "+8% max HP", max: 3, req: ["h3"], group: "faith4" },
      { id: "h5a", tier: 5, name: "Crimson Grace", d: "+1.5 Leech rating", max: 3, req: ["h4a"] },
      { id: "h5b", tier: 5, name: "Sanctuary", d: "+10% total Defense", max: 3, req: ["h4b"] },
      {
        id: "h6a",
        tier: 6,
        name: "Feast",
        d: "Kills restore another 2% max HP",
        max: 1,
        req: ["h5a"],
        group: "faith6a"
      },
      {
        id: "h6b",
        tier: 6,
        name: "Sanguine",
        d: "+3 Leech rating and double the Leech cap",
        max: 1,
        req: ["h5a"],
        group: "faith6a"
      },
      {
        id: "h6c",
        tier: 6,
        name: "Bulwark",
        d: "+20% max HP and 10% less damage taken",
        max: 1,
        req: ["h5b"],
        group: "faith6b"
      },
      {
        id: "h6d",
        tier: 6,
        name: "Miracle",
        d: "+35 cooldown rating and +25% heal power",
        max: 1,
        req: ["h5b"],
        group: "faith6b"
      }
    ]
  },
  smith: {
    name: "⚒ Smith",
    col: "#ffcf5c",
    nodes: [
      { id: "s1", tier: 1, name: "Steady Hand", d: "+7% forge success", max: 3 },
      { id: "s2", tier: 2, name: "Efficient", d: "−15% forge cost", max: 2, req: ["s1"] },
      { id: "s8", tier: 3, name: "True Aim", d: "Wider forge zone", max: 3, req: ["s2"] },
      {
        id: "s4a",
        tier: 4,
        name: "Lucky Strike",
        d: "+4% critical success",
        max: 3,
        req: ["s8"],
        group: "smith4"
      },
      {
        id: "s4b",
        tier: 4,
        name: "Careful Temper",
        d: "−4% shatter risk",
        max: 3,
        req: ["s8"],
        group: "smith4"
      },
      { id: "s5a", tier: 5, name: "Reforger", d: "Extra reforge roll", max: 2, req: ["s4a"] },
      { id: "s5b", tier: 5, name: "Masterwork", d: "+25% new affix chance", max: 2, req: ["s4b"] },
      {
        id: "s6a",
        tier: 6,
        name: "Perfect Rhythm",
        d: "+5% critical success",
        max: 1,
        req: ["s5a"],
        group: "smith6a"
      },
      {
        id: "s6b",
        tier: 6,
        name: "Wide Silver",
        d: "Wider strike zones",
        max: 1,
        req: ["s5a"],
        group: "smith6a"
      },
      {
        id: "s6c",
        tier: 6,
        name: "Insured",
        d: "Items never shatter",
        max: 1,
        req: ["s5b"],
        group: "smith6b"
      },
      {
        id: "s6d",
        tier: 6,
        name: "Frugal Master",
        d: "−15% forge cost",
        max: 1,
        req: ["s5b"],
        group: "smith6b"
      }
    ]
  }
};

let forgeSnapshot = null;

const SKILL_ICONS = {
  c1: "🗡️",
  c2: "💨",
  c3: "🎯",
  c4a: "💥",
  c4b: "🔥",
  c5a: "✦",
  c5b: "⚡",
  c6a: "😡",
  c6b: "🩸",
  c6c: "💫",
  c6d: "🌩️",
  l1: "🍀",
  l2: "🔎",
  l3: "♻️",
  l4a: "🎁",
  l4b: "🪙",
  l5a: "🎒",
  l5b: "📖",
  l6a: "🏆",
  l6b: "💎",
  l6c: "👑",
  l6d: "🧠",
  h1: "✚",
  h2: "💚",
  h3: "⏱️",
  h4a: "🩸",
  h4b: "🛡️",
  h5a: "♥",
  h5b: "⛪",
  h6a: "🍷",
  h6b: "🫀",
  h6c: "🏰",
  h6d: "✨",
  s1: "🎯",
  s2: "🪙",
  s8: "👁️",
  s4a: "🍀",
  s4b: "🛡️",
  s5a: "🔄",
  s5b: "⭐",
  s6a: "🎵",
  s6b: "⭕",
  s6c: "🔒",
  s6d: "⚖️"
};

// ============ V7 ITEM VARIANTS / AREA THEMES ==========
const ITEM_VARIANTS = {
  sword: ["⚔️", "🗡️", "⚔️✦", "🗡️◆", "⚔️☄"],
  bow: ["🏹", "🏹✦", "🏹◆", "🏹☄", "🏹❖"],
  gloves: ["🧤", "🥊", "🧤✦", "🧤◆", "🧤❖"],
  boots: ["🥾", "👢", "🥾✦", "🥾◆", "👢❖"],
  amulet: ["📿", "💎", "🔮", "🧿", "💠"],
  armor: ["🛡️", "🥋", "🛡️✦", "🛡️◆", "🛡️❖"],
  helm: ["⛑️", "🪖", "👑", "⛑️✦", "🪖◆"]
};

// ============ V8 REFORGE ALIGNMENT ==========
const REFORGE_STAR_RADIUS = 76,
  REFORGE_HIT_WIDTH = 7;

let reforgeRadius = 22,
  reforgePhase = -Math.PI / 2,
  reforgeLast = 0,
  reforgeRaf = 0,
  reforgePending = null,
  reforgeLocked = false;

// ============ V9 CLEAN ITEM ART / DISTINCT AREA CREATURES ==========
const ITEM_ART_COLORS = ["#d7dde7", "#d7b66f", "#8fcde8", "#c89bea", "#ef9c72"];

const AREA_CREATURES = {
  brambleling: {
    n: "Brambleling",
    c: "#6faf4c",
    sz: 0.9,
    shape: "blob",
    hpM: 0.82,
    atkM: 0.9,
    defM: 0.65,
    res: { fire: -0.45, ice: 0, lightning: 0 },
    design: "bramble"
  },
  tunnelgnawer: {
    n: "Tunnel Gnawer",
    c: "#8c7256",
    sz: 0.82,
    shape: "beast",
    hpM: 0.68,
    atkM: 1.18,
    defM: 0.45,
    res: { fire: 0, ice: -0.2, lightning: 0 },
    design: "rat"
  },
  frostmite: {
    n: "Frost Mite",
    c: "#a7ddf2",
    sz: 0.78,
    shape: "beast",
    hpM: 0.7,
    atkM: 1.12,
    defM: 0.55,
    res: { fire: -0.25, ice: 0.45, lightning: -0.2 },
    design: "frostmite"
  },
  icebound: {
    n: "Icebound Marauder",
    c: "#6f91aa",
    sz: 1.08,
    shape: "biped",
    hpM: 1.18,
    atkM: 1.05,
    defM: 1.05,
    res: { fire: -0.25, ice: 0.5, lightning: 0 },
    design: "icebound"
  },
  granite: {
    n: "Granite Sentinel",
    c: "#898b91",
    sz: 1.15,
    shape: "block",
    hpM: 1.35,
    atkM: 0.92,
    defM: 1.65,
    res: { fire: 0, ice: 0.15, lightning: -0.4 },
    design: "granite"
  },
  rampart: {
    n: "Rampart Brute",
    c: "#7d6751",
    sz: 1.08,
    shape: "biped",
    hpM: 1.12,
    atkM: 1.12,
    defM: 1.2,
    res: { fire: 0, ice: 0, lightning: -0.2 },
    design: "rampart"
  },
  umbral: {
    n: "Umbral Shade",
    c: "#725091",
    sz: 0.98,
    shape: "ghost",
    hpM: 0.78,
    atkM: 1.35,
    defM: 0.5,
    res: { fire: -0.35, ice: 0, lightning: 0.3 },
    design: "umbral"
  },
  bonewarden: {
    n: "Bone Warden",
    c: "#d8d1bf",
    sz: 1.0,
    shape: "biped",
    hpM: 0.95,
    atkM: 1.02,
    defM: 0.9,
    res: { fire: 0, ice: 0.35, lightning: -0.35 },
    design: "bonewarden"
  },
  cinderimp: {
    n: "Cinder Imp",
    c: "#db5a32",
    sz: 0.78,
    shape: "biped",
    hpM: 0.62,
    atkM: 1.35,
    defM: 0.48,
    res: { fire: 0.55, ice: -0.45, lightning: 0 },
    design: "cinderimp"
  },
  magmahound: {
    n: "Magma Hound",
    c: "#a83d28",
    sz: 1.02,
    shape: "beast",
    hpM: 1.08,
    atkM: 1.18,
    defM: 0.8,
    res: { fire: 0.6, ice: -0.5, lightning: 0 },
    design: "magmahound"
  },
  reefstalker: {
    n: "Reef Stalker",
    c: "#3daaa7",
    sz: 1.02,
    shape: "beast",
    hpM: 1.18,
    atkM: 0.92,
    defM: 1.05,
    res: { fire: 0.15, ice: 0, lightning: -0.45 },
    design: "reefstalker"
  },
  drowned: {
    n: "Drowned Mariner",
    c: "#4d8790",
    sz: 1.02,
    shape: "biped",
    hpM: 1.05,
    atkM: 1.05,
    defM: 0.85,
    res: { fire: 0, ice: 0.25, lightning: -0.35 },
    design: "drowned"
  },
  gravewing: {
    n: "Gravewing",
    c: "#70637e",
    sz: 0.88,
    shape: "beast",
    hpM: 0.58,
    atkM: 1.45,
    defM: 0.42,
    res: { fire: -0.35, ice: 0, lightning: 0.2 },
    design: "gravewing"
  },
  mourner: {
    n: "Mourning Spirit",
    c: "#a9b9b0",
    sz: 1.05,
    shape: "ghost",
    hpM: 0.9,
    atkM: 1.22,
    defM: 0.58,
    res: { fire: -0.4, ice: 0.1, lightning: 0.25 },
    design: "mourner"
  },
  drakekin: {
    n: "Drakekin",
    c: "#a75635",
    sz: 1.03,
    shape: "beast",
    hpM: 1.08,
    atkM: 1.16,
    defM: 0.92,
    res: { fire: 0.35, ice: -0.35, lightning: -0.1 },
    design: "drakekin"
  },
  emberwing: {
    n: "Emberwing",
    c: "#cf6336",
    sz: 0.94,
    shape: "beast",
    hpM: 0.72,
    atkM: 1.42,
    defM: 0.52,
    res: { fire: 0.55, ice: -0.5, lightning: -0.15 },
    design: "emberwing"
  },
  voidling: {
    n: "Voidling",
    c: "#68449a",
    sz: 0.96,
    shape: "blob",
    hpM: 1.05,
    atkM: 1.12,
    defM: 0.7,
    res: { fire: -0.1, ice: 0.15, lightning: 0.25 },
    design: "voidling"
  },
  abyssaleye: {
    n: "Abyssal Eye",
    c: "#9b5bc3",
    sz: 0.92,
    shape: "beast",
    hpM: 0.76,
    atkM: 1.48,
    defM: 0.5,
    res: { fire: -0.25, ice: 0, lightning: 0.35 },
    design: "abyssaleye"
  },
  rimeknight: {
    n: "Rime Knight",
    c: "#91b8cf",
    sz: 1.1,
    shape: "biped",
    hpM: 1.25,
    atkM: 1.08,
    defM: 1.35,
    res: { fire: -0.35, ice: 0.55, lightning: 0 },
    design: "rimeknight"
  },
  snowstalker: {
    n: "Snow Stalker",
    c: "#d6e8ed",
    sz: 1.0,
    shape: "beast",
    hpM: 0.88,
    atkM: 1.3,
    defM: 0.68,
    res: { fire: -0.25, ice: 0.45, lightning: -0.1 },
    design: "snowstalker"
  },
  hellspawn: {
    n: "Hellspawn",
    c: "#b93827",
    sz: 1.04,
    shape: "biped",
    hpM: 1.02,
    atkM: 1.28,
    defM: 0.82,
    res: { fire: 0.65, ice: -0.5, lightning: -0.15 },
    design: "hellspawn"
  },
  chainbrute: {
    n: "Chain Brute",
    c: "#74392e",
    sz: 1.18,
    shape: "block",
    hpM: 1.4,
    atkM: 1.15,
    defM: 1.2,
    res: { fire: 0.4, ice: -0.35, lightning: 0 },
    design: "chainbrute"
  },
  starborn: {
    n: "Starborn",
    c: "#b8a7ea",
    sz: 1.0,
    shape: "biped",
    hpM: 0.92,
    atkM: 1.28,
    defM: 0.78,
    res: { fire: 0, ice: 0, lightning: 0.25 },
    design: "starborn"
  },
  astralseer: {
    n: "Astral Seer",
    c: "#8069bc",
    sz: 1.04,
    shape: "ghost",
    hpM: 0.86,
    atkM: 1.38,
    defM: 0.68,
    res: { fire: -0.1, ice: 0.1, lightning: 0.35 },
    design: "astralseer"
  }
};

let deathParticleColor = null;

let forgeContinue = null;

// ============ V15 AUTO SALVAGE ============
const AUTO_SALVAGE = [
  { name: "Common", col: "#d7dde7" },
  { name: "Uncommon", col: "#5bd06a" },
  { name: "Rare", col: "#4aa3ff" },
  { name: "Epic", col: "#c46bff" },
  { name: "Legendary", col: "#ff9a3c" }
];

const weaponSlot = SLOTS.find(s => s.key === "weapon");

const PLAYTEST_CODE_HASHES = {
  early: "10psbu0fr3d",
  mid: "2bx5wjydu58",
  late: "4nefi3k0uj",
  superlate: "8h49vugxb5"
};

// ============ V19 PORTABLE SAVE FILES ============
const PORTABLE_SAVE_FORMAT = "the-forge-portable-save",
  PORTABLE_SAVE_VERSION = 1,
  PORTABLE_SAVE_MAX_BYTES = 2 * 1024 * 1024;

// ============ V22 COMPACT SHOP AND TIMED INSIGHT BUFF ============
const XP_BUFF_DURATION = 300000;

// ============ V23 ROCK SHOPKEEPER ============
const ROCK_KEEPER_LINES = [
  "Welcome back. The anvil missed you more than I did.",
  "Lol. You are going to fail that Celestial upgrade anyway.",
  "Damn, you really are burning through those shards.",
  "Have you tried Boss Rush already? The bosses miss you.",
  "Psst. Weapon effects change when they reach Celestial level 5.",
  "Hit the golden bar. It is the golden one.",
  "Silver is acceptable. Gold is less embarrassing.",
  "Miss the forge zones and your item may become a cautionary tale.",
  "Plus 20 gear. Because stopping at plus 19 would be sensible.",
  "Celestial upgrades eat epic shards like I eat absolutely nothing.",
  "Epic shards are regular shards with a superiority complex.",
  "One hundred blue shards become one epic shard. Economics is beautiful.",
  "Reforging is gambling, but with ten stars and better music.",
  "Space confirms the reforge. Enter has been relieved of duty.",
  "A star beside a stat means the roll is perfect. Try not to scream.",
  "Lock good loot before auto salvage develops initiative.",
  "Auto salvage is efficient right up until you forget what you selected.",
  "Salvage loot for blue shards. Monsters do not carry convenient shard bags.",
  "High level items salvage for more. Finally, trash with value.",
  "A high level common can beat an ancient legendary. Age is not everything.",
  "Legendary gear has more affixes and considerably more confidence.",
  "Bloodforged gear only appears when a legendary gets extremely dramatic.",
  "Bloodforged weapons exist too. The amulet does not own the franchise.",
  "Daggers attack quickly because patience is not a stat.",
  "Swords hit hardest and ask questions never.",
  "Bows trade some damage for crits and personal space.",
  "Bleed likes swords. Daggers occasionally sneak it past security.",
  "Poison belongs on bows and daggers. Please label your beverages.",
  "Burn can roll on every weapon. Fire believes in equal opportunity.",
  "Frost stacks slow attacks. Even bosses eventually need a blanket.",
  "Doom is the purple bar politely informing enemies that they are finished.",
  "Ten frost stacks can freeze an enemy. Their complaint is still processing.",
  "Ten permanent burn stacks trigger Combust. Subtlety was rejected.",
  "Disease makes poison tick faster and spread on death. Very hygienic.",
  "Demise makes doomed enemies easier to crit. Doom enjoys teamwork.",
  "Bloodthirst heals from bleed explosions. It has been told to calm down.",
  "Celestial level 5 is where weapon effects start showing off.",
  "Enrage above fifty percent adds duration. More rage, longer tantrum.",
  "A critical hit can roll another critical hit. Violence has layers.",
  "Super crits are crits that found better branding.",
  "Mega crits are why damage numbers need more room.",
  "Ultra crits are rare. Unlike your confidence.",
  "The Abyss does less damage now. It still dislikes you personally.",
  "The End? has a question mark because certainty is expensive.",
  "Twenty five rooms await in The End? Bring snacks and absurd gear.",
  "Every fifth room in The End? has an elite. Rest was considered and denied.",
  "The final boss expects plus 20 and Celestial plus 8. Casual attire is discouraged.",
  "Elites drop better loot. They also object strongly to being farmed.",
  "Shamans heal their allies. Rude, but technically impressive.",
  "The poison frog can ruin your day for fifteen seconds after combat.",
  "Thornbacks bristle now and then. Whatever you swing, it stings while they glow.",
  "Enemies can crit too. Fairness was a terrible design choice.",
  "Later areas raise enemy crit chance. The monsters read the patch notes.",
  "Every boss has a fifty percent chance to drop a Boss Rush token.",
  "Elites can drop Boss Rush tokens too. Very occasionally. Do not stare at them.",
  "Boss Rush costs ten tokens. Entry fees survive every apocalypse.",
  "Boss Rush pays epic shards and gold. Assuming you keep winning.",
  "You can leave Boss Rush after five or ten bosses. Pride may object.",
  "Boss Rush scales after every kill. It noticed you were having fun.",
  "Boss Rush loot leans toward epic and legendary. Leaning is not a promise.",
  "Beat the Sunken Ruins and Boss Rush unlocks. The skull economy begins.",
  "Clear more areas and more bosses join Boss Rush. Networking is important.",
  "Each area drops a range of item levels. Maximum rolls enjoy hiding.",
  "Higher item levels are rarer. The loot table enjoys suspense.",
  "Regular mobs carry more gold now. Bosses were becoming insufferably wealthy.",
  "Farm the hardest area you can nearly clear. Dying is poor income.",
  "A finished stage is worth more than an ambitious funeral.",
  "The Tome of Insight doubles experience for five minutes.",
  "Buying another Tome adds another five minutes. Reading remains optional.",
  "Skill tree resets work again. Your questionable decisions are reversible.",
  "The skill tree branches because commitment should be stressful.",
  "Final skills unlock at level 15. No, glaring at them does not help.",
  "Flat defense ages badly. Percentage bonuses age like expensive stone.",
  "Pick a branch that supports your build, not the prettiest symbol.",
  "Life steal is weaker in The End? The boss filed a complaint.",
  "Burn also lowers enemy attack damage slightly. Fire can be supportive.",
  "Poison may linger after a stage. The frog considers this customer service.",
  "Freeze has a fixed cooldown. Cooldown reduction has been asked to leave.",
  "Item level matters. Rarity just shouts louder.",
  "A legendary level 5 should fear a common level 20.",
  "Celestial upgrades do not add an affix every level. That would be ridiculous.",
  "A failed Celestial attempt leaves the window open for your next mistake.",
  "Reforging a bow into a sword is forbidden now. Reality has rules again.",
  "A dagger remains a dagger after reforging. Deeply reassuring.",
  "Auto salvaging legendary gear is a lifestyle choice I will judge silently.",
  "Boss particles match the boss now. Death can have art direction.",
  "Special monsters have charge bars. Interrupting them is encouraged.",
  "Special monsters cast early because you kept killing them too quickly.",
  "Special monsters have extra health now. They wanted screen time.",
  "An elite should not be stronger than the boss. Management has spoken.",
  "The final boss is beatable. Your build may be less cooperative.",
  "Boss tokens get an animation because apparently currency needs an entrance.",
  "This shop is run by a rock. Lower your expectations responsibly.",
  "Inventory full again? Bag expansion is cheaper than emotional growth.",
  "A larger bag creates more room for items you will never equip.",
  "Gear Set Two means twice the builds and four times the indecision.",
  "Export your save before testing reality with developer mode.",
  "Early, middle, and end game presets exist because grinding is poor quality assurance.",
  "The playtest codes are safe with me. I cannot operate a keyboard.",
  "Come back soon. I will be exactly here."
];

const ROCK_KEEPER_POKE_LINES = [
  "Can you stop tickling me?",
  "That is not the Shop button.",
  "I am a boulder, not bubble wrap.",
  "One more click and your next reforge misses.",
  "Do I look like loot?",
  "Every click costs one imaginary shard.",
  "If you crack me, you are buying the whole shop.",
  "Fine. Click again. Maybe I drop a Boss Rush token.",
  "The monsters show me more respect than this.",
  "I will tell the Celestial forge what you did.",
  "My eyes are up here. They are also part of the rock.",
  "You have discovered my secret weakness. Mild annoyance."
];

let rockKeeperLast = -1,
  rockKeeperLastPoke = -1,
  rockKeeperTimer = null,
  rockKeeperTalkTimer = null,
  rockKeeperClicks = 0,
  rockKeeperClickTimer = null;
