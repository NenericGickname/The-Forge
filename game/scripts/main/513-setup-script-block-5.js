/* ================= script block 5 ================= */

window.__forgeV7Boot = "v75 starting";
const guildCore = window.forgeV70,
  areaUi = window.forgeV72,
  CONTRACTS_V75 = guildCore && guildCore.contracts;
if (
  !guildCore ||
  !CONTRACTS_V75 ||
  typeof guildCore.contractStageRecord !== "function" ||
  typeof guildCore.masteryReady !== "function"
)
  throw new Error("Version 7 Guild interface is unavailable");

ensureGuildOffers();
cleanOffers(offerMode());
contractMarksV75();
if ($("guildv70") && $("guildv70").classList.contains("on")) renderGuildOffers();
document.title = "THE FORGE v7.5.0";
window.__forgeV7Boot = "ready";
window.forgeV75 = {
  offers: cleanOffers,
  launch: launchGuildOffer,
  renderGuild: renderGuildOffers,
  contractMarks: contractMarksV75,
  applyContract: applyContractChallenge,
  cooldown: GUILD_COOLDOWN,
  bossRollChance: 0.33
};

/* ==== nextBossHuntWaveV6 ==== */
/* ==== nextBossHuntWaveV6 ==== */
/* ==== nextBossHuntWaveV6 ==== */
/* ==== nextBossHuntWaveV6 ==== */
/* ==== nextBossHuntWaveV6 ==== */
/* ==== nextBossHuntWaveV6 ==== */
const nextBossHuntWaveBase = nextBossHuntWave;
/* V63 · Void slow belongs to one Abyss Rush encounter and is cleansed before the next boss. */
/* ---- (patch scope opened) ---- */
nextBossHuntWave = function () {
  if (run && run.abyssRush) {
    run.slowStacks = 0;
    run.celestialSlowUntil = 0;
  }
  let prevResult103;
  prev103: {
    if (!run || !run.abyssRush) {
      prevResult103 = nextBossHuntWaveBase();
      break prev103;
    }
    const idx = run.huntIndex;
    if (idx >= run.huntCount) {
      completeBossHunt();
      prevResult103 = undefined;
      break prev103;
    }
    const entry = run.rushSeq[idx],
      ai = entry.ai,
      abyss = !!entry.abyss,
      orig = AREAS[ai],
      a = abyss ? abyssArea(ai, orig) : orig,
      lvl = abyssRushLevelV61(idx, entry, S.heroLevel);
    run.ai = ai;
    run.mirror = ai;
    run.abyss = abyss;
    run.a = a;
    run.wave = idx + 1;
    run.total = run.huntCount;
    run.air = a.gimmick === "drown" ? 100 : null;
    run.airPenaltyT = 0;
    $("gimmick").style.display = a.gimmick === "drown" ? "block" : "none";
    setTempo(155);
    const f = buildFoe(a.pool[0], lvl, 3.2, true, "★ " + a.boss);
    f.atk = Math.round(f.atk * 1.35);
    if (a.gimmick === "drown") {
      f.atk = Math.round(f.atk * 0.62);
    }
    f._x = foeBaseX(0, 1);
    f.bossIdx = ai;
    f.draw.c = BOSSCOL[ai] || f.draw.c;
    f.draw.sz = ai >= 13 ? 2 : 1.8;
    if (abyss) {
      f.atk = Math.round(f.atk * 1.25);
      f.max = abyssBossHPV50();
      f.hp = f.max;
      f._abyssTunedV50 = true;
      f._abyssBoss = true;
      f.abyssRushDropLevelV61 = abyssRushDropLevelV61(ai);
    } else if (a.gimmick === "drown") {
      f.max = Math.round(f.max * 1.7);
      f.hp = f.max;
    }
    run.foes = [f];
    run.mech = MECHS[ai] || null;
    run.nextCastAt = run.time + 2800;
    hideCast();
    if (run.mech && run.mech.onSpawn) run.mech.onSpawn(f);
    buildFoeBars();
    $("wave").innerHTML =
      '<b style="color:' +
      (abyss ? "#c46bff" : "var(--epic)") +
      '">' +
      (abyss ? "ABYSS RUSH" : "BOSS RUSH") +
      " " +
      (idx + 1) +
      " / " +
      run.huntCount +
      "</b> · level " +
      lvl +
      " · " +
      (abyss ? "Abyss " : "") +
      a.boss;
    $("rmsg").className = "msg";
    $("rmsg").textContent = "The next boss enters the arena.";
    drawBars();
    updateRetreat();
    if (typeof resetStageDamageV51 === "function") resetStageDamageV51();
    if (typeof armGammaThornsV51 === "function") armGammaThornsV51();
    if (a.bossLines) sayBoss(a.bossLines[Math.floor(Math.random() * a.bossLines.length)]);
  }
  const result = prevResult103;
  if (run && run.abyssRush) updateStatusFx();
  return result;
};
const nextBossHuntWaveBeforeV76 = nextBossHuntWave;
nextBossHuntWave = function () {
  if (!run || !run.hunt) return nextBossHuntWaveBeforeV76();
  const entry = rushEntry();
  if (!entry) {
    if (run.huntIndex >= run.huntCount) completeBossHunt();
    else nextBossHuntWaveBeforeV76();
    return;
  }
  const index = entry.index,
    ai = entry.ai,
    abyss = entry.abyss,
    orig = AREAS[ai],
    a = abyss
      ? Object.assign({}, orig, { lvl: abyssBaseLevel(ai), abyss: true, mirror: ai, n: "Abyss · " + orig.n })
      : orig;
  const lvl = bossRushLevelV76(ai, index, abyss),
    atkMul = bossRushAttackMul(index),
    hpMul = bossRushHealthMul(index);
  run.ai = ai;
  run.mirror = ai;
  run.abyss = abyss;
  run.a = a;
  run.wave = index + 1;
  run.total = run.huntCount;
  run.air = a.gimmick === "drown" ? 100 : null;
  run.airPenaltyT = 0;
  run.rushBossLevelV76 = lvl;
  run.rushAttackMulV76 = atkMul;
  run.rushHealthMulV76 = hpMul;
  run.rushDropLevelV76 = lvl;
  $("gimmick").style.display = a.gimmick === "drown" ? "block" : "none";
  setTempo(155);
  const f = applyBossIdentityV76(buildFoe(a.pool[0], lvl, 3.2, true, "★ " + a.boss), ai, lvl, abyss);
  f.max = Math.max(1, Math.round(f.max * hpMul));
  f.hp = f.max;
  f.atk = Math.max(1, Math.round(f.atk * atkMul));
  f._rushScaledV76 = true;
  f.rushIndexV76 = index;
  f.rushDropLevelV76 = lvl;
  f._x = foeBaseX(0, 1);
  f.bossIdx = ai;
  f.draw.c = BOSSCOL[ai] || f.draw.c;
  f.draw.sz = ai >= 13 ? 2 : 1.8;
  run.foes = [f];
  run.mech = MECHS[ai] || null;
  run.nextCastAt = run.time + 2800;
  hideCast();
  if (run.mech && run.mech.onSpawn) run.mech.onSpawn(f);
  buildFoeBars();
  const red = typeof celestialLeechReductionV50 === "function" ? celestialLeechReductionV50() : 0;
  $("wave").innerHTML =
    '<b style="color:' +
    (abyss ? "#c46bff" : ai >= 13 ? "var(--mythic)" : "var(--epic)") +
    '">' +
    (abyss ? "ABYSS RUSH" : "BOSS RUSH") +
    " " +
    (index + 1) +
    " / " +
    run.huntCount +
    "</b> · level " +
    lvl +
    " · " +
    (abyss ? "Abyss " : "") +
    orig.boss +
    (red ? ' · <span style="color:#d695b0">Lifesteal −' + Math.round(red * 100) + "%</span>" : "");
  $("rmsg").className = "msg";
  $("rmsg").textContent = "The next boss steps forward.";
  drawBars();
  updateRetreat();
  if (typeof resetStageDamageV51 === "function") resetStageDamageV51();
  if (typeof armGammaThornsV51 === "function") armGammaThornsV51();
  renderStatPanel();
  if (a.bossLines) sayBoss(a.bossLines[Math.floor(Math.random() * a.bossLines.length)]);
};

