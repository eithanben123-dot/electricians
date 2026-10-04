'use client';
import { AGENCY } from '@/lib/data';
import { Play, External, Facebook } from '../Icons';

/** Real office video on YouTube — opens on YouTube, nothing third-party loads until clicked (thumbnail aside). */
export default function Testimonials() {
  const v = AGENCY.testimonialVideo;
  return (
    <section className="voices sheet sheet--teal tone-dark" id="testimonials" aria-labelledby="voices-title">
      <div className="wrap voices__grid">
        <div className="video img-reveal">
          <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          <a className="video__btn" href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener" aria-label={`צפייה בסרטון ביוטיוב: ${v.title}`}><span><Play /></span></a>
          <span className="video__cap">{v.title}</span>
        </div>
        <div data-reveal>
          <p className="eyebrow">לקוחות ממליצים</p>
          <h2 id="voices-title" className="display h2">הלקוחות שלנו <em>מספרים.</em></h2>
          <a className="gscore" href={AGENCY.google.url} target="_blank" rel="noopener" aria-label={`דירוג ${AGENCY.google.rating} מתוך 5 בגוגל, ${AGENCY.google.count} ביקורות`}>
            <b className="ltr">{AGENCY.google.rating.toFixed(1)}</b>
            <span><i aria-hidden="true">★★★★★</i>{AGENCY.google.count} ביקורות בגוגל</span>
          </a>
          <p className="lede">לקוחות המשרד מספרים על ליווי אישי, זמינות ומקצועיות לאורך כל הדרך. את ההמלצות המלאות — במילים של הלקוחות עצמם — אפשר לקרוא כאן:</p>
          <div className="voices__links">
            <a className="link" href={AGENCY.google.url} target="_blank" rel="noopener">כל הביקורות בגוגל <External /></a>
            <a className="link" href={AGENCY.testimonialsPage} target="_blank" rel="noopener">עמוד ההמלצות באתר המשרד <External /></a>
            <a className="link" href={AGENCY.reviewsProfile} target="_blank" rel="noopener">המלצות על גיל איצקוביץ באתר ״המלצה״ <External /></a>
            <a className="link" href={AGENCY.facebook} target="_blank" rel="noopener"><Facebook /> הדף שלנו בפייסבוק</a>
          </div>
        </div>
      </div>
    </section>
  );
}
