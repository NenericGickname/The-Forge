/* Quests, onboarding guidance, feature unlocks, notices. */

function salvageUnlockedBag() {
  const salvage = (S.bag || []).filter(g => !g.locked);
  if (!salvage.length) {
    beep(150, 0.07, "square", 0.04);
    return;
  }
  let shards = 0,
    epic = 0;
  salvage.forEach(g => {
    shards += salvageValueV12(g);
    if (g.rar >= 3) epic += g.rar - 2;
  });
  S.shards += shards;
  S.epicShards += epic;
  S.bag = S.bag.filter(g => g.locked);
  beep(420, 0.1, "triangle");
  flash(cvar("--rare"));
  scheduleSave();
  renderTown();
}

function targetClears(heroLevel) {
  const lv = Math.max(1, Math.floor(Number(heroLevel) || 1));
  if (lv <= 50) return 2 + 18 * Math.max(0, Math.min(1, (lv - 3) / 47));
  return 20 + 0.3 * (lv - 50);
}

function firstCombatGuideNeeded() {
  return (
    !(S.flags && S.flags.firstCombatStartedV49) &&
    Number(S.areaMax || 0) === 0 &&
    (!S.clearedAreas || !S.clearedAreas.length) &&
    Number(S.totalKills || 0) === 0 &&
    lastArea == null
  );
}

function recordCelestialExchangeUnlock(state = S) {
  if (!state) return false;
  if (celestialExchangeHistory(state)) state.celestialExchangeUnlockedV66 = true;
  return !!state.celestialExchangeUnlockedV66;
}

/* Only existing progression milestones are offered as tracked goals. */
function masteryGoal() {
  const abyss = !!(S.abyssUnlocked && S.abyssMode),
    map = abyss ? S.abyssAreaClearsV51 || {} : S.areaClearsV51 || {},
    ai =
      lastArea != null
        ? Math.max(0, Math.min(AREAS.length - 1, lastArea))
        : Math.max(0, Math.min(AREAS.length - 1, S.areaMax || 0)),
    n = Number(map[ai]) || 0,
    next = [3, 10, 25].find(x => n < x);
  if (!next) return null;
  return {
    icon: "◆",
    title: (abyss ? "Abyss " : "") + AREAS[ai].n + " mastery",
    meta: n + " of " + next + " clears",
    p: n / next
  };
}

function forgeGoal() {
  const g = S.gear && S.gear.weapon;
  if (!g || g.broken)
    return {
      icon: "⚒",
      title: "Find and equip a weapon",
      meta: "Your first forge project starts with a weapon",
      p: 0
    };
  const plus = g.plus || 0,
    target = [10, 15, 20].find(n => plus < n);
  if (target)
    return {
      icon: itemIcon(g),
      title: "Upgrade your weapon to +" + target,
      meta: "Forge level " + plus + " of " + target,
      p: plus / target
    };
  const cap =
    window.abyssAPIv50 && typeof window.abyssAPIv50.cap === "function" ? window.abyssAPIv50.cap() : 10;
  if ((g.celestial || 0) < cap)
    return {
      icon: "✦",
      title: g.name + " Celestial path",
      meta: "Celestial " + (g.celestial || 0) + " of " + cap,
      p: (g.celestial || 0) / cap
    };
  return null;
}

function bloodGoal() {
  const g = S.sel && S.gear && S.gear[S.sel];
  if (!g || !g.growth) return null;
  const h = ensureHistory(g),
    kills = g.growth.kills || 0,
    cap = 500;
  return {
    icon: "♥",
    title: g.name + " Blood Growth",
    meta: fmt(kills) + " of " + fmt(cap) + " kills",
    p: kills / cap
  };
}

function stageGoal() {
  const i = Math.max(0, Math.min(AREAS.length - 1, S.areaMax || 0)),
    done = (S.clearedAreas || []).includes(i);
  if (done && i >= AREAS.length - 1) return null;
  const ai = done ? Math.min(AREAS.length - 1, i + 1) : i,
    a = AREAS[ai];
  return { icon: a.sp, title: "Defeat " + a.boss, meta: "Clear " + a.n + " to open the next stage", p: 0 };
}

function goals() {
  return [
    stageGoal(),
    forgeGoal(),
    contractGoal(),
    bloodGoal(),
    masteryGoal(),
    archiveGoal(),
    bestiaryGoal()
  ].filter(Boolean);
}

function renderGoal() {
  const rail = $("goalrailv70");
  if (!rail) return;
  const list = goals();
  if (!list.length) {
    rail.innerHTML =
      '<div class="goalcopyv70"><div class="goalheadv70">QUESTS COMPLETE</div><div class="goaltitlev70">No active guidance quests</div></div>';
    return;
  }
  S.goalIndexV70 = Math.max(0, Math.min(list.length - 1, S.goalIndexV70 || 0));
  const g = list[S.goalIndexV70];
  rail.innerHTML =
    '<div class="questiconsv72">' +
    list
      .map(
        (q, i) =>
          '<button type="button" class="questiconv72 ' +
          (i === S.goalIndexV70 ? "active" : "") +
          '" data-q="' +
          i +
          '" title="' +
          q.title +
          '">' +
          q.icon +
          "</button>"
      )
      .join("") +
    '</div><div class="goalsigilv70">' +
    g.icon +
    '</div><div class="goalcopyv70"><div class="goalheadv70">ACTIVE QUESTS</div><div class="goaltitlev70">' +
    g.title +
    '</div><div class="goalmetav70">' +
    g.meta +
    '</div><div class="goaltrackv70"><i style="width:' +
    Math.max(2, Math.min(100, g.p * 100)) +
    '%"></i></div></div>';
  rail.querySelectorAll(".questiconv72").forEach(
    b =>
      (b.onclick = () => {
        S.goalIndexV70 = Number(b.dataset.q) || 0;
        scheduleSave();
        renderGoal();
      })
  );
}

