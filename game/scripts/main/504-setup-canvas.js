// ============ CANVAS ============
const cv = $("cv");
let ctx = cv.getContext("2d");
requestAnimationFrame(frame);
var defPct;
var leechPct;

// Rarity still matters, but no longer overwhelms 30-50 item levels of base-stat progression.
[1, 1.22, 1.5, 1.82, 2.2].forEach((m, i) => (RAR[i].m = m));
PERCENT.delete("healCdr");
gStat = function (g, stat) {
  const p = Math.max(0, g.plus || 0);
  const per = 0.075 + Math.min(0.075, (g.ilvl || 1) * 0.00075);
  let m = 1 + p * per;
  if (p > 10) m += (p - 10) * per * 0.35;
  if (p >= 15) m += 0.12;
  if (p >= 20) m += 0.25;
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
gearDesc = function (g) {
  const groups = { off: [], def: [], util: [] };
  Object.keys(g.stats).forEach(st => {
    const v = gStat(g, st);
    const txt =
      "+" +
      (CURVED.has(st) ? Math.round(v) : PERCENT.has(st) ? v.toFixed(1) + "%" : Math.round(v)) +
      " " +
      STAT_LABEL[st];
    const disp =
      st === "critChance"
        ? '<span style="color:#ffd24a;text-shadow:0 0 5px #ffd24a99;font-weight:700">★' + txt + "</span>"
        : txt;
    groups[catOf(st)].push(disp);
  });
  if (g.growth) {
    const gr = growthValues(g);
    groups.off.push("+<b>" + gr.atk + "</b> Growth Atk");
    groups.def.push("+<b>" + gr.hp + "</b> Growth HP");
  }
  return (
    ["off", "def", "util"]
      .map(c => groups[c].join(", "))
      .filter(Boolean)
      .join(' <span style="color:#6a5f52">｜</span> ') + (g.growth ? "<br>" + growthLine(g) : "")
  );
};
slotStatLines = function (g) {
  const groups = { off: [], def: [], util: [] };
  Object.keys(g.stats).forEach(st => {
    const v = gStat(g, st);
    const val = CURVED.has(st) ? Math.round(v) : PERCENT.has(st) ? v.toFixed(1) + "%" : Math.round(v);
    groups[catOf(st)].push((st === "critChance" ? "★" : "") + "+" + val + " " + STAT_LABEL[st]);
  });
  if (g.growth) {
    const gr = growthValues(g);
    groups.off.push("🩸+" + gr.atk + " Growth Atk");
    groups.def.push("❤️+" + gr.hp + " Growth HP");
  }
  return ["off", "def", "util"]
    .map(c => (groups[c].length ? '<div class="sl' + c + '">' + groups[c].join(" · ") + "</div>" : ""))
    .join("");
};
gpower = function (g) {
  let p = 0;
  for (const st in g.stats) {
    const v = gStat(g, st);
    p += PERCENT.has(st) ? v * 3 : st === "hp" ? v * 0.5 : v * 2;
  }
  if (g.growth) {
    const gr = growthValues(g);
    p += gr.atk * 2 + gr.hp * 0.5;
  }
  return p;
};
itemMarks = function (g) {
  let m = "";
  const els = [
    ["fire", "🔥"],
    ["ice", "❄️"],
    ["lightning", "⚡"]
  ];
  let be = "",
    bv = 0;
  els.forEach(([k, e]) => {
    if ((g.stats[k] || 0) > bv) {
      bv = g.stats[k];
      be = e;
    }
  });
  if (be) m += "<span>" + be + "</span>";
  if (g.stats.poison) m += '<span title="Poison" style="color:#7fe07f">☠</span>';
  if (g.stats.bleed) m += '<span title="Bleed" style="color:#ff5b6a">🩸</span>';
  if (g.stats.enrage) m += '<span title="Enrage" style="color:#ff6a5a">😡</span>';
  if (g.growth) m += '<span title="Blood Growth" style="color:#ff8f7b">♥↑</span>';
  if ((g.celestial || 0) >= 10)
    m +=
      '<span title="Celestial MAX" style="color:#ffd76a;text-shadow:0 0 7px #fff,0 0 10px #ffd76a">✹</span>';
  else if (g.celestial)
    m +=
      '<span title="Celestial ×' +
      g.celestial +
      '" style="color:#9fd8ff;text-shadow:0 0 5px #9fd8ff">✦</span>';
  if (g.broken) m += '<span class="brokentag" title="Shattered −50%">💥</span>';
  return m;
};

// Faith: regeneration removed. Heal/CDR and kill-heal are toned down.
SKILLS.heal.nodes = SKILLS.heal.nodes.filter(n => n.id !== "h5");
SKILLS.heal.nodes.forEach(n => {
  if (n.id === "h1") n.d = "Unlock ✚ Heal (22% HP)";
  if (n.id === "h2") n.d = "+5% heal power";
  if (n.id === "h3") n.d = "+8 cooldown rating";
  if (n.id === "h4") n.d = "Heal 2.5% max HP per kill";
});

var makeBloodforged;

// Costs now scale with item level. Reforges deliberately become punitive after repeated rerolls.
upCost = function (g) {
  const c = skillBonuses().forgeCost,
    il = Math.max(1, g.ilvl || 1),
    p = Math.max(0, g.plus || 0),
    rar = 1 + (g.rar || 0) * 0.22;
  const base = 40 + il * 12 + Math.pow(il, 1.22) * 1.6;
  return {
    gold: Math.round(base * Math.pow(1.16, p) * rar * c),
    shards: Math.round((8 + il * 0.65) * Math.pow(1.12, p) * (1 + (g.rar || 0) * 0.2) * c)
  };
};

upOdds = function (g) {
  return Math.min(0.95, Math.max(0.12, 0.9 - (g.plus || 0) * 0.035) + skillBonuses().forgeOdds);
};
rfCost = function (g) {
  const il = Math.max(1, g.ilvl || 1),
    r = Math.max(0, g.reforges || 0);
  return Math.round((25 + il * 0.9) * (1 + (g.rar || 0) * 0.25) * Math.pow(1.9, r));
};
celestialCost = function (g) {
  const c = Math.min(10, g.celestial || 0),
    il = Math.max(1, g.ilvl || 1);
  return { esh: 5 + c * 2, gold: Math.round((12000 + il * 800) * (1 + 0.17 * c)) };
};
var celestialProfile;
$("tipok").onclick = () => $("tipmodal").classList.remove("on");
const localSaveButton = $("savebtn");
if (localSaveButton)
  localSaveButton.onclick = () => {
    if (!saveGame(false))
      showTip(
        "SAVE UNAVAILABLE",
        "Your browser blocked local storage for this file. Try opening the HTML in a normal browser window rather than a restricted preview."
      );
  };
window.addEventListener("beforeunload", () => saveGame(true));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveGame(true);
});
$("setbtn").onclick = switchGearSet;

