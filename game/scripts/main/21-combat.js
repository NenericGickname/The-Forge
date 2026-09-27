/* Runs and combat: waves, enemies, bosses, hero, damage, status effects, boss hunt, abyss. */

function architectPhase(b, stage) {
  b.atk = Math.round(b.atk * 1.14);
  b.hasteMul = (b.hasteMul || 1) * 0.84;
  flash("#b79fff");
  shake();
  beep(160, 0.35, "sawtooth", 0.16);
  sayBoss(stage >= 3 ? "Recompiling reality. You are deprecated." : "Iterating… you are the bug.");
  $("rmsg").className = "msg big";
  $("rmsg").innerHTML = "🌌 The Architect recompiles — phase " + stage + "!";
}

function spawnSparks(col, n) {
  const c = $("sparks");
  if (!c) return;
  for (let i = 0; i < (n || 12); i++) {
    const s = document.createElement("div");
    s.className = "spark";
    s.style.background = col || cvar("--gold");
    s.style.transition = "transform .45s ease-out, opacity .45s";
    c.appendChild(s);
    const ang = -Math.random() * Math.PI;
    const dist = 16 + Math.random() * 36;
    requestAnimationFrame(() => {
      s.style.transform = "translate(" + Math.cos(ang) * dist + "px," + Math.sin(ang) * dist + "px)";
      s.style.opacity = "0";
    });
    setTimeout(() => s.remove(), 470);
  }
}

function updateHeal() {
  const hb = $("healbtn");
  if (!hb) return;
  if (run && !run.over && S.skills.h1) {
    hb.style.display = "inline-block";
    const cd = run.healCd || 0;
    if (cd > 0) {
      hb.disabled = true;
      hb.textContent = "✚ " + Math.ceil(cd / 1000) + "s";
    } else {
      hb.disabled = false;
      hb.textContent = "✚ Heal";
    }
  } else hb.style.display = "none";
}

function startCast(m, boss) {
  run.cast = { m, dur: m.dur, left: m.dur };
  const cb = $("castbar");
  if (cb) {
    cb.style.left = Math.min(86, Math.max(30, (boss._x / 560) * 100)) + "%";
  }
  const cf = $("cbfill");
  if (cf) {
    cf.style.width = "0%";
    cf.style.background = "linear-gradient(90deg," + m.col + "77," + m.col + ")";
    cf.style.color = m.col;
  }
  const nm = $("cbname");
  if (nm) {
    nm.style.color = m.col;
    nm.innerHTML = '<span class="cbi">' + m.icon + "</span>" + m.name;
  }
  if (cb) cb.classList.add("on");
  const bub = $("bossbubble");
  if (bub) {
    bub.classList.remove("on");
    clearTimeout(bub._t);
  }
  beep(170, 0.18, "sawtooth", 0.09);
  if (m.onCast) m.onCast(boss);
}

function hideCast() {
  const cb = $("castbar");
  if (cb) cb.classList.remove("on");
  if (run) run.cast = null;
}

function critCap() {
  return 5;
}

function heroLook() {
  const w = S.gear.weapon,
    a = S.gear.armor,
    h = S.gear.helm;
  function elemC(g) {
    if (!g) return null;
    const e = [
      ["fire", "#ff7a3f"],
      ["ice", "#6cd0ff"],
      ["lightning", "#ffe14d"]
    ];
    let b = null,
      bv = 0;
    e.forEach(([k, c]) => {
      if ((g.stats[k] || 0) > bv) {
        bv = g.stats[k];
        b = c;
      }
    });
    return b;
  }
  return {
    armorC: a ? rarHex(a.rar) : "#aab3c6",
    armorR: a ? a.rar : 0,
    helmC: h ? rarHex(h.rar) : "#9aa3b5",
    bladeC: elemC(w) || (w ? rarHex(w.rar) : "#eef3ff"),
    bladeGlow: !!(w && w.rar >= 2),
    wRar: w ? w.rar : 0,
    wPlus: w ? w.plus : 0,
    wCel: w ? w.celestial || 0 : 0,
    wtype: w ? w.wtype || "sword" : "sword"
  };
}

function sayBoss(text) {
  const el = $("bossbubble");
  if (!el) return;
  el.textContent = text;
  el.classList.add("on");
  let i = 0;
  const n = Math.min(text.length, 28);
  const iv = setInterval(() => {
    if (i++ >= n) {
      clearInterval(iv);
      return;
    }
    beep(300 + Math.random() * 520, 0.04, "square", 0.055);
  }, 52);
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("on"), 4400);
}

function critMultiplier(tier, critDmg) {
  if (tier <= 0) return 1;
  const regular = Math.max(1.25, 1 + (critDmg || 0) / 100);
  return regular * (tier === 1 ? 1 : 1 + 2 * (tier - 1));
}

function rollCritTier(chance) {
  let prevResult34;
  prev34: {
    const cap = critCap();
    let tier = 0,
      rollChance = Math.max(0, Math.min(500, chance || 0));
    while (tier < cap && Math.random() * 100 < rollChance) {
      tier++;
      rollChance *= 0.5;
    }
    prevResult34 = tier;
    break prev34;
  }
  let tier = prevResult34;
  const joe = S.gear.gloves && S.gear.gloves.mythicAffix === "threeFingerJoe";
  if (!joe || !run) return tier;
  if (tier >= 4) {
    run.joeStacks = 0;
    return tier;
  }
  const p = Math.min(100, (run.joeStacks || 0) * 0.1);
  if (Math.random() * 100 < p) {
    run.joeStacks = 0;
    return 4;
  }
  run.joeStacks = (run.joeStacks || 0) + 1;
  return tier;
}

function drawBossDetails(f, x, gy, sz) {
  const i = f.bossIdx || 0,
    t = anim.t;
  ctx.lineWidth = 3;
  ctx.shadowBlur = 8;
  switch (i) {
    case 0:
      ctx.fillStyle = "#93d85e";
      ctx.beginPath();
      ctx.moveTo(x - 12 * sz, gy - 38 * sz);
      ctx.lineTo(x - 31 * sz, gy - 46 * sz);
      ctx.lineTo(x - 15 * sz, gy - 29 * sz);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 12 * sz, gy - 38 * sz);
      ctx.lineTo(x + 31 * sz, gy - 46 * sz);
      ctx.lineTo(x + 15 * sz, gy - 29 * sz);
      ctx.fill();
      break;
    case 1:
      ctx.strokeStyle = "#c9f3ff";
      ctx.shadowColor = "#7fd8ff";
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(x + k * 9 * sz, gy - 48 * sz);
        ctx.lineTo(x + k * 8 * sz, gy - 66 * sz - Math.abs(k) * 3);
        ctx.stroke();
      }
      break;
    case 2:
      ctx.fillStyle = "#777985";
      ctx.fillRect(x - 32 * sz, gy - 35 * sz, 18 * sz, 22 * sz);
      ctx.fillRect(x + 14 * sz, gy - 35 * sz, 18 * sz, 22 * sz);
      break;
    case 3:
      ctx.strokeStyle = "#b47cff";
      ctx.shadowColor = "#b47cff";
      ctx.beginPath();
      ctx.moveTo(x + 26 * sz, gy - 3);
      ctx.lineTo(x + 31 * sz, gy - 58 * sz);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 31 * sz, gy - 63 * sz, 8 * sz, 0, 7);
      ctx.stroke();
      break;
    case 4:
      ctx.fillStyle = "#ff5a2f";
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + q * 9 * sz, gy - 51 * sz);
        ctx.lineTo(x + q * 24 * sz, gy - 72 * sz);
        ctx.lineTo(x + q * 17 * sz, gy - 45 * sz);
        ctx.fill();
      }
      break;
    case 5:
      ctx.strokeStyle = "#55d9e8";
      ctx.shadowColor = "#55d9e8";
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.moveTo(x + (k - 1.5) * 8 * sz, gy - 3);
        ctx.quadraticCurveTo(
          x + (k - 1.5) * 18 * sz,
          gy + 10 + Math.sin(t * 4 + k) * 8,
          x + (k - 1.5) * 25 * sz,
          gy - 1
        );
        ctx.stroke();
      }
      break;
    case 6:
      ctx.fillStyle = "#e8dcff88";
      for (let k = 0; k < 5; k++) {
        const a = t * 1.5 + k * 1.25;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 33 * sz, gy - 28 * sz + Math.sin(a) * 16 * sz, 4 * sz, 0, 7);
        ctx.fill();
      }
      break;
    case 7:
      ctx.strokeStyle = "#ff8a50";
      ctx.shadowColor = "#ff5a2f";
      ctx.beginPath();
      ctx.arc(x, gy - 32 * sz, 35 * sz, Math.PI, Math.PI * 2);
      ctx.stroke();
      break;
    case 8:
      ctx.strokeStyle = "#b47cff";
      ctx.shadowColor = "#7b4fd0";
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.ellipse(x, gy - 29 * sz, 31 * sz + k * 6, 13 * sz + k * 3, t * 0.4 + k, 0, 7);
        ctx.stroke();
      }
      break;
    case 9:
      ctx.strokeStyle = "#e8f8ff";
      ctx.shadowColor = "#9fe8ff";
      ctx.beginPath();
      ctx.arc(x, gy - 62 * sz, 16 * sz, 0, 7);
      ctx.stroke();
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * 18 * sz, gy - 62 * sz + Math.sin(a) * 18 * sz);
        ctx.lineTo(x + Math.cos(a) * 27 * sz, gy - 62 * sz + Math.sin(a) * 27 * sz);
        ctx.stroke();
      }
      break;
    case 10:
      ctx.strokeStyle = "#ffb070";
      ctx.shadowColor = "#ff5a2f";
      ctx.beginPath();
      ctx.moveTo(x - 28 * sz, gy - 3);
      ctx.lineTo(x - 28 * sz, gy - 66 * sz);
      ctx.moveTo(x - 40 * sz, gy - 58 * sz);
      ctx.lineTo(x - 28 * sz, gy - 70 * sz);
      ctx.lineTo(x - 16 * sz, gy - 58 * sz);
      ctx.stroke();
      break;
    case 11:
      for (let k = 0; k < 4; k++) {
        const a = t + (k * Math.PI) / 2;
        ctx.fillStyle = k % 2 ? "#c9a6ff" : "#e9dcff";
        ctx.shadowColor = "#b79fff";
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 38 * sz, gy - 30 * sz + Math.sin(a) * 22 * sz, 5 * sz, 0, 7);
        ctx.fill();
      }
      break;
  }
  ctx.shadowBlur = 0;
}

function bossHuntCount() {
  const highest = S.clearedAreas.length ? Math.max(...S.clearedAreas) + 1 : 0;
  return Math.max(6, Math.min(12, highest));
}

function startBossHunt() {
  if (!S.clearedAreas.includes(5)) {
    showTip("BOSS HUNT LOCKED", "Clear the Sunken Ruins first.");
    return;
  }
  if ((S.skullTokens || 0) < 10) {
    showTip(
      "MORE SKULL TOKENS NEEDED",
      "Boss Hunt costs <b>10 skull tokens</b>. Bosses in areas after the Sunken Ruins have a 50% token chance. Elites there have a 4% chance."
    );
    return;
  }
  S.skullTokens -= 10;
  hCd = 0;
  const hs = heroStats();
  run = {
    ai: 0,
    a: AREAS[0],
    wave: 0,
    total: bossHuntCount(),
    foes: [],
    over: false,
    bags: [],
    enrageT: 0,
    enrageCd: 0,
    pT: 0,
    time: 0,
    dmgLog: [],
    healCd: 0,
    mech: null,
    cast: null,
    nextCastAt: null,
    slowStacks: 0,
    frozenUntil: 0,
    heroPoisonUntil: 0,
    air: null,
    airPenaltyT: 0,
    xpMult: 1,
    chainHits: 0,
    chainUntil: 0,
    suppressedSlot: null,
    suppressedUntil: 0,
    hunt: true,
    huntIndex: 0,
    huntCount: bossHuntCount(),
    hero: { hp: hs.hp, max: hs.hp }
  };
  $("town").style.display = "none";
  $("run").style.display = "block";
  $("traychips").innerHTML = "";
  updateTrayCount();
  updateHeal();
  hideCast();
  arrows = [];
  startMusic();
  nextWave();
  clearInterval(timer);
  timer = setInterval(tick, 150);
  scheduleSave();
}

