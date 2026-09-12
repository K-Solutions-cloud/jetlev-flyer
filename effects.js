/* Small, self-contained pixel impact and Web Audio effects. */
(() => {
  'use strict';
  const colors = ['#ffffff', '#fff0ae', '#ed1c24', '#9bece9', '#52c8dd'];
  function createExplosion(x, y, reducedMotion = false) {
    const count = reducedMotion ? 20 : 48;
    return { x, y, age: 0, duration: 1.1, reducedMotion,
      particles: Array.from({ length: count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const speed = (35 + Math.random() * 105) * (reducedMotion ? .42 : 1);
        return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 20,
          size: i % 5 === 0 ? 4 : 2, color: colors[i % colors.length],
          life: .45 + Math.random() * .65 };
      }) };
  }
  function updateExplosion(effect, dt) {
    if (!effect) return;
    effect.age += dt;
    for (const p of effect.particles) {
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= Math.exp(-dt * 1.6); p.vy += dt * 125;
    }
  }
  function drawExplosion(ctx, effect) {
    if (!effect || effect.age >= effect.duration) return;
    const { x, y, age, reducedMotion } = effect;
    const pixel = (px, py, w, h, color) => {
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(px), Math.round(py), w, h);
    };
    ctx.save();
    // Local impact only: no screen flash and no violent camera displacement.
    if (age < .21) {
      const size = Math.round((1 - age / .21) * (reducedMotion ? 10 : 19));
      ctx.globalAlpha = 1 - age / .21;
      pixel(x - size, y - size / 3, size * 2, Math.max(2, size * 2 / 3), '#fff0ae');
      pixel(x - size / 3, y - size, Math.max(2, size * 2 / 3), size * 2, '#ffffff');
    }
    if (age < .52) {
      const radius = 7 + age * (reducedMotion ? 43 : 112);
      ctx.globalAlpha = (1 - age / .52) * .8;
      for (let i = 0; i < 28; i++) {
        const a = i / 28 * Math.PI * 2;
        pixel(x + Math.cos(a) * radius - 1, y + Math.sin(a) * radius - 1,
          3, 3, i % 3 ? '#d9ffff' : '#6cd9e5');
      }
    }
    for (const p of effect.particles) {
      if (age >= p.life) continue;
      ctx.globalAlpha = Math.min(1, (p.life - age) * 4);
      pixel(p.x, p.y, p.size, p.size, p.color);
    }
    ctx.restore();
  }
  function playExplosion(audio) {
    if (!audio || audio.state === 'closed') return;
    const at = audio.currentTime;
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * .45), audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1;
    const noise = audio.createBufferSource(), filter = audio.createBiquadFilter();
    const gain = audio.createGain(), sub = audio.createOscillator(), subGain = audio.createGain();
    noise.buffer = buffer; filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, at);
    filter.frequency.exponentialRampToValueAtTime(190, at + .42);
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.linearRampToValueAtTime(.19, at + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, at + .44);
    noise.connect(filter); filter.connect(gain); gain.connect(audio.destination);
    sub.type = 'triangle'; sub.frequency.setValueAtTime(115, at);
    sub.frequency.exponentialRampToValueAtTime(28, at + .48);
    subGain.gain.setValueAtTime(.0001, at);
    subGain.gain.linearRampToValueAtTime(.2, at + .006);
    subGain.gain.exponentialRampToValueAtTime(.0001, at + .5);
    sub.connect(subGain); subGain.connect(audio.destination);
    noise.onended = () => { noise.disconnect(); filter.disconnect(); gain.disconnect(); };
    sub.onended = () => { sub.disconnect(); subGain.disconnect(); };
    noise.start(at); noise.stop(at + .45); sub.start(at); sub.stop(at + .52);
  }
  globalThis.JetlevEffects = Object.freeze({ createExplosion, updateExplosion, drawExplosion, playExplosion });
})();
