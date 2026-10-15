# Changelog

All notable changes to Warp are documented in this file. Each version lists its changes by type: Added, Changed, Deprecated, Removed, Fixed, Security.

## v0.4.0

- Added sound-reactive visuals (opt-in, default off): with the new Reactive switch, the star streaks breathe with the reactor pulse LFO and the edge glow follows the core hum. The engine integrates both on the audio clock, so the canvas moves *with* the sound instead of beside it. Off, the starfield and soundscape stay fully independent.
- Added three new ambient layers (all synthesized, no assets, off by default so the stock sound is unchanged):
  - Deflector - a soft high shimmer of the deflector field on a very slow LFO, very quiet.
  - Comms - a muffled bridge conversation: bandpassed noise chopped into word-like bursts with sentence pauses.
  - Reactor - rare, slow metallic creaks: the hull and reactor settling.
- Added a hidden proximity ping: tap the starfield five times and the ship answers with a faint sonar ping through the FX chain. One-shots don't belong in the sleep ambient, but as a secret they're delightful.
- Added faint LCARS console beeps: the panel waking, warp preset selection, the sound toggle, and arming standby each get a soft computer acknowledgement. Very quiet, and only with sound on.
- Added a Standby sleep timer: fade the whole mix to silence over 25/50/100 minutes - the ship goes into standby. The fade is wall-clock based and persisted, so it survives reloads and background suspensions; the countdown shows in the panel, and the master slider always takes the wheel back.
- Changed: settings persist the new `reactive` and `standby` state under `warp.settings.v2` (new keys default cleanly - no migration needed).
- Changed: the new layers join the warp factor presets (deflector and reactor respond to the warp factor; comms doesn't - bridge chatter is independent of speed).
- Changed: the service worker precache includes the new sound files (`starfield-warp-v4`).
- Changed: the headless test suite covers the new bank layers, the reactive coupling, the proximity ping, the standby fade lifecycle, and the console beeps (`tests/test-soundbank.js`).

## v0.3.0

- Added a modular sound bank: every soundscape element is now a self-describing layer in its own file under `sounds/` (core hum, pulse, wind, cooling). Adding a new sound is dropping in one file - no engine, panel, or persistence plumbing (see CONTRIBUTING.md).
- Added warp factor presets: Impulse (sub-light - the slowest speed), Warp 4 (cruise, the stock sound), Warp 8, and Warp 9, each re-tuning the entire sound bank. Tweak a layer manually and the setting drops to Custom.
- Added per-sound controls: the soundscape section now lists every sound in the bank with an on/off toggle and an expandable sub-menu with volume, pitch, and speed sliders plus a line of lore.
- Added a master volume slider (output volume was previously fixed).
- Added a hidden sound to the bank. Find it in the corner of the control panel. \U0001F596
- Added Counselor's Corner: one Star Trek quote a day at the bottom of the control panel. Quotes live in `data/quotes.txt` (one per block: a text line, then an attribution line starting with `—`).
- Changed: settings now persist under `warp.settings.v2`; existing `warp.settings.v1` settings migrate automatically on load.
- Changed: the cooling layer now runs through the same reverb/chorus/width chain as the other sounds, so Phase Dups affect it too (slightly richer).
- Changed: the service worker precache includes the sound bank, presets, and quotes (`starfield-warp-v2`).
- Changed: the headless test suite covers the bank registry, auto-generated panel rows, warp presets, the hidden easter egg, quote display, and v1→v2 migration (`tests/test-soundbank.js`).
- Fixed sound coming back ~1 s after switching the master Sound toggle off: the iOS interruption-recovery "blind resume" now respects a user mute (inherited from v0.2.1).
- Fixed the hidden Collective layer bleeding into the default soundscape: egg-locked layers are now forced silent by the engine while their easter egg is inactive.
- Changed sound names and lore: Core Hum → Core; wind → “Undulating isolinear cooling fluidics”; cooling → “Muffled inertial dampening field resonators”.

## v0.2.1

- Fixed audio crackling and stuttering on iOS: the AudioContext is now pinned to a fixed 44.1 kHz sample rate (falling back to the device default when unsupported), so mid-session hardware rate changes no longer force an internal resample of the whole graph.
- Fixed iOS Web Audio dropouts at start: on iOS, a fraction of a second of silence now plays through a native HTML5 audio element before the context resumes, forcing the media engine into its high-performance state.
- Fixed sound stopping for good after an iOS interruption (incoming call, Siri, Control Center, app switch): context state changes are now monitored, and a one-shot resume is armed on the next user touch whenever the user still has sound on.

## v0.2.0

- Added a Rear View toggle to the control panel: the camera faces away from the direction of travel, so stars enter from the edge of the screen and streak inward toward the vanishing point (default remains the front view). The view mode is persisted with the other settings and restored on launch.
- Added test coverage for star motion direction in both views (via an opt-in `?debug=1` debug hook) and for the new toggle's persistence.

## v0.1.1

- Fixed sound not starting after reload on mobile browsers that create the audio context in a suspended state (e.g. iOS Safari); the context is now resumed within the first user gesture, and tap-up events (touchend/click) now count as the unlocking gesture.
- Fixed the sound toggle saving stale settings: the switch state is now updated synchronously, so persisted settings always match what the user sees after toggling sound on or off.

## v0.1.0

- Added PWA support: web app manifest, service worker, and app icons. Warp can now be installed and runs fully offline.
- Added an install call-to-action at the bottom of the screen on first launch. Dismissible by tap or click, and shows home-screen instructions on iOS.
- Added an Aberration slider that adds chromatic aberration to the star trails (0–100%, default off).
- Added an Edge Glow slider that adds a blue glow to the edges of the screen, matching the install CTA's glow (0–100%, default off).
- Added persistence of control panel settings across visits (localStorage).
- Added a Reset control that restores all panel settings to their defaults.
- Added a version tag to the control panel.
- Added the social media preview image to the README and pointed og:image at it (previously a GitHub placeholder).
- Added starfield and soundscape groupings to the control panel.
- Added keyboard support (Enter/Space) and ARIA switch roles to the toggle controls.
- Added a headless Chrome test suite (tests/) with automated screenshots for PWA, control panel, effects, and settings behavior.
- Changed the control panel to be hidden by default, revealed from a small icon in the top-right corner (which peeks slightly brighter while you move over the scene), and shown centered on screen with the same blue glow as the install CTA; auto-hides when idle.
- Changed the control panel to a centered, scrollable sheet with starfield and soundscape sections on both desktop and mobile.
- Changed the install call-to-action and corner controls to respect the safe-area insets of notched iOS devices.
- Changed starfield rendering to scale with devicePixelRatio for sharp stars on high-DPI displays.
- Changed the viewport to use viewport-fit=cover so the installed app renders edge-to-edge on notched iOS devices.
- Changed the social preview image to the recommended 1280x640 dimensions.
- Fixed hidden controls (panel, install CTA) leaking into the keyboard tab order.
