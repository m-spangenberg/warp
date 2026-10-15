// Wind - undulating airflow across the saucer: looped pink noise through
// a bandpass filter (~160 Hz) whose center frequency and gain are both
// wandered by a very slow LFO (default ~0.13 Hz).

export default {
  id: 'wind',
  label: 'Wind',
  flavor: 'Undulating airflow over the saucer.',
  enabledByDefault: true,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.28, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
    { key: 'speed', label: 'Speed', min: 0.02, max: 1, step: 0.01, def: 0.13, format: (v) => v.toFixed(2) + ' Hz' },
  ],
  build(ctx, out, v, shared) {
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = shared.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(160 * v.pitch, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(v.volume, now);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(v.speed, now);
    const freqMod = ctx.createGain();
    freqMod.gain.setValueAtTime(75 * v.pitch, now);
    const gainMod = ctx.createGain();
    gainMod.gain.setValueAtTime(0.12, now);

    lfo.connect(freqMod);
    freqMod.connect(filter.frequency);
    lfo.connect(gainMod);
    gainMod.connect(gain.gain);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    src.start(0, Math.random() * shared.noiseBuffer.duration);
    lfo.start();

    return {
      update(key, value) {
        const t = ctx.currentTime;
        if (key === 'volume') gain.gain.setValueAtTime(value, t);
        if (key === 'pitch') {
          filter.frequency.setValueAtTime(160 * value, t);
          freqMod.gain.setValueAtTime(75 * value, t);
        }
        if (key === 'speed') lfo.frequency.setValueAtTime(value, t);
      },
      stop() {
        try { src.stop(); } catch (e) {}
        try { lfo.stop(); } catch (e) {}
      },
    };
  },
};
