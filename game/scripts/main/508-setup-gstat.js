/* ==== gStat ==== */
/* ================= WEAPON SPEED & TYPE REBALANCE =================
   Problem: attack speed did nothing at endgame — swings hit a hard 500ms floor once
   atkSpeed passed ~180, but builds reached ~1000+, so bow/dagger's speed identity was
   wasted and raw-attack weapons (sword/axe) dominated. Fix, in three coordinated parts:
     1. Tame atkSpeed inflation — the atkSpeed affix no longer takes the full forge/celestial
        amplification, so endgame atkSpeed sits in the low hundreds (saner on-screen numbers).
     2. Responsive swing formula with a lower floor + per-type cadence, so more atkSpeed always
        swings faster and weapon TYPE sets a real speed baseline (dagger fastest → axe slowest).
     3. Weapon base-attack multipliers retuned for a speed-vs-power tradeoff (see makeWeaponV18). */

/* ==== gStat ==== */
/* ==== gStat ==== */
/* ==== gStat ==== */
/* ==== gStat ==== */
/* ==== gStat ==== */
/* ---- gStat: later layers (moved here) ---- */
const gStatBase = gStat;
gStat = function (g, stat) {
  if (stat === "enrage") {
    {
      if (stat !== "enrage") return gStatBase(g, stat);
      const p = Math.max(0, g.plus || 0),
        m = 0.75 * (1 + 0.0125 * p) * (g.broken ? 0.5 : 1);
      return (g.stats.enrage || 0) * m;
    }
    return;
  }
  let m = forgeMultiplier(g.plus);
  if (g.celestial) m *= 1 + 0.08 * Math.min(10, g.celestial);
  if (g.broken) m *= 0.5;
  let v = (g.stats[stat] || 0) * m;
  if (g.growth) {
    const gr = growthValues(g);
    if (stat === "atk") v += gr.atk;
    if (stat === "hp") v += gr.hp;
  }
  return v;
};
const gStatBeforeV32 = gStat;
gStat = function (g, stat) {
  if (stat === "attackPower") return attackPowerPct(g);
  let prevResult47;
  prev47: {
    if (stat !== "critChance") {
      prevResult47 = gStatBeforeV32(g, stat);
      break prev47;
    }
    let m = forgeMultiplier(g.plus);
    if (g.celestial) m *= 1 + 0.005 * Math.min(10, g.celestial);
    if (g.broken) m *= 0.5;
    prevResult47 = (g.stats.critChance || 0) * m;
    break prev47;
  }
  let value = prevResult47;
  if (g && g.slot === "weapon" && EXCL.has(stat)) {
    value *= 1 + (skillBonuses().statusPower || 0);
    if (g.mythicAffix === "mythicStatus") value *= 1.35;
  }
  return value;

  return;
};
/* ---------- CELESTIAL 11-13 ACTUALLY GET STRONGER ---------- */
// Base gStat scales celestial by (1+0.1·cel) = +5%/level. Abyssal 11-13 are hard-earned,
// so give them a bigger step, and lift the two systems that were capped at celestial 10.
const gStatCelBase = gStat;
gStat = function (g, stat) {
  let prevResult189;
  prev189: {
    let v = gStatCelBase(g, stat);
    if (g && (g.celestial || 0) > 10 && stat !== "attackPower") {
      const cel = Math.min(13, g.celestial);
      const baseCelMult = 1 + 0.1 * cel; // what base gStat already applied
      const wantCelMult = 2.0 + 0.3 * (cel - 10); // stronger scaling for 11-13 (2.3 / 2.6 / 2.9)
      v *= wantCelMult / baseCelMult;
    }
    prevResult189 = v;
    break prev189;
  }
  const v = prevResult189;
  if (stat === "atkSpeed" && g && g.stats) {
    const raw = g.stats.atkSpeed || 0;
    if (raw > 0 && v > raw) {
      const T = (typeof window !== "undefined" && window.__spdTune) || {};
      const damp = T.spdDamp != null ? T.spdDamp : 0.12;
      return raw + (v - raw) * damp;
    }
  }
  return v;
};
window.swingIntervalV50 = swingInterval;
window.swingTypeMulV50 = swingTypeMulV50;
window.weaponAtkMulV50 = weaponAtkMulV50;
const makeWeaponBase = makeWeapon;
makeWeapon = function (ilvl, rar, type, forcedEffect) {
  let prevResult66;
  prev66: {
    type = type || randomWeaponType();
    prevResult66 =
      type === "dagger" ? makeDagger(ilvl, rar, forcedEffect) : makeWeaponBase(ilvl, rar, type, forcedEffect);
    break prev66;
  }
  const g = prevResult66;
  if (g && g.wtype === "dagger")
    g.stats.atkSpeed = Math.round((15 + rar * 3.2) * (0.75 + Math.random() * 0.5));
  return ensureMythic(g);
};
const makeWeaponBeforeV45 = makeWeapon;
makeWeapon = function (ilvl, rar, type, forcedEffect) {
  return applyItemDistribution(makeWeaponBeforeV45(ilvl, rar, type, forcedEffect), true, false);
};
const makeWeaponBeforeV50 = makeWeapon;
makeWeapon = function (ilvl, rar, type, effect) {
  let prevResult190;
  prev190: {
    if (!type) {
      const r = Math.random();
      type = r < 0.3 ? "sword" : r < 0.55 ? "bow" : r < 0.78 ? "dagger" : "greataxe";
    }
    if (type !== "greataxe") {
      prevResult190 = makeWeaponBeforeV50(ilvl, rar, type, effect);
      break prev190;
    }
    const g = makeWeaponBeforeV50(ilvl, rar, "sword", null);
    g.wtype = "greataxe";
    if (g.stats.atk != null) g.stats.atk = Math.max(1, Math.round((g.stats.atk / 1.28) * 1.42));
    Object.keys(g.stats).forEach(st => {
      if (EXCL.has(st)) delete g.stats[st];
    });
    const affixCount = () => Object.keys(g.stats).filter(st => st !== "atk").length;
    let guard = 0;
    while (affixCount() < rar && guard++ < 12) {
      const st = weightedAffix(g, weaponPool(g));
      if (!st) break;
      g.stats[st] = statRoll(st, ilvl, rar);
    }
    g.name =
      (g.unique === "bloodforged"
        ? "Bloodforged "
        : RAR[rar].k[0].toUpperCase() + RAR[rar].k.slice(1) + " ") + "Great Axe";
    try {
      ensureItemVariant(g);
    } catch (e) {}
    try {
      ensureMythic(g);
    } catch (e) {}
    prevResult190 = g;
    break prev190;
  }
  const g = prevResult190;
  if (g && g.stats && g.stats.atk != null) {
    const old = WEAPON_OLD_ATKMUL[g.wtype] || 1;
    g.stats.atk = Math.max(1, Math.round((g.stats.atk * weaponAtkMulV50(g.wtype)) / old));
  }
  return g;
};