document.title = "THE FORGE v7.6.0";
window.__forgeV7Boot = "ready";
window.forgeV76 = {
  originalBossLevel: originalBossLevelV76,
  bossLevel: bossRushLevelV76,
  attackMultiplier: bossRushAttackMul,
  healthMultiplier: bossRushHealthMul,
  applyBossIdentity: applyBossIdentityV76,
  startupRecovered: true
};

applyFeatureGatesV77();
document.title = "THE FORGE v7.7.0";
window.__forgeV7Boot = "ready";
window.forgeV77 = { cleared: clearedV77, applyFeatureGates: applyFeatureGatesV77 };

AREAS.forEach((a, i) => {
  if (AREA_WEAK[i]) a.weak = AREA_WEAK[i];
});

applyAreaGuidesV78();
document.title = "THE FORGE v7.8.0";
window.__forgeV7Boot = "ready";
window.forgeV78 = {
  areaGuides: AREA_GUIDE,
  applyAreaGuides: applyAreaGuidesV78,
  regularSpend: regularSpendV78,
  skillBudget: 50
};

/* The killer gets the final word. */
const heroDownBase = heroDown;
heroDown = function () {
  const result = heroDownBase();
  if (run && run.over) {
    const recap = run.combatRecapV41,
      k = recap && recap.killer && (recap.killer.source || recap.killer),
      killer =
        k && k.name
          ? k
          : (run.foes && run.foes.find(f => f.hp > 0 && f.atkA > 0)) ||
            (run.foes && run.foes.find(f => f.hp > 0)),
      pool = DEATH_LINES[killer && killer.key] || DEATH_LINES.default,
      line = pool[Math.floor(Math.random() * pool.length)];
    setTimeout(() => {
      if (run && run.over) {
        const bubble = $("bossbubble");
        if (bubble) bubble.classList.add("deathv51");
        sayBoss(line);
        setTimeout(() => {
          if (bubble) bubble.classList.remove("deathv51");
        }, 4500);
      }
    }, 280);
  }
  return result;
};
const heroDownBeforeV54 = heroDown;
heroDown = function () {
  const eligible = !!(run && !run.dummy && !run.hunt && !run.over);
  let prevResult177;
  prev177: {
    if (run && run.autoRunV54 && window.forgeV54) window.forgeV54.stopAutoRun();
    {
      const active = !!(autoRunState && run && run.autoRunV54),
        state = active ? Object.assign({}, autoRunState) : null;
      if (!active) {
        stopAutoRunV54();
        prevResult177 = heroDownBeforeV54();
        break prev177;
      }
      const result = heroDownBeforeV54();
      if (run && run.over) {
        const dead = $("dead");
        if (dead) dead.classList.remove("on");
        resolveAutoRunLootV54();
        setTimeout(() => {
          if (autoRunState) launchAutoRunV54(state.ai, state.abyss);
        }, 420);
      }
      prevResult177 = result;
      break prev177;
    }
    prevResult177 = undefined;
    break prev177;
  }
  const result = prevResult177;
  if (eligible) {
    const o = ensureOnboarding();
    o.deaths++;
    if (o.deaths === 2) queueNotice("death3");
    if (o.deaths === 3) queueNotice("death7");
    saveOnboarding();
  }
  return result;
};

