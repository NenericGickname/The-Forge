/* Compendium: bestiary, field archive, tips. */

function installMythicReference() {
  if ($("mythicreferencev38")) return;
  const box = $("compendium") && $("compendium").querySelector(".compbox"),
    close = $("closecompendium");
  if (!box || !close) return;
  const section = document.createElement("section");
  section.id = "mythicreferencev38";
  section.className = "mythicreferencev38";
  const order = ["weapon", "helm", "boots", "armor", "gloves", "amulet"];
  section.innerHTML =
    '<h3>✺ MYTHIC AFFIXES</h3><div class="mythicreferenceintro">Every Mythic item rolls one category specific power. Equipped powers appear beside the hero life bar during combat. Hover a symbol there to read its effect.</div><div class="mythicreferencegrid">' +
    order
      .map(slot => {
        const sd = SLOTS.find(s => s.key === slot);
        return (
          '<div class="mythicreferencegroup"><h4>' +
          sd.ic +
          " " +
          sd.label +
          "</h4>" +
          MYTHIC_AFFIXES[slot]
            .map(affix => {
              const info = MYTHIC_INFO[affix];
              return (
                '<div class="mythicreferenceentry" data-affix="' +
                affix +
                '"><span>' +
                MYTHIC_ICONS[affix] +
                "</span><div><b>" +
                info[0] +
                "</b><small>" +
                info[1] +
                "</small></div></div>"
              );
            })
            .join("") +
          "</div>"
        );
      })
      .join("") +
    "</div>";
  close.insertAdjacentElement("beforebegin", section);
  const style = document.createElement("style");
  style.textContent =
    ".mythicreferencev38{margin-top:14px;padding-top:12px;border-top:1px solid #286f6b;text-align:left}.mythicreferencev38 h3{margin:0 0 5px;color:var(--mythic);letter-spacing:2px;text-align:center}.mythicreferenceintro{margin:0 auto 11px;max-width:650px;color:#91aaa8;font-size:10px;line-height:1.5;text-align:center}.mythicreferencegrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.mythicreferencegroup{border:1px solid #285653;border-radius:8px;background:#091313;padding:9px}.mythicreferencegroup h4{margin:0 0 7px;color:#8ce7df;font-size:11px;letter-spacing:1px}.mythicreferenceentry{display:grid;grid-template-columns:25px 1fr;gap:6px;align-items:start;padding:5px 0;border-top:1px solid #1c3533}.mythicreferenceentry>span{font-size:17px;text-align:center}.mythicreferenceentry b{display:block;color:#d7fffb;font-size:10px}.mythicreferenceentry small{display:block;color:#91aaa8;font-size:9px;line-height:1.35}.fx.mythicfx{border-color:#2ccfc1!important;background:#09201f!important;box-shadow:0 0 7px #20cabb66,inset 0 0 5px #2ce8d522}.fx.mythicfx.exhausted{filter:grayscale(1);opacity:.42;box-shadow:none}.fx.mythicfx .fxn{background:#167f78;color:#fff}@media(max-width:620px){.mythicreferencegrid{grid-template-columns:1fr}}";
  document.head.appendChild(style);
}

