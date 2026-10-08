// Core regression suite: service worker + offline, install CTA,
// control panel (open/close/peek), mobile sheet layout.
const { BASE, SHOTS, launch, trackErrors } = require('./common.js');

async function newPage(browser, { width, height, mobile }) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, isMobile: !!mobile, hasTouch: !!mobile, deviceScaleFactor: 2 });
  const errors = trackErrors(page);
  await page.goto(BASE, { waitUntil: 'networkidle0' });
  return { page, errors };
}

async function simulateInstallPrompt(page) {
  await page.evaluate(() => {
    const e = new Event('beforeinstallprompt');
    e.prompt = () => Promise.resolve();
    e.userChoice = { outcome: 'dismissed' };
    window.dispatchEvent(e);
  });
  // CTA shows after a 900ms delay
  await new Promise((r) => setTimeout(r, 1300));
}

async function main() {
  const browser = await launch();
  const results = {};

  // ---------- Mobile ----------
  {
    const { page, errors } = await newPage(browser, { width: 375, height: 812, mobile: true });

    // SW registration
    const sw = await page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return 'unsupported';
      const reg = await navigator.serviceWorker.getRegistration();
      return reg ? reg.scope : 'none';
    });
    results.mobile_sw = sw;

    // Panel hidden initially, faint toggle icon top-right
    const panelInit = await page.evaluate(() => {
      const panel = document.querySelector('.settings');
      const icon = document.getElementById('panelToggle');
      return {
        panelOpacity: getComputedStyle(panel).opacity,
        panelPointerEvents: getComputedStyle(panel).pointerEvents,
        iconOpacity: getComputedStyle(icon).opacity,
        iconTop: getComputedStyle(icon).top,
        iconRight: getComputedStyle(icon).right,
      };
    });
    results.mobile_panel_init = panelInit;

    // Reveal panel by tapping the toggle icon
    await page.tap('#panelToggle');
    await new Promise((r) => setTimeout(r, 500));
    const panelOpen = await page.evaluate(() => {
      const el = document.querySelector('.settings');
      const cs = getComputedStyle(el);
      return { opacity: cs.opacity, boxShadow: cs.boxShadow, hasOpen: el.classList.contains('open') };
    });
    results.mobile_panel_open = panelOpen;
    await page.screenshot({ path: SHOTS + '/mobile-panel-open.png' });

    // Panel should be a compact sheet (not full screen height)
    const panelBox = await page.evaluate(() => {
      const r = document.querySelector('.settings').getBoundingClientRect();
      return { height: Math.round(r.height), width: Math.round(r.width) };
    });
    results.mobile_panel_box = panelBox;

    // Mobile panel: centered scrollable sheet with two concept sections + meta
    results.mobile_panel_layout = await page.evaluate(() => {
      const p = document.querySelector('.settings');
      return {
        scrollable: p.scrollHeight > p.clientHeight,
        clientHeight: Math.round(p.clientHeight),
        scrollHeight: Math.round(p.scrollHeight),
        sections: document.querySelectorAll('.settings-section').length,
        dividers: document.querySelectorAll('.settings-divider').length,
        overflowY: getComputedStyle(p).overflowY,
      };
    });

    // Simulate install prompt -> CTA appears at bottom
    await simulateInstallPrompt(page);
    const cta = await page.evaluate(() => {
      const el = document.getElementById('installCta');
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return { visible: el.classList.contains('visible'), bottom: Math.round(r.bottom), opacity: cs.opacity, top: Math.round(r.top) };
    });
    results.mobile_cta = cta;
    await page.screenshot({ path: SHOTS + '/mobile-cta.png' });

    // Tapping Install must not dismiss (and must not throw with a stub prompt)
    await page.tap('#installCtaInstall');
    await new Promise((r) => setTimeout(r, 300));

    // Tap the ✕ to dismiss
    await page.tap('#installCtaDismiss');
    await new Promise((r) => setTimeout(r, 500));
    const ctaAfter = await page.evaluate(() => {
      const el = document.getElementById('installCta');
      return { visible: el.classList.contains('visible'), dismissed: localStorage.getItem('warp.installCta.dismissed.v1') };
    });
    results.mobile_cta_dismissed = ctaAfter;

    // Reload: CTA must not reappear even with a fresh prompt
    await page.reload({ waitUntil: 'networkidle0' });
    await simulateInstallPrompt(page);
    const ctaAfterReload = await page.evaluate(() =>
      document.getElementById('installCta').classList.contains('visible')
    );
    results.mobile_cta_stays_hidden = ctaAfterReload === false;

    // Offline: with the network down the SW must serve the whole app
    const cdp = await page.target().createCDPSession();
    await cdp.send('Network.emulateNetworkConditions', {
      offline: true, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
    });
    await page.reload({ waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 600));
    results.mobile_offline = await page.evaluate(() => ({
      title: document.title,
      hasCanvas: !!document.getElementById('warpCanvas'),
      hasPanel: !!document.querySelector('.settings'),
      hasCta: !!document.getElementById('installCta'),
    }));

    results.mobile_errors = errors;
    await page.close();
  }

  // ---------- Desktop ----------
  {
    const { page, errors } = await newPage(browser, { width: 1280, height: 800, mobile: false });

    // Click the toggle icon to reveal
    await page.click('#panelToggle');
    await new Promise((r) => setTimeout(r, 500));
    const panelOpen = await page.evaluate(() => {
      const el = document.querySelector('.settings');
      const icon = document.getElementById('panelToggle');
      const cs = getComputedStyle(el);
      return {
        opacity: cs.opacity,
        boxShadow: cs.boxShadow,
        hasOpen: el.classList.contains('open'),
        iconOpacity: getComputedStyle(icon).opacity,
      };
    });
    results.desktop_panel_open = panelOpen;
    await page.screenshot({ path: SHOTS + '/desktop-panel-open.png' });

    // Click the icon again -> closes (icon is the close control while open)
    await page.click('#panelToggle');
    await new Promise((r) => setTimeout(r, 400));
    results.desktop_panel_closes_via_icon = await page.evaluate(() =>
      !document.querySelector('.settings').classList.contains('open')
    );

    // Click outside (canvas) -> panel hides again
    await page.mouse.click(640, 700);
    await new Promise((r) => setTimeout(r, 400));
    const panelClosed = await page.evaluate(() =>
      document.querySelector('.settings').classList.contains('open')
    );
    results.desktop_panel_closes_on_outside_click = panelClosed === false;

    // Progressive reveal: icon peeks brighter on pointer move over the canvas,
    // then fades back to rest after ~2s of stillness
    await page.mouse.move(640, 400);
    await page.mouse.move(660, 410);
    await new Promise((r) => setTimeout(r, 450)); // let the 0.3s transition settle
    results.desktop_icon_peek = await page.evaluate(() =>
      getComputedStyle(document.getElementById('panelToggle')).opacity
    );
    await new Promise((r) => setTimeout(r, 2400)); // hold + fade-back transition
    results.desktop_icon_rest = await page.evaluate(() =>
      getComputedStyle(document.getElementById('panelToggle')).opacity
    );

    // CTA appears with prompt (clear the mobile test's dismissal flag first)
    await page.evaluate(() => localStorage.clear());
    await simulateInstallPrompt(page);
    const cta = await page.evaluate(() => {
      const el = document.getElementById('installCta');
      return { visible: el.classList.contains('visible'), installBtnShown: getComputedStyle(document.getElementById('installCtaInstall')).display !== 'none' };
    });
    results.desktop_cta = cta;
    await page.screenshot({ path: SHOTS + '/desktop-cta.png' });

    results.desktop_errors = errors;
    await page.close();
  }

  await browser.close();
  console.log(JSON.stringify(results, null, 2));
}

if (require.main === module) {
  main().catch((e) => { console.error('FATAL', e); process.exit(1); });
}

module.exports = { main };
