/* ================= script block 14 ================= */

/* V85 · Early forge shard economy correction. */
window.__forgeV7Boot = "v85 starting";

/* ==== upCost ==== */
/* ==== upCost ==== */
/* ==== upCost ==== */
/* ==== upCost ==== */
/* ---- (patch scope opened) ---- */

/* ==== upCost ==== */
/* ==== upCost ==== */
/* ---- upCost: later layers (moved here) ---- */

// ============ V7 CLARITY / CASTING ==========
const upCostBase = upCost;
upCost = function (g) {
  let prevResult154;
  prev154: {
    const c = upCostBase(g);
    if ((g.plus || 0) < 10) c.shards = 0;
    prevResult154 = c;
    break prev154;
  }
  const c = prevResult154;
  if (g && g.rar === 5) {
    c.cshards = Math.max(1, Math.ceil((1 + Math.floor((g.plus || 0) / 5)) * skillBonuses().forgeCost));
    c.shards = 0;
  }
  return c;
};
const upCostBeforeV41 = upCost;
upCost = function (g) {
  let prevResult155;
  prev155: {
    const c = upCostBeforeV41(g);
    if (!g || g.rar !== 5) {
      prevResult155 = c;
      break prev155;
    }
    const il = Math.max(1, Number(g.ilvl) || 1),
      p = Math.max(0, Number(g.plus) || 0),
      fc = skillBonuses().forgeCost;
    c.gold = Math.max(c.gold, Math.round(il * (120 + p * 45) * Math.pow(1.1, p) * fc));
    c.shards = Math.ceil((40 + il * 2.2) * Math.pow(1.16, p) * fc);
    c.esh = Math.ceil((2 + il / 35) * Math.pow(1.12, p) * fc);
    c.cshards = p >= 10 ? Math.max(1, Math.ceil((1 + Math.floor((p - 10) / 3)) * fc)) : 0;
    prevResult155 = c;
    break prev155;
  }
  const c = prevResult155;
  if (!g || g.rar === 5 || !c.shards || (g.plus || 0) < 10) return c;
  const p = Math.max(10, Math.min(20, Number(g.plus) || 0));
  const shardFactor = p <= 15 ? 0.8 : 0.8 + (p - 15) * 0.04;
  const il = Math.max(1, Number(g.ilvl) || 1);
  const ilvlFactor = Math.max(0.55, Math.min(1, 0.55 + il * 0.018));
  c.shards = Math.max(1, Math.round(c.shards * shardFactor * ilvlFactor));
  return c;
};

const salvageValueBase = salvageValueV12;
salvageValueV12 = function (g) {
  return salvageValueBase(g);
};
salvageValueV10 = salvageValueV12;

document.querySelector("h1 .polishbadgev70") &&
  (document.querySelector("h1 .polishbadgev70").textContent = "V7.15.0");
document.title = "THE FORGE v7.15.0";
window.__forgeV7Boot = "ready";
window.forgeV85 = { upgradeCost: g => upCost(g), salvageValue: g => salvageValueV12(g) };

window.swordPierceFracV90 = swordPierceFrac;

