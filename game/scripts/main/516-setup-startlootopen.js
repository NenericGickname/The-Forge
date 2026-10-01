/* ==== startLootOpen ==== */
/* ==== startLootOpen ==== */
/* ==== startLootOpen ==== */
/* ==== startLootOpen ==== */
/* ==== startLootOpen ==== */
/* ==== startLootOpen ==== */
const startLootOpenBase = startLootOpen;
startLootOpen = function (onDone) {
  const active = !!(autoRunState && run && run.autoRunV54 && run.over);
  if (!active) return startLootOpenBase(onDone);
  const state = Object.assign({}, autoRunState);
  resolveAutoRunLootV54();
  setTimeout(() => {
    if (autoRunState) launchAutoRunV54(state.ai, state.abyss);
  }, 420);
};
const startLootOpenBeforeV70 = startLootOpen;
startLootOpen = function (onDone) {
  let prevResult200;
  prev200: {
    const active = !!(autoBatch.active && run && run.autoRunV54 && run.over);
    if (!active) {
      prevResult200 = startLootOpenBeforeV70(onDone);
      break prev200;
    }
    const items = prepareRunDrops();
    autoBatch.clears++;
    if (meaningfulAutoLoot(items)) {
      window.forgeV54.stopAutoRun();
      const result = startLootOpenBeforeV70(onDone);
      setTimeout(() => {
        const rows = $("lootresults");
        if (rows) rows.classList.add("meaningfulv70");
      }, 80);
      prevResult200 = result;
      break prev200;
    }
    if (autoBatch.clears >= 5) {
      const clears = autoBatch.clears,
        beforeBag = autoBatch.startBag,
        beforeGold = autoBatch.startGold,
        beforeShards = autoBatch.startShards;
      window.forgeV54.resolveAutoRunLoot();
      window.forgeV54.stopAutoRun();
      if (onDone) onDone();
      setTimeout(
        () =>
          showTip(
            "AUTO RUN REPORT",
            '<span class="autosummaryv70"><b>' +
              clears +
              " areas cleared</b><br>+" +
              fmtCur(S.gold - beforeGold) +
              " gold · +" +
              fmtCur(S.shards - beforeShards) +
              " shards · " +
              Math.max(0, S.bag.length - beforeBag) +
              " items kept</span><br><br>Auto Run paused so you can inspect the results."
          ),
        120
      );
      prevResult200 = undefined;
      break prev200;
    }
    prevResult200 = startLootOpenBeforeV70(onDone);
    break prev200;
  }
  var r = prevResult200;
  try {
    var f = F_v101();
    f.lootOpensV101 = (f.lootOpensV101 || 0) + 1;
    try {
      scheduleSave();
    } catch (e) {}
    if (f.lootOpensV101 >= 5 && !f.seenLockTipV101) {
      setTimeout(function () {
        try {
          var lo = document.getElementById("lootopen"),
            tm = document.getElementById("tipmodal");
          if (lo && lo.classList.contains("on") && !(tm && tm.classList.contains("on"))) {
            showTip(
              "🔒 LOCK WHAT YOU LOVE",
              "Two clicks on a loot result <b>locks</b> it.<br><br>A locked item is <b>kept safe in your bag</b> and ignored by auto-salvage, so a prized drop never gets melted down by accident. Click once to select it, then click again to lock."
            );
            f.seenLockTipV101 = true;
            try {
              scheduleSave();
            } catch (e) {}
          }
        } catch (e) {}
      }, 750);
    }
  } catch (e) {}
  return r;
};
var EFX = {
  bleed: {
    n: "Bleed",
    i: "🩸",
    b: "Your blade leaves cuts that keep leaking. Every few hits the wound <b>bursts</b> for a fat chunk of bonus damage. Death by a thousand papercuts — except the papercuts are furious."
  },
  poison: {
    n: "Poison",
    i: "☠",
    b: "You smear something nasty on your hits. It <b>stacks</b> and ticks their health away over time. Patience is a weapon, and so is being a little bit gross."
  },
  burn: {
    n: "Burn",
    i: "🔥",
    b: "Whatever you hit catches <b>fire</b> and quietly cooks. Hit again to keep it lit. You are legally allowed to whisper 'stay mad' while they smoulder."
  },
  frost: {
    n: "Frost",
    i: "❄",
    b: "Frosty hits that <b>chill</b> the target. Cold enemies are slow, grumpy enemies. Serve revenge, and everything else, cold."
  },
  lightning: {
    n: "Lightning",
    i: "⚡",
    b: "Random hits <b>zap</b> for bonus damage, and later the bolt leaps to nearby foes. It is nature's crowd control, with zero paperwork."
  },
  doom: {
    n: "Doom",
    i: "☾",
    b: "You stack a little countdown of doom. Once it passes their remaining health, they are simply <b>deleted</b>. No health bar survives an appointment with Doom."
  }
};
var st_v99 = document.createElement("style");
st_v99.textContent =
  ".contractriskv88{background:none!important;border:none!important;padding:0!important;min-height:0!important;margin:2px 0 8px!important;color:#ff5a63!important;max-width:80%}" +
  ".contractv70{position:relative;overflow:hidden}" +
  ".cv99sym{position:absolute;top:4px;right:9px;font-size:38px;line-height:1;opacity:.28;pointer-events:none;z-index:0}" +
  ".contractv70>*{position:relative;z-index:1}" +
  ".cv99rew{background:#0e0a13;border:1px solid #2c2338;border-radius:9px;padding:8px 10px;margin:2px 0 9px}" +
  ".cv99row{display:flex;gap:8px;align-items:baseline;font-size:12px;margin:2px 0}" +
  ".cv99row .lbl{color:#9a8ab0;min-width:82px;font-size:10px;letter-spacing:.5px;text-transform:uppercase}" +
  ".cv99row.bounty .val{color:var(--gold);font-weight:800}.cv99row.bounty .sh{color:var(--rare)}" +
  ".cv99row.qp .val{color:#1fb8ad;font-weight:800}" +
  ".cv99row.mult .val{color:#7fe0a0;font-weight:600}" +
  ".contractv70 button{width:100%;height:40px;border-radius:9px;border:1px solid #d8cbe8;background:linear-gradient(#f4eefb,#dacdec);color:#1a1220;font-weight:800;font-size:13px;letter-spacing:.6px;cursor:pointer}" +
  ".contractv70 button:disabled,.contractv70 button.cv99cool{background:linear-gradient(#26202e,#191521)!important;border-color:#3a3048!important;color:#8f84a2!important;font-weight:700;cursor:default}";
