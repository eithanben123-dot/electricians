import { AGENCY } from '@/lib/data';
import { Phone, WhatsApp, Mail, Pin, Facebook } from '../Icons';

export default function Contact() {
  const waze = `https://waze.com/ul?q=${encodeURIComponent(AGENCY.address)}&navigate=yes`;
  const maps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(AGENCY.address)}`;
  return (
    <section className="contact sheet" id="contact" aria-labelledby="contact-title">
      <div className="wrap contact__grid">
        <div data-reveal>
          <p className="eyebrow">צור קשר</p>
          <h2 id="contact-title" className="display h2">בואו נדבר <em>על הנכס הבא.</em></h2>
          <p className="lede">מחפשים, מוכרים, משכירים או רוצים שננהל עבורכם את הנכס — אנחנו כאן.</p>
          <div className="contact__big">
            <a href={`https://wa.me/${AGENCY.whatsapp}`} target="_blank" rel="noopener"><span>וואטסאפ</span><WhatsApp width="34" height="34" /></a>
            <a href={`tel:${AGENCY.phoneOffice.replace(/-/g, '')}`}><span className="ltr">{AGENCY.phoneOffice}</span><small>משרד</small></a>
            <a href={`tel:${AGENCY.phoneMobile.replace(/-/g, '')}`}><span className="ltr">{AGENCY.phoneMobile}</span><small>{AGENCY.founder}</small></a>
          </div>
        </div>
        <dl className="contact__info" data-reveal>
          <div><dt>כתובת המשרד</dt><dd>{AGENCY.address}</dd>
            <div className="contact__go"><a className="btn btn--line btn--sm" href={waze} target="_blank" rel="noopener"><Pin /><span>ניווט ב־Waze</span></a><a className="btn btn--line btn--sm" href={maps} target="_blank" rel="noopener"><span>Google Maps</span></a></div>
          </div>
          <div><dt>דוא״ל</dt><dd><a className="link" href={`mailto:${AGENCY.email}`}><Mail /><span className="ltr">{AGENCY.email}</span></a></dd></div>
          <div><dt>טלפון</dt><dd><a className="link" href={`tel:${AGENCY.phoneOffice.replace(/-/g, '')}`}><Phone /><span className="ltr">{AGENCY.phoneOffice}</span></a></dd></div>
          <div><dt>רשתות</dt><dd><a className="link" href={AGENCY.facebook} target="_blank" rel="noopener"><Facebook /><span>פייסבוק</span></a></dd></div>
        </dl>
      </div>
    </section>
  );
}