/* ==== slotStatLines ==== */
/* ==== slotStatLines ==== */
/* ==== slotStatLines ==== */
/* ==== slotStatLines ==== */
/* ==== slotStatLines ==== */
/* ==== slotStatLines ==== */
const slotStatLinesBase = slotStatLines;
slotStatLines = function (g) {
  let prevResult79;
  prev79: {
    const base = slotStatLinesBase(g),
      extra = celestialEffectName(g);
    prevResult79 = base + (extra ? '<div class="slutil" style="color:#9fd8ff">✦5 ' + extra + "</div>" : "");
    break prev79;
  }
  const base = prevResult79;
  const info = mythicInfo(g);
  return (
    base +
    (info
      ? '<div class="slutil mythicaffix ' +
        (g.mythicAffix === "swagger" ? "rainbow" : "") +
        '">✺ ' +
        info[0] +
        "</div>"
      : "")
  );
};
const slotStatLinesBeforeV51 = slotStatLines;
slotStatLines = function (g) {
  let prevResult80;
  prev80: {
    prevResult80 = slotStatLinesBeforeV51(g).replace(/★(?=\+)/g, "");
    break prev80;
  }
  let html = prevResult80;
  if (!g || !g.growth) return html;
  const gr = growthValues(g),
    maxed = gr.kills >= 500 ? " · MAXED" : "";
  html = html.replace(/🩸\+[^ ]+ Growth Atk/, "🩸 " + gr.atk + " / " + gr.cap + " Growth Atk" + maxed);
  html = html.replace(/❤️\+[^ ]+ Growth HP/, "❤️ " + gr.hp + " / " + gr.capHp + " Growth HP" + maxed);
  return html;
};
const _b = slotStatLines;
slotStatLines = function (g) {
  let h = _b(g);
  try {
    const pf = swordPierceFrac(g);
    if (pf > 0)
      h += '<div class="sloff" style="color:#ffb07c">Armor Pierce ' + Math.round(pf * 100) + "%</div>";
  } catch (e) {}
  return h;
};

document.title = "THE FORGE v7.15.0";
window.__forgeV7Boot = "ready";

/* ================= script block 16 ================= */

/* V92 — Elemental enemy attacks mitigated by elemental resistance */
/* ---- (patch scope opened) ---- */
var ELEM_MAP = {
  frostmite: "ice",
  icebound: "ice",
  rimeknight: "ice",
  snowstalker: "ice",
  reefstalker: "ice",
  drowned: "ice",
  skeleton: "ice",
  serpent: "ice",
  cinderimp: "fire",
  magmahound: "fire",
  drakekin: "fire",
  emberwing: "fire",
  hellspawn: "fire",
  demon: "fire",
  slime: "fire",
  voidling: "lightning",
  abyssaleye: "lightning",
  starborn: "lightning",
  astralseer: "lightning",
  revenant: "lightning"
};
window.enemyDmgProfileV91 = enemyDmgProfile;
window.elemAmpMulV93 = elemAmpMul;

/* ==== gStat ==== */
const gStatBeforeV80 = gStat;
/* element amp gains only a fraction of forge scaling, so a forged piece is not a status monster */
/* ---- (patch scope opened) ---- */
gStat = function (g, stat) {
  let prevResult199;
  prev199: {
    const value = gStatBeforeV80(g, stat);
    prevResult199 = g && g.wtype === "greataxe" && stat === "atk" ? value * GREAT_AXE_DAMAGE_BOOST : value;
    break prev199;
  }
  var v = prevResult199;
  if (stat === "elementAmp" && g && g.stats) {
    var d = g.stats.elementAmp || 0,
      TA = (typeof window !== "undefined" && window.__abyssTune) || {};
    v = d + (v - d) * (TA.ampForge != null ? TA.ampForge : 0.6);
  }
  return v;
};

["weapon", "gloves", "amulet", "helm"].forEach(function (k) {
  var sd = SLOTS.filter(function (s) {
    return s.key === k;
  })[0];
  if (sd && sd.affixes && sd.affixes.indexOf("elementAmp") < 0) sd.affixes.push("elementAmp");
});

/* ================= script block 17 ================= */

