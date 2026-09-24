import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await b.newPage({ viewport: { width: 390, height: 800 } });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + new URL('../preview/clorofila.html', import.meta.url).pathname);
await p.waitForTimeout(500);
console.log(await p.evaluate(async () => { scrollTo(0, 3000); await new Promise(r => setTimeout(r, 400)); const s = document.querySelector('[data-el-sticky]'); return { apply: !!EL.stickyApply, sticky: !!s, cls: s && s.className, modal: document.body.className, y: scrollY, anchor: document.querySelector('[data-el-main-cta]').getBoundingClientRect().top }; }));
await b.close();
