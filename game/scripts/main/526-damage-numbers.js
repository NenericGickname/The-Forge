/* Damage numbers (Doc, 2026-10-02):
   - numbers of 10,000 and up are shortened: 10k … 999k, 1.05M … 999M, then 1.05B
   - effect damage (poison, burn, lightning, bleed, doom, combust) floats in its own lane to the
     right of the enemy, weapon hits to the left, both with random scatter so they do not stack
   - effect numbers get a dark outline so they stay readable over the scene */
function shortDamageNumber(n) {
  if (!Number.isFinite(n)) return String(n);
  const a = Math.abs(n),
    sign = n < 0 ? "-" : "";
  if (a < 10000) return sign + Math.round(a);
  if (a < 999500) return sign + Math.round(a / 1000) + "k";
  if (a < 999.5e6) return sign + stripZeros((a / 1e6).toPrecision(3)) + "M";
  return sign + stripZeros((a / 1e9).toPrecision(3)) + "B";
}
function stripZeros(s) {
  return s.indexOf(".") >= 0 ? s.replace(/0+$/, "").replace(/\.$/, "") : s;
}
function shortenNumbersIn(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode()))
    node.nodeValue = node.nodeValue.replace(/\d[\d,]*(?:\.\d+)?/g, m => {
      const v = Number(m.replace(/,/g, ""));
      return v >= 10000 ? shortDamageNumber(v) : m;
    });
}
const EFFECT_COLOURS = ["#7fe07f", "#9be07f", "#ff8a3a", "#ffe14d", "#fff2a0", "#b91430", "#ff6a2f", "#8c43c9", "#6f239d"];
{
  const floatDmgBeforeNumbers = floatDmg;
  floatDmg = function (side, val, tier, color, x) {
    const b = $("battle"),
      before = b ? b.children.length : 0;
    const result = floatDmgBeforeNumbers.apply(this, arguments);
    if (!b) return result;
    const lc = String(color || "").toLowerCase(),
      effect = EFFECT_COLOURS.includes(lc) || (typeof val === "string" && (tier || 0) === 0);
    for (let i = before; i < b.children.length; i++) {
      const d = b.children[i];
      if (!d.classList || !d.classList.contains("dmg")) continue;
      shortenNumbersIn(d);
      const r = Math.random;
      if (side === "foe" && !(tier >= 2)) {
        if (effect) {
          d.classList.add("fxnumv126");
          d.style.marginLeft = Math.round(18 + r() * 30) + "px";
          d.style.marginTop = Math.round(-22 + r() * 22) + "px";
        } else {
          d.style.marginLeft = Math.round(-30 + r() * 24) + "px";
          d.style.marginTop = Math.round(-6 + r() * 14) + "px";
        }
      } else if (side === "hero") {
        d.style.marginLeft = Math.round(-12 + r() * 24) + "px";
        d.style.marginTop = Math.round(-8 + r() * 12) + "px";
      }
    }
    return result;
  };
  const st = document.createElement("style");
  st.textContent =
    ".dmg.fxnumv126{font-size:15px;font-weight:900;letter-spacing:.2px;text-shadow:0 0 2px #000,1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,0 0 7px rgba(0,0,0,.8)}" +
    ".dmg:not(.crit){text-shadow:0 0 2px #000,1px 1px 0 #000,-1px 1px 0 #000}";
  document.head.appendChild(st);
  window.shortDamageNumber = shortDamageNumber;
}
