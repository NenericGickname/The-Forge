/* The Forge landscape phone layout: side rail, no-scroll pages, paged lists. */
(function(){
"use strict";
function $id(i){ return document.getElementById(i); }
var MQ = matchMedia("(orientation: landscape) and (max-height: 520px)");
var body = document.body;

/* ---------- mode switch ---------- */
function applyMode(){
  body.classList.toggle("fxL", MQ.matches);
  body.classList.toggle("fxPortraitPhone", matchMedia("(orientation: portrait) and (max-width: 520px)").matches);
  if (MQ.matches) { repaginateAll(); }
}
if (MQ.addEventListener) MQ.addEventListener("change", applyMode); else MQ.addListener(applyMode);
addEventListener("resize", function(){ clearTimeout(applyMode._t); applyMode._t = setTimeout(applyMode, 120); });

/* ---------- tag town sections so CSS can place them ---------- */
function tagTown(){
  var t = $id("town"); if (!t) return;
  Array.prototype.forEach.call(t.children, function(el){
    if (el.querySelector("#slots")) el.classList.add("fxLoadout");
    else if (el.querySelector("#opentree")) el.classList.add("fxHeroCol");
    else if (el.querySelector("#inv")) el.classList.add("fxBagCol");
    else if (el.querySelector("#areas")) el.classList.add("fxAreas");
  });
}
tagTown(); setInterval(tagTown, 1500);

/* ---------- side rail ---------- */
var ITEMS = [
  {k:"forge",   ic:"🛡",  lb:"Gear",    page:"forge"},
  {k:"anvil",   ic:"⚒",  lb:"Anvil",   page:"anvil"},
  {k:"adv",     ic:"🗺",  lb:"Areas",   page:"adv"},
  {k:"skills",  ic:"🌳", lb:"Skills",  btn:"opentree", ov:"sktree", town:true},
  {k:"quests",  ic:"📜", lb:"Quests",  btn:"questbtnv74", ov:"questsv74"},
  {k:"shop",    ic:"🛒", lb:"Shop",    btn:"shopbtn", ov:"shop", town:true},
  {k:"guild",   ic:"⚔",  lb:"Guild",   btn:"guildbtnv70", ov:"guildv70", town:true},
  {k:"mine",    ic:"⛏",  lb:"Mine",    btn:"minebtnv83", ov:"minev83"},
  {k:"comp",    ic:"📖", lb:"Book",    btn:"compendiumbtn", ov:"compendium"},
  {k:"opts",    ic:"⚙",  lb:"Options", btn:"optionsbtnv95", ov:"optionsmodalv95"}
];
var rail = document.createElement("nav");
rail.id = "fxRail";
rail.innerHTML = ITEMS.map(function(it){
  return '<button type="button" data-k="'+it.k+'"><span class="ri">'+it.ic+'</span><span class="rl">'+it.lb+'</span><i class="rb"></i></button>';
}).join("");
body.appendChild(rail);

var page = "forge";
function setPage(p){
  page = p;
  body.classList.toggle("fxPageForge", p === "forge");
  body.classList.toggle("fxPageAnvil", p === "anvil");
  body.classList.toggle("fxPageAdv", p === "adv");
  repaginateAll();
  syncRail();
}

function closeOverlays(except){
  document.querySelectorAll(".skover.on").forEach(function(o){
    if (o.id === except || o.id === "tipmodal") return;
    // Use the popup's own close button when it has one, so the game can tidy up
    var c = o.querySelector("#closeshop,#closeguildv70,#closeminev83,#closecompendium,#closequestsv74,#optdonev95,#closetree,.skclose");
    if (c) c.click(); if (o.classList.contains("on")) o.classList.remove("on");
  });
  var sp = $id("statpanel"); if (sp && !sp.classList.contains("folded")) sp.click();
}

rail.addEventListener("click", function(e){
  var b = e.target.closest("button[data-k]"); if (!b || b.classList.contains("off")) return;
  var it = ITEMS.filter(function(x){ return x.k === b.dataset.k; })[0];
  if (it.page) { closeOverlays(); if (!inRun()) setPage(it.page); return; }
  if (it.stats) {
    var open = $id("statpanel") && !$id("statpanel").classList.contains("folded");
    closeOverlays(); if (!open) { var sp = $id("statpanel"); if (sp) sp.click(); }
    syncRail(); return;
  }
  var ov = $id(it.ov);
  if (ov && ov.classList.contains("on")) { closeOverlays(); syncRail(); return; }
  closeOverlays(it.ov);
  var src = $id(it.btn); if (src) src.click();
  setTimeout(function(){ repaginateAll(); syncRail(); }, 60);
});

function inRun(){ var r = $id("run"); return !!(r && getComputedStyle(r).display !== "none" && r.offsetHeight > 0); }
function shown(el){
  if (!el) return false;
  var cs = getComputedStyle(el);
  return cs.display !== "none" && cs.visibility !== "hidden";
}
function syncRail(){
  var run = inRun();
  body.classList.toggle("fxInRun", run);
  ITEMS.forEach(function(it){
    var b = rail.querySelector('[data-k="'+it.k+'"]');
    var vis = true, active = false, badge = false;
    if (it.btn) {
      var src = $id(it.btn);
      vis = !!src && shown(src);
      active = !!($id(it.ov) && $id(it.ov).classList.contains("on"));
      badge = !!(src && src.querySelector(".skbadgeV112,.glow,.badge"));
      if (it.k === "skills" && src) { var n = $id("spcount"); badge = !!(n && parseInt(n.textContent,10) > 0); }
    } else if (it.page) {
      active = !run && page === it.page && !document.querySelector(".skover.on:not(#tipmodal)");
      b.classList.toggle("off", run);
    } else if (it.stats) {
      var sp = $id("statpanel"); active = !!(sp && !sp.classList.contains("folded"));
    }
    if (it.town) b.classList.toggle("off", run);
    b.style.display = vis ? "" : "none";
    b.classList.toggle("on", active);
    b.classList.toggle("badge", badge);
  });
}
setInterval(function(){ if (body.classList.contains("fxL")) syncRail(); }, 400);

/* ---------- paged lists (no scrolling) ---------- */
var PAGED = [
  "#inv", "#areas", ".questgridv74", ".contractgridv70", ".bestiarygridv70", ".compgrid", ".amgridv117",
  "#shopgrid", ".questtrackergridv74"
];
var pagers = new WeakMap();

function pagerFor(list){
  var st = pagers.get(list);
  if (st) return st;
  st = {page: 0, pages: 1, bar: null, busy: false};
  var bar = document.createElement("div");
  bar.className = "fxPager";
  bar.innerHTML = '<button type="button" class="pp">‹</button><span class="pn"></span><button type="button" class="np">›</button>';
  bar.querySelector(".pp").onclick = function(e){ e.stopPropagation(); go(list, -1); };
  bar.querySelector(".np").onclick = function(e){ e.stopPropagation(); go(list, 1); };
  st.bar = bar;
  pagers.set(list, st);
  // swipe
  var sx = null, sy = null;
  list.addEventListener("touchstart", function(e){ if (!body.classList.contains("fxL")) return; var t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, {passive:true});
  list.addEventListener("touchend", function(e){
    if (sx == null) return; var t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy; sx = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) go(list, dx < 0 ? 1 : -1);
  }, {passive:true});
  new MutationObserver(function(){ if (!st.busy) schedule(list); }).observe(list, {childList:true});
  return st;
}
function go(list, d){ var st = pagerFor(list); st.page = Math.max(0, Math.min(st.pages - 1, st.page + d)); paginate(list); }

var queued = new Set(), rafOn = false;
function schedule(list){ queued.add(list); if (!rafOn) { rafOn = true; requestAnimationFrame(function(){ rafOn = false; var q = Array.from(queued); queued.clear(); q.forEach(paginate); }); } }

function paginate(list){
  var st = pagerFor(list);
  st.busy = true;
  var kids = Array.prototype.filter.call(list.children, function(c){ return !c.classList.contains("fxPager"); });
  kids.forEach(function(c){ c.classList.remove("fxHidden"); });
  if (!body.classList.contains("fxL") || !list.offsetParent) {
    if (st.bar.parentNode) st.bar.remove();
    st.busy = false; return;
  }
  // Put the pager bar right after the list so the list's own height excludes it
  if (st.bar.parentNode !== list.parentNode || st.bar.previousElementSibling !== list) list.parentNode.insertBefore(st.bar, list.nextSibling);
  st.bar.style.display = "flex";
  var H = list.clientHeight;
  if (list.scrollHeight <= H + 2 || H < 20) {
    st.bar.style.display = "none"; st.pages = 1; st.page = 0; st.busy = false; return;
  }
  // Group children into pages by their row position
  var top0 = list.getBoundingClientRect().top + (parseFloat(getComputedStyle(list).paddingTop) || 0);
  var pageOf = [], pageStart = 0, p = 0;
  kids.forEach(function(c){
    var r = c.getBoundingClientRect();
    if (r.height === 0 && r.width === 0) { pageOf.push(p); return; }
    var t = r.top - top0, b = r.bottom - top0;
    if (b - pageStart > H - 1 && t > pageStart + 1) { p++; pageStart = t; }
    pageOf.push(p);
  });
  // A short heading at the bottom of a page moves to the next page, next to what it labels
  for (var i = kids.length - 2; i >= 0; i--) {
    if (pageOf[i] !== pageOf[i+1] && kids[i].getBoundingClientRect().height < 26) pageOf[i] = pageOf[i+1];
  }
  st.pages = p + 1;
  if (st.page >= st.pages) st.page = st.pages - 1;
  kids.forEach(function(c, i){ if (pageOf[i] !== st.page) c.classList.add("fxHidden"); });
  // Safety pass: anything still sticking out at the bottom moves to the next page
  var guard = 0;
  while (list.scrollHeight > list.clientHeight + 2 && guard++ < 20) {
    var vis = kids.filter(function(c, i){ return pageOf[i] === st.page; });
    if (vis.length < 2) break;
    var last = vis[vis.length - 1], li = kids.indexOf(last);
    for (var j = li; j < kids.length; j++) if (pageOf[j] === st.page) pageOf[j] = st.page + 1;
    last.classList.add("fxHidden");
    st.pages = Math.max(st.pages, st.page + 2);
  }
  st.bar.querySelector(".pn").textContent = (st.page + 1) + " / " + st.pages;
  st.bar.querySelector(".pp").disabled = st.page === 0;
  st.bar.querySelector(".np").disabled = st.page >= st.pages - 1;
  st.busy = false;
}
function markGrow(){
  document.querySelectorAll(".skover.on .compbox").forEach(function(box){
    var best = null, bh = 0;
    Array.prototype.forEach.call(box.children, function(ch){
      ch.classList.remove("fxGrow");
      if (getComputedStyle(ch).display === "none") return;
      if (/skhead|comptabs|fxPager|ghost/.test(ch.className) || ch.tagName === "H3" || ch.tagName === "BUTTON") return;
      var h = ch.scrollHeight; if (h > bh) { bh = h; best = ch; }
    });
    if (best) { best.classList.add("fxGrow"); if (best.id !== "areamasteryv117") { pagerFor(best); schedule(best); } }
  });
}
/* Shrink-to-fit for things that should stay whole (skill tree branches) */
var ZOOMFIT = ["#branches .branch"];
function fitZooms(){
  var on = body.classList.contains("fxL");
  ZOOMFIT.forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){
      el.style.zoom = "";
      if (!on || !el.offsetParent) return;
      var avail = el.parentNode.clientHeight, need = el.scrollHeight;
      if (need > avail + 1 && avail > 40) el.style.zoom = Math.max(0.55, (avail - 2) / need).toFixed(3);
    });
  });
}
function repaginateAll(){
  fitZooms();
  if (body.classList.contains("fxL")) markGrow();
  PAGED.forEach(function(sel){ document.querySelectorAll(sel).forEach(function(l){ pagerFor(l); schedule(l); }); });
}
// Lists can appear, be re-created or change size at any time
setInterval(function(){ if (body.classList.contains("fxL")) repaginateAll(); }, 700);

