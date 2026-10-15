'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Link from '../../../components/NavLink';
import { useSession, signIn, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { ScopeLogo } from '../../../components/ScopeLogo';
import AdminSidebar, { type AdminSection } from './AdminSidebar';
import AdminHeader, { type AdminUser } from './AdminHeader';
import AdminToast from './AdminToast';
import type { EditorItem } from './EditorsList';

type Toast = { text: string; type: 'success' | 'error' | 'info' };

export interface AdminContextType {
  userRole: 'admin' | 'editor_in_chief' | 'editor';
  editorId: string | null;
  currentUser: AdminUser;
  showToast: (text: string, type?: Toast['type']) => void;
  editors: EditorItem[];
  refreshProfile: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) {
    throw new Error('useAdmin must be used within an AdminShell');
  }
  return ctx;
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authErr, setAuthErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor_in_chief' | 'editor'>('editor');
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editors, setEditors] = useState<EditorItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((text: string, type: Toast['type'] = 'success') => {
    setToast({ text, type });
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const edRes = await fetch('/api/editors');
      if (edRes.ok) {
        const j = await edRes.json().catch(() => null);
        if (j?.success && Array.isArray(j.data)) {
          setEditors(j.data);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setIsLoading(false);
        if (err === 'OAuthSignin' || err === 'Configuration') {
          setAuthErr('خدمة المصادقة غير مهيأة بالشكل المطلوب. يرجى مراجعة إدارة النظام.');
        } else if (err === 'AccessDenied') {
          setAuthErr('حساب Google هذا غير مصرح له بالدخول. يرجى التواصل مع مدير النظام لإضافة بريدك الإلكتروني لفريق التحرير.');
        } else if (err === 'OAuthCallback') {
          setAuthErr('فشل استلام رد المصادقة من Google. تأكد من ضبط Authorized Redirect URIs في Google Cloud Console.');
        } else {
          setAuthErr(`خطأ في تسجيل الدخول بواسطة Google (${err})`);
        }
      }
    }

    fetch('/api/auth/status')
      .then((res) => res.json())
      .then((data) => {
        setGoogleConfigured(Boolean(data?.googleConfigured));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (sessionStatus === 'loading') {
      setChecking(true);
      return;
    }

    if (session?.user) {
      const role = (session.user as { role?: string })?.role;
      if (role === 'admin' || role === 'editor_in_chief' || role === 'editor') {
        setUserRole(role);
      }
      const edId = (session.user as { editorId?: string })?.editorId;
      if (edId) setEditorId(edId);

      setIsAuth(true);
      setChecking(false);
      loadProfile();
      return;
    }

    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          const role = data.user.role;
          if (role === 'admin' || role === 'editor_in_chief' || role === 'editor') {
            setUserRole(role);
          }
          if (data.user.editorId) setEditorId(data.user.editorId);
          setIsAuth(true);
          loadProfile();
        } else {
          setIsAuth(false);
        }
      })
      .catch(() => setIsAuth(false))
      .finally(() => setChecking(false));
  }, [session, sessionStatus, loadProfile]);

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin' });
    setIsAuth(false);
    setUserRole('editor');
    setEditorId(null);
  };

  // Determine section from pathname
  let currentSection: AdminSection = 'articles';
  if (pathname.startsWith('/admin/dashboard')) {
    currentSection = 'dashboard';
  } else if (pathname.startsWith('/admin/special')) {
    currentSection = 'special_articles';
  } else if (pathname.startsWith('/admin/breaking')) {
    currentSection = 'breaking';
  } else if (pathname.startsWith('/admin/programs')) {
    currentSection = 'programs';
  } else if (pathname.startsWith('/admin/editors')) {
    currentSection = 'editors';
  } else if (pathname.startsWith('/admin/settings')) {
    currentSection = 'settings';
  } else {
    currentSection = 'articles';
  }

  const currentEditor = editors.find(
    (e) =>
      (editorId && e.id === editorId) ||
      (session?.user?.email && e.email?.toLowerCase() === session.user.email.toLowerCase()),
  );

  const currentUser: AdminUser = {
    name: currentEditor?.name || session?.user?.name || 'محرر المنصة',
    avatarUrl: currentEditor?.avatarUrl || session?.user?.image || null,
    role: userRole,
    roleLabel:
      userRole === 'admin'
        ? 'مدير النظام'
        : userRole === 'editor_in_chief'
        ? 'رئيس التحرير'
        : (currentEditor?.role || 'محرر'),
    email: currentEditor?.email || session?.user?.email || null,
  };

  if (checking) {
    return (
      <div
        className="min-h-screen bg-[#070c16] text-white flex flex-col items-center justify-center font-sans relative overflow-hidden"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4 z-10">
          <ScopeLogo variant="white" className="h-12 w-auto mb-1" />
          <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
            <span>جاري التحقق من الجلسة والصلاحيات...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return (
      <div
        className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col justify-center items-center p-4 font-sans select-none"
        dir="rtl"
      >
        <div className="w-full max-w-xs space-y-6">
          <div className="text-center space-y-2">
            <Link href="/" prefetch={false} className="inline-block">
              <ScopeLogo className="h-12 w-auto mx-auto" />
            </Link>
            <h1 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              تسجيل الدخول إلى لوحة التحكم
            </h1>
          </div>

          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-3">
            {authErr && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/50 text-xs text-red-600 dark:text-red-300">
                {authErr}
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (googleConfigured === false) {
                  setAuthErr('إعدادات Google OAuth غير مفعلة.');
                  return;
                }
                setIsLoading(true);
                setAuthErr('');
                signIn(
                  'google',
                  { callbackUrl: '/admin', prompt: 'select_account' },
                  { prompt: 'select_account' },
                );
              }}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 dark:bg-[#121624] dark:hover:bg-[#181e30] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>المتابعة بواسطة Google</span>
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/"
              prefetch={false}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              ← العودة للموقع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const contextValue: AdminContextType = {
    userRole,
    editorId,
    currentUser,
    showToast,
    editors,
    refreshProfile: loadProfile,
  };

  return (
    <AdminContext.Provider value={contextValue}>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#080b16] font-sans text-slate-900 dark:text-slate-100" dir="rtl">
        <AdminSidebar
          current={currentSection}
          onLogout={handleLogout}
          onRefresh={loadProfile}
          isLoading={isLoading}
          userRole={userRole}
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          currentUser={currentUser}
        />

        <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <AdminHeader
            section={currentSection}
            user={currentUser}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onRefresh={loadProfile}
            isLoading={isLoading}
            onLogout={handleLogout}
            onNavigate={(sec) => {
              const target =
                sec === 'dashboard'
                  ? '/admin/dashboard'
                  : sec === 'special_articles'
                  ? '/admin/special'
                  : sec === 'breaking'
                  ? '/admin/breaking'
                  : sec === 'programs'
                  ? '/admin/programs'
                  : sec === 'editors'
                  ? '/admin/editors'
                  : sec === 'settings'
                  ? '/admin/settings'
                  : '/admin/articles';
              router.push(target);
            }}
          />

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
              {children}
            </div>
          </main>
        </div>

        {toast && <AdminToast text={toast.text} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </AdminContext.Provider>
  );
}
