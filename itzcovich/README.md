# איצקוביץ נכסים: אתר תדמית ונכסים

Next.js 15 (App Router, static export) · React Three Fiber · GSAP ScrollTrigger · Lenis.

```bash
npm install
npm run dev      # פיתוח
npm run build    # ייצוא סטטי לתיקייה out/
```

## תוכן
כל התוכן נמצא בקובץ אחד: `lib/data.js`.
- `AGENCY`: פרטי קשר, כתובת, וואטסאפ, קישורים.
- `LISTINGS`: נכסים אמיתיים מהאתר המקורי. כדי להוסיף נכס, מוסיפים אובייקט עם `id, deal, type, city, title, price?, rooms?, area?, url, featured?`.
  אם `price` חסר, האתר מציג "מחיר בפנייה".
- `SERVICES`, `AREAS`, `ABOUT`.

אין בקוד ביקורות, המלצות או סטטיסטיקות מומצאות. ההמלצות מקשרות לסרטון ולעמודי ההמלצות האמיתיים.

## טופס הערכת שווי
`components/sections/Sell.jsx`: הקבוע `LEAD_ENDPOINT` ריק כברירת מחדל. במצב הזה הטופס פותח וואטסאפ עם הפרטים.
אפשר להגדיר כתובת (Formspree, Make וכו') כדי לשלוח את הפרטים בבקשת POST.

## תלת־ממד
`components/three/`: כל הגיאומטריה פרוצדורלית (וילה, מגדל, מפת השרון) ואין קבצי מודלים.
המצלמה עוברת בין תחנות (`CameraRig.jsx`, ‏`STAGES`) לפי המקטעים שמסומנים ב־`data-stage`.
יש גיבוי SVG כשאין WebGL, ותמיכה ב־`prefers-reduced-motion`.
