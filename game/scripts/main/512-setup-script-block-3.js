/* ================= script block 3 ================= */

window.__forgeV7Boot = "v72-starting";

if ($("compendiumbtn"))
  $("compendiumbtn").addEventListener("click", () =>
    setTimeout(() => {
      setupCompendiumTabsV72();
      decorateArchiveV73();
    }, 40)
  );
moveNavigationV72();
setupStatsV72();
renderTown();
window.__forgeV7Boot = "ready";
window.forgeV72 = {
  moveNavigation: moveNavigationV72,
  contractMarks: contractMarksV72,
  setupStats: setupStatsV72,
  setupCompendiumTabs: setupCompendiumTabsV72,
  decorateArchive: decorateArchiveV73
};

/* ================= script block 4 ================= */

window.__forgeV7Boot = "v74 starting";

q_v7(
  "forge1",
  "Forge",
  "⚒",
  "Better, Faster, Stronger",
  "Complete your first successful equipment upgrade.",
  1,
  "maxPlus",
  1
);
q_v7(
  "forge10",
  "Forge",
  "⚒",
  "Serious Strength",
  "Upgrade any item to level 10.",
  3,
  "maxPlus",
  10,
  "forge1"
);
q_v7(
  "forge15",
  "Forge",
  "✨",
  "Does This Glow?",
  "Upgrade any item to level 15.",
  4,
  "maxPlus",
  15,
  "forge10"
);
q_v7(
  "forge20",
  "Forge",
  "🌠",
  "Reach for the Stars",
  "Upgrade any item to level 20.",
  6,
  "maxPlus",
  20,
  "forge15"
);
q_v7("cel10", "Forge", "✦", "And Beyond", "Upgrade any item to Celestial 10.", 10, "maxCel", 10, "forge20");
q_v7(
  "mythic13",
  "Forge",
  "✺",
  "Maxing Out",
  "Upgrade a Mythic item to Celestial 13.",
  15,
  "maxMythicCel",
  13,
  "cel10",
  true
);

q_v7("setfull", "Equipment", "🧥", "Dressed for Adventure", "Fill every equipment slot.", 2, "setSlots", 6);
q_v7(
  "set5",
  "Equipment",
  "🛡",
  "A Matching Temper",
  "Equip a complete set at level 5 or higher.",
  3,
  "setPlus",
  5,
  "setfull"
);
q_v7(
  "set10",
  "Equipment",
  "🛡",
  "Battle Ready",
  "Equip a complete set at level 10 or higher.",
  6,
  "setPlus",
  10,
  "set5"
);
q_v7(
  "set15",
  "Equipment",
  "🛡",
  "No Weak Links",
  "Equip a complete set at level 15 or higher.",
  8,
  "setPlus",
  15,
  "set10"
);
q_v7(
  "set20",
  "Equipment",
  "🛡",
  "Fully Tempered",
  "Equip a complete set at level 20.",
  12,
  "setPlus",
  20,
  "set15"
);
q_v7(
  "setcel10",
  "Equipment",
  "✦",
  "Heaven Clad",
  "Equip a complete set at Celestial 10.",
  20,
  "setCel",
  10,
  "set20"
);
q_v7(
  "setmythic",
  "Equipment",
  "✺",
  "A Mythic Wardrobe",
  "Equip Mythic gear in every nonweapon slot.",
  20,
  "mythicArmor",
  5,
  null,
  true
);

q_v7(
  "campaign2",
  "Campaign",
  "🧊",
  "The Road Begins",
  "Defeat the Ice Troll and clear Frost Caverns.",
  2,
  "campaign",
  1
);
q_v7(
  "campaign4",
  "Campaign",
  "🌑",
  "A Kingdom in Pieces",
  "Defeat The Lich and clear Shadow Keep.",
  4,
  "campaign",
  3,
  "campaign2"
);
q_v7(
  "campaign6",
  "Campaign",
  "🌊",
  "Into the Deep",
  "Defeat Leviathan and clear Sunken Ruins.",
  5,
  "campaign",
  5,
  "campaign4"
);
q_v7(
  "campaign9",
  "Campaign",
  "🕳",
  "Past the Point of No Return",
  "Defeat the Void Titan and clear The Abyss.",
  7,
  "campaign",
  8,
  "campaign6"
);
q_v7(
  "campaign12",
  "Campaign",
  "🌌",
  "Master of the Mortal Realm",
  "Defeat The Architect and clear Astral Spire.",
  10,
  "campaign",
  11,
  "campaign9"
);
q_v7(
  "campaign13",
  "Campaign",
  "❔",
  "One Last Question",
  "Defeat The Last Question.",
  12,
  "campaign",
  12,
  "campaign12"
);
q_v7(
  "campaign15",
  "Campaign",
  "β",
  "Heaven Takes Notice",
  "Defeat Celestial Beta.",
  16,
  "campaign",
  14,
  "campaign13"
);
q_v7("campaign17", "Campaign", "Ω", "The Final Letter", "Defeat OMEGA.", 22, "campaign", 16, "campaign15");

