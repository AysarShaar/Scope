'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Feather } from 'lucide-react';
import { scopeBreakingList, scopeTopicTags } from '../data/scopeData';

interface ScopeSidebarProps {
  onSelectTag: (tag: string) => void;
  onViewAllNews: () => void;
}

export const ScopeSidebar: React.FC<ScopeSidebarProps> = ({
  onSelectTag,
  onViewAllNews,
}) => {
  return (
    <aside className="w-full space-y-5 md:space-y-0 md:grid md:grid-cols-3 md:gap-4 xl:grid-cols-1 xl:gap-0 xl:space-y-5">
      {/* 1. Card: عاجل وتغطيات فورية */}
      <div className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800/90 rounded-xl shadow-2xs overflow-hidden transition-colors">
        {/* Editorial Header */}
        <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-[#182339] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#dc2626] animate-ping"></span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              شريط الأخبار العاجلة
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">تحديث مستمر</span>
        </div>

        {/* Breaking News Feed */}
        <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800/80">
          {scopeBreakingList.map((item) => (
            <Link
              key={item.id}
              href={`/news/${item.id}`}
              className="py-2.5 first:pt-1 last:pb-1 flex items-start gap-2.5 cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors px-1.5 rounded-lg block"
            >
              <span className="font-mono text-xs font-bold text-[#dc2626] dark:text-rose-400 shrink-0 tabular-nums mt-0.5">
                {item.time}
              </span>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-[#dc2626] dark:group-hover:text-rose-400 transition-colors leading-snug line-clamp-2">
                {item.title}
              </p>
            </Link>
          ))}
        </div>

        {/* View All Link (Rounded-full Button) */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-[#182339]/60 text-left">
          <button
            onClick={onViewAllNews}
            className="text-xs font-bold text-[#dc2626] dark:text-rose-400 hover:text-[#b91c1c] dark:hover:text-rose-300 inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 hover:bg-rose-100/60 transition-colors cursor-pointer"
          >
            <span>جميع الأخبار العاجلة</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Editorial Quote & Opinion Box */}
      <div className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 shadow-2xs space-y-3 transition-colors">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-bold text-sm">
          <Feather className="w-4 h-4 text-[#dc2626]" />
          <span>افتتاحية العدد</span>
        </div>
        <blockquote className="text-xs sm:text-[13px] leading-relaxed text-slate-700 dark:text-slate-300 italic border-r-2 border-[#dc2626] pr-3">
          &quot;ليست وظيفة الصحافة نقل ما حدث فحسب، بل تفسير الأسباب وتفكيك السياقات التي تجعل من الخبر بداية لفهم المستقبل.&quot;
        </blockquote>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
          — هيئة التحرير · SCOPE MEDIA
        </div>
      </div>

      {/* 3. Card: مواضيع شائعة للنقاش مع أزرار دائرية الحواف */}
      <div className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800/90 rounded-xl p-4 shadow-2xs space-y-3 transition-colors">
        <div className="font-bold text-sm text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span>مواضيع قيد المتابعة</span>
          <span className="text-[11px] text-slate-400 font-normal">وسوم نشطة</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {scopeTopicTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onSelectTag(tag)}
              className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full transition-colors cursor-pointer border border-slate-200/60 dark:border-slate-700/60"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

