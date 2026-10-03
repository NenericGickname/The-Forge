/* Doc's feedback round, 2026-10-02 (late):
   1. Celestial forging: a strike counts at the moment the finger/mouse goes DOWN, not on release,
      and the odds line keeps a fixed height so the bar no longer jumps a few px after it starts moving.
   2. Auto run plays at 1.5x game speed.
   3. Bag Expansion stops at 40 slots.
   4. Weapons: drop ~1.5x as often (one slot of n is the weapon: 1/n -> 1.5/n), plus a pity counter:
      after WEAPON_PITY bags without a weapon of at least your weapon's rarity (capped at Legendary),
      the next bag becomes one.
   5. Murderquito: a rare post-"The End?" mosquito. Tiny health, huge armour-piercing bites.
      It gives Toughen Up a reason to be in your kit; tanking or healing through it works too.
      Revised 2026-10-03 (Doc): bite scales with the stage (enemy attack), not with your health;
      no Toughen Up highlight; easier to notice (announcement, bigger); ignores splash damage. */

/* ---------- 1. celestial strike on press ---------- */
{
  const btn = $("strikebtn");
  let swallowUntil = 0;
  if (btn) {
    btn.addEventListener(
      "pointerdown",
      ev => {
        if (ev.button != null && ev.button !== 0) return;
        if (btn.disabled || getComputedStyle(btn).visibility === "hidden") return;
        if (typeof strikeLocked !== "undefined" && strikeLocked) return;
        ev.preventDefault();
        swallowUntil = performance.now() + 700;
        btn.click(); // judged with the marker exactly where it was when the finger landed
      },
      { passive: false }
    );
    // the real click that follows the press must not strike a second time
    document.addEventListener(
      "click",
      ev => {
        if (ev.isTrusted && performance.now() < swallowUntil && (ev.target === btn || btn.contains(ev.target))) {
          swallowUntil = 0;
          ev.stopImmediatePropagation();
          ev.preventDefault();
        }
      },
      true
    );
  }
  const st = document.createElement("style");
  // two lines reserved: the odds text switches between one and two lines while the bar runs
  st.textContent = "#strike .forgeodds{min-height:36px;display:flex;flex-direction:column;justify-content:center}";
  document.head.appendChild(st);
}

/* ---------- 2. auto run at 1.5x ---------- */
const AUTO_RUN_SPEED = 1.5;
{
  const tickBeforeSpeed = tick;
  tick = function () {
    const r = tickBeforeSpeed.apply(this, arguments);
    if (run && !run.over && run.autoRunV54 && typeof autoRunState !== "undefined" && autoRunState) {
      run._speedAccV127 = (run._speedAccV127 || 0) + (AUTO_RUN_SPEED - 1);
      if (run._speedAccV127 >= 1) {
        run._speedAccV127 -= 1;
        tickBeforeSpeed.apply(this, arguments);
      }
    }
    return r;
  };
}

/* ---------- 3. bag cap 40 ---------- */
const BAG_CAP_MAX = 40;
{
  const renderShopBeforeCap = renderShop;
  renderShop = function () {
    const r = renderShopBeforeCap.apply(this, arguments);
    const grid = $("shopgrid");
    if (grid)
      [...grid.querySelectorAll(".shopcard")].forEach(card => {
        const t = card.querySelector(".sn");
        if (!t || !t.textContent.includes("Bag Expansion")) return;
        const b = card.querySelector("button"),
          d = card.querySelector(".sd");
        if ((S.bagCap || 0) >= BAG_CAP_MAX) {
          if (d) d.textContent = "Your bag holds " + S.bagCap + " items, the most it can.";
          if (b) {
            b.disabled = true;
            b.textContent = "✓ Max";
          }
        } else if (b) {
          const nativeBuy = b.onclick;
          b.onclick = function () {
            const before = S.bagCap;
            const res = nativeBuy && nativeBuy.apply(this, arguments);
            if (S.bagCap > BAG_CAP_MAX && before < BAG_CAP_MAX) S.bagCap = BAG_CAP_MAX;
            return res;
          };
        }
      });
    return r;
  };
}

