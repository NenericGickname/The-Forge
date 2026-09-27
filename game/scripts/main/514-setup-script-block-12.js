/* ================= script block 12 ================= */

/* V82 · Purchased Gear Bag, inventory dragging, and equipped Legacy tooltips. */
window.__forgeV7Boot = "v82 starting";

if (typeof allItemsV70 === "function") {
  const allItemsBeforeV82 = allItemsV70;
  allItemsV70 = function (state = S) {
    const items = allItemsBeforeV82(state);
    (ensureGearBag(state).gearBagV82 || []).forEach(g => g && items.push(g));
    return items;
  };
}

/* ==== renderShop ==== */
/* ==== renderShop ==== */
/* ==== renderShop ==== */
/* ==== renderShop ==== */
/* ---- renderShop: later layers (moved here) ---- */
const renderShopV5 = renderShop;
// ============ V20 SHOP REDESIGN AND LOCKED PLAYTEST PRESETS ============
/* ==== renderShop ==== */
/* ==== renderShop ==== */
/* ==== renderShop ==== */
renderShop = function () {
  ensureV52State();
  prev116: {
    ensureV51State();
    {
      {
        {
          prev40: {
            {
              {
                renderShopV5();
                const grid = $("shopgrid"),
                  card = document.createElement("div");
                card.className = "shopcard";
                card.style.borderColor = S.developerMode ? "var(--uncommon)" : "var(--epic)";
                card.innerHTML =
                  '<div class="sn">🧪 Developer Mode</div><div class="sd">Grant 10,000,000 gold and shards, unlock every equipment slot, and equip legendary level 80 gear at +20 and Celestial 6.</div><div class="sown">' +
                  (S.developerMode ? "Active" : "Permanent test grant") +
                  '</div><button class="cel"' +
                  (S.developerMode ? " disabled" : "") +
                  ">" +
                  (S.developerMode ? "✓ Developer Mode Active" : "Activate Developer Mode") +
                  "</button>";
                const btn = card.querySelector("button");
                btn.onclick = () => {
                  activateDeveloperMode();
                  renderShop();
                  renderTown();
                };
                grid.appendChild(card);
              }
              const grid = $("shopgrid");
              addShardConversion(grid, 100, 1);
              addShardConversion(grid, 1000, 10);
            }
            const grid = $("shopgrid");
            [...grid.querySelectorAll(".shopcard")].forEach(card => {
              const title = card.querySelector(".sn");
              if (title && title.textContent.includes("Developer Mode")) card.remove();
            });
            if (S.developerMode) break prev40;
            S.flags = S.flags || {};
            const card = document.createElement("div");
            card.className = "shopcard secretdev";
            card.innerHTML = '<button type="button"></button>';
            card.querySelector("button").onclick = () => {
              S.flags.devShopClicks = (S.flags.devShopClicks || 0) + 1;
              beep(180 + S.flags.devShopClicks * 18, 0.035, "square", 0.025);
              if (S.flags.devShopClicks >= 10) activateDeveloperMode();
              scheduleSave();
              renderShop();
              renderTown();
            };
            grid.appendChild(card);
          }
          const grid = $("shopgrid"),
            card = document.createElement("div");
          card.className = "shopcard";
          card.style.borderColor = "#587ca8";
          card.innerHTML =
            '<div class="sn" style="color:#9fd8ff">🧪 Playtest Preset</div><div class="sd">Replace the active test state with a prepared progression loadout.</div><div class="playtestchoices"><button data-p="early">Level 15 · Items 15 · +8</button><button data-p="mid">Level 40 · Items 40 · +14</button><button data-p="late">Level 80 · Items 80 · +20 · Celestial 4</button></div>';
          card.querySelectorAll("button").forEach(btn => {
            const kind = btn.dataset.p;
            btn.classList.toggle("active", S.playtestPreset === kind);
            btn.onclick = () => {
              applyPlaytestPresetV18(kind);
              renderShop();
            };
          });
          grid.appendChild(card);
        }
        const grid = $("shopgrid");
        [...grid.querySelectorAll(".shopcard")].forEach(card => {
          const title = card.querySelector(".sn");
          if (title && title.textContent.includes("Playtest Preset")) card.remove();
        });
        renderPlaytestPanel();
      }
      const grid = $("shopgrid");
      upgradeInsightCard(grid);
      decorateShopCards(grid);
    }
    const cur = $("shopcur");
    if (cur && !$("musicselV50")) {
      const b = document.createElement("button");
      b.id = "musicselV50";
      b.type = "button";
      b.className = "ghost";
      b.style.cssText = "font-size:10px;padding:4px 9px;margin-top:6px;display:inline-block";
      b.onclick = cycleMusic;
      cur.appendChild(document.createElement("br"));
      cur.appendChild(b);
    }
    renderMusicBtn();
    const grid = $("shopgrid");
    if (!grid) break prev116;
    [...grid.querySelectorAll(".shopcard")].forEach(card => {
      const t = card.querySelector(".sn");
      if (t && /Guard/i.test(t.textContent)) card.remove();
    });
    const offers = [
      ["low", { gold: 1200, shards: 80 }],
      ["med", { gold: 6000, shards: 450 }],
      ["high", { gold: 24000, shards: 2200, esh: 5 }],
      ["vhigh", { gold: 90000, shards: 9000, esh: 25 }],
      ["ultra", { gold: 300000, shards: 30000, esh: 90 }]
    ];
    offers.forEach(([key, cost]) => {
      const gd = GUARDS[key],
        owned = S.guards[key] || 0,
        price = [];
      if (cost.gold) price.push('<span style="color:var(--gold)">' + fmt(cost.gold) + "g</span>");
      if (cost.shards) price.push('<span style="color:var(--rare)">' + fmt(cost.shards) + "sh</span>");
      if (cost.esh) price.push('<span class="esh">' + cost.esh + " epic</span>");
      const afford =
          owned < 1 && S.gold >= cost.gold && S.shards >= cost.shards && S.epicShards >= (cost.esh || 0),
        card = document.createElement("div");
      card.className = "shopcard guardbandv51";
      card.innerHTML =
        '<div class="sn">🛡 ' +
        gd.n +
        '</div><div class="sd">One use. Always prevents a shatter on item levels ' +
        gd.min +
        " to " +
        gd.max +
        '. You may hold only one.</div><div class="sown">' +
        (owned ? "In stock" : "Not owned") +
        '</div><button class="up"' +
        (afford ? "" : " disabled") +
        ">" +
        (owned ? "Already owned" : 'Buy <span class="pc">' + price.join(" + ") + "</span>") +
        "</button>";
      const btn = card.querySelector("button");
      btn.onclick = () => {
        if (!afford) return;
        S.gold -= cost.gold;
        S.shards -= cost.shards;
        S.epicShards -= cost.esh || 0;
        S.guards[key] = 1;
        beep(680, 0.1, "triangle");
        flash(cvar("--gold"));
        scheduleSave();
        renderShop();
        renderTown();
      };
      grid.appendChild(card);
    });
  }
  const grid = $("shopgrid");
  if (!grid) return;
  [...grid.querySelectorAll(".secretdev,.guardbandv51,.guardbandv52")].forEach(card => card.remove());
  const offers = [
    ["low", { gold: 1200, shards: 80 }],
    ["med", { gold: 6000, shards: 450 }],
    ["high", { gold: 24000, shards: 2200, esh: 5 }],
    ["vhigh", { gold: 90000, shards: 9000, esh: 25 }],
    ["ultra", { gold: 300000, shards: 30000, esh: 90 }]
  ];
  offers.forEach(([key, cost]) => guardOffer(key, cost, grid));
};
const renderShopBase = renderShop;
renderShop = function () {
  let prevResult117;
  prev117: {
    const result = renderShopBase();
    const old = $("musicselV50");
    if (old) old.remove();
    prevResult117 = result;
    break prev117;
  }
  const result = prevResult117;
  if (!recordCelestialExchangeUnlock()) return result;
  const cur = $("shopcur");
  if (cur)
    cur.innerHTML += ' · Celestial <b style="color:#c9b6ff">' + fmtCur(S.celestialShards || 0) + "</b>";
  const grid = $("shopgrid");
  if (grid) {
    addCelestialExchangeCard(grid, 100, 1);
    addCelestialExchangeCard(grid, 1000, 10);
  }
  return result;
};
const renderShopBeforeV67 = renderShop;
renderShop = function () {
  let prevResult118;
  prev118: {
    const result = renderShopBeforeV67(),
      grid = $("shopgrid");
    if (!grid) {
      prevResult118 = result;
      break prev118;
    }
    [...grid.querySelectorAll(".shopcard")].forEach(card => {
      const title = card.querySelector(".sn"),
        name = title ? title.textContent : "";
      if (card.classList.contains("celestialexchangev66") || name.includes("Refine Epic Shards"))
        card.remove();
    });
    addCurrencySlider(grid, "regular");
    if (window.forgeV66 && window.forgeV66.unlock()) addCurrencySlider(grid, "epic");
    prevResult118 = result;
    break prev118;
  }
  const result = prevResult118;
  const grid = $("shopgrid");
  if (!grid) return result;
  ensureGearBag();
  const card = document.createElement("div");
  card.className = "shopcard gearbagshopv82";
  card.innerHTML =
    '<div class="sn">🧳 Gear Bag</div><div class="sd">A separate ten slot reserve for equipment. Drops continue entering the Loot Bag. Move items between storage and your equipped slots by dragging them.</div><div class="sown">' +
    (S.gearBagUnlockedV82 ? "Owned · 10 slots" : "Permanent unlock") +
    '</div><button class="up"' +
    (S.gearBagUnlockedV82 || S.gold < GEAR_BAG_COST ? " disabled" : "") +
    ">" +
    (S.gearBagUnlockedV82 ? "✓ Owned" : 'Buy <span class="pc">15,000g</span>') +
    "</button>";
  card.querySelector("button").onclick = () => {
    if (S.gearBagUnlockedV82 || S.gold < GEAR_BAG_COST) return;
    S.gold -= GEAR_BAG_COST;
    S.gearBagUnlockedV82 = true;
    flash("#9edceb");
    beep(720, 0.12, "triangle");
    scheduleSave();
    renderShop();
    renderTown();
  };
  grid.appendChild(card);
  return result;
};

