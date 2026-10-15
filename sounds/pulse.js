// Pulse - the reactor breathing: a 78 Hz sine whose volume swells and
// fades on a slow LFO (default ~0.77 Hz).

export default {
  id: 'pulse',
  label: 'Pulse',
  flavor: 'The reactor, breathing.',
  enabledByDefault: true,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.15, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
    { key: 'speed', label: 'Speed', min: 0.05, max: 4, step: 0.01, def: 0.77, format: (v) => v.toFixed(2) + ' Hz' },
  ],
  build(ctx, out, v) {
    const now = ctx.currentTime;
    const detune = (Math.random() - 0.5) * 0.3;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(78 * v.pitch + detune, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(v.volume, now);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(v.speed, now);
    const depth = ctx.createGain();
    depth.gain.setValueAtTime(0.1, now);

    lfo.connect(depth);
    depth.connect(gain.gain);
    osc.connect(gain);
    gain.connect(out);
    osc.start();
    lfo.start();

    return {
      update(key, value) {
        const t = ctx.currentTime;
        if (key === 'volume') gain.gain.setValueAtTime(value, t);
        if (key === 'pitch') osc.frequency.setValueAtTime(78 * value + detune, t);
        if (key === 'speed') lfo.frequency.setValueAtTime(value, t);
      },
      stop() {
        try { osc.stop(); } catch (e) {}
        try { lfo.stop(); } catch (e) {}
      },
    };
  },
};
