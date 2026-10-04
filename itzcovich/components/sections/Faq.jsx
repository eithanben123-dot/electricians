import { FAQ, AGENCY } from '@/lib/data';
import { WhatsApp } from '../Icons';

export default function Faq() {
  const wa = `https://wa.me/${AGENCY.whatsapp}?text=${encodeURIComponent('שלום גיל, אני סוכן/ת תיווך עם רישיון ומעוניין/ת להצטרף לאיצקוביץ נכסים')}`;
  return (
    <section className="faq sheet sheet--paper" id="faq" aria-labelledby="faq-title">
      <div className="wrap faq__grid">
        <div data-reveal>
          <p className="eyebrow">שאלות נפוצות</p>
          <h2 id="faq-title" className="display h2">לפני שמתחילים, <em>כדאי לדעת.</em></h2>
        </div>
        <div className="faq__list" data-reveal>
          {FAQ.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <div className="faq__a">{f.a.map((p) => <p key={p.slice(0, 24)}>{p}</p>)}</div>
            </details>
          ))}
          <aside className="join">
            <p className="join__k">המשרד גדל ומגייס</p>
            <p>סוכני/ות תיווך עם ניסיון ורישיון — מומחים בתחום הנדל״ן, מלאי אמביציה. התנאים הכי טובים בתחום. וגם: זכיינות לסניף ברשת איצקוביץ נכסים.</p>
            <a className="link" href={wa} target="_blank" rel="noopener"><WhatsApp /> לפרטים ולהגשת מועמדות</a>
          </aside>
        </div>
      </div>
    </section>
  );
}
