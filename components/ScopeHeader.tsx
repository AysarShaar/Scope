'use client';

import React, { useState, useEffect } from 'react';
import Link from './NavLink';
import { useRouter } from 'next/navigation';
import {
  Search,
  Globe,
  X,
  Radio,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ScopeLogo } from './ScopeLogo';
import { ScopeBreakingTicker } from './ScopeBreakingTicker';
import { BreakingItem } from '../data/scopeData';
import { newsService } from '../services/newsService';

export const getNavHref = (id: string): string => {
  if (id === 'home') return '/';
  if (id === 'programs') return '/programs';
  if (id === 'videos') return '/videos';
  if (id === 'about') return '/about';
  return `/category/${id}`;
};

export interface ScopeHeaderProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  onOpenLive: () => void;
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  currentLang?: 'AR' | 'EN';
  onToggleLang?: () => void;
  breakingNews?: BreakingItem[];
  initialSearchQuery?: string;
  transparentOverlay?: boolean;
}

export const ScopeHeader: React.FC<ScopeHeaderProps> = ({
  currentTab = 'home',
  onSelectTab,
  onOpenLive,
  currentLang: propLang,
  onToggleLang: propToggleLang,
  breakingNews,
  initialSearchQuery,
  transparentOverlay = false,
}) => {
  const router = useRouter();
  const { lang: ctxLang, toggleLang: ctxToggleLang, t, dir } = useLanguage();
  const currentLang = propLang || ctxLang;
  const onToggleLang = propToggleLang || ctxToggleLang;

  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [internalBreaking, setInternalBreaking] = useState<BreakingItem[]>([]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Scroll listener for header & ticker states
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (breakingNews !== undefined) return;
    let isMounted = true;
    newsService
      .getBreakingNews()
      .then((data) => {
        if (isMounted && data && data.length > 0) {
          setInternalBreaking(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [breakingNews]);

  const activeBreakingNews =
    breakingNews && breakingNews.length > 0 ? breakingNews : internalBreaking;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim();
    if (!cleanQuery) return;
    setMobileSearchOpen(false);
    setDesktopSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  // Nav menus matching Desktop split layout with 8 sections:
  // 4 items on start side: Home, News, Economy, Culture
  // 4 items on end side: Society, Science, Programs, Videos
  const leftNavItems = [
    { id: 'home', label: t.nav.home, href: '/' },
    { id: 'news', label: t.nav.news, href: '/category/news' },
    { id: 'economy', label: t.nav.economy, href: '/category/economy' },
    { id: 'culture', label: t.nav.culture, href: '/category/culture' },
  ];

  const rightNavItems = [
    { id: 'society', label: t.nav.society, href: '/category/society' },
    { id: 'science', label: t.nav.science, href: '/category/science' },
    { id: 'programs', label: t.nav.programs, href: '/programs' },
    { id: 'videos', label: t.nav.videos, href: '/videos' },
  ];

  const allNavItems = [...leftNavItems, ...rightNavItems];

  // All 8 sections shown on mobile in one line
  const mobileNavItems = allNavItems;

  const hasTicker = Boolean(activeBreakingNews && activeBreakingNews.length > 0);

  // Dynamic header styling: overlaying hero or solid
  const headerContainerClass = transparentOverlay
    ? isScrolled
      ? `fixed top-0 inset-x-0 z-40 bg-[#0a1526]/85 backdrop-blur-md text-white transition-all duration-300 ${hasTicker ? '' : 'border-b border-white/10'}`
      : `absolute top-0 inset-x-0 z-40 bg-gradient-to-b from-black/80 via-black/40 to-transparent text-white transition-all duration-300 ${hasTicker ? '' : 'border-b border-white/10'}`
    : `sticky top-0 z-40 bg-[#0a1526]/90 backdrop-blur-md text-white transition-colors duration-200 ${hasTicker ? '' : 'border-b border-white/10'}`;

  return (
    <>
      <header className={headerContainerClass}>
        {/* Desktop Expandable Search Bar */}
        {desktopSearchOpen && (
          <div className="hidden md:block w-full bg-[#07101e]/95 backdrop-blur-md border-b border-white/10 px-6 py-2.5 animate-in slide-in-from-top-2 duration-150">
            <form
              onSubmit={handleSearchSubmit}
              className="max-w-2xl mx-auto flex items-center gap-2"
            >
              <div className="flex-1 h-9 px-3.5 rounded-full border border-white/20 bg-white/10 focus-within:bg-white/20 focus-within:border-[#A42424] flex items-center">
                <Search className="w-4 h-4 text-slate-300 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.header.searchPlaceholder}
                  autoFocus
                  className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-400 px-2 py-1"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="h-9 px-4 bg-[#A42424] hover:bg-[#8B1E1E] text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
              >
                {currentLang === 'AR' ? 'بحث' : 'Search'}
              </button>
              <button
                type="button"
                onClick={() => setDesktopSearchOpen(false)}
                className="h-9 w-9 rounded-full hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* Main Navbar Bar */}
        <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6">
          {/* Mobile Header Bar: Search & Lang on start side, Strictly Centered Logo, Live Stream on end side */}
          <div className="md:hidden relative flex items-center justify-between h-13 sm:h-14">
            {/* Start Side: Search & Language Toggle */}
            <div className="flex items-center gap-1 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors cursor-pointer"
                aria-label="Open search"
              >
                <Search className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onToggleLang}
                className="px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-colors cursor-pointer"
              >
                {currentLang}
              </button>
            </div>

            {/* Exactly Centered SCOPE MEDIA Logo */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 pointer-events-auto">
              <Link
                href="/"
                onClick={() => onSelectTab && onSelectTab('home')}
                className="flex items-center justify-center shrink-0 translate-y-1 sm:translate-y-1.5"
                aria-label="SCOPE MEDIA"
              >
                <ScopeLogo variant="white" animated={true} className="h-6 sm:h-7 w-auto drop-shadow-md" />
              </Link>
            </div>

            {/* End Side: Live Stream Button */}
            <div className="flex items-center shrink-0 z-10">
              <button
                type="button"
                onClick={onOpenLive}
                className="flex items-center gap-1 bg-[#A42424] hover:bg-[#8B1E1E] text-white text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full shadow-xs transition-colors cursor-pointer"
              >
                <Radio className="w-3 h-3 text-white animate-pulse" />
                <span>{t.header.liveStream}</span>
              </button>
            </div>
          </div>

          {/* Mobile Search input dropdown */}
          {mobileSearchOpen && (
            <div className="md:hidden py-2 pb-3 animate-in fade-in duration-150">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
                <div className="flex-1 h-9 px-3 rounded-full border border-white/20 bg-white/10 flex items-center">
                  <Search className="w-4 h-4 text-slate-300 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.header.searchPlaceholder}
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-slate-400 px-2 py-1"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="h-9 px-3.5 bg-[#A42424] text-white text-xs font-bold rounded-full cursor-pointer"
                >
                  {currentLang === 'AR' ? 'بحث' : 'Search'}
                </button>
              </form>
            </div>
          )}

          {/* Mobile Navigation Bar: All 8 sections fitted on one line */}
          <div className="md:hidden py-1.5 px-1.5 sm:px-3 overflow-x-hidden">
            <nav className="flex items-center justify-between w-full flex-nowrap text-center">
              {mobileNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => onSelectTab && onSelectTab(item.id)}
                    className={`text-[10px] min-[360px]:text-[11px] min-[400px]:text-[12px] font-semibold tracking-tight transition-colors py-0.5 px-0.5 relative whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'text-white font-bold'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-1 inset-x-0 h-[2px] bg-[#A42424] rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Navigation Bar: Exact Centered Logo & Nav flanked around it */}
          <div className="hidden md:flex items-center justify-between h-20 lg:h-24 relative">
            {/* Far Start Side: Search & Language Switcher */}
            <div className="flex items-center gap-2.5 lg:gap-3 shrink-0 z-10">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setDesktopSearchOpen(!desktopSearchOpen)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer"
                aria-label="Search"
                title={currentLang === 'AR' ? 'بحث' : 'Search'}
              >
                <Search className="w-4 h-4 text-white" />
              </button>

              {/* Language Switcher */}
              <button
                type="button"
                onClick={onToggleLang}
                className="h-8 px-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center gap-1 transition-all cursor-pointer text-xs font-bold"
                title={t.header.switchLangTitle}
              >
                <Globe className="w-3.5 h-3.5 text-white" />
                <span>{currentLang}</span>
              </button>
            </div>

            {/* Exactly Centered Navigation Block (Logo sits precisely at 50% midpoint of header) */}
            <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 flex items-center justify-center gap-3.5 lg:gap-6 xl:gap-8 z-20 pointer-events-auto">
              {/* Left Nav Menu (4 items) */}
              <nav className="flex items-center gap-3 lg:gap-5 xl:gap-7 justify-end whitespace-nowrap">
                {leftNavItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => onSelectTab && onSelectTab(item.id)}
                      className={`text-[14px] lg:text-[16px] xl:text-[17px] font-semibold tracking-wide transition-colors hover:text-white cursor-pointer relative py-1 ${
                        isActive ? 'text-white font-bold' : 'text-slate-200/90'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute -bottom-1 inset-x-0 h-[2.5px] bg-[#A42424] rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Centered SCOPE MEDIA Logo */}
              <div className="shrink-0 px-3 lg:px-5 xl:px-6 translate-y-1.5 lg:translate-y-2">
                <Link
                  href="/"
                  onClick={() => onSelectTab && onSelectTab('home')}
                  className="flex items-center group cursor-pointer focus:outline-none"
                  aria-label="SCOPE MEDIA"
                >
                  <ScopeLogo
                    variant="white"
                    animated={true}
                    className="h-8.5 lg:h-10 w-auto drop-shadow-md"
                  />
                </Link>
              </div>

              {/* Right Nav Menu (4 items) */}
              <nav className="flex items-center gap-3 lg:gap-5 xl:gap-7 justify-start whitespace-nowrap">
                {rightNavItems.map((item) => {
                  const isActive = currentTab === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={() => onSelectTab && onSelectTab(item.id)}
                      className={`text-[14px] lg:text-[16px] xl:text-[17px] font-semibold tracking-wide transition-colors hover:text-white cursor-pointer relative py-1 ${
                        isActive ? 'text-white font-bold' : 'text-slate-200/90'
                      }`}
                    >
                      <span>{item.label}</span>
                      {isActive && (
                        <span className="absolute -bottom-1 inset-x-0 h-[2.5px] bg-[#A42424] rounded-full" />
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Far End Side: Live Stream Button */}
            <div className="flex items-center justify-end shrink-0 z-10">
              <button
                type="button"
                onClick={onOpenLive}
                className="h-8 px-3.5 rounded-full bg-[#A42424] hover:bg-[#8B1E1E] active:scale-95 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>{t.header.liveStream}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Breaking News Ticker Bar directly under header */}
        {hasTicker && (
          <div className="w-full border-t border-white/10 bg-transparent">
            <ScopeBreakingTicker items={activeBreakingNews} />
          </div>
        )}
      </header>
    </>
  );
};
