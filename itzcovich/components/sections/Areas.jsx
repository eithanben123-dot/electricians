'use client';
import { useCallback, useRef, useState } from 'react';
import { AREAS } from '@/lib/data';
import { scroll } from '@/lib/scroll';
import { usePinSteps } from '../ScrollDirector';

export default function Areas() {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  usePinSteps(ref, AREAS.length, useCallback((k) => { setI(k); scroll.activeArea = k; }, []));
  const go = (k) => {
    const el = ref.current; if (!el) return;
    const top = el.getBoundingClientRect().top + scrollY, span = el.offsetHeight - innerHeight;
    const y = top + span * ((k + 0.5) / AREAS.length);
    window.__lenis ? window.__lenis.scrollTo(y, { duration: 1.4 }) : scrollTo(0, y);
  };
  const a = AREAS[i];
  return (
    <section ref={ref} className="areas pinned stage" id="areas" data-stage="areas" aria-labelledby="areas-title">
      <div className="pin">
        <div className="pin__grid">
          <div className="panel">
            <p className="eyebrow">אזורי פעילות</p>
            <h2 id="areas-title" className="display h2">השרון, <em>רחוב אחר רחוב.</em></h2>
            <ul className="area-list">
              {AREAS.map((x, k) => (
                <li key={x.key}><button type="button" aria-current={k === i} onClick={() => go(k)}>{x.name}</button></li>
              ))}
            </ul>
            <p className="area-text" aria-live="polite"><b>{a.name}{a.hq ? ' · המשרד שלנו' : ''}</b>{a.text}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
