import { ABOUT, AGENCY } from '@/lib/data';

export default function About() {
  return (
    <section className="about pinned stage" id="about" data-stage="about" aria-labelledby="about-title">
      <div className="pin">
        <div className="pin__grid">
          <div className="panel">
            <p className="eyebrow">אודות המשרד</p>
            <h2 id="about-title" className="display h2">נדל״ן, <em>בגישה של הייטק.</em></h2>
            <p className="lede">{ABOUT.lead}</p>
            <p className="about__promise">{ABOUT.promise}</p>
            <ul className="about__points">
              {ABOUT.points.map((p) => <li key={p.k}><b>{p.k}</b><span>{p.t}</span></li>)}
            </ul>
            <p className="signature">{AGENCY.founder}<small>מייסד {AGENCY.name}</small></p>
          </div>
        </div>
      </div>
    </section>
  );
}
