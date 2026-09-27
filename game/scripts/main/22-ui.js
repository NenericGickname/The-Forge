/* Town screen and general interface: rendering, panels, popups, floating numbers, canvas drawing. */

function shake() {
  const s = $("wrap");
  s.classList.remove("shaking");
  void s.offsetWidth;
  s.classList.add("shaking");
}

function flash(c) {
  const f = $("flash");
  f.style.background = "radial-gradient(circle at 50% 40%," + c + "55,transparent 60%)";
  f.style.transition = "none";
  f.style.opacity = "1";
  requestAnimationFrame(() => {
    f.style.transition = "opacity .5s";
    f.style.opacity = "0";
  });
}

function dragonPhase(b, stage) {
  b.atk = Math.round(b.atk * 1.16);
  b.hasteMul = (b.hasteMul || 1) * 0.82;
  flash("#ff3b1e");
  shake();
  beep(150, 0.35, "sawtooth", 0.16);
  sayBoss(stage >= 3 ? "Now you burn for REAL." : "You've only made me angrier!");
  $("rmsg").className = "msg big";
  $("rmsg").innerHTML = "🐉 The Wyrm enters stage " + stage + " — faster & fiercer!";
}

function fmt(n) {
  return Math.floor(n).toLocaleString();
}

function fmtCur(n) {
  n = Math.floor(Number(n) || 0);
  function tr(x) {
    x = Math.round(x * 10) / 10;
    return x % 1 === 0 ? x.toFixed(0) : x.toFixed(1);
  }
  if (n >= 1e9) return tr(n / 1e9) + "b";
  if (n >= 1e6) return tr(n / 1e6) + "m";
  return n.toLocaleString();
}

function setBar(id, frac, text) {
  const el = $(id);
  if (!el) return;
  el.style.width = Math.max(0, frac) * 100 + "%";
  const c = $(id + "c");
  if (c) c.style.width = Math.max(0, frac) * 100 + "%";
  const t = $(id + "t");
  if (t) t.textContent = text;
}

function fxIcon(icon, greyFrac, kind, count) {
  const g = Math.max(0, Math.min(1, greyFrac));
  return (
    '<span class="fx ' +
    kind +
    '">' +
    icon +
    '<span class="fxfill" style="height:' +
    (g * 100).toFixed(0) +
    '%"></span>' +
    (count ? '<span class="fxn">' + count + "</span>" : "") +
    "</span>"
  );
}

function updateTrayCount() {
  const el = $("traycount");
  if (el) el.textContent = run ? run.bags.length : 0;
}

function backToTown() {
  const dm = $("dummymeterv41");
  if (dm) {
    dm.classList.remove("on");
    dm.innerHTML = "";
  }
  if ($("loottray")) $("loottray").style.display = "flex";
  setTempo(260);
  $("run").style.display = "none";
  $("town").style.display = "grid";
  renderTown();
  /* ---- backToTown: later layers (moved here) ---- */
  if (S.flags.bossHuntIntroPending) {
    S.flags.bossHuntIntroPending = false;
    S.flags.bossHuntIntroSeen = true;
    scheduleSave();
    setTimeout(
      () =>
        showTip(
          "BOSS HUNT UNLOCKED",
          "The <b>Boss Hunt</b> is now available below the area map. Bosses in areas after the Sunken Ruins have a 50% Skull Token chance. Elites there have a 4% chance. Spend 10 tokens to enter."
        ),
      250
    );
  }
}

function frame() {
  anim.t += 0.016;
  anim.hero.swing = Math.max(0, anim.hero.swing - 0.06);
  anim.hero.hurt = Math.max(0, anim.hero.hurt - 0.07);
  if (run)
    for (const f of run.foes) {
      f.hurt = Math.max(0, f.hurt - 0.08);
      f.atkA = Math.max(0, f.atkA - 0.05);
      f.enter = Math.max(0, f.enter - 0.05);
      if (f.dead) f.deadA = Math.min(1, f.deadA + 0.05);
    }
  // particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.28;
    p.life -= 0.028;
    if (p.life <= 0 || p.y > GY + 8) particles.splice(i, 1);
  }
  if ($("run").style.display !== "none" && run) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.setTransform(CANVAS_RENDER_SCALE, 0, 0, CANVAS_RENDER_SCALE, 0, 0);
    drawBg(run.a);
    drawKnight(150, GY, anim.hero.swing);
    run.foes.forEach(f => {
      if (f.hp > 0 || f.dead) drawFoe(f, f._x, GY);
    });
    for (let i = arrows.length - 1; i >= 0; i--) {
      const ar = arrows[i];
      ar.t += 0.16;
      const x = ar.sx + (ar.tx - ar.sx) * ar.t;
      const arc = Math.sin(ar.t * Math.PI) * 9;
      const y = ar.sy + (ar.ty - ar.sy) * ar.t - arc;
      const dx = ar.tx - ar.sx,
        dy = ar.ty - ar.sy - Math.cos(ar.t * Math.PI) * 9;
      const a = Math.atan2(dy, dx);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.strokeStyle = "#ffe6b0";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#ffcf5c";
      ctx.shadowBlur = 5;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.lineTo(6, 0);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(3, -2.5);
      ctx.lineTo(3, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      if (ar.t >= 1) {
        spawnHit(ar.tx, GY - 22, false, 5);
        arrows.splice(i, 1);
      }
    }
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.col;
      ctx.fillRect(p.x, p.y, p.sz, p.sz);
    }
    ctx.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
}

function softShake() {
  const e = $("wrap");
  if (!e) return;
  e.classList.remove("softshaking");
  void e.offsetWidth;
  e.classList.add("softshaking");
}

// Generic first-time tutorial popups.
function showTip(title, body) {
  $("tiptitle").textContent = title;
  $("tipbody").innerHTML = body;
  $("tipmodal").classList.add("on");
}

function showSkullToken() {
  const d = document.createElement("div");
  d.className = "skullburst";
  d.innerHTML = "☠<span>BOSS HUNT TOKEN</span>";
  document.body.appendChild(d);
  chord([220, 330, 440, 660], 0.5);
  flash(cvar("--epic"));
  setTimeout(() => d.remove(), 2300);
}

function maxFormat(g, stat) {
  const v = maxFinalRoll(g, stat);
  if (CURVED.has(stat) || stat === "healCdr" || stat === "lifesteal") return Math.round(v);
  return PERCENT.has(stat) ? v.toFixed(1) + "%" : Math.round(v);
}

function comparisonRows(oldGear, newGear) {
  const order = [...OFFSTATS, ...DEFSTATS, ...UTILSTATS],
    keys = order.filter(st => st in oldGear.stats || st in newGear.stats);
  const before = keys
    .map(
      st =>
        '<div class="rfstat"><span>' + STAT_LABEL[st] + "</span><b>" + statFormat(oldGear, st) + "</b></div>"
    )
    .join("");
  const after = keys
    .map(st => {
      const ov = st in oldGear.stats ? gStat(oldGear, st) : null,
        nv = st in newGear.stats ? gStat(newGear, st) : null,
        cl = ov == null ? "new" : nv == null ? "down" : nv > ov + 0.04 ? "up" : nv < ov - 0.04 ? "down" : "",
        star = isMaxRoll(newGear, st) ? ' <span class="maxstar">★</span>' : "",
        max = nv == null ? "" : ' <span class="rollmax">[' + maxFormat(newGear, st) + "]</span>";
      return (
        '<div class="rfstat ' +
        cl +
        '"><span>' +
        STAT_LABEL[st] +
        star +
        "</span><b>" +
        statFormat(newGear, st) +
        max +
        "</b></div>"
      );
    })
    .join("");
  return { before, after };
}

function textV19(v, max) {
  return typeof v === "string" ? v.slice(0, max) : "";
}

// Earlier version of drawBars(), extended by the functions that follow.
function drawBarsBase() {
  prev42: {
    if (!run) break prev42;
    setBar(
      "hfill",
      run.hero.hp / run.hero.max,
      Math.ceil(Math.max(0, run.hero.hp)) + " / " + Math.ceil(run.hero.max)
    );
    $("hlvl").textContent = "Lv " + S.heroLevel;
    const xe = $("cxpfill");
    if (xe) xe.style.width = Math.min(100, (S.xp / xpFor(S.heroLevel)) * 100) + "%";
    run.foes.forEach((f, i) =>
      setBar("foe" + i, f.hp / f.max, Math.ceil(Math.max(0, f.hp)) + " / " + Math.ceil(f.max))
    );
  }
  if (!run) return;
  run.foes.forEach((f, i) => {
    const d = $("doomfill" + i);
    if (d) d.style.width = Math.min(100, Math.max(0, ((f.doom || 0) / Math.max(1, f.max)) * 100)) + "%";
  });
}

function drawBars() {
  drawBarsBase();
  if (!run) return;
  const label = $("hlvl");
  if (label)
    label.textContent = "Lv " + S.heroLevel + " · " + fmt(S.xp) + " / " + fmt(xpFor(S.heroLevel)) + " XP";
}

