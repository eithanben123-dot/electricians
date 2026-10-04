import { AGENCY } from '@/lib/data';
export const metadata = { title: 'מדיניות פרטיות — איצקוביץ נכסים', robots: { index: false } };
export default function Privacy() {
  return (
    <main className="legal" id="main">
      <a className="link" href="../">→ חזרה לאתר</a>
      <h1>מדיניות פרטיות</h1>
      <p className="muted">עדכון אחרון: אוקטובר 2026</p>
      <p>{AGENCY.name} מכבדת את פרטיותכם. מסמך זה מסביר אילו פרטים נאספים באתר ולאיזו מטרה.</p>
      <h2>אילו פרטים נאספים</h2>
      <p>פרטים שמסרתם בטופס הערכת השווי או בפנייה אלינו: שם, טלפון, מיקום וסוג הנכס ותוכן ההודעה.</p>
      <h2>שימוש בפרטים</h2>
      <p>הפרטים משמשים אך ורק לחזרה אליכם בנוגע לפנייה ולמתן השירות. איננו מוכרים או מעבירים מידע לצדדים שלישיים לצורכי שיווק.</p>
      <h2>אבטחה וזכויות</h2>
      <p>המידע נשמר בהתאם לחוק הגנת הפרטיות, התשמ״א–1981. ניתן לבקש לעיין במידע, לתקן או למחוק אותו בפנייה ל־<a href={`mailto:${AGENCY.email}`}>{AGENCY.email}</a> או בטלפון <span className="ltr">{AGENCY.phoneOffice}</span>.</p>
    </main>
  );
}
