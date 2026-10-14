import Link from '../components/NavLink';
import { ArrowRight, Home } from 'lucide-react';
import { ScopeLogo } from '../components/ScopeLogo';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full bg-white dark:bg-[#121b2d] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center">
        <Link href="/" prefetch={false} className="mb-6 inline-block">
          <ScopeLogo className="h-12 sm:h-14 w-auto" />
        </Link>

        <span className="text-6xl font-black text-[#A42424] font-mono mb-2">404</span>
        <h1 className="text-xl font-bold mb-2">الصفحة غير موجودة</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          عذراً، المقال أو الصفحة التي تبحث عنها غير متوفرة أو ربما تم نقلها إلى عنوان آخر في أرشيف المنصة.
        </p>

        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A42424] hover:bg-[#8B1E1E] text-white text-sm font-semibold rounded-full shadow-sm transition-colors"
        >
          <Home className="w-4 h-4" />
          <span>العودة للرئيسية</span>
          <ArrowRight className="w-4 h-4 mr-1" />
        </Link>
      </div>
    </div>
  );
}
