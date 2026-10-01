/* Passive skill tree, masteries, active skills, boons and medals. */

function actx() {
  AC = AC || new (window.AudioContext || window.webkitAudioContext)();
  return AC;
}

function resetSkillCost() {
  const n = investedSkillPoints();
  return n ? Math.round(200 * Math.pow(n, 1.7)) : 0;
}

function allTreeNodes() {
  return Object.values(V6_TREES).flatMap(t => t.nodes);
}

function migrateSkillTree() {
  if (S.flags.skillTreeV6) return;
  const obsolete = ["c4", "c5", "c6", "l4", "l5", "h4", "s3", "s4", "s5", "s6", "s7"];
  let refund = 0;
  obsolete.forEach(id => {
    refund += S.skills[id] || 0;
    delete S.skills[id];
  });
  S.sp += refund;
  S.flags.skillTreeV6 = true;
}

function specialMeta(f) {
  if (f.key === "celoracle")
    return { name: "✦ CELESTIAL MEND", dur: f.elite ? 1250 : 1600, cd: f.elite ? 5000 : 6900, icon: "✦" };
  if (f.key === "celpurifier")
    return { name: "◇ PURIFYING MARK", dur: f.elite ? 1150 : 1450, cd: f.elite ? 5200 : 7200, icon: "◇" };
  if (f.key === "celwarden")
    return { name: "⬡ IVORY AEGIS", dur: f.elite ? 1300 : 1650, cd: f.elite ? 5600 : 7600, icon: "⬡" };
  if (f.key === "shaman")
    return { name: "✚ SPIRIT MEND", dur: f.elite ? 1450 : 1750, cd: f.elite ? 5400 : 7200, icon: "✚" };
  if (f.key === "plaguefrog")
    return { name: "☠ PLAGUE SPIT", dur: f.elite ? 1250 : 1550, cd: f.elite ? 5900 : 7900, icon: "☠" };
  return { name: "✹ THORN WARD", dur: f.elite ? 1300 : 1650, cd: f.elite ? 6200 : 8600, icon: "✹" };
  /* ---- specialMetaV7: later layers (moved here) ---- */
}

function canSpecialCast(f) {
  if (f.key === "celoracle") return run.foes.some(x => x.hp > 0 && x.hp < x.max * 0.95);
  if (f.key !== "shaman") return true;
  return run.foes.some(x => x.hp > 0 && x.hp < x.max * 0.94);
  /* ---- canSpecialCastV7: later layers (moved here) ---- */
}

function resolveSpecial(f) {
  if (f.key === "celoracle") {
    const alive = run.foes.filter(x => x.hp > 0).sort((a, b) => a.hp / a.max - b.hp / b.max),
      target = alive[0];
    if (target) {
      const amount = Math.min(target.max * 0.12, f.atk * 5);
      target.hp = Math.min(target.max, target.hp + amount);
      target.healGlowUntil = run.time + 1500;
      floatDmg("foe", "✦ " + Math.round(amount), 0, "#ffffff", target._x);
    }
  } else if (f.key === "celpurifier") {
    if (celestialDebuffAllowed()) {
      run.purityUntil = run.time + 6000;
      floatDmg("hero", "◇ CRITICALS SEALED", 0, "#eaffff");
    } else floatDmg("hero", "NIMBLE", 0, "#78fff1");
  } else if (f.key === "celwarden") {
    run.foes.filter(x => x.hp > 0).forEach(x => (x.shieldUntil = run.time + 3800));
    floatDmg("foe", "⬡ AEGIS", 0, "#fff5c9", f._x);
  } else {
    if (f.key === "shaman") {
      const alive = run.foes.filter(x => x.hp > 0),
        target = alive.sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
      if (target) {
        healBlast(f);
        target.healGlowUntil = run.time + 1600;
      }
    } else if (f.key === "plaguefrog") poisonShot(f);
    else {
      f.thornUntil = run.time + (f.elite ? 6200 : 4600);
      floatDmg("foe", "✹ THORNS", 0, "#d6c46c", f._x);
      beep(240, 0.18, "triangle", 0.09);
    }
  }
}

