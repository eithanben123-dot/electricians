import { JOURNAL, AGENCY } from '@/lib/data';
import PropertyArt from '../PropertyArt';
import { Arrow } from '../Icons';

/** Articles from the office site ("עיתונאות") — editorial index with line drawings. */
export default function Journal() {
  return (
    <section className="journal sheet" id="journal" aria-labelledby="journal-title">
      <div className="wrap">
        <header className="journal__head" data-reveal>
          <p className="eyebrow">מגזין הנדל״ן</p>
          <h2 id="journal-title" className="display h2">ידע מקומי, <em>מהשטח.</em></h2>
        </header>
        <ul className="journal__grid">
          {JOURNAL.map((j) => (
            <li key={j.title} data-reveal>
              <a href={AGENCY.website} target="_blank" rel="noopener" className="jcard">
                <PropertyArt type={j.type} className="jcard__art" />
                <h3>{j.title}</h3>
                <p>{j.text}</p>
                <span className="jcard__more">לכתבה <Arrow /></span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
