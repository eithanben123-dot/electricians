import { AGENCY } from '@/lib/data';
export const metadata = { title: 'הצהרת נגישות — איצקוביץ נכסים', robots: { index: false } };
export default function Accessibility() {
  return (
    <main className="legal" id="main">
      <a className="link" href="../">→ חזרה לאתר</a>
      <h1>הצהרת נגישות</h1>
      <p className="muted">עדכון אחרון: אוקטובר 2026</p>
      <p>{AGENCY.name} פועלת להנגשת האתר לכלל הגולשים, בהתאם לתקנות שוויון זכויות לאנשים עם מוגבלות (התאמות נגישות לשירות), התשע״ג–2013, ולתקן הישראלי ת״י 5568 ברמה AA.</p>
      <h2>התאמות באתר</h2>
      <ul>
        <li>מבנה סמנטי, כותרות היררכיות וקישור לדילוג לתוכן.</li>
        <li>ניווט מלא במקלדת ומיקוד נראה לעין.</li>
        <li>ניגודיות גבוהה וטקסט על רקע אחיד גם מעל אלמנטים תלת־ממדיים.</li>
        <li>כיבוד הגדרת ״הפחתת תנועה״ — האנימציות מצטמצמות למינימום.</li>
        <li>חלופה סטטית כאשר הדפדפן אינו תומך בתלת־ממד.</li>
      </ul>
      <h2>פנייה בנושא נגישות</h2>
      <p>נתקלתם ברכיב שאינו נגיש? נשמח לשמוע: <span className="ltr">{AGENCY.phoneOffice}</span> · <a href={`mailto:${AGENCY.email}`}>{AGENCY.email}</a>.</p>
    </main>
  );
}