// Reforge action: both gold and shard cost, item-level scaled, preserves celestial/unique identity.
$("rfbtn").onclick = () => {
  const g = S.gear[S.sel];
  if (!g || g.broken) return;
  const sh = rfCost(g),
    gold = rfGoldCost(g);
  if (S.shards < sh || S.gold < gold) {
    $("fsel").textContent = "Need " + fmt(gold) + " gold + " + fmt(sh) + " shards to reforge.";
    return;
  }
  S.shards -= sh;
  S.gold -= gold;
  const tries = 1 + skillBonuses().reforgeHigh;
  let ng = makeGear(g.slot, g.ilvl, g.rar);
  for (let t = 1; t < tries; t++) {
    const cand = makeGear(g.slot, g.ilvl, g.rar);
    if (gpower(cand) > gpower(ng)) ng = cand;
  }
  carryIdentity(ng, g);
  S.gear[g.slot] = ng;
  beep(520, 0.1, "triangle");
  flash(cvar("--rare"));
  renderTown();
};

var markerLoop;
openStrike = function (g, c) {
  clearForgeComparison();
  forgeSnapshot = JSON.parse(JSON.stringify(g));
  celestialMode = false;
  strikeLocked = false;
  $("strike").classList.remove("celestial");
  $("strikehd").innerHTML = "⚒ STRIKE THE ANVIL";
  $("strikehd").style.color = cvar("--fire");
  const ch = $("corehint");
  if (ch) ch.style.display = "";
  pend = { g, c };
  zW = Math.max(30, 110 - g.plus * 8) + skillBonuses().zoneBonus;
  zL = 30 + Math.random() * (320 - 60 - zW);
  sSpeed = 2.6 + g.plus * 0.34;
  sPos = 0;
  sDir = 1;
  $("pzone").style.left = zL + "px";
  $("pzone").style.width = zW + "px";
  zcL = zL + zW / 2 - ZCW / 2;
  $("pcrit").style.left = zcL + "px";
  $("pcrit").style.width = ZCW + "px";
  $("baseodds").textContent = "";
  setForgeHud(g, false);
  renderGuardRow();
  $("run").style.display = "block";
  $("town").style.display = "none";
  $("strike").classList.add("on");
  beep(150, 0.12, "sawtooth", 0.1);
  cancelAnimationFrame(sRAF);
  sRAF = requestAnimationFrame(markerLoop);
};
openCelestial = function (g) {
  const c = celestialCost(g);
  if ((c.cshards || 0) > (S.celestialShards || 0)) {
    $("fsel").innerHTML = '<span style="color:#ff6b6b">Not enough Celestial shards for this attempt.</span>';
    return;
  }
  clearForgeComparison();
  $("strikebtn").disabled = false;
  prev7: {
    if ((g.celestial || 0) >= 10) {
      $("fsel").textContent = "This item is already Celestial Level 10.";
      break prev7;
    }
    const c = celestialCost(g);
    if (S.epicShards < c.esh || S.gold < c.gold) {
      $("fsel").innerHTML =
        '<span style="color:#ff6b6b">Need ' +
        c.esh +
        " epic shards + " +
        fmt(c.gold) +
        "g for a celestial attempt.</span>";
      break prev7;
    }
    celestialMode = true;
    strikeLocked = false;
    celHitsDone = 0;
    celProf = celestialProfile(g);
    celHitsNeeded = celProf.hits;
    pend = { g, c, paid: false };
    setupCelRound(g);
    $("baseodds").innerHTML =
      '<span style="color:#9fd8ff">✦ CELESTIAL ' +
      celProf.target +
      "/10</span> · hit the silver " +
      (celHitsNeeded === 2 ? "<b>TWICE in one sequence</b>" : "once") +
      " · outcome " +
      Math.round(celProf.chance * 100) +
      "% · " +
      c.esh +
      "◆ + " +
      fmt(c.gold) +
      "g";
    $("guardrow").innerHTML =
      '<span class="gl">✦ Higher Celestial levels narrow the silver and speed up the marker.</span>';
    $("strikehd").innerHTML = "✦ CELESTIAL FORGE";
    $("strikehd").style.color = "#9fd8ff";
    $("strike").classList.add("celestial");
    const ch = $("corehint");
    if (ch) ch.style.display = "none";
    setForgeHud(g, true);
    $("run").style.display = "block";
    $("town").style.display = "none";
    $("strike").classList.add("on");
    beep(300, 0.18, "sine", 0.08);
  }
};
$("celbtn").onclick = () => {
  const g = S.gear[S.sel];
  if (!g || g.plus < 20 || g.rar < 3 || g.broken || (g.celestial || 0) >= 10) return;
  openCelestial(g);
};
var finishCelestial;