/* ---------- (6) CELESTIAL FORGE TO +13 (11-13 need 3 perfect silver hits) ---------- */
const celestialProfileBase = celestialProfile;
celestialProfile = function (g) {
  const cur = g.celestial || 0;
  if (cur < 10) return celestialProfileBase(g);
  const target = cur + 1;
  return { target, hits: 3, width: Math.max(9, 18 - cur * 0.5), speed: 4.1 + cur * 0.32, chance: 1 };
};

/* celbtn respects the +13 cap */
$("celbtn").onclick = () => {
  const g = S.gear[S.sel];
  if (!g || g.plus < 20 || g.rar < 3 || g.broken || (g.celestial || 0) >= celestialCap()) return;
  openCelestial(g);
};
/* allow finishCelestialV5 to climb past 10 AND keep the forge open on a successful
   celestial upgrade (continue like regular smithing) — the window only closes when the
   player hits Done, or when the item can go no further (at cap / can't afford the next). */
const finishCelestialBase = finishCelestial;
finishCelestial = function (success) {
  const g = pend && pend.g;
  if (success && g && (g.celestial || 0) >= 10) {
    strikeLocked = true;
    celestialSparkSequence(true, () => {
      g.celestial = Math.min(13, (g.celestial || 0) + 1);
      const na = addAffix(g);
      flash(g.celestial >= 13 ? "#ffd76a" : "#c9b6ff");
      softShake();
      floatForge(
        (g.celestial >= 13 ? "✹ ABYSSAL CELESTIAL 13 ✹" : "✦ CELESTIAL +" + g.celestial) +
          (na ? " · NEW AFFIX!" : ""),
        g.celestial >= 13 ? "#ffd76a" : "#c9b6ff"
      );
      try {
        scheduleSave();
      } catch (e) {}
      setTimeout(() => celestialRearm(g), 950);
    });
    return;
  }
  if (success && g) {
    strikeLocked = true;
    const oldGear = JSON.parse(JSON.stringify(g));
    celestialSparkSequence(true, () => {
      g.celestial = Math.min(10, (g.celestial || 0) + 1);
      const na = g.celestial >= 10 ? addAffix(g) : null;
      flash(g.celestial >= 10 ? "#ffd76a" : "#9fd8ff");
      softShake();
      floatForge(
        (g.celestial >= 10 ? "✹ CELESTIAL MAX 10 ✹" : "✦ CELESTIAL +" + g.celestial) +
          (na ? " · NEW AFFIX!" : ""),
        g.celestial >= 10 ? "#ffd76a" : "#9fd8ff"
      );
      try {
        showForgeComparison(oldGear, g, true);
      } catch (e) {}
      try {
        scheduleSave();
      } catch (e) {}
      setTimeout(() => {
        try {
          clearForgeComparison();
        } catch (e) {}
        celestialRearm(g);
      }, 2900);
    });
    return;
  }
  return finishCelestialBase(success);
};
/* high-celestial strike handler: 3 consecutive silver hits, miss resets */
const strikeOnclickBase = $("strikebtn").onclick;
$("strikebtn").onclick = function (ev) {
  if (celestialMode && pend && pend.g && (pend.g.celestial || 0) >= 10) {
    if (strikeLocked) return;
    cancelAnimationFrame(sRAF);
    const pos = sPos,
      g = pend.g,
      c = pend.c;
    $("hammer").classList.add("hit");
    beep(235, 0.06, "square", 0.1);
    setTimeout(() => $("hammer").classList.remove("hit"), 85);
    const hit = pos >= zL - 1 && pos <= zL + zW + 1;
    if (!pend.paid) {
      S.gold -= c.gold;
      pend.paid = true;
    }
    if (!hit) {
      celHitsDone = 0;
      floatForge("✦ MISS — sequence reset (0/3)", "#ff9a5a");
      beep(120, 0.2, "sawtooth", 0.12);
      strikeLocked = true;
      setTimeout(() => {
        setupCelRound(g);
        strikeLocked = false;
      }, 260);
      return;
    }
    celHitsDone++;
    if (celHitsDone < celHitsNeeded) {
      floatForge("✦ PERFECT SILVER " + celHitsDone + "/" + celHitsNeeded + " — AGAIN!", "#dcecff");
      strikeLocked = true;
      setTimeout(() => {
        setupCelRound(g);
        strikeLocked = false;
      }, 260);
      return;
    }
    finishCelestial(true);
    return;
  }
  return strikeOnclickBase.call(this, ev);
};
window.applyNormalLatePresetV50 = applyNormalLatePresetV50;

