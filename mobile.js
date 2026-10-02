/* The Forge mobile + save layer. Loaded after the game script. */
(function(){
"use strict";
var isTouch = matchMedia("(hover:none)").matches || matchMedia("(pointer:coarse)").matches;
var narrow = function(){ return innerWidth < 760 || innerHeight < 520; };
function $id(i){ return document.getElementById(i); }

/* ================= 1. INFO SHEET (replaces hover tooltips) ================= */
var sheet = document.createElement("div");
sheet.id = "fxInfo";
sheet.setAttribute("role","dialog");
sheet.innerHTML = '<div class="fxh"></div><div class="fxb"></div><div class="fxn"></div>';
document.body.appendChild(sheet);
var armedKey = null, selEl = null;

var TIP_SEL = ".ntip,.btip,.atip,.equippeditemtipv82";
var TARGET_SEL = ".node,.bchip,.atile,.slot,[title]";

function contentFor(el){
  var tip = el.querySelector(TIP_SEL);
  if (tip && tip.textContent.trim()) return {html: tip.innerHTML, head: headFor(el)};
  var t = el.closest("[title]");
  if (t && t.getAttribute("title")) return {text: t.getAttribute("title"), head: "Info"};
  return null;
}
function headFor(el){
  if (el.classList.contains("node")) return "Skill";
  if (el.classList.contains("bchip")) return el.closest("#inv,.gearbaggridv82,.gearbagv82") ? "Item" : "Boon";
  if (el.classList.contains("atile")) return "Ability";
  if (el.classList.contains("slot")) return "Equipped";
  return "Info";
}
/* Loot bag item: show it next to what is equipped in the same slot */
function compareFor(el){
  if (!el.classList.contains("bchip") || !el.closest("#inv")) return null;
  try {
    var chips = Array.prototype.slice.call(document.querySelectorAll("#inv .bchip"));
    var g = S.bag[chips.indexOf(el)]; if (!g) return null;
    var tip = el.querySelector(".btip"); if (!tip) return null;
    var cur = S.gear[g.slot];
    var newHtml = tip.innerHTML.replace(/<div[^>]*>\s*(click chip to equip|Drag onto[^<]*)\s*<\/div>/i, "");
    var curHtml = cur
      ? '<div class="bn" style="color:' + cvar(RAR[cur.rar].col) + '">' + cur.name + " +" + cur.plus + '</div><div class="bs">ilvl ' + cur.ilvl + "<br>" + gearDesc(cur) + "</div>"
      : '<div class="bs">Nothing equipped</div>';
    return { head: "Loot vs equipped", cmp: true,
      html: '<div class="fxcmp"><div class="fxcmpNew"><div class="fxcmpT">IN BAG</div>' + newHtml + '</div><div class="fxcmpCur"><div class="fxcmpT">EQUIPPED</div>' + curHtml + "</div></div>" };
  } catch (_) { return null; }
}
function showSheet(el, note){
  var c = compareFor(el) || contentFor(el); if (!c) return false;
  sheet.classList.toggle("fxCmp", !!c.cmp);
  sheet.querySelector(".fxh").textContent = c.head;
  var b = sheet.querySelector(".fxb");
  if (c.html != null) b.innerHTML = c.html; else b.textContent = c.text;
  sheet.querySelector(".fxn").textContent = note || "Tap anywhere to close";
  if (selEl) selEl.classList.remove("fxsel");
  selEl = el; el.classList.add("fxsel");
  // keep the sheet away from the thing that was tapped, so a second tap can reach it
  var r = el.getBoundingClientRect(), wide = innerWidth > innerHeight;
  sheet.classList.remove("fxTop", "fxLeft", "fxRight");
  sheet.style.left = sheet.style.right = sheet.style.width = "";
  if (wide) {
    // put the sheet on the side with more room and never over the tapped item
    var railW = 60, gap = 12, want = c.cmp ? 470 : 340;
    var freeL = r.left - railW - gap * 2, freeR = innerWidth - r.right - 30 - gap * 2;
    var leftSide = freeL >= freeR;
    var w = Math.max(200, Math.min(want, leftSide ? freeL : freeR));
    sheet.classList.add(leftSide ? "fxLeft" : "fxRight");
    sheet.style.width = w + "px";
    if (leftSide) sheet.style.left = Math.max(railW, r.left - gap - w) + "px";
    else { sheet.style.left = (r.right + gap) + "px"; sheet.style.right = "auto"; }
  }
  else if (r.top + r.height / 2 > innerHeight / 2) sheet.classList.add("fxTop");
  sheet.classList.add("on");
  return true;
}
function hideSheet(){
  sheet.classList.remove("on"); armedKey = null;
  if (selEl) { selEl.classList.remove("fxsel"); selEl = null; }
}
function nodeKey(el){
  var all = document.querySelectorAll(".node");
  return Array.prototype.indexOf.call(all, el) + "|" + (el.querySelector(".ntip b") || el).textContent;
}

var lastPointer = "mouse", pressTimer = null, pressStart = null, suppressClick = false;

document.addEventListener("pointerdown", function(e){
  lastPointer = e.pointerType || "mouse";
  if (lastPointer !== "touch") return;
  if (sheet.contains(e.target)) return;
  var el = e.target.closest(TARGET_SEL); if (!el) return;
  pressStart = {x:e.clientX, y:e.clientY};
  clearTimeout(pressTimer);
  pressTimer = setTimeout(function(){
    pressTimer = null;
    if (showSheet(el)) {
      suppressClick = true;
      armedKey = el.classList.contains("node") ? nodeKey(el) : null;
      if (navigator.vibrate) try{ navigator.vibrate(8); }catch(_){}
      setTimeout(function(){ suppressClick = false; }, 900);
    }
  }, 430);
}, true);
function cancelPress(e){
  if (!pressTimer) return;
  if (e.type === "pointermove" && pressStart && Math.hypot(e.clientX-pressStart.x, e.clientY-pressStart.y) < 10) return;
  clearTimeout(pressTimer); pressTimer = null;
}
["pointerup","pointercancel","pointermove"].forEach(function(t){ document.addEventListener(t, cancelPress, true); });
document.addEventListener("contextmenu", function(e){ if (lastPointer === "touch") e.preventDefault(); }, true);

document.addEventListener("click", function(e){
  if (lastPointer !== "touch") return;
  if (suppressClick) { suppressClick = false; e.preventDefault(); e.stopImmediatePropagation(); return; }
  if (sheet.contains(e.target)) {
    // a button in the sheet presses the same button on the real item
    var sb = e.target.closest(".fxb button");
    if (sb && selEl) {
      var mine = Array.prototype.slice.call(sheet.querySelectorAll(".fxb .fxcmpNew button, .fxb > * button")), i = mine.indexOf(sb);
      var real = selEl.querySelectorAll(TIP_SEL.split(",").map(function(t){ return t + " button"; }).join(","))[i];
      e.preventDefault(); e.stopImmediatePropagation();
      var target = selEl;
      hideSheet();
      if (real && !real.disabled) real.click();
      return;
    }
    hideSheet(); return;
  }
  var node = e.target.closest(".node");
  if (node) {
    var k = nodeKey(node);
    if (k !== armedKey) {           // first tap on a skill: preview only
      e.preventDefault(); e.stopImmediatePropagation();
      if (showSheet(node, "Tap the skill again to invest a point")) armedKey = k;
      return;
    }
    // second tap: let the game invest, then refresh the sheet
    setTimeout(function(){
      var fresh = document.querySelectorAll(".node")[parseInt(k,10)];
      if (fresh) { showSheet(fresh, "Tap the skill again to invest a point"); armedKey = nodeKey(fresh); }
    }, 60);
    return;
  }
  // loot bag: first tap shows the item, second tap equips it
  var chip = e.target.closest("#inv .bchip");
  if (chip && !e.target.closest("button,.lockbtn,[data-lock]")) {
    var ck = "bag|" + Array.prototype.indexOf.call(chip.parentNode.children, chip) + "|" + chip.textContent.slice(0, 60);
    if (ck !== armedKey) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (showSheet(chip, "Tap the item again to equip it")) armedKey = ck;
      return;
    }
    hideSheet();
    return;
  }
  if (sheet.classList.contains("on")) hideSheet();
}, true);

/* One-time hint */
function hintOnce(){
  try { if (localStorage.getItem("theForge.hintTouch")) return; localStorage.setItem("theForge.hintTouch","1"); } catch(_){ return; }
  var h = document.createElement("div"); h.id = "fxHint";
  h.textContent = "Tip: press and hold anything to see its details";
  document.body.appendChild(h);
  setTimeout(function(){ h.style.opacity = "0"; }, 4500);
  setTimeout(function(){ h.remove(); }, 5200);
}
if (isTouch) setTimeout(hintOnce, 1500);

/* ================= 2. STATS PANEL ON PHONES ================= */
function fixStats(){
  var p = $id("statpanel"); if (!p || !narrow()) return;
  try {
    if (typeof S === "object" && S && S.statsFoldedV72 === undefined) {
      S.statsFoldedV72 = true; p.classList.add("folded");
    }
  } catch(_){}
}
setTimeout(fixStats, 300);
// Tap outside the open stats panel folds it on phones
document.addEventListener("pointerdown", function(e){
  var p = $id("statpanel");
  if (!p || !narrow() || p.classList.contains("folded") || p.contains(e.target)) return;
  if (sheet.contains(e.target)) return;
  p.click();
}, true);

/* ================= 3. AUDIO WHEN APP IS BACKGROUNDED ================= */
// Sound effects: iPhone can leave the audio engine suspended after rotating, a call or
// switching apps. Every tap wakes it up again (a resume only works inside a tap).
function wakeSfx(){ try { if (typeof AC !== "undefined" && AC && AC.state !== "running") { var p = AC.resume(); if (p && p.catch) p.catch(function(){}); } } catch(_){} }
["touchend","pointerup","click"].forEach(function(t){ document.addEventListener(t, wakeSfx, true); });
addEventListener("orientationchange", function(){ setTimeout(wakeSfx, 300); });
var pausedByUs = [];
document.addEventListener("visibilitychange", function(){
  var auds = document.querySelectorAll("audio");
  if (document.hidden) {
    pausedByUs = [];
    auds.forEach(function(a){ if (!a.paused) { a.pause(); pausedByUs.push(a); } });
  } else {
    pausedByUs.forEach(function(a){ var p = a.play(); if (p && p.catch) p.catch(function(){}); });
    pausedByUs = [];
  }
});

/* ================= 3b. MUSIC VOLUME ON IPHONE =================
   iPhone ignores the volume of <audio> elements, so the music always played
   at full volume. Route the music through a Web Audio gain node instead, and
   make each element's .volume control that gain. */
var isIOSDevice = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
if ((isIOSDevice || /[?&]fxgain/.test(location.search)) && (window.AudioContext || window.webkitAudioContext)) (function(){
  var AC = window.AudioContext || window.webkitAudioContext, ctx = null, gains = new Map();
  var desc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume");
  var auds = Array.prototype.slice.call(document.querySelectorAll("audio"));
  auds.forEach(function(a){
    var v = 1; try { v = desc.get.call(a); } catch(_){}
    Object.defineProperty(a, "volume", {configurable:true,
      get: function(){ return v; },
      set: function(x){ v = Math.max(0, Math.min(1, +x || 0)); var g = gains.get(a); if (g) g.gain.value = v; }});
  });
  function hook(){
    if (ctx) { if (ctx.state !== "running") ctx.resume().catch(function(){}); return; }
    try { ctx = new AC(); } catch(_) { return; }
    auds.forEach(function(a){
      try { var src = ctx.createMediaElementSource(a), g = ctx.createGain(); g.gain.value = a.volume; src.connect(g); g.connect(ctx.destination); gains.set(a, g); } catch(_){}
    });
    window.__fxMusicGains = gains;
  }
  ["pointerdown","touchend","click","keydown"].forEach(function(t){ document.addEventListener(t, hook, true); });
  document.addEventListener("visibilitychange", function(){ if (!document.hidden && ctx && ctx.state !== "running") ctx.resume().catch(function(){}); });
})();

/* ================= 4. SAVE HARDENING ================= */
var KEY = (typeof SAVE_KEY === "string") ? SAVE_KEY : "theForge.v5.local";
var DB = "theForgeBackup", STORE = "saves", BACKUP_EVERY = 10*60*1000, BACKUPS_KEPT = 3;

// Ask the browser not to auto-delete our storage
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persisted().then(function(p){ if (!p) navigator.storage.persist(); }).catch(function(){});
}

