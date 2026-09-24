// Inspección de la vista previa REAL de Entalle (sin enviar pedidos).
import { chromium } from 'playwright-core';
const [url, tag = 'live', w = '390'] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
const ctx = await b.newContext({ viewport: { width: +w, height: +w < 990 ? 844 : 900 }, isMobile: +w < 990, hasTouch: +w < 990, locale: 'es-CL' });
const p = await ctx.newPage();
const blocked = [];
await p.route('**/*', (r) => { const q = r.request(); if (q.method() !== 'GET' && /orders|checkout|draft|submit|create/i.test(q.url())) { blocked.push(q.method() + ' ' + q.url()); return r.abort(); } return r.continue(); });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => console.log('goto', e.message));
await p.waitForTimeout(2500);
await p.screenshot({ path: `../preview/live/${tag}-first.png` });
const info = await p.evaluate(() => ({
  title: document.title,
  cod: [...document.querySelectorAll('button,a')].filter((e) => /cash on delivery|contra entrega/i.test(e.innerText || '')).map((e) => ({ t: e.innerText.trim().slice(0, 40), cls: String(e.className).slice(0, 80), hidden: e.closest('.el-cod-hidden') ? true : false })),
  rsiRoots: [...document.querySelectorAll('[class*=rsi],[id*=rsi],[class*=releasit],[id*=releasit]')].slice(0, 12).map((e) => e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 60)),
  ctaBg: (() => { const x = document.querySelector('[data-el-main-cta] .el-btn'); return x && getComputedStyle(x).backgroundColor; })(),
  qty: (document.querySelector('[data-el-form] input[name=quantity]') || {}).value,
}));
console.log(JSON.stringify(info, null, 1));
console.log('blocked', blocked);
await b.close();