/* ---------- STAT PANEL: show the REAL attack rate ----------
   The atkSpeed rating alone doesn't tell you how fast you actually swing, because weapon TYPE
   sets a big part of the cadence (dagger fastest → great axe slowest). Append the effective
   hits/second + ms-per-swing (and the weapon type) to the Spd row so the true speed is clear. */
const renderStatPanelSpdBase = renderStatPanel;
renderStatPanel = function () {
  renderStatPanelSpdBase();
  try {
    const w = S.gear && S.gear.weapon,
      wtype = (w && w.wtype) || "sword",
      hs = heroStats();
    const interval =
      typeof swingInterval === "function"
        ? swingInterval(hs.atkSpeed || 0, wtype)
        : Math.max(500, 1400 / (1 + (hs.atkSpeed || 0) / 100));
    const perSec = 1000 / interval,
      tName =
        wtype === "greataxe"
          ? "Great Axe"
          : wtype === "bow"
            ? "Bow"
            : wtype === "dagger"
              ? "Dagger"
              : "Sword";
    const box = document.getElementById("spbody");
    if (!box) return;
    box.querySelectorAll(".sprow").forEach(r => {
      const sp = r.querySelector("span"),
        b = r.querySelector("b");
      if (sp && b && sp.textContent.trim() === (STAT_LABEL.atkSpeed || "Spd")) {
        b.textContent = perSec.toFixed(2) + "/s";
      }
    });
  } catch (e) {}
};