/* V91 — Endgame playtest becomes an item-inspection test character (playtest "End game") */
(function () {
  "use strict";
  if (typeof requestPlaytestPresetV20 !== "function") return;
  function buildTestCharV91() {
    try {
      S.playtestPreset = "late";
      S.developerMode = false;
      S.heroLevel = 100;
      S.xp = 0;
      S.sp = Math.max(Number(S.sp) || 0, 100);
      S.gold = 100000000;
      S.shards = 100000000;
      S.epicShards = 100000000;
      S.celestialShards = 100000000;
      S.skullTokens = Math.max(Number(S.skullTokens) || 0, 1000);
      S.abyssTokens = Math.max(Number(S.abyssTokens) || 0, 1000);
      S.slotsOpen = SLOTS.length;
      S.autoSalvageRar = -1;
      S.areaMax = AREAS.length - 1;
      S.clearedAreas = Array.from({ length: AREAS.length }, function (_x, i) {
        return i;
      });
      S.gear = {};
      SLOTS.forEach(function (sd) {
        var g =
          sd.key === "weapon" ? makePresetWeapon("sword", "bleed", 100, 20, 5) : makeGear(sd.key, 100, 4);
        g.plus = 20;
        if (sd.key !== "weapon") g.celestial = 5;
        delete g.broken;
        S.gear[sd.key] = g;
      });
      var ilvls = [1, 10, 30, 60, 90, 120],
        rarities = [0, 1, 2, 3, 4],
        wtypes = ["sword", "bow", "dagger"],
        armour = ["armor", "helm", "gloves", "boots", "amulet"];
      var bag = [];
      ilvls.forEach(function (il) {
        rarities.forEach(function (rr) {
          wtypes.forEach(function (wt) {
            try {
              var w = makeWeapon(il, rr, wt);
              if (w) {
                w.plus = 0;
                w.celestial = 0;
                delete w.broken;
                bag.push(w);
              }
            } catch (e) {}
          });
          armour.forEach(function (sl) {
            try {
              var g = makeGear(sl, il, rr);
              if (g) {
                g.plus = 0;
                g.celestial = 0;
                delete g.broken;
                bag.push(g);
              }
            } catch (e) {}
          });
        });
      });
      S.bag = bag;
      S.bagCap = Math.max(bag.length + 40, 400);
      S.sel = "weapon";
      try {
        saveGame(true);
      } catch (e) {}
      try {
        beep(720, 0.1, "triangle");
      } catch (e) {}
      try {
        flash("#9fd8ff");
      } catch (e) {}
      try {
        renderTown();
      } catch (e) {}
      try {
        renderStatPanel();
      } catch (e) {}
      try {
        showTip(
          "TEST CHARACTER LOADED",
          "Level 100, 100M of every currency, and one of every item at item levels 1, 10, 30, 60, 90 and 120 across every rarity in the bag."
        );
      } catch (e) {}
    } catch (e) {
      try {
        showTip("PLAYTEST ERROR", String((e && e.message) || e));
      } catch (_e) {}
    }
  }
  try {
    window.buildTestCharV91 = buildTestCharV91;
  } catch (e) {}
  /* The code check for this preset now lives in requestPlaytestPresetV20 (V20 file). */
  try {
    if (typeof renderPlaytestPanel === "function") renderPlaytestPanel();
  } catch (e) {}
})();

/* ================= script block 18 ================= */

/* V94 — duck the background music while a special boss-role reel is being resolved, restore it on leave */
/* ---- (patch scope opened) ---- */
var TRACKS = ["musInonoV50", "musDjartV50", "musMoodV50"];
var raf = null,
  ducked = false;
window.__duckMusicV94 = function () {
  ducked = true;
  ramp(baseVol() * 0.16, 420);
};
window.__unduckMusicV94 = function () {
  if (!ducked) return;
  ducked = false;
  ramp(baseVol(), 750);
};
/* duck the moment a boss-role reel spins */
try {
  if (typeof window.bossReelV67 === "function") {
    var _br = window.bossReelV67;
    window.bossReelV67 = function (rar, cb) {
      try {
        window.__duckMusicV94();
      } catch (e) {}
      return _br.call(this, rar, cb);
    };
  }
} catch (e) {}
/* restore when the player leaves or re-runs from the loot screen (only matters if a role was activated) */
["lootleave", "lootrerun"].forEach(function (id) {
  var el = document.getElementById(id);
  if (el)
    el.addEventListener(
      "click",
      function () {
        try {
          window.__unduckMusicV94();
        } catch (e) {}
      },
      true
    );
});

/* ================= script block 19 ================= */

