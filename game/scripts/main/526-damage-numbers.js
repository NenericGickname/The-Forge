/* Damage numbers (Doc, 2026-10-02, revised same day):
   - full numbers with thousands separators (k/M shortening was rejected as less pretty)
   - effect ticks (poison, burn, lightning, combust) on one enemy are summed into a single number
     about every half second, as in Diablo and Path of Exile, instead of one number per tick
   - one visual system: same font and dark outline for every number; meaning by size and colour
     · weapon hits: small, light
     · effects: own lane right of the enemy, effect colour
     · crits: largest, on top of everything, gold rim and a short pop, so they never drown
   - weapon hits float left of the enemy, effects right, both with random scatter */
const EFFECT_COLOURS = ["#7fe07f", "#9be07f", "#ff8a3a", "#ffe14d", "#fff2a0", "#ff6a2f"];
function fullDamageNumber(n) {
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : String(n);
}
function fullNumbersIn(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode()))
    node.nodeValue = node.nodeValue.replace(/\d{4,}(?:\.\d+)?/g, m => fullDamageNumber(Number(m)));
}
{
  const floatDmgBeforeNumbers = floatDmg,
    pending = new Map(); // key -> { el, sum, timer }
  const AGG_MS = 520;
  function place(d, side, tier, effect) {
    const r = Math.random;
    if (side === "foe" && !(tier >= 1)) {
      if (effect) {
        d.style.marginLeft = Math.round(34 + r() * 26) + "px";
        d.style.marginTop = Math.round(18 + r() * 20) + "px"; // below-right, clear of the crit spot
      } else {
        d.style.marginLeft = Math.round(-34 + r() * 22) + "px";
        d.style.marginTop = Math.round(-4 + r() * 12) + "px";
      }
    } else if (side === "foe") {
      // crits rotate through three spots so back-to-back crits never cover each other
      const slots = [[-26, -24], [12, -2], [-8, -50]],
        s = slots[(place.crit = ((place.crit || 0) + 1) % slots.length)];
      d.style.marginLeft = Math.round(s[0] + r() * 8) + "px";
      d.style.marginTop = s[1] + "px";
    } else {
      d.style.marginLeft = Math.round(-12 + r() * 24) + "px";
      d.style.marginTop = Math.round(-8 + r() * 12) + "px";
    }
  }
  floatDmg = function (side, val, tier, color, x) {
    const b = $("battle"),
      before = b ? b.children.length : 0;
    const result = floatDmgBeforeNumbers.apply(this, arguments);
    if (!b) return result;
    const lc = String(color || "").toLowerCase(),
      numeric = typeof val === "number",
      effect = EFFECT_COLOURS.includes(lc) || (!numeric && (tier || 0) === 0 && side === "foe");
    for (let i = b.children.length - 1; i >= before; i--) {
      const d = b.children[i];
      if (!d.classList || !d.classList.contains("dmg")) continue;
      d.classList.add("numv127");
      if ((tier || 0) >= 1) d.classList.add("critv127");
      else if (effect) d.classList.add("fxv127");
      else if (side === "foe") d.classList.add("hitv127");
      fullNumbersIn(d);
      // sum effect ticks per enemy and colour
      if (side === "foe" && numeric && effect && !(tier >= 1) && run) {
        const key = Math.round((x == null ? 405 : x) / 30) + lc,
          p = pending.get(key);
        if (p) {
          p.sum += val;
          d.remove();
          continue;
        }
        d.style.display = "none";
        const entry = { el: d, sum: val };
        pending.set(key, entry);
        entry.timer = setTimeout(() => {
          pending.delete(key);
          if (!d.isConnected) b.appendChild(d);
          d.textContent = fullDamageNumber(entry.sum);
          d.style.display = "";
          d.style.animation = "none";
          void d.offsetWidth;
          d.style.animation = "";
          place(d, side, tier, true);
          setTimeout(() => d.remove(), 1000);
        }, AGG_MS);
        continue;
      }
      place(d, side, tier, effect);
    }
    return result;
  };
  const st = document.createElement("style");
  st.textContent =
    ".dmg.numv127{font-family:inherit;font-weight:900;letter-spacing:.2px;text-shadow:0 0 2px #000,1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000}" +
    ".dmg.hitv127{font-size:12px;opacity:.82;z-index:3}" +
    ".dmg.fxv127{font-size:14px;z-index:4}" +
    ".dmg.critv127{z-index:6;-webkit-text-stroke:.6px #2a1a00;text-shadow:0 0 2px #000,1px 1px 0 #000,-1px -1px 0 #000,0 0 10px #ffcf5c,0 0 18px currentColor;animation:critpopv127 1.05s ease-out forwards}" +
    ".dmg.critv127 .clbl{color:#ffe7a8;text-shadow:0 0 2px #000,1px 1px 0 #000}" +
    "@keyframes critpopv127{0%{opacity:0;transform:scale(.6)}12%{opacity:1;transform:scale(1.18)}24%{transform:scale(1)}75%{opacity:1;transform:translateY(-12px)}100%{opacity:0;transform:translateY(-26px)}}";
  document.head.appendChild(st);
  window.fullDamageNumber = fullDamageNumber;
}
