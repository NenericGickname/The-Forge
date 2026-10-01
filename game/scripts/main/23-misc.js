/* Helpers that do not belong to one system. */

function cvar(v) {
  return getComputedStyle(document.documentElement).getPropertyValue(v).trim();
}

function catOf(s) {
  return STATCAT[s] || "util";
}

function resPct(pts) {
  pts = Math.max(0, pts);
  return Math.round(((88 * pts) / (pts + 120)) * 10) / 10;
}

function cdrPct(pts) {
  pts = Math.max(0, pts || 0);
  return Math.round(((45 * pts) / (pts + 90)) * 10) / 10;
}

function maxFinalRoll(g, stat) {
  const copy = JSON.parse(JSON.stringify(g));
  copy.stats[stat] = maxBaseRoll(copy, stat);
  return gStat(copy, stat);
}

function isMaxRoll(g, stat) {
  if (!g || !(stat in g.stats)) return false;
  const max = maxBaseRoll(g, stat),
    raw = g.stats[stat] || 0,
    tol = PERCENT.has(stat) || stat === "healCdr" ? 0.11 : 0.51;
  return raw >= max - tol;
}

function effectRatio(g, stat) {
  if (!g || !g.stats || !g.stats[stat]) return 0;
  return Math.max(0, Math.min(1, (g.stats[stat] || 0) / Math.max(1, maxBaseRoll(g, stat))));
}

function scaledEffect(g, stat, min, max, cap) {
  return Math.min(
    cap == null ? max * 1.5 : cap,
    (min + (max - min) * effectRatio(g, stat)) * celestialAmp(g)
  );
}

function combustChance(g) {
  return 5 + 10 * effectRatio(g, "burn") + 15 * celestialProgress(g);
}

function combustBurstMult(g) {
  return 20 + 10 * celestialProgress(g);
}

function finite(v, min, max, fallback) {
  v = Number(v);
  return Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback;
}

function int(v, min, max, fallback) {
  return Math.round(finite(v, min, max, fallback));
}

function numericMap(raw, allowed, max) {
  const out = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return out;
  Object.keys(raw).forEach(k => {
    if ((!allowed || allowed.has(k)) && Number.isFinite(Number(raw[k]))) out[k] = finite(raw[k], 0, max, 0);
  });
  return out;
}

function percentScale(stat, level) {
  var f = 0.2,
    a = 100,
    l = Math.max(1, level || 1);
  return Math.min(1, Math.max(f, f + ((1 - f) / a) * l));
}

function holyMissionV36(n) {
  return Math.floor(
    Math.max(0, n) * (S.gear.amulet && S.gear.amulet.mythicAffix === "holyMission" ? 1.25 : 1)
  );
}

