/* MIRROR PLANE · a side area that opens after the first Celestial Alpha kill.
   Every creature arrives with its reflection (never more than four on screen), and the area
   ends with the Mirror Sisters, Seren and Neres. When one sister falls, the other heals and
   grows stronger, so bringing both down together (area damage) is the easy way, never the only way.
   The run borrows Infernal Gate's slot like the Abyss does, but keeps its own clear counter. */
const MIRROR_BASE_AI = 10;
const MIRROR_AREA = {
  n: "Mirror Plane",
  sp: "🪞",
  lvl: 112,
  waves: 14,
  pool: ["celoracle", "wraith", "prismhound", "golem", "pearlseraph"],
  boss: "Seren, the Mirror Sister",
  weak: "nothing it cannot copy",
  bg: ["#e9eef5", "#77849a"],
  gr: "#b8c4d2",
  deco: "mirror",
  mirrorPlane: true
};
const MIRROR_SISTER_LINES = [
  ["One of us is the reflection.", "Guess which."],
  ["Strike me and you strike her.", "Strike her and you strike me."],
  ["We have watched you from every blade you polished.", "Every one of them showed us your face."],
  ["You came alone.", "We never do."]
];
const MIRROR_GRIEF_LINES = {
  seren: "You broke my reflection. Now look at what was behind it.",
  neres: "She was the original. I was the better copy."
};
function mirrorCopy(f) {
  // shallow copy plus the nested drawing data; JSON copies break on circular references
  const c = Object.assign({}, f);
  for (const k of ["draw", "res"]) if (f[k] && typeof f[k] === "object") c[k] = Object.assign({}, f[k]);
  for (const k of Object.keys(c)) if (Array.isArray(c[k])) c[k] = c[k].slice();
  return c;
}
let nextRunMirror = false,
  lastWasMirror = false;

function mirrorState() {
  S.mirrorPlaneV1 = S.mirrorPlaneV1 || { clears: 0, sisters: 0, forged: 0, best: 0 };
  return S.mirrorPlaneV1;
}
function mirrorUnlocked() {
  return (S.clearedAreas || []).includes(13);
}
function startMirrorPlane() {
  if (!mirrorUnlocked()) return;
  nextRunMirror = true;
  startRun(MIRROR_BASE_AI);
}
function lighten(hex, k) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return "#dfe7f2";
  const n = parseInt(m[1], 16),
    ch = s => Math.round(((n >> s) & 255) + (255 - ((n >> s) & 255)) * k);
  return "#" + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, "0")).join("");
}

