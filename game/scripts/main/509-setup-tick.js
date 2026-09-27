/* ==== tick ==== */
const tickBeforeMythic = tick;
/* ---------- (3) OMEGA DAMAGE RAMP (+1% base atk / 10s) + Great Axe cadence stretch ---------- */
tick = function () {
  let prevResult71;
  prev71: {
    if (run && !run.over && run.foes) {
      const b = run.foes.find(f => f.boss && f.bossIdx === 16 && f.hp > 0);
      if (b) {
        if (b._omegaBaseAtk == null) {
          b._omegaBaseAtk = b.atk;
          b._omegaRampStart = run.time;
        }
        const stacks = Math.max(0, Math.floor((run.time - b._omegaRampStart) / 10000));
        const want = Math.round(b._omegaBaseAtk * (1 + 0.01 * stacks));
        if (want !== b.atk) b.atk = want;
        if (stacks > (b._omegaRampShown || 0)) {
          b._omegaRampShown = stacks;
          try {
            floatDmg("foe", "Ω +" + stacks + "% ESCALATION", 0, "#ff6a2f", b._x);
          } catch (e) {}
        }
      }
    }
    const hcdBefore = typeof hCd !== "undefined" ? hCd : 0;
    let prevResult174;
    const before = (run && run.enrageCd) || 0;
    tickBeforeMythic();
    if (run && before > 0 && run.enrageCd > 0 && S.gear.helm && S.gear.helm.mythicAffix === "hotHeaded")
      run.enrageCd = Math.max(0, run.enrageCd - 64.3);
    if (run && run.dummy) {
      run.dummyMeterClockV41 = (run.dummyMeterClockV41 || 0) + 150;
      if (run.dummyMeterClockV41 >= 450) {
        run.dummyMeterClockV41 = 0;
        updateDummyMeter();
      }
    }

    const r = prevResult174;
    // Great Axe swings slower — a flat extra tick per swing, applied after the cadence floor
    // (a percentage multiplier quantizes away at the 150ms-tick floor at maxed gear, so use +1 tick).
    /* greataxe cadence is now handled by swingTypeMulV50 (per-type swing baseline) — no flat add */
    // Abyss drown (Sunken Ruins) drains air noticeably faster — less time down there.
    if (run && !run.over && run.a && run.a.abyss && run.a.gimmick === "drown" && run.air != null)
      run.air = Math.max(0, run.air - 0.14);
    prevResult71 = r;
    break prev71;
  }
  const result = prevResult71;
  if (run && !run.over) finishZeroHealthBossV52();
  return result;
};
document.addEventListener("keydown", e => {
  const tag = e.target && e.target.tagName;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(tag) || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === "Escape") {
    if (visibleMenuOpen("strike") || visibleMenuOpen("reforgegame")) return;
    if (closeTopMenuV52()) {
      e.preventDefault();
      e.stopPropagation();
    }
    return;
  }
  if (
    e.code === "KeyR" &&
    run &&
    !run.over &&
    !visibleMenuOpen("strike") &&
    !visibleMenuOpen("reforgegame") &&
    !visibleMenuOpen("guardiancheckpoint") &&
    !visibleMenuOpen("huntchoice")
  ) {
    const b = $("retreat");
    if (b && !b.disabled) {
      e.preventDefault();
      b.click();
    }
    return;
  }
  if ((e.code === "Digit1" || e.code === "Numpad1") && run && !run.over) {
    const b = $("healbtn");
    if (b && b.style.display !== "none" && !b.disabled) {
      e.preventDefault();
      b.click();
    }
  }
});

const style_t384443 = document.createElement("style");
style_t384443.textContent =
  ".ilvl{font-size:12px!important;font-weight:900;color:#bfc9d8!important;letter-spacing:.3px}.atile{min-width:54px}.atile .anm{overflow:visible;text-overflow:clip;white-space:normal;min-height:29px}.masterybadgev51{display:block!important;width:max-content;min-width:20px;margin:3px auto 0!important;padding:1px 4px;border:1px solid #51586a;border-radius:8px;background:#090a0dcc;font-size:9px!important;font-weight:900;line-height:1.15}.masterybadgev51.bronze{border-color:#9b6335}.masterybadgev51.silver{border-color:#b9d8ee}.masterybadgev51.gold{border-color:#ffd45a}.masterylinev51 span{display:block;margin-top:4px;color:#8c91a0;line-height:1.3}.masterylinev51 span.done{color:#78d69a}.guardbandv52{border-color:#5d6878}";
