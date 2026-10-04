'use client';
import { useState } from 'react';
import { AREAS } from '@/lib/data';
import { scroll } from '@/lib/scroll';

/** Hover / tap a city and the camera flies to it — no scroll-stepping. */
export default function Areas() {
  const [i, setI] = useState(0);
  const pick = (k) => { setI(k); scroll.activeArea = k; };
  const a = AREAS[i];
  return (
    <section className="areas stage" id="areas" data-stage="areas" aria-labelledby="areas-title">
      <div className="wrap">
        <div className="panel tone-dark glass" data-reveal>
          <p className="eyebrow">אזורי פעילות</p>
          <h2 id="areas-title" className="display h2">השרון, <em>רחוב אחר רחוב.</em></h2>
          <p className="area-hint">בחרו עיר כדי לראות אותה על המפה</p>
          <ul className="area-list">
            {AREAS.map((x, k) => (
              <li key={x.key}><button type="button" aria-pressed={k === i} onClick={() => pick(k)} onMouseEnter={() => pick(k)} onFocus={() => pick(k)}>{x.name}</button></li>
            ))}
          </ul>
          <p className="area-text" aria-live="polite"><b>{a.name}{a.hq ? ' · המשרד שלנו' : ''}</b>{a.text}</p>
        </div>
      </div>
    </section>
  );
}
