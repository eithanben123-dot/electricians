/**
 * app.js — interactions, scroll choreography (GSAP ScrollTrigger + Lenis)
 * and the bridge to the WebGL stages.
 */
import Lenis from '../vendor/lenis/lenis.mjs';

/* Booking settings (hours, WhatsApp, optional server endpoint) live in js/booking.js */
let booking = null;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const mobile = coarse || innerWidth < 760;
const { gsap, ScrollTrigger } = window;
gsap.registerPlugin(ScrollTrigger);
$('[data-year]').textContent = new Date().getFullYear();

/* ------------------------------------------------------------------ smooth scroll */
const lenis = reduced ? null : new Lenis({ lerp: 0.1, wheelMultiplier: 0.95, autoRaf: false });
if (lenis) {
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.lagSmoothing(0);
}
const navH = () => $('[data-nav]').offsetHeight;
function scrollToEl(el, offset = -navH() - 8) {
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset, duration: 1.4 });
  else window.scrollTo({ top: el.getBoundingClientRect().top + scrollY + offset, behavior: 'smooth' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  if (id.length < 2) return;
  const el = $(id);
  if (!el) return;
  e.preventDefault();
  closeDrawer();
  if (a.hasAttribute('data-book') && a.dataset.book) setTreatment(a.dataset.book);
  // pinned stages: land where their copy is fully in view
  scrollToEl(el, el.classList.contains('stage') && id !== '#top' ? 0 : -navH() - 8);
  history.replaceState(null, '', id);
});

/* ------------------------------------------------------------------ nav */
const nav = $('[data-nav]');
const burger = $('[data-burger]');
const drawer = $('#drawer');
function closeDrawer() { burger.setAttribute('aria-expanded', 'false'); drawer.hidden = true; }
burger.addEventListener('click', () => {
  const open = burger.getAttribute('aria-expanded') !== 'true';
  burger.setAttribute('aria-expanded', String(open));
  drawer.hidden = !open;
});
const navLinks = $$('.nav__links a');
navLinks.forEach((a) => {
  const sec = $(a.getAttribute('href'));
  if (!sec) return;
  ScrollTrigger.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (s) => a.classList.toggle('is-current', s.isActive) });
});

/* ------------------------------------------------------------------ entrance + reveals */
gsap.set('[data-in]', { opacity: 0, y: 22 });
gsap.set('[data-reveal]', { opacity: 0, y: 26 });
const intro = () => gsap.to('[data-in]', { opacity: 1, y: 0, duration: reduced ? 0 : 1.1, stagger: reduced ? 0 : 0.09, ease: 'power3.out', delay: 0.1 });
ScrollTrigger.batch('[data-reveal]', {
  start: 'top 90%',
  once: true,
  onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: reduced ? 0 : 0.9, stagger: reduced ? 0 : 0.08, ease: 'power3.out', overwrite: true }),
});

/* ------------------------------------------------------------------ 3D */
let scene = null;
try {
  const { createDentalScene } = await import('./scene.js');
  scene = createDentalScene($('#stage3d'), { mobile, reduced });
} catch (err) {
  console.warn('WebGL unavailable — continuing without 3D', err);
  document.documentElement.classList.add('no-webgl');
}
intro();

const stages = {
  hero: $('#top'),
  implant: $('#about'),
  arch: $('#commitments'),
};
/** progress through a pinned section (0 at pin start, 1 at pin end) + how far it is off-screen */
function stageInfo(el) {
  const r = el.getBoundingClientRect(), vh = innerHeight;
  const span = Math.max(1, r.height - vh);
  return { p: clamp(-r.top / span), visible: r.bottom > 0 && r.top < vh, shift: r.top > 0 ? r.top / vh : r.bottom < vh ? (r.bottom - vh) / vh : 0 };
}

// pillars & steps follow the same progress
const pillars = $$('[data-pillars] li');
const steps = $$('[data-steps] li');
const tags = Object.fromEntries($$('[data-tag]').map((t) => [t.dataset.tag, t]));

