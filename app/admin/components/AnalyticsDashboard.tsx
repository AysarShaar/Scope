'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from '../../../components/NavLink';
import {
  RefreshCw,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
} from 'lucide-react';
import { useAdmin } from './AdminShell';
import { formatArticleArabicDate } from './ArticlesList';

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
    createdAt?: string | null;
    authorName?: string | null;
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

const TABS: Array<{ id: TabKey; label: string }> = [
  { id: 'overview', label: 'نظرة عامة' },
  { id: 'articles', label: 'المقالات الأكثر قراءة' },
  { id: 'geography', label: 'التوزيع الجغرافي' },
  { id: 'devices', label: 'الأجهزة والشبكة' },
];

const TIME_RANGES: Array<{ id: TimeRange; label: string }> = [
  { id: 'today', label: 'اليوم (24 ساعة)' },
  { id: '7d', label: 'آخر 7 أيام' },
  { id: '30d', label: 'آخر 30 يوماً' },
];

export default function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole, showToast } = useAdmin();

  // URL-driven state resolution
  const urlTab = searchParams.get('tab') as TabKey | null;
  const urlRange = searchParams.get('range') as TimeRange | null;

  const [activeTab, setActiveTab] = useState<TabKey>(
    urlTab && ['overview', 'articles', 'geography', 'devices'].includes(urlTab)
      ? urlTab
      : 'overview'
  );
  const [timeRange, setTimeRange] = useState<TimeRange>(
    urlRange && ['today', '7d', '30d'].includes(urlRange)
      ? urlRange
      : 'today'
  );

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const tabListRef = useRef<HTMLDivElement>(null);

  // Sync state with URL params without full page reload
  const updateUrlParams = useCallback(
    (newTab: TabKey, newRange: TimeRange) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', newTab);
      params.set('range', newRange);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleTabChange = useCallback(
    (tabId: TabKey) => {
      setActiveTab(tabId);
      updateUrlParams(tabId, timeRange);
    },
    [timeRange, updateUrlParams]
  );

  const handleTimeRangeChange = useCallback(
    (rangeId: TimeRange) => {
      setTimeRange(rangeId);
      updateUrlParams(activeTab, rangeId);
    },
    [activeTab, updateUrlParams]
  );

  // Keyboard navigation for WAI-ARIA tablist (RTL arrow keys)
  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowLeft') {
      targetIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowRight') {
      targetIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = TABS.length - 1;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const targetTab = TABS[targetIndex];
      handleTabChange(targetTab.id);
      const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
      buttons?.[targetIndex]?.focus();
    }
  };

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

  // Security Guard: Admin role only
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
          className="mt-4 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
        >
          العودة لإدارة المقالات
        </Link>
      </div>
    );
  }

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return '0.0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6 select-none max-w-7xl w-full mx-auto" dir="rtl">
      {/* Editorial Cockpit Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            لوحة المؤشرات والتحليلات
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            متابعة حركة القراء وتدفق الزيارات عبر شبكة المنصة
          </p>
        </div>

        {/* Date Presets & Refresh Control */}
        <div className="flex items-center gap-2">
          <div
            role="group"
            aria-label="الفترة الزمنية"
            className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-medium"
          >
            {TIME_RANGES.map((range) => {
              const isSelected = timeRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => handleTimeRangeChange(range.id)}
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={loading}
            aria-label="تحديث البيانات"
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#A42424]' : ''}`} />
          </button>
        </div>
      </header>

      {/* WAI-ARIA Compliant Tab Navigation */}
      <nav
        ref={tabListRef}
        role="tablist"
        aria-label="أقسام التحليلات"
        className="flex items-center overflow-x-auto no-scrollbar gap-3 sm:gap-4 py-1"
      >
        {TABS.map((tab, idx) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-controls={`panel-${tab.id}`}
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabChange(tab.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer active:scale-[0.98] border focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none ${
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
        <section
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          className="space-y-6"
        >
          {/* Metrics Grid with Zero-CLS Structural Skeletons */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1: Visitors */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">الزوار الفعليون</span>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {(data?.overview?.totalVisitors ?? 0).toLocaleString()}
                  </div>
                  {data?.overview?.visitorsGrowth !== null && data?.overview?.visitorsGrowth !== undefined ? (
                    <div
                      className={`mt-1 text-[11px] font-mono tabular-nums font-medium flex items-center gap-1 ${
                        data.overview.visitorsGrowth >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {data.overview.visitorsGrowth >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 flex-shrink-0" />
                      )}
                      <span dir="ltr">
                        {data.overview.visitorsGrowth >= 0
                          ? `+${data.overview.visitorsGrowth}%`
                          : `${data.overview.visitorsGrowth}%`}
                      </span>
                      <span className="text-[10px] text-slate-400 font-sans mr-0.5">مقارنة بالفترة السابقة</span>
                    </div>
                  ) : (
                    <div className="mt-1 text-[11px] text-slate-400 font-mono tabular-nums">
                      قراء نشطون عبر شبكة التوزيع
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Metric 2: Total Page Views */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">إجمالي القراءات</span>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {(data?.overview?.totalPageViews ?? 0).toLocaleString()}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 font-mono tabular-nums">
                    {data?.overview?.avgViewsPerVisitor ?? 1.0} لكل زائر
                  </div>
                </>
              )}
            </div>

            {/* Metric 3: Bandwidth */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">تدفق البيانات</span>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-24 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-3 w-20 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-slate-900 dark:text-white">
                    {formatBytes(data?.overview?.dataTransferredBytes ?? 0)}
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 font-mono tabular-nums">
                    شبكة الحافة المتصلة
                  </div>
                </>
              )}
            </div>

            {/* Metric 4: Cache Hit Ratio */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800">
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">كفاءة التخزين المؤقت</span>
              {loading ? (
                <div className="mt-2 space-y-2">
                  <div className="h-8 w-20 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                  <div className="h-3 w-24 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                </div>
              ) : (
                <>
                  <div className="mt-2 text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-[#A42424] dark:text-rose-400">
                    {data?.overview?.cacheHitRatio ?? 95}%
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400 font-mono tabular-nums">
                    معدل إصابة الذاكرة
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Quick Dual Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Articles Snapshot */}
            <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  المقالات الأكثر رواجاً
                </span>
                <button
                  onClick={() => handleTabChange('articles')}
                  className="text-xs text-[#A42424] dark:text-rose-400 hover:underline font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
                >
                  عرض الكل ←
                </button>
              </div>

              {loading ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-5 h-4 bg-slate-200/70 dark:bg-slate-800/70 rounded animate-pulse" />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="h-3.5 w-3/4 bg-slate-200/70 dark:bg-slate-800/70 rounded animate-pulse" />
                          <div className="h-2.5 w-1/3 bg-slate-100 dark:bg-slate-800/50 rounded animate-pulse" />
                        </div>
                      </div>
                      <div className="w-12 h-5 bg-slate-200/70 dark:bg-slate-800/70 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {(data?.topArticles || []).slice(0, 5).map((art, idx) => (
                    <div key={art.id + idx} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="font-mono tabular-nums text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                          {idx < 9 ? `0${idx + 1}` : idx + 1}
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
                        <span className="text-xs font-mono tabular-nums font-bold text-slate-900 dark:text-white block">
                          {art.views.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">قراءة</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Countries Snapshot */}
            <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  الدول الأكثر تفاعلاً
                </span>
                <button
                  onClick={() => handleTabChange('geography')}
                  className="text-xs text-[#A42424] dark:text-rose-400 hover:underline font-medium cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
                >
                  عرض التفاصيل ←
                </button>
              </div>

              {loading ? (
                <div className="p-4 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <div className="h-3 w-24 bg-slate-200/70 dark:bg-slate-800/70 rounded animate-pulse" />
                        <div className="h-3 w-16 bg-slate-200/70 dark:bg-slate-800/70 rounded animate-pulse" />
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {[...(data?.topCountries || [])]
                    .sort((a, b) => b.visitors - a.visitors)
                    .slice(0, 5)
                    .map((country) => (
                      <div key={country.code} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {country.flag} {country.nameAr}
                          </span>
                          <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
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
              )}
            </div>
          </div>
        </section>
      )}

      {/* TAB 2: TOP ARTICLES (MATCHING ARTICLES LIST DESIGN EXACTLY) */}
      {activeTab === 'articles' && (
        <section
          role="tabpanel"
          id="panel-articles"
          aria-labelledby="tab-articles"
          className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs"
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                المقالات الأكثر قراءة وتفاعلاً
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                إحصائيات القراءات المسجلة عبر شبكة المنصة مع الربط المباشر ببيانات المقالات
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
              {data?.topArticles?.length ?? 0} مادة
            </span>
          </div>

          {loading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 bg-slate-200/80 dark:bg-slate-800/80 rounded-lg animate-pulse shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="h-4 w-2/3 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                      <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800/60 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-8 w-20 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse shrink-0 hidden sm:block" />
                  <div className="h-8 w-20 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse shrink-0 hidden sm:block" />
                  <div className="h-8 w-8 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg animate-pulse shrink-0" />
                </div>
              ))}
            </div>
          ) : (data?.topArticles?.length ?? 0) === 0 ? (
            <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs">
              لا توجد قراءات مسجلة للمقالات في الفترة الزمنية المحددة.
            </div>
          ) : (
            <>
              {/* Desktop Table View matching ArticlesList */}
              <div className="overflow-x-auto max-sm:hidden">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">المادة الصحفية</th>
                      <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden sm:table-cell">القسم</th>
                      <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap">المشاهدات</th>
                      <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap">القرّاء الفعليون</th>
                      <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden lg:table-cell">تاريخ النشر</th>
                      <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap text-center">عرض</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {data?.topArticles.map((art, idx) => {
                      const { dateAr, timeStr } = formatArticleArabicDate(
                        art.createdAt || undefined,
                        art.date || undefined
                      );
                      return (
                        <tr
                          key={art.id + idx}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <div className="flex items-start gap-3">
                              <span className="font-mono tabular-nums text-xs font-bold text-slate-400 w-5 shrink-0 pt-2 text-center">
                                {idx < 9 ? `0${idx + 1}` : idx + 1}
                              </span>
                              {art.imageUrl ? (
                                <img
                                  src={art.imageUrl}
                                  alt=""
                                  className="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-lg shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center font-mono tabular-nums font-bold text-slate-400 text-xs">
                                  {idx + 1}
                                </div>
                              )}
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <Link
                                  href={`/news/${art.id}`}
                                  prefetch={false}
                                  target="_blank"
                                  className="font-bold text-slate-900 dark:text-white line-clamp-1 block text-[13px] hover:text-[#A42424] dark:hover:text-rose-400 transition-colors focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
                                >
                                  {art.title}
                                </Link>
                                {art.subtitle ? (
                                  <span className="text-slate-500 dark:text-slate-400 line-clamp-1 block text-xs">
                                    {art.subtitle}
                                  </span>
                                ) : art.authorName ? (
                                  <span className="text-slate-400 text-xs">
                                    بقلم: {art.authorName}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td className="px-3.5 py-3.5 whitespace-nowrap hidden sm:table-cell">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                              {art.category || 'عام'}
                            </span>
                          </td>

                          <td className="px-3.5 py-3.5 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-xs sm:text-[13px]">
                                {art.views.toLocaleString()}
                              </span>
                              <span className="text-[10px] text-slate-400 font-sans">مشاهدة</span>
                            </div>
                          </td>

                          <td className="px-3.5 py-3.5 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                              <span className="font-mono tabular-nums font-bold text-xs sm:text-[13px]">
                                {art.uniques.toLocaleString()}
                              </span>
                              <span className="text-[10px] font-sans">قارئ</span>
                            </div>
                          </td>

                          <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 inline-block" dir="rtl">
                                <bdi>{dateAr}</bdi>
                              </span>
                              {timeStr && (
                                <span className="text-[10px] text-slate-400 font-mono tabular-nums" dir="ltr">
                                  {timeStr}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-3.5 py-3.5 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <a
                                href={`/news/${art.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-slate-400 hover:text-[#A42424] dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-lg transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
                                title="عرض المنشور"
                              >
                                <Eye size={16} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View matching ArticlesList */}
              <ul className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800/70">
                {data?.topArticles.map((art, idx) => {
                  const { dateAr } = formatArticleArabicDate(
                    art.createdAt || undefined,
                    art.date || undefined
                  );
                  return (
                    <li key={art.id + idx} className="p-3.5">
                      <div className="flex gap-3">
                        <div className="relative shrink-0">
                          {art.imageUrl ? (
                            <img
                              src={art.imageUrl}
                              alt=""
                              className="w-16 h-16 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center font-mono tabular-nums font-bold text-slate-400 text-sm">
                              #{idx + 1}
                            </div>
                          )}
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#A42424] text-white text-[10px] font-bold font-mono tabular-nums flex items-center justify-center shadow-xs">
                            {idx + 1}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-[14px] leading-snug text-slate-900 dark:text-white line-clamp-2">
                            {art.title}
                          </h3>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                            {[art.category || 'عام', art.authorName].filter(Boolean).join(' · ')}
                          </p>
                          {dateAr !== '—' && (
                            <p className="mt-1 text-[11px] text-slate-400 font-mono tabular-nums">
                              {dateAr}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Views, unique readers, and eye view button with 44px touch targets */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">المشاهدات:</span>
                          <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {art.views.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex-1 min-h-[44px] px-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300">
                          <span className="text-[11px] font-medium">القرّاء:</span>
                          <span className="font-mono tabular-nums font-bold">
                            {art.uniques.toLocaleString()}
                          </span>
                        </div>

                        <a
                          href={`/news/${art.id}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="عرض المنشور"
                          title="عرض المنشور"
                          className="min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#A42424] dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
                        >
                          <Eye size={18} />
                        </a>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}

      {/* TAB 3: GEOGRAPHY (STRICT DESCENDING ORDER) */}
      {activeTab === 'geography' && (
        <section
          role="tabpanel"
          id="panel-geography"
          aria-labelledby="tab-geography"
          className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs"
        >
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                التوزيع الجغرافي للجمهور (ترتيب تنازلي)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                توزيع القراء والزيارات الفعلية حسب الدول مرتبة تنازلياً من الأكثر إلى الأقل تفاعلاً
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg">
              {data?.topCountries?.length ?? 0} دولة
            </span>
          </div>

          {loading ? (
            <div className="p-5 space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2 p-3">
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-32 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 space-y-3">
              {[...(data?.topCountries || [])]
                .sort((a, b) => b.visitors - a.visitors)
                .map((country, idx) => (
                  <div
                    key={country.code + idx}
                    className="space-y-1.5 p-3 rounded-xl hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors border border-transparent hover:border-slate-200/60 dark:hover:border-slate-800/60"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono tabular-nums text-xs font-bold text-slate-400 w-5 text-center shrink-0">
                          {idx < 9 ? `0${idx + 1}` : idx + 1}
                        </span>
                        <span className="text-lg leading-none">{country.flag}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px]">
                          {country.nameAr}
                        </span>
                        <span className="text-xs font-mono text-slate-400 hidden sm:inline" dir="ltr">
                          ({country.nameEn})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                          {country.visitors.toLocaleString()}{' '}
                          <span className="text-xs font-normal text-slate-400 font-sans">قارئ</span>
                        </span>
                        <span
                          className="font-mono tabular-nums text-xs font-bold text-slate-600 dark:text-slate-300 w-14 text-left"
                          dir="ltr"
                        >
                          {country.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mr-7">
                      <div
                        className="h-full bg-[#A42424] dark:bg-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(1, country.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 4: DEVICES & NETWORK */}
      {activeTab === 'devices' && (
        <section
          role="tabpanel"
          id="panel-devices"
          aria-labelledby="tab-devices"
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Device Distribution Card */}
          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800/80">
              توزيع أجهزة المستخدمين
            </h2>
            {loading ? (
              <div className="space-y-4 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-28 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse" />
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/60 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 mt-4">
                {(data?.devices || []).map((dev) => (
                  <div key={dev.type} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {dev.labelAr} <span className="text-slate-400 font-mono text-[11px]" dir="ltr">({dev.labelEn})</span>
                      </span>
                      <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {dev.count.toLocaleString()} ({dev.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-700 dark:bg-slate-400 rounded-full"
                        style={{ width: `${Math.min(100, dev.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Network Health & Edge Card */}
          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-2xs">
            <h2 className="text-xs font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-800/80">
              أداء شبكة التوزيع (Cloudflare Edge)
            </h2>
            <div className="mt-4 space-y-3 font-mono tabular-nums text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 font-sans">نسبة التخزين المؤقت</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">{data?.overview?.cacheHitRatio ?? 95}% HIT</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 font-sans">زمن الاستجابة العالمي</span>
                <span className="font-bold text-slate-900 dark:text-white">&lt; 30ms TTFB</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-slate-500 font-sans">شبكة التوزيع</span>
                <span className="font-bold text-slate-900 dark:text-white">Cloudflare Edge Anycast</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