// (2) Tighten reforge roll spread from ~±30% to ~±21% around the mean (compress toward the average roll).
const REFORGE_VARIANCE = 0.7;

/* ---------- REFORGE: fix the ACTUAL live path (attemptReforgeV8) ----------
   The live reforge rolled a brand-new random item via makeGear (attack included, even a
   random weapon type), ignoring the lock and the "reroll existing values" design. Rewire it
   to the intended candidate: keep the affix set + base damage stat, reroll values (tighter
   variance from above), respect the lock, and preserve forge investment (+level, celestial). */
if (typeof attemptReforge === "function" && typeof makeReforgeCandidate === "function") {
  attemptReforge = function () {
    if (reforgeLocked || !reforgePending) return;
    reforgeLocked = true;
    cancelAnimationFrame(reforgeRaf);
    const p = reforgePending,
      hit = Math.abs(reforgeRadius - REFORGE_STAR_RADIUS) <= REFORGE_HIT_WIDTH;
    S.gold -= p.gold;
    S.shards -= p.shards;
    $("reforgehit").style.display = "none";
    $("reforgecancel").textContent = "Continue";
    if (hit) {
      const oldGear = JSON.parse(JSON.stringify(p.g)),
        tries = 1 + (skillBonuses().reforgeHigh || 0);
      let ng = makeReforgeCandidate(p.g);
      for (let t = 1; t < tries; t++) {
        const cand = makeReforgeCandidate(p.g);
        if (gpower(cand) > gpower(ng)) ng = cand;
      }
      carryIdentity(ng, p.g);
      ng.plus = p.g.plus;
      ng.celestial = p.g.celestial;
      ng.maxPlusReached = p.g.maxPlusReached || p.g.plus || 0;
      ng.celestialAffixGranted = !!p.g.celestialAffixGranted;
      ng.reforges = (p.g.reforges || 0) + 1;
      S.gear[p.g.slot] = ng;
      $("reforgecenter").innerHTML = itemIcon(ng);
      $("reforgemsg").textContent = "ALIGNMENT PERFECT · VALUES REFORGED";
      $("reforgegame").classList.add("success");
      $("reforgearena").classList.add("aligned");
      showReforgeComparison(oldGear, ng);
      chord([440, 660, 880], 0.4);
      flash(cvar("--epic"));
    } else {
      $("reforgemsg").textContent = "ALIGNMENT MISSED · ITEM UNCHANGED";
      $("reforgegame").classList.add("missed");
      beep(105, 0.25, "sawtooth", 0.12);
      softShake();
    }
    try {
      saveGame(true);
    } catch (e) {}
  };
  $("reforgehit").onclick = attemptReforge;
}
$("musicbtn").onclick = function () {
  music.on = !music.on;
  $("musicbtn").textContent = music.on ? "🔊" : "🔇";
  if (music.on) {
    applyMusicSelection();
  } else {
    if (music.timer) {
      clearInterval(music.timer);
      music.timer = null;
      music.started = false;
    }
    stopAllMp3();
  }
};

