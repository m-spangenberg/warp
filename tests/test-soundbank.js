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
    // Regression: the egg-locked layer must stay silent while the egg is off.
    borgGateWithEggOff: window.__warp.engine ? window.__warp.engine.instances[0].layers.borg.gate.gain.value : null,
  }));

  // 11. Master off must stay off: the iOS interruption-recovery "blind
  //     resume" (1 s after any suspension) must not revive a user mute.
  await page.evaluate(() => document.getElementById('soundToggle').click()); // off
  await new Promise((r) => setTimeout(r, 1600)); // past the 1 s blind-resume window
  results.masterOffStaysOff = await page.evaluate(() => ({
    ctxState: window.__warp.audioCtx ? window.__warp.audioCtx.state : 'none',
    toggleOn: document.getElementById('soundToggle').classList.contains('active'),
  }));

  // 12. Sound-reactive visuals (opt-in): default off; frozen while sound
  //     is off; the engine's audio-clock model modulates while sound runs.
  let panelOpen = await page.evaluate(() =>
    document.querySelector('.settings').classList.contains('open'));
  if (!panelOpen) { await page.click('#panelToggle'); await new Promise((r) => setTimeout(r, 400)); }

  results.reactiveDefault = await page.evaluate(() => ({
    state: window.__warp.state.sound.reactive,
    toggleActive: document.getElementById('reactiveToggle').classList.contains('active'),
  }));

  // Sound is off (step 11): values exist but must not modulate.
  results.reactiveSoundOff = await page.evaluate(async () => {
    const a = window.__warp.getReactive();
    await new Promise((r) => setTimeout(r, 500));
    const b = window.__warp.getReactive();
    return { a, b, frozen: a.pulse === b.pulse && a.hum === b.hum };
  });

  // Turn sound back on with a real gesture, then enable reactive.
  await page.click('#soundToggle');
  await new Promise((r) => setTimeout(r, 600));
  await page.click('#reactiveToggle');
  await new Promise((r) => setTimeout(r, 300));

  const sampleReactive = () => page.evaluate(() => ({
    r: window.__warp.getReactive(),
    ss: window.__warp.streakScale,
  }));
  const s1 = await sampleReactive();
  await new Promise((r) => setTimeout(r, 1200));
  const s2 = await sampleReactive();
  results.reactiveModulated = {
    a: s1, b: s2,
    humRange: Math.abs(s1.r.hum - s2.r.hum),
    pulseRange: Math.abs(s1.r.pulse - s2.r.pulse),
    streakInBand: s1.ss >= 0.84 && s1.ss <= 1.16 && s2.ss >= 0.84 && s2.ss <= 1.16,
  };
  results.reactivePersisted = await page.evaluate(() => ({
    stored: JSON.parse(localStorage.getItem('warp.settings.v2')).sound.reactive,
    state: window.__warp.state.sound.reactive,
  }));

  // 13. Proximity ping easter egg: five quick taps on the starfield.
  panelOpen = await page.evaluate(() =>
    document.querySelector('.settings').classList.contains('open'));
  if (panelOpen) { await page.click('#panelToggle'); await new Promise((r) => setTimeout(r, 400)); }

  const pingBefore = await page.evaluate(() => window.__warp.pingFired);
  for (let i = 0; i < 5; i++) {
    await page.mouse.click(100, 700); // open starfield, clear of panel/CTA
    await new Promise((r) => setTimeout(r, 100));
  }
  await new Promise((r) => setTimeout(r, 500));
  results.proximityPing = await page.evaluate((before) => ({
    fired: window.__warp.pingFired - before,
    beeps: window.__warp.beeps,
  }), pingBefore);

  // 14. Standby sleep timer: a 3 s fade (0.05 min) runs the full path -
  //     schedule -> ramp -> completion -> auto-clear - and the master
  //     slider takes the wheel back. Then a real 25 m fade: chip +
  //     persistence, cleared with Off.
  await page.evaluate(() => window.__warp.selectStandby(0.05));
  await new Promise((r) => setTimeout(r, 500));
  results.standbyActive = await page.evaluate(() => ({
    standby: window.__warp.state.sound.standby,
    master: window.__warp.engine.master.gain.value,
    masterFading: window.__warp.engine.master.gain.value < 0.3 && window.__warp.engine.master.gain.value > 0.15,
    display: document.getElementById('standbyDisplay').textContent,
    stored: JSON.parse(localStorage.getItem('warp.settings.v2')).sound.standby,
  }));
  await new Promise((r) => setTimeout(r, 3000)); // past the 3 s fade
  await page.evaluate(() => window.__warp.tickStandby());
  results.standbyDone = await page.evaluate(() => ({
    standby: window.__warp.state.sound.standby,
    master: window.__warp.engine.master.gain.value,
    display: document.getElementById('standbyDisplay').textContent,
  }));
  await page.evaluate(() => {
    const s = document.getElementById('masterRange');
    s.value = '0.3';
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 300));
  results.masterRestored = await page.evaluate(() => ({
    master: window.__warp.engine.master.gain.value,
    standby: window.__warp.state.sound.standby,
  }));
  await page.evaluate(() => window.__warp.selectStandby(25));
  await new Promise((r) => setTimeout(r, 300));
  results.standby25 = await page.evaluate(() => ({
    standby: window.__warp.state.sound.standby,
    chip25: document.getElementById('standbyChip-25').classList.contains('active'),
    display: document.getElementById('standbyDisplay').textContent,
    stored: JSON.parse(localStorage.getItem('warp.settings.v2')).sound.standby,
  }));
  await page.evaluate(() => document.getElementById('standbyChip-0').click());
  await new Promise((r) => setTimeout(r, 300));
  results.standbyOff = await page.evaluate(() => ({
    standby: window.__warp.state.sound.standby,
    master: window.__warp.engine.master.gain.value,
    chipOff: document.getElementById('standbyChip-0').classList.contains('active'),
  }));

  // 15. LCARS console beeps: the ship acknowledges panel and preset
  //     actions (faint one-shots through the FX chain).
  // (The panel may have been re-opened by a bubbled synthetic click in
  //  step 14, so put it in a known state first.)
  const openNow = await page.evaluate(() =>
    document.querySelector('.settings').classList.contains('open'));
  if (openNow) { await page.click('#panelToggle'); await new Promise((r) => setTimeout(r, 400)); }

  const beepsBefore = await page.evaluate(() => window.__warp.beeps);
  // Open the console: the wake blip.
  await page.click('#panelToggle');
  await new Promise((r) => setTimeout(r, 500));
  results.beepPanelOpen = await page.evaluate((before) => window.__warp.beeps - before, beepsBefore);
  const beepsAfterOpen = await page.evaluate(() => window.__warp.beeps);
  // Select a warp preset: the acknowledge chirp. Real click inside the
  // open panel - the bubble only re-arms the idle timer, no extra blip.
  await page.click('#warpChip-warp-8');
  await new Promise((r) => setTimeout(r, 300));
  results.beepWarpPreset = await page.evaluate((before) => window.__warp.beeps - before, beepsAfterOpen);

  results.errors = errors;
  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main().catch((e) => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
