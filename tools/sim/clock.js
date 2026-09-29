// Synchronous virtual clock: replaces timers and time so the page can be advanced as fast as the CPU allows.
(function () {
  let vnow = window.__simStart || Date.parse("2026-01-01T10:00:00Z"), perf0 = vnow, seq = 1;
  const timers = new Map(); // id -> {at, fn, args, every}
  const RD = Date;
  function VDate(...a) { return a.length ? new RD(...a) : new RD(vnow); }
  VDate.now = () => vnow; VDate.parse = RD.parse; VDate.UTC = RD.UTC; VDate.prototype = RD.prototype;
  window.Date = VDate;
  performance.now = () => vnow - perf0;
  const add = (fn, ms, args, every) => { const id = seq++; timers.set(id, { at: vnow + Math.max(0, +ms || 0), fn, args, every: every ? Math.max(4, +ms || 0) : 0 }); return id; };
  window.setTimeout = (fn, ms, ...args) => add(fn, ms, args, false);
  window.setInterval = (fn, ms, ...args) => add(fn, ms, args, true);
  window.clearTimeout = window.clearInterval = id => timers.delete(id);
  window.requestAnimationFrame = cb => add(() => cb(performance.now()), 1000, [], false);
  window.cancelAnimationFrame = id => timers.delete(id);
  window.__advance = function (ms) {
    const end = vnow + ms;
    let fired = 0;
    for (;;) {
      let nid = null, nat = Infinity;
      for (const [id, t] of timers) if (t.at < nat) { nat = t.at; nid = id; }
      if (nid === null || nat > end) break;
      const t = timers.get(nid);
      vnow = Math.max(vnow, nat);
      if (t.every) t.at = vnow + t.every; else timers.delete(nid);
      try { typeof t.fn === "function" ? t.fn(...t.args) : eval(t.fn); } catch (e) { (window.__timerErr = window.__timerErr || {})[String(e && e.message).slice(0, 100)] = ((window.__timerErr || {})[String(e && e.message).slice(0, 100)] || 0) + 1; }
      fired++;
    }
    vnow = end;
    return fired;
  };
})();
