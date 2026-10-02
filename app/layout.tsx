import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../context/ThemeContext';

export const metadata: Metadata = {
  title: 'SCOPE MEDIA | سكوب ميديا',
  description: 'منصة إعلامية رقمية متكاملة - BEYOND THE HEADLINES - تغطيات حية، تحقيقات، وبرامج حصرية.',
  openGraph: {
    title: 'SCOPE MEDIA | سكوب ميديا',
    description: 'منصة إعلامية رقمية متكاملة - BEYOND THE HEADLINES - تغطيات حية، تحقيقات، وبرامج حصرية.',
    siteName: 'SCOPE MEDIA',
    locale: 'ar_AR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SCOPE MEDIA | سكوب ميديا',
    description: 'منصة إعلامية رقمية متكاملة - BEYOND THE HEADLINES - تغطيات حية، تحقيقات، وبرامج حصرية.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const stored = localStorage.getItem('scope_theme');
                if (stored === 'light') {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 antialiased selection:bg-[#dc2626] selection:text-white transition-colors duration-200">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