$("strikebtn").onclick = () => {
  if (strikeLocked) return;
  cancelAnimationFrame(sRAF);
  const pos = sPos;
  $("hammer").classList.add("hit");
  beep(235, 0.06, "square", 0.1);
  setTimeout(() => $("hammer").classList.remove("hit"), 85);
  if (celestialMode) {
    const { g, c } = pend;
    const hit = pos >= zL - 1 && pos <= zL + zW + 1;
    if (!pend.paid) {
      S.epicShards -= c.esh;
      S.gold -= c.gold;
      pend.paid = true;
    }
    strikeLocked = true;
    if (!hit) {
      finishCelestial(false);
      return;
    }
    celHitsDone++;
    if (celHitsDone < celHitsNeeded) {
      floatForge("✦ SILVER " + celHitsDone + "/" + celHitsNeeded + " — AGAIN!", "#dcecff");
      setTimeout(() => {
        setupCelRound(g);
        $("baseodds").innerHTML = '<span style="color:#fff">Second silver hit required — do not miss.</span>';
        strikeLocked = false;
      }, 260);
      return;
    }
    const success = Math.random() < celProf.chance;
    finishCelestial(success);
    return;
  }
  const { g, c } = pend,
    upgradeBefore = JSON.parse(JSON.stringify(pend.g));
  const oldPlus = g.plus || 0,
    zone = forgeZone(pos),
    critHit = zone === "silver",
    profile = forgeOutcomeProfile(g, zone);
  S.gold -= c.gold;
  S.shards -= c.shards;
  const success = Math.random() < profile.success;
  strikeLocked = true;
  setTimeout(() => {
    const sb = skillBonuses();
    let hold = 900,
      warnAt10 = false;
    if (success) {
      const before = {};
      Object.keys(g.stats).forEach(st => (before[st] = gStat(g, st)));
      const critS =
        Math.random() < 0.04 + sb.critSuccess + (critHit ? 0.05 + (sb.silverCritSuccess || 0) : 0);
      g.plus = Math.min(20, g.plus + (critS ? 2 : 1));
      let na = null;
      if ((oldPlus < 10 && g.plus >= 10) || (oldPlus < 20 && g.plus >= 20)) {
        if (Math.random() < 0.5 + sb.affixChance) na = addAffix(g);
      }
      const deltas = Object.keys(g.stats)
        .map(st => {
          const dv = gStat(g, st) - (before[st] || 0);
          if (dv <= 0.05) return null;
          return (PERCENT.has(st) ? "+" + dv.toFixed(1) + "%" : "+" + Math.round(dv)) + " " + STAT_LABEL[st];
        })
        .filter(Boolean);
      anvilStatPop(deltas);
      if (critS) {
        flash(cvar("--epic"));
        softShake();
        chord([523, 659, 784, 1046], 0.45);
        floatForge("✦ CRITICAL FORGE! +2 ✦", "#c46bff");
        spawnSparks("#c46bff", 20);
        hold = 900;
      } else {
        flash(g.plus >= 7 ? cvar("--legendary") : cvar("--gold"));
        softShake();
        chord(g.plus >= 7 ? [523, 659, 784] : [500, 700], 0.35);
      }
      if (na) {
        floatForge("★ NEW AFFIX UNLOCKED!", "#c46bff");
        hold = Math.max(hold, 900);
      }
      if (oldPlus < 10 && g.plus >= 10 && !S.flags.breakWarn) {
        S.flags.breakWarn = true;
        warnAt10 = true;
      }
      if (g.plus >= 20) {
        spawnSparks("#ffd76a", 30);
        floatForge("✦✦ +20 MASTERWORK — CELESTIAL READY ✦✦", "#ffd76a");
        hold = Math.max(hold, 950);
      }
    } else {
      beep(90, 0.24, "sawtooth", 0.14);
      if (g.plus >= 10) {
        const roll = Math.random();
        let mishap =
          roll < profile.breakChance
            ? "break"
            : roll < profile.breakChance + profile.downChance
              ? "down"
              : null;
        if (mishap === "break" && armedGuard && S.guards[armedGuard] > 0) {
          const gn = GUARDS[armedGuard].n,
            absorbed = Math.random() < GUARDS[armedGuard].save;
          S.guards[armedGuard]--;
          if (S.guards[armedGuard] <= 0) armedGuard = null;
          if (absorbed) {
            mishap = null;
            floatForge("🛡 " + gn + " ABSORBED IT!", cvar("--uncommon"));
          } else floatForge("🛡 " + gn + " failed to hold…", "#a08a5a");
        }
        if (mishap === "break") {
          g.broken = true;
          flash("#ff2f2f");
          shake();
          floatForge("💥 CRITICAL FAILURE — SHATTERED (−50%)", "#ff5b45");
          hold = 900;
        } else if (mishap === "down") {
          g.plus = Math.max(0, g.plus - 1);
          flash("#ff8a3a");
          softShake();
          floatForge("▼ THE FORGE SLIPPED — now +" + g.plus, "#ff9a5a");
          hold = 900;
        }
      }
    }
    if (success || g.plus !== oldPlus || g.broken) {
      showForgeComparison(upgradeBefore, g, false);
      hold = Math.max(hold, 2800);
    }
    setForgeHud(g, false);
    finishForgeAttempt(g, warnAt10, !!g.broken, hold, success);
  }, 150);
};

$("resetskills").onclick = () => {
  const n = investedSkillPoints(),
    c = resetSkillCost();
  if (!n) return;
  if (S.gold < c) {
    showTip("NOT ENOUGH GOLD", "Resetting " + n + " invested skill points costs <b>" + fmt(c) + " gold</b>.");
    return;
  }
  if (!confirm("Reset " + n + " invested skill points for " + fmt(c) + " gold?")) return;
  S.gold -= c;
  S.sp += n;
  S.skills = {};
  beep(500, 0.12, "triangle");
  renderTree();
  renderTown();
};

// Shop: protectors require substantially more shards; Gear Set II costs exactly 100,000 gold.
renderShop = function () {
  $("shopcur").innerHTML =
    'Gold <b style="color:var(--gold)">' +
    fmtCur(S.gold) +
    '</b> · Shards <b style="color:var(--rare)">' +
    fmtCur(S.shards) +
    '</b> · Epic <b class="esh">' +
    fmtCur(S.epicShards) +
    "</b>";
  const bagCost = Math.round(800 * Math.pow(1.8, (S.bagCap - 5) / 2));
  const items = [
    {
      n: "🎒 Bag Expansion",
      d: "+2 bag slots (now " + S.bagCap + "). Loot beyond your bag auto-salvages into shards.",
      cost: { gold: bagCost },
      buy: () => {
        S.bagCap += 2;
      }
    },
    {
      n: "📖 Tome of Insight",
      d: "Doubles all XP for your next run.",
      own: "Charges: " + S.xpBuff,
      cost: { gold: 1200 },
      buy: () => {
        S.xpBuff++;
      }
    },
    ...(!S.gearSetUnlocked
      ? [
          {
            n: "⚔ Gear Set II",
            d: "Unlock a second complete equipment set. Switch with the small button left of your loadout — ideal for a Gold/XP farming set.",
            cost: { gold: 100000 },
            buy: () => {
              S.gearSetUnlocked = true;
              S.gear2 = S.gear2 || {};
            }
          }
        ]
      : []),
    {
      n: "🛡 Lesser Guard",
      d: "35% chance to absorb a shatter. Guards are consumed when they attempt protection.",
      own: "Owned: " + S.guards.low,
      cost: { gold: 800, shards: 40 },
      buy: () => {
        S.guards.low++;
      }
    },
    {
      n: "🛡 Forge Guard",
      d: "60% chance to absorb a critical failure from +10 onward.",
      own: "Owned: " + S.guards.med,
      cost: { gold: 1500, shards: 120 },
      buy: () => {
        S.guards.med++;
      }
    },
    {
      n: "🛡 Greater Guard",
      d: "85% shatter protection for high-end forging.",
      own: "Owned: " + S.guards.high,
      cost: { shards: 320 },
      buy: () => {
        S.guards.high++;
      }
    },
    {
      n: "🛡 Master Guard",
      d: "100% shatter protection. Endgame insurance should be a real resource decision.",
      own: "Owned: " + S.guards.vhigh,
      cost: { shards: 800, esh: 12 },
      buy: () => {
        S.guards.vhigh++;
      }
    }
  ];
  const grid = $("shopgrid");
  grid.innerHTML = "";
  items.forEach(it => {
    const price = [];
    if (it.cost.gold) price.push('<span style="color:var(--gold)">' + fmt(it.cost.gold) + "g</span>");
    if (it.cost.shards) price.push('<span style="color:var(--rare)">' + fmt(it.cost.shards) + "sh</span>");
    if (it.cost.esh) price.push('<span class="esh">' + it.cost.esh + " epic</span>");
    const afford =
      (!it.cost.gold || S.gold >= it.cost.gold) &&
      (!it.cost.shards || S.shards >= it.cost.shards) &&
      (!it.cost.esh || S.epicShards >= it.cost.esh);
    const card = document.createElement("div");
    card.className = "shopcard";
    card.innerHTML =
      '<div class="sn">' +
      it.n +
      '</div><div class="sd">' +
      it.d +
      "</div>" +
      (it.own ? '<div class="sown">' + it.own + "</div>" : "") +
      '<button class="up">Buy <span class="pc">' +
      price.join(" + ") +
      "</span></button>";
    const btn = card.querySelector("button");
    btn.disabled = !afford;
    btn.onclick = () => {
      if (it.cost.gold) S.gold -= it.cost.gold;
      if (it.cost.shards) S.shards -= it.cost.shards;
      if (it.cost.esh) S.epicShards -= it.cost.esh;
      it.buy();
      beep(680, 0.1, "triangle");
      flash(cvar("--gold"));
      renderShop();
      renderTown();
    };
    grid.appendChild(card);
  });
};

