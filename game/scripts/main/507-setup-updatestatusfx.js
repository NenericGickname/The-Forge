/* ==== updateStatusFx ==== */
const updateStatusFxBase = updateStatusFx;
updateStatusFx = function () {
  if (run) run.hardHatUsed = !hardHatReady();
  const active = xpBuffActive();
  if (run) run.xpMult = 1;
  prev44: {
    updateStatusFxBase();
    if (!run) break prev44;
    const now = run.time,
      g = S.gear.weapon,
      ce = celestialEffectName(g),
      he = $("herofx");
    if (he && ce) {
      const icons = {
        Freeze: "🧊",
        Combust: "💥",
        Disease: "🦠",
        Demise: "☾",
        Bloodthirst: "🩸",
        Overload: "⚡"
      };
      he.innerHTML += fxIcon(icons[ce], 0, "buff");
    }
    run.foes.forEach((f, i) => {
      const el = $("foefx" + i);
      if (!el || f.hp <= 0) return;
      if (f.doom > 0) el.innerHTML += fxIcon("☾", Math.min(1, (f.doom || 0) / Math.max(1, f.hp)), "debuff");
      if (f.frostStacks && f.frostUntil > now) el.innerHTML += fxIcon("❄", 0, "debuff", f.frostStacks);
      if (f.freezeUntil > now)
        el.innerHTML += fxIcon("🧊", 1 - (f.freezeUntil - now) / (1500 * celestialAmp(g)), "debuff");
      if (f.combustStacks) el.innerHTML += fxIcon("💥", 0, "debuff", f.combustStacks);
      if (f.diseasePower && f.pois && f.pois.length) el.innerHTML += fxIcon("🦠", 0, "debuff", f.pois.length);
      if (f.demiseUntil > now) el.innerHTML += fxIcon("✧", 0, "debuff");
    });
  }
  if (run) run.xpMult = active ? 2 : 1;
  if (active && run) {
    const he = $("herofx");
    if (he)
      he.innerHTML +=
        fxIcon("📖", 0, "buff") +
        '<span style="font-size:8px;color:#9be8af;margin-left:2px">' +
        xpBuffTime(xpBuffRemaining()) +
        "</span>";
  }
  if (!run) return;
  const he = $("herofx");
  if (!he) return;
  ["weapon", "helm", "boots", "armor", "gloves", "amulet"].forEach(slot => {
    const g = S.gear && S.gear[slot];
    if (g && g.rar === 5 && g.mythicAffix) he.innerHTML += mythicBuffIcon(g);
  });

  return;
};

installHeroHealth = function () {
  if (!run || !run.hero || run.hero._mythicHealth) return;
  const hero = run.hero;
  let value = Number(hero.hp) || 0;
  hero._mythicHealth = true;
  Object.defineProperty(hero, "hp", {
    configurable: true,
    enumerable: true,
    get: () => value,
    set: next => {
      next = Number(next);
      if (!Number.isFinite(next)) return;
      if (next < value && run && !run.over) {
        let dealt = value - next;
        const source = run._enemyAttackTimeV40 === run.time ? run._enemyAttackSourceV40 : null;
        run._enemyAttackSourceV40 = null;
        if (source) {
          const pressure = celestialHealthPressure(source);
          dealt += pressure;
          next = value - dealt;
          run._pressureDisplayV40 = pressure;
        }
        if (S.gear.armor && S.gear.armor.mythicAffix === "mythicThorns") {
          const target =
            source ||
            (run.foes && run.foes.find(f => f.hp > 0 && f.atkA > 0)) ||
            (run.foes && run.foes.find(f => f.boss && f.hp > 0)) ||
            (run.foes && run.foes.find(f => f.hp > 0));
          if (target) {
            const reflected = dealt * 0.35;
            target.hp -= reflected;
            floatDmg("foe", "✺ " + Math.round(reflected), 0, "#35d6c8", target._x);
            if (target.hp <= 0)
              setTimeout(() => {
                if (run && !run.over && !target.dead) killFoe(target);
              }, 0);
          }
        }
      }
      value = next;
    }
  });
};