function setupUI() {
  const style = document.createElement("style");
  style.textContent =
    ":root{--mythic:#1fb8ad}.mythicaffix{color:var(--mythic);font-weight:800;text-shadow:0 0 7px #0d8d86}.rainbow{background:linear-gradient(90deg,#ff6b6b,#ffd76a,#62e68b,#55cfff,#c98cff);background-clip:text;-webkit-background-clip:text;color:transparent!important}.compendiumbtn{background:#171e20;color:#c9fff9;border-color:#247b75}.compbox{max-width:760px;max-height:88vh;overflow:auto}.compgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;text-align:left}.compentry{background:#0d1215;border:1px solid #29413f;border-radius:8px;padding:11px}.compentry b{display:block;color:#79e5dc;margin-bottom:5px}.reforgelock{display:block;margin:4px auto 8px;background:#11151b;color:#fff;border:1px solid #4f8d88;border-radius:6px;padding:6px 10px}.forgebalancev36{font-size:10px;font-weight:800;line-height:1.5;text-align:left;position:absolute;top:54px;left:14px}.celestialburst{position:fixed;z-index:200;left:50%;top:26%;transform:translate(-50%,-50%);font-size:72px;color:#55f4e6;text-shadow:0 0 25px #16b8ad;animation:skullpop 2.1s ease forwards;pointer-events:none}.celestialburst span{display:block;font-size:13px;letter-spacing:3px;white-space:nowrap}.guardiancheckpoint h2{color:var(--mythic)}.guardiancheckpoint .checkpointbuttons{display:flex;gap:10px;margin-top:14px}.guardiancheckpoint button{flex:1}.guardianfoe{filter:drop-shadow(0 0 8px #fff)}@media(max-width:720px){.compgrid{grid-template-columns:1fr}}";
  document.head.appendChild(style);
  const res = document.querySelector(".res"),
    esh = $("eshwrap");
  if (res && !$("celestialwrap")) {
    const span = document.createElement("span");
    span.id = "celestialwrap";
    span.style.display = "none";
    span.innerHTML = ' · Celestial <b id="celestialshards" style="color:var(--mythic)">0</b>';
    esh.insertAdjacentElement("afterend", span);
  }
  if (res && !$("compendiumbtn")) {
    const b = document.createElement("button");
    b.id = "compendiumbtn";
    b.className = "savefilebtn compendiumbtn";
    b.type = "button";
    b.title = "Open the compendium";
    b.textContent = "📖 COMPENDIUM";
    $("shopbtn").insertAdjacentElement("afterend", b);
  }
  if (!$("forgebalancev36")) {
    const d = document.createElement("div");
    d.id = "forgebalancev36";
    d.className = "forgebalancev36";
    $("forgecost").insertAdjacentElement("afterend", d);
  }
  if (!$("reforgelock")) {
    const s = document.createElement("select");
    s.id = "reforgelock";
    s.className = "reforgelock";
    s.innerHTML = '<option value="">No locked stat</option>';
    $("reforgeitemname").insertAdjacentElement("afterend", s);
  }
  if (!$("guardiancheckpoint")) {
    const d = document.createElement("div");
    d.id = "guardiancheckpoint";
    d.className = "over guardiancheckpoint";
    d.innerHTML =
      '<h2>✺ CELESTIAL CHECKPOINT ✺</h2><div class="msg big" id="guardiancheckpointtext"></div><div class="checkpointbuttons"><button class="rf" id="guardianswap">Swap Gear Set</button><button class="go" id="guardiancontinue">Continue</button></div>';
    $("huntchoice").insertAdjacentElement("afterend", d);
    $("guardianswap").onclick = () => {
      if (!S.gearSetUnlocked) {
        showTip("GEAR SET LOCKED", "Unlock the second gear set in the shop first.");
        return;
      }
      const pct = run && run.hero ? run.hero.hp / run.hero.max : 1;
      switchGearSet();
      if (run && run.hero) {
        run.hero.max = heroStats().hp;
        run.hero.hp = Math.min(run.hero.max, run.hero.max * pct);
        installHeroHealth();
        drawBars();
      }
      $("guardianswap").textContent = "Active Set " + (S.activeSet === 2 ? "II" : "I");
    };
    $("guardiancontinue").onclick = () => {
      if (!run) return;
      run.guardianCheckpoints = run.guardianCheckpoints || [];
      run.guardianCheckpoints.push(run.wave);
      $("guardiancheckpoint").classList.remove("on");
      nextWave();
    };
  }
  if (!$("compendium")) {
    const d = document.createElement("div");
    d.id = "compendium";
    d.className = "skover";
    d.innerHTML =
      '<div class="skbox compbox"><div class="skhead"><h2>📖 COMPENDIUM</h2></div><div class="compgrid">' +
      [
        [
          "Item Level",
          "Sets the basic strength of an item. A sufficiently high level common item can overpower an old legendary item, although higher rarity provides more affixes."
        ],
        [
          "Rarity",
          "Common equipment has no random bonus affixes beyond its fixed category stats. Each higher rarity adds one more random affix."
        ],
        [
          "Forge",
          "Raises the upgrade level and multiplies existing stats. Affix milestones can trigger only once per item, even if an item later downgrades."
        ],
        [
          "Reforge",
          "Rerolls the values of the existing regular stats. It never changes weapon type or replaces a weapon status effect. One stat may be locked."
        ],
        [
          "Forge Zones",
          "A miss cannot succeed and may downgrade or shatter equipment from level 10 onward. Silver improves the success chance. Gold uses the displayed base chance."
        ],
        [
          "Weapon Types",
          "Swords hit hardest. Bows trade damage for critical chance and speed. Daggers attack fastest but have lower base damage."
        ],
        [
          "Status Effects",
          "Bleed, Poison, Burn, Frost, and Doom behave differently. Their values control buildup or strength. Some weapons cannot roll certain effects."
        ],
        [
          "Defense Ratings",
          "Defense, Dodge, elemental resistance, Leech, and cooldown rating use diminishing returns. More rating always helps, but each additional point contributes less."
        ],
        [
          "Loot and Salvage",
          "Item drops enter the bag in opening order. Lock valuable items before Salvage All. Auto salvage affects the selected rarity and everything below it."
        ],
        [
          "Boss Hunt",
          "Unlocked after Sunken Ruins. It costs ten skull tokens and offers checkpoints after bosses five and ten."
        ],
        [
          "Skills",
          "Each tree splits into exclusive paths. Reaching a capstone now requires fully investing in the preceding node on that path."
        ],
        [
          "Save Files",
          "Save File downloads progress as JSON. Load File restores that progress in newer versions of the game."
        ]
      ]
        .map(x => '<div class="compentry"><b>' + x[0] + "</b>" + x[1] + "</div>")
        .join("") +
      '</div><button class="ghost" id="closecompendium" style="width:100%;margin-top:12px">Close</button></div>';
    document.body.appendChild(d);
    $("compendiumbtn").onclick = () => $("compendium").classList.add("on");
    $("closecompendium").onclick = () => $("compendium").classList.remove("on");
  }
}

