// Settings suite: persistence (save/restore/reset), version tag,
// toggle accessibility (ARIA + keyboard).
const { BASE, launch, trackErrors } = require('./common.js');

async function main() {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = trackErrors(page);
  await page.goto(BASE, { waitUntil: 'networkidle0' }); // fresh profile => clean storage
  await new Promise((r) => setTimeout(r, 800));

  const results = {};

  const getVals = () => page.evaluate(() => {
    const g = (id) => document.getElementById(id).value;
    const a = (id) => document.getElementById(id).classList.contains('active');
    return {
      speed: g('speedRange'), count: g('countRange'), trails: a('trailsToggle'),
      sound: a('soundToggle'), hi: a('hiFreqToggle'), aberr: g('aberrationRange'),
      glow: g('edgeGlowRange'), reverb: g('reverbMixRange'),
      speedDisplay: document.getElementById('speedDisplay').textContent,
      countDisplay: document.getElementById('countDisplay').textContent,
    };
  });

  // 1. Version tag + initial hidden state
  results.versionTag = await page.$eval('#versionTag', (el) => el.textContent);
  results.initialUi = await page.evaluate(() => ({
    panelOpacity: getComputedStyle(document.querySelector('.settings')).opacity,
    iconOpacity: getComputedStyle(document.getElementById('panelToggle')).opacity,
  }));
  results.initial = await getVals();

  // 2. Icon toggles the panel open, then closed
  await page.click('#panelToggle');
  await new Promise((r) => setTimeout(r, 500));
  results.afterIconClick = await page.evaluate(() => ({
    panelOpacity: getComputedStyle(document.querySelector('.settings')).opacity,
    iconOpacity: getComputedStyle(document.getElementById('panelToggle')).opacity,
    ariaExpanded: document.getElementById('panelToggle').getAttribute('aria-expanded'),
    panelInert: document.querySelector('.settings').inert,
  }));

  // 2b. While open: switch accessibility + keyboard operation
  results.toggleA11y = await page.evaluate(() => {
    const t = document.getElementById('trailsToggle');
    return {
      role: t.getAttribute('role'),
      tabindex: t.getAttribute('tabindex'),
      ariaChecked: t.getAttribute('aria-checked'),
      label: t.getAttribute('aria-label'),
    };
  });
  await page.focus('#soundToggle');
  await page.keyboard.press('Space');
  await new Promise((r) => setTimeout(r, 500));
  results.soundKeyboardToggle = await page.evaluate(() => ({
    active: document.getElementById('soundToggle').classList.contains('active'),
    ariaChecked: document.getElementById('soundToggle').getAttribute('aria-checked'),
  }));

  await page.click('#panelToggle');
  await new Promise((r) => setTimeout(r, 500));
  results.afterSecondIconClick = await page.evaluate(() => ({
    opacity: getComputedStyle(document.querySelector('.settings')).opacity,
    panelInert: document.querySelector('.settings').inert,
  }));

  // 3. Open panel, change settings (sliders + toggles)
  await page.click('#panelToggle');
  await new Promise((r) => setTimeout(r, 400));
  await page.evaluate(() => {
    const set = (id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('input')); };
    set('speedRange', '7');
    set('countRange', '1500');
    set('aberrationRange', '0.4');
    set('edgeGlowRange', '0.3');
    set('reverbMixRange', '0.5');
    document.getElementById('trailsToggle').click();
    document.getElementById('hiFreqToggle').click();
  });
  await new Promise((r) => setTimeout(r, 300));
  results.stored = await page.evaluate(() => localStorage.getItem('warp.settings.v1'));

  // 4. Reload -> everything restored
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  results.afterReload = await getVals();

  // 5. Reset -> back to defaults, storage cleared
  await page.evaluate(() => document.getElementById('resetBtn').click());
  await new Promise((r) => setTimeout(r, 300));
  results.afterReset = await getVals();
  results.storedAfterReset = await page.evaluate(() => localStorage.getItem('warp.settings.v1'));

  // 6. Change again -> saved again (native input events bubble; mimic that)
  await page.evaluate(() => {
    const s = document.getElementById('speedRange');
    s.value = '9';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 200));
  results.storedAfterChange = await page.evaluate(() => {
    try { return JSON.parse(localStorage.getItem('warp.settings.v1')).speedRange; } catch (e) { return null; }
  });

  // 7. Sound restore: enable sound (inits audio), reload -> toggle restored,
  //    first user gesture starts audio without errors
  await page.evaluate(() => {
    const t = document.getElementById('soundToggle');
    if (!t.classList.contains('active')) t.click(); // may already be on from 2b
  });
  await new Promise((r) => setTimeout(r, 400));
  results.soundOn = await page.evaluate(() => document.getElementById('soundToggle').classList.contains('active'));
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  results.soundRestored = await page.evaluate(() => document.getElementById('soundToggle').classList.contains('active'));
  await page.mouse.click(640, 400); // first user gesture
  await new Promise((r) => setTimeout(r, 500));
  results.soundAfterGesture = await page.evaluate(() => document.getElementById('soundToggle').classList.contains('active'));

  results.errors = errors;
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main().catch((e) => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
