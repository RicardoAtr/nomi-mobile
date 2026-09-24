// Renderiza localmente una plantilla de producto de Entalle con datos simulados de Shopify.
// Uso: node render.mjs <plantilla.json> <salida.html> [--cod]
// No reemplaza la vista previa real de Shopify: sirve para verificar grid, responsive y JS.
import { Liquid, Tag, Hash } from 'liquidjs';
import fs from 'node:fs';
import path from 'node:path';

const THEME = new URL('../theme/', import.meta.url).pathname;
const [tplPath, outPath, ...flags] = process.argv.slice(2);
const MEDIA_DIR = process.env.EL_MEDIA || '';
const withCod = flags.includes('--cod');

const img = (file, alt = '', w = 1254, h = 1254) => ({ media_type: 'image', id: file, alt, src: file, width: w, height: h, aspect_ratio: w / h, _file: file });
const media = [img('2.webp', 'Clorofila líquida sabor menta, oferta 2x1'), img('1.webp', 'Frasco de Clorofila Benevolent 59 ml'), img('3.webp', 'Ingredientes'), img('5.webp', 'Cómo consumir')];
const variant = { id: 50571773444196, title: 'Default Title', price: 2899000, compare_at_price: 0, available: true, options: ['Default Title'], sku: 'V-SUP-CB-60-LQ-EN-V1-01', inventory_management: null, inventory_quantity: 0, featured_media: null };
const product = {
  id: 10317050937444, title: 'Clorofila Líquida Benevolent 59 ml · 2x1', vendor: 'Entalle', url: '/products/clorofila-benevolent-x-60-ml',
  description: '<p>Descripción del producto.</p>', price: 2899000, compare_at_price: 0, price_varies: false, available: true, tags: [],
  media: [...media, { media_type: 'video', id: 'v1', _file: 'video1.mp4', preview_image: img('1.webp') }, { media_type: 'video', id: 'v2', _file: 'video2.mp4', preview_image: img('3.webp') }],
  featured_image: media[1], variants: [variant], selected_or_first_available_variant: variant, has_only_default_variant: true, options_with_values: [],
};
const other = { ...product, id: 2, title: 'Otro producto disponible (simulado)', url: '#', featured_image: media[2], price: 1999000 };
const catalog = { url: '/collections/catalogo', title: 'Catálogo', products: [product, other] };
const shop = { name: 'Entalle', enabled_payment_types: ['visa', 'master'], policies: [], shipping_policy: {}, refund_policy: {} };
const settings = JSON.parse(fs.readFileSync(path.join(THEME, 'config/settings_data.json'), 'utf8').replace(/^\/\*[\s\S]*?\*\//, '')).current;
settings.logo = null;
const menu = { links: [{ title: 'Inicio', url: '/' }, { title: 'Catálogo', url: '/collections/catalogo', links: [] }, { title: 'Envíos', url: '/pages/envios', links: [] }, { title: 'Contacto', url: '/pages/contact', links: [] }] };

function resolveRef(v) {
  if (typeof v !== 'string') return v;
  let m = v.match(/^shopify:\/\/shop_images\/(.+)$/);
  if (m) { const f = { 'clorofila-5.webp': '5.webp', 'clorofila-info-2.webp': '3.webp' }[m[1]] || '1.webp'; return img(f, ''); }
  if (v.startsWith('shopify://products/')) return product;
  if (v.startsWith('shopify://collections/')) return v.includes('catalogo') ? '/collections/catalogo' : '#';
  if (v.startsWith('shopify://pages/')) return '/pages/' + v.split('/').pop();
  if (v === 'entalle-v2-principal') return menu;
  return v;
}
const mapSettings = (s = {}) => Object.fromEntries(Object.entries(s).map(([k, v]) => [k, resolveRef(v)]));

const engine = new Liquid({ root: [path.join(THEME, 'sections'), path.join(THEME, 'snippets')], extname: '.liquid', strictFilters: false, strictVariables: false, jsTruthy: false });
engine.registerTag('schema', { parse(t, r) { const s = r; this.tpls = []; let tok; while ((tok = s.shift())) { if (tok.name === 'endschema') return; } }, render() { return ''; } });
engine.registerTag('form', { parse(t, r) { this.tpls = []; const stream = this.liquid.parser.parseStream(r).on('tag:endform', () => stream.stop()).on('template', (x) => this.tpls.push(x)).on('end', () => { throw new Error('form sin cerrar'); }); stream.start(); }, *render(ctx, emitter) { emitter.write('<form method="post" action="/cart/add" accept-charset="UTF-8" class="shopify-product-form el-form" enctype="multipart/form-data" data-el-form data-product-form><input type="hidden" name="form_type" value="product"><input type="hidden" name="utf8" value="✓">'); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter); emitter.write('</form>'); } });
engine.registerTag('style', { parse(t, r) { this.tpls = []; let tok; const stream = this.liquid.parser.parseStream(r).on('tag:endstyle', () => stream.stop()).on('template', (x) => this.tpls.push(x)).on('end', () => { throw new Error('tag style not closed'); }); stream.start(); }, *render(ctx, emitter) { emitter.write('<style>'); yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter); emitter.write('</style>'); } });
const src = (o, w) => (o && o._file ? `media/${o._file}` : 'media/1.webp');
engine.registerFilter('image_url', (o, ...a) => src(o));
engine.registerFilter('image_tag', function (url, ...args) {
  const opts = {}; for (let i = 0; i < args.length; i++) { const a = args[i]; if (Array.isArray(a)) opts[a[0]] = a[1]; }
  return `<img src="${url}" alt="${(opts.alt || '').replace(/"/g, '&quot;')}" width="1254" height="1254" loading="${opts.loading || 'lazy'}"${opts.fetchpriority ? ` fetchpriority="${opts.fetchpriority}"` : ''}>`;
});
engine.registerFilter('video_tag', (o) => `<video controls playsinline preload="none" poster="media/${(o.preview_image || {})._file || '1.webp'}"><source src="media/${o._file || 'video1.mp4'}" type="video/mp4"></video>`);
engine.registerFilter('payment_type_svg_tag', (t) => `<svg viewBox="0 0 38 24" width="38" height="24"><rect width="38" height="24" rx="4" fill="#eee"/><text x="19" y="16" font-size="8" text-anchor="middle">${t}</text></svg>`);
engine.registerFilter('json', (v) => JSON.stringify(v ?? null));
engine.registerFilter('url_encode', (v) => encodeURIComponent(v ?? ''));
engine.registerFilter('asset_url', (v) => `../theme/assets/${v}`);
engine.registerFilter('stylesheet_tag', (v) => `<link rel="stylesheet" href="${v}">`);
engine.registerFilter('t', (v) => v);
engine.registerFilter('ternary', (c, a, b) => (c ? a : b));

