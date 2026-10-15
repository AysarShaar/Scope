'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from '../../../components/NavLink';
import {
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useAdmin } from './AdminShell';
import { ScopeVisual } from '../../../components/ScopeVisual';

type TimeRange = 'today' | '7d' | '30d';
type TabKey = 'overview' | 'articles' | 'geography' | 'devices';

interface AnalyticsData {
  timeRange: TimeRange;
  overview: {
    totalVisitors: number;
    totalPageViews: number;
    dataTransferredBytes: number;
    cacheHitRatio: number;
    avgViewsPerVisitor: number;
    visitorsGrowth?: number | null;
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

export default function AnalyticsDashboard() {
  const { userRole, showToast } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
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

  // Security Guard: Admin only
  if (userRole !== 'admin') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          صلاحية الوصول مقيدة
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
          لوحة المؤشرات والتحليلات متاحة لمدير النظام فقط.
        </p>
        <Link
          href="/admin/articles"
          prefetch={false}
          className="mt-4 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold"
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

  const tabs: Array<{ id: TabKey; label: string }> = [
    { id: 'overview', label: 'نظرة عامة' },
    { id: 'articles', label: 'المقالات الأكثر قراءة' },
    { id: 'geography', label: 'التوزيع الجغرافي' },
    { id: 'devices', label: 'الأجهزة والشبكة' },
  ];

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            لوحة المؤشرات والتحليلات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة حركة القراء وتدفق الزيارات عبر شبكة المنصة
          </p>
        </div>

        {/* Date Filter & Refresh */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 text-xs font-medium">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeRange === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ٧ أيام
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ٣٠ يوماً
            </button>
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            aria-label="تحديث البيانات"
            className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#A42424]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs with rounded boxed frames, spacing, and red illumination on active */}
      <nav aria-label="أقسام التحليلات" className="flex items-center overflow-x-auto no-scrollbar gap-3 sm:gap-4 py-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-[0.98] border ${
                isActive
                  ? 'border-[#A42424] text-[#A42424] dark:border-rose-500 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 shadow-md shadow-rose-500/20 ring-2 ring-[#A42424]/40 dark:ring-rose-500/50'
                  : 'border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0c101c] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">الزوار الفعليون</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {loading ? '—' : (data?.overview?.totalVisitors ?? 0).toLocaleString()}
              </div>
              {loading ? (
                <div className="mt-1 text-[11px] text-slate-400 font-mono">جاري الحساب...</div>
              ) : data?.overview?.visitorsGrowth !== null && data?.overview?.visitorsGrowth !== undefined ? (
                <div
                  className={`mt-1 text-[11px] font-mono font-medium flex items-center gap-1 ${
                    data.overview.visitorsGrowth >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {data.overview.visitorsGrowth >= 0 ? (
                    <ArrowUpRight className="w-3 h-3 flex-shrink-0" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 flex-shrink-0" />
                  )}
                  <span dir="ltr">
                    {data.overview.visitorsGrowth >= 0
                      ? `+${data.overview.visitorsGrowth}%`
                      : `${data.overview.visitorsGrowth}%`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-sans mr-0.5">مقارنة بالفترة السابقة</span>
                </div>
              ) : (
                <div className="mt-1 text-[11px] text-slate-400 font-mono">
                  قراء نشطون • Edge
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">إجمالي القراءات</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {loading ? '—' : (data?.overview?.totalPageViews ?? 0).toLocaleString()}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                {data?.overview?.avgViewsPerVisitor ?? 1.0} لكل زائر
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">حجم تدفق البيانات</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                {loading ? '—' : formatBytes(data?.overview?.dataTransferredBytes ?? 0)}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                شبكة Cloudflare
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">كفاءة التخزين المؤقت</span>
              <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tracking-tight text-[#A42424] dark:text-rose-400">
                {loading ? '—' : `${data?.overview?.cacheHitRatio ?? 95}%`}
              </div>
              <div className="mt-1 text-[11px] text-slate-400 font-mono">
                Cache Hit Ratio
              </div>
            </div>
          </div>

          {/* Quick Dual Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Articles Snapshot */}
            <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  المقالات الأكثر رواجاً
                </span>
                <button
                  onClick={() => setActiveTab('articles')}
                  className="text-xs text-[#A42424] dark:text-rose-400 hover:underline font-medium cursor-pointer"
                >
                  عرض الكل ←
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {(data?.topArticles || []).slice(0, 5).map((art, idx) => (
                  <div key={art.id + idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="font-mono text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                        {idx + 1}
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
                        <span className="text-[10px] text-slate-400">
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
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  الدول الأكثر تفاعلاً
                </span>
                <button
                  onClick={() => setActiveTab('geography')}
                  className="text-xs text-[#A42424] dark:text-rose-400 hover:underline font-medium cursor-pointer"
                >
                  عرض التفاصيل ←
                </button>
              </div>

              <div className="p-4 space-y-3">
                {(data?.topCountries || []).slice(0, 5).map((country) => (
                  <div key={country.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {country.flag} {country.nameAr}
                      </span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {country.visitors.toLocaleString()} ({country.percentage}%)
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

      {/* TAB 2: TOP ARTICLES */}
      {activeTab === 'articles' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              ترتيب المقالات حسب عدد القراءات
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Cloudflare Requests
            </span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-xs text-slate-400 font-mono">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-[#A42424]" />
              جاري جلب إحصائيات المقالات...
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
                    <span className="font-mono text-xs font-bold text-slate-400 w-6 text-center shrink-0">
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
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
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
                      <div className="text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white">
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
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              التوزيع الجغرافي للجمهور حسب الدول
            </span>
          </div>

          <div className="p-5 space-y-4">
            {(data?.topCountries || []).map((country) => (
              <div key={country.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{country.flag}</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {country.nameAr}
                    </span>
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline" dir="ltr">
                      ({country.nameEn})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      {country.visitors.toLocaleString()} <span className="text-xs font-normal text-slate-400 font-sans">قارئ</span>
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500 w-12 text-left" dir="ltr">
                      {country.percentage}%
                    </span>
                  </div>
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
      )}

      {/* TAB 4: DEVICES & NETWORK */}
      {activeTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800/80">
              توزيع الأجهزة
            </h2>
            <div className="space-y-4 mt-4">
              {(data?.devices || []).map((dev) => (
                <div key={dev.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dev.labelAr} <span className="text-slate-400 font-mono text-[11px]" dir="ltr">({dev.labelEn})</span>
                    </span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {dev.count.toLocaleString()} ({dev.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#A42424] dark:bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, dev.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800/80">
              أداء شبكة التوزيع (Cloudflare Edge)
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
                <span className="text-slate-500 font-sans">شبكة التوزيع</span>
                <span className="font-bold text-slate-900 dark:text-white">Cloudflare Edge Anycast</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
