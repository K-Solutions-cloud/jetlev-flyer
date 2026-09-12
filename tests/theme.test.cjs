const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const sandbox={};vm.runInNewContext(fs.readFileSync('theme.js','utf8'),sandbox);
function paint(type,stage,progress=.5){
 const calls=[];let depth=0;
 const g=new Proxy({}, {get:(_,name)=>(...args)=>{
  if(name==='save')depth++;if(name==='restore')depth--;
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${type}/${stage}: ${name}`);
  calls.push([name,...args]);
 }});
 sandbox.JetlevTheme.drawObstacle(g,{type,stage,progress,x:100,y:200,len:60,small:type==='laser',lava:type==='piranha'},{t:1});
 assert.equal(depth,0,'sprite drawing restores transforms');
 return calls;
}
for(const type of ['shark','piranha']){
 const warning=paint(type,'warning');
 assert.notDeepEqual(warning,paint(type,'rise'),`${type} has distinct surface warning and airborne artwork`);
 assert.notDeepEqual(paint(type,'aim'),paint(type,'dive'),`${type} animates its flight stages`);
 for(const stage of ['warning','rise','aim','fire','dive','splash'])for(const progress of [0,.5,1])paint(type,stage,progress);
}
for(const type of ['laser','rocket','meteor','gate','drone'])paint(type);
console.log('PASS: aquatic sprite stages, finite canvas coordinates and balanced transforms.');

function bonusPaint(name,options={}){
 const calls=[];let depth=0;
 const g=new Proxy({}, {get:(_,method)=>(...args)=>{
  if(method==='save')depth++;if(method==='restore')depth--;
  assert.ok(depth>=0,'canvas restore has matching save');
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),`${name}: ${method}`);
  calls.push([method,...args]);
  if(method==='createLinearGradient'||method==='createRadialGradient')return {addColorStop:(...stops)=>calls.push(['stop',...stops])};
 }});
 if(name==='drawBill')sandbox.JetlevTheme[name](g,{x:100,y:150,scale:1},options);
 else sandbox.JetlevTheme[name](g,{W:160,H:320,t:1,world:100,...options});
 assert.equal(depth,0,'bonus artwork restores canvas state');
 assert.ok(calls.length>5,'bonus artwork is visible');return calls;
}
for(const name of ['drawBill','drawHeaven','drawGoldGlow','drawPortal'])for(const progress of [0,.5,1])bonusPaint(name,{progress});
assert.notDeepEqual(bonusPaint('drawBill',{t:0}),bonusPaint('drawBill',{t:1}),'bill flutters');
for(const name of ['drawGoldGlow','drawPortal'])assert.deepEqual(bonusPaint(name,{t:0,reducedMotion:true}),bonusPaint(name,{t:10,reducedMotion:true}),'reduced motion removes ambient animation');
console.log('PASS: bonus artwork, finite gradients and reduced motion.');
