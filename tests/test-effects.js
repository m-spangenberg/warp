// Effects suite: aberration slider (pixel-level fringe check),
// edge glow overlay, high-DPI canvas scaling.
const { BASE, SHOTS, launch, trackErrors } = require('./common.js');

async function setSlider(page, id, value) {
  await page.evaluate(({ id, value }) => {
    const s = document.getElementById(id);
    s.value = String(value);
    s.dispatchEvent(new Event('input'));
  }, { id, value });
}

async function main() {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  const errors = trackErrors(page);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  const results = {};

  // Count red-dominant pixels (fringe signature). Base palette (220,240,255)
  // on black can never produce R > G+30 && R > B+30, so this isolates fringes.
  const redPixels = () => page.evaluate(() => {
    const c = document.getElementById('warpCanvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > d[i + 1] + 30 && d[i] > d[i + 2] + 30) n++;
    }
    return n;
  });

  // 1. Default (aberration 0): no red-dominant pixels => unchanged rendering
  results.redPixels_at0 = await redPixels();

  // 2. Aberration 100%: fringes appear
  await setSlider(page, 'aberrationRange', 1);
  await new Promise((r) => setTimeout(r, 400));
  results.redPixels_at100 = await redPixels();
  results.aberrationDisplay = await page.$eval('#aberrationDisplay', (el) => el.textContent);

  // 3. Reset to 0: fringes gone again
  await setSlider(page, 'aberrationRange', 0);
  await new Promise((r) => setTimeout(r, 400));
  results.redPixels_reset0 = await redPixels();

  // 4. Edge glow slider
  await setSlider(page, 'edgeGlowRange', 0.6);
  await new Promise((r) => setTimeout(r, 200));
  results.glow = await page.evaluate(() => {
    const el = document.getElementById('edgeGlow');
    const cs = getComputedStyle(el);
    return {
      opacity: cs.opacity,
      zIndex: cs.zIndex,
      pointerEvents: cs.pointerEvents,
      boxShadow: cs.boxShadow,
    };
  });
  results.glowDisplay = await page.$eval('#edgeGlowDisplay', (el) => el.textContent);

  // 5. Glow must not block the panel underneath it
  results.glowBlocksPanel = await page.evaluate(() => {
    const el = document.elementFromPoint(640, 400);
    return el.id === 'edgeGlow'; // false = something else is on top / canvas
  });

  // 6. Both effects on -> screenshots (desktop + mobile)
  await setSlider(page, 'aberrationRange', 1);
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: SHOTS + '/effects-on-desktop.png' });

  const m = await browser.newPage();
  await m.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await m.goto(BASE, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  await setSlider(m, 'aberrationRange', 1);
  await setSlider(m, 'edgeGlowRange', 1);
  await m.tap('#panelToggle'); // reveal panel to show the controls
  await new Promise((r) => setTimeout(r, 500));
  await m.screenshot({ path: SHOTS + '/effects-on-mobile.png' });

  // High-DPI: canvas backing store should scale with devicePixelRatio (dpr=2 here)
  results.mobile_dpr = await m.evaluate(() => {
    const c = document.getElementById('warpCanvas');
    return { canvasWidth: c.width, innerWidth: window.innerWidth, dpr: window.devicePixelRatio };
  });
  await m.close();

  results.errors = errors;
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main().catch((e) => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
