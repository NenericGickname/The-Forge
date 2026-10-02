/* Items: generation, stats, affixes, rarities, mythics, loot bag and salvage. */

function addBagChip(rar) {
  const t = $("traychips");
  if (!t) return;
  const c = document.createElement("div");
  c.className = "lchip pop";
  c.style.setProperty("--bc", cvar(RAR[rar].col));
  t.appendChild(c);
  updateTrayCount();
}

function rollRarity(level) {
  let w = [100, 16, 3.6, 0.6, 0.09].map((x, i) => x * (1 + level * 0.013 * i));
  const t = w.reduce((a, b) => a + b, 0);
  let x = Math.random() * t;
  for (let i = 0; i < w.length; i++) {
    if ((x -= w[i]) <= 0) return i;
  }
  return 0;
}

function rarHex(r) {
  return ["#aab3c6", "#7fd58a", "#5aa8ff", "#c46bff", "#ff9a3c"][r || 0];
}

function growthCap(g) {
  return Math.max(1, Math.floor((g.ilvl || 1) * (2 + 0.3 * (g.celestial || 0))));
}

function growthValues(g) {
  if (!g || !g.growth) return { atk: 0, hp: 0, cap: 0, kills: 0 };
  const kills = g.growth.kills || 0,
    cap = growthCap(g);
  return { kills, cap, atk: Math.min(cap, Math.floor(kills / 10)), hp: Math.min(cap, Math.floor(kills / 5)) };
}

function growthLine(g) {
  if (!g.growth) return "";
  const gr = growthValues(g);
  return (
    '<span style="color:#ff8f7b">Blood Growth: +' +
    gr.atk +
    " Atk / +" +
    gr.hp +
    " HP · " +
    gr.kills +
    " kills · cap " +
    gr.cap +
    " each</span>"
  );
}

function advanceGrowth() {
  if (run) run._healingContextV41 = "Growth";
  try {
    const before = run && !run.over ? heroStats().hp : null;
    S.totalKills = (S.totalKills || 0) + 1;
    for (const k in S.gear) {
      const g = S.gear[k];
      if (g && g.growth) g.growth.kills = (g.growth.kills || 0) + 1;
    }
    if (before != null && run && run.hero) {
      const after = heroStats().hp,
        delta = Math.max(0, after - before);
      if (delta > 0) {
        run.hero.max += delta;
        run.hero.hp = Math.min(run.hero.max, run.hero.hp + delta);
      }
    }

    return;
  } finally {
    if (run) run._healingContextV41 = null;
  }
}

// Loadout Set II unlock/switch.
function switchGearSet() {
  if (!S.gearSetUnlocked) {
    showTip(
      "GEAR SET II",
      "Buy <b>Gear Set II</b> in the Smith's Shop for 100,000 gold. It lets you keep a second complete loadout, for example a Gold farming set."
    );
    return;
  }
  const tmp = S.gear;
  S.gear = S.gear2 || {};
  S.gear2 = tmp;
  S.activeSet = S.activeSet === 2 ? 1 : 2;
  S.sel = null;
  beep(620, 0.08, "triangle");
  renderTown();
}

function ensureItemVariant(g) {
  if (!g) return 0;
  if (g.variant == null) g.variant = Math.floor(Math.random() * 5);
  return Math.abs(g.variant) % 5;
}

function salvageValueV10(g) {
  return Math.max(5, Math.round(5 * Math.pow(Math.max(1, g.ilvl || 1), 1.3) * skillBonuses().salvageMult));
}

function statFormat(g, stat) {
  if (!g || !(stat in g.stats)) return "—";
  const v = gStat(g, stat);
  if (CURVED.has(stat) || stat === "healCdr" || stat === "lifesteal") return Math.round(v);
  return PERCENT.has(stat) ? v.toFixed(1) + "%" : Math.round(v);
}

function salvageValueV12(g) {
  const level = Math.max(1, (g && g.ilvl) || 1),
    base = Math.max(2, Math.round(0.35 * Math.pow(level, 1.5)));
  return Math.round(base * skillBonuses().salvageMult);
}

function renderAutoSalvage() {
  const btn = $("autosalvage");
  if (!btn) return;
  const level = Number.isInteger(S.autoSalvageRar) ? Math.max(-1, Math.min(4, S.autoSalvageRar)) : -1;
  if (level < 0) {
    btn.textContent = "Auto salvage Off";
    btn.style.setProperty("--ac", "#8b8175");
    btn.title = "Keep every rarity";
  } else {
    const option = AUTO_SALVAGE[level];
    btn.textContent = "Auto salvage ≤ " + option.name;
    btn.style.setProperty("--ac", option.col);
    btn.title =
      "Automatically salvage " +
      AUTO_SALVAGE.slice(0, level + 1)
        .map(x => x.name)
        .join(", ") +
      " drops";
  }
}

function weaponTypeName(g) {
  return g && g.wtype === "bow" ? "Bow" : g && g.wtype === "dagger" ? "Dagger" : "Sword";
}

function weaponEffect(g) {
  if (!g || !g.stats) return null;
  return ["doom", "bleed", "poison", "burn", "frost", "lightning"].find(st => (g.stats[st] || 0) > 0) || null;
}

function weaponPool(g) {
  const effects = new Set(legalWeaponEffects(g.wtype)),
    hasEffect = Object.keys(g.stats).some(st => EXCL.has(st));
  return weaponSlot.affixes.filter(
    st => st !== weaponSlot.main && !(st in g.stats) && (!EXCL.has(st) || (!hasEffect && effects.has(st)))
  );
}

function weightedAffix(g, pool) {
  if (!pool.length) return null;
  const weight = st =>
      EXCL.has(st)
        ? weaponEffectWeight(g.wtype, st)
        : st === "critChance" || st === "lifesteal"
          ? 0.35
          : st === "enrage" || st === "elementAmp"
            ? 0.45
            : 1,
    total = pool.reduce((s, st) => s + weight(st), 0);
  let roll = Math.random() * total;
  for (const st of pool) {
    roll -= weight(st);
    if (roll <= 0) return st;
  }
  return pool[pool.length - 1];
}

function spawnStatusParticles(f, type, count) {
  if (!f || !run) return;
  const colors = {
      frost: ["#dff7ff", "#70cfff"],
      doom: ["#301044", "#8c43c9"],
      burn: ["#ff5a1e", "#ffb03a"],
      poison: ["#65d85f", "#b8ff78"],
      bleed: ["#6e0718", "#d02038"]
    },
    cs = colors[type] || ["#fff"],
    x = f._x == null ? 405 : f._x;
  for (let i = 0; i < (count || 7); i++)
    particles.push({
      x: x + (Math.random() - 0.5) * 24,
      y: GY - 18 - Math.random() * 28,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -0.5 - Math.random() * 1.4,
      life: 1,
      sz: 1.8 + Math.random() * 1.6,
      col: cs[i % cs.length]
    });
}

function randomWeaponType() {
  return ["sword", "bow", "dagger"][[0, 0, 0, 0, 1, 1, 1, 2, 2, 2][Math.floor(Math.random() * 10)]];
}

function makeDagger(ilvl, rar, forcedEffect) {
  const g = { slot: "weapon", ilvl, rar, plus: 0, stats: {}, wtype: "dagger" };
  g.stats.atk = Math.round(statRoll("atk", ilvl, rar) * 0.68);
  g.stats.atkSpeed = Math.round((15 + rar * 3.2) * (0.9 + Math.random() * 0.2));
  let remaining = rar;
  if (forcedEffect && legalWeaponEffects("dagger").includes(forcedEffect)) {
    g.stats[forcedEffect] = statRoll(forcedEffect, ilvl, rar);
    remaining = Math.max(0, remaining - 1);
  }
  while (remaining-- > 0) {
    const pool = weaponPool(g),
      st = weightedAffix(g, pool);
    if (!st) break;
    g.stats[st] = statRoll(st, ilvl, rar);
  }
  g.name = RAR[rar].k[0].toUpperCase() + RAR[rar].k.slice(1) + " Dagger";
  ensureItemVariant(g);
  return g;
}