/* purple abyss-elite tile styling */
const st_t50 = document.createElement("style");
st_t50.textContent =
  ".abysstilev50{border-color:#5a3a7a!important;box-shadow:inset 0 0 12px #c46bff22}.abysstilev50 .atip{border-color:#c46bff}#abysstogglev50{box-shadow:0 0 8px #c46bff33}";
document.head.appendChild(st_t50);

/* expose the abyss combat levers to the global scope — the base-game tick references them
   by bare identifier (typeof abyssDamageMulV50==="function"), and IIFE-scoped function
   declarations are NOT global, so without this they would silently never apply. */
window.abyssHasteMulV50 = abyssHasteMul;
window.abyssDamageMulV50 = abyssDamageMul;
window.abyssCritMultV50 = abyssCritMult;
window.abyssDepthV50 = abyssDepthV50;
window.elemHitFactorV50 = elemHitFactor;

/* entry API (also lets external tooling drive abyss content) */
window.abyssAPIv50 = {
  enterAbyss: function (ai) {
    nextRunAbyss = true;
    startRun(ai);
  },
  startRush: startAbyssRush,
  cap: celestialCap,
  level: abyssLevel,
  leechReduction: celestialLeechReduction,
  cleaveChance: greataxeCleaveChance,
  haste: abyssHasteMul,
  dmg: abyssDamageMul,
  crit: abyssCritMult
};

/* Defense now has a long runway. Ordinary +10 gear no longer reaches endgame mitigation. */
defPct = function (pts) {
  pts = Math.max(0, Number(pts) || 0);
  return Math.round(((85 * pts) / (pts + 1100)) * 10) / 10;
};

allTreeNodes().forEach(n => {
  const t = TREE_TEXT[n.id];
  if (t) {
    n.name = t[0];
    n.d = t[1];
  }
});
PERCENT_BOONS.forEach(nb => {
  const old = BOONS.find(b => b.n === nb.n);
  if (old) old.d = nb.d;
});
showBoon = function () {
  ensureV51State();
  const pool = [...PERCENT_BOONS].sort(() => Math.random() - 0.5).slice(0, 3),
    bel = $("boons");
  bel.innerHTML = "";
  pool.forEach(b => {
    const d = document.createElement("div");
    d.className = "bcard";
    d.innerHTML = '<div class="bn">' + b.i + " " + b.n + '</div><div class="bd">' + b.d + "</div>";
    d.onclick = () => {
      b.apply(S.boonPctV51);
      S.boonList.push({ n: b.n, i: b.i, d: b.d });
      beep(700, 0.12, "triangle");
      flash(cvar("--gold"));
      $("clear").classList.remove("on");
      scheduleSave();
      backToTown();
    };
    bel.appendChild(d);
  });
  $("clear").classList.add("on");
};
const startBossHuntBeforeV51 = startBossHunt;
startBossHunt = function () {
  const result = startBossHuntBeforeV51();
  if (run && run.hunt && !run.abyssRush) {
    run.huntSequenceV51 = standardRushSequence();
    run.huntCount = run.huntSequenceV51.length;
    run.total = run.huntCount;
  }
  resetStageDamage();
  return result;
};
$("huntstart").onclick = startBossHunt;

const huntLeaveBase = $("huntleave").onclick;
$("huntleave").onclick = function () {
  if (this.disabled) return;
  return huntLeaveBase();
};

