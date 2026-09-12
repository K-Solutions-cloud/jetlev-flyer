const assert = require('node:assert/strict');
require('../level.js');
const { fly } = globalThis.JetlevLevel;

// Pressing and releasing each reverse terminal motion in under 130 ms,
// while preserving velocity continuity on the first physics tick.
for (const [thrust, velocity] of [[true, 88], [false, -100]]) {
  const pilot = { y: 155, vy: velocity };
  fly(pilot, thrust);
  assert.ok(Math.abs(pilot.vy - velocity) < 14, 'no input velocity snap');
  for (let i = 1; i < 16; i++) fly(pilot, thrust);
  assert.ok(thrust ? pilot.vy < 0 : pilot.vy > 0, 'responsive reversal');
}

// An identical hold/release gesture has the same feel across frame rates.
function gesture(step) {
  const pilot = { y: 155, vy: 0 };
  for (const [held, duration] of [[true, .6], [false, .8], [true, .4]]) {
    for (let i = 0; i < Math.round(duration / step); i++) fly(pilot, held, step);
  }
  return pilot;
}
const reference = gesture(1 / 120);
for (const step of [1 / 30, 1 / 60, 1 / 240]) {
  const actual = gesture(step);
  assert.ok(Math.abs(actual.y - reference.y) < .001, 'frame-independent position');
  assert.ok(Math.abs(actual.vy - reference.vy) < .001, 'frame-independent speed');
}

// The upper boundary stays soft; the water never auto-supports the pilot.
const ceiling={y:155,vy:0};
for(let i=0;i<1200;i++){fly(ceiling,true);assert.ok(ceiling.y>=37);}
assert.ok(Math.abs(ceiling.vy)<.01);fly(ceiling,false);assert.ok(ceiling.vy>0);
const falling={y:155,vy:0};
for(let i=0;i<240;i++)fly(falling,false);
assert.ok(falling.y>globalThis.JetlevLevel.WATER_Y,'no passive hover over water');
assert.equal(globalThis.JetlevLevel.safe(277,0,40,[]),false,'planner forbids water contact');
const recovering={y:240,vy:88};for(let i=0;i<30;i++)fly(recovering,true);
assert.ok(recovering.y<240&&recovering.vy<0,'timely thrust saves a descent smoothly');
console.log('PASS: continuous flight, responsive reversals, frame-rate consistency, soft ceiling and fatal water boundary.');
