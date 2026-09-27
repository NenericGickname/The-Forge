// Deterministic regression harness: node harness.js <page.html> <outdir>
const { chromium } = require('playwright');
const fs = require('fs');
const PAGE = process.argv[2], OUT = process.argv[3];
fs.mkdirSync(OUT, {recursive:true});
const SEEDRNG = `(()=>{function mk(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
 const logic=mk(1234567), render=mk(7654321); let inRAF=0;
 Math.random=function(){return inRAF?render():logic();};
 const raf=window.requestAnimationFrame; window.requestAnimationFrame=function(cb){return raf.call(window,function(t){inRAF++;try{return cb(t);}finally{inRAF--;}});};
 try{window.speechSynthesis&&(window.speechSynthesis.speak=function(){})}catch(e){}
 HTMLMediaElement.prototype.play=function(){return Promise.resolve()};})();`;
function stable(o){ if(Array.isArray(o)) return o.map(stable); if(o&&typeof o==='object'){const r={};Object.keys(o).sort().forEach(k=>r[k]=stable(o[k]));return r;} return o; }
(async()=>{
 const b = await chromium.launch();
 const results = {}; const COV = process.env.COV ? {} : null; const crypto=require('crypto');
 async function scenario(name, fn){
  const c = await b.newContext({viewport:{width:1280,height:800}});
  const p = await c.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept(d.type()==='prompt'?'test':undefined));
  if (COV) await p.coverage.startJSCoverage({resetOnNavigation:false, reportAnonymousScripts:true});
  await p.clock.install({time:new Date('2026-01-01T10:00:00Z')}); await p.clock.pauseAt(new Date('2026-01-01T10:00:01Z'));
  await p.addInitScript(SEEDRNG);
  await p.goto('http://localhost:'+(process.env.PORT||8770)+'/'+PAGE);
  try{ await p.clock.runFor(1500); }catch(e){ errs.push('LOAD: '+e.message.split('\n')[0]); }
  let n=0;
  const H = {
   p,
   run: async ms=>{ try{ await p.clock.runFor(ms); }catch(e){ errs.push('RUN: '+e.message.split('\n')[0]); } },
   ff: ms=>p.clock.fastForward(ms),
   tips: async()=>{ for(let i=0;i<10;i++){ const on=await p.evaluate(()=>{const t=document.getElementById('tipmodal');return !!(t&&t.classList.contains('on'))}); if(!on)break; await p.evaluate(()=>document.getElementById('tipok').click()); await p.clock.runFor(300);} },
   click: async sel=>{ await p.evaluate(s=>{const e=document.querySelector(s); if(e) e.click(); else throw new Error('missing '+s);},sel); await p.clock.runFor(300); },
   js: (f,a)=>p.evaluate(f,a),
   snap: async label=>{
     await H.tips();
     const data = await p.evaluate(()=>({S:JSON.parse(JSON.stringify(S)), text:(document.getElementById('wrap')||document.body).innerText, overlays:[...document.querySelectorAll('.skover.on,.overlay.on')].map(e=>e.id)}));
     data.S = stable(data.S);
     const key = String(++n).padStart(2,'0')+'_'+label;
     fs.writeFileSync(`${OUT}/${name}_${key}.json`, JSON.stringify(data,null,1));
     await p.screenshot({path:`${OUT}/${name}_${key}.png`, animations:'disabled', mask:[p.locator('canvas')]});
   }
  };
  try { await fn(H); } catch(e){ errs.push('HARNESS: '+e.message); }
  fs.writeFileSync(`${OUT}/${name}_errors.json`, JSON.stringify(errs,null,1));
  results[name]=errs.length;
  if (COV) { const cov = await p.coverage.stopJSCoverage(); for (const e of cov) { const h = crypto.createHash('sha1').update(e.source||'').digest('hex').slice(0,12); COV[h] = COV[h] || {len:(e.source||'').length, fns:{}}; for (const f of e.functions) { const r=f.ranges[0]; const k=r.startOffset+'-'+r.endOffset; COV[h].fns[k]=(COV[h].fns[k]||0)+r.count; } } }
  await c.close();
 }
 await scenario('fresh', async H=>{
  await H.snap('start');
  await H.click('#areas .atile'); await H.run(60000); await H.snap('run1');
  await H.run(60000); await H.tips(); await H.snap('run1b');
  for(let i=0;i<3;i++){ await H.tips(); await H.js(()=>{const r=document.getElementById('run'); if(r.style.display!=='block'){document.querySelector('#areas .atile').click();}}); await H.run(90000); }
  await H.snap('runs');
  await H.js(()=>{S.gold+=50000;renderTown();});
  await H.click('#slots .slot'); await H.click('#upbtn'); await H.click('#upbtn'); await H.click('#rfbtn'); await H.snap('forge');
  await H.click('#salvageall'); await H.snap('salvage');
  await H.click('#opentree'); await H.snap('tree'); 
 });
 await scenario('mid', async H=>{
  await H.js(()=>{applyPlaytestPresetV18('mid');renderTown();}); await H.tips(); await H.snap('preset');
  await H.js(()=>document.querySelectorAll('#areas .atile')[4].click()); await H.run(120000); await H.tips(); await H.snap('area5');
  await H.run(120000); await H.tips(); await H.snap('area5b');
  await H.js(()=>{const t=[...document.querySelectorAll('.node.can')].slice(0,6); t.forEach(n=>n.click());}); await H.run(500); await H.snap('skills');
  await H.click('#shopbtn'); await H.js(()=>{const b=[...document.querySelectorAll('#shopgrid button')].filter(x=>!x.disabled).slice(0,3);b.forEach(x=>x.click());}); await H.run(500); await H.snap('shop');
  await H.js(()=>document.querySelectorAll('.skover.on').forEach(e=>e.classList.remove('on')));
  await H.js(()=>{const g=document.getElementById('guildbtnv70'); g&&g.click();}); await H.run(500); await H.snap('guild');
  await H.js(()=>{const b=document.querySelector('#contractgridv70 button:not([disabled])'); b&&b.click();}); await H.run(120000); await H.tips(); await H.snap('guildrun');
  await H.ff(3700000); await H.run(2000); await H.tips(); await H.js(()=>{const m=document.getElementById('minebtnv83'); m&&m.click();}); await H.run(500); await H.snap('mine');
  await H.js(()=>{const b=[...document.querySelectorAll('#minev83 button')].find(x=>/claim/i.test(x.textContent)); b&&b.click();}); await H.run(500); await H.snap('mineclaim');
  await H.js(()=>document.querySelectorAll('.skover.on').forEach(e=>e.classList.remove('on')));
  await H.js(()=>{const h=document.getElementById('huntstart'); h&&h.click();}); await H.run(150000); await H.tips(); await H.snap('hunt');
  await H.js(()=>{const q=document.getElementById('questbtnv74'); q&&q.click();}); await H.run(300); await H.js(()=>document.querySelectorAll('.questclaimtrackv84,.questgridv74 button').forEach(b=>b.click())); await H.run(500); await H.snap('quests');
 });
 await scenario('late', async H=>{
  await H.js(()=>{applyPlaytestPresetV18('late');renderTown();}); await H.tips(); await H.snap('preset');
  await H.js(()=>{const a=document.querySelectorAll('#areas .atile:not(.lock)');a[a.length-2].click();}); await H.run(150000); await H.tips(); await H.snap('lateRun');
  await H.js(()=>{const c=document.getElementById('compendiumbtn'); c&&c.click();}); await H.run(400); await H.snap('comp');
  await H.js(()=>document.querySelectorAll('.skover.on').forEach(e=>e.classList.remove('on')));
  const exp = await H.js(()=>JSON.stringify(buildPortableSaveV19()));
  { const o=JSON.parse(exp); delete o.exportedAt; require('fs').writeFileSync(`${OUT}/late_export.json`, JSON.stringify(stable(o),null,1)); }
  await H.js(e=>{const next=stateFromPortableV19(JSON.parse(e)); normalizeStateV5({version:5,state:next,lastArea:null}); renderTown();},exp); await H.run(500); await H.snap('reimport');
 });
 await scenario('super', async H=>{
  await H.js(()=>{applyPlaytestPresetV18('superlate');renderTown();}); await H.tips(); await H.snap('superlate');
  await H.js(()=>{const a=document.querySelectorAll('#areas .atile:not(.lock)');a[Math.min(12,a.length-1)].click();}); await H.run(150000); await H.tips(); await H.snap('superRun');
 });
 if (COV) fs.writeFileSync(OUT+'/coverage.json', JSON.stringify(COV));
 console.log(JSON.stringify(results));
 await b.close();
})();