function mythicInfo(g) {
  return (g && MYTHIC_INFO[g.mythicAffix]) || null;
}

function ensureMythic(g) {
  if (!g || g.rar !== 5) return g;
  const pool = MYTHIC_AFFIXES[g.slot] || [];
  if (!pool.includes(g.mythicAffix)) g.mythicAffix = pool[Math.floor(Math.random() * pool.length)];
  g.name =
    (g.unique === "bloodforged" ? "Bloodforged Mythic " : "Mythic ") +
    (g.slot === "weapon" ? weaponTypeName(g) : SLOTS.find(s => s.key === g.slot).label);
  return g;
}

function baseAffixAllowance(g) {
  return Math.max(0, Math.min(5, (g && g.rar) || 0));
}

function mandatoryStats(g) {
  let base;
  prev22: {
    if (g && g.slot === "weapon") {
      base = g.wtype === "bow" ? ["atk", "atkSpeed", "critChance"] : ["atk", "atkSpeed"];
      break prev22;
    }
    const sd = SLOTS.find(s => s.key === g.slot);
    base = sd ? [sd.main] : [];
    break prev22;
  }
  /* ---- mandatoryStatsV36: later layers (moved here) ---- */
  if (!g) return base;
  if (g.slot === "armor" && !base.includes("hp")) base.push("hp");
  if (g.slot === "boots" && !base.includes("hp")) base.push("hp");
  if ((g.slot === "gloves" || g.slot === "amulet") && !base.includes("attackPower")) base.push("attackPower");
  return base;
}

function salvageRewards(g) {
  return {
    shards: holyMissionV36(salvageValueV12(g)),
    epic: holyMissionV36(g.rar >= 3 ? Math.min(2, g.rar - 2) : 0),
    celestial: holyMissionV36(celestialSalvageValue(g))
  };
}

