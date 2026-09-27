// report the deepest block nesting per function (after formatting-independent AST walk)
const fs=require('fs'),espree=require('espree');const h=fs.readFileSync(process.argv[2],'utf8');const src=/<script>([\s\S]*?)<\/script>/.exec(h)[1];
const ast=espree.parse(src,{ecmaVersion:'latest',range:true});const res=[];
(function rec(n,fnName){if(!n||typeof n.type!=='string')return;
 if(/Function/.test(n.type)){let mx=0;(function d(x,k){if(!x||typeof x.type!=='string')return;if(/Function/.test(x.type)&&x!==n)return;const kk=(x.type==='BlockStatement'||x.type==='LabeledStatement')?k+1:k;if(kk>mx)mx=kk;for(const q in x){if(q==='range')continue;const v=x[q];if(Array.isArray(v))v.forEach(c=>d(c,kk));else if(v&&typeof v.type==='string')d(v,kk);}})(n.body,0);res.push([mx,fnName||'?',n.range[1]-n.range[0]]);}
 for(const k in n){if(k==='range')continue;const v=n[k];let nm=fnName;if(n.type==='FunctionDeclaration')nm=n.id.name;if(n.type==='AssignmentExpression'&&n.left.type==='Identifier')nm=n.left.name;if(Array.isArray(v))v.forEach(c=>rec(c,nm));else if(v&&typeof v.type==='string')rec(v,nm);}})(ast,null);
res.sort((a,b)=>b[0]-a[0]);console.log('deepest:',res.slice(0,8).map(r=>r[1]+':'+r[0]).join(' '),' functions deeper than 8:',res.filter(r=>r[0]>8).length);
