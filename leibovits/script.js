/* Yossi Leibovits — scroll-scrubbed Higgsfield fly-through + site interactions */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- contact config
     Fill these in and every phone / WhatsApp / email button on the page lights up.
     Leave empty: the buttons scroll to the contact form instead.            */
  var CONTACT = {
    phone: '',      // e.g. '050-1234567'
    whatsapp: '',   // international, digits only, e.g. '972501234567'
    email: ''       // e.g. 'office@yossi-leibovits.co.il'
  };
  /* Optional: a form endpoint (Formspree, Make, etc). Empty → WhatsApp / email / thank-you. */
  var FORM_ENDPOINT = '';

  var doc = document.documentElement;
  doc.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- contact links */
  function wa(text) { return 'https://wa.me/' + CONTACT.whatsapp + (text ? '?text=' + encodeURIComponent(text) : ''); }
  document.querySelectorAll('[data-link]').forEach(function (a) {
    var k = a.getAttribute('data-link');
    if (k === 'phone' && CONTACT.phone) { a.href = 'tel:' + CONTACT.phone.replace(/[^\d+]/g, ''); addNum(a, CONTACT.phone); }
    else if (k === 'whatsapp' && CONTACT.whatsapp) { a.href = wa('שלום יוסי, אשמח לפרטים על שומת מקרקעין'); }
    else if (k === 'email' && CONTACT.email) { a.href = 'mailto:' + CONTACT.email; addNum(a, CONTACT.email); }
    else { a.removeAttribute('target'); }
  });
  function addNum(a, v) { if (!a.classList.contains('clink')) return; var s = document.createElement('span'); s.className = 'num'; s.textContent = v; a.appendChild(s); }

  /* service links pre-select the form */
  document.querySelectorAll('[data-service]').forEach(function (a) {
    a.addEventListener('click', function () {
      var sel = document.querySelector('#leadForm select[name=service]');
      if (sel) sel.value = a.getAttribute('data-service');
    });
  });

  /* ---------------------------------------------------------------- nav */
  var nav = document.getElementById('nav');
  var burger = document.querySelector('.burger');
  var drawer = document.getElementById('drawer');
  burger.addEventListener('click', function () {
    var open = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', String(!open));
    drawer.hidden = open;
  });
  drawer.addEventListener('click', function (e) { if (e.target.tagName === 'A') { burger.setAttribute('aria-expanded', 'false'); drawer.hidden = true; } });
  var totop = document.querySelector('.totop');

  /* ---------------------------------------------------------------- hero scrub */
  var hero = document.querySelector('.hero');
  var video = document.getElementById('heroVideo');
  var bar = document.getElementById('heroBar');
  var beats = [].slice.call(document.querySelectorAll('.beat'));
  var mobile = window.matchMedia('(max-width: 820px)');
  var target = 0, shown = 0, dur = 0, raf = 0;

  function heroProgress() {
    var r = hero.getBoundingClientRect();
    var span = hero.offsetHeight - window.innerHeight;
    return span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
  }
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-solid', y > window.innerHeight * 0.6 && (mobile.matches || y > hero.offsetHeight - window.innerHeight - 40));
    if (totop) totop.classList.toggle('is-on', y > window.innerHeight * 1.5);
    if (mobile.matches) { nav.classList.toggle('is-solid', y > 40); return; }
    var p = heroProgress();
    target = p;
    hero.classList.toggle('is-moving', p > 0.02);
    if (bar) bar.style.transform = 'scaleX(' + p + ')';
    beats.forEach(function (b) {
      var a = parseFloat(b.dataset.in), z = parseFloat(b.dataset.out);
      var on = p >= a && p < z;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-hidden', String(!on));
    });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  /* ease the playhead toward the scroll target — smooth even on coarse wheels */
  function tick() {
    raf = 0;
    if (!dur) return;
    var k = reduced ? 1 : 0.14;
    shown += (target - shown) * k;
    if (Math.abs(target - shown) < 0.0005) shown = target;
    var t = shown * (dur - 0.05);
    if (!video.seeking && Math.abs(video.currentTime - t) > 0.008) video.currentTime = t;
    if (shown !== target) raf = requestAnimationFrame(tick);
  }
  if (video) {
    /* desktop: all-intra clip scrubbed by scroll · mobile: light ping-pong loop that just plays */
    if (mobile.matches) {
      video.src = video.dataset.loop; video.loop = true; video.autoplay = true;
      if (!reduced) { var pl = video.play(); if (pl && pl.catch) pl.catch(function () {}); }
    } else video.src = video.dataset.scrub;
    if (!mobile.matches) video.pause();
    var ready = function () { dur = mobile.matches ? 0 : (video.duration || 0); onScroll(); };
    video.addEventListener('loadedmetadata', ready);
    video.addEventListener('seeked', function () { if (shown !== target && !raf) raf = requestAnimationFrame(tick); });
    if (video.readyState >= 1) ready();
    /* nudge iOS / Safari into buffering a muted inline video without autoplaying it */
    var prime = function () { var pr = video.play(); if (pr && pr.then) pr.then(function () { video.pause(); onScroll(); }).catch(function () {}); window.removeEventListener('touchstart', prime); };
    if (!mobile.matches) window.addEventListener('touchstart', prime, { passive: true });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* first beat visible immediately */
  if (beats[0]) beats[0].classList.add('is-on');

  /* ---------------------------------------------------------------- interior loop: plays only on screen */
  var iv = document.getElementById('interiorVideo');
  if (iv && 'IntersectionObserver' in window && !reduced) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { if (iv.preload === 'none') iv.preload = 'auto'; var pr = iv.play(); if (pr && pr.catch) pr.catch(function () {}); }
        else iv.pause();
      });
    }, { threshold: 0.25 }).observe(iv);
  }

  /* ---------------------------------------------------------------- reveal + parallax */
  var rv = [].slice.call(document.querySelectorAll('.reveal'));
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    rv.forEach(function (el, i) { el.style.transitionDelay = (i % 4) * 70 + 'ms'; io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('is-in'); });

  var par = [].slice.call(document.querySelectorAll('.vision__img, .land__img'));
  if (!reduced && par.length) {
    var pTick = function () {
      par.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var c = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        el.style.transform = 'translate3d(0,' + (c * -8).toFixed(2) + '%,0)';
      });
    };
    window.addEventListener('scroll', function () { requestAnimationFrame(pTick); }, { passive: true });
    pTick();
  }

  /* ---------------------------------------------------------------- form */
  var form = document.getElementById('leadForm');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'phone'].forEach(function (n) {
      var f = form.elements[n]; var bad = !f.value.trim();
      f.setAttribute('aria-invalid', String(bad)); if (bad && ok) { f.focus(); ok = false; }
    });
    if (!ok) return;
    var d = {}; new FormData(form).forEach(function (v, k) { d[k] = v; });
    var text = 'פנייה חדשה מהאתר\nשם: ' + d.name + '\nטלפון: ' + d.phone + '\nשירות: ' + d.service + (d.address ? '\nכתובת הנכס: ' + d.address : '') + (d.msg ? '\nפרטים: ' + d.msg : '');
    var done = function () { form.querySelector('.form__ok').hidden = false; form.reset(); };
    if (FORM_ENDPOINT) {
      fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(d) }).then(done, done);
    } else if (CONTACT.whatsapp) { window.open(wa(text), '_blank', 'noopener'); done(); }
    else if (CONTACT.email) { location.href = 'mailto:' + CONTACT.email + '?subject=' + encodeURIComponent('פנייה מהאתר — ' + d.service) + '&body=' + encodeURIComponent(text); done(); }
    else done();
  });

  document.getElementById('yr').textContent = new Date().getFullYear();
})();