MECHS[16] = OMEGA_CONTROLLER;

shouldDropSkullToken = function (f, isHunt, areaIndex) {
  if (isHunt || !f || areaIndex < 6) return false;
  if (f.boss) return Math.random() < 0.5;
  return f.elite && Math.random() < 0.04;
};
$("upbtn").addEventListener(
  "click",
  e => {
    const g = S.gear[S.sel],
      c = g && upCost(g);
    if (g && g.rar === 5 && !canPayForge(c)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      $("fsel").innerHTML = '<span style="color:#ff6b6b">Not enough forge materials.</span>';
    }
  },
  true
);
$("strikebtn").addEventListener(
  "click",
  e => {
    if (strikeLocked || forgeContinue || celestialMode || !pend || !pend.g || pend.g.rar !== 5) return;
    const c = pend.c || upCost(pend.g);
    if (!canPayForge(c)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      $("baseodds").innerHTML =
        '<span style="color:#ff6b6b">Not enough forge materials for this attempt.</span>';
      return;
    }
    if (!pend.epicPaidV41) {
      S.epicShards = Math.max(0, S.epicShards - (c.esh || 0));
      pend.epicPaidV41 = true;
      setTimeout(updateForgeBalances, 0);
    }
  },
  true
);
installHeroHealth = installHeroHealthV41;

$("healbtn").addEventListener(
  "click",
  () => {
    if (run) {
      run._healingContextV41 = "Field Heal";
      setTimeout(() => {
        if (run && run._healingContextV41 === "Field Heal") run._healingContextV41 = null;
      }, 0);
    }
  },
  true
);
const startBossHuntBeforeV41 = startBossHunt;
startBossHunt = function () {
  startBossHuntBeforeV41();
  if (run) {
    initCombatRecap();
    installHeroHealthV41();
  }
  if ($("loottray")) $("loottray").style.display = "flex";
};
$("huntstart").onclick = startBossHunt;

