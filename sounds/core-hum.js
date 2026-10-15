// Core Hum - the deep heartbeat of the warp core: two slightly detuned
// sine oscillators around 58 Hz, beating against each other.

export default {
  id: 'core-hum',
  label: 'Core Hum',
  flavor: 'Deep resonance of the warp core.',
  enabledByDefault: true,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.3, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
  ],
  build(ctx, out, v) {
    const now = ctx.currentTime;
    const detune = (Math.random() - 0.5) * 0.3;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(58 * v.pitch + detune, now);
    osc2.frequency.setValueAtTime(58.7 * v.pitch + detune, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(v.volume, now);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(out);
    osc1.start();
    osc2.start();

    return {
      update(key, value) {
        const t = ctx.currentTime;
        if (key === 'volume') gain.gain.setValueAtTime(value, t);
        if (key === 'pitch') {
          osc1.frequency.setValueAtTime(58 * value + detune, t);
          osc2.frequency.setValueAtTime(58.7 * value + detune, t);
        }
      },
      stop() {
        try { osc1.stop(); } catch (e) {}
        try { osc2.stop(); } catch (e) {}
      },
    };
  },
};