// Right stat panel: brackets are now explicit labels, HP is current/max in combat, effective curves are capped.
liveStats = function () {
  let result;
  prev8: {
    const h = heroStats(),
      out = {};
    [...OFFSTATS, ...DEFSTATS, ...UTILSTATS].forEach(st => (out[st] = h[st] || 0));
    const mods = [];
    if (run && !run.over) {
      if (run.enrageT > 0) {
        out.atkSpeed = (out.atkSpeed || 0) + 60;
        mods.push({ t: "😡 Enraged: +60% Attack Speed", c: "#ff6a5a" });
      } else if ((run.enrageCd || 0) > 0 && h.enrage > 0)
        mods.push({ t: "😡 Enrage cooldown: " + Math.ceil(run.enrageCd / 1000) + "s", c: "#b88780" });
      if (run.slowStacks > 0) {
        out.atkSpeed = (out.atkSpeed || 0) - 16 * run.slowStacks;
        mods.push({ t: "🕳️ Void Slow ×" + run.slowStacks, c: "#c9a6ff" });
      }
      if (run.frozenUntil && run.time < run.frozenUntil)
        mods.push({ t: "❄ Frozen: cannot attack", c: "#8fe0ff" });
      if (run.heroPoisonUntil && run.time < run.heroPoisonUntil)
        mods.push({ t: "☠ Cursed: poison DoT", c: "#9be07f" });
      if (run.chainHits > 0 && run.time < run.chainUntil)
        mods.push({ t: "⛓ Hellchain: " + run.chainHits + " hits to break", c: "#ff9a5a" });
      if (run.suppressedSlot && run.suppressedUntil > run.time)
        mods.push({ t: "⌫ Recompiled: " + run.suppressedSlot + " disabled", c: "#d4c4ff" });
      if (run.hero && run.hero.hp / run.hero.max < 0.5 && skillBonuses().berserk > 1)
        mods.push({
          t: "⚔ Berserk: +" + Math.round((skillBonuses().berserk - 1) * 100) + "% Dmg",
          c: "#ff8a5a"
        });
      if (run.xpMult > 1) mods.push({ t: "📖 Tome: double XP", c: "#7fe0a0" });
      if (run.a && run.a.gimmick === "drown" && run.air != null)
        mods.push({ t: "🫧 Air " + Math.round(run.air) + "%", c: run.air < 25 ? "#ff7a5a" : "#8fe0ff" });
    }
    result = { out, mods };
    break prev8;
  }
  /* ---- liveStats: later layers (moved here) ---- */
  if (run && !run.over && run.a && run.a.gimmick === "end")
    result.mods.push({ t: "🩸 Lifesteal reduced to 5% effectiveness", c: "#d695b0" });
  return result;
};

// New final-three boss mechanics: reflect mirror, breakable hellchain, temporary gear deletion.
MECHS[9] = {
  id: "wintermirror",
  name: "Mirror of Winter",
  icon: "🔷",
  dur: 1800,
  cd: 7600,
  col: "#9fe8ff",
  resolve: b => {
    b.reflectUntil = run.time + 4800;
    flash("#9fe8ff");
    floatDmg("foe", "🔷 MIRROR — DAMAGE REFLECT", 0, "#c9f4ff", b._x);
    sayBoss("Strike me, and the mirror strikes you.");
  }
};
MECHS[10] = {
  id: "hellchain",
  name: "Hellchain",
  icon: "⛓️",
  dur: 1900,
  cd: 8200,
  col: "#ff7a3a",
  resolve: b => {
    run.chainHits = 4;
    run.chainUntil = run.time + 6500;
    flash("#ff6a2f");
    floatDmg("hero", "⛓ BREAK IT: 4 HITS", 0, "#ffad70");
    sayBoss("Break the chain before it breaks YOU.");
  }
};
MECHS[11] = {
  id: "recompile",
  name: "Recompile Loadout",
  icon: "⌫",
  dur: 2200,
  cd: 7200,
  col: "#c9b6ff",
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
  resolve: b => {
    const slots = Object.keys(S.gear).filter(k => S.gear[k]);
    if (!slots.length) return;
    let choices = slots.filter(k => k !== run.suppressedSlot);
    if (!choices.length) choices = slots;
    run.suppressedSlot = choices[Math.floor(Math.random() * choices.length)];
    run.suppressedUntil = run.time + 6000;
    if (run.hero) {
      run.hero.max = heroStats().hp;
      run.hero.hp = Math.min(run.hero.hp, run.hero.max);
    }
    flash("#b79fff");
    floatDmg("hero", "⌫ " + run.suppressedSlot.toUpperCase() + " DISABLED", 0, "#d4c4ff");
    sayBoss("That equipment variable has been removed.");
  }
};