function setupGoal() {
  if ($("goalrailv70")) return;
  const area = $("areas") && $("areas").closest(".panel");
  if (!area) return;
  const rail = document.createElement("div");
  rail.id = "goalrailv70";
  rail.className = "panel full goalrailv70";
  area.parentNode.insertBefore(rail, area);
  renderGoal();
}

function enemyResearch(key, t, k) {
  if (!k) return "Defeat this creature to begin research.";
  let rows = ["Kills: " + fmt(k)];
  if (k >= 3) rows.push("Vitality " + tendency(t.hpM || 1) + " · Attack " + tendency(t.atkM || 1));
  if (k >= 7) rows.push(resistText(t.res));
  if (k >= 15) {
    const special =
      key === "shaman"
        ? "Channels Spirit Mend"
        : key === "plaguefrog"
          ? "Casts Plague Spit"
          : key === "thornling"
            ? "Raises a Thorn Ward"
            : "Standard combat pattern";
    rows.push(special);
  }
  return rows.join("<br>");
}

function bossResearch(a, k) {
  if (!k) return "Defeat this boss to begin research.";
  let rows = ["Victories: " + fmt(k)];
  if (k >= 2) rows.push("Area depth " + a.lvl + " · " + a.waves + " approach waves");
  if (k >= 4)
    rows.push(
      "Signature: " +
        ((MECHS[AREAS.indexOf(a)] && MECHS[AREAS.indexOf(a)].name) || a.gimmick || "Direct assault")
    );
  return rows.join("<br>");
}

function emptyQuestState() {
  return {
    points: 0,
    completed: {},
    ready: {},
    accepted: {},
    tracked: [],
    stats: {
      bosses: 0,
      elites: 0,
      superElites: 0,
      goldCollected: 0,
      damage: 0,
      highestHit: 0,
      maxPlus: 0,
      maxCel: 0,
      maxMythicCel: 0,
      maxSetPlus: 0,
      maxSetCel: 0,
      maxMythicArmor: 0,
      bloodSeen: 0,
      bloodKills: 0,
      bloodFull: 0,
      bloodFullKills: 0,
      maxItemKills: 0,
      maxItemBosses: 0,
      maxItemVictories: 0,
      legacyEnd: 0,
      legacyOmega1000: 0,
      legacyOmega10000: 0,
      rarity: 0,
      abyssEntered: 0,
      rushEntered: 0,
      rushBest: 0,
      rushComplete: 0,
      abyssRushEntered: 0,
      abyssRushBest: 0,
      abyssRushComplete: 0,
      lastGoldWallet: 0
    }
  };
}

function ensureQuestState(state = S) {
  const d = emptyQuestState();
  state.questV74 = state.questV74 || {};
  state.questV74.points = Math.max(0, Number(state.questV74.points) || 0);
  state.questV74.completed = Object.assign({}, state.questV74.completed || {});
  state.questV74.ready = Object.assign({}, state.questV74.ready || {});
  Object.keys(state.questV74.completed).forEach(id => delete state.questV74.ready[id]);
  state.questV74.tracked = Array.isArray(state.questV74.tracked)
    ? state.questV74.tracked.filter(id => QV74.some(q => q.id === id)).slice(-3)
    : [];
  state.questV74.stats = Object.assign(d.stats, state.questV74.stats || {});
  state.questV74.accepted = Object.assign({}, state.questV74.accepted || {});
  try {
    MAIN_CHAIN.forEach(function (id) {
      state.questV74.accepted[id] = true;
    });
  } catch (e) {}
  return state.questV74;
}

function allQuestItems() {
  try {
    const items = allItemsV70(S);
    (S.gearBagV82 || []).forEach(g => g && items.push(g));
    return items;
  } catch (e) {
    return []
      .concat(Object.values(S.gear || {}), Object.values(S.gear2 || {}), S.bag || [], S.gearBagV82 || [])
      .filter(Boolean);
  }
}

