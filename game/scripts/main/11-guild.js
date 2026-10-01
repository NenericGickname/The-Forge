/* Mercenaries Guild: contracts, offers, cooldowns. */

/* The hidden ten click developer tile is gone. The explicit code protected playtest panel remains. */
function guardOffer(key, cost, grid) {
  const gd = GUARDS[key],
    owned = S.guards[key] || 0,
    price = [];
  if (cost.gold) price.push('<span style="color:var(--gold)">' + fmt(cost.gold) + "g</span>");
  if (cost.shards) price.push('<span style="color:var(--rare)">' + fmt(cost.shards) + "sh</span>");
  if (cost.esh) price.push('<span class="esh">' + cost.esh + " epic</span>");
  const afford = S.gold >= cost.gold && S.shards >= cost.shards && S.epicShards >= (cost.esh || 0),
    card = document.createElement("div");
  card.className = "shopcard guardbandv52";
  card.innerHTML =
    '<div class="sn">🛡 ' +
    gd.n +
    '</div><div class="sd">Always prevents one shatter on item levels ' +
    gd.min +
    " to " +
    gd.max +
    '. Purchased guards stack and arm automatically for matching equipment.</div><div class="sown">Owned: ' +
    owned +
    '</div><button class="up"' +
    (afford ? "" : " disabled") +
    '>Buy one <span class="pc">' +
    price.join(" + ") +
    "</span></button>";
  card.querySelector("button").onclick = () => {
    if (!afford) return;
    S.gold -= cost.gold;
    S.shards -= cost.shards;
    S.epicShards -= cost.esh || 0;
    S.guards[key] = (S.guards[key] || 0) + 1;
    armedGuard = key;
    beep(680, 0.1, "triangle");
    flash(cvar("--gold"));
    scheduleSave();
    renderShop();
    renderTown();
  };
  grid.appendChild(card);
}

function emptyPity() {
  return { epic: 0, legendary: 0 };
}

function activeDiscipline() {
  const d = DISCIPLINES[S.disciplineV70] || DISCIPLINES.none,
    w = S.gear && S.gear.weapon;
  return { key: S.disciplineV70 || "none", cfg: d, active: d.need(w) };
}

function selectDiscipline(key) {
  if (!DISCIPLINES[key] || (run && !run.over)) return;
  S.disciplineV70 = key;
  beep(610, 0.08, "triangle", 0.08);
  flash(DISCIPLINES[key].color || "#c98cff");
  scheduleSave();
  renderTree();
  renderTown();
}

function renderDiscipline() {
  const box = $("sktree") && $("sktree").querySelector(".skbox"),
    branches = $("branches");
  if (!box || !branches) return;
  let d = $("disciplinev70");
  if (!d) {
    d = document.createElement("div");
    d.id = "disciplinev70";
    d.className = "disciplinev70";
    branches.parentNode.insertBefore(d, branches);
  }
  const spend = regularSkillSpendV70(),
    active = activeDiscipline();
  if (spend < 20) {
    d.className = "disciplinev70 lockedv72";
    d.innerHTML =
      '<div class="disciplineheadv70"><b>🔒 COMBAT DISCIPLINES</b><span>Unlocks after investing 20 skill points · ' +
      spend +
      " / 20</span></div>";
    return;
  }
  d.className = "disciplinev70";
  d.innerHTML =
    '<div class="disciplineheadv70"><b>COMBAT DISCIPLINE</b><span>A playstyle choice independent of your weapon · change freely in town</span></div><div class="disciplinegridv70">' +
    Object.entries(DISCIPLINES)
      .map(
        ([key, cfg]) =>
          '<button class="disciplinecardv70 ' +
          (S.disciplineV70 === key ? "active" : "") +
          '" data-d="' +
          key +
          '"><strong>' +
          cfg.icon +
          " " +
          cfg.name +
          "</strong>" +
          cfg.desc +
          "</button>"
      )
      .join("") +
    "</div>";
  d.querySelectorAll("button").forEach(b => (b.onclick = () => selectDiscipline(b.dataset.d)));
  const pts = $("sktree").querySelector(".pts");
  if (pts)
    pts.innerHTML =
      'Points: <b id="sktpts">' +
      S.sp +
      '</b> · <span class="skillbudgetv70">Build ' +
      regularSkillSpendV70() +
      " / " +
      SKILL_BUDGET +
      "</span>";
}

