'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  Plus,
  Trash2,
  Database,
  Cloud,
  ArrowRight,
  Radio,
  FileText,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { ScopeArticle, BreakingItem } from '../../data/scopeData';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [d1Status, setD1Status] = useState<{ connected: boolean; workerUrl?: string | null }>({
    connected: false,
  });

  const [activeTab, setActiveTab] = useState<'articles' | 'breaking' | 'docs'>('articles');
  const [articles, setArticles] = useState<ScopeArticle[]>([]);
  const [breaking, setBreaking] = useState<BreakingItem[]>([]);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // New Article Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newCategory, setNewCategory] = useState('اخبار');
  const [newCategorySlug, setNewCategorySlug] = useState<'news' | 'region' | 'world' | 'economy' | 'politics' | 'investigations'>('news');
  const [newAuthorName, setNewAuthorName] = useState('فريق تحرير SCOPE MEDIA');
  const [newAuthorRole, setNewAuthorRole] = useState('محرر استقصائي');
  const [newContent, setNewContent] = useState('');

  // New Breaking Form State
  const [newBreakingTitle, setNewBreakingTitle] = useState('');
  const [newBreakingSpecial, setNewBreakingSpecial] = useState(false);

  // Fetch initial data
  const loadData = React.useCallback(async () => {
    try {
      const [artRes, brkRes] = await Promise.all([
        fetch('/api/articles'),
        fetch('/api/breaking'),
      ]);
      const artData = await artRes.json();
      const brkData = await brkRes.json();
      if (artData.data) setArticles(artData.data);
      if (brkData.data) setBreaking(brkData.data);
    } catch {
      // Ignore
    }
  }, []);

  const verifyKey = React.useCallback(async (keyToVerify: string) => {
    setLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: keyToVerify }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('scope_admin_key', keyToVerify);
        setD1Status({
          connected: Boolean(data.d1Connected),
          workerUrl: data.workerUrl,
        });
        loadData();
      } else {
        setIsAuthenticated(false);
        setAuthError(data.message || 'رمز المصادقة غير صحيح');
      }
    } catch (err: any) {
      setAuthError('تعذر التحقق من الخادم: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadData]);

  // Fetch initial data & verify session on mount
  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        const [artRes, brkRes] = await Promise.all([
          fetch('/api/articles'),
          fetch('/api/breaking'),
        ]);
        const artData = await artRes.json();
        const brkData = await brkRes.json();
        if (active) {
          if (artData.data) setArticles(artData.data);
          if (brkData.data) setBreaking(brkData.data);
        }
      } catch {
        // Fallback
      }

      const savedKey = typeof window !== 'undefined' ? sessionStorage.getItem('scope_admin_key') : null;
      if (savedKey && active) {
        try {
          const res = await fetch('/api/admin/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: savedKey }),
          });
          const data = await res.json();
          if (active) {
            if (res.ok && data.success) {
              setIsAuthenticated(true);
              setAdminKey(savedKey);
              setD1Status({
                connected: Boolean(data.d1Connected),
                workerUrl: data.workerUrl,
              });
            } else {
              setIsAuthenticated(false);
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    initialize();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    verifyKey(adminKey.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('scope_admin_key');
    setIsAuthenticated(false);
    setAdminKey('');
  };

  // Add Article
  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setLoading(true);
    try {
      const paragraphs = newContent
        .split('\n')
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({
          title: newTitle,
          subtitle: newSubtitle,
          category: newCategory,
          categorySlug: newCategorySlug,
          categoryColor: 'red',
          author: { name: newAuthorName, role: newAuthorRole },
          content: paragraphs.length > 0 ? paragraphs : [newTitle],
          imageType: 'anchor_studio',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ text: 'تم نشر المقال بنجاح في قاعدة البيانات', type: 'success' });
        setShowAddModal(false);
        setNewTitle('');
        setNewSubtitle('');
        setNewContent('');
        loadData();
      } else {
        setActionMessage({ text: data.error || data.message || 'فشل نشر المقال', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Delete Article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المقال نهائياً من قاعدة البيانات؟')) return;

    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Key': adminKey,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ text: 'تم حذف المقال بنجاح', type: 'success' });
        loadData();
      } else {
        setActionMessage({ text: data.error || 'فشل حذف المقال', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    }
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Add Breaking News
  const handleAddBreaking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBreakingTitle.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/breaking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Key': adminKey,
        },
        body: JSON.stringify({
          title: newBreakingTitle,
          isSpecial: newBreakingSpecial,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setActionMessage({ text: 'تم بث الخبر العاجل في شريط الأخبار بنجاح', type: 'success' });
        setNewBreakingTitle('');
        setNewBreakingSpecial(false);
        loadData();
      } else {
        setActionMessage({ text: data.error || 'فشل بث الخبر', type: 'error' });
      }
    } catch (err: any) {
      setActionMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 font-sans flex flex-col">
      {/* Top Admin Header */}
      <header className="bg-[#0a1526] text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex flex-col items-center group cursor-pointer">
              <span className="font-black text-xl tracking-tighter text-white uppercase leading-none">
                SCOPE
              </span>
              <div className="flex items-center gap-1 w-full justify-center mt-0.5">
                <span className="w-2 h-[1px] bg-[#dc2626]"></span>
                <span className="text-[8px] font-black tracking-widest text-[#dc2626] uppercase">
                  MEDIA
                </span>
                <span className="w-2 h-[1px] bg-[#dc2626]"></span>
              </div>
            </Link>

            <div className="h-6 w-[1px] bg-slate-700 mx-1"></div>

            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>لوحة تحكم المسؤول (Cloudflare D1 Backend)</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Backend D1 Status Indicator */}
            <div
              className={`flex items-center gap-1.5 text-xs px-3 py-1 rounded-full border ${
                d1Status.connected
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{d1Status.connected ? 'متصل بقاعدة بيانات Cloudflare D1' : 'وضع المعاينة المحلي (Local D1 Mode)'}</span>
            </div>

            <Link
              href="/"
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 transition-colors"
            >
              <span>الموقع الرئيسي</span>
              <ArrowRight className="w-3.5 h-3.5 mr-0.5" />
            </Link>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-rose-300 hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-900 bg-rose-950/40 hover:bg-rose-900 transition-colors cursor-pointer"
                title="تسجيل الخروج"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-[1480px] w-full mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* Flash Notification */}
        {actionMessage && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-center gap-3 text-sm animate-in fade-in duration-150 ${
              actionMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-200 border-emerald-800'
                : 'bg-rose-950/40 text-rose-200 border-rose-800'
            }`}
          >
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {/* 1. AUTHENTICATION GATE (Restricts anyone except Admin) */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto my-12 bg-white dark:bg-[#121b2d] p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#dc2626]/10 text-[#dc2626] flex items-center justify-center border border-[#dc2626]/20">
              <KeyRound className="w-7 h-7" />
            </div>

            <h1 className="text-xl font-bold mb-2">منطقة الإدارة المحمية</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              لحماية بيانات المنصة، تقتصر عمليات التعديل والإضافة والحذف في قاعدة بيانات D1 على المسؤولين المعتمدين فقط.
            </p>

            <form onSubmit={handleLogin} className="space-y-4 text-right">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  رمز المسؤول السري (Admin Secret Key)
                </label>
                <input
                  type="password"
                  placeholder="أدخل الرمز السري هنا..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full h-10 px-3.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-[#dc2626]"
                  required
                />
              </div>

              {authError && (
                <div className="text-xs text-[#dc2626] flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-10 bg-[#dc2626] hover:bg-[#b91c1c] active:bg-[#991b1b] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>تسجيل الدخول كمسؤول</span>
              </button>

              <div className="pt-2 text-[11px] text-slate-400 text-center">
                يتم التحقق من الرمز ومطابقته مباشرة عبر ترويسات مشفرة تمنع أي وصول غير مصرح به.
              </div>
            </form>
          </div>
        ) : (
          /* 2. AUTHENTICATED ADMIN DASHBOARD */
          <div className="space-y-6">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
              <button
                onClick={() => setActiveTab('articles')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'articles'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'bg-white dark:bg-[#121b2d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>إدارة المقالات والتحقيقات ({articles.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('breaking')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'breaking'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'bg-white dark:bg-[#121b2d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>شريط الأخبار العاجلة ({breaking.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('docs')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'docs'
                    ? 'bg-[#dc2626] text-white shadow-sm'
                    : 'bg-white dark:bg-[#121b2d] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>دليل تشغيل Cloudflare D1</span>
              </button>
            </div>

            {/* TAB 1: ARTICLES MANAGER */}
            {activeTab === 'articles' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">أرشيف المقالات والتقارير</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      يمكنك نشر مقال جديد، مراجعة المحتوى، أو حذف المقالات غير المرغوب فيها من D1.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة مقال جديد</span>
                  </button>
                </div>

                {/* Articles Table */}
                <div className="bg-white dark:bg-[#121b2d] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="py-3 px-4">عنوان المقال</th>
                          <th className="py-3 px-4">القسم</th>
                          <th className="py-3 px-4">الكاتب</th>
                          <th className="py-3 px-4">التاريخ</th>
                          <th className="py-3 px-4">المشاهدات</th>
                          <th className="py-3 px-4 text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {articles.map((art) => (
                          <tr key={art.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 max-w-md">
                              <Link href={`/news/${art.id}`} target="_blank" className="hover:text-[#dc2626] flex items-center gap-1.5">
                                <span className="line-clamp-1">{art.title}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                              </Link>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {art.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                              {art.author?.name || 'فريق التحرير'}
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono">
                              {art.date}
                            </td>
                            <td className="py-3 px-4 font-mono">
                              {art.views?.toLocaleString('ar-EG') || 0}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => handleDeleteArticle(art.id)}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                                title="حذف المقال"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: BREAKING NEWS MANAGER */}
            {activeTab === 'breaking' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-bold">بث الأخبار العاجلة</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    أضف خبراً عاجلاً ليظهر فوراً في شريط الأخبار المتحرك أعلى منصة SCOPE MEDIA.
                  </p>
                </div>

                {/* Add Breaking Form */}
                <form
                  onSubmit={handleAddBreaking}
                  className="bg-white dark:bg-[#121b2d] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
                >
                  <label className="block text-xs font-bold">نص الخبر العاجل:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="اكتب الخبر العاجل هنا بشكل دقيق وموجز..."
                      value={newBreakingTitle}
                      onChange={(e) => setNewBreakingTitle(e.target.value)}
                      className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-[#dc2626]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-5 h-10 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 shadow-sm flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>بث الخبر الآن</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="specialBreaking"
                      checked={newBreakingSpecial}
                      onChange={(e) => setNewBreakingSpecial(e.target.checked)}
                      className="accent-[#dc2626] cursor-pointer"
                    />
                    <label htmlFor="specialBreaking" className="text-xs text-slate-500 cursor-pointer">
                      تمييز كخبر حصري استثنائي (باللون الأحمر)
                    </label>
                  </div>
                </form>

                {/* Breaking List */}
                <div className="bg-white dark:bg-[#121b2d] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 pb-2 border-b border-slate-100 dark:border-slate-800">
                    الأخبار العاجلة النشطة حالياً ({breaking.length})
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {breaking.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {item.time}
                          </span>
                          <span className={`text-xs ${item.isSpecial ? 'font-bold text-[#dc2626]' : 'text-slate-800 dark:text-slate-200'}`}>
                            {item.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: D1 SETUP GUIDE */}
            {activeTab === 'docs' && (
              <div className="bg-white dark:bg-[#121b2d] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs leading-relaxed">
                <div className="flex items-center gap-2 text-base font-bold text-[#dc2626]">
                  <Cloud className="w-5 h-5" />
                  <span>دليل ربط Cloudflare D1 مع SCOPE MEDIA</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  تم إنشاء الكود المصدري الكامل للـ Worker وقاعدة البيانات في مجلد <code className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">/cloudflare-worker</code> في مشروعك.
                </p>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono space-y-2 text-[11px] overflow-x-auto text-left" dir="ltr">
                  <p className="text-slate-400"># 1. Create Cloudflare D1 Database</p>
                  <p className="text-emerald-400">npx wrangler d1 create scope_media_db</p>
                  <p className="text-slate-400 mt-2"># 2. Execute SQL Schema & Seed</p>
                  <p className="text-emerald-400">npx wrangler d1 execute scope_media_db --file=./cloudflare-worker/schema.sql</p>
                  <p className="text-emerald-400">npx wrangler d1 execute scope_media_db --file=./cloudflare-worker/seed.sql</p>
                  <p className="text-slate-400 mt-2"># 3. Set your secret Admin key</p>
                  <p className="text-emerald-400">npx wrangler secret put ADMIN_API_KEY</p>
                  <p className="text-slate-400 mt-2"># 4. Deploy Cloudflare Worker</p>
                  <p className="text-emerald-400">npx wrangler deploy</p>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-emerald-300">
                  <strong>ميزة الأمان:</strong> جميع عمليات القراءة (GET) مفتوحة للمستخدمين لتصفح الأخبار بسرعة فائقة عبر شبكة Cloudflare Edge، بينما يتم حظر جميع عمليات الإضافة والحذف والتعديل (POST, PUT, DELETE) تلقائياً لأي شخص لا يحمل الـ Admin Key السري.
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL: ADD NEW ARTICLE */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-[#121b2d] w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#dc2626]" />
                  <span>إنشاء ونشر مقال جديد في D1</span>
                </h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateArticle} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold mb-1">عنوان المقال:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="اكتب العنوان الرئيسي الجذاب..."
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-[#dc2626]"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">العنوان الفرعي (موجز المقال):</label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    placeholder="موجز تفصيلي يستعرض ما وراء الخبر..."
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-[#dc2626]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">القسم:</label>
                    <select
                      value={newCategorySlug}
                      onChange={(e: any) => {
                        setNewCategorySlug(e.target.value);
                        const labels: any = {
                          news: 'أخبار',
                          region: 'إقليمي',
                          world: 'دولي',
                          economy: 'اقتصاد',
                          politics: 'سياسة',
                          investigations: 'تحقيقات',
                        };
                        setNewCategory(labels[e.target.value] || 'أخبار');
                      }}
                      className="w-full h-10 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-[#dc2626]"
                    >
                      <option value="news">أخبار</option>
                      <option value="region">إقليمي</option>
                      <option value="world">دولي</option>
                      <option value="economy">اقتصاد</option>
                      <option value="politics">سياسة</option>
                      <option value="investigations">تحقيقات خاصة</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">اسم الكاتب / المحرر:</label>
                    <input
                      type="text"
                      value={newAuthorName}
                      onChange={(e) => setNewAuthorName(e.target.value)}
                      className="w-full h-10 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-[#dc2626]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">محتوى المقال (كل سطر يمثل فقرة):</label>
                  <textarea
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="اكتب نص التقرير أو التحقيق هنا..."
                    className="w-full p-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:border-[#dc2626]"
                    required
                  ></textarea>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    {loading ? 'جارِ الحفظ...' : 'نشر المقال في D1'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
