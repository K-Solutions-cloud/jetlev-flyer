const assert=require('node:assert/strict');require('../director.js');
const rng=()=>{let seed=8147;return()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);};
const hot=globalThis.JetlevDirector.create({random:rng()}),roaming=globalThis.JetlevDirector.create({random:rng()});
for(let i=0;i<3600;i++){hot.update(1/120,157);roaming.update(1/120,57+40*(Math.floor(i/30)%6));}
assert.ok(hot.getState().heat[3]>.99,'dwelling builds local heat');
assert.ok(roaming.getState().heat.every(value=>value<.4),'moving spreads heat');
assert.ok(hot.pick(2000,157).aimChance>roaming.pick(2000,157).aimChance);
function sample(distance){let aimed=0;for(let i=0;i<10000;i++){const p=hot.pick(distance,157);aimed+=p.aimed;assert.ok(p.center>=70&&p.center<=245);assert.ok(p.aimChance<=.75);}return aimed/10000;}
const early=sample(20),late=sample(2000);
assert.ok(early>.08&&early<.24,'opening targeting remains gentle');assert.ok(late>.7&&late<.79,'late targeting increases without becoming certain');assert.ok(late-early>.4);
for(let i=0;i<1200;i++)hot.update(1/120,57);
assert.ok(hot.getState().heat[3]<.2,'vacated zones cool');
for(const y of [-999,37,277,999,NaN])for(let i=0;i<50;i++){const p=hot.pick(5000,y);assert.ok(p.center>=70&&p.center<=245);}
hot.reset();assert.ok(hot.getState().heat.every(value=>value===0));assert.equal(hot.pick(0,150).aimChance,.1);
const exact=globalThis.JetlevDirector.create({random:()=>.99});for(let i=0;i<400;i++)exact.update(.1,150);assert.equal(exact.pick(2000,150).aimed,false,'exploration survives a fully heated endgame');
console.log('PASS: dwelling heat, cooling, gradual adaptive targeting, gentle opening and persistent random exploration.');
