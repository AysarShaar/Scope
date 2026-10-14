'use client';

import React, { useState } from 'react';
import Link from './NavLink';
import { Video, Play, Clock, Film } from 'lucide-react';
import { ScopeShow, BreakingItem, ScopeArticle } from '../data/scopeData';
import { ScopeHeader } from './ScopeHeader';
import { ScopeFooter } from './ScopeFooter';
import { ScopeVisual } from './ScopeVisual';
import { ScopeLiveModal } from './ScopeLiveModal';
import { useLanguage } from '../context/LanguageContext';
import { translatedShows } from '../lib/translations';

export default function VideosClient({ initialPrograms, initialBreaking }: { initialPrograms: ScopeShow[]; initialBreaking: BreakingItem[] }) {
  const { lang, dir, t, toggleLang } = useLanguage();

  const programs = initialPrograms;
  const isLoading = false;

  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const breakingNews = initialBreaking;


  return (
    <div
      className="min-h-screen bg-[#f8fafc] dark:bg-[#080e1a] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200"
      dir={dir}
    >
      <ScopeHeader
        currentTab="videos"
        onOpenLive={() => setIsLiveOpen(true)}
        currentLang={lang}
        onToggleLang={toggleLang}
        breakingNews={breakingNews}
      />

      <main className="flex-1 max-w-[1480px] mx-auto w-full px-3 sm:px-6 py-6 sm:py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-7 bg-[#A42424] rounded-full shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {lang === 'AR' ? 'مكتبة الفيديو والتقارير المصورة' : 'Video Library & Visual Reports'}
            </h1>
          </div>
          {programs.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit">
              {programs.length} {lang === 'AR' ? 'تقرير مرئي' : 'Videos'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#A42424] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs">{lang === 'AR' ? 'جاري تحميل مكتبة الفيديو...' : 'Loading video library...'}</span>
          </div>
        ) : programs.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs">
            <Video className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {lang === 'AR' ? 'لا توجد فيديوهات متاحة حالياً' : 'No videos available currently'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {lang === 'AR'
                ? 'ترقبوا التقارير المصورة وسلسلة الإنتاجات الوثائقية قريباً.'
                : 'Stay tuned for upcoming visual reports and exclusive series.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {programs.map((show) => {
              const tr = translatedShows[show.id];
              const displayTitle = tr?.title[lang] || show.title;
              const displaySubtitle = tr?.subtitle[lang] || show.subtitle;
              const displayHost = tr?.host[lang] || show.host;

              return (
                <div
                  key={show.id}
                  className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs space-y-3 p-4"
                >
                  {show.youtubeId ? (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${show.youtubeId}?enablejsapi=1&rel=0`}
                        title={displayTitle}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        loading="lazy"
                        className="w-full h-full border-0"
                      />
                    </div>
                  ) : (
                    <Link
                      href={`/programs/${show.id}`}
                      prefetch={false}
                      className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 block group cursor-pointer"
                    >
                      <ScopeVisual imageUrl={show.imageUrl} type={show.imageType} className="w-full h-full" />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-[#A42424] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play className="w-4 h-4 fill-white ml-0.5" />
                        </div>
                      </div>
                    </Link>
                  )}
                  <div>
                    {displaySubtitle && (
                      <span className="text-[11px] font-semibold text-[#A42424] block mb-1">
                        {displaySubtitle}
                      </span>
                    )}
                    <Link href={`/programs/${show.id}`} prefetch={false}>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-[#A42424] transition-colors">
                        {displayTitle}
                      </h3>
                    </Link>
                    <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {t.programs.hostPrefix}
                        {displayHost}
                      </span>
                      <span>{show.latestEpisode}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ScopeFooter />

      <ScopeLiveModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
      />
    </div>
  );
}
