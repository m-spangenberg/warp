// The Warp sound bank.
//
// Each sound is a self-describing layer in its own file - adding a new
// sound is dropping a new file here and in the descriptor list below;
// the control panel, settings persistence, and warp presets all work
// from these descriptors.
//
// Layer descriptor contract:
//   id               unique key (settings, presets)
//   label            name shown in the control panel
//   flavor           one line of lore shown in the layer's sub-menu
//   enabledByDefault true if the sound is on when settings are reset
//   params           sub-menu sliders: { key, label, min, max, step, def, format }
//   egg              (optional) layer only appears in the panel while the
//                    named easter egg is active (see settings.egg)
//   build(ctx, out, values, shared) -> { update(key, value), stop() }
//     ctx      the AudioContext
//     out      the node the layer's audio should connect to (the engine
//              creates a per-layer gate so the engine can mute it)
//     values   current values for every entry in `params`
//     shared   { noiseBuffer } - the shared 4 s pink noise buffer
//
// Start every oscillator/buffer source inside build(); stop() must stop
// all of them. Live retuning goes through update().

import coreHum from './core-hum.js';
import pulse from './pulse.js';
import wind from './wind.js';
import cooling from './cooling.js';
import borg from './borg.js';

export const SOUND_BANK = [coreHum, pulse, wind, cooling, borg];

export const bankLayer = (id) => SOUND_BANK.find((l) => l.id === id);