/* ---------- battle scene height ----------
   Safari sizes a canvas in a grid by its own pixel height, which pushes the
   scene over the health bars. So the scene gets an explicit height here. */
function sizeBattle(){
  var bat = $id("battle"); if (!bat) return;
  if (!body.classList.contains("fxL") || !bat.offsetHeight) { bat.style.removeProperty("--fxCvH"); return; }
  var cs = getComputedStyle(bat), gap = parseFloat(cs.rowGap) || 3;
  var inner = bat.clientHeight - (parseFloat(cs.paddingTop) || 0) - (parseFloat(cs.paddingBottom) || 0);
  var h = function(sel){ var e = bat.querySelector(sel); return e ? e.offsetHeight : 0; };
  var bottom = Math.max(h(".hprow>.hpwrap:first-child") + gap + h(".runbtns"), h("#foehps"));
  var cv = Math.max(60, Math.floor(inner - h("#wave") - h("#rmsg") - bottom - gap * 4));
  bat.style.setProperty("--fxCvH", cv + "px");
}
setInterval(sizeBattle, 300);
addEventListener("resize", function(){ setTimeout(sizeBattle, 50); });

/* ---------- full screen ----------
   Android: go full screen on the first tap while held sideways.
   iPhone Safari cannot do that for web pages, only the installed app is full screen. */