function contractV70_v70() {
  if (startingContract) return CONTRACTS[startingContract] || null;
  if (run && !run.hunt && !run.dummy && !run.over) return CONTRACTS[run.contractV70] || null;
  return null;
}

function contractKeyV70() {
  if (startingContract) return startingContract;
  if (run && !run.hunt && !run.dummy && !run.over) return run.contractV70 || null;
  return null;
}

function applyPityV70(bag) {
  if (!bag) return false;
  ensureV70State();
  const p = S.pityV70;
  let changed = false;
  p.epic++;
  p.legendary++;
  if ((bag.rar || 0) >= 4) {
    p.legendary = 0;
    p.epic = 0;
  } else if ((bag.rar || 0) >= 3) p.epic = 0;
  if (p.legendary >= 350 && (bag.rar || 0) < 4) {
    bag.rar = 4;
    p.legendary = 0;
    p.epic = 0;
    changed = true;
  } else if (p.epic >= 70 && (bag.rar || 0) < 3) {
    bag.rar = 3;
    p.epic = 0;
    changed = true;
  }
  if (changed && typeof rollBloodforged === "function") rollBloodforged(bag);
  return changed;
}

function contractStageKey(ai, abyss) {
  return (abyss ? "A" : "N") + ":" + ai;
}

function contractStageRecordV72(ai, abyss) {
  const key = contractStageKey(ai, abyss);
  return S.contractStageV72[key] || (S.contractStageV72[key] = {});
}

/* Guild interface. */
function renderGuildV70() {
  ensureV70State();
  const grid = $("contractgridv70");
  if (!grid) return;
  const ai = Math.max(0, Math.min(AREAS.length - 1, lastArea == null ? S.areaMax || 0 : lastArea)),
    abyss = !!S.abyssMode,
    record = contractStageRecordV72(ai, abyss);
  grid.innerHTML =
    '<div class="guildstatusv72">Contract target: <b>' +
    (abyss ? "Abyss " : "") +
    AREAS[ai].n +
    "</b> · every contract has its own ten minute recovery</div>" +
    Object.entries(CONTRACTS)
      .map(([id, c]) => {
        const active = S.activeContractV70 === id,
          n = Number(S.contractCompletionsV70[id]) || 0,
          done = !!record[id],
          locked = id === "mastery" && !masteryReadyV72(ai, abyss),
          left = Math.max(0, 600000 - (Date.now() - (Number(S.contractCooldownV73[id]) || 0))),
          disabled = left > 0 || done || locked;
        return (
          '<article class="contractv70 ' +
          (active ? "active " : "") +
          (done ? "donev72 " : "") +
          (locked ? "lockedv72" : "") +
          '" style="--cc:' +
          c.color +
          '"><h3>' +
          c.icon +
          " " +
          c.name +
          "</h3><p>" +
          c.risk +
          '</p><div class="contractrewardv70">' +
          c.reward +
          '</div><div class="contractrecordv70">' +
          (done
            ? "✓ Completed for this area"
            : locked
              ? "Complete all four standard contracts here first"
              : left
                ? "Ready again in " + Math.ceil(left / 60000) + "m"
                : "Total successes: " + fmt(n)) +
          '</div><button data-contract="' +
          id +
          '" ' +
          (disabled && !active ? "disabled" : "") +
          ">" +
          (active
            ? "Cancel contract"
            : done
              ? "Completed"
              : locked
                ? "Locked"
                : left
                  ? "Recovering"
                  : "Accept contract") +
          "</button></article>"
        );
      })
      .join("");
  grid.querySelectorAll("button").forEach(
    b =>
      (b.onclick = () => {
        const id = b.dataset.contract;
        S.activeContractV70 = S.activeContractV70 === id ? null : id;
        beep(S.activeContractV70 ? 650 : 380, 0.08, "triangle", 0.07);
        scheduleSave();
        renderGuildV70();
        renderTown();
      })
  );
}

