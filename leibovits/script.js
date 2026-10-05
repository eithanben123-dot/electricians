/* Yossi Leibovits — Onyx & Brass · interactions (the WebGL "method" scene lives in gl.js) */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- contact config
     Fill these in and every phone / WhatsApp / email link lights up.
     Empty → the links scroll to the contact form instead.                    */
  var CONTACT = { phone: '', whatsapp: '', email: '' };   // e.g. '050-1234567', '972501234567', 'office@…'
  var FORM_ENDPOINT = '';                                  // optional (Formspree, Make…)

  var root = document.documentElement;
  root.classList.add('js');
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small = matchMedia('(max-width: 820px)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return [].slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var VH = innerHeight;
  addEventListener('resize', function () { VH = innerHeight; layout(); });

  /* ---------------------------------------------------------------- contact links */
  var wa = function (t) { return 'https://wa.me/' + CONTACT.whatsapp + (t ? '?text=' + encodeURIComponent(t) : ''); };
  $$('[data-link]').forEach(function (a) {
    var k = a.dataset.link, v = a.querySelector('.v');
    if (k === 'phone' && CONTACT.phone) { a.href = 'tel:' + CONTACT.phone.replace(/[^\d+]/g, ''); if (v) v.textContent = CONTACT.phone; }
    else if (k === 'whatsapp' && CONTACT.whatsapp) { a.href = wa('שלום יוסי, אשמח לפרטים על שומת מקרקעין'); }
    else if (k === 'email' && CONTACT.email) { a.href = 'mailto:' + CONTACT.email; if (v) v.textContent = CONTACT.email; }
    else a.removeAttribute('target');
  });
  $$('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () { var s = $('#leadForm select[name=service]'); if (s) s.value = a.dataset.service; });
  });

  /* ---------------------------------------------------------------- text splitting */
  // headings: plain text → one masked line, <em> → its own masked line
  $$('[data-split]').forEach(function (el) {
    var html = '';
    [].slice.call(el.childNodes).forEach(function (n) {
      var t = n.nodeType === 3 ? n.textContent.trim() : n.outerHTML;
      if (t) html += '<span class="l"><span>' + t + '</span></span>';
    });
    el.innerHTML = html;
  });
  // statements: word by word, lit by scroll
  var wordBlocks = $$('[data-words]').map(function (el) {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span class="w">' + w + '</span>'; }).join(' ');
    return { el: el, words: $$('.w', el) };
  });
  // generic reveals
  $$('.about__text .body, .clients, .portrait, .services__head .body, .vision .body, .step, .faq details, .contact__links, .form, .manifesto__sig').forEach(function (el) { el.setAttribute('data-reveal', ''); });

  /* ---------------------------------------------------------------- preloader */
  var pre = $('#pre'), preBar = $('#preBar'), prePct = $('#prePct');
  document.body.classList.add('is-loading');
  var loadP = 0, shownP = 0, done = false;
  function preTick() {
    shownP += (loadP - shownP) * 0.12;
    var v = Math.round(shownP * 100);
    preBar.style.transform = 'scaleX(' + shownP + ')';
    prePct.textContent = v;
    if (loadP >= 1 && shownP > 0.985) return finishLoad();
    requestAnimationFrame(preTick);
  }
  function finishLoad() {
    if (done) return; done = true;
    preBar.style.transform = 'scaleX(1)'; prePct.textContent = '100';
    setTimeout(function () { pre.classList.add('is-done'); document.body.classList.remove('is-loading'); onScroll(); }, 250);
    setTimeout(function () { pre.remove(); }, 1600);
  }
  setTimeout(function () { loadP = 1; }, 6000);   // never hold the visitor longer than this
  requestAnimationFrame(preTick);

  /* ---------------------------------------------------------------- smooth scroll */
  var lenis = null;
  if (window.Lenis && !reduced) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) return;
      var t = $(id); if (!t) return;
      e.preventDefault(); closeMenu();
      if (lenis) lenis.scrollTo(t, { offset: id === '#top' ? 0 : 0, duration: 1.8 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------------------------------------------------------------- nav + menu */
  var nav = $('#nav'), burger = $('.burger'), menu = $('#menu');
  function closeMenu() { burger.setAttribute('aria-expanded', 'false'); menu.hidden = true; }
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open)); menu.hidden = open;
  });

  /* ---------------------------------------------------------------- hero: scroll-scrubbed film */
  var hero = $('.hero'), video = $('#heroVideo'), heroBar = $('#heroBar'), heroTc = $('#heroTc');
  var beats = $$('.beat');
  var target = 0, shown = 0, dur = 0, vRaf = 0;
  if (video) {
    if (small) {
      video.src = video.dataset.loop; video.loop = true; video.autoplay = true;
      if (!reduced) { var pl = video.play(); if (pl && pl.catch) pl.catch(function () {}); }
    } else { video.src = video.dataset.scrub; video.pause(); }
    var buffer = function () {
      try { if (video.duration && video.buffered.length) loadP = Math.max(loadP, video.buffered.end(video.buffered.length - 1) / video.duration); } catch (e) {}
    };
    video.addEventListener('progress', buffer);
    video.addEventListener('canplaythrough', function () { loadP = 1; });
    video.addEventListener('loadedmetadata', function () { dur = small ? 0 : video.duration || 0; onScroll(); });
    video.addEventListener('error', function () { loadP = 1; });
    video.addEventListener('seeked', function () { if (shown !== target && !vRaf) vRaf = requestAnimationFrame(vTick); });
    if (small) video.addEventListener('loadeddata', function () { loadP = 1; });
  } else loadP = 1;
  function vTick() {
    vRaf = 0; if (!dur) return;
    shown += (target - shown) * (reduced ? 1 : 0.16);
    if (Math.abs(target - shown) < 0.0004) shown = target;
    var t = shown * (dur - 0.06);
    if (!video.seeking && Math.abs(video.currentTime - t) > 0.01) video.currentTime = t;
    if (shown !== target) vRaf = requestAnimationFrame(vTick);
  }
  function progressOf(el) {
    var r = el.getBoundingClientRect(), span = el.offsetHeight - VH;
    return span > 0 ? clamp(-r.top / span, 0, 1) : 0;
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------------------------------------------------------- services: horizontal rail */
  var services = $('.services'), rail = $('#rail'), railBar = $('#railBar'), railMax = 0;
  function layout() {
    small = matchMedia('(max-width: 820px)').matches;
    if (!small && rail) {
      railMax = Math.max(0, rail.scrollWidth - innerWidth);
      services.style.height = (railMax + VH * 1.15) + 'px';
    } else if (services) services.style.height = '';
  }
  layout();
  addEventListener('load', layout);

  /* ---------------------------------------------------------------- method progress (read by gl.js) */
  var method = $('.method'), methodBar = $('#methodBar'), phases = $$('.phase');
  window.__method = { p: 0, visible: false };

  /* ---------------------------------------------------------------- marquee */
  var mq = $('#marquee'), mqX = 0, lastY = scrollY, vel = 0;
  function mqTick() {
    if (mq) {
      var half = mq.scrollWidth / 2;
      mqX += 0.6 + Math.min(Math.abs(vel) * 0.35, 18);
      if (mqX > half) mqX -= half;
      mq.style.transform = 'translate3d(' + mqX + 'px,0,0)';
    }
    vel *= 0.9;
    requestAnimationFrame(mqTick);
  }
  if (!reduced) requestAnimationFrame(mqTick);

  /* ---------------------------------------------------------------- main scroll handler */
  var visionImg = $('.vision__img'), fab = $('.fab'), lastDir = 0;
  function onScroll() {
    var y = scrollY; vel = y - lastY; lastDir = vel > 0 ? 1 : vel < 0 ? -1 : lastDir; lastY = y;
    var heroEnd = hero ? hero.offsetHeight - VH : 0;

    // nav: transparent over the film, solid after; hides while scrolling down
    nav.classList.toggle('is-solid', y > (small ? 40 : heroEnd - 20));
    nav.classList.toggle('is-hidden', y > heroEnd + VH && lastDir > 0 && menu.hidden);
    fab.classList.toggle('is-on', y > (small ? VH * 0.8 : heroEnd));

    // hero
    if (hero && !small) {
      var p = progressOf(hero);
      target = p; if (!vRaf) vRaf = requestAnimationFrame(vTick);
      hero.classList.toggle('is-moving', p > 0.015);
      hero.style.setProperty('--bar', (9 * clamp(1 - p * 1.6, 0, 1)) + 'vh');
      if (!reduced) video.style.transform = 'scale(' + (1.04 + p * 0.16).toFixed(4) + ')';
      heroBar.style.transform = 'scaleX(' + p + ')';
      var secs = Math.round(p * (dur || 8));
      heroTc.textContent = '00:' + pad2(secs);
      beats.forEach(function (b) {
        var on = p >= parseFloat(b.dataset.in) && p < parseFloat(b.dataset.out);
        if (b.classList.contains('is-on') !== on) { b.classList.toggle('is-on', on); b.setAttribute('aria-hidden', String(!on)); }
      });
    } else if (hero && beats[0]) beats[0].classList.add('is-on');

    // method
    if (method) {
      var mp = progressOf(method), mr = method.getBoundingClientRect();
      window.__method.p = mp; window.__method.visible = mr.bottom > 0 && mr.top < VH;
      if (methodBar) methodBar.style.transform = 'scaleY(' + mp + ')';
      phases.forEach(function (ph) { ph.classList.toggle('is-on', mp >= parseFloat(ph.dataset.in) && mp < parseFloat(ph.dataset.out)); });
    }

    // services rail (RTL: content overflows to the left → translate right)
    if (services && !small && rail) {
      var sp = progressOf(services);
      rail.style.transform = 'translate3d(' + (sp * railMax) + 'px,0,0)';
      railBar.style.transform = 'scaleX(' + sp + ')';
    }

    // statements lit word by word
    wordBlocks.forEach(function (b) {
      var r = b.el.getBoundingClientRect();
      var k = clamp((VH * 0.88 - r.top) / (r.height + VH * 0.45), 0, 1);
      var n = Math.round(k * b.words.length);
      for (var i = 0; i < b.words.length; i++) b.words[i].classList.toggle('on', i < n);
    });

    // vision parallax
    if (visionImg && !reduced) {
      var vr = visionImg.parentElement.getBoundingClientRect();
      if (vr.bottom > 0 && vr.top < VH) visionImg.style.transform = 'translate3d(0,' + (((vr.top + vr.height / 2) - VH / 2) / VH * -9).toFixed(2) + '%,0)';
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------- reveals */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  $$('[data-reveal], [data-split]').forEach(function (el, i) { el.style.transitionDelay = (i % 3) * 80 + 'ms'; io.observe(el); });

  /* ---------------------------------------------------------------- lazy loop videos */
  var vio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (e.isIntersecting) {
        if (!v.src && v.dataset.lazyvideo) { v.src = v.dataset.lazyvideo; }
        if (!reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      } else v.pause();
    });
  }, { rootMargin: '0px 400px' });
  $$('video[data-lazyvideo]').forEach(function (v) { vio.observe(v); });

  /* ---------------------------------------------------------------- pointer: cursor, tilt, magnet */
  if (fine && !reduced) {
    var cur = $('.cursor'), mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('mousemove', function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function loop() { cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2; cur.style.transform = 'translate3d(' + cx + 'px,' + cy + 'px,0)'; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', function (e) { cur.classList.toggle('is-hover', !!e.target.closest('a, button, summary, [data-hover], input, select, textarea')); });

    $$('[data-tilt]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(1100px) rotateY(' + (x * 9).toFixed(2) + 'deg) rotateX(' + (-y * 7).toFixed(2) + 'deg)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
    $$('[data-magnet]').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------------- form */
  var form = $('#leadForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'phone'].forEach(function (n) {
      var f = form.elements[n], bad = !f.value.trim();
      f.setAttribute('aria-invalid', String(bad)); if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    var d = {}; new FormData(form).forEach(function (v, k) { d[k] = v; });
    var text = 'פנייה מהאתר\nשם: ' + d.name + '\nטלפון: ' + d.phone + '\nשירות: ' + d.service + (d.address ? '\nכתובת הנכס: ' + d.address : '') + (d.msg ? '\nפרטים: ' + d.msg : '');
    var fin = function () { $('.form__ok', form).hidden = false; form.reset(); };
    if (FORM_ENDPOINT) fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) }).then(fin, fin);
    else if (CONTACT.whatsapp) { open(wa(text), '_blank', 'noopener'); fin(); }
    else if (CONTACT.email) { location.href = 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent('פנייה מהאתר — ' + d.service) + '&body=' + encodeURIComponent(text); fin(); }
    else fin();
  });

  $('#yr').textContent = new Date().getFullYear();
})();