function setupV41UI() {
  if (!$("deathrecapv41")) {
    const d = document.createElement("div");
    d.id = "deathrecapv41";
    d.className = "deathrecapv41";
    $("deadok").insertAdjacentElement("beforebegin", d);
  }
  if (!$("dummymeterv41")) {
    const d = document.createElement("div");
    d.id = "dummymeterv41";
    d.className = "dummymeterv41";
    $("bossbubble").insertAdjacentElement("afterend", d);
  }
  const style = document.createElement("style");
  style.textContent = `
 html,body{min-height:100dvh}body{align-items:flex-start;padding:5px 0;overflow-x:hidden}#wrap{width:min(1080px,calc(100vw - 190px));max-width:none;padding:6px 10px}#cv{height:clamp(180px,28dvh,220px);object-fit:fill}.battle{padding:9px 11px}.statusfloatv41{font-size:12px!important;z-index:7;text-shadow:0 1px 3px #000,0 0 7px currentColor;animation:statusfanV41 1.18s ease-out forwards;transform:translateX(-50%)}@keyframes statusfanV41{0%{opacity:0;transform:translateX(-50%) translateY(8px) scale(.86)}12%{opacity:1;transform:translateX(-50%) translateY(0) scale(1.05)}72%{opacity:1;transform:translateX(-50%) translateY(-7px)}100%{opacity:0;transform:translateX(-50%) translateY(-22px)}}
 .trainingtilev41{border-color:#8b7137!important;box-shadow:inset 0 0 13px #ffcf5c18}.dummymeterv41{display:none;margin:7px 0;padding:8px;border:1px solid #6c5630;border-radius:8px;background:#0b0a0dcc}.dummymeterv41.on{display:block}.dummyheadv41{display:flex;justify-content:space-between;gap:12px;color:#cbbfae;font-size:10px}.dummyheadv41 b{color:#ffe09a;letter-spacing:1px}.dummyrowsv41{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;margin-top:6px}.dummyrowv41{display:grid;grid-template-columns:1fr auto auto;gap:7px;align-items:center;border-left:3px solid var(--dc);background:#ffffff08;padding:4px 6px;font-size:9px}.dummyrowv41 b{color:#fff}.dummyrowv41 small{color:#9c9388}
 #dead{padding:14px;justify-content:flex-start;overflow-y:auto}.deathrecapv41{width:min(920px,100%);display:grid;grid-template-columns:150px 1fr 1fr;gap:10px;margin-top:8px;text-align:left}.killerframev41,.recapcolumnv41{border:1px solid #ffffff18;border-radius:9px;background:#100c12;padding:8px}.killerframev41{text-align:center}.killerframev41 img,.killerfallbackv41{width:128px;height:100px;display:block;object-fit:cover;margin:0 auto 6px;border:1px solid #69434a;border-radius:7px;background:#171019}.killerfallbackv41{font-size:48px;line-height:100px}.killerframev41 small,.killerframev41 b{display:block}.killerframev41 small{font-size:8px;color:#ff7d89;letter-spacing:2px}.killerframev41 b{font-size:11px;color:#fff;margin-top:3px}.recapcolumnv41 h3{font-size:10px;letter-spacing:.8px;margin-bottom:5px}.recapcolumnv41.damage h3{color:#ff8c91}.recapcolumnv41.healing h3{color:#79dda0}.recaprowv41{display:grid;grid-template-columns:20px 1fr auto;gap:5px;align-items:center;padding:4px 0;border-top:1px solid #ffffff0e;font-size:9px}.recaprowv41 span small,.recaprowv41 b small{display:block;color:#817986;font-size:7px}.recaprowv41 b{text-align:right;color:#fff}.recapemptyv41{color:#6f6872;font-size:9px;padding:7px 0}
 .skover{padding:8px;overflow:hidden}.skbox{width:min(1000px,calc(100vw - 18px));max-width:none;max-height:calc(100dvh - 16px);overflow:auto}.compbox{max-width:1000px;max-height:calc(100dvh - 16px)}.shopscene{max-height:calc(100dvh - 10px);align-items:center}.shopscene .shopbox{max-height:calc(100dvh - 14px)!important;overflow:auto!important}.shopcatalog{overflow:visible!important}.shopkeeperbubble{max-width:min(300px,70vw)}
 @media(max-height:780px) and (min-width:701px){.panel{padding:7px;margin-bottom:5px}.slot{min-height:76px;padding:6px}.slot .stat,.slot .sloff,.slot .sldef,.slot .slutil{font-size:9px;line-height:1.3}#town,#town .col{gap:5px}.shopcard{min-height:80px;padding:6px 8px}.shopcard .sd{line-height:1.2}.shopbox{padding:8px}.shopbox .skhead{padding-bottom:5px;margin-bottom:5px}button{padding:7px 9px}.skbox{padding:9px}.branches{gap:5px}.branch{padding:5px}.node .ntip{bottom:37px}}
 @media(max-width:700px){body{padding:2px 0}#wrap{width:100vw;max-width:100vw;padding:4px}#cv{height:clamp(165px,27dvh,195px)}.battle{padding:7px}.deathrecapv41{grid-template-columns:1fr}.killerframev41{display:grid;grid-template-columns:76px 1fr;align-items:center;text-align:left}.killerframev41 img,.killerfallbackv41{grid-row:1 / 3;width:68px;height:58px;line-height:58px;margin:0}.dummyrowsv41{grid-template-columns:1fr}.hprow{gap:6px}.hpwrap{width:50%}.runbtns{margin-top:6px}}
 `;
  document.head.appendChild(style);
  const toggle = $("sptoggle");
  if (toggle)
    toggle.addEventListener(
      "click",
      () => {
        $("statpanel").dataset.manualV41 = "1";
      },
      true
    );
  const fit = () => {
    const p = $("statpanel");
    if (!p || p.dataset.manualV41) return;
    if (innerWidth < 1020) {
      p.classList.add("folded");
      $("sptoggle").textContent = "◀";
    } else {
      p.classList.remove("folded");
      $("sptoggle").textContent = "▶";
    }
  };
  window.addEventListener("resize", fit);
  fit();
}

function averageRaw(g, stat) {
  return maxBaseRollBeforeV45(g, stat) / 1.3;
}

function accessory(g) {
  return !!(g && (g.slot === "gloves" || g.slot === "amulet"));
}

/* Reforging uses the full uniform roll interval. Base stats never reroll and do not show a lock. */
function immutableBaseV54(g, stat) {
  const sd = g && SLOTS.find(s => s.key === g.slot);
  return !!(sd && sd.main === stat);
}