const retreatBase = $("retreat").onclick;
$("retreat").onclick = () => {
  if (run && run.dummy) {
    run.over = true;
    clearInterval(timer);
    hideCast();
    run = null;
    backToTown();
    return;
  }
  return retreatBase();
};
setupV41UI();
startLootOpen = function (onDone) {
  if (!run || !run.bags.length) {
    onDone && onDone();
    return;
  }
  const bags = run.bags.slice(),
    staged = [];
  (function () {
    var ri = -1,
      rr = -1;
    for (var i = 0; i < bags.length; i++) {
      if (bags[i] && bags[i].boss && bags[i].rar > rr) {
        rr = bags[i].rar;
        ri = i;
      }
    }
    if (ri >= 0) bags[ri]._reel = true;
  })();
  run.stagedLootV42 = staged;
  run.stagedLootCommittedV42 = false;
  run.lootInsertIndex = 0;
  let opened = 0,
    openTimer = null,
    closed = false;
  $("lootcount").textContent = bags.length;
  $("lootbags").innerHTML = "";
  $("lootresults").innerHTML = "";
  $("openall").disabled = false;
  $("lootprotecthintv42").innerHTML =
    "Open an item, click its result once to select it, then click it again to lock it.";
  function reveal(row, silent) {
    if (closed) return;
    const g = row.g,
      col = cvar(RAR[g.rar].col);
    if (!silent) {
      if (g.rar >= 4) {
        flash(col);
        softShake();
        chord([523, 659, 784, 1046], 0.45);
      } else if (g.rar >= 3) chord([523, 659, 784], 0.35);
      else beep(560, 0.06, "triangle");
    }
    const card = stagedLootCard(row);
    $("lootresults").appendChild(card);
    $("lootresults").scrollTop = $("lootresults").scrollHeight;
    opened++;
    if (opened >= bags.length) {
      $("openall").disabled = true;
      $("lootprotecthintv42").innerHTML =
        "Click an item once to select it. Click the selected item again to toggle its locked exception.";
    }
  }
  function openOne(el, bag, index) {
    if (closed) return;
    if (bag && bag._reel && !el.dataset.reel && typeof bossReelV67 === "function") {
      el.dataset.reel = "1";
      try {
        bossReelV67(bag.rar, function () {
          el.classList.remove("bossreelbag");
          openOne(el, bag, index);
        });
      } catch (e) {
        el.classList.remove("bossreelbag");
        openOne(el, bag, index);
      }
      return;
    }
    if (el.dataset.o) return;
    el.dataset.o = "1";
    el.classList.add("opening");
    beep(220 + bag.rar * 80, 0.08, "square", 0.09);
    const row = { g: makeDrop(bag), bag, index, protected: false, selected: false, card: null };
    staged.push(row);
    setTimeout(() => reveal(row), 260);
  }
  bags.forEach((bag, index) => {
    const el = document.createElement("div");
    el.className = "lbag" + (bag && bag._reel ? " bossreelbag" : "");
    if (bag && bag._reel) {
      el.style.setProperty("--bc", "#ffd76a");
      el.textContent = "?";
      el.title = "Boss spoils — click to roll";
    } else {
      el.style.setProperty("--bc", cvar(RAR[bag.rar].col));
      el.textContent = bag.unique ? "🩸" : "🎁";
    }
    el.onclick = () => openOne(el, bag, index);
    $("lootbags").appendChild(el);
  });
  $("openall").onclick = () => {
    clearInterval(openTimer);
    $("openall").disabled = true;
    const els = [...$("lootbags").children];
    const normal = els.filter(
      el => !el.dataset.o && !el.dataset.reel && !el.classList.contains("bossreelbag")
    );
    const bossEl = els.find(el => el.classList.contains("bossreelbag") && !el.dataset.o && !el.dataset.reel);
    let i = 0;
    openTimer = setInterval(() => {
      if (i < normal.length) {
        if (!normal[i].dataset.o) normal[i].click();
        i++;
      } else {
        clearInterval(openTimer);
        openTimer = null;
        if (bossEl && !bossEl.dataset.o && !bossEl.dataset.reel) bossEl.click();
      }
    }, 280);
  };
  function finish(next) {
    if (closed) return;
    closed = true;
    clearInterval(openTimer);
    try {
      [...$("lootbags").children].forEach((el, index) => {
        if (!el.dataset.o) {
          el.dataset.o = "1";
          const row = {
            g: makeDrop(bags[index]),
            bag: bags[index],
            index,
            protected: false,
            selected: false,
            card: null
          };
          staged.push(row);
        }
      });
    } catch (e) {}
    commitStagedLoot();
    $("lootopen").classList.remove("on");
    run.bags = [];
    $("traychips").innerHTML = "";
    updateTrayCount();
    delete run.lootInsertIndex;
    delete run.stagedLootV42;
    delete run.stagedLootCommittedV42;
    scheduleSave();
    next && next();
  }
  $("lootleave").onclick = () => finish(onDone);
  $("lootrerun").onclick = () =>
    finish(() => {
      if (lastArea != null) startRun(lastArea);
    });
  $("lootopen").classList.add("on");
};
installRatingReference();
var reforgeLockButton;
var reforgeLockMirror;
showReforgeComparison = renderReforgeResult;
const openReforgeBeforeV43 = openReforge;
openReforge = function () {
  reforgeLockStat = "";
  openReforgeBeforeV43();
  if (reforgePending) {
    renderReforgeLockSelection();
    $("reforgemsg").textContent = "CHOOSE ONE OPTIONAL STAT LOCK, THEN ALIGN THE RING";
  }
};
const closeReforgeBase = closeReforge;
closeReforge = function () {
  $("reforgegame").classList.remove("lockselectv43");
  return closeReforgeBase();
};
$("rfbtn").onclick = openReforge;
$("reforgecancel").onclick = closeReforge;
setupReforgeLocks();

