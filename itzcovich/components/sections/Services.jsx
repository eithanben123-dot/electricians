'use client';
import { useCallback, useRef, useState } from 'react';
import { SERVICES } from '@/lib/data';
import { usePinSteps } from '../ScrollDirector';

export default function Services() {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  usePinSteps(ref, SERVICES.length, useCallback((k) => setI(k), []));
  return (
    <section ref={ref} className="services pinned stage" id="services" data-stage="services" aria-labelledby="services-title">
      <div className="pin">
        <div className="pin__grid">
          <div className="panel">
            <p className="eyebrow">השירותים שלנו</p>
            <h2 id="services-title" className="display h2">כל מה שנכס <em>צריך.</em></h2>
            <ol className="svc">
              {SERVICES.map((s, k) => (
                <li key={s.key} className={k === i ? 'is-on' : ''}>
                  <div className="svc__t"><span className="ltr">{String(k + 1).padStart(2, '0')}</span>{s.title}</div>
                  <p className="svc__d">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
