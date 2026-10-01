/**
 * main.js — scroll, DOM choreography and the bridge to the WebGL scene.
 */
import Lenis from '../vendor/lenis/lenis.mjs';

const PHONE_INTL = '972525550123';          // ← business phone (WhatsApp), international format

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

history.scrollRestoration = 'manual';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const mobile = coarse || innerWidth < 760;
document.documentElement.classList.toggle('is-touch', coarse);
document.documentElement.classList.toggle('is-reduced', reduced);

/* ------------------------------------------------------------ text splitting */
$$('[data-split] .line').forEach((line) => {
  const inner = document.createElement('span');
  inner.className = 'line__in';
  inner.append(...line.childNodes);
  line.append(inner);
});
const manifestoWords = [];
$$('[data-words]').forEach((el) => {
  const walk = (node, into) => {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) { into.append(part); return; }
          const w = document.createElement('span');
          w.className = 'w'; w.textContent = part;
          into.append(w); manifestoWords.push(w);
        });
      } else {
        const clone = n.cloneNode(false);
        walk(n, clone); into.append(clone);
      }
    });
  };
  const frag = document.createDocumentFragment();
  walk(el, frag);
  el.replaceChildren(frag);
});
$('[data-year]').textContent = new Date().getFullYear();

/* ------------------------------------------------------------ scene */
const canvas = $('#gl');
let scene = null;
const ui = { hoverCircuit: -1, listHover: -1, power: false, powerByUser: false };

try {
  const { createScene } = await import('./scene.js');
  scene = createScene(canvas, {
    mobile, reduced,
    onHover: (info) => {
      document.body.classList.toggle('is-picking', !!info);
      ui.hoverCircuit = info && info.type === 'breaker' ? info.index : -1;
      setCursorLabel(info ? (info.type === 'bulb' ? 'גע' : info.type === 'rocker' ? (ui.power ? 'כבו' : 'הדליקו') : `מעגל ${String(info.index + 1).padStart(2, '0')}`) : null);
    },
    onCircuitClick: (i) => goToCircuit(i),
    onPowerToggle: () => togglePower(),
  });
} catch (err) {
  console.warn('WebGL unavailable — static fallback', err);
  document.documentElement.classList.add('no-webgl');
}

/* ------------------------------------------------------------ smooth scroll */
const lenis = reduced ? null : new Lenis({ autoRaf: false, lerp: 0.085, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
lenis?.stop();
const scrollTo = (y, duration = 2) => (lenis ? lenis.scrollTo(y, { duration, easing: (t) => 1 - Math.pow(1 - t, 4) }) : window.scrollTo({ top: y, behavior: 'auto' }));
const scrollY = () => (lenis ? lenis.animatedScroll : window.scrollY);

/* ------------------------------------------------------------ chapters */
const chapters = $$('.ch').map((el) => ({ el, name: el.dataset.scene, label: el.dataset.name, amp: parseFloat(el.dataset.amp || '0'), start: 0, end: 0 }));
const byName = Object.fromEntries(chapters.map((c) => [c.name, c]));
let vh = innerHeight;

function measure() {
  vh = innerHeight;
  chapters.forEach((c) => {
    const top = c.el.getBoundingClientRect().top + window.scrollY;
    c.start = top;
    c.end = Math.max(top, top + c.el.offsetHeight - vh);
  });
  // contact is the last chapter — its hold ends at the bottom of the document
  const last = chapters[chapters.length - 1];
  last.end = Math.max(last.start, document.documentElement.scrollHeight - vh);
  scene?.setTimeline(chapters.map(({ name, start, end }) => ({ name, start, end })));
}
const progressOf = (c, y) => (c.end - c.start < 2 ? (y >= c.start ? 1 : 0) : clamp((y - c.start) / (c.end - c.start)));

/* ------------------------------------------------------------ navigation */
$$('[data-nav]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href').slice(1);
  const c = chapters.find((ch) => ch.el.id === id);
  if (!c) return;
  e.preventDefault();
  const y = id === 'panel' ? c.start + (c.end - c.start) * 0.13 : id === 'safety' ? c.start + (c.end - c.start) * 0.15 : c.start;
  scrollTo(y, 2.4);
}));