addEventListener('pointermove', (e) => {
  if (!scene) return;
  scene.state.pointer.x = (e.clientX / innerWidth) * 2 - 1;
  scene.state.pointer.y = -(e.clientY / innerHeight) * 2 + 1;
}, { passive: true });
addEventListener('resize', () => scene?.resize());

/* ------------------------------------------------------------------ frame loop */
const mbar = $('.mbar');
const book = $('#book');
let last = performance.now();
gsap.ticker.add((time) => {
  const now = time * 1000, dt = (now - last) / 1000; last = now;
  lenis?.raf(now);
  nav.classList.toggle('is-stuck', scrollY > 10);

  const hero = stageInfo(stages.hero), imp = stageInfo(stages.implant), arc = stageInfo(stages.arch);

  // copy inside the pinned stages
  const pi = Math.min(pillars.length - 1, Math.floor(imp.p * pillars.length * 1.05));
  pillars.forEach((li, i) => { li.classList.toggle('is-on', i <= pi && imp.p > 0); li.classList.toggle('is-active', i === pi); });
  const si = Math.min(steps.length - 1, Math.floor(arc.p * steps.length * 1.02));
  steps.forEach((li, i) => { li.classList.toggle('is-done', i < si); li.classList.toggle('is-active', i === si); });

  // sticky mobile bar: after the hero, hidden while the booking form is on screen
  const br = book.getBoundingClientRect();
  mbar.classList.toggle('is-on', scrollY > innerHeight * 0.55 && !(br.top < innerHeight * 0.8 && br.bottom > 0));

  if (scene) {
    const S = scene.state;
    S.hero = hero.visible ? clamp(-hero.shift * 1.15) : 1;
    S.implant = imp.visible ? imp.p : -1;
    S.implantShift = imp.shift;
    S.arch = arc.visible ? arc.p : -1;
    S.archShift = arc.shift;
    if (hero.visible || imp.visible || arc.visible) scene.render(dt);
    // floating part labels around the exploded implant
    if (imp.visible) {
      const L = scene.labels(), on = imp.p > 0.32 && imp.shift === 0;
      for (const k of Object.keys(tags)) {
        tags[k].classList.toggle('is-on', on && L[k].visible);
        tags[k].style.transform = `translate(${L[k].x + 14}px, ${L[k].y - 14}px)`;
      }
    }
  }
});

