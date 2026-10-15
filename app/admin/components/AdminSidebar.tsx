'use client';

import {
  X,
} from 'lucide-react';
import Link from '../../../components/NavLink';
import Image from 'next/image';
import { useTheme } from '../../../context/ThemeContext';
import { ScopeLogo } from '../../../components/ScopeLogo';

export type AdminSection = 'dashboard' | 'articles' | 'special_articles' | 'breaking' | 'programs' | 'editors' | 'settings';

interface Props {
  current: AdminSection;
  onChange?: (s: AdminSection) => void;
  onLogout: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  userRole: 'admin' | 'editor_in_chief' | 'editor';
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: {
    name: string;
    avatarUrl?: string | null;
    roleLabel?: string;
  };
}

const NAV: { id: AdminSection; label: string; href: string }[] = [
  { id: 'dashboard', label: 'لوحة المؤشرات', href: '/admin/dashboard' },
  { id: 'articles', label: 'المقالات', href: '/admin/articles' },
  { id: 'special_articles', label: 'المقالات المميزة', href: '/admin/special' },
  { id: 'breaking', label: 'الأخبار العاجلة', href: '/admin/breaking' },
  { id: 'programs', label: 'البرامج والتغطيات', href: '/admin/programs' },
  { id: 'editors', label: 'فريق التحرير', href: '/admin/editors' },
  { id: 'settings', label: 'الإعدادات', href: '/admin/settings' },
];

export default function AdminSidebar({
  current,
  onChange,
  onLogout,
  onRefresh,
  isLoading,
  userRole,
  isOpen = false,
  onClose,
  currentUser,
}: Props) {
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name?: string) => {
    if (!name) return 'م';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  };

  const filteredNav = NAV.filter(item => {
    if (item.id === 'dashboard') return userRole === 'admin';
    if (userRole === 'admin') return true;
    if (userRole === 'editor_in_chief') return item.id !== 'editors';
    return item.id === 'articles';
  });

  const roleLabel =
    userRole === 'admin'
      ? 'مدير النظام'
      : userRole === 'editor_in_chief'
      ? 'رئيس التحرير'
      : 'محرر';

  const handleSelect = (id: AdminSection) => {
    if (onChange) onChange(id);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-in fade-in duration-200"
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 right-0 h-[100dvh] max-h-[100dvh] w-64 md:w-[230px] md:min-w-[230px] flex flex-col py-4 bg-white dark:bg-[#0c101c] border-l border-slate-200 dark:border-slate-800/80 z-50 md:z-20 transition-transform duration-300 ease-in-out select-none shadow-xl md:shadow-none overflow-y-auto overscroll-contain ${
          isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="px-5 pb-4 border-b border-slate-100 dark:border-slate-800/70 shrink-0">
          <div className="flex items-center justify-between">
            <Link href="/" prefetch={false} className="inline-block focus:outline-none" title="العودة للموقع الرئيسي">
              <ScopeLogo className="h-8 sm:h-9 w-auto" />
            </Link>
            
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {roleLabel}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="md:hidden p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {currentUser && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-100 dark:border-slate-800/60 flex flex-col items-center justify-center text-center">
              <div className="relative">
                {currentUser.avatarUrl ? (
                  <Image
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-rose-500/40 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-amber-500 text-white font-bold text-sm flex items-center justify-center ring-2 ring-rose-500/40 shadow-xs">
                    {getInitials(currentUser.name)}
                  </div>
                )}
                <span
                  className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#0c101c]"
                  title="متصل الآن"
                />
              </div>
              <span className="mt-2 text-xs font-bold text-slate-900 dark:text-white truncate max-w-full px-1">
                {currentUser.name}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                {currentUser.roleLabel || roleLabel}
              </span>
            </div>
          )}
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 md:overflow-y-auto shrink-0 md:shrink">
          {filteredNav.map(({ id, label, href }) => {
            const isActive = current === id;

            return (
              <Link
                key={id}
                href={href}
                prefetch={false}
                onClick={() => {
                  if (onChange) onChange(id);
                  if (onClose) onClose();
                }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 font-medium'
                }`}
              >
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pt-3 pb-8 md:pb-3 border-t border-slate-100 dark:border-slate-800/70 flex flex-col gap-1 shrink-0">
          <button
            onClick={toggleTheme}
            type="button"
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
          >
            <span>المظهر</span>
            <span className="text-[11px] font-medium text-slate-400">{theme === 'dark' ? 'داكن' : 'فاتح'}</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100/70 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span>تحديث البيانات</span>
            {isLoading && <span className="text-[10px] text-rose-500 font-mono">جاري...</span>}
          </button>

          <button
            onClick={onLogout}
            className="flex items-center justify-center w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 transition-colors cursor-pointer mt-1.5"
          >
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
}
