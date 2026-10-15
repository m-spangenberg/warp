// Cooling - the muffled industrial hum of the engineering deck: three
// bandpassed noise harmonics (380 / 740 / 1290 Hz, high Q) over two
// triangle oscillators with a slow tremolo, all low-pass damped.
// (This used to be the standalone "Hi-Layer" in index.html; its internal
// levels are unchanged, only its home moved.)

export default {
  id: 'cooling',
  label: 'Cooling',
  flavor: 'Muffled inertial dampning field resonators.',
  enabledByDefault: false,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.25, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 0.5, format: (v) => v.toFixed(2) + 'x' },
    { key: 'speed', label: 'Speed', min: 0.05, max: 4, step: 0.01, def: 0.1, format: (v) => v.toFixed(2) + ' Hz' },
  ],
  build(ctx, out, v, shared) {
    const now = ctx.currentTime;

    // Layer-level volume + damping (the old hiFreqGain / hiDampingFilter).
    const master = ctx.createGain();
    master.gain.setValueAtTime(v.volume, now);
    const damp = ctx.createBiquadFilter();
    damp.type = 'lowpass';
    damp.frequency.setValueAtTime(1200 * Math.min(1.5, v.pitch), now);
    master.connect(damp);
    damp.connect(out);

    const src = ctx.createBufferSource();
    src.buffer = shared.noiseBuffer;
    src.loop = true;

    const f1 = ctx.createBiquadFilter();
    const f2 = ctx.createBiquadFilter();
    const f3 = ctx.createBiquadFilter();
    f1.type = f2.type = f3.type = 'bandpass';
    f1.Q.setValueAtTime(22, now);
    f2.Q.setValueAtTime(26, now);
    f3.Q.setValueAtTime(18, now);
    f1.frequency.setValueAtTime(380 * v.pitch, now);
    f2.frequency.setValueAtTime(740 * v.pitch, now);
    f3.frequency.setValueAtTime(1290 * v.pitch, now);

    src.connect(f1);
    src.connect(f2);
    src.connect(f3);
    f1.connect(master);
    f2.connect(master);
    f3.connect(master);

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(260 * v.pitch, now);
    osc2.frequency.setValueAtTime(415 * v.pitch, now);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.08, now);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(v.speed, now);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.setValueAtTime(0.04, now);

    lfo.connect(lfoDepth);
    lfoDepth.connect(oscGain.gain);
    osc1.connect(oscGain);
    osc2.connect(oscGain);
    oscGain.connect(master);

    src.start();
    osc1.start();
    osc2.start();
    lfo.start();

    return {
      update(key, value) {
        const t = ctx.currentTime;
        if (key === 'volume') master.gain.setValueAtTime(value, t);
        if (key === 'pitch') {
          f1.frequency.setValueAtTime(380 * value, t);
          f2.frequency.setValueAtTime(740 * value, t);
          f3.frequency.setValueAtTime(1290 * value, t);
          osc1.frequency.setValueAtTime(260 * value, t);
          osc2.frequency.setValueAtTime(415 * value, t);
          damp.frequency.setValueAtTime(1200 * Math.min(1.5, value), t);
        }
        if (key === 'speed') lfo.frequency.setValueAtTime(value, t);
      },
      stop() {
        try { src.stop(); } catch (e) {}
        try { osc1.stop(); } catch (e) {}
        try { osc2.stop(); } catch (e) {}
        try { lfo.stop(); } catch (e) {}
      },
    };
  },
};
