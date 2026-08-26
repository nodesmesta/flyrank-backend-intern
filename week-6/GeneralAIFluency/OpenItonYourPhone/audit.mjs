// Throwaway audit script — captures BEFORE/AFTER evidence for the "Open It on Your Phone" task.
// Run from repo root: node week-6/GeneralAIFluency/OpenItonYourPhone/audit.mjs [BASE_URL] [OUT_DIR]
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'https://muhamadjamaludin-portfolio.vercel.app';
const OUT_DIR = process.argv[3] || 'week-6/GeneralAIFluency/OpenItonYourPhone/data/before';
const PAGES = ['/', '/work', '/asset-guard', '/contact'];
const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];
mkdirSync(OUT_DIR, { recursive: true });

const report = { pages: {}, links: new Set(), resources: {} };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();

for (const vp of VIEWPORTS) {
  await page.setViewportSize({ width: vp.width, height: vp.height });
  for (const route of PAGES) {
    const key = `${vp.name} ${route}`;
    const consoleErrors = [];
    const pageErrors = [];
    const onConsole = (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); };
    const onPageError = (err) => pageErrors.push(String(err));
    page.on('console', onConsole);
    page.on('pageerror', onPageError);

    const start = Date.now();
    const resp = await page.goto(BASE + route, { waitUntil: 'load', timeout: 60000 });
    const loadMs = Date.now() - start;

    const metrics = await page.evaluate(() => {
      const de = document.documentElement;
      const overflow = de.scrollWidth - de.clientWidth;
      const bodyText = document.body.innerText;
      const small = [];
      document.querySelectorAll('p, a, span, li, .meta, .stack, footer, h1, h2, h3, .btn, .val, .label, input, textarea').forEach((el) => {
        const s = getComputedStyle(el);
        const fs = parseFloat(s.fontSize);
        if (fs && fs < 14) small.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 40), text: el.textContent?.trim().slice(0, 40), fs });
      });
      const tapTargets = [];
      document.querySelectorAll('a, button, input[type="submit"], input[type="text"], input[type="email"], textarea').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && (r.width < 44 || r.height < 44)) {
          tapTargets.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 40), text: el.textContent?.trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) });
        }
      });
      const imgs = [...document.images].map((i) => ({
        src: i.currentSrc || i.src, w: i.naturalWidth, h: i.naturalHeight,
        cw: Math.round(i.getBoundingClientRect().width), ch: Math.round(i.getBoundingClientRect().height),
      }));
      return { overflow, bodyTextLen: bodyText.length, small, tapTargets, imgs };
    });

    const res = await page.evaluate(() =>
      performance.getEntriesByType('resource')
        .filter((r) => r.initiatorType === 'img' || /\.(png|jpg|jpeg|webp|gif|svg|woff2?)$/i.test(r.name))
        .map((r) => ({ name: r.name.split('/').pop(), bytes: r.transferSize || r.decodedBodySize || 0, ms: Math.round(r.duration) }))
    );

    const fileName = `${vp.name}-${route === '/' ? 'home' : route.replace(/^\/+|\/+$/g, '')}.png`;
    await page.screenshot({ path: `${OUT_DIR}/${fileName}`, fullPage: true });
    page.off('console', onConsole);
    page.off('pageerror', onPageError);

    report.pages[key] = {
      status: resp?.status() ?? null,
      loadMs,
      overflowPx: metrics.overflow,
      consoleErrors,
      pageErrors,
      bodyTextLen: metrics.bodyTextLen,
      smallText: metrics.small,
      tapTargets: metrics.tapTargets,
      imgs: metrics.imgs,
      imgResources: res,
    };

    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.href));
    links.forEach((l) => report.links.add(l));
  }
}

report.resources.hero = (await (await fetch(BASE + '/img/hero.webp')).headers.get('content-length'));
report.resources.logo = (await (await fetch(BASE + '/img/logo.png')).headers.get('content-length'));

writeFileSync(`${OUT_DIR}/report.json`, JSON.stringify(report, null, 2));
console.log(`\nBASE=${BASE}`);
console.log('links found:');
[...report.links].sort().forEach((l) => console.log(' ', l));
console.log(`\nreport written to ${OUT_DIR}/report.json`);

// ---- summary (derived from in-memory data, not a file read) ----
console.log('\n=== SUMMARY ===');
for (const [k, v] of Object.entries(report.pages)) {
  console.log(`${k.padEnd(22)} status=${v.status} load=${v.loadMs}ms overflow=${v.overflowPx}px consoleErr=${v.consoleErrors.length} pageErr=${v.pageErrors.length}`);
}
const small = new Set();
for (const v of Object.values(report.pages)) for (const s of v.smallText) small.add(`${s.cls || '(none)'} @${s.fs}px`);
console.log('\nSMALL TEXT (<14px):');
console.log(small.size ? [...small].sort((a, b) => parseFloat(a.split('@')[1]) - parseFloat(b.split('@')[1])).join('\n  ') : '  NONE');
const taps = new Set();
for (const v of Object.values(report.pages)) for (const t of v.tapTargets) if (t.w < 44 || t.h < 44) taps.add(`.${t.cls || '(none)'} ${t.w}x${t.h}px "${t.text}"`);
console.log('\nTAP TARGETS <44px:');
console.log(taps.size ? [...taps].join('\n  ') : '  NONE');
const bad = Object.entries(report.pages).filter(([, v]) => v.overflowPx || v.consoleErrors.length || v.pageErrors.length);
console.log('\nPAGES WITH OVERFLOW/CONSOLE/PAGE ERRORS:', bad.length ? bad.map(([k]) => k).join(', ') : 'NONE');
const mobileLoads = Object.entries(report.pages).filter(([k]) => k.startsWith('mobile')).map(([k, v]) => `${k.split(' ')[1]} ${v.loadMs}ms`);
console.log('MOBILE LOAD:', mobileLoads.join(' | '));
const hero = report.resources.hero, logo = report.resources.logo;
console.log(`HERO.WEBP: ${hero ? (hero / 1024).toFixed(1) + ' KB' : hero}`);
console.log(`LOGO.PNG:  ${logo ? (logo / 1024).toFixed(1) + ' KB' : logo}`);
const fonts = new Set();
for (const v of Object.values(report.pages)) for (const res of v.imgResources) if (res.name.includes('.woff2')) fonts.add(res.name);
console.log(`SELF-HOSTED WOFF2 FONTS loaded: ${fonts.size}`);
await browser.close();