// ============ V45 DISTRIBUTED EQUIPMENT POWER ============
STAT_LABEL.attackPower = "Attack Power";
STATCAT.attackPower = "off";
PERCENT.add("attackPower");
if (!OFFSTATS.includes("attackPower")) OFFSTATS.splice(1, 0, "attackPower");
if (armorSlot) armorSlot.affixes = armorSlot.affixes.filter(st => st !== "hp");
if (bootsSlot) bootsSlot.affixes = bootsSlot.affixes.filter(st => st !== "hp");

/* ==== statRoll ==== */
/* ==== statRoll ==== */
/* ==== statRoll ==== */
/* ==== statRoll ==== */
/* ==== statRoll ==== */
/* ==== statRoll ==== */
const statRollBase = statRoll;
// ============ V32 CRITICAL BUILD, EXPERIENCE, AND BOSS LOOT BALANCE ============
statRoll = function (stat, ilvl, rar) {
  if (stat !== "critChance") {
    const level = Math.max(1, ilvl || 1),
      rm = RAR[rar].m,
      roll = 0.88 + Math.random() * 0.24;
    if (stat === "burn") return Math.max(1, Math.round((2 + level * 0.44) * rm * roll));
    if (stat === "frost") return Math.max(1, Math.round((2 + level * 0.4) * rm * roll));
    if (stat === "doom") return Math.max(1, Math.round((1 + level * 0.24) * rm * roll));
    return statRollBase(stat, ilvl, rar);

    return;
  }
  const r = Math.max(0, Math.min(4, rar || 0));
  return Math.round(PCT.critChance[r] * critLevelScale(ilvl) * (0.82 + Math.random() * 0.18) * 10) / 10;
};
const statRollBeforeV36 = statRoll;
statRoll = function (stat, ilvl, rar) {
  if (stat === "attackPower") return Math.round((0.7 + Math.random() * 0.6) * 1000) / 1000;
  const level = Math.max(1, Number(ilvl) || 1),
    r = Math.max(0, Math.min(5, Number(rar) || 0)),
    rm = RAR[r].m,
    roll = 0.7 + Math.random() * 0.6;
  if (PERCENT.has(stat) || stat === "healCdr") {
    const base = PCT[stat] && PCT[stat][r],
      critFactor = stat === "critChance" ? 0.77 : stat === "critDmg" ? 0.82 : 1;
    if (base != null) return Math.round(base * critFactor * percentScale(stat, level) * roll * 10) / 10;
  }
  if (stat === "hp") return Math.round((30 + level * 4.6 + Math.pow(level, 1.22) * 1.35) * rm * roll);
  if (stat === "atk" || stat === "def")
    return Math.round((15 + level * 2.4 + Math.pow(level, 1.22) * 0.7) * rm * roll);
  const scales = { poison: 0.42, bleed: 0.46, burn: 0.44, frost: 0.4, doom: 0.24 };
  if (scales[stat] != null) {
    const base = stat === "doom" ? 1 + level * 0.24 : 2 + level * scales[stat];
    return Math.max(1, Math.round(base * rm * roll));
  }
  return Math.round((2 + level * 0.78) * rm * roll);

  return;
};