document.head.appendChild(style_t384443);

window.forgeV52 = {
  finishZeroHealthBoss: finishZeroHealthBossV52,
  masteryPreview: masteryPreviewV52,
  closeTopMenu: closeTopMenuV52
};
markerLoop = function (now) {
  advanceSmithMarkerV53(typeof now === "number" ? now : performance.now());
  sRAF = requestAnimationFrame(markerLoop);
};

/* ==== openCelestial ==== */
/* opener for celestial 10..12 (abyss): 3 perfect silver hits, miss resets sequence */
const openCelestialChainBase = openCelestial;
/* Mythic Celestial HUD consistently shows the Abyss cap from level one onward. */
openCelestial = function (g) {
  smithFrameTime = null;
  let prevResult72;
  prev72: {
    const cap = celestialCap();
    if ((g.celestial || 0) >= cap) {
      $("fsel").textContent = "This item is at Celestial Level " + cap + ".";
      prevResult72 = undefined;
      break prev72;
    }
    if ((g.celestial || 0) < 10) {
      prevResult72 = openCelestialChainBase(g);
      break prev72;
    }
    const c = celestialCost(g);
    if ((c.cshards || 0) > (S.celestialShards || 0)) {
      $("fsel").innerHTML = '<span style="color:#ff6b6b">Not enough Celestial shards.</span>';
      prevResult72 = undefined;
      break prev72;
    }
    if (S.gold < c.gold) {
      $("fsel").innerHTML = '<span style="color:#ff6b6b">Not enough gold.</span>';
      prevResult72 = undefined;
      break prev72;
    }
    celestialMode = true;
    strikeLocked = false;
    celHitsDone = 0;
    celProf = celestialProfile(g);
    celHitsNeeded = celProf.hits;
    pend = { g, c, paid: false };
    setupCelRound(g);
    $("baseodds").innerHTML =
      '<span style="color:#c9b6ff">✦ ABYSSAL CELESTIAL ' +
      celProf.target +
      "/13</span> · land <b>3 perfect silver hits in a row</b> — a miss resets the sequence, never your level · " +
      (c.cshards || 0) +
      " ✺ + " +
      fmt(c.gold) +
      "g";
    $("guardrow").innerHTML =
      '<span class="gl">✦ Abyssal celestial forging demands three flawless strikes.</span>';
    $("strikehd").innerHTML = "✦ CELESTIAL FORGE";
    $("strikehd").style.color = "#c9b6ff";
    $("strike").classList.add("celestial");
    const ch = $("corehint");
    if (ch) ch.style.display = "none";
    try {
      setForgeHud(g, true);
    } catch (e) {}
    $("run").style.display = "block";
    $("town").style.display = "none";
    $("strike").classList.add("on");
    beep(300, 0.18, "sine", 0.08);
  }
  const result = prevResult72;
  if (g && g.rar === 5 && S.abyssUnlocked) {
    const el = $("baseodds");
    if (el) el.innerHTML = el.innerHTML.replace(/\/10/g, "/13");
    const nxt = $("forgenext");
    if (nxt) nxt.textContent = "✦" + Math.min(13, (g.celestial || 0) + 1);
  }
  return result;

  return;
};

window.forgeV53 = {
  smithSpeed: smithSpeedV53,
  advanceSmithMarker: advanceSmithMarkerV53,
  plusNineSpeed: SMITH_PLUS_NINE_SPEED
};
if (glove) {
  glove.main = "attackPower";
  glove.affixes = ["critChance", "atkSpeed", "critDmg", "enrage", "lifesteal", "dodge", "lootChance"];
}
if (amuletV54) {
  amuletV54.main = "attackPower";
  amuletV54.affixes = [
    "critDmg",
    "critChance",
    "enrage",
    "healCdr",
    "lootChance",
    "xpBoost",
    "goldBoost",
    "lifesteal"
  ];
}

