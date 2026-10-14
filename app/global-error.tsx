'use client';

import React from 'react';
import { ScopeLogo } from '../components/ScopeLogo';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body className="min-h-screen bg-[#0a0f1d] text-slate-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="max-w-md w-full bg-[#121b2d] p-8 rounded-2xl border border-slate-800 shadow-sm flex flex-col items-center">
          <div className="flex justify-center mb-6">
            <ScopeLogo variant="white" className="h-10 sm:h-12 w-auto" />
          </div>

          <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            نعتذر عن هذا الخلل المؤقت في النظام. يمكنك محاولة إعادة التحميل.
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A42424] hover:bg-[#8B1E1E] text-white text-sm font-semibold rounded-full shadow-sm transition-colors cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