ensureGearBag();
setupGearBagPanel();
renderTown();
document.querySelector("h1 .polishbadgev70") &&
  (document.querySelector("h1 .polishbadgev70").textContent = "V7.11.0");
document.title = "THE FORGE v7.11.0";
window.__forgeV7Boot = "ready";
window.forgeV82 = {
  state: ensureGearBag,
  move: moveItem,
  render: renderGearBag,
  cost: GEAR_BAG_COST,
  capacity: GEAR_BAG_CAP
};

/* ================= script block 13 ================= */

/* V83 · Visible equipped Legacies and the capped Deep Mine return loop. */
window.__forgeV7Boot = "v83 starting";

/* ==== nextWave ==== */
/* ==== nextWave ==== */
/* ==== nextWave ==== */
/* ==== nextWave ==== */
/* ==== nextWave ==== */
/* ==== nextWave ==== */
const nextWaveBase = nextWave;
nextWave = function () {
  prev148: {
    nextWaveBase();
    if (!run || run.hunt || run.wave !== 2 || run.wave > run.total || run.foes.some(f => f.elite))
      break prev148;
    const old = run.foes[0],
      key = run.ai % 2 ? "plaguefrog" : "shaman";
    if (!old || old.key === key) break prev148;
    const plain = buildFoe(old.key, old.lvl, 1, false),
      hpMul = old.max / Math.max(1, plain.max),
      atkMul = old.atk / Math.max(1, plain.atk),
      f = buildFoe(key, old.lvl, hpMul, false);
    f.atk = Math.max(1, Math.round(f.atk * atkMul));
    f._x = old._x;
    run.foes[0] = f;
    buildFoeBars();
    drawBars();
  }
  if (!run || run.hunt || run.ai !== 12) return;
  const boss = run.wave > run.total;
  if (boss) {
    const f = run.foes[0];
    if (!f) return;
    f.max = Math.round(f.max * 3.2);
    f.hp = f.max;
    f.atk = Math.round(f.atk * 1.25);
    f.def = Math.round(f.def * 1.12);
    f.draw.sz = 2.05;
    buildFoeBars();
    $("wave").innerHTML = '<b style="color:#e2d2ff">FINAL BOSS</b> · The End?';
    $("rmsg").className = "msg big";
    $("rmsg").textContent = "The Last Question demands a perfected forge set.";
    drawBars();
    return;
  }
  if (run.wave % 5 === 0) {
    const cycle = ["shaman", "plaguefrog", "thornback"],
      key = cycle[(run.wave / 5 - 1) % cycle.length],
      titles = { shaman: "Void Oracle", plaguefrog: "End Plague", thornback: "Final Bastion" },
      lvl = run.a.lvl + run.wave - 1,
      f = buildFoe(key, lvl, 1.45, false);
    makeElite(f);
    f.name = "◆ " + titles[key] + " · Gate " + run.wave;
    f.max = Math.round(f.max * 1.9);
    f.hp = f.max;
    f.atk = Math.round(f.atk * 1.18);
    f.def = Math.round(f.def * 1.12);
    f.specialCd = 500;
    f.specialCdMax = 500;
    f._x = foeBaseX(0, 1);
    run.foes = [f];
    buildFoeBars();
    $("wave").innerHTML = '<b style="color:#ffcf5c">ELITE GATE ' + run.wave + " / 25</b> · The End?";
    $("rmsg").className = "msg big";
    $("rmsg").textContent = "A guardian of the End blocks the path.";
    drawBars();
    return;
  }
  run.foes.forEach(f => {
    f.max = Math.round(f.max * 1.45);
    f.hp = f.max;
    f.atk = Math.round(f.atk * 1.14);
    f.def = Math.round(f.def * 1.08);
  });
  buildFoeBars();
  drawBars();
};
const nextWaveBeforeV28 = nextWave;
nextWave = function () {
  let prevResult149;
  prev149: {
    const result = nextWaveBeforeV28();
    if (run && !run.hunt && run.ai >= 0 && run.ai < 12 && run.wave > run.total && run.foes && run.foes[0]) {
      balanceBoss(run.foes[0], run.ai);
      buildFoeBars();
      drawBars();
    }
    prevResult149 = result;
    break prev149;
  }
  const result = prevResult149;
  if (!run || run.hunt || run.wave > run.total || !(S.roomsSeen > 0) || S.roomsSeen % 110 !== 0)
    return result;
  S.flags = S.flags || {};
  if (S.flags.lastSuperEliteRoomV30 === S.roomsSeen) return result;
  const target = run.foes.find(f => f.elite) || run.foes[0];
  if (!target) return result;
  promoteSuperElite(target);
  S.flags.lastSuperEliteRoomV30 = S.roomsSeen;
  buildFoeBars();
  drawBars();
  $("rmsg").className = "msg big";
  $("rmsg").innerHTML = "✦ A SUPER ELITE HAS APPEARED · ROOM " + fmt(S.roomsSeen);
  flash("#ff8cff");
  beep(180, 0.22, "sawtooth", 0.12);
  scheduleSave();
  return result;
};
const nextWaveBeforeV36 = nextWave;
nextWave = function () {
  prev150: {
    if (guardianCheckpoint()) {
      run.guardianCheckpoints = run.guardianCheckpoints || [];
      $("guardiancheckpointtext").innerHTML =
        "Room <b>" +
        run.wave +
        " of " +
        run.total +
        "</b> cleared. You may swap equipment sets before continuing.";
      $("guardiancheckpoint").classList.add("on");
      break prev150;
    }
    nextWaveBeforeV36();
    if (!run || run.hunt || run.ai < CELESTIAL_AREA_START) break prev150;
    run.guardianCheckpoints = run.guardianCheckpoints || [];
    const boss = run.wave > run.total,
      tier = run.ai - CELESTIAL_AREA_START;
    if (boss) {
      const f = run.foes[0];
      if (!f) break prev150;
      const hpMul = [2.2, 3.0, 4.0, 7.5][tier],
        atkMul = [1.06, 1.12, 1.18, 1.3][tier];
      f.max = Math.round(f.max * hpMul);
      f.hp = f.max;
      f.atk = Math.round(f.atk * atkMul);
      f.def = Math.round(f.def * (1.05 + tier * 0.04));
      f.draw.sz = 1.9 + tier * 0.1;
      buildFoeBars();
      $("wave").innerHTML =
        '<b style="color:var(--mythic)">' +
        (tier === 3 ? "FINAL JUDGEMENT" : "CELESTIAL GUARDIAN") +
        "</b> · " +
        run.a.boss;
      drawBars();
      break prev150;
    }
    if (run.wave % 5 === 0) {
      const keys = ["celoracle", "celpurifier", "celwarden"],
        key = keys[(run.wave / 5 + tier) % keys.length],
        f = buildFoe(key, run.a.lvl + run.wave - 1, 1.35, false);
      makeElite(f);
      f.name = "✦ Ascendant " + ENEMIES[key].n + " · Gate " + run.wave;
      f.max = Math.round(f.max * (1.55 + tier * 0.12));
      f.hp = f.max;
      f.atk = Math.round(f.atk * (1.06 + tier * 0.04));
      f._x = foeBaseX(0, 1);
      run.foes = [f];
    } else
      run.foes = run.foes.map((old, i) => {
        if (run.a.pool.includes(old.key)) return old;
        const key = run.a.pool[Math.floor(Math.random() * run.a.pool.length)],
          f = buildFoe(key, old.lvl, 1, false);
        f._x = old._x;
        return f;
      });
    buildFoeBars();
    $("wave").innerHTML =
      (run.wave % 5 === 0
        ? '<b style="color:var(--mythic)">ASCENDANT GATE ' + run.wave + " / 25</b>"
        : "Room <b>" + run.wave + "</b> / 25") +
      " · " +
      run.a.n;
    drawBars();
  }
  if (!run || run.hunt || run.ai < CELESTIAL_AREA_START) return;
  const tier = Math.max(0, Math.min(3, run.ai - CELESTIAL_AREA_START));
  (run.foes || []).forEach(f => tuneCelestialDamage(f, tier));
  drawBars();
};
const nextWaveBeforeV44 = nextWave;
nextWave = function () {
  prev151: {
    nextWaveBeforeV44();
    if (!run || run.hunt || run.ai !== 16 || run.wave <= run.total) break prev151;
    const boss = run.foes && run.foes.find(f => f.boss && f.hp > 0);
    if (!boss || boss.omegaResonanceAppliedV44) break prev151;
    const p = omegaResonanceProfile();
    boss.omegaResonanceAppliedV44 = true;
    boss.omegaResonanceV44 = p.score;
    boss.omegaIncomingMultV44 = p.incomingMult;
    boss.max = Math.round(boss.max * p.healthMult);
    boss.hp = boss.max;
    boss.atk = Math.round(boss.atk * p.incomingMult);
    buildFoeBars();
    $("wave").innerHTML =
      '<b style="color:var(--mythic)">FINAL JUDGEMENT</b> · OMEGA · <span style="color:#dfffff">loadout resonance ' +
      Math.round(p.score * 100) +
      "%</span>";
    $("rmsg").className = "msg";
    $("rmsg").innerHTML =
      "Ω OMEGA measures all six items · health ×" +
      p.healthMult.toFixed(1) +
      " · damage ×" +
      p.incomingMult.toFixed(1);
    drawBars();
  }
  if (!run || run.hunt || run.ai !== 16 || run.wave <= run.total) return;
  const boss = run.foes && run.foes.find(f => f.boss && f.hp > 0);
  if (!boss || !boss.omegaResonanceAppliedV44) return;
  const p = omegaResonanceProfile();
  boss.max = Math.round(boss.max / Math.max(0.0001, p.healthMult));
  boss.hp = boss.max;
  boss.atk = Math.round(boss.atk / Math.max(0.0001, p.incomingMult));
  delete boss.omegaIncomingMultV44;
  delete boss.omegaResonanceV44;
  boss.omegaResonanceRemovedV45 = true;
  buildFoeBars();
  $("wave").innerHTML = '<b style="color:var(--mythic)">FINAL JUDGEMENT</b> · OMEGA';
  $("rmsg").className = "msg";
  $("rmsg").textContent = "OMEGA tests the strength of your actual equipment and build.";
  drawBars();
};
/* abyss purple elites + boss tuning, injected after the base nextWave */
const nextWaveAbyssBase = nextWave;
nextWave = function () {
  let prevResult152;
  prev152: {
    nextWaveAbyssBase();
    if (!run || run.over || !run.a || !run.a.abyss || run.hunt) {
      prevResult152 = undefined;
      break prev152;
    }
    const boss = run.wave > run.total;
    if (boss) {
      const b = run.foes.find(f => f.boss);
      if (b && !b._abyssTunedV50) {
        b._abyssTunedV50 = true;
        b._abyssBoss = true;
        b.atk = Math.round(b.atk * 1.25);
        b.max = abyssBossHP();
        b.hp = b.max;
        buildFoeBars();
        drawBars();
      }
      prevResult152 = undefined;
      break prev152;
    }
    if (run.foes && run.foes.length && !run.foes.some(f => f.abyssElite || f.elite) && Math.random() < 0.25) {
      const f = run.foes[Math.floor(Math.random() * run.foes.length)];
      makeElite(f);
      f.abyssElite = true;
      f.enemyCritBonusV40 = 0.32;
      f.name = "✦ Abyss " + String(f.name || "").replace(/^◆ Elite /, "");
      f.atk = Math.round(f.atk * 1.12);
      f.max = Math.round(f.max * 1.18);
      f.hp = f.max;
      buildFoeBars();
      drawBars();
    }
  }
  const result = prevResult152;
  if (run && run.wave === 1) resetStageDamage();
  armGammaThorns();
  return result;
};
const nextWaveBeforeV75 = nextWave;
nextWave = function () {
  let prevResult153;
  prev153: {
    const result = nextWaveBeforeV75();
    applyContractChallenge();
    prevResult153 = result;
    break prev153;
  }
  const result = prevResult153;
  teachRetreatV83();
  return result;
};

