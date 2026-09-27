// node compare.js dirA dirB  -> compares JSON snapshots and screenshots
const fs=require('fs'),PNG=require('pngjs').PNG,pm=require('pixelmatch');
const [,,A,B]=process.argv; let bad=0;
for(const f of fs.readdirSync(A).sort()){
  if(!fs.existsSync(B+'/'+f)){console.log('MISSING',f);bad++;continue;}
  if(f.endsWith('.json')&&f!=='coverage.json'){const a=fs.readFileSync(A+'/'+f,'utf8'),b=fs.readFileSync(B+'/'+f,'utf8');
    if(a!==b){bad++;let i=0;while(a[i]===b[i])i++;console.log('DIFF',f,'@',i,'\n  A:',a.slice(Math.max(0,i-80),i+120).replace(/\n/g,' '),'\n  B:',b.slice(Math.max(0,i-80),i+120).replace(/\n/g,' '));}}
  if(f.endsWith('.png')){const a=PNG.sync.read(fs.readFileSync(A+'/'+f)),b=PNG.sync.read(fs.readFileSync(B+'/'+f));
    if(a.width!==b.width||a.height!==b.height){console.log('SIZE',f);bad++;continue;}
    const n=pm(a.data,b.data,null,a.width,a.height,{threshold:0.1});if(n>0){console.log('PIX',f,n);if(n>50)bad++;}}
}
console.log(bad?'FAIL '+bad:'IDENTICAL');
