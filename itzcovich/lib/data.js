/**
 * lib/data.js — single source of content.
 *
 * Everything here comes from the agency's public website (gilitzcovich.com) as
 * indexed by search engines in October 2026. Listings keep a link to their
 * original page. Availability changes: edit this file to add / remove listings.
 * `price` is null when the original page did not publish one.
 */

const site = 'https://www.gilitzcovich.com';
const u = (slug) => `${site}/product/${encodeURIComponent(slug)}/`;

export const AGENCY = {
  name: 'איצקוביץ נכסים',
  nameEn: 'Itzcovich Properties',
  founder: 'גיל איצקוביץ',
  tagline: 'תיווך ויזמות',
  city: 'רעננה',
  address: 'התדהר 15, א.ת. רעננה',
  phoneOffice: '09-7413300',
  phoneMobile: '052-2236767',
  whatsapp: '972522236767',                  // ⚠ assumes the mobile number is on WhatsApp — confirm
  email: 'gilitzcovich@gmail.com',
  website: site,
  facebook: 'https://www.facebook.com/itzcovich',
  testimonialsPage: `${site}/%D7%9C%D7%A7%D7%95%D7%97%D7%95%D7%AA-%D7%9E%D7%9E%D7%9C%D7%99%D7%A6%D7%99%D7%9D/`,
  testimonialVideo: { id: 'gAzAIgAXLNE', title: 'איצקוביץ נכסים רעננה — סרטון תדמית' },
  google: { rating: 5, count: 71, url: 'https://www.google.com/search?q=%D7%90%D7%99%D7%A6%D7%A7%D7%95%D7%91%D7%99%D7%A5+%D7%A0%D7%9B%D7%A1%D7%99%D7%9D+%D7%A8%D7%A2%D7%A0%D7%A0%D7%94' },
  reviewsProfile: 'https://www.hamlatza.co.il/gilitzcovich',
  geo: { lat: 32.1887, lng: 34.8792 },
};

export const DEAL = { sale: 'למכירה', rent: 'להשכרה' };
export const TYPES = {
  apartment: 'דירה',
  garden: 'דירת גן',
  duplex: 'דופלקס',
  unit: 'יחידת דיור',
  shop: 'חנות / מסחרי',
  office: 'משרדים',
  industrial: 'מבנה תעשייה',
};

