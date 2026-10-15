// Warp factor presets: named re-tunes of the whole sound bank.
//
// Each preset is a map of layerId -> {paramKey: value}. Applying a preset
// only changes values, never which layers are on or off. Warp 4 matches
// the bank's default parameters exactly, so it is the "stock sound".
// Impulse is the slowest: sub-light, quiet, and deep.

export const WARP_PRESETS = [
  {
    id: 'impulse',
    label: 'Impulse',
    hint: 'Sub-light cruise - the slowest speed.',
    values: {
      'core-hum': { volume: 0.2, pitch: 0.75 },
      'pulse': { volume: 0.1, speed: 0.15 },
      'wind': { volume: 0.1, speed: 0.05 },
      'cooling': { volume: 0.05, speed: 0.05 },
      'deflector': { volume: 0.02, speed: 0.03 },
      'reactor': { volume: 0.08, speed: 0.5 },
    },
  },
  {
    id: 'warp-4',
    label: 'Warp 4',
    hint: 'Cruising speed - the stock sound.',
    values: {
      'core-hum': { volume: 0.3, pitch: 1 },
      'pulse': { volume: 0.15, speed: 0.77 },
      'wind': { volume: 0.28, speed: 0.13 },
      'cooling': { volume: 0.25, pitch: 0.5, speed: 0.1 },
      'deflector': { volume: 0.05, speed: 0.05 },
      'reactor': { volume: 0.15, speed: 1 },
    },
  },
  {
    id: 'warp-8',
    label: 'Warp 8',
    hint: 'High warp.',
    values: {
      'core-hum': { volume: 0.38, pitch: 1.15 },
      'pulse': { volume: 0.2, speed: 1.1 },
      'wind': { volume: 0.35, speed: 0.22, pitch: 1.2 },
      'cooling': { volume: 0.3, pitch: 0.75, speed: 0.18 },
      'deflector': { volume: 0.08, speed: 0.08 },
      'reactor': { volume: 0.2, speed: 1.6 },
    },
  },
  {
    id: 'warp-9',
    label: 'Warp 9',
    hint: 'Sustained high warp.',
    values: {
      'core-hum': { volume: 0.45, pitch: 1.3 },
      'pulse': { volume: 0.25, speed: 1.5 },
      'wind': { volume: 0.45, speed: 0.32, pitch: 1.45 },
      'cooling': { volume: 0.35, pitch: 1, speed: 0.3 },
      'deflector': { volume: 0.1, speed: 0.12 },
      'reactor': { volume: 0.25, speed: 2.2 },
    },
  },
];
