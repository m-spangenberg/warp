# Warp test suite

Headless Chrome tests that verify the app's behavior end-to-end. Each suite
prints a JSON result object; screenshots land in `.shots/` at the repo root.

| Suite | Covers |
|---|---|
| `test-core.js` | Service worker + offline mode, install CTA (show/dismiss/persist), control panel (open/close via the corner icon, progressive reveal), mobile sheet layout |
| `test-effects.js` | Aberration slider (pixel-level fringe check), edge glow overlay, high-DPI canvas scaling |
| `test-settings.js` | Settings persistence (save/restore/reset), version tag, toggle accessibility (ARIA + keyboard) |

## Run

Requires Node.js and a Chrome/Chromium binary (defaults to `/usr/bin/google-chrome`).

```sh
cd tests
npm install        # once — installs puppeteer-core
npm test           # serves the repo root on :8377 and runs all suites
```

Run a single suite:

```sh
node run.js test-effects.js
```

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `WARP_URL` | `http://localhost:8377/` | Site under test (used when running a suite directly) |
| `WARP_PORT` | `8377` | Port for `run.js`'s built-in static server |
| `WARP_SHOTS` | `<repo>/.shots` | Screenshot output directory |
| `CHROME_PATH` | `/usr/bin/google-chrome` | Chrome/Chromium binary to launch |