function updateSpecialBars() {
  if (!run) return;
  run.foes.forEach((f, i) => {
    const bar = $("spcast" + i),
      name = $("spname" + i);
    if (!bar || !name) return;
    if (f.specialCast) {
      bar.classList.add("on");
      name.classList.add("on");
      name.textContent = f.specialCast.name;
      bar.querySelector("i").style.width =
        Math.min(100, (1 - f.specialCast.left / f.specialCast.dur) * 100) + "%";
    } else {
      bar.classList.remove("on");
      name.classList.remove("on");
      bar.querySelector("i").style.width = "0%";
    }
  });
}

function resetSkills() {
  const n = investedSkillPoints(),
    c = resetSkillCost();
  if (!n) return;
  if (S.gold < c) {
    showTip(
      "NOT ENOUGH GOLD",
      "Resetting " +
        n +
        " invested skill points costs <b>" +
        fmt(c) +
        " gold</b>. You currently have <b>" +
        fmtCur(S.gold) +
        " gold</b>."
    );
    return;
  }
  if (!confirm("Reset " + n + " invested skill points for " + fmt(c) + " gold?")) return;
  S.gold -= c;
  S.sp += n;
  S.skills = {};
  beep(500, 0.12, "triangle");
  scheduleSave();
  renderTree();
  renderTown();
}

function portableBoons(raw) {
  const keys = new Set(Object.keys(defaultState().boons).concat(Object.keys(STAT_LABEL))),
    out = numericMap(raw, keys, 1e9);
  return Object.assign(defaultState().boons, out);
}

function portableBoonList(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .slice(0, 200)
    .map(b => ({ n: textV19(b && b.n, 50), i: textV19(b && b.i, 8), d: textV19(b && b.d, 120) }))
    .filter(b => b.n);
}

function xpBuffActive() {
  return xpBuffRemaining() > 0;
}

function activateXpBuff() {
  S.xpBuffUntil = Math.max(Date.now(), S.xpBuffUntil || 0) + XP_BUFF_DURATION;
  S.xpBuff = 0;
  scheduleSave();
}

function omegaLoadoutReadiness() {
  return SLOTS.reduce((sum, slot) => sum + omegaItemReadiness(S.gear && S.gear[slot.key]), 0) / SLOTS.length;
}

// Existing saves could hold skills above their real max (the old preset over-invested); clamp
// every skill to its node's max, drop illegal exclusive-branch picks, and refund the freed points.
function migrateSkillCapsV50() {
  if (S.flags && S.flags.skillCapsV50) return;
  try {
    const nodes = typeof allTreeNodes === "function" ? allTreeNodes() : [];
    if (!nodes.length) return;
    const byId = {};
    nodes.forEach(n => (byId[n.id] = n));
    let refund = 0;
    for (const id in S.skills) {
      const n = byId[id];
      if (!n) {
        refund += S.skills[id] || 0;
        delete S.skills[id];
        continue;
      }
      if ((S.skills[id] || 0) > n.max) {
        refund += S.skills[id] - n.max;
        S.skills[id] = n.max;
      }
    }
    const groupBest = {};
    nodes.forEach(n => {
      if (n.group && (S.skills[n.id] || 0) > 0) {
        const b = groupBest[n.group];
        if (!b || (S.skills[n.id] || 0) > (S.skills[b] || 0)) groupBest[n.group] = n.id;
      }
    });
    nodes.forEach(n => {
      if (n.group && (S.skills[n.id] || 0) > 0 && groupBest[n.group] !== n.id) {
        refund += S.skills[n.id] || 0;
        delete S.skills[n.id];
      }
    });
    S.sp = (S.sp || 0) + refund;
    S.flags = S.flags || {};
    S.flags.skillCapsV50 = true;
  } catch (e) {}
}

function deadlyActive() {
  return !!(run && !run.over && (run.ai >= CELESTIAL_AREA_START || (run.a && run.a.abyss)));
}

function emptyBoonPct() {
  return {
    atk: 0,
    hp: 0,
    def: 0,
    atkSpeed: 0,
    critChance: 0,
    critDmg: 0,
    dodge: 0,
    dropChance: 0,
    goldBoost: 0
  };
}

function medalForCountV51(n) {
  return n >= 25 ? "gold" : n >= 10 ? "silver" : n >= 3 ? "bronze" : "none";
}