const OLD_ENRAGE_PCT = [2, 3, 4, 5, 6],
  maxBaseRollBeforeV54 = maxBaseRoll,
  gStatBeforeV54 = gStat;
PCT.enrage = [3, 4.5, 6, 7.5, 9, 10.5];
maxBaseRoll = function (g, stat) {
  if (accessory(g) && stat !== "attackPower" && (PERCENT.has(stat) || stat === "healCdr"))
    return accessoryAffixMaxV54(g, stat);
  return maxBaseRollBeforeV54(g, stat);
};
gStat = function (g, stat) {
  if (stat === "attackPower") return attackPowerPctV54(g);
  if (stat === "enrage") return enrageValueV54(g);
  return gStatBeforeV54(g, stat);
};
const rerollAtkMulBase = rerollStat;
rerollStat = function (old, stat) {
  const v = rerollAtkMulBase(old, stat);
  if (old && old.slot === "weapon" && stat === "atk" && old.wtype) {
    const o = WEAPON_OLD_ATKMUL[old.wtype] || 1;
    return Math.max(1, Math.round((v * weaponAtkMulV50(old.wtype)) / o));
  }
  return v;
};
rerollStat = function (old, stat) {
  return immutableBaseV54(old, stat) ? old.stats[stat] : uniformReforgeRoll(old, stat);
};

reforgeLockButton = function (stat) {
  const g = reforgePending && reforgePending.g;
  if (immutableBaseV54(g, stat))
    return '<span class="basestatv54" title="Base stats never reroll">BASE</span>';
  const locked = reforgeLockStat === stat;
  return (
    '<button type="button" class="statlockv43' +
    (locked ? " locked" : "") +
    '" data-stat="' +
    stat +
    '" title="' +
    (locked ? "Unlock " + STAT_LABEL[stat] : "Lock " + STAT_LABEL[stat]) +
    '">' +
    (locked ? "🔒" : "🔓") +
    "</button>"
  );
};
reforgeLockMirror = function (stat) {
  const g = reforgePending && reforgePending.g;
  if (immutableBaseV54(g, stat)) return '<span class="basestatv54" title="Base stat preserved">BASE</span>';
  const locked = reforgeLockStat === stat;
  return (
    '<span class="statlockmirrorv43' +
    (locked ? " locked" : "") +
    '" title="' +
    (locked ? "This value remains unchanged" : "This value will be rerolled") +
    '">' +
    (locked ? "🔒" : "🔓") +
    "</span>"
  );
};

/* ==== celestialCost ==== */
/* ==== celestialCost ==== */
/* ==== celestialCost ==== */
/* ==== celestialCost ==== */
/* ==== celestialCost ==== */
/* ==== celestialCost ==== */
const celestialCostBase = celestialCost;
celestialCost = function (g) {
  let prevResult75;
  prev75: {
    const c = celestialCostBase(g);
    if (g && g.rar === 5) {
      c.cshards = 4 + Math.min(10, g.celestial || 0) * 2;
      c.esh = 0;
      c.gold = Math.round(c.gold * 1.35);
    }
    prevResult75 = c;
    break prev75;
  }
  const c = prevResult75;
  if (g && g.rar === 5 && (g.celestial || 0) >= 10) {
    c.cshards = 6 + g.celestial * 2;
    c.esh = 0;
    c.gold = Math.round((c.gold || 15000) * 1.6);
  }
  return c;
};
/* Efficient Smithing now applies to every Celestial resource as well as gold. */
const celestialCostBeforeV54 = celestialCost;
celestialCost = function (g) {
  const c = celestialCostBeforeV54(g),
    factor = Math.max(0.1, skillBonuses().forgeCost == null ? 1 : skillBonuses().forgeCost);
  c.gold = Math.max(0, Math.round((c.gold || 0) * factor));
  if (c.esh) c.esh = Math.max(1, Math.ceil(c.esh * factor));
  if (c.cshards) c.cshards = Math.max(1, Math.ceil(c.cshards * factor));
  return c;
};

/* ==== openStrike ==== */
/* ==== openStrike ==== */
/* ==== openStrike ==== */
/* ==== openStrike ==== */
/* ==== openStrike ==== */
/* ==== openStrike ==== */
/* Normal forge movement stops accelerating after +9. The final +19 to +20 attempt keeps its
   exceptional speed. Celestial forging retains its separate rules. */