function installRatingReference() {
  const grid = $("compendium") && $("compendium").querySelector(".compgrid");
  if (!grid || $("ratingcapsv42")) return;
  const d = document.createElement("div");
  d.id = "ratingcapsv42";
  d.className = "compentry ratingcapsv42";
  d.innerHTML =
    '<b>📐 Rating Caps</b><div class="ratingintroV42">These ratings use diminishing returns. They approach the listed maximum but do not normally reach it.</div><div class="ratingrowv42"><span>Defense</span><strong>75%</strong><small>75 × rating ÷ (rating + 180)</small></div><div class="ratingrowv42"><span>Dodge</span><strong>78%</strong><small>78 × rating ÷ (rating + 95)</small></div><div class="ratingrowv42"><span>Elemental Resistance</span><strong>88%</strong><small>88 × rating ÷ (rating + 120)</small></div><div class="ratingrowv42"><span>Cooldown Reduction</span><strong>45%</strong><small>45 × rating ÷ (rating + 90)</small></div><div class="ratingrowv42"><span>Leech</span><strong>10%</strong><small>10 × rating ÷ (rating + 14)</small></div><div class="ratingnotesv42"><b>Leech limit per hit</b> Healing is limited to 4% of maximum health per hit, or 8% with Sanguine. The End reduces the effective Leech percentage by 95%.<br><b>Dodge exception</b> Sneaky adds 10 percentage points after the rating calculation, with a final cap of 95%.<br><b>Other hard caps</b> Critical chance is capped at 300%. Enrage activation chance is capped at 50%. Enrage above 50 adds one second of duration per 10 extra points.</div>';
  grid.appendChild(d);
  const style = document.createElement("style");
  style.textContent =
    ".lootresults{max-height:260px}.lootprotecthintv42{margin:6px auto 8px;max-width:470px;min-height:16px;color:#b8aea3;font-size:10px;text-align:center}.lootprotecthintv42 b{color:#ffe09a}.stagedlootv42{position:relative;max-width:470px;cursor:pointer;padding:8px 34px 8px 9px;transition:transform .1s,background .15s,border-color .15s}.stagedlootv42:hover{transform:translateY(-1px)}.stagedlootv42.selected{background:#1b1724;outline:1px solid #9f88d8}.stagedlootv42.protected{background:#28200e;outline:2px solid #ffd76a;box-shadow:0 0 15px #ffd76a55!important}.stagecheckv42{display:none;position:absolute;left:-7px;top:-7px;width:18px;height:18px;border-radius:50%;background:#9f88d8;color:#fff;text-align:center;line-height:18px;font-size:10px}.stagedlootv42.selected .stagecheckv42{display:block}.stageitemv42{display:flex;flex:1;min-width:0;flex-direction:column;gap:2px}.stageitemv42 small{display:block;color:var(--dim);font-size:9px;line-height:1.35}.stagelockv42{position:absolute;right:9px;top:50%;transform:translateY(-50%);font-size:18px}.stagefatev42{font-size:8px;font-weight:800;letter-spacing:.4px}.stagefatev42.salvage{color:#70aef5}.stagefatev42.keep{color:#7fd58a}.stagefatev42.protected{color:#ffd76a}.ratingcapsv42{grid-column:1 / -1}.ratingintroV42{color:var(--dim);font-size:9px;margin-bottom:7px}.ratingrowv42{display:grid;grid-template-columns:145px 48px 1fr;gap:8px;align-items:center;padding:5px 0;border-top:1px solid #ffffff10;font-size:9px}.ratingrowv42 span{color:#d5fff9}.ratingrowv42 strong{color:var(--gold);font-size:11px}.ratingrowv42 small{color:#91aaa8}.ratingnotesv42{margin-top:8px;padding-top:7px;border-top:1px solid #ffffff14;color:#91aaa8;font-size:9px;line-height:1.5}.ratingnotesv42 b{display:inline;color:#d5fff9;margin:0}@media(max-width:560px){.ratingrowv42{grid-template-columns:1fr auto}.ratingrowv42 small{grid-column:1 / -1}.lootresults{max-height:220px}}";
  document.head.appendChild(style);
  const intro = $("lootopen").querySelector('div[style*="margin:4px 0 10px"]');
  if (intro && !$("lootprotecthintv42")) {
    const hint = document.createElement("div");
    hint.id = "lootprotecthintv42";
    hint.className = "lootprotecthintv42";
    intro.insertAdjacentElement("afterend", hint);
  }
}

/* Item identity and discovery. */
function discoverMythic(g) {
  if (!g || g.rar !== 5 || !g.mythicAffix) return false;
  ensureV70State();
  if (S.mythicSeenV70.includes(g.mythicAffix)) return false;
  S.mythicSeenV70.push(g.mythicAffix);
  scheduleSave();
  return true;
}

function archiveGoal() {
  const total = Object.keys(MYTHIC_INFO || {}).length,
    n = (S.mythicSeenV70 || []).length;
  if (!n || n >= total) return null;
  return {
    icon: "✺",
    title: "Mythic archive",
    meta: n + " of " + total + " effects discovered",
    p: n / total
  };
}

function bestiaryGoal() {
  const total = Object.keys(ENEMIES || {}).length + AREAS.length,
    n = Object.keys(S.bestiaryKillsV70 || {}).filter(k => S.bestiaryKillsV70[k] > 0).length;
  if (!n || n >= total) return null;
  return {
    icon: "♛",
    title: "Mercenary Bestiary",
    meta: n + " of " + total + " creatures encountered",
    p: n / total
  };
}