q_v7(
  "abyss1",
  "Abyss",
  "🌀",
  "Something Broke",
  "Enter the Abyss for the first time.",
  3,
  "abyssEntered",
  1,
  null,
  true
);
q_v7(
  "abyss3",
  "Abyss",
  "🌀",
  "A Familiar Nightmare",
  "Defeat the third Abyss boss.",
  6,
  "abyssCampaign",
  2,
  "abyss1",
  true
);
q_v7(
  "abyss6",
  "Abyss",
  "🌊",
  "No Way Back",
  "Defeat the Abyss Leviathan.",
  9,
  "abyssCampaign",
  5,
  "abyss3",
  true
);
q_v7(
  "abyss9",
  "Abyss",
  "🕳",
  "Halfway into Darkness",
  "Defeat the Abyss Void Titan.",
  12,
  "abyssCampaign",
  8,
  "abyss6",
  true
);
q_v7(
  "abyss13",
  "Abyss",
  "❔",
  "The Corrupted End",
  "Defeat The Last Question in the Abyss.",
  17,
  "abyssCampaign",
  12,
  "abyss9",
  true
);
q_v7(
  "abyss15",
  "Abyss",
  "γ",
  "Above the Gods",
  "Defeat Abyss Gamma.",
  22,
  "abyssCampaign",
  15,
  "abyss13",
  true
);
q_v7(
  "abyss17",
  "Abyss",
  "Ω",
  "Perfectly Impossible",
  "Defeat Abyss OMEGA.",
  35,
  "abyssCampaign",
  16,
  "abyss15",
  true
);

q_v7(
  "bloodfound",
  "Hidden",
  "🩸",
  "It Remembers",
  "Discover your first Bloodforged item.",
  5,
  "bloodSeen",
  1,
  null,
  true
);
q_v7(
  "blood100",
  "Hidden",
  "♥",
  "Feed the Forge",
  "Earn 100 kills with one Bloodforged item.",
  5,
  "bloodKills",
  100,
  "bloodfound",
  true
);
q_v7(
  "bloodfull",
  "Hidden",
  "♥",
  "Blood and Steel",
  "Completely fill a Bloodforged item’s growth capacity.",
  12,
  "bloodFull",
  1,
  "blood100",
  true
);
q_v7(
  "blood1000",
  "Hidden",
  "🩸",
  "Bloodbound",
  "Earn 1,000 kills with one fully grown Bloodforged item.",
  18,
  "bloodFullKills",
  1000,
  "bloodfull",
  true
);
q_v7(
  "blood10000",
  "Hidden",
  "🩸",
  "Insatiable",
  "Earn 10,000 kills with one fully grown Bloodforged item.",
  35,
  "bloodFullKills",
  10000,
  "blood1000",
  true
);
q_v7(
  "dummy1",
  "Hidden",
  "🎯",
  "Wait, that wasn't intended",
  "Destroy the Training Dummy once.",
  5,
  "dummyKills",
  1,
  null,
  true
);
q_v7(
  "dummy10",
  "Hidden",
  "🎯",
  "AM I A JOKE TO YOU?",
  "Destroy the Training Dummy ten times.",
  15,
  "dummyKills",
  10,
  "dummy1",
  true
);