{
  /* ---- entering ---- */
  const startRunBeforeMirror = startRun;
  startRun = function (ai) {
    const mirror = nextRunMirror && ai === MIRROR_BASE_AI;
    nextRunMirror = false;
    if (!mirror) {
      lastWasMirror = false;
      return startRunBeforeMirror.apply(this, arguments);
    }
    const orig = AREAS[MIRROR_BASE_AI];
    AREAS[MIRROR_BASE_AI] = Object.assign({}, MIRROR_AREA);
    let r;
    try {
      r = startRunBeforeMirror.call(this, MIRROR_BASE_AI);
    } finally {
      AREAS[MIRROR_BASE_AI] = orig;
    }
    if (run) {
      run.mirrorPlane = true; // also readable as run.a.mirrorPlane from the first wave on
      lastWasMirror = true;
      try {
        $("rmsg").className = "msg";
        $("rmsg").textContent = "Entering the Mirror Plane";
      } catch (e) {}
    }
    return r;
  };
  ["rerun", "lootrerun"].forEach(id => {
    const el = document.getElementById(id);
    if (el)
      el.addEventListener(
        "click",
        () => {
          if (lastWasMirror) nextRunMirror = true;
        },
        true
      );
  });

  /* ---- waves: every creature brings its reflection; the boss wave brings the sisters ---- */
  const nextWaveBeforeMirror = nextWave;
  nextWave = function () {
    const r = nextWaveBeforeMirror.apply(this, arguments);
    try {
      if (!run || !(run.mirrorPlane || (run.a && run.a.mirrorPlane)) || run.hunt || !run.foes) return r;
      const alive = run.foes.filter(f => f.hp > 0);
      const boss = alive.find(f => f.boss);
      if (boss && !run.mirrorSisters) {
        run.mirrorSisters = true;
        run.mech = null;
        const share = 0.6;
        boss.max = Math.round(boss.max * share);
        boss.hp = boss.max;
        boss.atk = Math.round(boss.atk * share);
        boss.name = "★ Seren, the Mirror Sister";
        boss.mirrorSister = "seren";
        boss.draw.c = "#eef3fb";
        boss._x = 372;
        const twin = mirrorCopy(boss);
        twin.name = "★ Neres, her Reflection";
        twin.mirrorSister = "neres";
        twin.draw.c = "#5d6b86";
        twin._x = 456;
        twin.cd = (boss.cd || 600) + 450;
        run.foes.push(twin);
        const pair = MIRROR_SISTER_LINES[Math.floor(Math.random() * MIRROR_SISTER_LINES.length)];
        sayBoss(pair[0]);
        setTimeout(() => {
          if (run && !run.over && run.foes.some(f => f.mirrorSister === "neres" && f.hp > 0)) sayBoss(pair[1]);
        }, 2200);
        $("wave").innerHTML = '<b style="color:#dfe8ff">THE MIRROR SISTERS</b> · Mirror Plane';
      } else if (!boss && alive.length) {
        const orig = alive.slice(),
          out = orig.slice();
        for (const f of orig) {
          if (out.length >= 4) break;
          if (f.elite || f.abyssElite) continue;
          const c = mirrorCopy(f);
          c.reflection = true;
          c.name = "Reflected " + f.name;
          c.draw.c = lighten(f.draw.c, 0.55);
          out.push(c);
        }
        const k = out.length > orig.length ? (out.length >= 4 ? 0.55 : 0.62) : 1;
        out.forEach(f => {
          f.max = Math.round(f.max * k);
          f.hp = Math.min(f.hp, f.max);
        });
        const xs = { 1: [405], 2: [360, 452], 3: [325, 405, 485], 4: [300, 368, 436, 504] }[out.length];
        out.forEach((f, i) => (f._x = xs[i]));
        run.foes = out;
        $("wave").innerHTML =
          "Wave <b>" + run.wave + "</b> / " + run.total + ' · <b style="color:#cfdcf0">' + out.length + " foes</b> · Mirror Plane";
      }
      // celestial-tier strength: the borrowed slot has no celestial scaling of its own
      const T = window.__abyssTune || {};
      run.foes.forEach(f => {
        if (f.mirrorScaled) return;
        f.mirrorScaled = true;
        const hm = T.mirrorHp != null ? T.mirrorHp : 10,
          am = T.mirrorAtk != null ? T.mirrorAtk : 3.2;
        f.max = Math.round(f.max * hm);
        f.hp = Math.round(f.hp * hm);
        f.atk = Math.round(f.atk * am);
      });
      buildFoeBars();
      drawBars();
    } catch (e) {}
    return r;
  };

  /* ---- the sisters: grief, loot from the last one only, Mirrorforged drop ---- */
  const killFoeBeforeMirror = killFoe;
  killFoe = function (f) {
    if (f && f.mirrorSister && run && run.mirrorPlane && !f.mirrorHandled) {
      f.mirrorHandled = true;
      const other = run.foes.find(o => o !== f && o.mirrorSister && o.hp > 0);
      if (other) {
        f.boss = false;
        f.noDrop = true;
        other.hp = Math.min(other.max, other.hp + other.max * 0.25);
        other.atk = Math.round(other.atk * 1.4);
        other.name = other.name.replace("★", "★ ✦");
        try {
          sayBoss(MIRROR_GRIEF_LINES[other.mirrorSister]);
          flash("#dfe8ff");
        } catch (e) {}
        buildFoeBars();
      } else {
        const st = mirrorState();
        st.sisters++;
        const T = window.__abyssTune || {};
        if (run.bags && Math.random() < (T.mirrorforgedChance != null ? T.mirrorforgedChance : 0.08)) {
          run.bags.push({ rar: Math.random() < 0.25 ? 5 : 4, lvl: Math.max(1, Math.min(190, f.lvl || 112)), slot: "weapon", unique: "mirrorforged", celestialDrop: true });
          try {
            addBagChip(4);
            $("rmsg").className = "msg big";
            $("rmsg").innerHTML = "🪞 A Mirrorforged weapon dropped!";
            flash("#dfe8ff");
          } catch (e) {}
        }
      }
    }
    const n0 = run && run.bags ? run.bags.length : 0;
    const r = killFoeBeforeMirror.apply(this, arguments);
    if (run && run.mirrorPlane && run.bags) run.bags.slice(n0).forEach(b => b && (b.celestialDrop = true));
    return r;
  };

  /* ---- drop levels and a separate clear counter ---- */
  const rollDropLevelBeforeMirror = rollDropLevel;
  rollDropLevel = function (areaIndex) {
    if (run && (run.mirrorPlane || (run.a && run.a.mirrorPlane))) return MIRROR_AREA.lvl + Math.floor(Math.random() * 6);
    return rollDropLevelBeforeMirror.apply(this, arguments);
  };
  const areaClearBeforeMirror = areaClear;
  areaClear = function () {
    if (!(run && run.mirrorPlane)) return areaClearBeforeMirror.apply(this, arguments);
    const clears = S.areaClearsV51,
      claims = S.areaMedalClaimsV51;
    S.areaClearsV51 = {};
    S.areaMedalClaimsV51 = {};
    try {
      return areaClearBeforeMirror.apply(this, arguments);
    } finally {
      S.areaClearsV51 = clears;
      S.areaMedalClaimsV51 = claims;
      mirrorState().clears++;
      try {
        scheduleSave();
      } catch (e) {}
    }
  };

  /* ---- look: silver sky, light shards, and a real reflection on the floor ---- */
  const drawBgBeforeMirror = drawBg;
  drawBg = function (a) {
    const r = drawBgBeforeMirror.apply(this, arguments);
    if (a && a.deco === "mirror") {
      const T = anim.t;
      ctx.save();
      for (let i = 0; i < 7; i++) {
        const x = ((i * 89 + T * 6) % (CANVAS_LOGICAL_W + 80)) - 40,
          al = 0.08 + 0.06 * Math.sin(T * 1.3 + i);
        ctx.fillStyle = "rgba(255,255,255," + al.toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + 26, 0);
        ctx.lineTo(x - 14, GY);
        ctx.lineTo(x - 30, GY);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    return r;
  };
  const frameBeforeMirror = frame;
  frame = function () {
    const r = frameBeforeMirror.apply(this, arguments);
    try {
      if (run && run.mirrorPlane && $("run").style.display !== "none") {
        const sc = CANVAS_RENDER_SCALE,
          g = Math.round((GY + 4) * sc),
          h = Math.min(cv.height - g, Math.round(60 * sc));
        if (h > 0) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.globalAlpha = 0.24;
          ctx.translate(0, 2 * g);
          ctx.scale(1, -1);
          ctx.drawImage(cv, 0, g - h, cv.width, h, 0, g - h, cv.width, h);
          ctx.restore();
        }
      }
    } catch (e) {}
    return r;
  };

  /* ---- town tile and the first-time popup ---- */
  const renderTownBeforeMirror = renderTown;
  renderTown = function () {
    const r = renderTownBeforeMirror.apply(this, arguments);
    try {
      const ael = $("areas");
      if (ael && mirrorUnlocked() && !(S.abyssUnlocked && S.abyssMode) && !$("mirrortilev1")) {
        const st = mirrorState(),
          d = document.createElement("div");
        d.id = "mirrortilev1";
        d.className = "atile mirrortilev1";
        d.innerHTML =
          '<div class="as">🪞</div><div class="anm">Mirror' + (st.clears ? " ✓" : "") + "</div>" +
          '<div class="atip"><div class="tn">🪞 Mirror Plane</div><div class="td">' + MIRROR_AREA.waves +
          " waves + the Mirror Sisters<br>depth " + MIRROR_AREA.lvl + "+ · every creature brings its reflection</div>" +
          '<div class="tw">cleared ×' + st.clears + "</div>" +
          '<div style="color:var(--gold);font-size:10px;margin-top:6px;font-weight:700">▶ click to enter</div></div>';
        d.onclick = startMirrorPlane;
        ael.appendChild(d);
      }
      S.flags = S.flags || {};
      if (mirrorUnlocked() && !S.flags.mirrorPlaneIntroV1 && !(run && !run.over)) {
        S.flags.mirrorPlaneIntroV1 = true;
        scheduleSave();
        setTimeout(
          () =>
            showTip(
              "THE MIRROR PLANE",
              "When Celestial Alpha fell, its light struck something that should not exist: a silver plain where every creature walks beside its own reflection.<br><br>Two sisters rule it, <b>Seren</b> and <b>Neres</b>. Nobody remembers which one came first.<br><br>The <b>🪞 Mirror Plane</b> now sits beside your stage map. Its creatures come in pairs, so attacks that hit more than one enemy shine here. The sisters guard the rare <b>🪞 Mirrorforged</b> weapons."
            ),
          2100
        );
      }
    } catch (e) {}
    return r;
  };
}