function idb(){
  return new Promise(function(res, rej){
    if (!window.indexedDB) return rej("no idb");
    var r = indexedDB.open(DB, 1);
    r.onupgradeneeded = function(){ r.result.createObjectStore(STORE); };
    r.onsuccess = function(){ res(r.result); };
    r.onerror = function(){ rej(r.error); };
  });
}
function idbGet(k){ return idb().then(function(db){ return new Promise(function(res){ var q = db.transaction(STORE).objectStore(STORE).get(k); q.onsuccess = function(){ res(q.result); }; q.onerror = function(){ res(undefined); }; }); }); }
function idbPut(k, v){ return idb().then(function(db){ return new Promise(function(res){ var t = db.transaction(STORE,"readwrite"); t.objectStore(STORE).put(v, k); t.oncomplete = function(){ res(true); }; t.onerror = function(){ res(false); }; }); }); }

var mirrorTimer = null;
function mirrorNow(){
  clearTimeout(mirrorTimer); mirrorTimer = null;
  if (!mirrorReady) return;
  var raw; try { raw = localStorage.getItem(KEY); } catch(_){ return; }
  if (!raw) return;
  var now = Date.now();
  idbPut("latest", {t: now, raw: raw}).catch(function(){});
  idbGet("backups").then(function(list){
    list = Array.isArray(list) ? list : [];
    if (!list.length || now - list[0].t > BACKUP_EVERY) {
      list.unshift({t: now, raw: raw});
      idbPut("backups", list.slice(0, BACKUPS_KEPT));
    }
  }).catch(function(){});
}
function mirrorSoon(){ if (!mirrorTimer) mirrorTimer = setTimeout(mirrorNow, 2000); }