function mythicBuffIcon(g) {
  if (!g || g.rar !== 5 || !g.mythicAffix) return "";
  const affix = g.mythicAffix,
    used = (affix === "hardHat" && run && run.hardHatUsed) || (affix === "reborn" && run && run.rebornUsed),
    count =
      affix === "temper" && run
        ? run.temperStacks || 0
        : affix === "threeFingerJoe" && run
          ? run.joeStacks || 0
          : 0;
  const html = fxIcon(MYTHIC_ICONS[affix] || "✺", used ? 1 : 0, "buff", count);
  return html.replace(
    '<span class="fx buff">',
    '<span class="fx buff mythicfx' +
      (used ? " exhausted" : "") +
      '" title="' +
      mythicBuffTitle(g).replace(/&/g, "&amp;").replace(/"/g, "&quot;") +
      '" data-mythic-affix="' +
      affix +
      '">'
  );
}

function weaponAttackFactor(type) {
  return type === "sword" ? 1.28 : type === "bow" ? 0.92 : 0.68;
}

function mythicDebuffAllowed() {
  return !(S.gear.boots && S.gear.boots.mythicAffix === "nimble" && Math.random() < 0.15);
}

function mythicBuffTitle(g) {
  if (g && g.mythicAffix === "hardHat")
    return (
      "Hard Hat · " +
      (hardHatReady()
        ? "First enemy attack block ready"
        : "Recharges in room " + (Number((run && run.hardHatBlockedRoomV39) || hardHatRoom()) + 2))
    );
  const info = mythicInfo(g);
  if (!info) return "";
  let detail = info[1];
  if (!run) return info[0] + " · " + detail;
  if (g.mythicAffix === "hardHat")
    detail = run.hardHatUsed ? "First hit block has been used in this combat" : detail + " · ready";
  if (g.mythicAffix === "reborn")
    detail = run.rebornUsed ? "Revive has been used in this area" : detail + " · ready";
  if (g.mythicAffix === "temper")
    detail = "Current bonus " + Math.min(30, run.temperStacks || 0) + "% attack · resets after this area";
  if (g.mythicAffix === "threeFingerJoe")
    detail =
      "Current Ultra Crit bonus " + ((run.joeStacks || 0) * 0.1).toFixed(1) + "% · resets on Ultra Crit";
  return info[0] + " · " + detail;

  return;
}

function statusFloat(side, val, color, x) {
  const b = $("battle"),
    d = document.createElement("div"),
    targetX = side === "foe" ? (x == null ? 405 : x) : 150,
    key = side + Math.round(targetX / 35),
    lane = STATUS_LANES[(statusFloat[key] = (statusFloat[key] || 0) + 1) % STATUS_LANES.length],
    canvas = $("cv"),
    scaleX = canvas.clientWidth / CANVAS_LOGICAL_W,
    scaleY = canvas.clientHeight / CANVAS_LOGICAL_H;
  d.className = "dmg statusfloatv41";
  d.style.color = color || "#fff";
  d.style.left = canvas.offsetLeft + (targetX + lane[0]) * scaleX + "px";
  d.style.top = canvas.offsetTop + (GY - 70 + lane[1]) * scaleY + "px";
  d.textContent = val;
  b.appendChild(d);
  setTimeout(() => d.remove(), 1250);
}

function autoSalvageApplies(g) {
  const auto = Number.isInteger(S.autoSalvageRar) ? S.autoSalvageRar : -1;
  return auto >= 0 && g && g.rar <= auto;
}

function stagedLootState(row) {
  if (row.protected)
    return '<span class="stagefatev42 protected">🔒 LOCKED EXCEPTION · enters inventory</span>';
  if (autoSalvageApplies(row.g)) return '<span class="stagefatev42 salvage">♻ Will be auto salvaged</span>';
  return '<span class="stagefatev42 keep">🎒 Will enter inventory</span>';
}

function stagedLootCard(row) {
  const g = row.g,
    col = cvar(RAR[g.rar].col),
    card = document.createElement("div");
  card.className = "lresult pop stagedlootv42";
  card.style.borderColor = col;
  card.style.boxShadow = "0 0 14px " + col + "44";
  card.innerHTML =
    '<span class="stagecheckv42">✓</span><span class="emb" style="border-color:' +
    col +
    '">' +
    itemIcon(g) +
    '</span><span class="stageitemv42">' +
    itemMarks(g) +
    '<b style="color:' +
    col +
    '">' +
    g.name +
    "</b><small>i" +
    g.ilvl +
    " · " +
    gearDesc(g) +
    "</small>" +
    stagedLootState(row) +
    '</span><span class="stagelockv42">🔓</span>';
  const refresh = () => {
    card.classList.toggle("selected", !!row.selected);
    card.classList.toggle("protected", !!row.protected);
    card.querySelector(".stagelockv42").textContent = row.protected ? "🔒" : "🔓";
    const old = card.querySelector(".stagefatev42");
    if (old) old.outerHTML = stagedLootState(row);
  };
  card.onclick = () => {
    const staged = run && run.stagedLootV42;
    if (!staged) return;
    if (!row.selected) {
      staged.forEach(x => (x.selected = false));
      row.selected = true;
      $("lootprotecthintv42").innerHTML = "Selected <b>" + g.name + "</b>. Click it again to lock it.";
    } else {
      row.protected = !row.protected;
      $("lootprotecthintv42").innerHTML = row.protected
        ? "<b>🔒 Protected.</b> This item will ignore auto salvage and enter the inventory locked."
        : "Protection removed. The normal auto salvage rule applies again.";
      beep(row.protected ? 760 : 460, 0.06, "triangle", 0.05);
    }
    staged.forEach(x => {
      if (x.card) x.card.classList.toggle("selected", !!x.selected);
    });
    refresh();
  };
  row.card = card;
  refresh();
  return card;
}

function commitStagedLoot() {
  if (!run || !run.stagedLootV42 || run.stagedLootCommittedV42) return [];
  run.stagedLootCommittedV42 = true;
  const results = [],
    staged = run.stagedLootV42;
  let protectedLeft = staged.filter(x => x.protected).length;
  staged.forEach(row => {
    const g = row.g;
    if (row.protected) protectedLeft--;
    const oldAuto = S.autoSalvageRar,
      oldCap = S.bagCap;
    if (row.protected) {
      g.locked = true;
      S.autoSalvageRar = -1;
      if (S.bag.length >= S.bagCap) S.bagCap = S.bag.length + 1;
    } else if (!autoSalvageApplies(g) && S.bag.length >= Math.max(0, S.bagCap - protectedLeft))
      S.bagCap = S.bag.length;
    const result = addToBag(g);
    S.autoSalvageRar = oldAuto;
    S.bagCap = oldCap;
    results.push({ g, result, protected: row.protected });
  });
  updateForgeBalances();
  scheduleSave();
  return results;
}

function omegaItemReadiness(g) {
  if (!g || g.broken) return 0;
  const rarity = [0.04, 0.08, 0.14, 0.22, 0.38, 1][Math.max(0, Math.min(5, g.rar || 0))],
    level = Math.max(0, Math.min(1, ((g.ilvl || 1) - 80) / 100)),
    plus = Math.max(0, Math.min(1, (g.plus || 0) / 20)),
    celestial = Math.max(0, Math.min(1, (g.celestial || 0) / 10)),
    stats = Object.keys(g.stats || {}),
    roll = stats.length
      ? stats.reduce(
          (sum, st) => sum + Math.max(0, Math.min(1, (g.stats[st] || 0) / Math.max(1, maxBaseRoll(g, st)))),
          0
        ) / stats.length
      : 0;
  return Math.max(
    0,
    Math.min(1, rarity * 0.28 + level * 0.24 + plus * 0.18 + celestial * 0.18 + roll * 0.12)
  );
}

function applyItemDistribution(g, generated, force) {
  if (!g || (g.distributionV45 && !force)) return g;
  g.stats = g.stats || {};
  if (g.slot === "weapon" && g.stats.atk != null) g.stats.atk *= 0.65;
  if (g.slot === "helm" && g.stats.hp != null) g.stats.hp *= 0.45;
  if (g.slot === "armor") {
    const raw =
      g.stats.hp != null ? g.stats.hp : generated ? statRoll("hp", g.ilvl, g.rar) : averageRaw(g, "hp");
    g.stats.hp = raw * 1.3;
  }
  if (g.slot === "boots") {
    const raw =
      g.stats.hp != null ? g.stats.hp : generated ? statRoll("hp", g.ilvl, g.rar) : averageRaw(g, "hp");
    g.stats.hp = raw * 0.64;
  }
  if ((g.slot === "gloves" || g.slot === "amulet") && g.stats.attackPower == null)
    g.stats.attackPower = generated ? statRoll("attackPower", g.ilvl, g.rar) : 1;
  g.distributionV45 = true;
  return g;
}

/* NORMAL (non-abyss) drop level cap — the base loot roll spans a.lvl .. a.lvl+a.waves, and
   the celestial areas have 25 waves, so normal Omega (lvl 158) was dropping item level up to
   ~183, spilling into Abyss territory. The Abyss (item level ~160-185, set from the foe's own
   level) should be the exclusive top tier, so keep campaign drops close to the area's level. */
function rollDropLevel(areaIndex) {
  let prevResult187;
  prev187: {
    const a = AREAS[Math.max(0, Math.min(AREAS.length - 1, areaIndex || 0))],
      min = a.lvl,
      max = a.lvl + a.waves,
      count = max - min + 1,
      total = (count * (count + 1)) / 2;
    let roll = Math.random() * total;
    for (let offset = 0; offset < count; offset++) {
      roll -= count - offset;
      if (roll <= 0) {
        prevResult187 = min + offset;
        break prev187;
      }
    }
    prevResult187 = max;
    break prev187;
  }
  const lvl = prevResult187;
  const a = AREAS[Math.max(0, Math.min(AREAS.length - 1, areaIndex || 0))];
  const cap = a.lvl + Math.min(a.waves || 0, 5); // at most +5 over the area's base level
  return Math.min(lvl, cap);
}

function weaponTypeNameV50(g) {
  if (g && g.wtype === "greataxe") return "Great Axe";
  return weaponTypeNameBase(g);
}

function weaponTypeBadge(g) {
  if (g && g.wtype === "greataxe") return "🪓 GREAT AXE";
  return g && g.wtype === "bow" ? "🏹 BOW" : g && g.wtype === "dagger" ? "🗡️ DAGGER" : "⚔️ SWORD";

  return;
}

function legalWeaponEffects(type) {
  if (type === "greataxe") return [];
  const common = ["lightning", "burn", "frost", "doom"];
  if (type === "sword") return common.concat("bleed");
  if (type === "bow") return common.concat("poison");
  return common.concat("poison", "bleed");

  return;
}

/* Great Axe cadence slowdown is handled in the tick wrapper (post-floor +1 tick). */
/* Great Axe gets its own drawn icon (double-bit axe), respecting variant colour + mythic teal. */
// Earlier version of gearArtV9(), extended by the functions that follow.
function gearArtBase(g) {
  const v = ensureItemVariant(g),
    c = ITEM_ART_COLORS[v],
    dark = ["#56606d", "#76562f", "#315f78", "#67427f", "#843f34"][v],
    kind = g.slot === "weapon" ? (g.wtype === "bow" ? "bow" : "sword") : g.slot;
  let art = "";
  if (kind === "sword")
    art =
      '<path d="M27 4l5 5-14 25-6 2 2-6z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2"/><path d="M9 33l10 10M6 39l9-9M5 42l3 3" stroke="' +
      dark +
      '" stroke-width="4" stroke-linecap="round"/>';
  else if (kind === "bow")
    art =
      '<path d="M13 5Q39 24 13 43" fill="none" stroke="' +
      c +
      '" stroke-width="5"/><path d="M13 5L20 24 13 43M5 24h35m-7-5 7 5-7 5" fill="none" stroke="' +
      dark +
      '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  else if (kind === "gloves")
    art =
      '<path d="M12 22V8c0-4 5-4 5 0v10V5c0-4 5-4 5 0v13V6c0-4 5-4 5 0v13V9c0-4 5-4 5 0v17l5-6c3-4 7 0 4 4L31 41H16c-5-5-8-10-9-16-1-4 4-5 5-3z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2"/><path d="M15 35h17" stroke="' +
      dark +
      '" stroke-width="3"/>';
  else if (kind === "boots")
    art =
      '<path d="M15 5h17l-2 23 11 7c4 3 2 8-3 8H8c-4 0-5-5-2-7l10-8z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2"/><path d="M15 13h16M14 21h17M7 38h34" stroke="' +
      dark +
      '" stroke-width="2"/>';
  else if (kind === "amulet")
    art =
      '<path d="M9 8Q24 33 39 8" fill="none" stroke="' +
      c +
      '" stroke-width="4"/><path d="M24 24l9 10-9 11-9-11z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2"/><circle cx="24" cy="34" r="3" fill="' +
      dark +
      '"/>';
  else if (kind === "armor")
    art =
      '<path d="M13 8l8-4h6l8 4 8 9-7 7v20H12V24l-7-7z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2"/><path d="M18 8l6 7 6-7M13 25h23M24 15v29" fill="none" stroke="' +
      dark +
      '" stroke-width="2"/>';
  else
    art =
      '<path d="M8 26Q9 7 24 5q15 2 16 21v14H8z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2"/><path d="M7 27h34M16 27v13M24 7v20" stroke="' +
      dark +
      '" stroke-width="3"/><path d="M16 31h24" stroke="' +
      c +
      '" stroke-width="3"/>';
  return (
    '<svg class="itempic itempic-' +
    kind +
    " v" +
    v +
    '" viewBox="0 0 48 48" aria-hidden="true">' +
    art +
    "</svg>"
  );
}

// Earlier version of gearArtV9(), extended by the functions that follow.
function gearArt(g) {
  if (g && g.slot === "weapon" && g.wtype === "greataxe") {
    const v = typeof ensureItemVariant === "function" ? ensureItemVariant(g) : 0;
    const c = ITEM_ART_COLORS[v] || "#d7dde7",
      dark = ["#56606d", "#76562f", "#315f78", "#67427f", "#843f34"][v] || "#56606d";
    const art =
      '<path d="M18 6v38" stroke="' +
      dark +
      '" stroke-width="4" stroke-linecap="round"/>' +
      '<path d="M18 10C33 9 43 15 43 26C43 29 40 30 37 29C30 24 24 24 18 27Z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M18 13L11 14L11 22L18 23Z" fill="' +
      c +
      '" stroke="' +
      dark +
      '" stroke-width="2" stroke-linejoin="round"/>';
    let svg =
      '<svg class="itempic itempic-greataxe v' +
      v +
      '" viewBox="0 0 48 48" aria-hidden="true">' +
      art +
      "</svg>";
    if (g.rar === 5)
      svg = svg
        .replace(/fill="#[0-9a-fA-F]{6}"/, 'fill="#137b78"')
        .replace("<svg ", '<svg style="filter:drop-shadow(0 0 5px #16b8ad)" ');
    return svg;
  }
  {
    let art;
    prev20: {
      if (!g || g.slot !== "weapon" || g.wtype !== "dagger") {
        art = gearArtBase(g);
        break prev20;
      }
      const v = ensureItemVariant(g),
        c = ITEM_ART_COLORS[v],
        dark = ["#56606d", "#76562f", "#315f78", "#67427f", "#843f34"][v];
      art =
        '<svg class="itempic itempic-dagger v' +
        v +
        '" viewBox="0 0 48 48" aria-hidden="true"><path d="M37 5l6 6-22 25-8 2 2-8z" fill="' +
        c +
        '" stroke="' +
        dark +
        '" stroke-width="2"/><path d="M10 33l9 9M7 39l10-10M5 42l3 3" stroke="' +
        dark +
        '" stroke-width="4" stroke-linecap="round"/><path d="M21 29l14-16" stroke="#fff" stroke-width="2" opacity=".65"/></svg>';
      break prev20;
    }
    if (g && g.rar === 5)
      art = art
        .replace(/fill="#[0-9a-fA-F]{6}"/, 'fill="#137b78"')
        .replace("<svg ", '<svg style="filter:drop-shadow(0 0 5px #16b8ad)" ');
    return art;
  }
  return;
}

/* Great Axe cleave: injected after every hero hit (applyWeaponEffectsV18 runs per hit) */
function greataxeCleaveChance(w) {
  if (!w || w.wtype !== "greataxe") return 0;
  const base = Math.min(45, 15 + (w.plus || 0) + (w.celestial || 0)), // was 5 + ..., capped 35
    bonus =
      typeof window.forgeV70AxeCleaveBonus === "function" ? Number(window.forgeV70AxeCleaveBonus(w)) || 0 : 0;
  return Math.min(45, base + bonus);
}

function greataxeSweep(target, others) {
  try {
    flash("#ffd0a0");
  } catch (e) {}
  try {
    const xs = others.map(o => o._x).concat(target._x);
    const minx = Math.min.apply(null, xs),
      maxx = Math.max.apply(null, xs);
    for (let i = 0; i < 22; i++) {
      const px = minx + (maxx - minx) * (i / 21);
      particles.push({
        x: px,
        y: GY - 26 - Math.sin((i / 21) * Math.PI) * 18,
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.5 - Math.random(),
        life: 1,
        sz: 2.4,
        col: i % 2 ? "#ffe0b0" : "#ffb060"
      });
    }
  } catch (e) {}
  try {
    floatDmg("foe", "🪓 SWEEP", 0, "#ffd0a0", target._x);
  } catch (e) {}
}

function weaponAtkMulV50(wtype) {
  const T = (typeof window !== "undefined" && window.__spdTune) || {};
  const m = T.atkMul || { sword: 1.12, bow: 0.88, dagger: 0.78, greataxe: 1.3 };
  return m[wtype] != null ? m[wtype] : 1.0;
}

function makeWeapon(ilvl, rar, type, forcedEffect) {
  let prevResult65;
  prev65: {
    type = type || ["sword", "bow", "dagger"][[0, 0, 0, 0, 1, 1, 1, 2, 2, 2][Math.floor(Math.random() * 10)]];
    const g = { slot: "weapon", ilvl, rar, plus: 0, stats: {}, wtype: type };
    g.stats.atk = statRoll("atk", ilvl, rar);
    if (type === "sword") g.stats.atk = Math.round(g.stats.atk * 1.28);
    else if (type === "bow") {
      g.stats.atk = Math.round(g.stats.atk * 0.92);
      g.stats.critChance = Math.round((3.5 + rar * 1.55) * (0.9 + Math.random() * 0.2) * 10) / 10;
      g.stats.atkSpeed = Math.round((4 + rar * 1.5) * (0.9 + Math.random() * 0.2));
    } else {
      g.stats.atk = Math.round(g.stats.atk * 0.68);
      g.stats.atkSpeed = Math.round((15 + rar * 3.2) * (0.9 + Math.random() * 0.2));
      g.stats.critDmg = Math.round((9 + rar * 4.2) * (0.9 + Math.random() * 0.2) * 10) / 10;
      g.stats.critChance = Math.round((1.5 + rar * 0.8) * (0.9 + Math.random() * 0.2) * 10) / 10;
    }
    let remaining = rar;
    if (forcedEffect && legalWeaponEffects(type).includes(forcedEffect)) {
      g.stats[forcedEffect] = statRoll(forcedEffect, ilvl, rar);
      remaining = Math.max(0, remaining - 1);
    }
    while (remaining-- > 0) {
      const pool = weaponPool(g),
        st = weightedAffix(g, pool);
      if (!st) break;
      g.stats[st] = statRoll(st, ilvl, rar);
    }
    g.name = RAR[rar].k[0].toUpperCase() + RAR[rar].k.slice(1) + " " + weaponTypeName(g);
    ensureItemVariant(g);
    prevResult65 = g;
    break prev65;
  }
  const g = prevResult65;
  if (g && g.wtype === "bow") g.stats.critChance = bowBaseCrit(g.rar, 0.9 + Math.random() * 0.2);
  return g;
}

function ensureV51State() {
  S.boonPctV51 = Object.assign(emptyBoonPct(), S.boonPctV51 || {});
  S.areaClearsV51 = S.areaClearsV51 && typeof S.areaClearsV51 === "object" ? S.areaClearsV51 : {};
  S.abyssAreaClearsV51 =
    S.abyssAreaClearsV51 && typeof S.abyssAreaClearsV51 === "object" ? S.abyssAreaClearsV51 : {};
  S.areaMedalClaimsV51 =
    S.areaMedalClaimsV51 && typeof S.areaMedalClaimsV51 === "object" ? S.areaMedalClaimsV51 : {};
  S.abyssAreaMedalClaimsV51 =
    S.abyssAreaMedalClaimsV51 && typeof S.abyssAreaMedalClaimsV51 === "object"
      ? S.abyssAreaMedalClaimsV51
      : {};
  S.guards = S.guards || {};
  ["low", "med", "high", "vhigh", "ultra"].forEach(
    k => (S.guards[k] = Math.max(0, Number(S.guards[k]) || 0))
  );
  if (!(S.flags && S.flags.guardBandsV51)) {
    S.flags = S.flags || {};
    S.flags.guardBandsV51 = true;
  }
}

// Earlier version of applyWeaponEffectsV18(), extended by the functions that follow.
function applyWeaponEffectsBase(target, dd, tier, hs, weapon, em) {
  prev192: {
    if (!target || !weapon || !weapon.stats) break prev192;
    if (hs.lightning > 0) {
      const cel = (weapon.celestial || 0) >= 5,
        pc = cel ? Math.min(0.6, 0.3 + 0.03 * Math.min(10, weapon.celestial || 0)) : 0.3;
      if (Math.random() < pc) {
        const baseLb =
            hs.lightning * (cel ? 2.2 : 1.8) * (typeof statusMulFor === "function" ? statusMulFor(null, hs, "lightning") : elemAmpMul(hs)),
          lb = baseLb * em(target.res.lightning);
        target.hp -= lb;
        if (typeof statusLeech === "function") statusLeech(lb, hs);
        run.dmgLog.push([run.time, lb]);
        floatDmg("foe", Math.round(lb), 0, "#ffe14d", target._x);
        if (cel && run && run.foes) {
          run.foes.forEach(o => {
            if (o && o !== target && o.hp > 0) {
              const ad = baseLb * 0.55 * em(o.res.lightning);
              o.hp -= ad;
              o.hurt = 1;
              if (typeof statusLeech === "function") statusLeech(ad, hs);
              run.dmgLog.push([run.time, ad]);
              floatDmg("foe", Math.round(ad), 0, "#fff2a0", o._x);
              if (o.hp <= 0) killFoe(o, 0);
            }
          });
        }
      }
    }
    if (weapon.stats.doom) {
      // Doom fills from attack and the doom stat (like bleed), not from hit damage, so it scales
      // with Elemental Amp and not with crit (Doc, 2026-10-01). Knob: __abyssTune.doomAtk.
      const T = window.__abyssTune || {},
        pct = doomPercent(weapon),
        doomGain =
          (hs.atk * (T.doomAtk != null ? T.doomAtk : 1.4) + gStat(weapon, "doom") * 4) *
          pct *
          (typeof statusMulFor === "function" ? statusMulFor(target, hs, "doom") : 1);
      target.doom = (target.doom || 0) + doomGain;
      target.demiseUntil = (weapon.celestial || 0) >= 5 ? run.time + 2600 : 0;
      spawnStatusParticles(target, "doom", 7);
      if (target.hp > 0 && target.doom >= target.hp) {
        const executed = target.hp;
        if (typeof statusLeech === "function") statusLeech(executed, hs);
        recordDummyDamage("doomexecute", "☾", "Doom execute", executed, "#6f239d");
        target.hp = 0;
        target.doomExploded = true;
        floatDmg("foe", "☾ DOOM", 4, "#8c43c9", target._x);
        spawnStatusParticles(target, "doom", 32);
        flash("#541078");
        softShake();
      }
    }
    if (weapon.stats.poison) {
      target.pois = target.pois || [];
      const disease = (weapon.celestial || 0) >= 5,
        slower = disease ? scaledEffect(weapon, "poison", 3, 30, 45) / 100 : 0,
        duration = 4200 / Math.max(0.5, 1 - slower);
      if (target.pois.length < 12) target.pois.push(run.time + duration);
      target.diseasePower = disease ? 1 : 0;
      target.poisonDuration = duration;
      spawnStatusParticles(target, "poison", 6);
    }
    if (weapon.stats.burn) {
      target.burnUntil = run.time + 2600;
      target.burnDmg = Math.max(
        1,
        gStat(weapon, "burn") * 0.8 * celestialAmp(weapon) * combustTickMult(weapon)
      );
      target.burnAtkReduction = Math.min(0.12, scaledEffect(weapon, "burn", 2, 8, 12) / 100);
      spawnStatusParticles(target, "burn", 7);
      if ((weapon.celestial || 0) >= 5 && Math.random() * 100 < combustChance(weapon)) {
        target.combustStacks = (target.combustStacks || 0) + 1;
        if (target.combustStacks >= 10) {
          const burst = target.burnDmg * combustBurstMult(weapon);
          target.combustStacks = 0;
          target.hp -= burst;
          run.dmgLog.push([run.time, burst]);
          floatDmg("foe", "💥 COMBUST " + Math.round(burst), 2, "#ff6a2f", target._x);
          spawnStatusParticles(target, "burn", 28);
          softShake();
        }
      }
    }
    if (weapon.stats.frost) {
      const maxStacks = Math.max(3, Math.min(30, 3 + Math.round(27 * effectRatio(weapon, "frost"))));
      target.frostStacks = Math.min(maxStacks, (target.frostStacks || 0) + 1);
      target.frostMax = maxStacks;
      target.frostUntil = run.time + 2800;
      spawnStatusParticles(target, "frost", 6);
      if ((weapon.celestial || 0) >= 5) {
        target.freezeCharge = Math.min(10, (target.freezeCharge || 0) + 1);
        if (target.freezeCharge >= 10 && (!target.freezeCdUntil || run.time >= target.freezeCdUntil)) {
          target.freezeCharge = 0;
          target.freezeUntil = run.time + 1500 * celestialAmp(weapon);
          target.freezeCdUntil = run.time + 10000;
          floatDmg("foe", "🧊 FROZEN", 0, "#bfeeff", target._x);
          spawnStatusParticles(target, "frost", 22);
        }
      }
    }
    if (weapon.stats.bleed) {
      target.bleedC = (target.bleedC || 0) + 1;
      spawnStatusParticles(target, "bleed", 5);
      if (target.bleedC >= 4) {
        target.bleedC = 0;
        const bd =
          (hs.atk * 0.85 + hs.bleed * 2.5) * (typeof statusMulFor === "function" ? statusMulFor(target, hs, "bleed") : 1);
        target.hp -= bd;
        if (typeof statusLeech === "function") statusLeech(bd, hs);
        run.dmgLog.push([run.time, bd]);
        floatDmg("foe", "🩸 BLEED " + Math.round(bd), 0, "#b91430", target._x);
        spawnStatusParticles(target, "bleed", 18);
        softShake();
        if ((weapon.celestial || 0) >= 5) {
          // Doc 2026-10-02: Bloodthirst follows the realm Leech reduction and is capped per burst
          const TB = (typeof window !== "undefined" && window.__abyssTune) || {},
            lr = typeof celestialLeechReductionV50 === "function" ? celestialLeechReductionV50() : 0,
            heal = Math.min(
              run.hero.max * (TB.bloodCap != null ? TB.bloodCap : 0.05),
              ((bd * bloodthirstHealPct(weapon)) / 100) * (1 - lr)
            );
          run.hero.hp = Math.min(run.hero.max, run.hero.hp + heal);
          floatDmg("hero", "🩸 +" + Math.round(heal), 0, "#e35a70");
        }
      }
    }
  }
  if (!weapon || weapon.wtype !== "greataxe" || !run || run.over) return;
  if (Math.random() * 100 >= greataxeCleaveChance(weapon)) return;
  const others = run.foes.filter(x => x && x.hp > 0 && x !== target);
  if (!others.length) return;
  greataxeSweep(target, others);
  // the sweep's power is shared: 60% against one or two others, down to 30% against four
  const sweepFrac = Math.min(0.75, 1 / others.length); // 75% to one other; the sweep shares 100% among two or more
  others.forEach(o => {
    let cd = dd * sweepFrac;
    if (o.shieldUntil && run.time < o.shieldUntil) cd *= 0.18;
    o.hp -= cd;
    o.hurt = 1;
    run.dmgLog.push([run.time, cd]);
    try {
      floatDmg("foe", Math.round(cd), 0, "#ffd0a0", o._x);
    } catch (e) {}
    if (hs && hs.lifesteal > 0) {
      const _lr = celestialLeechReduction();
      const heal = Math.min(
        run.hero.max * (hs._leechCap || 0.04),
        ((cd * leechPct(hs.lifesteal)) / 100) * (1 - _lr)
      );
      run.hero.hp = Math.min(run.hero.max, run.hero.hp + heal);
    }
    if (o.hp <= 0) killFoe(o, 0);
  });
  try {
    drawBars();
  } catch (e) {}
}

// Earlier version of applyWeaponEffectsV18(), extended by the functions that follow.
function applyWeaponEffects(target, dd, tier, hs, g, em) {
  const before = target && target.pois ? target.pois.length : 0,
    result = applyWeaponEffectsBase(target, dd, tier, hs, g, em);
  if (target && g && g.stats && g.stats.poison) {
    const cap = poisonStackCap(g, hs);
    if ((target.pois || []).length === before && before < cap) {
      target.pois = target.pois || [];
      const disease = (g.celestial || 0) >= 5,
        slower = disease ? scaledEffect(g, "poison", 3, 30, 45) / 100 : 0,
        duration = 4200 / Math.max(0.5, 1 - slower);
      target.pois.push(run.time + duration);
      target.diseasePower = disease ? 1 : 0;
      target.poisonDuration = duration;
    }
    target.poisonCapV51 = cap;
    target.poisonSpreadCapV51 = poisonSpreadCapV51(g, hs);
  }
  return result;
}

function ensureV52State() {
  S.guards = S.guards || {};
  ["low", "med", "high", "vhigh", "ultra"].forEach(k => {
    S.guards[k] = Math.max(0, Number(S.guards[k]) || 0);
  });
  S.areaClearsV51 = S.areaClearsV51 || {};
  S.abyssAreaClearsV51 = S.abyssAreaClearsV51 || {};
}

function legacyAccessoryAffixMax(g, stat) {
  const level = Math.max(1, Math.min(180, Number(g && g.ilvl) || 1)),
    r = Math.max(0, Math.min(5, Number(g && g.rar) || 0)),
    base = PCT[stat] && PCT[stat][4];
  if (base == null) return maxBaseRollBeforeV54(g, stat);
  const levelScale = 0.25 + 0.75 * Math.sqrt(level / 180),
    rarityScale = [0.9, 0.95, 1, 1.06, 1.12, 1.18][r],
    critFactor = stat === "critChance" ? 0.77 : stat === "critDmg" ? 0.82 : 1;
  return Math.round(base * critFactor * levelScale * rarityScale * 1.3 * 10) / 10;
}

function accessoryAffixMaxV54(g, stat) {
  const level = Math.max(1, Math.min(180, Number(g && g.ilvl) || 1)),
    r = Math.max(0, Math.min(5, Number(g && g.rar) || 0)),
    base = PCT[stat] && PCT[stat][4];
  if (base == null) return maxBaseRollBeforeV54(g, stat);
  const levelScale = 0.1 + 0.9 * Math.pow(level / 180, 0.8),
    rarityScale = [0.9, 0.95, 1, 1.06, 1.12, 1.18][r],
    critFactor = stat === "critChance" ? 0.77 : stat === "critDmg" ? 0.82 : 1;
  return Math.round(base * critFactor * levelScale * rarityScale * 1.3 * 10) / 10;
}

function rollAccessoryAffix(g, stat) {
  const max = accessoryAffixMaxV54(g, stat),
    v = max * (0.7 / 1.3 + Math.random() * (0.6 / 1.3));
  return roundRaw(stat, v);
}

// Earlier version of makeGear(), extended by the functions that follow.
function makeGearBase(slotKey, ilvl, rar) {
  if (slotKey === "weapon") return makeWeapon(ilvl, rar);
  let prevResult73;
  prev73: {
    const sd = SLOTS.find(s => s.key === slotKey);
    const g = { slot: slotKey, ilvl, rar, plus: 0, stats: {} };
    if (slotKey === "weapon") g.wtype = Math.random() < 0.5 ? "bow" : "sword";
    g.stats[sd.main] = statRoll(sd.main, ilvl, rar);
    if (slotKey === "weapon") {
      if (g.wtype === "sword") {
        g.stats.atk = Math.round(g.stats.atk * 1.18);
      } else {
        g.stats.atk = Math.round(g.stats.atk * 0.85);
        g.stats.atkSpeed = (g.stats.atkSpeed || 0) + Math.round((4 + rar * 2) * (0.8 + Math.random() * 0.4));
        g.stats.critChance =
          Math.round(((g.stats.critChance || 0) + (2 + rar) * (0.8 + Math.random() * 0.4)) * 10) / 10;
      }
    }
    let pool = sd.affixes.filter(a => a !== sd.main).slice();
    if (slotKey === "weapon" && g.wtype === "sword") pool.push("bleed");
    let n = rar;
    const wOf = a =>
      a === "critChance" || a === "lifesteal"
        ? 0.35
        : a === "enrage"
          ? 0.5
          : a === "elementAmp"
            ? 0.45
            : a === "poison"
              ? 0.7
              : a === "bleed"
                ? 0.6
                : 1;
    while (n-- > 0 && pool.length) {
      const tot = pool.reduce((s, a) => s + wOf(a), 0);
      let x = Math.random() * tot,
        pick = 0;
      for (let i = 0; i < pool.length; i++) {
        x -= wOf(pool[i]);
        if (x <= 0) {
          pick = i;
          break;
        }
      }
      const a = pool.splice(pick, 1)[0];
      g.stats[a] = (g.stats[a] || 0) + statRoll(a, ilvl, rar);
      if (EXCL.has(a)) pool = pool.filter(x => !EXCL.has(x));
    }
    const lbl = slotKey === "weapon" ? (g.wtype === "bow" ? "Bow" : "Sword") : sd.label;
    g.name = RAR[rar].k[0].toUpperCase() + RAR[rar].k.slice(1) + " " + lbl;
    prevResult73 = g;
    break prev73;
  }
  const g = prevResult73;
  ensureItemVariant(g);
  return g;

  return;
}

// Earlier version of makeGear(), extended by the functions that follow.
function makeGearBeforeV45(slotKey, ilvl, rar) {
  return ensureMythic(makeGearBase(slotKey, ilvl, rar));
}

function makeGear(slotKey, ilvl, rar) {
  let prevResult74;
  prev74: {
    prevResult74 = applyItemDistribution(makeGearBeforeV45(slotKey, ilvl, rar), true, false);
    break prev74;
  }
  const g = prevResult74;
  if (accessory(g)) {
    Object.keys(g.stats || {}).forEach(stat => {
      if (stat !== "attackPower") g.stats[stat] = rollAccessoryAffix(g, stat);
    });
    g.accessoryScalingV54 = true;
    g.accessoryScalingV56 = true;
    g.enrageScalingV54 = true;
  } else if (g && g.stats && g.stats.enrage != null) {
    const mx = maxBaseRoll(g, "enrage");
    g.stats.enrage = roundRaw("enrage", mx * (0.7 / 1.3 + Math.random() * (0.6 / 1.3)));
    g.enrageScalingV54 = true;
  }
  return g;
}

function rerollStat(old, stat) {
  if (old && old.slot === "weapon" && old.wtype === "greataxe" && stat === "atk") {
    return Math.round(statRoll("atk", old.ilvl, old.rar) * 1.42);
  }
  let value;
  prev23: {
    if (old.slot === "weapon" && stat === "atk") {
      let v = statRoll("atk", old.ilvl, old.rar);
      value = Math.round(v * (old.wtype === "sword" ? 1.28 : old.wtype === "bow" ? 0.92 : 0.68));
      break prev23;
    }
    if (old.slot === "weapon" && stat === "atkSpeed" && old.wtype === "dagger") {
      value = Math.round((15 + old.rar * 3.2) * (0.7 + Math.random() * 0.6));
      break prev23;
    }
    if (old.slot === "weapon" && old.wtype === "bow" && stat === "atkSpeed") {
      value = Math.round((4 + old.rar * 1.5) * (0.7 + Math.random() * 0.6));
      break prev23;
    }
    if (old.slot === "weapon" && old.wtype === "bow" && stat === "critChance") {
      value = Math.round(bowBaseCrit(old.rar, 0.7 + Math.random() * 0.6) * 10) / 10;
      break prev23;
    }
    value = statRoll(stat, old.ilvl, old.rar);
    break prev23;
  }
  /* ---- rerollStatV36: later layers (moved here) ---- */
  if (old && old.distributionV45) {
    if (old.slot === "weapon" && stat === "atk") value *= 0.65;
    else if (old.slot === "helm" && stat === "hp") value *= 0.45;
    else if (old.slot === "armor" && stat === "hp") value *= 1.3;
    else if (old.slot === "boots" && stat === "hp") value *= 0.64;
  }
  return value;

  return;
}

function resolveAutoRunLootV54() {
  const bags = run && run.bags ? run.bags.slice() : [],
    results = [],
    oldWarn = !!(S.flags && S.flags.bagWarn);
  S.flags = S.flags || {};
  S.flags.bagWarn = true;
  if (run) run.lootInsertIndex = 0;
  bags.forEach(bag => results.push(addToBag(makeDrop(bag))));
  if (!oldWarn && !results.some(r => r && !r.kept && !r.auto)) S.flags.bagWarn = false;
  if (run) {
    run.bags = [];
    delete run.lootInsertIndex;
    delete run.stagedLootV42;
    delete run.stagedLootCommittedV42;
  }
  const modal = $("lootopen");
  if (modal) modal.classList.remove("on");
  const tray = $("traychips");
  if (tray) tray.innerHTML = "";
  updateTrayCount();
  updateForgeBalances();
  scheduleSave();
  return results;
}

function legacyBloodCap(g) {
  const level = Math.max(1, Number(g && g.ilvl) || 1),
    cel = Math.max(0, Number(g && g.celestial) || 0);
  return Math.max(1, Math.floor(level * (2 + 0.3 * cel)));
}

/* Doom was weighted at only 0.035 versus 0.48 to 0.68 for the other weapon effects.
   A 0.14 weight keeps it uncommon while making Doom builds realistically discoverable. */
function weaponEffectWeight(type, stat) {
  if (stat === "doom") return 0.14;
  if (stat === "doom") return 0.035;
  if (stat === "bleed") return type === "sword" ? 0.58 : type === "dagger" ? 0.045 : 0;
  if (stat === "poison") return type === "bow" ? 0.5 : type === "dagger" ? 0.68 : 0;
  if (stat === "burn" || stat === "frost") return 0.48;
  if (stat === "fire" || stat === "ice" || stat === "lightning") return 0.55;
  return 1;

  return;
}

// Highest item level: Abyss Omega's level (was a flat 190, which made every stage past the
// third drop identical items).
const ABYSS_ITEM_LEVEL_CAP = 240;
function abyssRushDropLevelV61(ai) {
  return Math.min(ABYSS_ITEM_LEVEL_CAP, abyssLevelV61(ai));
}

function allItemsV70_v70(state = S) {
  const out = [];
  [state.gear, state.gear2].forEach(set => Object.values(set || {}).forEach(g => g && out.push(g)));
  (state.bag || []).forEach(g => g && out.push(g));
  return out;
}

function ensureV70State(state = S) {
  state.flags = state.flags || {};
  state.pityV70 = Object.assign(emptyPity(), state.pityV70 || {});
  state.contractCompletionsV70 = Object.assign({}, state.contractCompletionsV70 || {});
  state.contractStageV72 = Object.assign({}, state.contractStageV72 || {});
  state.contractCooldownV73 = Object.assign({}, state.contractCooldownV73 || {});
  state.bestiaryKillsV70 = Object.assign({}, state.bestiaryKillsV70 || {});
  state.mythicSeenV70 = Array.isArray(state.mythicSeenV70) ? [...new Set(state.mythicSeenV70)] : [];
  state.activeContractV70 = CONTRACTS[state.activeContractV70] ? state.activeContractV70 : null;
  state.disciplineV70 = "none";
  state.goalIndexV70 = Math.max(0, Math.floor(Number(state.goalIndexV70) || 0));
  let carriedMythic = false;
  allItemsV70_v70(state).forEach(g => {
    ensureHistory(g);
    if (g.rar === 5) {
      carriedMythic = true;
      if (g.mythicAffix && !state.mythicSeenV70.includes(g.mythicAffix))
        state.mythicSeenV70.push(g.mythicAffix);
    }
  });
  if (carriedMythic) state.flags.firstMythicGuideV70 = true;
  if (!state.flags.skillBudgetV70) {
    const spent = regularSkillSpendV70(state);
    if (spent > SKILL_BUDGET) {
      state.sp = (Number(state.sp) || 0) + spent;
      state.skills = {};
      state.flags.skillBudgetRefundV70 = spent;
    }
    state.flags.skillBudgetV70 = true;
  }
  return state;
}

function makeDrop(bag) {
  return bag.unique === "bloodforged"
    ? makeBloodforged(bag.slot, bag.lvl)
    : makeGear(bag.slot, bag.lvl, bag.rar);
}

function prepareRunDrops() {
  return ((run && run.bags) || []).map(b => makeDrop(b)).filter(Boolean);
}

function meaningfulAutoLoot(items) {
  return items.some(g => g.rar >= 4 || g.unique === "bloodforged" || rawDelta(g) >= 0.08);
}

function setupStatsV72() {
  const panel = $("statpanel");
  if (!panel || panel.dataset.v73) return;
  panel.dataset.v73 = "1";
  const apply = () => {
    panel.classList.toggle("folded", !!S.statsFoldedV72);
    panel.title = S.statsFoldedV72 ? "Click to show character stats" : "Click to fold character stats";
  };
  panel.onclick = () => {
    S.statsFoldedV72 = !S.statsFoldedV72;
    apply();
    scheduleSave();
  };
  apply();
}

function grantStarterLoot(level) {
  const o = ensureOnboarding();
  if (o.starterLoot) return;
  o.starterLoot = true;
  const ilvl = Math.max(1, Math.min(8, Math.floor(Number(level) || 1))),
    items = [makeGear("weapon", ilvl, 0), makeGear("armor", ilvl, 0)];
  items.forEach(g => {
    const r = addToBag(g);
    if (!r || !r.kept) {
      S.bag.unshift(g);
      if (S.bag.length > S.bagCap) S.bagCap = S.bag.length;
    }
  });
  saveOnboarding();
}

function ensureGearBag(state = S) {
  state.gearBagUnlockedV82 = !!state.gearBagUnlockedV82;
  state.gearBagV82 = Array.isArray(state.gearBagV82)
    ? state.gearBagV82.filter(Boolean).slice(0, GEAR_BAG_CAP)
    : [];
  state.gearBagV82.forEach(g => {
    try {
      if (typeof ensureItemVariant === "function") ensureItemVariant(g);
      if (typeof migrateItemV54 === "function") migrateItemV54(g);
      if (typeof ensureHistoryV70 === "function") ensureHistoryV70(g);
    } catch (e) {}
  });
  return state;
}

function gearBagMessage(text, bad = false) {
  const el = $("fsel");
  if (el) el.innerHTML = '<span style="color:' + (bad ? "#ff8b7d" : "#9edceb") + '">' + text + "</span>";
}

function itemAt(ref) {
  if (!ref) return null;
  if (ref.kind === "equipped") return (S.gear && S.gear[ref.slot]) || null;
  if (ref.kind === "loot") return (S.bag && S.bag[ref.index]) || null;
  if (ref.kind === "gearbag") return ensureGearBag().gearBagV82[ref.index] || null;
  return null;
}

function moveItem(source, target) {
  ensureGearBag();
  const item = itemAt(source);
  if (!item || !target) return false;
  if (source.kind === target.kind && (source.kind !== "equipped" || source.slot === target.slot))
    return false;
  if (target.kind === "equipped") {
    if (item.slot !== target.slot) {
      gearBagMessage(
        "That item belongs in the " + SLOTS.find(s => s.key === item.slot).label + " slot.",
        true
      );
      return false;
    }
    const arr = sourceArray(source),
      old = S.gear[target.slot] || null;
    S.gear[target.slot] = item;
    if (arr) {
      if (old) arr[source.index] = old;
      else arr.splice(source.index, 1);
    } else delete S.gear[source.slot];
    S.sel = target.slot;
  } else {
    const dest = target.kind === "loot" ? S.bag : S.gearBagV82,
      cap = target.kind === "loot" ? S.bagCap : GEAR_BAG_CAP;
    if (dest.length >= cap) {
      gearBagMessage(target.kind === "loot" ? "The Loot Bag is full." : "The Gear Bag is full.", true);
      return false;
    }
    if (source.kind === "equipped") {
      delete S.gear[source.slot];
      if (S.sel === source.slot) S.sel = null;
    } else sourceArray(source).splice(source.index, 1);
    dest.push(item);
  }
  try {
    beep(650, 0.07, "triangle", 0.05);
    scheduleSave();
  } catch (e) {}
  renderTown();
  return true;
}

function bindDrop(el, target) {
  if (!el) return;
  el.ondragover = e => {
    if (!dragRef) return;
    e.preventDefault();
    el.classList.add("dragtargetv82");
  };
  el.ondragleave = () => el.classList.remove("dragtargetv82");
  el.ondrop = e => {
    e.preventDefault();
    el.classList.remove("dragtargetv82");
    const ref = dragRef;
    dragRef = null;
    moveItem(ref, target);
  };
}

function legacyTooltip(g) {
  const h = (g && g.historyV70) || {};
  if ((Number(h.kills) || 0) < 100) return "";
  const col = cvar(RAR[g.rar].col);
  return (
    '<div class="equippeditemtipv82" style="--legacycol:' +
    col +
    '"><b class="itemnamev82" style="color:' +
    col +
    '">' +
    g.name +
    " +" +
    g.plus +
    " · i" +
    g.ilvl +
    "</b>" +
    gearDesc(g) +
    "</div>"
  );
}

function gearBagChip(g, index) {
  const col = cvar(RAR[g.rar].col),
    cur = S.gear[g.slot],
    delta = !cur ? Infinity : (gpower(g) - gpower(cur)) / Math.max(1, gpower(cur)),
    chip = document.createElement("div");
  chip.className = "bchip" + (g.locked ? " lockeditem" : "");
  chip.style.setProperty("--bc", col);
  chip.draggable = true;
  chip.innerHTML =
    "<span>" +
    itemIcon(g) +
    '</span><span class="mk">' +
    itemMarks(g) +
    "</span>" +
    (g.locked ? '<span class="baglock">🔒</span>' : "") +
    '<div class="btip"><div class="bn" style="color:' +
    col +
    '">' +
    g.name +
    " +" +
    g.plus +
    (Number.isFinite(delta)
      ? ' <span style="color:' +
        (delta >= 0 ? "var(--uncommon)" : "#ff6b6b") +
        '">' +
        (delta >= 0 ? "▲ " : "▼ ") +
        Math.round(Math.abs(delta) * 100) +
        "%</span>"
      : ' <span style="color:var(--uncommon)">◆ empty slot</span>') +
    '</div><div class="bs">ilvl ' +
    g.ilvl +
    "<br>" +
    gearDesc(g) +
    '</div><div style="font-size:9px;color:#9edceb;margin:4px 0 5px">Drag onto its equipment slot or the Loot Bag</div><div class="bbtns"><button class="rf svb"' +
    (g.locked ? " disabled" : "") +
    '></button><button class="rf lockb' +
    (g.locked ? " on" : "") +
    '">' +
    (g.locked ? "🔓 Unlock" : "🔒 Lock") +
    "</button></div></div>";
  const rewards = salvageRewards(g),
    salvage = chip.querySelector(".svb");
  salvage.innerHTML = g.locked
    ? "Protected"
    : "Salvage +" +
      rewards.shards +
      " ◆" +
      (rewards.epic ? " +" + rewards.epic + " epic" : "") +
      (rewards.celestial ? ' +<span style="color:var(--mythic)">' + rewards.celestial + " ✺</span>" : "");
  salvage.onclick = e => {
    e.stopPropagation();
    if (g.locked) return;
    S.shards += rewards.shards;
    S.epicShards += rewards.epic;
    S.celestialShards = (S.celestialShards || 0) + rewards.celestial;
    S.gearBagV82.splice(index, 1);
    if (rewards.celestial) showCelestialShard(rewards.celestial);
    scheduleSave();
    renderTown();
  };
  chip.querySelector(".lockb").onclick = e => {
    e.stopPropagation();
    g.locked = !g.locked;
    scheduleSave();
    renderTown();
  };
  chip.ondragstart = e => dragStart(e, { kind: "gearbag", index });
  chip.ondragend = dragEnd;
  return chip;
}

function setupGearBagPanel() {
  const inv = $("inv"),
    regular = inv && inv.closest(".panel"),
    col = regular && regular.parentElement;
  if (!regular || !col) return null;
  let panel = $("gearbagpanelv82");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "gearbagpanelv82";
    panel.className = "panel gearbagpanelv82";
    panel.innerHTML =
      '<div class="ttl gearbagtitlev82">🧳 GEAR BAG <span id="gearbagcountv82"></span><span class="gearbaghintv82">reserve storage · drag items</span></div><div id="gearbaggridv82" class="gearbaggridv82"></div>';
    col.insertBefore(panel, regular);
  }
  const title = regular.querySelector(".bagtitle");
  if (title && title.firstChild) title.firstChild.nodeValue = "🎒 LOOT BAG ";
  return panel;
}

