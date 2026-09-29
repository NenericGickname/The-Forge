const { chromium } = require('playwright');
const fs = require('fs');
const BOT = fs.readFileSync(__dirname + '/bot.js', 'utf8');
const CLOCK = fs.readFileSync(__dirname + '/clock.js', 'utf8');
const SEED = `(()=>{let a=42;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};HTMLMediaElement.prototype.play=function(){return Promise.resolve()};})();`;
(async () => {
  const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: 1280, height: 800 } })).newPage();
  p.on('pageerror', e => console.log('ERR', e.message.slice(0,150)));
  await p.addInitScript(CLOCK);
  await p.addInitScript(SEED); await p.addInitScript(BOT);
  await p.goto('http://localhost:8766/index.html'); await p.waitForTimeout(300); await p.evaluate(() => __advance(2000));
  await p.evaluate(() => window.__bot.start({}));
  const steps = process.argv.slice(2);
  for (const s of steps) { if (/^\d+$/.test(s)) { const t=Date.now(); await p.evaluate(ms => { for (let i = 0; i < ms / 5000; i++) __advance(5000); }, +s); console.log('ran',s,'in',Date.now()-t,'ms'); } else if (s.startsWith('shot:')) await p.screenshot({path:'/tmp/claude-0/'+s.slice(5)+'.png'}); else console.log(JSON.stringify(await p.evaluate(s))); }
  await b.close();
})();
