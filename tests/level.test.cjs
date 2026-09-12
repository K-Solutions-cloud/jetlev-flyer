const assert = require('node:assert/strict');
require('../flight.js');require('../level.js');
const level = globalThis.JetlevLevel;
let seed = 91231;
const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
let accepted = 0;
const started = performance.now();
for (let scenario = 0; scenario < 90; scenario++) {
  const width = [160,260,480][scenario % 3];
  const pilot = { x: width * .27, y: 45 + random() * 215, vy: -96 + random() * 179 };
  const distance = scenario * 17;
  const obstacles = scenario % 4 === 0 ? [] : [{x: width * .8 + 35, y: 110 + random() * 100,
    baseY: 155, len: 55, type: ['gate', 'drone', 'rocket'][scenario % 3]}];
  const formation = level.formation({ pilot, distance, obstacles, width, random });
  if (!formation) continue; // Conservative rejection is allowed.
  accepted++;
  assert.equal(formation.coins.length, 6);
  assert.ok(formation.coins.every(c => obstacles.every(o => level.coinClear(c, o))));
  // Independently replay the returned hold/release witness at the live timestep.
  const actual = {...pilot};
  let traveled = 0, meters = distance, collected = 0;
  for (const point of formation.path) {
    const delta = level.speedAt(meters) * level.STEP;
    meters += delta * .16;
    traveled += delta;
    level.fly(actual, point.thrust);
    assert.ok(Math.abs(actual.y - point.y) < 1e-8);
    assert.ok(Math.abs(point.x - pilot.x - traveled) < 1e-8);
    assert.ok(level.safe(actual.y, traveled, pilot.x, obstacles));
    while (collected < formation.coins.length && formation.coins[collected].x - pilot.x <= traveled) {
      assert.ok(Math.abs(actual.y - 2 - formation.coins[collected].y) <= 8);
      collected++;
    }
  }
  assert.equal(collected, 6, 'each coin must be collectible in sequence');
}
assert.ok(accepted >= 40, 'generator must produce useful formations, not just reject everything');
let meteorPaths=0;
for(let scenario=0;scenario<30;scenario++){
 const pilot={x:43,y:70+scenario%6*30,vy:0},rock={type:'meteor',x:270,y:-28,fall:.4+scenario%7*.12};
 const coins=[{x:120,y:100+scenario%5*20},{x:137,y:100+scenario%5*20}];
 const path=level.plan({pilot,distance:420,obstacles:[rock],coins,endScroll:rock.x-pilot.x+45});
 if(!path)continue;
 meteorPaths++;
 const actual={...pilot};let scroll=0,meters=420,collected=0;
 for(const point of path){
  const delta=level.speedAt(meters)*level.STEP;scroll+=delta;meters+=delta*.16;
  level.fly(actual,point.thrust);
  const rx=rock.x-scroll,ry=rock.y+scroll*rock.fall;
  assert.ok(Math.abs(rx-actual.x)>=18||Math.abs(ry-actual.y)>=28,'replayed path avoids actual falling rock');
  while(collected<coins.length&&coins[collected].x-pilot.x<=scroll){assert.ok(Math.abs(actual.y-2-coins[collected].y)<=8);collected++;}
 }
 assert.equal(collected,coins.length);
}
assert.ok(meteorPaths>=10,'falling hazards must leave useful collectible paths');
assert.equal(level.coinClear({x:200,y:150},{type:'meteor',x:200,y:-20,fall:1}),false,'reserve future downward sweep');
assert.equal(level.coinClear({x:200,y:150},{type:'meteor',x:245,y:-20,fall:1}),true,'separate horizontal lanes stay clear');
// Moving hazards: do not place coins inside any part of a drone's sweep.
assert.equal(level.coinClear({x:200,y:174},{x:200,y:142,baseY:155,type:'drone'}),false);
// A faster rocket behind a coin will eventually cross its horizontal position.
assert.equal(level.coinClear({x:200,y:150},{x:250,y:150,type:'rocket'}),false);
assert.equal(level.coinClear({x:200,y:60},{x:250,y:200,type:'rocket'}),true);
// Impossible wall: skip spawning instead of producing an unreachable reward.
assert.equal(level.plan({pilot:{x:40,y:150,vy:0},distance:0,
 obstacles:[{x:100,y:155,len:320,type:'gate'}],coins:[{x:150,y:150}]}),null);
console.log(`PASS: ${accepted}/90 generated formations, every accepted flight replayed; drone sweep, rocket crossings, impossible wall. ${Math.round(performance.now()-started)} ms`);