/* ------------------------------------------------------------ panel / circuits */
const circuitItems = $$('[data-circuits] li');
const CIRCUIT_AT = (i) => 0.11 + i * 0.1;
function goToCircuit(i) {
  const c = byName.panel;
  scrollTo(c.start + (c.end - c.start) * (CIRCUIT_AT(i) + 0.05), 1.4);
}
circuitItems.forEach((li) => {
  const i = +li.dataset.i;
  const btn = $('button', li);
  btn.addEventListener('click', () => goToCircuit(i));
  li.addEventListener('pointerenter', () => { if (!coarse) ui.listHover = i; });
  li.addEventListener('pointerleave', () => { if (ui.listHover === i) ui.listHover = -1; });
  btn.addEventListener('focus', () => { ui.listHover = i; });
  btn.addEventListener('blur', () => { if (ui.listHover === i) ui.listHover = -1; });
});

/* ------------------------------------------------------------ power switch */
const powerBtn = $('[data-power]');
const powerLabel = $('[data-power-label]');
function setPower(on) {
  if (ui.power === on) return;
  ui.power = on;
  if (scene) scene.state.power = on;
  powerBtn.setAttribute('aria-pressed', String(on));
  powerLabel.textContent = on ? 'האור דלוק' : 'הדליקו את האור';
  document.body.classList.toggle('is-powered', on);
}
function togglePower() { ui.powerByUser = true; setPower(!ui.power); }
powerBtn.addEventListener('click', togglePower);

/* ------------------------------------------------------------ figures count-up */
const countIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (!e.isIntersecting) return;
  countIO.unobserve(e.target);
  const el = e.target, to = +el.dataset.count, suffix = el.dataset.suffix || '';
  const t0 = performance.now(), dur = reduced ? 0 : 1600;
  const tick = (t) => {
    const k = dur ? clamp((t - t0) / dur) : 1;
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4))).toLocaleString('en-US') + suffix;
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}), { threshold: 0.6 });
$$('[data-count]').forEach((el) => countIO.observe(el));

/* ------------------------------------------------------------ reveals */
const revealIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
}), { threshold: 0.2, rootMargin: '0px 0px -8% 0px' });
const armReveals = () => $$('.reveal, [data-split]').forEach((el) => revealIO.observe(el));