// Snippet de dinero equivalente a entalle-money (CLP sin decimales)
fs.mkdirSync('/tmp/el-snip', { recursive: true });
engine.options.root.push('/tmp/el-snip');
fs.writeFileSync('/tmp/el-snip/entalle-money.liquid', `{{ amount | el_money }}`);
engine.registerFilter('el_money', (c) => '$' + Math.round((c || 0) / 100).toLocaleString('es-CL'));

const isIndex = /index\.json$/.test(tplPath);
const ctxBase = { product, shop, settings, cart: { currency: { iso_code: 'CLP' }, item_count: 0 }, routes: { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', search_url: '/search' }, collections: { catalogo: catalog, all: catalog }, template: { name: isIndex ? 'index' : 'product' }, request: { page_type: isIndex ? 'index' : 'product', origin: 'https://www.entalle.cl' } };
if (isIndex) ctxBase.product = null;

async function renderSection(type, data, id) {
  const blocks = (data.block_order || Object.keys(data.blocks || {})).map((k) => ({ id: k, type: data.blocks[k].type, settings: mapSettings(data.blocks[k].settings), shopify_attributes: '' })).filter((b, i) => !data.blocks[b.id]?.disabled);
  const section = { id, settings: mapSettings(data.settings), blocks };
  const file = path.join(THEME, 'sections', type + '.liquid');
  const tpl = fs.readFileSync(file, 'utf8');
  return engine.parseAndRender(tpl, { ...ctxBase, section });
}

const tpl = JSON.parse(fs.readFileSync(tplPath, 'utf8').replace(/^\/\*[\s\S]*?\*\//, ''));
const header = JSON.parse(fs.readFileSync(path.join(THEME, 'sections/header-group.json'), 'utf8'));
let body = await renderSection('el-header', header.sections.header, 'header');
body += '<main id="MainContent">';
for (const k of tpl.order) { const s = tpl.sections[k]; if (s.disabled) continue; body += await renderSection(s.type, s, k); }
body += '</main><footer class="footer" style="padding:48px 16px;color:#fff">Pie de página (simulado)</footer>';
const cod = withCod ? `<div class="_rsi-buy-now-button-app-block"><button type="button" class="_rsi-buy-now-button" onclick="document.getElementById('codmodal').style.display='block';window.__codOpened=(window.__codOpened||0)+1">Buy with Cash on Delivery</button></div><div id="codmodal" class="_rsi-modal" style="display:none;position:fixed;inset:0;background:#0008;z-index:100"><div style="background:#fff;margin:40px auto;max-width:420px;height:70vh;padding:20px">Formulario COD simulado <button onclick="this.closest('#codmodal').style.display='none'">cerrar</button></div></div>` : '';
const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Entalle · render local</title>
<link rel="stylesheet" href="../theme/assets/el-core.css"><style id="legacy">button:not(.button){min-height:44px;border:0;background:transparent}button{color:inherit}button:disabled{cursor:not-allowed;opacity:.55}p+p{margin-top:12px}h1,h2,h3{font-family:Arial,Helvetica,sans-serif;letter-spacing:-.045em;font-weight:750}h1{font-size:clamp(36px,4.8vw,64px)}img,svg,video{max-width:100%;height:auto;display:block}img{object-fit:cover}input[type=radio]{width:20px;height:20px}dialog{border:0;padding:28px;max-width:calc(100% - 24px);max-height:90dvh;border-radius:12px}.footer{background:#0e0d11;color:#e8e3ef}</style><style>body{margin:0;font-family:Arial,sans-serif;background:#fff}:root{--el-font-head:Arial,sans-serif}</style></head><body>${body}
<script>window.__nav=[];</script>${cod ? `<script>document.addEventListener('DOMContentLoaded',function(){var f=document.querySelector('[data-el-form]');f&&f.insertAdjacentHTML('beforeend',${JSON.stringify(cod.split('<div id="codmodal"')[0])});document.body.insertAdjacentHTML('beforeend',${JSON.stringify('<div id="codmodal"' + cod.split('<div id="codmodal"')[1])});});</script>` : ''}
<script src="../theme/assets/el-core.js" defer></script></body></html>`;
fs.writeFileSync(outPath, html);
if (MEDIA_DIR) { const md = path.join(path.dirname(outPath), 'media'); fs.mkdirSync(md, { recursive: true }); for (const f of fs.readdirSync(MEDIA_DIR)) if (/\.webp$/.test(f)) fs.copyFileSync(path.join(MEDIA_DIR, f), path.join(md, f)); }
console.log('ok', outPath, html.length);
