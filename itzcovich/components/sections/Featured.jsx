import { LISTINGS, TYPES, DEAL, AGENCY, fmtPrice } from '@/lib/data';
import { External, WhatsApp } from '../Icons';

const FEATURED = LISTINGS.filter((l) => l.featured);

/** All featured listings visible at once — the camera glides up the tower as you scroll past. */
export default function Featured() {
  return (
    <section className="featured stage" id="featured" data-stage="featured" aria-labelledby="featured-title">
      <div className="wrap">
        <header className="feat__head tone-dark glass" data-reveal>
          <p className="eyebrow">נכסים נבחרים</p>
          <h2 id="featured-title" className="display h2">נבחרו בקפידה, <em>השבוע.</em></h2>
        </header>
        <ul className="feat__grid">
          {FEATURED.map((l, k) => {
            const wa = `https://wa.me/${AGENCY.whatsapp}?text=${encodeURIComponent(`שלום, אשמח לפרטים ולתיאום צפייה: ${l.title}, ${l.city}`)}`;
            const price = fmtPrice(l);
            return (
              <li key={l.id} className="fcard tone-dark glass" data-reveal>
                <p className="fcard__top"><span className="ltr">{String(k + 1).padStart(2, '0')}</span><span>{DEAL[l.deal]} · {l.city}</span></p>
                <h3 className="display fcard__title">{l.title}</h3>
                <p className="fcard__price">{price ? price.replace(' לחודש', '') : 'מחיר בפנייה'}{price && l.deal === 'rent' && <small> לחודש</small>}</p>
                <ul className="feat__specs">
                  <li>{TYPES[l.type]}</li>
                  {l.rooms && <li>{l.rooms} חדרים</li>}
                  {l.sqm && <li>{l.sqm} מ״ר</li>}
                </ul>
                <div className="fcard__cta">
                  <a className="btn btn--dark btn--sm" href={wa} target="_blank" rel="noopener"><WhatsApp /><span>לתיאום צפייה</span></a>
                  <a className="btn btn--line btn--sm" href={l.url} target="_blank" rel="noopener" aria-label={`לעמוד הנכס: ${l.title}`}><External /></a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
