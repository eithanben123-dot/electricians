/**
 * main.js — scroll choreography, DOM ↔ WebGL bridge, interactions.
 */
import Lenis from '../vendor/lenis/lenis.mjs';

const CONTACT_EMAIL = 'hello@aether.studio'; // ← where the form sends

history.scrollRestoration = 'manual';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse = matchMedia('(pointer: coarse)').matches;
const mobile = coarse || innerWidth < 760;
document.documentElement.classList.toggle('is-touch', coarse);

/* ------------------------------------------------------------ content */
const PROJECT_COPY = [
  { tag: 'חנות אופנה · Headless Commerce', desc: 'חוויית קנייה תלת־ממדית עם סוכן סטייליסט מבוסס AI שממליץ על לוקים בזמן אמת.', kpi: '+182%', kpiT: 'המרות בשלושה חודשים' },
  { tag: 'ייעוץ פיננסי · אתר תדמית', desc: 'אתר WebGL קולנועי ופורטל משקיעים מאובטח, עם עוזר AI שעונה על שאלות רגולציה.', kpi: '×3', kpiT: 'זמן שהייה באתר' },
  { tag: 'רשת מרפאות · סוכן זימון', desc: 'סוכן AI שמתאם תורים בוואטסאפ, שולח תזכורות ומסנכרן את היומנים של 14 סניפים.', kpi: '−64%', kpiT: 'שיחות למוקד' },
  { tag: 'משרד אדריכלות · פורטפוליו', desc: 'גלריית פרויקטים תלת־ממדית שבה מבקרים "נכנסים" לתוך הבניינים — ישר מהדפדפן.', kpi: '+240%', kpiT: 'פניות איכותיות' },
  { tag: 'רשת כושר · אוטומציה', desc: 'אפליקציית ווב למנויים ואוטומציה מלאה של חידושים, תשלומים ותקשורת עם המתאמנים.', kpi: '11h', kpiT: 'נחסכות כל שבוע' },
];
const AGENTS = [
  { id: 'noa.sales', role: 'מסננת לידים, עונה על שאלות וקובעת פגישות ישירות ביומן.', stat: 'avg. reply 1.8s', chat: [
    ['u', 'היי, אני מתעניין בחבילה העסקית'], ['a', 'מעולה! כמה אנשים יש אצלכם בצוות?'], ['u', 'בערך 12'], ['a', 'מושלם — החבילה העסקית מתאימה בדיוק. לקבוע לך שיחת היכרות ביום שלישי ב־10:00?']] },
  { id: 'ariel.support', role: 'עונה בוואטסאפ ובצ׳אט, מכיר כל מוצר וכל הזמנה.', stat: 'CSAT 4.9/5', chat: [
    ['u', 'ההזמנה שלי עוד לא הגיעה 😕'], ['a', 'בדקתי — הזמנה ‎#4821 יצאה אתמול ותגיע מחר עד 14:00. לשלוח לך קישור למעקב?'], ['u', 'כן בבקשה'], ['a', 'נשלח לוואטסאפ ✓']] },
  { id: 'maya.ops', role: 'מפיקה הצעות מחיר, מעדכנת CRM ושולחת דוחות.', stat: '38 tasks / day', chat: [
    ['s', 'ליד חדש נכנס: אורן מערכות בע״מ'], ['a', 'יצרתי הצעת מחיר, עדכנתי את ה־CRM ושלחתי ללקוח. סטטוס: ממתין לחתימה.'], ['u', 'מאיה, מה המצב החודש?'], ['a', '38 הצעות נשלחו, 21 נחתמו. הדוח המלא מחכה לך במייל.']] },
  { id: 'tom.content', role: 'כותב פוסטים, ניוזלטרים ותיאורי מוצר — בקול של המותג.', stat: '120 posts / mo', chat: [
    ['u', 'תכתוב פוסט על ההשקה'], ['a', 'טיוטה: ״העתיד כבר כאן — והוא מדבר עברית.״ להכין גם גרסה לאינסטגרם ולניוזלטר?'], ['u', 'כן'], ['a', 'מוכן: 3 גרסאות + האשטגים. מתוזמן למחר ב־09:00.']] },
];

/* ------------------------------------------------------------ split headings */
$$('[data-split] .line').forEach((line) => {
  const inner = document.createElement('span');
  inner.className = 'line__in';
  inner.append(...line.childNodes);
  line.append(inner);
});
$('[data-year]').textContent = new Date().getFullYear();