function masteryBonus(ai) {
  const mode = ai % 3;
  return mode === 0
    ? { key: "atk", amount: 1, text: "+1% total Attack" }
    : mode === 1
      ? { key: "hp", amount: 1, text: "+1% maximum Health" }
      : { key: "dropChance", amount: 5, text: "+5% item drop chance" };
}

function grantMedalRewards(ai, count, abyss) {
  ensureV51State();
  let claims = abyss ? S.abyssAreaMedalClaimsV51 : S.areaMedalClaimsV51,
    key = String(ai),
    claimed = claims[key] || "none",
    rank = { none: 0, bronze: 1, silver: 2, gold: 3 };
  let message = "";
  const lvl = ((AREAS[ai] && AREAS[ai].lvl) || 1) + (abyss ? 60 : 0);
  if (count >= 3 && rank[claimed] < 1) {
    const gold = Math.round(750 * Math.pow(lvl + 1, 1.18)),
      shards = Math.round(30 + lvl * 7);
    S.gold += gold;
    S.shards += shards;
    if (ai >= 12) {
      const cs = abyss ? 3 : 1;
      S.celestialShards = (S.celestialShards || 0) + cs;
      message =
        "Bronze mastery · " + fmt(gold) + " gold · " + fmt(shards) + " shards · " + cs + " Celestial shard";
    } else message = "Bronze mastery · " + fmt(gold) + " gold · " + fmt(shards) + " shards";
    claims[key] = "bronze";
    claimed = "bronze";
  }
  if (count >= 10 && rank[claimed] < 2) {
    const b = masteryBonus(ai);
    S.boonPctV51[b.key] = (S.boonPctV51[b.key] || 0) + b.amount;
    message = "Silver mastery · " + b.text;
    claims[key] = "silver";
    claimed = "silver";
  }
  if (count >= 25 && rank[claimed] < 3) {
    const b = masteryBonus(ai);
    S.boonPctV51[b.key] = (S.boonPctV51[b.key] || 0) + b.amount;
    const epic = Math.max(1, Math.round(lvl / 8));
    S.epicShards += epic;
    message = "Gold mastery · another " + b.text.replace(/^\+/, "+") + " · " + epic + " epic shards";
    claims[key] = "gold";
  }
  return message;
}

function decorateAreaMastery() {
  ensureV51State();
  const abyss = !!(S.abyssUnlocked && S.abyssMode),
    map = abyss ? S.abyssAreaClearsV51 : S.areaClearsV51,
    tiles = [...$("areas").querySelectorAll(".atile")].slice(0, AREAS.length);
  tiles.forEach((tile, i) => {
    const count = Number(map[i]) || 0,
      medal = medalForCountV51(count),
      cleared = abyss ? (S.abyssCleared || []).includes(i) : S.clearedAreas.includes(i),
      name = tile.querySelector(".anm"),
      tip = tile.querySelector(".atip");
    if (cleared && name && !name.textContent.includes("✓")) name.textContent += " ✓";
    const tn = tile.querySelector(".tn");
    if (cleared && tn && !tn.textContent.includes("✓")) tn.textContent += " ✓";
    if (name) {
      let badge = name.querySelector(".masterybadgev51");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "masterybadgev51";
        name.appendChild(badge);
      }
      badge.className = "masterybadgev51 " + medal;
      badge.textContent = (MEDAL_ICONS[medal] || "") + " " + count;
    }
    if (tip) {
      let line = tip.querySelector(".masterylinev51");
      if (!line) {
        line = document.createElement("div");
        line.className = "masterylinev51";
        tip.appendChild(line);
      }
      const next = count < 3 ? 3 : count < 10 ? 10 : count < 25 ? 25 : null;
      line.textContent =
        "Cleared " +
        count +
        " time" +
        (count === 1 ? "" : "s") +
        (next ? " · next mastery " + count + " / " + next : " · Gold mastery complete");
    }
  });
}

function masteryBonusV52(ai) {
  const mode = ai % 3;
  return mode === 0
    ? { text: "+1% total Attack" }
    : mode === 1
      ? { text: "+1% maximum Health" }
      : { text: "+5% item drop chance" };
}