/* ==== gainXP ==== */
const gainXPBase = gainXP;
gainXP = function (amount) {
  const before = Number(S.heroLevel) || 1;
  let prevResult106;
  prev106: {
    const c = contractKeyV70();
    prevResult106 = gainXPBase(amount * (c === "glass" ? 1.2 : c === "iron" ? 1.1 : 1));
    break prev106;
  }
  const result = prevResult106;
  const after = Number(S.heroLevel) || 1,
    o = ensureOnboarding();
  if (after > before && !o.seen.level) {
    o.seen.level = true;
    queueTarget("skillTree");
  }
  return result;
};

/* ==== renderTree ==== */
/* ==== renderTree ==== */
/* ==== renderTree ==== */
/* ==== renderTree ==== */
/* ==== renderTree ==== */
/* ==== renderTree ==== */
const renderTreeBeforeReset = renderTree;
renderTree = function () {
  let prevResult110;
  prev110: {
    renderTreeBeforeReset();
    const n = investedSkillPoints(),
      c = resetSkillCost(),
      b = $("resetskills");
    if (!b) {
      prevResult110 = undefined;
      break prev110;
    }
    b.disabled = n === 0;
    b.onclick = resetSkills;
    b.innerHTML = n ? "↺ Reset " + n + " pts · " + fmt(c) + "g" : "↺ Nothing to reset";
    b.title = n && S.gold < c ? "You need " + fmt(c - S.gold) + " more gold to reset your skills" : "";
  }
  const result = prevResult110;
  const cards = [...$("branches").querySelectorAll(".branch")];
  Object.keys(V6_TREES).forEach((kind, i) => {
    const card = cards[i],
      head = card && card.querySelector("h3");
    if (!head) return;
    const ready = treeMasteryReady(kind),
      m = masteryText(kind);
    head.classList.toggle("treemasteryreadyv65", ready);
    head.innerHTML =
      V6_TREES[kind].name +
      '<span class="treemasterylevelv65">✦ ' +
      m.level +
      "</span><small>" +
      (ready
        ? S.sp > 0
          ? "Click to spend 1 point · next +" + m.nextText + " " + m.label
          : "No unspent points · total +" + m.totalText + " " + m.label
        : "Complete this tree to unlock mastery") +
      "</small>";
    head.onclick = ready ? () => spendTreeMastery(kind) : null;
    head.title = ready ? "Mastery " + m.level + " · total +" + m.totalText + " " + m.label : "";
  });
  return result;
};
const renderTreeBase = renderTree;
renderTree = function () {
  let prevResult111;
  prev111: {
    const result = renderTreeBase();
    renderDiscipline();
    const b = $("resetskills");
    if (b) {
      const n = investedSkillPoints(),
        c = resetSkillCost();
      b.disabled = n === 0 || S.gold < c;
      b.innerHTML = n ? "↺ Reset " + n + " pts · " + fmt(c) + "g" : "↺ Nothing to reset";
    }
    prevResult111 = result;
    break prev111;
  }
  const result = prevResult111;
  explainMastery();
  return result;
};
const treeBase = renderTree;
renderTree = function () {
  const result = treeBase();
  setTimeout(renderCoachArrow, 0);
  return result;
};