// Wrap the game's saveGame so every save is mirrored
if (typeof window.saveGame === "function") {
  var origSave = window.saveGame;
  window.saveGame = function(){ var r = origSave.apply(this, arguments); mirrorSoon(); return r; };
}
// Extra safety saves: every 15 s, and when the app is hidden or closed
setInterval(function(){ try { window.saveGame(true); } catch(_){} }, 15000);
function flush(){ try { window.saveGame(true); } catch(_){} mirrorNow(); }
window.addEventListener("pagehide", flush);
document.addEventListener("visibilitychange", function(){ if (document.hidden) flush(); });
window.addEventListener("freeze", flush);

// If the main save vanished (browser cleanup) but the backup survived, restore it.
// __forgeHadSave is recorded in <head> before the game can write a fresh save.
var mirrorReady = false;
(function restoreIfLost(){
  if (window.__forgeHadSave !== false) { mirrorReady = true; mirrorSoon(); return; }
  idbGet("latest").then(function(b){
    if (!b || !b.raw) { mirrorReady = true; return; }   // genuinely new player
    try { localStorage.setItem(KEY, b.raw); } catch(_){ mirrorReady = true; return; }
    try { sessionStorage.setItem("theForge.restored","1"); } catch(_){}
    window.saveGame = function(){};                     // keep the fresh game from overwriting it
    location.reload();
  }).catch(function(){ mirrorReady = true; });
})();
setTimeout(function(){
  var r; try { r = sessionStorage.getItem("theForge.restored"); sessionStorage.removeItem("theForge.restored"); } catch(_){}
  if (r && typeof showTip === "function") showTip("SAVE RESTORED", "Your browser had cleared the main save. It was recovered from the backup copy.");
}, 800);

