/* ================= script block 8 ================= */

/* V78 · Dummy secrets, accurate area guidance, and level fifty mastery progression. */
/* ---- (patch scope opened) ---- */
const AREA_GUIDE = [
  {
    desc: "The Goblin King rallies extra goblins during the boss fight.",
    focus: "Fire punishes Goblins and Wraiths. Clear summons before they crowd the field."
  },
  {
    desc: "The Ice Troll casts Permafrost and temporarily freezes your attacks.",
    focus: "Use Ice against Slimes and Lightning against Skeletons. Slimes resist Fire."
  },
  {
    desc: "The Colossus uses Stoneskin for a long defensive shield.",
    focus: "Lightning breaks through Golems best. Bring strong direct damage for heavy armor."
  },
  {
    desc: "The Lich becomes evasive and curses you with poison through Veil of Shadows.",
    focus:
      "Fire is strongest against the Lich and Wraiths. Lightning handles Skeletons but Wraiths resist it."
  },
  {
    desc: "The Balrog erupts the floor for heavy Fire damage based on your maximum health.",
    focus: "Ice is the clear elemental choice. Demons strongly resist Fire."
  },
  {
    desc: "Air drains throughout the run and Leviathan gives you no safe pause at the end.",
    focus: "Lightning strikes Serpents hardest. Ice works against Slimes. Watch the Air meter."
  },
  {
    desc: "The Banshee raises Wraiths that revive once after being defeated.",
    focus: "Fire handles Revenants and Wraiths. Ice is useful against Bats."
  },
  {
    desc: "The Elder Wyrm grows faster and fiercer at two health thresholds, then breathes Fire.",
    focus: "Ice counters Demons and Lightning counters Golems. Fire resistance helps against Wyrmbreath."
  },
  {
    desc: "The Void Titan repeatedly stacks Event Horizon, slowing your attacks for the rest of the fight.",
    focus:
      "A mixed roster rewards Fire, Ice, and Lightning coverage. End the boss fight before Slow stacks overwhelm you."
  },
  {
    desc: "The Lich Queen combines Blizzard damage with a full attack freeze.",
    focus: "Lightning covers Skeletons and Golems. Fire covers Wraiths. Ice resistance softens Blizzard."
  },
  {
    desc: "The Archfiend calls down a slow but devastating Fire Meteor.",
    focus: "Ice is strongest against the Demon host. Fire resistance and burst damage improve survival."
  },
  {
    desc: "The Architect shifts through three phases while Singularity adds permanent attack Slow stacks.",
    focus:
      "Every element has a useful target here. Broad damage and a fast boss finish matter more than one weakness."
  },
  {
    desc: "The Last Question seals healing and deals heavier damage in each of its final phases.",
    focus:
      "Mixed defenses are required. Lifesteal is reduced by 10 percent and no single element solves the stage."
  },
  {
    desc: "Alpha uses Law of Light to deal Lightning damage and leave you Exposed.",
    focus:
      "Celestial foes resist elemental damage. Use penetration, physical damage, and durable defenses. Lifesteal is reduced by 25 percent."
  },
  {
    desc: "Beta fractures time, dealing Ice damage and stacking severe attack Slow.",
    focus:
      "Celestial resistance makes focused elements unreliable. Finish cleanly before Slow stacks grow. Lifesteal is reduced by 50 percent."
  },
  {
    desc: "Gamma seals all healing while its Ascendant gates pressure your defenses.",
    focus:
      "Plan for long periods without recovery. Direct damage and prevention become essential. Lifesteal is reduced by 75 percent."
  },
  {
    desc: "OMEGA cycles Time Lock, Absolute Mirror, loadout suppression, and lethal verdicts while its damage rises over time.",
    focus: "Only a complete late game build will endure. Lifesteal is reduced by 85 percent."
  }
];

const AREA_WEAK = [
  "Fire",
  "Ice and Lightning",
  "Lightning",
  "Fire and Lightning",
  "Ice",
  "Lightning and Ice",
  "Fire and Ice",
  "Ice and Lightning",
  "Mixed elements",
  "Lightning and Fire",
  "Ice",
  "Mixed elements",
  "Mixed defenses",
  "Physical damage and penetration",
  "Physical damage and penetration",
  "Damage prevention",
  "A complete endgame build"
];

/* ================= script block 9 ================= */