$("tipok").addEventListener("click", () => {
  const o = ensureOnboarding(),
    key = o.showingNotice;
  if (!key) return;
  o.showingNotice = null;
  queueTarget(NOTICE[key].target);
  saveOnboarding();
});
document.addEventListener(
  "click",
  e => {
    const o = ensureOnboarding(),
      target = o.activeTarget;
    if (!target) return;
    const el = targetElement(target);
    if (!el || !(e.target === el || el.contains(e.target))) return;
    if (target === "skillTree") {
      o.activeTarget = "heal";
      saveOnboarding();
      setTimeout(renderCoachArrow, 30);
      return;
    }
    if (target === "heal") {
      setTimeout(() => {
        if ((Number(S.skills && S.skills.h1) || 0) > 0) {
          o.skillGuideDone = true;
          clearCoachTarget();
        }
      }, 20);
      return;
    }
    clearCoachTarget();
  },
  false
);
document.addEventListener(
  "click",
  e => {
    if (
      e.target &&
      ["closeshop", "closecompendium", "closeguildv70", "closetree", "closequestsv74"].includes(e.target.id)
    )
      setTimeout(showNextNoticeV79, 50);
  },
  false
);
const railV79 = $("goalrailv70");
if (railV79)
  new MutationObserver(() => {
    if (pinGuard || !pinForgeQuestV79()) return;
    pinGuard = true;
    queueMicrotask(() => {
      try {
        window.forgeV74.evaluate(true);
      } finally {
        pinGuard = false;
      }
    });
  }).observe(railV79, { childList: true, subtree: true });
