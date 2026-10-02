'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-[#121b2d] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
        <div className="flex flex-col items-center mb-6">
          <span className="font-black text-3xl tracking-tighter text-[#0a1a30] dark:text-white uppercase leading-none">
            SCOPE
          </span>
          <div className="flex items-center gap-1 w-full justify-center mt-1">
            <span className="w-2.5 h-[1.5px] bg-[#dc2626]"></span>
            <span className="text-[10px] font-black tracking-widest text-[#dc2626] uppercase">
              MEDIA
            </span>
            <span className="w-2.5 h-[1.5px] bg-[#dc2626]"></span>
          </div>
        </div>

        <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          نعتذر عن هذا الخلل المؤقت. يمكنك محاولة تحديث الصفحة أو العودة للصفحة الرئيسية.
        </p>

        <div className="flex items-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-semibold rounded-full shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة المحاولة</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm font-semibold rounded-full transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
