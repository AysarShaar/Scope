'use client';

import React, { useState } from 'react';
import Link from './NavLink';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  PlayCircle,
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { ScopeShow, BreakingItem, ScopeArticle } from '../data/scopeData';
import { ScopeHeader } from './ScopeHeader';
import { ScopeFooter } from './ScopeFooter';
import { ScopeVisual } from './ScopeVisual';
import { ScopeLiveModal } from './ScopeLiveModal';
import { useLanguage } from '../context/LanguageContext';
import { translatedShows } from '../lib/translations';
import { extractYouTubeId } from '../lib/youtube';

export default function ProgramsClient({ initialPrograms, initialBreaking }: { initialPrograms: ScopeShow[]; initialBreaking: BreakingItem[] }) {
  const router = useRouter();
  const { lang, dir, t, toggleLang } = useLanguage();

  const programs = initialPrograms;
  const [expandedPrograms, setExpandedPrograms] = useState<Record<string, boolean>>({});
  const isLoading = false;

  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const breakingNews = initialBreaking;

  const toggleProgram = (showId: string) => {
    setExpandedPrograms((prev) => ({
      ...prev,
      [showId]: !prev[showId],
    }));
  };

  const ForwardArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;


  return (
    <div
      className="min-h-screen bg-[#f8fafc] dark:bg-[#080e1a] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200"
      dir={dir}
    >
      <ScopeHeader
        currentTab="programs"
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
              {lang === 'AR' ? 'برامج سكوب ميديا والحلقات' : 'Scope Media Shows & Episodes'}
            </h1>
          </div>
          {programs.length > 0 && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-fit">
              {programs.length} {lang === 'AR' ? 'برنامج متوفر' : 'Shows Available'}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-[#A42424] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <span className="text-xs">{lang === 'AR' ? 'جاري تحميل البرامج...' : 'Loading shows...'}</span>
          </div>
        ) : programs.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs">
            <PlayCircle className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {lang === 'AR' ? 'لا توجد برامج متاحة حالياً' : 'No shows available currently'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {lang === 'AR'
                ? 'سيتم إضافة الحلقات والبرامج الجديدة قريباً عبر فريق الإنتاج.'
                : 'New episodes and original programs will be released soon.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {programs.map((show) => {
                const tr = translatedShows[show.id];
                const displayTitle = tr?.title[lang] || show.title;
                const displayHost = tr?.host[lang] || show.host;
                const displayDesc = tr?.description[lang] || show.description;
                const episodes = show.episodes || [];
                const latestEpisodes = episodes.slice(0, 4);
                const isExpanded = !!expandedPrograms[show.id];

                const cleanYt = show.youtubeId ? (extractYouTubeId(show.youtubeId) || show.youtubeId) : undefined;
                const programThumb = show.imageUrl || (cleanYt ? `https://img.youtube.com/vi/${cleanYt}/hqdefault.jpg` : undefined);

                return (
                  <section
                    key={show.id}
                    className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-all"
                  >
                    <div className="p-4 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border-b border-slate-100 dark:border-slate-800/80">
                      <div className="flex flex-row gap-3.5 sm:gap-5 items-start sm:items-center flex-1 min-w-0">
                        <Link
                          href={`/programs/${show.id}`}
                          prefetch={false}
                          className="relative w-28 sm:w-48 md:w-56 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 cursor-pointer group shadow-2xs block"
                        >
                          <ScopeVisual
                            imageUrl={programThumb}
                            type={show.imageType}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                          <Link href={`/programs/${show.id}`} prefetch={false}>
                            <h2 className="text-sm sm:text-xl font-bold text-slate-900 dark:text-white hover:text-[#A42424] dark:hover:text-rose-400 transition-colors line-clamp-2">
                              {displayTitle}
                            </h2>
                          </Link>
                          {displayDesc && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                              {displayDesc}
                            </p>
                          )}
                          <div className="pt-0.5 sm:pt-1 flex flex-wrap items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                            {displayHost && (
                              <span className="truncate max-w-[140px] sm:max-w-none">
                                {t.programs.hostPrefix}
                                <strong className="text-slate-700 dark:text-slate-200 font-semibold">{displayHost}</strong>
                              </span>
                            )}
                            <span>•</span>
                            <span>{show.episodeCount || episodes.length} {lang === 'AR' ? 'حلقة' : 'episodes'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 w-full lg:w-auto justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                        {latestEpisodes.length > 0 && (
                          <button
                            onClick={() => toggleProgram(show.id)}
                            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span>{isExpanded ? (lang === 'AR' ? 'إخفاء الحلقات' : 'Hide') : (lang === 'AR' ? 'أحدث الحلقات' : 'Episodes')}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        )}
                        <Link
                          href={`/programs/${show.id}`}
                          prefetch={false}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-[#A42424] hover:bg-[#8B1E1E] text-white flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <span>{lang === 'AR' ? 'صفحة البرنامج' : 'Program Page'}</span>
                          <ForwardArrow className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {isExpanded && latestEpisodes.length > 0 && (
                      <div className="p-5 sm:p-6 bg-slate-50/70 dark:bg-[#0c1424] space-y-4 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-150">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {latestEpisodes.map((ep) => {
                            const cleanEpYt = extractYouTubeId(ep.youtubeId) || ep.youtubeId;
                            return (
                              <Link
                                key={ep.id}
                                href={`/programs/${show.id}?ep=${ep.id}`}
                                prefetch={false}
                                className="group bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs hover:border-[#A42424] dark:hover:border-slate-700 transition-all flex flex-col"
                              >
                                <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                                  {cleanEpYt ? (
                                    <Image
                                      src={`https://img.youtube.com/vi/${cleanEpYt}/mqdefault.jpg`}
                                      alt={ep.title}
                                      fill
                                      sizes="(max-width: 768px) 100vw, 25vw"
                                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  ) : (
                                    <ScopeVisual type={show.imageType} className="w-full h-full" />
                                  )}
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-8 h-8 rounded-full bg-[#A42424] text-white flex items-center justify-center">
                                      <Play className="w-3 h-3 fill-white ml-0.5" />
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between">
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#A42424] dark:group-hover:text-rose-400 transition-colors line-clamp-2">
                                    {ep.title}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 font-mono block pt-1">
                                    {ep.date || show.latestEpisode}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </section>
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