function masteryPreviewV52(ai, abyss) {
  const lvl = ((AREAS[ai] && AREAS[ai].lvl) || 1) + (abyss ? 60 : 0),
    gold = Math.round(750 * Math.pow(lvl + 1, 1.18)),
    shards = Math.round(30 + lvl * 7),
    cel = ai >= 12 ? (abyss ? 3 : 1) : 0,
    b = masteryBonusV52(ai),
    epic = Math.max(1, Math.round(lvl / 8));
  return {
    bronze:
      fmt(gold) +
      " gold · " +
      fmt(shards) +
      " shards" +
      (cel ? " · " + cel + " Celestial shard" + (cel === 1 ? "" : "s") : ""),
    silver: b.text,
    gold: b.text + " again · " + epic + " epic shards"
  };
}

function decorateAreaMasteryV52() {
  ensureV52State();
  const abyss = !!(S.abyssUnlocked && S.abyssMode),
    map = abyss ? S.abyssAreaClearsV51 : S.areaClearsV51,
    tiles = [...$("areas").querySelectorAll(".atile")].slice(0, AREAS.length);
  tiles.forEach((tile, i) => {
    const count = Number(map[i]) || 0,
      medal = forgeV51.medalForCount(count),
      name = tile.querySelector(".anm"),
      tip = tile.querySelector(".atip"),
      rewards = masteryPreviewV52(i, abyss);
    if (name) {
      let badge = name.querySelector(".masterybadgev51");
      if (!badge) {
        badge = document.createElement("span");
        name.appendChild(badge);
      }
      badge.className = "masterybadgev51 " + medal + (count ? "" : " zero");
      badge.textContent = "×" + count;
    }
    // clear count only; the medal shows as the tile border. Full details: Compendium → Area Mastery
    tile.classList.remove("medal-bronze", "medal-silver", "medal-gold");
    if (medal !== "none") tile.classList.add("medal-" + medal);
  });
}

function emptyTreeMastery() {
  return { combat: 0, loot: 0, heal: 0, smith: 0 };
}

function ensureTreeMastery(state = S) {
  state.treeMasteryV65 = Object.assign(emptyTreeMastery(), state.treeMasteryV65 || {});
  Object.keys(TREE_MASTERY_CFG).forEach(
    k => (state.treeMasteryV65[k] = Math.max(0, Math.floor(Number(state.treeMasteryV65[k]) || 0)))
  );
  return state.treeMasteryV65;
}

function masteryMarginal(kind, level) {
  const c = TREE_MASTERY_CFG[kind],
    n = Math.max(1, Number(level) || 1),
    ratio = Math.pow(c.at50 / c.first, 1 / 49);
  return c.first * Math.pow(ratio, n - 1);
}

function masteryTotal(kind, levels) {
  const c = TREE_MASTERY_CFG[kind],
    n = Math.max(0, Math.floor(Number(levels) || 0));
  if (!n) return 0;
  const ratio = Math.pow(c.at50 / c.first, 1 / 49);
  return (c.first * (1 - Math.pow(ratio, n))) / (1 - ratio);
}

function treeMasteryReady(kind) {
  return Object.values(S.skills || {}).reduce((sum, v) => sum + (Number(v) || 0), 0) >= 50;
}

function spendTreeMastery(kind) {
  ensureTreeMastery();
  if (!TREE_MASTERY_CFG[kind] || !treeMasteryReady(kind) || S.sp <= 0) return false;
  S.sp--;
  S.treeMasteryV65[kind]++;
  beep(760, 0.1, "triangle");
  flash(V6_TREES[kind].col);
  scheduleSave();
  renderTree();
  renderTown();
  return true;
}

function masteryText(kind) {
  ensureTreeMastery();
  const level = S.treeMasteryV65[kind],
    next = masteryMarginal(kind, level + 1),
    total = masteryTotal(kind, level),
    cfg = TREE_MASTERY_CFG[kind];
  return {
    level,
    next,
    total,
    label: cfg.label,
    nextText: (next >= 0.1 ? next.toFixed(2) : next.toFixed(3)) + "%",
    totalText: total.toFixed(2) + "%"
  };
}

// Skill reset at the requested formula: 200 * invested^1.7 gold.
// Earlier version of investedSkillPoints(), extended by the functions that follow.
function investedSkillPointsBase() {
  return Object.values(S.skills).reduce((a, b) => a + (+b || 0), 0);
}

function investedSkillPoints() {
  const m = ensureTreeMastery();
  return investedSkillPointsBase() + Object.values(m).reduce((a, v) => a + v, 0);
}