/* ------------------------------------------------------------ world */
const ui = { serviceHover: -1, agentHover: -1, mode: 0 };
let world = null, PROJECTS = [];
try {
  const mod = await import('./scene.js');
  PROJECTS = mod.PROJECTS;
  world = mod.createWorld($('#world'), {
    mobile, reduced,
    onHover: (info) => {
      document.body.classList.toggle('is-picking', !!info);
      const labels = { core: 'גע', portal: 'גע', showcase: 'גרור', service: 'גלה', agent: 'הכר', project: 'פתח' };
      setCursorLabel(info ? labels[info.type] : null);
      ui.agentHover = info && info.type === 'agent' ? info.index : -1;
      ui.serviceHover = info && info.type === 'service' ? info.index : -1;
    },
    onPick: (info) => {
      if (info.type === 'project') goTo('portfolio', info.index / 4);
      if (info.type === 'service') goTo('services', info.index / 2);
      if (info.type === 'agent') goTo('agents', (info.index + 0.5) / 4);
    },
  });
} catch (err) {
  console.warn('WebGL unavailable — static fallback', err);
  document.documentElement.classList.add('no-webgl');
}

/* ------------------------------------------------------------ scroll */
const lenis = reduced ? null : new Lenis({ autoRaf: false, lerp: 0.07, wheelMultiplier: 0.8, touchMultiplier: 1.2 });
lenis?.stop();
const scrollTo = (y, duration = 2.2) => (lenis ? lenis.scrollTo(y, { duration, easing: (t) => 1 - Math.pow(1 - t, 4) }) : window.scrollTo(0, y));
const scrollY = () => (lenis ? lenis.animatedScroll : window.scrollY);

const chapters = $$('.ch').map((el) => ({ el, name: el.dataset.scene, label: el.dataset.name, start: 0, end: 0 }));
const by = Object.fromEntries(chapters.map((c) => [c.name, c]));
let vh = innerHeight;
function measure() {
  vh = innerHeight;
  chapters.forEach((c) => {
    c.start = c.el.getBoundingClientRect().top + window.scrollY;
    c.end = Math.max(c.start, c.start + c.el.offsetHeight - vh);
  });
  const last = chapters[chapters.length - 1];
  last.end = Math.max(last.start, document.documentElement.scrollHeight - vh);
  world?.setTimeline(chapters.map(({ name, start, end }) => ({ name, start, end })));
}
const prog = (c, y) => (c.end - c.start < 2 ? (y >= c.start ? 1 : 0) : clamp((y - c.start) / (c.end - c.start)));
function goTo(name, p = 0, dur) { const c = by[name]; scrollTo(c.start + (c.end - c.start) * p, dur); }

$$('[data-nav]').forEach((a) => a.addEventListener('click', (e) => {
  const id = a.getAttribute('href').slice(1);
  const c = chapters.find((ch) => ch.el.id === id);
  if (!c) return;
  e.preventDefault();
  scrollTo(c.start + (c.end - c.start) * (id === 'process' ? 0.25 : 0), 2.6);
}));

/* ------------------------------------------------------------ services */
const svcItems = $$('[data-svc] li');
svcItems.forEach((li) => {
  li.addEventListener('pointerenter', () => { if (!coarse) ui.serviceHover = +li.dataset.i; });
  li.addEventListener('pointerleave', () => { ui.serviceHover = -1; });
  li.addEventListener('click', () => goTo('services', +li.dataset.i / 2, 1.4));
});

/* ------------------------------------------------------------ agents + terminal */
const rosterItems = $$('[data-roster] li');
const term = $('[data-term]'), termTitle = $('[data-term-title]'), termRole = $('[data-term-role]'), termStat = $('[data-term-stat]');
let shownAgent = -1, chatToken = 0;
rosterItems.forEach((li) => {
  const i = +li.dataset.i;
  const b = $('button', li);
  b.addEventListener('click', () => goTo('agents', (i + 0.5) / 4, 1.4));
  li.addEventListener('pointerenter', () => { if (!coarse) ui.agentHover = i; });
  li.addEventListener('pointerleave', () => { ui.agentHover = -1; });
  b.addEventListener('focus', () => { ui.agentHover = i; });
  b.addEventListener('blur', () => { ui.agentHover = -1; });
});
const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));
async function playChat(i) {
  const token = ++chatToken;
  const a = AGENTS[i];
  termTitle.textContent = `agent://${a.id}`;
  termRole.textContent = a.role; termStat.textContent = a.stat;
  term.replaceChildren();
  for (const [who, text] of a.chat) {
    if (token !== chatToken) return;
    const row = document.createElement('p');
    row.className = `msg msg--${who}`;
    term.append(row);
    if (who === 'a') {
      row.classList.add('is-typing'); row.innerHTML = '<i></i><i></i><i></i>';
      await sleep(850);
      if (token !== chatToken) return;
      row.classList.remove('is-typing'); row.textContent = '';
      for (let k = 1; k <= text.length; k += 2) {
        if (token !== chatToken) return;
        row.textContent = text.slice(0, k);
        await sleep(18);
      }
      row.textContent = text;
    } else {
      row.textContent = text;
    }
    await sleep(650);
  }
}