// Replay complete encounters against independent live collision calculations.
let groups=0,triples=0;const modes=new Set();
for(let scenario=0;scenario<150;scenario++){
 const width=[120,160,260,480][scenario%4],distance=[0,250,700,1800,5000][scenario%5];
 const pilot={x:width*.27,y:65+random()*175,vy:-70+random()*130},held=random()<.5;
 const existing=scenario%3===0?[{type:'rocket',x:width+110,y:70}]:[];
 const result=level.encounter({pilot,distance,width,held,center:80+random()*150,type:'gate',obstacles:existing,random});
 if(!result)continue;
 if(distance===0)assert.equal(result.obstacles.length,1,'gentle opening');
 if(result.obstacles.length>1){groups++;modes.add(result.mode);}
 if(result.obstacles.length===3)triples++;
 const actual={...pilot};let scroll=0,meters=distance,frame=0;
 for(const point of result.path){
  if(frame*level.STEP<.35)assert.equal(point.thrust,held,'reaction window preserves current input');
  frame++;level.fly(actual,point.thrust);
  const delta=level.speedAt(meters)*level.STEP;scroll+=delta;meters+=delta*.16;
  assert.ok(actual.y<level.WATER_Y-5,'route stays above water');
  for(const o of [...existing,...result.obstacles]){
   const x=o.x-scroll*(o.type==='rocket'?1.45:1);
   const rx=o.type==='gate'?5:12,ry=o.type==='gate'?o.len/2+3:6;
   assert.ok(Math.abs(x-pilot.x)>=rx+15||Math.abs(o.y-actual.y)>=ry+25,'route clears actual hitboxes with margin');
  }
 }
 for(const o of [...existing,...result.obstacles])assert.ok(o.x-scroll*(o.type==='rocket'?1.45:1)<pilot.x-15,'witness covers the last hazard');
}
assert.ok(groups>=15,'multiple-hazard patterns must actually be accepted');
assert.ok(triples>=3,'late runs include triples');assert.equal(modes.size,3,'all pattern families appear');
assert.equal(level.encounter({pilot:{x:40,y:150,vy:0},distance:2000,width:160,
 obstacles:[{type:'gate',x:100,y:155,len:320}],random}),null,'impossible existing wall rejects the whole encounter');
// The planner must inspect hazards beyond the final coin, not stop at the reward.
assert.equal(level.plan({pilot:{x:40,y:150,vy:0},distance:0,coins:[{x:90,y:150}],
 obstacles:[{type:'gate',x:350,y:155,len:320}]}),null);
console.log(`PASS: ${groups} multi-hazard encounters, ${triples} triples, all families replayed with reaction time and complete hazard horizon.`);

assert.equal(level.plan({pilot:{x:40,y:150,vy:0},distance:0,coins:[],obstacles:[{type:'gate',x:9000,y:155,len:320}]}),null,'never accept a truncated planning horizon');

// Cached forecast geometry must preserve the original search and its exact witness.
const source = require('node:fs').readFileSync(require.resolve('../level.js'), 'utf8');
assert.ok(source.includes('if (!frameSafe(node.y, j))'), 'exercise the cached planner');
const referenceScope = {JetlevFlight: globalThis.JetlevFlight};
new Function('globalThis', source.replace('if (!frameSafe(node.y, j))',
  'if (!safe(node.y, scroll, pilot.x, obstacles))'))(referenceScope);
let compared = 0, replayed = 0;
for (let scenario = 0; scenario < 36; scenario++) {
  const width = [160, 260, 480][scenario % 3], distance = 2400;
  const pilot = {x: width * .27, y: 75 + random() * 155, vy: -30 + random() * 60,
    boost: scenario % 2 ? 3 : 0, charge: scenario % 3 ? 0 : 1.1};
  const speed = level.speedAt(distance), warn = speed * .9, duration = speed * 2.1;
  const height = 95 + random() * 135, fire = warn + duration * .5;
  const x = pilot.x + .4 * (warn + duration * .8);
  const obstacles = [
    {type: scenario % 2 ? 'shark' : 'piranha', x, y: 312, height, warn, duration, travel: 0},
    {type: 'laser', x: x - .4 * fire - 12 + 2.4 * fire, y: 301 - height,
      activation: fire, expires: fire + speed * 1.2, travel: 0},
    {type: scenario % 3 ? 'drone' : 'meteor', x: width + 80, y: 70, baseY: 70, fall: .6}
  ];
  if (scenario % 4 === 0) obstacles.push({type: 'gate', x: width + 240, y: 195, len: 43 + random() * 20});
  const coins = scenario % 3 ? [] : Array.from({length: 6}, (_, i) => ({x: width + 24 + i * 17, y: 80}));
  const input = {pilot, distance, obstacles, coins, reactionTime: .35, held: scenario % 2 === 0};
  const path = level.plan(input);
  assert.deepEqual(path, referenceScope.JetlevLevel.plan(input), 'cache preserves rejection and every witness input/position');
  compared++;
  if (!path) continue;
  const actual = {...pilot};
  for (const point of path) {
    level.fly(actual, point.thrust);
    assert.equal(actual.y, point.y);
    assert.ok(level.safe(actual.y, point.x - pilot.x, pilot.x, obstacles), 'cached witness clears uncached collision check');
  }
  replayed++;
}
assert.ok(replayed >= 5, 'differential cases include accepted witnesses');
console.log(`PASS: ${compared} cached/uncached planner comparisons, ${replayed} identical witnesses replayed.`);