function regularSkillSpendV70(state = S) {
  return Object.values((state && state.skills) || {}).reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function masteryReadyV72(ai, abyss) {
  const r = contractStageRecordV72(ai, abyss);
  return ["blood", "onslaught", "iron", "glass"].every(k => r[k]) && !r.mastery;
}

function actualPortrait(kind, id) {
  const cacheKey = kind + ":" + id;
  if (portraitCache[cacheKey]) return portraitCache[cacheKey];
  const liveCtx = ctx,
    renderCanvas = document.createElement("canvas");
  renderCanvas.width = 240;
  renderCanvas.height = 220;
  const portraitCtx = renderCanvas.getContext("2d");
  if (!portraitCtx) return "";
  try {
    ctx = portraitCtx;
    ctx.clearRect(0, 0, renderCanvas.width, renderCanvas.height);
    let f;
    if (kind === "enemy") {
      const t = ENEMIES[id];
      if (!t) return "";
      f = buildFoe(id, 20, 1, false, t.n);
    } else {
      const ai = Number(id),
        a = AREAS[ai];
      if (!a) return "";
      f = buildFoe(a.pool[0], a.lvl, 1, true, "★ " + a.boss);
      f.draw.c = BOSSCOL[ai] || f.draw.c;
      f.draw.sz = 1.8;
    }
    f.enter = 0;
    f.hurt = 0;
    f.atkA = 0;
    drawFoe(f, 120, 122);
    const crop = document.createElement("canvas");
    crop.width = 92;
    crop.height = 92;
    crop.getContext("2d").drawImage(renderCanvas, 66, 24, 108, 108, 0, 0, 92, 92);
    portraitCache[cacheKey] = crop.toDataURL("image/png");
    return portraitCache[cacheKey];
  } catch (e) {
    return "";
  } finally {
    ctx = liveCtx;
  }
}

function countMastery(prefix, kind) {
  return Object.entries(S.contractStageV72 || {}).filter(([k, v]) => k.startsWith(prefix) && v && v[kind])
    .length;
}

function areaMasteryCount(level) {
  return Object.values(S.areaClearsV51 || {}).filter(n => (Number(n) || 0) >= level).length;
}

function masteryReadyV75(ai, abyss) {
  return guildCore.masteryReady(ai, abyss);
}

function explainMastery() {
  const box = $("branches"),
    spent = regularSpendV78();
  if (!box) return;
  [...box.querySelectorAll(".branch h3")].forEach(h => {
    const note = h.querySelector("small");
    if (note && spent < 50)
      note.textContent =
        "Invest 50 regular skill points to unlock all four infinite masteries · " + spent + " / 50";
  });
}

function healNode() {
  return (
    [...document.querySelectorAll("#branches .node")].find(n => {
      const tip = n.querySelector(".ntip b"),
        name = n.querySelector(".nn");
      return (tip && tip.textContent === "Field Medic") || (name && name.textContent === "Field Medic");
    }) || null
  );
}

function renderBoonBar() {
  var bar = document.getElementById("boonbar");
  if (!bar || typeof S === "undefined" || !Array.isArray(S.boonList)) return;
  var groups = {},
    order = [];
  S.boonList.forEach(function (b) {
    if (!b) return;
    if (!groups[b.n]) {
      groups[b.n] = { i: b.i, n: b.n, picks: [] };
      order.push(b.n);
    }
    groups[b.n].picks.push(b.d || "");
  });
  if (!order.length) {
    bar.innerHTML = '<span style="color:#5a5270;font-size:11px">no boons yet</span>';
    return;
  }
  bar.innerHTML =
    '<span style="color:var(--dim);font-size:11px">boons:</span> ' +
    order
      .map(function (n) {
        var g = groups[n],
          c = g.picks.length,
          total = sumDesc(g.picks),
          shown = Math.min(c, 6),
          stars =
            '<span class="boonstarsv97">' +
            new Array(shown + 1).join("<i>★</i>") +
            (c > 6 ? '<i class="pl">+</i>' : "") +
            "</span>",
          tip = (g.n + " ×" + c + "  ·  " + total + " total").replace(/"/g, "");
        return '<span class="boonv97" title="' + tip + '">' + g.i + stars + "</span>";
      })
      .join(" ");
}

function invested(id) {
  try {
    var a = S.actV111;
    return ((a.pow && a.pow[id]) || 0) + ((a.dur && a.dur[id]) || 0) + ((a.cd && a.cd[id]) || 0);
  } catch (e) {
    return 0;
  }
}

function skillLocked(id) {
  return id !== "heal" && invested(id) < 1;
}

function actRT() {
  if (typeof run === "undefined" || !run) return null;
  if (!run.actRT) run.actRT = { until: {}, cd: {}, miracleUntil: 0, miracleAcc: 0, miraclePct: 3 };
  return run.actRT;
}

function spentActive() {
  var a = ensureState_p21();
  if (!a) return 0;
  var t = 0;
  for (var k in ACT) {
    t += (a.pow[k] || 0) + (a.dur[k] || 0) + (a.cd[k] || 0);
  }
  return t;
}

function resetCost() {
  var s = spentActive();
  return s > 0 ? Math.round(Math.pow(s * 10, 1.55)) : 0;
}

function durSec(id) {
  var a = ensureState_p21();
  return 6 + (id === "ninja" ? 0.75 : 1) * (a.dur[id] || 0);
}

function cdSec(id) {
  var a = ensureState_p21(),
    c = a.cd[id] || 0,
    base;
  if (id === "heal") base = Math.max(25, 45 - 2 * c);
  else if (id === "miracle") base = Math.max(35, 50 - 1.5 * c);
  else if (id === "cleanse") base = Math.max(70, 100 - 3 * c);
  else base = ACT[id].baseCd;
  var red = 0;
  try {
    var hs = heroStats();
    red = Math.min(0.5, (hs.cooldown || hs.cdr || hs.healCdr || 0) / 100);
  } catch (e) {}
  return base * (1 - red);
}

function powVal(id) {
  var a = ensureState_p21(),
    p = a.pow[id] || 0;
  switch (id) {
    case "berserk":
      return { dealt: 15 + 4 * p, taken: 40 - 3 * p };
    case "rage":
      return 30 + 6 * p;
    case "elementAmp":
      return 50 + 5 * p; // was 100 + 10p: doubled every status effect
    case "toughen":
      return { pen: 15 - 1.5 * p, mit: 40 + 3 * p };
    case "ninja":
      return 12 + 1 * p; /* nerfed: was 20+2p (max 40) -> now 12+1p (max 22) */
    case "heal":
      return 30 + p;
    case "miracle":
      return 3 + 0.2 * p;
    default:
      return 0;
  }
}

function buffOn(id) {
  var rt = actRT();
  return !!(rt && rt.until && (rt.until[id] || 0) > nowT());
}

function activeMods() {
  var m = { outMult: 1, takenMult: 1, atkSpeedAdd: 0, dodgeAdd: 0, eleMult: 1 };
  try {
    if (typeof run === "undefined" || !run || run.over) return m;
    var a = ensureState_p21();
    if (!a) return m;
    var rt = actRT();
    if (!rt) return m;
    var t = nowT();
    function on(id) {
      return (rt.until[id] || 0) > t;
    }
    if (on("berserk")) {
      var b = powVal("berserk");
      m.outMult *= 1 + b.dealt / 100;
      m.takenMult *= 1 + b.taken / 100;
    }
    if (on("rage")) m.atkSpeedAdd += powVal("rage");
    if (on("elementAmp")) m.eleMult *= 1 + powVal("elementAmp") / 100;
    if (on("toughen")) {
      var g = powVal("toughen");
      m.outMult *= Math.max(0, 1 - g.pen / 100);
      m.takenMult *= Math.max(0, 1 - g.mit / 100);
    }
    if (on("ninja")) m.dodgeAdd += powVal("ninja");
  } catch (e) {}
  return m;
}

function purgeDebuffs() {
  try {
    if (typeof run === "undefined" || !run) return;
    run.hexV102 = 0;
    run.hexUntilV102 = 0;
    run.chillV102 = 0;
    run._chillTV102 = 0;
    run.heroBurnUntilV102 = 0;
    run.heroBurnDmgV102 = 0;
    run._burnTV102 = 0;
    run.heroPoisonUntil = 0;
    run.frozenUntil = 0;
    run.slowStacks = 0;
    try {
      floatDmg("hero", "🩹 CLEANSED", 0, "#b9a0ff");
    } catch (e) {}
    try {
      updateStatusFx();
    } catch (e) {}
  } catch (e) {}
}

function activate(id) {
  try {
    if (typeof run === "undefined" || !run || run.over) return;
    var a = ensureState_p21();
    if (!a) return;
    if (a.loadout.slice(0, unlockedSlots()).indexOf(id) < 0) return;
    if (skillLocked(id)) return;
    var rt = actRT(),
      t = nowT();
    if ((rt.cd[id] || 0) > t) return;
    if (id === "heal") {
      run.hero.hp = Math.min(run.hero.max, run.hero.hp + (run.hero.max * powVal("heal")) / 100);
      rt.fxHealReal = performance.now() + 750;
    } else if (id === "cleanse") {
      purgeDebuffs();
      rt.fxCleanseReal = performance.now() + 750;
    } else if (id === "miracle") {
      rt.miracleUntil = t + 20000;
      rt.miracleAcc = 0;
      rt.miraclePct = powVal("miracle");
    } else {
      rt.until[id] = t + durSec(id) * 1000;
    }
    rt.cd[id] = t + cdSec(id) * 1000;
    try {
      beep(720, 0.12, "triangle");
    } catch (e) {}
    try {
      floatDmg("hero", ACT[id].icon, 0, ACT[id].col);
    } catch (e) {}
    try {
      renderCombatBtns();
      updateStatusFx();
      renderStatPanel();
    } catch (e) {}
  } catch (e) {}
}

function stripFaith() {
  try {
    var bel = document.getElementById("branches");
    if (!bel) return;
    Array.prototype.slice.call(bel.children).forEach(function (col) {
      var h = col.querySelector("h3");
      if (h && /Faith/i.test(h.textContent)) col.parentNode.removeChild(col);
    });
  } catch (e) {}
}

function ensureSkillUI() {
  var modal = document.getElementById("sktree");
  if (!modal) return;
  if (document.getElementById("sktabsv111")) return;
  var bar = document.createElement("div");
  bar.id = "sktabsv111";
  bar.className = "sktabsv111";
  bar.innerHTML =
    '<button data-tab="passive" class="on">PASSIVE</button><button data-tab="active">ACTIVE</button>';
  var branches = document.getElementById("branches");
  if (branches && branches.parentNode) branches.parentNode.insertBefore(bar, branches);
  else modal.insertBefore(bar, modal.firstChild);
  var panel = document.createElement("div");
  panel.id = "actpanelv111";
  panel.style.display = "none";
  if (branches && branches.parentNode) branches.parentNode.insertBefore(panel, branches.nextSibling);
  else modal.appendChild(panel);
  bar.querySelectorAll("button").forEach(function (btn) {
    btn.onclick = function () {
      setTab(btn.getAttribute("data-tab"));
    };
  });
}

function resetSkillsBtn() {
  return document.getElementById("resetskills");
}

function pips(n, max, col) {
  var h = '<span class="pipsv111">';
  for (var i = 0; i < max; i++) {
    h += '<i class="' + (i < n ? "f" : "") + '" style="' + (i < n ? "background:" + col : "") + '"></i>';
  }
  return h + "</span>";
}

function loadoutBar() {
  var a = ensureState_p21(),
    un = unlockedSlots();
  var h = '<div class="loadbarv112">';
  for (var i = 0; i < 4; i++) {
    if (i < un) {
      var id = a.loadout[i];
      if (id)
        h +=
          '<div class="lslot filled" data-unslot="' +
          id +
          '" style="--cc:' +
          ACT[id].col +
          '" title="' +
          ACT[id].name +
          ' (click to remove)">' +
          ACT[id].icon +
          "</div>";
      else h += '<div class="lslot empty">＋</div>';
    } else h += '<div class="lslot locked">Level ' + SLOT_LV[i] + "</div>";
  }
  return h + "</div>";
}

function renderActivePanel() {
  ensureSkillUI();
  var panel = document.getElementById("actpanelv111");
  if (!panel) return;
  var a = ensureState_p21();
  if (!a) return;
  // older saves can hold skills in the bar that are no longer unlocked
  if (a.loadout.some(skillLocked)) a.loadout = a.loadout.filter(id => !skillLocked(id));
  var h = '<div class="actinfo111"><b style="color:#e8c368">Active points: ' + S.spA + "</b></div>";
  h += loadoutBar();
  h += '<div class="acthdr111 off">⚔ OFFENSIVE</div><div class="actgrid111 g3">';
  OFF.forEach(function (id) {
    h += card_p21(id);
  });
  h += "</div>";
  h += '<div class="acthdr111 def">🛡 DEFENSIVE</div><div class="actgrid111 g2">';
  DEFSQ.forEach(function (id) {
    h += card_p21(id);
  });
  h += "</div>";
  h += '<div class="cleansewrapv112">' + card_p21("cleanse") + "</div>";
  var rc = resetCost();
  h +=
    '<div class="actreset111"><button id="actresetbtn111"' +
    (rc > 0 && S.shards >= rc ? "" : " disabled") +
    ">↺ Reset Active Tree" +
    (rc > 0 ? " — " + fmtCur(rc) + " 💠" : "") +
    "</button></div>";
  panel.innerHTML = h;
  panel.querySelectorAll("button[data-inc]").forEach(function (b) {
    b.onclick = function () {
      var pr = b.getAttribute("data-inc").split(":"),
        track = pr[0],
        id = pr[1];
      var mx = track === "pow" ? POWMAX : track === "dur" ? DURMAX : CDMAX;
      if (S.spA > 0 && (a[track][id] || 0) < mx) {
        a[track][id] = (a[track][id] || 0) + 1;
        S.spA--;
        try {
          beep(680, 0.08, "triangle");
          scheduleSave();
        } catch (e) {}
        renderActivePanel();
        try {
          renderCombatBtns();
        } catch (e) {}
      }
    };
  });
  panel.querySelectorAll("button[data-load]").forEach(function (b) {
    b.onclick = function () {
      var id = b.getAttribute("data-load");
      var i = a.loadout.indexOf(id);
      if (i >= 0) a.loadout.splice(i, 1);
      else if (a.loadout.length < unlockedSlots()) a.loadout.push(id);
      try {
        beep(600, 0.07, "triangle");
        scheduleSave();
      } catch (e) {}
      renderActivePanel();
      try {
        renderCombatBtns();
      } catch (e) {}
    };
  });
  panel.querySelectorAll(".lslot.filled[data-unslot]").forEach(function (el) {
    el.onclick = function () {
      var id = el.getAttribute("data-unslot");
      var i = a.loadout.indexOf(id);
      if (i >= 0) a.loadout.splice(i, 1);
      try {
        beep(560, 0.07, "triangle");
        scheduleSave();
      } catch (e) {}
      renderActivePanel();
      try {
        renderCombatBtns();
      } catch (e) {}
    };
  });
  var rb = document.getElementById("actresetbtn111");
  if (rb)
    rb.onclick = function () {
      var cost = resetCost();
      if (cost <= 0 || S.shards < cost) return;
      S.shards -= cost;
      var refund = spentActive();
      S.spA += refund;
      for (var k in ACT) {
        a.pow[k] = 0;
        a.dur[k] = 0;
        a.cd[k] = 0;
      }
      // skills that are locked again leave the action bar
      a.loadout = a.loadout.filter(function (id) {
        return !skillLocked(id);
      });
      try {
        renderCombatBtns();
      } catch (e) {}
      try {
        beep(500, 0.12, "sawtooth");
        scheduleSave();
        renderTown();
      } catch (e) {}
      renderActivePanel();
      refreshBadges();
    };
  refreshBadges();
}

function reconcileMedals() {
  try {
    if (typeof S === "undefined") return;
    [
      ["areaClearsV51", "areaMedalClaimsV51"],
      ["abyssAreaClearsV51", "abyssAreaMedalClaimsV51"]
    ].forEach(function (pair) {
      var clears = S[pair[0]],
        claims = S[pair[1]];
      if (!clears || typeof clears !== "object") return;
      if (!claims || typeof claims !== "object") {
        claims = S[pair[1]] = {};
      }
      for (var key in clears) {
        var c = Number(clears[key]) || 0;
        var cur = claims[key] || "none";
        if (c >= 3 && cur === "none") {
          claims[key] = "bronze";
        }
      }
    });
  } catch (e) {}
}
