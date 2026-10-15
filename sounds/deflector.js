// Deflector - the soft high shimmer of the deflector field: two
// near-coincident sines (~920 Hz) beating at a few Hz, with a faint 3:2
// overtone, all breathed by a very slow LFO. Very quiet by design - it
// should sit under everything else like a sheen.

export default {
  id: 'deflector',
  label: 'Deflector',
  flavor: 'Deflector field shimmer.',
  enabledByDefault: false,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.05, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
    { key: 'speed', label: 'Speed', min: 0.02, max: 1, step: 0.01, def: 0.05, format: (v) => v.toFixed(2) + ' Hz' },
  ],
  build(ctx, out, v) {
    const now = ctx.currentTime;
    const p = v.pitch;

    const master = ctx.createGain();
    master.gain.setValueAtTime(v.volume, now);
    master.connect(out);

    // The shimmer body: two near-coincident sines, ~6 Hz apart at pitch 1,
    // beating into a soft "shhh".
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(920 * p, now);
    osc2.frequency.setValueAtTime(926 * p, now);

    // Faint 3:2 overtone for the "field" airiness.
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1380 * p, now);
    const osc3Gain = ctx.createGain();
    osc3Gain.gain.setValueAtTime(0.15, now);

    const body = ctx.createGain();
    body.gain.setValueAtTime(0.5, now);
    osc1.connect(body);
    osc2.connect(body);
    osc3.connect(osc3Gain);
    osc3Gain.connect(body);
    body.connect(master);

    // Very slow breathing on the whole layer.
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(v.speed, now);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.setValueAtTime(v.volume * 0.6, now);
    lfo.connect(lfoDepth);
    lfoDepth.connect(master.gain);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();

    return {
      update(key, value) {
        const t = ctx.currentTime;
        if (key === 'volume') {
          master.gain.setValueAtTime(value, t);
          lfoDepth.gain.setValueAtTime(value * 0.6, t);
        }
        if (key === 'pitch') {
          osc1.frequency.setValueAtTime(920 * value, t);
          osc2.frequency.setValueAtTime(926 * value, t);
          osc3.frequency.setValueAtTime(1380 * value, t);
        }
        if (key === 'speed') lfo.frequency.setValueAtTime(value, t);
      },
      stop() {
        try { osc1.stop(); } catch (e) {}
        try { osc2.stop(); } catch (e) {}
        try { osc3.stop(); } catch (e) {}
        try { lfo.stop(); } catch (e) {}
      },
    };
  },
};
