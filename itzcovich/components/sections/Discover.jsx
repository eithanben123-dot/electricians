'use client';
import { useMemo, useState } from 'react';
import { LISTINGS, TYPES, DEAL, fmtPrice } from '@/lib/data';
import PropertyArt from '../PropertyArt';
import { External } from '../Icons';

const BUDGETS = {
  sale: [['', 'כל התקציבים'], ['0-3000000', 'עד ₪3 מיליון'], ['3000000-4500000', '₪3–4.5 מיליון'], ['4500000-99999999', 'מעל ₪4.5 מיליון']],
  rent: [['', 'כל התקציבים'], ['0-5000', 'עד ₪5,000'], ['5000-8000', '₪5,000–8,000'], ['8000-999999', 'מעל ₪8,000']],
};

export default function Discover() {
  const [deal, setDeal] = useState('all');
  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');
  const cities = useMemo(() => [...new Set(LISTINGS.map((l) => l.city))], []);
  const types = useMemo(() => [...new Set(LISTINGS.map((l) => l.type))], []);

  const list = LISTINGS.filter((l) => {
    if (deal !== 'all' && l.deal !== deal) return false;
    if (type && l.type !== type) return false;
    if (city && l.city !== city) return false;
    if (budget) { const [lo, hi] = budget.split('-').map(Number); if (l.price == null || l.price < lo || l.price > hi) return false; }
    return true;
  });

  return (
    <section className="discover sheet" id="properties" aria-labelledby="discover-title">
      <div className="wrap">
        <header className="discover__head" data-reveal>
          <div>
            <p className="eyebrow">נכסים</p>
            <h2 id="discover-title" className="display h2">הנכסים שלנו <em>בשרון.</em></h2>
            <p className="lede">דירות, דירות גן, דופלקסים ונכסים מסחריים — למכירה ולהשכרה. כל נכס מקושר לעמוד המלא שלו, עם תמונות ופרטים.</p>
          </div>
        </header>

        <div className="filters" role="group" aria-label="סינון נכסים" data-reveal>
          <div className="seg" role="group" aria-label="סוג עסקה">
            {[['all', 'הכל'], ['sale', DEAL.sale], ['rent', DEAL.rent]].map(([k, t]) => (
              <button key={k} type="button" aria-pressed={deal === k} onClick={() => { setDeal(k); setBudget(''); }}>{t}</button>
            ))}
          </div>
          <label className="select"><span className="sr-only">סוג נכס</span>
            <select value={type} onChange={(e) => setType(e.target.value)}><option value="">כל סוגי הנכסים</option>{types.map((t) => <option key={t} value={t}>{TYPES[t]}</option>)}</select>
          </label>
          <label className="select"><span className="sr-only">עיר</span>
            <select value={city} onChange={(e) => setCity(e.target.value)}><option value="">כל הערים</option>{cities.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          {deal !== 'all' && (
            <label className="select"><span className="sr-only">תקציב</span>
              <select value={budget} onChange={(e) => setBudget(e.target.value)}>{BUDGETS[deal].map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
            </label>
          )}
          <span className="filters__count" aria-live="polite">{list.length} נכסים</span>
        </div>

        <ol className="plist">
          {list.map((l, i) => (
            <li key={l.id} className="prow">
              <span className="prow__n ltr">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h3 className="prow__title">{l.title}<span className={`prow__deal${l.deal === 'rent' ? ' prow__deal--rent' : ''}`}>{DEAL[l.deal]}</span></h3>
              </div>
              <p className="prow__meta">
                <span>{l.city}</span>
                {l.area && <span>{l.area}</span>}
                <span>{TYPES[l.type]}</span>
                {l.rooms && <span>{l.rooms} חדרים</span>}
                {l.sqm && <span>{l.sqm} מ״ר</span>}
                {l.notes && <span>{l.notes}</span>}
              </p>
              <div className="prow__side">
                {fmtPrice(l) ? <span className="prow__price">{fmtPrice(l)}</span> : <span className="prow__price prow__price--na">מחיר בפנייה</span>}
                <a className="link" href={l.url} target="_blank" rel="noopener">לעמוד הנכס <External /></a>
              </div>
              <PropertyArt type={l.type} className="prow__art" />
            </li>
          ))}
        </ol>
        {!list.length && <p className="plist__empty">אין כרגע נכסים שמתאימים לסינון — <a className="link" href="#contact">ספרו לנו מה אתם מחפשים</a>.</p>}
        <p className="discover__note">המחירים והפרטים כפי שפורסמו באתר המשרד. זמינות ומחירים עשויים להשתנות — מומלץ לוודא מול המשרד.</p>
      </div>
    </section>
  );
}
