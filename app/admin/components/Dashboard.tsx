'use client';
import { FileText, Radio, Clock, Eye, ArrowUpRight } from 'lucide-react';
import { ScopeArticle, BreakingItem } from '../../../data/scopeData';

interface Props {
  articles: ScopeArticle[];
  breaking: BreakingItem[];
  onNavigate: (s: 'articles' | 'breaking') => void;
}

export default function Dashboard({ articles, breaking, onNavigate }: Props) {
  const publishedCount = articles.filter(a => a.status !== 'pending').length;
  const pendingCount = articles.filter(a => a.status === 'pending').length;
  const totalArticles = articles.length;

  const stats = [
    { label: 'المقالات المنشورة', value: publishedCount, icon: FileText, onClick: () => onNavigate('articles') },
    { label: 'بانتظار الاعتماد', value: pendingCount, icon: Clock, onClick: () => onNavigate('articles'), isAlert: pendingCount > 0 },
    { label: 'الأخبار العاجلة النشطة', value: breaking.length, icon: Radio, onClick: () => onNavigate('breaking') },
    { label: 'إجمالي المواد المسترجعة', value: totalArticles, icon: FileText, onClick: () => onNavigate('articles') },
  ];

  const recentArticles = articles.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          لوحة المؤشرات
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          ملخص نشاط المحتوى وغرفة التحرير
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, onClick, isAlert }) => (
          <button
            key={label}
            onClick={onClick}
            className={`p-3 sm:p-4 rounded-xl border text-right transition-colors cursor-pointer flex flex-col justify-between h-24 sm:h-28 ${
              isAlert
                ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50'
                : 'bg-white dark:bg-[#0c101c] border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">{label}</span>
              <Icon size={14} className={isAlert ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'} />
            </div>
            <div className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${isAlert ? 'text-amber-700 dark:text-amber-300' : 'text-slate-900 dark:text-white'}`}>
              {value}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">أحدث المواد المنشورة</span>
          <button
            onClick={() => onNavigate('articles')}
            className="text-xs text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>عرض كل المواد</span>
            <ArrowUpRight size={13} />
          </button>
        </div>

        {recentArticles.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">لا توجد مقالات مضافة بعد</div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {recentArticles.map(a => (
              <div
                key={a.id}
                onClick={() => onNavigate('articles')}
                className="px-4 py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded shrink-0 ${
                    a.status === 'pending'
                      ? 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    {a.status === 'pending' ? 'قيد المراجعة' : a.category}
                  </span>
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                    {a.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono shrink-0">
                  {a.date}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