function drawAreaCreature(f, cx, gy) {
  const x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 24,
    s = (f.draw && f.draw.sz) || 1,
    d = f.design;
  ctx.save();
  ctx.translate(x, gy);
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 2;
  ctx.strokeStyle = f.elite ? "#ffd66b" : "#241c24";
  ctx.shadowColor = f.elite ? "#ffcf5c" : "transparent";
  ctx.shadowBlur = f.elite ? 9 : 0;
  const fill = f.draw.c;
  const eye = (ex, ey, col = "#fff") => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(ex, ey, 2.3, 0, 7);
    ctx.fill();
  };
  switch (d) {
    case "bramble":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -20, 17, 21, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#6b4a2b";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(-11, -16);
      ctx.lineTo(-25, -28);
      ctx.lineTo(-31, -23);
      ctx.moveTo(11, -16);
      ctx.lineTo(25, -28);
      ctx.lineTo(31, -22);
      ctx.stroke();
      ctx.fillStyle = "#9bd96f";
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(q * 22, -31, 7, 4, q * 0.45, 0, 7);
        ctx.fill();
      }
      eye(-6, -24, "#ffe36e");
      eye(6, -24, "#ffe36e");
      break;
    case "rat":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(2, -15, 22, 13, -0.12, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(-16, -23, 10, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#c99a7a";
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(-18 + q * 7, -31, 5, 0, 7);
        ctx.fill();
      }
      ctx.strokeStyle = "#b78c72";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(22, -13);
      ctx.bezierCurveTo(38, -9, 37, 4, 48, -2);
      ctx.stroke();
      eye(-20, -25, "#ffcf5c");
      break;
    case "frostmite":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -18, 14, 11, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, -29, 8, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#bdefff";
      ctx.lineWidth = 3;
      for (const q of [-1, 1])
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(q * 9, -22 + k * 5);
          ctx.lineTo(q * (21 + k * 3), -31 + k * 10);
          ctx.stroke();
        }
      eye(-3, -30, "#1b506c");
      eye(3, -30, "#1b506c");
      break;
    case "icebound":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-20, -31);
      ctx.lineTo(-10, -42);
      ctx.lineTo(0, -33);
      ctx.lineTo(10, -42);
      ctx.lineTo(20, -31);
      ctx.lineTo(18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#dff6ff";
      ctx.beginPath();
      ctx.moveTo(-12, -39);
      ctx.lineTo(-18, -55);
      ctx.lineTo(-4, -43);
      ctx.moveTo(12, -39);
      ctx.lineTo(18, -55);
      ctx.lineTo(4, -43);
      ctx.fill();
      eye(-6, -29, "#8fe8ff");
      eye(6, -29, "#8fe8ff");
      break;
    case "granite":
      ctx.fillStyle = fill;
      ctx.fillRect(-18, -42, 36, 41);
      ctx.strokeRect(-18, -42, 36, 41);
      ctx.fillStyle = "#666a70";
      ctx.fillRect(-30, -32, 12, 27);
      ctx.fillRect(18, -32, 12, 27);
      ctx.strokeRect(-30, -32, 12, 27);
      ctx.strokeRect(18, -32, 12, 27);
      ctx.strokeStyle = "#b9c0c8";
      ctx.beginPath();
      ctx.moveTo(-8, -42);
      ctx.lineTo(-2, -30);
      ctx.lineTo(-9, -18);
      ctx.moveTo(13, -36);
      ctx.lineTo(4, -23);
      ctx.lineTo(11, -10);
      ctx.stroke();
      eye(-7, -29, "#ffd06a");
      eye(7, -29, "#ffd06a");
      break;
    case "rampart":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-15, -34);
      ctx.lineTo(0, -44);
      ctx.lineTo(15, -34);
      ctx.lineTo(18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#b09a72";
      ctx.beginPath();
      ctx.arc(0, -39, 13, Math.PI, 0);
      ctx.lineTo(13, -29);
      ctx.lineTo(-13, -29);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#765b39";
      ctx.beginPath();
      ctx.moveTo(17, -32);
      ctx.lineTo(32, -26);
      ctx.lineTo(29, -5);
      ctx.lineTo(15, -9);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      eye(-5, -34, "#ffcd64");
      break;
    case "umbral":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-22, 0);
      ctx.quadraticCurveTo(-18, -38, 0, -47);
      ctx.quadraticCurveTo(18, -38, 22, 0);
      ctx.lineTo(12, -8);
      ctx.lineTo(5, 0);
      ctx.lineTo(-3, -8);
      ctx.lineTo(-11, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#17101f";
      ctx.beginPath();
      ctx.ellipse(0, -32, 10, 13, 0, 0, 7);
      ctx.fill();
      eye(-4, -33, "#c58cff");
      eye(4, -33, "#c58cff");
      break;
    case "bonewarden":
      ctx.strokeStyle = fill;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(0, -29);
      ctx.lineTo(0, -7);
      ctx.moveTo(-15, -22);
      ctx.lineTo(15, -22);
      ctx.moveTo(-12, -14);
      ctx.lineTo(12, -14);
      ctx.moveTo(0, -7);
      ctx.lineTo(-12, 0);
      ctx.moveTo(0, -7);
      ctx.lineTo(12, 0);
      ctx.stroke();
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.arc(0, -38, 11, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#443c35";
      ctx.lineWidth = 2;
      ctx.stroke();
      eye(-4, -39, "#7b4fd0");
      eye(4, -39, "#7b4fd0");
      break;
    case "cinderimp":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -19, 14, 20, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-9, -35);
      ctx.lineTo(-19, -50);
      ctx.lineTo(-4, -39);
      ctx.moveTo(9, -35);
      ctx.lineTo(19, -50);
      ctx.lineTo(4, -39);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f28b45";
      ctx.beginPath();
      ctx.moveTo(-12, -20);
      ctx.lineTo(-28, -33);
      ctx.lineTo(-21, -10);
      ctx.moveTo(12, -20);
      ctx.lineTo(28, -33);
      ctx.lineTo(21, -10);
      ctx.fill();
      ctx.stroke();
      eye(-5, -25, "#ffd34f");
      eye(5, -25, "#ffd34f");
      break;
    case "magmahound":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -16, 25, 14, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-18, -24);
      ctx.lineTo(-27, -37);
      ctx.lineTo(-5, -29);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#f06b2c";
      ctx.lineWidth = 5;
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(q * 14, -8);
        ctx.lineTo(q * 17, 0);
        ctx.stroke();
      }
      ctx.strokeStyle = "#ffb03a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(5, -24);
      ctx.lineTo(12, -14);
      ctx.lineTo(19, -26);
      ctx.stroke();
      eye(-20, -25, "#ffe269");
      break;
    case "reefstalker":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -17, 20, 14, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#5ed5c7";
      ctx.lineWidth = 4;
      for (const q of [-1, 1]) {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.moveTo(q * (10 + k * 3), -13);
          ctx.lineTo(q * (23 + k * 4), -3 + k * 2);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(q * 15, -23);
        ctx.lineTo(q * 29, -31);
        ctx.lineTo(q * 35, -24);
        ctx.stroke();
      }
      eye(-7, -23, "#ffe98a");
      eye(7, -23, "#ffe98a");
      break;
    case "drowned":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-13, -31);
      ctx.quadraticCurveTo(0, -43, 13, -31);
      ctx.lineTo(15, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#8fb8ac";
      ctx.beginPath();
      ctx.arc(0, -39, 10, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#6b5946";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(17, -34);
      ctx.lineTo(28, -3);
      ctx.moveTo(21, -12);
      ctx.lineTo(34, -17);
      ctx.moveTo(28, -3);
      ctx.lineTo(20, 2);
      ctx.stroke();
      eye(-4, -40, "#a9ffdc");
      break;
    case "gravewing":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -23, 9, 14, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, -24);
      ctx.lineTo(-33, -39);
      ctx.lineTo(-27, -16);
      ctx.lineTo(-12, -7);
      ctx.closePath();
      ctx.moveTo(5, -24);
      ctx.lineTo(33, -39);
      ctx.lineTo(27, -16);
      ctx.lineTo(12, -7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      eye(-3, -27, "#d9b7ff");
      eye(3, -27, "#d9b7ff");
      break;
    case "mourner":
      ctx.fillStyle = fill;
      ctx.globalAlpha = 0.86;
      ctx.beginPath();
      ctx.moveTo(-17, 0);
      ctx.quadraticCurveTo(-20, -35, 0, -48);
      ctx.quadraticCurveTo(20, -35, 17, 0);
      ctx.lineTo(8, -7);
      ctx.lineTo(0, 0);
      ctx.lineTo(-8, -7);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#20282b";
      ctx.beginPath();
      ctx.ellipse(0, -34, 8, 12, 0, 0, 7);
      ctx.fill();
      eye(-3, -36, "#e7fff8");
      eye(3, -36, "#e7fff8");
      break;
    case "drakekin":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -18, 18, 22, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, -29);
      ctx.lineTo(24, -42);
      ctx.lineTo(19, -25);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#d88a4f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(14, -8);
      ctx.bezierCurveTo(32, -5, 35, 3, 46, -7);
      ctx.stroke();
      ctx.fillStyle = "#e2a160";
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(-8 + k * 8, -39);
        ctx.lineTo(-4 + k * 8, -50);
        ctx.lineTo(k * 8, -38);
        ctx.fill();
      }
      eye(-6, -28, "#ffe56e");
      break;
    case "emberwing":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -23, 10, 17, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-6, -25);
      ctx.lineTo(-34, -42);
      ctx.lineTo(-25, -13);
      ctx.lineTo(-9, -6);
      ctx.closePath();
      ctx.moveTo(6, -25);
      ctx.lineTo(34, -42);
      ctx.lineTo(25, -13);
      ctx.lineTo(9, -6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffb34a";
      ctx.beginPath();
      ctx.moveTo(0, -39);
      ctx.lineTo(7, -52);
      ctx.lineTo(8, -35);
      ctx.fill();
      eye(-3, -28, "#fff08a");
      break;
    case "voidling":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -23, 18, 17, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#a77add";
      ctx.lineWidth = 5;
      for (let k = -2; k <= 2; k++) {
        ctx.beginPath();
        ctx.moveTo(k * 6, -9);
        ctx.quadraticCurveTo(k * 11, 2, k * 8 + (k % 2 ? 8 : -8), 5);
        ctx.stroke();
      }
      eye(-6, -25, "#f0d8ff");
      eye(6, -25, "#f0d8ff");
      break;
    case "abyssaleye":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -24, 22, 15, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#eadcff";
      ctx.beginPath();
      ctx.ellipse(0, -24, 12, 9, 0, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#1a0b2a";
      ctx.beginPath();
      ctx.arc(0, -24, 5, 0, 7);
      ctx.fill();
      ctx.strokeStyle = "#9f73ce";
      ctx.lineWidth = 4;
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(q * 15, -14);
        ctx.lineTo(q * 24, 0);
        ctx.stroke();
      }
      break;
    case "rimeknight":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.lineTo(-15, -34);
      ctx.lineTo(0, -45);
      ctx.lineTo(15, -34);
      ctx.lineTo(18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d9f4ff";
      ctx.beginPath();
      ctx.moveTo(-12, -39);
      ctx.lineTo(0, -54);
      ctx.lineTo(12, -39);
      ctx.lineTo(10, -27);
      ctx.lineTo(-10, -27);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#7095ad";
      ctx.beginPath();
      ctx.moveTo(17, -30);
      ctx.lineTo(31, -24);
      ctx.lineTo(27, -3);
      ctx.lineTo(14, -8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      eye(0, -35, "#7ee9ff");
      break;
    case "snowstalker":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -16, 24, 13, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-18, -24);
      ctx.lineTo(-27, -38);
      ctx.lineTo(-6, -29);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(-20 + q * 6, -30);
        ctx.lineTo(-22 + q * 9, -43);
        ctx.lineTo(-14 + q * 5, -34);
        ctx.fill();
        ctx.stroke();
      }
      ctx.strokeStyle = "#bdd6df";
      ctx.lineWidth = 5;
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(q * 14, -7);
        ctx.lineTo(q * 17, 1);
        ctx.stroke();
      }
      eye(-20, -27, "#75cfff");
      break;
    case "hellspawn":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.ellipse(0, -20, 17, 22, 0, 0, 7);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#d86a42";
      ctx.lineWidth = 5;
      for (const q of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(q * 9, -38);
        ctx.quadraticCurveTo(q * 25, -54, q * 23, -66);
        ctx.stroke();
      }
      ctx.fillStyle = "#30120e";
      ctx.beginPath();
      ctx.moveTo(-9, -19);
      ctx.lineTo(0, -8);
      ctx.lineTo(9, -19);
      ctx.closePath();
      ctx.fill();
      eye(-6, -27, "#ffd24a");
      eye(6, -27, "#ffd24a");
      break;
    case "chainbrute":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.roundRect(-22, -43, 44, 43, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#9b4c39";
      ctx.fillRect(-34, -31, 12, 27);
      ctx.fillRect(22, -31, 12, 27);
      ctx.strokeRect(-34, -31, 12, 27);
      ctx.strokeRect(22, -31, 12, 27);
      ctx.strokeStyle = "#bab1a2";
      ctx.lineWidth = 4;
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.arc(-18 + k * 12, -17, 6, 0, 7);
        ctx.stroke();
      }
      eye(-7, -31, "#ffb050");
      eye(7, -31, "#ffb050");
      break;
    case "starborn":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(0, -52);
      ctx.lineTo(14, -32);
      ctx.lineTo(10, -4);
      ctx.lineTo(0, 2);
      ctx.lineTo(-10, -4);
      ctx.lineTo(-14, -32);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e8ddff";
      ctx.beginPath();
      ctx.moveTo(0, -42);
      ctx.lineTo(5, -32);
      ctx.lineTo(16, -30);
      ctx.lineTo(7, -23);
      ctx.lineTo(9, -12);
      ctx.lineTo(0, -18);
      ctx.lineTo(-9, -12);
      ctx.lineTo(-7, -23);
      ctx.lineTo(-16, -30);
      ctx.lineTo(-5, -32);
      ctx.closePath();
      ctx.fill();
      eye(0, -33, "#4f3783");
      break;
    case "astralseer":
      ctx.fillStyle = fill;
      ctx.beginPath();
      ctx.moveTo(-20, 0);
      ctx.lineTo(-13, -36);
      ctx.lineTo(0, -50);
      ctx.lineTo(13, -36);
      ctx.lineTo(20, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#d8caff";
      ctx.beginPath();
      ctx.moveTo(-9, -34);
      ctx.lineTo(0, -43);
      ctx.lineTo(9, -34);
      ctx.lineTo(6, -22);
      ctx.lineTo(-6, -22);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#3b285f";
      ctx.beginPath();
      ctx.moveTo(0, -37);
      ctx.lineTo(4, -31);
      ctx.lineTo(0, -25);
      ctx.lineTo(-4, -31);
      ctx.closePath();
      ctx.fill();
      break;
  }
  ctx.restore();
}

function enrageProfile(raw) {
  raw = Math.max(0, raw || 0);
  return { chance: Math.min(50, raw), duration: 4000 + Math.max(0, raw - 50) * 100 };
}

function spawnHit(x, y, big, forceN, gore) {
  const n = forceN || (big ? 24 : 11);
  for (let i = 0; i < n; i++) {
    const ang = gore ? Math.random() * Math.PI * 2 : -Math.PI * 0.5 + (Math.random() - 0.5) * 2.2;
    const spd = (gore ? 4 : big ? 3 : 2) + Math.random() * (gore ? 5 : big ? 4 : 3);
    particles.push({
      x,
      y,
      vx: Math.cos(ang) * spd * 1.4,
      vy: Math.sin(ang) * spd - (gore ? 0 : 1),
      life: 1,
      sz: (gore ? 2.6 : big ? 2.2 : 1.6) + Math.random() * 1.8,
      col: ["#e23b2f", "#ff5b45", "#b71c1c", "#ff7a5a"][Math.floor(Math.random() * 4)]
    });
  }
}

function demiseCritPct(g) {
  return 15 + 35 * celestialProgress(g);
}

function demiseCritBonus(g, target) {
  return g && g.stats && g.stats.doom && (g.celestial || 0) >= 5 ? demiseCritPct(g) : 0;
}

function demiseResistanceFactor(g) {
  return g && g.stats && g.stats.doom && (g.celestial || 0) >= 5
    ? Math.max(0.5, 0.7 - Math.max(0, (g.celestial || 5) - 5) * 0.04)
    : 1;
}

function burnAttackFactor(f) {
  return f && run && f.burnUntil > run.time ? Math.max(0.88, 1 - (f.burnAtkReduction || 0.02)) : 1;
}

function buildFoeBars() {
  const c = $("foehps");
  c.innerHTML = "";
  run.foes.forEach((f, i) => {
    const rt = Object.keys(f.res)
      .filter(k => f.res[k] !== 0)
      .map(k => {
        const v = f.res[k];
        return (
          '<span style="color:' +
          (v < 0 ? "var(--uncommon)" : "#ff6b6b") +
          '">' +
          STAT_LABEL[k] +
          (v < 0 ? "↓" : "↑") +
          "</span>"
        );
      })
      .join(" ");
    c.innerHTML +=
      '<div class="hplabel"><span><b>' +
      f.name +
      '</b> <span class="lv">Lv ' +
      f.lvl +
      '</span></span><span class="res-tags">' +
      rt +
      '<span class="fxrow" id="foefx' +
      i +
      '"></span></span></div>' +
      '<div class="hpbar"><div class="chip" id="foe' +
      i +
      'c"></div><div class="fill foe" id="foe' +
      i +
      '"></div><div class="gloss"></div><span class="hptxt" id="foe' +
      i +
      't"></span></div>';
  });
  updateStatusFx();
  /* ---- buildFoeBars: later layers (moved here) ---- */
  const bars = [...$("foehps").querySelectorAll(".hpbar")];
  run.foes.forEach((f, i) => {
    if (f.boss || f.specialCd == null || !bars[i]) return;
    bars[i].insertAdjacentHTML(
      "afterend",
      '<div class="specialname" id="spname' +
        i +
        '"></div><div class="specialcast" id="spcast' +
        i +
        '"><i></i></div>'
    );
  });
  updateSpecialBars();
  [...$("foehps").querySelectorAll(".hpbar")].forEach((bar, i) => {
    const d = document.createElement("div");
    d.className = "doomfill";
    d.id = "doomfill" + i;
    bar.insertBefore(d, bar.querySelector(".gloss"));
  });
}

function xpBuffRemaining() {
  return Math.max(0, (S.xpBuffUntil || 0) - Date.now());
}

function xpBuffTime(ms) {
  ms = Math.max(0, ms);
  const m = Math.floor(ms / 60000),
    s = Math.floor((ms % 60000) / 1000);
  return m + ":" + String(s).padStart(2, "0");
}

function xpBuffCost() {
  return Math.round((5000 + 500 * Math.pow(Math.max(1, S.heroLevel || 1), 1.6)) / 100) * 100;
}

function campaignBossProfile(areaIndex, lvlOverride) {
  const a = AREAS[Math.max(0, Math.min(11, areaIndex))],
    lvl = Math.max(1, Math.round(lvlOverride == null ? a.lvl + a.waves : lvlOverride));
  let hp = Math.round(250 + 4.0 * Math.pow(lvl, 2.35));
  if (areaIndex === 5) hp = Math.round(hp * 1.25);
  if (areaIndex === 2) hp = Math.round(hp * 0.9);
  const atk = Math.round(
      (6 + 0.45 * Math.pow(lvl, 1.75) * (1 + Math.max(0, areaIndex) * 0.02)) * (areaIndex === 5 ? 0.88 : 1)
    ),
    def = Math.round(2 + 0.035 * Math.pow(lvl, 1.45));
  return { lvl, hp, atk, def };
}

function critLevelScale(ilvl) {
  return 1 + Math.min(0.06, Math.max(1, Number(ilvl) || 1) * 0.0006);
}

function expectedClearXp(heroLevel) {
  const lv = Math.max(1, Math.floor(Number(heroLevel) || 1));
  let area = AREAS[0];
  for (let i = 0; i < Math.min(12, AREAS.length); i++) {
    if (AREAS[i].lvl <= lv) area = AREAS[i];
    else break;
  }
  const expectedFoes = 1.46;
  let raw = 0;
  for (let wave = 1; wave <= area.waves; wave++) {
    const foeLevel = area.lvl + wave - 1;
    raw += expectedFoes * Math.round(4 + foeLevel * 3);
  }
  const bossLevel = area.lvl + area.waves;
  raw += Math.round(4 + bossLevel * 3) + bossLevel * 4;
  return raw * 1.05;
}

function omegaNextDelay(b) {
  return Math.max(300, Math.min(b.omegaStunAt, b.omegaHealAt, b.omegaSummonAt) - run.time);
}

function omegaFinishAbility(ability, b) {
  ability.cd = omegaNextDelay(b);
}

function cleanCombatLabel(label) {
  return (
    String(label || "Damage")
      .replace(/[0-9,.]+\s*$/, "")
      .replace(/\s+/g, " ")
      .trim() || "Damage"
  );
}

