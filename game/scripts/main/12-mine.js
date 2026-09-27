/* The Deep Mine: crew, cart, earnings, upgrades. */

function freshMine() {
  return {
    level: 0,
    lastAt: Date.now(),
    bankGold: 0,
    bankShards: 0,
    bankEpic: 0,
    bankCelestial: 0,
    totalGold: 0,
    totalShards: 0,
    totalEpic: 0,
    totalCelestial: 0,
    claims: 0,
    celestialUnlockedV90: false,
    upgradesV84: { gold: 0, shards: 0, speed: 0, luck: 0, epic: 0, celestial: 0 },
    storedCyclesV84: 0,
    carryMsV84: 0,
    batchSeqV84: 0,
    lastBatchV84: null
  };
}

function ensureMine(state = S) {
  const fresh = freshMine();
  let m = state.mineV83 && typeof state.mineV83 === "object" ? state.mineV83 : {};
  const oldLevel = Math.max(0, Math.floor(Number(m.level) || 0));
  state.mineV83 = Object.assign(fresh, m);
  m = state.mineV83;
  m.upgradesV84 = Object.assign({}, fresh.upgradesV84, m.upgradesV84 || {});
  if (!m.migratedV84 && oldLevel > 1) {
    m.upgradesV84.gold = Math.max(Number(m.upgradesV84.gold) || 0, Math.min(10, oldLevel - 1));
    m.upgradesV84.shards = Math.max(Number(m.upgradesV84.shards) || 0, Math.min(10, oldLevel - 1));
    m.migratedV84 = true;
  }
  Object.keys(MINE_UPGRADES).forEach(
    k => (m.upgradesV84[k] = Math.max(0, Math.min(MINE_MAX_LEVEL, Math.floor(Number(m.upgradesV84[k]) || 0))))
  );
  m.level = oldLevel > 0 ? 1 : 0;
  m.lastAt = Math.max(0, Number(m.lastAt) || Date.now());
  [
    "bankGold",
    "bankShards",
    "bankEpic",
    "bankCelestial",
    "totalGold",
    "totalShards",
    "totalEpic",
    "totalCelestial"
  ].forEach(k => (m[k] = Math.max(0, Number(m[k]) || 0)));
  m.claims = Math.max(0, Math.floor(Number(m.claims) || 0));
  m.storedCyclesV84 = Math.max(0, Math.floor(Number(m.storedCyclesV84) || 0));
  m.carryMsV84 = Math.max(0, Number(m.carryMsV84) || 0);
  m.batchSeqV84 = Math.max(0, Math.floor(Number(m.batchSeqV84) || 0));
  if ((Number(state.celestialShards) || 0) > 0 || state.celestialExchangeUnlockedV66 || state.abyssUnlocked)
    m.celestialUnlockedV90 = true;
  return m;
}

function mineUnlockedV83(state = S) {
  return (
    (state.clearedAreas || []).includes(MINE_UNLOCK_AREA) || Number(state.areaMax) >= MINE_UNLOCK_AREA + 1
  );
}

function mineProfile(m = ensureMine(), state = S) {
  const u = m.upgradesV84 || {},
    level = Math.max(1, Number(state.heroLevel) || 1),
    cycleMs = Math.max(5000, Math.round(15000 * Math.pow(0.91, Number(u.speed) || 0))),
    epicRank = Number(u.epic) || 0,
    celestialRank = Number(u.celestial) || 0,
    baseGold = Math.round(8 + 0.12 * Math.pow(level, 1.8));
  return {
    level,
    cycleMs,
    baseGold,
    gold: Math.round(baseGold * (1 + 0.25 * (Number(u.gold) || 0))),
    shardChance: Math.min(0.9, 0.28 + 0.055 * (Number(u.shards) || 0)),
    shardAmount: 1 + Math.floor(level / 40) + Math.floor((Number(u.shards) || 0) / 3),
    epicChance: epicRank ? Math.min(0.04, 0.002 + 0.0033 * epicRank) : 0,
    epicAmount: 1 + (epicRank >= 7 ? 1 : 0),
    celestialChance: celestialRank ? Math.min(0.015, 0.0005 + 0.00075 * celestialRank) : 0,
    celestialAmount: 1 + (celestialRank >= 8 ? 1 : 0),
    doubleChance: Math.min(0.5, 0.05 + 0.045 * (Number(u.luck) || 0)),
    maxCycles: Math.floor(MINE_CAP_MS / cycleMs)
  };
}