/* V96 — ease the early-game wall: lower regular-enemy health in stages 2, 3 and 4 */
(function () {
  "use strict";
  if (typeof buildFoe !== "function") return;
  var EARLY_HP = { 1: 0.8, 2: 0.65, 3: 0.78 }; // area index -> regular-enemy HP multiplier (stage 2,3,4)
  var _bf = buildFoe;
  buildFoe = function (key, lvl, hpMul, boss, name) {
    var f = _bf(key, lvl, hpMul, boss, name);
    try {
      if (
        f &&
        !boss &&
        typeof run !== "undefined" &&
        run &&
        !run.hunt &&
        !(run.a && run.a.abyss) &&
        Number.isInteger(run.ai)
      ) {
        var m = EARLY_HP[run.ai];
        if (m) {
          f.max = Math.max(1, Math.round(f.max * m));
          f.hp = f.max;
        }
      }
    } catch (e) {}
    return f;
  };
})();
var st_v97 = document.createElement("style");
st_v97.textContent =
  ".boonv97{position:relative;display:inline-flex;align-items:center;font-size:19px;margin-right:5px;vertical-align:middle}" +
  ".boonstarsv97{display:inline-flex;flex-direction:column;align-items:center;justify-content:center;margin-left:2px}" +
  ".boonstarsv97 i{display:block;font-style:normal;font-size:7.5px;line-height:.95;color:var(--gold)}.boonstarsv97 i.pl{font-size:9px;line-height:1}";
document.head.appendChild(st_v97);
window.__rbbV97 = renderBoonBar;

renderBoonBar();

