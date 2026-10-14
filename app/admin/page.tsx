'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from '../../components/NavLink';
import { useSession, signIn, signOut } from 'next-auth/react';
import { RefreshCw } from 'lucide-react';
import { ScopeArticle, BreakingItem, ScopeShow } from '../../data/scopeData';
import { extractYouTubeId } from '../../lib/youtube';
import dynamic from 'next/dynamic';
import AdminSidebar, { type AdminSection } from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import AdminToast from './components/AdminToast';
import type { EditorItem } from './components/EditorsList';
import { ScopeLogo } from '../../components/ScopeLogo';
import { errorMessage } from '../../lib/errors';
const Dashboard = dynamic(() => import('./components/Dashboard'), { ssr: false });
const ArticlesList = dynamic(() => import('./components/ArticlesList'), { ssr: false });
const ArticleEditor = dynamic(() => import('./components/ArticleEditor'), { ssr: false });
const BreakingNews = dynamic(() => import('./components/BreakingNews'), { ssr: false });
const EditorsList = dynamic(() => import('./components/EditorsList'), { ssr: false });
const ProgramsManager = dynamic(() => import('./components/ProgramsManager'), { ssr: false });

type Toast = { text: string; type: 'success' | 'error' | 'info' };

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [isAuth, setIsAuth] = useState(false);
  const [checking, setChecking] = useState(true);
  const [authErr, setAuthErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleConfigured, setGoogleConfigured] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor_in_chief' | 'editor'>('editor');
  const [editorId, setEditorId] = useState<string | null>(null);

  const [section, setSection] = useState<AdminSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [articles, setArticles] = useState<ScopeArticle[]>([]);
  const [breaking, setBreaking] = useState<BreakingItem[]>([]);
  const [editors, setEditors] = useState<EditorItem[]>([]);
  const [programs, setPrograms] = useState<ScopeShow[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);

  const [editingArticle, setEditingArticle] = useState<ScopeArticle | null | undefined>(undefined);
  const [liveStreamInput, setLiveStreamInput] = useState('');

  const showToast = useCallback((text: string, type: Toast['type'] = 'success') => {
    setToast({ text, type });
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scope_setting_live_stream_id');
      if (saved) setLiveStreamInput(saved);
    }
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (!d?.data) return;
        const id = d.data.live_stream_id || '';
        setLiveStreamInput(id);
        if (typeof window !== 'undefined') {
          if (id) localStorage.setItem('scope_setting_live_stream_id', id);
          else localStorage.removeItem('scope_setting_live_stream_id');
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveLiveStream = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractYouTubeId(liveStreamInput) || liveStreamInput.trim();
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('scope_setting_live_stream_id', id);
      else localStorage.removeItem('scope_setting_live_stream_id');
    }
    setLiveStreamInput(id);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live_stream_id: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.success || res.ok) {
        showToast(id ? 'تم حفظ رابط البث المباشر في قاعدة البيانات بنجاح ✓' : 'تمت إزالة البث، وسيظهر الشعار بدلاً منه ✓', 'success');
      } else {
        showToast(data.error || 'تم الحفظ محلياً فقط', 'error');
      }
    } catch {
      showToast('تم الحفظ محلياً (حدث خطأ في الاتصال بالخادم)', 'info');
    }
  };

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
      .then(res => res.json())
      .then(data => {
        setGoogleConfigured(Boolean(data?.googleConfigured));
      })
      .catch(() => {});
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [artRes, brkRes, edRes, progRes] = await Promise.all([
        fetch('/api/articles?limit=10&full=false&includePending=true'),
        fetch('/api/breaking?limit=30'),
        fetch('/api/editors'),
        fetch('/api/programs')
      ]);
      if (artRes.ok) {
        const j = await artRes.json().catch(() => null);
        if (j?.success) setArticles(j.data);
      }
      if (brkRes.ok) {
        const j = await brkRes.json().catch(() => null);
        if (j?.success) setBreaking(j.data);
      }
      if (edRes.ok) {
        const j = await edRes.json().catch(() => null);
        if (j?.success) setEditors(j.data);
      }
      if (progRes.ok) {
        const j = await progRes.json().catch(() => null);
        if (j?.success) setPrograms(j.data);
      }
    } catch (e: unknown) {
      showToast('خطأ في تحميل البيانات: ' + errorMessage(e), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (sessionStatus === 'authenticated' && session?.user) {
      setIsAuth(true);
      setUserRole(session.user.role || 'editor');
      setEditorId(session.user.editorId || null);
      setChecking(false);
      loadData();
    } else if (sessionStatus === 'unauthenticated') {
      setIsAuth(false);
      setChecking(false);
    }
  }, [session, sessionStatus, loadData]);

  const handleLogout = () => {
    setIsAuth(false);
    setArticles([]);
    setBreaking([]);
    setUserRole('editor');
    setEditorId(null);
    signOut({ callbackUrl: '/admin' });
  };

  // The list only carries a short version of each article (no body), so the full article is loaded
  // before the editor opens. Otherwise the editor starts empty and saving replaces the body.
  const handleEditArticle = async (article: ScopeArticle) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(article.id)}`, { cache: 'no-store' });
      const j = await res.json().catch(() => null);
      if (res.ok && j?.success && j.data) {
        setEditingArticle(j.data as ScopeArticle);
      } else {
        showToast(j?.error || 'تعذّر تحميل نص المقال، لم يُفتح التعديل حتى لا يضيع النص', 'error');
      }
    } catch {
      showToast('تعذّر تحميل نص المقال، لم يُفتح التعديل حتى لا يضيع النص', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveArticle = async (data: Partial<ScopeArticle>) => {
    const isNew = editingArticle === null;
    if (!isNew && editingArticle?.content === undefined) {
      showToast('لم يُحمَّل نص المقال، أعد فتح التعديل. لم يُحفظ شيء.', 'error');
      return;
    }
    const url = isNew ? '/api/articles' : `/api/articles/${editingArticle?.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (j.success) {
      showToast(isNew ? 'تم نشر المقال بنجاح ✓' : 'تم حفظ التعديلات ✓', 'success');
      setEditingArticle(undefined);
      loadData();
    } else {
      showToast(j.error || 'فشلت العملية', 'error');
    }
  };

  const handleDeleteArticle = async (id: string, title: string) => {
    if (!confirm(`حذف المقال نهائياً:\n"${title}"`)) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const j = await res.json().catch(() => ({}));
      if (j.success) { setArticles(p => p.filter(a => a.id !== id)); showToast('تم الحذف بنجاح', 'success'); }
      else showToast(j.error || 'فشل الحذف', 'error');
    } finally { setIsLoading(false); }
  };

  const handleApproveArticle = async (id: string, title: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });
      const j = await res.json().catch(() => ({}));
      if (j.success) {
        setArticles(p => p.map(a => a.id === id ? { ...a, status: 'published' } : a));
        showToast(`تم اعتماد ونشر المقال: "${title}" ✓`, 'success');
      } else {
        showToast(j.error || 'فشل اعتماد المقال', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBreaking = async (data: { title: string }) => {
    const res = await fetch('/api/breaking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (j.success) { showToast('تمت إضافة الخبر العاجل ✓', 'success'); loadData(); }
    else showToast(j.error || 'فشلت الإضافة', 'error');
  };

  const handleDeleteBreaking = async (id: string) => {
    const res = await fetch(`/api/breaking/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) { setBreaking(p => p.filter(b => b.id !== id)); showToast('تم حذف الخبر العاجل', 'success'); }
    else showToast(j.error || 'فشل الحذف', 'error');
  };

  const handleAddEditor = async (data: { name: string; email?: string; role: string; avatarUrl?: string; systemRole: string }) => {
    try {
      const res = await fetch('/api/editors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.success) {
        showToast('تم إضافة المحرر بنجاح ✓', 'success');
        loadData();
        return { success: true };
      } else {
        const errorMsg = j.error || 'فشلت الإضافة';
        showToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    } catch (e: unknown) {
      const errorMsg = errorMessage(e) || 'فشلت العملية';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  };

  const handleUpdateEditor = async (id: string, data: Partial<EditorItem>) => {
    try {
      const res = await fetch(`/api/editors/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.success) {
        showToast('تم تحديث بيانات المحرر بنجاح ✓', 'success');
        loadData();
        return { success: true };
      } else {
        const errorMsg = j.error || 'فشل التحديث';
        showToast(errorMsg, 'error');
        return { success: false, error: errorMsg };
      }
    } catch (e: unknown) {
      const errorMsg = errorMessage(e) || 'فشلت العملية';
      showToast(errorMsg, 'error');
      return { success: false, error: errorMsg };
    }
  };

  const handleDeleteEditor = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المحرر؟')) return;
    const res = await fetch(`/api/editors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) { setEditors(p => p.filter(e => e.id !== id)); showToast('تم حذف المحرر', 'success'); }
    else showToast(j.error || 'فشل الحذف', 'error');
  };

  const handleAddProgram = async (data: Partial<ScopeShow>) => {
    const res = await fetch('/api/programs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (j.success) { showToast('تمت إضافة البرنامج بنجاح ✓', 'success'); loadData(); }
    else showToast(j.error || 'فشلت إضافة البرنامج', 'error');
  };

  const handleUpdateProgram = async (id: string, data: Partial<ScopeShow>) => {
    const res = await fetch(`/api/programs/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const j = await res.json().catch(() => ({}));
    if (j.success) { showToast('تم تحديث البرنامج والحلقات بنجاح ✓', 'success'); loadData(); }
    else showToast(j.error || 'فشل تحديث البرنامج', 'error');
  };

  const handleDeleteProgram = async (id: string, title: string) => {
    if (!confirm(`هل أنت متأكد من حذف البرنامج:\n"${title}"؟`)) return;
    const res = await fetch(`/api/programs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    const j = await res.json().catch(() => ({}));
    if (j.success || res.ok) {
      setPrograms(p => p.filter(pr => pr.id !== id));
      showToast('تم حذف البرنامج بنجاح', 'success');
    } else {
      showToast(j.error || 'فشل حذف البرنامج', 'error');
    }
  };

  if (checking) return (
    <div className="min-h-screen bg-[#070c16] text-white flex flex-col items-center justify-center font-sans relative overflow-hidden" dir="rtl">
      <div className="flex flex-col items-center gap-4 z-10">
        <ScopeLogo variant="white" className="h-12 w-auto mb-1" />
        <div className="flex items-center gap-2.5 text-xs text-slate-400 font-mono">
          <RefreshCw className="w-4 h-4 animate-spin text-rose-500" />
          <span>جاري التحقق من الجلسة والصلاحيات...</span>
        </div>
      </div>
    </div>
  );

  if (!isAuth) return (
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
            تسجيل الدخول
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
              signIn('google', { callbackUrl: '/admin', prompt: 'select_account' }, { prompt: 'select_account' });
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

  const currentEditor = editors.find(
    e => (editorId && e.id === editorId) ||
         (session?.user?.email && e.email?.toLowerCase() === session.user.email.toLowerCase())
  );

  const currentUser = {
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

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#080b16] font-sans text-slate-900 dark:text-slate-100" dir="rtl">
      <AdminSidebar
        current={section}
        onChange={setSection}
        onLogout={handleLogout}
        onRefresh={() => loadData()}
        isLoading={isLoading}
        articlesCount={articles.length}
        breakingCount={breaking.length}
        programsCount={programs.length}
        editorsCount={editors.length}
        userRole={userRole}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        currentUser={currentUser}
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <AdminHeader
          section={section}
          user={currentUser}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onRefresh={() => loadData()}
          isLoading={isLoading}
          onLogout={handleLogout}
          onNavigate={setSection}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 sm:p-5 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
          {section === 'dashboard' && (
            <Dashboard articles={articles} breaking={breaking} onNavigate={s => setSection(s)} />
          )}
          {section === 'articles' && (
            <ArticlesList
              articles={articles}
              isLoading={isLoading}
              onCreateNew={() => setEditingArticle(null)}
              onEdit={handleEditArticle}
              onDelete={handleDeleteArticle}
              onApprove={handleApproveArticle}
              userRole={userRole}
            />
          )}
          {section === 'breaking' && (
            <BreakingNews
              items={breaking}
              isLoading={isLoading}
              onAdd={handleAddBreaking}
              onDelete={handleDeleteBreaking}
            />
          )}
          {section === 'programs' && (
            <ProgramsManager
              programs={programs}
              isLoading={isLoading}
              onAddProgram={handleAddProgram}
              onUpdateProgram={handleUpdateProgram}
              onDeleteProgram={handleDeleteProgram}
              userRole={userRole}
            />
          )}
          {section === 'editors' && (
            <EditorsList
              editors={editors}
              isLoading={isLoading}
              onAdd={handleAddEditor}
              onUpdate={handleUpdateEditor}
              onDelete={handleDeleteEditor}
            />
          )}
          {section === 'settings' && (
            <div className="space-y-4 max-w-4xl">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  الإعدادات العامة
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  إعدادات البث وتكوين المنصة
                </p>
              </div>

              <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    البث المباشر الرئيسي
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    ID: {extractYouTubeId(liveStreamInput) || liveStreamInput || 'لا يوجد (يظهر الشعار)'}
                  </span>
                </div>

                <form onSubmit={handleSaveLiveStream} className="flex gap-2">
                  <input
                    type="text"
                    value={liveStreamInput}
                    onChange={e => setLiveStreamInput(e.target.value)}
                    placeholder="رابط أو معرف بث YouTube (اتركه فارغاً لإظهار الشعار)"
                    className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-[#121624] border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-slate-400 dark:focus:border-slate-600"
                    dir="ltr"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    حفظ التغييرات
                  </button>
                </form>
              </div>

              <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px]">اسم المنصة</span>
                    <p className="font-semibold text-slate-900 dark:text-white mt-0.5">SCOPE MEDIA</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">قاعدة البيانات</span>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">Cloudflare D1 (نشط)</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">المنطقة الزمنية</span>
                    <p className="font-mono text-slate-700 dark:text-slate-300 mt-0.5">UTC+3 (مكة)</p>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">اللغة والاتجاه</span>
                    <p className="font-semibold text-slate-700 dark:text-slate-300 mt-0.5">العربية (RTL)</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      </div>

      {editingArticle !== undefined && (
        <ArticleEditor
          article={editingArticle}
          editors={editors}
          onSave={handleSaveArticle}
          onClose={() => setEditingArticle(undefined)}
          isLoading={isLoading}
          userRole={userRole}
          currentEditorId={editorId}
        />
      )}

      {toast && <AdminToast text={toast.text} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
