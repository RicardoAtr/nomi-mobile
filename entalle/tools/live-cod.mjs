// Abre el formulario COD real desde "PIDE AHORA", lo cierra para disparar el downsell,
// captura y pulsa "aceptar" SIN enviar pedido (todo POST fuera de entalle.cl/cart se bloquea).
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const [url, tag = 'cod', w = '390'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: { server: process.env.HTTPS_PROXY } });
const ctx = await b.newContext({ viewport: { width: +w, height: 844 }, isMobile: +w < 990, hasTouch: +w < 990, locale: 'es-CL' });
const p = await ctx.newPage();
const blocked = [], posts = [];
const LOCALJS = process.env.EL_LOCAL_JS;
await p.route('**/*', (r) => {
  if (process.env.EL_LOCAL_CSS && /compiled_assets\/styles\.css/.test(r.request().url())) return r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(process.env.EL_LOCAL_CSS, 'utf8') });
  if (LOCALJS && /el-core\.js/.test(r.request().url())) return r.fulfill({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(LOCALJS, 'utf8') });
  const q = r.request(), u = q.url();
  if (q.method() !== 'GET') {
    const isRsi = /\/apps\/rsi-cod-form/.test(u);
    const okShopifyCart = isRsi ? (/\/(get-[\w-]+|send-metrics)(\?|$)/.test(u) && !/order|submit|create|checkout/i.test(u)) : !/order|checkout|submit|draft/i.test(u);
    posts.push(q.method() + ' ' + u.slice(0, 120));
    if (!okShopifyCart) { blocked.push(u.slice(0, 120)); return r.abort(); }
  }
  return r.continue();
});
p.on('request', (q) => { if (/releasit|rsi/i.test(q.url())) console.log('REQ', q.method(), q.url().slice(0, 140)); });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
await p.waitForTimeout(2000);
await p.click('[data-el-main-cta] [data-el-buy]');
await p.waitForTimeout(6000);
await p.screenshot({ path: `../preview/live/${tag}-form.png` });
await p.screenshot({ path: `../preview/live/${tag}-form-full.png`, fullPage: true });
const form = await p.evaluate(() => {
  const txt = (document.body.innerText.match(/(Total[^\n]*\n?[^\n]*)/) || [''])[0];
  const q = [...document.querySelectorAll('input')].filter((i) => i.offsetParent && /qty|quantity|cantidad/i.test(i.name + i.className)).map((i) => i.value);
  return { total: txt, qtyInputs: q };
});
console.log('form', JSON.stringify(form));
// cerrar el formulario: botón de cierre visible dentro del modal de Releasit
const closed = await p.evaluate(() => {
  const cands = [...document.querySelectorAll('button,[role=button],svg,div')].filter((e) => {
    const r = e.getBoundingClientRect(); const c = String(e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className);
    return r.width > 10 && r.width < 60 && r.height < 60 && r.top < 120 && r.right > innerWidth - 80 && /close|cerrar|x-?icon|rsi/i.test(c + (e.getAttribute('aria-label') || ''));
  });
  if (cands[0]) { cands[0].click(); return String(cands[0].className).slice(0, 80); }
  return null;
});
console.log('cierre', closed);
await p.waitForTimeout(2500);
await p.screenshot({ path: `../preview/live/${tag}-downsell.png` });
if (process.env.EL_ACCEPT) { await p.click('.rsi-downsell-accept-button').catch((e) => console.log('accept err', e.message)); await p.waitForTimeout(2500); await p.screenshot({ path: `../preview/live/${tag}-after-accept.png` }); console.log('after accept', JSON.stringify(await p.evaluate(() => (document.body.innerText.match(/(Subtotal[\s\S]{0,160}Total[^\n]*\n?[^\n]*)/) || [''])[0]))); }
const ds = await p.evaluate(() => [...document.querySelectorAll('button,a')].filter((e) => e.offsetParent && /descuento|no, gracias|quiero/i.test(e.innerText || '')).map((e) => { const cs = getComputedStyle(e); return { t: e.innerText.trim(), bg: cs.backgroundColor, color: cs.color, cls: String(e.className).slice(0, 80), h: Math.round(e.getBoundingClientRect().height) }; }));
console.log('downsell', JSON.stringify(ds, null, 1));
console.log('posts', posts.slice(0, 15));
console.log('blocked', blocked.slice(0, 15));
await b.close();