function observeQuestState() {
  const qs = ensureQuestState(),
    st = qs.stats,
    items = allQuestItems();
  let maxPlus = 0,
    maxCel = 0,
    maxMythicCel = 0,
    rarity = 0,
    bloodKills = 0,
    bloodFull = 0,
    bloodFullKills = 0,
    itemKills = 0,
    itemBosses = 0,
    itemVictories = 0;
  items.forEach(g => {
    maxPlus = Math.max(maxPlus, Number(g.plus) || 0);
    maxCel = Math.max(maxCel, Number(g.celestial) || 0);
    rarity = Math.max(rarity, Number(g.rar) || 0);
    if (g.rar === 5) maxMythicCel = Math.max(maxMythicCel, Number(g.celestial) || 0);
    const h = g.historyV70 || {};
    itemKills = Math.max(itemKills, Number(h.kills) || 0);
    itemBosses = Math.max(itemBosses, Number(h.bosses) || 0);
    itemVictories = Math.max(itemVictories, Array.isArray(h.victories) ? h.victories.length : 0);
    if (g.growth) {
      st.bloodSeen = 1;
      const k = Number(g.growth.kills) || 0;
      bloodKills = Math.max(bloodKills, k);
      try {
        const gr = growthValues(g),
          full = gr.atk >= gr.cap && gr.hp >= gr.cap;
        if (full) {
          bloodFull = 1;
          bloodFullKills = Math.max(bloodFullKills, k);
        }
      } catch (e) {}
    }
  });
  st.maxPlus = Math.max(st.maxPlus, maxPlus);
  st.maxCel = Math.max(st.maxCel, maxCel);
  st.maxMythicCel = Math.max(st.maxMythicCel, maxMythicCel);
  st.rarity = Math.max(st.rarity, rarity);
  st.bloodKills = Math.max(st.bloodKills, bloodKills);
  st.bloodFull = Math.max(st.bloodFull, bloodFull);
  st.bloodFullKills = Math.max(st.bloodFullKills, bloodFullKills);
  st.maxItemKills = Math.max(st.maxItemKills, itemKills);
  st.maxItemBosses = Math.max(st.maxItemBosses, itemBosses);
  st.maxItemVictories = Math.max(st.maxItemVictories, itemVictories);
  const gear = S.gear || {},
    equipped = SLOTS.map(x => gear[x.key]).filter(Boolean);
  st.setSlots = Math.max(Number(st.setSlots) || 0, equipped.length);
  if (equipped.length === SLOTS.length) {
    st.maxSetPlus = Math.max(st.maxSetPlus, Math.min(...equipped.map(g => Number(g.plus) || 0)));
    st.maxSetCel = Math.max(st.maxSetCel, Math.min(...equipped.map(g => Number(g.celestial) || 0)));
  }
  st.maxMythicArmor = Math.max(
    st.maxMythicArmor,
    ["armor", "helm", "gloves", "boots", "amulet"].filter(k => gear[k] && gear[k].rar === 5).length
  );
  st.bosses = Math.max(
    st.bosses,
    Object.entries(S.bestiaryKillsV70 || {})
      .filter(([k]) => k.startsWith("boss:"))
      .reduce((a, [, v]) => a + (Number(v) || 0), 0)
  );
  st.highestHit = Math.max(
    st.highestHit,
    itemKills ? Math.max(0, ...items.map(g => Number(g.historyV70 && g.historyV70.highestHit) || 0)) : 0
  );
  const wallet = Math.max(0, Number(S.gold) || 0);
  if (st.lastGoldWallet == null) st.lastGoldWallet = wallet;
  if (wallet > st.lastGoldWallet) st.goldCollected += wallet - st.lastGoldWallet;
  st.lastGoldWallet = wallet;
  st.goldCollected = Math.max(st.goldCollected, wallet);
  if (S.abyssUnlocked || S.abyssMode) st.abyssEntered = 1;
  return qs;
}

function researchCount() {
  let n = 0;
  Object.entries(S.bestiaryKillsV70 || {}).forEach(([k, v]) => {
    if (
      (k.startsWith("enemy:") && (Number(v) || 0) >= 15) ||
      (k.startsWith("boss:") && (Number(v) || 0) >= 4)
    )
      n++;
  });
  return n;
}

function questValue(x) {
  const st = ensureQuestState().stats;
  switch (x.mode) {
    case "maxPlus":
      return st.maxPlus;
    case "maxCel":
      return st.maxCel;
    case "maxMythicCel":
      return st.maxMythicCel;
    case "setSlots":
      return st.setSlots || 0;
    case "setPlus":
      return st.maxSetPlus;
    case "setCel":
      return st.maxSetCel;
    case "mythicArmor":
      return st.maxMythicArmor;
    case "campaign":
      return (S.clearedAreas || []).includes(x.target) ? 1 : 0;
    case "abyssCampaign":
      return (S.abyssCleared || []).includes(x.target) ? 1 : 0;
    case "abyssEntered":
      return st.abyssEntered;
    case "bloodSeen":
      return st.bloodSeen;
    case "bloodKills":
      return st.bloodKills;
    case "bloodFull":
      return st.bloodFull;
    case "bloodFullKills":
      return st.bloodFullKills;
    case "dummyKills":
      return Number(S.dummyKillsV78) || 0;
    case "itemKills":
      return st.maxItemKills;
    case "itemBosses":
      return st.maxItemBosses;
    case "itemVictories":
      return st.maxItemVictories;
    case "legacyEnd":
      return st.legacyEnd;
    case "legacyOmega1000":
      return st.legacyOmega1000;
    case "legacyOmega10000":
      return st.legacyOmega10000;
    case "contractTotal":
      return Object.values(S.contractCompletionsV70 || {}).reduce((a, v) => a + (Number(v) || 0), 0);
    case "contractTypes":
      return ["blood", "onslaught", "iron", "glass"].filter(
        k => (Number(S.contractCompletionsV70 && S.contractCompletionsV70[k]) || 0) > 0
      ).length;
    case "contractArea":
      return standardAreaBest();
    case "masteryContracts":
      return countMastery("N:", "mastery") + countMastery("A:", "mastery");
    case "regularMasteries":
      return countMastery("N:", "mastery");
    case "abyssMasteries":
      return countMastery("A:", "mastery");
    case "bronzeAreas":
      return areaMasteryCount(3);
    case "silverAreas":
      return areaMasteryCount(10);
    case "goldAreas":
      return areaMasteryCount(25);
    case "rarity":
      return st.rarity >= x.target ? 1 : 0;
    case "mythicEffects":
      return (S.mythicSeenV70 || []).length;
    case "mythicHalf":
      return (S.mythicSeenV70 || []).length >= Math.ceil(Object.keys(MYTHIC_INFO || {}).length / 2) ? 1 : 0;
    case "mythicAll":
      return (S.mythicSeenV70 || []).length >= Object.keys(MYTHIC_INFO || {}).length ? 1 : 0;
    case "research":
      return researchCount();
    case "researchAll":
      return researchCount() >= Object.keys(ENEMIES || {}).length + AREAS.length ? 1 : 0;
    case "rushEntered":
    case "rushBest":
    case "rushComplete":
    case "abyssRushEntered":
    case "abyssRushBest":
    case "abyssRushComplete":
      return st[x.mode] || 0;
    case "kills":
      return Number(S.totalKills) || 0;
    case "bosses":
    case "elites":
    case "superElites":
    case "goldCollected":
    case "damage":
    case "highestHit":
      return st[x.mode] || 0;
    default:
      return 0;
  }
}