/* Five item level bands, one perfect guard may be held in each band. */
Object.assign(GUARDS, {
  low: { n: "Low Break Guard", save: 1, min: 1, max: 50, col: "--common" },
  med: { n: "Mid Break Guard", save: 1, min: 51, max: 100, col: "--uncommon" },
  high: { n: "High Break Guard", save: 1, min: 101, max: 150, col: "--rare" },
  vhigh: { n: "Very High Break Guard", save: 1, min: 151, max: 200, col: "--epic" },
  ultra: { n: "Ultra High Break Guard", save: 1, min: 201, max: 250, col: "--mythic" }
});

const style_t375721 = document.createElement("style");
style_t375721.textContent =
  ".choicecooldownv51{filter:grayscale(1);opacity:.42;cursor:not-allowed}.bossbubble.deathv51{z-index:90!important}.masterybadgev51{display:inline-block;margin-left:4px;font-size:8px;color:#6f7280}.masterybadgev51.bronze{color:#c07b3f}.masterybadgev51.silver{color:#d7e1eb;text-shadow:0 0 5px #b9d8ee}.masterybadgev51.gold{color:#ffd45a;text-shadow:0 0 7px #ffbf33}.masterylinev51{margin-top:5px;padding-top:4px;border-top:1px solid #ffffff18;color:#b9bfd0;font-size:9px}.guardbandv51{border-color:#5d6878}";
document.head.appendChild(style_t375721);

ensureV51State();
window.forgeV51 = {
  poisonCap: poisonStackCap,
  poisonSpreadCap: poisonSpreadCapV51,
  defenseMitigation: defPct,
  medalForCount: medalForCountV51,
  guardForItem: guardForItemV51,
  rushSequence: standardRushSequence
};

renderGuardRow = function () {
  const gr = $("guardrow"),
    g = pend && pend.g;
  if (!gr) return;
  ensureV52State();
  const needed = forgeV51.guardForItem(g);
  if (!needed) {
    armedGuard = null;
    gr.innerHTML = '<span class="gl">No Break Guard exists above item level 250.</span>';
    return;
  }
  const gd = GUARDS[needed],
    own = S.guards[needed] || 0;
  armedGuard = own > 0 ? needed : null;
  gr.innerHTML =
    '<span class="gl">🛡 ' +
    gd.n +
    " · item levels " +
    gd.min +
    " to " +
    gd.max +
    ':</span><span class="gbtn' +
    (own > 0 ? " on" : " dis") +
    '">' +
    (own > 0 ? "AUTO ARMED · " : "NONE OWNED · ") +
    "100% protection ×" +
    own +
    "</span>";
};

/* Poison mechanics remain visible in combat, but their numerical caps are hidden from item text
   and the character panel. */
celestialEffectDescription = function (g) {
  const n = celestialEffectName(g);
  if (!n) return "";
  if (n === "Freeze")
    return (
      "Freeze · every 10 Frost applications freeze for " +
      (1.5 * celestialAmp(g)).toFixed(1) +
      "s · fixed 10s cooldown"
    );
  if (n === "Combust")
    return (
      "Combust · Burn ticks ×" +
      combustTickMult(g).toFixed(1) +
      " · " +
      combustChance(g).toFixed(1) +
      "% permanent stack chance · " +
      combustBurstMult(g).toFixed(0) +
      " tick burst"
    );
  if (n === "Disease")
    return (
      "Disease · Poison ticks twice · stacks decay " +
      scaledEffect(g, "poison", 3, 30, 45).toFixed(0) +
      "% slower · spreads on death"
    );
  if (n === "Demise")
    return "Demise · +" + demiseCritPct(g).toFixed(0) + "% crit chance · resistances weakened";
  return "Bloodthirst · heal " + bloodthirstHealPct(g).toFixed(0) + "% of Bleed burst damage";
};
