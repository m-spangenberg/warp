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

## How to Submit a Pull Request

1. **Title Format**: Start your PR title with either `FIX:` or `FEAT:`.
   - Example: `FIX: sound does not resume after reload on iOS Safari`
   - Example: `FEAT: add per-star color temperature control`
2. Keep your PR focus tight and readable.
3. Verify your changes locally before opening the PR (see *Running the Tests* above).
