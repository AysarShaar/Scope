import type { Metadata } from 'next';
import HomeClient from '../components/HomeClient';
import { getHomeBootstrap } from '../lib/server/home';

import { getSiteUrl } from '../lib/site';

// ISR: Revalidate every 120 seconds
export const revalidate = 120;

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  title: 'سكوب ميديا || SCOPE MEDIA',
  description: 'منصة سكوب ميديا (SCOPE MEDIA) الإعلامية الرقمية: تغطيات إخبارية حية، تحقيقات استقصائية معمقة، وبرامج حصرية على مدار الساعة.',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  openGraph: {
    title: 'سكوب ميديا || SCOPE MEDIA',
    description: 'منصة إعلامية رقمية متكاملة تقدم تغطيات ميدانية حية، ملفات استقصائية معمقة، وبرامج حصرية على مدار الساعة.',
    url: `${siteUrl}/`,
    siteName: 'سكوب ميديا || SCOPE MEDIA',
    locale: 'ar_AR',
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-default.png`,
        secureUrl: `${siteUrl}/og-default.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'شعار منصة سكوب ميديا الإعلامية الرقمية',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'سكوب ميديا || SCOPE MEDIA',
    description: 'منصة إعلامية رقمية متكاملة: تغطيات حية، تحقيقات استقصائية معمقة، وبرامج حصرية على مدار الساعة.',
    images: [
      {
        url: `${siteUrl}/og-default.png`,
        alt: 'شعار منصة سكوب ميديا الإعلامية الرقمية',
      },
    ],
  },
};

export default async function HomePage() {
  const initialData = await getHomeBootstrap().catch(() => null);
  return <HomeClient initialData={initialData} />;
}