// Restore one of the rolling backups (exposed for the Options menu)
window.forgeRestoreBackup = function(i){
  return idbGet("backups").then(function(list){
    if (!list || !list[i]) return false;
    if (!confirmRestore(list[i].t)) return false;
    try { localStorage.setItem(KEY, list[i].raw); } catch(_){ return false; }
    window.removeEventListener("pagehide", flush);
    window.saveGame = function(){};           // prevent the running game overwriting it
    location.reload(); return true;
  });
};
function confirmRestore(t){ return window.confirm("Replace your current progress with the backup from " + fmtAgo(t) + "?"); }

/* ---- Export through the phone's share sheet ---- */
var exportBtn = $id("exportsave");
if (exportBtn && typeof buildPortableSaveV19 === "function" && isTouch) {
  var origExport = exportBtn.onclick;
  exportBtn.onclick = function(ev){
    try {
      window.saveGame(true);
      var json = JSON.stringify(buildPortableSaveV19(), null, 2);
      var stamp = new Date().toISOString().slice(0,16).replace(/[-:T]/g,"_");
      var file = new File([json], "The_Forge_Save_" + stamp + ".json", {type: "application/json"});
      if (navigator.canShare && navigator.canShare({files:[file]})) {
        navigator.share({files:[file], title:"The Forge save"}).then(function(){
          if (typeof showTip === "function") showTip("SAVE FILE SHARED", "Store it somewhere safe, for example Files, Google Drive or a chat with yourself. Load it again with <b>LOAD FILE</b>.");
        }).catch(function(err){
          if (err && err.name === "AbortError") return;
          if (origExport) origExport.call(exportBtn, ev);
        });
        return;
      }
    } catch(_){}
    if (origExport) origExport.call(exportBtn, ev);
  };
}
// Accept save files regardless of how the phone labels their type
var fin = $id("savefileinput");
if (fin && isTouch) fin.removeAttribute("accept");