function questGoal(x) {
  return ["campaign", "abyssCampaign", "rarity"].includes(x.mode) ? 1 : x.target;
}

function questUnlocked(x) {
  const qs = ensureQuestState();
  if (x.cat === "Guild" && !(S.clearedAreas || []).includes(2)) return false;
  if (x.cat === "Discovery" && !(S.clearedAreas || []).includes(1)) return false;
  if (x.after && !qs.completed[x.after]) return false;
  if (x.id === "dummy1") return (Number(S.dummyKillsV78) || 0) >= 1;
  if (x.id === "dummy10") return (Number(S.dummyKillsV78) || 0) >= 10;
  if (!x.hidden) return true;
  if (x.mode.startsWith("abyss") || x.id.startsWith("abyss")) return !!(S.abyssUnlocked || S.abyssMode);
  if (x.id.startsWith("blood")) return !!qs.stats.bloodSeen;
  if (x.id.startsWith("mythic") || x.id === "setmythic") return qs.stats.rarity >= 5;
  if (x.id === "legacyomega10000") return !!S.abyssUnlocked;
  return true;
}

function questRewardText(x) {
  return x.reward + " Quest Points" + (x.gold ? " · " + fmt(x.gold) + " gold" : "");
}

function showQuestPop(x, kind = "ready") {
  questPopQueue.push({ item: x, kind });
  if (questPopBusy) return;
  const next = () => {
    const entry = questPopQueue.shift();
    if (!entry) {
      questPopBusy = false;
      return;
    }
    const item = entry.item,
      claimed = entry.kind === "claimed";
    questPopBusy = true;
    let d = $("questtoastv74");
    if (!d) {
      d = document.createElement("div");
      d.id = "questtoastv74";
      d.className = "questtoastv74";
      document.body.appendChild(d);
    }
    if (d._questHideTimerV84) clearTimeout(d._questHideTimerV84);
    if (d._questFinishTimerV84) clearTimeout(d._questFinishTimerV84);
    d.classList.remove("on");
    d.style.display = "block";
    d.setAttribute("aria-hidden", "false");
    const successor =
      claimed &&
      QV74.filter(
        q => q.cat === item.cat && q.id !== item.id && !ensureQuestState().completed[q.id] && questUnlocked(q)
      ).sort((a, b) => questGoal(a) - questGoal(b))[0];
    d.innerHTML =
      '<div class="burst">' +
      item.icon +
      "</div><p>" +
      (claimed ? "REWARD CLAIMED" : "QUEST COMPLETE") +
      "</p><h2>" +
      item.name +
      '</h2><p class="questdonewhatv80">' +
      item.desc +
      "</p><strong>" +
      (claimed ? "+" : "Reward: ") +
      questRewardText(item) +
      "</strong>" +
      (!claimed
        ? '<p class="questclaimhintv80">Claim it here in the tracker or open Quests.</p>'
        : successor
          ? '<p class="questnextv113">➡ Next quest now active: <b>' + successor.name + "</b></p>"
          : "");
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      d.classList.remove("on");
      d.setAttribute("aria-hidden", "true");
      d._questFinishTimerV84 = setTimeout(() => {
        d.style.display = "none";
        questPopBusy = false;
        next();
      }, 300);
    };
    requestAnimationFrame(() => d.classList.add("on"));
    try {
      flash(claimed ? "#ffd76a" : "#69c7ff");
      chord(claimed ? [523, 659, 784, 1046] : [392, 523, 659, 784], 0.55);
    } catch (e) {}
    d._questHideTimerV84 = setTimeout(finish, claimed ? 2600 : 3200);
  };
  next();
}

function evaluateQuests(silent) {
  const qs = observeQuestState(),
    ready = [];
  QV74.forEach(x => {
    if (qs.completed[x.id] || qs.ready[x.id] || !qs.accepted[x.id] || !questUnlocked(x)) return;
    const goal = questGoal(x);
    if (questValue(x) >= goal) {
      qs.ready[x.id] = Date.now();
      if (!qs.tracked.includes(x.id)) qs.tracked = [x.id, ...qs.tracked].slice(0, 3);
      ready.push(x);
    }
  });
  if (ready.length) {
    try {
      scheduleSave();
    } catch (e) {}
    if (!silent) ready.forEach(x => showQuestPop(x, "ready"));
  }
  renderQuestTracker();
  if ($("questsv74") && $("questsv74").classList.contains("on")) renderQuestMenu();
  return ready;
}

