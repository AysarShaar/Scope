'use client';

import React, { useMemo } from 'react';
import Link from './NavLink';
import { Play, Clock, ArrowLeft, ArrowRight, Newspaper } from 'lucide-react';
import { ScopeArticle, ScopeShow } from '../data/scopeData';
import { ScopeVisual } from './ScopeVisual';
import { ScopeHeroGridSkeleton, ScopeProgramsRowSkeleton } from './ScopeSkeleton';
import { useLanguage } from '../context/LanguageContext';
import { translatedShows } from '../lib/translations';
import { useLiveStreamId } from '../hooks/use-live-stream-id';
import { LivePlaceholder } from './LivePlaceholder';

interface ScopeHeroGridProps {
  articles?: ScopeArticle[];
  /** Article for the tall box (newest one flagged is_special). Falls back to the next latest article. */
  special?: ScopeArticle | null;
  specialArticles?: ScopeArticle[];
  shows?: ScopeShow[];
  isLoading?: boolean;
  onOpenShow: (show: ScopeShow) => void;
  onViewMoreNews: () => void;
  onViewMoreReports: () => void;
  onViewAllShows: () => void;
  onOpenLive?: () => void;
  showProgramsInside?: boolean;
  onSelectTag?: (tag: string) => void;
}

export const ScopeProgramsRow: React.FC<{
  shows?: ScopeShow[];
  onOpenShow: (show: ScopeShow) => void;
  onViewAllShows: () => void;
  isLoading?: boolean;
  className?: string;
}> = ({ shows, onOpenShow, onViewAllShows, isLoading = false, className = '' }) => {
  const { t, dir, lang } = useLanguage();

  if (isLoading) {
    return <ScopeProgramsRowSkeleton />;
  }

  const activeShows = shows || [];
  if (activeShows.length === 0) {
    return null;
  }

  const ForwardArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className={`w-full space-y-3 pt-2 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A42424]"></span>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            {t.hero.exclusiveShows}
          </h3>
        </div>
        <button
          onClick={onViewAllShows}
          className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#A42424] dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
        >
          <span>{t.hero.fullShowsGuide}</span>
          <ForwardArrow className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {activeShows.map((show) => {
          const tr = translatedShows[show.id];
          const displayTitle = tr?.title[lang] || show.title;
          const displaySubtitle = tr?.subtitle[lang] || show.subtitle;

          return (
            <Link
              key={show.id}
              href={`/programs/${show.id}`}
              prefetch={false}
              className="relative aspect-[16/11] rounded-xl overflow-hidden cursor-pointer group shadow-sm bg-slate-950 border border-slate-800/80 block"
            >
              <ScopeVisual imageUrl={show.imageUrl} type={show.imageType} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

              <div
                className={`absolute bottom-2.5 ${dir === 'rtl' ? 'left-2.5' : 'right-2.5'
                  } w-7 h-7 rounded-full bg-[#A42424]/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#A42424] transition-all z-20`}
              >
                <Play className="w-3 h-3 fill-white ml-0.5" />
              </div>

              <div
                className={`absolute bottom-2.5 ${dir === 'rtl' ? 'right-2.5 left-10 text-right' : 'left-2.5 right-10 text-left'
                  } z-10`}
              >
                <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-200 transition-colors line-clamp-1">
                  {displayTitle}
                </h5>
                <p className="text-[10px] text-slate-300 line-clamp-1 font-normal opacity-90">
                  {displaySubtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const ScopeHeroGrid: React.FC<ScopeHeroGridProps> = ({
  articles = [],
  special = null,
  specialArticles,
  shows,
  isLoading = false,
  onOpenShow,
  onViewMoreNews,
  onViewMoreReports,
  onViewAllShows,
  showProgramsInside = true,
  onSelectTag,
}) => {
  const { t, dir, lang } = useLanguage();
  const liveStreamId = useLiveStreamId();

  const ForwardArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  // The tall box shows the newest special article (1st of 4); without one it falls back to standard articles.
  const tallBoxArticle = useMemo(() => {
    if (specialArticles && specialArticles.length > 0) {
      return specialArticles[0];
    }
    if (special) return special;
    if (!articles || articles.length === 0) return null;
    return articles[3] ?? articles[0];
  }, [specialArticles, special, articles]);

  // The 3 smaller boxes show the next 3 special articles, falling back to latest published articles.
  const rightHeroCards = useMemo(() => {
    const list: ScopeArticle[] = [];
    const usedIds = new Set<string>();
    if (tallBoxArticle) usedIds.add(tallBoxArticle.id);

    // Pick 3 from specialArticles (items 1, 2, 3)
    if (specialArticles && specialArticles.length > 1) {
      for (let i = 1; i < specialArticles.length && list.length < 3; i++) {
        const item = specialArticles[i];
        if (!usedIds.has(item.id)) {
          list.push(item);
          usedIds.add(item.id);
        }
      }
    }

    // If still less than 3, fill from articles
    if (articles && articles.length > 0) {
      for (const a of articles) {
        if (list.length >= 3) break;
        if (!usedIds.has(a.id)) {
          list.push(a);
          usedIds.add(a.id);
        }
      }
    }

    return list;
  }, [articles, specialArticles, tallBoxArticle]);

  const featuredNews = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    const excludedIds = new Set<string>();
    rightHeroCards.forEach((a) => excludedIds.add(a.id));
    if (tallBoxArticle) {
      excludedIds.add(tallBoxArticle.id);
    }
    specialArticles?.forEach((a) => excludedIds.add(a.id));

    return articles.filter((a) => !excludedIds.has(a.id)).slice(0, 8);
  }, [articles, rightHeroCards, tallBoxArticle, specialArticles]);

  if (isLoading) {
    return <ScopeHeroGridSkeleton />;
  }

  if (articles.length === 0) {
    return (
      <div className="w-full space-y-7">
        <div className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-xl p-10 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-[#A42424] mx-auto flex items-center justify-center">
            <Newspaper className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {lang === 'AR' ? 'منصة SCOPE MEDIA الإخبارية' : 'SCOPE MEDIA News Platform'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto font-medium">
            {lang === 'AR'
              ? 'لا يتوفر شيء لعرضه'
              : 'Nothing available to display'}
          </p>
        </div>

        {showProgramsInside && (
          <ScopeProgramsRow shows={shows} onOpenShow={onOpenShow} onViewAllShows={onViewAllShows} />
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-7">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 lg:gap-5 items-stretch">
        {rightHeroCards.length > 0 && (
          <div className="md:col-span-4 xl:col-span-3 flex flex-col justify-between gap-3 h-auto md:h-[470px] lg:h-[490px] order-2 md:order-1">
            {rightHeroCards.map((card) => (
              <Link
                key={card.id}
                href={`/news/${card.id}`}
                prefetch={false}
                className="relative flex-1 min-h-[135px] md:min-h-0 rounded-xl overflow-hidden cursor-pointer group shadow-2xs bg-[#0b1422] border border-slate-200/80 dark:border-slate-800/80 block"
              >
                <ScopeVisual imageUrl={card.imageUrl} type={card.imageType} category={card.categorySlug} className="w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                <div className={`absolute top-2.5 ${dir === 'rtl' ? 'right-3' : 'left-3'} z-10 flex items-center gap-1.5`}>
                  <span className="px-2 py-0.5 rounded bg-[#A42424] text-white text-[10px] font-bold tracking-wide shadow-xs">
                    {card.category}
                  </span>
                  <span className="text-[10px] text-slate-300">· {card.date?.split(' ').slice(0, 2).join(' ')}</span>
                </div>

                <div className={`absolute bottom-2.5 right-3 left-3 ${dir === 'rtl' ? 'text-right' : 'text-left'} z-10`}>
                  <h3 className="text-sm font-bold text-white group-hover:text-slate-100 transition-colors leading-snug line-clamp-2">
                    {card.title}
                  </h3>
                  {card.subtitle && (
                    <p className="text-[11px] text-slate-300 line-clamp-1 font-normal mt-0.5 opacity-90">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        <div
          className={`${rightHeroCards.length > 0 ? 'md:col-span-8 xl:col-span-6' : 'md:col-span-12 xl:col-span-9'} relative rounded-2xl overflow-hidden shadow-sm bg-black border border-slate-200/80 dark:border-slate-800/80 min-h-[340px] sm:min-h-[400px] md:min-h-[470px] lg:min-h-[490px] h-full order-1 md:order-2`}
        >
          {liveStreamId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${liveStreamId}?autoplay=1&mute=1&playsinline=1&rel=0&enablejsapi=1`}
              title="SCOPE MEDIA Live Stream"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full min-h-[340px] sm:min-h-[400px] md:min-h-[470px] lg:min-h-[490px] border-0"
            />
          ) : (
            <div className="relative w-full h-full min-h-[340px] sm:min-h-[400px] md:min-h-[470px] lg:min-h-[490px]">
              <LivePlaceholder title="SCOPE MEDIA" label={t.liveModal.comingSoon} />
            </div>
          )}
        </div>

        <div className="md:col-span-12 xl:col-span-3 h-auto md:h-[470px] lg:h-[490px] order-3">
          {tallBoxArticle ? (
            <Link
              href={`/news/${tallBoxArticle.id}`}
              prefetch={false}
              className="relative w-full h-full min-h-[340px] sm:min-h-[400px] md:min-h-0 rounded-2xl overflow-hidden cursor-pointer group shadow-sm bg-[#0b1422] border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between p-4 sm:p-5 block"
            >
              <div className="absolute inset-0">
                <ScopeVisual
                  imageUrl={tallBoxArticle.imageUrl}
                  type={tallBoxArticle.imageType}
                  category={tallBoxArticle.categorySlug}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/30 pointer-events-none" />

              <div className={`relative z-10 flex items-center ${dir === 'rtl' ? 'justify-end' : 'justify-start'} gap-2`}>
                <span className="px-2.5 py-1 rounded-full bg-[#A42424] text-white text-[10px] sm:text-[11px] font-bold shadow-xs">
                  {tallBoxArticle.category}
                </span>
              </div>

              <div className={`relative z-10 ${dir === 'rtl' ? 'text-right' : 'text-left'} space-y-2 mt-auto pt-16`}>
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white group-hover:text-slate-100 transition-colors leading-snug line-clamp-3 drop-shadow-sm">
                  {tallBoxArticle.title}
                </h3>

                {tallBoxArticle.subtitle && (
                  <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 sm:line-clamp-3 font-normal leading-relaxed opacity-90 drop-shadow-xs">
                    {tallBoxArticle.subtitle}
                  </p>
                )}

                <div className="pt-3 mt-1 border-t border-white/15 flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-300" />
                    <span>{tallBoxArticle.date}</span>
                  </span>
                  <span className="text-xs font-bold text-white group-hover:text-rose-200 inline-flex items-center gap-1 transition-colors">
                    <span>{lang === 'AR' ? 'قراءة المادة' : 'Read Article'}</span>
                    <ForwardArrow className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ) : null}
        </div>
      </div>

      <div className="w-full">
        <div className="hidden xl:flex flex-col">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0 h-10 mb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200"></span>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                {t.hero.latestNews}
              </h3>
            </div>
            <button
              onClick={onViewMoreNews}
              className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#A42424] dark:hover:text-[#E25353] flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
            >
              <span>{t.hero.moreNews}</span>
              <ForwardArrow className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-3.5 flex-1 min-h-0">
              {featuredNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  prefetch={false}
                  className="group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#121b2d] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#A42424] dark:hover:border-slate-600 transition-all h-full"
                >
                  <div>
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                      <ScopeVisual
                        imageUrl={news.imageUrl}
                        type={news.imageType}
                        category={news.categorySlug}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <span className="text-[11px] font-bold text-[#A42424] block mb-1">
                      {news.category}
                    </span>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#A42424] transition-colors leading-snug">
                      {news.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{news.date?.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    {news.author && <span className="truncate max-w-[120px]">{news.author.name}</span>}
                  </div>
                </Link>
              ))}
            </div>

          </div>

        <div className="block xl:hidden space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {t.hero.latestNews}
                </h3>
              </div>
              <button
                onClick={onViewMoreNews}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#A42424] flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 font-medium"
              >
                <span>{t.hero.moreNews}</span>
                <ForwardArrow className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {featuredNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  prefetch={false}
                  className="group cursor-pointer bg-white dark:bg-[#121b2d] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs block"
                >
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                    <ScopeVisual imageUrl={news.imageUrl} type={news.imageType} category={news.categorySlug} className="w-full h-full" />
                  </div>
                  <span className="text-[10px] font-bold text-[#A42424] block mb-1">{news.category}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1.5">{news.title}</h4>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{news.date}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showProgramsInside && (
        <ScopeProgramsRow shows={shows} isLoading={isLoading} onOpenShow={onOpenShow} onViewAllShows={onViewAllShows} />
      )}
    </div>
  );
};
