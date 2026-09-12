/* Shared flight physics and conservative, witness-based level generation. */
(() => {
  'use strict';
  const STEP = 1 / 120;
  const DECAY_UP = Math.exp(-STEP * 8.2), DECAY_DOWN = Math.exp(-STEP * 7);
  const speedAt = distance => 100 + Math.min(65, distance * .065);

  function fly(pilot, thrust, dt = STEP) {
    // Velocity stays continuous on press/release. A short, symmetric response
    // makes reversals precise without snapping the pilot to a new velocity.
    // Ease the target near the water/ceiling before the final safety clamp.
    const room = thrust ? pilot.y - 37 : 271 - pilot.y;
    const target = (thrust ? -1 : 1) * Math.min(thrust ? 100 : 88, Math.max(0, room) * 5);
    const response = thrust ? 8.2 : 7;
    const decay = dt === STEP ? (thrust ? DECAY_UP : DECAY_DOWN) : Math.exp(-dt * response);
    const previous = pilot.vy;
    pilot.vy = target + (previous - target) * decay;
    // Analytic integration avoids refresh-rate-dependent displacement.
    pilot.y += target * dt + (previous - target) * (1 - decay) / response;
    if (pilot.y < 37) { pilot.y = 37; pilot.vy = Math.max(0, pilot.vy); }
    if (pilot.y > 271) { pilot.y = 271; pilot.vy = Math.min(0, pilot.vy); }
    return pilot;
  }

  function bounds(obstacle) {
    return obstacle.type === 'gate'
      ? { x: 5, y: obstacle.len / 2 + 3 }
      : { x: 12, y: 6 };
  }

  // Reserve the drone's entire vertical sweep, not only its current position.
  function safe(y, scroll, pilotX, obstacles, margin = 5) {
    return obstacles.every(o => {
      const box = bounds(o);
      const x = o.x - scroll * (o.type === 'rocket' ? 1.45 : 1);
      const center = o.type === 'drone' ? o.baseY : o.y;
      const sweep = o.type === 'drone' ? 13 : 0;
      return Math.abs(x - pilotX) >= box.x + 10 + margin ||
        Math.abs(center - y) >= box.y + 20 + sweep + margin;
    });
  }

  // Protect a coin's complete remaining lifetime, including faster rockets.
  function coinClear(coin, o) {
    const box = bounds(o);
    const center = o.type === 'drone' ? o.baseY : o.y;
    const vertical = box.y + (o.type === 'drone' ? 13 : 0) + 33;
    if (Math.abs(center - coin.y) >= vertical) return true;
    const dx = o.x - coin.x;
    const end = dx - (o.type === 'rocket' ? .45 * Math.max(0, coin.x + 25) : 0);
    return Math.min(dx, end) > box.x + 23 || Math.max(dx, end) < -box.x - 23;
  }

  function forecast(distance, endScroll) {
    const frames = [];
    let scroll = 0;
    while (scroll < endScroll && frames.length < 2400) {
      const delta = speedAt(distance) * STEP;
      distance += delta * .16;
      scroll += delta;
      frames.push(scroll);
    }
    return frames;
  }

  // Beam search over actual hold/release inputs. Every accepted path has a
  // replayable input witness; failure only omits a spawn, never weakens safety.
  function plan({ pilot, distance, obstacles, coins, endScroll }) {
    const targets = coins.filter(c => c.x > pilot.x + 3).sort((a, b) => a.x - b.x);
    const end = Math.max(endScroll || 0, ...targets.map(c => c.x - pilot.x + 28), 30);
    const frames = forecast(distance, end);
    let beam = [{ y: pilot.y, vy: pilot.vy, next: 0, parent: null, path: [] }];
    const branchSteps = 18; // At most one input change per 150 ms.
    for (let offset = 0; offset < frames.length; offset += branchSteps) {
      const candidates = new Map();
      for (const previous of beam) for (const thrust of [false, true]) {
        const node = { y: previous.y, vy: previous.vy, next: previous.next,
          parent: previous, path: [], thrust };
        let valid = true;
        for (let j = offset; j < Math.min(offset + branchSteps, frames.length); j++) {
          fly(node, thrust);
          const scroll = frames[j];
          if (!safe(node.y, scroll, pilot.x, obstacles)) { valid = false; break; }
          while (node.next < targets.length && targets[node.next].x - pilot.x <= scroll) {
            if (Math.abs(node.y - 2 - targets[node.next].y) > 8) { valid = false; break; }
            node.next++;
          }
          if (!valid) break;
          node.path.push({ x: pilot.x + scroll, y: node.y, thrust });
        }
        if (!valid) continue;
        const next = targets[node.next];
        node.rank = next ? Math.abs(node.y - 2 - next.y) + Math.abs(node.vy) * .06 : Math.abs(node.vy) * .06;
        const key = Math.round(node.y / 4) + ':' + Math.round(node.vy / 12) + ':' + node.next;
        if (!candidates.has(key) || candidates.get(key).rank > node.rank) candidates.set(key, node);
      }
      beam = [...candidates.values()].sort((a, b) => a.rank - b.rank).slice(0, 72);
      if (!beam.length) return null;
    }
    const winner = beam.find(n => n.next === targets.length);
    if (!winner) return null;
    const chunks = [];
    for (let n = winner; n.parent; n = n.parent) chunks.push(n.path);
    return chunks.reverse().flat();
  }

  function formation({ pilot, distance, obstacles, existing = [], width, random = Math.random }) {
    const startX = width + 24;
    const bases = [Math.max(65, Math.min(240, pilot.y - 2 + (random() - .5) * 65)),
      75 + random() * 155, 80, 155, 230];
    for (let attempt = 0; attempt < bases.length; attempt++) {
      const shape = Math.floor(random() * 3), direction = random() < .5 ? -1 : 1;
      const coins = Array.from({ length: 6 }, (_, i) => ({
        x: startX + i * 17,
        y: bases[attempt] + (shape === 0 ? 0 : shape === 1 ? Math.sin(i / 5 * Math.PI) * 17 * direction : i * 4 * direction),
        phase: i * .4
      }));
      if (!coins.every(c => c.y >= 55 && c.y <= 250 && obstacles.every(o => coinClear(c, o)))) continue;
      const path = plan({ pilot, distance, obstacles, coins: [...existing, ...coins] });
      if (path) return { coins, path };
    }
    return null;
  }

  globalThis.JetlevLevel = Object.freeze({ STEP, speedAt, fly, bounds, safe, coinClear, plan, formation });
})();
