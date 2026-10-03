/**
 * app.js — interactions, scroll choreography (GSAP ScrollTrigger + Lenis)
 * and the bridge to the WebGL stages.
 */
import Lenis from '../vendor/lenis/lenis.mjs';

/* ← Connect the form to the clinic's CRM / email service by setting an endpoint
   that accepts a JSON POST. While empty, submissions are handed to WhatsApp. */
const FORM_ENDPOINT = '';
const WHATSAPP = '972535550123';

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
  arch: $('#process'),
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
  implants: { t: 'השתלות שיניים', d: 'שתל טיטניום שמחליף את שורש השן, ועליו כתר זירקוניה בהתאמה מושלמת לצבע השיניים. כל השתלה מתוכננת מראש בסריקת CBCT תלת־ממדית ומבוצעת בהנחיה כירורגית מדויקת.', f: [['משך הטיפול', 'כשעה להשתלה'], ['התאחות', 'כ־3 חודשים'], ['אחריות', 'אחריות יצרן לכל החיים']], ico: 'implant' },
  ortho: { t: 'יישור שיניים', d: 'יישור בקשתיות שקופות כמעט בלתי נראות, או בגשר אסתטי. בפגישה הראשונה תראו הדמיה דיגיטלית של התוצאה הסופית.', f: [['משך ממוצע', '6–18 חודשים'], ['ביקורות', 'אחת ל־6–8 שבועות'], ['מתאים ל', 'ילדים ומבוגרים']], ico: 'align' },
  root: { t: 'טיפולי שורש', d: 'טיפול שורש במיקרוסקופ דנטלי, שמאפשר לנקות ולאטום את תעלות השורש בדיוק מרבי — ולשמר את השן הטבעית.', f: [['משך', 'ביקור אחד ברוב המקרים'], ['הרדמה', 'ממוחשבת ועדינה'], ['הצלחה', 'מעל 90% לטווח ארוך']], ico: 'root' },
  whitening: { t: 'הלבנת שיניים', d: 'הלבנה מקצועית ובטוחה, במרפאה או בערכה ביתית מותאמת אישית. אנחנו מתאימים את עוצמת החומר כדי למנוע רגישות.', f: [['משך', '1–2 מפגשים'], ['תוצאה', 'עד 8 גוונים בהירים יותר'], ['רגישות', 'מינימלית']], ico: 'white' },
  rehab: { t: 'שיקום הפה', d: 'תוכנית מלאה להחזרת תפקוד ואסתטיקה — שילוב של שתלים, כתרים וגשרים, בשלבים ברורים ובתיאום מלא בין המומחים.', f: [['תכנון', 'דיגיטלי, עם הדמיה'], ['שלבים', 'לפי תוכנית כתובה'], ['מימון', 'עד 36 תשלומים']], ico: 'rehab' },
  veneers: { t: 'ציפויי חרסינה', d: 'ציפויים דקים בעבודת יד שמשנים צורה, צבע ופרופורציות של השיניים — בהתאמה לפנים ולחיוך שלך.', f: [['עובי', '0.3–0.5 מ״מ'], ['מפגשים', '2–3'], ['עמידות', '10–15 שנים ויותר']], ico: 'veneer' },
  perio: { t: 'טיפולי חניכיים', d: 'אבחון וטיפול בדלקות חניכיים, בנסיגת חניכיים ובאובדן עצם — כדי לשמור על בסיס בריא ויציב לשיניים.', f: [['אבחון', 'מדידה ממוחשבת'], ['טיפול', 'שמרני או כירורגי לפי הצורך'], ['מעקב', 'תוכנית שמירה אישית']], ico: 'gum' },
  kids: { t: 'רפואת שיניים לילדים', d: 'ביקור רגוע ומשחקי עם רופאה לילדים: בדיקות, איטומים, טיפולים ומניעה — ובעיקר חוויה טובה שנשארת לכל החיים.', f: [['גיל', 'מגיל שנה'], ['גישה', 'הדרגתית וסבלנית'], ['הורים', 'מוזמנים להיות בחדר']], ico: 'kid' },
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
  const sel = $('[data-treatment]');
  const opt = [...sel.options].find((o) => o.text === name);
  if (opt) sel.value = opt.value || opt.text;
}

/* ------------------------------------------------------------------ before / after */
const BA = [
  { kind: 'הלבנת שיניים', desc: 'הלבנה מקצועית במרפאה בשני מפגשים. גוון השיניים השתפר בכ־6 דרגות בסקאלת VITA.', facts: ['2 מפגשים', 'ללא רגישות', 'תוצאה לאורך שנים'] },
  { kind: 'ציפויי חרסינה', desc: 'שישה ציפויים קדמיים שאחידו אורך, צורה וגוון — וסגרו רווחים קטנים בין השיניים.', facts: ['6 ציפויים', '3 מפגשים', 'הכנה מינימלית'] },
  { kind: 'יישור שיניים', desc: 'יישור בקשתיות שקופות שסידר צפיפות בשיניים הקדמיות, בלי גשר קבוע.', facts: ['11 חודשים', 'קשתיות שקופות', 'כמעט בלתי נראה'] },
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

/* ------------------------------------------------------------------ form */
const form = $('[data-form]'), msg = $('[data-form-msg]');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(form);
  const name = (fd.get('name') || '').trim();
  const phone = (fd.get('phone') || '').replace(/[^\d+]/g, '');
  const okPhone = /^(\+?972|0)(5\d|[2-489]|7\d)\d{7}$/.test(phone);
  $$('.field', form).forEach((f) => f.classList.remove('is-invalid'));
  if (!name) $('[name="name"]', form).closest('.field').classList.add('is-invalid');
  if (!okPhone) $('[name="phone"]', form).closest('.field').classList.add('is-invalid');
  if (!name || !okPhone) { msg.className = 'form__msg is-err'; msg.textContent = 'נא למלא שם ומספר טלפון תקין.'; return; }
  if (!fd.get('consent')) { msg.className = 'form__msg is-err'; msg.textContent = 'נא לאשר יצירת קשר כדי שנוכל לחזור אליך.'; return; }
  const data = { name, phone, treatment: fd.get('treatment') || '', message: (fd.get('msg') || '').trim() };
  const btn = $('button[type="submit"]', form); btn.disabled = true;
  try {
    if (FORM_ENDPOINT) {
      const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.status);
      msg.className = 'form__msg is-ok'; msg.textContent = `תודה ${name}! קיבלנו את הפרטים ונחזור אליך בהקדם.`;
      form.reset();
    } else {
      const text = `שלום, אני ${name} (${phone}).${data.treatment ? `\nמעוניין/ת ב: ${data.treatment}` : ''}${data.message ? `\n${data.message}` : ''}`;
      window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      msg.className = 'form__msg is-ok'; msg.textContent = `תודה ${name}! פתחנו לך הודעה מוכנה בוואטסאפ — רק לשלוח.`;
    }
  } catch {
    msg.className = 'form__msg is-err'; msg.textContent = 'משהו השתבש. אפשר להתקשר אלינו: 03-555-0123';
  } finally { btn.disabled = false; }
});

window.__alma = { lenis, scene, ScrollTrigger };