q_v7(
  "legacy100",
  "Equipment",
  "📜",
  "Getting Attached",
  "Earn 100 kills with the same equipped item.",
  4,
  "itemKills",
  100
);
q_v7(
  "legacyboss25",
  "Equipment",
  "📜",
  "Battle Scarred",
  "Defeat 25 bosses with the same equipped item.",
  6,
  "itemBosses",
  25,
  "legacy100"
);
q_v7(
  "legacyvictory5",
  "Equipment",
  "📜",
  "A Storied Weapon",
  "Record five different boss victories on one item.",
  8,
  "itemVictories",
  5,
  "legacyboss25"
);
q_v7(
  "legacyend",
  "Equipment",
  "❔",
  "Witness to the End",
  "Defeat The Last Question with an awakened item equipped.",
  10,
  "legacyEnd",
  1,
  "legacyvictory5"
);
q_v7(
  "legacyomega1000",
  "Equipment",
  "Ω",
  "Carried into Eternity",
  "Defeat OMEGA with an item that has at least 1,000 kills.",
  20,
  "legacyOmega1000",
  1,
  "legacyend"
);
q_v7(
  "legacy10000",
  "Equipment",
  "📜",
  "Eternal Companion",
  "Earn 10,000 kills with the same item.",
  40,
  "itemKills",
  10000,
  "legacyomega1000"
);

q_v7(
  "contract1",
  "Guild",
  "⚔",
  "Terms and Conditions",
  "Complete your first Guild contract.",
  2,
  "contractTotal",
  1
);
q_v7(
  "contracttypes",
  "Guild",
  "⚔",
  "Reliable Mercenary",
  "Complete every standard contract type at least once.",
  5,
  "contractTypes",
  4,
  "contract1"
);
q_v7(
  "contractarea",
  "Guild",
  "⚔",
  "Master of One Battlefield",
  "Complete all four standard contracts in one area.",
  7,
  "contractArea",
  4,
  "contracttypes"
);
q_v7(
  "masterycontract1",
  "Guild",
  "♛",
  "Nothing Left to Prove",
  "Complete your first Mastery Contract.",
  10,
  "masteryContracts",
  1,
  "contractarea"
);
q_v7(
  "masterycontract5",
  "Guild",
  "♛",
  "Professional Hazard",
  "Complete five Mastery Contracts in different areas.",
  15,
  "masteryContracts",
  5,
  "masterycontract1"
);
q_v7(
  "guildlegend",
  "Guild",
  "♛",
  "Guild Legend",
  "Complete a Mastery Contract in every regular area.",
  30,
  "regularMasteries",
  17,
  "masterycontract5"
);
q_v7(
  "abyssguild1",
  "Guild",
  "🌀",
  "The Guild Goes Deeper",
  "Complete your first Abyss Mastery Contract.",
  12,
  "abyssMasteries",
  1,
  null,
  true
);
q_v7(
  "abyssguild5",
  "Guild",
  "🌀",
  "Master of the Abyss",
  "Complete five Abyss Mastery Contracts.",
  22,
  "abyssMasteries",
  5,
  "abyssguild1",
  true
);

q_v7("bronze1", "Mastery", "◆", "A Second Visit", "Earn Bronze mastery in any area.", 3, "bronzeAreas", 1);
q_v7(
  "bronze5",
  "Mastery",
  "◆",
  "Local Knowledge",
  "Earn Bronze mastery in five areas.",
  6,
  "bronzeAreas",
  5,
  "bronze1"
);
q_v7(
  "silver1",
  "Mastery",
  "◇",
  "Seasoned Explorer",
  "Earn Silver mastery in any area.",
  6,
  "silverAreas",
  1,
  "bronze1"
);
q_v7(
  "silver5",
  "Mastery",
  "◇",
  "Cartographer",
  "Earn Silver mastery in five areas.",
  10,
  "silverAreas",
  5,
  "silver1"
);
q_v7(
  "bronzeall",
  "Mastery",
  "◆",
  "Nothing Left Unexplored",
  "Earn Bronze mastery in every regular area.",
  18,
  "bronzeAreas",
  17,
  "bronze5"
);
q_v7(
  "gold1",
  "Mastery",
  "✦",
  "This Place Again?",
  "Earn Gold mastery in any area.",
  12,
  "goldAreas",
  1,
  "silver1"
);
q_v7(
  "goldall",
  "Mastery",
  "✦",
  "Master of Every Road",
  "Earn Gold mastery in every regular area.",
  35,
  "goldAreas",
  17,
  "gold1"
);

