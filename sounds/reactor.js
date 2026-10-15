// Reactor - rare, slow metallic transients: the hull and reactor
// housings settling on a long loop. Each creak is a pair of partials
// (a body and a 3:2 metallic overtone) gliding down through a narrow
// bandpass, swelling slowly and dying out over ~1 s. Faint by design -
// you should notice it only when you stop thinking about it.

export default {
  id: 'reactor',
  label: 'Reactor',
  flavor: 'Hull and reactor, settling.',
  enabledByDefault: false,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.15, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
    { key: 'speed', label: 'Rate', min: 0.25, max: 4, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
  ],
  build(ctx, out, v) {
    const now = ctx.currentTime;
    let pitch = v.pitch; // live copies: the scheduler runs between update()s
    let rate = v.speed;

    const master = ctx.createGain();
    master.gain.setValueAtTime(v.volume, now);
    master.connect(out);

    let alive = true;
    let timer = null;

    const creak = () => {
      if (!alive) return;
      const t = ctx.currentTime + 0.02;
      const base = (300 + Math.random() * 260) * pitch; // creak body, 300-560 Hz @ pitch 1
      const dur = 0.7 + Math.random() * 0.9;            // slow: 0.7-1.6 s

      // Two partials gliding down, like metal releasing tension.
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.type = 'sine';
      o2.type = 'triangle';
      o1.frequency.setValueAtTime(base, t);
      o1.frequency.exponentialRampToValueAtTime(base * 0.62, t + dur);
      o2.frequency.setValueAtTime(base * 1.5, t); // 3:2 partial = the metallic edge
      o2.frequency.exponentialRampToValueAtTime(base * 0.93, t + dur);

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.Q.setValueAtTime(9, now);
      bp.frequency.setValueAtTime(base, t);
      bp.frequency.exponentialRampToValueAtTime(base * 0.62, t + dur);

      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.5, t + dur * 0.25); // slow swell
      g.gain.exponentialRampToValueAtTime(0.001, t + dur); // long tail

      o1.connect(bp);
      o2.connect(bp);
      bp.connect(g);
      g.connect(master);
      o1.start(t);
      o2.start(t);
      o1.stop(t + dur + 0.1);
      o2.stop(t + dur + 0.1);
      setTimeout(() => { try { g.disconnect(); } catch (e) {} }, (dur + 0.3) * 1000);
    };

    const scheduleNext = () => {
      if (!alive) return;
      // Rare: roughly 7-23 s between creaks at rate 1.
      const interval = (7 + Math.random() * 16) / rate;
      timer = setTimeout(() => { creak(); scheduleNext(); }, interval * 1000);
    };

    timer = setTimeout(() => { creak(); scheduleNext(); }, ((3 + Math.random() * 8) / rate) * 1000);

    return {
      update(key, value) {
        if (key === 'volume') master.gain.setValueAtTime(value, ctx.currentTime);
        if (key === 'pitch') pitch = value;
        if (key === 'speed') rate = value;
      },
      stop() {
        alive = false;
        clearTimeout(timer);
      },
    };
  },
};
