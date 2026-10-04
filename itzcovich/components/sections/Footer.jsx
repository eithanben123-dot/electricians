import { AGENCY, AREAS, SERVICES } from '@/lib/data';
import { Brand } from '../Header';
import { Phone, WhatsApp } from '../Icons';

export default function Footer({ legalBase = '' }) {
  return (
    <>
      <footer className="site-footer">
        <div className="wrap foot__grid">
          <div className="foot__brand">
            <Brand />
            <p>משרד תיווך נדל״ן ברעננה ובשרון: מכירה, השכרה, נדל״ן מסחרי וניהול נכסים — בליווי אישי של {AGENCY.founder}.</p>
          </div>
          <nav aria-label="ניווט בתחתית"><h3>ניווט</h3><a href="#properties">נכסים</a><a href="#featured">נכסים נבחרים</a><a href="#about">אודות</a><a href="#testimonials">לקוחות ממליצים</a><a href="#journal">מגזין</a><a href="#faq">שאלות נפוצות</a><a href="#contact">צור קשר</a></nav>
          <nav aria-label="שירותים"><h3>שירותים</h3>{SERVICES.map((s) => <a key={s.key} href="#services">{s.title}</a>)}</nav>
          <div className="foot__list"><h3>אזורים</h3>{AREAS.map((a) => <a key={a.key} href="#areas">{a.name}</a>)}</div>
        </div>
        <div className="wrap foot__legal">
          <span>© {new Date().getFullYear()} {AGENCY.name} · {AGENCY.address} · <a href={`tel:${AGENCY.phoneOffice.replace(/-/g, '')}`} className="ltr">{AGENCY.phoneOffice}</a></span>
          <span><a href={`${legalBase}privacy/`}>מדיניות פרטיות</a> · <a href={`${legalBase}accessibility/`}>הצהרת נגישות</a></span>
        </div>
      </footer>
      <a className="fab" href={`https://wa.me/${AGENCY.whatsapp}`} target="_blank" rel="noopener" aria-label="שליחת הודעה בוואטסאפ"><WhatsApp /></a>
      <div className="mbar">
        <a className="btn btn--dark" href="#properties">לצפייה בנכסים</a>
        <a className="icon-btn icon-btn--wa" href={`https://wa.me/${AGENCY.whatsapp}`} target="_blank" rel="noopener" aria-label="וואטסאפ"><WhatsApp /></a>
        <a className="icon-btn" href={`tel:${AGENCY.phoneOffice.replace(/-/g, '')}`} aria-label="התקשרות למשרד"><Phone /></a>
      </div>
    </>
  );
}
