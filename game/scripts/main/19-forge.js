/* The Anvil: upgrading, reforging, celestial forging, break guards. */

function floatForge(txt, col) {
  const s = $("strike");
  if (!s) return;
  floatForge._n = ((floatForge._n || 0) + 1) % 3;
  const d = document.createElement("div");
  d.textContent = txt;
  d.style.cssText =
    "position:absolute;top:" +
    (112 + floatForge._n * 24) +
    "px;left:50%;transform:translateX(-50%);font-weight:800;font-size:14px;color:" +
    col +
    ";text-shadow:0 0 10px " +
    col +
    ";z-index:11;animation:flylongC 3s forwards;white-space:nowrap;pointer-events:none";
  s.appendChild(d);
  setTimeout(() => d.remove(), 3000);
}

function rfGoldCost(g) {
  const il = Math.max(1, g.ilvl || 1),
    r = Math.max(0, g.reforges || 0);
  return Math.round((1800 + il * 110) * (1 + (g.rar || 0) * 0.4) * Math.pow(2.25, r));
}

function setupCelRound(g) {
  celProf = celestialProfile(g);
  zW = celProf.width;
  zL = 30 + Math.random() * (320 - 60 - zW);
  zcL = zL;
  sSpeed = celProf.speed;
  sPos = 0;
  sDir = 1;
  $("pzone").style.left = zL + "px";
  $("pzone").style.width = zW + "px";
  $("pcrit").style.left = zL + "px";
  $("pcrit").style.width = zW + "px";
  cancelAnimationFrame(sRAF);
  sRAF = requestAnimationFrame(markerLoop);
}

function celestialSparkSequence(success, done) {
  const box = $("strike"),
    item = $("forgeitem");
  if (!box || !item) {
    done && done();
    return;
  }
  item.classList.remove("celglow");
  const br = box.getBoundingClientRect(),
    ir = item.getBoundingClientRect(),
    tx = ir.left - br.left + ir.width / 2,
    ty = ir.top - br.top + ir.height / 2;
  for (let i = 0; i < 34; i++) {
    const p = document.createElement("div");
    p.className = "cspark";
    p.style.color = i % 3 === 0 ? "#ffffff" : "#9fd8ff";
    p.style.background = "currentColor";
    const side = i % 4;
    let x = side === 0 ? 8 : side === 1 ? br.width - 14 : Math.random() * br.width;
    let y = side === 2 ? 8 : side === 3 ? br.height - 14 : Math.random() * br.height;
    p.style.left = x + "px";
    p.style.top = y + "px";
    box.appendChild(p);
    requestAnimationFrame(() => {
      const ratio = success ? 1 : 0.45 + Math.random() * 0.25;
      p.style.transform =
        "translate(" +
        (tx - x) * ratio +
        "px," +
        (ty - y) * ratio +
        "px) scale(" +
        (success ? 1.35 : 0.45) +
        ")";
      p.style.opacity = success ? "1" : "0";
      p.style.filter = success ? "brightness(1.8)" : "brightness(.5)";
    });
    setTimeout(() => p.remove(), 720);
  }
  setTimeout(() => {
    if (success) {
      item.classList.add("celglow");
      chord([659, 988, 1319, 1568], 0.55);
    } else {
      beep(88, 0.32, "sawtooth", 0.13);
    }
    setTimeout(() => {
      item.classList.remove("celglow");
      done && done();
    }, 420);
  }, 640);
}

function forgeZone(pos) {
  if (pos >= zcL - 1 && pos <= zcL + ZCW + 1) return "silver";
  if (pos >= zL - 2 && pos <= zL + zW + 2) return "gold";
  return "miss";
}

function forgeStatsHtml(g, extra) {
  if (!g) return "";
  const rows = [];
  const keys = new Set(Object.keys(g.stats || {}));
  if (g.growth) {
    keys.add("atk");
    keys.add("hp");
  }
  keys.forEach(st => {
    const v = gStat(g, st);
    let val =
      CURVED.has(st) || st === "healCdr" || st === "lifesteal"
        ? Math.round(v)
        : PERCENT.has(st)
          ? v.toFixed(1) + "%"
          : Math.round(v);
    rows.push('<div><span style="color:var(--dim)">' + STAT_LABEL[st] + "</span> <b>" + val + "</b></div>");
  });
  if (extra) rows.push('<div style="color:#9fd8ff;margin-top:3px">' + extra + "</div>");
  return rows.join("");
}

function addShardConversion(grid, amount, epic) {
  const card = document.createElement("div");
  card.className = "shopcard";
  card.innerHTML =
    '<div class="sn">◆ Refine Epic Shards</div><div class="sd">Convert <b style="color:var(--rare)">' +
    fmt(amount) +
    ' regular shards</b> into <b style="color:var(--epic)">' +
    epic +
    " epic shard" +
    (epic === 1 ? "" : "s") +
    '</b>.</div><button class="cel"' +
    (S.shards < amount ? " disabled" : "") +
    ">Convert " +
    fmt(amount) +
    " ◆ → " +
    epic +
    " epic</button>";
  card.querySelector("button").onclick = () => {
    if (S.shards < amount) return;
    S.shards -= amount;
    S.epicShards += epic;
    beep(760, 0.1, "triangle");
    flash(cvar("--epic"));
    renderShop();
    renderTown();
  };
  grid.appendChild(card);
}

function drawReforgeRing() {
  const ring = $("reforgering"),
    arena = $("reforgearena");
  if (!ring || !arena) return;
  const size = reforgeRadius * 2;
  ring.style.width = size + "px";
  ring.style.height = size + "px";
  arena.classList.toggle("aligned", Math.abs(reforgeRadius - REFORGE_STAR_RADIUS) <= REFORGE_HIT_WIDTH);
}

function animateReforge(now) {
  if (!$("reforgegame").classList.contains("on") || reforgeLocked) return;
  const dt = reforgeLast ? Math.min(40, now - reforgeLast) : 16;
  reforgeLast = now;
  reforgePhase += dt * 0.0027;
  reforgeRadius = 22 + 72 * ((Math.sin(reforgePhase) + 1) / 2);
  drawReforgeRing();
  reforgeRaf = requestAnimationFrame(animateReforge);
}