function foeSymbol(f) {
  if (!f) return "☠";
  if (f.boss) return "♛";
  const shape = f.draw && f.draw.shape;
  return shape === "beast" ? "🐾" : shape === "ghost" ? "👻" : shape === "block" ? "🪨" : "⚔";
}

function initCombatRecap() {
  if (run) run.combatRecapV41 = { damage: {}, healing: {}, totalDamage: 0, totalHealing: 0, killer: null };
}

function inferDamageContext() {
  if (run && run._incomingContextV41) return run._incomingContextV41;
  if (run && run.air != null && run.air <= 0) return { label: "Drowning", icon: "🫧", source: null };
  if (run && run.heroPoisonUntil && run.time < run.heroPoisonUntil)
    return { label: "Poison", icon: "☠", source: run.heroPoisonSourceV41 || null };
  const reflect =
    run && run.foes && run.foes.find(f => f.hp > 0 && f.reflectUntil && run.time < f.reflectUntil);
  if (reflect) return { label: "Damage Reflection", icon: "🔷", source: reflect };
  const thorns = run && run.foes && run.foes.find(f => f.hp > 0 && f.thornUntil && run.time < f.thornUntil);
  if (thorns) return { label: "Thorns", icon: "✹", source: thorns };
  const source = run && run._enemyAttackTimeV40 === run.time ? run._enemyAttackSourceV40 : null;
  return {
    label: source ? source.name + (source.boss ? " attack" : " hit") : "Other damage",
    icon: foeSymbol(source),
    source
  };
}

function installHeroHealthV41() {
  if (!run || !run.hero || run.hero._mythicHealth) return;
  const hero = run.hero;
  let value = Number(hero.hp) || 0;
  hero._mythicHealth = true;
  Object.defineProperty(hero, "hp", {
    configurable: true,
    enumerable: true,
    get: () => value,
    set: next => {
      next = Number(next);
      if (!Number.isFinite(next)) return;
      if (next < value && run && !run.over) {
        let dealt = value - next;
        const normalSource = run._enemyAttackTimeV40 === run.time ? run._enemyAttackSourceV40 : null;
        run._enemyAttackSourceV40 = null;
        if (normalSource) {
          const pressure = celestialHealthPressure(normalSource);
          dealt += pressure;
          next = value - dealt;
          run._pressureDisplayV40 = pressure;
        }
        const info =
            run._incomingContextV41 ||
            (normalSource
              ? {
                  label: normalSource.name + (normalSource.boss ? " attack" : " hit"),
                  icon: foeSymbol(normalSource),
                  source: normalSource
                }
              : inferDamageContext()),
          source = info.source || normalSource;
        addRecap("damage", info.label, dealt, info.icon, source);
        if (next <= 0 && run.combatRecapV41) run.combatRecapV41.killer = source || info;
        if (S.gear.armor && S.gear.armor.mythicAffix === "mythicThorns") {
          const target =
            source ||
            (run.foes && run.foes.find(f => f.hp > 0 && f.atkA > 0)) ||
            (run.foes && run.foes.find(f => f.boss && f.hp > 0)) ||
            (run.foes && run.foes.find(f => f.hp > 0));
          if (target) {
            const reflected = dealt * 0.35;
            target.hp -= reflected;
            floatDmg("foe", "✺ THORNS " + Math.round(reflected), 0, "#35d6c8", target._x);
            if (target.hp <= 0)
              setTimeout(() => {
                if (run && !run.over && !target.dead) killFoe(target);
              }, 0);
          }
        }
      } else if (next > value && run && !run.over) {
        const amount = Math.min(next, hero.max) - value;
        if (amount > 0) {
          let label = run._healingContextV41;
          if (!label)
            label =
              run._lastOutgoingHitV41 === run.time
                ? "Leech"
                : heroStats()._regen > 0
                  ? "Regeneration"
                  : "Other healing";
          const icons = {
            Leech: "🩸",
            Bloodthirst: "🩸",
            "Field Heal": "✚",
            "Healing on kill": "♥",
            Reborn: "♻",
            Growth: "🌱",
            Regeneration: "✚"
          };
          addRecap("healing", label, amount, icons[label] || "✚");
          run._healingContextV41 = null;
        }
      }
      value = next;
    }
  });
}

function poisonShot(f) {
  if (run) {
    run._queuedAbilitySourceV41 = f;
    run.heroPoisonSourceV41 = f;
  }
  const activeRun = run,
    sx = f._x,
    sy = GY - 30,
    tx = 150,
    ty = GY - 27;
  for (let i = 0; i < 10; i++)
    setTimeout(() => {
      if (run !== activeRun || activeRun.over) return;
      const t = (i + 1) / 10;
      particles.push({
        x: sx + (tx - sx) * t,
        y: sy + (ty - sy) * t - Math.sin(t * Math.PI) * 20,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2,
        life: 0.65,
        sz: 3,
        col: i % 2 ? "#a8e94a" : "#5fbf36"
      });
    }, i * 42);
  setTimeout(() => {
    if (run !== activeRun || activeRun.over) return;
    const d = Math.max(2, f.atk * (f.elite ? 0.42 : 0.3)),
      hit = abilityHitHero(d, "☠ VENOM", "#9be84f");
    if (!run || run.over || hit === false) return;
    if (!mythicDebuffAllowed()) {
      floatDmg("hero", "NIMBLE", 0, "#78fff1");
      return;
    }
    run.heroPoisonUntil = Math.max(run.heroPoisonUntil || 0, run.time + 15000);
    run.heroPoisonDmg = Math.max(run.heroPoisonDmg || 0, Math.max(2, f.atk * (f.elite ? 0.12 : 0.085)));
    flash("#6caa38");
    floatDmg("hero", "☠ POISONED 15s", 0, "#a8e94a");
  }, 430);

  return;
}

function bloodthirstHealPct(g) {
  if (run) run._healingContextV41 = "Bloodthirst";
  return 5 + 5 * celestialProgress(g);

  return;
}

function killerPortrait(source) {
  try {
    const out = document.createElement("canvas");
    out.width = 128;
    out.height = 100;
    const ox = out.getContext("2d"),
      x = Math.max(0, Math.min(CANVAS_LOGICAL_W - 118, ((source && source._x) || 405) - 59)),
      y = Math.max(0, Math.min(CANVAS_LOGICAL_H - 100, GY - 92));
    ox.fillStyle = "#121018";
    ox.fillRect(0, 0, out.width, out.height);
    ox.drawImage(
      cv,
      x * CANVAS_RENDER_SCALE,
      y * CANVAS_RENDER_SCALE,
      118 * CANVAS_RENDER_SCALE,
      100 * CANVAS_RENDER_SCALE,
      5,
      0,
      118,
      100
    );
    return out.toDataURL("image/png");
  } catch (e) {
    return "";
  }
}

function classifyDummyFloat(val, color) {
  const s = String(val),
    lc = String(color || "").toLowerCase();
  if (/BLEED|BLOOD/.test(s)) return ["bleed", "🩸", "Bleed", "#d7344f"];
  if (/COMBUST/.test(s)) return ["combust", "💥", "Combust", "#ff6a2f"];
  if (/THORNS/.test(s)) return ["thorns", "✺", "Thorns", "#35d6c8"];
  if (lc === "#7fe07f" || lc === "#9be07f") return ["poison", "☠", "Poison", "#7fe07f"];
  if (lc === "#ff8a3a") return ["burn", "🔥", "Burn", "#ff8a3a"];
  if (lc === "#ffe14d") return ["lightning", "⚡", "Lightning", "#ffe14d"];
  const w = S.gear && S.gear.weapon;
  return [
    "weapon",
    "⚔",
    w
      ? w.wtype === "dagger"
        ? "Dagger hits"
        : w.wtype === "bow"
          ? "Bow hits"
          : "Sword hits"
      : "Direct hits",
    "#ffd0a0"
  ];
}

function recordDummyDamage(key, icon, label, amount, color) {
  if (!run || !run.dummy || !run.dummyDpsV41 || !Number.isFinite(amount) || amount <= 0) return;
  const s = run.dummyDpsV41.sources,
    row = s[key] || (s[key] = { key, icon, label, color, total: 0, events: [] });
  row.total += amount;
  row.events.push([run.time, amount]);
}

function updateDummyMeter() {
  const box = $("dummymeterv41");
  if (!box || !run || !run.dummy || !run.dummyDpsV41) return;
  const elapsed = Math.max(1, (run.time - run.dummyDpsV41.startedAt) / 1000),
    now = run.time,
    rows = Object.values(run.dummyDpsV41.sources);
  rows.forEach(r => (r.events = r.events.filter(e => e[0] >= now - 10000)));
  const total = rows.reduce((s, r) => s + r.total, 0),
    avg = total / elapsed,
    recent = rows.reduce((s, r) => s + r.events.reduce((a, e) => a + e[1], 0), 0) / Math.min(10, elapsed);
  box.innerHTML =
    '<div class="dummyheadv41"><b>🎯 DAMAGE METER</b><span>Total ' +
    fmt(total) +
    " · " +
    fmt(avg) +
    " DPS · " +
    fmt(recent) +
    ' last 10s</span></div><div class="dummyrowsv41">' +
    rows
      .sort((a, b) => b.total - a.total)
      .map(
        r =>
          '<div class="dummyrowv41" style="--dc:' +
          r.color +
          '"><span>' +
          r.icon +
          " " +
          r.label +
          "</span><b>" +
          fmt(r.total / elapsed) +
          " DPS</b><small>" +
          ((r.total / Math.max(1, total)) * 100).toFixed(1) +
          "%</small></div>"
      )
      .join("") +
    "</div>";
}

function startTrainingDummy() {
  clearInterval(timer);
  hCd = 0;
  const hs = heroStats(),
    a = {
      n: "Training Grounds",
      sp: "🎯",
      waves: 1,
      lvl: 1,
      boss: "Training Dummy",
      weak: "nothing",
      gimmick: null
    };
  run = {
    ai: 5,
    a,
    wave: 1,
    total: 1,
    foes: [],
    over: false,
    bags: [],
    enrageT: 0,
    enrageCd: 0,
    pT: 0,
    time: 0,
    dmgLog: [],
    healCd: 0,
    mech: null,
    cast: null,
    nextCastAt: null,
    slowStacks: 0,
    frozenUntil: 0,
    heroPoisonUntil: 0,
    air: null,
    airPenaltyT: 0,
    xpMult: 1,
    dummy: true,
    dummyCyclesV41: 0,
    dummyDpsV41: { startedAt: 0, sources: {} },
    hero: { hp: hs.hp, max: hs.hp }
  };
  const f = buildFoe("golem", 1, 1, false, "Training Dummy");
  f.trainingDummy = true;
  f.hp = f.max = 100000000;
  f.atk = 0;
  f.def = 0;
  f.res = { fire: 0, ice: 0, lightning: 0 };
  f.cd = 1e15;
  f.enter = 0;
  f._x = 405;
  run.foes = [f];
  initCombatRecap();
  installHeroHealthV41();
  $("town").style.display = "none";
  $("run").style.display = "block";
  $("gimmick").style.display = "none";
  $("wave").innerHTML = "<b>TRAINING GROUNDS</b> · unrestricted damage test";
  $("rmsg").className = "msg";
  $("rmsg").textContent = "Build buffs, compare effects, and leave whenever you are ready.";
  $("traychips").innerHTML = "";
  $("loottray").style.display = "none";
  $("dummymeterv41").classList.add("on");
  buildFoeBars();
  drawBars();
  updateStatusFx();
  updateRetreat();
  startMusic();
  timer = setInterval(tick, 150);
}

function omegaResonanceProfile() {
  const score = omegaLoadoutReadiness(),
    heroPower = 0.07 + 0.93 * Math.pow(score, 3),
    healthMult = 1 / heroPower,
    incomingMult = 1 + Math.max(0, 0.88 - score) * 2.2;
  return { score, heroPower, healthMult, incomingMult };
}

function positionCombatNumber(d, side, tier, x) {
  if (!d || d.classList.contains("statusfloatv41")) return;
  const canvas = $("cv"),
    scaleX = canvas.clientWidth / CANVAS_LOGICAL_W,
    scaleY = canvas.clientHeight / CANVAS_LOGICAL_H,
    targetX = side === "foe" ? (x == null ? 405 : x) : 150,
    t = Math.min(5, tier || 0),
    rise = t >= 4 ? 103 : t === 3 ? 94 : t === 2 ? 86 : t === 1 ? 76 : 64;
  floatDmg._laneV46 = ((floatDmg._laneV46 || 0) + 1) % 3;
  const jitter = t ? 0 : (floatDmg._laneV46 - 1) * 5;
  d.style.left = canvas.offsetLeft + (targetX + jitter) * scaleX + "px";
  d.style.top = canvas.offsetTop + (GY - rise) * scaleY + "px";
}

function setupDamageRecap() {
  const recap = $("deathrecapv41"),
    openLoot = $("deadok");
  if (!recap || !openLoot) return;
  let button = $("deathrecaptogglev46");
  if (!button) {
    button = document.createElement("button");
    button.id = "deathrecaptogglev46";
    button.className = "ghost";
    button.textContent = "📊 Damage Recap";
    button.style.cssText = "width:200px;margin-top:12px";
    recap.insertAdjacentElement("beforebegin", button);
  }
  button.onclick = () => {
    const open = recap.classList.toggle("openv46");
    button.textContent = open ? "✕ Hide Damage Recap" : "📊 Damage Recap";
  };
  const style = document.createElement("style");
  style.textContent = ".deathrecapv41{display:none!important}.deathrecapv41.openv46{display:grid!important}";
  document.head.appendChild(style);
}

// Earlier version of dodgePct(), extended by the functions that follow.
function dodgePctBase(pts) {
  pts = Math.max(0, pts);
  return Math.round(((78 * pts) / (pts + 95)) * 10) / 10;
}

function dodgePct(pts) {
  let prevResult60;
  prev60: {
    prevResult60 = Math.min(
      95,
      dodgePctBase(pts) + (S.gear.helm && S.gear.helm.mythicAffix === "sneaky" ? 10 : 0)
    );
    break prev60;
  }
  let v = prevResult60;
  if (deadlyActive()) v = Math.round(Math.max(0, v - 30) * 10) / 10;
  return v;
}

// Earlier version of enemyCritChanceV10(), extended by the functions that follow.
function enemyCritAbyssBase() {
  let prevResult37;
  prev37: {
    const stage = run ? Math.max(0, Math.min(11, run.ai || 0)) : 0;
    prevResult37 = 0.005 + stage * (0.015 / 11);
    break prev37;
  }
  const base = prevResult37;
  const source =
    run &&
    run.foes &&
    run.foes
      .filter(f => f.hp > 0 && (f.atkA || 0) > 0.05)
      .sort((a, b) => (b.atkA || 0) + (b.omegaGuard ? 2 : 0) - ((a.atkA || 0) + (a.omegaGuard ? 2 : 0)))[0];
  if (run) {
    run._enemyAttackSourceV40 = source || null;
    run._enemyAttackTimeV40 = run.time;
  }
  return Math.min(0.75, base + ((source && source.enemyCritBonusV40) || 0));
}

// base enemy crit is only ~1.2%, so a bare multiplier does nothing; add a flat floor too.
// Earlier version of enemyCritChanceV10(), extended by the functions that follow.
function enemyCritChance() {
  let c = enemyCritAbyssBase();
  if (run && run.a && run.a.abyss) c = Math.min(0.85, c * 1.6 + 0.25);
  return c;
}

function elemHitFactor(target) {
  const T = (typeof window !== "undefined" && window.__elemTune) || {};
  const scale = T.scale != null ? T.scale : 0.16;
  const armor = T.armor != null ? T.armor : 1;
  if (armor > 0) {
    const mit = Math.max(0.3, 100 / (100 + ((target && target.def) || 0) * 4));
    return scale * (1 - armor * (1 - mit));
  }
  return scale;
}

// Abyss crits hit for more than the usual x2 — burst is the only thing that punches through
// a heavily-regenerating, fully-maxed build. Scales a little with Abyss depth.
function abyssCritMult() {
  if (!(run && run.a && run.a.abyss)) return 2;
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const base = T.critBase != null ? T.critBase : 1.8,
    slope = T.critSlope != null ? T.critSlope : 0.03;
  return base + slope * abyssDepthV50(); // ~2.4 (start) -> ~3.2 (Abyss Omega)
}

function abyssDepthV50() {
  return Math.max(0, Math.min(16, run && run.mirror != null ? run.mirror : (run && run.ai) || 0));
}

