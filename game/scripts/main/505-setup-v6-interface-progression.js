// ============ V6 INTERFACE / PROGRESSION ==========
leechPct = function (pts) {
  pts = Math.max(0, pts || 0);
  return Math.round(((10 * pts) / (pts + 14)) * 10) / 10;
};

renderStatPanel = function () {
  const p = $("spbody");
  if (!p) return;
  const { out, mods } = liveStats();
  const eff = st =>
    st === "dodge"
      ? dodgePct(out[st] || 0)
      : st === "def"
        ? defPct(out[st] || 0)
        : st === "healCdr"
          ? cdrPct(out[st] || 0)
          : st === "lifesteal"
            ? leechPct(out[st] || 0)
            : resPct(out[st] || 0);
  const row = st => {
    const v = out[st] || 0;
    if (v === 0 && !["atk", "def", "hp", "critChance", "critDmg"].includes(st)) return "";
    let val;
    if (st === "hp" && run && !run.over && run.hero)
      val = Math.ceil(Math.max(0, run.hero.hp)) + " / " + Math.ceil(run.hero.max);
    else if (st === "enrage") {
      const ep = enrageProfile(v);
      val =
        Math.round(ep.chance) +
        '% <span style="color:#72bfff">(' +
        (ep.duration / 1000).toFixed(1) +
        "s)</span>";
    } else if (
      st === "def" ||
      st === "dodge" ||
      st === "fireRes" ||
      st === "iceRes" ||
      st === "lightRes" ||
      st === "healCdr" ||
      st === "lifesteal"
    )
      val = Math.round(v) + ' <span style="color:#72bfff">(' + eff(st) + "%)</span>";
    else val = PERCENT.has(st) ? Math.round(v) + "%" : Math.round(v);
    return '<div class="sprow"><span>' + STAT_LABEL[st] + "</span><b>" + val + "</b></div>";
  };
  let html =
    '<div class="sphd off">⚔ Offensive</div>' +
    OFFSTATS.map(row).join("") +
    '<div class="sphd def">🛡 Defensive</div>' +
    DEFSTATS.map(row).join("") +
    '<div class="sphd util">✦ Utility</div>' +
    UTILSTATS.map(row).join("");
  if (mods.length)
    html +=
      '<div class="sphd fx">● Active Effects</div>' +
      mods.map(m => '<div class="spmod" style="color:' + m.c + '">' + m.t + "</div>").join("");
  p.innerHTML = html;
};
var treeNodeCanBuy;

heroStats = function () {
  const h = {
    atk: 10 + S.heroLevel * 0.6,
    def: 3 + S.heroLevel * 0.3,
    hp: 80 + S.heroLevel * 10,
    critChance: 3,
    critDmg: 50,
    atkSpeed: 0,
    lifesteal: 0,
    dodge: 0,
    fire: 0,
    ice: 0,
    lightning: 0,
    poison: 0,
    bleed: 0,
    enrage: 0,
    lootChance: 0,
    fireRes: 0,
    iceRes: 0,
    lightRes: 0,
    healCdr: 0,
    xpBoost: 0,
    goldBoost: 0
  };
  for (const k in S.boons) h[k] = (h[k] || 0) + S.boons[k];
  for (const sk in S.gear) {
    if (run && !run.over && run.suppressedSlot === sk && run.suppressedUntil > run.time) continue;
    const g = S.gear[sk];
    if (!g) continue;
    const keys = new Set(Object.keys(g.stats));
    if (g.growth) {
      keys.add("atk");
      keys.add("hp");
    }
    keys.forEach(st => (h[st] = (h[st] || 0) + gStat(g, st)));
  }
  const b = skillBonuses();
  h.atk *= b.atkMult;
  h.hp *= b.hpMult;
  h.def *= b.defMult;
  h.fire *= b.eleMult;
  h.ice *= b.eleMult;
  h.lightning *= b.eleMult;
  h.critChance += b.critChance;
  h.critDmg += b.critDmg;
  h.atkSpeed += b.atkSpeed;
  h.lifesteal += b.lifesteal;
  h.xpBoost += b.xpBoost;
  h.critChance = Math.min(300, h.critChance);
  h.enrage = Math.max(0, h.enrage || 0);
  h._berserk = b.berserk;
  h._bossDamage = b.bossDamage;
  h._woundDamage = b.woundDamage;
  h._pierce = b.pierce;
  h._killHeal = b.killHeal;
  h._leechCap = b.leechCap;
  h._damageTaken = b.damageTaken;
  h._lowHpGuard = b.lowHpGuard;
  h._regen = 0;
  return h;
};