/* V79 · Early guidance, starter equipment, and pinned Forge progression. */
/* ---- (patch scope opened) ---- */
const NOTICE = {
  retreat: {
    title: "RETREAT SAVES YOUR LOOT",
    body: "Some waves are safe retreat points. Retreating ends the run without an area clear, but you keep every loot bag collected so far. In the first area, your last chance to retreat is <b>wave 5</b>, immediately before the boss.",
    target: null
  },
  death3: {
    title: "THEY ARE TOUGH",
    body: "These enemies hit hard. Select a piece of equipment, then use <b>Upgrade</b> at <b>The Anvil</b> to make it stronger.",
    target: "anvil"
  },
  death7: {
    title: "MORE ROOM TO GROW",
    body: "Gold can unlock additional equipment slots. Your next slot is the <b>Helmet</b>, which costs <b>300 gold</b> and gives you another source of useful stats.",
    target: "helmet"
  },
  shop: {
    title: "SMITH'S SHOP UNLOCKED",
    body: "The Shop sells bag space, experience boosts, Forge protection, and other long term upgrades. Its stock becomes more valuable as your equipment improves.",
    target: "shop"
  },
  compendium: {
    title: "COMPENDIUM UNLOCKED",
    body: "The Compendium records monsters, areas, discovered Mythic effects, and the mechanics you have encountered. More information appears as you continue playing.",
    target: "compendium"
  },
  guild: {
    title: "MERCENARIES GUILD UNLOCKED",
    body: "Guild contracts add optional dangers to an accessible area in exchange for better rewards. Each contract has its own recovery timer, and Mastery contracts appear after proving yourself.",
    target: "guild"
  }
};

const FORGE_CHAIN = ["forge1", "forge10", "forge15", "forge20", "cel10", "mythic13"];

let pinGuard = false;

/* ---- (patch scope opened) ---- */
const GREAT_AXE_DAMAGE_BOOST = 1.02; // was 1.2; axe is the group weapon, not the boss weapon

/* ================= script block 11 ================= */

/* V81 · Economy matched quest rewards. */
/* ---- (patch scope opened) ---- */
const PREVIOUS_QUEST_GOLD = {
  forge1: 100,
  forge10: 1000,
  forge15: 5000,
  forge20: 10000,
  cel10: 25000,
  mythic13: 75000,
  campaign2: 250,
  campaign4: 750,
  campaign6: 1500,
  campaign9: 4000,
  campaign12: 8000,
  campaign13: 15000,
  campaign15: 30000,
  campaign17: 60000
};

/* ---- (patch scope opened) ---- */
const GEAR_BAG_COST = 15000,
  GEAR_BAG_CAP = 10;

let dragRef = null;

/* ---- (patch scope opened) ---- */
const MINE_UNLOCK_AREA = 3,
  MINE_CAP_MS = 3600000,
  MINE_MAX_LEVEL = 10;

const MINE_UPGRADES = {
  gold: { name: "Gold Haul", copy: "Multiplies the level scaled gold in every haul.", base: 2 },
  shards: { name: "Shard Sorting", copy: "Raises blue shard chance and quantity.", base: 2 },
  speed: { name: "Cart Speed", copy: "Shortens the time between mining trips.", base: 3 },
  luck: { name: "Prospector Luck", copy: "Raises the chance that an entire haul is doubled.", base: 3 },
  epic: { name: "Epic Excavation", copy: "Adds a small chance to find Epic Shards.", base: 4 },
  celestial: { name: "Celestial Survey", copy: "Adds a rare chance to find Celestial Shards.", base: 6 }
};

let mineShownBatch = 0;

/* ================= script block 0 ================= */

// ============ AUDIO ============
let AC;

document.addEventListener(
  "pointerdown",
  () => {
    if (music.on) startMusic();
  },
  { once: true }
);
$("musicbtn").onclick = () => {
  music.on = !music.on;
  $("musicbtn").textContent = music.on ? "🔊" : "🔇";
  if (music.on) startMusic();
};
OFFSTATS.forEach(s => (STATCAT[s] = "off"));
DEFSTATS.forEach(s => (STATCAT[s] = "def"));
UTILSTATS.forEach(s => (STATCAT[s] = "util"));

// ============ GEAR ============
var statRoll;

var gStat;
var gearDesc;
var gpower;
var slotStatLines;
var itemIcon;
var itemMarks;
var skillBonuses;
var heroStats;
var xpFor;
var gainXP;