function claimQuest(id) {
  const qs = observeQuestState(),
    x = QV74.find(q => q.id === id);
  if (!x || !qs.ready[id] || qs.completed[id]) return false;
  delete qs.ready[id];
  qs.completed[id] = Date.now();
  try {
    var _nx = QV74.filter(function (q) {
      return q.cat === x.cat && !qs.completed[q.id] && !qs.accepted[q.id] && questUnlocked(q);
    }).sort(function (a, b) {
      return questGoal(a) - questGoal(b);
    })[0];
    if (_nx) {
      qs.accepted[_nx.id] = true;
      if (qs.tracked.indexOf(_nx.id) < 0) {
        qs.tracked.push(_nx.id);
        qs.tracked = qs.tracked.slice(-3);
      }
    }
  } catch (e) {}
  qs.points += Math.max(0, Number(x.reward) || 0);
  if (x.gold) {
    S.gold = Math.max(0, Number(S.gold) || 0) + x.gold;
    qs.stats.goldCollected = Math.max(0, Number(qs.stats.goldCollected) || 0) + x.gold;
    qs.stats.lastGoldWallet = Math.max(0, Number(S.gold) || 0);
  }
  qs.tracked = qs.tracked.filter(qid => qid !== id);
  try {
    scheduleSave();
  } catch (e) {}
  showQuestPop(x, "claimed");
  evaluateQuests(false);
  renderQuestMenu();
  renderQuestTracker();
  return true;
}

function renderQuestTracker() {
  const rail = $("goalrailv70");
  if (!rail) return;
  const qs = ensureQuestState();
  qs.tracked = qs.tracked
    .filter(id => {
      const x = QV74.find(q => q.id === id);
      return x && !qs.completed[id] && questUnlocked(x);
    })
    .slice(-3);
  try {
    const mc = MAIN_CHAIN.map(id => QV74.find(q => q.id === id)).find(
      q => q && !qs.completed[q.id] && questUnlocked(q)
    );
    if (mc && !qs.tracked.includes(mc.id)) qs.tracked = [mc.id, ...qs.tracked].slice(0, 3);
  } catch (e) {}
  const list = qs.tracked.map(id => QV74.find(q => q.id === id)).filter(Boolean);
  rail.className = "panel full goalrailv70 questtrackerv74";
  rail.innerHTML =
    '<div class="questtrackerheadv74"><b>TRACKED QUESTS · ' +
    qs.points +
    ' QP</b><button type="button" id="openquesttrackerv74">Open quests</button></div><div class="questtrackergridv74">' +
    (list.length
      ? list
          .map(x => {
            const p = pctV74(x),
              ready = !!qs.ready[x.id];
            return (
              '<div class="trackedquestv74 ' +
              (ready ? "ready" : "") +
              '"><span class="qi">' +
              x.icon +
              "</span><div><b>" +
              x.name +
              "</b><small>" +
              progressText(x, p) +
              "</small></div>" +
              (ready
                ? '<button class="questclaimtrackv84" data-trackclaim="' + x.id + '">Claim</button>'
                : "") +
              '<div class="qb"><i style="width:' +
              Math.max(2, p.p * 100) +
              '%"></i></div></div>'
            );
          })
          .join("")
      : '<div class="questemptyv74">Choose up to three quests from the Quest menu to track them here.</div>') +
    "</div>";
  $("openquesttrackerv74").onclick = openQuestMenu;
  rail.querySelectorAll("[data-trackclaim]").forEach(
    b =>
      (b.onclick = e => {
        e.stopPropagation();
        claimQuest(b.dataset.trackclaim);
      })
  );
}

function questTabs() {
  const tabs = [
    "Campaign",
    "Forge",
    "Equipment",
    "Mastery",
    "Challenges",
    "Records",
    "Hidden",
    "Ready",
    "Completed"
  ];
  if ((S.clearedAreas || []).includes(1)) tabs.splice(4, 0, "Discovery");
  if ((S.clearedAreas || []).includes(2)) tabs.splice(tabs.indexOf("Mastery"), 0, "Guild");
  return tabs;
}

