const assert = require('node:assert/strict');
require('../level.js');
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
// Moving hazards: do not place coins inside any part of a drone's sweep.
assert.equal(level.coinClear({x:200,y:174},{x:200,y:142,baseY:155,type:'drone'}),false);
// A faster rocket behind a coin will eventually cross its horizontal position.
assert.equal(level.coinClear({x:200,y:150},{x:250,y:150,type:'rocket'}),false);
assert.equal(level.coinClear({x:200,y:60},{x:250,y:200,type:'rocket'}),true);
// Impossible wall: skip spawning instead of producing an unreachable reward.
assert.equal(level.plan({pilot:{x:40,y:150,vy:0},distance:0,
 obstacles:[{x:100,y:155,len:320,type:'gate'}],coins:[{x:150,y:150}]}),null);
console.log(`PASS: ${accepted}/90 generated formations, every accepted flight replayed; drone sweep, rocket crossings, impossible wall. ${Math.round(performance.now()-started)} ms`);