/* V102 — projectile casters: fire / ice / chaos mages and hags, appearing from stage 5 */
(function () {
  "use strict";
  if (typeof ENEMIES === "undefined" || typeof buildFoe !== "function" || typeof tick !== "function") return;
  // new enemies
  var NEW = {
    firemage: {
      n: "Fire Mage",
      c: "#c9542a",
      sz: 0.98,
      shape: "biped",
      hpM: 0.66,
      atkM: 1.0,
      defM: 0.5,
      res: { fire: 0.55, ice: -0.45, lightning: 0 }
    },
    icemage: {
      n: "Ice Mage",
      c: "#3f8fca",
      sz: 0.98,
      shape: "biped",
      hpM: 0.66,
      atkM: 1.0,
      defM: 0.5,
      res: { fire: -0.45, ice: 0.55, lightning: 0 }
    },
    chaosmage: {
      n: "Chaos Mage",
      c: "#1f7a48",
      sz: 1.0,
      shape: "biped",
      hpM: 0.72,
      atkM: 1.05,
      defM: 0.5,
      res: { fire: 0, ice: 0, lightning: 0.3 }
    },
    hag: {
      n: "Hag",
      c: "#5a2f7a",
      sz: 1.0,
      shape: "ghost",
      hpM: 0.82,
      atkM: 1.1,
      defM: 0.55,
      res: { fire: -0.2, ice: -0.2, lightning: 0.2 }
    }
  };
  try {
    Object.assign(ENEMIES, NEW);
  } catch (e) {}
  var ORB = { firemage: "#ff8a3a", icemage: "#7fd6ff", chaosmage: "#4ee08a", hag: "#c46bff" };
  // casters are NOT added to the base pools (that flooded spawns); they are injected at a low rate in nextWave below
  // projectile visual: a colored streak from caster to the hero
  function shootV102(f, col) {
    var ar = run,
      sx = f._x,
      sy = GY - 30,
      tx = 150,
      ty = GY - 27;
    for (var i = 0; i < 9; i++) {
      (function (i) {
        setTimeout(function () {
          if (run !== ar || ar.over) return;
          var t = (i + 1) / 9;
          particles.push({
            x: sx + (tx - sx) * t,
            y: sy + (ty - sy) * t - Math.sin(t * Math.PI) * 18,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.2,
            life: 0.6,
            sz: 3.4,
            col: col
          });
        }, i * 40);
      })(i);
    }
    try {
      beep(300, 0.09, "sawtooth", 0.05);
    } catch (e) {}
  }
  function land(f, fn) {
    setTimeout(function () {
      if (!run || run.over || f.hp <= 0) return;
      fn();
      try {
        drawBars();
      } catch (e) {}
    }, 420);
  }
  function castFire(f) {
    shootV102(f, ORB.firemage);
    land(f, function () {
      var d = Math.max(2, f.atk * (f.elite ? 0.5 : 0.38));
      abilityHitHero(d, "🔥 SCORCH", "#ff8a3a", "fire");
      if (!run || run.over) return;
      run.heroBurnUntilV102 = Math.max(run.heroBurnUntilV102 || 0, run.time + 3000);
      run.heroBurnDmgV102 = Math.max(run.heroBurnDmgV102 || 0, Math.max(1, f.atk * (f.elite ? 0.14 : 0.1)));
    });
  }
  function castIce(f) {
    shootV102(f, ORB.icemage);
    land(f, function () {
      var d = Math.max(2, f.atk * (f.elite ? 0.44 : 0.34));
      abilityHitHero(d, "❄ CHILL", "#7fd6ff", "ice");
      if (!run || run.over) return;
      run.chillV102 = Math.min(5, (run.chillV102 || 0) + 1);
      floatDmg("hero", "❄ CHILL x" + run.chillV102, 0, "#7fd6ff");
    });
  }
  function castChaos(f) {
    shootV102(f, ORB.chaosmage);
    land(f, function () {
      var d = Math.max(3, Math.round(run.hero.max * 0.02));
      abilityHitHero(d, "☠ DRAIN", "#4ee08a");
      if (!run || run.over) return;
      var heal = Math.round(d * 1.6);
      f.hp = Math.min(f.max, f.hp + heal);
      floatDmg("foe", "✚ " + heal, 0, "#4ee08a", f._x);
      run.chaosStealV102 = (run.chaosStealV102 || 0) + 1;
      if (run.chaosStealV102 >= 5) {
        run.chaosStealV102 = 0;
        var burst = Math.round(f.max * 0.25);
        f.hp = Math.min(f.max, f.hp + burst);
        floatDmg("foe", "✚✚ " + burst, 0, "#7dffb0", f._x);
        try {
          flash("#1c5c34");
        } catch (e) {}
      }
    });
  }
  function castHag(f) {
    shootV102(f, ORB.hag);
    land(f, function () {
      var d = Math.max(2, f.atk * (f.elite ? 0.5 : 0.4));
      abilityHitHero(d, "🔮 HEX", "#c46bff");
      if (!run || run.over) return;
      run.hexV102 = Math.min(6, (run.hexV102 || 0) + 1);
      run.hexUntilV102 = run.time + 15000;
      if (run.hexV102 >= 3) floatDmg("hero", "🦴 FRAGILE +" + 15 * (run.hexV102 - 2) + "%", 0, "#d9a7ff");
      else floatDmg("hero", "🔮 HEX x" + run.hexV102, 0, "#c9a0e6");
    });
  }
  var CASTERS = { firemage: castFire, icemage: castIce, chaosmage: castChaos, hag: castHag };
  // Fragile applies only after 3 Hex stacks; each stack beyond the 2nd adds +15% damage taken
  try {
    window.__fragMulV102 = function () {
      var h = (run && run.hexV102) || 0;
      return h >= 3 ? 1 + 0.15 * (h - 2) : 1;
    };
  } catch (e) {}
  // casters shoot a projectile on every attack swing (called from the enemy-attack code)
  try {
    window.__casterShootV102 = function (f) {
      var fn = CASTERS[f && f.key];
      if (fn)
        try {
          fn(f);
        } catch (e) {}
    };
  } catch (e) {}
  // mark casters when built (so their attack fires a projectile instead of a melee swipe)
  var _bf = buildFoe;
  buildFoe = function (key, lvl, hpMul, boss, name) {
    var f = _bf(key, lvl, hpMul, boss, name);
    try {
      if (f && !boss && CASTERS[f.key]) f.castV102 = 1;
    } catch (e) {}
    return f;
  };
  // hag teaser on the last regular wave of Shadow Keep (area index 3)
  if (typeof nextWave === "function") {
    var _nw = nextWave;
    nextWave = function () {
      var r = _nw.apply(this, arguments);
      try {
        // hag teaser on the last regular wave of Shadow Keep
        if (
          run &&
          !run.hunt &&
          !(run.a && run.a.abyss) &&
          run.ai === 3 &&
          run.wave === run.total &&
          !run._hagTeaserV102
        ) {
          run._hagTeaserV102 = true;
          var lvl = run.a.lvl + run.wave - 1,
            h = buildFoe("hag", lvl, 1, false);
          if (h) {
            h._x = typeof foeBaseX === "function" ? foeBaseX(run.foes.length, run.foes.length + 1) : 520;
            run.foes.push(h);
            try {
              buildFoeBars();
              drawBars();
            } catch (e) {}
          }
        }
        // stage 5+ and every Abyss stage: occasionally turn a normal spawn into a caster (all four types).
        // Abyss scaling lives inside buildFoe and abilityHitHero, so an Abyss caster is scaled like its neighbours.
        var abyssRun = !!(run && run.a && run.a.abyss);
        if (run && !run.hunt && (abyssRun || run.ai >= 4) && run.wave <= run.total) {
          var CK = ["firemage", "icemage", "chaosmage", "hag"],
            chg = false;
          for (var i = 0; i < run.foes.length; i++) {
            var ff = run.foes[i];
            if (ff && !ff.boss && !ff.elite && !ff.abyssElite && !CASTERS[ff.key] && Math.random() < 0.15) {
              var c = buildFoe(CK[Math.floor(Math.random() * CK.length)], ff.lvl, 1, false);
              if (c) {
                c._x = ff._x;
                run.foes[i] = c;
                chg = true;
              }
            }
          }
          if (chg)
            try {
              buildFoeBars();
              drawBars();
            } catch (e) {}
        }
      } catch (e) {}
      return r;
    };
  }
  // per-tick: fire casts, burn DoT, chill decay
  var _tick = tick;
  tick = function () {
    try {
      if (run && !run.over) {
        run._burnTV102 = (run._burnTV102 || 0) + 150;
        if (run._burnTV102 >= 500) {
          run._burnTV102 -= 500;
          if (run.heroBurnUntilV102 && run.time < run.heroBurnUntilV102 && run.heroBurnDmgV102 > 0) {
            run.hero.hp -= run.heroBurnDmgV102;
            try {
              floatDmg("hero", "🔥 " + Math.round(run.heroBurnDmgV102), 0, "#ff8a3a");
            } catch (e) {}
            if (run.hero.hp <= 0) {
              try {
                heroDown();
              } catch (e) {}
            }
          }
        }
        run._chillTV102 = (run._chillTV102 || 0) + 150;
        if (run._chillTV102 >= 2600) {
          run._chillTV102 -= 2600;
          if (run.chillV102 > 0) run.chillV102 = Math.max(0, run.chillV102 - 1);
        }
        if (run.hexV102 > 0 && run.hexUntilV102 && run.time > run.hexUntilV102) {
          run.hexV102 = 0;
          run.hexUntilV102 = 0;
        }
      }
    } catch (e) {}
    return _tick.apply(this, arguments);
  };
  // show hero debuffs (fragile / chill / burn) in the status row
  if (typeof updateStatusFx === "function" && typeof fxIcon === "function") {
    var _usf = updateStatusFx;
    updateStatusFx = function () {
      _usf.apply(this, arguments);
      try {
        if (!run) return;
        var he = document.getElementById("herofx");
        if (!he) return;
        var add = "";
        if (run.hexV102 > 0 && run.hexUntilV102 && run.time < run.hexUntilV102) {
          var hf = 1 - (run.hexUntilV102 - run.time) / 15000;
          if (run.hexV102 >= 3) add += fxIcon("🦴", hf, "debuff", run.hexV102 - 2);
          else add += fxIcon("🔮", hf, "debuff", run.hexV102);
        }
        if (run.chillV102 > 0) add += fxIcon("🥶", 0, "debuff", run.chillV102);
        if (run.heroBurnUntilV102 && run.time < run.heroBurnUntilV102)
          add += fxIcon("🔥", 1 - (run.heroBurnUntilV102 - run.time) / 3000, "debuff");
        if (add) he.innerHTML += add;
      } catch (e) {}
    };
  }
  // list the active debuffs (with descriptions) in the character stats panel
  if (typeof renderStatPanel === "function") {
    var _rsp = renderStatPanel;
    renderStatPanel = function () {
      _rsp.apply(this, arguments);
      try {
        if (!run || run.over) return;
        var p = document.getElementById("spbody");
        if (!p) return;
        var rows = "";
        if (run.hexV102 > 0 && run.hexUntilV102 && run.time < run.hexUntilV102) {
          var s = Math.max(0, run.hexV102 - 2),
            secs = Math.ceil((run.hexUntilV102 - run.time) / 1000);
          if (run.hexV102 >= 3)
            rows +=
              '<div class="spmod" style="color:#d9a7ff">🦴 Fragile x' +
              s +
              " · +" +
              15 * s +
              "% damage taken · " +
              secs +
              "s</div>";
          else
            rows +=
              '<div class="spmod" style="color:#c9a0e6">🔮 Hex x' +
              run.hexV102 +
              " · " +
              (3 - run.hexV102) +
              " more → Fragile · " +
              secs +
              "s</div>";
        }
        if (run.chillV102 > 0)
          rows +=
            '<div class="spmod" style="color:#7fd6ff">🥶 Chill x' +
            run.chillV102 +
            " · attacks " +
            10 * run.chillV102 +
            "% slower</div>";
        if (run.heroBurnUntilV102 && run.time < run.heroBurnUntilV102)
          rows +=
            '<div class="spmod" style="color:#ff8a3a">🔥 Burning · ' +
            Math.ceil((run.heroBurnUntilV102 - run.time) / 1000) +
            "s</div>";
        if (rows) p.innerHTML += '<div class="sphd fx" style="color:#ff8a8a">● Debuffs</div>' + rows;
      } catch (e) {}
    };
  }
  // draw a glowing orb above each caster
  if (typeof drawFoe === "function") {
    var _df = drawFoe;
    drawFoe = function (f, cx, gy) {
      _df(f, cx, gy);
      try {
        if (!f || f.dead || !ORB[f.key] || typeof ctx === "undefined") return;
        var x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 18,
          sz = (f.draw && f.draw.sz) || 1,
          col = ORB[f.key],
          hag = f.key === "hag";
        ctx.save();
        // robe glow
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x - 13 * sz, gy);
        ctx.lineTo(x, gy - 32 * sz);
        ctx.lineTo(x + 13 * sz, gy);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
        // staff
        ctx.strokeStyle = hag ? "#4a3a24" : "#6b5233";
        ctx.lineWidth = 3 * sz;
        ctx.beginPath();
        ctx.moveTo(x + 13 * sz, gy - 2);
        if (hag) {
          ctx.lineTo(x + 20 * sz, gy - 28 * sz);
          ctx.lineTo(x + 15 * sz, gy - 46 * sz);
        } else {
          ctx.lineTo(x + 18 * sz, gy - 48 * sz);
        }
        ctx.stroke();
        // orb on the staff, pulses on attack
        var orbX = hag ? x + 15 * sz : x + 18 * sz,
          orbY = hag ? gy - 48 * sz : gy - 50 * sz,
          pulse = 1 + 0.35 * Math.sin(anim.t * 6) + (f.atkA || 0) * 0.7;
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(orbX, orbY, 4.6 * sz * pulse, 0, 7);
        ctx.fill();
        ctx.shadowBlur = 0;
        // hat
        ctx.fillStyle = hag ? "#2c1a44" : col;
        ctx.beginPath();
        if (hag) {
          ctx.moveTo(x - 11 * sz, gy - 39 * sz);
          ctx.lineTo(x - 1 * sz, gy - 61 * sz);
          ctx.lineTo(x - 6 * sz, gy - 55 * sz);
          ctx.lineTo(x + 11 * sz, gy - 39 * sz);
        } else {
          ctx.moveTo(x - 11 * sz, gy - 39 * sz);
          ctx.lineTo(x, gy - 62 * sz);
          ctx.lineTo(x + 11 * sz, gy - 39 * sz);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillRect(x - 13 * sz, gy - 40 * sz, 26 * sz, 3 * sz);
        ctx.restore();
      } catch (e) {}
    };
  }
})();
