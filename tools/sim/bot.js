// In-page bot for the pacing simulation. Injected before the game loads; call window.__bot.start(cfg).
(function () {
  const L = (window.__simLog = { events: [], samples: [], stuck: [] });
  const cfg = { hitRate: 1, silverRate: 1, forgeEvery: 1 };
  let deathsHere = 0,
    farmLeft = 0,
    lastAi = -1,
    lastSampleAt = 0,
    lastProgressAt = 0,
    lastSig = "",
    startT = 0;
  const now = () => Date.now() - startT;
  const vis = el => el && el.offsetParent !== null;
  const on = id => {
    const e = document.getElementById(id);
    return !!(e && e.classList.contains("on"));
  };
  const click = el => {
    if (el && !el.disabled) {
      el.click();
      return true;
    }
    return false;
  };
  const tr = x => { (L.trace = L.trace || []).push(Math.round(now()/100)/10 + ' ' + x); if (L.trace.length > 60) L.trace.shift(); };
  const ev = (k, d) => L.events.push(Object.assign({ t: now(), k }, d || {}));

  function gearSummary() {
    const out = {};
    for (const k in S.gear || {}) {
      const g = S.gear[k];
      if (g) out[k] = { plus: g.plus || 0, cel: g.celestial || 0, ilvl: g.ilvl, rar: g.rar, broken: !!g.broken };
    }
    return out;
  }
  function sample() {
    const hs = (() => {
      try {
        return heroStats();
      } catch (e) {
        return {};
      }
    })();
    L.samples.push({
      t: now(),
      lvl: S.lvl || S.heroLvl || null,
      gold: S.gold,
      shards: S.shards,
      esh: S.epicShards,
      csh: S.celestialShards || 0,
      cleared: (S.clearedAreas || []).slice(),
      gear: gearSummary(),
      atk: hs.atk,
      hp: hs.hp
    });
  }

  // Remember milestones
  const seen = { area: {}, plus: {}, cel: {}, lvl: {} };
  function milestones() {
    (S.clearedAreas || []).forEach(a => {
      if (!seen.area[a]) {
        seen.area[a] = 1;
        ev("areaClear", { a });
        lastProgressAt = now();
      }
    });
    const gs = Object.values(S.gear || {}).filter(Boolean);
    if (gs.length) {
      const minPlus = Math.min(...gs.map(g => g.plus || 0));
      for (let p = 1; p <= minPlus; p++)
        if (!seen.plus[p]) {
          seen.plus[p] = 1;
          ev("allPlus", { p });
          lastProgressAt = now();
        }
      const minCel = gs.length >= 6 ? Math.min(...gs.map(g => ((g.plus || 0) >= 20 ? g.celestial || 0 : -1))) : -1;
      for (let c = 1; c <= minCel; c++)
        if (!seen.cel[c]) {
          seen.cel[c] = 1;
          ev("allCel", { c });
          lastProgressAt = now();
        }
    }
    const lv = heroLevel();
    if (lv && !seen.lvl[lv]) {
      seen.lvl[lv] = 1;
      ev("heroLvl", { lv });
    }
  }
  function heroLevel() {
    const el = document.getElementById("herolvl");
    const m = el && el.textContent.match(/(\d+)/);
    return m ? +m[1] : null;
  }

  // ---------- town actions ----------
  const retired = new WeakSet();
  function equipBetter() {
    let changed = false,
      swaps = 0;
    try {
      ensureGearBag();
    } catch (e) {}
    const pools = [
      ["loot", S.bag || []],
      ["gearbag", S.gearBagV82 || []]
    ];
    for (const [kind, arr] of pools) {
      for (let i = 0; i < arr.length; i++) {
        const g = arr[i];
        if (!g || !g.slot) continue;
        const cur = S.gear[g.slot];
        if (retired.has(g)) continue;
        let better = !cur || cur.broken;
        if (!better) {
          // judge the new item as if it were forged to the same + level (a player would re-forge it)
          const probe = JSON.parse(JSON.stringify(g));
          probe.plus = cur.plus || 0;
          probe.celestial = 0;
          better = gpower(probe) > gpower(cur) * 1.1;
        }
        if (better) {
          if (swaps++ > 12) return changed;
          if (cur) retired.add(cur); // never swap the replaced item back in
          if (moveItem({ kind, index: i }, { kind: "equipped", slot: g.slot })) {
            ev("equip", { slot: g.slot, ilvl: g.ilvl, rar: g.rar });
            changed = true;
            i = -1; // array changed, rescan
          }
        }
      }
    }
    return changed;
  }
  function salvage() {
    const b = document.getElementById("salvageall");
    if (b && !b.disabled && (S.bag || []).length) {
      (S.bag || []).forEach(g => ev("salv", { s: g.slot, i: g.ilvl, r: g.rar, p: Math.round(gpower(g)), cur: S.gear[g.slot] ? Math.round(gpower(S.gear[g.slot])) : 0 }));
      b.click();
    }
  }
  function spendSkills() {
    if (!(S.sp > 0)) return;
    const ot = document.getElementById("opentree");
    if (!ot || !vis(ot)) return;
    ot.click();
    for (let k = 0; k < 60 && S.sp > 0; k++) {
      const n = document.querySelector("#sktree .node.can");
      if (!n) break;
      const before = S.sp;
      n.click();
      const conf = [...document.querySelectorAll("#sktree button, .skover.on button")].find(b => vis(b) && /learn|buy|confirm|invest|\+1/i.test(b.textContent) && !b.disabled);
      if (S.sp === before && conf) conf.click();
      if (S.sp === before) break;
      ev("skill", { n: (n.textContent || "").trim().slice(0, 18) });
    }
    const ct = document.getElementById("closetree");
    if (ct && vis(ct)) ct.click();
    closeOverlays();
  }
  // Active skills: heal first, then Berserk, Toughen Up, Rage as loadout slots open.
  const ACT_PLAN = ["heal", "berserk", "toughen", "rage"];
  function manageActives() {
    const a = ensureState_p21();
    if (!a) return;
    const want = ACT_PLAN.slice(0, unlockedSlots());
    for (const id of want) {
      if (skillLocked(id) && S.spA > 0) {
        a.pow[id] = (a.pow[id] || 0) + 1;
        S.spA--;
        ev("actLearn", { id });
      }
    }
    a.loadout = want.filter(id => !skillLocked(id));
    // spend the rest round-robin: power first, then cooldown
    let guard = 0;
    while (S.spA > 0 && guard++ < 50) {
      let spent = false;
      for (const id of a.loadout) {
        if (S.spA <= 0) break;
        const tr = (a.pow[id] || 0) < POWMAX ? "pow" : (a.cd[id] || 0) < CDMAX ? "cd" : (a.dur[id] || 0) < DURMAX ? "dur" : null;
        if (!tr) continue;
        a[tr][id] = (a[tr][id] || 0) + 1;
        S.spA--;
        spent = true;
      }
      if (!spent) break;
    }
  }
  function useActives() {
    const a = ensureState_p21();
    if (!a || !run || !run.hero) return;
    for (const id of a.loadout) {
      if (id === "heal") {
        if (run.hero.hp < run.hero.max * 0.55) activate(id);
      } else activate(id);
    }
  }
  function economy() {
    // refine surplus shards into epic shards, keeping enough for the next few + levels
    let need = 0;
    for (const k in S.gear || {}) {
      const g = S.gear[k];
      if (g && (g.plus || 0) < 20) try { need = Math.max(need, upCost(g).shards || 0); } catch (e) {}
    }
    const keep = Math.max(2000, need * 6);
    const units = Math.floor((S.shards - keep) / 100);
    if (units >= 5 && convertCurrency("regular", units)) ev("refine", { units });
    // keep the Tome of Insight running when gold is plentiful
    const tc = xpBuffCost();
    if ((S.xpBuffUntil || 0) < Date.now() && S.gold > tc * 20) {
      S.gold -= tc;
      activateXpBuff();
      ev("tome", { cost: tc });
    }
  }
  function buySlots() {
    if (!(S.slotsOpen < SLOTS.length)) return false;
    const cost = UNLOCK[S.slotsOpen];
    if (S.gold < cost) return false;
    const tile = [...document.querySelectorAll("#slots .slot")].find(d => /unlock/i.test(d.textContent));
    if (!tile) return false;
    tile.click();
    ev("slotBuy", { n: S.slotsOpen, cost });
    return true;
  }
  let lastMine = 0;
  function claimMine() {
    if (now() - lastMine < 10 * 60000) return;
    lastMine = now();
    const mb = document.getElementById("minebtnv83");
    if (!mb || !vis(mb)) return;
    mb.click();
    const b = [...document.querySelectorAll("#minev83 button")].find(x => /claim/i.test(x.textContent) && !x.disabled);
    if (b) {
      b.click();
      ev("mineClaim");
    }
    closeOverlays();
  }
  function claimStuff() {
    claimMine();
    const qb = document.getElementById("questbtnv74");
    if (qb && vis(qb)) {
      qb.click();
      document.querySelectorAll(".questclaimtrackv84, .questgridv74 button").forEach(b => {
        if (!b.disabled && /claim/i.test(b.textContent)) {
          b.click();
          ev("questClaim");
        }
      });
      closeOverlays();
    }
    document.querySelectorAll(".questclaimtrackv84, .questgridv74 button").forEach(b => {
      if (!b.disabled && /claim/i.test(b.textContent)) b.click();
    });
    try {
      const b = [...document.querySelectorAll("button")].filter(x => /claim/i.test(x.textContent) && !x.disabled);
      b.slice(0, 5).forEach(x => x.click());
    } catch (e) {}
  }
  function closeOverlays() {
    document.querySelectorAll(".skover.on").forEach(e => e.classList.remove("on"));
  }

  // cheapest affordable forge upgrade on equipped gear (+levels first, then celestial)
  function pickForge() {
    let best = null;
    for (const k in S.gear || {}) {
      const g = S.gear[k];
      if (!g || g.broken || (g.plus || 0) >= 20) continue;
      let c;
      try {
        c = upCost(g);
      } catch (e) {
        continue;
      }
      const ok =
        S.gold >= (c.gold || 0) &&
        S.shards >= (c.shards || 0) &&
        S.epicShards >= (c.esh || 0) &&
        (S.celestialShards || 0) >= (c.cshards || 0);
      if (!ok) continue;
      const score = (c.gold || 0) + (c.shards || 0) * 50 + (c.esh || 0) * 5000;
      if (!best || score < best.score) best = { k, g, cel: false, score };
    }
    if (best) return best;
    if (celBlockedUntil > now()) return null;
    const cels = Object.keys(S.gear || {})
      .map(k => ({ k, g: S.gear[k] }))
      .filter(x => x.g && !x.g.broken && (x.g.plus || 0) >= 20 && (x.g.celestial || 0) < celestialCapFor(x.g))
      .sort((a, b) => (a.g.celestial || 0) - (b.g.celestial || 0));
    for (const x of cels) {
      S.sel = x.k;
      try {
        renderTown();
      } catch (e) {}
      const cb = document.getElementById("celbtn");
      if (cb && vis(cb) && !cb.disabled) return { k: x.k, g: x.g, cel: true };
    }
    return null;
  }
  let boonPick = 0, clearMarked = false;
  let struck = false, lastWave = 0, lastBoss = false;
  const bossFail = {};
  function teamPower() {
    let s = 0;
    for (const k in S.gear || {}) if (S.gear[k]) s += gpower(S.gear[k]);
    return s;
  }
  function shouldRetreat(ai) {
    const f = bossFail[ai];
    if (!f) return false;
    if (heroLevel() > f.lvl || teamPower() > f.pow * 1.15) {
      delete bossFail[ai];
      return false;
    }
    return true;
  }
  let celBlockedUntil = 0,
    lockedSteps = 0;
  let forging = null;
  function forgeStep() {
    // returns true while busy
    if (on("strike") || document.getElementById("strike").classList.contains("on")) {
      const btn = document.getElementById("strikebtn");
      const txt = btn ? btn.textContent : "";
      if (strikeLocked) {
        const broke = /not enough/i.test((document.getElementById("baseodds") || {}).textContent || "");
        if (broke || ++lockedSteps > 30) {
          lockedSteps = 0;
          click(document.getElementById("strikedone"));
          if (broke && forging && forging.cel) celBlockedUntil = now() + 10 * 60000;
          forging = null;
        }
        return true;
      }
      lockedSteps = 0;
      const midSequence = celestialMode && celHitsDone > 0 && celHitsDone < celHitsNeeded;
      if (midSequence) struck = false; // celestial needs more silver hits in this attempt
      if (struck || btn.disabled) {
        struck = false;
        tr('done btn=' + txt + ' plus=' + (S.gear[S.sel]||{}).plus);
        click(document.getElementById("strikedone"));
        forging = null;
        return true;
      }
      try {
        cancelAnimationFrame(sRAF);
      } catch (e) {}
      const r = Math.random();
      if (r < cfg.silverRate) sPos = zcL + ZCW / 2;
      else if (r < cfg.hitRate) sPos = zL + 2;
      else sPos = zL > 60 ? 5 : 310;
      struck = true;
      tr('strike sPos=' + sPos.toFixed(0) + ' zcL=' + zcL.toFixed(0) + ' gold=' + S.gold + ' plus=' + (S.gear[S.sel]||{}).plus);
      btn.click();
      tr('after click locked=' + strikeLocked + ' gold=' + S.gold + ' btn=' + btn.textContent);
      return true;
    }
    if (forging) {
      forging = null;
      return false;
    }
    const f = pickForge();
    if (!f) return false;
    S.sel = f.k;
    try {
      renderTown();
    } catch (e) {}
    forging = f;
    const b = document.getElementById(f.cel ? "celbtn" : "upbtn");
    if (!click(b)) {
      forging = null;
      return false;
    }
    ev(f.cel ? "celTry" : "forgeTry", { slot: f.k, from: f.cel ? f.g.celestial || 0 : f.g.plus || 0 });
    return true;
  }

  // Area policy: push the newest area; if the last two tries there failed, farm the highest area
  // that has been won at least 3 of the last 4 times, and push again after 3 farm runs.
  const hist = {};
  function outcome(ai, v) {
    if (ai == null || ai < 0) return;
    (hist[ai] = hist[ai] || []).push({ v, t: now() });
    if (hist[ai].length > 6) hist[ai].shift();
  }
  const rate = ai => {
    const h = (hist[ai] || []).filter(x => now() - x.t < 20 * 60000).slice(-4);
    return h.length ? h.reduce((a, b) => a + b.v, 0) / h.length : null;
  };
  function chooseArea() {
    const cleared = S.clearedAreas || [];
    const push = Math.min(cleared.length ? Math.max(...cleared) + 1 : 0, AREAS.length - 1);
    const h = (hist[push] || []).slice(-2);
    const pushFailing = h.length === 2 && h.every(x => x.v < 1);
    if (!pushFailing) return push;
    if (farmLeft <= 0) {
      farmLeft = 3;
      return push; // retry the new area after farming
    }
    farmLeft--;
    // farm the highest cleared area unless it has also been failing
    for (let a = push - 1; a >= 0; a--) {
      const r = rate(a);
      if (r === null || r >= 0.5) return a;
    }
    return 0;
  }
  function step() {
    try {
      milestones();
      if (now() - lastSampleAt > 5 * 60000) {
        sample();
        lastSampleAt = now();
      }
      // modal tips
      const tip = document.getElementById("tipmodal");
      if (tip && tip.classList.contains("on")) return click(document.getElementById("tipok"));
      for (const b of document.querySelectorAll("button")) {
        if (vis(b) && /^(Got it|OK)$/i.test(b.textContent.trim())) {
          b.click();
          return;
        }
      }
      // strike overlay handled by forgeStep
      if (document.getElementById("strike").classList.contains("on")) return forgeStep();
      if (on("dead")) {
        ev("death", { a: lastAi, w: lastWave, boss: lastBoss });
        outcome(lastAi, 0);
        if (lastBoss && lastAi >= 0) bossFail[lastAi] = { lvl: heroLevel(), pow: teamPower() };
        return click(document.getElementById("deadok"));
      }
      if (on("clear")) {
        if (!clearMarked) { outcome(run && run.ai, 1); clearMarked = true; }
        const opts = [...document.querySelectorAll("#boons > *")].filter(vis);
        if (opts.length) {
          const pick = opts[boonPick++ % opts.length];
          ev("boon", { txt: pick.textContent.trim().slice(0, 20) });
          pick.click();
          return;
        }
        const bs = [...document.querySelectorAll("#clear button")].filter(vis);
        return click(bs[0]);
      }
      if (on("huntchoice")) return click(document.getElementById("huntleave"));
      if (on("lootopen")) {
        const oa = document.getElementById("openall");
        if (vis(oa) && !oa.disabled) return oa.click();
        return click(document.getElementById("lootleave"));
      }
      // in a run
      const runEl = document.getElementById("run");
      if (run && !run.over && runEl && runEl.style.display === "block") {
        lastWave = run.wave;
        lastBoss = (run.foes || []).some(f => f && f.boss);
        useActives();
        const rt = document.getElementById("retreat");
        if (rt && vis(rt) && !rt.disabled && run.wave >= run.total && shouldRetreat(run.ai)) {
          ev("retreat", { a: run.ai });
          outcome(run.ai, 0.5);
          rt.click();
        }
        return;
      }
      if (run && run.over && runEl && runEl.style.display === "block") {
        // stuck at end screen: try any visible continue-like button
        const b = [...document.querySelectorAll("#run button, .overlay.on button")].find(
          x => vis(x) && /continue|leave|town|ok|collect|back/i.test(x.textContent)
        );
        if (b) return b.click();
      }
      // town
      const town = document.getElementById("town");
      if (town && town.style.display !== "none") {
        closeOverlays();
        claimStuff();
        closeOverlays();
        if (buySlots()) return;
        if (equipBetter()) return;
        salvage();
        spendSkills();
        manageActives();
        economy();
        closeOverlays();
        if (forgeStep()) return;
        tr('town gold=' + S.gold + ' sh=' + S.shards + ' costs=' + Object.keys(S.gear).map(k => k + ':' + JSON.stringify(upCost(S.gear[k]))).join(' '));
        const ai = chooseArea();
        if (ai !== lastAi) deathsHere = 0;
        lastAi = ai;
        clearMarked = false;
        ev("run", { a: ai });
        startRun(ai);
        return;
      }
      // unknown state
      const sig = [...document.querySelectorAll(".on")].map(e => e.id || e.className).join(",");
      if (sig !== lastSig) {
        L.stuck.push({ t: now(), sig: sig.slice(0, 300) });
        lastSig = sig;
      }
    } catch (e) {
      L.stuck.push({ t: now(), err: String(e && e.message).slice(0, 200) });
    }
  }
  window.__bot = {
    start(c) {
      Object.assign(cfg, c || {});
      startT = Date.now() - (cfg.offset || 0);
      const st = cfg.state;
      if (st) {
        Object.assign(seen, st.seen);
        Object.assign(hist, st.hist);
        Object.assign(bossFail, st.bossFail);
        boonPick = st.boonPick || 0;
        lastMine = st.lastMine || 0;
      }
      sample();
      setInterval(step, 400);
    },
    sample,
    state: () => ({ seen, hist, bossFail, boonPick, lastMine }),
    log: L
  };
})();
