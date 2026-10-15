# Contributing to Warp

Thanks for taking the time to contribute! We keep things simple and try to keep friction as low as possible.

## Quick Guidelines

- **Fixes (`FIX`)**: Small bug fixes, typos, or minor tweaks can be submitted anytime via Pull Request.
- **Features (`FEAT`)**: Larger architectural changes or new features **must be discussed first**. Please open an Issue before writing code so we don't waste your time building something that isn't aligned with the project.
- **AI-Assisted Code**: AI-generated contributions are welcome. However, as the PR author, **you take full responsibility** for the code you submit. Ensure it is accurate, tested, and high-quality-no unreviewed slop, please.

## Local Setup

Warp is a single static page - there is no build step. Serve the repo root with any static file server and open it in a browser:

```sh
python3 -m http.server 8080   # or: npx serve .
```

## Running the Tests

Headless Chrome tests live in [`tests/`](tests/README.md) and cover the service worker, offline mode, install CTA, control panel, visual effects, and settings persistence. They require Node.js and a Chrome/Chromium binary (see `tests/README.md` for environment variables):

```sh
cd tests
npm install   # once - installs puppeteer-core
npm test      # serves the repo root and runs all suites
```

Please run the suite before submitting any pull request.

## Adding a Sound to the Sound Bank

Every ambient sound is a self-describing **layer** in its own file under [`sounds/`](sounds/):

```
sounds/
  core-hum.js   one file per sound
  pulse.js
  wind.js
  cooling.js
  borg.js       the hidden one - tune away
  bank.js       registry: import the layer, add it to SOUND_BANK
  engine.js     builds the Web Audio graph from the bank (don't touch)
  noise.js      shared pink-noise buffer
```

A layer exports one default descriptor:

```js
export default {
  id: 'my-sound',           // unique key (settings, presets)
  label: 'My Sound',        // name shown in the panel
  flavor: 'A line of lore shown in the sub-menu.',
  enabledByDefault: false,  // on/off after a Reset
  params: [                 // sub-menu sliders, in display order
    { key: 'volume', label: 'Volume', min: 0, max: 1, step: 0.01, def: 0.2, format: (v) => Math.round(v * 100) + '%' },
  ],
  build(ctx, out, values, shared) {
    // Create Web Audio nodes, connect them to `out`, start the sources.
    // `shared.noiseBuffer` is a 4 s shared pink-noise buffer.
    return {
      update(key, value) { /* live-tune one param */ },
      stop() { /* stop every source you started */ },
    };
  },
};
```

Then add `import mySound from './my-sound.js';` in `sounds/bank.js` and drop `mySound` into `SOUND_BANK`. The panel row, sub-menu, persistence, reset, and warp-preset plumbing all work off the descriptor automatically.

Notes:

- **Presets** ([`presets/warp.js`](presets/warp.js)) are plain `layerId -> {param: value}` maps; add your sound to the warp factors there if it should respond to them.
- **Offline PWA**: add the new file to `CORE_ASSETS` in `sw.js` and bump `CACHE_NAME` so installed copies can fetch it.
- **Egg-locked sounds** set `egg: 'name'` and only appear in the panel while `state.egg.name` is true.
- **Tests**: `tests/test-soundbank.js` exercises the bank through the `?debug=1` handle - extend it when you add a layer.

## How to Submit a Pull Request

1. **Title Format**: Start your PR title with either `FIX:` or `FEAT:`.
   - Example: `FIX: sound does not resume after reload on iOS Safari`
   - Example: `FEAT: add per-star color temperature control`
2. Keep your PR focus tight and readable.
3. Verify your changes locally before opening the PR (see *Running the Tests* above).
