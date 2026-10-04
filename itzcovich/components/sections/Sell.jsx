'use client';
import { useState } from 'react';
import { AGENCY, AREAS, TYPES } from '@/lib/data';
import { Arrow } from '../Icons';

/* Optional: a URL that accepts a JSON POST (CRM / email service). Empty → WhatsApp. */
const LEAD_ENDPOINT = '';

export default function Sell() {
  const [msg, setMsg] = useState({ t: '', k: '' });
  const [bad, setBad] = useState({});
  async function submit(e) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const d = Object.fromEntries(fd);
    const phone = (d.phone || '').replace(/[^\d+]/g, '');
    const errs = { name: !d.name?.trim(), phone: !/^(\+?972|0)\d{8,9}$/.test(phone), city: !d.city };
    setBad(errs);
    if (errs.name || errs.phone || errs.city) return setMsg({ t: 'נא למלא שם, טלפון תקין ומיקום הנכס.', k: 'is-err' });
    if (!d.consent) return setMsg({ t: 'נא לאשר יצירת קשר.', k: 'is-err' });
    const text = `שלום, אני ${d.name.trim()} (${phone}).\nאשמח להערכת שווי לנכס: ${TYPES[d.type] || d.type}, ${d.street ? `${d.street}, ` : ''}${d.city}.\nמטרה: ${d.goal}${d.msg?.trim() ? `\n${d.msg.trim()}` : ''}`;
    try {
      if (LEAD_ENDPOINT) {
        const r = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, phone }) });
        if (!r.ok) throw new Error();
        setMsg({ t: `תודה ${d.name.trim()}, קיבלנו את הפרטים ונחזור אליך בהקדם.`, k: 'is-ok' });
        e.currentTarget.reset();
      } else {
        window.open(`https://wa.me/${AGENCY.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
        setMsg({ t: `תודה ${d.name.trim()}! פתחנו הודעה מוכנה בוואטסאפ — רק לשלוח.`, k: 'is-ok' });
      }
    } catch { setMsg({ t: `משהו השתבש. אפשר להתקשר: ${AGENCY.phoneOffice}`, k: 'is-err' }); }
  }
  return (
    <section className="sell stage" id="sell" data-stage="sell" aria-labelledby="sell-title">
      <div className="sell__grid">
        <div className="panel" data-reveal>
          <p className="eyebrow">מוכרים או משכירים?</p>
          <h2 id="sell-title" className="display h2">כמה שווה <em>הנכס שלכם?</em></h2>
          <p className="lede" style={{ marginBottom: '1.6rem' }}>השאירו פרטים ונחזור אליכם עם הערכת מחיר שוק מבוססת עסקאות באזור — ותוכנית שיווק לנכס.</p>
          <form className="form" onSubmit={submit} noValidate>
            <div className="form__row">
              <label className={`field${bad.name ? ' is-invalid' : ''}`}><span>שם מלא</span><input name="name" autoComplete="name" required /></label>
              <label className={`field${bad.phone ? ' is-invalid' : ''}`}><span>טלפון</span><input name="phone" type="tel" inputMode="tel" autoComplete="tel" dir="ltr" style={{ textAlign: 'right' }} required /></label>
            </div>
            <div className="form__row">
              <label className={`field${bad.city ? ' is-invalid' : ''}`}><span>עיר</span>
                <select name="city" required defaultValue=""><option value="" disabled>בחירת עיר</option>{AREAS.map((a) => <option key={a.key}>{a.name}</option>)}<option>אחר בשרון</option></select>
              </label>
              <label className="field"><span>רחוב / שכונה</span><input name="street" autoComplete="address-line1" /></label>
            </div>
            <div className="form__row">
              <label className="field"><span>סוג הנכס</span>
                <select name="type" defaultValue="apartment">{Object.entries(TYPES).map(([k, t]) => <option key={k} value={k}>{t}</option>)}<option value="בית פרטי">בית פרטי</option><option value="פנטהאוז">פנטהאוז</option><option value="קרקע">קרקע</option></select>
              </label>
              <label className="field"><span>מה התוכנית?</span>
                <select name="goal" defaultValue="מכירה"><option>מכירה</option><option>השכרה</option><option>ניהול הנכס</option><option>עוד לא החלטתי</option></select>
              </label>
            </div>
            <label className="field"><span>פרטים נוספים (לא חובה)</span><textarea name="msg" rows="2" /></label>
            <label className="consent"><input type="checkbox" name="consent" /><span>אני מאשר/ת שהמשרד ייצור איתי קשר בנוגע לפנייה. <a href="privacy/">מדיניות פרטיות</a></span></label>
            <button className="btn btn--dark btn--block" type="submit"><span>לקבלת הערכת שווי</span><Arrow /></button>
            <p className={`form__msg ${msg.k}`} role="status" aria-live="polite">{msg.t}</p>
            <p className="fine">הערכת מחיר שוק ניתנת על ידי מתווך מקרקעין ואינה מהווה שומת מקרקעין.</p>
          </form>
        </div>
      </div>
    </section>
  );
}
