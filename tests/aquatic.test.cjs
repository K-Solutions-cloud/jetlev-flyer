const assert=require('node:assert/strict');require('../flight.js');require('../level.js');
const level=globalThis.JetlevLevel;
assert.equal(typeof level.creatureEncounter,'function','aquatic groups must have a validated shared trajectory');
let seed=31;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
let accepted=0,heights=new Set();
for(let i=0;i<30;i++){
 const pilot={x:43,y:85+i%5*32,vy:0},distance=500+i*65;
 const result=level.creatureEncounter({pilot,distance,width:160,lava:i%2===0,random,held:false});
 if(!result)continue;accepted++;
 const fish=result.obstacles.filter(o=>o.type==='shark'||o.type==='piranha');
 heights.add(Math.round(fish[0].height));assert.equal(fish.length,i%2===0?2:1);
 for(const f of fish){const end=level.pose(f,f.warn+f.duration);assert.ok(end.x<pilot.x+15,'jumping body must cross player lane');assert.ok(level.pose(f,f.warn+f.duration+1).progress<.1,'splash starts visible');assert.equal(level.pose(f,0).active,false);assert.equal(level.pose(f,f.warn+f.duration*.5).stage,'fire');assert.ok(Math.abs(level.pose(f,f.warn+f.duration*.5).y-(303-f.height))<.001);}
 const actual={...pilot};let scroll=0,meters=distance;
 for(const point of result.path){const delta=level.speedAt(meters)*level.STEP;meters+=delta*.16;scroll+=delta;level.fly(actual,point.thrust);assert.ok(actual.y<272);
  for(const o of result.obstacles){const at=level.pose(o,scroll);if(!at.active)continue;const b=level.bounds(o);assert.ok(Math.abs(at.x-pilot.x)>=b.x+15||Math.abs(at.y-actual.y)>=b.y+25,'replayed escape clears fish and live laser');}
 }
 const laser=result.obstacles.find(o=>o.type==='laser');assert.equal(level.pose(laser,laser.activation-1).active,false);assert.equal(level.pose(laser,laser.activation+1).active,true);
}
assert.ok(accepted>=10,'useful groups actually spawn');assert.ok(heights.size>5,'jump heights vary');
console.log('PASS: aquatic warnings, variable jump heights, piranha pairs and fully replayed fish/laser escape paths ('+accepted+').');
