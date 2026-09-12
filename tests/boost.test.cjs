const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../flight.js');
if (fs.existsSync(file)) require(file);
assert.ok(globalThis.JetlevFlight, 'Shared boost flight physics must exist');
const { fly, STEP } = globalThis.JetlevFlight;
const fresh = () => ({ y: 210, vy: 0 });
function advance(p, held, seconds, dt = STEP) {
  for (let remaining = seconds; remaining > 1e-9; remaining -= dt) fly(p, held, Math.min(dt, remaining));
  return p;
}

const charge = fresh();
advance(charge, true, 1.2);
assert.equal(charge.boost, 0, 'Short holds do not activate boost');
advance(charge, false, .01);
assert.equal(charge.charge, 0, 'Release resets incomplete charge');
advance(charge, true, 1.25);
assert.ok(Math.abs(charge.boost - 5) < 1e-8, 'Full hold grants five seconds');
advance(charge, false, 4.99);
assert.ok(charge.boost > 0 && charge.boost < .02, 'Buff survives release for five seconds');
advance(charge, true, .01);
assert.equal(charge.boost, 0);
advance(charge, true, 2);
assert.equal(charge.boost, 0, 'A held button cannot auto-refresh the buff');
advance(charge, false, .01);
advance(charge, true, 1.25);
assert.ok(charge.boost > 4.99, 'Releasing after expiration rearms boost');

for (const held of [false, true]) {
  const normal = fresh(), boosted = { ...fresh(), boost: 5, boostSpent: true };
  advance(normal, held, .45); advance(boosted, held, .45);
  assert.ok(Math.abs(boosted.y - 210) > Math.abs(normal.y - 210) * 1.25, 'Boost improves ascent and descent');
}
const reversal = { y: 170, vy: 88 };
advance(reversal, true, .13);
assert.ok(reversal.vy < 0, 'Normal ascent reverses a terminal fall within 130ms');
const down = { y: 170, vy: -100 };
advance(down, false, .13);
assert.ok(down.vy > 0, 'Normal release reverses ascent within 130ms');
const activation = { y: 150, vy: -70, charge: 1.25 - .00001 };
fly(activation, true, .00002);
assert.ok(Math.abs(activation.vy + 70) < .1, 'Activation does not snap velocity');
const expiry = { y: 150, vy: -130, boost: .00001, boostSpent: true };
fly(expiry, true, .00002);
assert.ok(Math.abs(expiry.vy + 130) < .1, 'Expiration does not snap velocity');
const saved = advance(fresh(), true, .8), restored = JSON.parse(JSON.stringify(saved));
for (const held of [true, false, true]) {
  advance(saved, held, .7); advance(restored, held, .7);
}
assert.deepEqual(saved, restored, 'Planner copies preserve charge and buff state');
const idle = fresh();
fly(idle, true, 0);
assert.equal(idle.y, 210, 'Zero elapsed time never moves the pilot');
assert.equal(idle.charge, 0, 'Zero elapsed time cannot charge the boost');
assert.ok(advance(fresh(), false, 3).y > 277, 'Water remains lethal without floor clamping');
const ceiling = advance(fresh(), true, 10);
assert.ok(ceiling.y >= 37 && ceiling.y < 37.1, 'Held thrust settles at soft ceiling');
const trajectories = [30, 60, 120, 240].map(hz => {
  const p = fresh();
  for (const [held, seconds] of [[true, 1.3], [false, .5], [true, .6], [false, .2], [true, 4], [false, .5]]) advance(p, held, seconds, 1 / hz);
  return p;
});
for (const p of trajectories) {
  assert.ok(Math.abs(p.y - trajectories[0].y) < .1, 'Frame rates agree within a tenth of a pixel');
  assert.ok(Math.abs(p.boost - trajectories[0].boost) < 1e-8, 'Buff duration is frame-rate independent');
}
console.log('Boost physics: charge, duration, rearm, control, continuity and frame rates passed');
