import '@fontsource/rubik/hebrew-300.css';
import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-500.css';
import '@fontsource/rubik/latin-300.css';
import '@fontsource/rubik/latin-400.css';
import '@fontsource/rubik/latin-500.css';
import './globals.css';
import { AGENCY, LISTINGS, DEAL, TYPES } from '@/lib/data';

export const metadata = {
  metadataBase: new URL('https://www.gilitzcovich.com'),
  title: 'איצקוביץ נכסים — משרד תיווך נדל״ן ברעננה ובשרון',
  description: 'איצקוביץ נכסים: דירות למכירה ולהשכרה ברעננה ובשרון, נדל״ן מסחרי, ניהול נכסים ופרויקטים חדשים. ליווי אישי של גיל איצקוביץ, מתווך עם למעלה מ־20 שנות ניסיון.',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', locale: 'he_IL', siteName: AGENCY.name, title: 'איצקוביץ נכסים — נדל״ן ברעננה ובשרון', description: 'מכירה, השכרה, נדל״ן מסחרי וניהול נכסים בשרון.' },
  icons: { icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%231d1c1a'/%3E%3Ctext x='16' y='21' font-size='13' font-family='Georgia' fill='%23d3b47a' text-anchor='middle'%3EIP%3C/text%3E%3C/svg%3E" },
};
export const viewport = { themeColor: '#f6f1e8', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'RealEstateAgent',
      name: AGENCY.name, alternateName: AGENCY.nameEn, url: AGENCY.website, email: AGENCY.email,
      telephone: ['+972-9-7413300', '+972-52-2236767'],
      founder: { '@type': 'Person', name: AGENCY.founder },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: 5, reviewCount: 71 },
      address: { '@type': 'PostalAddress', streetAddress: 'התדהר 15, אזור התעשייה', addressLocality: 'רעננה', addressCountry: 'IL' },
      areaServed: ['רעננה', 'הרצליה', 'כפר סבא', 'הוד השרון', 'רמת השרון', 'נתניה'],
      sameAs: [AGENCY.facebook],
    },
    {
      '@type': 'ItemList', name: 'נכסים למכירה ולהשכרה',
      itemListElement: LISTINGS.map((l, i) => ({
        '@type': 'ListItem', position: i + 1,
        item: { '@type': 'Offer', name: `${l.title} — ${DEAL[l.deal]}`, url: l.url, category: TYPES[l.type], ...(l.price ? { price: l.price, priceCurrency: 'ILS' } : {}), areaServed: l.city },
      })),
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a className="skip" href="#main">דילוג לתוכן המרכזי</a>
        {children}
      </body>
    </html>
  );
}