document.addEventListener(
  "keydown",
  e => {
    if (e.key !== "Escape") return;
    const menu = $("minev83");
    if (menu && menu.classList.contains("on")) {
      menu.classList.remove("on");
      e.preventDefault();
      e.stopPropagation();
    }
  },
  true
);
cleanOldRetreatNotice();
ensureMine();
setupMineUI();
repairLegacyHover();
renderMineV83();
setInterval(() => {
  if ($("minev83") && $("minev83").classList.contains("on")) renderMineV83();
  else {
    settleMineV83();
    const b = $("minebtnv83");
    if (b)
      b.classList.toggle(
        "ready",
        [S.mineV83.bankGold, S.mineV83.bankShards, S.mineV83.bankEpic, S.mineV83.bankCelestial].some(
          v => Math.floor(v) > 0
        )
      );
  }
}, 1000);
document.querySelector("h1 .polishbadgev70") &&
  (document.querySelector("h1 .polishbadgev70").textContent = "V7.13.1");
document.title = "THE FORGE v7.13.1";
window.__forgeV7Boot = "ready";
window.forgeV83 = {
  mine: ensureMine,
  settleMine: settleMineV83,
  profile: mineProfile,
  rates: mineRates,
  caps: mineCaps,
  upgradeCost: mineUpgradeCost,
  questPoints: mineQuestPoints,
  claim: claimMine,
  upgrade: upgradeMine,
  renderMine: renderMineV83,
  animateReturn: animateMineReturn,
  repairLegacy: repairLegacyHover,
  teachRetreat: teachRetreatV83,
  capMs: MINE_CAP_MS,
  maxLevel: MINE_MAX_LEVEL
};