/* ------------------------------------------------------------ portfolio */
const work = $('[data-work]');
const wI = $('[data-work-i]'), wName = $('[data-work-name]'), wTag = $('[data-work-tag]'), wDesc = $('[data-work-desc]'), wKpi = $('[data-work-kpi]'), wKpiT = $('[data-work-kpi-t]');
const dots = $('[data-work-dots]');
PROJECT_COPY.forEach((_, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.setAttribute('aria-label', `פרויקט ${i + 1}`);
  b.addEventListener('click', () => goTo('portfolio', i / 4, 1.4));
  dots.append(b);
});
let shownProject = -1;
function showProject(i) {
  shownProject = i;
  work.classList.remove('is-in'); void work.offsetWidth;
  const c = PROJECT_COPY[i];
  wI.textContent = String(i + 1).padStart(2, '0');
  wName.textContent = PROJECTS[i]?.name ?? '';
  wTag.textContent = c.tag; wDesc.textContent = c.desc; wKpi.textContent = c.kpi; wKpiT.textContent = c.kpiT;
  work.classList.add('is-in');
  [...dots.children].forEach((d, k) => d.classList.toggle('is-on', k === i));
}

/* ------------------------------------------------------------ steps / benefits */
const stepItems = $$('[data-steps] li');
const benItems = $$('[data-ben] .ben__item');
const benFill = $('[data-ben-fill]');

/* ------------------------------------------------------------ showcase modes */
$$('[data-modes] button').forEach((b) => b.addEventListener('click', () => {
  ui.mode = +b.dataset.mode;
  if (world) world.state.mode = ui.mode;
  $$('[data-modes] button').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
}));

/* ------------------------------------------------------------ reveals */
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { threshold: 0.2 });
const armReveals = () => $$('.reveal, [data-split]').forEach((el) => io.observe(el));