/* ---------- 4. weapon drops and weapon pity ---------- */
const WEAPON_PITY = 40,
  WEAPON_DROP_BOOST = 1.5;
function bestWeaponRarityV127() {
  let r = 0;
  [S.gear && S.gear.weapon, S.gear2 && S.gear2.weapon].forEach(w => {
    if (w && !w.broken) r = Math.max(r, w.rar || 0);
  });
  return r;
}
{
  const pityBeforeWeapons = applyPityV70;
  applyPityV70 = function (bag) {
    let changed = false;
    if (bag && !bag.unique && !bag.guaranteedMythicV50 && (bag.rar || 0) < 5) {
      const n = Math.max(1, S.slotsOpen || 1);
      // a bit more weapons: 1/n -> 1.5/n
      if (n > 1 && bag.slot !== "weapon" && Math.random() < (WEAPON_DROP_BOOST - 1) / (n - 1)) {
        bag.slot = "weapon";
        changed = true;
      }
      const want = Math.max(2, Math.min(4, bestWeaponRarityV127()));
      S.weaponPityV127 = (S.weaponPityV127 || 0) + 1;
      if (bag.slot === "weapon" && (bag.rar || 0) >= want) S.weaponPityV127 = 0;
      else if (n > 1 && S.weaponPityV127 >= WEAPON_PITY) {
        bag.slot = "weapon";
        bag.rar = Math.max(bag.rar || 0, want);
        bag.pityWeaponV127 = true;
        S.weaponPityV127 = 0;
        changed = true;
        try {
          floatDmg("hero", "⚒ THE FORGE PROVIDES: A WEAPON", 0, "#ffd76a");
        } catch (e) {}
      }
    }
    return pityBeforeWeapons.call(this, bag) || changed;
  };
}

