// Exporta cada guía HTML a PDF (A5) y genera capturas por página para revisión, más la portada en PNG.
// Uso (desde entalle/tools, por playwright-core): node ../ebooks/render.mjs
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const slugs = fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined });
for (const s of slugs) {
  const p = await b.newPage({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 2 });
  await p.goto('file://' + dir + '/' + s + '.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  fs.mkdirSync(`${dir}/out/${s}`, { recursive: true });
  await p.pdf({ path: `${dir}/out/${s}/${s}.pdf`, width: '148mm', height: '210mm', printBackground: true, preferCSSPageSize: true });
  const secs = await p.$$('section.pg');
  for (let i = 0; i < secs.length; i++) await secs[i].screenshot({ path: `${dir}/out/${s}/p${String(i + 1).padStart(2, '0')}.png` });
  // desbordes: contenido que sale de la página
  const over = await p.evaluate(() => [...document.querySelectorAll('section.pg')].map((s, i) => [i + 1, s.scrollHeight - s.clientHeight]).filter((x) => x[1] > 2));
  console.log(s, secs.length, 'páginas', over.length ? 'DESBORDE ' + JSON.stringify(over) : 'ok');
  await p.close();
}
await b.close();