export const LISTINGS = [
  // ——— sale ———
  { id: 'garden-new', deal: 'sale', type: 'garden', city: 'רעננה', title: 'דירת גן חדשה ברעננה', area: null, rooms: null, sqm: null, price: 6465000, notes: 'דירת גן חדשה', url: u('למכירה-ברעננה-דירת-גן-חדשה'), featured: true },
  { id: 'n2005', deal: 'sale', type: 'apartment', city: 'רעננה', title: 'דירה בשכונת 2005', area: 'שכונת 2005', rooms: 4, sqm: null, price: 5200000, notes: null, url: u('למכירה-בשכונת-2005-ברעננה'), featured: true },
  { id: 'naot-sade', deal: 'sale', type: 'apartment', city: 'רעננה', title: 'דירה בנאות שדה', area: 'נאות שדה', rooms: 4, sqm: null, price: 3600000, notes: null, url: u('למכירה-בנאות-שדה-רעננה'), featured: true },
  { id: 'lev-hapark', deal: 'sale', type: 'apartment', city: 'רעננה', title: '4.5 חדרים בלב הפארק', area: 'לב הפארק', rooms: 4.5, sqm: null, price: 3295000, notes: null, url: u('למכירה-4-5-חדרים-ברעננה-בשכונת-לב-הפארק') },
  { id: 'galil', deal: 'sale', type: 'apartment', city: 'רעננה', title: 'דירה בגליל', area: 'רחוב הגליל', rooms: 4, sqm: null, price: 2750000, notes: null, url: u('למכירה-בגליל-רעננה') },
  { id: 'galil-ex', deal: 'sale', type: 'apartment', city: 'רעננה', title: 'דירה ברחוב הגליל', area: 'רחוב הגליל', rooms: 4, sqm: null, price: null, notes: 'בבלעדיות', url: u('למכירה-דירה-ברחוב-הגליל-ברעננה') },
  { id: 'klausner', deal: 'sale', type: 'apartment', city: 'רעננה', title: '5 חדרים ברחוב קלאוזנר', area: 'רחוב קלאוזנר', rooms: 5, sqm: null, price: null, notes: null, url: u('למכירה-5-חדרים-ברעננה-רחוב-קלאוזנר') },
  { id: 'akiva', deal: 'sale', type: 'apartment', city: 'רעננה', title: 'דירה ברחוב עקיבא', area: 'רחוב עקיבא', rooms: 4, sqm: null, price: null, notes: 'משופצת', url: u('למכירה-ברחוב-עקיבא-ברעננה') },
  { id: 'ehud-manor', deal: 'sale', type: 'duplex', city: 'רעננה', title: 'דופלקס באהוד מנור', area: 'רחוב אהוד מנור', rooms: null, sqm: null, price: null, notes: null, url: u('דופלקס-למכירה-באהוד-מנור-רעננה') },
  { id: 'hod-hasharon', deal: 'sale', type: 'apartment', city: 'הוד השרון', title: 'נכס למכירה בהוד השרון', area: null, rooms: null, sqm: null, price: null, notes: null, url: u('למכירה-בחומש-הוד-השרון') },
  { id: 'industrial-sale', deal: 'sale', type: 'industrial', city: 'רעננה', title: 'מבנה תעשייתי ברעננה', area: 'אזור התעשייה', rooms: null, sqm: null, price: null, notes: null, url: u('למכירה-מבנה-תעשייתי-ברעננה') },
  // ——— rent ———
  { id: 'neve-zemer', deal: 'rent', type: 'apartment', city: 'רעננה', title: '4 חדרים בנווה זמר', area: 'נווה זמר', rooms: 4, sqm: null, price: 8000, notes: 'מעלית · חניה · ממ״ד', url: u('ארבעה-חדרים-להשכרה-בנווה-זמר'), featured: true },
  { id: 'hayovel', deal: 'rent', type: 'apartment', city: 'רעננה', title: '5 חדרים ברחוב היובל', area: 'רחוב היובל', rooms: 5, sqm: 130, price: 7900, notes: null, url: u('להשכרה-ברחוב-היובל-רעננה') },
  { id: 'villa-unit', deal: 'rent', type: 'unit', city: 'רעננה', title: 'יחידת דיור בווילה', area: null, rooms: null, sqm: null, price: 3500, notes: 'כולל ארנונה ומים', url: u('להשכרה-יחידת-דיור-בוילה-ברעננה') },
  { id: 'offices-5', deal: 'rent', type: 'office', city: 'רעננה', title: 'מתחם 5 משרדים', area: null, rooms: null, sqm: null, price: null, notes: null, url: u('להשכרה-מתחם-5-משרדים-ברעננה') },
  { id: 'shop', deal: 'rent', type: 'shop', city: 'רעננה', title: 'חנות באזור התעשייה', area: 'אזור התעשייה', rooms: null, sqm: 70, price: null, notes: 'כולל חניה צמודה', url: u('להשכרה-חנות-ברעננה') },
  { id: 'commercial-45', deal: 'rent', type: 'shop', city: 'רעננה', title: 'שטח מסחרי לכל מטרה', area: null, rooms: null, sqm: 45, price: null, notes: 'כולל גלריה וכניסה נפרדת', url: u('להשכרה-שטח-מסחרי-לכל-מטרה-ברעננה') },
  { id: 'industrial-rent', deal: 'rent', type: 'industrial', city: 'רעננה', title: 'מבנה תעשייה, קומה 2', area: 'אזור התעשייה', rooms: null, sqm: 70, price: null, notes: '64 ₪ למ״ר · לכל מטרה', url: u('מבנה-תעשייה-ברעננה-להשכרה') },
  { id: 'shop-industrial', deal: 'rent', type: 'industrial', city: 'רעננה', title: 'חנות במבנה תעשייה', area: null, rooms: null, sqm: null, price: null, notes: null, url: u('חנות-מבנה-תעשייה-להשכרה') },
];

export const SERVICES = [
  { key: 'brokerage', title: 'תיווך מכירה והשכרה', text: 'דירות, דירות גן, פנטהאוזים, קוטג׳ים ובתים למכירה ולהשכרה ברעננה ובכל השרון — מהתאמה מדויקת ועד חתימה.' },
  { key: 'commercial', title: 'נדל״ן מסחרי ומשרדים', text: 'משרדים, חנויות, אולמות, מבני תעשייה וחניונים — מגוון רחב באזור התעשייה רעננה ובשרון.' },
  { key: 'management', title: 'ניהול נכסים', text: 'ניהול מקצועי ואחראי גם לתושבי חוץ — שמקבלים את הטיפול והמסור של איצקוביץ נכסים, למרות הריחוק הפיזי מהנכס.' },
  { key: 'new', title: 'שיווק פרויקטים לקבלנים', text: 'שיווק דירות חדשות בבניינים חדשים ובתמ״א 38, התחדשות עירונית ופינוי־בינוי, לצד יזמים וקבלנים.' },
  { key: 'invest', title: 'ייעוץ השקעות נדל״ן', text: 'קרקעות ומגרשים להשקעה, נדל״ן בחו״ל וקבוצות רכישה — עם אסטרטגיית השקעה ותוכנית תשלומים ברורה.' },
  { key: 'mortgage', title: 'ייעוץ משכנתאות', text: 'משכנתא היא החלטה לטווח ארוך. נלווה אתכם עד ההלוואה הנוחה ביותר בשוק — ברעננה, בכפר סבא, בהרצליה ובכל השרון.' },
  { key: 'valuation', title: 'הערכת שווי נכס', text: 'אומדן שווי שוק לכל סוגי הנכסים, על בסיס עסקאות אמיתיות באזור — לפני שמחליטים למכור או להשכיר.' },
];