function refreshCompendiumV70() {
  ensureV70State();
  const overlay = $("compendium"),
    grid = overlay && overlay.querySelector(".compgrid"),
    box = overlay && overlay.querySelector(".compbox");
  if (!grid || !box) return;
  const seen = new Set(S.mythicSeenV70 || []),
    mythicSection = $("mythicreferencev38");
  if (mythicSection) {
    mythicSection.style.display = seen.size ? "" : "none";
    [...mythicSection.querySelectorAll(".mythicreferenceentry[data-affix]")].forEach(card => {
      const id = card.dataset.affix;
      if (!card.dataset.originalV70) card.dataset.originalV70 = card.innerHTML;
      if (seen.has(id)) {
        card.classList.remove("mythiclockedv70");
        card.innerHTML = card.dataset.originalV70;
      } else {
        card.classList.add("mythiclockedv70");
        card.innerHTML = "<span>✺</span><div><b>? ? ?</b><small>Undiscovered Mythic effect</small></div>";
      }
    });
  }
  let d = $("discoveryv70");
  if (!d) {
    d = document.createElement("section");
    d.id = "discoveryv70";
    d.className = "discoveryv70";
    grid.parentNode.insertBefore(d, grid);
  }
  const totalMythic = Object.keys(MYTHIC_INFO || {}).length,
    knownCreatures = Object.values(S.bestiaryKillsV70 || {}).filter(v => v > 0).length,
    totalCreatures = Object.keys(ENEMIES || {}).length + AREAS.length;
  d.innerHTML =
    "<h3>FIELD ARCHIVE</h3><p>" +
    (seen.size
      ? "Mythic knowledge appears only after you recover the effect yourself."
      : "The Mythic archive remains sealed until your first Mythic item drops.") +
    '</p><div class="archivebarv70"><span>✺ Mythics ' +
    seen.size +
    " / " +
    totalMythic +
    "</span><span>♛ Creatures " +
    knownCreatures +
    " / " +
    totalCreatures +
    "</span></div>";
  let title = $("bestiarytitlev70"),
    bg = $("bestiarygridv70");
  if (!title) {
    title = document.createElement("h3");
    title.id = "bestiarytitlev70";
    title.className = "bestiarytitlev70";
    title.textContent = "MERCENARY BESTIARY";
    box.insertBefore(title, $("closecompendium"));
    bg = document.createElement("div");
    bg.id = "bestiarygridv70";
    bg.className = "bestiarygridv70";
    box.insertBefore(bg, $("closecompendium"));
  }
  const enemyCards = Object.entries(ENEMIES || {}).map(([key, t]) => {
    const k = Number(S.bestiaryKillsV70["enemy:" + key]) || 0,
      locked = !k,
      symbol = t.shape === "beast" ? "🐾" : t.shape === "ghost" ? "👻" : t.shape === "block" ? "🪨" : "⚔";
    return (
      '<article class="beastcardv70 ' +
      (locked ? "locked" : "") +
      '" data-enemy="' +
      key +
      '">' +
      portraitV70(symbol, t.c || "#777", locked) +
      '<div><div class="beastnamev70">' +
      (locked ? "Unknown creature" : t.n) +
      '</div><div class="beastinfov70">' +
      enemyResearch(key, t, k) +
      "</div></div></article>"
    );
  });
  const bossCards = AREAS.map((a, i) => {
    const k = Number(S.bestiaryKillsV70["boss:" + i]) || 0,
      locked = !k;
    return (
      '<article class="beastcardv70 ' +
      (locked ? "locked" : "") +
      '" data-boss="' +
      i +
      '">' +
      portraitV70(a.sp, BOSSCOL[i] || "#b88a45", locked) +
      '<div><div class="beastnamev70">' +
      (locked ? "Unknown boss" : a.boss) +
      '</div><div class="beastinfov70">' +
      bossResearch(a, k) +
      "</div></div></article>"
    );
  });
  bg.innerHTML = enemyCards.concat(bossCards).join("");
}

function setupCompendiumTabsV72() {
  const box = $("compendium") && $("compendium").querySelector(".compbox"),
    grid = box && box.querySelector(".compgrid"),
    mythic = $("mythicreferencev38"),
    discovery = $("discoveryv70"),
    bestTitle = $("bestiarytitlev70"),
    best = $("bestiarygridv70");
  if (!box || !grid || !best || $("comptabsv72")) return;
  const tabs = document.createElement("nav");
  tabs.id = "comptabsv72";
  tabs.className = "comptabsv72";
  tabs.innerHTML =
    '<button data-page="field">✺ FIELD ARCHIVE</button><button data-page="tips">⚙ TIPS &amp; MECHANICS</button><button data-page="monsters">♛ MONSTER ARCHIVE</button>';
  box.querySelector(".skhead").insertAdjacentElement("afterend", tabs);
  const show = page => {
    grid.classList.toggle("compsectionv72hidden", page !== "tips");
    if (mythic) mythic.classList.toggle("compsectionv72hidden", page !== "field");
    if (discovery) discovery.classList.toggle("compsectionv72hidden", page !== "field");
    bestTitle.classList.toggle("compsectionv72hidden", page !== "monsters");
    best.classList.toggle("compsectionv72hidden", page !== "monsters");
    tabs.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.page === page));
  };
  tabs.querySelectorAll("button").forEach(b => (b.onclick = () => show(b.dataset.page)));
  show("field");
}