q_v7("rare", "Discovery", "🔵", "Something Rare", "Find your first Rare item.", 1, "rarity", 2);
q_v7("epic", "Discovery", "🟣", "An Epic Discovery", "Find your first Epic item.", 2, "rarity", 3, "rare");
q_v7(
  "legendary",
  "Discovery",
  "🟠",
  "The Stuff of Legends",
  "Find your first Legendary item.",
  4,
  "rarity",
  4,
  "epic"
);
q_v7(
  "mythic",
  "Discovery",
  "✺",
  "Beyond Legendary",
  "Find your first Mythic item.",
  10,
  "rarity",
  5,
  "legendary",
  true
);
q_v7(
  "mythic3",
  "Discovery",
  "✺",
  "Mythic Researcher",
  "Discover three different Mythic effects.",
  8,
  "mythicEffects",
  3,
  "mythic",
  true
);
q_v7(
  "mythichalf",
  "Discovery",
  "✺",
  "Forbidden Collection",
  "Discover half of all Mythic effects.",
  15,
  "mythicHalf",
  1,
  "mythic3",
  true
);
q_v7(
  "mythicall",
  "Discovery",
  "✺",
  "Nothing Remains Hidden",
  "Discover every Mythic effect.",
  30,
  "mythicAll",
  1,
  "mythichalf",
  true
);
q_v7(
  "research1",
  "Discovery",
  "♛",
  "Know Your Enemy",
  "Fully research one creature or boss.",
  3,
  "research",
  1
);
q_v7(
  "research10",
  "Discovery",
  "♛",
  "Field Researcher",
  "Fully research ten creatures or bosses.",
  8,
  "research",
  10,
  "research1"
);
q_v7(
  "researchall",
  "Discovery",
  "♛",
  "Complete Bestiary",
  "Fully research every creature and boss.",
  25,
  "researchAll",
  1,
  "research10"
);

q_v7(
  "rushenter",
  "Challenges",
  "🏆",
  "A Conveniently Long Hallway",
  "Enter Boss Rush for the first time.",
  2,
  "rushEntered",
  1
);
q_v7(
  "rushfive",
  "Challenges",
  "🏆",
  "No Time to Rest",
  "Defeat five bosses in one Boss Rush.",
  5,
  "rushBest",
  5,
  "rushenter"
);
q_v7(
  "rushcomplete",
  "Challenges",
  "🏆",
  "The Whole Council",
  "Complete a regular Boss Rush.",
  12,
  "rushComplete",
  1,
  "rushfive"
);
q_v7(
  "abyssrushenter",
  "Challenges",
  "🌀",
  "Rush into Darkness",
  "Enter Abyss Boss Rush.",
  6,
  "abyssRushEntered",
  1,
  null,
  true
);
q_v7(
  "abyssrushten",
  "Challenges",
  "🌀",
  "One after Another",
  "Defeat ten bosses in one Abyss Boss Rush.",
  12,
  "abyssRushBest",
  10,
  "abyssrushenter",
  true
);
q_v7(
  "abyssrushcomplete",
  "Challenges",
  "Ω",
  "There Can Be Only One",
  "Complete the entire Abyss Boss Rush.",
  35,
  "abyssRushComplete",
  1,
  "abyssrushten",
  true
);