function mineRates() {
  return mineProfile();
}

function mineCaps() {
  const p = mineProfile();
  return { cycles: p.maxCycles, maxMs: MINE_CAP_MS };
}

function settleMineV83(now = Date.now(), state = S) {
  const m = ensureMine(state),
    time = Math.max(m.lastAt, Number(now) || Date.now());
  if (!mineUnlockedV83(state)) {
    m.level = 0;
    m.lastAt = time;
    m.carryMsV84 = 0;
    return m;
  }
  if (m.level < 1) m.level = 1;
  const p = mineProfile(m, state),
    room = Math.max(0, p.maxCycles - m.storedCyclesV84),
    elapsed = Math.max(0, time - m.lastAt) + m.carryMsV84,
    cycles = Math.min(Math.floor(elapsed / p.cycleMs), room);
  m.lastAt = time;
  if (cycles < 1) {
    m.carryMsV84 = room > 0 ? Math.min(elapsed, p.cycleMs - 1) : 0;
    return m;
  }
  let gold = 0,
    shards = 0,
    epic = 0,
    celestial = 0,
    doubles = 0;
  for (let i = 0; i < cycles; i++) {
    const doubled = Math.random() < p.doubleChance ? 2 : 1;
    if (doubled === 2) doubles++;
    gold += p.gold * doubled;
    if (Math.random() < p.shardChance) shards += p.shardAmount * doubled;
    if (p.epicChance && Math.random() < p.epicChance) epic += p.epicAmount * doubled;
    if (m.celestialUnlockedV90 && p.celestialChance && Math.random() < p.celestialChance)
      celestial += p.celestialAmount * doubled;
  }
  m.bankGold += gold;
  m.bankShards += shards;
  m.bankEpic += epic;
  m.bankCelestial += celestial;
  m.storedCyclesV84 += cycles;
  m.carryMsV84 = m.storedCyclesV84 >= p.maxCycles ? 0 : elapsed - cycles * p.cycleMs;
  m.batchSeqV84++;
  m.lastBatchV84 = { seq: m.batchSeqV84, gold, shards, epic, celestial, cycles, doubles };
  return m;
}

function mineUpgradeCost(type, m = ensureMine()) {
  const def = MINE_UPGRADES[type];
  if (!def) return Infinity;
  return def.base + (Number(m.upgradesV84[type]) || 0);
}

function mineQuestPoints() {
  const q = window.forgeV74 && window.forgeV74.state ? window.forgeV74.state() : S.questV74;
  return q && Math.max(0, Number(q.points) || 0);
}

function claimMine() {
  const m = settleMineV83(),
    gold = Math.floor(m.bankGold),
    shards = Math.floor(m.bankShards),
    epic = Math.floor(m.bankEpic),
    celestial = Math.floor(m.bankCelestial);
  if (gold < 1 && shards < 1 && epic < 1 && celestial < 1) return false;
  m.bankGold -= gold;
  m.bankShards -= shards;
  m.bankEpic -= epic;
  m.bankCelestial -= celestial;
  m.storedCyclesV84 = 0;
  m.totalGold += gold;
  m.totalShards += shards;
  m.totalEpic += epic;
  m.totalCelestial += celestial;
  m.claims++;
  S.gold = (Number(S.gold) || 0) + gold;
  S.shards = (Number(S.shards) || 0) + shards;
  S.epicShards = (Number(S.epicShards) || 0) + epic;
  S.celestialShards = (Number(S.celestialShards) || 0) + celestial;
  if (S.questV74 && S.questV74.stats)
    S.questV74.stats.goldCollected = (Number(S.questV74.stats.goldCollected) || 0) + gold;
  try {
    flash("#e9ad4f");
    chord([392, 523, 659], 0.35);
    scheduleSave();
    if (window.forgeV74) window.forgeV74.evaluate(true);
  } catch (e) {}
  renderMineV83();
  renderTown();
  return { gold, shards, epic, celestial };
}