// Boss wave can never be retreated from.
updateRetreat = function () {
  if (run && run.hunt) {
    const rb = $("retreat");
    rb.disabled = true;
    rb.innerHTML = "🔒 Leave at Boss Hunt checkpoints";
    return;
  }
  prev9: {
    const rb = $("retreat");
    if (!rb || !run) break prev9;
    const boss = run.wave > run.total;
    if (boss) {
      rb.disabled = true;
      rb.innerHTML = "🔒 BOSS — NO RETREAT";
      break prev9;
    }
    if (run.wave % 3 === 0) {
      rb.disabled = false;
      rb.innerHTML = "⤴ RETREAT (keep loot, no clear)";
    } else {
      rb.disabled = true;
      const next = Math.ceil((run.wave + 0.001) / 3) * 3;
      rb.innerHTML = "🔒 Retreat opens at wave " + next;
    }
  }
  /* ---- updateRetreat: later layers (moved here) ---- */
};
$("retreat").onclick = () => {
  if (!run || run.over || run.wave > run.total || run.wave % 3 !== 0) return;
  run.over = true;
  clearInterval(timer);
  hideCast();
  startLootOpen(() => backToTown());
};

// Heal is smaller and substantially slower; CDR is a diminishing-return rating capped below 50%.
$("healbtn").onclick = () => {
  if (!run || run.over || !S.skills.h1 || (run.healCd || 0) > 0) return;
  const hs = heroStats(),
    sb = skillBonuses();
  run.hero.hp = Math.min(run.hero.max, run.hero.hp + run.hero.max * 0.22 * sb.healPower);
  const eff = cdrPct((hs.healCdr || 0) + sb.healCdrSkill);
  run.healCd = 28000 * (1 - eff / 100);
  beep(760, 0.1, "triangle");
  setTimeout(() => beep(940, 0.1, "triangle"), 80);
  flash(cvar("--uncommon"));
  for (let i = 0; i < 9; i++)
    particles.push({
      x: 150 + (Math.random() - 0.5) * 30,
      y: GY - 30 - Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.1,
      vy: -0.8 - Math.random(),
      life: 1,
      sz: 2,
      col: "#7fe07f"
    });
  drawBars();
  updateHeal();
};

// Lower monster HP to match the corrected crit model; enemy defense/attack growth is kept meaningful.
buildFoe = function (key, lvl, hpMul, boss, name) {
  let f;
  prev10: {
    const t = ENEMIES[key],
      hpBase = 32 + 9.0 * Math.pow(lvl, 2.0),
      atkBase = 4 + 0.35 * Math.pow(lvl, 1.85),
      defBase = 1 + 0.08 * Math.pow(lvl, 1.65),
      hp = Math.round(hpBase * t.hpM * hpMul);
    f = {
      key,
      hp,
      max: hp,
      atk: Math.round(atkBase * t.atkM),
      def: Math.round(defBase * t.defM),
      res: t.res,
      name: name || t.n,
      lvl,
      boss: !!boss,
      cd: 400 + Math.random() * 400,
      hurt: 0,
      atkA: 0,
      enter: 1,
      dead: 0,
      deadA: 0,
      draw: { c: boss ? "#d9a441" : t.c, sz: boss ? 1.6 : t.sz, shape: t.shape }
    };
    break prev10;
  }
  /* ---- buildFoe: later layers (moved here) ---- */
  if (key === "shaman") f.specialCd = 2600 + Math.random() * 1500;
  if (key === "plaguefrog") f.specialCd = 3000 + Math.random() * 1700;
  if (key === "thornback") f.specialCd = 2200 + Math.random() * 1400;
  return f;
};