const openStrikeBase = openStrike;
openStrike = function (g, c) {
  smithFrameTime = null;
  let prevResult77;
  prev77: {
    const result = openStrikeBase(g, c);
    if (!celestialMode && g && (g.plus || 0) !== 19) sSpeed = Math.min(sSpeed, 2.6 + 9 * 0.34);
    prevResult77 = result;
    break prev77;
  }
  const result = prevResult77;
  if (!celestialMode) sSpeed = smithSpeedV53(g);
  return result;
};
const openStrikeBeforeV54 = openStrike;
openStrike = function (g, c) {
  resetNormalForgeState();
  const result = openStrikeBeforeV54(g, c);
  const b = $("strikebtn");
  if (b) b.disabled = false;
  return result;
};

const strikeDoneBeforeV54 = $("strikedone").onclick;
$("strikedone").onclick = function () {
  resetNormalForgeState();
  return strikeDoneBeforeV54 && strikeDoneBeforeV54.call(this);
};

/* Bloodforged is one explicit three percent roll for every final Legendary or Mythic bag. */
rollBloodforged = function (bag) {
  if (!bag || bag.unique || bag._bloodforgedRolledV54 || !((bag.rar || 0) === 4 || (bag.rar || 0) === 5))
    return false;
  bag._bloodforgedRolledV54 = true;
  if (Math.random() < 0.03) {
    bag.unique = "bloodforged";
    return true;
  }
  return false;
};

const retreatBeforeV54 = $("retreat").onclick;
$("retreat").onclick = function () {
  stopAutoRunV54();
  return retreatBeforeV54 && retreatBeforeV54.call(this);
};
installAudioModal();
$("musicbtn").onclick = () => {
  updateAudioModal();
  $("audiosettingsv54").classList.add("on");
};
document.addEventListener(
  "keydown",
  e => {
    if (e.key === "Escape" && $("audiosettingsv54").classList.contains("on")) {
      $("audiosettingsv54").classList.remove("on");
      e.preventDefault();
    }
  },
  true
);

const style_t407522 = document.createElement("style");
style_t407522.textContent =
  ".basestatv54{display:inline-flex;width:32px;height:20px;align-items:center;justify-content:center;border:1px solid #4d735f;border-radius:5px;background:#102019;color:#83d5a6;font-size:7px;font-weight:900;letter-spacing:.5px}.autorunv54{display:block;width:44px!important;min-width:44px!important;margin:4px auto 0!important;padding:2px 3px!important;border:1px solid #b78a36!important;border-radius:5px!important;background:#251b0d!important;color:#ffd76a!important;font-size:7px!important;line-height:1.15!important;position:relative;z-index:5}.audiosettingsboxv54{width:min(390px,92vw)}.audiosettingsboxv54 label{display:grid;grid-template-columns:120px 1fr;align-items:center;gap:10px;margin:12px 0;color:#c9c0b5;font-size:11px}.audiosettingsboxv54 input[type=range],.audiosettingsboxv54 select{width:100%}.audiosettingsboxv54 button{width:100%;margin-top:8px}";
document.head.appendChild(style_t407522);
window.forgeV54 = {
  accessoryAffixMax: accessoryAffixMaxV54,
  attackPower: attackPowerPctV54,
  enrageValue: enrageValueV54,
  uniformReforge: uniformReforgeRoll,
  immutableBase: immutableBaseV54,
  resetForge: resetNormalForgeState,
  launchAutoRun: launchAutoRunV54,
  stopAutoRun: stopAutoRunV54,
  resolveAutoRunLoot: resolveAutoRunLootV54,
  isAutoRunActive: () => !!autoRunState,
  bloodChance: 0.03
};

document.title = "THE FORGE v55";
window.forgeV55 = { autoRunLootBypass: true };
allTreeNodes().forEach(n => {
  const c = COMBAT_CAPSTONES[n.id];
  if (c) {
    n.name = c.name;
    n.d = c.text;
    n.max = c.max;
  }
});

