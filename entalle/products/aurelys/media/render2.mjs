import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
const p = await b.newPage({ viewport: { width: 1080, height: 1080 } });
await p.goto('file://' + process.cwd() + '/creativos2.html', { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
for (const id of ['n01','n02','n03','n05','n12']) await (await p.$('#' + id)).screenshot({ path: `aurelys-${id.slice(1)}.png` });
await b.close();
