import { AGENCY } from '@/lib/data';
import { Arrow } from '../Icons';

export default function Hero() {
  return (
    <section className="hero stage" id="top" data-stage="hero" aria-labelledby="hero-title">
      <div className="hero__inner">
        <div className="hero__copy tone-dark glass">
          <p className="eyebrow" data-reveal>{AGENCY.name} · {AGENCY.tagline}</p>
          <h1 id="hero-title" className="display h1" data-reveal>הבית הבא שלכם בשרון.<br /><em>מתחיל בהיכרות.</em></h1>
          <p className="lede" data-reveal>תיווך, ניהול נכסים ונדל״ן מסחרי ברעננה ובכל השרון — עם ניסיון של למעלה מ־20 שנה, דיוק של עולם ההייטק וליווי אישי מהצפייה הראשונה ועד החתימה.</p>
          <div className="hero__cta" data-reveal>
            <a className="btn btn--dark" href="#properties"><span>לצפייה בנכסים</span><Arrow /></a>
            <a className="btn btn--line" href="#sell"><span>הערכת שווי הנכס</span></a>
          </div>
          <div className="hero__meta" data-reveal>
            <span><b>20+</b>שנות ניסיון</span>
            <span><b>רעננה</b>והשרון</span>
            <span><b>מגורים · מסחרי</b>מכירה, השכרה וניהול</span>
          </div>
        </div>
      </div>
      <span className="hero__scroll" aria-hidden="true">גלילה<i /></span>
    </section>
  );
}