var standalone = matchMedia("(display-mode: standalone)").matches || matchMedia("(display-mode: fullscreen)").matches || navigator.standalone === true;
var de = document.documentElement;
var canFS = !!(de.requestFullscreen || de.webkitRequestFullscreen) && !/iPhone|iPod/.test(navigator.userAgent);
document.addEventListener("pointerup", function(){
  if (!canFS || standalone || !body.classList.contains("fxL")) return;
  if (document.fullscreenElement || document.webkitFullscreenElement) return;
  try { var r = (de.requestFullscreen || de.webkitRequestFullscreen).call(de, {navigationUI: "hide"}); if (r && r.catch) r.catch(function(){}); } catch(_){}
}, true);
var isIOS = /iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
if (isIOS && !standalone) {
  var fsHint = document.createElement("div");
  fsHint.id = "fxInstall";
  fsHint.innerHTML = 'For full screen without the Safari bars: tap <b>Share</b> <span class="sh">⬆︎</span> then <b>Add to Home Screen</b>, and play from the new icon. <button type="button">✕</button>';
  fsHint.querySelector("button").onclick = function(){ fsHint.remove(); try{ localStorage.setItem("fxInstallDismissed", String(Date.now())); }catch(_){} };
  var last = 0; try { last = +localStorage.getItem("fxInstallDismissed") || 0; } catch(_){}
  if (Date.now() - last > 3 * 864e5) body.appendChild(fsHint);
}

