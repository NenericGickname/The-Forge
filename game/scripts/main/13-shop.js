/* Smith's Shop and the rock shopkeeper. */

function upgradeInsightCard(grid) {
  const card = [...grid.querySelectorAll(".shopcard")].find(el => {
    const t = el.querySelector(".sn");
    return t && t.textContent.includes("Tome of Insight");
  });
  if (!card) return;
  const cost = xpBuffCost(),
    remaining = xpBuffRemaining(),
    desc = card.querySelector(".sd"),
    own = card.querySelector(".sown"),
    btn = card.querySelector("button");
  if (desc)
    desc.textContent =
      "Double all experience gained for five real minutes. Buying again adds another five minutes.";
  if (own) own.textContent = remaining ? "Active · " + xpBuffTime(remaining) + " remaining" : "Inactive";
  btn.disabled = S.gold < cost;
  btn.innerHTML = 'Buy <span class="pc" style="color:var(--gold)">' + fmt(cost) + "g</span>";
  btn.onclick = () => {
    if (S.gold < cost) return;
    S.gold -= cost;
    activateXpBuff();
    beep(760, 0.1, "triangle");
    flash(cvar("--uncommon"));
    renderShop();
    renderTown();
  };
}

function decorateShopCards(grid) {
  let refineIndex = 0;
  grid.querySelectorAll(".shopcard").forEach(card => {
    const title = card.querySelector(".sn");
    if (!title || title.querySelector(".shopoptionicon")) return;
    const raw = title.textContent.trim(),
      space = raw.indexOf(" "),
      name = space >= 0 ? raw.slice(space + 1) : raw;
    let icon = "✦";
    if (name.includes("Bag Expansion")) icon = "🎒";
    else if (name.includes("Tome of Insight")) icon = "📖";
    else if (name.includes("Gear Set")) icon = "⚔️";
    else if (name.includes("Lesser Guard")) icon = "🛡️";
    else if (name.includes("Forge Guard")) icon = "🔷";
    else if (name.includes("Greater Guard")) icon = "💠";
    else if (name.includes("Master Guard")) icon = "👑";
    else if (name.includes("Refine Epic Shards")) icon = refineIndex++ ? "✦" : "◆";
    title.textContent = "";
    const i = document.createElement("span"),
      n = document.createElement("span");
    i.className = "shopoptionicon";
    i.textContent = icon;
    n.className = "shopoptionname";
    n.textContent = name;
    title.append(i, n);
  });
}

function speakRockKeeper(pool = ROCK_KEEPER_LINES, poke = false) {
  const bubble = $("shopkeeperbubble"),
    keeper = $("rockkeeper");
  if (!bubble || !keeper) return;
  let last = poke ? rockKeeperLastPoke : rockKeeperLast,
    index = Math.floor(Math.random() * pool.length);
  if (index === last) index = (index + 1) % pool.length;
  if (poke) rockKeeperLastPoke = index;
  else rockKeeperLast = index;
  bubble.textContent = pool[index];
  bubble.classList.remove("on");
  void bubble.offsetWidth;
  bubble.classList.add("on");
  keeper.classList.add("talking");
  clearTimeout(rockKeeperTimer);
  clearTimeout(rockKeeperTalkTimer);
  rockKeeperTalkTimer = setTimeout(() => keeper.classList.remove("talking"), 2600);
  rockKeeperTimer = setTimeout(() => bubble.classList.remove("on"), 6500);
  beep(105, 0.05, "square", 0.025);
}

function pokeRockKeeper() {
  rockKeeperClicks++;
  clearTimeout(rockKeeperClickTimer);
  rockKeeperClickTimer = setTimeout(() => (rockKeeperClicks = 0), 1200);
  if (rockKeeperClicks >= 3) {
    rockKeeperClicks = 0;
    speakRockKeeper(ROCK_KEEPER_POKE_LINES, true);
  } else speakRockKeeper();
}

// skill tree
// Earlier version of canBuy(), extended by the functions that follow.
function canBuyBase(n) {
  const rank = S.skills[n.id] || 0;
  if (rank >= n.max) return false;
  if (n.req && !(S.skills[n.req] > 0)) return false;
  return S.sp > 0;
}

/* Skill budget and one active combat discipline. */
function canBuy(node) {
  return regularSkillSpendV70() < SKILL_BUDGET && canBuyBase(node);
}
