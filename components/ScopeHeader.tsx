'use client';

import React, { useState, useEffect } from 'react';
import Link from './NavLink';
import { useRouter } from 'next/navigation';
import {
  Search,
  Globe,
  X,
  Radio,
  Menu,
  Phone,
  Mail,
  User,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { ScopeLogo } from './ScopeLogo';
import { ScopeBreakingTicker } from './ScopeBreakingTicker';
import { BreakingItem } from '../data/scopeData';
import { newsService } from '../services/newsService';

export const getNavHref = (id: string): string => {
  if (id === 'home') return '/';
  if (id === 'popular') return '/category/news';
  if (id === 'politic' || id === 'politics') return '/category/politics';
  if (id === 'technology' || id === 'science') return '/category/science';
  if (id === 'lifestyle' || id === 'society') return '/category/society';
  if (id === 'business' || id === 'economy') return '/category/economy';
  if (id === 'sporty' || id === 'sport' || id === 'world') return '/category/world';
  if (id === 'entertainment' || id === 'culture') return '/category/culture';
  if (id === 'contact' || id === 'about') return '/about';
  if (id === 'programs') return '/programs';
  if (id === 'videos') return '/videos';
  return `/category/${id}`;
};

interface ScopeHeaderProps {
  currentTab?: string;
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
  currentTab = 'home',
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [internalBreaking, setInternalBreaking] = useState<BreakingItem[]>([]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

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
    setMobileMenuOpen(false);
    router.push(`/search?q=${encodeURIComponent(cleanQuery)}`);
  };

  // Nav menus matching mockup exactly:
  // Left: Popular, Politic, Technology, Lifestyle
  // Right: Business, Sporty, Entertainment, Contact
  const leftNavItems = [
    {
      id: 'popular',
      label: currentLang === 'AR' ? 'رائجة' : 'Popular',
      href: '/category/news',
    },
    {
      id: 'politic',
      label: currentLang === 'AR' ? 'سياسة' : 'Politic',
      href: '/category/politics',
    },
    {
      id: 'technology',
      label: currentLang === 'AR' ? 'تكنولوجيا' : 'Technology',
      href: '/category/science',
    },
    {
      id: 'lifestyle',
      label: currentLang === 'AR' ? 'لايف ستايل' : 'Lifestyle',
      href: '/category/society',
    },
  ];

  const rightNavItems = [
    {
      id: 'business',
      label: currentLang === 'AR' ? 'اقتصاد' : 'Business',
      href: '/category/economy',
    },
    {
      id: 'sporty',
      label: currentLang === 'AR' ? 'رياضة' : 'Sporty',
      href: '/category/world',
    },
    {
      id: 'entertainment',
      label: currentLang === 'AR' ? 'ترفيه' : 'Entertainment',
      href: '/category/culture',
    },
    {
      id: 'contact',
      label: currentLang === 'AR' ? 'تواصل معنا' : 'Contact',
      href: '/about',
    },
  ];

  const allNavItems = [
    { id: 'home', label: t.nav.home, href: '/' },
    ...leftNavItems,
    ...rightNavItems,
    { id: 'programs', label: t.nav.programs, href: '/programs' },
    { id: 'videos', label: t.nav.videos, href: '/videos' },
  ];

  return (
    <>
      <header className="w-full bg-[#0a1526] text-white select-none relative z-40 transition-colors duration-200">
        {/* Top utility subheader bar (Desktop only - as in Image 3) */}
        <div className="hidden md:block w-full border-b border-white/10 bg-[#07101e]/90 backdrop-blur-md text-xs text-slate-300">
          <div className="max-w-[1480px] mx-auto px-4 sm:px-6 h-9 flex items-center justify-between">
            {/* Left utilities */}
            <div className="flex items-center gap-4 lg:gap-6">
              {/* Search Toggle */}
              <button
                type="button"
                onClick={() => setDesktopSearchOpen(!desktopSearchOpen)}
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1"
                aria-label="Search"
              >
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentLang === 'AR' ? 'بحث' : 'Search'}</span>
              </button>

              {/* Log in / Register */}
              <Link
                href="/admin"
                className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer py-1"
              >
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {currentLang === 'AR' ? 'تسجيل الدخول / حساب' : 'Log in/Register'}
                </span>
              </Link>

              {/* Language Switcher Dropdown */}
              <button
                type="button"
                onClick={onToggleLang}
                className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer py-1 font-semibold"
                title={t.header.switchLangTitle}
              >
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentLang}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 opacity-80" />
              </button>
            </div>

            {/* Right utilities */}
            <div className="flex items-center gap-5 lg:gap-7 text-[11px] text-slate-400 font-sans font-medium">
              <a
                href="tel:+1234567880"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span dir="ltr">+123-456-7880</span>
              </a>

              <a
                href="mailto:info@newsbeat.com"
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span dir="ltr">info@newsbeat.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Desktop Search Bar (Expandable) */}
        {desktopSearchOpen && (
          <div className="hidden md:block w-full bg-[#0a1526] border-b border-white/10 px-6 py-2.5 animate-in slide-in-from-top-2 duration-150">
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

        {/* Main Navbar */}
        <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6">
          {/* Mobile Header (Image 1: Hamburger Left, Logo Center, Search Right) */}
          <div className="md:hidden flex items-center justify-between h-14">
            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-white hover:text-slate-300 transition-colors cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo in Center */}
            <Link
              href="/"
              onClick={() => onSelectTab && onSelectTab('home')}
              className="flex items-center justify-center"
              aria-label="SCOPE MEDIA"
            >
              <ScopeLogo variant="white" animated={true} className="h-7 w-auto" />
            </Link>

            {/* Search Icon */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="p-1.5 -mr-1 text-white hover:text-slate-300 transition-colors cursor-pointer"
              aria-label="Open search"
            >
              <Search className="w-5 h-5" />
            </button>
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

          {/* Desktop Navigation (Image 3: Left Menu - Centered Logo - Right Menu) */}
          <div className="hidden md:flex items-center justify-between h-16 lg:h-18">
            {/* Left Nav Menu */}
            <nav className="flex items-center gap-4 lg:gap-6 flex-1 justify-end pe-4 lg:pe-8">
              {leftNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => onSelectTab && onSelectTab(item.id)}
                    className={`text-xs lg:text-sm font-semibold tracking-wide transition-colors hover:text-white cursor-pointer relative py-1 ${
                      isActive ? 'text-white' : 'text-slate-200/85'
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

            {/* Centered SCOPE MEDIA Logo */}
            <div className="shrink-0 px-2 lg:px-4">
              <Link
                href="/"
                onClick={() => onSelectTab && onSelectTab('home')}
                className="flex items-center group cursor-pointer focus:outline-none"
                aria-label="SCOPE MEDIA"
              >
                <ScopeLogo
                  variant="white"
                  animated={true}
                  className="h-9 lg:h-11 w-auto drop-shadow-sm"
                />
              </Link>
            </div>

            {/* Right Nav Menu + Live Stream CTA */}
            <nav className="flex items-center gap-4 lg:gap-6 flex-1 justify-start ps-4 lg:ps-8">
              {rightNavItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => onSelectTab && onSelectTab(item.id)}
                    className={`text-xs lg:text-sm font-semibold tracking-wide transition-colors hover:text-white cursor-pointer relative py-1 ${
                      isActive ? 'text-white' : 'text-slate-200/85'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-1 inset-x-0 h-[2px] bg-[#A42424] rounded-full" />
                    )}
                  </Link>
                );
              })}

              {/* Watch Live button */}
              <button
                type="button"
                onClick={onOpenLive}
                className="ms-auto h-8 px-3 rounded-full bg-[#A42424] hover:bg-[#8B1E1E] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>{t.header.liveStream}</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Drawer (When Hamburger is clicked) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-[82%] max-w-sm h-full bg-[#0a1526] text-white p-5 flex flex-col justify-between overflow-y-auto animate-in ${
              dir === 'rtl' ? 'slide-in-from-right' : 'slide-in-from-left'
            } duration-200`}
            dir={dir}
          >
            <div className="space-y-6">
              {/* Header with logo & close */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <ScopeLogo variant="white" className="h-7 w-auto" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Drawer Search Form */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.header.searchPlaceholder}
                  className="w-full bg-white/10 border border-white/15 rounded-full py-2 ps-9 pe-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#A42424]"
                />
              </form>

              {/* Navigation items list */}
              <nav className="space-y-1 pt-1">
                {allNavItems.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onSelectTab) onSelectTab(item.id);
                    }}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              {/* Live Broadcast Button */}
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenLive();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#A42424] hover:bg-[#8B1E1E] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>{t.header.liveStream}</span>
              </button>
            </div>

            {/* Bottom utilities in drawer */}
            <div className="pt-6 border-t border-white/10 space-y-3 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={onToggleLang}
                  className="flex items-center gap-1.5 py-1 text-white hover:text-blue-300"
                >
                  <Globe className="w-4 h-4" />
                  <span>{currentLang === 'AR' ? 'English' : 'العربية'}</span>
                </button>

                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-1.5 py-1 text-white hover:text-blue-300"
                >
                  <User className="w-4 h-4" />
                  <span>
                    {currentLang === 'AR' ? 'بوابة المحررين' : 'Admin Portal'}
                  </span>
                </Link>
              </div>

              <div className="space-y-1 text-[11px] pt-1 border-t border-white/5">
                <p className="flex items-center gap-2 text-slate-400">
                  <Phone className="w-3.5 h-3.5" />
                  <span dir="ltr">+123-456-7880</span>
                </p>
                <p className="flex items-center gap-2 text-slate-400">
                  <Mail className="w-3.5 h-3.5" />
                  <span dir="ltr">info@newsbeat.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Breaking Ticker Bar */}
      <div className="sticky top-0 z-30 w-full shadow-sm bg-white dark:bg-[#0c1828]">
        <ScopeBreakingTicker items={activeBreakingNews} />
      </div>
    </>
  );
};