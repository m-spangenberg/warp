// The Collective - placeholder for the hidden Borg easter egg.
//
// This is an early approximation of the Collective's drone, not the final
// sound design: a beating sawtooth drone (the power field), a wobbling
// mid growl (mechanics), and a cold high shimmer (dead air). The final
// Borg sound is still under investigation - tune the constants below or
// replace build() once the design lands. Everything else (panel row,
// presets, persistence) works from the descriptor, not the internals.

export default {
  id: 'borg',
  label: 'The Collective',
  flavor: 'Assimilation in progress. (Prototype - tuning in progress.)',
  egg: 'borg', // only visible in the panel while the easter egg is active
  enabledByDefault: true,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.2, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
    { key: 'speed', label: 'Speed', min: 0.05, max: 4, step: 0.01, def: 0.3, format: (v) => v.toFixed(2) + ' Hz' },
  ],
  build(ctx, out, v, shared) {
    const now = ctx.currentTime;
    const p = v.pitch;

    const master = ctx.createGain();
    master.gain.setValueAtTime(v.volume, now);
    master.connect(out);

    // 1. Beating drone: two detuned sawtooths, heavily low-passed -
    //    the low, flat "power field" rumble.
    const drone1 = ctx.createOscillator();
    const drone2 = ctx.createOscillator();
    drone1.type = 'sawtooth';
    drone2.type = 'sawtooth';
    drone1.frequency.setValueAtTime(40 * p, now);
    drone2.frequency.setValueAtTime(40.8 * p, now);
    const droneFilter = ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(150 * p, now);
    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0.5, now);
    drone1.connect(droneFilter);
    drone2.connect(droneFilter);
    droneFilter.connect(droneGain);
    droneGain.connect(master);
    drone1.start();
    drone2.start();

    // 2. Mechanical wobble: a sawtooth whose pitch is wandered by the
    //    speed LFO, bandpassed into a narrow growl.
    const wob = ctx.createOscillator();
    wob.type = 'sawtooth';
    wob.frequency.setValueAtTime(170 * p, now);
    const wobLFO = ctx.createOscillator();
    wobLFO.frequency.setValueAtTime(v.speed, now);
    const wobDepth = ctx.createGain();
    wobDepth.gain.setValueAtTime(12 * p, now);
    wobLFO.connect(wobDepth);
    wobDepth.connect(wob.frequency);
    const wobFilter = ctx.createBiquadFilter();
    wobFilter.type = 'bandpass';
    wobFilter.frequency.setValueAtTime(210 * p, now);
    wobFilter.Q.setValueAtTime(5, now);
    const wobGain = ctx.createGain();
    wobGain.gain.setValueAtTime(0.35, now);
    wob.connect(wobFilter);
    wobFilter.connect(wobGain);
    wobGain.connect(master);
    wob.start();
    wobLFO.start();

    // 3. Cold shimmer: high-passed noise, very quiet, breathing slowly -
    //    the hiss of dead air through bulkheads.
    const shim = ctx.createBufferSource();
    shim.buffer = shared.noiseBuffer;
    shim.loop = true;
    const shimFilter = ctx.createBiquadFilter();
    shimFilter.type = 'highpass';
    shimFilter.frequency.setValueAtTime(3500, now);
    const shimGain = ctx.createGain();
    shimGain.gain.setValueAtTime(0.12, now);
    const shimLFO = ctx.createOscillator();
    shimLFO.frequency.setValueAtTime(v.speed * 0.5, now);
    const shimDepth = ctx.createGain();
    shimDepth.gain.setValueAtTime(0.08, now);
    shimLFO.connect(shimDepth);
    shimDepth.connect(shimGain.gain);
    shim.connect(shimFilter);
    shimFilter.connect(shimGain);
    shimGain.connect(master);
    shim.start(0, Math.random() * shared.noiseBuffer.duration);
    shimLFO.start();

    return {
      update(key, value) {
        const t = ctx.currentTime;
        if (key === 'volume') master.gain.setValueAtTime(value, t);
        if (key === 'pitch') {
          const q = value;
          drone1.frequency.setValueAtTime(40 * q, t);
          drone2.frequency.setValueAtTime(40.8 * q, t);
          droneFilter.frequency.setValueAtTime(150 * q, t);
          wob.frequency.setValueAtTime(170 * q, t);
          wobDepth.gain.setValueAtTime(12 * q, t);
          wobFilter.frequency.setValueAtTime(210 * q, t);
        }
        if (key === 'speed') {
          wobLFO.frequency.setValueAtTime(value, t);
          shimLFO.frequency.setValueAtTime(value * 0.5, t);
        }
      },
      stop() {
        try { drone1.stop(); } catch (e) {}
        try { drone2.stop(); } catch (e) {}
        try { wob.stop(); } catch (e) {}
        try { wobLFO.stop(); } catch (e) {}
        try { shim.stop(); } catch (e) {}
        try { shimLFO.stop(); } catch (e) {}
      },
    };
  },
};