/* ---------- hero level lives in the Skills screen; selected item details on the Anvil page ---------- */
function syncExtras(){
  if (!body.classList.contains("fxL")) return;
  var head = document.querySelector("#sktree .skhead");
  if (head) {
    var hi = $id("fxHeroInfo");
    if (!hi) { hi = document.createElement("div"); hi.id = "fxHeroInfo"; hi.innerHTML = '<span class="hl"></span><span class="hx"><i></i></span>'; head.appendChild(hi); }
    var lv = $id("herolvl"), fill = $id("xpfill");
    if (lv) hi.querySelector(".hl").innerHTML = "Hero " + lv.innerHTML.replace(/^\s*Level\s*/i, "Lv ").replace(/\s*xp\s*$/i, " XP");
    if (fill) hi.querySelector(".hx i").style.width = fill.style.width;
  }
  var anvil = $id("fsel") && $id("fsel").closest(".panel");
  if (anvil) {
    var box = $id("fxAnvilItem");
    if (!box) { box = document.createElement("div"); box.id = "fxAnvilItem"; anvil.insertBefore(box, $id("fsel").nextSibling); }
    var sel = document.querySelector("#slots .slot.sel");
    var st = sel && sel.querySelector(".slstats"), nm = sel && sel.querySelector(".st"), ic = sel && sel.querySelector(".in");
    var html = sel ? '<div class="fxai-h">' + (ic ? ic.innerHTML : "") + '</div>' + (st ? st.innerHTML : "") : '<div class="fxai-empty">Tap an item on the left to forge it.</div>';
    if (box._h !== html) { box.innerHTML = html; box._h = html; }
  }
}
setInterval(syncExtras, 400);

/* ---------- portrait hint ---------- */
var hint = document.createElement("div");
hint.id = "fxRotate";
hint.innerHTML = '<span class="ph">📱</span> Turn your phone sideways for the full layout <button type="button">✕</button>';
hint.querySelector("button").onclick = function(){ hint.remove(); try{ sessionStorage.setItem("fxRotateDismissed","1"); }catch(_){} };
try { if (!sessionStorage.getItem("fxRotateDismissed")) body.appendChild(hint); } catch(_) { body.appendChild(hint); }

setPage("forge");
applyMode();
syncRail();
})();
