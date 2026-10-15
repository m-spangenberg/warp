// Sound bank suite: modular layer registry, auto-generated panel rows,
// warp factor presets (incl. Impulse), the hidden Collective egg,
// Counselor's Corner quotes, and warp.settings.v1 -> v2 migration.
const { BASE, launch, trackErrors } = require('./common.js');

async function main() {
  const browser = await launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  const errors = trackErrors(page);
  await page.goto(BASE + '?debug=1', { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));

  const results = {};

  // Open the panel (controls are inert while hidden)
  await page.click('#panelToggle');
  await new Promise((r) => setTimeout(r, 400));

  // 1. Sound bank registry (one self-describing layer per sound)
  results.bank = await page.evaluate(() =>
    window.__warp.bank.map((l) => ({
      id: l.id,
      label: l.label,
      hasFlavor: !!l.flavor,
      params: l.params.map((p) => p.key),
      buildIsFn: typeof l.build === 'function',
      egg: l.egg || null,
    }))
  );

  // 2. Auto-generated layer rows: every non-egg layer gets a row
  results.layerRows = await page.evaluate(() => ({
    rows: [...document.querySelectorAll('.layer-row')].map((r) => r.dataset.layer),
    borgRowPresent: !!document.querySelector('.layer-row[data-layer="borg"]'),
  }));

  // 3. Default warp chip: Warp 4 (the stock sound)
  results.defaultWarp = await page.evaluate(() => ({
    state: window.__warp.state.warp,
    chipActive: document.getElementById('warpChip-warp-4').classList.contains('active'),
  }));

  // 4. Layer toggle (core-hum off) + persisted in v2
  await page.click('#layerToggle-core-hum');
  await new Promise((r) => setTimeout(r, 200));
  results.layerToggle = await page.evaluate(() => ({
    ariaChecked: document.getElementById('layerToggle-core-hum').getAttribute('aria-checked'),
    stateEnabled: window.__warp.state.layers['core-hum'].enabled,
    stored: JSON.parse(localStorage.getItem('warp.settings.v2')).layers['core-hum'].enabled,
  }));
  await page.click('#layerToggle-core-hum'); // back on
  await new Promise((r) => setTimeout(r, 200));

  // 5. Sub-menu: chevron opens the layer's sliders; a tweak makes warp Custom
  await page.evaluate(() => {
    document.querySelector('.layer-row[data-layer="core-hum"] .layer-chev').click();
  });
  await new Promise((r) => setTimeout(r, 200));
  results.submenuOpen = await page.evaluate(() => {
    const body = document.querySelector('.layer-row[data-layer="core-hum"] .layer-body');
    return {
      hidden: body.hidden,
      flavor: body.querySelector('.layer-flavor').textContent,
      sliders: [...body.querySelectorAll('input[type="range"]')].map((i) => i.id),
    };
  });
  await page.evaluate(() => {
    const s = document.getElementById('layerRange-core-hum-volume');
    s.value = '0.5';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 200));
  results.submenuTweak = await page.evaluate(() => ({
    stateVolume: window.__warp.state.layers['core-hum'].volume,
    warp: window.__warp.state.warp,
    chipStillActive: document.getElementById('warpChip-warp-4').classList.contains('active'),
  }));

  // 6. Warp presets: Impulse (the slowest speed) re-tunes the whole bank
  await page.click('#warpChip-impulse');
  await new Promise((r) => setTimeout(r, 200));
  results.impulsePreset = await page.evaluate(() => ({
    warp: window.__warp.state.warp,
    chipActive: document.getElementById('warpChip-impulse').classList.contains('active'),
    coreHum: window.__warp.state.layers['core-hum'],
    pulseSpeed: window.__warp.state.layers['pulse'].speed,
    windSpeed: window.__warp.state.layers['wind'].speed,
  }));

  // 7. Counselor's Corner: daily quote rendered from data/quotes.txt
  results.counselor = await page.evaluate(() => ({
    visible: !document.getElementById('counselorCorner').hidden,
    quote: document.getElementById('counselorQuote').textContent,
    attr: document.getElementById('counselorAttr').textContent,
  }));

  // 8. The Collective egg: five taps on the version tag
  await page.evaluate(() => {
    const tag = document.getElementById('versionTag');
    for (let i = 0; i < 5; i++) tag.click();
  });
  await new Promise((r) => setTimeout(r, 300));
  results.borgOn = await page.evaluate(() => ({
    bodyBorg: document.body.classList.contains('borg'),
    egg: window.__warp.state.egg.borg,
    storedEgg: JSON.parse(localStorage.getItem('warp.settings.v2')).egg.borg,
    rowPresent: !!document.querySelector('.layer-row[data-layer="borg"]'),
    rowEnabled: document.getElementById('layerToggle-borg')
      ? document.getElementById('layerToggle-borg').classList.contains('active')
      : null,
  }));

  // Toggle it off again
  await page.evaluate(() => {
    const tag = document.getElementById('versionTag');
    for (let i = 0; i < 5; i++) tag.click();
  });
  await new Promise((r) => setTimeout(r, 300));
  results.borgOff = await page.evaluate(() => ({
    bodyBorg: document.body.classList.contains('borg'),
    rowPresent: !!document.querySelector('.layer-row[data-layer="borg"]'),
  }));

  // 9. v1 -> v2 migration (hiFreq* keys map onto the cooling layer)
  await page.evaluate(() => {
    localStorage.removeItem('warp.settings.v2');
    localStorage.setItem('warp.settings.v1', JSON.stringify({
      speedRange: '9',
      countRange: '1200',
      trailsToggle: true,
      hiVolRange: '0.4',
      hiPitchRange: '0.5',
      hiSpeedRange: '0.1',
      hiFreqToggle: true,
      soundToggle: true,
    }));
  });
  await page.reload({ waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 800));
  results.v1Migration = await page.evaluate(() => ({
    starfield: window.__warp.state.starfield,
    sound: window.__warp.state.sound,
    cooling: window.__warp.state.layers.cooling,
    warp: window.__warp.state.warp,
  }));

  // 10. Sound was migrated on: the first gesture must build the engine
  await page.mouse.click(640, 400);
  await new Promise((r) => setTimeout(r, 600));
  results.engineBuilt = await page.evaluate(() => ({
    engineExists: !!window.__warp.engine,
    instances: window.__warp.engine ? window.__warp.engine.instances.length : 0,
  }));

  results.errors = errors;
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main().catch((e) => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