function renderQuestMenu() {
  const box = $("questsv74"),
    grid = $("questgridv74"),
    tabs = $("questtabsv74");
  if (!box || !grid || !tabs) return;
  const qs = observeQuestState(),
    availableTabs = questTabs(),
    readyCount = Object.keys(qs.ready).length;
  if (!availableTabs.includes(questMenuPage)) questMenuPage = availableTabs[0];
  $("questsummaryv74").textContent =
    qs.points +
    " Quest Points · " +
    Object.keys(qs.completed).length +
    " completed" +
    (readyCount ? " · " + readyCount + " reward" + (readyCount === 1 ? "" : "s") + " ready" : "");
  tabs.innerHTML = availableTabs
    .map(
      c =>
        '<button data-cat="' +
        c +
        '" class="' +
        (c === questMenuPage ? "active" : "") +
        '">' +
        (c === "Ready" && readyCount ? "Ready (" + readyCount + ")" : c) +
        "</button>"
    )
    .join("");
  tabs.querySelectorAll("button").forEach(
    b =>
      (b.onclick = () => {
        questMenuPage = b.dataset.cat;
        renderQuestMenu();
      })
  );
  let list = QV74.filter(x => {
    const done = !!qs.completed[x.id],
      ready = !!qs.ready[x.id],
      unlocked = questUnlocked(x);
    if (questMenuPage === "Ready") return ready && !done;
    if (questMenuPage === "Completed") return done;
    if (done || !unlocked) return false;
    return x.cat === questMenuPage;
  });
  if (questMenuPage === "Hidden")
    list = QV74.filter(x => x.cat === "Hidden" && questUnlocked(x) && !qs.completed[x.id]);
  list.sort(function (a, b) {
    function s(x) {
      return qs.ready[x.id] ? 3 : qs.accepted[x.id] ? 2 : 0;
    }
    return s(b) - s(a);
  });
  grid.innerHTML = list.length
    ? list
        .map(x => {
          const done = !!qs.completed[x.id],
            ready = !!qs.ready[x.id],
            accepted = !!qs.accepted[x.id],
            p = pctV74(x);
          return (
            '<article class="questcardv74 ' +
            (done ? "done " : "") +
            (ready ? "ready " : "") +
            (accepted ? "tracked" : "") +
            '"><span class="questiconv74">' +
            x.icon +
            "</span><div><h3>" +
            x.name +
            "</h3>" +
            (accepted && !done && !ready
              ? '<span class="questactivepill113">ACTIVE</span>'
              : ready
                ? '<span class="questreadypill113">READY</span>'
                : "") +
            "<p>" +
            x.desc +
            '</p><div class="questrewardv74">' +
            questRewardText(x) +
            " · " +
            (accepted || done || ready ? progressText(x, p) : "accept to begin") +
            '</div><div class="questbarv74"><i style="width:' +
            (accepted || done || ready ? Math.max(done || ready ? 100 : 2, p.p * 100) : 2) +
            '%"></i></div></div>' +
            (done
              ? "<span>✓</span>"
              : ready
                ? '<button class="questclaimv74" data-claim="' + x.id + '">Claim</button>'
                : '<button class="questtrackv74 ' +
                  (accepted ? "on" : "") +
                  '" data-accept="' +
                  x.id +
                  '">' +
                  (accepted ? "✓ Accepted" : "Accept") +
                  "</button>") +
            "</article>"
          );
        })
        .join("")
    : '<div class="questemptyv74">No quests in this section yet.</div>';
  grid.querySelectorAll("[data-accept]").forEach(
    b =>
      (b.onclick = () => {
        const id = b.dataset.accept;
        qs.accepted[id] = true;
        if (!qs.tracked.includes(id)) {
          qs.tracked.push(id);
          qs.tracked = qs.tracked.slice(-3);
        }
        scheduleSave();
        evaluateQuests(false);
        renderQuestMenu();
        renderQuestTracker();
      })
  );
  grid.querySelectorAll("[data-claim]").forEach(b => (b.onclick = () => claimQuest(b.dataset.claim)));
}

function openQuestMenu() {
  renderQuestMenu();
  $("questsv74").classList.add("on");
}

function setupQuestUI() {
  const res = document.querySelector(".res"),
    comp = $("compendiumbtn");
  if (res && comp && !$("questbtnv74")) {
    const b = document.createElement("button");
    b.id = "questbtnv74";
    b.className = "questbtnv74";
    b.type = "button";
    b.textContent = "📜 Quests";
    comp.insertAdjacentElement("afterend", b);
    b.onclick = openQuestMenu;
  }
  if (!$("questsv74")) {
    const d = document.createElement("div");
    d.id = "questsv74";
    d.className = "skover";
    d.innerHTML =
      '<div class="skbox questboxv74"><div class="questheadv74"><h2>📜 QUESTS</h2><div class="questsummaryv74" id="questsummaryv74"></div></div><nav class="questtabsv74" id="questtabsv74"></nav><div class="questgridv74" id="questgridv74"></div><button class="ghost questclosev74" id="closequestsv74">Close</button></div>';
    document.body.appendChild(d);
    $("closequestsv74").onclick = () => d.classList.remove("on");
  }
  const music = $("musicbtn");
  if (res && music) res.appendChild(music);
  renderQuestTracker();
}

function applyFeatureGatesV77() {
  gateButton("shopbtn", clearedV77(1), "🛒 Shop", "🔒 Shop", "Open the Smith's Shop");
  gateButton("compendiumbtn", clearedV77(2), "📖 Compendium", "🔒 Compendium", "Open the Compendium");
  gateButton("guildbtnv70", clearedV77(3), "⚔ Guild", "🔒 Guild", "Open the Mercenaries Guild");
}

function applyAreaGuidesV78() {
  const root = $("areas");
  if (!root) return;
  [...root.querySelectorAll(".atile")].slice(0, AREAS.length).forEach((tile, i) => {
    if (tile.classList.contains("lock")) return;
    const g = AREA_GUIDE[i],
      a = AREAS[i],
      detail = tile.querySelector(".td"),
      weak = tile.querySelector(".tw");
    if (!g || !a) return;
    if (detail)
      detail.innerHTML =
        a.waves +
        " waves and boss<br>Depth " +
        a.lvl +
        " onward · " +
        a.boss +
        "<br>" +
        g.desc +
        (S.abyssMode ? "<br>Abyss enemies and boss abilities are substantially stronger." : "");
    if (weak) weak.remove();
  });
}