function decorateArchiveV73() {
  const grid = $("bestiarygridv70");
  if (!grid) return;
  grid.querySelectorAll(".beastcardv70:not(.locked)").forEach(card => {
    const kind = card.dataset.enemy ? "enemy" : "boss",
      id = card.dataset.enemy || card.dataset.boss,
      portrait = card.querySelector(".beastportraitv70");
    if (!portrait || portrait.dataset.actualV73) return;
    const src = actualPortrait(kind, id);
    if (src) {
      portrait.dataset.actualV73 = "1";
      portrait.innerHTML =
        '<img src="' +
        src +
        '" alt="' +
        (card.querySelector(".beastnamev70")?.textContent || "Monster") +
        ' mugshot">';
    }
  });
}

function orderCompendium() {
  const tabs = $("comptabsv72");
  if (!tabs) return;
  const order = ["monsters", "field", "tips"];
  order.forEach(id => {
    const b = tabs.querySelector('[data-page="' + id + '"]');
    if (b) {
      b.textContent =
        id === "monsters" ? "♛ MONSTER ARCHIVE" : id === "field" ? "✺ FIELD ARCHIVE" : "⚙ TIPS & MECHANICS";
      tabs.appendChild(b);
    }
  });
  if (!tabs.dataset.v74) {
    tabs.dataset.v74 = "1";
    const first = tabs.querySelector('[data-page="monsters"]');
    if (first) first.click();
  }
}

/* Area Mastery tab (Compendium). Phones cannot hover over area tiles, so the full mastery
   overview lives here; the area tiles only show the clear count and a medal border. */
function areaMasteryHtml() {
  ensureV51State();
  const T = MEDAL_THRESHOLDS,
    part = (abyss, map, clearedList) => {
      let rows = "";
      AREAS.forEach((a, i) => {
        const cleared = (clearedList || []).includes(i);
        if (!cleared && !(Number(map[i]) > 0)) return;
        const n = Number(map[i]) || 0,
          medal = medalForCountV51(n),
          r = masteryPreviewV52(i, abyss),
          next = n < T.bronze ? T.bronze : n < T.silver ? T.silver : n < T.gold ? T.gold : null,
          step = (need, label, text) =>
            '<div class="amstepv117' + (n >= need ? " done" : "") + '"><b>' + label + " · " + need + "</b> " + text + "</div>";
        rows +=
          '<div class="amrowv117 medal-' + medal + '"><div class="amheadv117"><span class="amsymv117">' + (a.sp || "◆") +
          '</span><span class="amnamev117">' + a.n + '</span><span class="amcountv117">×' + n + "</span></div>" +
          '<div class="ambarv117"><i style="width:' + (next ? Math.min(100, (n / next) * 100) : 100) + '%"></i></div>' +
          '<div class="amnextv117">' + (next ? next - n + " more clears to the next medal" : "All medals earned") + "</div>" +
          step(T.bronze, "Bronze", r.bronze) + step(T.silver, "Silver", r.silver) + step(T.gold, "Gold", r.gold) + "</div>";
      });
      return rows || '<div class="amemptyv117">Clear an area to start its mastery.</div>';
    };
  let html = '<div class="amintrov117">Every clear of an area counts. Medals at ' + T.bronze + ", " + T.silver + " and " + T.gold +
    " clears give lasting rewards. Area tiles show the clear count and the medal as their border.</div>";
  html += '<div class="amgridv117"><h3 class="amtitlev117">Regular areas</h3>' + part(false, S.areaClearsV51 || {}, S.clearedAreas);
  if (S.abyssUnlocked) html += '<h3 class="amtitlev117">Abyss</h3>' + part(true, S.abyssAreaClearsV51 || {}, S.abyssCleared);
  return html + "</div>";
}

function installAreaMasteryTab() {
  const tabs = $("comptabsv72"),
    box = $("compendium") && $("compendium").querySelector(".compbox");
  if (!tabs || !box) return;
  let sec = $("areamasteryv117");
  if (!sec) {
    sec = document.createElement("section");
    sec.id = "areamasteryv117";
    sec.className = "compsectionv72hidden";
    const close = $("closecompendium");
    box.insertBefore(sec, close || null);
  }
  if (!tabs.querySelector('[data-page="mastery"]')) {
    const b = document.createElement("button");
    b.dataset.page = "mastery";
    b.textContent = "★ AREA MASTERY";
    tabs.appendChild(b);
    const others = ["grid", "mythic", "discovery", "bestTitle", "best"];
    b.onclick = () => {
      box.querySelectorAll(".compgrid,#mythicreferencev38,#discoveryv70,#bestiarytitlev70,#bestiarygridv70").forEach(el =>
        el.classList.add("compsectionv72hidden")
      );
      sec.innerHTML = areaMasteryHtml();
      sec.classList.remove("compsectionv72hidden");
      tabs.querySelectorAll("button").forEach(x => x.classList.toggle("active", x === b));
    };
    // the other tabs hide this section again
    tabs.querySelectorAll('button:not([data-page="mastery"])').forEach(x =>
      x.addEventListener("click", () => sec.classList.add("compsectionv72hidden"))
    );
  }
}
