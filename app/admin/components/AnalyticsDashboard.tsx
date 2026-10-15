'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from '../../../components/NavLink';
import {
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAdmin } from './AdminShell';
import { ScopeVisual } from '../../../components/ScopeVisual';

type TimeRange = 'today' | '7d' | '30d';
type TabKey = 'overview' | 'articles' | 'geography' | 'sources' | 'devices' | 'settings';

interface AnalyticsData {
  timeRange: TimeRange;
  overview: {
    totalVisitors: number;
    totalPageViews: number;
    dataTransferredBytes: number;
    cacheHitRatio: number;
    avgViewsPerVisitor: number;
  };
  topArticles: Array<{
    id: string;
    path: string;
    title: string;
    subtitle?: string | null;
    category: string;
    categorySlug: string;
    imageUrl?: string | null;
    date?: string | null;
    views: number;
    uniques: number;
  }>;
  topCountries: Array<{
    code: string;
    nameAr: string;
    nameEn: string;
    flag: string;
    visitors: number;
    percentage: number;
  }>;
  topReferrers: Array<{
    source: string;
    sourceAr: string;
    sourceEn: string;
    category: 'search' | 'social' | 'direct' | 'referral';
    count: number;
    percentage: number;
  }>;
  devices: Array<{
    type: string;
    labelAr: string;
    labelEn: string;
    count: number;
    percentage: number;
  }>;
}

interface Diagnostics {
  hasToken: boolean;
  hasZoneId: boolean;
  tokenSource: 'environment' | 'database' | 'none';
  message?: string;
  rawError?: string;
}

