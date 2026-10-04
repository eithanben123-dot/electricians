'use client';
import { useState } from 'react';
import { AGENCY } from '@/lib/data';
import { Play, External, Facebook } from '../Icons';

/** Real client testimonial video (YouTube), loaded only when the visitor presses play. */
export default function Testimonials() {
  const [play, setPlay] = useState(false);
  const v = AGENCY.testimonialVideo;
  return (
    <section className="voices sheet sheet--paper" id="testimonials" aria-labelledby="voices-title">
      <div className="wrap voices__grid">
        <div className="video img-reveal">
          {play ? (
            <iframe src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0`} title={v.title} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          ) : (
            <>
              <img src={`https://i.ytimg.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              <button className="video__btn" type="button" onClick={() => setPlay(true)} aria-label={`הפעלת הסרטון: ${v.title}`}><span><Play /></span></button>
              <span className="video__cap">{v.title}</span>
            </>
          )}
        </div>
        <div data-reveal>
          <p className="eyebrow">לקוחות ממליצים</p>
          <h2 id="voices-title" className="display h2">הלקוחות שלנו <em>מספרים.</em></h2>
          <p className="lede">לקוחות המשרד מספרים על ליווי אישי, זמינות ומקצועיות לאורך כל הדרך. את ההמלצות המלאות — במילים של הלקוחות עצמם — אפשר לקרוא כאן:</p>
          <div className="voices__links">
            <a className="link" href={AGENCY.testimonialsPage} target="_blank" rel="noopener">עמוד ההמלצות באתר המשרד <External /></a>
            <a className="link" href={AGENCY.reviewsProfile} target="_blank" rel="noopener">המלצות על גיל איצקוביץ באתר ״המלצה״ <External /></a>
            <a className="link" href={AGENCY.facebook} target="_blank" rel="noopener"><Facebook /> הדף שלנו בפייסבוק</a>
          </div>
        </div>
      </div>
    </section>
  );
}