/* ---------- 5. Murderquito ---------- */
const MQ = {
  chance: 0.4, // per eligible run, so about once every 2 to 3 runs
  bite: 3, // x its own attack (a normal enemy of that level), ignores armour and dodge; x1.5 in the Abyss like every ability
  firstBite: 2800, // ms after it appears: time to react
  every: 3400,
  hpMul: 1
};
ENEMIES.murderquito = {
  n: "Murderquito",
  c: "#3a2a2a",
  sz: 1,
  shape: "ghost",
  hpM: 0.6,
  atkM: 0.2,
  defM: 0.2,
  res: { fire: -0.3, ice: 0.2, lightning: 0 }
};
function mqEligibleV127() {
  if (!run || run.hunt || run.dummy || run.mirrorPlane || run.rushSeq || !run.total) return false;
  const abyss = !!(run.a && run.a.abyss);
  if (abyss) return true;
  return (S.clearedAreas || []).includes(12) && run.ai >= 12;
}
function mqWhineV127(len = 1.1, loud = 1) {
  try {
    ensureAudioState();
    const a = actx(),
      t = a.currentTime,
      vol = 0.07 * loud * (S.sfxVolume == null ? 1 : S.sfxVolume);
    if (vol <= 0) return;
    const g = a.createGain(),
      bp = a.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.12);
    g.gain.setValueAtTime(vol, t + len - 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    bp.connect(g);
    g.connect(a.destination);
    [0, 7].forEach(det => {
      const o = a.createOscillator(),
        lfo = a.createOscillator(),
        lg = a.createGain();
      o.type = "sawtooth";
      o.frequency.setValueAtTime(610 + det, t);
      o.frequency.linearRampToValueAtTime(680 + det, t + len); // "meeeeee", rising
      lfo.frequency.value = 7 + det * 0.3;
      lg.gain.value = 22;
      lfo.connect(lg);
      lg.connect(o.frequency);
      o.connect(bp);
      o.start(t);
      lfo.start(t);
      o.stop(t + len);
      lfo.stop(t + len);
    });
  } catch (e) {}
}
function spawnMurderquitoV127() {
  const lvl = (run.a && run.a.lvl ? run.a.lvl : 100) + (run.wave || 1) - 1,
    m = buildFoe("murderquito", lvl, MQ.hpMul, false);
  if (!m) return;
  m.cd = 1e12; // never melees; it only bites (below)
  m.mqNextV127 = run.time + MQ.firstBite;
  m.mqWarnedV127 = false;
  m._x = typeof foeBaseX === "function" ? foeBaseX(run.foes.length, run.foes.length + 1) : 520;
  run.foes.push(m);
  run.mqSeenV127 = true;
  try {
    buildFoeBars();
    drawBars();
  } catch (e) {}
  mqWhineV127(1.4, 1.2);
  floatDmg("foe", "🦟 MEEEEEE…", 0, "#ff5a6e", m._x);
  m.evasiveV127 = true; // too small for sweeps, chains and spreads
  floatDmg("hero", "🦟 A MURDERQUITO APPEARS", 0, "#ff9aa6");
}
if (typeof nextWave === "function") {
  const nextWaveBeforeMq = nextWave;
  nextWave = function () {
    const r = nextWaveBeforeMq.apply(this, arguments);
    try {
      if (run && run.mqWaveV127 === undefined) {
        // one roll per run: maybe one Murderquito, on a regular wave (never the boss wave)
        run.mqWaveV127 =
          mqEligibleV127() && run.total >= 3 && Math.random() < MQ.chance
            ? 2 + Math.floor(Math.random() * Math.max(1, run.total - 2))
            : 0;
      }
      if (run && run.mqWaveV127 && run.wave === run.mqWaveV127 && !run.mqSeenV127 && run.wave < run.total)
        spawnMurderquitoV127();
    } catch (e) {}
    return r;
  };
}
{
  const tickBeforeMq = tick;
  tick = function () {
    const r = tickBeforeMq.apply(this, arguments);
    try {
      if (!run || run.over || !run.foes) return r;
      let alive = false;
      for (const f of run.foes) {
        if (f.key !== "murderquito" || f.hp <= 0 || f.dead) continue;
        alive = true;
        f.cd = 1e12;
        if (f.freezeUntil && run.time < f.freezeUntil) {
          f.mqNextV127 += 150;
          continue;
        }
        if (!f.mqWarnedV127 && run.time >= f.mqNextV127 - 900) {
          f.mqWarnedV127 = true;
          mqWhineV127(0.9);
        }
        if (run.time >= f.mqNextV127) {
          f.mqNextV127 = run.time + MQ.every;
          f.mqWarnedV127 = false;
          f.atkA = 1;
          const abyss = !!(run.a && run.a.abyss),
            // abilityHitHero adds x1.5 in the Abyss; the bite is defined as a share of max health, so undo it
            dmg = Math.max(1, f.atk * MQ.bite);
          run._queuedAbilitySourceV41 = f;
          abilityHitHero(dmg, "🦟 BITE", "#ff3355");
          run._queuedAbilitySourceV41 = null;
          try {
            beep(1500, 0.05, "square", 0.08);
          } catch (e) {}
        }
      }
    } catch (e) {}
    return r;
  };
}
if (typeof drawFoe === "function") {
  const drawFoeBeforeMq = drawFoe;
  drawFoe = function (f, cx, gy) {
    if (!f || f.key !== "murderquito") return drawFoeBeforeMq(f, cx, gy);
    try {
      const t = typeof anim !== "undefined" && anim ? anim.t : 0,
        x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 40,
        y = gy - 44 + Math.sin(t * 5 + cx) * 5,
        dart = f.mqNextV127 && run ? Math.max(0, 1 - (f.mqNextV127 - run.time) / 900) : 0;
      ctx.save();
      if (f.dead) ctx.globalAlpha = Math.max(0, 1 - (f.deadA || 0));
      ctx.fillStyle = "#00000040";
      ctx.beginPath();
      ctx.ellipse(cx, gy + 2, 10, 2.5, 0, 0, 7);
      ctx.fill();
      ctx.translate(x, y);
      ctx.scale(1.6, 1.6); // readable on a phone
      ctx.translate(-x, -y);
      // wings, beating fast
      const flap = Math.sin(t * 60) * 0.5 + 0.5;
      ctx.fillStyle = "rgba(210,230,255,0.45)";
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1;
      [-1, 1].forEach(s => {
        ctx.beginPath();
        ctx.ellipse(x + 3, y - 8 - flap * 4, 13, 4.5, s * (0.5 + flap * 0.5) - 0.2, 0, 7);
        ctx.fill();
        ctx.stroke();
      });
      // dangling legs
      ctx.strokeStyle = "#1b1212";
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 2 + i * 4, y + 2);
        ctx.lineTo(x - 6 + i * 5, y + 14 + Math.sin(t * 3 + i) * 2);
        ctx.lineTo(x - 8 + i * 5, y + 22);
        ctx.stroke();
      }
      // striped abdomen (tilted up behind), thorax, head
      const hurt = f.hurt > 0.3;
      ctx.save();
      ctx.translate(x + 12, y - 2);
      ctx.rotate(-0.35);
      ctx.fillStyle = hurt ? "#ffffff" : "#5a2a2a";
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 5, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = hurt ? "#ffffff" : "#c9b48a";
      for (let i = -1; i <= 1; i++) ctx.fillRect(i * 6 - 1, -4.5, 2, 9);
      ctx.restore();
      ctx.fillStyle = hurt ? "#ffffff" : f.c || "#3a2a2a";
      ctx.beginPath();
      ctx.ellipse(x, y, 6, 5, 0, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x - 7, y - 1, 3.6, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#ff2a3a";
      ctx.shadowColor = "#ff2a3a";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(x - 8.5, y - 2, 1.6, 0, 7);
      ctx.fill();
      ctx.shadowBlur = 0;
      // proboscis, pointed at the hero; glows red just before a bite
      ctx.strokeStyle = dart > 0 ? "rgba(255," + Math.round(200 - 160 * dart) + ",80,1)" : "#2a1a1a";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x - 10, y);
      ctx.lineTo(x - 26 - dart * 6, y + 6);
      ctx.stroke();
      ctx.restore();
    } catch (e) {}
  };
}
window.forgeV127 = { MQ, spawnMurderquito: spawnMurderquitoV127, whine: mqWhineV127, AUTO_RUN_SPEED, BAG_CAP_MAX, WEAPON_PITY };