// Combat pass: non-exponential crit tiers, much lighter crit shake, capped lifesteal, viable poison/bleed, Enrage CDR.
tick = function () {
  specialEnemyTick();
  prev12: {
    if (!run || run.over) break prev12;
    if (run.suppressedSlot && run.suppressedUntil <= run.time) {
      run.suppressedSlot = null;
      run.suppressedUntil = 0;
      if (run.hero) run.hero.max = heroStats().hp;
    }
    const hs = heroStats();
    if (run.enrageT > 0) run.enrageT = Math.max(0, run.enrageT - 150);
    if (run.enrageCd > 0) run.enrageCd = Math.max(0, run.enrageCd - 150);
    if (run.healCd > 0) {
      run.healCd = Math.max(0, run.healCd - 150);
      updateHeal();
    }
    const enr = run.enrageT > 0;
    if (run.chainHits > 0 && run.time >= run.chainUntil) {
      const hits = run.chainHits;
      run.chainHits = 0;
      flash("#ff4a2f");
      abilityHitHero(run.hero.max * (0.18 + 0.025 * hits), "⛓ CHAIN SNAP", "#ff7a4a", "fire");
      if (run.over) break prev12;
    }
    if (run.a.gimmick === "drown" && !run.over) {
      run.air = Math.max(0, (run.air == null ? 100 : run.air) - 0.16);
      const gm = $("gimmick");
      if (gm) {
        const low = run.air < 25;
        gm.className = "gimmick" + (low ? " low" : "");
        gm.innerHTML =
          (run.air <= 0 ? "🫧 NO AIR!" : "🫧 AIR") +
          '<div class="gbar"><i style="width:' +
          run.air +
          '%"></i></div>';
      }
      if (run.air <= 0) {
        run.airPenaltyT = (run.airPenaltyT || 0) + 150;
        if (run.airPenaltyT >= 700) {
          run.airPenaltyT -= 700;
          const dd = Math.max(3, run.hero.max * 0.05);
          run.hero.hp -= dd;
          floatDmg("hero", "🫧 " + Math.round(dd), 0, "#8fe0ff");
          flash("#3fa8d6");
          if (run.hero.hp <= 0) {
            heroDown();
            break prev12;
          }
        }
      }
    }
    hCd -= 150;
    const frozen = run.frozenUntil && run.time < run.frozenUntil;
    if (frozen && hCd < 0) hCd = 0;
    if (hCd <= 0 && !frozen) {
      const chainSlow = run.chainHits > 0 && run.time < run.chainUntil ? 1.45 : 1;
      const _swBase =
        typeof swingIntervalV50 === "function"
          ? swingIntervalV50(hs.atkSpeed, S.gear.weapon && S.gear.weapon.wtype)
          : Math.max(500, 1400 / (1 + hs.atkSpeed / 100));
      hCd =
        (_swBase / (enr ? 1.6 : 1)) *
        (1 + 0.16 * (run.slowStacks || 0)) *
        (1 + 0.1 * (run.chillV102 || 0)) *
        chainSlow;
      const target = run.foes.find(f => f.hp > 0 && !f.boss) || run.foes.find(f => f.hp > 0);
      if (target) {
        anim.hero.swing = 1;
        if (S.gear.weapon && S.gear.weapon.wtype === "bow")
          arrows.push({ sx: 174, sy: GY - 26, tx: target._x, ty: GY - 22, t: 0 });
        const ep = enrageProfile(hs.enrage);
        if (!enr && (run.enrageCd || 0) <= 0 && ep.chance > 0 && Math.random() * 100 < ep.chance) {
          run.enrageT = ep.duration;
          run.enrageDuration = ep.duration;
          run.enrageCd = 12000 * (1 - cdrPct(hs.healCdr || 0) / 100);
          flash("#ff3b3b");
          beep(160, 0.16, "sawtooth", 0.12);
          $("rmsg").className = "msg big";
          $("rmsg").innerHTML = "😡 ENRAGED! " + (ep.duration / 1000).toFixed(1) + " seconds";
        }
        const weapon = S.gear.weapon || null,
          tier = rollCritTier(hs.critChance + demiseCritBonus(weapon, target));
        const _swp = typeof swordPierceFracV90 === "function" ? swordPierceFracV90(weapon) : 0,
          _edef = target.def * (1 - _swp);
        const mit = Math.max(0.35, 100 / (100 + _edef * 1.6)),
          phys = Math.max(1, hs.atk * mit),
          pierce = hs._pierce || 0;
        const em = r => {
          r = (r || 0) * demiseResistanceFactor(weapon) - pierce;
          return r < 0 ? 1 + -r * 2 : Math.max(0.1, 1 - r * 1.4);
        };
        const ele =
          ((hs.fire || 0) * em(target.res.fire) +
            (hs.ice || 0) * em(target.res.ice) +
            (hs.lightning || 0) * em(target.res.lightning)) *
          (typeof elemHitFactorV50 === "function" ? elemHitFactorV50(target) : 1);
        let dmg = (phys + ele) * critMultiplier(tier, hs.critDmg) * (0.9 + Math.random() * 0.2);
        if (target.boss) dmg *= 1 + (hs._bossDamage || 0);
        if (target.hp / target.max < 0.35) dmg *= 1 + (hs._woundDamage || 0);
        if (run.hero.hp / run.hero.max < 0.5) dmg *= hs._berserk;
        setTimeout(() => {
          if (!run || run.over || target.hp <= 0) return;
          if (target.evadeUntil && run.time < target.evadeUntil && Math.random() < 0.5) {
            floatDmg("foe", "MISS", 0, "#c9a6ff", target._x);
            return;
          }
          let dd = dmg;
          if (target.shieldUntil && run.time < target.shieldUntil) dd *= 0.18;
          target.hp -= dd;
          target.hurt = 1;
          run.dmgLog.push([run.time, dd]);
          if (run.mech && run.mech.onHit && target.boss) run.mech.onHit(target);
          spawnHit(target._x, GY - 22, tier >= 1, tier >= 1 ? 14 + tier * 5 : 9);
          try {
            heroHitShakeV67(dd, tier);
          } catch (e) {
            if (tier >= 2) softShake();
          }
          if (tier >= 3) flash(CRITCOL[Math.min(5, tier)]);
          const ec =
            ele > phys
              ? hs.fire >= hs.ice && hs.fire >= hs.lightning
                ? "--fire"
                : hs.ice >= hs.lightning
                  ? "--ice"
                  : "--lightning"
              : "--gold";
          floatDmg("foe", dd, tier, ele > 0 ? cvar(ec) : "#ffd0a0", target._x);
          beep(tier >= 1 ? 500 + tier * 35 : 300, 0.045, "square", 0.07);
          if (target.boss && target.reflectUntil && run.time < target.reflectUntil) {
            const ref = Math.min(run.hero.max * 0.05, dd * 0.16);
            run.hero.hp -= ref;
            floatDmg("hero", "🔷 " + Math.round(ref), 0, "#bff4ff");
            if (run.hero.hp <= 0) {
              heroDown();
              return;
            }
          }
          if (
            target.thornUntil &&
            !target.gammaThornsV51 &&
            run.time < target.thornUntil
          ) {
            const ref = Math.max(1, (target.lvl * 1.2 + target.atk * 0.18) * (target.elite ? 1.45 : 1));
            run.hero.hp -= ref;
            floatDmg("hero", "✹ " + Math.round(ref), 0, "#e4cf72");
            if (run.hero.hp <= 0) {
              heroDown();
              return;
            }
          }
          applyWeaponEffects(target, dd, tier, hs, weapon, em);
          if (hs.lifesteal > 0) {
            const _lr = typeof celestialLeechReductionV50 === "function" ? celestialLeechReductionV50() : 0;
            const heal = Math.min(
              run.hero.max * (hs._leechCap || 0.04),
              ((dd * leechPct(hs.lifesteal)) / 100) * (1 - _lr)
            );
            run.hero.hp = Math.min(run.hero.max, run.hero.hp + heal);
          }
          if (run.chainHits > 0 && run.time < run.chainUntil) {
            run.chainHits--;
            if (run.chainHits <= 0) {
              run.chainHits = 0;
              flash("#ffd24a");
              floatDmg("hero", "⛓ BROKEN!", 0, "#ffd24a");
              beep(720, 0.12, "triangle", 0.1);
            }
          }
          if (target.hp <= 0) killFoe(target, tier);
          drawBars();
        }, 105);
      }
    }
    for (const f of run.foes) {
      if (f.hp <= 0) continue;
      if (f.freezeUntil && run.time < f.freezeUntil) continue;
      f.cd -= 150;
      if (f.cd <= 0) {
        f.cd =
          (1700 + Math.random() * 300) *
          enemyAttackDelay(f) *
          (f.slowUntil && run.time < f.slowUntil ? 1.7 : 1) *
          (f.hasteMul || 1) *
          (typeof abyssHasteMulV50 === "function" ? abyssHasteMulV50(f) : 1);
        f.atkA = 1;
        if (f.castV102 != null && typeof window.__casterShootV102 === "function") {
          window.__casterShootV102(f);
        } else
          (function (ff) {
            setTimeout(() => {
              if (!run || run.over || ff.hp <= 0) return;
              const hh = heroStats(),
                dp = dodgePct(hh.dodge || 0);
              if (dp > 0 && Math.random() * 100 < dp) {
                floatDmg("hero", "DODGE", 0, "#9fe6ff");
                return;
              }
              const _ep =
                  typeof enemyDmgProfileV91 === "function"
                    ? enemyDmgProfileV91(ff, hh)
                    : { mult: 1, keep: 1 - defPct(hh.def || 0) / 100, col: null },
                enemyCrit = Math.random() < enemyCritChance(),
                sb = skillBonuses();
              let dmg =
                Math.max(
                  1,
                  ff.atk * _ep.mult * burnAttackFactor(ff) * _ep.keep * (0.9 + Math.random() * 0.2)
                ) *
                (enemyCrit ? (typeof abyssCritMultV50 === "function" ? abyssCritMultV50() : 2) : 1) *
                (sb.damageTaken == null ? 1 : sb.damageTaken) *
                (typeof abyssDamageMulV50 === "function" ? abyssDamageMulV50() : 1) *
                (typeof window.__fragMulV102 === "function" ? window.__fragMulV102() : 1);
              if (run.hero.hp / run.hero.max < 0.5) dmg *= Math.max(0.5, 1 - (sb.lowHpGuard || 0));
              if (typeof abyssExcessHpDmgV50 === "function") {
                const _hpd = abyssExcessHpDmgV50(run.hero.max);
                if (_hpd > 0) dmg += _hpd * (sb.damageTaken == null ? 1 : sb.damageTaken);
              }
              if (tryHardHatBlock()) return;
              run.hero.hp -= dmg;
              anim.hero.hurt = 1;
              floatDmg("hero", dmg, enemyCrit ? 1 : 0, enemyCrit ? "#ff5b68" : _ep.col || "#ff8080");
              if (enemyCrit) {
                softShake();
                flash("#ff3f54");
                beep(95, 0.12, "sawtooth", 0.12);
              }
              if (run.hero.hp <= 0) {
                heroDown();
                return;
              }
              drawBars();
            }, 145);
          })(f);
      }
    } /*V92elem*/
    if (run.mech) {
      const boss = run.foes.find(f => f.boss && f.hp > 0);
      if (!boss) {
        if (run.cast) hideCast();
      } else if (run.cast) {
        run.cast.left -= 150;
        const cf = $("cbfill");
        if (cf) cf.style.width = Math.min(100, (1 - run.cast.left / run.cast.dur) * 100) + "%";
        if (run.cast.m.tick) run.cast.m.tick(boss, 150);
        if (run.cast.left <= 0) {
          const mm = run.cast.m;
          hideCast();
          if (mm.resolve) mm.resolve(boss);
          run.nextCastAt = run.time + mm.cd * (boss.hasteMul || 1);
        }
      } else {
        if (run.nextCastAt == null) run.nextCastAt = run.time + 2800;
        if (run.time >= run.nextCastAt && (boss.enter || 0) < 0.3 && !run.over) startCast(run.mech, boss);
      }
    }
    if (!run.over) {
      run.time += 150;
      run.pT += 150;
      run.dmgLog = run.dmgLog.filter(e => e[0] > run.time - 10000);
      run.dpsT = (run.dpsT || 0) + 150;
      if (run.dpsT >= 1000) {
        run.dpsT -= 1000;
        const dps = run.dmgLog.reduce((a, e) => a + e[1], 0) / 10;
        const de = $("dps");
        if (de) de.textContent = "DPS " + fmt(dps);
        const df = $("dpsfill");
        if (df) df.style.width = Math.min(100, Math.max(2, (Math.log10(dps + 1) / 5) * 100)) + "%";
      }
      if (run.pT >= 500) {
        run.pT -= 500;
        if (run.heroPoisonUntil && run.time < run.heroPoisonUntil && !run.over) {
          run.hero.hp -= run.heroPoisonDmg;
          floatDmg("hero", Math.round(run.heroPoisonDmg), 0, "#9be07f");
          if (run.hero.hp <= 0) heroDown();
        }
        for (const f of run.foes) {
          if (f.pois && f.pois.length) f.pois = f.pois.filter(t => t > run.time);
          if (f.hp > 0 && f.pois && f.pois.length) {
            const pd =
              f.pois.length *
              (hs.poison || 0) *
              0.22 *
              (f.diseasePower ? 2 : 1) *
              (typeof elemAmpMulV93 === "function" ? elemAmpMulV93(hs) : 1);
            if (pd > 0) {
              f.hp -= pd;
              run.dmgLog.push([run.time, pd]);
              floatDmg("foe", pd, 0, "#7fe07f", f._x);
              spawnStatusParticles(f, "poison", 3);
              if (f.hp <= 0) {
                killFoe(f);
                continue;
              }
            }
          }
          if (f.hp > 0 && f.burnDmg > 0 && (f.burnUntil > run.time || (f.combustStacks || 0) > 0)) {
            const stacks = (f.burnUntil > run.time ? 1 : 0) + (f.combustStacks || 0),
              bd = f.burnDmg * stacks * (typeof elemAmpMulV93 === "function" ? elemAmpMulV93(hs) : 1);
            f.hp -= bd;
            run.dmgLog.push([run.time, bd]);
            floatDmg("foe", bd, 0, "#ff8a3a", f._x);
            spawnStatusParticles(f, "burn", 3);
            if (f.hp <= 0) killFoe(f);
          }
        }
      }
    }
    drawBars();
    updateStatusFx();
    renderStatPanel();
  }
  /* ---- tick: later layers (moved here) ---- */
};