document.head.appendChild(st_v99);
// re-decorate whenever the guild grid is (re)rendered
var gridWatch = null;
document.addEventListener(
  "click",
  function (e) {
    if (
      e.target &&
      (e.target.id === "guildbtnv70" || (e.target.closest && e.target.closest("#guildbtnv70")))
    ) {
      setTimeout(function () {
        armObserver();
        decorateAll();
      }, 60);
    }
  },
  true
);
setTimeout(armObserver, 1500);

decorateAll();

/* V98 — early game: bias drops toward the top of the area so a usable weapon actually appears */
(function () {
  "use strict";
  if (typeof rollDropLevel !== "function") return;
  var _r = rollDropLevel;
  rollDropLevel = function (ai) {
    var lvl = _r(ai);
    try {
      if (ai >= 0 && ai <= 3) {
        var a = AREAS[Math.max(0, Math.min(AREAS.length - 1, ai || 0))],
          top = a.lvl + (a.waves || 0);
        lvl = Math.max(lvl, top - Math.floor(Math.random() * 3));
        lvl = Math.min(lvl, top);
      }
    } catch (e) {}
    return lvl;
  };
})();
/* V95 — centered Options menu holding audio sliders inline plus Save, Load and Credits */
(function () {
  "use strict";
  function g(id) {
    return document.getElementById(id);
  }
  var res = document.querySelector(".res");
  if (!res || g("optionsbtnv95")) return;
  // Options button, rightmost in the menu bar
  var btn = document.createElement("button");
  btn.id = "optionsbtnv95";
  btn.type = "button";
  btn.title = "Audio, save, load and credits";
  btn.textContent = "⚙ Options";
  res.appendChild(btn);
  // centered modal
  var modal = document.createElement("div");
  modal.id = "optionsmodalv95";
  modal.className = "skover";
  modal.style.zIndex = "55";
  modal.innerHTML =
    '<div class="skbox"><div class="skhead"><h2 style="color:#d8b4ff;letter-spacing:2px">⚙ OPTIONS</h2></div>' +
    '<div class="optsectitlev95">Audio</div>' +
    '<div class="optaudiosecv95" id="optaudiosecv95"></div>' +
    '<div class="optcolv95"><button id="optsavev95" type="button">⬇ Save file</button>' +
    '<button id="optloadv95" type="button">⬆ Load file</button></div>' +
    '<button id="creditsbtnv95" type="button">✦ Credits</button>' +
    '<button id="optdonev95" class="go" type="button">Done</button></div>';
  document.body.appendChild(modal);
  // pull the real audio controls (already wired) straight into the Options menu
  try {
    var sec = g("optaudiosecv95"),
      am = g("audiosettingsv54");
    if (sec && am) {
      am.querySelectorAll("label").forEach(function (l) {
        sec.appendChild(l);
      });
      var tog = g("musictogglev54");
      if (tog) sec.appendChild(tog);
    }
  } catch (e) {}
  var CREDITS =
    '<div class="creditsbodyv95">&copy; <span class="cn">Ante Schlesselmann</span><br><br>' +
    "With many thanks to all the friends that helped improve and playtest this.<br><br>" +
    '<span class="cn">Richi</span> aka Spaghetticode Cleaner<br>' +
    '<span class="cn">Philip</span> aka Bug Finder and Eater<br>' +
    '<span class="cn">Goldi</span> aka Intensive Tester<br>' +
    '<span class="cn">Nick</span> aka Prof. Loki<br>' +
    '<span class="cn">Tim</span> aka BIG DAD</div>';
  function proxyClick(id) {
    var el = g(id);
    if (el) el.click();
  }
  g("optsavev95").onclick = function () {
    proxyClick("exportsave");
  };
  g("optloadv95").onclick = function () {
    proxyClick("importsave");
  };
  g("creditsbtnv95").onclick = function () {
    try {
      if (typeof showTip === "function") showTip("CREDITS", CREDITS);
    } catch (e) {}
  };
  g("optdonev95").onclick = function () {
    modal.classList.remove("on");
  };
  modal.addEventListener("click", function (e) {
    if (e.target === modal) modal.classList.remove("on");
  });
  btn.onclick = function () {
    try {
      if (typeof updateAudioModalV54 === "function") updateAudioModalV54();
    } catch (e) {}
    modal.classList.add("on");
  };
  // keep the Options button rightmost even after the town nav reflows
  try {
    if (typeof renderTown === "function") {
      var _rt = renderTown;
      renderTown = function () {
        var r = _rt.apply(this, arguments);
        try {
          var bar = document.querySelector(".res"),
            ob = g("optionsbtnv95");
          if (bar && ob && bar.lastElementChild !== ob) bar.appendChild(ob);
        } catch (e) {}
        return r;
      };
    }
  } catch (e) {}
})();