/* ---------- MIRRORFORGED WEAPONS ----------
   A rare unique weapon from the Mirror Sisters. Its echo: a quarter of its hits strike again,
   at half damage on another enemy, or at a third on the same one if it stands alone. */
function makeMirrorforged(ilvl, rar) {
  const g = makeWeapon(ilvl, rar || 4);
  g.unique = "mirrorforged";
  g.name = "🪞 Mirrorforged " + (g.rar === 5 ? "Mythic " : "") + weaponTypeName(g);
  try {
    mirrorState().forged++;
  } catch (e) {}
  return g;
}
{
  const makeDropBeforeMirror = makeDrop;
  makeDrop = function (bag) {
    if (bag && bag.unique === "mirrorforged" && !bag._preparedDropV70) {
      const g = makeMirrorforged(bag.lvl, bag.rar);
      if (bag.celestialDrop) g.celestialDrop = true;
      return g;
    }
    return makeDropBeforeMirror.apply(this, arguments);
  };
  const ensureMythicBeforeMirror = ensureMythic;
  ensureMythic = function (g) {
    const r = ensureMythicBeforeMirror.apply(this, arguments);
    if (r && r.unique === "mirrorforged") r.name = "🪞 Mirrorforged " + (r.rar === 5 ? "Mythic " : "") + weaponTypeName(r);
    return r;
  };
  const applyWeaponEffectsBeforeMirror = applyWeaponEffects;
  applyWeaponEffects = function (target, dd, tier, hs, g, em) {
    const r = applyWeaponEffectsBeforeMirror.apply(this, arguments);
    try {
      if (g && g.unique === "mirrorforged" && run && !run.over && target && Math.random() < 0.25) {
        const others = run.foes.filter(o => o && o.hp > 0 && o !== target),
          tgt = others.length ? others[Math.floor(Math.random() * others.length)] : target.hp > 0 ? target : null;
        if (tgt) {
          const amt = dd * (tgt === target ? 0.35 : 0.5);
          tgt.hp -= amt;
          tgt.hurt = 1;
          run.dmgLog.push([run.time, amt]);
          floatDmg("foe", Math.round(amt), 0, "#dce8ff", tgt._x);
          if (tgt !== target && tgt.hp <= 0) killFoe(tgt);
        }
      }
    } catch (e) {}
    return r;
  };
  const portableBeforeMirror = portableItem;
  portableItem = function (raw) {
    const g = portableBeforeMirror.apply(this, arguments);
    if (g && raw && raw.unique === "mirrorforged") {
      g.unique = "mirrorforged";
      if (raw.name) g.name = String(raw.name).slice(0, 100);
    }
    return g;
  };
  const gearDescBeforeMirror = gearDesc;
  gearDesc = function (g) {
    let html = gearDescBeforeMirror.apply(this, arguments);
    if (g && g.unique === "mirrorforged")
      html +=
        '<br><span style="color:#dfe8ff;font-weight:700">🪞 Mirrorforged</span> · Echo: 25% of hits strike again, at half damage on another enemy (a third on a lone one)';
    return html;
  };
}

