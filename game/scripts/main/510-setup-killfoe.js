/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
/* ==== killFoe ==== */
const killFoeBase = killFoe;
killFoe = function (f, critTier) {
  const before = run && run.bags ? run.bags.length : 0,
    isCampaign = !!(run && !run.hunt),
    areaIndex = run ? run.ai : 0;
  prev15: {
    const dead = !!f.dead,
      goldBefore = S.gold,
      tokensBefore = S.skullTokens || 0,
      isHunt = !!(run && run.hunt),
      lvl = f.lvl || 1;
    killFoeBase(f, critTier);
    if (dead || !f.dead) break prev15;
    if (!isHunt) {
      const gained = Math.max(0, S.gold - goldBefore),
        scale = Math.min(1, 0.18 + lvl / 70),
        adjusted = Math.round(gained * scale);
      S.gold = goldBefore + adjusted;
      $("gold").textContent = fmtCur(S.gold);
      if (!f.boss && $("rmsg").textContent.includes("Wave clear"))
        $("rmsg").innerHTML = "Wave clear! +" + fmt(adjusted) + "g";
    }
    if ((S.skullTokens || 0) > tokensBefore) showSkullToken();
  }
  if (!isCampaign || !run || !run.bags) return;
  run.bags.slice(before).forEach(b => {
    if (!b.unique) b.lvl = rollDropLevel(areaIndex);
  });
};
const killFoeBeforeV13 = killFoe;
killFoe = function (f, critTier) {
  const before = run && run.bags ? run.bags.length : 0;
  prev16: {
    if (!f || f.dead) break prev16;
    const goldBefore = S.gold,
      bagsBefore = run && run.bags ? run.bags.length : 0,
      isHunt = !!(run && run.hunt);
    deathParticleColor = f.boss && f.draw ? f.draw.c : null;
    try {
      killFoeBeforeV13(f, critTier);
    } finally {
      deathParticleColor = null;
    }
    if (!f.dead) break prev16;
    if (!isHunt) {
      const gained = Math.max(0, S.gold - goldBefore),
        adjusted = Math.round(gained * (f.boss ? 0.7 : 1.15));
      S.gold = goldBefore + adjusted;
      $("gold").textContent = fmtCur(S.gold);
    }
    if (!run || !run.bags || f.boss) break prev16;
    const gainedBags = run.bags.length - bagsBefore,
      extraChance = f.elite ? (gainedBags ? 0 : 0.55) : 0.06;
    if (Math.random() < extraChance) {
      let rar = rollRarity((f.lvl || 1) + (f.elite ? 5 : 0));
      if (f.elite && Math.random() < 0.14) rar = Math.min(4, rar + 1);
      run.bags.push({
        rar,
        lvl: rollDropLevel(run.ai || 0),
        slot: SLOTS[Math.floor(Math.random() * S.slotsOpen)].key
      });
      addBagChip(rar);
    }
  }
  if (!run || !run.bags) return;
  let found = false;
  run.bags.slice(before).forEach(b => {
    if (rollBloodforged(b)) found = true;
  });
  if (found) {
    $("rmsg").className = "msg big";
    $("rmsg").innerHTML = "🩸 A Bloodforged item dropped!";
    flash(cvar("--legendary"));
    chord([220, 330, 440, 660], 0.45);
    scheduleSave();
  }
};
const killFoeBeforeV18 = killFoe;
killFoe = function (f, critTier) {
  const wasDead = !!(f && f.dead),
    bagsBefore = run && run.bags ? run.bags.length : 0;
  prev17: {
    if (!f || f.dead) break prev17;
    const spread =
        f.diseasePower && f.pois && f.pois.length ? Math.max(1, Math.ceil(f.pois.length * 0.65)) : 0,
      duration = f.poisonDuration || 5200;
    killFoeBeforeV18(f, critTier);
    if (!f.dead || !spread || !run) break prev17;
    run.foes
      .filter(x => x !== f && x.hp > 0)
      .forEach(target => {
        target.pois = target.pois || [];
        for (let i = 0; i < spread && target.pois.length < 12; i++) target.pois.push(run.time + duration);
        target.diseasePower = 1;
        target.poisonDuration = duration;
        spawnStatusParticles(target, "poison", 14);
        floatDmg("foe", "🦠 SPREAD", 0, "#8fe070", target._x);
      });
  }
  if (wasDead || !f || !f.dead || !f.superElite || !run || !run.bags) return;
  const guaranteedRarity = Math.random() < 0.22 ? 4 : 3;
  let bag = run.bags.slice(bagsBefore)[0];
  if (bag) bag.rar = Math.max(guaranteedRarity, bag.rar || 0);
  else {
    bag = {
      rar: guaranteedRarity,
      lvl: rollDropLevel(run.ai || 0),
      slot: SLOTS[Math.floor(Math.random() * S.slotsOpen)].key
    };
    run.bags.push(bag);
    addBagChip(bag.rar);
  }
  $("rmsg").className = "msg big";
  $("rmsg").innerHTML =
    '✦ Super Elite defeated · guaranteed <span style="color:' +
    cvar(RAR[bag.rar].col) +
    '">' +
    RAR[bag.rar].n +
    " loot</span>";
  flash(cvar(RAR[bag.rar].col));
  beep(820, 0.16, "triangle");
  scheduleSave();
};
const killFoeBeforeV36 = killFoe;
killFoe = function (f, critTier) {
  if (run && run.dummy && f && f.trainingDummy) {
    f.hp = f.max;
    f.dead = 0;
    f.hurt = 1;
    [
      "doom",
      "doomExploded",
      "pois",
      "burnUntil",
      "burnDmg",
      "combustStacks",
      "slowUntil",
      "frostStacks",
      "freezeUntil",
      "bleedC",
      "demiseUntil"
    ].forEach(k => delete f[k]);
    run.dummyCyclesV41 = (run.dummyCyclesV41 || 0) + 1;
    run.dmgLog = [];
    floatDmg("foe", "🎯 DUMMY RESET " + run.dummyCyclesV41, 0, "#ffe09a", f._x);
    drawBars();
    return;
  }
  if (run) run._healingContextV41 = "Healing on kill";
  try {
    const sh = S.shards,
      ep = S.epicShards,
      bagStart = run && run.bags ? run.bags.length : 0,
      active = run && run.ai >= CELESTIAL_AREA_START && !run.hunt;
    prev33: {
      const wasDead = !!(f && f.dead),
        isBoss = !!(f && f.boss),
        isHunt = !!(run && run.hunt);
      prev18: {
        const active = run && run.ai >= CELESTIAL_AREA_START && !run.hunt,
          bagStart = run && run.bags ? run.bags.length : 0,
          first = !!(active && f && f.boss && !S.clearedAreas.includes(run.ai));
        killFoeBeforeV36(f, critTier);
        if (!f || !f.dead) break prev18;
        if (S.gear.amulet && S.gear.amulet.mythicAffix === "temper" && run)
          run.temperStacks = Math.min(30, (run.temperStacks || 0) + 1);
        if (!active || !run || !run.bags) break prev18;
        const tier = run.ai - CELESTIAL_AREA_START,
          cel = Math.max(0, Math.min(10, Math.floor((f.lvl - 112) / 6)));
        run.bags.slice(bagStart).forEach(b => {
          b.celestialDrop = true;
          delete b.celestial;
          b.lvl = Math.max(105, Math.min(180, b.lvl));
          const mythicChance = f.boss
            ? 0.12 + tier * 0.04
            : f.elite
              ? 0.018 + tier * 0.006
              : 0.0015 + tier * 0.0005;
          if (Math.random() < mythicChance) b.rar = 5;
        });
        /* V50: per-Guardian guaranteed Mythic removed — the first clear of The End grants the guaranteed Mythic instead; Guardians now drop Mythics only via the random roll below. */ const chance =
          f.boss ? 1 : f.elite ? 0.28 : 0.055;
        if (Math.random() < chance) {
          const amount = holyMissionV36(f.boss ? 5 + tier * 3 : f.elite ? 2 : 1);
          S.celestialShards = (S.celestialShards || 0) + amount;
          showCelestialShard(amount);
          updateForgeBalances();
        }
        scheduleSave();
      }
      if (wasDead || !isBoss || !f.dead || !run || !run.bags || isHunt) break prev33;
      if (Math.random() >= 0.33) break prev33;
      let rar = rollRarity(f.lvl || 1);
      rar = Math.max(rar, rollRarity((f.lvl || 1) + 10), rollRarity((f.lvl || 1) + 18));
      rar = Math.min(4, rar + 1);
      const bag = {
        rar,
        lvl: Math.max(1, f.lvl || rollDropLevel(Math.max(0, Math.min(11, run.ai || 0)))),
        slot: SLOTS[Math.floor(Math.random() * S.slotsOpen)].key,
        bossRollV72: true
      };
      run.bags.push(bag);
      addBagChip(rar);
      scheduleSave();
    }
    if (S.gear.amulet && S.gear.amulet.mythicAffix === "holyMission") {
      S.shards += Math.floor(Math.max(0, S.shards - sh) * 0.25);
      S.epicShards += Math.floor(Math.max(0, S.epicShards - ep) * 0.25);
    }
    if (active && run && run.bags)
      run.bags.slice(bagStart).forEach(b => {
        b.celestialDrop = true;
        delete b.celestial;
      });
    updateForgeBalances();

    return;
  } finally {
    if (run) run._healingContextV41 = null;
  }
};
const killFoeBeforeV50 = killFoe;
killFoe = function (f, critTier) {
  const spread = !!(f && f.diseasePower && f.pois && f.pois.length),
    count = spread ? Math.max(1, Math.ceil(f.pois.length * 0.65)) : 0,
    duration = (f && f.poisonDuration) || 5200,
    targets =
      run && run.foes ? run.foes.filter(x => x !== f && x.hp > 0).map(x => [x, (x.pois || []).length]) : [];
  let prevResult84;
  prev84: {
    const noDrop = !!(f && f.noDrop && !f.boss && !f.dead);
    const endGrant = !!(
      f &&
      f.boss &&
      run &&
      !run.abyss &&
      run.ai === 12 &&
      !(S.flags && S.flags.endMythicGivenV50) &&
      !S.clearedAreas.includes(12)
    );
    const abyss = !!(run && run.a && run.a.abyss);
    const n0 = run && run.bags ? run.bags.length : 0;
    killFoeBeforeV50(f, critTier);
    if (!f || !f.dead) {
      prevResult84 = undefined;
      break prev84;
    }
    /* The first clear of The End is the Mythic threshold. Strip random Mythic
    rolls from that battle, then grant exactly one non-weapon Mythic below. */
    if (endGrant && run && run.bags) {
      run.bags.slice(n0).forEach(b => {
        if (b && b.rar === 5 && !b.unique) b.rar = 4;
      });
    }
    if (noDrop && run && run.bags && run.bags.length > n0) {
      const removed = run.bags.length - n0;
      run.bags.length = n0;
      const tr = $("traychips");
      if (tr) {
        for (let i = 0; i < removed; i++) {
          if (tr.lastElementChild) tr.removeChild(tr.lastElementChild);
        }
      }
      try {
        updateTrayCount();
      } catch (e) {}
    }
    if (abyss && run && run.bags) {
      const mirror = run.mirror == null ? run.ai : run.mirror,
        cel = Math.max(2, Math.min(10, 4 + Math.floor(mirror / 2)));
      const newBags = run.bags.slice(n0);
      // Abyss drop item level = the actual foe's level (160-185). The base loot code derives level
      // from AREAS[run.ai].lvl, but abyss reuses the original low-level area indices, so it wrongly
      // produced ~lvl 1-6 → floored to 120. Use the foe level instead.
      const dropLvl = Math.max(1, Math.min(ABYSS_ITEM_LEVEL_CAP, (f && f.lvl) || run.a.lvl || 160));
      newBags.forEach(b => {
        if (b.rar === 5 && !b.unique) b.rar = 4;
        b.celestialDrop = true;
        delete b.celestial;
        b.lvl = dropLvl;
      }); // items drop at ✦0 — Celestial is forged by the player, never pre-applied
      // ONE mythic roll per kill (not per bag) — the boss dropping 3-4 bags was flooding mythics
      const TM = (typeof window !== "undefined" && window.__abyssTune) || {};
      const mch = (f.boss ? 0.1 : f.abyssElite ? 0.05 : f.elite ? 0.012 : 0.003) * (TM.mythicMul != null ? TM.mythicMul : 0.5);
      if (newBags.length && Math.random() < mch) {
        let target = newBags[0];
        for (const b of newBags) if ((b.rar || 0) > (target.rar || 0)) target = b;
        if ((target.rar || 0) < 5) {
          target.rar = 5;
          const idx = n0 + newBags.indexOf(target),
            tr = $("traychips");
          if (tr && tr.children[idx]) tr.children[idx].style.setProperty("--bc", "#1fb8ad");
        }
      }
      if (f.boss && !run.abyssRush) {
        S.abyssTokens = (S.abyssTokens || 0) + 1;
        showAbyssToken();
        const rm = $("rmsg");
        if (rm) {
          rm.className = "msg big";
          rm.innerHTML = "🌀 Abyss Token found · " + S.abyssTokens + " owned";
        }
        try {
          scheduleSave();
        } catch (e) {}
      } else if (f.abyssElite && !run.abyssRush && Math.random() < 0.05) {
        S.abyssTokens = (S.abyssTokens || 0) + 1;
        try {
          scheduleSave();
        } catch (e) {}
      }
    }
    if (endGrant) {
      S.flags = S.flags || {};
      S.flags.endMythicGivenV50 = true;
      const armorSlots = ["armor", "helm", "gloves", "boots", "amulet"].filter(
        k => SLOTS.findIndex(s => s.key === k) < S.slotsOpen
      );
      const slot = armorSlots[Math.floor(Math.random() * armorSlots.length)] || "armor";
      run.bags.push({ rar: 5, lvl: 118, slot, guaranteedMythicV50: true });
      try {
        addBagChip(5);
      } catch (e) {}
      try {
        scheduleSave();
      } catch (e) {}
    }
    try {
      updateForgeBalances();
    } catch (e) {}
  }
  const result = prevResult84;
  if (spread && f && f.dead && run) {
    const g = S.gear && S.gear.weapon,
      cap = poisonSpreadCapV51(g, heroStats());
    targets.forEach(([t, old]) => {
      if (t.hp <= 0) return;
      t.pois = t.pois || [];
      const goal = Math.min(cap, old + count);
      while (t.pois.length < goal) t.pois.push(run.time + duration);
      t.diseasePower = 1;
      t.poisonDuration = duration;
      t.poisonCapV51 = poisonStackCap(g, heroStats());
      t.poisonSpreadCapV51 = cap;
    });
  }
  return result;
};
const killFoeBeforeV52 = killFoe;
killFoe = function (f, critTier) {
  const before = run && run.bags ? run.bags.length : 0;
  let prevResult85;
  prev85: {
    const wasHunt = !!(run && run.hunt),
      huntIndex = run && run.huntIndex,
      result = killFoeBeforeV52(f, critTier);
    if (run && wasHunt && run.huntIndex !== huntIndex) run._bossTransitionV52 = true;
    if (
      run &&
      !run.over &&
      f &&
      f.boss &&
      f.dead &&
      run.foes.every(x => x.hp <= 0) &&
      (!wasHunt || run.huntIndex === huntIndex)
    )
      areaClear();
    prevResult85 = result;
    break prev85;
  }
  const result = prevResult85;
  if (run && run.bags) {
    let found = false;
    run.bags.slice(before).forEach(b => {
      if (rollBloodforged(b)) found = true;
    });
    if (found) {
      const m = $("rmsg");
      if (m) {
        m.className = "msg big";
        m.innerHTML = "🩸 A Bloodforged item dropped!";
      }
      flash(cvar("--legendary"));
      chord([220, 330, 440, 660], 0.45);
      scheduleSave();
    }
  }
  return result;
};
const killFoeBeforeAbyssShards = killFoe;
killFoe = function (f, critTier) {
  const wasDead = !!(f && f.dead),
    result = killFoeBeforeAbyssShards(f, critTier);
  if (wasDead || !f || !f.dead) return result;
  const amount = abyssCelestialShardDrop(f);
  if (amount > 0) {
    S.celestialShards = (S.celestialShards || 0) + amount;
    try {
      updateForgeBalances();
    } catch (e) {}
    try {
      floatDmg("foe", "✺ +" + amount + " CELESTIAL SHARD" + (amount === 1 ? "" : "S"), 0, "#c9b6ff", f._x);
    } catch (e) {}
    try {
      scheduleSave();
    } catch (e) {}
  }
  return result;
};

