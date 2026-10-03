/**
 * booking.js — online appointment requests.
 *
 * Three steps: treatment → day & time → contact details.
 * Slots are generated from the clinic's opening hours (Israel time, whatever
 * the visitor's own time zone), skip past times, closed days and breaks, and
 * only offer start times where the whole treatment fits before closing.
 *
 * Without a server the request is sent to the clinic on WhatsApp, pre-filled;
 * with BOOKING.endpoint set it is POSTed as JSON instead. Either way the patient
 * can add the appointment to their calendar (.ics).
 */

/* ======================================================================
   CLINIC SETTINGS — edit here
   ====================================================================== */
export const BOOKING = {
  timeZone: 'Asia/Jerusalem',
  // Opening hours. 0 = Sunday … 6 = Saturday. Each entry is a list of [open, close] periods.
  hours: {
    0: [['08:00', '17:00']],
    1: [['08:00', '17:00']],
    2: [['08:00', '17:00']],
    3: [['08:00', '17:00']],
    4: [['08:00', '17:00']],
    5: [],
    6: [],
  },
  closedDates: [],          // e.g. '2026-10-14' — holidays, vacations
  slotStep: 30,             // minutes between proposed start times
  daysAhead: 28,            // how far ahead patients can book
  minNoticeHours: 3,        // no slots sooner than this
  endpoint: '',             // optional: URL that accepts a JSON POST (CRM, calendar, email service)
  whatsapp: '972525326620',
  clinic: 'DENTECH CARES — ד״ר דוד סיארי',
  address: 'משכית 22, בית לומיר, קומה 2, הרצליה פיתוח',
};

/* treatment → visit length in minutes (first visit / consultation) */
export const TREATMENTS = [
  { name: 'ייעוץ ובדיקה', min: 30 },
  { name: 'השתלות שיניים', min: 30 },
  { name: 'כתר ביום אחד', min: 120 },
  { name: 'חזיתות חרסינה', min: 30 },
  { name: 'כתרים וגשרים מזירקוניה', min: 30 },
  { name: 'הלבנת שיניים', min: 60 },
  { name: 'טיפולי חניכיים', min: 45 },
  { name: 'כירורגיה דנטלית', min: 30 },
  { name: 'רפואה אסתטית', min: 30 },
];

/* ---------------------------------------------------------------- time helpers (clinic-local) */
const pad = (n) => String(n).padStart(2, '0');
const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHHMM = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
/** "now" as wall-clock parts in the clinic's time zone */
function clinicNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: BOOKING.timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .formatToParts(new Date()).map((p) => [p.type, p.value]));
  return { y: +parts.year, m: +parts.month, d: +parts.day, min: +parts.hour * 60 + +parts.minute };
}
/** calendar-date arithmetic in UTC so DST and the visitor's zone never shift days */
const dayKey = (dt) => `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
const fmtDay = new Intl.DateTimeFormat('he-IL', { weekday: 'short', timeZone: 'UTC' });
const fmtDate = new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtLong = new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function buildDays() {
  const now = clinicNow();
  const today = new Date(Date.UTC(now.y, now.m - 1, now.d));
  const days = [];
  for (let i = 0; i <= BOOKING.daysAhead; i++) {
    const dt = new Date(today); dt.setUTCDate(today.getUTCDate() + i);
    days.push({ date: dt, key: dayKey(dt), isToday: i === 0, closed: BOOKING.closedDates.includes(dayKey(dt)) || !(BOOKING.hours[dt.getUTCDay()] || []).length });
  }
  return { days, now };
}

export function slotsFor(day, duration, now) {
  if (day.closed) return [];
  const earliest = day.isToday ? now.min + BOOKING.minNoticeHours * 60 : 0;
  const out = [];
  for (const [open, close] of BOOKING.hours[day.date.getUTCDay()] || []) {
    for (let t = toMin(open); t + duration <= toMin(close); t += BOOKING.slotStep) {
      if (t >= earliest) out.push(toHHMM(t));
    }
  }
  return out;
}

/* ---------------------------------------------------------------- .ics */
function icsFor({ day, time, treatment, duration }) {
  const [y, m, d] = day.key.split('-');
  const start = `${y}${m}${d}T${time.replace(':', '')}00`;
  const endMin = toMin(time) + duration;
  const end = `${y}${m}${d}T${pad(Math.floor(endMin / 60))}${pad(endMin % 60)}00`;
  const esc = (s) => s.replace(/[,;\\]/g, (c) => `\\${c}`);
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//DENTECH CARES//Booking//HE', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@dentech-cares`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART;TZID=${BOOKING.timeZone}:${start}`, `DTEND;TZID=${BOOKING.timeZone}:${end}`,
    `SUMMARY:${esc(`${treatment} — ${BOOKING.clinic}`)}`,
    `LOCATION:${esc(BOOKING.address)}`,
    `DESCRIPTION:${esc('בקשת תור — ממתין לאישור המרפאה. טלפון: 052-532-6620')}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
}

