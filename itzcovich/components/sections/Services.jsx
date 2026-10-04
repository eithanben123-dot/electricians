import { SERVICES } from '@/lib/data';

export default function Services() {
  return (
    <section className="services stage" id="services" data-stage="services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="panel panel--wide" data-reveal>
          <p className="eyebrow">השירותים שלנו</p>
          <h2 id="services-title" className="display h2">כל מה שנכס <em>צריך.</em></h2>
          <ol className="svc">
            {SERVICES.map((s, k) => (
              <li key={s.key}>
                <div className="svc__t"><span className="ltr">{String(k + 1).padStart(2, '0')}</span>{s.title}</div>
                <p className="svc__d">{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
