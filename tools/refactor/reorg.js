// Split the unified game script into files by system, then format them.
// usage: node reorg.js in.html outGameDir
//   outGameDir/page.html                 skeleton (styles + one script marker)
//   outGameDir/styles/*.css              formatted CSS
//   outGameDir/scripts/main/00-header.js "use strict" and globals
//   outGameDir/scripts/main/1x-<system>.js   every function declaration, grouped by system
//                                          (declarations are hoisted, so their place in the script does not matter)
//   outGameDir/scripts/main/5xx-setup-*.js  everything else, in the original order (data, patch layers, start-up)
const fs = require('fs'), path = require('path'), espree = require('espree'), prettier = require('prettier');
const [,, IN, OUTDIR] = process.argv;
const html = fs.readFileSync(IN, 'utf8');

const SYSTEMS = [
  ['playtest', /playtest|preset|developer|superlate|normallate/i], ['guild', /guild|contract|offer|bounty|pity|discipline/i], ['mine', /mine|miner|cart(?!ogr)/i], ['shop', /shop|rockkeeper|insight|keeper|price|buy/i],
  ['compendium', /compendium|bestiar|archive|codex|discover|reference/i],
  ['quests', /quest|goal|onboard|guide|tour|teach|taught|notice|feature|unlock|coach|target|first10|efx|research/i],
  ['skills', /skill|tree|master|node|active|loadout|boon|medal|spec|^act|dursec|cdsec|powval|buffon|purgedebuff|^activate|stripfaith|invested|resetcost|^pips/i],
  ['save', /save|load|portable|normali[sz]e|defaultstate|migrat|export|import|backup|persist|carryidentity|legacyxp/i],
  ['audio', /music|sfx|beep|audio|sound|duck|speech|tone|mp3|track|tempo|chord|actx|basevol|^ramp|rebornCry/i],
  ['forge', /forge|reforge|upgrade|upcost|rfcost|rfgold|anvil|celestial|celround|strike|shatter|guard|milestone|smith|conversion|currency|hardhat/i],
  ['items', /gear|item|affix|statroll|rar|mythic|weapon|dagger|sword|axe|bow|legend|bloodforg|variant|drop|loot|bag|salvage|slot|growth|legacy|gpower|maxbaseroll|gstat|stat/i],
  ['combat', /tick|foe|hero|wave|run|boss|elite|enemy|abilit|cast|damage|dmg|crit|dodge|leech|poison|burn|frost|freeze|doom|enrage|spawn|kill|retreat|hunt|abyss|rush|summon|thorn|status|heal|mech|dummy|training|area|stage|xp|level|combat|fight|omega|gimmick|attack|hit|mitig|resist|pierce|swing|speed/i],
  ['ui', /render|draw|show|update|panel|modal|hud|float|flash|shake|fmt|format|icon|art|html|tooltip|tip|nav|button|screen|town|canvas|particle|sprite|layout|popup|recap|meter|bar|toast|chip|card|label|text|color|esc|setupui|tray|menu|portrait|badge|settab|arrow|drag|css|decorate|observer|^star|^plus|^hide$|^position|comparison|frame|trackrow/i],
];
const DESCR = {
  playtest: 'Playtest presets and developer helpers.',
  guild: 'Mercenaries Guild: contracts, offers, cooldowns.', mine: 'The Deep Mine: crew, cart, earnings, upgrades.',
  shop: "Smith's Shop and the rock shopkeeper.", compendium: 'Compendium: bestiary, field archive, tips.',
  quests: 'Quests, onboarding guidance, feature unlocks, notices.', skills: 'Passive skill tree, masteries, active skills, boons and medals.',
  save: 'Game state: defaults, migrations, local save, portable save files.', audio: 'Music and sound effects.',
  forge: 'The Anvil: upgrading, reforging, celestial forging, break guards.',
  items: 'Items: generation, stats, affixes, rarities, mythics, loot bag and salvage.',
  combat: 'Runs and combat: waves, enemies, bosses, hero, damage, status effects, boss hunt, abyss.',
  ui: 'Town screen and general interface: rendering, panels, popups, floating numbers, canvas drawing.',
  misc: 'Helpers that do not belong to one system.',
};
function systemOf(name) { for (const [s, re] of SYSTEMS) if (re.test(name)) return s; return 'misc'; }

