/* Entalle · lógica compartida de landing. Un solo estado de compra por página. */
(function () {
  'use strict';
  if (window.EL && window.EL.ready) return;
  var EL = window.EL = window.EL || {};
  EL.ready = true;
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var money = function (cents) {
    try { return new Intl.NumberFormat('es-CL', { style: 'currency', currency: EL.currency || 'CLP', maximumFractionDigits: 0 }).format(cents / 100); }
    catch (e) { return '$' + Math.round(cents / 100); }
  };
  EL.money = money;

  /* ---------- Estado del producto ---------- */
  var S = EL.state = { product: null, variant: null, offer: null, root: null };

  function readConfig(root) {
    var el = root.querySelector('script[data-el-config]');
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { return null; }
  }

  function offerFor(input) {
    return { qty: +input.value, pay: +input.dataset.pay || +input.value, compare: +input.dataset.compare || 0, label: input.dataset.label || '' };
  }

  function totals() {
    var v = S.variant, o = S.offer || { qty: 1, pay: 1, compare: 0 };
    var now = v.price * o.pay;
    var was = o.compare > now ? o.compare : 0;
    if (!was && v.compare_at_price && v.compare_at_price > v.price && o.qty === 1) was = v.compare_at_price;
    return { now: now, was: was, pct: was ? Math.round((was - now) * 100 / was) : 0, unit: Math.round(now / o.qty), qty: o.qty };
  }

  function paint() {
    if (!S.variant) return;
    var t = totals(), avail = !!S.variant.available;
    document.querySelectorAll('[data-el-now]').forEach(function (n) { n.textContent = money(t.now); });
    document.querySelectorAll('[data-el-was]').forEach(function (n) { n.hidden = !t.was; if (t.was) n.textContent = money(t.was); });
    document.querySelectorAll('[data-el-save]').forEach(function (n) { n.hidden = !t.pct; var p = n.querySelector('[data-el-pct]'); if (p) p.textContent = t.pct; });
    document.querySelectorAll('[data-el-unit]').forEach(function (n) { n.hidden = t.qty < 2; n.textContent = money(t.unit) + ' c/u'; });
    document.querySelectorAll('[data-el-offer-label]').forEach(function (n) { n.textContent = (S.offer && S.offer.label) || S.variant.title; });
    document.querySelectorAll('[data-el-buy]').forEach(function (b) {
      if (b.tagName === 'A') b.href = '/cart/' + S.variant.id + ':' + t.qty;
      b.toggleAttribute('disabled', !avail);
      b.setAttribute('aria-disabled', String(!avail));
      var lbl = b.querySelector('[data-el-buy-label]');
      if (lbl) { if (!lbl.dataset.orig) lbl.dataset.orig = lbl.textContent; lbl.textContent = avail ? lbl.dataset.orig : 'Agotado'; }
    });
    var f = S.root && S.root.querySelector('form[data-el-form]');
    if (f) {
      var id = f.querySelector('input[name=id]'), q = f.querySelector('input[name=quantity]');
      if (id.value !== String(S.variant.id)) { id.value = S.variant.id; id.dispatchEvent(new Event('change', { bubbles: true })); }
      if (q.value !== String(t.qty)) { q.value = t.qty; q.dispatchEvent(new Event('change', { bubbles: true })); }
    }
  }
  EL.paint = paint;

  function initProduct(root) {
    var cfg = readConfig(root);
    if (!cfg) return;
    S.root = root; S.product = cfg; EL.currency = cfg.currency;
    var vid = +root.dataset.variant;
    S.variant = cfg.variants.filter(function (v) { return v.id === vid; })[0] || cfg.variants[0];
    var checked = root.querySelector('[data-el-offers] input:checked');
    S.offer = checked ? offerFor(checked) : { qty: 1, pay: 1, compare: 0, label: '' };
    root.querySelectorAll('[data-el-offers] input').forEach(function (i) {
      i.addEventListener('change', function () { S.offer = offerFor(i); paint(); });
    });
    root.querySelectorAll('[data-el-variant-picker]').forEach(function (fs) {
      fs.addEventListener('change', function () {
        var sel = [].map.call(fs.querySelectorAll('input:checked'), function (i) { return i.value; });
        var match = cfg.variants.filter(function (v) { return v.options.join('|') === sel.join('|'); })[0];
        if (match) {
          S.variant = match;
          try { var u = new URL(location.href); u.searchParams.set('variant', match.id); history.replaceState(history.state, '', u); } catch (e) {}
          if (match.image) EL.galleryTo(match.image);
        }
        paint();
      });
    });
    paint();
  }

  /* ---------- Compra: un único proceso, sin duplicados ---------- */
  var COD_TXT = /cash on delivery|contra ?entrega|pag(a|ar|o) al recibir|pay on delivery|cod form/i;
  var COD_CLS = /(^|[\s_-])(rsi|releasit)/i;
  function ours(el) { return el.closest('[data-el-buy],.el-sticky,.el-float,.el-offer,.el-acc,.el-gallery,[data-el-ignore]'); }
  function meta(el) { var c = el.className; c = (c && c.baseVal !== undefined) ? c.baseVal : (c || ''); return c + ' ' + (el.id || ''); }
  function findCod() {
    var scope = (S.root && S.root.querySelector('.el-buy')) || document;
    var sets = [scope, document];
    for (var s = 0; s < sets.length; s++) {
      var list = sets[s].querySelectorAll('button,a,[role=button],input[type=submit]');
      for (var i = 0; i < list.length; i++) {
        var el = list[i];
        if (ours(el)) continue;
        if (COD_CLS.test(meta(el)) || (el.parentElement && COD_CLS.test(meta(el.parentElement)))) return el;
        if (s === 0 && COD_TXT.test((el.innerText || el.value || '').trim())) return el;
      }
    }
    return null;
  }
  function hideCod(b) {
    var box = b, p = b.parentElement;
    if (p && p.children.length === 1 && !p.matches('form,.el-buy')) box = p;
    box.classList.add('el-cod-hidden');
    box.style.cssText += ';position:absolute!important;left:-9999px!important;width:1px!important;height:1px!important;overflow:hidden!important;opacity:0!important';
    box.setAttribute('aria-hidden', 'true'); b.tabIndex = -1;
  }
  EL.adoptCod = function () {
    var root = S.root; if (!root || root.dataset.cod === 'off') return;
    var b = findCod(); if (b) { hideCod(b); root.classList.add('el-has-cod'); return true; }
    return false;
  };

  var lock = false;
  EL.buy = function (trigger) {
    if (lock || !S.variant) return;
    if (!S.variant.available) { status('Esta opción está agotada por ahora.', true); return; }
    lock = true;
    if (trigger) trigger.setAttribute('aria-busy', 'true');
    setTimeout(function () { lock = false; if (trigger) trigger.removeAttribute('aria-busy'); }, 1500);
    paint();
    var cod = S.root && S.root.dataset.cod !== 'off' ? findCod() : null;
    if (cod) { cod.click(); return; }
    var t = totals();
    location.href = '/cart/' + S.variant.id + ':' + t.qty;
  };
  function status(msg, err) {
    var s = S.root && S.root.querySelector('[data-el-status]');
    if (s) { s.textContent = msg; s.classList.toggle('is-err', !!err); }
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-el-buy]');
    if (!b) return;
    e.preventDefault();
    if (b.hasAttribute('disabled')) return;
    EL.buy(b);
  });

  /* ---------- Barra fija y estado de modales ---------- */
  function initSticky() {
    var bar = document.querySelector('[data-el-sticky]');
    var anchor = S.root && S.root.querySelector('[data-el-main-cta]');
    if (!bar || !anchor || !('IntersectionObserver' in window)) return;
    var past = false;
    function apply() {
      var on = past && !document.body.classList.contains('el-modal-open');
      if (bar.classList.contains('is-on') === on) return;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', String(!on));
      bar.querySelectorAll('a,button').forEach(function (x) { x.tabIndex = on ? 0 : -1; });
      var mobileOnly = bar.classList.contains('el-sticky--mobile-only');
      document.body.classList.toggle('el-has-sticky', on && (!mobileOnly || innerWidth < 990));
    }
    // Se calcula en cada scroll (1 lectura por cuadro): un IntersectionObserver no avisa
    // si el botón salta de abajo a arriba de la pantalla sin cruzarla (scroll rápido, anclas).
    var raf = 0;
    function measure() { raf = 0; past = anchor.getBoundingClientRect().bottom < 0; apply(); }
    addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(measure); }, { passive: true });
    addEventListener('resize', function () { if (!raf) raf = requestAnimationFrame(measure); });
    EL.stickyApply = apply;
    measure();
  }
  function modalWatch() {
    var pending = false;
    function check() {
      pending = false;
      var open = !!document.querySelector('dialog[open]');
      if (!open) {
        var nodes = document.querySelectorAll('body > div, body > aside, body > section');
        for (var i = 0; i < nodes.length && !open; i++) {
          var n = nodes[i];
          if (n.classList.contains('el-cod-hidden') || !COD_CLS.test(meta(n))) continue;
          var cs = getComputedStyle(n);
          if (cs.display !== 'none' && cs.visibility !== 'hidden' && n.offsetHeight > 200) open = true;
        }
      }
      if (document.body.classList.contains('el-modal-open') !== open) {
        document.body.classList.toggle('el-modal-open', open);
        if (EL.stickyApply) EL.stickyApply();
      }
    }
    new MutationObserver(function () { if (!pending) { pending = true; requestAnimationFrame(check); } })
      .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open'] });
    document.addEventListener('toggle', check, true);
  }

  /* ---------- Contador con fecha real ---------- */
  function initCountdowns(scope) {
    scope.querySelectorAll('[data-el-countdown]').forEach(function (box) {
      if (box.dataset.ready) return; box.dataset.ready = '1';
      var end = Date.parse(box.dataset.end);
      if (isNaN(end) || end <= Date.now()) { box.hidden = true; return; }
      var out = box.querySelectorAll('[data-u]');
      function tick() {
        var d = end - Date.now();
        if (d <= 0) { box.hidden = true; clearInterval(tm); return; }
        var h = Math.floor(d / 36e5), m = Math.floor(d % 36e5 / 6e4), s = Math.floor(d % 6e4 / 1e3);
        var days = Math.floor(h / 24);
        var vals = { d: days, h: days ? h % 24 : h, m: m, s: s };
        out.forEach(function (o) { var u = o.dataset.u; o.textContent = String(vals[u]).padStart(2, '0'); if (u === 'd') o.parentElement.hidden = !days; });
      }
      tick(); var tm = setInterval(tick, 1000); box.hidden = false;
    });
  }

  /* ---------- Fechas de entrega (días hábiles o corridos) ---------- */
  function initEta(scope) {
    var DW = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'], MO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    scope.querySelectorAll('[data-el-eta]').forEach(function (n) {
      var from = +n.dataset.from, to = +n.dataset.to, biz = n.dataset.business === 'true';
      var o = {};
      try { new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', year: 'numeric', month: 'numeric', day: 'numeric' }).formatToParts(new Date()).forEach(function (x) { o[x.type] = +x.value; }); } catch (e) { return; }
      function add(k) {
        var d = new Date(Date.UTC(o.year, o.month - 1, o.day)), c = 0;
        while (c < k) { d.setUTCDate(d.getUTCDate() + 1); if (!biz || (d.getUTCDay() % 6 !== 0)) c++; }
        return DW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MO[d.getUTCMonth()];
      }
      n.innerHTML = 'Llega entre el <b>' + add(from) + '</b> y el <b>' + add(to) + '</b>';
    });
  }

  /* ---------- Galería ---------- */
  function initGallery(scope) {
    scope.querySelectorAll('[data-el-gallery]').forEach(function (g) {
      if (g.dataset.ready) return; g.dataset.ready = '1';
      var track = g.querySelector('[data-el-track]'), slides = track ? track.children : [];
      if (!track || !slides.length) return;
      var marks = g.querySelectorAll('[data-el-go]');
      function idx() { return Math.round(track.scrollLeft / Math.max(1, track.clientWidth)); }
      function go(i) { i = Math.max(0, Math.min(slides.length - 1, i)); track.scrollTo({ left: track.clientWidth * i, behavior: RM ? 'auto' : 'smooth' }); }
      marks.forEach(function (b) { b.addEventListener('click', function () { go(+b.dataset.elGo); }); });
      var prev = g.querySelector('[data-el-prev]'), next = g.querySelector('[data-el-next]');
      if (prev) prev.addEventListener('click', function () { go(idx() - 1); });
      if (next) next.addEventListener('click', function () { go(idx() + 1); });
      var raf = 0;
      track.addEventListener('scroll', function () {
        if (raf) return;
        raf = requestAnimationFrame(function () { raf = 0; var i = idx(); marks.forEach(function (b) { b.setAttribute('aria-current', String(+b.dataset.elGo === i)); }); });
      }, { passive: true });
      track.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { e.preventDefault(); go(idx() + 1); } if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx() - 1); } });
      EL.galleryTo = function (mediaId) {
        for (var i = 0; i < slides.length; i++) if (slides[i].dataset.mediaId === String(mediaId)) { go(i); return; }
      };
    });
  }

  /* ---------- Videos: uno a la vez ---------- */
  document.addEventListener('play', function (e) {
    if (e.target.tagName !== 'VIDEO') return;
    document.querySelectorAll('.el video').forEach(function (v) { if (v !== e.target && !v.paused) v.pause(); });
  }, true);

  /* ---------- Animación del CTA solo en pantalla ---------- */
  function initAnim(scope) {
    if (RM || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (en) { en.forEach(function (x) { x.target.classList.toggle('el-paused', !x.isIntersecting); }); });
    scope.querySelectorAll('[data-el-anim]').forEach(function (b) { io.observe(b.parentElement || b); });
  }

  /* ---------- Aparición al hacer scroll ---------- */
  function initReveal(scope) {
    if (RM || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-el');
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('is-in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    scope.querySelectorAll('.el-rv').forEach(function (n) {
      var r = n.getBoundingClientRect();
      if (r.top < innerHeight) n.classList.add('is-in'); else io.observe(n);
    });
  }

  /* ---------- Volver arriba ---------- */
  function initTop() {
    var t = document.querySelector('[data-el-top]');
    if (!t) return;
    var raf = 0;
    addEventListener('scroll', function () {
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; var on = scrollY > innerHeight * 1.5; t.classList.toggle('is-on', on); t.tabIndex = on ? 0 : -1; });
    }, { passive: true });
    t.addEventListener('click', function () {
      scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
      var h = document.querySelector('main h1'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
    });
  }

  function init(scope) {
    scope = scope || document;
    var root = document.querySelector('[data-el-product]');
    if (root) initProduct(root);
    initGallery(scope); initCountdowns(scope); initEta(scope); initAnim(scope); initReveal(scope);
  }
  function boot() {
    init(document); initSticky(); initTop(); modalWatch();
    if (!EL.adoptCod() && 'MutationObserver' in window) {
      var mo = new MutationObserver(function () { if (EL.adoptCod()) mo.disconnect(); });
      mo.observe(document.body, { childList: true, subtree: true });
      setTimeout(function () { mo.disconnect(); }, 15000);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  document.addEventListener('shopify:section:load', function (e) { init(e.target); });
})();