ensureOnboarding();
applyFeatureVisibility();
if (pinForgeQuestV79() && window.forgeV74) window.forgeV74.evaluate(true);
renderCoachArrow();
setTimeout(showNextNoticeV79, 80);
document.title = "THE FORGE v7.9.0";
window.__forgeV7Boot = "ready";
window.forgeV79 = {
  state: ensureOnboarding,
  featureVisibility: applyFeatureVisibility,
  pinForgeQuest: pinForgeQuestV79,
  starterLoot: grantStarterLoot,
  showNextNotice: showNextNoticeV79
};

/* ================= script block 10 ================= */

/* V80 · Quest claims, first death retreat guidance, and combat presentation tuning. */
window.__forgeV7Boot = "v80 starting";

/* ==== makeEliteV6 ==== */
/* ==== makeEliteV6 ==== */
/* ==== makeEliteV6 ==== */
const makeEliteAbyssBase = makeElite;
makeElite = function (f, forceSuper) {
  if (!(run && run.a && run.a.abyss)) return makeEliteAbyssBase(f, forceSuper);
  if (!f) return f;
  const superElite = !!forceSuper,
    baseMax = f.max,
    baseAtk = f.atk,
    baseDef = f.def;
  f.elite = true;
  f.superElite = superElite;
  f.name = (superElite ? "✦ Super Elite " : "◆ Elite ") + f.name;
  f.max = Math.round(baseMax * (superElite ? 2.15 : 1.55)); // no campaign-boss cap in the Abyss
  f.atk = Math.round(baseAtk * (superElite ? 1.25 : 1.12));
  f.def = Math.round(baseDef * (superElite ? 1.15 : 1.08));
  f.hp = f.max;
  f.draw.sz *= superElite ? 1.18 : 1.1;
  if (f.specialCd != null) {
    f.specialCd = superElite ? 350 : 500;
    f.specialCdMax = f.specialCd;
  }
  return f;
};
const makeEliteBase = makeElite;
makeElite = function (f, forceSuper = false) {
  if (!f) return f;
  const base = { max: f.max, atk: f.atk, def: f.def },
    result = makeEliteBase(f, forceSuper),
    superElite = !!(forceSuper || (result && result.superElite)),
    mul = superElite ? { hp: 3.6, atk: 1.65, def: 1.3 } : { hp: 2.4, atk: 1.35, def: 1.18 };
  result.max = Math.max(result.max, Math.round(base.max * mul.hp));
  result.hp = result.max;
  result.atk = Math.max(result.atk, Math.round(base.atk * mul.atk));
  result.def = Math.max(result.def, Math.round(base.def * mul.def));
  return result;
};

/* ==== updateRetreat ==== */
const updateRetreatBase = updateRetreat;
updateRetreat = function () {
  if (run && !run.dummy && !run.hunt && run.ai === 0 && run.wave === 4) {
    const rb = $("retreat");
    if (rb) {
      rb.disabled = true;
      rb.innerHTML = "🔒 Retreat opens before the boss at wave 5";
    }
    return;
  }
  if (run && !run.dummy && run.ai === 0 && run.wave === 5) {
    const rb = $("retreat");
    rb.disabled = false;
    rb.innerHTML = "⤴ RETREAT (keep loot, no clear)";
    return;
  }
  if (run && run.dummy) {
    const rb = $("retreat");
    rb.disabled = false;
    rb.innerHTML = "↩ LEAVE TRAINING";
    return;
  }
  return updateRetreatBase();

  return;

  return;
};