function blankOnboarding() {
  return {
    deaths: 0,
    starterLoot: false,
    seen: {
      retreat: false,
      death3: false,
      death7: false,
      shop: false,
      compendium: false,
      guild: false,
      level: false
    },
    notices: [],
    targetQueue: [],
    activeTarget: null,
    showingNotice: null,
    skillGuideDone: false
  };
}

function ensureOnboarding(state = S) {
  const had = !!(state && state.onboardingV79),
    fresh = blankOnboarding(),
    established =
      Number(state && state.totalKills) > 0 ||
      Number(state && state.heroLevel) > 1 ||
      !!(state && state.clearedAreas && state.clearedAreas.length);
  state.onboardingV79 = Object.assign(fresh, state.onboardingV79 || {});
  const o = state.onboardingV79;
  o.seen = Object.assign(fresh.seen, o.seen || {});
  o.deaths = Math.max(0, Math.floor(Number(o.deaths) || 0));
  o.notices = Array.isArray(o.notices) ? o.notices.filter(k => NOTICE[k]) : [];
  o.targetQueue = Array.isArray(o.targetQueue) ? o.targetQueue.filter(Boolean) : [];
  o.activeTarget = typeof o.activeTarget === "string" ? o.activeTarget : null;
  o.showingNotice = NOTICE[o.showingNotice] ? o.showingNotice : null;
  if (!had && established) {
    o.starterLoot = Number(state.totalKills) >= 10;
    o.seen.level = Number(state.heroLevel) > 1;
    o.skillGuideDone = Number(state.heroLevel) > 1;
    o.seen.shop = !!(state.clearedAreas || []).includes(0);
    o.seen.compendium = !!(state.clearedAreas || []).includes(1);
    o.seen.guild = !!(state.clearedAreas || []).includes(2);
  }
  return o;
}

function saveOnboarding() {
  try {
    scheduleSave();
  } catch (e) {}
}

function targetQueued(o, target) {
  return o.activeTarget === target || o.targetQueue.includes(target);
}

function queueTarget(target) {
  const o = ensureOnboarding();
  if (!target || targetQueued(o, target)) return;
  if (!o.activeTarget) o.activeTarget = target;
  else o.targetQueue.push(target);
  saveOnboarding();
  renderCoachArrow();
}

function queueNotice(key) {
  const o = ensureOnboarding();
  if (!NOTICE[key] || o.seen[key]) return;
  o.seen[key] = true;
  o.notices.push(key);
  saveOnboarding();
}

function clearCoachTarget() {
  const o = ensureOnboarding();
  o.activeTarget = o.targetQueue.shift() || null;
  saveOnboarding();
  renderCoachArrow();
  if (!o.activeTarget) setTimeout(showNextNoticeV79, 40);
}

function targetElement(target) {
  if (target === "anvil") return $("upbtn");
  if (target === "helmet") return $("slots") && $("slots").children[2];
  if (target === "skillTree") return $("opentree");
  if (target === "heal") return healNode();
  if (target === "shop") return $("shopbtn");
  if (target === "compendium") return $("compendiumbtn");
  if (target === "guild") return $("guildbtnv70");
  return null;
}

function renderCoachArrow() {
  document.querySelectorAll(".coacharrowv79").forEach(x => x.remove());
  document.querySelectorAll(".coachmarkv79").forEach(x => x.classList.remove("coachmarkv79"));
  const o = ensureOnboarding(),
    target = o.activeTarget;
  if (!target) return;
  if (target === "helmet" && Number(S.slotsOpen) > 2) {
    clearCoachTarget();
    return;
  }
  if (target === "heal" && (Number(S.skills && S.skills.h1) || 0) > 0) {
    o.skillGuideDone = true;
    clearCoachTarget();
    return;
  }
  const el = targetElement(target);
  if (!el || el.classList.contains("featurehiddenv79")) return;
  el.classList.add("coachmarkv79");
  const arrow = document.createElement("span");
  arrow.className = "coacharrowv79";
  arrow.textContent = "▼";
  arrow.setAttribute("aria-hidden", "true");
  el.appendChild(arrow);
}

function showNextNoticeV79() {
  const o = ensureOnboarding(),
    modal = $("tipmodal");
  if (o.activeTarget || (modal && modal.classList.contains("on")) || otherMenuOpen() || !townVisible())
    return;
  const key = o.showingNotice || o.notices.shift();
  if (!key || !NOTICE[key]) return;
  o.showingNotice = key;
  const n = NOTICE[key];
  showTip(n.title, n.body);
  saveOnboarding();
}

function applyFeatureVisibility() {
  const cleared = S.clearedAreas || [];
  [
    ["shopbtn", 0],
    ["compendiumbtn", 1],
    ["guildbtnv70", 2]
  ].forEach(([id, ai]) => {
    const b = $(id),
      open = cleared.includes(ai);
    if (!b) return;
    b.classList.toggle("featurehiddenv79", !open);
    b.disabled = !open;
    b.setAttribute("aria-hidden", open ? "false" : "true");
  });
}

function pinForgeQuestV79() {
  const api = window.forgeV74;
  if (!api || !api.state || !api.quests) return false;
  const qs = api.state(),
    next = FORGE_CHAIN.map(id => api.quests.find(q => q.id === id)).find(
      q => q && !qs.completed[q.id] && api.unlocked(q)
    );
  if (!next || qs.tracked.includes(next.id)) return false;
  qs.tracked = [next.id, ...qs.tracked.filter(id => id !== next.id)].slice(0, 3);
  saveOnboarding();
  return true;
}