function closeReforge() {
  cancelAnimationFrame(reforgeRaf);
  reforgeRaf = 0;
  reforgePending = null;
  reforgeLocked = false;
  $("reforgegame").classList.remove("on", "success", "missed", "resultview");
  $("reforgearena").classList.remove("aligned");
  $("reforgehit").style.display = "";
  $("reforgehit").disabled = false;
  $("reforgecancel").textContent = "✕ Done";
  $("run").style.display = "none";
  $("town").style.display = "grid";
  renderTown();
}

function openReforge() {
  const g = S.gear[S.sel];
  if (!g || g.broken) return;
  const shards = rfCost(g),
    gold = rfGoldCost(g);
  if (S.shards < shards || S.gold < gold) {
    $("fsel").textContent = "Need " + fmt(gold) + " gold + " + fmt(shards) + " shards to reforge.";
    return;
  }
  const arena = $("reforgearena");
  arena.querySelectorAll(".reforgestar").forEach(e => e.remove());
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 10,
      star = document.createElement("span");
    star.className = "reforgestar";
    star.textContent = "★";
    star.style.left = 110 + Math.cos(a) * REFORGE_STAR_RADIUS + "px";
    star.style.top = 110 + Math.sin(a) * REFORGE_STAR_RADIUS + "px";
    arena.appendChild(star);
  }
  reforgePending = { g, shards, gold };
  reforgeLocked = false;
  reforgePhase = -Math.PI / 2;
  reforgeRadius = 22;
  reforgeLast = 0;
  $("reforgecenter").innerHTML = itemIcon(g);
  $("reforgeitemname").textContent =
    (g.name || RAR[g.rar].k + " " + SLOTS.find(s => s.key === g.slot).label) +
    " · Level " +
    g.ilvl +
    " · +" +
    (g.plus || 0);
  $("reforgecost").innerHTML =
    '<span class="cg">' + fmt(gold) + ' GOLD</span><br><span class="cs">' + fmt(shards) + " SHARDS</span>";
  $("reforgemsg").textContent = "ALIGN THE RING WITH THE STARS";
  $("reforgegame").classList.remove("success", "missed", "resultview");
  $("reforgehit").style.display = "";
  $("reforgehit").disabled = false;
  $("reforgecancel").textContent = "✕ Done";
  $("town").style.display = "none";
  $("run").style.display = "block";
  $("reforgegame").classList.add("on");
  drawReforgeRing();
  reforgeRaf = requestAnimationFrame(animateReforge);
}