// ============ V6 CREATURES / ELITES ==========
ENEMIES.shaman = {
  n: "Shaman",
  c: "#5da85f",
  sz: 1.02,
  shape: "biped",
  hpM: 0.85,
  atkM: 0.78,
  defM: 0.75,
  res: { fire: -0.25, ice: 0.15, lightning: 0 }
};
ENEMIES.plaguefrog = {
  n: "Plague Frog",
  c: "#7daa38",
  sz: 1.08,
  shape: "blob",
  hpM: 0.95,
  atkM: 0.78,
  defM: 0.55,
  res: { fire: -0.2, ice: 0, lightning: 0.2 }
};
ENEMIES.thornback = {
  n: "Thornback",
  c: "#8b7446",
  sz: 1.12,
  shape: "block",
  hpM: 1.35,
  atkM: 0.9,
  defM: 1.35,
  res: { fire: -0.15, ice: 0.2, lightning: -0.15 }
};
[
  [0, "shaman"],
  [1, "plaguefrog"],
  [2, "thornback"],
  [3, "plaguefrog"],
  [4, "shaman"],
  [5, "plaguefrog"],
  [6, "shaman"],
  [7, "thornback"],
  [8, "plaguefrog"],
  [9, "shaman"],
  [10, "thornback"],
  [11, "plaguefrog"]
].forEach(([i, k]) => {
  if (!AREAS[i].pool.includes(k)) AREAS[i].pool.push(k);
});
foeBaseX = function (i, count) {
  if (count <= 1) return 405;
  if (count === 2) return i === 0 ? 360 : 452;
  return [325, 405, 485][i] || 485;
};

var makeElite;

var healBlast;
var specialEnemyTick;

nextWave = function () {
  if (run && run.hunt) {
    nextBossHuntWave();
    return;
  }
  run.wave++;
  const a = run.a,
    boss = run.wave > run.total;
  setTempo(boss ? 155 : 260);
  run.foes = [];
  if (boss) {
    const f = buildFoe(a.pool[0], a.lvl + run.total, 3.2, true, "★ " + a.boss);
    f.atk = Math.round(f.atk * 1.35);
    if (a.gimmick === "drown") {
      f.hp = Math.round(f.hp * 2.4);
      f.max = f.hp;
      f.atk = Math.round(f.atk * 0.5);
    }
    f._x = foeBaseX(0, 1);
    f.bossIdx = run.ai;
    f.draw.c = BOSSCOL[run.ai] || f.draw.c;
    f.draw.sz = 1.75;
    run.foes = [f];
    run.mech = MECHS[run.ai] || null;
    run.nextCastAt = run.time + 2800;
    hideCast();
    if (run.mech && run.mech.onSpawn) run.mech.onSpawn(f);
    if (a.bossLines) sayBoss(a.bossLines[Math.floor(Math.random() * a.bossLines.length)]);
  } else {
    run.mech = null;
    hideCast();
    S.roomsSeen = (S.roomsSeen || 0) + 1;
    const lvl = a.lvl + run.wave - 1,
      roll = Math.random(),
      count = roll < 0.12 ? 3 : roll < 0.34 ? 2 : 1,
      hpMul = count === 3 ? 0.46 : count === 2 ? 0.64 : 1,
      atkMul = count === 3 ? 0.76 : count === 2 ? 0.88 : 1,
      eliteIndex = Math.random() < 1 / 15 ? Math.floor(Math.random() * count) : -1;
    for (let i = 0; i < count; i++) {
      const key = a.pool[Math.floor(Math.random() * a.pool.length)],
        f = buildFoe(key, lvl, hpMul, false);
      f.atk = Math.max(1, Math.round(f.atk * atkMul));
      f._x = foeBaseX(i, count);
      if (i === eliteIndex) makeElite(f);
      run.foes.push(f);
    }
  }
  buildFoeBars();
  $("wave").innerHTML = boss
    ? '<b style="color:var(--legendary)">BOSS WAVE</b> · ' + a.n
    : "Wave <b>" +
      run.wave +
      "</b> / " +
      run.total +
      (run.foes.length > 1 ? ' · <b style="color:#ff8a6a">' + run.foes.length + " foes</b>" : "") +
      " · " +
      a.n;
  drawBars();
  updateRetreat();
  scheduleSave();
};
var nextBossHuntWave;