/* V60 · Restore the former Blood Growth balance and expose progress against both caps. */
function bloodCapV60(g) {
  const level = Math.max(1, Number(g && g.ilvl) || 1),
    cel = Math.max(0, Number(g && g.celestial) || 0);
  return Math.max(1, Math.floor(level * (2 + 0.3 * cel)));
}

// Boot with local-save restore.
// Earlier version of initV5(), extended by the functions that follow.
function initBase() {
  let prevResult82;
  prev82: {
    let prevResult175;
    prev175: {
      let prevResult81;
      const loaded = loadGame();
      if (!loaded) {
        S = defaultState();
        S.gear.weapon = makeGear("weapon", 1, 0);
      }
      migrateSkillTree();
      migrateItemVariants();
      migrateEnrage();
      migrateWeapons();
      migrateDaggerAffixes();
      migrateForgeMilestones();
      migrateMythicBalance();
      migrateItemDistribution();
      migrateXpBuff();
      migrateXpCurve();
      migrateXpCurveV33();
      migrateXpCurveV34();
      migrateCritBalance();
      migrateEndArea();
      renderTown();
      renderStatPanel();
      setInterval(() => saveGame(true), 5000);

      const result = prevResult81;
      migrateItems();
      ensureAudioState();
      renderTown();
      renderStatPanel();
      updateAudioModal();
      scheduleSave();
      prevResult175 = result;
      break prev175;
    }
    const result = prevResult175;
    migrateCombatCapstonesV56();
    renderTown();
    renderStatPanel();
    scheduleSave();
    prevResult82 = result;
    break prev82;
  }
  const result = prevResult82;
  const panel = $("guardiancheckpoint");
  if (panel) panel.classList.remove("on");
  return result;
}

// Earlier version of initV5(), extended by the functions that follow.
function init() {
  let prevResult83;
  prev83: {
    const result = initBase(),
      repaired = repairAbyssRushProgress();
    if (repaired) {
      renderTown();
      scheduleSave();
    }
    prevResult83 = result;
    break prev83;
  }
  const result = prevResult83;
  ensureTreeMastery();
  renderTree();
  renderTown();
  return result;
}

function rname(i) {
  var k = (RAR[i] && RAR[i].k) || "";
  return k.charAt(0).toUpperCase() + k.slice(1);
}

function rcol(i) {
  try {
    return getComputedStyle(document.documentElement).getPropertyValue(RAR[i].col).trim() || "#ccc";
  } catch (e) {
    return "#ccc";
  }
}

function poolMax() {
  // mythic (index 5) only appears once celestial content is reached
  var cel = false;
  try {
    cel = !!(
      window.S &&
      (S.abyssUnlocked || S.celestialCleared || (S.flags && (S.flags.abyss || S.flags.celestial)))
    );
  } catch (e) {}
  return Math.min(RAR.length - 1, cel ? 5 : 4);
}

function ensureHistory(g, source) {
  if (!g || typeof g !== "object") return null;
  if (!g.itemIdV70) g.itemIdV70 = "i" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  g.historyV70 = Object.assign(
    {
      foundIn: "Legacy collection",
      source: "Unknown",
      acquiredAt: Date.now(),
      kills: 0,
      bosses: 0,
      highestHit: 0,
      victories: []
    },
    g.historyV70 || {},
    source || {}
  );
  if (!Array.isArray(g.historyV70.victories)) g.historyV70.victories = [];
  return g.historyV70;
}

function rawDelta(g) {
  const cur = g && S.gear && S.gear[g.slot];
  if (!g) return 0;
  if (!cur) return Infinity;
  return (gpower(g) - gpower(cur)) / Math.max(1, gpower(cur));
}

/* Progressive Mythic archive and Bestiary research. */
function tendency(v) {
  return v >= 1.3 ? "Very high" : v >= 1.08 ? "High" : v <= 0.78 ? "Low" : "Average";
}

function q_v7(id, cat, icon, name, desc, reward, mode, target, after, hidden) {
  QV74.push({ id, cat, icon, name, desc, reward, mode, target, after, hidden: !!hidden });
}

function pctV74(x) {
  const goal = Math.max(1, questGoal(x)),
    v = Math.min(goal, questValue(x));
  return { v, goal, p: Math.max(0, Math.min(1, v / goal)) };
}

function genericDefenseBase(level) {
  return 1 + 0.08 * Math.pow(Math.max(1, level), 1.65);
}

/* V77 · Progressive feature unlocks and quest tracking corrections. */
function clearedV77(areaNumber) {
  return (S.clearedAreas || []).includes(Math.max(0, areaNumber - 1));
}

