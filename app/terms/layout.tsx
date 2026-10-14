import type { Metadata } from 'next';

// The page itself is a client component (language toggle), so its metadata lives in this layout.
export const metadata: Metadata = {
  title: 'شروط الاستخدام',
  description: 'شروط استخدام منصة SCOPE MEDIA | سكوب ميديا وسياسة المحتوى وحقوق النشر.',
  alternates: { canonical: '/terms' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