function migrateQuestRewardsV81() {
  S.flags = S.flags || {};
  if (S.flags.questRewardCurveV81) return 0;
  const qs = window.forgeV74 && window.forgeV74.state(),
    quests = (window.forgeV74 && window.forgeV74.quests) || [];
  let granted = 0;
  if (qs)
    Object.keys(qs.completed || {}).forEach(id => {
      const q = quests.find(x => x.id === id);
      if (q && q.gold) granted += Math.max(0, q.gold - (PREVIOUS_QUEST_GOLD[id] || 0));
    });
  if (granted) {
    S.gold = Math.max(0, Number(S.gold) || 0) + granted;
    qs.stats.goldCollected = Math.max(0, Number(qs.stats.goldCollected) || 0) + granted;
    qs.stats.lastGoldWallet = S.gold;
    setTimeout(
      () =>
        showTip(
          "QUEST REWARDS RECALIBRATED",
          "Quest rewards now scale with their place in the game. <b>" +
            fmt(granted) +
            " retroactive gold</b> was added for milestones you already claimed."
        ),
      600
    );
  }
  S.flags.questRewardCurveV81 = true;
  try {
    scheduleSave();
  } catch (e) {}
  return granted;
}

function cleanOldRetreatNotice() {
  const api = window.forgeV79;
  if (!api || typeof api.state !== "function") return;
  const o = api.state();
  o.notices = Array.isArray(o.notices) ? o.notices.filter(k => k !== "retreat") : [];
  if (o.showingNotice === "retreat") o.showingNotice = null;
}

function teachRetreatV83() {
  if (!run || run.over || run.hunt || run.dummy || run.ai !== 0 || run.wave !== 3) return;
  const api = window.forgeV79;
  if (!api || typeof api.state !== "function") return;
  const o = api.state();
  if (o.seen && o.seen.retreat) return;
  o.seen = o.seen || {};
  o.seen.retreat = true;
  try {
    scheduleSave();
    showTip(
      "YOUR FIRST RETREAT POINT",
      "You have reached <b>wave 3</b> in Goblin Warrens. The Retreat button is now available.<br><br>Retreating ends this attempt without clearing the area, but you keep every loot bag collected. Goblin Warrens also offers one final retreat at <b>wave 5</b>, just before the boss."
    );
  } catch (e) {}
}

function checkFirst10() {
  var f = F_v101_2();
  if (f.seenFirst10V100) return false;
  if (
    !allItems().some(function (g) {
      return (g.plus || 0) >= 10;
    })
  )
    return false;
  if (
    show_v101(
      "+10 · NOW IT GETS SPICY",
      "Nice, a piece hit <b>+10</b>! 🎉<br><br>From here every upgrade can <b>shatter</b> the item on a critical failure. If this gear is dear to you, grab a <b>🛡 Forge Guard</b> from the Shop first — it soaks the shatter so one bad roll cannot vaporise your favourite toy."
    )
  ) {
    f.seenFirst10V100 = true;
    try {
      scheduleSave();
    } catch (e) {}
    return true;
  }
  return false;
}

function checkEfx() {
  var f = F_v101_2();
  f.seenEfxV100 = f.seenEfxV100 || {};
  var w = S.gear && S.gear.weapon;
  if (!w || !w.stats) return false;
  var ks = Object.keys(EFX);
  for (var i = 0; i < ks.length; i++) {
    var k = ks[i];
    if ((w.stats[k] || 0) > 0 && !f.seenEfxV100[k]) {
      var e = EFX[k];
      if (
        show_v101(
          e.i + " " + e.n.toUpperCase() + " · a new trick",
          "Your weapon now carries <b>" + e.n + "</b>.<br><br>" + e.b
        )
      ) {
        f.seenEfxV100[k] = true;
        try {
          scheduleSave();
        } catch (e2) {}
        return true;
      }
    }
  }
  return false;
}

/* FIX B — the "your first retreat" explainer used to pop up DURING combat (wave 3).
     Kill that in-combat trigger and instead show it once, after the first combat ends
     (whether the hero retreated or died). */
function killMidCombatTeach() {
  try {
    var api = window.forgeV79;
    if (api && typeof api.state === "function") {
      var o = api.state();
      if (o) {
        o.seen = o.seen || {};
        o.seen.retreat = true;
      }
    }
  } catch (e) {}
}

function taught() {
  try {
    S.flags = S.flags || {};
    return !!S.flags.retreatTaughtV110;
  } catch (e) {
    return true;
  }
}

function markTaught() {
  try {
    S.flags = S.flags || {};
    S.flags.retreatTaughtV110 = true;
    if (typeof scheduleSave === "function") scheduleSave();
  } catch (e) {}
}

function unlockedSlots() {
  var lv = (typeof S !== "undefined" && S.heroLevel) || 1;
  return 1 + (lv >= 15 ? 1 : 0) + (lv >= 40 ? 1 : 0) + (lv >= 60 ? 1 : 0);
}

function questClaimable() {
  try {
    var q = (typeof S !== "undefined" && S.questV74) || null;
    if (!q || !q.ready) return 0;
    var n = 0;
    for (var k in q.ready) {
      if (q.ready[k] && !(q.completed && q.completed[k])) n++;
    }
    return n;
  } catch (e) {
    return 0;
  }
}

function guideActive() {
  var s = a_v114();
  return !!(s && s._lv2guide);
}