window.__combatBlockedV110 = blockedV110;

/* FIX A — freeze the whole combat tick while a blocking popup is open, so nothing
     damages the hero or advances waves in the background. */
try {
  if (typeof tick === "function") {
    var _tickPause = tick;
    tick = function () {
      try {
        if (blockedV110()) return;
      } catch (e) {}
      return _tickPause.apply(this, arguments);
    };
  }
} catch (e) {}
window.__showRetreatExplainerV110 = showRetreatExplainer;

/* fire after a death */
try {
  if (typeof heroDown === "function") {
    var _hd = heroDown;
    heroDown = function () {
      var r = _hd.apply(this, arguments);
      try {
        showRetreatExplainer();
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}

/* fire after a manual retreat */
try {
  var rb_v110 = document.getElementById("retreat");
  if (rb_v110) {
    var prevRetreat = rb_v110.onclick;
    rb_v110.onclick = function () {
      var r = prevRetreat && prevRetreat.call(this);
      try {
        showRetreatExplainer();
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}

killMidCombatTeach();
window.__forgeV110 = "ready";

/* ================= script block 21 ================= */

/* V112 · Active-skill system (supersedes V111 UI). Overhauled layout, loadout overview,
   per-track value labels, Select/Selected, in-combat buttons under the XP bar with cooldown
   shown below, buffs shown in character stats, unspent-point + claimable-quest badges,
   Rage removed as an equipment stat, Ninja nerf, shard respec (points×10)^1.55, milestone
   re-grant guard, passive tree width fixed. */
/* ---- (patch scope opened) ---- */
var ACT = {
  berserk: { side: "off", name: "Berserk", icon: "⚔️", col: "#ff6a4d", baseCd: 60, pow: true, dur: true },
  rage: { side: "off", name: "Rage", icon: "🔥", col: "#ffb03a", baseCd: 60, pow: true, dur: true },
  elementAmp: {
    side: "off",
    name: "Element Amp",
    icon: "✨",
    col: "#c07de0",
    baseCd: 60,
    pow: true,
    dur: true
  },
  toughen: { side: "def", name: "Toughen Up", icon: "🛡️", col: "#7bd3ff", baseCd: 45, pow: true, dur: true },
  ninja: { side: "def", name: "Ninja", icon: "🥷", col: "#8affc0", baseCd: 45, pow: true, dur: true },
  heal: { side: "def", name: "Heal", icon: "💚", col: "#78e08a", baseCd: 45, pow: true, cdTrack: true },
  miracle: { side: "def", name: "Miracle", icon: "🌟", col: "#ffd76a", baseCd: 40, pow: true, cdTrack: true },
  cleanse: { side: "def", name: "Cleanse", icon: "🩹", col: "#b9a0ff", baseCd: 100, cdTrack: true }
};
var OFF = ["berserk", "rage", "elementAmp"],
  DEFSQ = ["toughen", "ninja", "heal", "miracle"];
var POWMAX = 10,
  DURMAX = 10,
  CDMAX = 10;
window.__skillLockedV112 = skillLocked;
var SLOT_LV = [0, 15, 40, 60];
window.__activeModsV111 = activeMods;
window.__activateV111 = activate;

/* ---------- effect hooks ---------- */
try {
  if (typeof heroStats === "function") {
    var _hs = heroStats;
    heroStats = function () {
      var h = _hs.apply(this, arguments);
      try {
        h.enrage = 0; /* Rage removed as an equipment stat */
        if (typeof run !== "undefined" && run && !run.over) {
          var m = activeMods();
          h.atk *= m.outMult;
          h.fire *= m.eleMult * m.outMult;
          h.ice *= m.eleMult * m.outMult;
          h.lightning *= m.eleMult * m.outMult;
          h.atkSpeed = (h.atkSpeed || 0) + m.atkSpeedAdd;
          h.dodge = (h.dodge || 0) + m.dodgeAdd;
        }
      } catch (e) {}
      return h;
    };
  }
} catch (e) {}
try {
  if (typeof skillBonuses === "function") {
    var _sb = skillBonuses;
    skillBonuses = function () {
      var r = _sb.apply(this, arguments);
      try {
        if (typeof run !== "undefined" && run && !run.over) {
          var m = activeMods();
          var base = r.damageTaken == null ? 1 : r.damageTaken;
          r.damageTaken = base * m.takenMult;
        }
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}
try {
  if (typeof tick === "function") {
    var _tk = tick;
    tick = function () {
      try {
        var blocked = window.__combatBlockedV110 && window.__combatBlockedV110();
        if (!blocked && typeof run !== "undefined" && run && !run.over) {
          var rt = run.actRT;
          if (rt && rt.miracleUntil > nowT()) {
            rt.miracleAcc = (rt.miracleAcc || 0) + 150;
            // heals a quarter as much, four times as often (every 0.5 s)
            if (rt.miracleAcc >= 500) {
              rt.miracleAcc -= 500;
              var pct = (rt.miraclePct || 3) / 4;
              run.hero.hp = Math.min(run.hero.max, run.hero.hp + (run.hero.max * pct) / 100);
              try {
                floatDmg("hero", "🌟 +" + Math.round((run.hero.max * pct) / 100), 0, "#ffd76a");
              } catch (e) {}
            }
          }
        }
      } catch (e) {}
      var r = _tk.apply(this, arguments);
      try {
        renderCombatBtns();
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}
try {
  if (typeof updateStatusFx === "function") {
    var _usf_p21 = updateStatusFx;
    updateStatusFx = function () {
      var r = _usf_p21.apply(this, arguments);
      try {
        var fx = document.getElementById("herofx");
        if (fx && typeof run !== "undefined" && run && !run.over && run.actRT) {
          var t = nowT();
          [
            ["berserk", "⚔️"],
            ["rage", "🔥"],
            ["elementAmp", "✨"],
            ["toughen", "🛡️"],
            ["ninja", "🥷"]
          ].forEach(function (p) {
            if ((run.actRT.until[p[0]] || 0) > t) {
              var s = document.createElement("span");
              s.className = "fxbuffv111";
              s.textContent = p[1];
              s.title = ACT[p[0]].name;
              fx.appendChild(s);
            }
          });
          if (run.actRT.miracleUntil > t) {
            var s = document.createElement("span");
            s.className = "fxbuffv111";
            s.textContent = "🌟";
            s.title = "Miracle";
            fx.appendChild(s);
          }
        }
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}
try {
  if (typeof drawKnight === "function") {
    var _dk = drawKnight;
    drawKnight = function (cx, gy, swing) {
      var r = _dk.apply(this, arguments);
      try {
        drawBuffFx(cx, gy);
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}

/* buffs in character stats panel */
try {
  if (typeof renderStatPanel === "function") {
    var _rspB = renderStatPanel;
    renderStatPanel = function () {
      _rspB.apply(this, arguments);
      try {
        if (typeof run === "undefined" || !run || run.over) return;
        var p = document.getElementById("spbody");
        if (!p) return;
        var t = nowT(),
          rt = run.actRT;
        if (!rt) return;
        var rows = "";
        function secs(id) {
          return Math.max(0, Math.ceil(((rt.until[id] || 0) - t) / 1000));
        }
        if (buffOn("berserk")) {
          var b = powVal("berserk");
          rows +=
            '<div class="spmod" style="color:#ff9a6a">⚔️ Berserk · +' +
            nf(b.dealt) +
            "% dmg dealt · +" +
            nf(b.taken) +
            "% dmg taken · " +
            secs("berserk") +
            "s</div>";
        }
        if (buffOn("rage"))
          rows +=
            '<div class="spmod" style="color:#ffc46a">🔥 Rage · +' +
            nf(powVal("rage")) +
            "% attack speed · " +
            secs("rage") +
            "s</div>";
        if (buffOn("elementAmp"))
          rows +=
            '<div class="spmod" style="color:#d7a2f0">✨ Element Amp · +' +
            nf(powVal("elementAmp")) +
            "% elemental & status dmg · " +
            secs("elementAmp") +
            "s</div>";
        if (buffOn("toughen")) {
          var g = powVal("toughen");
          rows +=
            '<div class="spmod" style="color:#9fd8ff">🛡️ Toughen Up · −' +
            nf(g.pen) +
            "% output · +" +
            nf(g.mit) +
            "% mitigation · " +
            secs("toughen") +
            "s</div>";
        }
        if (buffOn("ninja"))
          rows +=
            '<div class="spmod" style="color:#9bf0c2">🥷 Ninja · +' +
            nf(powVal("ninja")) +
            "% dodge · " +
            secs("ninja") +
            "s</div>";
        if (rt.miracleUntil > t)
          rows +=
            '<div class="spmod" style="color:#ffe08a">🌟 Miracle · regen ' +
            nf(rt.miraclePct || 3) +
            "%/2s · " +
            Math.max(0, Math.ceil((rt.miracleUntil - t) / 1000)) +
            "s</div>";
        if (rows) p.insertAdjacentHTML("beforeend", '<div class="spbuffhdrV112">● Buffs</div>' + rows);
      } catch (e) {}
    };
  }
} catch (e) {}
window.__renderCombatBtnsV112 = renderCombatBtns;
try {
  if (typeof renderTree === "function") {
    var _rt_p21 = renderTree;
    renderTree = function () {
      var r = _rt_p21.apply(this, arguments);
      try {
        stripFaith();
        if (curTab === "active") renderActivePanel();
        refreshBadges();
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}

/* ---------- skill screen tabs + active panel ---------- */
var curTab = "passive";
window.__renderActivePanelV112 = renderActivePanel;
window.__refreshBadgesV112 = refreshBadges;

try {
  var ot = document.getElementById("opentree");
  if (ot) {
    var prevOpen = ot.onclick;
    ot.onclick = function () {
      var r = prevOpen && prevOpen.call(this);
      try {
        ensureSkillUI();
        stripFaith();
        setTab("passive");
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}

/* grant active points per level */
try {
  if (typeof gainXP === "function") {
    var _gx = gainXP;
    gainXP = function () {
      var before = (typeof S !== "undefined" && S.heroLevel) || 0;
      var r = _gx.apply(this, arguments);
      try {
        var d = (S.heroLevel || 0) - before;
        if (d > 0) {
          ensureState_p21();
          S.spA = (S.spA || 0) + d;
          refreshBadges();
        }
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}
try {
  if (typeof makeGear === "function") {
    var _mg = makeGear;
    makeGear = function () {
      var g = _mg.apply(this, arguments);
      scrubEnrage(g);
      return g;
    };
  }
} catch (e) {}

/* boot */
ensureState_p21();
ensureSkillUI();
stripFaith();
scrubAllEnrage();
reconcileMedals();
refreshBadges();
setInterval(function () {
  try {
    refreshBadges();
  } catch (e) {}
}, 1500);
window.__forgeV112 = "ready";
window.__forgeV111 = "ready";

try {
  if (typeof renderTown === "function") {
    var _rt_v114 = renderTown;
    renderTown = function () {
      var r = _rt_v114.apply(this, arguments);
      try {
        check();
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}
window.addEventListener("resize", position_v114);
window.addEventListener("scroll", position_v114, true);
setInterval(function () {
  if (!guideActive()) return;
  neutralize();
  if (modalOpen()) hide();
  else show_v114();
}, 600);
try {
  var ot_v114 = document.getElementById("opentree");
  if (ot_v114) {
    ot_v114.addEventListener("click", function () {
      if (guideActive()) {
        var s = a_v114();
        if (s) {
          s._lv2guide = false;
          try {
            scheduleSave();
          } catch (e) {}
        }
        hide();
        setTimeout(function () {
          var t = document.querySelector('#sktabsv111 button[data-tab="active"]');
          if (t) t.click();
        }, 70);
      }
    });
  }
} catch (e) {}
try {
  var tok = document.getElementById("tipok");
  if (tok) {
    tok.addEventListener(
      "click",
      function () {
        setTimeout(check, 90);
      },
      false
    );
  }
} catch (e) {}
neutralize();
window.__forgeV114 = "ready";

document.addEventListener(
  "keydown",
  function (e) {
    try {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var k = e.key;
      if (k < "1" || k > "4") return;
      if (typing(e.target)) return;
      if (typeof run === "undefined" || !run || run.over) return;
      if (window.__combatBlockedV110 && window.__combatBlockedV110()) return; /* popup open, combat paused */
      var a = (typeof S !== "undefined" && S && S.actV111) || null;
      if (!a || !Array.isArray(a.loadout)) return;
      var slots = 1 + (S.heroLevel >= 15 ? 1 : 0) + (S.heroLevel >= 40 ? 1 : 0) + (S.heroLevel >= 60 ? 1 : 0);
      var id = a.loadout.slice(0, slots)[parseInt(k, 10) - 1];
      if (!id) return;
      if (typeof window.__activateV111 === "function") {
        window.__activateV111(id);
        e.preventDefault();
      }
    } catch (err) {}
  },
  false
);
window.__forgeV115 = "ready";

/* (a) weapon migration must preserve great axes (and any future type), and also scan
         the V82 gear bag. It still only runs once, gated by S.flags.weaponsV18. */
try {
  if (typeof migrateWeapons === "function") {
    migrateWeapons = function () {
      S.flags = S.flags || {};
      if (S.flags.weaponsV18) return;
      var VALID = ["sword", "bow", "dagger", "greataxe"];
      var clean = function (g) {
        if (!g || g.slot !== "weapon") return;
        if (VALID.indexOf(g.wtype) < 0) g.wtype = "sword";
        if (g.wtype === "greataxe") return; /* modern type — leave intact */
        if (g.wtype === "sword" && g.stats) delete g.stats.poison;
        if (g.wtype === "bow" && g.stats) delete g.stats.bleed;
        try {
          g.name =
            (g.unique === "bloodforged"
              ? "Bloodforged "
              : RAR[g.rar].k[0].toUpperCase() + RAR[g.rar].k.slice(1) + " ") + weaponTypeName(g);
        } catch (e) {}
      };
      [S.gear, S.gear2].forEach(function (set) {
        if (set) for (var k in set) clean(set[k]);
      });
      (S.bag || []).forEach(clean);
      (S.gearBagV82 || []).forEach(clean);
      S.flags.weaponsV18 = true;
    };
  }
} catch (e) {}

/* (a2) the portable item serializer itself forced any weapon wtype outside
         [sword,bow,dagger] to "sword" — that is where great axes were actually lost, on
         both export and import. Restore a valid modern wtype from the raw item. */
try {
  if (typeof portableItem === "function") {
    var _item = portableItem;
    var WTYPES116 = ["sword", "bow", "dagger", "greataxe"];
    portableItem = function (raw) {
      var g = _item.apply(this, arguments);
      try {
        if (g && g.slot === "weapon" && raw && WTYPES116.indexOf(raw.wtype) >= 0) g.wtype = raw.wtype;
      } catch (e) {}
      return g;
    };
  }
} catch (e) {}

/* (b1) export: attach the state the older portable format leaves out */
try {
  if (typeof buildPortableSaveV19 === "function") {
    var _build = buildPortableSaveV19;
    buildPortableSaveV19 = function () {
      var data = _build.apply(this, arguments);
      try {
        data.player = data.player || {};
        data.player.modernV116 = {
          actV111: deep(S.actV111),
          spA: Math.max(0, Number(S.spA) || 0),
          flags: deep(S.flags) || {},
          questAccepted: deep(S.questV74 && S.questV74.accepted) || {}
        };
      } catch (e) {}
      return data;
    };
  }
} catch (e) {}

/* (b2) import: restore it. Runs after the V74/V79/V82 import wrappers, so questV74 and
          flags already exist on `next` and we merge onto them. Files saved before this
          fix simply lack the block and fall back to the previous behaviour, but the
          hardened migration above still protects their great axes. */
try {
  if (typeof stateFromPortableV19 === "function") {
    var _from = stateFromPortableV19;
    stateFromPortableV19 = function (data) {
      var next = _from.apply(this, arguments);
      try {
        var m = data && data.player && data.player.modernV116;
        if (m) {
          if (m.actV111 && typeof m.actV111 === "object") next.actV111 = m.actV111;
          if (typeof m.spA === "number") next.spA = m.spA;
          if (m.flags && typeof m.flags === "object") next.flags = Object.assign(next.flags || {}, m.flags);
          if (m.questAccepted && typeof m.questAccepted === "object") {
            next.questV74 = next.questV74 || {};
            next.questV74.accepted = Object.assign({}, next.questV74.accepted || {}, m.questAccepted);
          }
        }
      } catch (e) {}
      return next;
    };
  }
} catch (e) {}

window.__forgeV116 = "ready";
