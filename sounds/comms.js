// Comms - a muffled bridge conversation two rooms away: looped pink
// noise bandpassed into the voice band, low-pass "muffled", and chopped
// into word-like amplitude bursts by a random syllable scheduler (short
// gaps between words, the occasional longer pause between sentences).
// A slow LFO wanders the band center so the murmur drifts like speech.

export default {
  id: 'comms',
  label: 'Comms',
  flavor: 'A bridge conversation, muffled through two bulkheads.',
  enabledByDefault: false,
  params: [
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.12, format: (v) => Math.round(v * 100) + '%' },
    { key: 'pitch', label: 'Pitch', min: 0.5, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
    { key: 'speed', label: 'Rate', min: 0.25, max: 3, step: 0.05, def: 1, format: (v) => v.toFixed(2) + 'x' },
  ],
  build(ctx, out, v, shared) {
    const now = ctx.currentTime;
    let rate = v.speed; // live copy: the scheduler reads this between calls

    // Layer volume + the "two rooms away" muffle.
    const master = ctx.createGain();
    master.gain.setValueAtTime(v.volume, now);
    const muffle = ctx.createBiquadFilter();
    muffle.type = 'lowpass';
    muffle.frequency.setValueAtTime(1400 * Math.min(1.5, v.pitch), now);
    master.connect(muffle);
    muffle.connect(out);

    const src = ctx.createBufferSource();
    src.buffer = shared.noiseBuffer;
    src.loop = true;

    // Voice band, kept wide (low Q) so it reads as speech texture, not a tone.
    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.setValueAtTime(520 * v.pitch, now);
    band.Q.setValueAtTime(0.9, now);
    const boost = ctx.createGain();
    boost.gain.setValueAtTime(2.2, now);

    // The word-like amplitude: bursts with a soft attack, a low floor
    // between syllables (a room two away never goes fully silent), and
    // random gaps - the occasional long one is the sentence pause.
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, now);

    src.connect(band);
    band.connect(boost);
    boost.connect(env);
    env.connect(master);

    // Slow formant drift.
    const drift = ctx.createOscillator();
    drift.frequency.setValueAtTime(0.22, now);
    const driftDepth = ctx.createGain();
    driftDepth.gain.setValueAtTime(160 * v.pitch, now);
    drift.connect(driftDepth);
    driftDepth.connect(band.frequency);

    let alive = true;
    let timer = null;

    const syllable = () => {
      if (!alive) return;
      const t = ctx.currentTime;
      // Scale each word off the current layer volume (live, slider-driven).
      const peak = Math.max(0.001, master.gain.value) * (0.35 + Math.random() * 0.65);
      const dur = 0.09 + Math.random() * 0.22;
      env.gain.cancelScheduledValues(t);
      env.gain.setTargetAtTime(peak, t, 0.045);
      env.gain.setTargetAtTime(peak * 0.25, t + dur, 0.06);
      const sentencePause = Math.random() < 0.18;
      const gap = sentencePause
        ? 1.5 + Math.random() * 4
        : 0.08 + Math.random() * 0.3;
      timer = setTimeout(syllable, (gap / rate) * 1000);
    };

    src.start(0, Math.random() * shared.noiseBuffer.duration);
    drift.start();
    timer = setTimeout(syllable, (0.3 + Math.random() * 1.5) * 1000);

    return {
      update(key, value) {
        const t = ctx.currentTime;
        if (key === 'volume') master.gain.setValueAtTime(value, t);
        if (key === 'pitch') {
          band.frequency.setValueAtTime(520 * value, t);
          driftDepth.gain.setValueAtTime(160 * value, t);
          muffle.frequency.setValueAtTime(1400 * Math.min(1.5, value), t);
        }
        if (key === 'speed') rate = value;
      },
      stop() {
        alive = false;
        clearTimeout(timer);
        try { src.stop(); } catch (e) {}
        try { drift.stop(); } catch (e) {}
      },
    };
  },
};