$("huntcontinue").onclick = () => {
  $("huntchoice").classList.remove("on");
  if (run && !run.over) nextWave();
};
$("huntleave").onclick = () => {
  if (!run) return;
  $("huntchoice").classList.remove("on");
  run.over = true;
  clearInterval(timer);
  hideCast();
  setTempo(260);
  startLootOpen(() => backToTown());
};
$("huntstart").onclick = startBossHunt;

anvilStatPop = function () {};

renderTree = function () {
  $("sktpts").textContent = S.sp;
  const box = $("branches");
  box.innerHTML = "";
  Object.values(V6_TREES).forEach(tree => {
    const card = document.createElement("div");
    card.className = "branch";
    card.innerHTML = '<h3 style="color:' + tree.col + '">' + tree.name + "</h3>";
    const tiers = [...new Set(tree.nodes.map(n => n.tier))];
    tiers.forEach((tier, ix) => {
      if (ix) {
        const ar = document.createElement("div");
        ar.className = "treearrow";
        ar.textContent = "▼";
        card.appendChild(ar);
      }
      const row = document.createElement("div"),
        nodes = tree.nodes.filter(n => n.tier === tier);
      row.className = "treerow" + (nodes.length > 1 ? " split" : "");
      nodes.forEach(n => {
        const rank = S.skills[n.id] || 0,
          maxed = rank >= n.max,
          blocked =
            n.group &&
            allTreeNodes().some(x => x.group === n.group && x.id !== n.id && (S.skills[x.id] || 0) > 0),
          levelLocked = n.tier === 6 && S.heroLevel < 15,
          can = treeNodeCanBuy(n),
          el = document.createElement("div");
        el.className = "node" + (maxed ? " maxed chosen" : can ? " can" : blocked ? " blocked" : " locked");
        el.style.color = tree.col;
        el.innerHTML =
          '<div class="nn">' +
          (SKILL_ICONS[n.id] || "✦") +
          '</div><div class="ntip"><b>' +
          n.name +
          "</b><br>" +
          n.d +
          (levelLocked ? '<br><span style="color:#ffcf5c">Requires hero level 15</span>' : "") +
          (blocked ? '<br><span style="color:#ff7b6b">Other branch chosen</span>' : "") +
          '</div><div class="nr">' +
          rank +
          "/" +
          n.max +
          "</div>";
        if (can)
          el.onclick = () => {
            S.skills[n.id] = (S.skills[n.id] || 0) + 1;
            S.sp--;
            beep(680, 0.1, "triangle");
            flash(tree.col);
            renderTree();
            renderTown();
          };
        row.appendChild(el);
      });
      card.appendChild(row);
    });
    box.appendChild(card);
  });
  const n = investedSkillPoints(),
    c = resetSkillCost(),
    b = $("resetskills");
  b.disabled = n === 0 || S.gold < c;
  b.innerHTML = n ? "↺ Reset " + n + " pts · " + fmt(c) + "g" : "↺ Nothing to reset";
};
specialEnemyTick = function () {
  if (!run || run.over) return;
  for (const f of run.foes) {
    if (f.hp <= 0 || f.boss || f.specialCd == null) continue;
    if (f.specialCast) {
      f.specialCast.left -= 150;
      if (f.specialCast.left <= 0) {
        resolveSpecial(f);
        const m = specialMeta(f);
        f.specialCast = null;
        f.specialCd = m.cd;
        f.specialCdMax = m.cd;
      }
      continue;
    }
    f.specialCd -= 150;
    if (f.specialCd <= 0) {
      if (!canSpecialCast(f)) {
        f.specialCd = 700;
        continue;
      }
      const m = specialMeta(f);
      f.specialCast = { name: m.name, dur: m.dur, left: m.dur, icon: m.icon };
      beep(220, 0.12, "triangle", 0.08);
      floatDmg(
        "foe",
        m.name,
        0,
        f.key === "plaguefrog" ? "#a8e94a" : f.key === "thornback" ? "#e4cf72" : "#7fe090",
        f._x
      );
    }
  }
  updateSpecialBars();
};

