/* Shared by the live pilot and the planner: continuous velocity, timed boost. */
(() => {
  'use strict';
  const STEP = 1 / 120, WATER_Y = 277, BOOST_CHARGE = 1.25, BOOST_DURATION = 5;
  function fly(pilot, thrust, dt = STEP) {
    pilot.charge ??= 0;
    pilot.boost ??= 0;
    pilot.boostSpent ??= false;
    if (!(dt > 0) || !Number.isFinite(dt)) return pilot;
    if (!thrust) {
      pilot.charge = 0;
      if (!pilot.boost) pilot.boostSpent = false;
    }
    // Bound integration steps for the soft ceiling; split buff transitions at
    // their exact time so 30 Hz rendering never shortens the five-second reward.
    while (dt > 1e-10) {
      const boosted = pilot.boost > 0;
      const charging = thrust && !boosted && !pilot.boostSpent;
      const step = Math.min(dt, STEP / 2, boosted ? pilot.boost : charging ? BOOST_CHARGE - pilot.charge : dt);
      const target = thrust ? -Math.min(boosted ? 145 : 100, Math.max(0, pilot.y - 37) * 5) : boosted ? 125 : 88;
      const response = boosted ? 11 : thrust ? 8.2 : 7;
      const decay = Math.exp(-step * response), previous = pilot.vy;
      pilot.vy = target + (previous - target) * decay;
      pilot.y += target * step + (previous - target) * (1 - decay) / response;
      if (pilot.y < 37) { pilot.y = 37; pilot.vy = Math.max(0, pilot.vy); }
      if (boosted) {
        pilot.boost = Math.max(0, pilot.boost - step);
        if (pilot.boost < 1e-9) pilot.boost = 0;
      } else if (charging) {
        pilot.charge += step;
        if (pilot.charge >= BOOST_CHARGE - 1e-9) {
          pilot.charge = 0;
          pilot.boost = BOOST_DURATION;
          pilot.boostSpent = true;
        }
      }
      dt -= step;
    }
    return pilot;
  }
  globalThis.JetlevFlight = Object.freeze({ STEP, WATER_Y, BOOST_CHARGE, BOOST_DURATION, fly });
})();