const applyAreaGuidesBase = window.forgeV78 && window.forgeV78.applyAreaGuides;
if (applyAreaGuidesBase) {
  window.forgeV78.applyAreaGuides = function () {
    const result = applyAreaGuidesBase();
    document.querySelectorAll("#areas .tw").forEach(x => x.remove());
    return result;
  };
}
document.querySelectorAll("#areas .tw").forEach(x => x.remove());
if (typeof finalBossRoll === "function") {
  const finalBossRollBeforeV80 = finalBossRoll;
  finalBossRoll = function () {
    const result = finalBossRollBeforeV80();
    rebuildTrayV80();
    return result;
  };
}

/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* Final kill hook owns pity, Bestiary research, and equipped item histories. */
const killFoeBeforeV70 = killFoe;
killFoe = function (f, t) {
  const alive = !!(f && f.boss && !f.dead);
  let prevResult112;
  prev112: {
    const wasDead = !!(f && f.dead),
      bagStart = run && run.bags ? run.bags.length : 0,
      result = killFoeBeforeV70(f, t);
    if (!wasDead && f && f.dead) {
      ensureV70State();
      const key = f.boss ? "boss:" + (run && Number.isInteger(run.ai) ? run.ai : f.key) : "enemy:" + f.key;
      S.bestiaryKillsV70[key] = (Number(S.bestiaryKillsV70[key]) || 0) + 1;
      Object.values(S.gear || {}).forEach(g => {
        if (!g) return;
        const h = ensureHistory(g);
        h.kills++;
        if (f.boss) {
          h.bosses++;
          const victory = (run && run.a && run.a.boss) || String(f.name || "Boss").replace(/^★\s*/, "");
          if (victory && !h.victories.includes(victory)) h.victories.push(victory);
          if (h.victories.length > 8) h.victories.shift();
        }
      });
    }
    let forced = false;
    if (run && run.bags)
      run.bags.slice(bagStart).forEach(b => {
        if (applyPityV70(b)) forced = true;
      });
    if (forced) rebuildTray();
    prevResult112 = result;
    break prev112;
  }
  const result = prevResult112;
  if (alive && f.dead && run && run.hunt) {
    run._finalBossLvlV72 = Math.max(1, Number(f.lvl) || Number(run.a && run.a.lvl) || 1);
    run._finalBossNameV72 = String(f.name || (run.a && run.a.boss) || "Final Boss");
  }
  return result;
};
const killBase = killFoe;
killFoe = function (f, t) {
  const start = run && run.bags ? run.bags.length : 0;
  let prevResult113;
  prev113: {
    const alive = !!(f && !f.dead),
      wasElite = !!(f && f.elite),
      wasSuper = !!(f && f.superElite),
      wasBoss = !!(f && f.boss),
      ai = run && run.ai,
      abyss = !!(run && run.a && run.a.abyss),
      result = killBase(f, t);
    if (alive && f && f.dead) {
      const st = ensureQuestState().stats;
      if (wasSuper) st.superElites++;
      else if (wasElite) st.elites++;
      if (wasBoss) {
        const equipped = Object.values(S.gear || {}).filter(Boolean),
          maxKills = Math.max(0, ...equipped.map(g => Number(g.historyV70 && g.historyV70.kills) || 0));
        if (ai === 12 && maxKills >= 100) st.legacyEnd = 1;
        if (ai === 16 && !abyss && maxKills >= 1000) st.legacyOmega1000 = 1;
        if (ai === 16 && abyss && maxKills >= 10000) st.legacyOmega10000 = 1;
      }
      setTimeout(() => evaluateQuests(false), 30);
    }
    prevResult113 = result;
    break prev113;
  }
  const result = prevResult113;
  if (run && run.bags) {
    run.bags.slice(start).forEach(b => {
      if (b && b.bossRollV72) b.boss = true;
      else if (b) {
        delete b.boss;
        delete b._reel;
      }
    });
  }
  return result;
};
/* Every item created by a Rush kill uses the level of that exact Rush boss. */
const killFoeBeforeV76 = killFoe;
killFoe = function (f, t) {
  const dummy = !!(run && run.dummy && f && f.trainingDummy && f.hp <= 0),
    cycles = Number(run && run.dummyCyclesV41) || 0;
  let prevResult114;
  prev114: {
    const active = !!(run && run.hunt),
      start = active && run.bags ? run.bags.length : 0,
      lvl = active ? Math.max(1, Number(run.rushDropLevelV76) || Number(f && f.lvl) || 1) : 0,
      result = killFoeBeforeV76(f, t);
    if (active && run && run.bags)
      run.bags.slice(start).forEach(b => {
        if (b && !b.unique) b.lvl = lvl;
      });
    prevResult114 = result;
    break prev114;
  }
  const result = prevResult114;
  if (dummy && run && (Number(run.dummyCyclesV41) || 0) > cycles) {
    S.dummyKillsV78 = (Number(S.dummyKillsV78) || 0) + 1;
    try {
      window.forgeV74.evaluate(false);
    } catch (e) {}
    try {
      scheduleSave();
    } catch (e) {}
  }
  return result;
};
const killBeforeV79 = killFoe;
killFoe = function (f, t) {
  const active = !!(run && f && !f.dead),
    boss = !!(active && f.boss),
    hunt = !!(run && run.hunt),
    abyss = !!(run && run.a && run.a.abyss),
    ai = run && Number.isInteger(run.ai) ? run.ai : 0,
    start = run && run.bags ? run.bags.length : 0;
  let prevResult115;
  prev115: {
    const before = Number(S.totalKills) || 0,
      eligible = !!(run && !run.dummy && !run.hunt && f && !f.dead),
      result = killBeforeV79(f, t),
      after = Number(S.totalKills) || 0;
    if (eligible && before < 10 && after >= 10 && !ensureOnboarding().starterLoot)
      grantStarterLoot(f && f.lvl);
    prevResult115 = result;
    break prev115;
  }
  const result = prevResult115;
  if (!boss || hunt || !f.dead || !run || !run.bags) return result;
  const fresh = run.bags.slice(start),
    special = fresh.filter(b => b && (b.bossRollV72 || b.guaranteedMythicV50 || b.unique)),
    normal = fresh.filter(b => b && !special.includes(b)),
    contract = run.contractV70 || null,
    skillRanks = Math.max(0, Number(S.skills && S.skills.l4) || 0),
    extraFromSkill = Math.random() < Math.min(0.4, skillRanks * 0.2) ? 1 : 0,
    allowed = 1 + extraFromSkill + (contract === "onslaught" ? 1 : 0) + (contract === "mastery" ? 3 : 0);
  let keptNormal = normal.slice(0, allowed);
  if (abyss && normal.some(b => b.rar === 5) && !keptNormal.some(b => b.rar === 5)) {
    keptNormal[0] = normal.find(b => b.rar === 5);
  }
  if (!abyss) {
    keptNormal.forEach(b => {
      b.lvl = rollDropLevel(ai);
      let rar = rollRarity(b.lvl);
      const boosts = Math.max(0, Number(skillBonuses().rarityBoost) || 0);
      for (let i = 0; i < boosts; i++) rar = Math.max(rar, rollRarity(b.lvl));
      b.rar = Math.min(4, rar);
      delete b.boss;
      delete b._reel;
    });
  }
  run.bags.splice(start, fresh.length, ...keptNormal, ...special);
  try {
    rebuildTrayV80();
  } catch (e) {}
  return result;
};

document.title = "THE FORGE v7.10.0";
window.__forgeV7Boot = "ready";
window.forgeV80 = { greatAxeDamageBoost: GREAT_AXE_DAMAGE_BOOST };

migrateQuestRewardsV81();
document.title = "THE FORGE v7.10.1";
window.__forgeV7Boot = "ready";
window.forgeV81 = { questRewardCurve: "economy matched", migrateQuestRewards: migrateQuestRewardsV81 };
