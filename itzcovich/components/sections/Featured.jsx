'use client';
import { useCallback, useRef, useState } from 'react';
import { LISTINGS, TYPES, DEAL, AGENCY, fmtPrice } from '@/lib/data';
import { usePinSteps } from '../ScrollDirector';
import { External, WhatsApp } from '../Icons';

const FEATURED = LISTINGS.filter((l) => l.featured);

export default function Featured() {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  usePinSteps(ref, FEATURED.length, useCallback((k) => setI(k), []));
  const l = FEATURED[i];
  const wa = `https://wa.me/${AGENCY.whatsapp}?text=${encodeURIComponent(`שלום, אשמח לפרטים ולתיאום צפייה: ${l.title}, ${l.city}`)}`;
  return (
    <section ref={ref} className="featured pinned stage" id="featured" data-stage="featured" aria-labelledby="featured-title">
      <div className="pin">
        <div className="pin__grid">
          <article className="panel" aria-live="polite">
            <p className="eyebrow">נכסים נבחרים</p>
            <h2 id="featured-title" className="sr-only">נכסים נבחרים</h2>
            <div className="feat__count"><span className="ltr"><b>{String(i + 1).padStart(2, '0')}</b> / {String(FEATURED.length).padStart(2, '0')}</span><span className="feat__dots">{FEATURED.map((f, k) => <i key={f.id} className={k === i ? 'is-on' : ''} />)}</span></div>
            <div className="feat__item" key={l.id}>
              <p className="muted" style={{ margin: 0 }}>{DEAL[l.deal]} · {l.city}{l.area ? ` · ${l.area}` : ''}</p>
              <h3 className="display h3">{l.title}</h3>
              {fmtPrice(l) && <p className="feat__price">{fmtPrice(l).replace(' לחודש', '')}{l.deal === 'rent' && <small> לחודש</small>}</p>}
              <ul className="feat__specs">
                <li>{TYPES[l.type]}</li>
                {l.rooms && <li>{l.rooms} חדרים</li>}
                {l.sqm && <li>{l.sqm} מ״ר</li>}
                {l.notes && <li>{l.notes}</li>}
              </ul>
              <div className="feat__cta">
                <a className="btn btn--dark btn--sm" href={wa} target="_blank" rel="noopener"><WhatsApp /><span>לתיאום צפייה</span></a>
                <a className="btn btn--line btn--sm" href={l.url} target="_blank" rel="noopener"><span>לעמוד הנכס</span><External /></a>
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
