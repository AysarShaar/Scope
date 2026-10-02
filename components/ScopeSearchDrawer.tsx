'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, X, Sun, Moon } from 'lucide-react';
import {
  ScopeArticle,
  getAllArticles,
} from '../data/scopeData';
import { useTheme } from '../context/ThemeContext';

interface ScopeSearchDrawerProps {
  isSearchOpen: boolean;
  onCloseSearch: () => void;
  isMenuOpen: boolean;
  onCloseMenu: () => void;
  onSelectTab: (tab: string) => void;
  onOpenLive: () => void;
  currentTab: string;
}

export const ScopeSearchDrawer: React.FC<ScopeSearchDrawerProps> = ({
  isSearchOpen,
  onCloseSearch,
  isMenuOpen,
  onCloseMenu,
  onSelectTab,
  onOpenLive,
  currentTab,
}) => {
  const { theme, setTheme, toggleTheme } = useTheme();
  const [query, setQuery] = useState('');

  const allArticles: ScopeArticle[] = useMemo(() => {
    return getAllArticles();
  }, []);

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
    { id: 'home', label: 'الرئيسية' },
    { id: 'news', label: 'الأخبار' },
    { id: 'region', label: 'إقليمي' },
    { id: 'world', label: 'دولي' },
    { id: 'economy', label: 'اقتصاد' },
    { id: 'politics', label: 'سياسة' },
    { id: 'society', label: 'مجتمع' },
    { id: 'culture', label: 'ثقافة' },
    { id: 'investigations', label: 'تحقيقات' },
    { id: 'programs', label: 'برامج' },
    { id: 'videos', label: 'فيديوهات' },
    { id: 'about', label: 'من نحن' },
  ];

  return (
    <>
      {/* 1. Live Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-start justify-center pt-16 px-4 animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-[#182339]">
              <div className="flex-1 flex items-center gap-2.5 px-4 py-2 bg-white dark:bg-[#0a0f1d] rounded-full border border-slate-300 dark:border-slate-700">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="ابحث في تغطيات وتحقيقات سكوب..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm focus:outline-none text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
              <button
                onClick={onCloseSearch}
                className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {query.trim() === '' ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  اكتب أي كلمة مفتاحية للبحث الفوري في محتوى المنصة
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-8">
                  لا توجد نتائج مطابقة لـ &quot;{query}&quot;.
                </div>
              ) : (
                searchResults.map((art) => (
                  <Link
                    key={art.id}
                    href={`/news/${art.id}`}
                    onClick={onCloseSearch}
                    className="p-3.5 border border-slate-100 dark:border-slate-800/80 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer group block transition-colors"
                  >
                    <span className="text-[10px] text-[#dc2626] dark:text-rose-400 font-bold block mb-0.5">
                      {art.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#dc2626] dark:group-hover:text-rose-400 transition-colors">
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

      {/* 2. Mobile / Side Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-xs h-full bg-[#0a1526] text-white flex flex-col justify-between shadow-2xl p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-1 font-black text-xl tracking-tighter">
                  <span>SCOPE</span>
                  <span className="text-[#dc2626]">MEDIA</span>
                </div>
                <button
                  onClick={onCloseMenu}
                  className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Theme Toggle in Mobile Drawer (The Three Lines) */}
              <div className="bg-[#071222] border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                  <span className="flex items-center gap-1.5">
                    {theme === 'dark' ? (
                      <Moon className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>مظهر المنصة</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    {theme === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}
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
                    <span>نهاري</span>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`py-2 px-3 rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold ${
                      theme === 'dark' ? 'bg-[#1e2a42] text-white shadow-sm border border-slate-600/50' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Moon className={`w-3.5 h-3.5 ${theme === 'dark' ? 'text-amber-400' : ''}`} />
                    <span>ليلي</span>
                  </button>
                </div>
              </div>

              {/* Live Button (Rounded-full) with Broadcast Red */}
              <button
                onClick={() => {
                  onCloseMenu();
                  onOpenLive();
                }}
                className="w-full py-2.5 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white font-bold text-xs rounded-full flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                <span>بث مباشر</span>
              </button>

              {/* Navigation list (Rounded-full item highlights) */}
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      onCloseMenu();
                    }}
                    className={`w-full text-right px-4 py-2 text-xs font-semibold rounded-full transition-colors cursor-pointer flex items-center justify-between ${
                      currentTab === item.id
                        ? 'bg-[#0f2444] text-rose-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{item.label}</span>
                    {currentTab === item.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 text-center">
              SCOPE MEDIA © 2026 - Beyond The Headlines
            </div>
          </div>
        </div>
      )}
    </>
  );
};