/* ------------------------------------------------------------------ services modal */
const SERVICES = {
  implants: { t: 'השתלות שיניים', d: 'השתלת שיניים היא חלק יומיומי של רפואת השיניים המודרנית: טכנולוגיה אמינה, בטוחה ומשחזרת, שמעניקה נוחות ואסתטיקה ושומרת על רקמות הפה. ברוב המקרים זו השיטה המועדפת להחלפת שיניים חסרות.', f: [['שתלים', 'Straumann — תוצרת שוויץ'], ['חלופה', 'שתלים מזירקוניה, ללא מתכת'], ['תכנון', 'בדיקה קלינית ורדיולוגית מדויקת']], ico: 'implant' },
  crown: { t: 'כתר ביום אחד', d: 'במקום טביעות סיליקון, הפה נסרק ב־Omnicam. הכתר מתוכנן במחשב ומיוצר מקרמיקה מלאה במעבדה שבתוך המרפאה, בטכנולוגיית CEREC Sirona — ברוב המקרים בפגישה אחת.', f: [['סריקה', 'Omnicam, ללא טביעות'], ['חומר', 'קרמיקה מלאה'], ['זמן', 'ברוב המקרים פגישה אחת']], ico: 'bolt' },
  veneers: { t: 'חזיתות חרסינה', d: 'ציפויים דקים מקרמיקה, בעיצוב אישי עם מעצב החיוך של המרפאה, שמשנים את הצורה, הגוון והפרופורציות של השיניים הקדמיות.', f: [['עיצוב', 'בשיתוף מעצב החיוך'], ['ייצור', 'במעבדה הדיגיטלית של המרפאה'], ['חומר', 'קרמיקה ללא מתכת']], ico: 'veneer' },
  zirconia: { t: 'כתרים וגשרים מזירקוניה', d: 'שיבוצים, אינליי ואונליי, כתרים, גשרים וחזיתות — כל פרותזה קבועה נעשית מזירקוניה, ללא מתכת, בתכנון ממוחשב, עם דיוק, אסתטיקה והתאמה ביולוגית מלאה.', f: [['חומר', 'זירקוניה וקרמיקה מלאה'], ['תכנון', 'ממוחשב (CAD/CAM)'], ['מעבדה', 'בתוך המרפאה']], ico: 'tooth' },
  whitening: { t: 'הלבנת שיניים', d: 'הלבנה מקצועית ובטוחה, שמותאמת אישית כדי להחזיר לשיניים את הבהירות הטבעית שלהן.', f: [['התאמה', 'אישית למטופל'], ['בטיחות', 'בפיקוח רופא'], ['שילוב', 'אפשרי עם חזיתות וכתרים']], ico: 'white' },
  perio: { t: 'טיפולי חניכיים', d: 'טיפולים וניתוחי חניכיים, והשתלות חניכיים — לשמירה על בסיס בריא ויציב לשיניים ולשתלים, וגם לשיפור אסתטיקת החיוך.', f: [['טיפול', 'שמרני או כירורגי'], ['השתלות', 'חניכיים לשיקום ואסתטיקה'], ['ניסיון', 'לימודי פריודונטיה ב־NYU']], ico: 'gum' },
  surgery: { t: 'כירורגיה דנטלית', d: 'השתלת עצם, הרמת סינוס ועקירת שיני בינה כלואות — טיפולים כירורגיים שמבוצעים על ידי רופא שיניים מנתח עם ניסיון של עשרות שנים.', f: [['טיפולים', 'השתלת עצם, הרמת סינוס'], ['עקירות', 'שיני בינה כלואות'], ['ניסיון', 'הוראה בקוצ׳ין וסנט ג׳וזף, פריז']], ico: 'bone' },
  aesthetic: { t: 'רפואה אסתטית', d: 'טיפולי אסתטיקה של הפנים שמשלימים את החיוך: בוטוקס, PRF / PRP, חומצה היאלורונית וחוטי מתיחה.', f: [['טיפולים', 'בוטוקס, חומצה היאלורונית'], ['ביו־רגנרציה', 'PRF / PRP'], ['הכשרה', 'ברפואה אסתטית מאז 2020']], ico: 'face' },
};
const modal = $('[data-modal]');
let lastFocus = null, modalService = null;
function openModal(id) {
  const s = SERVICES[id]; if (!s) return;
  modalService = s.t;
  $('[data-modal-title]').textContent = s.t;
  $('[data-modal-text]').textContent = s.d;
  $('[data-modal-ico]').innerHTML = `<svg aria-hidden="true"><use href="#i-${s.ico}" /></svg>`;
  $('[data-modal-facts]').replaceChildren(...s.f.map(([k, v]) => { const li = document.createElement('li'); li.innerHTML = `<b>${k}</b><span>${v}</span>`; return li; }));
  lastFocus = document.activeElement;
  modal.hidden = false;
  lenis?.stop();
  $('.sheet-modal__x', modal).focus();
}
function closeModal() { modal.hidden = true; lenis?.start(); lastFocus?.focus(); }
$$('[data-more]').forEach((b) => b.addEventListener('click', () => openModal(b.dataset.more)));
$$('[data-close]', modal).forEach((b) => b.addEventListener('click', closeModal));
addEventListener('keydown', (e) => {
  if (modal.hidden) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') { // keep focus inside the dialog
    const f = $$('button, a[href]', modal); const first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  }
});
$('[data-modal-book]').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); const t = modalService; closeModal(); setTreatment(t); scrollToEl(book); });
function setTreatment(name) {
  booking?.select(name === 'ייעוץ' ? 'ייעוץ ובדיקה' : name);
}