var showReforgeComparison;
$("rfbtn").onclick = openReforge;
$("reforgehit").onclick = attemptReforge;
$("reforgecancel").onclick = closeReforge;
document.addEventListener("keydown", e => {
  if (!$("reforgegame").classList.contains("on")) return;
  const space = e.code === "Space" || e.key === " ";
  if (space && e.repeat) {
    e.preventDefault();
    return;
  }
  if (reforgeLocked && (space || e.key === "Escape")) {
    e.preventDefault();
    closeReforge();
    return;
  }
  if (space) {
    e.preventDefault();
    attemptReforge();
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeReforge();
  }
});

Object.assign(ENEMIES, AREA_CREATURES);
AREAS[0].pool = ["brambleling", "tunnelgnawer", "shaman"];
AREAS[1].pool = ["frostmite", "icebound"];
AREAS[2].pool = ["granite", "rampart", "thornback"];
AREAS[3].pool = ["umbral", "bonewarden"];
AREAS[4].pool = ["cinderimp", "magmahound", "shaman"];
AREAS[5].pool = ["reefstalker", "drowned", "plaguefrog"];
AREAS[6].pool = ["gravewing", "mourner", "shaman"];
AREAS[7].pool = ["drakekin", "emberwing", "thornback"];
AREAS[8].pool = ["voidling", "abyssaleye", "plaguefrog"];
AREAS[9].pool = ["rimeknight", "snowstalker", "shaman"];
AREAS[10].pool = ["hellspawn", "chainbrute", "thornback"];
AREAS[11].pool = ["starborn", "astralseer", "plaguefrog"];

finishCelestial = function (success) {
  const { g } = pend,
    oldGear = JSON.parse(JSON.stringify(pend.g));
  strikeLocked = true;
  celestialSparkSequence(success, () => {
    if (success) {
      g.celestial = Math.min(10, (g.celestial || 0) + 1);
      const na = g.celestial >= 10 ? addAffix(g) : null;
      flash(g.celestial >= 10 ? "#ffd76a" : "#9fd8ff");
      softShake();
      floatForge(
        (g.celestial >= 10 ? "✹ CELESTIAL MAX 10 ✹" : "✦ CELESTIAL +" + g.celestial) +
          (na ? " · NEW AFFIX!" : ""),
        g.celestial >= 10 ? "#ffd76a" : "#9fd8ff"
      );
      showForgeComparison(oldGear, g, true);
      setTimeout(() => {
        $("strike").classList.remove("on", "celestial");
        celestialMode = false;
        strikeLocked = false;
        $("strikebtn").disabled = false;
        renderTown();
        $("run").style.display = "none";
        $("town").style.display = "grid";
      }, 2900);
    } else {
      flash("#3a2f57");
      floatForge("✦ celestial attempt failed · try again", "#a99bc8");
      setTimeout(() => prepareCelestialRetry(g), 420);
    }
  });
};

// ============ V11 FORGE CLARITY / SECRET DEVELOPER MODE ==========
PCT.enrage = [2, 3, 4, 5, 6];

var maxBaseRoll;
showReforgeComparison = function (oldGear, newGear) {
  const rows = comparisonRows(oldGear, newGear);
  $("reforgebefore").innerHTML = rows.before;
  $("reforgeafter").innerHTML = rows.after;
  $("reforgegame").classList.add("resultview");
};
salvageValueV10 = salvageValueV12;
$("salvageall").onclick = salvageUnlockedBag;

