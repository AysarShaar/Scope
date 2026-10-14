'use client';

import React, { useState, useMemo } from 'react';
import Link from './NavLink';
import { Search, X, Sun, Moon, Radio } from 'lucide-react';
import { ScopeArticle } from '../data/scopeData';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ScopeLogo } from './ScopeLogo';
import { getNavHref } from './ScopeHeader';

interface ScopeSearchDrawerProps {
  articles?: ScopeArticle[];
  isSearchOpen?: boolean;
  onCloseSearch?: () => void;
  isMenuOpen: boolean;
  onCloseMenu: () => void;
  onSelectTab?: (tab: string) => void;
  onOpenLive?: () => void;
  currentTab?: string;
}

export const ScopeSearchDrawer: React.FC<ScopeSearchDrawerProps> = ({
  articles = [],
  isSearchOpen = false,
  onCloseSearch = () => {},
  isMenuOpen,
  onCloseMenu,
  onSelectTab,
  onOpenLive = () => {},
  currentTab = 'home',
}) => {
  const { theme, setTheme } = useTheme();
  const { t, dir } = useLanguage();
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) onCloseSearch();
        if (isMenuOpen) onCloseMenu();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isMenuOpen, onCloseSearch, onCloseMenu]);

  const allArticles: ScopeArticle[] = articles;

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        (a.subtitle && a.subtitle.toLowerCase().includes(q)) ||
        a.category.toLowerCase().includes(q)
    );
  }, [allArticles, query]);

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
      {isSearchOpen && (
        <div
          onClick={onCloseSearch}
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors cursor-default"
          >
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-[#182339]">
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-[#0a0f1d] rounded-full border border-slate-300 dark:border-slate-700">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.drawer.searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <button
                onClick={onCloseSearch}
                className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                title={t.nav.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {query.trim() === '' ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  {t.drawer.searchPrompt}
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  {t.drawer.noResults} &quot;{query}&quot;.
                </div>
              ) : (
                searchResults.map((art) => (
                  <Link
                    key={art.id}
                    href={`/news/${art.id}`}
                    prefetch={false}
                    onClick={onCloseSearch}
                    className="p-3.5 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group block transition-colors"
                  >
                    <span className="text-[10px] text-[#A42424] dark:text-rose-400 font-bold block mb-0.5">
                      {art.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#A42424] dark:group-hover:text-rose-400 transition-colors">
                      {art.title}
                    </h4>
                    {art.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {art.subtitle}
                      </p>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {isMenuOpen && (
        <div
          onClick={onCloseMenu}
          onPointerDown={(e) => {
            if (e.target === e.currentTarget) {
              onCloseMenu();
            }
          }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              left: dir === 'rtl' ? 0 : 'auto',
              right: dir === 'rtl' ? 'auto' : 0,
            }}
            className={`fixed inset-y-0 ${
              dir === 'rtl' ? 'left-0 slide-in-from-left' : 'right-0 slide-in-from-right'
            } w-full max-w-xs h-full bg-[#0a1526] text-white flex flex-col justify-between shadow-2xl p-6 animate-in duration-200 cursor-default select-text`}
            dir={dir}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <Link href="/" prefetch={false} onClick={onCloseMenu} className="inline-block transition-transform hover:scale-[1.02]">
                  <ScopeLogo variant="white" className="h-7 w-auto" />
                </Link>
                <button
                  onClick={onCloseMenu}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-[#071222] border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    {theme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{t.drawer.themeAppearance}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {theme === 'dark' ? t.drawer.nightMode : t.drawer.dayMode}
                  </span>
                </div>

                <div className="p-1 bg-[#0b172a] border border-slate-700/60 rounded-lg grid grid-cols-2 gap-1 text-xs">
                  <button
                    onClick={() => setTheme('light')}
                    className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold ${
                      theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sun className={`w-3.5 h-3.5 ${theme === 'light' ? 'text-amber-500' : ''}`} />
                    <span>{t.drawer.light}</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold ${
                      theme === 'dark' ? 'bg-[#1e2a42] text-white shadow-sm border border-slate-600/50' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-amber-400' : ''}`} />
                    <span>{t.drawer.dark}</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  onCloseMenu();
                  onOpenLive();
                }}
                className="w-full py-2.5 bg-[#A42424] hover:bg-[#8B1E1E] active:bg-[#731818] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Radio className="w-4 h-4 text-white animate-pulse shrink-0" />
                <span>{t.drawer.liveStream}</span>
              </button>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const href = getNavHref(item.id);
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      prefetch={false}
                      onClick={() => {
                        if (onSelectTab) onSelectTab(item.id);
                        onCloseMenu();
                      }}
                      className={`w-full ${dir === 'rtl' ? 'text-right' : 'text-left'} px-4 py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer flex items-center justify-between ${
                        currentTab === item.id
                          ? 'bg-[#0f2444] text-rose-400 font-bold'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{item.label}</span>
                      {currentTab === item.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A42424]"></span>
                      )}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 text-center">
              {t.drawer.copyright}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