/* ------------------------------------------------------------ cursor + pointer */
const cursor = $('.cursor'), cursorLabel = $('.cursor__ring em');
const cur = { x: innerWidth / 2, y: innerHeight / 2, rx: innerWidth / 2, ry: innerHeight / 2 };
let domLabel = null, sceneLabel = null;
function setCursorLabel(t) { sceneLabel = t; paintCursor(); }
function paintCursor() { const t = domLabel || sceneLabel; cursor.classList.toggle('is-big', !!t); if (t) cursorLabel.textContent = t; }
const ndc = (e) => [(e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1];
const INTERACTIVE = 'a, button, input, textarea, select, label, [data-svc] li, [data-roster], .term';
let downAt = null, dragging = false;
addEventListener('pointermove', (e) => {
  cur.x = e.clientX; cur.y = e.clientY;
  if (e.pointerType === 'mouse') cursor.classList.add('is-on');
  const [x, y] = ndc(e);
  world?.setPointer(x, y);
  if (dragging) world.dragMove(x, y);
}, { passive: true });
addEventListener('pointerdown', (e) => {
  downAt = [e.clientX, e.clientY];
  if (!world || e.pointerType !== 'mouse' || e.target.closest(INTERACTIVE)) return;
  const [x, y] = ndc(e);
  if (world.dragStart(x, y)) { dragging = true; document.body.classList.add('is-dragging'); e.preventDefault(); }
});
addEventListener('pointerup', () => { if (dragging) { world.dragEnd(); dragging = false; document.body.classList.remove('is-dragging'); } });
addEventListener('click', (e) => {
  if (!world || e.target.closest(INTERACTIVE)) return;
  if (downAt && Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return; // was a drag
  const [x, y] = ndc(e);
  world.setPointer(x, y);
  world.click();
});
document.addEventListener('pointerover', (e) => {
  const el = e.target.closest('[data-cursor], a, button, [data-svc] li');
  domLabel = el ? (el.dataset.cursor || '') : null;
  cursor.classList.toggle('is-link', !!el);
  paintCursor();
});

/* ------------------------------------------------------------ form */
$('[data-form]').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = e.currentTarget, note = $('[data-note]');
  const fd = new FormData(f);
  const name = (fd.get('name') || '').trim(), reach = (fd.get('reach') || '').trim();
  if (!name || reach.length < 5) { note.textContent = 'נא למלא שם ודרך ליצור קשר.'; note.classList.add('is-error'); return; }
  note.classList.remove('is-error');
  const what = fd.getAll('what').join(', ') || 'לא צוין';
  const body = `שם: ${name}\nיצירת קשר: ${reach}\nמה בונים: ${what}\n\n${(fd.get('msg') || '').trim()}`;
  location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`פרויקט חדש — ${name}`)}&body=${encodeURIComponent(body)}`;
  note.textContent = 'ההודעה מוכנה ביישום המייל שלכם — רק ללחוץ שליחה.';
});

/* ------------------------------------------------------------ frame loop */
const header = $('.top');
const hudX = $('[data-hud-x]'), hudY = $('[data-hud-y]'), hudZ = $('[data-hud-z]'), hudFill = $('[data-hud-fill]'), hudNum = $('[data-hud-num]'), hudName = $('[data-hud-name]');
let last = performance.now(), lastCh = -1;

function frame(now) {
  const dt = (now - last) / 1000; last = now;
  lenis?.raf(now);
  const y = scrollY();
  const maxY = document.documentElement.scrollHeight - vh;
  header.classList.toggle('is-scrolled', y > 40);
  hudFill.style.transform = `scaleY(${clamp(y / maxY)})`;

  let ci = 0;
  chapters.forEach((c, i) => { if (y >= c.start - vh * 0.5) ci = i; });
  if (ci !== lastCh) {
    lastCh = ci;
    hudNum.textContent = String(ci + 1).padStart(2, '0');
    hudName.textContent = chapters[ci].label;
    document.body.dataset.chapter = chapters[ci].name;
  }

  // services
  const ps = prog(by.services, y);
  const svc = ui.serviceHover >= 0 ? ui.serviceHover : Math.round(ps * 2);
  svcItems.forEach((li, i) => li.classList.toggle('is-active', i === svc));

  // agents
  const pa = prog(by.agents, y);
  const agent = ui.agentHover >= 0 ? ui.agentHover : clamp(Math.floor(pa * 4), 0, 3);
  rosterItems.forEach((li, i) => li.classList.toggle('is-active', i === agent));
  const agentsInView = y > by.agents.start - vh * 0.6 && y < by.agents.end + vh * 0.4;
  if (agentsInView && agent !== shownAgent) { shownAgent = agent; playChat(agent); }

  // portfolio
  const pp = prog(by.portfolio, y);
  const project = clamp(Math.round(pp * 4), 0, 4);
  if (project !== shownProject) showProject(project);

  // process
  const pr = prog(by.process, y);
  const step = Math.floor(pr * 4 + 0.1) - 1;
  stepItems.forEach((li, i) => { li.classList.toggle('is-active', i === Math.max(0, step)); li.classList.toggle('is-done', i < step); });

  // benefits
  const pb = prog(by.benefits, y);
  const ben = clamp(Math.round(pb * 3), 0, 3);
  benItems.forEach((el, i) => el.classList.toggle('is-active', i === ben));
  benFill.style.transform = `scaleX(${pb})`;

  if (world) {
    Object.assign(world.state, { activeService: svc, activeAgent: agentsInView ? agent : -1, project, step, morph: pb * 3 });
    world.render(y, dt);
    const cp = world.debug.camera.position;
    hudX.textContent = cp.x.toFixed(2); hudY.textContent = cp.y.toFixed(2); hudZ.textContent = cp.z.toFixed(2);
  }

  cur.rx += (cur.x - cur.rx) * Math.min(1, dt * 14);
  cur.ry += (cur.y - cur.ry) * Math.min(1, dt * 14);
  cursor.style.transform = `translate3d(${cur.rx}px,${cur.ry}px,0)`;
  requestAnimationFrame(frame);
}

/* ------------------------------------------------------------ boot */
addEventListener('resize', () => { world?.resize(); measure(); });
new ResizeObserver(() => measure()).observe(document.body);
measure();
requestAnimationFrame(frame);

const pct = $('[data-boot-pct]'), log = $('[data-boot-log]'), bar = $('.boot__line span');
const LOGS = ['initializing neural core…', 'compiling shaders…', 'spawning agents…', 'mapping the world…', 'ready.'];
const t0 = performance.now(), MIN = reduced ? 200 : 1900;
(function bootTick(t) {
  const k = clamp((t - t0) / MIN);
  pct.textContent = String(Math.round(k * 100)).padStart(2, '0');
  log.textContent = LOGS[Math.min(LOGS.length - 1, Math.floor(k * LOGS.length))];
  bar.style.transform = `scaleX(${k})`;
  if (k < 1) requestAnimationFrame(bootTick);
})(t0);
await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2500))]);
measure();
await new Promise((r) => setTimeout(r, Math.max(0, MIN - (performance.now() - t0))));
if (world && !reduced) world.state.intro = 0;
document.body.classList.remove('is-loading');
document.body.classList.add('is-ready');
lenis?.start();
armReveals();

window.__aether = { lenis, chapters, world };
