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
  tagline: 'תיווך נדל״ן בשרון',
  city: 'רעננה',
  address: 'התדהר 15, רעננה',                 // ⚠ also listed as "התעשייה 11" on one directory — confirm
  phoneOffice: '09-7413300',
  phoneMobile: '052-2236767',
  whatsapp: '972522236767',                  // ⚠ assumes the mobile number is on WhatsApp — confirm
  email: 'gilitzcovich@gmail.com',
  website: site,
  facebook: 'https://www.facebook.com/itzcovich',
  testimonialsPage: `${site}/%D7%9C%D7%A7%D7%95%D7%97%D7%95%D7%AA-%D7%9E%D7%9E%D7%9C%D7%99%D7%A6%D7%99%D7%9D/`,
  testimonialVideo: { id: 'gAzAIgAXLNE', title: 'עוד לקוחה מרוצה של איצקוביץ נכסים' },
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
  { key: 'brokerage', title: 'תיווך מכירה והשכרה', text: 'דירות, דירות גן, דופלקסים ובתים למכירה ולהשכרה ברעננה ובשרון — מהתאמה מדויקת ועד חתימה.' },
  { key: 'commercial', title: 'נדל״ן מסחרי והשקעות', text: 'משרדים, חנויות, מבני תעשייה וקרקעות ברעננה ובאזור השרון — לעסקים ולמשקיעים.' },
  { key: 'management', title: 'ניהול נכסים', text: 'ניהול השכרה מלא: השכרה לטווח ארוך וקצר, דירות נופש ותיירות ודירות כשרות.' },
  { key: 'new', title: 'דירות חדשות ופרויקטים', text: 'דירות חדשות ופרויקטים בשרון, כולל תמ״א 38 וליווי קבלנים ויזמים.' },
  { key: 'valuation', title: 'הערכת מחיר שוק', text: 'בדיקת מחיר שוק לנכס שלך על בסיס עסקאות באזור — לפני שמחליטים למכור או להשכיר.' },
];

/* map positions: real lat / lng */
export const AREAS = [
  { key: 'raanana', name: 'רעננה', lat: 32.184, lng: 34.871, hq: true, text: 'הבית של המשרד. עיר ירוקה ומבוקשת, עם שכונות כמו נווה זמר, לב הפארק ונאות שדה, ומע״ר מתפתח לעסקים.' },
  { key: 'herzliya', name: 'הרצליה', lat: 32.165, lng: 34.844, text: 'בין הים להייטק — מהרצליה פיתוח ועד שכונות המגורים הוותיקות.' },
  { key: 'kfar-saba', name: 'כפר סבא', lat: 32.175, lng: 34.907, text: 'עיר משפחתית ומבוססת, עם ביקוש עקבי לדירות גדולות ולבתים צמודי קרקע.' },
  { key: 'hod-hasharon', name: 'הוד השרון', lat: 32.15, lng: 34.889, text: 'שכונות ירוקות ושקטות, צמודי קרקע ופרויקטים חדשים.' },
  { key: 'ramat-hasharon', name: 'רמת השרון', lat: 32.146, lng: 34.839, text: 'יוקרה שקטה בקצה המטרופולין — וילות, דירות גן וניהול נכסים מושכרים.' },
  { key: 'netanya', name: 'נתניה', lat: 32.321, lng: 34.853, text: 'קו חוף, מגדלי מגורים ופנטהאוזים מול הים.' },
];

export const ABOUT = {
  lead: 'איצקוביץ נכסים נוסדה על ידי גיל איצקוביץ, מתווך נדל״ן ותיק שהגיע לנדל״ן מעולם ההייטק — ומביא איתו את השילוב בין טכנולוגיה, נתונים ושירות אישי.',
  points: [
    { k: '20+', t: 'שנות ניסיון בשוק הנדל״ן של רעננה' },
    { k: 'השרון', t: 'מגורים, מסחרי, קרקעות וניהול נכסים — במקום אחד' },
    { k: '2023', t: 'גיל נבחר ליו״ר שיווק ויחסי ציבור בלשכת מתווכי הנדל״ן, מחוז השרון' },
  ],
};

export const fmtPrice = (l) => (l.price == null ? null : `₪${l.price.toLocaleString('en-US')}${l.deal === 'rent' ? ' לחודש' : ''}`);
