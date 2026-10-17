import type { Metadata } from 'next';

// The page itself is a client component (language toggle), so its metadata lives in this layout.
export const metadata: Metadata = {
  title: 'شروط الاستخدام',
  description: 'منصة إعلامية مرئية تنطلق من السويداء، تعنى بشؤون الشرق الاوسط والعالم',
  alternates: { canonical: '/terms' },
  openGraph: {
    title: 'شروط الاستخدام',
    description: 'منصة إعلامية مرئية تنطلق من السويداء، تعنى بشؤون الشرق الاوسط والعالم',
  },
  twitter: {
    title: 'شروط الاستخدام',
    description: 'منصة إعلامية مرئية تنطلق من السويداء، تعنى بشؤون الشرق الاوسط والعالم',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