function upgradeMine(type) {
  if (!MINE_UPGRADES[type]) return false;
  const m = settleMineV83();
  if (m.upgradesV84[type] >= MINE_MAX_LEVEL) return false;
  const cost = mineUpgradeCost(type, m),
    q = window.forgeV74 && window.forgeV74.state ? window.forgeV74.state() : S.questV74;
  if (!q || Number(q.points) < cost) return false;
  q.points -= cost;
  m.upgradesV84[type]++;
  m.lastAt = Date.now();
  try {
    beep(620 + m.upgradesV84[type] * 22, 0.13, "triangle", 0.09);
    flash("#d79535");
    scheduleSave();
  } catch (e) {}
  renderMineV83();
  renderTown();
  return true;
}

function fmtMineTime(ms) {
  const secs = Math.max(0, Math.ceil(ms / 1000));
  if (secs < 60) return secs + "s";
  const mins = Math.ceil(secs / 60);
  if (mins < 60) return mins + "m";
  const h = Math.floor(mins / 60),
    m = mins % 60;
  return h + "h" + (m ? " " + m + "m" : "");
}

function mineFullness(m) {
  if (!m || m.level < 1) return 0;
  const p = mineProfile(m);
  return Math.max(0, Math.min(1, m.storedCyclesV84 / Math.max(1, p.maxCycles)));
}

function animateMineReturn(batch) {
  if (!batch || !$("minev83") || !$("minev83").classList.contains("on")) return;
  const miner = document.querySelector("#minev83 .minercrewv83:not(.second)"),
    layer = $("minefloatlayerv84");
  if (miner) {
    miner.classList.remove("returningv84");
    void miner.offsetWidth;
    miner.classList.add("returningv84");
    setTimeout(() => miner.classList.remove("returningv84"), 2850);
  }
  if (layer)
    setTimeout(() => {
      if (!layer.isConnected) return;
      const pop = document.createElement("div");
      pop.className = "minefloatv84";
      pop.textContent =
        (batch.doubles ? "DOUBLE HAUL · " : "") +
        "+" +
        fmt(batch.gold) +
        " gold" +
        (batch.shards ? " · +" + fmt(batch.shards) + " blue" : "") +
        (batch.epic ? " · +" + fmt(batch.epic) + " Epic" : "") +
        (batch.celestial ? " · +" + fmt(batch.celestial) + " Celestial" : "");
      layer.appendChild(pop);
      setTimeout(() => pop.remove(), 2300);
    }, 2050);
}

function setupMineUI() {
  const res = document.querySelector(".res"),
    guild = $("guildbtnv70");
  if (res && guild) {
    let button = $("minebtnv83");
    if (!button) {
      button = document.createElement("button");
      button.id = "minebtnv83";
      button.className = "minerbtnv83";
      button.type = "button";
      button.title = "Open the Deep Mine";
      button.onclick = openMine;
    }
    button.textContent = "⛏ Mine";
    guild.insertAdjacentElement("afterend", button);
  }
  if (!$("minev83")) {
    const d = document.createElement("div");
    d.id = "minev83";
    d.className = "skover";
    d.innerHTML =
      '<div class="skbox mineboxv83"><div class="mineheadv83"><h2>⛏ THE DEEP MINE</h2></div><div class="minescenev83"><div class="minetunnelv83"></div><i class="minegemv83 g1"></i><i class="minegemv83 g2"></i><i class="minegemv83 g3"></i><div class="minercrewv83"><i class="minerhelmv83"></i><i class="minerheadv83"></i><i class="minerbodyv83"></i><i class="minerpickv83"></i></div><div class="minercrewv83 second"><i class="minerhelmv83"></i><i class="minerheadv83"></i><i class="minerbodyv83"></i><i class="minerpickv83"></i></div><div class="mineorev83">◆</div><div class="minecartv83"></div><div id="minefloatlayerv84" class="minefloatlayerv84"></div></div><div class="minegridv83"><section class="minecardv83"><h3>Mining crew</h3><div id="minelevelv83" class="minelevelv83">Active</div><div id="mineratesv83" class="mineratesv83"></div></section><section class="minecardv83"><h3>Ore cart</h3><div id="minependingv83" class="minependingv83"></div><div class="minebarv83"><i id="minebarfillv83"></i></div><div id="minecapv83" class="minecapv83"></div><div class="mineactionsv83"><button id="mineclaimv83">Claim earnings</button></div></section></div><div id="mineqpv84" class="mineqpv84"></div><div id="mineupgradesv84" class="mineupgradesv84"></div><button class="ghost mineclosev83" id="closeminev83">Close</button></div>';
    document.body.appendChild(d);
    $("closeminev83").onclick = () => d.classList.remove("on");
  }
  return $("minev83");
}