function drawKnight(cx, gy, swing) {
  const L = heroLook();
  const bob = Math.sin(anim.t * 3) * 1.2;
  const lunge = Math.sin(swing * Math.PI) * (L.wtype === "dagger" ? 25 : 16);
  cx += lunge;
  cx -= anim.hero.hurt * 7;
  ctx.fillStyle = "#00000055";
  ctx.beginPath();
  ctx.ellipse(cx, gy + 2, 16, 4, 0, 0, 7);
  ctx.fill();
  gy += bob;
  if (run && run.frozenUntil && run.time < run.frozenUntil) {
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.2 * Math.sin(anim.t * 7);
    ctx.strokeStyle = "#bfe6ff";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#bfe6ff";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx, gy - 20, 19, 0, 7);
    ctx.stroke();
    ctx.restore();
  }
  if (run && run.enrageT > 0) {
    const fy = gy - 58,
      fl = Math.sin(anim.t * 16) * 2;
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.shadowColor = "#ff5a2f";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ff3b1e";
    ctx.beginPath();
    ctx.moveTo(cx, fy - 11 - fl);
    ctx.bezierCurveTo(cx + 6, fy - 4, cx + 4, fy + 3, cx, fy + 3);
    ctx.bezierCurveTo(cx - 4, fy + 3, cx - 6, fy - 4, cx, fy - 11 - fl);
    ctx.fill();
    ctx.fillStyle = "#ffb03a";
    ctx.beginPath();
    ctx.moveTo(cx, fy - 6 - fl * 0.7);
    ctx.bezierCurveTo(cx + 3, fy - 1, cx + 2, fy + 2, cx, fy + 2);
    ctx.bezierCurveTo(cx - 2, fy + 2, cx - 3, fy - 1, cx, fy - 6 - fl * 0.7);
    ctx.fill();
    ctx.restore();
    if (Math.random() < 0.3)
      particles.push({
        x: cx + (Math.random() - 0.5) * 7,
        y: fy - 6,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.9 - Math.random() * 0.9,
        life: 1,
        sz: 2,
        col: "#ff7a3f"
      });
  }
  const pl = L.wPlus,
    ce = L.wCel || 0;
  const tier = (pl >= 10 ? 1 : 0) + (pl >= 15 ? 1 : 0) + (pl >= 20 ? 1 : 0) + ce;
  if (tier > 0) {
    const gc = pl >= 20 ? "#ff5a3a" : pl >= 15 ? "#c46bff" : "#5ab0ff";
    const rate = Math.min(0.85, 0.1 + 0.13 * tier);
    if (Math.random() < rate)
      particles.push({
        x: cx + 11 + (Math.random() - 0.5) * (14 + tier * 2),
        y: gy - 28 - Math.random() * (9 + tier * 2),
        vx: (Math.random() - 0.5) * 1.2,
        vy: -0.6 - Math.random() * 1.4,
        life: 1,
        sz: 2,
        col: gc
      });
    if (ce > 0 && Math.random() < Math.min(0.6, 0.12 * ce)) {
      const cc = ["#ffffff", "#bfe6ff", "#9fd8ff"][Math.floor(Math.random() * 3)];
      particles.push({
        x: cx + 11 + (Math.random() - 0.5) * 24,
        y: gy - 30 - Math.random() * 18,
        vx: (Math.random() - 0.5) * 1.7,
        vy: -0.7 - Math.random() * 1.7,
        life: 1,
        sz: 2.4,
        col: cc
      });
    }
  }
  ctx.fillStyle = "#3a3550";
  ctx.fillRect(cx - 7, gy - 14, 5, 14);
  ctx.fillRect(cx + 2, gy - 14, 5, 14);
  ctx.fillStyle = "#8a93a8";
  ctx.fillRect(cx - 9, gy - 31, 18, 19);
  ctx.fillStyle = L.armorC;
  ctx.fillRect(cx - 9, gy - 31, 18, 4);
  ctx.fillStyle = "#6f7789";
  ctx.fillRect(cx - 9, gy - 15, 18, 3);
  ctx.fillStyle = L.armorC;
  ctx.fillRect(cx - 2, gy - 25, 4, 4);
  if (L.armorR >= 4) {
    ctx.fillStyle = "#ffffff88";
    ctx.fillRect(cx - 2, gy - 25, 4, 1);
  }
  ctx.fillStyle = "#e8c9a0";
  ctx.fillRect(cx - 5, gy - 41, 10, 10);
  ctx.fillStyle = "#9aa3b5";
  ctx.fillRect(cx - 6, gy - 44, 12, 5);
  ctx.fillRect(cx - 6, gy - 38, 3, 6);
  ctx.fillStyle = L.helmC;
  ctx.fillRect(cx - 2, gy - 48, 4, 5);
  ctx.fillStyle = "#222";
  ctx.fillRect(cx + 1, gy - 37, 3, 2);
  ctx.fillStyle = L.armorC;
  ctx.fillRect(cx - 14, gy - 29, 6, 15);
  ctx.fillStyle = "#3a3550";
  ctx.fillRect(cx - 13, gy - 27, 4, 11);
  ctx.fillStyle = L.armorC;
  ctx.fillRect(cx - 12, gy - 24, 2, 2);
  const px = cx + 8,
    py = gy - 27;
  ctx.save();
  ctx.translate(px, py);
  const glowP = L.wPlus >= 10 || L.wCel > 0;
  const gcol =
    L.wCel > 0
      ? "#bfe6ff"
      : L.wPlus >= 20
        ? "#ff5a3a"
        : L.wPlus >= 15
          ? "#c46bff"
          : L.wPlus >= 10
            ? "#5ab0ff"
            : L.bladeC;
  const useGlow = L.bladeGlow || glowP;
  const glowB = Math.min(
    30,
    (L.wPlus >= 20 ? 18 : L.wPlus >= 15 ? 13 : L.wPlus >= 10 ? 9 : 7) + (L.wCel || 0) * 5
  );
  if (L.wtype === "bow") {
    const draw = Math.sin(swing * Math.PI) * 4.5;
    ctx.rotate(-0.12);
    ctx.strokeStyle = L.wRar >= 2 ? "#ffd76a" : "#b98a3a";
    ctx.lineWidth = 2.4;
    if (useGlow) {
      ctx.shadowColor = glowP ? gcol : L.bladeC;
      ctx.shadowBlur = Math.min(22, glowB);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 11, -1.9, 1.9);
    ctx.stroke();
    ctx.strokeStyle = "#efe6d2";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(-1.9) * 11, Math.sin(-1.9) * 11);
    ctx.lineTo(-2 - draw, 0);
    ctx.lineTo(Math.cos(1.9) * 11, Math.sin(1.9) * 11);
    ctx.stroke();
    ctx.strokeStyle = glowP ? gcol : L.bladeC;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-2 - draw, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.fillStyle = glowP ? gcol : L.bladeC;
    ctx.beginPath();
    ctx.moveTo(12, 0);
    ctx.lineTo(8.5, -2.3);
    ctx.lineTo(8.5, 2.3);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (L.wtype === "dagger") {
    const thrust = Math.sin(swing * Math.PI) * 10;
    ctx.translate(thrust, 0);
    ctx.rotate(-0.08);
    ctx.fillStyle = "#694321";
    ctx.fillRect(-5, -2, 9, 4);
    ctx.fillStyle = L.wRar >= 2 ? "#ffd76a" : "#c9a24a";
    ctx.fillRect(3, -4, 3, 8);
    const bl = 12 + L.wRar * 1.5,
      grd = ctx.createLinearGradient(6, 0, 6 + bl, 0);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(1, glowP ? gcol : L.bladeC);
    if (useGlow) {
      ctx.shadowColor = glowP ? gcol : L.bladeC;
      ctx.shadowBlur = glowB;
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.moveTo(6, -3);
    ctx.lineTo(6 + bl + 7, 0);
    ctx.lineTo(6, 3);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  } else if (L.wtype === "greataxe") {
    const ang = -2.4 + (1 - swing) * 2.85;
    ctx.rotate(ang);
    ctx.fillStyle = "#5f4322";
    ctx.fillRect(-8, -2.0, 44, 4.0);
    ctx.fillStyle = "#3f2c15";
    ctx.fillRect(-8, -2.0, 44, 1.0);
    ctx.fillStyle = L.wRar >= 2 ? "#ffd76a" : "#c9a24a";
    ctx.beginPath();
    ctx.arc(-9, 0, 2.5, 0, 7);
    ctx.fill();
    if (useGlow) {
      ctx.shadowColor = glowP ? gcol : L.bladeC;
      ctx.shadowBlur = glowB;
    }
    ctx.fillStyle = glowP ? gcol : L.bladeC;
    ctx.fillRect(24, -4.5, 7, 9);
    ctx.beginPath();
    ctx.moveTo(30, -3.5);
    ctx.lineTo(39, -3.5);
    ctx.lineTo(46, 15);
    ctx.quadraticCurveTo(33, 22, 21, 15);
    ctx.lineTo(30, -3.5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.7;
    ctx.beginPath();
    ctx.moveTo(46, 15);
    ctx.quadraticCurveTo(33, 22, 21, 15);
    ctx.stroke();
  } else {
    const ang = -2.1 + (1 - swing) * 2.4;
    ctx.rotate(ang);
    ctx.fillStyle = "#7a5a2a";
    ctx.fillRect(-3, -2, 7, 4);
    ctx.fillStyle = L.wRar >= 2 ? "#ffd76a" : "#c9a24a";
    ctx.fillRect(3, -4, 3, 8);
    const bl = 20 + L.wRar * 2;
    const grd = ctx.createLinearGradient(6, 0, 6 + bl, 0);
    grd.addColorStop(0, "#ffffff");
    grd.addColorStop(1, glowP ? gcol : L.bladeC);
    if (useGlow) {
      ctx.shadowColor = glowP ? gcol : L.bladeC;
      ctx.shadowBlur = glowB;
    }
    ctx.fillStyle = grd;
    ctx.fillRect(6, -2.5, bl, 5);
    ctx.beginPath();
    ctx.moveTo(6 + bl, -2.5);
    ctx.lineTo(6 + bl + 6, 0);
    ctx.lineTo(6 + bl, 2.5);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
  if (S.gear.boots && S.gear.boots.mythicAffix === "swagger") {
    ctx.save();
    const cols = ["#ff5d6c", "#ffd75d", "#5cff91", "#55cfff", "#c77dff"],
      t = anim.t;
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = cols[i];
      ctx.globalAlpha = 0.55 + 0.25 * Math.sin(t * 5 + i);
      ctx.beginPath();
      ctx.arc(cx - 18 + i * 9, gy + 2 + Math.sin(t * 6 + i) * 2, 2.5, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }
}

function addRecap(kind, label, amount, icon, source) {
  if (!run || !run.combatRecapV41 || !Number.isFinite(amount) || amount <= 0) return;
  const r = run.combatRecapV41,
    bucket = kind === "healing" ? r.healing : r.damage,
    key = cleanCombatLabel(label),
    row = bucket[key] || (bucket[key] = { label: key, icon: icon || "•", amount: 0, hits: 0, source: null });
  row.amount += amount;
  row.hits++;
  if (source) row.source = source;
  if (kind === "healing") r.totalHealing += amount;
  else r.totalDamage += amount;
}

function recapRows(bucket, total) {
  const rows = Object.values(bucket || {}).sort((a, b) => b.amount - a.amount);
  if (!rows.length) return '<div class="recapemptyv41">None</div>';
  return rows
    .map(
      r =>
        '<div class="recaprowv41"><span class="recapiconv41">' +
        r.icon +
        "</span><span>" +
        r.label +
        "<small>" +
        r.hits +
        " event" +
        (r.hits === 1 ? "" : "s") +
        "</small></span><b>" +
        fmt(r.amount) +
        "<small>" +
        ((r.amount / Math.max(1, total)) * 100).toFixed(1) +
        "%</small></b></div>"
    )
    .join("");
}

function renderDeathRecap() {
  let result;
  prev26: {
    const box = $("deathrecapv41");
    if (!box || !run || !run.combatRecapV41) {
      result = undefined;
      break prev26;
    }
    const r = run.combatRecapV41,
      k = r.killer && r.killer.source ? r.killer.source : r.killer,
      kname = k && k.name ? k.name : cleanCombatLabel((r.killer && r.killer.label) || "Unknown force"),
      portrait = k && k.name ? killerPortrait(k) : "";
    box.innerHTML =
      '<div class="killerframev41">' +
      (portrait
        ? '<img src="' + portrait + '" alt="' + kname + '">'
        : '<div class="killerfallbackv41">' + foeSymbol(k) + "</div>") +
      "<small>FINAL BLOW</small><b>" +
      kname +
      '</b></div><div class="recapcolumnv41 damage"><h3>Damage received · ' +
      fmt(r.totalDamage) +
      "</h3>" +
      recapRows(r.damage, r.totalDamage) +
      '</div><div class="recapcolumnv41 healing"><h3>Healing received · ' +
      fmt(r.totalHealing) +
      "</h3>" +
      recapRows(r.healing, r.totalHealing) +
      "</div>";
  }
  /* ---- renderDeathRecapV41: later layers (moved here) ---- */
  const recap = $("deathrecapv41"),
    button = $("deathrecaptogglev46");
  if (recap) recap.classList.remove("openv46");
  if (button) {
    button.style.display = "inline-block";
    button.textContent = "📊 Damage Recap";
  }
  return result;
}

function renderTownExtras() {
  const ael = $("areas");
  if (!ael) return;
  if (S.abyssUnlocked) {
    let tog = $("abysstogglev50");
    if (!tog) {
      tog = document.createElement("button");
      tog.id = "abysstogglev50";
      tog.type = "button";
      tog.style.cssText = "width:100%;margin:0 0 7px;font-size:11px";
      if (ael.parentNode) ael.parentNode.insertBefore(tog, ael);
      tog.onclick = () => {
        S.abyssMode = !S.abyssMode;
        try {
          scheduleSave();
        } catch (e) {}
        renderTown();
      };
    }
    tog.className = S.abyssMode ? "rf" : "ghost";
    tog.innerHTML = S.abyssMode
      ? "🌀 ABYSS — click for Regular  ·  🌀 " + (S.abyssTokens || 0) + " tokens"
      : "◆ REGULAR — click for 🌀 Abyss";
  }
  if (S.abyssUnlocked && S.abyssMode) {
    ael.innerHTML = "";
    ael.className = "areagrid";
    AREAS.forEach((a, i) => {
      const unlocked = i <= (S.abyssMax || 0),
        cleared = (S.abyssCleared || []).includes(i),
        lvl = abyssLevel(i);
      const d = document.createElement("div");
      d.className = "atile abysstilev50" + (unlocked ? "" : " lock");
      d.innerHTML =
        '<div class="as">🌀</div><div class="anm">' +
        a.n.split(" ")[0] +
        (cleared ? " ✓" : "") +
        '</div><div class="atip"><div class="tn">🌀 Abyss · ' +
        a.n +
        (cleared ? " ✓" : "") +
        '</div><div class="td">' +
        a.waves +
        " waves + boss<br>abyss depth " +
        lvl +
        " · " +
        a.boss +
        '</div><div class="tw">purple elites · stronger boss skills · mythic-rich</div>' +
        (unlocked
          ? '<div style="color:#c46bff;font-size:10px;margin-top:6px;font-weight:700">▶ enter the Abyss</div>'
          : '<div style="color:var(--dim);font-size:10px;margin-top:6px">🔒 clear the previous Abyss stage</div>') +
        "</div>";
      if (unlocked)
        d.onclick = () => {
          nextRunAbyss = true;
          startRun(i);
        };
      ael.appendChild(d);
    });
  }
  const hp = $("huntpanel");
  if (S.abyssUnlocked && hp) {
    let rb = $("abyssrushbtnv50");
    if (!rb) {
      rb = document.createElement("button");
      rb.id = "abyssrushbtnv50";
      rb.className = "cel";
      rb.type = "button";
      rb.style.cssText = "width:260px;margin-top:8px";
      hp.appendChild(rb);
      rb.onclick = startAbyssRush;
    }
    const tk = S.abyssTokens || 0,
      clearedCount = new Set(
        (S.abyssCleared || []).map(Number).filter(i => Number.isInteger(i) && i >= 0 && i < AREAS.length)
      ).size;
    rb.disabled = tk < 10 || clearedCount === 0;
    rb.innerHTML =
      clearedCount === 0
        ? "🌀 Abyss Rush · clear an Abyss boss first"
        : tk >= 10
          ? "🌀 Abyss Boss Rush · " + clearedCount + " Abyss bosses · 10 tokens (" + tk + ")"
          : "🌀 Abyss Rush — need " + (10 - tk) + " more tokens";
  }
  const g = S.sel && S.gear[S.sel],
    cb = $("celbtn");
  if (
    cb &&
    g &&
    !g.broken &&
    g.rar === 5 &&
    g.plus >= 20 &&
    (g.celestial || 0) >= 10 &&
    (g.celestial || 0) < celestialCap()
  ) {
    const cc = celestialCost(g);
    cb.style.display = "block";
    cb.disabled = S.gold < cc.gold || (S.celestialShards || 0) < (cc.cshards || 0);
    cb.innerHTML =
      "✦ CELESTIAL ✦" +
      g.celestial +
      "→" +
      ((g.celestial || 0) + 1) +
      " · " +
      (cc.cshards || 0) +
      " ✺ + " +
      fmt(cc.gold) +
      "g · 3 silver hits";
  }
}

function drawBg(a) {
  const ai = run && Number(run.ai);
  if (ai >= 13 && ai <= 16) return celestialSpireBg(a, ai - 13);
  const bg = a.bg || ["#20293a", "#0f1420"];
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_LOGICAL_H);
  g.addColorStop(0, bg[0]);
  g.addColorStop(1, bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_LOGICAL_W, CANVAS_LOGICAL_H);
  ctx.save();
  const T = anim.t;
  if (a.deco === "trees") {
    ctx.fillStyle = "#0d160c";
    for (let i = 0; i < 6; i++) {
      const x = 20 + i * 95;
      ctx.beginPath();
      ctx.moveTo(x, GY + 4);
      ctx.lineTo(x + 18, GY - 40);
      ctx.lineTo(x + 36, GY + 4);
      ctx.fill();
    }
    ctx.fillStyle = "#a8e06a66";
    for (let i = 0; i < 11; i++) {
      const x = (i * 63 + T * 13) % CANVAS_LOGICAL_W;
      const y = 28 + ((i * 37) % 68) + Math.sin(T * 1.5 + i) * 7;
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (a.deco === "ice") {
    ctx.fillStyle = "#bfe6ff26";
    for (let i = 0; i < 7; i++) {
      const x = 24 + i * 82;
      ctx.beginPath();
      ctx.moveTo(x, GY + 4);
      ctx.lineTo(x + 7, GY - 34);
      ctx.lineTo(x + 14, GY + 4);
      ctx.fill();
    }
    ctx.fillStyle = "#e4f4ff99";
    for (let i = 0; i < 18; i++) {
      const x = (i * 41 + Math.sin(T * 0.8 + i) * 11) % CANVAS_LOGICAL_W;
      const y = (i * 29 + T * 20) % (GY + 8);
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (a.deco === "pillars") {
    for (let i = 0; i < 5; i++) {
      const x = 18 + i * 120;
      ctx.fillStyle = "#22222c";
      ctx.fillRect(x, GY - 72, 16, 76);
      ctx.fillStyle = "#2c2c38";
      ctx.fillRect(x - 3, GY - 76, 22, 5);
    }
    ctx.fillStyle = "#9a9ab033";
    for (let i = 0; i < 13; i++) {
      const x = (i * 53 + Math.sin(T * 0.6 + i) * 9) % CANVAS_LOGICAL_W;
      const y = GY - ((i * 23 + T * 10) % GY);
      ctx.fillRect(x, y, 2, 2);
    }
  } else if (a.deco === "lava") {
    ctx.fillStyle = "#ff5a1e30";
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.arc(18 + i * 64, GY + 9 + Math.sin(T * 2 + i) * 3, 5 + (i % 2), 0, 7);
      ctx.fill();
    }
    for (let i = 0; i < 16; i++) {
      const x = (i * 41 + Math.sin(T + i) * 6) % CANVAS_LOGICAL_W;
      const y = GY - ((i * 19 + T * 27) % (GY - 8));
      const a2 = Math.max(0, 1 - (GY - y) / GY);
      ctx.fillStyle = "rgba(255," + (110 + ((i * 13) % 90)) + ",40," + (a2 * 0.75).toFixed(2) + ")";
      ctx.fillRect(x, y, 2, 2 + (i % 2));
    }
  } else if (a.deco === "bubbles") {
    ctx.fillStyle = "#8fe0ff22";
    for (let i = 0; i < 13; i++) {
      ctx.beginPath();
      ctx.arc((i * 51 + T * 17) % CANVAS_LOGICAL_W, GY - ((i * 37 + T * 13) % GY), 2 + (i % 3), 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = "#bfeaff33";
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.arc((i * 83 + T * 7) % CANVAS_LOGICAL_W, 18 + ((i * 29) % 50), 3 + (i % 2), 0, 7);
      ctx.fill();
    }
  } else if (a.deco === "stars") {
    for (let i = 0; i < 26; i++) {
      const x = (i * 53) % CANVAS_LOGICAL_W,
        y = (i * 29) % 84;
      const tw = (0.22 + 0.36 * (0.5 + 0.5 * Math.sin(T * 2 + i))).toFixed(2);
      ctx.fillStyle = "rgba(255,255,255," + tw + ")";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.fillStyle = "#c9a6ff55";
    for (let i = 0; i < 9; i++) {
      const x = (i * 71 + T * 19) % CANVAS_LOGICAL_W;
      const y = 22 + ((i * 31) % 58) + Math.sin(T + i) * 9;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  ctx.restore();
  ctx.fillStyle = a.gr || "#2a3346";
  ctx.fillRect(0, GY + 4, CANVAS_LOGICAL_W, CANVAS_LOGICAL_H - GY);
  ctx.strokeStyle = "#ffffff16";
  ctx.beginPath();
  ctx.moveTo(0, GY + 4);
  ctx.lineTo(CANVAS_LOGICAL_W, GY + 4);
  ctx.stroke();

  return;
}

function visibleMenuOpen(id) {
  const el = $(id);
  return !!(el && el.classList.contains("on"));
}

function closeTopMenuV52() {
  if (visibleMenuOpen("compendium")) {
    $("closecompendium").click();
    return true;
  }
  if (visibleMenuOpen("shop")) {
    $("closeshop").click();
    return true;
  }
  if (visibleMenuOpen("sktree")) {
    $("closetree").click();
    return true;
  }
  if (visibleMenuOpen("tipmodal")) {
    $("tipok").click();
    return true;
  }
  return false;
}

function roundRaw(stat, v) {
  return PERCENT.has(stat) || stat === "healCdr" || stat === "attackPower"
    ? Math.round(v * 10) / 10
    : Math.max(1, Math.round(v));
}

function ensureCss() {
  if (document.getElementById("reelcssV67")) return;
  var st = document.createElement("style");
  st.id = "reelcssV67";
  st.textContent =
    ".reelovV67{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(8,6,4,.74)}" +
    ".reelboxV67{display:flex;flex-direction:column;align-items:center;gap:13px;font-family:inherit}" +
    ".reeltV67{letter-spacing:3px;text-transform:uppercase;font-weight:700;color:#ffd76a;font-size:13px;opacity:.92}" +
    ".reelwV67{position:relative;width:min(460px,86vw);height:94px;overflow:hidden;border-radius:12px;border:1px solid #4a382a;background:#0d0a08;-webkit-mask-image:linear-gradient(90deg,#0000,#000 14%,#000 86%,#0000);mask-image:linear-gradient(90deg,#0000,#000 14%,#000 86%,#0000)}" +
    ".reelbV67{position:absolute;top:0;left:0;height:100%;display:flex}" +
    ".reelcV67{flex:0 0 112px;width:112px;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-right:1px solid #0006;font-weight:700}" +
    ".reelcV67 .n{font-size:17px;letter-spacing:.5px}.reelcV67 .s{font-size:9px;letter-spacing:2px;text-transform:uppercase;opacity:.6}" +
    ".reelmV67{position:absolute;left:50%;top:-2px;bottom:-2px;width:3px;transform:translateX(-50%);background:#ffd76a;box-shadow:0 0 13px 2px #ffd76a;z-index:2}" +
    ".reelhV67{font-size:11px;color:#8a7461;letter-spacing:.4px}";
  document.head.appendChild(st);
}

function rebuildTray() {
  const tray = $("traychips");
  if (!tray || !run) return;
  tray.innerHTML = "";
  (run.bags || []).forEach(b => addBagChip(b.rar));
  updateTrayCount();
}

function portraitV70(symbol, color, locked) {
  return (
    '<div class="beastportraitv70 mugshotv72" style="--pc:' +
    color +
    '">' +
    (locked
      ? "?"
      : '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M12 56C10 38 14 15 32 11C50 15 54 38 52 56Z" fill="' +
        color +
        '" stroke="#e8dfcf" stroke-width="2"/><path d="M17 18L9 7L25 13M47 18L55 7L39 13" fill="' +
        color +
        '" stroke="#e8dfcf" stroke-width="2"/><circle cx="24" cy="31" r="4" fill="#fff"/><circle cx="40" cy="31" r="4" fill="#fff"/><circle cx="24" cy="31" r="2"/><circle cx="40" cy="31" r="2"/><path d="M24 44Q32 49 40 44" fill="none" stroke="#161015" stroke-width="3"/></svg><i>' +
        symbol +
        "</i>") +
    "</div>"
  );
}

/* Raw rating language, Auto Run copy, and general UI integration. */
function decorateInventory() {
  const chips = [...($("inv") ? $("inv").querySelectorAll(".bchip") : [])];
  (S.bag || []).forEach((g, i) => {
    const chip = chips[i],
      name = chip && chip.querySelector(".bn");
    if (!name) return;
    const old = name.querySelector("span");
    if (old) old.remove();
    const cur = S.gear && S.gear[g.slot],
      delta = rawDelta(g),
      tag = document.createElement("span");
    tag.className = "rawratingv70 " + (delta > 0 ? "rawupv70" : "rawdownv70");
    tag.textContent = !cur
      ? " ◆ empty slot"
      : (delta >= 0 ? " ◆ +" : " ◆ ") + Math.round(delta * 100) + "% raw";
    name.appendChild(tag);
  });
}

function moveNavigationV72() {
  const res = document.querySelector(".res"),
    shop = $("shopbtn"),
    guild = $("guildbtnv70"),
    comp = $("compendiumbtn"),
    save = $("exportsave"),
    load = $("importsave");
  if (res && shop && guild && comp) {
    shop.textContent = "🛒 Shop";
    guild.textContent = "⚔ Guild";
    comp.textContent = "📖 Compendium";
    if (save) save.textContent = "⬇ Save file";
    if (load) load.textContent = "⬆ Load file";
    shop.insertAdjacentElement("afterend", guild);
    guild.insertAdjacentElement("afterend", comp);
  }
  const rail = $("goalrailv70"),
    areas = $("areas");
  if (rail && areas) {
    const panel = areas.closest(".panel");
    if (panel && panel.nextElementSibling !== rail) panel.insertAdjacentElement("afterend", rail);
  }
}

function progressText(x, p) {
  if (ensureQuestState().ready[x.id]) return "Ready to claim";
  if (
    [
      "campaign",
      "abyssCampaign",
      "abyssEntered",
      "bloodSeen",
      "bloodFull",
      "legacyEnd",
      "legacyOmega1000",
      "legacyOmega10000",
      "mythicHalf",
      "mythicAll",
      "researchAll"
    ].includes(x.mode)
  )
    return p.v >= p.goal ? "Complete" : "Not completed";
  return fmt(p.v) + " / " + fmt(p.goal);
}

function gateButton(id, unlocked, openLabel, lockedLabel, title) {
  const b = $(id);
  if (!b) return;
  b.disabled = !unlocked;
  b.classList.toggle("featurelockedv77", !unlocked);
  b.textContent = unlocked ? openLabel : lockedLabel;
  b.title = unlocked
    ? title
    : "Unlocks after completing area " + (id === "shopbtn" ? 1 : id === "compendiumbtn" ? 2 : 3);
  b.setAttribute("aria-disabled", unlocked ? "false" : "true");
}

function otherMenuOpen() {
  return ["shop", "compendium", "guildv70", "sktree", "questsv74", "minev83"].some(id => {
    const e = $(id);
    return e && e.classList.contains("on");
  });
}

function townVisible() {
  const town = $("town");
  return town && getComputedStyle(town).display !== "none";
}

function rebuildTrayV80() {
  const tray = $("traychips");
  if (!tray || !run) return;
  tray.innerHTML = "";
  (run.bags || []).forEach(b => {
    if (b && b.bossRollV72) {
      const chip = document.createElement("div");
      chip.className = "lchip pop bossmysteryv80";
      chip.textContent = "?";
      chip.title = "Unrevealed boss roll";
      tray.appendChild(chip);
    } else addBagChip((b && b.rar) || 0);
  });
  updateTrayCount();
}

function dragStart(e, ref) {
  dragRef = ref;
  e.currentTarget.classList.add("draggingv82");
  try {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify(ref));
  } catch (err) {}
}

function dragEnd(e) {
  e.currentTarget.classList.remove("draggingv82");
  document.querySelectorAll(".dragtargetv82").forEach(x => x.classList.remove("dragtargetv82"));
  setTimeout(() => (dragRef = null), 0);
}

function bindInventoryDragging() {
  const inv = $("inv");
  (S.bag || []).forEach((g, i) => {
    const chip = inv && inv.querySelectorAll(".bchip")[i];
    if (!chip) return;
    chip.draggable = true;
    chip.ondragstart = e => dragStart(e, { kind: "loot", index: i });
    chip.ondragend = dragEnd;
  });
  bindDrop(inv, { kind: "loot" });
  const slots = $("slots") && $("slots").children;
  SLOTS.forEach((sd, i) => {
    const slot = slots && slots[i],
      g = S.gear && S.gear[sd.key];
    if (!slot) return;
    if (g) {
      slot.draggable = true;
      slot.ondragstart = e => dragStart(e, { kind: "equipped", slot: sd.key });
      slot.ondragend = dragEnd;
      slot.insertAdjacentHTML("beforeend", legacyTooltip(g));
    }
    if (i < S.slotsOpen) bindDrop(slot, { kind: "equipped", slot: sd.key });
  });
}

/* V97 — boons: one vertical star per pick beside the icon, hover shows the summed total */
function sumDesc(picks) {
  var nums = picks.map(function (d) {
    return (String(d).match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  });
  var len = nums.reduce(function (m, a) {
      return Math.max(m, a.length);
    }, 0),
    sums = [];
  for (var i = 0; i < len; i++) {
    var s = 0;
    nums.forEach(function (a) {
      if (a[i] != null) s += a[i];
    });
    sums.push(s);
  }
  var k = 0;
  return String(picks[0] || "").replace(/-?\d+(?:\.\d+)?/g, function () {
    var v = sums[k++] || 0;
    return (Math.round(v * 10) / 10).toString();
  });
}

function modalBusy_v101() {
  try {
    if (
      ["tipmodal", "clear", "huntchoice", "guildcheckpoint", "lootopen"].some(function (id) {
        var e = document.getElementById(id);
        return e && e.classList.contains("on");
      })
    )
      return true;
  } catch (e) {}
  return false;
}

function show_v101(t, b) {
  if (modalBusy_v101()) return false;
  try {
    if (typeof showTip === "function") {
      showTip(t, b);
      return true;
    }
  } catch (e) {}
  return false;
}

// Wrap town rendering for new v5 UI without replacing the established layout.
// Earlier version of renderTown(), extended by the functions that follow.
function renderTownBase() {
  let prevResult141;
  prev182: {
    {
      {
        {
          prev185: {
            {
              {
                $("gold").textContent = fmtCur(S.gold);
                $("shards").textContent = fmtCur(S.shards);
                {
                  const e = $("eshards");
                  if (e) e.textContent = fmtCur(S.epicShards);
                  const w = $("eshwrap");
                  if (w) w.style.display = S.epicShards > 0 ? "inline" : "none";
                }
                const el = $("slots");
                el.innerHTML = "";
                SLOTS.forEach((sd, i) => {
                  const open = i < S.slotsOpen;
                  const g = S.gear[sd.key];
                  const d = document.createElement("div");
                  d.className = "slot" + (S.sel === sd.key ? " sel" : "");
                  if (!open) {
                    const cost = UNLOCK[i];
                    if (i === S.slotsOpen) {
                      d.style.opacity = "0.85";
                      d.innerHTML =
                        '<div class="st">' +
                        sd.ic +
                        " " +
                        sd.label +
                        '</div><div class="in" style="color:var(--gold)">🔓 unlock</div><div class="stat">' +
                        cost +
                        "g</div>";
                      d.onclick = () => {
                        if (S.gold >= cost) {
                          S.gold -= cost;
                          S.slotsOpen++;
                          beep(650, 0.14, "triangle");
                          flash("#5bd06a");
                          renderTown();
                        } else $("fsel").textContent = "Need " + cost + " gold to unlock " + sd.label + ".";
                      };
                    } else {
                      d.style.opacity = ".3";
                      d.innerHTML = '<div class="st">' + sd.label + '</div><div class="in">🔒</div>';
                    }
                  } else if (!g) {
                    d.innerHTML =
                      '<div class="st">' +
                      sd.ic +
                      " " +
                      sd.label +
                      '</div><div class="in" style="color:var(--dim)">—</div>';
                    d.onclick = () => {
                      S.sel = sd.key;
                      renderTown();
                    };
                  } else {
                    const col = cvar(RAR[g.rar].col);
                    const wt = g.slot === "weapon" ? '<div class="wt">' + weaponTypeBadge(g) + "</div>" : "";
                    d.innerHTML =
                      '<div class="st">' +
                      sd.ic +
                      " " +
                      sd.label +
                      '<span class="ilvl">i' +
                      g.ilvl +
                      '</span></div><div class="in" style="color:' +
                      col +
                      '"><span class="emb" style="border-color:' +
                      col +
                      '">' +
                      itemIcon(g) +
                      "</span>" +
                      itemMarks(g) +
                      " +" +
                      g.plus +
                      (g.celestial ? ' <span style="color:#9fd8ff">✦' + g.celestial + "</span>" : "") +
                      "</div>" +
                      wt +
                      '<div class="slstats">' +
                      slotStatLines(g) +
                      "</div>";
                    d.onclick = () => {
                      S.sel = sd.key;
                      renderTown();
                    };
                  }
                  el.appendChild(d);
                });
                const eq = Object.values(S.gear);
                $("avgil").textContent = eq.length
                  ? "· avg iLvl " + Math.round(eq.reduce((s, g) => s + g.ilvl, 0) / eq.length)
                  : "";
                const rr = $("rerun");
                if (rr) rr.style.display = lastArea != null ? "inline-block" : "none";
                const bc = {};
                S.boonList.forEach(b => (bc[b.n] = (bc[b.n] || 0) + 1));
                $("boonbar").innerHTML = Object.keys(bc).length
                  ? "<span style='color:var(--dim);font-size:11px'>boons:</span> " +
                    Object.keys(bc)
                      .map(n => {
                        const b = BOONS.find(x => x.n === n);
                        return (
                          '<span title="' +
                          b.d +
                          '">' +
                          b.i +
                          (bc[n] > 1
                            ? '<span style="font-size:10px;color:var(--gold)">×' + bc[n] + "</span>"
                            : "") +
                          "</span>"
                        );
                      })
                      .join(" ")
                  : '<span style="color:#5a5270;font-size:11px">no boons yet</span>';
                $("herolvl").innerHTML =
                  'Level <b style="color:var(--epic)">' +
                  S.heroLevel +
                  "</b> · " +
                  S.xp +
                  " / " +
                  xpFor(S.heroLevel) +
                  " xp";
                $("xpfill").style.width = Math.min(100, (S.xp / xpFor(S.heroLevel)) * 100) + "%";
                $("spcount").textContent = S.sp;
                $("opentree").style.filter = S.sp > 0 ? "drop-shadow(0 0 6px #c46bff)" : "none";
                const g = S.sel ? S.gear[S.sel] : null;
                if (g && g.broken) {
                  $("fsel").innerHTML =
                    '<span class="brokentag">✖ ' +
                    SLOTS.find(s => s.key === g.slot).label +
                    " is SHATTERED</span>";
                  $("upbtn").disabled = true;
                  $("rfbtn").disabled = true;
                  $("celbtn").style.display = "none";
                  $("fpreview").innerHTML =
                    '<span class="brokentag">💥 Shattered on the anvil — all stats −50%, and it can no longer be forged. Salvage it for shards and forge anew.</span>';
                } else if (g) {
                  const c = upCost(g);
                  const rc = rfCost(g);
                  $("fsel").innerHTML =
                    "Forging <b>" +
                    SLOTS.find(s => s.key === g.slot).label +
                    " +" +
                    g.plus +
                    "</b> (i" +
                    g.ilvl +
                    " · " +
                    RAR[g.rar].k +
                    ")";
                  const maxed = g.plus >= 20;
                  $("upbtn").disabled = maxed;
                  $("upbtn").innerHTML = maxed ? "✓ MAX +" + g.plus : "UPGRADE ⚒";
                  $("rfbtn").disabled = false;
                  {
                    const canCel = g.plus >= 20 && g.rar >= 3;
                    const cb = $("celbtn");
                    if (cb) {
                      cb.style.display = canCel ? "block" : "none";
                      if (canCel) {
                        const cc = celestialCost(g);
                        cb.innerHTML =
                          "✦ CELESTIAL FORGE — " +
                          cc.esh +
                          "◆ +" +
                          fmt(cc.gold) +
                          "g" +
                          (g.celestial ? " (✦" + g.celestial + ")" : "");
                        cb.disabled = S.epicShards < cc.esh || S.gold < cc.gold;
                      }
                    }
                  }
                  let pv = "";
                  if (maxed) {
                    pv =
                      '<div style="color:var(--legendary);font-weight:700;margin-bottom:3px">✓ MAX UPGRADE — +' +
                      g.plus +
                      "</div>" +
                      (g.rar >= 3
                        ? '<div style="color:#9fd8ff;font-size:9px;margin-bottom:2px">Push it further with the Celestial Forge ↓</div>'
                        : '<div style="color:var(--dim);font-size:9px;margin-bottom:2px">Fully upgraded — celestial needs epic/legendary gear.</div>');
                  } else {
                    const ng = JSON.parse(JSON.stringify(g));
                    ng.plus = g.plus + 1;
                    pv =
                      '<div style="color:var(--gold);font-weight:700;margin-bottom:2px">⚒ Upgrade → +' +
                      ng.plus +
                      " &nbsp;" +
                      Math.round(upOdds(g) * 100) +
                      "% &nbsp;" +
                      c.gold +
                      "g " +
                      c.shards +
                      "sh</div>";
                    pv += Object.keys(g.stats)
                      .map(s => {
                        const a = gStat(g, s),
                          bv = gStat(ng, s);
                        const av = CURVED.has(s)
                          ? Math.round(a)
                          : PERCENT.has(s)
                            ? a.toFixed(1) + "%"
                            : Math.round(a);
                        const bvv = CURVED.has(s)
                          ? Math.round(bv)
                          : PERCENT.has(s)
                            ? bv.toFixed(1) + "%"
                            : Math.round(bv);
                        return (
                          STAT_LABEL[s] + " " + av + ' → <b style="color:var(--uncommon)">' + bvv + "</b>"
                        );
                      })
                      .join("  ·  ");
                    if ((g.plus + 1) % 10 === 0)
                      pv +=
                        '<div style="color:var(--epic);margin-top:2px">★ chance for a NEW affix at +' +
                        ng.plus +
                        "!</div>";
                    const sbz = skillBonuses();
                    const csC = Math.round((0.04 + sbz.critSuccess) * 100);
                    pv +=
                      '<div style="margin-top:2px;color:var(--epic)">✦ ' +
                      csC +
                      "% critical-success → +2 levels</div>";
                    if (g.plus > 10) {
                      const cfC = sbz.insured ? 0 : Math.round(Math.max(0.03, 0.15 - sbz.critFailCut) * 100);
                      pv +=
                        '<div style="color:#ff6b6b">⚠ past +10 on a FAILED strike: ' +
                        (cfC > 0 ? cfC + "% shatter · " : "") +
                        "~35% downgrade" +
                        (armedGuard ? " · 🛡 " + GUARDS[armedGuard].n + " armed" : "") +
                        "</div>";
                    }
                  }
                  const sd = SLOTS.find(s => s.key === g.slot);
                  const pool = sd.affixes.filter(a => a !== sd.main);
                  if (g.slot === "weapon" && g.wtype === "sword") pool.push("bleed");
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
                  const tot = pool.reduce((s, a) => s + wOf(a), 0);
                  pv +=
                    '<div style="border-top:1px solid #2c2216;margin-top:5px;padding-top:5px"><span style="color:var(--rare);font-weight:700">✦ Reforge → ' +
                    rc +
                    "sh</span> · rolls " +
                    g.rar +
                    " affix" +
                    (g.rar === 1 ? "" : "es") +
                    " from:<br>" +
                    pool
                      .map(
                        a =>
                          STAT_LABEL[a] +
                          ' <span style="color:var(--dim)">' +
                          Math.round((wOf(a) / tot) * 100) +
                          "%</span>"
                      )
                      .join(" · ") +
                    "</div>";
                  if (g.plus >= 20 && g.rar >= 3) {
                    const cc = celestialCost(g);
                    let cpool = sd.affixes.filter(a => a !== sd.main && !(a in g.stats));
                    if (g.slot === "weapon" && g.wtype === "sword" && !("bleed" in g.stats))
                      cpool.push("bleed");
                    if (g.slot === "weapon" && Object.keys(g.stats).some(s => EXCL.has(s)))
                      cpool = cpool.filter(a => !EXCL.has(a));
                    const poolTxt = cpool.length
                      ? cpool.map(a => STAT_LABEL[a]).join(", ")
                      : '<span style="color:var(--dim)">(all affixes present)</span>';
                    pv +=
                      '<div style="border-top:1px solid #2c3a52;margin-top:5px;padding-top:5px"><span style="color:#9fd8ff;font-weight:700">✦ Celestial → ' +
                      cc.esh +
                      "◆ + " +
                      fmt(cc.gold) +
                      "g</span> · <b>skill check + outcome roll</b><br>guaranteed NEW affix from: " +
                      poolTxt +
                      (g.celestial
                        ? '<br><span style="color:#9fd8ff">now ✦' +
                          g.celestial +
                          " (+" +
                          Math.round(g.celestial * 10) +
                          "% stats)</span>"
                        : "") +
                      "</div>";
                  }
                  $("fpreview").innerHTML = pv;
                } else {
                  $("fsel").textContent = "Select a gear slot to forge it.";
                  $("upbtn").disabled = true;
                  $("rfbtn").disabled = true;
                  $("celbtn").style.display = "none";
                  $("fpreview").innerHTML =
                    '<span style="color:#5a5270">Select a gear slot to preview upgrade &amp; reforge.</span>';
                }
                {
                  const bc = $("bagcount");
                  if (bc) bc.textContent = S.bag.length + "/" + S.bagCap;
                }
                const inv = $("inv");
                inv.className = "bagbar";
                inv.innerHTML = "";
                if (!S.bag.length)
                  inv.innerHTML = '<div class="emptyinv">empty — drops appear after a run</div>';
                S.bag.forEach((g, idx) => {
                  const col = cvar(RAR[g.rar].col);
                  const cur = S.gear[g.slot];
                  const better = !cur || gpower(g) > gpower(cur);
                  const chip = document.createElement("div");
                  chip.className = "bchip";
                  chip.style.setProperty("--bc", col);
                  chip.innerHTML =
                    "<span>" +
                    itemIcon(g) +
                    '</span><span class="mk">' +
                    itemMarks(g) +
                    '</span><div class="btip"><div class="bn" style="color:' +
                    col +
                    '">' +
                    g.name +
                    " +" +
                    g.plus +
                    " " +
                    (better
                      ? '<span style="color:var(--uncommon)">▲ upgrade</span>'
                      : '<span style="color:#ff6b6b">▼ weaker</span>') +
                    '</div><div class="bs">ilvl ' +
                    g.ilvl +
                    "<br>" +
                    gearDesc(g) +
                    '</div><div style="font-size:9px;color:var(--gold);margin:4px 0 5px">click chip to equip</div><div class="bbtns"><button class="rf svb">Salvage +' +
                    salvageValueV10(g) +
                    " ◆</button></div></div>";
                  chip.onclick = () => {
                    const old = S.gear[g.slot];
                    S.gear[g.slot] = g;
                    S.bag.splice(idx, 1);
                    if (old) S.bag.push(old);
                    beep(700, 0.09, "triangle");
                    flash(col);
                    renderTown();
                  };
                  chip.querySelector(".svb").onclick = e => {
                    e.stopPropagation();
                    S.shards += salvageValueV10(g);
                    if (g.rar >= 3) S.epicShards += g.rar - 2;
                    S.bag.splice(idx, 1);
                    beep(400, 0.07);
                    renderTown();
                  };
                  inv.appendChild(chip);
                });
                const ael = $("areas");
                ael.className = "areagrid";
                ael.innerHTML = "";
                AREAS.forEach((a, i) => {
                  const unlocked = i <= S.areaMax;
                  const cleared = i < S.areaMax;
                  const d = document.createElement("div");
                  d.className = "atile" + (unlocked ? "" : " lock");
                  d.innerHTML =
                    '<div class="as">' +
                    a.sp +
                    '</div><div class="anm">' +
                    a.n.split(" ")[0] +
                    (cleared ? " ✓" : "") +
                    '</div><div class="atip"><div class="tn">' +
                    a.sp +
                    " " +
                    a.n +
                    (cleared ? " ✓" : "") +
                    '</div><div class="td">' +
                    a.waves +
                    " waves + boss<br>depth " +
                    a.lvl +
                    "+ · boss: " +
                    a.boss +
                    '</div><div class="tw">weak: ' +
                    a.weak +
                    "</div>" +
                    (unlocked
                      ? '<div style="color:var(--gold);font-size:10px;margin-top:6px;font-weight:700">▶ click to enter</div>'
                      : '<div style="color:var(--dim);font-size:10px;margin-top:6px">🔒 clear previous area</div>') +
                    "</div>";
                  if (unlocked) d.onclick = () => startRun(i);
                  ael.appendChild(d);
                });
                renderStatPanel();
              }
              const sb = $("setbtn");
              if (sb) {
                sb.classList.toggle("locked", !S.gearSetUnlocked);
                sb.innerHTML = S.gearSetUnlocked
                  ? (S.activeSet === 2 ? "II" : "I") + "<br>SET"
                  : "🔒<br>SET 2";
                sb.title = S.gearSetUnlocked ? "Switch gear set" : "Unlock Gear Set II in the shop";
              }
              const slotEls = [...$("slots").children];
              SLOTS.forEach((sd, i) => {
                const g = S.gear[sd.key];
                if (slotEls[i] && g && (g.celestial || 0) >= 10) slotEls[i].classList.add("celmax");
              });
              const bagEls = [...$("inv").children];
              S.bag.forEach((bg, i) => {
                if (bagEls[i] && (bg.celestial || 0) >= 10) bagEls[i].classList.add("celmax");
              });
              const g = S.sel ? S.gear[S.sel] : null;
              if (g) {
                const rg = rfGoldCost(g),
                  rs = rfCost(g);
                const pv = $("fpreview");
                if (pv && pv.innerHTML.includes("Reforge"))
                  pv.innerHTML = pv.innerHTML.replace(
                    /✦ Reforge → [^<]*sh/,
                    "✦ Reforge → " + fmt(rg) + "g + " + fmt(rs) + "sh"
                  );
                if (g.plus >= 10 && !g.broken && pv && !pv.innerHTML.includes("SHATTER RISK"))
                  pv.innerHTML +=
                    '<div style="color:#ff7b6b;margin-top:4px"><b>⚠ SHATTER RISK:</b> failed strikes from +10 onward can break this item.</div>';
                if (g.plus >= 20 && g.rar >= 3 && (g.celestial || 0) < 10 && pv) {
                  const cp = celestialProfile(g);
                  pv.innerHTML +=
                    '<div style="color:#9fd8ff;margin-top:3px">Next Celestial ✦' +
                    cp.target +
                    ": " +
                    Math.round(cp.chance * 100) +
                    "% outcome after " +
                    cp.hits +
                    " silver hit" +
                    (cp.hits > 1 ? "s in one sequence" : "") +
                    ".</div>";
                }
                const cb = $("celbtn");
                if (cb && (g.celestial || 0) >= 10) {
                  cb.style.display = "block";
                  cb.disabled = true;
                  cb.innerHTML = "✹ CELESTIAL MAX — LEVEL 10";
                }
              }
              const bc = {};
              S.boonList.forEach(b => {
                const n = b && b.n ? b.n : b;
                if (n) bc[n] = (bc[n] || 0) + 1;
              });
              if (Object.keys(bc).length) {
                $("boonbar").innerHTML =
                  "<span style='color:var(--dim);font-size:11px'>boons:</span> " +
                  Object.keys(bc)
                    .map(n => {
                      const e = [...S.boonList].reverse().find(x => (x.n || x) === n) || {};
                      const base = V5_BOONS.find(x => x.n === n);
                      return (
                        '<span title="' +
                        (e.d || n) +
                        '">' +
                        ((base && base.i) || e.i || "✦") +
                        (bc[n] > 1
                          ? '<span style="font-size:10px;color:var(--gold)">×' + bc[n] + "</span>"
                          : "") +
                        "</span>"
                      );
                    })
                    .join(" ");
              }
              scheduleSave();
            }
            const panel = $("huntpanel"),
              unlocked = S.clearedAreas.includes(5);
            panel.classList.toggle("on", unlocked);
            if (unlocked) {
              const count = bossHuntCount(),
                tokens = S.skullTokens || 0;
              $("huntinfo").innerHTML =
                "Skull Tokens <b>☠ " +
                tokens +
                "</b> · Entry costs 10 · " +
                count +
                " defeated campaign bosses await<br>Checkpoints after boss 5 and boss 10";
              const b = $("huntstart");
              b.disabled = tokens < 10;
              b.innerHTML =
                tokens >= 10 ? "Enter Boss Hunt · 10 ☠" : "Need " + (10 - tokens) + " more Skull Tokens";
            }
            const g = S.sel ? S.gear[S.sel] : null;
            if (!g || g.broken) break prev185;
            const uc = upCost(g),
              rc = rfCost(g),
              rg = rfGoldCost(g),
              up = $("upbtn"),
              rf = $("rfbtn");
            if (g.plus < 20)
              up.innerHTML =
                'UPGRADE ⚒<span class="btncost"><span class="cg">' +
                fmt(uc.gold) +
                "g</span>" +
                (uc.shards ? '<span class="cs"> · ' + fmt(uc.shards) + " ◆</span>" : "") +
                "</span>";
            rf.innerHTML =
              'REFORGE ✦<span class="btncost"><span class="cg">' +
              fmt(rg) +
              'g</span><span class="cs"> · ' +
              fmt(rc) +
              " ◆</span></span>";
          }
          const pv = $("fpreview"),
            g = S.sel ? S.gear[S.sel] : null;
          if (pv && g && g.plus >= 20 && g.rar >= 3) {
            pv.innerHTML = pv.innerHTML.replace(
              /guaranteed NEW affix from:[\s\S]*?(?=<br><span style="color:#9fd8ff">now|<\/div>)/,
              "new affix reward: " +
                ((g.celestial || 0) >= 9
                  ? "unlocks on this Celestial 10 success"
                  : "unlocks only at Celestial 10")
            );
          }
        }
        const chips = [...$("inv").querySelectorAll(".bchip")];
        (S.bag || []).forEach((g, index) => {
          const chip = chips[index];
          if (!chip) return;
          chip.classList.toggle("lockeditem", !!g.locked);
          if (g.locked) {
            const badge = document.createElement("span");
            badge.className = "baglock";
            badge.textContent = "🔒";
            chip.appendChild(badge);
          }
          const buttons = chip.querySelector(".bbtns"),
            salvage = chip.querySelector(".svb");
          if (!buttons || !salvage) return;
          salvage.textContent = g.locked ? "Protected" : "Salvage +" + salvageValueV12(g) + " ◆";
          salvage.disabled = !!g.locked;
          salvage.onclick = e => {
            e.stopPropagation();
            if (g.locked) return;
            S.shards += salvageValueV12(g);
            if (g.rar >= 3) S.epicShards += g.rar - 2;
            S.bag.splice(index, 1);
            beep(400, 0.07);
            scheduleSave();
            renderTown();
          };
          const lock = document.createElement("button");
          lock.className = "rf lockb" + (g.locked ? " on" : "");
          lock.textContent = g.locked ? "🔓 Unlock" : "🔒 Lock";
          lock.title = g.locked ? "Allow this item to be salvaged" : "Keep this item when using Salvage all";
          lock.onclick = e => {
            e.stopPropagation();
            g.locked = !g.locked;
            beep(g.locked ? 720 : 520, 0.06, "triangle", 0.05);
            scheduleSave();
            renderTown();
          };
          buttons.appendChild(lock);
        });
      }
      renderAutoSalvage();
      updateForgeBalances();
      const cw = $("celestialwrap");
      if (cw) cw.style.display = (S.celestialShards || 0) > 0 ? "inline" : "none";
      const chips = [...$("inv").querySelectorAll(".bchip")];
      (S.bag || []).forEach((g, i) => {
        const chip = chips[i],
          btn = chip && chip.querySelector(".svb");
        if (!btn) return;
        const r = salvageRewards(g);
        btn.innerHTML = g.locked
          ? "Protected"
          : "Salvage +" +
            r.shards +
            " ◆" +
            (r.epic ? " +" + r.epic + " epic" : "") +
            (r.celestial ? ' +<span style="color:var(--mythic)">' + r.celestial + " ✺</span>" : "");
        btn.disabled = !!g.locked;
        btn.onclick = e => {
          e.stopPropagation();
          if (g.locked) return;
          S.shards += r.shards;
          S.epicShards += r.epic;
          S.celestialShards = (S.celestialShards || 0) + r.celestial;
          S.bag.splice(i, 1);
          if (r.celestial) showCelestialShard(r.celestial);
          scheduleSave();
          renderTown();
        };
      });
      const g = S.sel && S.gear[S.sel];
      if (g) {
        const uc = upCost(g),
          cb = $("celbtn");
        if (g.rar === 5 && g.plus < 20) {
          $("upbtn").disabled = S.gold < uc.gold || (S.celestialShards || 0) < uc.cshards;
          $("upbtn").innerHTML =
            'UPGRADE ⚒<span class="btncost"><span class="cg">' +
            fmt(uc.gold) +
            'g</span><span style="color:var(--mythic)"> · ' +
            uc.cshards +
            " ✺</span></span>";
        }
        if (cb && g.rar === 5 && g.plus >= 20 && (g.celestial || 0) < 10) {
          const cc = celestialCost(g);
          cb.disabled = S.gold < cc.gold || (S.celestialShards || 0) < cc.cshards;
          cb.innerHTML = "✦ CELESTIAL FORGE · " + cc.cshards + " ✺ + " + fmt(cc.gold) + "g";
        }
      }
    }
    const g = S.sel && S.gear[S.sel];
    if (g && g.rar === 5 && g.plus < 20 && !g.broken) {
      const c = upCost(g),
        b = $("upbtn");
      b.disabled = !canPayForge(c);
      b.innerHTML = 'UPGRADE ⚒<span class="btncost">' + forgeCostText(c) + "</span>";
    }
    const ael = $("areas");
    if (ael && S.clearedAreas.includes(5)) {
      const d = document.createElement("div");
      d.className = "atile trainingtilev41";
      d.innerHTML =
        '<div class="as">🎯</div><div class="anm">Training</div><div class="atip"><div class="tn">🎯 Training Dummy</div><div class="td">100,000,000 health<br>live total and source DPS</div><div class="tw">No rewards and no danger</div><div style="color:var(--gold);font-size:10px;margin-top:6px;font-weight:700">▶ click to test</div></div>';
      d.onclick = startTrainingDummy;
      ael.appendChild(d);
    }
    if (!firstCombatGuideNeeded()) break prev182;
    const first = $("areas") && $("areas").querySelector(".atile:not(.lock)");
    if (first && !first.querySelector(".firstfightarrowv49")) {
      first.classList.add("firstfighttargetv49");
      const arrow = document.createElement("span");
      arrow.className = "firstfightarrowv49";
      arrow.textContent = "▼";
      arrow.setAttribute("aria-hidden", "true");
      first.appendChild(arrow);
    }
  }
  try {
    renderTownExtras();
  } catch (e) {}

  const result = prevResult141;
  try {
    decorateAreaMastery();
  } catch (e) {}
  return result;
}

// Earlier version of renderTown(), extended by the functions that follow.
function renderTownBeforeV56() {
  let prevResult142;
  prev142: {
    const result = renderTownBase();
    try {
      decorateAreaMasteryV52();
    } catch (e) {}
    prevResult142 = result;
    break prev142;
  }
  const result = prevResult142;
  try {
    decorateAutoRun();
  } catch (e) {}
  return result;
}

// Earlier version of renderTown(), extended by the functions that follow.
function renderTownBeforeV70() {
  let prevResult143;
  prev143: {
    const result = renderTownBeforeV56();
    const info = $("huntinfo");
    if (info && S.clearedAreas.includes(5)) {
      const count = standardRushSequenceV51().length,
        first = bossRushLevelV56(0, S.heroLevel),
        last = bossRushLevelV56(Math.max(0, count - 1), S.heroLevel);
      info.innerHTML += " · enemy levels <b>" + first + " to " + last + "</b>";
    }
    prevResult143 = result;
    break prev143;
  }
  const result = prevResult143;
  const info = $("huntinfo");
  if (info && S.clearedAreas.includes(5)) {
    const count = standardRushSequenceV57().length,
      first = bossRushLevelV57(0, S.heroLevel),
      last = bossRushLevelV57(Math.max(0, count - 1), S.heroLevel);
    info.innerHTML = info.innerHTML.replace(
      /enemy levels <b>\d+ to \d+<\/b>/,
      "enemy levels <b>" + first + " to " + last + "</b>"
    );
  }
  return result;
}

// Earlier version of renderTown(), extended by the functions that follow.
function renderTownBeforeV74() {
  let prevResult144;
  prev144: {
    const result = renderTownBeforeV70();
    ensureV70State();
    setupGuild();
    setupGoal();
    renderGoal();
    decorateInventory();
    decorateAutoRunV70();
    const h = document.querySelector("#wrap>h1");
    if (h && !h.querySelector(".polishbadgev70"))
      h.insertAdjacentHTML("beforeend", '<span class="polishbadgev70">V7</span>');
    prevResult144 = result;
    break prev144;
  }
  const result = prevResult144;
  moveNavigationV72();
  contractMarksV72();
  setupStatsV72();
  setupCompendiumTabsV72();
  return result;
}

// Earlier version of renderTown(), extended by the functions that follow.
function renderTownBeforeV77() {
  let prevResult145;
  prev145: {
    const result = renderTownBeforeV74();
    setupQuestUI();
    orderCompendium();
    evaluateQuests(false);
    prevResult145 = result;
    break prev145;
  }
  const result = prevResult145;
  const info = $("huntinfo");
  if (info && S.clearedAreas.includes(5)) {
    const seq = window.standardRushSequenceV51 ? window.standardRushSequenceV51() : [],
      firstAi = seq.length ? seq[0] : 0,
      lastAi = seq.length ? seq[seq.length - 1] : 0,
      first = bossRushLevelV76(firstAi, 0, false),
      last = bossRushLevelV76(lastAi, Math.max(0, seq.length - 1), false);
    if (/enemy levels <b>[^<]+<\/b>/.test(info.innerHTML))
      info.innerHTML = info.innerHTML.replace(
        /enemy levels <b>[^<]+<\/b>/,
        "enemy levels <b>" + first + " to " + last + "</b>"
      );
    else info.innerHTML += " · enemy levels <b>" + first + " to " + last + "</b>";
  }
  return result;
}

// Earlier version of renderTown(), extended by the functions that follow.
function townBase() {
  let prevResult146;
  prev146: {
    const result = renderTownBeforeV77();
    applyFeatureGatesV77();
    prevResult146 = result;
    break prev146;
  }
  const result = prevResult146;
  applyAreaGuidesV78();
  return result;
}

// Earlier version of renderTown(), extended by the functions that follow.
function renderTownBeforeV83() {
  let prevResult147;
  prev147: {
    pinForgeQuestV79();
    const result = townBase();
    applyFeatureVisibility();
    renderCoachArrow();
    if (pinForgeQuestV79() && window.forgeV74) window.forgeV74.evaluate(true);
    setTimeout(showNextNoticeV79, 60);
    prevResult147 = result;
    break prev147;
  }
  const result = prevResult147;
  renderGearBag();
  bindInventoryDragging();
  return result;
}

// Earlier version of renderTown(), extended by the functions that follow.
function _rt_v101() {
  let prevResult201;
  prev201: {
    const result = renderTownBeforeV83();
    repairLegacyHover();
    renderMineV83();
    const unlocked = mineUnlockedV83();
    S.flags = S.flags || {};
    if (unlocked && !S.flags.mineUnlockedV83) {
      S.flags.mineUnlockedV83 = true;
      setTimeout(() => {
        try {
          showTip(
            "THE DEEP MINE OPENS",
            "Miners have broken through beneath Shadow Keep. They make visible trips for <b>gold and blue shards</b>, even while you are away.<br><br>The cart stops after <b>one hour</b>. Spend <b>Quest Points</b> on gold, shards, speed, or double haul chance."
          );
        } catch (e) {}
      }, 650);
      try {
        scheduleSave();
      } catch (e) {}
    }
    prevResult201 = result;
    break prev201;
  }
  var r = prevResult201;
  try {
    renderBoonBar();
  } catch (e) {
    try {
      window.__rbbErr = String((e && e.message) || e);
    } catch (_e) {}
  }
  return r;
}

function renderTown() {
  var r = _rt_v101.apply(this, arguments);
  try {
    checkFirst10() || checkEfx() || checkRage() || checkAreaBonus();
  } catch (e) {}
  return r;
}

function decorateCard(card) {
  if (!card || card.classList.contains("cv99done")) return;
  card.classList.add("cv99done");
  var h3 = card.querySelector("h3"),
    areaEl = card.querySelector(".contractareav75"),
    rewEl = card.querySelector(".contractrewardv70"),
    coolEl = card.querySelector(".contractcoolv75"),
    btn = card.querySelector("[data-offer]");
  var name = h3 ? h3.textContent : "",
    isM = /Mastery/i.test(name) || /^\s*★/.test(name);
  var atxt = areaEl ? areaEl.textContent : "",
    ai = areaIndexFromText(atxt);
  if (ai < 0) ai = 0;
  // big area symbol top-right
  if (!card.querySelector(".cv99sym")) {
    var sym = document.createElement("div");
    sym.className = "cv99sym";
    sym.textContent = (AREAS[ai] && AREAS[ai].sp) || "◆";
    card.insertBefore(sym, card.firstChild);
  }
  // stage label
  if (areaEl && atxt.indexOf("stage") < 0)
    areaEl.textContent = atxt + " · stage " + (ai + 1) + (isM ? " · once per area" : "");
  // reward block
  var mult = rewEl
    ? String(rewEl.textContent)
        .replace(/^\s*Reward:\s*/i, "")
        .replace(/\.\s*$/, "")
    : "";
  var bt = bounty(ai, isM);
  var rew = document.createElement("div");
  rew.className = "cv99rew";
  rew.innerHTML =
    '<div class="cv99row bounty"><span class="lbl">Bounty</span><span class="val">' +
    fmt(bt.gold) +
    ' g · <span class="sh">' +
    bt.shards +
    " ◆</span></span></div>" +
    (isM
      ? '<div class="cv99row qp"><span class="lbl">Quest points</span><span class="val">★ +2 QP</span></div>'
      : "") +
    '<div class="cv99row mult"><span class="lbl">Challenge mult.</span><span class="val">' +
    (mult || "—") +
    "</span></div>";
  if (rewEl) rewEl.style.display = "none";
  if (btn) card.insertBefore(rew, btn);
  else card.appendChild(rew);
  // button + cooldown
  if (btn) {
    var disabled = btn.disabled || /recover/i.test(btn.textContent);
    if (disabled) {
      var secs = 0;
      if (coolEl) {
        var m = (coolEl.textContent || "").match(/(\d+)/);
        if (m) secs = +m[1];
      }
      btn.classList.add("cv99cool");
      btn.textContent = secs ? "◷ Recovering · " + secs + "s" : "◷ Recovering";
    } else {
      btn.classList.remove("cv99cool");
      btn.textContent = "ATTEMPT";
    }
  }
  if (coolEl) coolEl.style.display = "none";
}

function decorateAll() {
  var grid = document.getElementById("contractgridv70");
  if (!grid) return;
  grid.querySelectorAll(".contractv70").forEach(decorateCard);
}

function armObserver() {
  var grid = document.getElementById("contractgridv70");
  if (!grid || gridWatch) return;
  gridWatch = new MutationObserver(function () {
    try {
      gridWatch.disconnect();
    } catch (e) {}
    decorateAll();
    try {
      gridWatch.observe(grid, { childList: true });
    } catch (e) {}
  });
  gridWatch.observe(grid, { childList: true });
  decorateAll();
}

function powText(id) {
  var v = powVal(id);
  switch (id) {
    case "berserk":
      return "+" + nf(v.dealt) + "% dmg dealt · +" + nf(v.taken) + "% dmg taken";
    case "rage":
      return "+" + nf(v) + "% attack speed";
    case "elementAmp":
      return "+" + nf(v) + "% elemental dmg";
    case "toughen":
      return "−" + nf(v.pen) + "% output · +" + nf(v.mit) + "% mitigation";
    case "ninja":
      return "+" + nf(v) + "% dodge";
    case "heal":
      return "restores " + nf(v) + "% HP";
    case "miracle":
      return "regen " + nf(v) + "%/2s for 20s";
  }
  return "";
}

function durText(id) {
  return nf(durSec(id)) + "s";
}

function cdText(id) {
  return nf(cdSec(id)) + "s cooldown";
}

function shortDesc(id) {
  switch (id) {
    case "berserk":
      return "Deal more, take more";
    case "rage":
      return "Attack faster";
    case "elementAmp":
      return "Overcharge elemental damage";
    case "toughen":
      return "Less output, far tougher";
    case "ninja":
      return "Raise dodge chance";
    case "heal":
      return "Instantly restore health";
    case "miracle":
      return "Regenerate over 20s";
    case "cleanse":
      return "Purge ALL debuffs at once";
  }
  return "";
}

function starV112(ctx, x, y, r) {
  ctx.beginPath();
  for (var i = 0; i < 10; i++) {
    var a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    var rr = i % 2 ? r * 0.45 : r;
    ctx[i ? "lineTo" : "moveTo"](x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}

function plusV112(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s, y);
  ctx.lineTo(x + s, y);
  ctx.moveTo(x, y - s);
  ctx.lineTo(x, y + s);
  ctx.stroke();
}

function drawBuffFx(cx, gy) {
  if (typeof run === "undefined" || !run || run.over) return;
  var rt = run.actRT;
  if (!rt) return;
  var ctx = heroCtx();
  if (!ctx) return;
  var tm = performance.now() / 1000,
    t = nowT();
  function on(id) {
    return (rt.until[id] || 0) > t;
  }
  if (on("berserk")) {
    var sy = gy - 80 + Math.sin(tm * 3) * 2;
    ctx.save();
    ctx.globalAlpha = 0.22 + 0.1 * Math.sin(tm * 6);
    ctx.fillStyle = "#ff3b1e";
    ctx.shadowColor = "#ff5a2f";
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(cx, gy - 22, 25, 33, 0, 0, 7);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 12;
    ctx.shadowColor = "#ff5a2f";
    ctx.strokeStyle = "#fff0e6";
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(cx, sy);
    ctx.lineTo(cx, sy + 22);
    ctx.stroke();
    ctx.strokeStyle = "#ffcf5c";
    ctx.lineWidth = 3.6;
    ctx.beginPath();
    ctx.moveTo(cx - 7, sy + 17);
    ctx.lineTo(cx + 7, sy + 17);
    ctx.stroke();
    ctx.fillStyle = "#ff6a4d";
    ctx.beginPath();
    ctx.moveTo(cx, sy - 4);
    ctx.lineTo(cx - 3.5, sy + 2);
    ctx.lineTo(cx + 3.5, sy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffd0a0";
    ctx.beginPath();
    ctx.arc(cx, sy + 24, 2.6, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#ff7a3f";
    for (var bi = 0; bi < 3; bi++) {
      var bp = (tm * 1.2 + bi * 0.4) % 1;
      ctx.globalAlpha = 0.85 * (1 - bp);
      ctx.beginPath();
      ctx.arc(cx + (bi - 1) * 8 + Math.sin(tm * 3 + bi) * 2, gy - 20 - bp * 42, 2, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }
  if (on("rage")) {
    var fy = gy - 60,
      fl = Math.sin(tm * 16) * 2;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.shadowColor = "#ff5a2f";
    ctx.shadowBlur = 9;
    ctx.fillStyle = "#ff3b1e";
    ctx.beginPath();
    ctx.moveTo(cx, fy - 11 - fl);
    ctx.bezierCurveTo(cx + 6, fy - 4, cx + 4, fy + 3, cx, fy + 3);
    ctx.bezierCurveTo(cx - 4, fy + 3, cx - 6, fy - 4, cx, fy - 11 - fl);
    ctx.fill();
    ctx.fillStyle = "#ffb03a";
    ctx.beginPath();
    ctx.moveTo(cx, fy - 6 - fl * 0.7);
    ctx.bezierCurveTo(cx + 3, fy - 1, cx + 2, fy + 2, cx, fy + 2);
    ctx.bezierCurveTo(cx - 2, fy + 2, cx - 3, fy - 1, cx, fy - 6 - fl * 0.7);
    ctx.fill();
    ctx.restore();
  }
  if (on("elementAmp")) {
    ctx.save();
    ctx.fillStyle = "#e0b3ff";
    ctx.shadowColor = "#c07de0";
    ctx.shadowBlur = 6;
    for (var i = 0; i < 3; i++) {
      var a2 = tm * 2 + i * 2.1;
      var ex = cx + Math.cos(a2) * 17,
        ey = gy - 34 + Math.sin(a2 * 1.3) * 15;
      ctx.globalAlpha = 0.35 + 0.6 * Math.abs(Math.sin(tm * 4 + i));
      starV112(ctx, ex, ey, 2.6);
    }
    ctx.restore();
  }
  if (on("toughen")) {
    ctx.save();
    ctx.globalAlpha = 0.3 + 0.08 * Math.sin(tm * 4);
    ctx.strokeStyle = "#7bd3ff";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#7bd3ff";
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.ellipse(cx, gy - 22, 22, 30, 0, 0, 7);
    ctx.stroke();
    ctx.restore();
  }
  if (on("ninja")) {
    ctx.save();
    for (var j = 0; j < 3; j++) {
      var a3 = tm * 3 + j * 2.1;
      ctx.globalAlpha = 0.1 + 0.06 * Math.sin(tm * 5 + j);
      ctx.fillStyle = "#8affc0";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a3) * 13, gy - 20 + Math.sin(a3) * 11, 6, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }
  if (rt.miracleUntil > t) {
    ctx.save();
    ctx.strokeStyle = "#78e08a";
    ctx.lineWidth = 2;
    ctx.shadowColor = "#78e08a";
    ctx.shadowBlur = 6;
    for (var k = 0; k < 4; k++) {
      var ph = (tm * 0.55 + k * 0.25) % 1;
      var px = cx + (k % 2 ? 15 : -15) + Math.sin(tm * 2 + k) * 3;
      var py = gy - 6 - ph * 42;
      ctx.globalAlpha = Math.max(0, 1 - ph);
      plusV112(ctx, px, py, 3);
    }
    ctx.restore();
  }
  if (rt.fxHealReal && performance.now() < rt.fxHealReal) {
    var p = 1 - (rt.fxHealReal - performance.now()) / 750;
    ctx.save();
    ctx.strokeStyle = "#78e08a";
    ctx.lineWidth = 2.4;
    ctx.shadowColor = "#78e08a";
    ctx.shadowBlur = 10;
    ctx.globalAlpha = Math.max(0, 1 - p);
    for (var m = 0; m < 6; m++) {
      var ang = (m / 6) * 6.283;
      var rr = 8 + p * 26;
      plusV112(ctx, cx + Math.cos(ang) * rr, gy - 22 + Math.sin(ang) * rr, 3);
    }
    ctx.restore();
  }
  if (rt.fxCleanseReal && performance.now() < rt.fxCleanseReal) {
    var p2 = 1 - (rt.fxCleanseReal - performance.now()) / 750;
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - p2);
    ctx.strokeStyle = "#c9b3ff";
    ctx.lineWidth = 2.2;
    ctx.shadowColor = "#b9a0ff";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(cx, gy - 22, 10 + p2 * 26, 0, 7);
    ctx.stroke();
    ctx.restore();
  }
}

function setTab(tab) {
  curTab = tab;
  var bar = document.getElementById("sktabsv111");
  var branches = document.getElementById("branches");
  var panel = document.getElementById("actpanelv111");
  var disc = document.getElementById("disciplinev70");
  var rs = resetSkillsBtn();
  if (bar)
    bar.querySelectorAll("button").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-tab") === tab);
    });
  if (tab === "active") {
    if (branches) branches.style.display = "none";
    if (disc) disc.style.display = "none";
    if (rs) rs.style.display = "none";
    if (panel) {
      panel.style.display = "block";
      renderActivePanel();
    }
  } else {
    if (branches) branches.style.display = "";
    if (disc) disc.style.display = "";
    if (rs) rs.style.display = "";
    if (panel) panel.style.display = "none";
  }
  refreshBadges();
}

function card_p21(id) {
  var a = ensureState_p21(),
    d = ACT[id];
  var sel = a.loadout.indexOf(id) >= 0;
  var locked = skillLocked(id);
  var canSel = !locked && (sel || a.loadout.length < unlockedSlots());
  var btnLabel = locked ? "🔒 Invest to unlock" : sel ? "SELECTED" : "SELECT";
  var h = '<div class="skcardv111' + (locked ? " needunlockv112" : "") + '" style="--cc:' + d.col + '">';
  h +=
    '<div class="skhv111"><span class="ic">' +
    d.icon +
    '</span><span class="nm">' +
    d.name +
    "</span>" +
    '<button class="loadbtn' +
    (sel ? " on" : "") +
    '" data-load="' +
    id +
    '"' +
    (canSel ? "" : " disabled") +
    ">" +
    btnLabel +
    "</button></div>";
  h += '<div class="valv111">' + shortDesc(id) + "</div>";
  if (d.pow) h += trackRow(id, "pow", "Power", powText(id));
  if (d.dur) h += trackRow(id, "dur", "Duration", durText(id));
  if (d.cdTrack) h += trackRow(id, "cd", "Cooldown", cdText(id));
  else h += '<div class="cdinfoV112">🕑 ' + cdText(id) + "</div>";
  h += "</div>";
  return h;
}

function setBadge(el, show, txt, glow) {
  if (!el) return;
  var b = el.querySelector(".skbadgeV112");
  if (show) {
    if (!b) {
      b = document.createElement("span");
      b.className = "skbadgeV112";
      el.appendChild(b);
      if (getComputedStyle(el).position === "static") el.style.position = "relative";
    }
    b.textContent = txt;
    b.classList.toggle("glow", !!glow);
  } else if (b) {
    b.remove();
  }
}

function refreshBadges() {
  try {
    ensureState_p21();
    var sp = (typeof S !== "undefined" && S.sp) || 0,
      spa = (typeof S !== "undefined" && S.spA) || 0;
    setBadge(document.getElementById("opentree"), sp + spa > 0, String(sp + spa), false);
    var bar = document.getElementById("sktabsv111");
    if (bar) {
      setBadge(bar.querySelector('button[data-tab="passive"]'), sp > 0, String(sp), false);
      setBadge(bar.querySelector('button[data-tab="active"]'), spa > 0, String(spa), false);
    }
    var qc = questClaimable();
    setBadge(document.getElementById("questbtnv74"), qc > 0, String(qc), true);
  } catch (e) {}
}

function arrowEl() {
  var el = document.getElementById("v114arrow");
  if (!el) {
    el = document.createElement("div");
    el.id = "v114arrow";
    el.className = "v114arrow";
    el.textContent = "▼";
    el.style.display = "none";
    document.body.appendChild(el);
  }
  return el;
}

function position_v114() {
  var btn = document.getElementById("opentree"),
    el = arrowEl();
  if (!btn || el.style.display === "none") return;
  var r = btn.getBoundingClientRect();
  if (r.width === 0) {
    el.style.display = "none";
    return;
  }
  el.style.left = r.left + r.width / 2 - 11 + window.scrollX + "px";
  el.style.top = r.top - 30 + window.scrollY + "px";
}

function modalOpen() {
  var t = document.getElementById("tipmodal");
  return !!(t && t.classList.contains("on"));
}

function show_v114() {
  var btn = document.getElementById("opentree");
  if (!btn) return;
  arrowEl().style.display = "block";
  btn.classList.add("v114glow");
  position_v114();
}

function hide() {
  arrowEl().style.display = "none";
  var b = document.getElementById("opentree");
  if (b) b.classList.remove("v114glow");
}
