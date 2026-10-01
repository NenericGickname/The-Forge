/* Item archetypes. Every item rolls one when it drops:
   - Precise:   full crit chance and crit damage, never Elemental Amp (not even as a new affix)
   - Balanced:  reduced crit and crit damage, may roll a reduced Elemental Amp
   - Elemental: weak crit and crit damage, always a very strong Elemental Amp where the slot allows it
   The factors apply when stats are read, so forging, reforging and Celestial all respect them. */
const ARCHETYPES = {
  crit: { n: "Precise", i: "⚔", col: "#ffcf5c", crit: 1, amp: 0, d: "strong crit, no Elemental Amp" },
  balanced: { n: "Balanced", i: "⚖", col: "#bfe0ff", crit: 0.7, amp: 0.7, d: "moderate crit and Elemental Amp" },
  elemental: { n: "Elemental", i: "✨", col: "#c98bff", crit: 0.35, amp: 1.7, d: "weak crit, very strong Elemental Amp" }
};
const ARCH_CRIT_STATS = { critChance: 1, critDmg: 1 };
function archTune() {
  return (typeof window !== "undefined" && window.__archTune) || {};
}
function archFactors(a) {
  const base = ARCHETYPES[a] || ARCHETYPES.crit,
    t = archTune()[a] || {};
  return { crit: t.crit != null ? t.crit : base.crit, amp: t.amp != null ? t.amp : base.amp };
}
function slotAllowsAmp(g) {
  const sd = SLOTS.find(s => s.key === (g && g.slot));
  return !!(sd && sd.affixes && sd.affixes.includes("elementAmp"));
}
function rollArchetype() {
  const r = Math.random(),
    t = archTune().odds || [0.45, 0.3];
  return r < t[0] ? "crit" : r < t[0] + t[1] ? "balanced" : "elemental";
}
function inferArchetype(g) {
  const s = (g && g.stats) || {};
  if (!(s.elementAmp > 0)) return "crit";
  const sd = SLOTS.find(x => x.key === g.slot),
    critAffix = Object.keys(s).some(k => ARCH_CRIT_STATS[k] && !(sd && sd.main === k) && !(g.wtype === "bow" && k === "critChance"));
  return critAffix ? "balanced" : "elemental";
}
function archReplacementAffix(g) {
  try {
    if (g.slot === "weapon" && typeof weaponPool === "function" && typeof weightedAffix === "function") {
      const pool = weaponPool(g).filter(x => x !== "elementAmp" && !(x in g.stats));
      return weightedAffix(g, pool);
    }
    const sd = SLOTS.find(x => x.key === g.slot),
      pool = (sd ? sd.affixes : []).filter(x => x !== sd.main && x !== "elementAmp" && !(x in g.stats));
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
  } catch (e) {
    return null;
  }
}
function applyArchetype(g) {
  if (!g || !g.stats || !g.slot || g.archRolled) return g;
  g.archRolled = true;
  g.archetype = rollArchetype();
  if (g.archetype === "crit" && g.stats.elementAmp != null) {
    delete g.stats.elementAmp;
    const st = archReplacementAffix(g);
    if (st) g.stats[st] = statRoll(st, g.ilvl, g.rar);
  }
  if (g.archetype === "elemental" && slotAllowsAmp(g) && !(g.stats.elementAmp > 0)) {
    const sd = SLOTS.find(x => x.key === g.slot),
      keep = k => k === "atk" || (sd && k === sd.main) || EXCL.has(k) || (g.wtype === "bow" && k === "critChance"),
      swap = Object.keys(g.stats).filter(k => !keep(k));
    // prefer giving up a crit affix, otherwise any ordinary affix
    const out = swap.find(k => ARCH_CRIT_STATS[k]) || swap[Math.floor(Math.random() * swap.length)];
    if (out) delete g.stats[out];
    g.stats.elementAmp = statRoll("elementAmp", g.ilvl, g.rar);
  }
  return g;
}
function itemArchetype(g) {
  if (!g) return "crit";
  if (!g.archetype) g.archetype = inferArchetype(g);
  return g.archetype;
}
{
  const wrapMaker = name => {
    const prev = window[name];
    if (typeof prev !== "function") return;
    window[name] = function () {
      return applyArchetype(prev.apply(this, arguments));
    };
  };
  wrapMaker("makeWeapon");
  wrapMaker("makeGear");
  makeWeapon = window.makeWeapon;
  makeGear = window.makeGear;

  const gStatBeforeArch = gStat;
  gStat = function (g, stat) {
    const v = gStatBeforeArch(g, stat);
    if (!g || !(ARCH_CRIT_STATS[stat] || stat === "elementAmp")) return v;
    const f = archFactors(itemArchetype(g));
    return v * (stat === "elementAmp" ? f.amp : f.crit);
  };

  const addAffixBeforeArch = addAffix;
  addAffix = function (g) {
    let st = addAffixBeforeArch.apply(this, arguments);
    if (st === "elementAmp" && g && itemArchetype(g) === "crit") {
      delete g.stats.elementAmp;
      st = archReplacementAffix(g);
      if (st) g.stats[st] = statRoll(st, g.ilvl, g.rar);
    }
    return st;
  };

  const copyArch = (ng, old) => {
    if (ng && old) {
      ng.archetype = itemArchetype(old);
      ng.archRolled = true;
    }
    return ng;
  };
  const reforgeBeforeArch = makeReforgeCandidate;
  makeReforgeCandidate = function (old) {
    return copyArch(reforgeBeforeArch.apply(this, arguments), old);
  };
  const carryBeforeArch = carryIdentity;
  carryIdentity = function (ng, old) {
    return copyArch(carryBeforeArch.apply(this, arguments), old);
  };
  const portableBeforeArch = portableItem;
  portableItem = function (raw) {
    const g = portableBeforeArch.apply(this, arguments);
    if (g && raw && ARCHETYPES[raw.archetype]) {
      g.archetype = raw.archetype;
      g.archRolled = true;
    }
    return g;
  };

  // No label in the tooltip: the type shows in the stats themselves (Doc, 2026-10-01).
}