function renderGearBag() {
  const panel = setupGearBagPanel(),
    state = ensureGearBag();
  if (!panel) return;
  panel.classList.toggle("on", state.gearBagUnlockedV82);
  if (!state.gearBagUnlockedV82) return;
  const grid = $("gearbaggridv82");
  $("gearbagcountv82").textContent = state.gearBagV82.length + " / " + GEAR_BAG_CAP;
  grid.innerHTML = "";
  state.gearBagV82.forEach((g, i) => grid.appendChild(gearBagChip(g, i)));
  for (let i = state.gearBagV82.length; i < GEAR_BAG_CAP; i++) {
    const empty = document.createElement("div");
    empty.className = "gearbagslotv82";
    empty.textContent = i + 1;
    grid.appendChild(empty);
  }
  bindDrop(grid, { kind: "gearbag" });
}

function repairLegacyHover() {
  const root = $("slots"),
    slots = root && root.children;
  if (!slots) return;
  let any = false;
  Array.from(slots).forEach(slot => {
    const tip = slot.querySelector(".equippeditemtipv82");
    slot.classList.toggle("legacyreadyv83", !!tip);
    if (tip) {
      any = true;
      slot.tabIndex = 0;
      slot.title = "Hover to inspect this item’s Legacy";
    }
  });
  const panel = root.closest(".panel");
  if (panel) panel.classList.toggle("loadoutpanellegacyv83", any);
}

