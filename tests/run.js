// Serves the project root and runs the test suites against it.
// Zero dependencies of its own — needs only `npm install` in tests/
// (puppeteer-core) and a Chrome/Chromium binary on the system.
//
// Usage:
//   node run.js                 # run all suites
//   node run.js test-core.js    # run a single suite
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.WARP_PORT || 8377);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const ALL_SUITES = ['test-core.js', 'test-effects.js', 'test-settings.js'];

function createServer() {
  return http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    const file = path.normalize(path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath));
    if (!file.startsWith(ROOT + path.sep)) {
      res.writeHead(403);
      return res.end('forbidden');
    }
    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end('not found');
      }
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      });
      res.end(data);
    });
  });
}

(async () => {
  const suites = process.argv.slice(2).length ? process.argv.slice(2) : ALL_SUITES;
  const server = createServer();
  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`Serving ${ROOT} at http://localhost:${PORT}/\n`);

  let failed = false;
  for (const suite of suites) {
    console.log(`=== ${suite} ===`);
    try {
      const { main } = require(path.join(__dirname, suite));
      await main();
    } catch (err) {
      failed = true;
      console.error(`FAILED: ${suite}\n${err}`);
    }
    console.log('');
  }
  server.close();
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error('FATAL', err);
  process.exit(1);
});