// forge
var upCost;
var upOdds;
var rfCost;
var addAffix;
$("upbtn").onclick = () => {
  const g = S.gear[S.sel];
  if (!g) return;
  const c = upCost(g);
  if (S.gold < c.gold || S.shards < c.shards) {
    $("fsel").textContent = "Not enough materials.";
    return;
  }
  openStrike(g, c);
};
$("rfbtn").onclick = () => {
  const g = S.gear[S.sel];
  if (!g) return;
  const c = rfCost(g);
  if (S.shards < c) {
    $("fsel").textContent = "Need " + c + " shards.";
    return;
  }
  S.shards -= c;
  const before = gpower(g);
  const rc = (g.reforges || 0) + 1;
  const tries = 1 + skillBonuses().reforgeHigh;
  let ng = makeGear(g.slot, g.ilvl, g.rar);
  for (let t = 1; t < tries; t++) {
    const cand = makeGear(g.slot, g.ilvl, g.rar);
    if (gpower(cand) > gpower(ng)) ng = cand;
  }
  ng.plus = g.plus;
  ng.reforges = rc;
  S.gear[g.slot] = ng;
  beep(520, 0.1, "triangle");
  flash(cvar("--rare"));
  renderTown();
};
let sRAF, sPos, sDir, sSpeed, zL, zW, zcL, pend;
var celestialCost;
var openCelestial;
$("celbtn").onclick = () => {
  const g = S.gear[S.sel];
  if (!g || g.plus < 20 || g.rar < 3 || g.broken) return;
  openCelestial(g);
};
var anvilStatPop;
var renderGuardRow;
var openStrike;
$("strikebtn").onclick = () => {
  cancelAnimationFrame(sRAF);
  if (celestialMode) {
    const { g, c } = pend;
    const hit = sPos >= zL - 1 && sPos <= zL + zW + 1;
    S.epicShards -= c.esh;
    S.gold -= c.gold;
    $("hammer").classList.add("hit");
    beep(320, 0.1, "sine", 0.12);
    setTimeout(() => {
      $("hammer").classList.remove("hit");
      const success = hit && Math.random() < 0.5;
      if (success) {
        g.celestial = (g.celestial || 0) + 1;
        const na = addAffix(g);
        flash("#9fd8ff");
        shake();
        setTimeout(shake, 120);
        spawnSparks("#9fd8ff", 50);
        spawnSparks("#ffffff", 26);
        chord([659, 988, 1319, 1568, 1976, 2637], 0.8);
        floatForge("✦✦ CELESTIAL +" + g.celestial + (na ? " · NEW AFFIX!" : "") + " ✦✦", "#9fd8ff");
      } else {
        beep(90, 0.35, "sawtooth", 0.18);
        flash("#3a2f57");
        floatForge("✦ celestial attempt failed", "#8a7fb0");
      }
      setTimeout(
        () => {
          $("strike").classList.remove("on", "celestial");
          celestialMode = false;
          renderTown();
          $("run").style.display = "none";
          $("town").style.display = "grid";
        },
        success ? 1350 : 650
      );
    }, 150);
    return;
  }
  const { g, c } = pend;
  const hit = sPos >= zL - 2 && sPos <= zL + zW + 2;
  const critHit = sPos >= zcL - 1 && sPos <= zcL + ZCW + 1;
  S.gold -= c.gold;
  S.shards -= c.shards;
  const odds = upOdds(g) + (hit ? 0.25 : 0);
  const success = Math.random() < odds;
  $("hammer").classList.add("hit");
  beep(240, 0.09, "square", 0.15);
  setTimeout(() => {
    beep(150, 0.12, "square", 0.11);
    spawnSparks(success ? cvar("--gold") : "#8a7a5a", success ? 18 : 6);
    $("hammer").classList.remove("hit");
  }, 120);
  setTimeout(() => {
    const sb = skillBonuses();
    let hold = 140;
    if (success) {
      const before = {};
      Object.keys(g.stats).forEach(s => (before[s] = gStat(g, s)));
      const critS =
        Math.random() < 0.04 + sb.critSuccess + (critHit ? 0.05 + (sb.silverCritSuccess || 0) : 0);
      let np = g.plus + (critS ? 2 : 1);
      if (!critS) np = Math.min(np, 20);
      np = Math.min(np, 21);
      g.plus = np;
      let na = null;
      if (g.plus % 10 === 0 && Math.random() < 0.5 + sb.affixChance) na = addAffix(g);
      const deltas = Object.keys(g.stats)
        .map(s => {
          const dv = gStat(g, s) - (before[s] || 0);
          if (dv <= 0.05) return null;
          const av = PERCENT.has(s) ? dv.toFixed(1) + "%" : "+" + Math.round(dv);
          return (PERCENT.has(s) ? "+" + av : av) + " " + STAT_LABEL[s];
        })
        .filter(Boolean);
      anvilStatPop(deltas);
      if (critS) {
        flash(cvar("--epic"));
        shake();
        chord([523, 659, 784, 1046, 1319], 0.6);
        floatForge("✦ CRITICAL FORGE! +2 ✦", "#c46bff");
        spawnSparks("#c46bff", 26);
        hold = 1000;
      } else {
        flash(g.plus >= 7 ? cvar("--legendary") : cvar("--gold"));
        shake();
        chord(g.plus >= 7 ? [523, 659, 784, 1046] : [500, 700]);
      }
      if (na) {
        flash(cvar("--epic"));
        setTimeout(() => chord([523, 659, 784, 1046, 1319], 0.6), 150);
        floatForge("★ NEW AFFIX UNLOCKED!", "#c46bff");
        hold = 1000;
      }
      if (g.plus >= 20) {
        flash(cvar("--legendary"));
        shake();
        setTimeout(shake, 120);
        spawnSparks("#ffd76a", 44);
        spawnSparks("#ffffff", 22);
        chord([523, 659, 784, 1046, 1319, 1568, 2093], 0.75);
        setTimeout(() => chord([784, 1046, 1319, 1568], 0.5), 200);
        floatForge(g.plus >= 21 ? "✦✦✦ +21 CELESTIAL-READY ✦✦✦" : "✦✦ +20 MASTERWORK ✦✦", "#ffd76a");
        hold = Math.max(hold, 1350);
      }
    } else {
      beep(90, 0.3, "sawtooth", 0.18);
      if (g.plus > 10) {
        const breakChance = sb.insured ? 0 : Math.max(0.03, 0.15 - sb.critFailCut);
        const downChance = 0.35;
        const roll = Math.random();
        let mishap = roll < breakChance ? "break" : roll < breakChance + downChance ? "down" : null;
        if (mishap && armedGuard && S.guards[armedGuard] > 0) {
          const gname = GUARDS[armedGuard].n;
          const absorbed = Math.random() < GUARDS[armedGuard].save;
          S.guards[armedGuard]--;
          if (S.guards[armedGuard] <= 0) armedGuard = null;
          renderGuardRow();
          if (absorbed) {
            mishap = null;
            flash(cvar("--uncommon"));
            beep(520, 0.2, "triangle", 0.13);
            floatForge("🛡 " + gname + " ABSORBED IT! (guard used)", cvar("--uncommon"));
            hold = Math.max(hold, 1100);
          } else {
            floatForge("🛡 " + gname + " failed to hold… (guard used)", "#a08a5a");
            hold = Math.max(hold, 900);
          }
        }
        if (mishap === "break") {
          g.broken = true;
          flash("#ff2f2f");
          shake();
          shake();
          beep(70, 0.5, "sawtooth", 0.2);
          floatForge("💥 CRITICAL FAILURE — SHATTERED (−50%)", "#ff5b45");
          spawnSparks("#ff3b2f", 22);
          hold = Math.max(hold, 1200);
        } else if (mishap === "down") {
          g.plus = Math.max(0, g.plus - 1);
          flash("#ff8a3a");
          shake();
          beep(120, 0.32, "sawtooth", 0.16);
          floatForge("▼ THE FORGE SLIPPED — now +" + g.plus, "#ff9a5a");
          spawnSparks("#ff8a3a", 10);
          hold = Math.max(hold, 1000);
        }
      }
    }
    const broke = g.broken;
    setTimeout(() => {
      $("strike").classList.remove("on");
      renderTown();
      if (broke) {
        S.sel = g.slot;
        renderTown();
        $("run").style.display = "none";
        $("town").style.display = "grid";
        return;
      }
      const nc = upCost(g);
      if (g.plus < 20 && S.gear[S.sel] === g) {
        openStrike(g, nc);
        if (S.gold < nc.gold || S.shards < nc.shards) {
          $("strikebtn").disabled = true;
          $("baseodds").innerHTML =
            '<span style="color:#ffb07c">Not enough resources for another attempt.</span>';
        }
      } else {
        $("run").style.display = "block";
        $("town").style.display = "none";
        $("strike").classList.add("on");
        $("strikebtn").disabled = true;
        $("baseodds").innerHTML = '<span style="color:#ffd76a">This item has reached +20.</span>';
        $("strikedone").textContent = "✕ Done";
      }
    }, hold);
  }, 440);
};
$("strikedone").onclick = () => {
  cancelAnimationFrame(sRAF);
  celestialMode = false;
  $("strike").classList.remove("on", "celestial");
  $("run").style.display = "none";
  $("town").style.display = "grid";
  renderTown();
};
document.addEventListener("keydown", e => {
  if ($("strike").classList.contains("on")) {
    if (e.code === "Space") {
      e.preventDefault();
      $("strikebtn").click();
    } else if (e.code === "Escape") {
      $("strikedone").click();
    }
  }
});