document.title = "THE FORGE v56";
window.forgeV56 = {
  bossRushLevel: bossRushLevelV56,
  migrateCombatCapstones: migrateCombatCapstonesV56,
  combatCapstones: COMBAT_CAPSTONES
};
if (typeof window.standardRushSequenceV51 !== "function")
  window.standardRushSequenceV51 = standardRushSequenceV57;
if (typeof window.resetStageDamageV51 !== "function")
  window.resetStageDamageV51 = function () {
    if (!run) return;
    run.postFireDealt = 0;
    run.postfireDealt = 0;
    run.postFightDealt = 0;
    run._postFireDealt = 0;
    run.dmgLog = [];
    run.dpsT = 0;
    const de = $("dps"),
      df = $("dpsfill");
    if (de) de.textContent = "DPS 0";
    if (df) df.style.width = "2%";
  };
if (typeof window.armGammaThornsV51 !== "function")
  window.armGammaThornsV51 = function () {
    if (!run || run.ai !== 15) return;
    const b = run.foes && run.foes.find(f => f.boss && f.hp > 0);
    if (!b || b.gammaThornsV51) return;
    b.gammaThornsV51 = true;
    b.thornUntil = Number.POSITIVE_INFINITY;
    b.name = "✹ " + b.name;
    buildFoeBars();
    drawBars();
    $("rmsg").className = "msg big";
    $("rmsg").textContent = "✹ CROWN OF THORNS · melee damage is violently reflected · swap to a Bow";
    sayBoss("COME CLOSER. I INSIST.");
  };

/* The former wrapper installed huntSequenceV51 only after the original start function had
   already spawned boss one. Build the standard Rush state with its sequence in place first. */
startBossHunt = function () {
  if (!S.clearedAreas.includes(5)) {
    showTip("BOSS HUNT LOCKED", "Clear the Sunken Ruins first.");
    return;
  }
  if ((S.skullTokens || 0) < 10) {
    showTip(
      "MORE SKULL TOKENS NEEDED",
      "Boss Hunt costs <b>10 skull tokens</b>. Bosses in areas after the Sunken Ruins have a 50% token chance. Elites there have a 4% chance."
    );
    return;
  }
  S.skullTokens -= 10;
  hCd = 0;
  const hs = heroStats(),
    seq = standardRushSequenceV57();
  run = {
    ai: 0,
    a: AREAS[0],
    wave: 0,
    total: seq.length,
    foes: [],
    over: false,
    bags: [],
    enrageT: 0,
    enrageCd: 0,
    pT: 0,
    time: 0,
    dmgLog: [],
    healCd: 0,
    mech: null,
    cast: null,
    nextCastAt: null,
    slowStacks: 0,
    frozenUntil: 0,
    heroPoisonUntil: 0,
    air: null,
    airPenaltyT: 0,
    xpMult: 1,
    chainHits: 0,
    chainUntil: 0,
    suppressedSlot: null,
    suppressedUntil: 0,
    hunt: true,
    huntIndex: 0,
    huntCount: seq.length,
    huntSequenceV51: seq,
    hero: { hp: hs.hp, max: hs.hp }
  };
  $("town").style.display = "none";
  $("run").style.display = "block";
  $("traychips").innerHTML = "";
  updateTrayCount();
  updateHeal();
  hideCast();
  arrows = [];
  startMusic();
  nextWave();
  clearInterval(timer);
  timer = setInterval(tick, 150);
  resetStageDamageV51();
  scheduleSave();
};
$("huntstart").onclick = startBossHunt;

const celestialLeechReductionBase = celestialLeechReductionV50;
celestialLeechReductionV50 = function () {
  if (run && run.hunt && !run.abyssRush) return bossRushLeechReductionV57(run.huntIndex);
  return celestialLeechReductionBase();
};
window.celestialLeechReductionV50 = celestialLeechReductionV50;