function setupGuild() {
  const res = document.querySelector(".res");
  let b = $("guildbtnv70");
  if (res && !b) {
    b = document.createElement("button");
    b.id = "guildbtnv70";
    b.className = "guildbtnv70";
    b.type = "button";
    b.textContent = "⚔ GUILD";
    res.appendChild(b);
  }
  if (!$("guildv70")) {
    const d = document.createElement("div");
    d.id = "guildv70";
    d.className = "skover";
    d.innerHTML =
      '<div class="skbox guildboxv70"><div class="guildheadv70"><h2>⚔ MERCENARIES GUILD</h2><p>Accept one contract before entering an area. The danger and reward remain visible, and the contract stays active until you cancel it.</p></div><div class="contractgridv70" id="contractgridv70"></div><button class="ghost" id="closeguildv70" style="width:100%;margin-top:12px">Close</button></div>';
    document.body.appendChild(d);
    $("closeguildv70").onclick = () => d.classList.remove("on");
  }
  b = $("guildbtnv70");
  if (b && !b.dataset.guildBoundV70) {
    b.dataset.guildBoundV70 = "1";
    b.onclick = () => {
      const api = window.forgeV75 || window.forgeV70;
      if (api && typeof api.renderGuild === "function") api.renderGuild();
      else renderGuildV70();
      $("guildv70").classList.add("on");
    };
  }
}

function contractGoal() {
  const ai = Math.max(0, Math.min(AREAS.length - 1, lastArea == null ? S.areaMax || 0 : lastArea)),
    r = contractStageRecordV72(ai, !!S.abyssMode),
    n = ["blood", "onslaught", "iron", "glass"].filter(k => r[k]).length;
  if (n >= 4 && r.mastery) return null;
  return {
    icon: n >= 4 ? "★" : "⚔",
    title: n >= 4 ? "Complete the Mastery Contract" : "Complete Guild contracts",
    meta: (n >= 4 ? "Mastery available for " : n + " of 4 standard contracts in ") + AREAS[ai].n,
    p: n >= 4 ? (r.mastery ? 1 : 0) : n / 4
  };
}

function contractMarksV72() {
  const abyss = !!S.abyssMode,
    tiles = [...($("areas") ? $("areas").querySelectorAll(".atile") : [])].slice(0, AREAS.length);
  tiles.forEach((tile, i) => {
    const area = AREAS[i];
    if (!area) return;
    const locked = tile.classList.contains("lock"),
      name = tile.querySelector(".anm"),
      symbol = tile.querySelector(".as"),
      tip = tile.querySelector(".atip");
    if (locked) {
      if (symbol) symbol.textContent = "?";
      if (name) name.textContent = "Unknown";
      if (tip)
        tip.innerHTML =
          '<div class="tn">Unknown area</div><div class="td">Defeat the previous area boss to reveal this destination.</div>';
    } else {
      if (symbol) symbol.textContent = area.sp;
      if (name) {
        // keep the clear-count badge that decorateAreaMasteryV52 put in the name
        const badge = name.querySelector(".masterybadgev51");
        name.textContent = area.n + ((S.clearedAreas || []).includes(i) ? " ✓" : "");
        if (badge) name.appendChild(badge);
      }
    }
    let marks = tile.querySelector(".contractmarksv72");
    if (!marks) {
      marks = document.createElement("span");
      marks.className = "contractmarksv72";
      tile.appendChild(marks);
    }
    const rec = (S.contractStageV72 || {})[(abyss ? "A" : "N") + ":" + i] || {};
    if (locked) {
      marks.classList.remove("masteryv75");
      marks.innerHTML = "";
    } else if (rec.mastery) {
      marks.classList.add("masteryv75");
      marks.innerHTML = '<i title="Ultimate Guild Challenge completed">★</i>';
    } else {
      marks.classList.remove("masteryv75");
      const icons = { blood: "🩸", onslaught: "⚡", iron: "🛡", glass: "◆" };
      marks.innerHTML = Object.keys(icons)
        .filter(k => rec[k])
        .map(k => '<i title="' + k + ' contract completed">' + icons[k] + "</i>")
        .join("");
    }
  });
}

function renderGuildPublic() {
  const api = window.forgeV75 || window.forgeV70,
    result = api && typeof api.renderGuild === "function" ? api.renderGuild() : undefined,
    head = $("guildv70") && $("guildv70").querySelector(".guildheadv70 p");
  if (head && !window.forgeV75)
    head.textContent =
      "Accept one contract before entering an area. All contracts have their own cooldown. The remaining time appears only on the contract you attempted.";
  return result;
}

function contractStageRecordV75(ai, abyss) {
  return guildCore.contractStageRecord(ai, abyss);
}

function activeContractKey() {
  return (
    (launchingGuildOffer && launchingGuildOffer.id) ||
    (run && run.guildContractV75) ||
    guildCore.contractKey()
  );
}