/* ==== maxBaseRollV11 ==== */
/* ==== maxBaseRollV11 ==== */
/* ==== maxBaseRollV11 ==== */
/* ==== maxBaseRollV11 ==== */
/* ==== maxBaseRollV11 ==== */
/* ==== maxBaseRollV11 ==== */
const maxBaseRollBase = maxBaseRoll;
maxBaseRoll = function (g, stat) {
  if (stat !== "critChance") {
    {
      const level = Math.max(1, (g && g.ilvl) || 1),
        rar = Math.max(0, Math.min(4, (g && g.rar) || 0)),
        rm = RAR[rar].m;
      if (stat === "burn") return Math.max(1, Math.round((2 + level * 0.44) * rm * 1.12));
      if (stat === "frost") return Math.max(1, Math.round((2 + level * 0.4) * rm * 1.12));
      if (stat === "doom") return Math.max(1, Math.round((1 + level * 0.24) * rm * 1.12));
      return maxBaseRollBase(g, stat);
    }
    return;
  }
  const r = Math.max(0, Math.min(4, (g && g.rar) || 0));
  return Math.round(PCT.critChance[r] * critLevelScale(g && g.ilvl) * 10) / 10;
};
const maxBaseRollBeforeV36 = maxBaseRoll;
maxBaseRoll = function (g, stat) {
  let prevResult46;
  prev46: {
    const level = Math.max(1, Number(g && g.ilvl) || 1),
      r = Math.max(0, Math.min(5, Number(g && g.rar) || 0)),
      rm = RAR[r].m;
    if (PERCENT.has(stat) || stat === "healCdr") {
      const base = PCT[stat] && PCT[stat][r],
        critFactor = stat === "critChance" ? 0.77 : stat === "critDmg" ? 0.82 : 1;
      if (base != null) {
        prevResult46 = Math.round(base * critFactor * percentScale(stat, level) * 1.3 * 10) / 10;
        break prev46;
      }
    }
    if (stat === "hp") {
      prevResult46 = Math.round((12 + level * 5.2 + Math.pow(level, 1.22) * 1.35) * rm * 1.3);
      break prev46;
    }
    if (stat === "atk" || stat === "def") {
      prevResult46 = Math.round((6 + level * 2.7 + Math.pow(level, 1.22) * 0.7) * rm * 1.3);
      break prev46;
    }
    const scales = { poison: 0.42, bleed: 0.46, burn: 0.44, frost: 0.4, doom: 0.24 };
    if (scales[stat] != null) {
      const base = stat === "doom" ? 1 + level * 0.24 : 2 + level * scales[stat];
      prevResult46 = Math.max(1, Math.round(base * rm * 1.3));
      break prev46;
    }
    prevResult46 = Math.round((2 + level * 0.78) * rm * 1.3);
    break prev46;
  }
  const value = prevResult46;
  return g && g.slot === "weapon" && stat === "atk" ? Math.round(value * weaponAttackFactor(g.wtype)) : value;
};
const maxBaseRollBeforeV45 = maxBaseRoll;
maxBaseRoll = function (g, stat) {
  if (stat === "attackPower") return 1.3;
  let value = maxBaseRollBeforeV45(g, stat);
  if (g && g.distributionV45) {
    if (g.slot === "weapon" && stat === "atk") value *= 0.65;
    else if (g.slot === "helm" && stat === "hp") value *= 0.45;
    else if (g.slot === "armor" && stat === "hp") value *= 1.3;
    else if (g.slot === "boots" && stat === "hp") value *= 0.64;
  }
  return value;
};
setupDamageRecap();

const retreatClickBase = $("retreat").onclick;
$("retreat").onclick = () => {
  if (run && !run.dummy && !run.over && run.ai === 0 && run.wave === 5) {
    run.over = true;
    clearInterval(timer);
    hideCast();
    startLootOpen(() => backToTown());
    return;
  }
  return retreatClickBase();
};

const style = document.createElement("style");
style.textContent =
  ".firstfighttargetv49{border-color:#ffcf5c!important;box-shadow:0 0 14px #ffcf5c66;z-index:30}.firstfightarrowv49{position:absolute;left:50%;top:-34px;z-index:70;color:#ffcf5c;font-size:28px;line-height:1;pointer-events:none;text-shadow:0 0 6px #000,0 0 12px #ffcf5c;animation:firstfightbobv49 .8s ease-in-out infinite alternate}@keyframes firstfightbobv49{from{transform:translate(-50%,0)}to{transform:translate(-50%,9px)}}";
