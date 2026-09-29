/* ---- Count-up numbers: resources roll to their new value, forge/reforge results count from old to new ---- */
(function () {
  const reduced = () => {
    try {
      return window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {
      return false;
    }
  };
  const ease = t => 1 - Math.pow(1 - t, 3);

  // Top bar resources
  const RES = [
    ["gold", () => S.gold],
    ["shards", () => S.shards],
    ["eshards", () => S.epicShards],
    ["celestialshards", () => S.celestialShards || 0]
  ];
  const tw = {};
  function resFrame(now) {
    for (const [id, get] of RES) {
      const el = document.getElementById(id);
      if (!el) continue;
      let target = Math.floor(Number(get()) || 0);
      let t = tw[id];
      if (!t) {
        t = tw[id] = { shown: target, from: target, to: target, start: now, dur: 1 };
      }
      if (target !== t.to) {
        const up = target > t.to;
        t.from = t.shown;
        t.to = target;
        t.start = now;
        // Spending should feel instant-ish, gains get a visible roll
        t.dur = reduced() ? 1 : up ? 420 : 180;
        if (up && !reduced() && target - t.from >= 1) {
          el.classList.remove("cuPop");
          void el.offsetWidth;
          el.classList.add("cuPop");
        }
      }
      const k = Math.min(1, (now - t.start) / t.dur);
      t.shown = k >= 1 ? t.to : t.from + (t.to - t.from) * ease(k);
      const txt = fmtCur(t.shown);
      if (el.textContent !== txt) el.textContent = txt;
    }
    requestAnimationFrame(resFrame);
  }
  requestAnimationFrame(resFrame);

  // Forge and reforge result panels: count each stat from its old value to the new one
  function parseNum(s) {
    const m = String(s).replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return m ? { v: parseFloat(m[0]), dec: m[1] ? m[1].length - 1 : 0, raw: m[0] } : null;
  }
  function animatePanel(beforeId, afterId) {
    const before = document.getElementById(beforeId),
      after = document.getElementById(afterId);
    if (!before || !after || reduced()) return;
    const bRows = before.querySelectorAll(".rfstat b"),
      aRows = after.querySelectorAll(".rfstat");
    const jobs = [];
    aRows.forEach((row, i) => {
      const b = row.querySelector("b");
      if (!b || !bRows[i]) return;
      const node = [...b.childNodes].find(n => n.nodeType === 3 && /\d/.test(n.nodeValue));
      if (!node) return;
      const to = parseNum(node.nodeValue),
        from = parseNum(bRows[i].textContent);
      if (!to || !from || to.v === from.v) return;
      const tpl = node.nodeValue;
      jobs.push({ node, tpl, to, from });
      node.nodeValue = tpl.replace(to.raw, from.v.toFixed(to.dec));
    });
    if (!jobs.length) return;
    const start = performance.now(),
      dur = 650;
    (function step(now) {
      const k = Math.min(1, (now - start) / dur),
        e = ease(k);
      for (const j of jobs) {
        if (!j.node.isConnected) continue;
        const v = j.from.v + (j.to.v - j.from.v) * e;
        const s = k >= 1 ? j.to.raw : j.to.dec ? v.toFixed(j.to.dec) : Math.round(v).toLocaleString();
        j.node.nodeValue = j.tpl.replace(j.to.raw, s);
      }
      if (k < 1) requestAnimationFrame(step);
    })(start);
  }
  function watch(beforeId, afterId) {
    const after = document.getElementById(afterId);
    if (!after) return;
    let busy = false;
    new MutationObserver(() => {
      if (busy || !after.children.length) return;
      busy = true;
      // Let the game finish writing both columns first
      requestAnimationFrame(() => {
        animatePanel(beforeId, afterId);
        busy = false;
      });
    }).observe(after, { childList: true });
  }
  watch("forgebefore", "forgeafter");
  watch("reforgebefore", "reforgeafter");
})();