// ============ V13 FLOW / LOOT / PROGRESSION ============
[1, 1.18, 1.4, 1.65, 1.95].forEach((m, i) => (RAR[i].m = m));
statRoll = function (stat, ilvl, rar) {
  const level = Math.max(1, ilvl || 1),
    rm = RAR[rar].m,
    roll = 0.88 + Math.random() * 0.24,
    marginal = 1 + Math.min(0.25, level * 0.0025);
  if (stat === "healCdr")
    return Math.round(PCT.healCdr[rar] * marginal * (0.82 + Math.random() * 0.18) * 10) / 10;
  if (PERCENT.has(stat))
    return Math.round(PCT[stat][rar] * marginal * (0.82 + Math.random() * 0.18) * 10) / 10;
  if (stat === "hp") return Math.round((12 + level * 5.2 + Math.pow(level, 1.22) * 1.35) * rm * roll);
  if (stat === "atk" || stat === "def")
    return Math.round((6 + level * 2.7 + Math.pow(level, 1.22) * 0.7) * rm * roll);
  if (stat === "poison")
    return Math.max(1, Math.round((1 + level * 0.42) * rm * (0.85 + Math.random() * 0.25)));
  if (stat === "bleed")
    return Math.max(1, Math.round((1 + level * 0.46) * rm * (0.85 + Math.random() * 0.25)));
  return Math.round((2 + level * 0.78) * rm * roll);
};

maxBaseRoll = function (g, stat) {
  const level = Math.max(1, g.ilvl || 1),
    rar = Math.max(0, Math.min(4, g.rar || 0)),
    rm = RAR[rar].m,
    marginal = 1 + Math.min(0.25, level * 0.0025);
  if (stat === "healCdr" || PERCENT.has(stat)) return Math.round(PCT[stat][rar] * marginal * 10) / 10;
  if (stat === "hp") return Math.round((12 + level * 5.2 + Math.pow(level, 1.22) * 1.35) * rm * 1.12);
  if (stat === "atk" || stat === "def")
    return Math.round((6 + level * 2.7 + Math.pow(level, 1.22) * 0.7) * rm * 1.12);
  if (stat === "poison") return Math.max(1, Math.round((1 + level * 0.42) * rm * 1.1));
  if (stat === "bleed") return Math.max(1, Math.round((1 + level * 0.46) * rm * 1.1));
  return Math.round((2 + level * 0.78) * rm * 1.12);
};

addToBag = function (g) {
  let result;
  prev21: {
    const auto = Number.isInteger(S.autoSalvageRar) ? S.autoSalvageRar : -1;
    if (auto >= 0 && g.rar <= auto) {
      const sh = salvageValueV12(g),
        epic = g.rar >= 3 ? g.rar - 2 : 0;
      S.shards += sh;
      S.epicShards += epic;
      result = { kept: false, sh, epic, auto: true };
      break prev21;
    }
    if (S.bag.length >= S.bagCap) {
      const sh = salvageValueV12(g);
      S.shards += sh;
      if (g.rar >= 3) S.epicShards += g.rar - 2;
      if (!S.flags.bagWarn) {
        S.flags.bagWarn = true;
        setTimeout(
          () =>
            showTip(
              "INVENTORY FULL",
              "Your bag is full. Extra drops are auto salvaged, but you can buy <b>more inventory slots</b> from the shop."
            ),
          450
        );
      }
      result = { kept: false, sh, auto: false };
      break prev21;
    }
    if (run && Number.isInteger(run.lootInsertIndex)) {
      S.bag.splice(run.lootInsertIndex, 0, g);
      run.lootInsertIndex++;
    } else S.bag.push(g);
    result = { kept: true };
    break prev21;
  }
  /* ---- addToBag: later layers (moved here) ---- */
  if (result && !result.kept) {
    const ce = holyMissionV36(celestialSalvageValue(g));
    if (ce) {
      S.celestialShards = (S.celestialShards || 0) + ce;
      result.celestial = ce;
    }
    if (S.gear.amulet && S.gear.amulet.mythicAffix === "holyMission") {
      const bonus = Math.floor((result.sh || 0) * 0.25),
        epBonus = Math.floor((result.epic || 0) * 0.25);
      S.shards += bonus;
      S.epicShards += epBonus;
      result.sh = (result.sh || 0) + bonus;
      result.epic = (result.epic || 0) + epBonus;
    }
  }
  return result;
};