nextBossHuntWave = function () {
  if (!run || run.abyssRush || !run.huntSequenceV51) return nextBossHuntWaveBeforeV56();
  const idx = run.huntIndex;
  if (idx >= run.huntCount) {
    completeBossHunt();
    return;
  }
  const ai = run.huntSequenceV51[idx],
    a = AREAS[ai],
    lvl = bossRushLevelV57(idx, S.heroLevel),
    red = bossRushLeechReductionV57(idx);
  run.ai = ai;
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
    f.hp = Math.round(f.hp * 1.7);
    f.max = f.hp;
    f.atk = Math.round(f.atk * 0.62);
  }
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
  $("wave").innerHTML =
    '<b style="color:' +
    (ai >= 13 ? "var(--mythic)" : "var(--epic)") +
    '">BOSS RUSH ' +
    (idx + 1) +
    " / " +
    run.huntCount +
    "</b> · level " +
    lvl +
    " · " +
    a.boss +
    ' · <span style="color:#d695b0">Lifesteal −' +
    Math.round(red * 100) +
    "%</span>";
  $("rmsg").className = "msg";
  $("rmsg").textContent =
    ai >= 13
      ? "A defeated Celestial Guardian returns to the Rush."
      : "The next hunted boss enters the arena.";
  drawBars();
  updateRetreat();
  armGammaThornsV51();
  renderStatPanel();
  if (a.bossLines) sayBoss(a.bossLines[Math.floor(Math.random() * a.bossLines.length)]);
};

document.title = "THE FORGE v57";
window.forgeV57 = { bossRushLevel: bossRushLevelV57, bossRushLeechReduction: bossRushLeechReductionV57 };

document.title = "THE FORGE v58";
window.forgeV58 = {
  celestialProfile: g => celestialProfile(g),
  bloodforgedChance: 0.03,
  bloodforgedEligible: b => !!b && !b.unique && ((b.rar || 0) === 4 || (b.rar || 0) === 5)
};

growthValues = function (g) {
  if (!g || !g.growth) return { atk: 0, hp: 0, cap: 0, capHp: 0, kills: 0 };
  const kills = Math.max(0, Number(g.growth.kills) || 0),
    capAtk = bloodAttackCapV59(g),
    oldCap = legacyBloodCap(g),
    capHp = Math.max(oldCap, Math.floor(oldCap * (1 + (g.ilvl || 1) / 60))),
    frac = Math.min(1, kills / 500);
  return { kills, cap: capAtk, capHp, atk: Math.floor(capAtk * frac), hp: Math.floor(capHp * frac) };
};

document.title = "THE FORGE v59";
window.forgeV59 = { bloodAttackCap: bloodAttackCapV59, growthValues: growthValues };
growthCap = function (g) {
  return bloodCapV60(g);
};
growthValues = function (g) {
  if (!g || !g.growth) return { atk: 0, hp: 0, cap: 0, capHp: 0, kills: 0 };
  const kills = Math.max(0, Number(g.growth.kills) || 0),
    capAtk = bloodCapV60(g),
    capHp = Math.max(capAtk, Math.floor(capAtk * (1 + (g.ilvl || 1) / 60))),
    frac = Math.min(1, kills / 500);
  return { kills, cap: capAtk, capHp, atk: Math.floor(capAtk * frac), hp: Math.floor(capHp * frac) };
};
growthLine = function (g) {
  if (!g.growth) return "";
  const gr = growthValues(g),
    maxed = gr.kills >= 500;
  return (
    '<span style="color:#ff8f7b">Blood Growth: ' +
    gr.atk +
    " / " +
    gr.cap +
    " Atk · " +
    gr.hp +
    " / " +
    gr.capHp +
    " HP · " +
    Math.min(500, gr.kills) +
    " / 500 kills" +
    (maxed ? " · <b>MAXED</b>" : "") +
    "</span>"
  );
};

document.title = "THE FORGE v60";
window.forgeV60 = { bloodCap: bloodCapV60, growthValues: growthValues, growthLine: growthLine };
addSummonFatigue(MECHS[0], 8000);
addSummonFatigue(MECHS[6], 8500);

/* Omega's constellation stays visible without dominating the fight. The first pair arrives late,
   repeats are widely spaced, and a fresh pair is never piled on living guards. */