// Controlled Abyss boss HP that scales cleanly with depth, replacing the old compounding
// multipliers (level × guardian ×7.5 × abyss bumps) that made deep bosses balloon to 40M+ and
// early ones die in 3s. Tanky enough to show their advanced abilities, killable with the right gear.
function abyssBossHP() {
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const base = T.bossHpBase != null ? T.bossHpBase : 4000000,
    per = T.bossHpPer != null ? T.bossHpPer : 750000;
  return Math.round(base + per * abyssDepthV50()); // ~4.5M (Abyss start) -> ~23M (Abyss Omega)
}

function abyssHasteMul(f) {
  if (!(run && run.a && run.a.abyss)) return 1;
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const base = T.hasteBase != null ? T.hasteBase : 0.66,
    slope = T.hasteSlope != null ? T.hasteSlope : 0.008,
    floor = T.hasteFloor != null ? T.hasteFloor : 0.42;
  let mul = base - slope * abyssDepthV50(); // faster attacks; deeper Abyss = faster
  if (f && (f._abyssBoss || f.boss)) mul *= 1.05; // bosses swing a hair slower than their mobs
  return Math.max(floor, mul);
}

// Abyss enemies also hit harder as you go deeper — armour/dodge throttle raw attack-speed,
// so this second lever is what actually threatens a tanky, high-regen build.
function abyssDamageMul() {
  if (!(run && run.a && run.a.abyss)) return 1;
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  const base = T.dmgBase != null ? T.dmgBase : 1.0,
    slope = T.dmgSlope != null ? T.dmgSlope : 0.028;
  return base + slope * abyssDepthV50(); // ~1.35 (start) -> ~2.2 (Abyss Omega)
}

/* ANTI-TANK: enemies deal bonus damage equal to a % of YOUR max HP, so a giant HP pool no
   longer trivialises the fight (the bigger your HP, the harder each hit lands). Applies in the
   Abyss (scaling with depth) and in the Celestial Guardian stages (Alpha..Omega, milder).
   Added as a flat post-mitigation component — it bypasses armour but is still dodgeable and
   still respects damage-reduction skills/mythics. */
// Bonus damage = pct × the player's max HP ABOVE a threshold. A normal endgame build (~100-130k
// HP) pays little or nothing; a stacked tank (200k+) pays a lot — so piling on HP stops being an
// auto-win, exactly where it matters, without punishing ordinary builds.
function abyssExcessHpDmg(maxHp) {
  if (!(run && run.a) || run.over) return 0;
  const T = (typeof window !== "undefined" && window.__abyssTune) || {};
  // Threshold sits above a normal legal max build (~138k HP) so only genuinely HP-STACKED builds
  // (~150k+) get taxed — ordinary and even balanced-maxed builds pay nothing. Abyss-only.
  const thresh = T.hpThresh != null ? T.hpThresh : 150000;
  if (!run.a.abyss) return 0;
  const excess = Math.max(0, (maxHp || 0) - thresh);
  if (excess <= 0) return 0;
  const pct =
    (T.hpDmgBase != null ? T.hpDmgBase : 0.24) +
    (T.hpDmgSlope != null ? T.hpDmgSlope : 0.016) * abyssDepthV50();
  return excess * pct;
}

// Stages sit at celestial+ level (160) and rise slowly to 180 at Abyss Omega; the real
// challenge is the extended boss gimmicks (below), not inflated raw stats.
// Abyss is a full re-gearing journey: stages start at level 160 (≈ the normal OMEGA boss) and
// ramp all the way to level 220 at Abyss Omega, so deep stages have far more HP/attack/defense and
// genuinely demand the ✦13 gear you farm inside the Abyss — not just a good normal-mode set.
function abyssLevel(ai) {
  return 160 + Math.round((ai / 16) * 60);
}

function abyssAreaClone(ai, orig) {
  return Object.assign({}, orig, { lvl: abyssLevel(ai), abyss: true, mirror: ai, n: "Abyss · " + orig.n });
}

function balanceBoss(f, areaIndex, lvlOverride) {
  if (run && run.a && run.a.abyss) return f; // keep the level-160+ scaled boss stats
  if (!f) return f;
  const p = campaignBossProfile(areaIndex, lvlOverride);
  f.max = p.hp;
  f.hp = p.hp;
  f.atk = p.atk;
  f.def = p.def;
  f.balanceProfileV28 = true;
  return f;

  return;
}

function wrapMechForAbyss(m) {
  if (!m || !m.resolve || m._abyssV50) return;
  const r = m.resolve;
  m.resolve = function (b) {
    if (!run || !run.a || !run.a.abyss) return r.call(this, b);
    const before = {};
    ABYSS_DEBUFF_FIELDS.forEach(k => (before[k] = run[k] || 0));
    const res = r.call(this, b);
    const now = run.time;
    ABYSS_DEBUFF_FIELDS.forEach(k => {
      if (run[k] > before[k] && run[k] > now) run[k] = now + (run[k] - now) * 1.7;
    });
    return res;
  };
  m._abyssV50 = true;
}

/* Goblin King (rally, MECHS[0]) and Banshee (wail, MECHS[6]) call in 4 minions in the Abyss */
function abyssSwarm(key, extra, label) {
  const lv = Math.max(1, (run.a.lvl || 1) + (run.total || 0) - 3),
    xs = [250, 352, 452, 558];
  let n = 0;
  for (const x of xs) {
    if (summonFoe(key, lv, 0.55, x, extra)) n++;
  }
  if (n) {
    beep(300, 0.2, "square", 0.12);
    $("rmsg").className = "msg big";
    $("rmsg").innerHTML = label.replace("%n", n).replace("%s", n > 1 ? "s" : "");
  }
  return n;
}

// Earlier version of drawFoe(), extended by the functions that follow.
function drawFoeBase(f, cx, gy) {
  prev62: {
    if (!f || f.dead) break prev62;
    if (!f.boss && f.design) drawAreaCreature(f, cx, gy);
    else {
      prev172: {
        {
          const d = f.draw,
            sz = d.sz,
            bob = Math.sin(anim.t * 2.4 + cx) * 2 * sz;
          cx += f.hurt * 7;
          cx -= Math.sin(f.atkA * Math.PI) * 24;
          cx += f.enter * 90;
          if (f.dead) ctx.globalAlpha = Math.max(0, 1 - f.deadA);
          gy += bob;
          let baseC = d.c;
          if (f.boss && f.bossIdx === 7) {
            baseC = f.phase >= 2 ? "#ff3b1e" : f.phase >= 1 ? "#ff6a2f" : "#c0402a";
          } else if (f.boss && f.bossIdx === 11) {
            baseC = f.phase >= 2 ? "#e6d2ff" : f.phase >= 1 ? "#c9a6ff" : "#7b4fd0";
          }
          const key = f.key;
          if (f.boss) {
            ctx.save();
            ctx.globalAlpha = 0.13 + 0.09 * Math.sin(anim.t * 3);
            ctx.fillStyle = baseC;
            ctx.beginPath();
            ctx.arc(cx, gy - 28 * sz, 36 * sz, 0, 7);
            ctx.fill();
            ctx.restore();
          }
          ctx.fillStyle = "#00000055";
          ctx.beginPath();
          ctx.ellipse(cx, gy + 2, 18 * sz, 4, 0, 0, 7);
          ctx.fill();
          let col =
            f.hurt > 0.3 ? "#ffffff" : f.slowUntil && run && run.time < f.slowUntil ? "#9cc8e8" : baseC;
          const w = 26 * sz,
            h = 30 * sz;
          if (d.shape === "blob") {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.ellipse(cx, gy - h * 0.4, w * 0.6, h * 0.45, 0, 0, 7);
            ctx.fill();
            ctx.fillRect(cx - w * 0.6, gy - h * 0.4, w * 1.2, h * 0.4);
            if (key === "serpent") {
              ctx.fillStyle = "#00000026";
              for (let i = 1; i < 4; i++) {
                ctx.beginPath();
                ctx.ellipse(cx, gy - h * 0.4 + i * 4, w * 0.5 - i * 3, 2.5, 0, 0, 7);
                ctx.fill();
              }
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.moveTo(cx - 3, gy - h * 0.78);
              ctx.lineTo(cx - 7, gy - h * 0.95);
              ctx.lineTo(cx - 1, gy - h * 0.82);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(cx + 3, gy - h * 0.78);
              ctx.lineTo(cx + 7, gy - h * 0.95);
              ctx.lineTo(cx + 1, gy - h * 0.82);
              ctx.fill();
            }
            if (key === "slime") {
              ctx.fillStyle = "#ffffff40";
              ctx.beginPath();
              ctx.ellipse(cx - w * 0.22, gy - h * 0.55, w * 0.16, h * 0.13, 0, 0, 7);
              ctx.fill();
            }
          } else if (d.shape === "block") {
            ctx.fillStyle = col;
            ctx.fillRect(cx - w * 0.5, gy - h, w, h);
            ctx.fillStyle = "#ffffff14";
            ctx.fillRect(cx - w * 0.5, gy - h, w, 4);
            ctx.fillStyle = "#00000030";
            ctx.fillRect(cx - w * 0.5, gy - h * 0.55, w, 2);
            ctx.strokeStyle = "#00000033";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - 2, gy - h);
            ctx.lineTo(cx - 5, gy - h * 0.5);
            ctx.lineTo(cx + 2, gy - h * 0.2);
            ctx.stroke();
            ctx.fillStyle = col;
            ctx.fillRect(cx - w * 0.5 - 4, gy - h * 0.85, 4, h * 0.55);
            ctx.fillRect(cx + w * 0.5, gy - h * 0.85, 4, h * 0.55);
          } else if (d.shape === "ghost") {
            ctx.save();
            ctx.globalAlpha *= 0.28;
            ctx.shadowColor = baseC;
            ctx.shadowBlur = 14;
            ctx.fillStyle = baseC;
            ctx.beginPath();
            ctx.arc(cx, gy - h * 0.6, w * 0.55, 0, 7);
            ctx.fill();
            ctx.restore();
            ctx.fillStyle = col;
            ctx.globalAlpha *= 0.9;
            ctx.beginPath();
            ctx.arc(cx, gy - h * 0.6, w * 0.5, Math.PI, 0);
            ctx.lineTo(cx + w * 0.5, gy - 4);
            for (let i = 0; i < 4; i++)
              ctx.lineTo(cx + w * 0.5 - w * 0.25 * (i + 0.5), gy - 4 + (i % 2 ? 4 : -2));
            ctx.lineTo(cx - w * 0.5, gy - 4);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = f.dead ? Math.max(0, 1 - f.deadA) : 1;
          } else {
            ctx.fillStyle = col;
            ctx.fillRect(cx - w * 0.35, gy - 14 * sz, 6 * sz, 14 * sz);
            ctx.fillRect(cx + w * 0.35 - 6 * sz, gy - 14 * sz, 6 * sz, 14 * sz);
            ctx.fillRect(cx - w * 0.42, gy - h, w * 0.84, h * 0.62);
            ctx.beginPath();
            ctx.arc(cx, gy - h - 2, w * 0.32, 0, 7);
            ctx.fill();
            if (key === "goblin") {
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.moveTo(cx - w * 0.3, gy - h - 1);
              ctx.lineTo(cx - w * 0.52, gy - h - 7);
              ctx.lineTo(cx - w * 0.18, gy - h - 3);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(cx + w * 0.3, gy - h - 1);
              ctx.lineTo(cx + w * 0.52, gy - h - 7);
              ctx.lineTo(cx + w * 0.18, gy - h - 3);
              ctx.fill();
            }
            if (key === "demon") {
              ctx.fillStyle = col;
              ctx.beginPath();
              ctx.moveTo(cx - w * 0.22, gy - h - 6);
              ctx.lineTo(cx - w * 0.34, gy - h - 17);
              ctx.lineTo(cx - w * 0.1, gy - h - 8);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(cx + w * 0.22, gy - h - 6);
              ctx.lineTo(cx + w * 0.34, gy - h - 17);
              ctx.lineTo(cx + w * 0.1, gy - h - 8);
              ctx.fill();
            }
            if (key === "orc") {
              ctx.fillStyle = "#f0f0e0";
              ctx.fillRect(cx - 4 * sz, gy - h * 0.86, 2 * sz, 3.5 * sz);
              ctx.fillRect(cx + 2 * sz, gy - h * 0.86, 2 * sz, 3.5 * sz);
            }
            if (key === "skeleton") {
              ctx.fillStyle = "#00000033";
              ctx.fillRect(cx - w * 0.26, gy - h * 0.55, w * 0.52, 1);
              ctx.fillRect(cx - w * 0.26, gy - h * 0.42, w * 0.52, 1);
              ctx.fillRect(cx - w * 0.26, gy - h * 0.3, w * 0.52, 1);
            }
            if (key === "bat") {
              ctx.fillStyle = col;
              const wf = Math.sin(anim.t * 13) * 7;
              ctx.beginPath();
              ctx.moveTo(cx - w * 0.3, gy - h * 0.55);
              ctx.lineTo(cx - w * 0.95, gy - h * 0.55 - wf);
              ctx.lineTo(cx - w * 0.5, gy - h * 0.32);
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(cx + w * 0.3, gy - h * 0.55);
              ctx.lineTo(cx + w * 0.95, gy - h * 0.55 - wf);
              ctx.lineTo(cx + w * 0.5, gy - h * 0.32);
              ctx.fill();
            }
          }
          if (f.hurt < 0.3) {
            const ey = gy - (d.shape === "block" ? h * 0.7 : d.shape === "blob" ? h * 0.5 : h * 0.9);
            if (f.boss) {
              ctx.fillStyle = "#ffde5a";
              ctx.shadowColor = cvar("--fire");
              ctx.shadowBlur = 7;
            } else ctx.fillStyle = "#111";
            ctx.fillRect(cx - 6 * sz, ey, 3 * sz, 3 * sz);
            ctx.fillRect(cx + 3 * sz, ey, 3 * sz, 3 * sz);
            ctx.shadowBlur = 0;
          }
          if (f.boss) {
            ctx.fillStyle = cvar("--gold");
            ctx.beginPath();
            ctx.moveTo(cx - 9, gy - h - 6);
            ctx.lineTo(cx - 4, gy - h - 16);
            ctx.lineTo(cx, gy - h - 6);
            ctx.lineTo(cx + 4, gy - h - 16);
            ctx.lineTo(cx + 9, gy - h - 6);
            ctx.closePath();
            ctx.fill();
            if (f.bossIdx === 7) {
              ctx.fillStyle = baseC;
              const wf = Math.sin(anim.t * 4) * 7;
              ctx.beginPath();
              ctx.moveTo(cx - w * 0.4, gy - h * 0.7);
              ctx.lineTo(cx - w * 1.15, gy - h * 0.95 - wf);
              ctx.lineTo(cx - w * 0.65, gy - h * 0.35);
              ctx.closePath();
              ctx.fill();
              ctx.beginPath();
              ctx.moveTo(cx + w * 0.4, gy - h * 0.7);
              ctx.lineTo(cx + w * 1.15, gy - h * 0.95 - wf);
              ctx.lineTo(cx + w * 0.65, gy - h * 0.35);
              ctx.closePath();
              ctx.fill();
              const ph = f.phase || 0;
              ctx.fillStyle = ph >= 2 ? "#ffec8a" : "#5a2016";
              for (let i = 0; i < ph + 3; i++) {
                const sxx = cx - w * 0.35 + i * ((w * 0.7) / (ph + 2));
                ctx.beginPath();
                ctx.moveTo(sxx, gy - h);
                ctx.lineTo(sxx + 3, gy - h - 8 - ph * 3);
                ctx.lineTo(sxx + 6, gy - h);
                ctx.closePath();
                ctx.fill();
              }
            } else if (f.bossIdx === 2 || f.bossIdx === 8) {
              ctx.fillStyle = baseC;
              for (let i = -1; i < 2; i++) {
                ctx.beginPath();
                ctx.moveTo(cx + i * w * 0.3, gy - h);
                ctx.lineTo(cx + i * w * 0.3 + 3, gy - h - 9);
                ctx.lineTo(cx + i * w * 0.3 + 6, gy - h);
                ctx.closePath();
                ctx.fill();
              }
            }
          }
          if (f.shieldUntil && run && run.time < f.shieldUntil) {
            ctx.save();
            ctx.globalAlpha = 0.55 + 0.2 * Math.sin(anim.t * 6);
            ctx.strokeStyle = "#c3cdde";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#c3cdde";
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cx, gy - h * 0.5, w * 0.9, 0, 7);
            ctx.stroke();
            ctx.restore();
          }
          if (f.evadeUntil && run && run.time < f.evadeUntil) {
            ctx.save();
            ctx.globalAlpha = 0.25 + 0.18 * Math.sin(anim.t * 7);
            ctx.fillStyle = "#7a5aa8";
            ctx.beginPath();
            ctx.arc(cx, gy - h * 0.5, w * 0.78, 0, 7);
            ctx.fill();
            ctx.restore();
          }
          ctx.globalAlpha = 1;
          /* ---- drawFoe: later layers (moved here) ---- */
          if (f.reflectUntil && run && run.time < f.reflectUntil) {
            ctx.save();
            ctx.globalAlpha = 0.55 + 0.2 * Math.sin(anim.t * 8);
            ctx.strokeStyle = "#bff4ff";
            ctx.lineWidth = 2;
            ctx.shadowColor = "#bff4ff";
            ctx.shadowBlur = 12;
            ctx.beginPath();
            ctx.arc(cx, gy - 26 * (f.draw.sz || 1), 30 * (f.draw.sz || 1), 0, 7);
            ctx.stroke();
            ctx.restore();
          }
        }
        if (!f || f.dead) break prev172;
        const x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 24,
          sz = (f.draw && f.draw.sz) || 1;
        ctx.save();
        if (f.elite) {
          ctx.globalAlpha = 0.34 + 0.12 * Math.sin(anim.t * 5);
          ctx.strokeStyle = "#ffcf5c";
          ctx.lineWidth = 2;
          ctx.shadowColor = "#ffcf5c";
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(x, gy - 27 * sz, 31 * sz, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (f.key === "shaman" && !f.boss) {
          ctx.strokeStyle = "#7b4d25";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(x + 13 * sz, gy - 4);
          ctx.lineTo(x + 17 * sz, gy - 47 * sz);
          ctx.stroke();
          ctx.fillStyle = "#79e08a";
          ctx.shadowColor = "#79e08a";
          ctx.shadowBlur = 9;
          ctx.beginPath();
          ctx.arc(x + 17 * sz, gy - 49 * sz, 5 * sz, 0, 7);
          ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = "#e6d08a";
          ctx.beginPath();
          ctx.moveTo(x - 9 * sz, gy - 33 * sz);
          ctx.lineTo(x, gy - 50 * sz);
          ctx.lineTo(x + 9 * sz, gy - 33 * sz);
          ctx.fill();
        }
        if (f.key === "plaguefrog" && !f.boss) {
          ctx.fillStyle = "#dfff72";
          ctx.beginPath();
          ctx.arc(x - 10 * sz, gy - 31 * sz, 6 * sz, 0, 7);
          ctx.arc(x + 10 * sz, gy - 31 * sz, 6 * sz, 0, 7);
          ctx.fill();
          ctx.fillStyle = "#17230d";
          ctx.beginPath();
          ctx.arc(x - 10 * sz, gy - 32 * sz, 2.4 * sz, 0, 7);
          ctx.arc(x + 10 * sz, gy - 32 * sz, 2.4 * sz, 0, 7);
          ctx.fill();
          ctx.strokeStyle = "#9ad246";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - 13 * sz, gy - 4);
          ctx.lineTo(x - 24 * sz, gy + 1);
          ctx.moveTo(x + 13 * sz, gy - 4);
          ctx.lineTo(x + 24 * sz, gy + 1);
          ctx.stroke();
        }
        if (f.key === "thornback" && !f.boss) {
          ctx.fillStyle = "#d7c06a";
          for (let i = -2; i <= 2; i++) {
            ctx.beginPath();
            ctx.moveTo(x + i * 7 * sz, gy - 34 * sz);
            ctx.lineTo(x + i * 7 * sz + 4 * sz, gy - 49 * sz - Math.abs(i) * 2);
            ctx.lineTo(x + i * 7 * sz + 8 * sz, gy - 34 * sz);
            ctx.fill();
          }
          if (f.thornUntil && run && run.time < f.thornUntil) {
            ctx.globalAlpha = 0.55 + 0.2 * Math.sin(anim.t * 8);
            ctx.strokeStyle = "#ffe080";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, gy - 24 * sz, 29 * sz, 0, 7);
            ctx.stroke();
          }
        }
        if (f.boss) drawBossDetails(f, x, gy, sz);
        ctx.restore();
      }
    }
  }
  if (!f || f.dead || f.bossIdx !== 12) return;
  const x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 24,
    s = (f.draw && f.draw.sz) || 1,
    t = anim.t;
  ctx.save();
  ctx.strokeStyle = "#e2d2ff";
  ctx.shadowColor = "#c89cff";
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(
      x,
      GY - 31 * s,
      (35 + i * 8) * s,
      (13 + i * 4) * s,
      t * (i % 2 ? 0.35 : -0.28) + i,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
  ctx.fillStyle = "#fff";
  ctx.font = Math.round(30 * s) + "px serif";
  ctx.textAlign = "center";
  ctx.fillText("?", x, GY - 45 * s);
  ctx.restore();
}