window.forgeV65.abyssShardChance = 0.01;
window.forgeV65.abyssShardDrop = abyssCelestialShardDrop;
window.forgeV65.eliteShards = 1;
window.forgeV65.superEliteShards = 5;

document.title = "THE FORGE v66";
window.forgeV66 = {
  history: celestialExchangeHistory,
  unlock: recordCelestialExchangeUnlock,
  convert: convertEpicToCelestial,
  rates: [
    [100, 1],
    [1000, 10]
  ]
};

const style_t67 = document.createElement("style");
style_t67.textContent =
  ".conversionsliderv67{grid-column:span 1}.conversionrangev67{width:100%;margin:10px 0 3px;accent-color:#c9b6ff;cursor:pointer}.conversionrangev67:disabled{opacity:.35;cursor:default}.conversionreadoutv67{margin-top:8px;min-height:16px;color:#f0e7ff;font-size:11px;font-weight:800}.conversionlimitsv67{display:flex;justify-content:space-between;color:var(--dim);font-size:8px;margin-bottom:8px}.conversionsliderv67 button{width:100%}";
document.head.appendChild(style_t67);
document.title = "THE FORGE v67";
window.forgeV67 = {
  maximum: conversionMaximum,
  convert: convertCurrency,
  selection: conversionSelection,
  rate: 100
};