/* map positions: real lat / lng */
export const AREAS = [
  { key: 'raanana', name: 'רעננה', lat: 32.184, lng: 34.871, hq: true, text: 'הבית של המשרד. עיר ירוקה ומבוקשת, עם שכונות כמו נווה זמר, לב הפארק ונאות שדה, ומע״ר מתפתח לעסקים.' },
  { key: 'herzliya', name: 'הרצליה', lat: 32.165, lng: 34.844, text: 'בין הים להייטק — מהרצליה פיתוח ועד שכונות המגורים הוותיקות.' },
  { key: 'kfar-saba', name: 'כפר סבא', lat: 32.175, lng: 34.907, text: 'עיר משפחתית ומבוססת, עם ביקוש עקבי לדירות גדולות ולבתים צמודי קרקע.' },
  { key: 'hod-hasharon', name: 'הוד השרון', lat: 32.15, lng: 34.889, text: 'שכונות ירוקות ושקטות, צמודי קרקע ופרויקטים חדשים.' },
  { key: 'ramat-hasharon', name: 'רמת השרון', lat: 32.146, lng: 34.839, text: 'יוקרה שקטה בקצה המטרופולין — וילות, דירות גן וניהול נכסים מושכרים.' },
  { key: 'netanya', name: 'נתניה', lat: 32.321, lng: 34.853, text: 'קו חוף, מגדלי מגורים ופנטהאוזים מול הים — ומגרשים להשקעה בעיר המתפתחת ביותר בשרון.' },
  { key: 'petah-tikva', name: 'פתח תקווה', lat: 32.087, lng: 34.887, text: 'עיר מורכבת ומאתגרת עם היצע עצום — מגורים, משרדים ומגדלי עסקים. מתווך שמכיר אותה חוסך זמן וטעויות.' },
  { key: 'rosh-haayin', name: 'ראש העין', lat: 32.095, lng: 34.957, text: 'שכונות חדשות, משפחות צעירות ופרויקטים בבנייה — הזדמנויות לרוכשים ולמשקיעים.' },
];

export const ABOUT = {
  lead: 'חברת איצקוביץ נכסים נוסדה על ידי מתווך מומלץ — גיל איצקוביץ. גיל עבד בעבר בתחום ההייטק ומביא את יתרונותיו דרך השילוב של הייטק ונדל״ן.',
  promise: 'אנו רואים את הלקוח כערך עליון. זו הסיבה שאצלנו ניתן לבטל טופס בלעדיות בכל זמן נתון.',
  points: [
    { k: '5.0★', t: 'דירוג בגוגל, על בסיס 71 ביקורות של לקוחות' },
    { k: '2023', t: 'גיל נבחר שוב לכהן כיו״ר שיווק ויחסי ציבור ואחראי MLS בלשכת המתווכים, מחוז השרון' },
    { k: 'AI', t: 'הכשרת בינה מלאכותית לקידום עסקי (40 שעות אקדמיות, 2024) — טכנולוגיה בשירות התיווך' },
  ],
};