var renderTree;
$("opentree").onclick = () => {
  renderTree();
  $("sktree").classList.add("on");
};
$("closetree").onclick = () => $("sktree").classList.remove("on");
// shop

var renderShop;
$("shopbtn").onclick = () => {
  renderShop();
  $("shop").classList.add("on");
};
$("closeshop").onclick = () => $("shop").classList.remove("on");
$("salvageall").onclick = () => {
  if (!S.bag.length) return;
  let s = 0,
    es = 0;
  S.bag.forEach(g => {
    s += salvageValueV10(g);
    if (g.rar >= 3) es += g.rar - 2;
  });
  S.shards += s;
  S.epicShards += es;
  S.bag = [];
  beep(420, 0.1, "triangle");
  flash(cvar("--rare"));
  renderTown();
};
$("rerun").onclick = () => {
  if (lastArea != null) startRun(lastArea);
};
// live character stat panel (right side)
var liveStats;
var renderStatPanel;
$("sptoggle").onclick = () => {
  const sp = $("statpanel");
  sp.classList.toggle("folded");
  $("sptoggle").textContent = sp.classList.contains("folded") ? "◀" : "▶";
};
var foeBaseX;
var updateRetreat;
$("healbtn").onclick = () => {
  if (!run || run.over || !S.skills.h1 || (run.healCd || 0) > 0) return;
  const hs = heroStats();
  const sb = skillBonuses();
  run.hero.hp = Math.min(run.hero.max, run.hero.hp + run.hero.max * 0.3 * sb.healPower);
  run.healCd = 12000 * (1 - Math.min(70, (hs.healCdr || 0) + sb.healCdrSkill) / 100);
  beep(760, 0.12, "triangle");
  setTimeout(() => beep(980, 0.12, "triangle"), 90);
  flash(cvar("--uncommon"));
  for (let i = 0; i < 12; i++)
    particles.push({
      x: 150 + (Math.random() - 0.5) * 30,
      y: GY - 30 - Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.4,
      vy: -1 - Math.random() * 1.4,
      life: 1,
      sz: 2,
      col: "#7fe07f"
    });
  drawBars();
  updateHeal();
};

var buildFoe;
/* ---- startCast: later layers (moved here) ---- */
const startCastBase = startCast;
startCast = function (m, boss) {
  if (!m || m.id !== "omegatriad") return startCastBase(m, boss);
  const now = run.time;
  let chosen = null;
  if (now >= boss.omegaSummonAt) chosen = OMEGA_SUMMON;
  else if (now >= boss.omegaHealAt) chosen = OMEGA_HEAL;
  else if (now >= boss.omegaStunAt) chosen = OMEGA_STUN;
  if (!chosen) {
    run.nextCastAt = now + omegaNextDelay(boss);
    return;
  }
  return startCastBase(chosen, boss);
};
var nextWave;
var updateStatusFx;

var tick;
var killFoe;

$("deadok").onclick = () => {
  $("dead").classList.remove("on");
  startLootOpen(() => backToTown());
};
$("retreat").onclick = () => {
  if (!run || run.over || run.wave % 3 !== 0) return;
  run.over = true;
  clearInterval(timer);
  hideCast();
  startLootOpen(() => backToTown());
};
var showBoon;

var addToBag;
var startLootOpen;