// Status icons updated for new durations/mechanics.
updateStatusFx = function () {
  prev32: {
    prev13: {
      if (!run) break prev13;
      const now = run.time;
      let h = "";
      if (run.frozenUntil && now < run.frozenUntil)
        h += fxIcon("❄", 1 - (run.frozenUntil - now) / 2600, "debuff");
      if (run.heroPoisonUntil && now < run.heroPoisonUntil)
        h += fxIcon("☠", 1 - (run.heroPoisonUntil - now) / 5000, "debuff");
      if (run.enrageT > 0) h += fxIcon("😡", 1 - run.enrageT / (run.enrageDuration || 4000), "buff");
      if (run.chainHits > 0 && now < run.chainUntil)
        h += fxIcon("⛓", 1 - (run.chainUntil - now) / 6500, "debuff", run.chainHits);
      if (run.suppressedSlot && run.suppressedUntil > now)
        h += fxIcon("⌫", 1 - (run.suppressedUntil - now) / 6000, "debuff");
      if ((run.slowStacks || 0) > 0) h += fxIcon("🕳️", 0, "debuff", run.slowStacks);
      if (run.xpMult > 1) h += fxIcon("📖", 0, "buff");
      if (run.hero && run.hero.hp / run.hero.max < 0.5 && skillBonuses().berserk > 1)
        h += fxIcon("⚔", 0, "buff");
      const he = $("herofx");
      if (he) he.innerHTML = h;
      run.foes.forEach((f, i) => {
        const el = $("foefx" + i);
        if (!el) return;
        let q = "";
        if (f.hp > 0) {
          if (f.burnUntil && now < f.burnUntil) q += fxIcon("🔥", 1 - (f.burnUntil - now) / 2000, "debuff");
          if (f.slowUntil && now < f.slowUntil) q += fxIcon("❄", 1 - (f.slowUntil - now) / 1600, "debuff");
          if (f.pois && f.pois.length) {
            const nearest = Math.min.apply(null, f.pois);
            q += fxIcon("☠", 1 - (nearest - now) / 4200, "debuff", f.pois.length);
          }
          if (f.bleedC > 0) q += fxIcon("🩸", f.bleedC / 4, "debuff", f.bleedC);
          if (f.shieldUntil && now < f.shieldUntil)
            q += fxIcon("🪨", 1 - (f.shieldUntil - now) / 4500, "buff");
          if (f.evadeUntil && now < f.evadeUntil) q += fxIcon("🌑", 1 - (f.evadeUntil - now) / 4200, "buff");
          if (f.reflectUntil && now < f.reflectUntil)
            q += fxIcon("🔷", 1 - (f.reflectUntil - now) / 4800, "buff");
        }
        el.innerHTML = q;
      });
    }
    /* ---- updateStatusFx: later layers (moved here) ---- */
    if (!run) break prev32;
    if (typeof gammaCrownSync === "function") gammaCrownSync();
    run.foes.forEach((f, i) => {
      if (f.hp <= 0 || !f.thornUntil || run.time >= f.thornUntil) return;
      const el = $("foefx" + i);
      if (el) el.innerHTML += fxIcon("✹", 1 - (f.thornUntil - run.time) / (f.gammaThornsV51 ? 4000 : f.elite ? 6200 : 4600), "buff");
    });
  }
  if (!run) return;
  run.foes.forEach((f, i) => {
    const el = $("foefx" + i);
    if (!el || f.hp <= 0) return;
    if (f.specialCast)
      el.innerHTML += fxIcon(f.specialCast.icon, 1 - f.specialCast.left / f.specialCast.dur, "buff");
    if (f.healGlowUntil && run.time < f.healGlowUntil)
      el.innerHTML += fxIcon("✚", 1 - (f.healGlowUntil - run.time) / 1600, "buff");
  });
};