healBlast = function (f) {
  const alive = run.foes.filter(x => x.hp > 0),
    target = alive.sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
  if (!target || target.hp >= target.max * 0.96) {
    f.specialCd = 1200;
    return;
  }
  const self = target === f,
    amount = self
      ? Math.min(target.max * (f.elite ? 0.025 : 0.012), f.atk * (f.elite ? 2.1 : 1.35))
      : Math.min(target.max * (f.elite ? 0.1 : 0.055), f.atk * (f.elite ? 5.5 : 3.6)),
    before = target.hp;
  target.hp = Math.min(target.max, target.hp + amount);
  const healed = Math.max(0, target.hp - before);
  for (let i = 0; i < 20; i++) {
    const ang = Math.random() * Math.PI * 2,
      dist = 5 + Math.random() * 22;
    particles.push({
      x: target._x + Math.cos(ang) * dist,
      y: GY - 25 + Math.sin(ang) * dist * 0.55,
      vx: -Math.cos(ang) * 0.7,
      vy: -0.5 - Math.random() * 0.7,
      life: 1,
      sz: 2.5,
      col: i % 3 ? "#70e080" : "#d5ffb0"
    });
  }
  if (healed > 0) floatDmg("foe", "✚ +" + Math.round(healed) + " HP", 0, "#7fe090", target._x);
  beep(680, 0.16, "triangle", 0.1);
  drawBars();
};
const spawnHitBase = spawnHit;
spawnHit = function (x, y, big, forceN, gore) {
  if (!deathParticleColor) return spawnHitBase(x, y, big, forceN, gore);
  const start = particles.length;
  spawnHitBase(x, y, big, forceN, gore);
  for (let i = start; i < particles.length; i++) particles[i].col = deathParticleColor;
};

// ============ V14 BLOODFORGED LEGENDARY VARIANTS ============
var rollBloodforged;

var makeReforgeCandidate;

attemptReforge = function () {
  if (reforgeLocked || !reforgePending) return;
  reforgeLocked = true;
  cancelAnimationFrame(reforgeRaf);
  const p = reforgePending,
    hit = Math.abs(reforgeRadius - REFORGE_STAR_RADIUS) <= REFORGE_HIT_WIDTH;
  S.gold -= p.gold;
  S.shards -= p.shards;
  $("reforgehit").style.display = "none";
  $("reforgecancel").textContent = "Continue";
  if (hit) {
    const oldGear = JSON.parse(JSON.stringify(p.g)),
      tries = 1 + skillBonuses().reforgeHigh;
    let ng = makeReforgeCandidate(p.g);
    for (let t = 1; t < tries; t++) {
      const candidate = makeReforgeCandidate(p.g);
      if (gpower(candidate) > gpower(ng)) ng = candidate;
    }
    carryIdentity(ng, p.g);
    S.gear[p.g.slot] = ng;
    $("reforgecenter").innerHTML = itemIcon(ng);
    $("reforgemsg").textContent = "ALIGNMENT PERFECT · ITEM REFORGED";
    $("reforgegame").classList.add("success");
    $("reforgearena").classList.add("aligned");
    showReforgeComparison(oldGear, ng);
    chord([440, 660, 880], 0.4);
    flash(cvar("--epic"));
  } else {
    $("reforgemsg").textContent = "ALIGNMENT MISSED · ITEM UNCHANGED";
    $("reforgegame").classList.add("missed");
    beep(105, 0.25, "sawtooth", 0.12);
    softShake();
  }
  saveGame(true);
};

const strikeActionBase = $("strikebtn").onclick;
$("strikebtn").onclick = () => {
  if (forgeContinue) {
    continueForge();
    return;
  }
  return strikeActionBase();
};
const strikeDoneBase = $("strikedone").onclick;
$("strikedone").onclick = () => {
  forgeContinue = null;
  return strikeDoneBase();
};

$("autosalvage").onclick = () => {
  const current = Number.isInteger(S.autoSalvageRar) ? S.autoSalvageRar : -1;
  S.autoSalvageRar = current >= 4 ? -1 : current + 1;
  beep(420 + Math.max(0, S.autoSalvageRar) * 70, 0.06, "triangle", 0.05);
  renderTown();
  scheduleSave();
};