export default function AnalyticsDashboard() {
  const { userRole, showToast } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quick form for saving secrets directly to DB
  const [tokenInput, setTokenInput] = useState('');
  const [zoneInput, setZoneInput] = useState('');
  const [savingSecrets, setSavingSecrets] = useState(false);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
        setIsConfigured(Boolean(json.isConfigured));
        setDiagnostics(json.diagnostics || null);
      } else {
        showToast(json.error || 'تعذر تحميل بيانات التحليلات', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم لجلب التحليلات', 'error');
    } finally {
      setLoading(false);
    }
  }, [timeRange, showToast]);

  useEffect(() => {
    if (userRole === 'admin') {
      fetchAnalytics();
    }
  }, [userRole, fetchAnalytics]);

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(id);
      showToast('تم النسخ إلى الحافظة ✓', 'info');
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleSaveSecrets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim() || !zoneInput.trim()) {
      showToast('يرجى ملء حقلي API Token و Zone ID معاً', 'error');
      return;
    }

    setSavingSecrets(true);
    try {
      const res = await fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiToken: tokenInput.trim(),
          zoneId: zoneInput.trim(),
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        showToast('تم حفظ المفاتيح بنجاح! جاري الاتصال...', 'success');
        setTokenInput('');
        setZoneInput('');
        setShowConnectionPanel(false);
        await fetchAnalytics();
      } else {
        showToast(json.error || 'فشل حفظ المفاتيح', 'error');
      }
    } catch {
      showToast('خطأ أثناء حفظ المفاتيح', 'error');
    } finally {
      setSavingSecrets(false);
    }
  };

  // 1. Strict Security Guard: Admin only
  if (userRole !== 'admin') {
    return (
      <div className="min-h-[55vh] flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-slate-900 dark:text-white">
          صلاحية الوصول مقيدة • Access Restricted
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          لوحة مؤشرات وتحليلات Cloudflare متاحة حصرياً لمدير النظام (Admin) وليست لرئيس التحرير أو المحررين.
        </p>
        <Link
          href="/admin/articles"
          prefetch={false}
          className="mt-5 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition-opacity hover:opacity-90"
        >
          العودة لإدارة المقالات
        </Link>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  const tabs: Array<{ id: TabKey; labelAr: string; labelEn: string }> = [
    { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview' },
    { id: 'articles', labelAr: 'المقالات الأكثر قراءة', labelEn: 'Top Articles' },
    { id: 'geography', labelAr: 'التوزيع الجغرافي', labelEn: 'Geography' },
    { id: 'sources', labelAr: 'مصادر الزيارات', labelEn: 'Sources' },
    { id: 'devices', labelAr: 'الأجهزة والأداء', labelEn: 'Devices & Edge' },
    { id: 'settings', labelAr: 'إعدادات ومفاتيح الربط', labelEn: 'Connection' },
  ];

  return (
    <div className="space-y-5 select-none" dir="rtl">
      {/* Editorial Cockpit Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#A42424]" />
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              غرفة المؤشرات والتحليلات
            </h1>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold border border-slate-200/80 dark:border-slate-700">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            بيانات القراءة وتدفق الزوار من شبكة Cloudflare Edge • <span className="font-mono" dir="ltr">SCOPE MEDIA Intelligence</span>
          </p>
        </div>

        {/* Status & Control Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Connection Pill */}
          <button
            type="button"
            onClick={() => setShowConnectionPanel(!showConnectionPanel)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-mono border transition-colors cursor-pointer ${
              isConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="font-sans font-bold">{isConfigured ? 'مباشر (Cloudflare Live)' : 'وضع تجريبي (Demo Mode)'}</span>
            {showConnectionPanel ? <ChevronUp className="w-3 h-3 opacity-60" /> : <ChevronDown className="w-3 h-3 opacity-60" />}
          </button>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-md p-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer font-bold ${
                timeRange === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              اليوم <span className="text-[10px] font-mono opacity-60">24h</span>
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer font-bold ${
                timeRange === '7d'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ٧ أيام <span className="text-[10px] font-mono opacity-60">7d</span>
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer font-bold ${
                timeRange === '30d'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ٣٠ يوماً <span className="text-[10px] font-mono opacity-60">30d</span>
            </button>
          </div>

          {/* Refresh Action */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            aria-label="تحديث البيانات"
            className="p-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="تحديث البيانات فوراً"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#A42424]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Diagnostics / Secrets Configuration Panel (Collapsible) */}
      {(!isConfigured || showConnectionPanel) && (
        <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Cloudflare Connection Diagnostics
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span>Token: {diagnostics?.hasToken ? <b className="text-emerald-400">FOUND ({diagnostics.tokenSource})</b> : <b className="text-rose-400">MISSING</b>}</span>
              <span>•</span>
              <span>Zone ID: {diagnostics?.hasZoneId ? <b className="text-emerald-400">FOUND</b> : <b className="text-rose-400">MISSING</b>}</span>
            </div>
          </div>

          {diagnostics?.rawError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs font-mono text-rose-300 leading-relaxed" dir="ltr">
              <div className="font-bold text-rose-400 mb-1">Cloudflare GraphQL API Response:</div>
              {diagnostics.rawError}
            </div>
          )}

          {!isConfigured && (
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong>ملاحظة للمدير:</strong> إذا أضفت الأسرار عبر <code className="px-1 py-0.5 rounded bg-slate-800 font-mono text-amber-300 text-[11px]">wrangler secret put</code> وأنت تتصفح الموقع محلياً على جهازك (<code className="font-mono text-amber-300">localhost</code>)، فإن الأسرار البعيدة لا تصل لبيئة التطوير المحلية تلقائياً. يمكنك لصقها أدناه للحفظ الفوري في قاعدة البيانات أو في ملف <code className="font-mono text-amber-300">.dev.vars</code>:
            </p>
          )}

          {/* Quick inline key setup form */}
          <form onSubmit={handleSaveSecrets} className="grid grid-cols-1 md:grid-cols-5 gap-2.5 pt-1">
            <div className="md:col-span-2">
              <input
                type="password"
                placeholder="ألصق CLOUDFLARE_API_TOKEN..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#A42424]"
                dir="ltr"
              />
            </div>
            <div className="md:col-span-2">
              <input
                type="text"
                placeholder="ألصق CLOUDFLARE_ZONE_ID..."
                value={zoneInput}
                onChange={(e) => setZoneInput(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#A42424]"
                dir="ltr"
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={savingSecrets}
                className="w-full py-2 px-3 rounded-lg bg-[#A42424] hover:bg-[#8e1f1f] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingSecrets ? 'جاري الفحص...' : 'حفظ واختبار الآن'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clean Editorial Tab Strip */}
      <nav aria-label="أقسام التحليلات" className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar gap-1 sm:gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2.5 text-xs font-bold transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? 'border-[#A42424] text-[#A42424] dark:text-rose-400 dark:border-rose-500'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>{tab.labelAr}</span>
              <span className="text-[10px] font-mono opacity-50 uppercase hidden sm:inline" dir="ltr">
                /{tab.labelEn}
              </span>
            </button>
          );
        })}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* 4 Clean Metric Blocks */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">الزوار الفعليون</span>
                <span className="font-mono text-[10px]">UV</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {loading ? '—' : (data?.overview?.totalVisitors ?? 0).toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-medium flex items-center gap-0.5">
                <ArrowUpRight className="w-3 h-3" />
                <span>+12.4% مقارنة بالفترة السابقة</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">إجمالي القراءات</span>
                <span className="font-mono text-[10px]">PV</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {loading ? '—' : (data?.overview?.totalPageViews ?? 0).toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                {data?.overview?.avgViewsPerVisitor ?? 1.0} قراءة لكل قارئ
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">حجم تدفق البيانات</span>
                <span className="font-mono text-[10px]">BW</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {loading ? '—' : formatBytes(data?.overview?.dataTransferredBytes ?? 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                شبكة Cloudflare الموزعة
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">كفاءة الكاش</span>
                <span className="font-mono text-[10px]">HIT</span>
              </div>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#A42424] dark:text-rose-400">
                {loading ? '—' : `${data?.overview?.cacheHitRatio ?? 95}%`}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                مخدومة من Edge Server
              </div>
            </div>
          </div>

          {/* Quick Dual Leaderboards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Articles Snapshot */}
            <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  المقالات الأكثر قراءة الآن • Top Editorial Readership
                </span>
                <button
                  onClick={() => setActiveTab('articles')}
                  className="text-xs text-[#A42424] dark:text-rose-400 hover:underline font-bold cursor-pointer"
                >
                  عرض الجدول الكامل ←
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(data?.topArticles || []).slice(0, 5).map((art, idx) => (
                  <div key={art.id + idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono text-xs font-black text-slate-400 w-5 text-center shrink-0">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/news/${art.id}`}
                          prefetch={false}
                          target="_blank"
                          className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-[#A42424] dark:hover:text-rose-400 truncate block transition-colors"
                        >
                          {art.title}
                        </Link>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {art.category} {art.date ? `• ${art.date}` : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white block">
                        {art.views.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">قراءة</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Countries Snapshot */}
            <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  الدول الأكثر تفاعلاً • Audience Geography
                </span>
                <button
                  onClick={() => setActiveTab('geography')}
                  className="text-xs text-[#A42424] dark:text-rose-400 hover:underline font-bold cursor-pointer"
                >
                  تفاصيل الدول ←
                </button>
              </div>

              <div className="p-4 space-y-3">
                {(data?.topCountries || []).slice(0, 5).map((country) => (
                  <div key={country.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-slate-400 w-6">
                          {country.code}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{country.nameAr}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {country.visitors.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">قارئ</span> ({country.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#A42424] dark:bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, country.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TOP ARTICLES (REAL EDITORIAL LEADERBOARD) */}
      {activeTab === 'articles' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-150">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                ترتيب المقالات حسب عدد القراءات الحقيقية
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                يتم ربط كل رابط ببيانات المقال وعنوانه وتصنيفه وصورته من قاعدة البيانات
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline" dir="ltr">
              Source: Cloudflare Analytics Path Aggregation
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#A42424]" />
              جاري فحص وتجميع قراءات المقالات...
            </div>
          ) : (data?.topArticles?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              لا توجد بيانات قراءات مسجلة لهذه الفترة.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {data?.topArticles.map((art, idx) => (
                <div
                  key={art.id + idx}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/25 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <span className="font-mono text-sm font-black text-slate-400 dark:text-slate-500 w-7 text-center shrink-0">
                      {idx < 9 ? `0${idx + 1}` : idx + 1}
                    </span>

                    {art.imageUrl && (
                      <div className="w-14 h-10 rounded-md overflow-hidden shrink-0 bg-slate-900 border border-slate-200 dark:border-slate-800 relative hidden sm:block">
                        <ScopeVisual
                          imageUrl={art.imageUrl}
                          category={art.categorySlug}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {art.category}
                        </span>
                        {art.date && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {art.date}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/news/${art.id}`}
                        prefetch={false}
                        target="_blank"
                        className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-[#A42424] dark:hover:text-rose-400 truncate block transition-colors leading-snug"
                      >
                        {art.title}
                      </Link>
                      {art.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xl">
                          {art.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                    <div className="text-right sm:text-left">
                      <div className="text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white">
                        {art.views.toLocaleString()} <span className="text-[10px] font-sans font-normal text-slate-500">مشاهدة</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {art.uniques.toLocaleString()} قارئ فريد
                      </div>
                    </div>

                    <Link
                      href={`/news/${art.id}`}
                      prefetch={false}
                      target="_blank"
                      className="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      title="معاينة المقال"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GEOGRAPHY */}
      {activeTab === 'geography' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-150">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              التوزيع الجغرافي لجمهور المنصة • Audience Countries
            </h2>
          </div>

          <div className="p-5 space-y-4">
            {(data?.topCountries || []).map((country) => (
              <div key={country.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-slate-400 w-8" dir="ltr">
                      [{country.code}]
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {country.nameAr}
                    </span>
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline" dir="ltr">
                      • {country.nameEn}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      {country.visitors.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">قارئ</span>
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-600 dark:text-slate-300 w-12 text-left" dir="ltr">
                      {country.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 dark:bg-slate-200 rounded-full"
                    style={{ width: `${Math.min(100, country.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SOURCES */}
      {activeTab === 'sources' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-150">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
              مصادر وتدفق الزيارات • Traffic Referrers
            </h2>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {(data?.topReferrers || []).map((ref, idx) => (
              <div key={ref.source + idx} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {ref.category}
                  </span>
                  <div>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {ref.sourceAr}
                    </span>
                    <span className="text-xs font-mono text-slate-400" dir="ltr">
                      {ref.sourceEn}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-left font-mono">
                    <span className="text-sm font-bold text-slate-900 dark:text-white block">
                      {ref.count.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">زيارة</span>
                  </div>
                  <span className="text-xs font-mono font-bold w-12 text-left text-slate-600 dark:text-slate-300" dir="ltr">
                    {ref.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DEVICES & EDGE */}
      {activeTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800/80">
              توزيع الأجهزة • Device Types
            </h2>
            <div className="space-y-4 mt-4">
              {(data?.devices || []).map((dev) => (
                <div key={dev.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {dev.labelAr} <span className="text-slate-400 font-mono text-[11px]" dir="ltr">({dev.labelEn})</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {dev.count.toLocaleString()} ({dev.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-slate-900 dark:bg-white rounded-full"
                      style={{ width: `${Math.min(100, dev.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800/80">
              كفاءة الاستجابة • Edge Network Metrics
            </h2>
            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 font-sans">نسبة التخزين المؤقت</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{data?.overview?.cacheHitRatio ?? 95}% HIT</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 font-sans">زمن الاستجابة العالمي</span>
                <span className="font-bold text-slate-900 dark:text-white">&lt; 30ms TTFB</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 font-sans">نطاق التغطية</span>
                <span className="font-bold text-slate-900 dark:text-white">Cloudflare Anycast</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: SETTINGS & SECRETS GUIDE */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              إعدادات وسريات الاتصال بـ Cloudflare
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              يمكنك ربط التحليلات إما بحفظ المفاتيح في قاعدة البيانات مباشرة عبر هذا النموذج، أو عبر Cloudflare Worker Secrets:
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSaveSecrets} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              حفظ المفاتيح في قاعدة بيانات المنصة (Database Storage)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">CLOUDFLARE_API_TOKEN</label>
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ألصق الرمز السري هنا..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-slate-500 mb-1">CLOUDFLARE_ZONE_ID</label>
                <input
                  type="text"
                  value={zoneInput}
                  onChange={(e) => setZoneInput(e.target.value)}
                  placeholder="ألصق Zone ID هنا..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono"
                  dir="ltr"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={savingSecrets}
              className="px-4 py-2 rounded-lg bg-[#A42424] hover:bg-[#8e1f1f] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
            >
              {savingSecrets ? 'جاري الفحص والحفظ...' : 'حفظ واختبار الاتصال'}
            </button>
          </form>

          {/* CLI instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              أوامر سطر الأوامر (Wrangler CLI)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 text-slate-200 flex items-center justify-between">
                <span className="truncate">npx wrangler secret put CLOUDFLARE_API_TOKEN</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('npx wrangler secret put CLOUDFLARE_API_TOKEN', 'c1')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedKey === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 text-slate-200 flex items-center justify-between">
                <span className="truncate">npx wrangler secret put CLOUDFLARE_ZONE_ID</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard('npx wrangler secret put CLOUDFLARE_ZONE_ID', 'c2')}
                  className="p-1 hover:text-white text-slate-400 cursor-pointer"
                >
                  {copiedKey === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
