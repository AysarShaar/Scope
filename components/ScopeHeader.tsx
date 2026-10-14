'use client';

import React, { useState, useEffect } from 'react';
import Link from './NavLink';
import { useRouter } from 'next/navigation';
import { Search, Globe, X, Radio } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ScopeLogo } from './ScopeLogo';
import { ScopeBreakingTicker } from './ScopeBreakingTicker';
import { BreakingItem } from '../data/scopeData';
import { newsService } from '../services/newsService';

export const getNavHref = (id: string): string => {
  if (id === 'home') return '/';
  if (id === 'programs') return '/programs';
  if (id === 'videos') return '/videos';
  return `/category/${id}`;
};

interface ScopeHeaderProps {
  currentTab: string;
  onSelectTab?: (tab: string) => void;
  onOpenLive: () => void;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  currentLang?: 'AR' | 'EN';
  onToggleLang?: () => void;
  breakingNews?: BreakingItem[];
  initialSearchQuery?: string;
}

export const ScopeHeader: React.FC<ScopeHeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenLive,
  currentLang: propLang,
  onToggleLang: propToggleLang,
  breakingNews,
  initialSearchQuery,
}) => {
  const router = useRouter();
  const { lang: ctxLang, toggleLang: ctxToggleLang, t, dir } = useLanguage();
  const currentLang = propLang || ctxLang;
  const onToggleLang = propToggleLang || ctxToggleLang;

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [internalBreaking, setInternalBreaking] = useState<BreakingItem[]>([]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  useEffect(() => {
    // The server already sent the ticker (even an empty one): don't spend another request on /api/breaking.
    if (breakingNews !== undefined) return;
    let isMounted = true;
    newsService.getBreakingNews().then((data) => {
      if (isMounted && data && data.length > 0) {
        setInternalBreaking(data);
      }
    }).catch(() => { });
    return () => {
      isMounted = false;
    };
  }, [breakingNews]);

  const activeBreakingNews = (breakingNews && breakingNews.length > 0) ? breakingNews : internalBreaking;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;
    setMobileSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  const navItems = [
    { id: 'home', label: t.nav.home },
    { id: 'news', label: t.nav.news },
    { id: 'economy', label: t.nav.economy },
    { id: 'culture', label: t.nav.culture },
    { id: 'society', label: t.nav.society },
    { id: 'science', label: t.nav.science },
    { id: 'programs', label: t.nav.programs },
    { id: 'videos', label: t.nav.videos },
  ];

  return (
    <>
      <header className="w-full select-none rounded-none rounded-t-none relative z-30 overflow-hidden">
        <div className="relative z-30 bg-[#ebf3fa] dark:bg-[#0c1828] rounded-none rounded-t-none border-none py-2.5 sm:py-4 px-2.5 sm:px-6 min-h-[76px] sm:min-h-[104px] flex items-center overflow-hidden">
          <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-none rounded-t-none">
            <div
              className={`absolute inset-0 bg-cover opacity-90 sm:opacity-95 rounded-none rounded-t-none transition-all duration-300 ${
                dir === 'rtl' ? 'bg-left-bottom scale-x-100' : 'bg-right-bottom -scale-x-100'
              }`}
              style={{
                backgroundImage: `url('/header-skyline.avif')`,
                backgroundPosition: dir === 'rtl' ? 'left bottom' : 'right bottom',
              }}
            />
            <div
              className={`absolute inset-0 ${
                dir === 'rtl' ? 'bg-gradient-to-l' : 'bg-gradient-to-r'
              } rtl:bg-gradient-to-l ltr:bg-gradient-to-r from-[#ebf3fa]/95 via-[#ebf3fa]/70 to-transparent dark:from-[#0c1828]/95 dark:via-[#0c1828]/70 dark:to-transparent`}
            />
            <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          <div className="relative z-10 w-full max-w-[1480px] mx-auto min-h-[44px] flex items-center">
            {mobileSearchOpen ? (
              <div className="sm:hidden w-full flex items-center gap-2 py-1 px-1 animate-in fade-in zoom-in-95 duration-150">
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setMobileSearchOpen(false);
                  }}
                  className="flex-1 flex items-center gap-1.5"
                  role="search"
                >
                  <div className="flex-1 h-9.5 px-3.5 rounded-full border border-stone-400/40 dark:border-stone-600/40 bg-white/95 dark:bg-stone-900/95 focus-within:border-[#A42424] dark:focus-within:border-[#A42424] focus-within:ring-2 focus-within:ring-[#A42424]/20 shadow-md flex items-center">
                    <Search className="w-4 h-4 text-stone-500 dark:text-stone-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.header.searchPlaceholder}
                      autoFocus
                      className="w-full bg-transparent border-none outline-none text-xs text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400 px-2 py-1"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 rounded-full cursor-pointer shrink-0"
                        title="مسح"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="h-9 px-3.5 bg-[#A42424] hover:bg-[#8B1E1E] text-white text-xs font-bold rounded-full transition-colors cursor-pointer shrink-0 shadow-sm"
                  >
                    {dir === 'rtl' ? 'بحث' : 'Search'}
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  className="h-9 w-9 rounded-full bg-[#0F4468] hover:bg-[#145785] active:scale-95 text-white border border-[#0d3b5b] flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
                  title="إلغاء البحث"
                  aria-label="إلغاء البحث"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : null}

            <div className={`w-full flex items-center justify-between gap-1 sm:gap-4 md:gap-6 ${mobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
              <div className="flex items-center shrink-0 self-start pt-3 sm:pt-4 ms-0.5 sm:ms-3">
                <Link
                  href="/"
                  prefetch={false}
                  onClick={() => onSelectTab && onSelectTab('home')}
                  className="flex items-center group cursor-pointer focus:outline-none"
                  aria-label="SCOPE MEDIA"
                >
                  <ScopeLogo className="h-8 sm:h-10 md:h-11 lg:h-13 w-auto" animated={true} />
                </Link>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="hidden sm:flex flex-1 max-w-xl lg:max-w-2xl mx-2 sm:mx-4 lg:mx-6"
                role="search"
              >
                <div className="w-full h-9 lg:h-10 px-3.5 sm:px-4 rounded-full border border-stone-400/40 dark:border-stone-600/40 bg-white/40 focus-within:bg-white/95 dark:bg-stone-900/40 dark:focus-within:bg-stone-900/90 focus-within:border-[#A42424] dark:focus-within:border-[#A42424] focus-within:ring-2 focus-within:ring-[#A42424]/20 backdrop-blur-md transition-all flex items-center shadow-2xs group">
                  <button
                    type="submit"
                    className="text-stone-500 dark:text-stone-400 hover:text-[#A42424] dark:hover:text-[#A42424] transition-colors shrink-0 cursor-pointer p-1"
                    title={t.header.searchPlatform || 'بحث'}
                    aria-label={t.header.searchPlatform || 'بحث'}
                  >
                    <Search className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.header.searchPlaceholder}
                    className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-stone-900 dark:text-white placeholder-stone-500 dark:placeholder-stone-400 px-2.5 py-1"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 rounded-full cursor-pointer shrink-0"
                      title="مسح"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </form>

              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                <button
                  onClick={onOpenLive}
                  className="h-8 sm:h-9 px-2 sm:px-4 bg-[#A42424] hover:bg-[#8B1E1E] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shrink-0 shadow-sm"
                  title={t.header.watchLive}
                >
                  <Radio className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white animate-pulse shrink-0 drop-shadow-xs" />
                  <span className="whitespace-nowrap tracking-tight font-bold text-[11px] sm:text-sm">
                    {t.header.liveStream}
                  </span>
                </button>

                <button
                  onClick={() => setMobileSearchOpen(true)}
                  className="sm:hidden h-8 w-8 rounded-lg bg-[#0F4468] hover:bg-[#145785] active:scale-95 text-white border border-[#0d3b5b] flex items-center justify-center cursor-pointer transition-all shrink-0 shadow-xs"
                  title={t.header.searchPlatform}
                  aria-label={t.header.searchPlatform}
                >
                  <Search className="w-3.5 h-3.5 text-white" />
                </button>

                <button
                  onClick={onToggleLang}
                  className="h-8 sm:h-9 px-2 sm:px-3 rounded-lg bg-[#0F4468] hover:bg-[#145785] active:scale-95 text-white border border-[#0d3b5b] text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer shadow-xs shrink-0 select-none notranslate"
                  translate="no"
                  title={t.header.switchLangTitle}
                  aria-label={t.header.switchLangTitle}
                >
                  <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-100 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-mono font-bold tracking-wider text-white">
                    {currentLang}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <nav
        className="w-full bg-[#0F4468] border-b border-[#0b334f] text-white relative shadow-xs"
        dir={dir}
        aria-label="Sub-navigation"
      >
        <div className="max-w-[1480px] mx-auto">
          <div className="w-full flex flex-row flex-nowrap items-center justify-start gap-4 sm:gap-6 py-0 px-4 sm:px-6 overflow-x-auto no-scrollbar scroll-smooth overscroll-x-contain">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              const href = getNavHref(item.id);
              return (
                <Link
                  key={item.id}
                  href={href}
                  prefetch={false}
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                  className={`text-[14px] sm:text-base md:text-sm font-bold md:font-semibold whitespace-nowrap shrink-0 flex-shrink-0 px-1 py-2.5 sm:py-3 transition-colors cursor-pointer relative inline-flex items-center ${
                    isActive ? 'text-white' : 'text-blue-100/80 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#A42424] rounded-full"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div
        className="sticky top-0 z-50 w-full shadow-sm bg-white dark:bg-[#0c1828]"
        style={{ position: 'sticky', top: 0, zIndex: 50 }}
      >
        <ScopeBreakingTicker items={activeBreakingNews} />
      </div>
    </>
  );
};