import type { Metadata } from 'next';

// The page itself is a client component (language toggle), so its metadata lives in this layout.
export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية في SCOPE MEDIA: البيانات التي نجمعها، وحماية المصادر الصحفية، وحقوق القارئ.',
  alternates: { canonical: '/privacy' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
