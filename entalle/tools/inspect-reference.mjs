// Inspección de una landing de referencia (móvil, tablet y PC) SIN enviar formularios ni comprar.
// Requiere que la red del entorno permita el dominio de la referencia.
// Uso: node inspect-reference.mjs <url> <carpeta-salida>
// Genera: capturas por ancho, esquema de bloques, inventario de recursos (Network),
// animaciones del CTA, comportamiento de barra fija y del modal al pulsar el CTA (sin enviar).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [url, out = './ref'] = process.argv.slice(2);
if (!url) { console.error('Falta URL'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const WIDTHS = [320, 360, 390, 430, 768, 1280, 1440];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
const report = { url, date: new Date().toISOString(), widths: {}, resources: [], ctas: [], animations: [], sticky: {}, modal: {}, blocks: [], note: 'Observado en navegador headless. Nada se envió a la tienda de referencia.' };

for (const w of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 990 ? 800 : 900 }, isMobile: w < 990, hasTouch: w < 990, locale: 'es-CL' });
  const page = await ctx.newPage();
  // Bloquea cualquier POST para no enviar datos (carrito, formularios, pedidos)
  await page.route('**/*', (r) => (r.request().method() === 'GET' ? r.continue() : r.abort()));
  if (w === 390) page.on('response', async (res) => {
    const t = res.request().resourceType();
    if (['image', 'media', 'font', 'stylesheet', 'script'].includes(t)) report.resources.push({ url: res.url(), type: t, status: res.status(), size: +(res.headers()['content-length'] || 0), mime: res.headers()['content-type'] });
  });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/ref-${w}-first.png` });
  // scroll progresivo para activar lazy-load y elementos por scroll
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 500) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/ref-${w}-full.png`, fullPage: true });
  report.widths[w] = await page.evaluate(() => {
    const d = document.documentElement, main = document.querySelector('main') || document.body;
    const blocks = [...main.children].filter((e) => e.getBoundingClientRect().height > 40).map((e) => { const r = e.getBoundingClientRect(); const h = e.querySelector('h1,h2,h3'); return { tag: e.tagName, cls: String(e.className).slice(0, 80), top: Math.round(r.top + scrollY), h: Math.round(r.height), heading: h ? h.textContent.trim().slice(0, 80) : '', bg: getComputedStyle(e).backgroundColor }; });
    const btns = [...document.querySelectorAll('button,a,input[type=submit]')].filter((b) => /compra|pide|pedir|agregar|añadir|comprar|ordenar/i.test(b.innerText || b.value || '')).slice(0, 12).map((b) => { const r = b.getBoundingClientRect(); const cs = getComputedStyle(b); return { text: (b.innerText || b.value).trim().slice(0, 60), top: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height), bg: cs.backgroundColor, radius: cs.borderRadius, font: cs.fontSize + ' ' + cs.fontWeight, anim: cs.animationName + ' ' + cs.animationDuration + ' ' + cs.animationIterationCount, cls: String(b.className).slice(0, 80) }; });
    const fixed = [...document.querySelectorAll('body *')].filter((e) => ['fixed', 'sticky'].includes(getComputedStyle(e).position) && e.getBoundingClientRect().height > 20).slice(0, 15).map((e) => ({ cls: String(e.className).slice(0, 80), pos: getComputedStyle(e).position, top: getComputedStyle(e).top, bottom: getComputedStyle(e).bottom, text: (e.innerText || '').trim().slice(0, 60) }));
    const h1 = document.querySelector('h1'); const cs = h1 && getComputedStyle(h1);
    return { scrollW: d.scrollWidth, pageH: d.scrollHeight, h1: h1 && { text: h1.textContent.trim(), size: cs.fontSize, family: cs.fontFamily, weight: cs.fontWeight }, maxContent: Math.round((document.querySelector('main') || document.body).getBoundingClientRect().width), blocks, ctas: btns, fixed };
  });
  if (w === 390) {
    // keyframes usados por CTA
    report.animations = await page.evaluate(() => { const out = []; for (const sh of document.styleSheets) { try { for (const r of sh.cssRules) if (r.type === 7) out.push(r.cssText.slice(0, 600)); } catch (e) {} } return out.slice(0, 30); });
    // barra fija: estado antes y después de pasar el primer CTA
    const cta = report.widths[w].ctas[0];
    if (cta) {
      const before = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).position === 'fixed' && e.getBoundingClientRect().bottom >= innerHeight - 2 && e.offsetHeight > 30).map((e) => String(e.className).slice(0, 60)));
      await page.evaluate((y) => scrollTo(0, y + 600), cta.top); await page.waitForTimeout(800);
      const after = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((e) => getComputedStyle(e).position === 'fixed' && e.getBoundingClientRect().bottom >= innerHeight - 2 && e.offsetHeight > 30).map((e) => ({ cls: String(e.className).slice(0, 60), text: (e.innerText || '').trim().slice(0, 80) })));
      await page.screenshot({ path: `${out}/ref-390-sticky.png` });
      report.sticky = { before, after };
      // pulsar el CTA principal (los POST están bloqueados) y capturar el modal/formulario
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
      const el = await page.$(`text=${cta.text.split('\n')[0]}`);
      if (el) {
        await el.click({ timeout: 3000 }).catch(() => {});
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${out}/ref-390-after-cta.png` });
        report.modal = await page.evaluate(() => {
          const f = [...document.querySelectorAll('form')].find((x) => x.offsetHeight > 200 && x.querySelectorAll('input').length > 2);
          if (!f) return { url: location.href, form: null };
          return { url: location.href, fields: [...f.querySelectorAll('input,select,textarea')].filter((i) => i.type !== 'hidden').map((i) => ({ name: i.name, type: i.type, required: i.required, placeholder: i.placeholder, autocomplete: i.autocomplete, inputmode: i.inputMode, label: (i.labels && i.labels[0] ? i.labels[0].innerText : '').trim() })), submit: (f.querySelector('[type=submit],button') || {}).innerText };
        });
      }
    }
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${out}/reference-report.json`, JSON.stringify(report, null, 1));
console.log('listo', out);
