/* An isolated reward flight; the caller commits earned coins once on return. */
(() => {
  'use strict';
  function create({ pilot, width, random = Math.random }) {
    return { pilot: { ...pilot }, width, random, bills: [], time: 15, world: 0, earned: 0, spawnTimer: 0 };
  }
  function update(session, dt, held) {
    let collected = 0;
    if (!(dt > 0) || !Number.isFinite(dt) || session.time <= 0) {
      return { collected, finished: session.time <= 0 };
    }
    let remaining = Math.min(dt, session.time);
    session.time = Math.max(0, session.time - remaining);
    if (session.time < 1e-9) session.time = 0;
    while (remaining > 1e-10) {
      const step = Math.min(remaining, JetlevFlight.STEP);
      JetlevFlight.fly(session.pilot, held, step);
      if (session.pilot.y > 255) { session.pilot.y = 255; session.pilot.vy = Math.min(0, session.pilot.vy); }
      session.spawnTimer -= step;
      if (session.spawnTimer <= 0) {
        // Optional rows offer several flight paths; collecting every note is not required.
        const entry = session.world === 0 ? session.pilot.x + 50 : session.width + 16;
        const offset = session.random() * 10;
        for (let i = 0; i < 8 && session.bills.length < 60; i++) {
          session.bills.push({ x: entry + (i % 3) * 26, y: 43 + i * 28 + offset,
            phase: session.random() * Math.PI * 2, scale: .7 });
        }
        session.spawnTimer += .9;
      }
      session.world += 100 * step;
      session.bills = session.bills.filter(bill => {
        bill.x -= 100 * step;
        if (Math.abs(bill.x - session.pilot.x) < 13 && Math.abs(bill.y - session.pilot.y) < 15) {
          collected++;
          return false;
        }
        return bill.x > -24;
      });
      remaining -= step;
    }
    session.earned += collected * 5;
    return { collected, finished: session.time === 0 };
  }
  globalThis.JetlevHeaven = Object.freeze({ create, update });
})();
