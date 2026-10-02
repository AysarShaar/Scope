'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ScopeShow,
  scopeShows,
  getAllArticles,
} from '../data/scopeData';
import { ScopeHeader } from '../components/ScopeHeader';
import { ScopeSidebar } from '../components/ScopeSidebar';
import { ScopeHeroGrid, ScopeProgramsRow } from '../components/ScopeHeroGrid';
import { ScopeLiveModal } from '../components/ScopeLiveModal';
import { ScopeShowModal } from '../components/ScopeShowModal';
import { ScopeSearchDrawer } from '../components/ScopeSearchDrawer';
import { ScopeFooter } from '../components/ScopeFooter';
import { ScopeVisual } from '../components/ScopeVisual';
import { Clock, Play, ArrowLeft } from 'lucide-react';

export default function HomePage() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [currentLang, setCurrentLang] = useState<'AR' | 'EN'>('AR');

  // Modals state (For Live Stream and Video Player)
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedShow, setSelectedShow] = useState<ScopeShow | null>(null);

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const allArticles = useMemo(() => {
    return getAllArticles();
  }, []);

  const handleSelectTag = (tag: string) => {
    showToast(`تصفح وسم: ${tag}`);
    setIsSearchOpen(true);
  };

  // Filtered view when specific category tab is selected
  const isCategoryTab = currentTab !== 'home' && currentTab !== 'about' && currentTab !== 'programs' && currentTab !== 'videos';
  const categoryFilteredArticles = useMemo(() => {
    if (!isCategoryTab || currentTab === 'news') return allArticles;
    return allArticles.filter((art) => art.categorySlug === currentTab);
  }, [allArticles, currentTab, isCategoryTab]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. SCOPE MEDIA Header */}
      <ScopeHeader
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenLive={() => setIsLiveOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenMobileMenu={() => setIsMenuOpen(true)}
        currentLang={currentLang}
        onToggleLang={() => setCurrentLang(currentLang === 'AR' ? 'EN' : 'AR')}
      />

      {/* 2. Main Page Layout Container */}
      <main className="flex-1 max-w-[1480px] mx-auto w-full px-3 sm:px-6 pt-5">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
          {/* Main Hero & Content Columns */}
          <div className="w-full xl:col-span-9 order-1 xl:order-1">
            {currentTab === 'home' ? (
              <ScopeHeroGrid
                onOpenShow={(show) => setSelectedShow(show)}
                onViewMoreNews={() => {
                  setCurrentTab('news');
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onViewMoreReports={() => {
                  setCurrentTab('investigations');
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onViewAllShows={() => {
                  setCurrentTab('programs');
                  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                showProgramsInside={false}
              />
            ) : currentTab === 'programs' ? (
              /* Dedicated Programs View */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {scopeShows.map((show) => (
                    <div
                      key={show.id}
                      onClick={() => setSelectedShow(show)}
                      className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden cursor-pointer group hover:border-[#dc2626] transition-all shadow-2xs flex flex-col sm:flex-row"
                    >
                      <div className="relative aspect-video sm:w-56 shrink-0 bg-slate-950">
                        <ScopeVisual type={show.imageType} className="w-full h-full" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#dc2626] text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex flex-col justify-between">
                        <div>
                          <div className="text-[11px] text-[#dc2626] font-bold mb-1">{show.subtitle}</div>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-[#dc2626] transition-colors mb-1.5">
                            {show.title}
                          </h3>
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                            {show.description}
                          </p>
                        </div>
                        <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span>تقديم: {show.host}</span>
                          <span>{show.episodeCount} حلقة</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : currentTab === 'about' ? (
              /* Dedicated About View */
              <div className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-10 space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <span className="text-[#dc2626] font-black text-2xl">|</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white">عن SCOPE MEDIA</h2>
                </div>
                <p className="text-base leading-relaxed text-slate-700 dark:text-slate-300">
                  منصة إعلامية رقمية رائدة تنطلق من قلب العالم العربي، متخصصة في تقديم صحافة استقصائية رصينة، وتغطيات إخبارية فورية، وتحليلات معمقة تتجاوز العناوين السطحية إلى استكشاف الدوافع والنتائج والتأثيرات المستقبلية.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
                  <div className="p-4 bg-slate-50 dark:bg-[#182339] rounded-lg border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-[#dc2626] mb-1">الرؤية</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">بناء وعي معرفي حر وتقديم المعلومة الدقيقة بمصداقية مطلقة واستقلالية مهنية كاملة.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-[#182339] rounded-lg border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-[#dc2626] mb-1">الرسالة</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">تمكين الجمهور العربي من فهم التحولات الجيوسياسية والاقتصادية المعقدة بأحدث تقنيات السرد الرقمي.</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-[#182339] rounded-lg border border-slate-200 dark:border-slate-800">
                    <h4 className="font-bold text-sm text-[#dc2626] mb-1">القيم</h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">الدقة، النزاهة، الجرأة في البحث عن الحقيقة، واحترام عقل المشاهد والقارئ العربي.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* Category Filtered Articles View with Direct SEO Links */
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categoryFilteredArticles.map((art) => (
                    <Link
                      key={art.id}
                      href={`/news/${art.id}`}
                      className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden cursor-pointer group hover:border-[#dc2626] dark:hover:border-slate-600 transition-all shadow-2xs flex flex-col justify-between block"
                    >
                      <div>
                        <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                          <ScopeVisual
                            type={art.imageType}
                            className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-3.5 space-y-1.5">
                          <span className="text-[11px] font-bold text-[#dc2626] dark:text-rose-400 block">
                            {art.category}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white group-hover:text-[#dc2626] dark:group-hover:text-rose-400 transition-colors leading-snug line-clamp-2">
                            {art.title}
                          </h3>
                          {art.subtitle && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                              {art.subtitle}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="p-3.5 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{art.date}</span>
                        </div>
                        {art.author && <span>{art.author.name}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Left Sidebar */}
          <div className="w-full xl:col-span-3 order-2 xl:order-2">
            <ScopeSidebar
              onSelectTag={handleSelectTag}
              onViewAllNews={() => {
                setCurrentTab('news');
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>

        {/* Full-Width Exclusive Programs Row (Extends across 100% width of the page on Computer) */}
        {currentTab === 'home' && (
          <div className="pt-4">
            <ScopeProgramsRow
              onOpenShow={(show) => setSelectedShow(show)}
              onViewAllShows={() => {
                setCurrentTab('programs');
                if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </main>

      {/* 3. Footer */}
      <ScopeFooter onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* 4. Live Broadcast Modal */}
      <ScopeLiveModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
      />

      {/* 5. Show Player Modal */}
      <ScopeShowModal
        show={selectedShow}
        onClose={() => setSelectedShow(null)}
      />

      {/* 6. Search and Navigation Drawer */}
      <ScopeSearchDrawer
        isSearchOpen={isSearchOpen}
        onCloseSearch={() => setIsSearchOpen(false)}
        isMenuOpen={isMenuOpen}
        onCloseMenu={() => setIsMenuOpen(false)}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenLive={() => setIsLiveOpen(true)}
        currentTab={currentTab}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-[#0b1b36] text-white text-xs font-semibold py-2.5 px-5 rounded-full shadow-xl border border-stone-700 animate-in fade-in slide-in-from-bottom-2 duration-150 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#be123c]"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
