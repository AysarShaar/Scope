'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from './NavLink';
import Image from 'next/image';
import {
  Play,
  Share2,
  Check,
  Clock,
  Calendar,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { ScopeShow, ProgramEpisode } from '../data/scopeData';
import { useLanguage } from '../context/LanguageContext';
import { translatedShows } from '../lib/translations';
import { extractYouTubeId } from '../lib/youtube';
import { ScopeVisual } from './ScopeVisual';
import { ArticleInteractiveBar } from './ArticleInteractiveBar';

interface ProgramDetailClientProps {
  initialShow: ScopeShow;
  otherShows?: ScopeShow[];
  initialEpisodeId?: string;
}

export const ProgramDetailClient: React.FC<ProgramDetailClientProps> = ({
  initialShow,
  otherShows = [],
  initialEpisodeId,
}) => {
  const { lang, dir } = useLanguage();
  const playerStageRef = useRef<HTMLDivElement>(null);

  const [show, setShow] = useState<ScopeShow>(initialShow);
  const [episodesList, setEpisodesList] = useState<ProgramEpisode[]>(
    initialShow.episodes || []
  );
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | undefined>(
    initialEpisodeId || initialShow.episodes?.[0]?.id
  );
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setShow(initialShow);
    const initialEps = initialShow.episodes || [];
    setEpisodesList(initialEps);
    if (initialEpisodeId) {
      setActiveEpisodeId(initialEpisodeId);
    }
    // No client-side refetch of /api/episodes: the server page already passes the full episode list.
  }, [initialShow, initialEpisodeId]);

  const activeEpisode = useMemo(() => {
    if (!episodesList || episodesList.length === 0) return null;
    if (activeEpisodeId) {
      const found = episodesList.find((e) => e.id === activeEpisodeId);
      if (found) return found;
    }
    return episodesList[0];
  }, [episodesList, activeEpisodeId]);

  const activeVideoId = useMemo(() => {
    if (activeEpisode?.youtubeId) {
      return extractYouTubeId(activeEpisode.youtubeId) || activeEpisode.youtubeId;
    }
    if (show.youtubeId) {
      return extractYouTubeId(show.youtubeId) || show.youtubeId;
    }
    return undefined;
  }, [activeEpisode, show.youtubeId]);

  const activeIndex = useMemo(() => {
    if (!activeEpisode) return -1;
    return episodesList.findIndex((e) => e.id === activeEpisode.id);
  }, [episodesList, activeEpisode]);

  const hasNext = activeIndex > 0;
  const hasPrev = activeIndex >= 0 && activeIndex < episodesList.length - 1;

  const handleSelectEpisode = (ep: ProgramEpisode) => {
    setActiveEpisodeId(ep.id);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('ep', ep.id);
      window.history.replaceState({}, '', url.toString());

      if (window.innerWidth < 1024 && playerStageRef.current) {
        playerStageRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextEpisode = () => {
    if (hasNext) {
      handleSelectEpisode(episodesList[activeIndex - 1]);
    }
  };

  const handlePrevEpisode = () => {
    if (hasPrev) {
      handleSelectEpisode(episodesList[activeIndex + 1]);
    }
  };

  const tr = translatedShows[show.id];
  const displayTitle = (lang === 'EN' && tr?.title.EN) || show.title;
  const displayHost = (lang === 'EN' && tr?.host.EN) || show.host;
  const displayDesc = (lang === 'EN' && tr?.description.EN) || show.description;

  const EPISODES_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredEpisodes = useMemo(() => {
    if (!searchQuery.trim()) return episodesList;
    const q = searchQuery.toLowerCase();
    return episodesList.filter(
      (ep) =>
        ep.title?.toLowerCase().includes(q) ||
        ep.description?.toLowerCase().includes(q) ||
        String(ep.episodeNumber || '').includes(q)
    );
  }, [episodesList, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    if (activeEpisodeId && filteredEpisodes.length > 0) {
      const idx = filteredEpisodes.findIndex((e) => e.id === activeEpisodeId);
      if (idx !== -1) {
        const epPage = Math.floor(idx / EPISODES_PER_PAGE) + 1;
        setCurrentPage(epPage);
      }
    }
  }, [activeEpisodeId, filteredEpisodes]);

  const totalPages = Math.max(1, Math.ceil(filteredEpisodes.length / EPISODES_PER_PAGE));
  const paginatedEpisodes = useMemo(() => {
    const start = (currentPage - 1) * EPISODES_PER_PAGE;
    return filteredEpisodes.slice(start, start + EPISODES_PER_PAGE);
  }, [filteredEpisodes, currentPage]);

  const isRtl = dir === 'rtl';
  const ChevronBack = isRtl ? ChevronRight : ChevronLeft;

  const currentEpisodeTitle = activeEpisode?.title || displayTitle;
  const currentEpisodeDesc = activeEpisode?.description || displayDesc;

  return (
    <div
      className="w-full bg-[#f8fafc] dark:bg-[#080e1a] text-slate-900 dark:text-slate-100 transition-colors duration-200"
      dir={dir}
      suppressHydrationWarning
    >
      <nav
        aria-label="مسار التصفح"
        className="w-full bg-white dark:bg-[#0c1628] border-b border-slate-200 dark:border-slate-800/80 py-3"
      >
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link href="/" prefetch={false} className="hover:text-[#A42424] transition-colors whitespace-nowrap">
              {lang === 'EN' ? 'Home' : 'الرئيسية'}
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
            <Link
              href="/programs"
              prefetch={false}
              className="hover:text-[#A42424] transition-colors whitespace-nowrap font-medium"
            >
              {lang === 'EN' ? 'Programs' : 'البرامج'}
            </Link>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
            <span className="truncate max-w-[200px] sm:max-w-md text-slate-900 dark:text-slate-200 font-bold">
              {displayTitle}
            </span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1480px] mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6" ref={playerStageRef}>
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-sm">
              {activeVideoId ? (
                <iframe
                  key={activeVideoId}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&mute=1&playsinline=1&enablejsapi=1&rel=0&modestbranding=1`}
                  title={currentEpisodeTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              ) : (
                <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
                  <ScopeVisual
                    imageUrl={show.imageUrl}
                    type={show.imageType}
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-[#A42424] flex items-center justify-center shadow-lg text-white">
                      <Play className="w-6 h-6 fill-white ml-0.5" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">
                      {lang === 'EN'
                        ? 'No video available for this episode yet.'
                        : 'لم يتم ربط فيديو لهذه الحلقة بعد.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <article className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                  {activeEpisode?.episodeNumber && (
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {lang === 'EN'
                        ? `Episode #${activeEpisode.episodeNumber}`
                        : `الحلقة #${activeEpisode.episodeNumber}`}
                    </span>
                  )}
                  {activeEpisode?.episodeNumber && (activeEpisode?.date || activeEpisode?.duration) && (
                    <span>•</span>
                  )}
                  {activeEpisode?.date && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeEpisode.date}</span>
                    </span>
                  )}
                  {activeEpisode?.date && activeEpisode?.duration && (
                    <span>•</span>
                  )}
                  {activeEpisode?.duration && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{activeEpisode.duration}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {episodesList.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevEpisode}
                        disabled={!hasPrev}
                        className={`h-8.5 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          hasPrev
                            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer'
                            : 'opacity-40 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                        title={lang === 'EN' ? 'Previous Episode' : 'الحلقة السابقة'}
                      >
                        <ChevronRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                        <span>{lang === 'EN' ? 'Prev' : 'السابقة'}</span>
                      </button>

                      <button
                        onClick={handleNextEpisode}
                        disabled={!hasNext}
                        className={`h-8.5 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                          hasNext
                            ? 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer'
                            : 'opacity-40 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                        title={lang === 'EN' ? 'Next Episode' : 'الحلقة التالية'}
                      >
                        <span>{lang === 'EN' ? 'Next' : 'التالية'}</span>
                        <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                      </button>
                    </>
                  )}

                  {activeVideoId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${activeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8.5 px-3 rounded-lg bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-900/50 text-[#A42424] dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      title={lang === 'EN' ? 'Watch on YouTube' : 'مشاهدة على يوتيوب'}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>YouTube</span>
                    </a>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-snug tracking-tight">
                  {currentEpisodeTitle}
                </h1>

                {displayHost && (
                  <div className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-[#A42424]" />
                    <span>
                      {lang === 'EN' ? 'Host:' : 'تقديم وإعداد:'}{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">{displayHost}</strong>
                    </span>
                  </div>
                )}

                <ArticleInteractiveBar
                  title={`${show.title} | ${currentEpisodeTitle}`}
                  className="!my-2 !py-2.5"
                />
              </div>

              {currentEpisodeDesc && (
                <div className="pt-2 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  <p>{currentEpisodeDesc}</p>
                </div>
              )}

              {displayDesc && displayDesc !== currentEpisodeDesc && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1424] border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    {lang === 'EN' ? `About ${displayTitle}:` : `عن برنامج ${displayTitle}:`}
                  </span>
                  <p className="leading-relaxed">{displayDesc}</p>
                </div>
              )}
            </article>
          </div>

          <aside className="lg:col-span-4 sticky top-20 space-y-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-3.5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#A42424]" />
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white">
                    {lang === 'EN' ? 'Episodes' : 'حلقات البرنامج'}
                  </h2>
                </div>
                <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full">
                  {episodesList.length} {lang === 'EN' ? 'episodes' : 'حلقة'}
                </span>
              </div>

              {episodesList.length > 3 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'EN' ? 'Search episodes...' : 'ابحث في الحلقات...'}
                    className="w-full bg-slate-50 dark:bg-[#0c1424] border border-slate-200 dark:border-slate-800 rounded-xl ps-9 pe-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#A42424] transition-colors"
                  />
                </div>
              )}

              <div className="space-y-2 max-h-[580px] overflow-y-auto pe-1 no-scrollbar">
                {paginatedEpisodes.length > 0 ? (
                  paginatedEpisodes.map((ep, idx) => {
                    const cleanEpYt = extractYouTubeId(ep.youtubeId) || ep.youtubeId;
                    const isCurrent = ep.id === activeEpisode?.id;
                    const thumb = cleanEpYt
                        ? `https://img.youtube.com/vi/${cleanEpYt}/mqdefault.jpg`
                        : undefined;

                    return (
                      <div
                        key={ep.id || idx}
                        onClick={() => handleSelectEpisode(ep)}
                        className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isCurrent
                            ? 'bg-rose-50/70 dark:bg-rose-950/20 border-[#A42424] shadow-2xs'
                            : 'bg-slate-50/60 dark:bg-[#0c1424]/60 border-slate-200/70 dark:border-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="relative w-22 h-14 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                          {thumb ? (
                            <Image
                              src={thumb}
                              alt={ep.title}
                              fill
                              sizes="88px"
                              className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center text-slate-500">
                              <Play className="w-4 h-4" />
                            </div>
                          )}

                          <div
                            className={`absolute inset-0 flex items-center justify-center transition-colors ${
                              isCurrent ? 'bg-[#A42424]/30' : 'bg-black/30 group-hover:bg-black/15'
                            }`}
                          >
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                                isCurrent ? 'bg-white text-[#A42424]' : 'bg-[#A42424] text-white'
                              }`}
                            >
                              <Play size={10} className="fill-current ml-0.5" />
                            </div>
                          </div>

                          {ep.duration && (
                            <span className="absolute bottom-1 end-1 bg-black/80 text-white text-[8px] font-mono px-1 py-0.2 rounded">
                              {ep.duration}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <h3
                            className={`text-xs font-bold line-clamp-2 leading-snug transition-colors ${
                              isCurrent
                                ? 'text-[#A42424] dark:text-rose-400'
                                : 'text-slate-800 dark:text-slate-200 group-hover:text-[#A42424] dark:group-hover:text-rose-300'
                            }`}
                          >
                            {ep.title}
                          </h3>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                            <span>{ep.date || (ep.episodeNumber ? `حلقة #${ep.episodeNumber}` : '')}</span>
                            {isCurrent && (
                              <span className="text-[9px] text-[#A42424] dark:text-rose-400 font-bold">
                                {lang === 'EN' ? 'Now Playing' : 'تشاهد الآن'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    {lang === 'EN'
                      ? 'No episodes match your search.'
                      : 'لا توجد حلقات تطابق بحثك.'}
                  </div>
                )}
              </div>

              {totalPages > 1 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ChevronRight className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                    <span>{lang === 'EN' ? 'Prev' : 'السابق'}</span>
                  </button>

                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>{lang === 'EN' ? 'Next' : 'التالي'}</span>
                    <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
                  </button>
                </div>
              )}
            </div>
          </aside>
        </div>

        {otherShows && otherShows.length > 0 && (
          <section className="pt-8 border-t border-slate-200 dark:border-slate-800/80 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#A42424]" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {lang === 'EN' ? 'Other Shows on SCOPE MEDIA' : 'برامج أخرى من سكوب ميديا'}
                </h2>
              </div>

              <Link
                href="/programs"
                prefetch={false}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-[#A42424] dark:hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>{lang === 'EN' ? 'View All Shows' : 'استعراض كافة البرامج'}</span>
                <ChevronLeft className="w-3.5 h-3.5 rtl:rotate-0 ltr:rotate-180" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {otherShows
                .filter((s) => s.id !== show.id)
                .slice(0, 4)
                .map((other) => {
                  const otherTr = translatedShows[other.id];
                  const oTitle = (lang === 'EN' && otherTr?.title.EN) || other.title;
                  const oHost = (lang === 'EN' && otherTr?.host.EN) || other.host;

                  return (
                    <Link
                      key={other.id}
                      href={`/programs/${other.id}`}
                      prefetch={false}
                      className="group bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden hover:border-[#A42424] transition-all flex flex-col shadow-2xs hover:shadow-sm"
                    >
                      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden">
                        <ScopeVisual
                          imageUrl={other.imageUrl}
                          type={other.imageType}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 start-2 bg-black/75 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {other.episodeCount || (other.episodes ? other.episodes.length : 0)}{' '}
                          {lang === 'EN' ? 'episodes' : 'حلقة'}
                        </span>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#A42424] dark:group-hover:text-rose-300 transition-colors line-clamp-1">
                          {oTitle}
                        </h3>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>{oHost}</span>
                          <span className="text-[#A42424] font-bold group-hover:underline">
                            {lang === 'EN' ? 'Watch' : 'مشاهدة'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProgramDetailClient;