function ensureGuildOffers(state = S) {
  state.guildOffersV75 =
    state.guildOffersV75 && typeof state.guildOffersV75 === "object"
      ? state.guildOffersV75
      : { regular: [], abyss: [] };
  state.guildOffersV75.regular = Array.isArray(state.guildOffersV75.regular)
    ? state.guildOffersV75.regular
    : [];
  state.guildOffersV75.abyss = Array.isArray(state.guildOffersV75.abyss) ? state.guildOffersV75.abyss : [];
  return state.guildOffersV75;
}

function offerMode() {
  return S.abyssMode && S.abyssUnlocked ? "abyss" : "regular";
}

function validOfferPool(mode) {
  const abyss = mode === "abyss",
    pool = [];
  accessibleAreas(mode).forEach(ai => {
    const rec = contractStageRecordV75(ai, abyss);
    ["blood", "onslaught", "iron", "glass"].forEach(id => {
      if (!rec[id]) pool.push({ id, ai, abyss });
    });
    if (masteryReadyV75(ai, abyss)) pool.push({ id: "mastery", ai, abyss });
  });
  return pool;
}

function offerUid() {
  return "g" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function refillOffers(mode) {
  const all = ensureGuildOffers(),
    list = all[mode],
    pool = validOfferPool(mode),
    used = new Set(list.map(o => o.id + ":" + o.ai));
  while (list.length < 4) {
    const options = pool.filter(o => !used.has(o.id + ":" + o.ai));
    if (!options.length) break;
    const pick = options[Math.floor(Math.random() * options.length)],
      offer = Object.assign({ uid: offerUid(), attemptAt: 0 }, pick);
    list.push(offer);
    used.add(offer.id + ":" + offer.ai);
  }
  all[mode] = list.slice(0, 4);
  return all[mode];
}

function cleanOffers(mode) {
  const all = ensureGuildOffers(),
    abyss = mode === "abyss";
  all[mode] = all[mode].filter(
    o =>
      o &&
      CONTRACTS_V75[o.id] &&
      o.abyss === abyss &&
      accessibleAreas(mode).includes(Number(o.ai)) &&
      !contractStageRecordV75(Number(o.ai), abyss)[o.id] &&
      (o.id !== "mastery" || masteryReadyV75(Number(o.ai), abyss))
  );
  return refillOffers(mode);
}

function offerCooldown(o) {
  return Math.max(0, GUILD_COOLDOWN - (Date.now() - (Number(o.attemptAt) || 0)));
}

function launchGuildOffer(uid) {
  const mode = offerMode(),
    offer = cleanOffers(mode).find(o => o.uid === uid);
  if (!offer) return;
  const left = offerCooldown(offer);
  if (left > 0) return;
  const previousRun = run,
    oldTypeCooldown = Number(S.contractCooldownV73 && S.contractCooldownV73[offer.id]) || 0;
  S.contractCooldownV73 = S.contractCooldownV73 || {};
  S.contractCooldownV73[offer.id] = 0;
  S.activeContractV70 = offer.id;
  launchingGuildOffer = offer;
  try {
    if (offer.abyss && window.abyssAPIv50) window.abyssAPIv50.enterAbyss(offer.ai);
    else startRun(offer.ai);
  } finally {
    launchingGuildOffer = null;
    S.contractCooldownV73[offer.id] = oldTypeCooldown;
  }
  if (run && run !== previousRun && !run.over) {
    offer.attemptAt = Date.now();
    run.contractV70 = offer.id;
    run.guildContractV75 = offer.id;
    run.guildOfferUidV75 = offer.uid;
    run.guildOfferModeV75 = mode;
    run.guildOfferAreaV75 = offer.ai;
    applyContractChallenge();
    S.activeContractV70 = null;
    $("guildv70").classList.remove("on");
    scheduleSave();
  } else {
    S.activeContractV70 = null;
    renderGuildOffers();
  }
}

function renderGuildOffers() {
  ensureGuildOffers();
  const grid = $("contractgridv70");
  if (!grid) return;
  const mode = offerMode(),
    offers = cleanOffers(mode);
  grid.classList.add("guildofferv75");
  grid.innerHTML = offers.length
    ? offers
        .map(o => {
          const c = CONTRACTS_V75[o.id],
            left = offerCooldown(o),
            ready = !left;
          return (
            '<article class="contractv70" style="--cc:' +
            c.color +
            '"><h3>' +
            c.icon +
            " " +
            c.name +
            '</h3><div class="contractareav75">' +
            (o.abyss ? "🌀 Abyss · " : "") +
            AREAS[o.ai].n +
            '</div><p class="contractriskv88"><strong>CHALLENGE · ' +
            c.risk +
            '</strong></p><div class="contractrewardv70">' +
            c.reward +
            '</div><div class="contractcoolv75 ' +
            (ready ? "ready" : "") +
            '">' +
            (ready ? "Ready to attempt" : "Recovery · " + Math.ceil(left / 1000) + " seconds") +
            '</div><button data-offer="' +
            o.uid +
            '" ' +
            (ready ? "" : "disabled") +
            ">" +
            (ready ? "Attempt contract" : "Recovering") +
            "</button></article>"
          );
        })
        .join("")
    : '<div class="guildemptyv75">Every available contract in this mode has been completed.</div>';
  grid.querySelectorAll("[data-offer]").forEach(b => (b.onclick = () => launchGuildOffer(b.dataset.offer)));
  const head = $("guildv70").querySelector(".guildheadv70 p");
  if (head)
    head.innerHTML =
      mode === "abyss"
        ? '<b style="color:#1fb8ad">🌀 ABYSS CONTRACTS</b> · a separate board for the Abyss stages, with its own completions and abyss-scale bounties. Switch the stage map back to the campaign for campaign contracts.'
        : "Choose one of four contracts drawn from your accessible areas. Every offer has its own cooldown, shown on that contract after an attempt." +
          (S.abyssUnlocked ? " Switch the stage map to the Abyss for abyss contracts." : "");
}

function applyContractChallenge() {
  if (!run || run.over || run.hunt) return;
  const id = activeContractKey();
  if (id !== "iron" && id !== "mastery") return;
  (run.foes || []).forEach(f => {
    if (!f || f._guildHpV70 || f._guildHpV75) return;
    f._guildHpV75 = true;
    f.max = Math.max(1, Math.round(f.max * 1.45));
    f.hp = Math.max(1, Math.round(f.hp * 1.45));
  });
  try {
    buildFoeBars();
    drawBars();
  } catch (e) {}
}

function contractMarksV75() {
  if (areaUi && typeof areaUi.contractMarks === "function") areaUi.contractMarks();
  const abyss = !!S.abyssMode,
    tiles = [...($("areas") ? $("areas").querySelectorAll(".atile") : [])].slice(0, AREAS.length);
  tiles.forEach((tile, i) => {
    const marks = tile.querySelector(".contractmarksv72");
    if (!marks || tile.classList.contains("lock") || !AREAS[i]) return;
    const rec = (S.contractStageV72 || {})[(abyss ? "A" : "N") + ":" + i] || {};
    if (rec.mastery) {
      marks.classList.add("masteryv75");
      marks.innerHTML = '<i title="Ultimate Guild Challenge completed">★</i>';
    } else {
      marks.classList.remove("masteryv75");
      const icons = { blood: "🩸", onslaught: "⚡", iron: "🛡", glass: "◆" };
      marks.innerHTML = Object.keys(icons)
        .filter(k => rec[k])
        .map(k => '<i title="' + CONTRACTS_V75[k].name + ' completed">' + icons[k] + "</i>")
        .join("");
    }
  });
}

/* V99 — Guild window redesign: stage-scaled gold+shard bounty, +2 QP mastery, cleaner cards */
function bounty(ai, mastery, abyss) {
  if (abyss) {
    // Abyss contracts pay at abyss scale: about 1.3 stage clears of gold, celestial shards worth
    // roughly half to one ✦ step, and an abyss token (Doc, 2026-10-01).
    var k = Math.max(0, Math.min(16, ai | 0)),
      ab = {
        gold: Math.round(1500000 * (1 + 0.12 * k)),
        shards: 0,
        celestial: Math.round(5 + 0.9 * k),
        tokens: 1,
        abyss: true
      };
    if (mastery) {
      ab.gold = Math.round(ab.gold * 1.35);
      ab.celestial = Math.round(ab.celestial * 1.35);
      ab.tokens = 2;
    }
    return ab;
  }
  var n = (ai | 0) + 1,
    g = Math.round(400 * Math.pow(n, 1.5)),
    s = Math.round(7 * Math.pow(n, 1.25));
  if (mastery) {
    g = Math.round(g * 1.35);
    s = Math.round(s * 1.35);
  }
  return { gold: g, shards: s };
}