try {
  if (typeof OMEGA_CONTROLLER === "object" && OMEGA_CONTROLLER) {
    const omegaSpawnBeforeV61 = OMEGA_CONTROLLER.onSpawn;
    OMEGA_CONTROLLER.onSpawn = function (b) {
      if (omegaSpawnBeforeV61) omegaSpawnBeforeV61(b);
      b.omegaSummonAt = run.time + (run.a && run.a.abyss ? 45000 : 55000);
      run.nextCastAt = Math.min(run.nextCastAt || b.omegaStunAt, b.omegaStunAt);
    };
  }
  if (typeof OMEGA_SUMMON === "object" && OMEGA_SUMMON) {
    const omegaResolveBeforeV61 = OMEGA_SUMMON.resolve;
    OMEGA_SUMMON.resolve = function (b) {
      const living = run && run.foes && run.foes.some(f => f.hp > 0 && f.omegaGuard);
      if (living) {
        b.omegaSummonAt = run.time + 12000;
        this.cd = Math.max(300, Math.min(b.omegaStunAt, b.omegaHealAt, b.omegaSummonAt) - run.time);
        floatDmg("foe", "Ω GUARDS STILL STAND", 0, "#dfffff", b._x);
        return;
      }
      const result = omegaResolveBeforeV61.call(this, b);
      b.omegaSummonAt = run.time + 75000;
      this.cd = Math.max(300, Math.min(b.omegaStunAt, b.omegaHealAt, b.omegaSummonAt) - run.time);
      return result;
    };
  }
} catch (e) {}

MYTHIC_INFO.elementalWard = [
  "Elemental Ward",
  "10% less Fire, Ice, and Lightning damage after all other mitigation"
];
MYTHIC_AUDIT.elementalWard = "10% final elemental damage reduction";

try {
  const n = allTreeNodes().find(x => x.id === "h6c");
  if (n) {
    n.name = "Bulwark";
    n.d = "20% max health and 10% less damage received";
    n.max = 1;
  }
} catch (e) {}

document.title = "THE FORGE v61";
window.forgeV61 = {
  doomWeight: 0.14,
  elementalWardFinal: 0.1,
  abyssRushLevel: abyssRushLevelV61,
  abyssRushDropLevel: abyssRushDropLevelV61,
  abyssRushBossHp: ai => 4000000 + 750000 * Math.max(0, Math.min(16, Number(ai) || 0))
};

/* V62 · Abyss Rush checkpoints and token suppression. */
/* ---- (patch scope opened) ---- */
const shouldDropSkullTokenBase = shouldDropSkullToken;
shouldDropSkullToken = function (f, isHunt, areaIndex) {
  if (run && run.abyssRush) return false;
  return shouldDropSkullTokenBase(f, isHunt, areaIndex);
};

document.title = "THE FORGE v62";
window.forgeV62 = {
  checkpointAt: n => n > 0 && n % 5 === 0,
  tokenRewards: false,
  showCheckpoint: showAbyssRushCheckpoint
};

document.title = "THE FORGE v63";
window.forgeV63 = { abyssRushVoidSlowReset: true };

document.title = "THE FORGE v64";
window.forgeV64 = {
  earnedAbyssBosses: earnedAbyssBossesV64,
  repairProgress: repairAbyssRushProgress,
  progressionProtected: true
};

resetSkills = function () {
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
  S.treeMasteryV65 = emptyTreeMastery();
  beep(500, 0.12, "triangle");
  scheduleSave();
  renderTree();
  renderTown();
};
$("resetskills").onclick = resetSkills;

const style_t64 = document.createElement("style");
style_t64.textContent =
  ".branch h3{position:relative}.treemasterylevelv65{display:inline-block;margin-left:6px;padding:1px 5px;border:1px solid currentColor;border-radius:8px;font-size:9px;vertical-align:2px}.branch h3 small{display:block;margin-top:3px;color:#777;font-size:7px;font-weight:600;letter-spacing:0;text-transform:none}.branch h3.treemasteryreadyv65{cursor:pointer;border:1px solid currentColor;border-radius:7px;padding:5px;box-shadow:0 0 10px #ffffff18}.branch h3.treemasteryreadyv65:hover{background:#ffffff0b;filter:brightness(1.2)}";
document.head.appendChild(style_t64);
document.title = "THE FORGE v65";
window.forgeV65 = {
  config: TREE_MASTERY_CFG,
  marginal: masteryMarginal,
  total: masteryTotal,
  ready: treeMasteryReady,
  spend: spendTreeMastery,
  text: masteryText,
  rerunClears: 10,
  deathRestarts: true
};