/* ---- Backups entry in the Options menu ---- */
function fmtAgo(t){ var m = Math.round((Date.now()-t)/60000); if (m < 1) return "just now"; if (m < 60) return m + " min ago"; var h = Math.round(m/60); if (h < 48) return h + " h ago"; return Math.round(h/24) + " days ago"; }
function addBackupButton(){
  var load = $id("optloadv95"); if (!load || $id("fxBackups")) return;
  var b = load.cloneNode(false);
  b.id = "fxBackups"; b.textContent = "⟲ Restore backup"; b.removeAttribute("title");
  load.parentNode.insertBefore(b, load.nextSibling);
  b.onclick = function(){
    idbGet("backups").then(function(list){
      list = Array.isArray(list) ? list : [];
      if (!list.length) { showTip("NO BACKUPS YET", "Automatic backups are made every 10 minutes while you play."); return; }
      var html = "Automatic backups on this device. Restoring replaces your current progress.<br><br>";
      list.forEach(function(x, i){ html += '<button class="go" style="width:100%;margin:4px 0" data-fxb="'+i+'">Backup from '+fmtAgo(x.t)+'</button>'; });
      showTip("RESTORE BACKUP", html);
      document.querySelectorAll("[data-fxb]").forEach(function(btn){
        btn.onclick = function(){ window.forgeRestoreBackup(parseInt(btn.getAttribute("data-fxb"),10)); };
      });
    });
  };
}
setTimeout(addBackupButton, 500);
new MutationObserver(function(){ if (!$id("fxBackups")) addBackupButton(); }).observe(document.body, {childList:true, subtree:true});


/* ================= 6. PLAYTEST MENU (moved from the shop to Options) ================= */
var PLAYTEST = [["early","Early"],["mid","Middle"],["late","End game"],["superlate","Super late"]];
var playtestUnlocked = false;
function inRunNow(){ try { return typeof run === "object" && run && !run.over && document.getElementById("run").style.display === "block"; } catch(_) { return false; } }
function openPlaytest(){
  if (inRunNow()) { showTip("LEAVE THE RUN FIRST", "Playtest presets replace your whole character, so they can only be loaded in town."); return; }
  if (!playtestUnlocked) {
    var entered = prompt("Enter playtest access code");
    if (entered == null) return;
    if (!(typeof playtestGateOk === "function" && playtestGateOk(entered))) {
      try { beep(120, 0.12, "square", 0.05); } catch(_){}
      showTip("ACCESS DENIED", "The playtest code is incorrect.");
      return;
    }
    playtestUnlocked = true; // until the game is closed
  }
  var html = 'Load a prepared progression point for testing. Each option replaces the current progress.<br><br>';
  function ptBtn(kind, label, half){
    var active = (typeof S === "object" && S && S.playtestPreset === kind) ? " ✓" : "";
    return '<button class="go fxpt" style="' + (half ? 'flex:1 1 0;min-width:0;padding:8px 4px;margin:0' : 'width:100%;margin:4px 0') + '" data-fxpt="' + kind + '">' + (half ? '' : '🧪 ') + label + active + '</button>';
  }
  PLAYTEST.forEach(function(p){ html += ptBtn(p[0], p[1]); });
  // build sets (524-playtest-builds.js): three styles at campaign end and at Abyss end
  [["campaign", "Campaign end · Omega · item level 160 ✦10"], ["abyss", "Abyss end · item level 240 ✦13"]].forEach(function(m){
    html += '<div style="margin:12px 0 4px;font-size:11px;letter-spacing:.5px;color:#9fd8ff">' + m[1] + '</div><div style="display:flex;gap:6px">' +
      ptBtn(m[0] + "-crit", "⚔ Crit", true) + ptBtn(m[0] + "-hybrid", "⚖ Hybrid", true) + ptBtn(m[0] + "-elemental", "✨ Elemental", true) + '</div>';
  });
  html += '<div style="margin-top:8px;font-size:10.5px;opacity:.75">Each set has every weapon type with every effect in its bag.</div>';
  showTip("PLAYTEST", html);
  document.querySelectorAll("[data-fxpt]").forEach(function(btn){
    btn.onclick = function(){
      var kind = btn.getAttribute("data-fxpt");
      var tip = $id("tipmodal"); if (tip) tip.classList.remove("on");
      var om = $id("optionsmodalv95"); if (om) om.classList.remove("on");
      if (typeof requestPlaytestPresetV20 === "function") requestPlaytestPresetV20(kind);
      try { if (typeof renderTown === "function") renderTown(); } catch(_){}
    };
  });
}
function addPlaytestButton(){
  var credits = $id("creditsbtnv95"); if (!credits || $id("fxPlaytest")) return;
  var b = document.createElement("button");
  b.id = "fxPlaytest"; b.type = "button"; b.textContent = "🧪 Playtest";
  credits.parentNode.insertBefore(b, credits);
  b.onclick = openPlaytest;
}
setTimeout(addPlaytestButton, 500);
new MutationObserver(function(){ if (!$id("fxPlaytest")) addPlaytestButton(); }).observe(document.body, {childList:true, subtree:true});

