// Shared helpers for the Warp test suites.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.WARP_URL || `http://localhost:${process.env.WARP_PORT || 8377}/`;
const SHOTS = process.env.WARP_SHOTS || path.join(ROOT, '.shots');

fs.mkdirSync(SHOTS, { recursive: true });

function launch() {
  return puppeteer.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    headless: 'new',
    args: ['--no-sandbox', '--disable-gpu', '--use-gl=swiftshader'],
  });
}

function trackErrors(page) {
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
  return errors;
}

module.exports = { ROOT, BASE, SHOTS, launch, trackErrors };