document.head.appendChild(style);
window.migrateSkillCapsV50 = migrateSkillCapsV50; // extra flat 30% Leech reduction throughout the Abyss
window.celestialLeechReductionV50 = celestialLeechReduction;
// leechPct is the BASE character-sheet value (diminishing returns only). The realm reduction is
// applied in live combat at the heal sites, and shown separately as an active-effect mod — so the
// stat panel is consistent everywhere and doesn't show a reduced % that lingers after a run.
leechPct = function (pts) {
  pts = Math.max(0, pts || 0);
  return Math.round(((10 * pts) / (pts + 14)) * 10) / 10;
};
window.abyssBossHPV50 = abyssBossHP;
window.abyssExcessHpDmgV50 = abyssExcessHpDmg;

/* ---------- (7b) OMEGA SUMMONS LESS OFTEN ---------- */
try {
  if (typeof OMEGA_CONTROLLER === "object" && OMEGA_CONTROLLER) {
    const os = OMEGA_CONTROLLER.onSpawn;
    OMEGA_CONTROLLER.onSpawn = function (b) {
      if (os) os(b);
      b.omegaSummonAt = run.time + 90000;
    };
  }
} catch (e) {}
try {
  if (typeof OMEGA_SUMMON === "object" && OMEGA_SUMMON) {
    const rs = OMEGA_SUMMON.resolve;
    OMEGA_SUMMON.resolve = function (b) {
      rs.call(this, b);
      b.omegaSummonAt = run.time + 90000;
    };
  }
} catch (e) {}

try {
  if (typeof omegaSummonGuards === "function") {
    const omegaSummonGuardsBeforeV50 = omegaSummonGuards;
    omegaSummonGuards = function (b) {
      const created = omegaSummonGuardsBeforeV50(b);
      if (run) {
        if (run._firstSummonAt == null) run._firstSummonAt = run.time;
        (created || []).forEach(g => {
          g.summoned = true;
          g.noDrop = run.time !== run._firstSummonAt;
        });
      }
      return created;
    };
  }
} catch (e) {}
MECHS.forEach(wrapMechForAbyss);
[
  typeof OMEGA_STUN !== "undefined" ? OMEGA_STUN : null,
  typeof OMEGA_HEAL !== "undefined" ? OMEGA_HEAL : null
].forEach(m => {
  if (m) wrapMechForAbyss(m);
});
try {
  if (MECHS[0] && MECHS[0].resolve) {
    const rr = MECHS[0].resolve;
    MECHS[0].resolve = function (b) {
      if (run && run.a && run.a.abyss) {
        abyssSwarm("goblin", null, "📯 The Abyssal King calls in %n goblin%s!");
        return;
      }
      return rr.call(this, b);
    };
  }
} catch (e) {}
try {
  if (MECHS[6] && MECHS[6].resolve) {
    const wr = MECHS[6].resolve;
    MECHS[6].resolve = function (b) {
      if (run && run.a && run.a.abyss) {
        abyssSwarm("wraith", { revive: 1 }, "👻 %n abyssal ghosts rise — they revive once when slain!");
        return;
      }
      return wr.call(this, b);
    };
  }
} catch (e) {}
const weaponTypeNameBase = weaponTypeName;
weaponTypeName = weaponTypeNameV50;

weaponAttackFactor = function (type) {
  return typeof weaponAtkMulV50 === "function"
    ? weaponAtkMulV50(type)
    : type === "greataxe"
      ? 1.42
      : type === "sword"
        ? 1.28
        : type === "bow"
          ? 0.92
          : 0.68;
};

/* ---------- BLOODFORGED: HP growth scales up at high item levels ----------
   The HP growth cap equalled the Attack cap (~900 at ilvl 180), which is nothing against a
   150k+ endgame HP pool while the Attack growth stays strong (~900/item ≈ worth it). Give HP
   its own, much larger cap that scales with item level, and let it climb a little faster, so a
   fully-grown Bloodforged set is a real HP boost (a maxed ilvl-180 ✦10 set ≈ +21k HP / +5.4k Atk)
   worth chasing. Attack growth is unchanged. */
if (typeof growthValues === "function" && typeof growthCap === "function") {
  if (typeof growthLine === "function") {
  }
}
