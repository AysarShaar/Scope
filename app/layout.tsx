import type { Metadata } from 'next';
import { Cairo, Alexandria, IBM_Plex_Sans_Arabic, Amiri } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';
import { LanguageProvider } from '../context/LanguageContext';
import { safeJsonLd } from '../lib/safeJsonLd';
import { getSiteUrl } from '../lib/site';
import { FACEBOOK_URL, INSTAGRAM_URL } from '../lib/socialLinks';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
});

const alexandria = Alexandria({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-alexandria',
  display: 'swap',
});

const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SCOPE MEDIA | سكوب ميديا - ما وراء العناوين',
    template: '%s | SCOPE MEDIA',
  },
  description: 'منصة إعلامية رقمية متكاملة - BEYOND THE HEADLINES - تغطيات حية، تحقيقات استقصائية، وبرامج حصرية على مدار الساعة.',
  keywords: [
    'سكوب ميديا',
    'SCOPE MEDIA',
    'أخبار عاجلة',
    'تحقيقات استقصائية',
    'اقتصاد وأعمال',
    'الشرق الأوسط',
    'تقارير حصرية',
    'ما وراء العناوين',
  ],
  // No site-wide canonical here: a canonical set in the root layout is inherited by every page that
  // doesn't override it, which would tell Google that /category/*, /programs, ... all duplicate the home page.
  applicationName: 'سكوب ميديا Scope Media',
  formatDetection: { telephone: false, email: false, address: false },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  openGraph: {
    title: 'SCOPE MEDIA | سكوب ميديا - ما وراء العناوين',
    description: 'منصة إعلامية رقمية متكاملة - BEYOND THE HEADLINES - تغطيات حية، تحقيقات استقصائية، وبرامج حصرية على مدار الساعة.',
    url: siteUrl,
    siteName: 'سكوب ميديا Scope Media',
    locale: 'ar_AR',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'SCOPE MEDIA | سكوب ميديا',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SCOPE MEDIA | سكوب ميديا - ما وراء العناوين',
    description: 'منصة إعلامية رقمية متكاملة - BEYOND THE HEADLINES - تغطيات حية، تحقيقات استقصائية، وبرامج حصرية على مدار الساعة.',
    images: ['/og-default.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.svg',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} ${alexandria.variable} ${ibmPlexArabic.variable} ${amiri.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                localStorage.removeItem('scope_theme');
                document.documentElement.classList.remove('dark');
                const storedLang = localStorage.getItem('scope_lang');
                if (storedLang === 'EN') {
                  document.cookie = 'googtrans=/ar/en; path=/;';
                  document.documentElement.setAttribute('lang', 'en');
                  document.documentElement.setAttribute('dir', 'ltr');
                } else {
                  document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                  document.documentElement.setAttribute('lang', 'ar');
                  document.documentElement.setAttribute('dir', 'rtl');
                }
              } catch(e) {}
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'NewsMediaOrganization',
                  '@id': `${siteUrl}/#organization`,
                  name: 'SCOPE MEDIA | سكوب ميديا',
                  alternateName: 'سكوب ميديا',
                  url: siteUrl,
                  logo: {
                    '@type': 'ImageObject',
                    url: `${siteUrl}/logo-512.png`,
                    width: 512,
                    height: 512,
                  },
                  sameAs: [
                    'https://x.com/scopemedia',
                    FACEBOOK_URL,
                    INSTAGRAM_URL,
                    'https://youtube.com/@scopemedia',
                  ],
                },
                {
                  '@type': 'WebSite',
                  '@id': `${siteUrl}/#website`,
                  url: siteUrl,
                  name: 'سكوب ميديا Scope Media',
                  alternateName: ['سكوب ميديا', 'Scope Media', 'SCOPE MEDIA'],
                  inLanguage: 'ar',
                  publisher: {
                    '@id': `${siteUrl}/#organization`,
                  },
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: `${siteUrl}/search?q={search_term_string}`,
                    'query-input': 'required name=search_term_string',
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0e17] text-slate-900 dark:text-slate-100 antialiased selection:bg-[#A42424] selection:text-white transition-colors duration-200 overflow-x-clip w-full max-w-[100vw]">
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