function attemptReforge() {
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
    let ng = makeGear(p.g.slot, p.g.ilvl, p.g.rar);
    for (let t = 1; t < tries; t++) {
      const cand = makeGear(p.g.slot, p.g.ilvl, p.g.rar);
      if (gpower(cand) > gpower(ng)) ng = cand;
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
}

function prepareCelestialRetry(g) {
  const c = celestialCost(g);
  if ((c.cshards || 0) > (S.celestialShards || 0)) {
    $("baseodds").innerHTML =
      '<span style="color:#ff8b7d">Not enough Celestial shards for another attempt</span>';
    $("strikebtn").disabled = true;
    strikeLocked = true;
    updateForgeBalances();
    return;
  }
  {
    clearForgeComparison();
    const c = celestialCost(g),
      p = celestialProfile(g);
    if (S.epicShards < c.esh || S.gold < c.gold) {
      $("baseodds").innerHTML =
        '<span style="color:#ff8b7d">Not enough resources for another attempt</span> · ' +
        c.esh +
        " epic shards + " +
        fmt(c.gold) +
        " gold";
      $("strikebtn").disabled = true;
      strikeLocked = true;
      return;
    }
    celHitsDone = 0;
    celHitsNeeded = p.hits;
    celProf = p;
    pend = { g, c, paid: false };
    setupCelRound(g);
    setForgeHud(g, true);
    $("baseodds").innerHTML =
      '<span style="color:#ffb07c">Attempt failed · try again</span><br><span style="color:#9fd8ff">Celestial ' +
      p.target +
      " / 10</span> · " +
      p.hits +
      " silver hit" +
      (p.hits > 1 ? "s" : "") +
      " required · " +
      Math.round(p.chance * 100) +
      "% final roll after all hits · " +
      c.esh +
      " epic + " +
      fmt(c.gold) +
      " gold";
    strikeLocked = false;
    $("strikebtn").disabled = false;
  }
  return;
}

function clearForgeComparison() {
  $("strike").classList.remove("compareview");
  $("forgecompare").classList.remove("on");
  $("forgebefore").innerHTML = "";
  $("forgeafter").innerHTML = "";
  $("strikebtn").style.visibility = "";
}

function showForgeComparison(oldGear, newGear, celestial) {
  const rows = comparisonRows(oldGear, newGear);
  $("forgebefore").innerHTML = rows.before;
  $("forgeafter").innerHTML = rows.after;
  $("forgecompare").classList.add("on");
  $("strike").classList.add("compareview");
  $("strikebtn").style.visibility = "hidden";
  $("strikehd").textContent = celestial ? "✦ CELESTIAL STATS IMPROVED" : "⚒ FORGE RESULT";
}

function forgeMultiplier(plus) {
  const p = Math.max(0, Math.min(20, plus || 0));
  if (p <= 10) return 1 + 0.11 * p;
  const x = p - 10;
  return 2.1 * (1 + 0.07 * x + 0.006 * x * x);
}

function continueForge() {
  const state = forgeContinue,
    g = state && state.g,
    c = g && upCost(g);
  if (c && !canPayForge(c)) {
    leaveForge();
    $("fsel").innerHTML =
      '<span style="color:#ff6b6b">Not enough forge materials for another attempt.</span>';
    return;
  }
  {
    const state = forgeContinue,
      g = state && state.g,
      c = g && upCost(g);
    if (c && c.cshards > (S.celestialShards || 0)) {
      leaveForge();
      return;
    }
    {
      const state = forgeContinue;
      if (!state) return;
      forgeContinue = null;
      clearForgeComparison();
      const g = state.g;
      if (state.broke || !g || g.plus >= 20 || S.gear[S.sel] !== g) {
        leaveForge();
        return;
      }
      const cost = upCost(g);
      if (S.gold < cost.gold || S.shards < cost.shards) {
        leaveForge();
        return;
      }
      $("strikebtn").innerHTML = 'STRIKE ⚒ <span class="keyhint" style="opacity:.7">(space)</span>';
      openStrike(g, cost);
    }
    return;
  }
  return;
}

function celestialProgress(g) {
  return Math.max(0, Math.min(1, (((g && g.celestial) || 5) - 5) / 5));
}

function celestialEffectName(g) {
  if (!g || g.slot !== "weapon" || (g.celestial || 0) < 5) return null;
  const st = weaponEffect(g);
  return st === "frost"
    ? "Freeze"
    : st === "burn"
      ? "Combust"
      : st === "poison"
        ? "Disease"
        : st === "doom"
          ? "Demise"
          : st === "bleed"
            ? "Bloodthirst"
            : st === "lightning"
              ? "Overload"
              : null;
}

function celestialDebuffAllowed() {
  return !(S.gear.boots && S.gear.boots.mythicAffix === "nimble" && Math.random() < 0.15);
}

function guardianCheckpoint() {
  return false;
}

function celestialSalvageValue(g) {
  if (!g || !(g.celestialDrop || g.rar === 5)) return 0;
  if ((g.ilvl || 0) < 130) return 1;
  const c = Math.max(1, g.celestial || 0);
  return c >= 10 ? 12 : c;
}

function hardHatRoom() {
  if (!run) return 1;
  return Math.max(1, Math.round(run.wave || (run.huntIndex || 0) + 1 || 1));
}

function hardHatReady() {
  if (!run || !S.gear.helm || S.gear.helm.mythicAffix !== "hardHat") return false;
  const last = Number(run.hardHatBlockedRoomV39);
  return !Number.isFinite(last) || hardHatRoom() - last >= 2;
}

function tryHardHatBlock() {
  let blocked;
  prev24: {
    if (!hardHatReady()) {
      blocked = false;
      break prev24;
    }
    run.hardHatBlockedRoomV39 = hardHatRoom();
    run.hardHatUsed = true;
    floatDmg("hero", "⛑ BLOCKED", 0, "#ffffff");
    flash("#ffffff");
    updateStatusFx();
    blocked = true;
    break prev24;
  }
  /* ---- tryHardHatBlockV39: later layers (moved here) ---- */
  if (blocked && run) run._enemyAttackSourceV40 = null;
  return blocked;
}

function celestialHealthPressure(source) {
  let prevResult45;
  prev45: {
    if (!run || run.over || run.hunt || run.ai < CELESTIAL_AREA_START || !run.hero || !source) {
      prevResult45 = 0;
      break prev45;
    }
    const tier = Math.max(0, Math.min(3, run.ai - CELESTIAL_AREA_START));
    const regular = [0.008, 0.01, 0.012, 0.014][tier],
      elite = [0.014, 0.016, 0.018, 0.021][tier],
      boss = [0.018, 0.022, 0.026, 0.032][tier];
    const rate = source.omegaGuard
      ? Math.max(0.022, elite)
      : source.boss
        ? boss
        : source.elite
          ? elite
          : regular;
    const sb = skillBonuses();
    let pressure = run.hero.max * rate * (sb.damageTaken == null ? 1 : sb.damageTaken);
    if (run.hero.hp / run.hero.max < 0.5) pressure *= Math.max(0.5, 1 - (sb.lowHpGuard || 0));
    prevResult45 = pressure;
    break prev45;
  }
  let pressure = prevResult45;
  if (source && source.omegaIncomingMultV44) pressure *= source.omegaIncomingMultV44;
  return pressure;
}

function tuneCelestialDamage(f, tier) {
  if (!f || f.celestialDamageTunedV40) return f;
  f.celestialDamageTunedV40 = true;
  const mult = f.boss ? [1.18, 1.28, 1.38, 1.52][tier] : [1.22, 1.3, 1.4, 1.52][tier];
  f.atk = Math.max(1, Math.round(f.atk * mult));
  return f;
}

function canPayForge(c) {
  return (
    !!c &&
    S.gold >= c.gold &&
    S.shards >= (c.shards || 0) &&
    S.epicShards >= (c.esh || 0) &&
    (S.celestialShards || 0) >= (c.cshards || 0)
  );
}

function forgeCostText(c) {
  return (
    '<span class="cg">' +
    fmt(c.gold) +
    'g</span> · <span class="cs">' +
    fmt(c.shards || 0) +
    ' ◆</span> · <span class="esh">' +
    fmt(c.esh || 0) +
    " epic</span>" +
    (c.cshards
      ? '<br><span style="color:var(--mythic)">' +
        fmt(c.cshards) +
        " Celestial shard" +
        (c.cshards === 1 ? "" : "s") +
        "</span>"
      : "")
  );
}

function orderedReforgeStats(g) {
  const order = [...OFFSTATS, ...DEFSTATS, ...UTILSTATS],
    known = order.filter(st => g && g.stats && st in g.stats);
  Object.keys((g && g.stats) || {}).forEach(st => {
    if (!known.includes(st)) known.push(st);
  });
  return known;
}

function renderReforgeLockSelection() {
  const g = reforgePending && reforgePending.g;
  if (!g) return;
  const keys = orderedReforgeStats(g);
  $("reforgebefore").innerHTML = keys
    .map(
      st =>
        '<div class="rfstat lockrowv43' +
        (reforgeLockStat === st ? " locked" : "") +
        '"><span>' +
        STAT_LABEL[st] +
        "</span><b>" +
        statFormat(g, st) +
        "</b>" +
        reforgeLockButton(st) +
        "</div>"
    )
    .join("");
  $("reforgeafter").innerHTML = keys
    .map(st => {
      const locked = reforgeLockStat === st;
      return (
        '<div class="rfstat lockrowv43' +
        (locked ? " locked" : "") +
        '"><span>' +
        STAT_LABEL[st] +
        "</span><b>" +
        (locked ? statFormat(g, st) : "<em>Rerolls</em>") +
        "</b>" +
        reforgeLockMirror(st) +
        "</div>"
      );
    })
    .join("");
  $("reforgegame").classList.add("lockselectv43");
  $("reforgebefore")
    .querySelectorAll(".statlockv43")
    .forEach(
      btn =>
        (btn.onclick = e => {
          e.stopPropagation();
          if (reforgeLocked) return;
          const stat = btn.dataset.stat;
          reforgeLockStat = reforgeLockStat === stat ? "" : stat;
          renderReforgeLockSelection();
          beep(reforgeLockStat ? 720 : 480, 0.05, "triangle", 0.04);
        })
    );
}

function renderReforgeResult(oldGear, newGear) {
  const keys = orderedReforgeStats(oldGear);
  $("reforgebefore").innerHTML = keys
    .map(
      st =>
        '<div class="rfstat lockrowv43' +
        (reforgeLockStat === st ? " locked" : "") +
        '"><span>' +
        STAT_LABEL[st] +
        "</span><b>" +
        statFormat(oldGear, st) +
        "</b>" +
        reforgeLockButton(st) +
        "</div>"
    )
    .join("");
  $("reforgeafter").innerHTML = keys
    .map(st => {
      const ov = gStat(oldGear, st),
        nv = gStat(newGear, st),
        locked = reforgeLockStat === st,
        cl = locked ? "locked" : nv > ov + 0.04 ? "up" : nv < ov - 0.04 ? "down" : "",
        star = isMaxRoll(newGear, st) ? ' <span class="maxstar">★</span>' : "",
        max = ' <span class="rollmax">[' + maxFormat(newGear, st) + "]</span>";
      return (
        '<div class="rfstat lockrowv43 ' +
        cl +
        '"><span>' +
        STAT_LABEL[st] +
        star +
        "</span><b>" +
        statFormat(newGear, st) +
        max +
        "</b>" +
        reforgeLockMirror(st) +
        "</div>"
      );
    })
    .join("");
  $("reforgegame").classList.add("resultview");
}

function setupReforgeLocks() {
  const old = $("reforgelock");
  if (old) old.remove();
  const arena = $("reforgearena"),
    compare = $("reforgecompare");
  if (arena && compare && !$("reforgeworkv43")) {
    const work = document.createElement("div");
    work.id = "reforgeworkv43";
    work.className = "reforgeworkv43";
    arena.insertAdjacentElement("beforebegin", work);
    work.appendChild(arena);
    work.appendChild(compare);
  }
  const style = document.createElement("style");
  style.textContent =
    "#cv{width:100%!important;height:auto!important;aspect-ratio:28/11;object-fit:contain!important;display:block;margin-left:auto;margin-right:auto}.reforgegame{overflow:auto}.reforgeworkv43{display:grid;grid-template-columns:230px minmax(430px,540px);gap:12px;align-items:center;justify-content:center;width:min(790px,96%);margin:4px auto 7px}.reforgegame.lockselectv43 .reforgecompare{display:grid;width:100%;margin:0}.reforgegame.resultview .reforgeworkv43{display:block;width:min(560px,96%)}.reforgegame.resultview .reforgecompare{width:100%;margin:10px auto}.lockrowv43{display:grid;grid-template-columns:minmax(72px,1fr) auto 24px;align-items:center}.lockrowv43.locked{background:#57451d66!important;box-shadow:inset 0 0 0 1px #ffd76a55}.lockrowv43.locked b{color:#ffe493!important}.statlockv43{width:22px;height:22px;min-width:22px;padding:0;border:1px solid #695b75;border-radius:5px;background:#131019;color:#a89ab7;font-size:11px;line-height:20px;filter:none!important}.statlockv43:hover{border-color:#d4b7f5;background:#24172f}.statlockv43.locked{border-color:#ffd76a;background:#493912;color:#fff0a3;box-shadow:0 0 8px #ffd76a55}.statlockmirrorv43{display:inline-flex;width:22px;height:22px;align-items:center;justify-content:center;border:1px solid #51485a;border-radius:5px;background:#110e15;color:#82778d;font-size:11px}.statlockmirrorv43.locked{border-color:#ffd76a;background:#493912;color:#fff0a3;box-shadow:0 0 8px #ffd76a44}.lockrowv43 b em{color:#82778d;font-size:8px;font-style:normal;font-weight:600}.reforgegame.resultview .statlockv43{pointer-events:none}.reforgegame.lockselectv43:not(.resultview) .reforgearena{display:block}.reforgegame.lockselectv43 .reforgeguide{margin-top:3px}@media(max-width:760px){.reforgeworkv43{grid-template-columns:1fr;width:96%;gap:4px}.reforgearena{transform:scale(.82);transform-origin:center;margin:-16px auto}.reforgegame.lockselectv43 .reforgecompare{max-height:180px;overflow:auto}.reforgegame.resultview .reforgeworkv43{width:96%}}";
  document.head.appendChild(style);
}

function celestialLeechReduction() {
  if (!run || run.over) return 0;
  let red = LEECH_REDUCTION[run.ai] || 0;
  if (run.a && run.a.abyss) red = 1 - (1 - red) * (1 - 0.3);
  return red;
}

function omegaSummonGuards(b) {
  let prevResult186;
  prev186: {
    const tier = 3,
      created = [];
    for (let i = 0; i < 2; i++) {
      const g = buildFoe("celwarden", b.lvl, 0.75, false, "Ω Critical Guard");
      g.omegaGuard = true;
      g.enemyCritBonusV40 = 0.22;
      g.max = Math.round(b.max * 0.13);
      g.hp = g.max;
      g.atk = Math.round(b.atk * 0.43);
      g.def = Math.round(b.def * 0.72);
      g.draw.c = i ? "#d8ffff" : "#fff4c9";
      g.draw.sz = 1.18;
      g.specialCd = null;
      g.specialCdMax = null;
      g.celestialDamageTunedV40 = true;
      created.push(g);
      run.foes.push(g);
    }
    const guards = run.foes.filter(f => f.hp > 0 && f.omegaGuard),
      spots = guards.length <= 2 ? [338, 472] : [310, 355, 455, 500, 290, 520];
    b._x = 405;
    guards.forEach((g, i) => (g._x = spots[i] || foeBaseX(i, guards.length)));
    for (let i = 0; i < 34; i++) {
      const ang = Math.random() * Math.PI * 2,
        rad = 18 + Math.random() * 75;
      particles.push({
        x: b._x + Math.cos(ang) * rad,
        y: GY - 30 + Math.sin(ang) * rad * 0.35,
        vx: Math.cos(ang) * 1.3,
        vy: Math.sin(ang) * 0.6,
        life: 1,
        sz: 2 + Math.random() * 2,
        col: i % 2 ? "#ffffff" : "#8ff8ff"
      });
    }
    buildFoeBars();
    drawBars();
    flash("#ffffff");
    softShake();
    floatDmg("foe", "Ω TWO GUARDS ANSWER", 0, "#ffffff", b._x);
    sayBoss("TWO WITNESSES. BOTH HAVE SEEN YOUR END.");
    prevResult186 = created;
    break prev186;
  }
  const created = prevResult186;
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const atkMul = T.omegaGuardAtk != null ? T.omegaGuardAtk : 0.55,
    critB = T.omegaGuardCrit != null ? T.omegaGuardCrit : 0.08;
  (created || []).forEach(g => {
    g.atk = Math.max(1, Math.round(g.atk * atkMul));
    g.enemyCritBonusV40 = critB;
  });
  return created;
}

function celestialCap() {
  return S.abyssUnlocked ? 13 : 10;
}

function celestialClose() {
  $("strike").classList.remove("on", "celestial");
  celestialMode = false;
  strikeLocked = false;
  renderTown();
  $("run").style.display = "none";
  $("town").style.display = "grid";
}

function celestialRearm(g) {
  const cap = celestialCap();
  if (!g || S.gear[S.sel] !== g || (g.celestial || 0) >= cap) {
    celestialClose();
    return;
  }
  const c = celestialCost(g);
  const canAfford =
    (g.celestial || 0) >= 10
      ? (c.cshards || 0) <= (S.celestialShards || 0) && S.gold >= c.gold
      : S.epicShards >= c.esh && S.gold >= c.gold;
  if (!canAfford) {
    $("baseodds").innerHTML =
      '<span style="color:#ffb07c">Not enough resources for another Celestial attempt.</span>';
    strikeLocked = true;
    $("strikebtn").disabled = true;
    $("strikedone").textContent = "✕ Done";
    return;
  }
  celestialMode = true;
  celHitsDone = 0;
  celProf = celestialProfile(g);
  celHitsNeeded = celProf.hits;
  pend = { g, c, paid: false };
  setupCelRound(g);
  try {
    setForgeHud(g, true);
  } catch (e) {}
  if ((g.celestial || 0) >= 10) {
    $("baseodds").innerHTML =
      '<span style="color:#c9b6ff">✦ ABYSSAL CELESTIAL ' +
      celProf.target +
      "/13</span> · land <b>3 perfect silver hits in a row</b> — a miss resets the sequence, never your level · " +
      (c.cshards || 0) +
      " ✺ + " +
      fmt(c.gold) +
      "g";
  } else {
    $("baseodds").innerHTML =
      '<span style="color:#9fd8ff">✦ CELESTIAL ' +
      celProf.target +
      "/10</span> · hit the silver " +
      (celHitsNeeded === 2 ? "<b>TWICE in one sequence</b>" : "once") +
      " · " +
      Math.round(celProf.chance * 100) +
      "% final roll after all hits · " +
      c.esh +
      "◆ + " +
      fmt(c.gold) +
      "g";
  }
  strikeLocked = false;
  $("strikebtn").disabled = false;
  $("strikebtn").innerHTML = 'CONTINUE ⚒ <span class="keyhint" style="opacity:.7">(space)</span>';
  $("strikedone").textContent = "✕ Done";
}

function finishForgeAttempt(g, warnAt10, broke, hold, success) {
  if (broke && !(S.flags && S.flags.firstShatterV50)) {
    S.flags = S.flags || {};
    S.flags.firstShatterV50 = true;
    try {
      scheduleSave();
    } catch (e) {}
    setTimeout(
      () => {
        try {
          showTip(
            "💥 SHATTERED",
            "A forge above +10 can critically fail and <b>shatter</b> the item: all of its stats are permanently cut in half (−50%), and it can no longer be upgraded, reforged, or Celestial-forged. A shattered piece can only be salvaged for shards.<br><br>Arm a <b>Forge Guard</b> from the 🛒 shop before a risky strike to absorb a shatter."
          );
        } catch (e) {}
      },
      Math.max(hold || 0, 900) + 150
    );
  }
  if (!broke) {
    setTimeout(() => {
      forgeContinue = { g, warnAt10, broke: false };
      strikeLocked = false;
      $("strikebtn").style.visibility = "visible";
      $("strikebtn").disabled = false;
      $("strikebtn").innerHTML = 'CONTINUE ⚒ <span class="keyhint" style="opacity:.7">(space)</span>';
      $("strikedone").textContent = "✕ Done";
    }, 420);
    return;
  }
  setTimeout(() => {
    leaveForge();
  }, hold);

  return;
}

/* A distinct climb through the Celestial Spire. */
function celestialSpireBg(a, tier) {
  const pal = [
      ["#163449", "#07141f", "#719bb0", "#9dd8e8"],
      ["#28275a", "#09091e", "#8d83d8", "#c9c4ff"],
      ["#624427", "#150d08", "#e2b663", "#fff0ae"],
      ["#dfefff", "#243847", "#ffffff", "#8de9ff"]
    ][tier] || ["#20293a", "#0f1420", "#718090", "#fff"],
    T = anim.t,
    g = ctx.createLinearGradient(0, 0, 0, CANVAS_LOGICAL_H);
  g.addColorStop(0, pal[0]);
  g.addColorStop(1, pal[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_LOGICAL_W, CANVAS_LOGICAL_H);
  ctx.save();
  if (run && run.a && run.a.abyss) {
    ctx.fillStyle = "#4c187744";
    ctx.fillRect(0, 0, CANVAS_LOGICAL_W, CANVAS_LOGICAL_H);
  }
  const altitude = [18, 42, 68, 92][tier];
  ctx.fillStyle = "#ffffff22";
  for (let i = 0; i < 7 - tier; i++) {
    const x = ((i * 113 + T * (4 + tier * 2)) % (CANVAS_LOGICAL_W + 120)) - 60,
      y = 130 - altitude + (i % 2) * 18;
    ctx.beginPath();
    ctx.ellipse(x, y, 55, 12, 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = pal[2] + "44";
  ctx.beginPath();
  ctx.moveTo(225, GY + 5);
  ctx.lineTo(268, 18 + tier * 8);
  ctx.lineTo(315, GY + 5);
  ctx.closePath();
  ctx.fill();
  const floors = 4 - tier;
  for (let i = 0; i < floors; i++) {
    const y = GY - 18 - i * 37 - tier * 6,
      w = 170 - i * 25;
    ctx.fillStyle = pal[2] + (tier === 3 ? "55" : "38");
    ctx.fillRect(280 - w / 2, y, w, 5);
    ctx.fillRect(270 - w / 2, y + 5, 10, Math.max(4, GY - y));
    ctx.fillRect(280 + w / 2 - 10, y + 5, 10, Math.max(4, GY - y));
  }
  if (tier === 0) {
    ctx.strokeStyle = pal[3] + "88";
    ctx.lineWidth = 2;
    for (let x = 35; x < 560; x += 82) {
      ctx.beginPath();
      ctx.moveTo(x, GY + 3);
      ctx.lineTo(x + 8, GY - 52);
      ctx.lineTo(x + 16, GY + 3);
      ctx.stroke();
    }
  }
  if (tier === 1) {
    ctx.strokeStyle = pal[3] + "99";
    for (let i = 0; i < 5; i++) {
      const x = 65 + i * 112;
      ctx.beginPath();
      ctx.arc(x, 88 + Math.sin(T + i) * 5, 18, 0, 7);
      ctx.stroke();
    }
  }
  if (tier === 2) {
    const sun = ctx.createRadialGradient(460, 48, 3, 460, 48, 52);
    sun.addColorStop(0, "#fffbd0dd");
    sun.addColorStop(1, "#e9a64000");
    ctx.fillStyle = sun;
    ctx.fillRect(405, -5, 110, 110);
    ctx.strokeStyle = pal[3] + "aa";
    ctx.strokeRect(245, 42, 70, 78);
  }
  if (tier === 3) {
    ctx.fillStyle = "#ffffff";
    for (let i = 0; i < 38; i++) {
      const x = (i * 79) % 560,
        y = (i * 31) % 118,
        s = 0.4 + 0.6 * Math.sin(T * 2 + i);
      ctx.globalAlpha = 0.25 + 0.7 * Math.abs(s);
      ctx.fillRect(x, y, i % 7 === 0 ? 3 : 1, i % 7 === 0 ? 3 : 1);
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "#dffcff";
    ctx.shadowColor = "#8de9ff";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(280, 55, 34 + Math.sin(T * 2) * 3, 0, 7);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  ctx.fillStyle = pal[2] + (tier === 3 ? "88" : "66");
  ctx.fillRect(0, GY + 4, CANVAS_LOGICAL_W, CANVAS_LOGICAL_H - GY);
  ctx.strokeStyle = pal[3] + "88";
  ctx.beginPath();
  ctx.moveTo(0, GY + 4);
  ctx.lineTo(CANVAS_LOGICAL_W, GY + 4);
  ctx.stroke();
}

function guardForItemV51(g) {
  if (!g) return null;
  const lvl = Number(g.ilvl) || 1;
  return Object.keys(GUARDS).find(k => lvl >= GUARDS[k].min && lvl <= GUARDS[k].max) || null;
}

function setForgeHud(g, cel) {
  let prevResult69;
  const old = forgeSnapshot,
    oldPlus = old ? old.plus : null,
    improved = !cel && old && g.plus > oldPlus && strikeLocked;
  {
    const cur = $("forgecur"),
      nxt = $("forgenext"),
      it = $("forgeitem");
    if (it) it.textContent = itemIcon(g);
    if (cel) {
      cur.textContent = "✦" + (g.celestial || 0);
      nxt.textContent = "✦" + Math.min(10, (g.celestial || 0) + 1);
    } else {
      cur.textContent = "+" + (g.plus || 0);
      nxt.textContent = "+" + Math.min(20, (g.plus || 0) + 1);
    }
    /* ---- setForgeHud: later layers (moved here) ---- */
    const next = JSON.parse(JSON.stringify(g));
    if (cel) next.celestial = Math.min(10, (g.celestial || 0) + 1);
    else next.plus = Math.min(20, (g.plus || 0) + 1);
    const a = $("forgecurrentstats"),
      b = $("forgenextstats"),
      cost = $("forgecost"),
      odds = $("baseodds");
    if (a) a.innerHTML = forgeStatsHtml(g);
    if (b)
      b.innerHTML = forgeStatsHtml(
        next,
        cel ? "Plus one guaranteed new affix on success" : "Expected stats at the next forge level"
      );
    if (cost && pend && pend.c) {
      const c = pend.c;
      cost.innerHTML =
        (c.gold ? '<div class="cg">● ' + fmt(c.gold) + " gold</div>" : "") +
        (c.shards ? '<div class="cs">◆ ' + fmt(c.shards) + " shards</div>" : "") +
        (c.esh ? '<div class="ce">◆ ' + fmt(c.esh) + " epic shards</div>" : "");
    }
    if (odds) {
      if (cel) {
        const cp = celestialProfile(g);
        odds.innerHTML =
          '<span style="color:#9fd8ff">Celestial ' +
          cp.target +
          " / 10</span> · " +
          cp.hits +
          " silver hit" +
          (cp.hits > 1 ? "s" : "") +
          " required · " +
          Math.round(cp.chance * 100) +
          "% final roll after all hits";
      } else
        odds.textContent =
          "Base " + Math.round(upOdds(g) * 100) + "% · Glow +25% · White core +5% critical forge chance";
    }
  }
  const right = $("forgenextstats");
  if (improved) {
    $("forgecur").textContent = "+" + oldPlus;
    $("forgenext").textContent = "+" + g.plus;
    $("forgecurrentstats").innerHTML = forgeStatsHtml(old);
    right.innerHTML = forgeStatsHtml(g);
    right.classList.add("result");
    setTimeout(() => right.classList.remove("result"), 760);
  }
  const it = $("forgeitem");
  if (it) it.innerHTML = itemIcon(g);
  if (cel) {
    const next = JSON.parse(JSON.stringify(g)),
      target = Math.min(10, (g.celestial || 0) + 1);
    next.celestial = target;
    $("forgenextstats").innerHTML = forgeStatsHtml(
      next,
      target === 10 ? "Celestial 10 awards one new affix" : "New affix unlocks at Celestial 10"
    );
  }
  if (!cel) {
    const gold = forgeOutcomeProfile(g, "gold"),
      silver = forgeOutcomeProfile(g, "silver"),
      miss = forgeOutcomeProfile(g, "miss"),
      bonus = Math.max(0, silver.success - gold.success),
      odds = $("baseodds");
    if (odds)
      odds.innerHTML =
        '<span style="color:#ffcf5c">Gold ' +
        Math.round(gold.success * 100) +
        '% success</span> · <span style="color:#dcecff">Silver +' +
        Math.round(bonus * 100) +
        '% success</span> · <span style="color:#ff8b7d">Miss ' +
        Math.round(miss.downChance * 100) +
        "% downgrade · " +
        Math.round(miss.breakChance * 100) +
        "% break</span>";
  }
  if (!cel && g) g.maxPlusReached = Math.max(g.maxPlusReached || 0, g.plus || 0);
  if (pend && pend.c && pend.c.cshards) {
    const cost = $("forgecost");
    if (cost)
      cost.innerHTML += '<div style="color:var(--mythic)">✺ ' + pend.c.cshards + " Celestial shards</div>";
  }
  updateForgeBalances();

  const result = prevResult69;
  if (cel && g && g.rar === 5 && S.abyssUnlocked) {
    const odds = $("baseodds"),
      nxt = $("forgenext");
    if (odds) odds.innerHTML = odds.innerHTML.replace(/\/10/g, "/13");
    if (nxt) nxt.textContent = "✦" + Math.min(13, (g.celestial || 0) + 1);
  }
  return result;
}

function smithSpeedV53(g) {
  const raw = 2.6 + Math.max(0, Number(g && g.plus) || 0) * 0.34;
  return g && (g.plus || 0) === 19 ? raw : Math.min(raw, SMITH_PLUS_NINE_SPEED);
}

function advanceSmithMarkerV53(now) {
  const frame = 1000 / 60,
    dt = smithFrameTime == null ? frame : Math.min(50, Math.max(0, now - smithFrameTime));
  smithFrameTime = now;
  const speed = celestialMode ? sSpeed : smithSpeedV53(pend && pend.g);
  sPos += sDir * speed * (dt / frame);
  if (sPos >= 316) {
    sPos = 316;
    sDir = -1;
  }
  if (sPos <= 0) {
    sPos = 0;
    sDir = 1;
  }
  const marker = $("pmark");
  if (marker) marker.style.left = sPos + "px";
  return sPos;
}

function uniformReforgeRoll(old, stat) {
  if (old.slot === "weapon" && old.wtype === "dagger" && stat === "atkSpeed")
    return Math.round((15 + old.rar * 3.2) * (0.7 + Math.random() * 0.6));
  if (old.slot === "weapon" && old.wtype === "bow" && stat === "atkSpeed")
    return Math.round((4 + old.rar * 1.5) * (0.7 + Math.random() * 0.6));
  if (old.slot === "weapon" && old.wtype === "bow" && stat === "critChance")
    return Math.round(bowBaseCrit(old.rar, 0.7 + Math.random() * 0.6) * 10) / 10;
  const max = maxBaseRoll(old, stat),
    v = max * (0.7 / 1.3 + Math.random() * (0.6 / 1.3));
  return roundRaw(stat, v);
}

/* A coloured forge hit may fail cleanly, but only a real miss may downgrade or shatter. */
function forgeOutcomeProfile(g, zone) {
  let prevResult76;
  prev76: {
    const eligible = (g.plus || 0) >= 10,
      sb = skillBonuses(),
      base = upOdds(g);
    if (zone === "silver") {
      prevResult76 = {
        zone,
        success: Math.min(0.98, base + 0.15),
        downChance: eligible ? 0.12 : 0,
        breakChance: 0
      };
      break prev76;
    }
    if (zone === "gold") {
      prevResult76 = { zone, success: base, downChance: eligible ? 0.24 : 0, breakChance: 0 };
      break prev76;
    }
    prevResult76 = {
      zone,
      success: 0,
      downChance: eligible ? 0.48 : 0,
      breakChance: eligible && !sb.insured ? Math.max(0.03, 0.15 - sb.critFailCut) : 0
    };
    break prev76;
  }
  const p = prevResult76;
  if (zone !== "miss") {
    p.downChance = 0;
    p.breakChance = 0;
  }
  return p;
}

/* Celestial retry exhaustion previously left the shared strike button disabled. */
function resetNormalForgeState() {
  celestialMode = false;
  strikeLocked = false;
  const b = $("strikebtn");
  if (b) {
    b.disabled = false;
    b.style.visibility = "visible";
  }
  const d = $("strikedone");
  if (d) d.textContent = "✕ Done";
}

function leaveForge() {
  resetNormalForgeState();
  forgeContinue = null;
  $("strike").classList.remove("on", "celestial", "compareview");
  $("run").style.display = "none";
  $("town").style.display = "grid";
  strikeLocked = false;
  renderTown();

  return;
}

/* V65 · Celestial shard drops throughout the Abyss. */
function abyssCelestialShardDrop(f) {
  if (!f || f.noDrop || !run || !run.a || !run.a.abyss || run.dummy) return 0;
  if (f.superElite) return 5;
  if (f.elite || f.abyssElite) return 1;
  return Math.random() < 0.01 ? 1 : 0;
}

/* V66 · Epic shard exchange for Celestial shards. */
function celestialExchangeHistory(state = S) {
  if (!state) return false;
  if (state.celestialExchangeUnlockedV66 || (Number(state.celestialShards) || 0) > 0 || state.abyssUnlocked)
    return true;
  return Array.isArray(state.clearedAreas) && state.clearedAreas.some(ai => Number(ai) >= 13);
}

function convertEpicToCelestial(epic, celestial) {
  epic = Number(epic);
  celestial = Number(celestial);
  if (!((epic === 100 && celestial === 1) || (epic === 1000 && celestial === 10))) return false;
  if (!recordCelestialExchangeUnlock() || (Number(S.epicShards) || 0) < epic) return false;
  S.epicShards -= epic;
  S.celestialShards = (Number(S.celestialShards) || 0) + celestial;
  S.celestialExchangeUnlockedV66 = true;
  try {
    beep(820, 0.11, "triangle");
    flash("#c9b6ff");
  } catch (e) {}
  try {
    scheduleSave();
  } catch (e) {}
  try {
    updateForgeBalances();
  } catch (e) {}
  return true;
}

function addCelestialExchangeCard(grid, epic, celestial) {
  const card = document.createElement("div");
  card.className = "shopcard celestialexchangev66";
  card.innerHTML =
    '<div class="sn" style="color:#c9b6ff">✺ Celestial Exchange</div><div class="sd">Convert ' +
    fmt(epic) +
    " Epic Shards into " +
    celestial +
    " Celestial Shard" +
    (celestial === 1 ? "" : "s") +
    '.</div><div class="sown">Owned: ' +
    fmtCur(S.epicShards) +
    " Epic · " +
    fmtCur(S.celestialShards || 0) +
    ' Celestial</div><button class="cel">Convert ' +
    fmt(epic) +
    " Epic → " +
    celestial +
    " Celestial</button>";
  const btn = card.querySelector("button");
  btn.disabled = (Number(S.epicShards) || 0) < epic;
  btn.onclick = () => {
    if (convertEpicToCelestial(epic, celestial)) {
      renderShop();
      renderTown();
    }
  };
  grid.appendChild(card);
  return card;
}

function showCelestialShard(amount) {
  if (Number(amount) > 0) S.celestialExchangeUnlockedV66 = true;
  const d = document.createElement("div");
  d.className = "celestialburst";
  d.innerHTML = "✺<span>CELESTIAL SHARD " + (amount > 1 ? "×" + amount : "") + "</span>";
  document.body.appendChild(d);
  flash("#27cdbf");
  chord([440, 660, 990], 0.4);
  setTimeout(() => d.remove(), 2100);

  return;
}

function updateForgeBalances() {
  recordCelestialExchangeUnlock();
  const gold = $("gold"),
    sh = $("shards"),
    ep = $("eshards"),
    ce = $("celestialshards"),
    bal = $("forgebalancev36");
  if (gold) gold.textContent = fmtCur(S.gold);
  if (sh) sh.textContent = fmtCur(S.shards);
  if (ep) ep.textContent = fmtCur(S.epicShards);
  if (ce) ce.textContent = fmtCur(S.celestialShards || 0);
  if (bal) {
    bal.style.display = "none";
    bal.innerHTML = "";
  }

  return;
}

function conversionMaximum(kind, state = S) {
  const amount = kind === "regular" ? Number(state.shards) || 0 : Number(state.epicShards) || 0;
  return Math.max(0, Math.floor(amount / 100));
}

function convertCurrency(kind, units) {
  units = Math.floor(Number(units) || 0);
  if (!["regular", "epic"].includes(kind) || units < 1) return false;
  const max = conversionMaximum(kind);
  if (units > max) return false;
  if (kind === "epic" && !(window.forgeV66 && window.forgeV66.unlock())) return false;
  if (kind === "regular") {
    S.shards -= units * 100;
    S.epicShards += units;
  } else {
    S.epicShards -= units * 100;
    S.celestialShards = (Number(S.celestialShards) || 0) + units;
    S.celestialExchangeUnlockedV66 = true;
  }
  conversionSelection[kind] = 1;
  try {
    beep(kind === "regular" ? 760 : 820, 0.11, "triangle");
    flash(kind === "regular" ? cvar("--epic") : "#c9b6ff");
  } catch (e) {}
  try {
    scheduleSave();
  } catch (e) {}
  try {
    updateForgeBalances();
  } catch (e) {}
  return true;
}

function addCurrencySlider(grid, kind) {
  const regular = kind === "regular",
    max = conversionMaximum(kind),
    available = regular ? Number(S.shards) || 0 : Number(S.epicShards) || 0;
  const source = regular ? "Shards" : "Epic Shards",
    target = regular ? "Epic Shards" : "Celestial Shards",
    col = regular ? "var(--epic)" : "#c9b6ff";
  let units = Math.min(Math.max(1, conversionSelection[kind] || 1), Math.max(1, max));
  conversionSelection[kind] = units;
  const card = document.createElement("div");
  card.className = "shopcard conversionsliderv67 " + kind;
  card.innerHTML =
    '<div class="sn" style="color:' +
    col +
    '">' +
    (regular ? "◆ Shard Refinement" : "✺ Celestial Exchange") +
    '</div><div class="sd">Every 100 ' +
    source +
    " becomes 1 " +
    target +
    '. Choose how many conversions to make.</div><div class="sown">Owned: ' +
    fmt(available) +
    " " +
    source +
    '</div><div class="conversionreadoutv67"></div><input class="conversionrangev67" type="range" min="1" max="' +
    Math.max(1, max) +
    '" value="' +
    units +
    '"' +
    (max < 1 ? " disabled" : "") +
    '><div class="conversionlimitsv67"><span>1</span><span>All possible · ' +
    fmt(max) +
    '</span></div><button class="cel"' +
    (max < 1 ? " disabled" : "") +
    "></button>";
  const range = card.querySelector("input"),
    readout = card.querySelector(".conversionreadoutv67"),
    btn = card.querySelector("button");
  const sync = () => {
    units = Math.min(Math.max(1, Math.floor(Number(range.value) || 1)), Math.max(1, conversionMaximum(kind)));
    conversionSelection[kind] = units;
    const cost = units * 100;
    readout.textContent =
      fmt(units) +
      " conversion" +
      (units === 1 ? "" : "s") +
      " · " +
      fmt(cost) +
      " " +
      source +
      " → " +
      fmt(units) +
      " " +
      target;
    btn.textContent = "Convert " + fmt(cost) + " " + source + " → " + fmt(units) + " " + target;
    btn.disabled = conversionMaximum(kind) < units;
  };
  range.oninput = sync;
  range.onchange = sync;
  btn.onclick = () => {
    if (convertCurrency(kind, units)) {
      renderShop();
      renderTown();
    }
  };
  sync();
  grid.appendChild(card);
  return card;
}

function celestialAmp(g) {
  return 1 + Math.max(0, Math.min(5, ((g && g.celestial) || 0) - 5)) * 0.1;
}