/* ------------------------------------------------------------------ before / after */
const BA = [
  { kind: 'הלבנת שיניים', desc: 'הלבנה מקצועית שמחזירה לשיניים גוון בהיר וטבעי — בלי לשנות את הצורה שלהן.', facts: ['בפיקוח רופא', 'מותאם אישית', 'תוצאה טבעית'] },
  { kind: 'חזיתות חרסינה', desc: 'חזיתות קרמיות שמאחידות אורך, צורה וגוון של השיניים הקדמיות, בעיצוב אישי עם מעצב החיוך.', facts: ['עיצוב אישי', 'קרמיקה ללא מתכת', 'מעבדה במרפאה'] },
  { kind: 'שיקום ללא מתכת', desc: 'החלפת כתרים ושיקומים ישנים וכהים בכתרים מזירקוניה וקרמיקה מלאה — אסתטיים ובהתאמה ביולוגית.', facts: ['זירקוניה', 'CEREC Sirona', 'לרוב בפגישה אחת'] },
];
const baWrap = $('.ba'), frame = $('[data-ba-frame]'), range = $('[data-ba-range]');
const imgB = $('[data-ba-before]'), imgA = $('[data-ba-after]');
let smiles = null, baIndex = 0;
function showBA(i) {
  baIndex = i;
  $$('[data-ba]').forEach((b) => b.setAttribute('aria-selected', String(+b.dataset.ba === i)));
  $('[data-ba-kind]').textContent = BA[i].kind;
  $('[data-ba-desc]').textContent = BA[i].desc;
  $('[data-ba-facts]').replaceChildren(...BA[i].facts.map((f) => Object.assign(document.createElement('li'), { textContent: f })));
  if (smiles) { imgB.src = smiles[i].before; imgA.src = smiles[i].after; }
  range.value = 50; frame.style.setProperty('--pos', '50%');
}
$$('[data-ba]').forEach((b) => b.addEventListener('click', () => showBA(+b.dataset.ba)));
showBA(0);
range.addEventListener('input', () => frame.style.setProperty('--pos', `${range.value}%`));
// generate the simulations just before the section scrolls into view
new IntersectionObserver((entries, io) => {
  if (!entries.some((e) => e.isIntersecting)) return;
  io.disconnect();
  const run = async () => {
    try {
      const { renderSmiles } = await import('./scene.js');
      smiles = renderSmiles({ width: mobile ? 900 : 1200, height: mobile ? 600 : 800 });
      baWrap.classList.add('is-ready');
      showBA(baIndex);
      if (!reduced) gsap.fromTo({ v: 18 }, { v: 18 }, { v: 50, duration: 1.6, ease: 'power3.inOut', delay: 0.2, onUpdate() { const v = this.targets()[0].v; range.value = v; frame.style.setProperty('--pos', `${v}%`); } });
    } catch (err) { $('[data-ba-loading]').textContent = 'ההדמיה אינה זמינה בדפדפן זה.'; console.warn(err); }
  };
  ('requestIdleCallback' in window) ? requestIdleCallback(run, { timeout: 1200 }) : setTimeout(run, 300);
}, { rootMargin: '900px 0px' }).observe(frame);

/* ------------------------------------------------------------------ testimonials */
const track = $('[data-track]');
$$('[data-car]').forEach((b) => b.addEventListener('click', () => {
  const card = track.firstElementChild.getBoundingClientRect().width + 24;
  // RTL: "next" moves toward the left
  track.scrollBy({ left: b.dataset.car === 'next' ? -card : card, behavior: reduced ? 'auto' : 'smooth' });
}));

/* ------------------------------------------------------------------ FAQ: animate open/close */
$$('.acc__item').forEach((d) => {
  const body = $('.acc__body', d);
  $('summary', d).addEventListener('click', (e) => {
    if (reduced) return;
    e.preventDefault();
    if (d.open) {
      gsap.to(body, { height: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => { d.open = false; body.style.height = ''; } });
    } else {
      $$('.acc__item[open]').forEach((o) => { if (o !== d) { gsap.to($('.acc__body', o), { height: 0, duration: 0.35, onComplete: () => { o.open = false; $('.acc__body', o).style.height = ''; } }); } });
      d.open = true;
      gsap.fromTo(body, { height: 0 }, { height: body.scrollHeight, duration: 0.5, ease: 'power3.out', onComplete: () => { body.style.height = ''; } });
    }
  });
});

/* ------------------------------------------------------------------ online booking */
const { createBooking } = await import('./booking.js');
booking = createBooking($('[data-booking]'));

window.__alma = { lenis, scene, ScrollTrigger };