(async () => {
  // styles and page skeleton
  if (fs.existsSync(OUTDIR)) fs.rmSync(OUTDIR, {recursive: true});
  fs.mkdirSync(path.join(OUTDIR, 'styles'), {recursive: true}); fs.mkdirSync(path.join(OUTDIR, 'scripts', 'main'), {recursive: true});
  let page = html, si = 0;
  const styleFiles = [];
  page = page.replace(/<style>([\s\S]*?)<\/style>/g, (mm, css) => { const name = String(si++).padStart(2, '0') + '-styles.css'; styleFiles.push([name, css]); return '<!--@style ' + name + '-->'; });
  const sm = /<script>([\s\S]*?)<\/script>/.exec(page);
  const src = sm[1];
  page = page.slice(0, sm.index) + '<!--@script main-->' + page.slice(sm.index + sm[0].length);
  page = page.replace(/src="silent\.mp3"/g, (x) => x); // audio ids fixed below
  page = page.replace(/<audio id="([^"]+)"([^>]*?)src="silent\.mp3"/g, '<audio id="$1"$2src="audio/$1.mp3"');
  fs.writeFileSync(path.join(OUTDIR, 'page.html'), page);
  for (const [name, css] of styleFiles) {
    let out = css; try { out = await prettier.format(css, {parser: 'css', printWidth: 120}); } catch (e) { console.log('css not formatted', name, e.message.slice(0, 80)); }
    fs.writeFileSync(path.join(OUTDIR, 'styles', name), out);
  }

  const ast = espree.parse(src, {ecmaVersion: 'latest', range: true, comment: true});
  const body = ast.body;
  const chunk = i => src.slice(i ? body[i - 1].range[1] : 0, body[i].range[1]);
  // header: the "use strict" directive and the implicit-globals line
  let h = 0; const header = [];
  while (h < body.length && (body[h].directive || (body[h].type === 'VariableDeclaration' && body[h].kind === 'var' && body[h].declarations.every(d => !d.init)))) { header.push(chunk(h)); h++; }
  const bySystem = {}; const stream = [];
  for (let i = h; i < body.length; i++) {
    const st = body[i];
    if (st.type === 'FunctionDeclaration') {
      const leadTxt = src.slice(i ? body[i - 1].range[1] : 0, st.range[0]);
      const chainM = leadTxt.match(/@chain ([A-Za-z_$][\w$]*)/);
      const sys = systemOf(chainM ? chainM[1] : st.id.name);
      // keep a short leading comment with the function, drop long section banners into the stream
      const lead = src.slice(i ? body[i - 1].range[1] : 0, st.range[0]);
      const comments = (lead.match(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g) || []).filter(c => !/={4,}|-{4,}|@chain/.test(c));
      if (chainM && chainM[1] !== st.id.name) comments.push('// Earlier version of ' + chainM[1] + '(), extended by the functions that follow.');
      (bySystem[sys] = bySystem[sys] || []).push((comments.length ? comments.join('\n') + '\n' : '') + src.slice(st.range[0], st.range[1]));
    } else stream.push({i, text: chunk(i)});
  }
  const files = [];
  files.push(['00-header.js', '/* The Forge. All game code runs as one strict script, built from the files in this folder\n   in name order (see tools/build.py). Function declarations live in the 1x-*.js system files;\n   everything that has to run in a set order at start-up lives in the 5xx-setup files. */\n' + header.join('')]);
  const order = [...SYSTEMS.map(s => s[0]), 'misc'];
  order.forEach((sys, k) => { if (!bySystem[sys]) return;
    files.push([(10 + k) + '-' + sys + '.js', '/* ' + DESCR[sys] + ' */\n\n' + bySystem[sys].join('\n\n') + '\n']); });
  // setup stream: cut at section banners into files of reasonable size
  let cur = [], curTitle = 'start', n = 0, size = 0;
  const flush = () => { if (!cur.length) return; files.push([(500 + n++) + '-setup-' + curTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) + '.js', cur.join('')]); cur = []; size = 0; };
  for (const s of stream) {
    const t = s.text.match(/(?:\/\/|\/\*)\s*=+\s*([^=\n*]{3,80}?)\s*=+/);
    if (t && size > 15000) { flush(); curTitle = t[1]; }
    else if (t && !cur.length) curTitle = t[1];
    cur.push(s.text); size += s.text.length;
  }
  flush();
  for (const [name, text] of files) {
    let out = text;
    try { out = await prettier.format(text, {parser: 'babel', printWidth: 110, trailingComma: 'none', arrowParens: 'avoid'}); }
    catch (e) { console.log('not formatted:', name, e.message.split('\n')[0]); }
    fs.writeFileSync(path.join(OUTDIR, 'scripts', 'main', name), out);
  }
  console.log('files:', files.length, Object.fromEntries(Object.entries(bySystem).map(([k, v]) => [k, v.length])));
})();
