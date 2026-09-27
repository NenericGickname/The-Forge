const fs=require('fs'),espree=require('espree'),escope=require('eslint-scope');
function count(f){const h=fs.readFileSync(f,'utf8');const re=/<script>([\s\S]*?)<\/script>/g;let m;const L={};
while((m=re.exec(h))){const ast=espree.parse(m[1],{ecmaVersion:'latest',range:true});const g=escope.analyze(ast,{ecmaVersion:2022}).globalScope;
 g.variables.forEach(v=>v.defs.forEach(d=>{if(d.type==='FunctionName'&&d.node.type==='FunctionDeclaration')L[v.name]=(L[v.name]||0)+1;}));
 const refs=[];g.variables.forEach(v=>v.references.forEach(r=>refs.push(r)));g.through.forEach(r=>refs.push(r));
 refs.forEach(r=>{if(r.isWrite()&&r.writeExpr&&/Function/.test(r.writeExpr.type))L[r.identifier.name]=(L[r.identifier.name]||0)+1;});}
const multi=Object.entries(L).filter(x=>x[1]>1);return {multi:multi.length,extra:multi.reduce((a,b)=>a+b[1]-1,0),top:multi.sort((a,b)=>b[1]-a[1]).slice(0,16).map(x=>x.join(':')).join(' ')};}
for(const f of process.argv.slice(2))console.log(f,JSON.stringify(count(f)));