/* ---------- COMPENDIUM · Mirror Plane page ---------- */
function mirrorPageHtml() {
  const st = mirrorState();
  return (
    '<div class="amintrov117"><b>🪞 The Mirror Plane</b><br>A silver plain that appeared when Celestial Alpha fell. Every creature here walks beside its reflection, and the reflections hit just as hard.</div>' +
    '<div class="amgridv117">' +
    '<div class="amrowv117"><div class="amheadv117"><span class="amsymv117">☀</span><span class="amnamev117">Seren, the Mirror Sister</span></div>' +
    '<div class="amnextv117">She claims to be the original. Bright, patient, and certain that you will look away first.</div></div>' +
    '<div class="amrowv117"><div class="amheadv117"><span class="amsymv117">☾</span><span class="amnamev117">Neres, her Reflection</span></div>' +
    '<div class="amnextv117">She claims to be the better copy. When one sister falls, the other takes her strength.</div></div>' +
    '<div class="amrowv117"><div class="amheadv117"><span class="amsymv117">🪞</span><span class="amnamev117">Your record</span></div>' +
    '<div class="amnextv117">Mirror Plane cleared <b>' + st.clears + "</b> times · Sisters defeated <b>" + st.sisters +
    "</b> · Mirrorforged weapons found <b>" + st.forged + "</b></div></div>" +
    '<div class="amrowv117"><div class="amheadv117"><span class="amsymv117">✦</span><span class="amnamev117">Mirrorforged weapons</span></div>' +
    '<div class="amnextv117">Rare weapons only the sisters carry. A quarter of their hits echo onto another enemy.</div></div>' +
    "</div>"
  );
}
{
  const installBeforeMirror = installAreaMasteryTab;
  installAreaMasteryTab = function () {
    const r = installBeforeMirror.apply(this, arguments);
    try {
      const tabs = $("comptabsv72"),
        box = $("compendium") && $("compendium").querySelector(".compbox");
      if (!tabs || !box || !mirrorUnlocked() || tabs.querySelector('[data-page="mirror"]')) return r;
      const sec = document.createElement("section");
      sec.id = "mirrorpagev1";
      sec.className = "compsectionv72hidden";
      box.insertBefore(sec, $("closecompendium") || null);
      const b = document.createElement("button");
      b.dataset.page = "mirror";
      b.textContent = "🪞 MIRROR PLANE";
      tabs.appendChild(b);
      b.onclick = () => {
        box.querySelectorAll(".compgrid,#mythicreferencev38,#discoveryv70,#bestiarytitlev70,#bestiarygridv70,#areamasteryv117").forEach(el =>
          el.classList.add("compsectionv72hidden")
        );
        sec.innerHTML = mirrorPageHtml();
        sec.classList.remove("compsectionv72hidden");
        tabs.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
      };
      tabs.querySelectorAll('button:not([data-page="mirror"])').forEach(x =>
        x.addEventListener("click", () => sec.classList.add("compsectionv72hidden"))
      );
    } catch (e) {}
    return r;
  };
}
