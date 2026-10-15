// The Warp engine: builds the Web Audio graph from the sound bank.
//
// Each engine *instance* (the main one plus the "Phase Dups") owns its
// own effects chain (reverb, chorus, mid-side stereo widening) and its
// own copy of every bank layer. The per-instance randomization (LFO
// rates, delay times, noise offsets) keeps duplicates drifting out of
// phase, which is what makes the dups sound wider rather than louder.
//
// Every layer sits behind its own gain gate, so enabling/disabling a
// sound is a short ramp on the gate and never rebuilds the graph.

import { SOUND_BANK } from './bank.js';
import { makePinkNoiseBuffer } from './noise.js';

// Short exponential ramp for gate opens/closes (click-free on/off).
const GATE_RAMP = 0.05;

function makeReverbBuffer(ctx) {
  const duration = 1.2;
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * duration;
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const decay = Math.exp(-i / (sampleRate * 0.15));
    left[i] = (Math.random() * 2 - 1) * decay;
    right[i] = (Math.random() * 2 - 1) * decay;
  }
  return impulse;
}

export class WarpEngine {
  /**
   * @param {AudioContext} ctx
   * @param {object} state snapshot: { master, fx: {width, reverb, chorus},
   *   layers: { [layerId]: { enabled, ...paramValues } } }
   */
  constructor(ctx, state) {
    this.ctx = ctx;
    this.state = state;

    this.noiseBuffer = makePinkNoiseBuffer(ctx);
    this.reverbBuffer = makeReverbBuffer(ctx);

    this.master = ctx.createGain();
    this.master.gain.setValueAtTime(state.master, ctx.currentTime);
    this.master.connect(ctx.destination);

    this.instances = [];
    this.buildInstance();
  }

  buildInstance() {
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Instance output bus (main + one per phase duplicate).
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(1.0, now);
    bus.connect(this.master);

    // Dry path (70%).
    const dryBus = ctx.createGain();
    dryBus.gain.setValueAtTime(0.7, now);
    dryBus.connect(bus);

    // Independent reverb engine (shared impulse, per-instance mix).
    const convolver = ctx.createConvolver();
    convolver.buffer = this.reverbBuffer;
    const reverbGain = ctx.createGain();
    reverbGain.gain.setValueAtTime(this.state.fx.reverb, now);
    convolver.connect(reverbGain);
    reverbGain.connect(bus);

    // Independent chorus engine (per-instance LFO rate -> dups drift).
    const chorusDelay = ctx.createDelay();
    chorusDelay.delayTime.setValueAtTime(0.025, now);
    const chorusLFO = ctx.createOscillator();
    chorusLFO.frequency.setValueAtTime(0.28 + Math.random() * 0.04, now);
    const chorusDepth = ctx.createGain();
    chorusDepth.gain.setValueAtTime(0.003, now);
    chorusLFO.connect(chorusDepth);
    chorusDepth.connect(chorusDelay.delayTime);
    chorusLFO.start();
    const chorusGain = ctx.createGain();
    chorusGain.gain.setValueAtTime(this.state.fx.chorus, now);
    chorusDelay.connect(chorusGain);
    chorusGain.connect(bus);

    // Independent mid-side stereo widening matrix.
    const synthBus = ctx.createGain();
    const widthVal = this.state.fx.width;
    const midGain = ctx.createGain();
    midGain.gain.setValueAtTime(1 - widthVal * 0.25, now);
    const sideDelay = ctx.createDelay();
    sideDelay.delayTime.setValueAtTime(0.012 + Math.random() * 0.004, now);
    const sideAllpass = ctx.createBiquadFilter();
    sideAllpass.type = 'allpass';
    sideAllpass.frequency.setValueAtTime(650 + (Math.random() - 0.5) * 40, now);
    const sideGain = ctx.createGain();
    sideGain.gain.setValueAtTime(widthVal * 0.85, now);
    const sideInverter = ctx.createGain();
    sideInverter.gain.setValueAtTime(-1, now);
    const merger = ctx.createChannelMerger(2);

    synthBus.connect(midGain);
    synthBus.connect(sideDelay);
    sideDelay.connect(sideAllpass);
    sideAllpass.connect(sideGain);
    midGain.connect(merger, 0, 0);
    midGain.connect(merger, 0, 1);
    sideGain.connect(merger, 0, 0);
    sideGain.connect(sideInverter);
    sideInverter.connect(merger, 0, 1);
    merger.connect(dryBus);
    merger.connect(convolver);
    merger.connect(chorusDelay);

    // Bank layers, each behind its own gate.
    const layers = {};
    for (const def of SOUND_BANK) {
      const st = this.state.layers[def.id] || {};
      const values = {};
      for (const p of def.params) values[p.key] = st[p.key] ?? p.def;
      const gate = ctx.createGain();
      gate.gain.setValueAtTime(st.enabled ? 1 : 0, now);
      gate.connect(synthBus);
      layers[def.id] = {
        def,
        gate,
        api: def.build(ctx, gate, values, { noiseBuffer: this.noiseBuffer }),
      };
    }

    const inst = { bus, dryBus, midGain, sideGain, reverbGain, chorusGain, chorusLFO, layers };
    inst.stop = () => {
      for (const layer of Object.values(layers)) layer.api.stop();
      try { chorusLFO.stop(); } catch (e) {}
      setTimeout(() => { bus.disconnect(); }, 50);
    };

    this.instances.push(inst);
    return inst;
  }

  // Total instance count (main + duplicates). The main instance is always #0.
  setInstanceCount(n) {
    while (this.instances.length < n) this.buildInstance();
    while (this.instances.length > n) {
      const inst = this.instances.pop();
      if (inst) inst.stop();
    }
  }

  setLayerEnabled(id, on) {
    const now = this.ctx.currentTime;
    for (const inst of this.instances) {
      const layer = inst.layers[id];
      if (!layer) continue;
      this.state.layers[id].enabled = on;
      layer.gate.gain.cancelScheduledValues(now);
      layer.gate.gain.setTargetAtTime(on ? 1 : 0, now, GATE_RAMP);
    }
  }

  setLayerValue(id, key, value) {
    if (this.state.layers[id]) this.state.layers[id][key] = value;
    for (const inst of this.instances) {
      const layer = inst.layers[id];
      if (layer) layer.api.update(key, value);
    }
  }

  setFx(key, value) {
    const now = this.ctx.currentTime;
    this.state.fx[key] = value;
    for (const inst of this.instances) {
      if (key === 'width') {
        inst.midGain.gain.setValueAtTime(1 - value * 0.25, now);
        inst.sideGain.gain.setValueAtTime(value * 0.85, now);
      } else if (key === 'reverb') {
        inst.reverbGain.gain.setValueAtTime(value, now);
      } else if (key === 'chorus') {
        inst.chorusGain.gain.setValueAtTime(value, now);
      }
    }
  }

  setMasterVolume(value) {
    this.state.master = value;
    this.master.gain.setValueAtTime(value, this.ctx.currentTime);
  }

  dispose() {
    for (const inst of this.instances) inst.stop();
    this.instances = [];
    setTimeout(() => { this.master.disconnect(); }, 50);
  }
}