// Earlier version of drawFoe(), extended by the functions that follow.
function drawFoeBeforeV40(f, cx, gy) {
  prev63: {
    drawFoeBase(f, cx, gy);
    if (!f || f.dead || !f.superElite) break prev63;
    const x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 24,
      sz = (f.draw && f.draw.sz) || 1;
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.18 * Math.sin(anim.t * 7);
    ctx.strokeStyle = "#ff8cff";
    ctx.shadowColor = "#ffd65a";
    ctx.shadowBlur = 16;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, gy - 27 * sz, 35 * sz, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffd65a";
    ctx.font = Math.round(14 * sz) + "px serif";
    ctx.textAlign = "center";
    ctx.fillText("✦", x, gy - 58 * sz);
    ctx.restore();
  }
  if (
    !f ||
    f.dead ||
    (!(
      f.design &&
      [
        "lumenwisp",
        "pearlseraph",
        "prismhound",
        "oathkeeper",
        "celoracle",
        "celpurifier",
        "celwarden"
      ].includes(f.design)
    ) &&
      !((f.bossIdx || 0) >= CELESTIAL_AREA_START))
  )
    return;
  const x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 24,
    s = (f.draw && f.draw.sz) || 1,
    t = anim.t;
  ctx.save();
  ctx.translate(x, gy);
  ctx.scale(s, s);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#739b9b";
  ctx.lineWidth = 2;
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 12;
  if (f.boss) {
    ctx.strokeStyle = f.bossIdx === 16 ? "#ffffff" : "#dfffff";
    ctx.lineWidth = 3;
    for (let i = 0; i < (f.bossIdx === 16 ? 4 : 2); i++) {
      ctx.beginPath();
      ctx.ellipse(0, -31, 34 + i * 8, 12 + i * 4, t * (i % 2 ? 0.45 : -0.32) + i, 0, 7);
      ctx.stroke();
    }
    ctx.font = (f.bossIdx === 16 ? 34 : 27) + "px serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(f.bossIdx === 13 ? "α" : f.bossIdx === 14 ? "β" : f.bossIdx === 15 ? "γ" : "Ω", 0, -42);
    ctx.restore();
    return;
  }
  ctx.fillStyle = f.draw.c || "#fff";
  const eye = (x, y) => {
    ctx.fillStyle = "#2b6b6c";
    ctx.beginPath();
    ctx.arc(x, y, 2.5, 0, 7);
    ctx.fill();
    ctx.fillStyle = f.draw.c || "#fff";
  };
  if (f.design === "lumenwisp" || f.design === "celpurifier") {
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.quadraticCurveTo(-20, -38, 0, -48);
    ctx.quadraticCurveTo(20, -38, 17, 0);
    ctx.lineTo(8, -8);
    ctx.lineTo(0, 0);
    ctx.lineTo(-8, -8);
    ctx.fill();
    ctx.stroke();
    eye(-5, -31);
    eye(5, -31);
  } else if (f.design === "prismhound") {
    ctx.beginPath();
    ctx.ellipse(0, -16, 25, 13, 0, 0, 7);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-18, -24);
    ctx.lineTo(-28, -39);
    ctx.lineTo(-5, -29);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#a7ffff";
    for (const q of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(q * 14, -7);
      ctx.lineTo(q * 18, 1);
      ctx.stroke();
    }
    eye(-20, -26);
  } else if (f.design === "oathkeeper" || f.design === "celwarden") {
    ctx.fillRect(-20, -43, 40, 42);
    ctx.strokeRect(-20, -43, 40, 42);
    ctx.fillStyle = "#d5ece8";
    ctx.fillRect(-32, -32, 12, 29);
    ctx.fillRect(20, -32, 12, 29);
    ctx.strokeRect(-32, -32, 12, 29);
    ctx.strokeRect(20, -32, 12, 29);
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -52, 12, 0, 7);
    ctx.stroke();
    eye(-6, -30);
    eye(6, -30);
  } else {
    ctx.beginPath();
    ctx.moveTo(-17, 0);
    ctx.lineTo(-15, -35);
    ctx.lineTo(0, -48);
    ctx.lineTo(15, -35);
    ctx.lineTo(17, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, -54, 11, 0, 7);
    ctx.stroke();
    if (f.design === "celoracle") {
      ctx.beginPath();
      ctx.moveTo(19, -35);
      ctx.lineTo(29, -2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(19, -40, 6, 0, 7);
      ctx.stroke();
    }
    eye(-5, -31);
    eye(5, -31);
  }
  ctx.restore();
}