function renderMineV83() {
  const d = setupMineUI(),
    button = $("minebtnv83"),
    unlocked = mineUnlockedV83();
  if (button) button.classList.toggle("on", unlocked);
  if (!unlocked) return;
  const m = settleMineV83(),
    p = mineProfile(m),
    full = mineFullness(m),
    claim = $("mineclaimv83"),
    qp = mineQuestPoints();
  $("minelevelv83").textContent = "Level " + Math.floor(p.level) + " crew";
  $("mineratesv83").innerHTML =
    "One trip every <b>" +
    fmtMineTime(p.cycleMs) +
    '</b><br><b style="color:var(--gold)">' +
    fmt(p.gold) +
    ' gold</b> each trip · level scaled<br><b style="color:var(--rare)">' +
    Math.round(p.shardChance * 100) +
    "% blue shard chance</b> · " +
    p.shardAmount +
    " per find" +
    (p.epicChance
      ? '<br><b style="color:var(--epic)">' +
        (p.epicChance * 100).toFixed(1) +
        "% Epic Shard chance</b> · " +
        p.epicAmount +
        " per find"
      : "") +
    (m.celestialUnlockedV90 && p.celestialChance
      ? '<br><b style="color:var(--mythic)">' +
        (p.celestialChance * 100).toFixed(2) +
        "% Celestial Shard chance</b> · " +
        p.celestialAmount +
        " per find"
      : "") +
    "<br><b>" +
    Math.round(p.doubleChance * 100) +
    "% double haul chance</b>";
  $("minependingv83").innerHTML =
    '<span style="color:var(--gold)">' +
    fmt(Math.floor(m.bankGold)) +
    ' gold</span><br><span style="color:var(--rare)">' +
    fmt(Math.floor(m.bankShards)) +
    " blue shards</span>" +
    (Math.floor(m.bankEpic)
      ? '<br><span style="color:var(--epic)">' + fmt(Math.floor(m.bankEpic)) + " Epic Shards</span>"
      : "") +
    (Math.floor(m.bankCelestial)
      ? '<br><span style="color:var(--mythic)">' +
        fmt(Math.floor(m.bankCelestial)) +
        " Celestial Shards</span>"
      : "");
  $("minebarfillv83").style.width = (full * 100).toFixed(1) + "%";
  const remain = Math.max(0, (p.maxCycles - m.storedCyclesV84) * p.cycleMs - m.carryMsV84);
  $("minecapv83").textContent = full >= 0.999 ? "The cart is full." : fmtMineTime(remain) + " until full.";
  $("mineqpv84").innerHTML = "QUEST POINT IMPROVEMENTS · <b>" + fmt(qp) + " QP available</b>";
  const grid = $("mineupgradesv84");
  grid.innerHTML = "";
  Object.entries(MINE_UPGRADES)
    .filter(([type]) => type !== "celestial" || m.celestialUnlockedV90)
    .forEach(([type, def]) => {
      const level = m.upgradesV84[type],
        cost = mineUpgradeCost(type, m),
        card = document.createElement("section");
      card.className = "mineupgradev84";
      card.innerHTML =
        "<b>" +
        def.name +
        " · " +
        level +
        " / " +
        MINE_MAX_LEVEL +
        "</b><small>" +
        def.copy +
        "</small><button " +
        (level >= MINE_MAX_LEVEL || qp < cost ? "disabled" : "") +
        ">" +
        (level >= MINE_MAX_LEVEL ? "Maximum level" : "Upgrade · " + cost + " QP") +
        "</button>";
      card.querySelector("button").onclick = () => upgradeMine(type);
      grid.appendChild(card);
    });
  const ready = [m.bankGold, m.bankShards, m.bankEpic, m.bankCelestial].some(v => Math.floor(v) > 0);
  claim.disabled = !ready;
  claim.classList.toggle("claimreadyv83", ready);
  claim.onclick = claimMine;
  if (button) button.classList.toggle("ready", ready);
  if (d.classList.contains("on") && m.lastBatchV84 && m.lastBatchV84.seq !== mineShownBatch) {
    mineShownBatch = m.lastBatchV84.seq;
    animateMineReturn(m.lastBatchV84);
  }
  return d;
}

function openMine() {
  if (!mineUnlockedV83()) return;
  const d = renderMineV83();
  d.classList.add("on");
}