// boot
init();

/* ================= script block 1 ================= */

/* ============================================================
   V67 FEEL PATCH
   (1) surprise-scaled screenshake  (2) boss/legendary loot reel
   (3) closeness-scaled death copy is patched in heroDown above
   All guarded so a failure never breaks the game.
   ============================================================ */
/* ---- (patch scope opened) ---- */
var _bs = document.createElement("style");
_bs.id = "bossbagcssV67";
_bs.textContent =
  ".lbag.bossreelbag{border-style:dashed!important;font-weight:700;color:#ffe9c9}.lbag.bossreelbag:not(.opening){animation:bossreelpulseV67 1.1s infinite}@keyframes bossreelpulseV67{50%{box-shadow:0 0 22px #ffd76a,0 0 34px rgba(255,215,106,.42)}}";
(document.head || document.documentElement).appendChild(_bs);
/* ---------- (1) surprise-scaled screenshake ---------- */
var _hb = []; // rolling recent hero-hit magnitudes
window.heroHitShakeV67 = function (dmg, tier) {
  try {
    dmg = +dmg || 0;
    tier = tier || 0;
    var base = null;
    if (_hb.length >= 4) {
      var s = _hb.slice().sort(function (a, b) {
        return a - b;
      });
      base = s[Math.floor(s.length * 0.55)];
    }
    var intensity;
    if (base && base > 0) {
      var ratio = dmg / base;
      intensity = Math.max(0, Math.min(1, (ratio - 1.35) / 2.6));
    } else {
      intensity = tier >= 2 ? 0.55 : tier >= 1 ? 0.25 : 0;
    } // warm-up: fall back to crit tier
    _hb.push(dmg);
    if (_hb.length > 16) _hb.shift();
    if (intensity >= 0.55) {
      if (typeof shake === "function") shake();
    } else if (intensity >= 0.12) {
      if (typeof softShake === "function") softShake();
    }
  } catch (e) {
    if (tier >= 2 && typeof softShake === "function") softShake();
  }
};
/* ---------- (2) boss / legendary loot reel ---------- */
var busy = false;
window.bossReelV67 = function (rar, cb) {
  var done = false,
    ov = null;
  function finish() {
    if (done) return;
    done = true;
    busy = false;
    try {
      if (ov && ov.parentNode) ov.parentNode.removeChild(ov);
    } catch (e) {}
    try {
      cb && cb();
    } catch (e) {}
  }
  if (busy) {
    try {
      cb && cb();
    } catch (e) {}
    return;
  }
  try {
    busy = true;
    ensureCss();
    var CW = 112,
      N = 44,
      maxR = poolMax();
    rar = Math.max(0, Math.min(maxR, rar | 0));
    ov = document.createElement("div");
    ov.className = "reelovV67";
    ov.innerHTML =
      '<div class="reelboxV67"><div class="reeltV67">Boss spoils</div><div class="reelwV67"><div class="reelbV67" id="reelbV67"></div><div class="reelmV67"></div></div><div class="reelhV67">click to skip</div></div>';
    document.body.appendChild(ov);
    var band = ov.querySelector("#reelbV67");
    var cells = [];
    for (var i = 0; i < N; i++) {
      var x = Math.random(),
        idx = x < 0.5 ? 0 : x < 0.78 ? 1 : x < 0.92 ? 2 : x < 0.985 ? 3 : 4;
      if (idx > maxR) idx = maxR;
      cells.push(idx);
    }
    var target = N - 4;
    cells[target] = rar;
    band.innerHTML = cells
      .map(function (ci) {
        var c = rcol(ci);
        return (
          '<div class="reelcV67" style="color:' +
          c +
          ";background:" +
          c +
          '14"><span class="n">' +
          rname(ci) +
          '</span><span class="s">' +
          rname(ci) +
          "</span></div>"
        );
      })
      .join("");
    var winW = ov.querySelector(".reelwV67").clientWidth || 420;
    var landFrac = 0.28 + Math.random() * 0.44; // land off-centre, not always mid-cell
    var endX = -(target * CW + CW * landFrac - winW / 2),
      startX = winW * 0.6,
      dur = 3200,
      t0 = null,
      last = -99;
    function ease(p) {
      return 1 - Math.pow(1 - p, 5);
    } // long slow finish
    ov.addEventListener("click", function () {
      dur = 0;
    });
    function frame(ts) {
      if (done) return;
      if (t0 == null) t0 = ts;
      var p = dur <= 0 ? 1 : Math.min(1, (ts - t0) / dur),
        e = ease(p),
        x = startX + (endX - startX) * e;
      band.style.transform = "translateX(" + x + "px)";
      var c = Math.round((-x + winW / 2 - CW / 2) / CW);
      if (c !== last && p < 1) {
        last = c;
        try {
          if (typeof beep === "function") beep(200 + e * 170, 0.024, "square", 0.06);
        } catch (e) {}
      }
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        band.style.transform = "translateX(" + endX + "px)";
        try {
          var col = rcol(rar);
          if (rar >= 4) {
            if (typeof shake === "function") shake();
            if (typeof flash === "function") flash(col);
            if (typeof chord === "function") chord([523, 659, 784, 1046, 1319], 0.6);
            setTimeout(function () {
              try {
                if (typeof chord === "function") chord([1046, 1319, 1568, 2093], 0.55);
              } catch (e) {}
            }, 150);
            setTimeout(function () {
              try {
                if (typeof beep === "function") beep(2637, 0.16, "triangle", 0.12);
              } catch (e) {}
            }, 300);
          } else if (rar >= 3) {
            if (typeof flash === "function") flash(col);
            if (typeof chord === "function") chord([784, 1046, 1568], 0.32);
          } else {
            if (typeof chord === "function") chord([1046, 1568], 0.22);
            else if (typeof beep === "function") beep(1046, 0.14, "triangle", 0.12);
          }
        } catch (e) {}
        setTimeout(finish, 600);
      }
    }
    requestAnimationFrame(frame);
    setTimeout(finish, dur + 2600); // hard safety: never leave a bag unopened
  } catch (e) {
    finish();
  }
};
/* tag boss-dropped bags so the reel reveals the boss's marquee drop, whatever grade it lands on */
try {
  if (typeof killFoe === "function") {
    var _kf = killFoe;
    killFoe = function (f, ct) {
      var wasBoss = !!(f && f.boss && !f.dead);
      var n0 = typeof run !== "undefined" && run && run.bags ? run.bags.length : 0;
      var r = _kf(f, ct);
      try {
        if (wasBoss && typeof run !== "undefined" && run && run.bags) {
          var _a = run.a,
            _mn = (_a && _a.lvl) || 1,
            _mx = _mn + ((_a && _a.waves) || 0);
          for (var i = n0; i < run.bags.length; i++) {
            if (run.bags[i]) {
              run.bags[i].boss = true;
              var _rr = Math.random();
              run.bags[i].lvl =
                _rr < 0.7
                  ? _mx
                  : _rr < 0.9
                    ? Math.max(_mn, _mx - 1)
                    : _mn + Math.floor(Math.random() * (_mx - _mn + 1));
            }
          }
        }
      } catch (e) {}
      return r;
    };
  }
} catch (e) {}
/* (4) pity floor — hidden bad-luck protection so long dry streaks cannot enrage */
try {
  if (typeof rollRarity === "function") {
    var _rollR = rollRarity,
      _pityLeg = 0,
      _pityEpic = 0;
  }
} catch (e) {}
