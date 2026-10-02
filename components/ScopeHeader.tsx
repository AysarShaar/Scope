'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, ChevronDown, Menu, Globe, Youtube, Facebook, Instagram } from 'lucide-react';

interface ScopeHeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenLive: () => void;
  onOpenSearch: () => void;
  onOpenMobileMenu: () => void;
  currentLang: 'AR' | 'EN';
  onToggleLang: () => void;
}

export const ScopeHeader: React.FC<ScopeHeaderProps> = ({
  currentTab,
  onSelectTab,
  onOpenLive,
  onOpenSearch,
  onOpenMobileMenu,
  currentLang,
  onToggleLang,
}) => {
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [mobileNewsDropdownOpen, setMobileNewsDropdownOpen] = useState(false);
  const newsDropdownRef = useRef<HTMLDivElement>(null);
  const newsButtonRef = useRef<HTMLButtonElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: 'home', label: 'الرئيسية', mobile: true },
    { id: 'news', label: 'الأخبار', mobile: true },
    { id: 'region', label: 'إقليمي', mobile: false },
    { id: 'world', label: 'دولي', mobile: false },
    { id: 'economy', label: 'اقتصاد', mobile: false },
    { id: 'politics', label: 'سياسة', mobile: false },
    { id: 'society', label: 'مجتمع', mobile: false },
    { id: 'culture', label: 'ثقافة', mobile: false },
    { id: 'investigations', label: 'تحقيقات', mobile: false },
    { id: 'programs', label: 'برامج', mobile: false },
    { id: 'videos', label: 'فيديوهات', mobile: true },
    { id: 'about', label: 'من نحن', mobile: true },
  ];

  const mobileHiddenCategories = [
    { id: 'region', label: 'إقليمي' },
    { id: 'world', label: 'دولي' },
    { id: 'economy', label: 'اقتصاد' },
    { id: 'politics', label: 'سياسة' },
    { id: 'society', label: 'مجتمع' },
    { id: 'culture', label: 'ثقافة' },
    { id: 'investigations', label: 'تحقيقات' },
    { id: 'programs', label: 'برامج' },
  ];

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      // Close mobile news dropdown if clicked outside both dropdown and the toggle button
      if (
        newsDropdownRef.current &&
        !newsDropdownRef.current.contains(target) &&
        newsButtonRef.current &&
        !newsButtonRef.current.contains(target)
      ) {
        setMobileNewsDropdownOpen(false);
      }
      // Close language dropdown if clicked outside
      if (langDropdownRef.current && !langDropdownRef.current.contains(target)) {
        setLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, []);

  return (
    <header className="w-full select-none rounded-none rounded-t-none relative z-50">
      {/* 1. Main Brand Masthead with Dubai Towers Skyline Backdrop - z-50 to keep language dropdown above sticky nav */}
      <div className="relative z-50 bg-[#ebf3fa] dark:bg-[#0c1828] rounded-none rounded-t-none border-none py-3 sm:py-4 px-3 sm:px-6 min-h-[90px] sm:min-h-[104px] flex items-center">
        {/* Authentic Dubai Burj Khalifa & Skyscrapers Skyline Background */}
        <div className="absolute inset-0 pointer-events-none select-none overflow-hidden rounded-none rounded-t-none">
          {/* Dubai Towers Skyline with responsive focal point anchoring the towers */}
          <div
            className="absolute inset-0 bg-cover bg-[center_38%] sm:bg-[center_36%] opacity-90 sm:opacity-95 rounded-none rounded-t-none transition-all duration-300"
            style={{
              backgroundImage: `url('https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=85')`,
            }}
          />
          {/* Gentle soft fade behind right-hand text to guarantee razor-sharp legibility without covering the towers */}
          <div className="absolute inset-0 bg-gradient-to-l from-[#ebf3fa]/95 via-[#ebf3fa]/70 to-transparent dark:from-[#0c1828]/95 dark:via-[#0c1828]/70 dark:to-transparent" />
          {/* Subtle bottom transition meeting dark navigation bar */}
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-[1480px] mx-auto flex items-center justify-between gap-2 sm:gap-4 md:gap-6">
          {/* Right: Brand Wordmark (Clean logo without slogan) */}
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-1.5 group cursor-pointer focus:outline-none"
            >
              <div className="flex flex-col items-center">
                <span className="font-black text-2xl sm:text-3xl md:text-4xl tracking-tighter text-[#0a1a30] dark:text-white font-sans uppercase leading-none drop-shadow-2xs">
                  SCOPE
                </span>
                <div className="flex items-center gap-1 w-full justify-center mt-0.5">
                  <span className="w-2.5 sm:w-3 h-[1.5px] bg-[#dc2626]"></span>
                  <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#dc2626] uppercase leading-none">
                    MEDIA
                  </span>
                  <span className="w-2.5 sm:w-3 h-[1.5px] bg-[#dc2626]"></span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center: Extended Search Bar with Modern Glassmorphic Transparency (Visible on tablet & desktop) */}
          <div className="hidden sm:flex flex-1 max-w-xl lg:max-w-2xl mx-2 sm:mx-4 lg:mx-6">
            <div
              onClick={onOpenSearch}
              className="w-full h-9 lg:h-10 px-4 rounded-full border border-stone-400/40 dark:border-stone-600/40 bg-white/30 hover:bg-white/45 dark:bg-stone-900/35 dark:hover:bg-stone-900/50 backdrop-blur-md transition-all flex items-center cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2.5 text-stone-700 dark:text-stone-200 text-xs truncate">
                <Search className="w-4 h-4 text-stone-500 dark:text-stone-400 group-hover:text-[#dc2626] transition-colors shrink-0" />
                <span className="truncate">ابحث في الأخبار، التحقيقات والتقارير...</span>
              </div>
            </div>
          </div>

          {/* Left: Action Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Live Broadcast Button with Professional Broadcast Red (#dc2626) */}
            <button
              onClick={onOpenLive}
              className="h-8 sm:h-9 px-2.5 sm:px-4 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white font-bold text-xs sm:text-sm rounded-full flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              title="مشاهدة البث المباشر"
            >
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white animate-ping"></span>
              <span className="whitespace-nowrap">
                <span className="hidden sm:inline">بث </span>مباشر
              </span>
            </button>

            {/* Mobile Search Icon Button in Elegant Navy Blue (Shown only on small mobile < 640px) */}
            <button
              onClick={onOpenSearch}
              className="sm:hidden h-8 w-8 rounded-full bg-[#0a1b32] hover:bg-[#122846] active:bg-[#081528] text-white border border-[#0a1b32] flex items-center justify-center cursor-pointer transition-colors shrink-0 shadow-xs"
              title="بحث في المنصة"
              aria-label="بحث في المنصة"
            >
              <Search className="w-3.5 h-3.5 text-white" />
            </button>

            {/* Language Switcher in Elegant Navy Blue */}
            <div ref={langDropdownRef} className="relative shrink-0 z-50">
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-[#0a1b32] hover:bg-[#122846] active:bg-[#081528] text-white border border-[#0a1b32] text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-xs"
                title="تغيير اللغة"
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-300 shrink-0" />
                <span className="text-[11px] sm:text-xs text-white">{currentLang}</span>
                <ChevronDown className="w-3 h-3 text-stone-300 hidden sm:inline" />
              </button>

              {langDropdownOpen && (
                <div className="absolute left-0 rtl:left-0 rtl:right-auto ltr:right-0 ltr:left-auto top-full mt-2 w-36 bg-[#0a1b32] border border-stone-700/80 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in duration-100">
                  <button
                    onClick={() => {
                      if (currentLang !== 'AR') onToggleLang();
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-right px-3.5 py-1.5 text-xs text-stone-200 hover:bg-[#152e54] hover:text-white font-semibold flex items-center justify-between"
                  >
                    <span>العربية</span>
                    <span className="text-[10px] text-stone-400 font-mono">AR</span>
                  </button>
                  <button
                    onClick={() => {
                      if (currentLang !== 'EN') onToggleLang();
                      setLangDropdownOpen(false);
                    }}
                    className="w-full text-right px-3.5 py-1.5 text-xs text-stone-200 hover:bg-[#152e54] hover:text-white flex items-center justify-between"
                  >
                    <span>English</span>
                    <span className="text-[10px] text-stone-400 font-mono">EN</span>
                  </button>
                </div>
              )}
            </div>

            {/* Menu Hamburger Button in Elegant Navy Blue */}
            <button
              onClick={onOpenMobileMenu}
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-[#0a1b32] hover:bg-[#122846] active:bg-[#081528] text-white border border-[#0a1b32] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
              title="القائمة"
              aria-label="القائمة"
            >
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Secondary Main Navigation Strip (z-30 ensures masthead language dropdown z-50 displays on top) */}
      <nav className="w-full bg-[#07152b] text-white border-none sticky top-0 z-30 shadow-sm relative rounded-t-none rounded-b-2xl md:rounded-b-none">
        <div className="max-w-[1480px] mx-auto px-3 sm:px-6 rounded-t-none rounded-b-2xl md:rounded-b-none flex items-center justify-between border-none">
          <div className="w-full flex items-center justify-center md:justify-start gap-2 sm:gap-4 md:gap-5 lg:gap-6 py-0 overflow-x-auto no-scrollbar">
            {navItems.map((item) => {
              const isActive =
                currentTab === item.id ||
                (item.id === 'news' && mobileHiddenCategories.some((c) => c.id === currentTab));

              if (item.id === 'news') {
                return (
                  <div
                    key={item.id}
                    className="relative shrink-0"
                  >
                    <button
                      ref={newsButtonRef}
                      onClick={(e) => {
                        e.stopPropagation();
                        // On mobile: toggle dropdown cleanly
                        setMobileNewsDropdownOpen((prev) => !prev);
                      }}
                      className={`text-[14px] sm:text-base md:text-sm font-bold md:font-semibold whitespace-nowrap px-2 sm:px-3 md:px-2.5 py-2.5 sm:py-3 transition-colors cursor-pointer relative flex items-center gap-1 sm:gap-1.5 ${
                        isActive ? 'text-white' : 'text-stone-300 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 inline md:hidden transition-transform duration-200 ${
                          mobileNewsDropdownOpen ? 'rotate-180 text-[#dc2626]' : 'text-stone-400'
                        }`}
                      />
                      {isActive && (
                        <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#dc2626] rounded-full"></span>
                      )}
                    </button>
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`text-[14px] sm:text-base md:text-sm font-bold md:font-semibold whitespace-nowrap px-2 sm:px-3 md:px-2.5 py-2.5 sm:py-3 transition-colors cursor-pointer relative shrink-0 ${
                    item.mobile ? 'inline-block' : 'hidden md:inline-block'
                  } ${
                    isActive
                      ? 'text-white'
                      : 'text-stone-300 hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[3px] bg-[#dc2626] rounded-full"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Social Media Icons on the left of nav strip as in reference screenshot */}
          <div className="hidden lg:flex items-center gap-3.5 text-stone-300 shrink-0 pl-2">
            <span className="hover:text-white transition-colors cursor-pointer" title="YouTube">
              <Youtube className="w-4 h-4" />
            </span>
            <span className="hover:text-white transition-colors cursor-pointer text-xs font-bold font-sans" title="X">
              𝕏
            </span>
            <span className="hover:text-white transition-colors cursor-pointer" title="Facebook">
              <Facebook className="w-4 h-4" />
            </span>
            <span className="hover:text-white transition-colors cursor-pointer" title="Instagram">
              <Instagram className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Mobile Dropdown Menu for News Categories - Rendered outside overflow-x-auto so it is NEVER clipped */}
        {mobileNewsDropdownOpen && (
          <div
            ref={newsDropdownRef}
            className="md:hidden absolute top-full inset-x-2 sm:inset-x-4 mt-1.5 bg-[#0b172a]/95 backdrop-blur-md border border-stone-700/80 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-stone-400 border-b border-stone-800/80 mb-2">
              <span className="flex items-center gap-2">
                <span>أقسام وتصنيفات الأخبار</span>
                <span className="text-[10px] text-stone-500 font-mono bg-stone-900/60 px-1.5 py-0.5 rounded">8 أقسام</span>
              </span>
              <button
                type="button"
                onClick={() => setMobileNewsDropdownOpen(false)}
                className="text-[11px] text-stone-400 hover:text-white px-2 py-0.5 rounded-md bg-stone-800/80 hover:bg-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>إغلاق</span>
                <span className="font-bold text-xs">✕</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {mobileHiddenCategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => {
                    onSelectTab(sub.id);
                    setMobileNewsDropdownOpen(false);
                  }}
                  className={`text-right px-3 py-2 text-xs rounded-xl transition-all flex items-center justify-between cursor-pointer ${
                    currentTab === sub.id
                      ? 'bg-[#dc2626] text-white font-bold shadow-xs'
                      : 'text-stone-200 hover:bg-[#152a4e] hover:text-white'
                  }`}
                >
                  <span>{sub.label}</span>
                  {currentTab === sub.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