/* "למה לבחור בנו" — first answer is the office's own; others summarise its stated approach */
export const FAQ = [
  { q: 'למה לבחור דווקא בכם כדי למכור את הדירה שלי?', a: ['איצקוביץ נכסים הוא משרד תיווך מנוסה ומוביל באזור השרון, עם יכולות בולטות בשלושה תחומים:', 'טכנולוגיה — אנו משתמשים בטכנולוגיות מתקדמות לשיווק ולהגעה ללקוחות הפוטנציאליים, יודעים לסנן פניות לא רלוונטיות, וכל זה מאפשר לנו להגיע לתוצאות מצוינות עבור לקוחותינו.', 'פרסום — אנו מפרסמים בהרבה מאוד אמצעים ודרכי פרסום, יכולת שמעמידה כל נכס שלנו בפרונט הפרסומי אל מול המתחרים.', 'מקצוענות הסוכנים — אנו אנשי נדל״ן מקצועיים ששולטים ברזי תהליך מכירה או קנייה איכותי, ובעיקר יודעים לפתור בעיות כדי להגיע להשגת המטרה.'] },
  { q: 'אני מחפש לרכוש דירה בשרון, איך תוכלו לעזור לי?', a: ['נתחיל בשיחת היכרות קצרה: תקציב, אזורים, גודל, לוחות זמנים ומה באמת חשוב לכם. משם נציג רק נכסים שמתאימים — גם כאלה שעדיין לא פורסמו — נלווה לסיורים, נבדוק את הנכס ואת המחיר מול עסקאות באזור, ונעמוד לצדכם במשא ומתן ועד החתימה.'] },
  { q: 'מה אתם כמתווכים יכולים לעשות עבורי שאני לא יכול לעשות בכוחות עצמי במכירת דירה?', a: ['תמחור נכון מהיום הראשון, חשיפה רחבה למאגר קונים פעיל, סינון פניות לא רציניות, הצגת הנכס במיטבו, ניהול משא ומתן מקצועי ותיאום מול עורכי הדין והבנקים. התוצאה: פחות זמן על השוק, פחות כאב ראש — ובדרך כלל גם מחיר טוב יותר.'] },
  { q: 'למה שאתן לכם בלעדיות?', a: ['בלעדיות מאפשרת לנו להשקיע בנכס שלכם באמת — צילום, פרסום רחב ושיווק ממוקד — ולהציג מחיר אחיד ומקצועי מול השוק. ובגלל שאנו רואים את הלקוח כערך עליון, אצלנו ניתן לבטל את טופס הבלעדיות בכל זמן נתון.'] },
  { q: 'מהם סוגי הנדל״ן במשרד איצקוביץ נכסים?', a: ['דירות, דירות גן, פנטהאוזים ומיני־פנטהאוזים, דירות גג, קוטג׳ים ובתים, מגרשים וקרקעות להשקעה, משרדים, חנויות, אולמות, מבני תעשייה וחניונים — למכירה ולהשכרה, וגם דירות חדשות מקבלן.'] },
  { q: 'איך ניתן ליצור איתנו קשר?', a: ['בוואטסאפ או בטלפון 052-2236767, במשרד 09-7413300, או בביקור במשרד ברחוב התדהר 15, אזור התעשייה רעננה. אפשר גם להשאיר פרטים בטופס באתר ונחזור אליכם.'] },
];

/* articles published on the office site ("עיתונאות") — titles and summaries from the site */
export const JOURNAL = [
  { type: 'duplex', title: 'דירה למכירה — דופלקס גג ייחודי ברמ״ם', text: 'דופלקס גג ייחודי למכירה ברעננה, ברובע רמ״ם.' },
  { type: 'office', title: 'משרדי יוקרה להשכרה במגדל', text: 'מחפשים משרד להשכרה? מגדל אליהו יצחקי — משרדים שיזניקו את העסק שלכם לשלב הבא, עם תשתית שמספקת את הסביבה.' },
  { type: 'apartment', title: 'דירה חדשה ברעננה', text: 'פרויקט חדש ברחוב קציץ במזרח רעננה — דירות מרווחות במיקום פסטורלי, גובל בבתים פרטיים.' },
  { type: 'apartment', title: 'השכרת דירה בשרון', text: 'מיקום אסטרטגי במרכז הארץ, קרוב לתל אביב, נתניה והמרכז; גישה נוחה לעבודה, לימודים ופנאי. כל מה שכדאי לדעת לפני שמשכירים.' },
  { type: 'industrial', title: 'אדמה חקלאית להשקעה בכפר סבא', text: 'פרויקט בן יהודה בצפון כפר סבא — קרקע ייחודית להשקעה ברובע המגורים העתידי.' },
  { type: 'garden', title: 'מגרשים להשקעה בנתניה ובאשדוד', text: 'מגרשים למכירה בערים המתפתחות והמבוקשות בישראל, עם ביקוש גדול מצד משקיעים, מהגרים ותיירים.' },
  { type: 'shop', title: 'חניונים וחנויות — מכירה והשכרה', text: 'הביקוש לחניונים ולחנויות בערים הגדולות עלה בשנים האחרונות. כך עושים את זה נכון, עם משרד שמבין.' },
  { type: 'apartment', title: 'תיווך בפתח תקווה', text: 'עיר מורכבת ומאתגרת לחיפוש הנכס המתאים — מתווכים מקומיים יחסכו לכם זמן ויעזרו להצליח במשימה.' },
];

export const fmtPrice = (l) => (l.price == null ? null : `₪${l.price.toLocaleString('en-US')}${l.deal === 'rent' ? ' לחודש' : ''}`);
