const assert=require('node:assert/strict');
require('../bonus.js');require('../loot-effects.js');
const fx=globalThis.JetlevLootEffects;
const calls=[];let depth=0;
const g=new Proxy({}, {get:(_,name)=>(...args)=>{if(name==='save')depth++;if(name==='restore')depth--;assert.ok(depth>=0);for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));calls.push([name,...args]);}});
const kinds=['mini','lifebuoy','coconut','treasurewave','coinrain','comboanchor','daredevil','bounty','dolphin','ceasefire'];
for(const kind of kinds){fx.reset();fx.burst(kind,{x:40,y:150,targetX:100,targetY:100});fx.update(.15);const before=calls.length;fx.draw(g,{p:{x:40,y:150},t:2,W:160,H:320,active:{[kind]:8},reducedMotion:false});assert.ok(calls.length>before,kind+' is visibly distinct');assert.equal(depth,0);}
function signal(active){fx.reset();calls.length=0;fx.burst('mini',{x:40,y:150,active});fx.update(.2);fx.draw(g,{p:{x:40,y:150},t:2,W:160,H:320,active:{},reducedMotion:true});return JSON.stringify(calls);}
assert.notEqual(signal(true),signal(false),'expiry contracts while activation expands');
fx.reset();for(let i=0;i<100;i++)fx.burst('coconut',{x:40,y:150,targetX:100,targetY:100});fx.update(10);calls.length=0;fx.draw(g,{p:{x:40,y:150},t:2,W:160,H:320,active:{},reducedMotion:false});assert.equal(calls.length,0,'expired effects stop drawing');
console.log('PASS: ten loot effects, finite geometry, balanced canvas and effect expiry.');