// Gold and shards scale with late game depth. Bloodforged equipment uses the general legendary drop roll.
killFoe = function (f, critTier) {
  const wasDead = !!f.dead,
    shardsBefore = S.shards,
    goldBefore = S.gold,
    bagsBefore = run && run.bags ? run.bags.length : 0,
    isHunt = !!(run && run.hunt),
    areaIndex = run ? run.ai : -1;
  prev14: {
    if (f.dead) break prev14;
    if (f.revive && !f.revived) {
      f.revived = 1;
      f.hp = Math.max(1, Math.round(f.max * 0.5));
      f.hurt = 1;
      floatDmg("foe", "↺ REVIVE", 0, "#c46bff", f._x);
      drawBars();
      break prev14;
    }
    f.hp = 0;
    f.dead = 1;
    const ct = critTier || 0,
      sb = skillBonuses();
    beep(660, 0.07);
    spawnHit(f._x, GY - 22, true, 22 + ct * 8, true);
    if (ct >= 2) softShake();
    if (ct >= 3) flash(CRITCOL[Math.min(5, ct)]);
    advanceGrowth();
    const lvl = f.lvl,
      hh = heroStats();
    const baseGold = 15 + lvl * 10 + Math.pow(lvl, 1.65) * 1.8;
    const gg = Math.round(baseGold * (f.boss ? 30 : 1) * sb.lootGold * (1 + (hh.goldBoost || 0) / 100));
    const sg = Math.round((4 + lvl * 0.9) * (f.boss ? 5 : 1));
    S.gold += gg;
    S.shards += sg;
    $("gold").textContent = fmtCur(S.gold);
    $("shards").textContent = fmtCur(S.shards);
    if (run.a.gimmick === "drown") run.air = Math.min(100, (run.air || 0) + 9);
    gainXP(Math.round(4 + lvl * 3) + (f.boss ? lvl * 4 : 0));
    let dc = (f.boss ? 1 : 0.07) + sb.dropChance + (hh.lootChance || 0) / 400;
    if (!f.boss) dc = Math.min(0.45, dc);
    const nBags = (f.boss ? 3 : 1) + (f.boss ? sb.bossBags : 0);
    if (Math.random() < dc) {
      for (let k = 0; k < nBags; k++) {
        let rar = rollRarity(lvl);
        for (let rb = 0; rb < sb.rarityBoost; rb++) rar = Math.max(rar, rollRarity(lvl));
        if (f.boss) rar = Math.min(4, rar + 1);
        const slot = SLOTS[Math.floor(Math.random() * S.slotsOpen)].key;
        run.bags.push({ rar, lvl, slot });
        addBagChip(rar);
      }
    }
    run.hero.hp = Math.min(run.hero.max, run.hero.hp + run.hero.max * heroStats()._killHeal);
    scheduleSave();
    if (run.foes.every(x => x.hp <= 0)) {
      if (f.boss) areaClear();
      else {
        $("rmsg").className = "msg";
        $("rmsg").innerHTML = "Wave clear! +" + fmt(gg) + "g";
        setTimeout(() => {
          if (run && !run.over) nextWave();
        }, 550);
      }
    } else {
      drawBars();
      if (!f.boss && run.foes.some(x => x.boss && x.hp > 0))
        setTimeout(() => {
          if (run && !run.over) {
            run.foes = run.foes.filter(x => x.boss || x.hp > 0);
            buildFoeBars();
            drawBars();
          }
        }, 550);
    }
  }
  /* ---- killFoe: later layers (moved here) ---- */
  if (wasDead || !f.dead) return;
  S.shards = shardsBefore;
  if (isHunt && run) {
    S.gold = goldBefore + (run.lastHuntGoldReward || 0);
    delete run.lastHuntGoldReward;
  }
  $("gold").textContent = fmtCur(S.gold);
  $("shards").textContent = fmtCur(S.shards);
  if (isHunt && run && run.bags) {
    run.bags.slice(bagsBefore).forEach(b => {
      if (Math.random() < 0.22) b.rar = Math.min(4, b.rar + 1);
      if (Math.random() < 0.05) b.rar = Math.max(3, b.rar);
    });
  }
  if (f.elite && run && run.bags && Math.random() < 0.62) {
    let rar = rollRarity(f.lvl + 8);
    if (Math.random() < 0.18) rar = Math.min(4, rar + 1);
    run.bags.push({ rar, lvl: f.lvl, slot: SLOTS[Math.floor(Math.random() * S.slotsOpen)].key });
    addBagChip(rar);
    $("rmsg").className = "msg big";
    $("rmsg").innerHTML = "◆ Elite defeated · bonus loot chance";
  }
  if (shouldDropSkullToken(f, isHunt, areaIndex)) {
    S.skullTokens = (S.skullTokens || 0) + 1;
    $("rmsg").className = "msg big";
    $("rmsg").innerHTML = "☠ Skull Token found · " + S.skullTokens + " owned";
  }
  scheduleSave();
};