/* ================= 8. NO KEYBOARD TALK ON TOUCH SCREENS ================= */
if (isTouch) {
  try { if (typeof ROCK_KEEPER_LINES !== "undefined") for (var ri = ROCK_KEEPER_LINES.length - 1; ri >= 0; ri--) if (/\b(space|enter|keyboard|hotkey)\b/i.test(ROCK_KEEPER_LINES[ri])) ROCK_KEEPER_LINES.splice(ri, 1); } catch(_){}
}

/* ================= 9. SHOP, GUILD AND SKILLS ARE TOWN-ONLY ================= */
document.addEventListener("click", function(e){
  var b = e.target.closest && e.target.closest("#shopbtn,#guildbtnv70,#opentree");
  if (!b || !inRunNow()) return;
  e.preventDefault(); e.stopImmediatePropagation();
  if (typeof showTip === "function") showTip("IN COMBAT", "The Shop, the Guild and the Skill Tree open in town. Finish or leave the fight first.");
}, true);

/* ================= 10. ONE TAP IS ENOUGH ON LIVE-UPDATING SCREENS =================
   Screens that redraw themselves every moment (the mine) can make iPhone treat the first
   tap as a "hover". These buttons act on touch release instead, and ignore the extra click. */
var FAST_TAP = "#mineclaimv83,.mineupgradev84 button";
var fastTapUntil = 0, lastDown = null;
document.addEventListener("pointerdown", function(e){ lastDown = {x: e.clientX, y: e.clientY}; }, true);
document.addEventListener("pointerup", function(e){
  if (e.pointerType !== "touch") return;
  var b = e.target.closest && e.target.closest(FAST_TAP);
  if (!b || b.disabled) return;
  if (lastDown && Math.hypot(e.clientX - lastDown.x, e.clientY - lastDown.y) > 12) return;
  fastTapUntil = Date.now() + 700;
  e.preventDefault();
  b.click();
  fastTapUntil = Date.now() + 700;
}, true);
document.addEventListener("click", function(e){
  if (Date.now() < fastTapUntil && e.isTrusted && e.target.closest && e.target.closest(FAST_TAP)) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);

/* ================= 7. KEEP THE SCREEN ON DURING A FIGHT ================= */
var wakeLock = null;
function wantAwake(){ return !document.hidden && inRunNow(); }
function syncWake(){
  if (!("wakeLock" in navigator)) return;
  if (wantAwake() && !wakeLock) {
    navigator.wakeLock.request("screen").then(function(l){ wakeLock = l; l.addEventListener("release", function(){ wakeLock = null; }); }).catch(function(){});
  } else if (!wantAwake() && wakeLock) { try { wakeLock.release(); } catch(_){} wakeLock = null; }
}
setInterval(syncWake, 2000);
document.addEventListener("visibilitychange", syncWake);

/* ================= 5. OFFLINE SUPPORT ================= */
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  navigator.serviceWorker.register("sw.js").catch(function(){});
}
})();