/* V90 — Sword armour pierce, scaling with forge (upgrade) level */
function swordPierceFrac(g) {
  return g && g.slot === "weapon" && g.wtype === "sword"
    ? Math.min(0.55, 0.1 + 0.017 * (g.plus || 0) + 0.015 * (g.celestial || 0))
    : 0;
}

function allItems() {
  var a = [];
  try {
    a = a.concat(Object.values(S.gear || {}), Object.values(S.gear2 || {}), S.bag || [], S.gearBagV82 || []);
  } catch (e) {}
  return a.filter(Boolean);
}

function ensureState_p21() {
  try {
    if (typeof S === "undefined") return null;
    if (typeof S.spA !== "number") S.spA = Math.max(0, (S.heroLevel || 1) - 1);
    if (!S.actV111 || typeof S.actV111 !== "object") S.actV111 = { pow: {}, dur: {}, cd: {}, loadout: [] };
    var a = S.actV111;
    a.pow = a.pow || {};
    a.dur = a.dur || {};
    a.cd = a.cd || {};
    if (!Array.isArray(a.loadout)) a.loadout = [];
    if (!a.loadout.length && !a._autoHeal) {
      a.loadout = ["heal"];
      a._autoHeal = true;
    }
    return a;
  } catch (e) {
    return null;
  }
}
