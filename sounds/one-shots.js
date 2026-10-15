// One-shots: sounds that never belong to the ambient bed. They fire on a
// moment and are gone - the hidden proximity ping and the faint LCARS
// computer sounds the ship uses to acknowledge the console.
//
// Each is a builder (ctx, out) => {} that starts its own sources,
// connected to `out`. The engine's fireOneShot() calls them against the
// main instance's synth bus, so they pass through the same
// reverb/chorus/width as the ambient - the ping echoes in the ship, not
// in your room. Nothing in here runs continuously, and nothing in here
// appears in the sound bank.

// Envelope helper: 0 -> peak (linear attack) -> near-silence (exp decay).
function envelope(ctx, t, peak, attack, decay) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.001, t + attack + decay);
  return g;
}

// A short sine tone with an optional downward glide.
function tone(ctx, out, t, { type = 'sine', f0, f1 = null, dur, peak, attack = 0.004 }) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, t);
  if (f1 !== null) osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = envelope(ctx, t, peak, attack, dur);
  osc.connect(g);
  g.connect(out);
  osc.start(t);
  osc.stop(t + attack + dur + 0.05);
  return osc;
}

// Proximity ping - the hidden easter egg (five quick taps on the
// starfield): a faint high sonar ping with a soft low "contact" thump.
export function proximityPing(ctx, out) {
  const t = ctx.currentTime + 0.01;
  tone(ctx, out, t, { f0: 1650, dur: 1.5, peak: 0.2 });
  tone(ctx, out, t, { f0: 210, dur: 0.4, peak: 0.12, attack: 0.003 });
}

// LCARS console sounds - the computer acknowledging the crew. All of
// them are deliberately very quiet: a flicker at the edge of hearing.

// blip - the console waking (panel open): a quick rising two-note "beep-boop".
export function lcarsBlip(ctx, out) {
  const t = ctx.currentTime + 0.005;
  tone(ctx, out, t, { f0: 990, dur: 0.05, peak: 0.08 });
  tone(ctx, out, t + 0.055, { f0: 1480, dur: 0.07, peak: 0.08 });
}

// chirp - a command acknowledged (warp preset selected): the soft "brrt".
export function lcarsChirp(ctx, out) {
  const t = ctx.currentTime + 0.005;
  tone(ctx, out, t, { f0: 1500, f1: 1150, dur: 0.14, peak: 0.12 });
}

// chime - the intercom (sound switched on): a soft major-third bell.
export function lcarsChime(ctx, out) {
  const t = ctx.currentTime + 0.005;
  tone(ctx, out, t, { f0: 660, dur: 0.35, peak: 0.09 });
  tone(ctx, out, t, { f0: 990, dur: 0.35, peak: 0.07 });
}

// standby - the ship going to standby (sleep timer armed): a slow
// descending two-step, like power levels winding down.
export function lcarsStandby(ctx, out) {
  const t = ctx.currentTime + 0.005;
  tone(ctx, out, t, { f0: 880, dur: 0.22, peak: 0.13 });
  tone(ctx, out, t + 0.26, { f0: 440, dur: 0.4, peak: 0.12 });
}

export const ONE_SHOTS = {
  ping: proximityPing,
  blip: lcarsBlip,
  chirp: lcarsChirp,
  chime: lcarsChime,
  standby: lcarsStandby,
};