/* ---------------------------------------------------------------- widget */
export function createBooking(root) {
  const $ = (s) => root.querySelector(s);
  const $$ = (s) => [...root.querySelectorAll(s)];
  const state = { step: 0, treatment: null, day: null, time: null };
  let model = buildDays();

  const panes = $$('[data-pane]');
  const crumbs = $$('[data-crumb]');
  function go(step) {
    state.step = step;
    panes.forEach((p) => { p.hidden = +p.dataset.pane !== step; });
    crumbs.forEach((c, i) => { c.classList.toggle('is-on', i === step); c.classList.toggle('is-done', i < step); c.toggleAttribute('aria-current', i === step); });
    const focusTarget = $(`[data-pane="${step}"] h3`);
    focusTarget?.focus({ preventScroll: true });
    renderSummary();
  }

  /* step 1 — treatment */
  const treatWrap = $('[data-bk-treat]');
  TREATMENTS.forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'bk-chip'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
    b.innerHTML = `<b>${t.name}</b><small>${t.min >= 60 ? `${t.min / 60 === 1 ? 'שעה' : `${t.min / 60} שעות`}` : `${t.min} דק׳`}</small>`;
    b.addEventListener('click', () => { pickTreatment(i); go(1); });
    treatWrap.append(b);
  });
  function pickTreatment(i) {
    state.treatment = TREATMENTS[i];
    $$('.bk-chip').forEach((c, k) => c.setAttribute('aria-checked', String(k === i)));
    if (state.day) renderTimes();
  }

  /* step 2 — day & time */
  const daysWrap = $('[data-bk-days]'), timesWrap = $('[data-bk-times]'), nextBtn = $('[data-bk-next]');
  function renderDays() {
    daysWrap.replaceChildren();
    let firstOpen = null;
    model.days.forEach((day) => {
      const free = slotsFor(day, state.treatment?.min ?? 30, model.now).length;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-day'; b.setAttribute('role', 'option');
      b.disabled = !free;
      b.setAttribute('aria-selected', String(state.day?.key === day.key));
      b.setAttribute('aria-label', `${fmtLong.format(day.date)}${free ? '' : ' — אין תורים פנויים'}`);
      b.innerHTML = `<span>${day.isToday ? 'היום' : fmtDay.format(day.date)}</span><b>${day.date.getUTCDate()}</b><small>${fmtDate.format(day.date).replace(/^\d+\s*/, '')}</small>`;
      b.addEventListener('click', () => { state.day = day; state.time = null; renderDays(); renderTimes(); });
      daysWrap.append(b);
      if (free && !firstOpen) firstOpen = day;
    });
    if (!state.day && firstOpen) { state.day = firstOpen; renderDays(); renderTimes(); }
  }
  function renderTimes() {
    timesWrap.replaceChildren();
    const slots = state.day ? slotsFor(state.day, state.treatment?.min ?? 30, model.now) : [];
    $('[data-bk-day-label]').textContent = state.day ? fmtLong.format(state.day.date) : '';
    if (!slots.length) { timesWrap.innerHTML = '<p class="bk-empty">אין שעות פנויות ביום זה — בחרו יום אחר.</p>'; }
    let lastPeriod = null;
    slots.forEach((s) => {
      const period = toMin(s) < 12 * 60 ? 'בוקר' : toMin(s) < 17 * 60 ? 'צהריים' : 'ערב';
      if (period !== lastPeriod) { const h = document.createElement('p'); h.className = 'bk-period'; h.textContent = period; timesWrap.append(h); lastPeriod = period; }
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'bk-time ltr'; b.textContent = s; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', String(state.time === s));
      b.addEventListener('click', () => { state.time = s; renderTimes(); });
      timesWrap.append(b);
    });
    nextBtn.disabled = !state.time;
    renderSummary();
  }
  nextBtn.addEventListener('click', () => { if (state.time) go(2); });
  $$('[data-bk-back]').forEach((b) => b.addEventListener('click', () => go(Math.max(0, state.step - 1))));
  $$('[data-crumb]').forEach((c, i) => c.addEventListener('click', () => { if (i < state.step || (i === 1 && state.treatment) || (i === 2 && state.time)) go(i); }));

  /* summary */
  function renderSummary() {
    $$('[data-bk-sum]').forEach((el) => {
      el.innerHTML = state.treatment
        ? `<span>${state.treatment.name}</span>${state.day && state.time ? `<span>${fmtLong.format(state.day.date)}</span><span class="ltr">${state.time}</span>` : ''}`
        : '';
    });
  }

  /* step 3 — details & send */
  const form = $('[data-bk-form]'), msg = $('[data-bk-msg]');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') || '').trim();
    const phone = (fd.get('phone') || '').replace(/[^\d+]/g, '');
    const okPhone = /^(\+?972|0)(5\d|[2-489]|7\d)\d{7}$/.test(phone) || /^\+\d{8,15}$/.test(phone);
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('is-invalid'));
    if (!name) form.querySelector('[name="name"]').closest('.field').classList.add('is-invalid');
    if (!okPhone) form.querySelector('[name="phone"]').closest('.field').classList.add('is-invalid');
    if (!name || !okPhone) { msg.className = 'form__msg is-err'; msg.textContent = 'נא למלא שם ומספר טלפון תקין.'; return; }
    if (!fd.get('consent')) { msg.className = 'form__msg is-err'; msg.textContent = 'נא לאשר יצירת קשר כדי שנוכל לאשר את התור.'; return; }
    const req = { treatment: state.treatment.name, duration: state.treatment.min, date: state.day.key, time: state.time, name, phone, message: (fd.get('msg') || '').trim() };
    const btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
    try {
      if (BOOKING.endpoint) {
        const r = await fetch(BOOKING.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(req) });
        if (!r.ok) throw new Error(r.status);
      } else {
        window.open(`https://wa.me/${BOOKING.whatsapp}?text=${encodeURIComponent(waText(req))}`, '_blank', 'noopener');
      }
      done(req);
    } catch {
      msg.className = 'form__msg is-err'; msg.textContent = 'משהו השתבש בשליחה. אפשר להתקשר אלינו: 052-532-6620';
    } finally { btn.disabled = false; }
  });
  function waText(r) {
    return `שלום, אני ${r.name} (${r.phone}).\nאבקש לקבוע תור ל${r.treatment}\nביום ${fmtLong.format(state.day.date)} בשעה ${r.time}.${r.message ? `\n${r.message}` : ''}`;
  }
  function done(req) {
    $('[data-bk-done-name]').textContent = req.name;
    $('[data-bk-wa]').href = `https://wa.me/${BOOKING.whatsapp}?text=${encodeURIComponent(waText(req))}`;
    $('[data-bk-wa]').hidden = !!BOOKING.endpoint;
    const blob = new Blob([icsFor({ day: state.day, time: state.time, treatment: state.treatment.name, duration: state.treatment.min })], { type: 'text/calendar' });
    const ics = $('[data-bk-ics]');
    ics.href = URL.createObjectURL(blob);
    ics.download = `dentech-cares-${req.date}.ics`;
    msg.textContent = '';
    go(3);
  }
  $('[data-bk-restart]').addEventListener('click', () => {
    form.reset(); state.treatment = null; state.day = null; state.time = null;
    $$('.bk-chip').forEach((c) => c.setAttribute('aria-checked', 'false'));
    model = buildDays(); renderDays(); renderTimes(); go(0);
  });

  renderDays(); renderTimes(); go(0);

  return {
    /** preselect a treatment by its display name (from service cards / CTAs) */
    select(name) {
      const i = TREATMENTS.findIndex((t) => t.name === name || name.includes(t.name) || t.name.includes(name));
      if (i < 0) return;
      pickTreatment(i);
      if (!state.day || !slotsFor(state.day, state.treatment.min, model.now).length) { state.day = null; }
      renderDays(); renderTimes(); go(1);
    },
  };
}
