// Split `const a=X,b=Y;` (all plain-identifier inits) and `X=function(){},Y=function(){};`
// into one statement each, so layers can be paired and moved individually.
const fs=require('fs'),espree=require('espree');
const [,,IN,OUT]=process.argv;let html=fs.readFileSync(IN,'utf8');
const m=/<script>([\s\S]*?)<\/script>/.exec(html);const start=m.index+8,src=m[1];
const ast=espree.parse(src,{ecmaVersion:'latest',range:true});const edits=[];let n=0;
(function lists(node){if(!node||typeof node.type!=='string')return;
 if(node.type==='Program'||node.type==='BlockStatement')node.body.forEach(st=>{
  if(st.type==='VariableDeclaration'&&st.declarations.length>1&&st.declarations.every(d=>d.id.type==='Identifier'&&d.init&&d.init.type==='Identifier')){
    edits.push([st.range[0],st.range[1],st.declarations.map(d=>st.kind+' '+src.slice(d.range[0],d.range[1])+';').join('\n')]);n++;}
  else if(st.type==='ExpressionStatement'&&st.expression.type==='SequenceExpression'&&st.expression.expressions.every(e=>e.type==='AssignmentExpression'&&e.left.type==='Identifier'&&/Function/.test(e.right.type))){
    edits.push([st.range[0],st.range[1],st.expression.expressions.map(e=>src.slice(e.range[0],e.range[1])+';').join('\n')]);n++;}
 });
 for(const k in node){if(k==='range')continue;const v=node[k];if(Array.isArray(v))v.forEach(lists);else if(v&&typeof v.type==='string')lists(v);}})(ast);
edits.sort((a,b)=>b[0]-a[0]);let s=src;for(const [a,b,t] of edits)s=s.slice(0,a)+t+s.slice(b);
fs.writeFileSync(OUT,html.slice(0,start)+s+html.slice(start+src.length));console.log('split statements:',n);