[
  [100, "First Blood", 1],
  [1000, "Crowd Control", 3],
  [10000, "One Knight Army", 7],
  [100000, "A Mountain of Foes", 15],
  [1000000, "The Millionth", 35]
].forEach((x, i) =>
  q_v7(
    "kills" + x[0],
    "Records",
    "⚔",
    x[1],
    "Defeat " + fmt(x[0]) + " foes in total.",
    x[2],
    "kills",
    x[0],
    i ? "kills" + [100, 1000, 10000, 100000][i - 1] : null
  )
);
[
  [10, "Boss Breaker", 2],
  [50, "Crown Collector", 5],
  [250, "Kingslayer", 10],
  [1000, "Ender of Legends", 25]
].forEach((x, i) =>
  q_v7(
    "bosses" + x[0],
    "Records",
    "♛",
    x[1],
    "Defeat " + fmt(x[0]) + " bosses in total.",
    x[2],
    "bosses",
    x[0],
    i ? "bosses" + [10, 50, 250][i - 1] : null
  )
);
[
  [25, "Elite Company", 3],
  [100, "Above Average", 6],
  [500, "Elite Exterminator", 12],
  [2500, "None Left Standing", 25]
].forEach((x, i) =>
  q_v7(
    "elites" + x[0],
    "Records",
    "◆",
    x[1],
    "Defeat " + fmt(x[0]) + " Elites in total.",
    x[2],
    "elites",
    x[0],
    i ? "elites" + [25, 100, 500][i - 1] : null
  )
);
[
  [1, "Something Worse", 3],
  [10, "Superiority Complex", 6],
  [50, "Super Elite Hunter", 12],
  [250, "The Very Best", 25]
].forEach((x, i) =>
  q_v7(
    "super" + x[0],
    "Records",
    "✦",
    x[1],
    "Defeat " + fmt(x[0]) + " Super Elites in total.",
    x[2],
    "superElites",
    x[0],
    i ? "super" + [1, 10, 50][i - 1] : null
  )
);
[
  [10000, "A Heavy Purse", 2],
  [100000, "Small Fortune", 4],
  [1000000, "Millionaire", 8],
  [10000000, "Dragon Hoard", 15],
  [100000000, "Golden Empire", 30]
].forEach((x, i) =>
  q_v7(
    "gold" + x[0],
    "Records",
    "🪙",
    x[1],
    "Collect " + fmt(x[0]) + " gold in total.",
    x[2],
    "goldCollected",
    x[0],
    i ? "gold" + [10000, 100000, 1000000, 10000000][i - 1] : null
  )
);
[
  [100000, "Leave a Mark", 2],
  [10000000, "War Machine", 6],
  [1000000000, "Cataclysm", 15],
  [100000000000, "Uncountable Violence", 35]
].forEach((x, i) =>
  q_v7(
    "damage" + x[0],
    "Records",
    "💥",
    x[1],
    "Deal " + fmt(x[0]) + " total damage.",
    x[2],
    "damage",
    x[0],
    i ? "damage" + [100000, 10000000, 1000000000][i - 1] : null
  )
);
[
  [1000, "That Had to Hurt", 2],
  [100000, "A Decisive Blow", 6],
  [10000000, "Worldbreaker", 15],
  [1000000000, "Delete Button", 35]
].forEach((x, i) =>
  q_v7(
    "hit" + x[0],
    "Records",
    "🎯",
    x[1],
    "Deal " + fmt(x[0]) + " damage in a single hit.",
    x[2],
    "highestHit",
    x[0],
    i ? "hit" + [1000, 100000, 10000000][i - 1] : null
  )
);
QV74.forEach(x => (x.gold = Math.max(0, Number(QUEST_GOLD[x.id]) || 0)));
document.addEventListener(
  "keydown",
  e => {
    if (e.key !== "Escape") return;
    const menu = $("questsv74");
    if (menu && menu.classList.contains("on")) {
      menu.classList.remove("on");
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true
);

/* ==== addToBag ==== */
/* ==== addToBag ==== */
/* ==== addToBag ==== */
/* ==== addToBag ==== */
/* ==== addToBag ==== */
/* ==== addToBag ==== */
const addToBagBase = addToBag;
addToBag = function (g) {
  ensureHistory(g);
  const firstMythic = !!(g && g.rar === 5 && !S.flags.firstMythicGuideV70);
  if (g) g._rawDeltaV70 = rawDelta(g);
  let prevResult96;
  prev96: {
    const first = !!(g && g.rar === 5 && !(S.flags && S.flags.mythicUpgradeGuideV41));
    if (first) {
      S.flags = S.flags || {};
      S.flags.mythicUpgradeGuideV41 = true;
      scheduleSave();
    }
    const result = addToBagBase(g);
    if (first)
      setTimeout(
        () =>
          showTip(
            "YOUR FIRST MYTHIC ITEM",
            '<b style="color:var(--mythic)">Mythic equipment uses a different forge path.</b><br><br>Upgrades below +10 cost substantial gold, blue shards, and epic shards. From +10 onward, Celestial shards are also required. At +20 the item can enter the Celestial Forge.'
          ),
        420
      );
    prevResult96 = result;
    break prev96;
  }
  const result = prevResult96;
  const newEffect = !!(result && result.kept && discoverMythic(g));
  if (firstMythic && result && result.kept) {
    S.flags.firstMythicGuideV70 = true;
    scheduleSave();
    setTimeout(
      () =>
        showTip(
          "YOUR FIRST MYTHIC",
          "<b>Mythic armor</b> is the rarest equipment tier. It begins beyond The End and each piece carries a unique Mythic effect.<br><br>Mythics use <b>Celestial Shards ✺</b> for normal upgrades, can be Celestial-forged, and may be Bloodforged. Open the <b>Compendium</b> to see this effect; other powers remain hidden until you find them yourself."
        ),
      260
    );
  } else if (newEffect && S.flags.firstMythicGuideV70)
    setTimeout(() => {
      try {
        flash("#2ce8d5");
      } catch (e) {}
    }, 40);
  return result;
};
const addBagBase = addToBag;
addToBag = function (g) {
  const result = addBagBase(g);
  if (g) {
    const st = ensureQuestState().stats;
    st.rarity = Math.max(st.rarity, Number(g.rar) || 0);
    if (g.growth) st.bloodSeen = 1;
    setTimeout(() => evaluateQuests(false), 40);
  }
  return result;
};

const hitBase = window.heroHitShakeV67;
window.heroHitShakeV67 = function (dmg, tier) {
  const n = Math.max(0, Number(dmg) || 0),
    st = ensureQuestState().stats;
  st.highestHit = Math.max(st.highestHit, Math.round(n));
  const result = hitBase && hitBase(dmg, tier);
  setTimeout(() => evaluateQuests(false), 20);
  return result;
};
const floatDmgBase = floatDmg;
floatDmg = function (side, val, tier, color, x) {
  const b = $("battle"),
    before = b ? b.querySelectorAll(".dmg").length : 0;
  let prevResult97;
  prev97: {
    if (side === "foe") {
      let amount =
        typeof val === "number"
          ? val
          : Number((String(val).match(/([0-9][0-9,.]*)\s*$/) || [])[1]?.replace(/,/g, ""));
      if (Number.isFinite(amount) && amount > 0) {
        const info = classifyDummyFloat(val, color);
        recordDummyDamage(info[0], info[1], info[2], amount, info[3]);
        if (typeof val === "number" && info[0] === "weapon" && run) run._lastOutgoingHitV41 = run.time;
      }
    }
    const status = typeof val === "string" && (tier || 0) === 0;
    if (status) {
      statusFloat(side, val, color, x);
      prevResult97 = undefined;
      break prev97;
    }
    prevResult97 = floatDmgBase(side, val, tier, color, x);
    break prev97;
  }
  const result = prevResult97;
  if (b) {
    const all = b.querySelectorAll(".dmg");
    if (all.length > before) positionCombatNumber(all[all.length - 1], side, tier, x);
  }
  return result;
};
const floatDmgBeforeV51 = floatDmg;
floatDmg = function (side, val, tier, color, x) {
  if (side === "foe" && typeof val === "number" && run && !run._gammaReflectV51) {
    const b = run.foes && run.foes.find(f => f.gammaThornsV51 && f.hp > 0),
      w = S.gear && S.gear.weapon,
      lc = String(color || "").toLowerCase(),
      status = ["#7fe07f", "#9be07f", "#ff8a3a", "#ffe14d"].includes(lc);
    if (b && (!w || w.wtype !== "bow") && !status) {
      const ref = Math.min(run.hero.max * 0.28, Math.max(run.hero.max * 0.06, val * 0.42));
      run._gammaReflectV51 = true;
      run._incomingContextV41 = { label: "Gamma Crown of Thorns", icon: "✹", source: b };
      run.hero.hp -= ref;
      run._incomingContextV41 = null;
      floatDmgBeforeV51("hero", "✹ " + Math.round(ref), 0, "#ffe083");
      run._gammaReflectV51 = false;
      if (run.hero.hp <= 0 && !run.over) heroDown();
    }
  }
  return floatDmgBeforeV51(side, val, tier, color, x);
};
const floatDamageBase = floatDmg;
floatDmg = function (side, value, tier, color, x) {
  const n = Number(value),
    counted = side === "foe" && Number.isFinite(n) && n > 0;
  if (counted) {
    ensureQuestState().stats.damage += n;
    if (!questDamageRefresh) {
      questDamageRefresh = true;
      setTimeout(() => {
        questDamageRefresh = false;
        evaluateQuests(false);
      }, 250);
    }
  }
  return floatDamageBase(side, value, tier, color, x);
};
const startRunAbyssBase = startRun;
startRun = function (ai) {
  let prevResult98;
  prev98: {
    if (!nextRunAbyss) {
      prevResult98 = startRunAbyssBase(ai);
      break prev98;
    }
    nextRunAbyss = false;
    const orig = AREAS[ai],
      clone = abyssAreaClone(ai, orig);
    AREAS[ai] = clone;
    try {
      startRunAbyssBase(ai);
    } finally {
      AREAS[ai] = orig;
    }
    if (run) {
      run.abyss = true;
      run.mirror = ai;
    }
  }
  const result = prevResult98;
  resetStageDamage();
  return result;
};
/* Contract effects. */
const startRunBase = startRun;
startRun = function (ai) {
  let prevResult99;
  prev99: {
    startingContract = S.activeContractV70 || null;
    const id = startingContract,
      abyss = !!S.abyssMode;
    if (id) {
      const record = contractStageRecordV72(ai, abyss),
        left = 600000 - (Date.now() - (Number(S.contractCooldownV73[id]) || 0));
      if (record[id]) {
        startingContract = null;
        showTip(
          "CONTRACT ALREADY COMPLETED",
          "This contract has already been completed for " +
            AREAS[ai].n +
            ". Choose another contract or another area."
        );
        prevResult99 = null;
        break prev99;
      }
      if (left > 0) {
        startingContract = null;
        showTip(
          "CONTRACT RECOVERY",
          CONTRACTS[id].name +
            " is ready again in <b>" +
            Math.ceil(left / 60000) +
            " minute" +
            (left > 60000 ? "s" : "") +
            "</b>. Other contracts have separate recovery timers."
        );
        prevResult99 = null;
        break prev99;
      }
      if (id === "mastery" && !masteryReadyV72(ai, abyss)) {
        startingContract = null;
        showTip(
          "MASTERY CONTRACT LOCKED",
          "Complete all four standard contracts for this exact area first. A Mastery Contract can then be completed once."
        );
        prevResult99 = null;
        break prev99;
      }
      S.contractCooldownV73[id] = Date.now();
    }
    const result = startRunBase(ai);
    if (run) {
      run.contractV70 = id;
      run.contractRewardedV70 = false;
    }
    startingContract = null;
    prevResult99 = result;
    break prev99;
  }
  const result = prevResult99;
  if (run && run.a && run.a.abyss) {
    ensureQuestState().stats.abyssEntered = 1;
    evaluateQuests(false);
  }
  return result;
};

const startRushBase = startBossHunt;
startBossHunt = function () {
  const result = startRushBase();
  if (run && run.hunt && !run.abyssRush) {
    ensureQuestState().stats.rushEntered = 1;
    evaluateQuests(false);
  }
  return result;
};
/* Abyss Rush lives inside the V50 module and is intentionally exposed through its
   public API. Referencing its private local name here stopped the entire Version 7
   layer during startup. Wrap the public entry point and rebind the existing button. */
if (window.abyssAPIv50 && typeof window.abyssAPIv50.startRush === "function") {
  const startAbyssRushBeforeV74 = window.abyssAPIv50.startRush;
  window.abyssAPIv50.startRush = function () {
    const result = startAbyssRushBeforeV74();
    if (run && run.abyssRush) {
      ensureQuestState().stats.abyssRushEntered = 1;
      evaluateQuests(false);
    }
    return result;
  };
  const abyssRushButtonV74 = $("abyssrushbtnv50");
  if (abyssRushButtonV74) abyssRushButtonV74.onclick = window.abyssAPIv50.startRush;
}
setInterval(() => {
  const guild = $("guildv70");
  if (guild && guild.classList.contains("on")) renderGuildPublic();
}, 1000);

ensureQuestState();
observeQuestState();
if (!S.questV74.migrated) {
  S.questV74.migrated = true;
  evaluateQuests(true);
  scheduleSave();
}
setupQuestUI();
orderCompendium();
renderTown();
document.title = "THE FORGE v7.4.0";
window.__forgeV7Boot = "ready";
window.forgeV74 = {
  quests: QV74,
  state: ensureQuestState,
  evaluate: evaluateQuests,
  claim: claimQuest,
  open: openQuestMenu,
  value: questValue,
  goal: questGoal,
  unlocked: questUnlocked,
  tabs: questTabs
};
