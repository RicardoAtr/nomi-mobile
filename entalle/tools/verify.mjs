// Verificación responsive y de comportamiento sobre el render local.
// Uso: node verify.mjs  → escribe capturas en ../preview/shots y un informe JSON.
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const DIR = new URL('../preview/', import.meta.url).pathname;
const SHOTS = DIR + 'shots/'; fs.mkdirSync(SHOTS, { recursive: true });
const WIDTHS = [320, 360, 390, 430, 768, 1280, 1440];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const report = { widths: {}, behavior: {}, errors: [] };

async function page(file, w, extra = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 990 ? 800 : 900 }, deviceScaleFactor: 1, isMobile: w < 990, hasTouch: w < 990, ...extra });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => report.errors.push(`${file}@${w}: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) report.errors.push(`${file}@${w} console: ${m.text()}`); });
  await p.route('**/cart/**', (r) => r.fulfill({ status: 200, body: 'checkout simulado' }));
  await p.goto('file://' + DIR + file, { waitUntil: 'load' });
  await p.waitForTimeout(400);
  return { p, ctx };
}

for (const w of WIDTHS) {
  const { p, ctx } = await page('clorofila.html', w);
  const m = await p.evaluate(() => {
    const doc = document.documentElement;
    const over = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed' && !e.closest('.el-gallery__track,.el-videos,.el-cod-hidden,[style*="-9999px"]') && !e.closest('table'); }).slice(0, 5).map((e) => e.className || e.tagName);
    const cta = document.querySelector('[data-el-main-cta]').getBoundingClientRect();
    const gal = document.querySelector('.el-gallery__stage').getBoundingClientRect();
    const buy = document.querySelector('.el-buy').getBoundingClientRect();
    const h1 = document.querySelector('h1');
    const small = [...document.querySelectorAll('.el button, .el a, .el summary, .el-offer')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40) && !e.closest('.el-gallery__dots,.el-rte,.el-contact-line,.el-delivery,.el-guarantee'); }).slice(0, 6).map((e) => `${e.className || e.tagName}:${Math.round(e.getBoundingClientRect().width)}x${Math.round(e.getBoundingClientRect().height)}`);
    return { scrollW: doc.scrollWidth, innerW: innerWidth, overflow: doc.scrollWidth > innerWidth, overEls: over, ctaTop: Math.round(cta.top + scrollY), ctaInFirstScreen: cta.bottom <= innerHeight, galleryW: Math.round(gal.width), galleryH: Math.round(gal.height), buyLeft: Math.round(buy.left), twoCols: buy.left > gal.left + 10, h1Size: getComputedStyle(h1).fontSize, pageH: doc.scrollHeight, smallTargets: small };
  });
  m.ctaBg = await p.evaluate(() => getComputedStyle(document.querySelector('[data-el-main-cta] .el-btn')).backgroundColor);
  m.ctaH = await p.evaluate(() => Math.round(document.querySelector('[data-el-main-cta] .el-btn').getBoundingClientRect().height));
  m.dotsH = await p.evaluate(() => { const d = document.querySelector('.el-gallery__dots button'); return d ? Math.round(d.getBoundingClientRect().height) : null; });
  report.widths[w] = m;
  await p.screenshot({ path: `${SHOTS}clorofila-${w}-first.png` });
  await p.screenshot({ path: `${SHOTS}clorofila-${w}-full.png`, fullPage: true });
  await ctx.close();
}

// Comportamiento: barra fija, packs, doble clic, checkout de respaldo (móvil 390)
{
  const { p, ctx } = await page('clorofila.html', 390);
  const B = report.behavior;
  const on = () => p.evaluate(() => document.querySelector('[data-el-sticky]').classList.contains('is-on'));
  B.stickyAtTop = await on();
  const ctaY = await p.evaluate(() => document.querySelector('[data-el-main-cta]').getBoundingClientRect().bottom + scrollY);
  await p.evaluate((y) => scrollTo(0, y + 300), ctaY); await p.waitForTimeout(350);
  B.stickyAfterPassingCta = await on();
  B.bodyPaddingWhenSticky = await p.evaluate(() => getComputedStyle(document.body).paddingBottom);
  await p.screenshot({ path: `${SHOTS}sticky-390.png` });
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(350);
  B.stickyBackAtTop = await on();
  // Cambiar pack a 4 unidades y comprobar sincronía de precios en todos los CTA
  await p.click('.el-offer:nth-of-type(3)');
  B.afterPack4 = await p.evaluate(() => ({ now: [...document.querySelectorAll('[data-el-now]')].map((n) => n.textContent), qty: document.querySelector('[data-el-form] input[name=quantity]').value, was: document.querySelector('.el-price [data-el-was]').textContent, pct: document.querySelector('[data-el-pct]').textContent, label: document.querySelector('[data-el-offer-label]').textContent }));
  await p.click('.el-offer:nth-of-type(2)');
  B.afterPack2 = await p.evaluate(() => ({ now: document.querySelector('.el-price [data-el-now]').textContent, qty: document.querySelector('[data-el-form] input[name=quantity]').value, was: document.querySelector('.el-price [data-el-was]').textContent, pct: document.querySelector('[data-el-pct]').textContent }));
  // Doble clic: una sola navegación al checkout
  const navs = [];
  p.on('request', (r) => { if (r.isNavigationRequest() && r.url().includes('/cart/')) navs.push(r.url()); });
  await p.evaluate(() => { const b = document.querySelector('[data-el-main-cta] [data-el-buy]'); b.click(); b.click(); b.click(); });
  await p.waitForTimeout(600);
  B.checkoutNavigations = navs;
  await ctx.close();
}
// Con formulario contra entrega simulado: botón oculto, CTA abre el formulario una vez, barra se oculta con el modal
{
  const { p, ctx } = await page('clorofila-cod.html', 390);
  const B = report.behavior;
  await p.waitForTimeout(300);
  B.codButtonHidden = await p.evaluate(() => { const b = document.querySelector('._rsi-buy-now-button'); const r = b.getBoundingClientRect(); return r.right < 0 || r.width <= 1; });
  const ctaY = await p.evaluate(() => document.querySelector('[data-el-main-cta]').getBoundingClientRect().bottom + scrollY);
  await p.evaluate((y) => scrollTo(0, y + 400), ctaY); await p.waitForTimeout(300);
  await p.evaluate(() => { const b = document.querySelector('.el-sticky [data-el-buy]'); b.click(); b.click(); });
  await p.waitForTimeout(400);
  B.codOpenedCount = await p.evaluate(() => window.__codOpened || 0);
  B.codQtyInForm = await p.evaluate(() => document.querySelector('[data-el-form] input[name=quantity]').value);
  B.stickyHiddenWhileModal = await p.evaluate(() => !document.querySelector('[data-el-sticky]').classList.contains('is-on') && document.body.classList.contains('el-modal-open'));
  await p.screenshot({ path: `${SHOTS}cod-modal-390.png` });
  await p.evaluate(() => document.querySelector('#codmodal button').click()); await p.waitForTimeout(400);
  B.stickyBackAfterModalClose = await p.evaluate(() => document.querySelector('[data-el-sticky]').classList.contains('is-on'));
  await ctx.close();
}
// Escritorio: barra superior al pasar el CTA
{
  const { p, ctx } = await page('clorofila.html', 1280);
  const ctaY = await p.evaluate(() => document.querySelector('[data-el-main-cta]').getBoundingClientRect().bottom + scrollY);
  await p.evaluate((y) => scrollTo(0, y + 500), ctaY); await p.waitForTimeout(350);
  report.behavior.desktopTopBar = await p.evaluate(() => { const s = document.querySelector('[data-el-sticky]'); return { on: s.classList.contains('is-on'), top: Math.round(s.getBoundingClientRect().top) }; });
  await p.screenshot({ path: `${SHOTS}sticky-1280.png` });
  // teclado: tab llega al CTA y tiene foco visible
  await p.evaluate(() => scrollTo(0, 0));
  report.behavior.keyboardReachesCta = await p.evaluate(() => { const b = document.querySelector('[data-el-main-cta] [data-el-buy]'); b.focus(); return document.activeElement === b; });
  await ctx.close();
}
// Movimiento reducido: sin animación en el CTA
{
  const { p, ctx } = await page('clorofila.html', 390, { reducedMotion: 'reduce' });
  report.behavior.reducedMotionAnimation = await p.evaluate(() => getComputedStyle(document.querySelector('[data-el-main-cta] .el-btn')).animationName);
  const { p: p2, ctx: c2 } = await page('clorofila.html', 390);
  report.behavior.normalMotionAnimation = await p2.evaluate(() => getComputedStyle(document.querySelector('[data-el-main-cta] .el-btn')).animationName);
  await ctx.close(); await c2.close();
}
// Inicio: portada de tienda (sin landing de producto)
for (const w of [390, 1280]) {
  const { p, ctx } = await page('index.html', w);
  report.behavior['index' + w] = await p.evaluate(() => ({ hero: !!document.querySelector('.el-hero'), productMain: !!document.querySelector('[data-el-product]'), h1: (document.querySelector('h1') || {}).textContent, sections: [...document.querySelectorAll('main section h2')].map((h) => h.textContent), overflow: document.documentElement.scrollWidth > innerWidth, heroBtnBg: getComputedStyle(document.querySelector('.el-hero .el-btn')).backgroundColor }));
  await p.screenshot({ path: `${SHOTS}index-${w}-first.png` });
  await p.screenshot({ path: `${SHOTS}index-${w}-full.png`, fullPage: true });
  await ctx.close();
}
// Plantilla base vacía: las secciones sin contenido no aparecen
{
  const { p, ctx } = await page('base.html', 390);
  report.behavior.baseTemplateSections = await p.evaluate(() => [...document.querySelectorAll('main > section, main > div > section, main section.el-section')].map((s) => (s.querySelector('h2') || {}).textContent || s.className));
  await p.screenshot({ path: `${SHOTS}base-390-full.png`, fullPage: true });
  await ctx.close();
}
// (cierre movido al final)


// Capturas por sección (390 y 1280) para revisión visual y comparación posterior
{
  for (const w of [390, 1280]) {
    const { p, ctx } = await page('clorofila.html', w, { reducedMotion: 'reduce' });
    const n = await p.evaluate(() => document.querySelectorAll('main > section, main > div > section').length);
    const els = await p.$$('main section.el');
    let i = 0;
    for (const e of els) { i++; await e.screenshot({ path: `${SHOTS}sec-${w}-${String(i).padStart(2, '0')}.png` }); }
    await ctx.close();
  }
}
await browser.close().catch(() => {});
fs.writeFileSync(DIR + 'verify-report.json', JSON.stringify(report, null, 1));
console.log(JSON.stringify({behavior: report.behavior, errors: report.errors, overflow: Object.fromEntries(Object.entries(report.widths).map(([k,v])=>[k,v.overflow]))}, null, 1));
