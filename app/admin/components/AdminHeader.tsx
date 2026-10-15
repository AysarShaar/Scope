'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from '../../../components/NavLink';
import Image from 'next/image';
import {
  Menu,
  Sun,
  Moon,
  RefreshCw,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { AdminSection } from './AdminSidebar';

export interface AdminUser {
  name: string;
  avatarUrl?: string | null;
  role: 'admin' | 'editor_in_chief' | 'editor';
  roleLabel: string;
  email?: string | null;
}

interface AdminHeaderProps {
  section: AdminSection;
  user: AdminUser;
  onOpenMobileMenu: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onLogout: () => void;
  onNavigate?: (section: AdminSection) => void;
}

const SECTION_CONFIG: Record<
  AdminSection,
  { label: string; description: string }
> = {
  dashboard: {
    label: 'لوحة المؤشرات والتحليلات',
    description: 'تحليلات الزوار وأداء المنصة عبر Cloudflare (خاص بمدير النظام)',
  },
  articles: {
    label: 'إدارة المقالات',
    description: 'كتابة وتحرير ونشر الأخبار والمقالات',
  },
  special_articles: {
    label: 'المقالات المميزة',
    description: 'إدارة المقالات المميزة المعروضة في Hero الموقع',
  },
  breaking: {
    label: 'الأخبار العاجلة',
    description: 'شريط العاجل والتنبيهات المباشرة',
  },
  programs: {
    label: 'البرامج والتغطيات',
    description: 'إدارة برامج سكوب ميديا وحلقاتها',
  },
  editors: {
    label: 'فريق التحرير',
    description: 'إدارة حسابات المحررين وصلاحياتهم',
  },
  settings: {
    label: 'الإعدادات العامة',
    description: 'إعدادات البث المباشر والمنصة',
  },
};

function getInitials(name: string): string {
  if (!name) return 'م';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

export default function AdminHeader({
  section,
  user,
  onOpenMobileMenu,
  onRefresh,
  isLoading,
  onLogout,
  onNavigate,
}: AdminHeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const currentSection = SECTION_CONFIG[section] || SECTION_CONFIG.articles;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3.5 sm:px-6 py-2.5 bg-white/95 dark:bg-[#0c101c]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 select-none shadow-xs transition-colors shrink-0">
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer shrink-0"
          aria-label="القائمة الجانبية"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2.5 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                {currentSection.label}
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                <span>/</span>
                <span className="truncate">{currentSection.description}</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate md:hidden">
              سكوب ميديا
            </p>
          </div>
        </div>

        <Link
          href="/"
          prefetch={false}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-slate-200/70 dark:border-slate-800 transition-colors mr-1 cursor-pointer"
        >
          <span>زيارة الموقع</span>
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          title="تحديث البيانات"
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer disabled:opacity-50 shrink-0"
          aria-label="تحديث البيانات"
        >
          <RefreshCw size={17} className={isLoading ? 'animate-spin text-rose-500' : ''} />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'التحويل للوضع الفاتح' : 'التحويل للوضع الداكن'}
          className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 rounded-xl transition-colors cursor-pointer shrink-0"
          aria-label="تبديل المظهر"
        >
          {theme === 'dark' ? (
            <Sun size={17} className="text-amber-400 transition-transform rotate-0 hover:rotate-45" />
          ) : (
            <Moon size={17} className="text-slate-600 transition-transform hover:-rotate-12" />
          )}
        </button>

        <div className="h-7 w-px bg-slate-200 dark:border-slate-800/80 dark:bg-slate-800 mx-1 sm:mx-1.5" />

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="group flex flex-col items-center justify-center p-1 sm:px-2.5 sm:py-1 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/60 transition-all cursor-pointer focus:outline-none"
            aria-expanded={isMenuOpen}
            aria-haspopup="true"
            title={`الحساب الحالي: ${user.name}`}
          >
            <div className="relative">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-rose-500/30 dark:ring-rose-500/50 group-hover:ring-rose-500 dark:group-hover:ring-rose-400 transition-all shadow-xs"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center ring-2 ring-rose-500/30 dark:ring-rose-500/50 group-hover:ring-rose-500 dark:group-hover:ring-rose-400 transition-all shadow-xs">
                  {getInitials(user.name)}
                </div>
              )}
              <span
                className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c101c]"
                title="متصل الآن"
              />
            </div>

            <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[80px] sm:max-w-[110px] truncate leading-tight mt-1 text-center block tracking-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              {user.name}
            </span>

            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium leading-none hidden sm:block truncate max-w-[90px] mt-0.5">
              {user.roleLabel}
            </span>
          </button>

          {isMenuOpen && (
            <div
              className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#0f1422] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800/90 py-3 z-50 animate-in fade-in zoom-in-95 duration-150 select-text"
              role="menu"
            >
              <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-3">
                <div className="relative shrink-0">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/40 shadow-xs"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white font-bold text-base flex items-center justify-center ring-2 ring-rose-500/40 shadow-xs">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0f1422]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                  </div>
                  {user.email && (
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate" dir="ltr">
                      {user.email}
                    </p>
                  )}
                  <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
                    <span>{user.roleLabel}</span>
                  </div>
                </div>
              </div>

              <div className="px-2 pt-2 pb-1 space-y-0.5 text-xs select-none">
                {onNavigate && user.role === 'admin' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer text-right font-medium"
                    >
                      <span>لوحة المؤشرات والتحليلات</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate('settings');
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer text-right"
                    >
                      <span>إعدادات المنصة</span>
                    </button>
                  </>
                )}

                <Link
                  href="/"
                  prefetch={false}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                >
                  <span>زيارة الموقع المباشر</span>
                </Link>
              </div>

              <div className="px-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 mt-1 select-none">
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center px-3 py-2.5 rounded-xl text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer text-xs font-bold"
                >
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