/* ------------------------------------------------------------ cursor */
const cursor = $('.cursor');
const cursorLabel = $('.cursor__ring em');
const cur = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
let domCursorLabel = null, sceneCursorLabel = null;
function setCursorLabel(t) { sceneCursorLabel = t; paintCursor(); }
function paintCursor() {
  const t = domCursorLabel || sceneCursorLabel;
  cursor.classList.toggle('is-big', !!t);
  if (t) cursorLabel.textContent = t;
}
addEventListener('pointermove', (e) => {
  cur.x = e.clientX; cur.y = e.clientY;
  if (e.pointerType === 'mouse') cursor.classList.add('is-on');
  scene?.setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
}, { passive: true });
document.addEventListener('pointerover', (e) => {
  const el = e.target.closest('[data-cursor], a, button');
  domCursorLabel = el ? (el.dataset.cursor || '') : null;
  cursor.classList.toggle('is-link', !!el);
  paintCursor();
});
const INTERACTIVE = 'a, button, input, textarea, select, label, [data-circuits]';
addEventListener('click', (e) => {
  if (!scene || e.target.closest(INTERACTIVE)) return;
  if (coarse) scene.setPointer((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  scene.click();
});

/* ------------------------------------------------------------ form → WhatsApp */
$('[data-form]').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget, note = $('[data-form-note]');
  const d = Object.fromEntries(new FormData(f));
  if (!d.name.trim() || d.phone.replace(/\D/g, '').length < 9) {
    note.textContent = 'נא למלא שם ומספר טלפון תקין.'; note.classList.add('is-error'); return;
  }
  note.classList.remove('is-error');
  const text = `שלום, אני ${d.name.trim()} (${d.phone.trim()}).\nנושא: ${d.topic}${d.msg.trim() ? `\n${d.msg.trim()}` : ''}`;
  window.open(`https://wa.me/${PHONE_INTL}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  note.textContent = 'נפתח וואטסאפ — רק ללחוץ שליחה.';
});

/* ------------------------------------------------------------ frame loop */
const header = $('.top');
const railFill = $('.rail__fill'), chNum = $('[data-ch-num]'), chName = $('[data-ch-name]');
const readV = $('[data-read-v]'), readA = $('[data-read-a]');
const track = $('[data-track]'), trackFill = $('[data-track-fill]');
let lastChapter = -1, amp = 0, last = performance.now();

function frame(now) {
  const dt = (now - last) / 1000; last = now;
  lenis?.raf(now);
  const y = scrollY();
  const maxY = document.documentElement.scrollHeight - vh;

  header.classList.toggle('is-scrolled', y > 40);
  railFill.style.transform = `scaleY(${clamp(y / maxY)})`;

  // active chapter
  let ci = 0;
  chapters.forEach((c, i) => { if (y >= c.start - vh * 0.5) ci = i; });
  if (ci !== lastChapter) {
    lastChapter = ci;
    chNum.textContent = String(ci + 1).padStart(2, '0');
    chName.textContent = chapters[ci].label;
    document.body.dataset.chapter = chapters[ci].name;
  }
  amp += (chapters[ci].amp * (ui.power && chapters[ci].name === 'safety' ? 2.5 : 1) - amp) * Math.min(1, dt * 3);
  readA.textContent = (amp + Math.sin(now / 310) * 0.05 * amp).toFixed(1).padStart(4, '0');
  readV.textContent = (230 + Math.sin(now / 900) * 0.4 + Math.sin(now / 130) * 0.08).toFixed(1);

  // manifesto words light up with scroll
  const pm = progressOf(byName.manifesto, y + vh * 0.25);
  const n = manifestoWords.length;
  manifestoWords.forEach((w, i) => w.classList.toggle('is-lit', pm * 1.05 > i / n));

  // panel: breakers flip in sequence, list follows
  const pp = progressOf(byName.panel, y);
  const active = clamp(Math.floor((pp - CIRCUIT_AT(0)) / 0.1), -1, 7);
  const focus = ui.hoverCircuit >= 0 ? ui.hoverCircuit : ui.listHover >= 0 ? ui.listHover : active;
  circuitItems.forEach((li, i) => {
    li.classList.toggle('is-on', pp > CIRCUIT_AT(i));
    li.classList.toggle('is-active', i === focus);
  });
  if (scene) { scene.state.panel = pp; scene.state.highlight = focus; }

  // safety: switch flips itself mid-chapter unless the visitor already played with it
  const ps = progressOf(byName.safety, y);
  if (!ui.powerByUser) setPower(ps > 0.38 && y < byName.process.start);

  // process: horizontal track
  const pr = progressOf(byName.process, y);
  const shift = Math.max(0, track.scrollWidth - track.clientWidth);
  track.style.transform = `translate3d(${pr * shift}px,0,0)`;
  trackFill.style.transform = `scaleX(${pr})`;

  // cursor
  cur.rx += (cur.x - cur.rx) * Math.min(1, dt * 12);
  cur.ry += (cur.y - cur.ry) * Math.min(1, dt * 12);
  cursor.style.transform = `translate3d(${cur.rx}px,${cur.ry}px,0)`;

  scene?.render(y, dt);
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------ boot */
addEventListener('resize', () => { scene?.resize(); measure(); });
new ResizeObserver(() => measure()).observe(document.body);
measure();
requestAnimationFrame(frame);

const volt = $('[data-volt]'), bar = $('.loader__bar span');
const fontsReady = Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
const t0 = performance.now(), MIN = reduced ? 200 : 1500;
(function loaderTick(t) {
  const k = clamp((t - t0) / MIN);
  volt.textContent = String(Math.round(230 * k)).padStart(3, '0');
  bar.style.transform = `scaleX(${k})`;
  if (k < 1) requestAnimationFrame(loaderTick);
})(t0);

await fontsReady;
scene?.refreshLabels();
measure();
await new Promise((r) => setTimeout(r, Math.max(0, MIN - (performance.now() - t0))));
if (scene && !reduced) { scene.state.ignition = 0; scene.state.intro = 0; }
document.body.classList.remove('is-loading');
document.body.classList.add('is-ready');
lenis?.start();
armReveals();

// debug handle (handy in devtools: __zerem.lenis.scrollTo(…))
window.__zerem = { lenis, chapters, scene };