/* ---------- 6. Frost deals damage (Doc, 2026-10-03) ----------
   Frost only slowed and (at ✦5) froze, so a frost weapon on an Elemental build dealt almost nothing.
   Now every hit also deals Frostbite: ice damage from attack and the frost stat, scaled like the other
   effects (Elemental Amp, tree, Element Amp skill, dagger bonus), growing with the target's frost stacks.
   Frozen targets take extra Frostbite. Knobs: window.__abyssTune.frost {atk, stat, stack, frozen},
   window.__abyssTune.dot.frost {c, k}. */
DOT_SCALE.frost = { c: 10, k: 1.1 }; // Abyss Omega wave clear, Elemental dagger: frost ~195 s vs poison 196, burn 191
const FROST = { atk: 0.2, stat: 0.6, stack: 0.6, frozen: 1.5 };
{
  const effectsBeforeFrostbite = applyWeaponEffects;
  applyWeaponEffects = function (target, dd, tier, hs, g, em) {
    const r = effectsBeforeFrostbite.apply(this, arguments);
    try {
      if (g && g.stats && g.stats.frost && target && target.hp > 0 && run && !run.over && hs) {
        const T = Object.assign({}, FROST, (window.__abyssTune && window.__abyssTune.frost) || {}),
          stacks = target.frostStacks || 0,
          max = Math.max(1, target.frostMax || 3),
          frozen = target.freezeUntil && run.time < target.freezeUntil,
          res = typeof em === "function" ? em(target.res && target.res.ice) : 1,
          bite =
            (hs.atk * T.atk + gStat(g, "frost") * T.stat) *
            statusMulFor(target, hs, "frost") *
            (1 + (T.stack * stacks) / max) *
            (frozen ? T.frozen : 1) *
            res;
        if (bite > 0 && Number.isFinite(bite)) {
          target.hp -= bite;
          target.hurt = 1;
          if (typeof statusLeech === "function") statusLeech(bite, hs);
          if (run.dmgLog) run.dmgLog.push([run.time, bite]);
          recordDummyDamage("frostbite", "❄", "Frostbite", bite, "#8fe0ff");
          floatDmg("foe", Math.round(bite), 0, "#8fe0ff", target._x);
        }
      }
    } catch (e) {}
    return r;
  };
}