function regularSpendV78() {
  return Object.values(S.skills || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function sourceArray(ref) {
  return ref.kind === "loot" ? S.bag : ref.kind === "gearbag" ? S.gearBagV82 : null;
}

function elemAmpMul(hs) {
  var a = (hs && hs.elementAmp) || 0;
  var T = (typeof window !== "undefined" && window.__abyssTune) || {};
  return 1 + Math.min(T.ampCap != null ? T.ampCap : 400, a) / 100;
}

/* V101 — explain the locking mechanic the 5th time loot is opened */
function F_v101() {
  S.flags = S.flags || {};
  return S.flags;
}

/* V100 — first-time coaching popups: reaching +10, first weapon effect / rage, area mastery */
function F_v101_2() {
  S.flags = S.flags || {};
  return S.flags;
}

function checkRage() {
  var f = F_v101_2();
  if (f.seenRageV100) return false;
  if (
    !allItems().some(function (g) {
      return g.stats && (g.stats.enrage || 0) > 0;
    })
  )
    return false;
  if (
    show_v101(
      "😡 RAGE · see red",
      "You rolled <b>Rage</b>. Every so often you fly into a <b>fury</b> and swing much faster for a few seconds. It is exactly as productive as it sounds, and far more satisfying."
    )
  ) {
    f.seenRageV100 = true;
    try {
      scheduleSave();
    } catch (e) {}
    return true;
  }
  return false;
}

/* V110 · Combat pause while any popup is open + relocate the first-retreat explainer to after the first combat. */
function blockedV110() {
  try {
    if (typeof modalBusy === "function" && modalBusy()) return true;
  } catch (e) {}
  try {
    var ids = [
      "tipmodal",
      "clear",
      "huntchoice",
      "guildcheckpoint",
      "lootopen",
      "lootresults",
      "levelupv110",
      "lvlupmodal"
    ];
    for (var i = 0; i < ids.length; i++) {
      var e = document.getElementById(ids[i]);
      if (e && e.classList && e.classList.contains("on")) return true;
    }
  } catch (e) {}
  return false;
}

function nf(x) {
  x = Math.round(x * 10) / 10;
  return x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
}

function nowT() {
  return (typeof run !== "undefined" && run && run.time) || 0;
}

function a_v114() {
  try {
    return (S && S.actV111) || null;
  } catch (e) {
    return null;
  }
}

function neutralize() {
  try {
    var o = window.forgeV79 && window.forgeV79.state && window.forgeV79.state();
    if (o) {
      o.seen = o.seen || {};
      o.seen.level = true;
      if (o.activeTarget === "skillTree" || o.activeTarget === "heal") o.activeTarget = null;
    }
    document.querySelectorAll(".coacharrowv79").forEach(function (x) {
      x.remove();
    });
    var bt = document.getElementById("opentree");
    if (bt) bt.classList.remove("coachmarkv79");
  } catch (e) {}
}

function check() {
  try {
    var s = a_v114();
    if (!s) return;
    if (heroLv() >= 2 && !s._lv2seen) {
      s._lv2seen = true;
      s._lv2guide = true;
      try {
        scheduleSave();
      } catch (e) {}
      try {
        if (typeof showTip === "function")
          showTip(
            "UNLOCK A NEW ACTIVE SKILL",
            "You started with <b>💚 Heal</b> ready to go, and you have now earned an <b>active skill point</b>.<br><br>Open the <b>Skill Tree</b>, switch to the <b>Active</b> tab, and spend a point on any skill (Berserk, Rage, Ninja…) to <b>unlock</b> it. Then you can equip it."
          );
      } catch (e) {}
    }
    neutralize();
    if (guideActive() && !modalOpen()) show_v114();
    else hide();
  } catch (e) {}
}

/* V115 · Number hotkeys 1-4 fire the selected loadout skills. */
function typing(t) {
  if (!t) return false;
  var n = (t.tagName || "").toLowerCase();
  return n === "input" || n === "textarea" || n === "select" || t.isContentEditable;
}

/* V116 · Save-file (Export / LOAD FILE) round-trip fixes.
   The portable save format was never extended to carry three modern systems, so
   downloading a save and loading it back silently dropped them:
     • the Active skill tree (actV111 + unspent active points spA) -> active skills reset
     • the seen-popup + migration flags kept in S.flags               -> first-time popups
       (heal / first-battle / retreat / area-mastery) re-appeared, and the weaponsV18
       migration marker was lost so migrateWeaponsV18 re-ran on import and rewrote every
       great axe into a sword
     • questV74.accepted                                              -> accepted quests
       came back un-accepted; their progress persisted, so re-accepting finished them at once
   This block (a) hardens migrateWeaponsV18 so it can never rewrite a great axe again and
   (b) carries the dropped state through export and restores it on import. The in-browser
   localStorage save was never affected and is left untouched. */
function deep(o) {
  try {
    return JSON.parse(JSON.stringify(o == null ? null : o));
  } catch (e) {
    return null;
  }
}