// Earlier version of drawFoe(), extended by the functions that follow.
function drawFoeAbyssBase(f, cx, gy) {
  prev64: {
    drawFoeBeforeV40(f, cx, gy);
    if (!f || f.dead || !f.omegaGuard) break prev64;
    const x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 24,
      s = (f.draw && f.draw.sz) || 1;
    ctx.save();
    ctx.globalAlpha = 0.65 + 0.2 * Math.sin(anim.t * 7);
    ctx.strokeStyle = "#ffffff";
    ctx.shadowColor = "#9ffaff";
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x, gy - 27 * s, 34 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = Math.round(14 * s) + "px serif";
    ctx.textAlign = "center";
    ctx.fillText("✦", x, gy - 58 * s);
    ctx.restore();
  }
  if (!f || f.dead || !f.trainingDummy) return;
  const x = cx + (f.enter || 0) * 90 + (f.hurt || 0) * 7 - Math.sin((f.atkA || 0) * Math.PI) * 24;
  ctx.save();
  ctx.strokeStyle = "#ffe09a";
  ctx.lineWidth = 3;
  ctx.shadowColor = "#ffcf5c";
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.arc(x, gy - 34, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, gy - 34, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#ffcf5c";
  ctx.beginPath();
  ctx.arc(x, gy - 34, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* purple particle aura for abyss elites */
function drawFoe(f, cx, gy) {
  drawFoeAbyssBase(f, cx, gy);
  if (!f || f.dead || !f.abyssElite) return;
  const s = (f.draw && f.draw.sz) || 1,
    t = typeof anim !== "undefined" && anim ? anim.t : 0;
  try {
    ctx.save();
    ctx.strokeStyle = "#c46bff";
    ctx.shadowColor = "#c46bff";
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + 0.25 * Math.sin(t * 5);
    ctx.beginPath();
    ctx.arc(cx, gy - 26 * s, 30 * s, 0, 7);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const a = t * 2 + (i * Math.PI) / 3,
        r = 30 * s;
      ctx.globalAlpha = 0.55 + 0.35 * Math.sin(t * 4 + i);
      ctx.fillStyle = i % 2 ? "#c46bff" : "#e6a6ff";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, gy - 26 * s + Math.sin(a) * r * 0.5, 2.6, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  } catch (e) {}
}

function showAbyssToken() {
  try {
    const d = document.createElement("div");
    d.className = "skullburst";
    d.style.color = "#c46bff";
    d.innerHTML = "🌀<span>ABYSS TOKEN</span>";
    document.body.appendChild(d);
    try {
      chord([330, 440, 660, 880], 0.5);
    } catch (e) {}
    try {
      flash("#c46bff");
    } catch (e) {}
    setTimeout(() => d.remove(), 2000);
  } catch (e) {}
}

// attackPower (gloves/amulet) was hard-capped at celestial 10 — let it climb through 13.
function attackPowerPct(g) {
  let prevResult188;
  prev188: {
    if (!g || !g.stats || g.stats.attackPower == null) {
      prevResult188 = 0;
      break prev188;
    }
    const rarity = [0.55, 0.62, 0.7, 0.8, 0.9, 1][Math.max(0, Math.min(5, g.rar || 0))],
      level = 0.55 + (0.45 * Math.min(180, Math.max(1, g.ilvl || 1))) / 180,
      plus = 0.55 + (0.45 * Math.min(20, Math.max(0, g.plus || 0))) / 20,
      celestial = 0.8 + (0.2 * Math.min(10, Math.max(0, g.celestial || 0))) / 10,
      roll = Math.max(0.4, Math.min(1, (g.stats.attackPower || 0) / 1.3));
    prevResult188 = 27 * rarity * level * plus * celestial * roll * (g.broken ? 0.5 : 1);
    break prev188;
  }
  let v = prevResult188;
  if (g && (g.celestial || 0) > 10) {
    v *= 1 + 0.05 * (Math.min(13, g.celestial) - 10);
  } // +5%/level past 10
  return v;
}

function swingTypeMulV50(wtype) {
  const T = (typeof window !== "undefined" && window.__spdTune) || {};
  const m = T.typeMul || { dagger: 0.78, bow: 0.92, sword: 1.07, greataxe: 1.37 };
  return m[wtype] != null ? m[wtype] : 1.0;
}

function swingInterval(atkSpeed, wtype) {
  const T = (typeof window !== "undefined" && window.__spdTune) || {};
  const floor = T.floor != null ? T.floor : 240,
    base = T.base != null ? T.base : 1400,
    K = T.K != null ? T.K : 150;
  return Math.max(floor, (base / (1 + Math.max(0, atkSpeed) / K)) * swingTypeMulV50(wtype));
}

function startAbyssRush() {
  if (!S.abyssUnlocked) {
    showTip("ABYSS LOCKED", "Defeat OMEGA first to open the Abyss.");
    return;
  }
  const cleared = [
    ...new Set(
      (S.abyssCleared || []).map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < AREAS.length)
    )
  ].sort((a, b) => a - b);
  if (!cleared.length) {
    showTip(
      "NO ABYSS BOSSES CLEARED",
      "Defeat at least one boss in the Abyss before entering its Boss Rush."
    );
    return;
  }
  if ((S.abyssTokens || 0) < 10) {
    showTip(
      "ABYSS TOKENS NEEDED",
      "The Abyss Boss Rush costs <b>10 🌀 Abyss Tokens</b>. They drop from Abyss bosses."
    );
    return;
  }
  S.abyssTokens -= 10;
  const seq = [];
  for (let i = 0; i <= 12; i++) seq.push({ ai: i, abyss: false });
  cleared.forEach(i => seq.push({ ai: i, abyss: true }));
  hCd = 0;
  const hs = heroStats();
  run = {
    ai: 0,
    a: AREAS[0],
    wave: 0,
    total: seq.length,
    foes: [],
    over: false,
    bags: [],
    enrageT: 0,
    enrageCd: 0,
    pT: 0,
    time: 0,
    dmgLog: [],
    healCd: 0,
    mech: null,
    cast: null,
    nextCastAt: null,
    slowStacks: 0,
    frozenUntil: 0,
    heroPoisonUntil: 0,
    air: null,
    airPenaltyT: 0,
    xpMult: 1,
    chainHits: 0,
    chainUntil: 0,
    suppressedSlot: null,
    suppressedUntil: 0,
    hunt: true,
    abyssRush: true,
    rushSeq: seq,
    huntIndex: 0,
    huntCount: seq.length,
    hero: { hp: hs.hp, max: hs.hp }
  };
  run.temperStacks = 0;
  run.joeStacks = 0;
  run.hardHatUsed = false;
  run.rebornUsed = false;
  run.guardianCheckpoints = [];
  try {
    initCombatRecap();
  } catch (e) {}
  try {
    installHeroHealthV41();
  } catch (e) {}
  $("town").style.display = "none";
  $("run").style.display = "block";
  $("traychips").innerHTML = "";
  try {
    updateTrayCount();
  } catch (e) {}
  try {
    updateHeal();
  } catch (e) {}
  hideCast();
  arrows = [];
  startMusic();
  nextWave();
  clearInterval(timer);
  timer = setInterval(tick, 150);
  try {
    scheduleSave();
  } catch (e) {}
}

/* Poison scales with item level and real attack cadence. Disease has a larger direct cap,
   while spread uses its own lower cap so one dying target cannot instantly fill the room. */
function poisonStackCap(g, hs) {
  if (!g) return 0;
  hs = hs || heroStats();
  const wtype = g.wtype || "sword",
    ms =
      typeof swingIntervalV50 === "function"
        ? swingIntervalV50(hs.atkSpeed || 0, wtype)
        : Math.max(350, 1400 / (1 + (hs.atkSpeed || 0) / 100)),
    hits = 1000 / ms,
    base = 6 + Math.floor(Math.max(1, g.ilvl || 1) / 15) + Math.floor(hits * 3),
    disease = (g.celestial || 0) >= 5;
  return Math.max(
    8,
    Math.min(disease ? 50 : 32, Math.round(disease ? base * 1.55 + (g.celestial || 0) : base))
  );
}

function poisonSpreadCapV51(g, hs) {
  return Math.max(6, Math.floor(poisonStackCap(g, hs) * 0.7));
}

/* Gamma's Crown of Thorns is permanent. Bows attack from outside its reflection field. */
function armGammaThorns() {
  if (!run || run.ai !== 15) return;
  const b = run.foes && run.foes.find(f => f.boss && f.hp > 0);
  if (!b || b.gammaThornsV51) return;
  b.gammaThornsV51 = true;
  b.thornUntil = Number.POSITIVE_INFINITY;
  b.name = "✹ " + b.name;
  buildFoeBars();
  drawBars();
  $("rmsg").className = "msg big";
  $("rmsg").textContent = "✹ CROWN OF THORNS · melee damage is violently reflected · swap to a Bow";
  sayBoss("COME CLOSER. I INSIST.");
}

function resetStageDamage() {
  if (!run) return;
  run.postFireDealt = 0;
  run.postfireDealt = 0;
  run.postFightDealt = 0;
  run._postFireDealt = 0;
  run.dmgLog = [];
  run.dpsT = 0;
  const de = $("dps"),
    df = $("dpsfill");
  if (de) de.textContent = "DPS 0";
  if (df) df.style.width = "2%";
}

/* Standard Boss Rush extends into every Celestial boss the player has actually beaten. */
function standardRushSequence() {
  const base = Array.from({ length: Math.max(6, Math.min(12, bossHuntCount())) }, (_, i) => i),
    cel = [13, 14, 15, 16].filter(i => S.clearedAreas.includes(i));
  return base.concat(cel);
}

/* Every lethal path converges on the same encounter completion logic. */
function finishZeroHealthBossV52() {
  if (!run || run.over || !run.foes || !run.foes.length) return;
  const zero = run.foes.filter(f => f.hp <= 0 && !f.dead);
  zero.forEach(f => killFoe(f));
  if (!run || run.over) return;
  const allDown = run.foes.every(f => f.hp <= 0),
    boss = run.foes.some(f => f.boss);
  if (allDown && boss && !(run.hunt && run._bossTransitionV52)) areaClear();
}

function attackPowerPctV54(g) {
  if (!g || !g.stats || g.stats.attackPower == null) return 0;
  const rarity = [0.88, 0.94, 1, 1.06, 1.12, 1.18][Math.max(0, Math.min(5, g.rar || 0))],
    level = 0.1 + 0.9 * Math.pow(Math.min(180, Math.max(1, g.ilvl || 1)) / 180, 0.78),
    plus = 0.55 + (0.45 * Math.min(20, Math.max(0, g.plus || 0))) / 20,
    celestial = 0.8 + (0.2 * Math.min(13, Math.max(0, g.celestial || 0))) / 13,
    roll = Math.max(0.4, Math.min(1, (g.stats.attackPower || 0) / 1.3));
  return 27 * rarity * level * plus * celestial * roll * (g.broken ? 0.5 : 1);
}

function enrageValueV54(g) {
  const p = Math.max(0, (g && g.plus) || 0),
    cel = Math.max(0, Math.min(13, (g && g.celestial) || 0)),
    m = 0.75 * (1 + 0.0125 * p) * (1 + 0.08 * cel) * (g && g.broken ? 0.5 : 1);
  return ((g && g.stats && g.stats.enrage) || 0) * m;
}

function oldEnrageMax(g) {
  const level = Math.max(1, Number(g && g.ilvl) || 1),
    r = Math.max(0, Math.min(5, Number(g && g.rar) || 0));
  if (r <= 4) return OLD_ENRAGE_PCT[r] * (1 + Math.min(0.12, level * 0.0008)) * 1.3;
  return (2 + level * 0.78) * RAR[r].m * 1.3;
}

function stopAutoRunV54() {
  if (run) run.autoRunV54 = false;
  autoRunState = null;
  if (typeof window.forgeV70AutoRunStop === "function") window.forgeV70AutoRunStop();
}

function launchAutoRunV54(ai, abyss) {
  if (typeof window.forgeV70AutoRunStart === "function") window.forgeV70AutoRunStart(ai, !!abyss);
  autoRunState = { ai, abyss: !!abyss };
  const dead = $("dead");
  if (dead) dead.classList.remove("on");
  const bubble = $("bossbubble");
  if (bubble) bubble.classList.remove("deathv51");
  if (abyss && window.abyssAPIv50) window.abyssAPIv50.enterAbyss(ai);
  else startRun(ai);
  if (run) run.autoRunV54 = true;
}

function decorateAutoRun() {
  const areas = $("areas");
  if (!areas) return;
  const abyss = !!(S.abyssUnlocked && S.abyssMode),
    map = abyss ? S.abyssAreaClearsV51 || {} : S.areaClearsV51 || {},
    tiles = [...areas.querySelectorAll(".atile")].slice(0, AREAS.length);
  tiles.forEach((tile, ai) => {
    const count = Number(map[ai]) || 0;
    if (count < 10) return;
    let b = tile.querySelector(".autorunv54");
    if (!b) {
      b = document.createElement("button");
      b.type = "button";
      b.className = "autorunv54";
      b.onclick = e => {
        e.stopPropagation();
        launchAutoRunV54(ai, abyss);
      };
      tile.appendChild(b);
    }
    b.textContent = "⟳ RE RUN";
    b.title = "Continuously rerun this area until you retreat, including after death";
  });
}

function bossRushLevelV56(index, heroLevel) {
  const i = Math.max(0, Number(index) || 0),
    hero = Math.max(1, Number(heroLevel) || 1),
    scale = 0.5 + 0.1 * i;
  return Math.max(1, Math.round(30 + hero + hero * scale));
}

/* V57 · Correct first Boss Rush spawn order and add progressive Rush Leech suppression. */
function bossRushLeechReductionV57(index) {
  return Math.min(0.95, 0.05 * (Math.max(0, Number(index) || 0) + 1));
}

function bossRushLevelV57(index, heroLevel) {
  const i = Math.max(0, Number(index) || 0),
    hero = Math.max(1, Number(heroLevel) || 1);
  return Math.max(1, Math.round(30 + hero * (1 + 0.065 * i)));
}

function standardRushSequenceV57() {
  const base = Array.from({ length: Math.max(6, Math.min(12, bossHuntCount())) }, (_, i) => i),
    cel = [13, 14, 15, 16].filter(i => S.clearedAreas.includes(i));
  return base.concat(cel);
}

/* V59 · Bloodforged Attack growth remains meaningful after ordinary forging. */
function bloodAttackCapV59(g) {
  const level = Math.max(1, Number(g && g.ilvl) || 1),
    cel = Math.max(0, Number(g && g.celestial) || 0),
    plus = Math.max(0, Math.min(20, Number(g && g.plus) || 0));
  return Math.max(1, Math.floor(level * (3.5 + 0.35 * cel) * (1 + 0.025 * plus)));
}

/* V61 · Summon pacing, Abyss Rush audit, Doom availability, Elemental Ward, and Bulwark balance. */
function addSummonFatigue(mech, baseCd) {
  if (!mech || !mech.resolve || mech._summonFatigueV61) return;
  const resolveBeforeV61 = mech.resolve;
  mech.resolve = function (b) {
    const before = run && run.foes ? run.foes.filter(f => f.hp > 0 && !f.boss).length : 0;
    const result = resolveBeforeV61.call(this, b);
    const after = run && run.foes ? run.foes.filter(f => f.hp > 0 && !f.boss).length : before;
    if (b && after > before) {
      b.summonWavesV61 = (b.summonWavesV61 || 0) + 1;
      this.cd = baseCd + b.summonWavesV61 * 1000;
      b.summonCooldownV61 = this.cd;
    }
    return result;
  };
  mech._summonFatigueV61 = true;
}

/* stronger abyss boss skills: bigger ability damage + longer timed debuffs */
function abilityHitHero(dmg, label, col, type) {
  if (
    (type === "fire" || type === "ice" || type === "lightning") &&
    S.gear &&
    S.gear.armor &&
    S.gear.armor.mythicAffix === "elementalWard"
  )
    dmg *= 0.9;
  if (run && run.a && run.a.abyss && typeof dmg === "number") dmg *= 1.5;
  if (run)
    run._incomingContextV41 = {
      label: cleanCombatLabel(label || "Enemy ability"),
      icon:
        String(label || "✦")
          .trim()
          .charAt(0) || "✦",
      source:
        run._queuedAbilitySourceV41 ||
        (run.foes && run.foes.find(f => f.boss && f.hp > 0)) ||
        (run.foes && run.foes.find(f => f.hp > 0))
    };
  try {
    if (run) run._enemyAttackSourceV40 = null;
    if (tryHardHatBlock()) return false;
    prev1: {
      if (!run || run.over) break prev1;
      const hs = heroStats(),
        sb = skillBonuses();
      if (type) {
        const rk =
          type === "fire" ? "fireRes" : type === "ice" ? "iceRes" : type === "lightning" ? "lightRes" : null;
        if (rk) dmg *= 1 - resPct(hs[rk] || 0) / 100;
      }
      dmg *= sb.damageTaken == null ? 1 : sb.damageTaken;
      dmg *= typeof window.__fragMulV102 === "function" ? window.__fragMulV102() : 1;
      if (run.hero.hp / run.hero.max < 0.5) dmg *= Math.max(0.5, 1 - (sb.lowHpGuard || 0));
      run.hero.hp -= dmg;
      anim.hero.hurt = 1;
      if (label) floatDmg("hero", label + " " + Math.round(dmg), 0, col || "#ff8080");
      else floatDmg("hero", dmg, 0, col || "#ff8080");
      if (run.hero.hp <= 0) {
        heroDown();
        break prev1;
      }
      drawBars();
    }
    /* ---- abilityHitHero: later layers (moved here) ---- */
    return true;

    return;
  } finally {
    if (run) {
      run._incomingContextV41 = null;
      run._queuedAbilitySourceV41 = null;
    }
  }

  return;

  return;
}

/* Abyss Rush previously added the full 29 boss sequence length to every Abyss level and never
   applied the controlled boss health profile. That caused a low normal opener, a 140 level jump,
   and uncapped polynomial boss health. This branch now mirrors standard Rush for its prelude and
   the corresponding Abyss campaign depth for its second half. */
function abyssLevelV61(ai) {
  const f = window.abyssAPIv50 && window.abyssAPIv50.level;
  if (f) return f(ai);
  return 160 + Math.round((Math.max(0, Math.min(16, Number(ai) || 0)) / 16) * 60);
}

function abyssArea(ai, orig) {
  return Object.assign({}, orig, { lvl: abyssLevelV61(ai), abyss: true, mirror: ai, n: "Abyss · " + orig.n });
}

function abyssRushLevelV61(index, entry, heroLevel) {
  if (entry && entry.abyss) return abyssLevelV61(entry.ai);
  const f = window.forgeV57 && window.forgeV57.bossRushLevel;
  if (f) return f(index, heroLevel);
  return Math.max(1, Math.round(30 + heroLevel * (1 + 0.065 * index)));
}

function armAbyssRushLeave() {
  const leave = $("huntleave");
  if (!leave) return;
  leave.disabled = true;
  leave.classList.add("choicecooldownv51");
  leave.textContent = "Leave with loot · 2.0s";
  const started = Date.now(),
    iv = setInterval(() => {
      if (!leave || !$("huntchoice").classList.contains("on")) {
        clearInterval(iv);
        return;
      }
      const left = Math.max(0, 2000 - (Date.now() - started));
      leave.textContent =
        left > 0 ? "Leave with loot · " + (left / 1000).toFixed(1) + "s" : "Leave with loot";
      if (left <= 0) {
        clearInterval(iv);
        leave.disabled = false;
        leave.classList.remove("choicecooldownv51");
      }
    }, 100);
}

function showAbyssRushCheckpoint(count) {
  $("huntchoicetext").innerHTML =
    "You defeated <b>" +
    count +
    " of " +
    run.huntCount +
    " bosses</b>. Leave safely with all loot or continue deeper into the Abyss.";
  $("huntchoice").classList.add("on");
  armAbyssRushLeave();
}

/* V64 · Abyss Rush uses earned bosses and can never write campaign progression. */
function earnedAbyssBossesV64() {
  return [
    ...new Set(
      (S.abyssCleared || []).map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < AREAS.length)
    )
  ].sort((a, b) => a - b);
}

function repairAbyssRushProgress() {
  S.flags = S.flags || {};
  if (S.flags.abyssRushProgressV64) return false;
  S.flags.abyssRushProgressV64 = true;
  const marked = earnedAbyssBossesV64(),
    mastery = S.abyssAreaClearsV51 || {},
    genuine = Object.keys(mastery)
      .map(Number)
      .filter(i => Number.isInteger(i) && i >= 0 && i < AREAS.length && Number(mastery[i]) > 0)
      .sort((a, b) => a - b);
  if (marked.length < AREAS.length || !genuine.length || genuine.length >= marked.length) return false;
  S.abyssCleared = [...new Set(genuine)];
  S.abyssMax = Math.min(AREAS.length - 1, Math.max(0, Math.max(...genuine) + 1));
  return true;
}

// Earlier version of doomPercentV41(), extended by the functions that follow.
function doomPercentBase(g) {
  const ratio = Math.max(0, Math.min(1, effectRatio(g, "doom"))),
    cel = Math.max(0, Math.min(10, Number(g && g.celestial) || 0)) / 10;
  let center = 0.05 + 0.1 * cel + 0.025 * ratio;
  if (g && g.mythicAffix === "mythicStatus") center *= 1.35;
  return Math.max(0.05, Math.min(0.2, center + (Math.random() * 2 - 1) * 0.035));
}

// Earlier version of doomPercentV41(), extended by the functions that follow.
function doomPercent(g) {
  return doomPercentBase(g) * (activeDiscipline().active && S.disciplineV70 === "doom" ? 1.35 : 1);
}

// Earlier version of combustTickMultV21(), extended by the functions that follow.
function combustTickBase(g) {
  return ((g && g.celestial) || 0) >= 5 ? 4 + 2 * celestialProgress(g) : 1;
}

// Earlier version of combustTickMultV21(), extended by the functions that follow.
function combustTickMult(g) {
  return combustTickBase(g) * (activeDiscipline().active && S.disciplineV70 === "burn" ? 1.4 : 1);
}

// Earlier version of enemyAttackDelayV18(), extended by the functions that follow.
function enemyDelayBase(f) {
  if (!f || !run || !f.frostStacks || run.time > f.frostUntil) {
    if (f && run && run.time > f.frostUntil) f.frostStacks = 0;
    return 1;
  }
  return 1 / Math.max(0.4, 1 - Math.min(0.6, f.frostStacks * 0.02));
}

// Earlier version of enemyAttackDelayV18(), extended by the functions that follow.
function enemyAttackDelay(f) {
  const c = contractKeyV70();
  return enemyDelayBase(f) * (c === "onslaught" || c === "mastery" ? 1 / 1.3 : 1);
}

function resistText(res) {
  const rows = Object.entries(res || {}).filter(([, v]) => v);
  return rows.length
    ? rows.map(([k, v]) => (STAT_LABEL[k] || k) + " " + (v > 0 ? "resistant" : "weak")).join(" · ")
    : "No notable elemental resistance";
}

function decorateAutoRunV70() {
  document.querySelectorAll(".autorunv54").forEach(b => {
    b.textContent = "⟳ AUTO RUN";
    b.title = "Reruns this area, but pauses on death, meaningful loot, or after five quiet clears";
  });
}

function finalBossRollV72_v7() {
  if (!run || !run.hunt || run._finalBossRollV72 || run.huntIndex < run.huntCount) return;
  run._finalBossRollV72 = true;
  if (Math.random() >= 0.33) return;
  const lvl = run._finalBossLvlV72 || 1;
  let rar = Math.max(rollRarity(lvl), rollRarity(lvl + 10), rollRarity(lvl + 18));
  rar = Math.min(4, rar + 1);
  run.bags.push({
    rar,
    lvl,
    slot: SLOTS[Math.floor(Math.random() * S.slotsOpen)].key,
    bossRollV72: true,
    finalRushRollV72: true
  });
  addBagChip(rar);
  $("rmsg").innerHTML += ' · <span style="color:var(--legendary)">Final boss roll!</span>';
}

function standardAreaBest() {
  let best = 0;
  Object.values(S.contractStageV72 || {}).forEach(r => {
    if (!r) return;
    best = Math.max(best, ["blood", "onslaught", "iron", "glass"].filter(k => r[k]).length);
  });
  return best;
}

function floatDmg(side, val, tier, color, x) {
  if (side === "hero" && typeof val === "number" && run && run._pressureDisplayV40) {
    val += run._pressureDisplayV40;
    run._pressureDisplayV40 = 0;
  }
  const b = $("battle");
  const d = document.createElement("div");
  d.className = "dmg";
  const t = Math.min(5, tier || 0);
  const vtxt = typeof val === "number" ? Math.round(val) : val;
  if (t >= 1) {
    d.classList.add("crit", "t" + t);
    d.style.color = CRITCOL[t];
    d.innerHTML = '<span class="clbl">' + "✦".repeat(Math.min(t, 3)) + " " + CRITLBL[t] + "</span>" + vtxt;
  } else {
    d.style.color = color || "#ffd0a0";
    d.textContent = vtxt;
  }
  floatDmg._k = ((floatDmg._k || 0) + 1) % 4;
  const jl = t >= 1 ? 0 : (Math.random() - 0.5) * 9;
  d.style.left = (side === "foe" ? (x != null ? (x / 560) * 100 : 72) : 26) + jl + "%";
  d.style.top = (t >= 2 ? 34 : 44) + (t >= 1 ? 0 : floatDmg._k * 8) + "px";
  b.appendChild(d);
  setTimeout(() => d.remove(), t >= 2 ? 1320 : 940);

  return;
}

function startRun(ai) {
  if (ai === 0 && firstCombatGuideNeeded()) {
    S.flags = S.flags || {};
    S.flags.firstCombatStartedV49 = true;
    const arrow = document.querySelector(".firstfightarrowv49");
    if (arrow) arrow.remove();
    scheduleSave();
  }
  hCd = 0;
  lastArea = ai;
  const a = AREAS[ai];
  run = {
    ai,
    a,
    wave: 0,
    total: a.waves,
    foes: [],
    over: false,
    bags: [],
    enrageT: 0,
    pT: 0,
    time: 0,
    dmgLog: [],
    healCd: 0,
    mech: null,
    cast: null,
    nextCastAt: null,
    slowStacks: 0,
    frozenUntil: 0,
    heroPoisonUntil: 0,
    air: a.gimmick === "drown" ? 100 : null,
    airPenaltyT: 0,
    xpMult: S.xpBuff > 0 ? 2 : 1
  };
  if (S.xpBuff > 0) {
    S.xpBuff--;
  }
  const hs = heroStats();
  run.hero = { hp: hs.hp, max: hs.hp };
  updateHeal();
  hideCast();
  arrows = [];
  $("gimmick").style.display = a.gimmick === "drown" ? "block" : "none";
  $("traychips").innerHTML = "";
  updateTrayCount();
  $("town").style.display = "none";
  $("run").style.display = "block";
  $("rmsg").className = "msg";
  $("rmsg").textContent = "Entering " + a.n + " — weak to " + a.weak;
  startMusic();
  nextWave();
  clearInterval(timer);
  timer = setInterval(tick, 150);
  /* ---- startRun: later layers (moved here) ---- */
  // Run initialization extensions for enrage cooldown and the new bosses.
  if (run) {
    run.enrageCd = 0;
    run.chainHits = 0;
    run.chainUntil = 0;
    run.suppressedSlot = null;
    run.suppressedUntil = 0;
  }
  if (run) {
    run.temperStacks = 0;
    run.joeStacks = 0;
    run.hardHatUsed = false;
    run.rebornUsed = false;
    run.guardianCheckpoints = [];
    installHeroHealth();
  }
  initCombatRecap();
  installHeroHealthV41();
  if ($("loottray")) $("loottray").style.display = "flex";
}

// Earlier version of bossHuntBossClearV6(), extended by the functions that follow.
function bossHuntBossClearBase() {
  const before = S.epicShards;
  prev19: {
    hideCast();
    const defeated = run.huntIndex,
      rewardMul = Math.pow(1.3, defeated),
      gold = Math.round(10000 * rewardMul),
      epic = Math.round(10 * rewardMul);
    run.lastHuntGoldReward = gold;
    S.gold += gold;
    S.epicShards += epic;
    run.huntIndex++;
    $("gold").textContent = fmtCur(S.gold);
    $("eshards").textContent = fmtCur(S.epicShards);
    $("eshwrap").style.display = "inline";
    $("rmsg").className = "msg big";
    $("rmsg").innerHTML =
      '<span style="color:var(--gold)">+' +
      fmt(gold) +
      ' gold</span> · <span style="color:var(--epic)">+' +
      epic +
      " epic shards</span>";
    scheduleSave();
    if (run.huntIndex >= run.huntCount) {
      setTimeout(completeBossHunt, 850);
      break prev19;
    }
    if (run.huntIndex === 5 || run.huntIndex === 10) {
      $("huntchoicetext").innerHTML =
        "You defeated <b>" +
        run.huntIndex +
        " bosses</b>. Leave safely with all loot or continue to stronger bosses.";
      $("huntchoice").classList.add("on");
      break prev19;
    }
    setTimeout(() => {
      if (run && !run.over) nextWave();
    }, 700);
  }
  /* ---- bossHuntBossClearV6: later layers (moved here) ---- */
  if (S.gear.amulet && S.gear.amulet.mythicAffix === "holyMission") {
    const gained = Math.max(0, S.epicShards - before),
      bonus = Math.floor(gained * 0.25);
    S.epicShards += bonus;
    updateForgeBalances();
  }
}

/* Checkpoint choice protection against accidental clicks. */
// Earlier version of bossHuntBossClearV6(), extended by the functions that follow.
function bossHuntBossClearBeforeV62() {
  let prevResult100;
  prev100: {
    const result = bossHuntBossClearBase();
    const leave = $("huntleave");
    if (leave && $("huntchoice").classList.contains("on")) {
      leave.disabled = true;
      leave.classList.add("choicecooldownv51");
      const started = Date.now(),
        label = leave.textContent;
      const iv = setInterval(() => {
        const left = Math.max(0, 2000 - (Date.now() - started));
        leave.textContent = left > 0 ? "Leave with loot · " + (left / 1000).toFixed(1) + "s" : label;
        if (left <= 0) {
          clearInterval(iv);
          leave.disabled = false;
          leave.classList.remove("choicecooldownv51");
        }
      }, 100);
    }
    prevResult100 = result;
    break prev100;
  }
  const result = prevResult100;
  if (run && run.hunt && !run.over) run._bossTransitionV52 = true;
  return result;
}

// Earlier version of bossHuntBossClearV6(), extended by the functions that follow.
function bossHuntBossClear() {
  const abyss = !!(run && run.abyssRush);
  let prevResult101;
  prev101: {
    if (!run || !run.abyssRush) {
      prevResult101 = bossHuntBossClearBeforeV62();
      break prev101;
    }
    hideCast();
    const defeated = run.huntIndex,
      rewardMul = Math.pow(1.3, defeated),
      gold = Math.round(10000 * rewardMul),
      epic = Math.round(10 * rewardMul);
    run.lastHuntGoldReward = gold;
    S.gold += gold;
    S.epicShards += epic;
    run.huntIndex++;
    run._bossTransitionV52 = true;
    $("gold").textContent = fmtCur(S.gold);
    $("eshards").textContent = fmtCur(S.epicShards);
    $("eshwrap").style.display = "inline";
    $("rmsg").className = "msg big";
    $("rmsg").innerHTML =
      '<span style="color:var(--gold)">+' +
      fmt(gold) +
      ' gold</span> · <span style="color:var(--epic)">+' +
      epic +
      " epic shards</span>";
    scheduleSave();
    if (run.huntIndex >= run.huntCount) {
      setTimeout(completeBossHunt, 850);
      prevResult101 = undefined;
      break prev101;
    }
    if (run.huntIndex % 5 === 0) {
      showAbyssRushCheckpoint(run.huntIndex);
      prevResult101 = undefined;
      break prev101;
    }
    setTimeout(() => {
      if (run && !run.over) nextWave();
    }, 700);
  }
  const result = prevResult101;
  if (run && run.hunt) {
    const st = ensureQuestState().stats,
      n = Number(run.huntIndex) || 0;
    if (abyss) st.abyssRushBest = Math.max(st.abyssRushBest, n);
    else st.rushBest = Math.max(st.rushBest, n);
    evaluateQuests(false);
  }
  return result;
}

function accessibleAreas(mode) {
  const max =
    mode === "abyss"
      ? Math.max(0, Math.min(AREAS.length - 1, Number(S.abyssMax) || 0))
      : Math.max(0, Math.min(AREAS.length - 1, Number(S.areaMax) || 0));
  return Array.from({ length: max + 1 }, (_, i) => i);
}

function completeBossHunt() {
  let prevResult102;
  prev102: {
    const valid = !!(run && run.hunt && !run.over),
      abyss = !!(run && run.abyssRush);
    let prevResult176;
    prev176: {
      finalBossRollV72_v7();
      if (!run || run.over) {
        prevResult176 = undefined;
        break prev176;
      }
      run.over = true;
      clearInterval(timer);
      hideCast();
      setTempo(260);
      $("stageclear").classList.add("on");
      const n = run.huntCount;
      setTimeout(() => {
        $("stageclear").classList.remove("on");
        startLootOpen(() => backToTown());
      }, 1200);
      $("rmsg").className = "msg big";
      $("rmsg").textContent = "Boss Hunt complete · " + n + " bosses defeated";

      prevResult176 = undefined;
      break prev176;
    }
    const result = prevResult176;
    if (valid) {
      const st = ensureQuestState().stats;
      if (abyss) st.abyssRushComplete++;
      else st.rushComplete++;
      evaluateQuests(false);
    }
    prevResult102 = result;
    break prev102;
  }
  const result = prevResult102;
  if (run && run.bags)
    run.bags.forEach(b => {
      if (b && b.finalRushRollV72) b.boss = true;
    });
  return result;
}

function clampArea(ai) {
  return Math.max(0, Math.min(AREAS.length - 1, Math.floor(Number(ai) || 0)));
}

function abyssBaseLevel(ai) {
  const fn = window.abyssAPIv50 && window.abyssAPIv50.level;
  return fn ? fn(ai) : 160 + Math.round((clampArea(ai) / 16) * 60);
}

function originalBossLevelV76(ai, abyss) {
  ai = clampArea(ai);
  const a = AREAS[ai];
  return Math.max(1, Math.round((abyss ? abyssBaseLevel(ai) : a.lvl) + (a.waves || 0)));
}

function bossRushLevelV76(ai, index, abyss) {
  return originalBossLevelV76(ai, abyss) + 3 + Math.max(0, Math.floor(Number(index) || 0));
}

function bossRushAttackMul(index) {
  return 1 + 0.1 * Math.max(0, Math.floor(Number(index) || 0));
}

function bossRushHealthMul(index) {
  return 1 + 0.05 * Math.max(0, Math.floor(Number(index) || 0));
}

function genericHealthBase(level) {
  return 32 + 2.7 * Math.pow(Math.max(1, level), 2.32);
}

function genericAttackBase(level) {
  return 4 + 0.35 * Math.pow(Math.max(1, level), 1.85);
}

function applyBossIdentityV76(f, ai, lvl, abyss) {
  ai = clampArea(ai);
  const a = AREAS[ai];
  f.lvl = lvl;
  f.atk = Math.round(f.atk * 1.35);
  if (!abyss && ai < 12) {
    let hp = Math.round(250 + 6.2 * Math.pow(lvl, 2.35));
    if (ai === 5) hp = Math.round(hp * 1.25);
    f.max = hp;
    f.hp = hp;
    f.atk = Math.round((6 + 0.45 * Math.pow(lvl, 1.75) * (1 + ai * 0.02)) * (ai === 5 ? 0.88 : 1));
    f.def = Math.round(2 + 0.08 * Math.pow(lvl, 1.62));
    f.balanceProfileV28 = true;
  } else {
    if (a.gimmick === "drown") f.atk = Math.round(f.atk * 0.5);
    if (ai === 12) {
      f.max = Math.round(f.max * 3.2);
      f.hp = f.max;
      f.atk = Math.round(f.atk * 1.25);
      f.def = Math.round(f.def * 1.12);
    }
    if (ai >= 13) {
      const tier = Math.max(0, Math.min(3, ai - 13)),
        hpMul = [2.2, 3, 4, 7.5][tier],
        atkMul = [1.06, 1.12, 1.18, 1.3][tier],
        pressure = [1.18, 1.28, 1.38, 1.52][tier];
      f.max = Math.round(f.max * hpMul);
      f.hp = f.max;
      f.atk = Math.round(f.atk * atkMul * pressure);
      f.def = Math.round(f.def * (1.05 + tier * 0.04));
      f.celestialDamageTunedV40 = true;
    }
  }
  if (abyss) {
    const original = originalBossLevelV76(ai, true),
      baseHp = 4000000 + 750000 * ai,
      levelRatio = genericHealthBase(lvl) / genericHealthBase(original);
    f.max = Math.max(1, Math.round(baseHp * levelRatio));
    f.hp = f.max;
    f.atk = Math.max(1, Math.round(f.atk * 1.25));
    f._abyssTunedV50 = true;
    f._abyssBoss = true;
  }
  return f;
}

function rushEntry() {
  if (!run || !run.hunt) return null;
  const index = Math.max(0, Math.floor(Number(run.huntIndex) || 0));
  if (run.abyssRush) {
    const e = run.rushSeq && run.rushSeq[index];
    return e ? { index, ai: clampArea(e.ai), abyss: !!e.abyss } : null;
  }
  const seq = run.huntSequenceV51,
    ai = seq && seq[index] != null ? seq[index] : index;
  return { index, ai: clampArea(ai), abyss: false };
}

/* Summons use the current Rush level and receive the same positional multipliers.
   OMEGA guards derive their values directly from OMEGA and therefore already inherit them. */
// Earlier version of summonFoe(), extended by the functions that follow.
function summonFoeBase(key, lvl, hpMul, x, extra) {
  if (!run) return null;
  run.foes = run.foes.filter(f => f.boss || f.hp > 0); // purge dead minions so bars never accumulate
  if (run.foes.filter(f => f.hp > 0 && !f.boss).length >= 2) return null;
  const f = buildFoe(key, lvl, hpMul, false);
  f._x = x;
  f.enter = 1;
  if (extra) Object.assign(f, extra);
  run.foes.push(f);
  buildFoeBars();
  drawBars();
  for (let i = 0; i < 8; i++)
    particles.push({
      x,
      y: GY - 20,
      vx: (Math.random() - 0.5) * 2,
      vy: -1 - Math.random() * 2,
      life: 1,
      sz: 2,
      col: "#c9a6ff"
    });
  return f;
}

function summonFoe(key, lvl, hpMul, x, extra) {
  let prevResult104;
  prev104: {
    let f;
    if (run && run.a && run.a.abyss) {
      run.foes = run.foes.filter(ff => ff.boss || ff.hp > 0);
      if (run.foes.filter(ff => ff.hp > 0 && !ff.boss).length >= 4) {
        prevResult104 = null;
        break prev104;
      }
      f = buildFoe(key, lvl, hpMul, false);
      f._x = x;
      f.enter = 1;
      if (extra) Object.assign(f, extra);
      run.foes.push(f);
      buildFoeBars();
      drawBars();
      for (let i = 0; i < 8; i++)
        particles.push({
          x,
          y: GY - 20,
          vx: (Math.random() - 0.5) * 2,
          vy: -1 - Math.random() * 2,
          life: 1,
          sz: 2,
          col: "#c9a6ff"
        });
    } else {
      f = summonFoeBase(key, lvl, hpMul, x, extra);
    }
    if (f && run) {
      if (run._firstSummonAt == null) run._firstSummonAt = run.time;
      f.summoned = true;
      f.noDrop = run.time !== run._firstSummonAt;
    }
    prevResult104 = f;
    break prev104;
  }
  const f = prevResult104;
  if (!f || !run || !run.hunt || f.omegaGuard) return f;
  const from = Math.max(1, Number(f.lvl) || 1),
    to = Math.max(1, Number(run.rushBossLevelV76) || from),
    hm = Number(run.rushHealthMulV76) || 1,
    am = Number(run.rushAttackMulV76) || 1;
  f.max = Math.max(1, Math.round(f.max * (genericHealthBase(to) / genericHealthBase(from)) * hm));
  f.hp = f.max;
  f.atk = Math.max(1, Math.round(f.atk * (genericAttackBase(to) / genericAttackBase(from)) * am));
  f.def = Math.max(0, Math.round(f.def * (genericDefenseBase(to) / genericDefenseBase(from))));
  f.lvl = to;
  f._rushScaledV76 = true;
  f.rushIndexV76 = run.huntIndex;
  f.rushDropLevelV76 = to;
  try {
    buildFoeBars();
    drawBars();
  } catch (e) {}
  return f;
}

function heroDown() {
  const willReborn = !!(run && !run.rebornUsed && S.gear.amulet && S.gear.amulet.mythicAffix === "reborn");
  let result;
  const reborn = run && !run.rebornUsed && S.gear.amulet && S.gear.amulet.mythicAffix === "reborn";
  if (reborn) run._healingContextV41 = "Reborn";
  prev105: {
    if (run && !run.rebornUsed && S.gear.amulet && S.gear.amulet.mythicAffix === "reborn") {
      run.rebornUsed = true;
      run.hero.hp = Math.max(1, run.hero.max * 0.1);
      flash("#ffffff");
      chord([392, 523, 784, 1046], 0.65);
      floatDmg("hero", "✺ REBORN", 0, "#ffffff");
      $("rmsg").className = "msg big";
      $("rmsg").textContent = "Reborn restores the hero with 10% health.";
      drawBars();
      break prev105;
    }
    run.over = true;
    clearInterval(timer);
    setTempo(260);
    hideCast();
    const before = run.bags.length;
    run.bags = run.bags.slice(0, Math.floor(before / 2));
    updateTrayCount();
    var wv = Math.min(run.wave, run.total),
      tot = run.total || 1,
      close = wv / tot,
      head,
      note;
    if (close >= 0.9) {
      head = "⚔ ONE WAVE SHORT";
      note = "You had " + run.a.n + ", and it had you first.";
      shake();
      setTimeout(shake, 90);
      setTimeout(shake, 190);
      flash("#ffcaa0");
      beep(120, 0.5, "sawtooth", 0.2);
      setTimeout(function () {
        chord([392, 330, 262], 0.6, 0.12);
      }, 130);
    } else if (close >= 0.6) {
      head = "SO CLOSE";
      note = "Fell on wave " + wv + " of " + tot + ", deep in " + run.a.n + ".";
      shake();
      setTimeout(shake, 110);
      flash("#ff8a4a");
      beep(110, 0.42, "sawtooth", 0.18);
    } else {
      head = "You fell";
      note = "Fell on wave " + wv + " of " + tot + " in " + run.a.n + ". Regroup and forge.";
      flash("#ff3b3b");
      beep(90, 0.32, "sawtooth", 0.14);
    }
    $("deadtext").innerHTML =
      "<b>" +
      head +
      "</b><br>" +
      note +
      "<br>Half your loot was lost — <b>" +
      before +
      " → " +
      run.bags.length +
      "</b> bags.";
    $("dead").classList.add("on");
  }
  if (run) run._healingContextV41 = null;
  if (run && run.over) renderDeathRecap();

  if (willReborn && run && run.rebornUsed && !run.over) rebornCry();
  return result;
}

function promoteSuperElite(f) {
  if (!f) return f;
  const base = { max: f.max, atk: f.atk, def: f.def };
  let prevResult195;
  prev195: {
    if (!f || f.superElite) {
      prevResult195 = f;
      break prev195;
    }
    if (!f.elite) {
      prevResult195 = makeElite(f, true);
      break prev195;
    }
    const areaIndex = run && Number.isInteger(run.ai) ? run.ai : 0;
    f.superElite = true;
    f.name = f.name.replace(/^◆ Elite /, "✦ Super Elite ");
    f.max = Math.round(f.max * 1.28);
    f.atk = Math.round(f.atk * 1.12);
    f.def = Math.round(f.def * 1.06);
    if (areaIndex >= 0 && areaIndex < 12) {
      const boss = campaignBossProfile(areaIndex);
      f.max = Math.min(f.max, Math.round(boss.hp * 0.9));
      f.atk = Math.min(f.atk, Math.round(boss.atk * 0.95));
    }
    f.hp = f.max;
    f.draw.sz *= 1.07;
    if (f.specialCd != null) {
      f.specialCd = 350;
      f.specialCdMax = 350;
    }
    prevResult195 = f;
    break prev195;
  }
  const result = prevResult195;
  result.max = Math.max(result.max, Math.round(base.max * 1.5));
  result.hp = result.max;
  result.atk = Math.max(result.atk, Math.round(base.atk * 1.22));
  result.def = Math.max(result.def, Math.round(base.def * 1.1));
  return result;
}

function enemyDmgProfile(ff, hh) {
  var key = ff && ff.key,
    e =
      ELEM_MAP[key] ||
      (typeof ENEMIES !== "undefined" && ENEMIES[key] && ENEMIES[key].elem) ||
      (ff && ff.elem) ||
      null;
  if (e) {
    var res = e === "fire" ? hh.fireRes || 0 : e === "ice" ? hh.iceRes || 0 : hh.lightRes || 0;
    var keep = 1 - resPct(res) / 100;
    var col = e === "fire" ? "#ff8a3a" : e === "ice" ? "#8fe0ff" : "#ffe14d";
    return { mult: 1.15, keep: keep, col: col, elem: e };
  }
  return { mult: 1, keep: 1 - defPct(hh.def || 0) / 100, col: null, elem: null };
}

function checkAreaBonus() {
  var f = F_v101_2();
  if (f.seenAreaBonusV100) return false;
  if (!(S.clearedAreas || []).includes(0)) return false;
  if (
    show_v101(
      "★ AREA MASTERY",
      "Clearing an area is not one-and-done. <b>Re-clearing the same area</b> earns <b>Area Mastery</b>:<br><br>• <b>Bronze</b> at 3 clears — a pile of gold and shards<br>• <b>Silver</b> and <b>Gold</b> further on — a <b>permanent stat bonus</b> and epic shards<br><br>So a stage you find easy becomes a friendly little farm. Revisit your favourites."
    )
  ) {
    f.seenAreaBonusV100 = true;
    try {
      scheduleSave();
    } catch (e) {}
    return true;
  }
  return false;
}

function areaIndexFromText(txt) {
  var best = -1,
    bl = 0;
  for (var i = 0; i < AREAS.length; i++) {
    var nm = AREAS[i] && AREAS[i].n;
    if (nm && txt.indexOf(nm) >= 0 && nm.length > bl) {
      best = i;
      bl = nm.length;
    }
  }
  return best;
}

// award the bounty on contract completion (area cleared while a contract is active)
// Earlier version of areaClear(), extended by the functions that follow.
function areaClearBase() {
  let medalMessage = "";
  if (run && !run.hunt && !run.dummy) {
    ensureV51State();
    const abyss = !!(run.a && run.a.abyss),
      map = abyss ? S.abyssAreaClearsV51 : S.areaClearsV51,
      ai = String(run.mirror == null ? run.ai : run.mirror),
      count = (Number(map[ai]) || 0) + 1;
    map[ai] = count;
    medalMessage = grantMedalRewards(Number(ai), count, abyss);
  }
  let prevResult108;
  {
    const abyss = !!(run && run.abyss && !run.hunt),
      mirror = run && (run.mirror == null ? run.ai : run.mirror);
    const firstOmega = !!(run && !run.hunt && !abyss && run.ai === 16 && !S.abyssUnlocked);
    {
      const ai = run && run.ai,
        first = ai != null && !S.clearedAreas.includes(ai);
      const intro = run && !run.hunt && run.ai === 5 && !S.clearedAreas.includes(5);
      prev3: {
        if (run && run.hunt) {
          bossHuntBossClear();
          break prev3;
        }
        run.over = true;
        clearInterval(timer);
        setTempo(260);
        hideCast();
        chord([523, 659, 784, 1046, 1319], 0.7);
        flash(cvar("--gold"));
        shake();
        const firstClear = !S.clearedAreas.includes(run.ai);
        if (firstClear) S.clearedAreas.push(run.ai);
        if (run.ai >= S.areaMax) S.areaMax = Math.min(AREAS.length - 1, run.ai + 1);
        $("cleartext").innerHTML =
          "You cleared " +
          run.a.n +
          "!" +
          (firstClear ? " A boon awaits." : "") +
          (run.ai + 1 < AREAS.length ? " Next area unlocked." : "");
        $("stageclear").classList.add("on");
        setTimeout(() => {
          $("stageclear").classList.remove("on");
          startLootOpen(() => (firstClear ? showBoon() : backToTown()));
        }, 1500);
        /* ---- areaClear: later layers (moved here) ---- */
        // Inventory-full warning is shown once ever, then overflow continues to auto-salvage.
        scheduleSave();
      }
      if (intro) {
        S.flags.bossHuntIntroPending = true;
        scheduleSave();
      }
      if (first && ai === 12)
        setTimeout(
          () =>
            showTip(
              "THE SKY OPENS",
              "The End was not the end. Four Celestial Guardian trials have appeared. Each contains 25 rooms and a Celestial Guardian."
            ),
          1700
        );
    }
    if (abyss) {
      S.abyssCleared = S.abyssCleared || [];
      if (!S.abyssCleared.includes(mirror)) S.abyssCleared.push(mirror);
      S.abyssMax = Math.max(S.abyssMax || 0, Math.min(AREAS.length - 1, mirror + 1));
      try {
        scheduleSave();
      } catch (e) {}
    }
    if (firstOmega) {
      S.abyssUnlocked = true;
      S.abyssMax = Math.max(S.abyssMax || 0, 0);
      try {
        scheduleSave();
      } catch (e) {}
      setTimeout(() => {
        try {
          showTip(
            "THE ABYSS OPENS",
            "After OMEGA fell, time and space collapsed around you for a moment. A corrupted world bleeds through — the <b>Abyss</b>, where every creature is deadlier and every boss skill hits harder.<br><br>Toggle <b>🌀 Abyss</b> beside the stage map. Your gear carries over, items can now be Celestial-forged to <b>✦13</b>, and Abyss bosses drop <b>🌀 Abyss Tokens</b> for the Abyss Boss Rush."
          );
        } catch (e) {}
      }, 1900);
    }
  }
  const result = prevResult108;
  if (medalMessage && $("cleartext"))
    $("cleartext").innerHTML += '<br><b style="color:var(--gold)">' + medalMessage + "</b>";
  scheduleSave();
  return result;
}

// Earlier version of areaClear(), extended by the functions that follow.
function clearBase() {
  const uid = run && run.guildOfferUidV75,
    mode = run && run.guildOfferModeV75;
  let prevResult109;
  prev109: {
    if (run && run.contractV70 && !run.contractRewardedV70) {
      run.contractRewardedV70 = true;
      ensureV70State();
      S.contractCompletionsV70[run.contractV70] =
        (Number(S.contractCompletionsV70[run.contractV70]) || 0) + 1;
      contractStageRecordV72(run.ai, !!(run.a && run.a.abyss))[run.contractV70] = true;
      S.lastContractClearV70 = { id: run.contractV70, area: run.a && run.a.n, at: Date.now() };
      S.activeContractV70 = null;
      scheduleSave();
    }
    prevResult109 = areaClearBase();
    break prev109;
  }
  const result = prevResult109;
  if (uid && mode) {
    const all = ensureGuildOffers();
    all[mode] = all[mode].filter(o => o.uid !== uid);
    refillOffers(mode);
    scheduleSave();
  }
  return result;
}

function areaClear() {
  var cid = run && run.guildContractV75,
    ai = run && run.guildOfferAreaV75;
  let prevResult202;
  prev202: {
    const ai = run && run.ai,
      eligible = !!(
        run &&
        !run.hunt &&
        !run.dummy &&
        !(run.a && run.a.abyss) &&
        !(S.clearedAreas || []).includes(ai)
      ),
      result = clearBase();
    if (eligible) {
      if (ai === 0) queueNotice("shop");
      if (ai === 1) queueNotice("compendium");
      if (ai === 2) queueNotice("guild");
    }
    prevResult202 = result;
    break prev202;
  }
  var r = prevResult202;
  try {
    if (cid != null && Number.isInteger(ai)) {
      var isM = cid === "mastery",
        bt = bounty(ai, isM);
      S.gold = (S.gold || 0) + bt.gold;
      S.shards = (S.shards || 0) + bt.shards;
      if (isM) {
        try {
          S.questV74 = S.questV74 || {};
          S.questV74.points = (Number(S.questV74.points) || 0) + 2;
        } catch (e) {}
      }
      try {
        scheduleSave();
      } catch (e) {}
      setTimeout(function () {
        try {
          showTip(
            "CONTRACT COMPLETE",
            "Bounty paid: <b style='color:var(--gold)'>" +
              fmt(bt.gold) +
              " gold</b> and <b style='color:var(--rare)'>" +
              bt.shards +
              " shards</b>." +
              (isM ? "<br><br><b style='color:#1fb8ad'>★ +2 Quest Points</b> for the ultimate contract." : "")
          );
        } catch (e) {}
      }, 400);
    }
  } catch (e) {}
  return r;
}

function showRetreatExplainer() {
  try {
    if (typeof run !== "undefined" && run && (run.dummy || run.hunt)) return;
  } catch (e) {}
  if (taught()) return;
  markTaught();
  setTimeout(function () {
    try {
      if (typeof showTip === "function")
        showTip(
          "HOW RETREAT WORKS",
          "That was your first battle. From here on, once you reach certain waves you can hit <b>Retreat</b>.<br><br>Retreating ends the attempt without clearing the area, but you <b>keep every loot bag</b> you collected. Use it when a fight turns too dangerous instead of risking a full wipe."
        );
    } catch (e) {}
  }, 900);
}

function heroCtx() {
  var cv = document.getElementById("cv");
  return cv ? cv.getContext("2d") : null;
}

function ensureCombatBtns() {
  var host = document.querySelector(".runbtns");
  if (!host) return null;
  var c = document.getElementById("actbtnsv111");
  if (!c) {
    c = document.createElement("div");
    c.id = "actbtnsv111";
    c.className = "actbtnsv111";
    host.insertBefore(c, host.firstChild);
  }
  return c;
}

function renderCombatBtns() {
  var c = ensureCombatBtns();
  if (!c) return;
  if (typeof run === "undefined" || !run || run.over) {
    if (c._sig !== "") {
      c.innerHTML = "";
      c._sig = "";
      c._btns = null;
    }
    c.style.display = "none";
    return;
  }
  var a = ensureState_p21();
  if (!a) {
    c.style.display = "none";
    return;
  }
  var load = a.loadout.slice(0, unlockedSlots());
  if (!load.length) {
    if (c._sig !== "") {
      c.innerHTML = "";
      c._sig = "";
      c._btns = null;
    }
    c.style.display = "none";
    return;
  }
  c.style.display = "flex";
  var t = nowT(),
    rt = actRT();
  var sig = load.join(",");
  if (c._sig !== sig) {
    /* rebuild nodes ONLY when the loadout changes, so a click is never eaten by a mid-click rebuild */
    c.innerHTML = "";
    c._btns = {};
    load.forEach(function (id, ix) {
      var w = document.createElement("div");
      w.className = "actwrapv112";
      var b = document.createElement("button");
      b.className = "actbtnv111 " + ACT[id].side;
      b.innerHTML =
        '<span class="akeyv115">' + (ix + 1) + '</span><span class="ai">' + ACT[id].icon + "</span>";
      b.title = ACT[id].name + " — " + (powText(id) || shortDesc(id));
      b.onclick = function () {
        activate(id);
      };
      w.appendChild(b);
      var lab = document.createElement("div");
      lab.className = "acdlabelv112";
      w.appendChild(lab);
      c.appendChild(w);
      c._btns[id] = { b: b, lab: lab };
    });
    c._sig = sig;
  }
  load.forEach(function (id) {
    var ref = c._btns && c._btns[id];
    if (!ref) return;
    var ready = (rt.cd[id] || 0) <= t,
      rem = Math.ceil(((rt.cd[id] || 0) - t) / 1000);
    ref.b.disabled = !ready;
    ref.b.classList.toggle("liveon", buffOn(id) || (id === "miracle" && rt.miracleUntil > t));
    ref.lab.textContent = ready ? "" : rem + "s";
  });
}

function scrubEnrage(g) {
  try {
    if (g && g.stats && g.stats.enrage != null) delete g.stats.enrage;
  } catch (e) {}
}

function scrubAllEnrage() {
  try {
    if (typeof S === "undefined") return;
    [S.gear, S.gear2].forEach(function (set) {
      if (set) for (var k in set) scrubEnrage(set[k]);
    });
    (S.bag || []).forEach(scrubEnrage);
    (S.gearBagV82 || []).forEach(scrubEnrage);
  } catch (e) {}
}

/* V114 · Active-skill unlock guide. Heal is auto-selected at Lv1; at Lv2 a popup + golden arrow
   guide the player to the Active skill tree to pick more skills. */
function heroLv() {
  try {
    return (S && S.heroLevel) || 1;
  } catch (e) {
    return 1;
  }
}
