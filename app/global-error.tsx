'use client';

import React from 'react';

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
          <div className="flex flex-col items-center mb-6">
            <span className="font-black text-3xl tracking-tighter text-white uppercase leading-none">
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
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            نعتذر عن هذا الخلل المؤقت في النظام. يمكنك محاولة إعادة التحميل.
          </p>

          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-sm font-semibold rounded-full shadow-sm transition-colors cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      </body>
    </html>
  );
}
