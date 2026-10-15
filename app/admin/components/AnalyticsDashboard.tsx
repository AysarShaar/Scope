'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from '../../../components/NavLink';
import {
  Users,
  Eye,
  Globe,
  Share2,
  Smartphone,
  Server,
  RefreshCw,
  Key,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAdmin } from './AdminShell';
import { ScopeVisual } from '../../../components/ScopeVisual';

type TimeRange = 'today' | '7d' | '30d';
type TabKey = 'overview' | 'articles' | 'geography' | 'sources' | 'devices' | 'setup';

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

export default function AnalyticsDashboard() {
  const { userRole, showToast } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success) {
        setData(json.data);
        setIsConfigured(Boolean(json.isConfigured));
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

  // 1. Strict Admin Protection Guard
  if (userRole !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          صلاحية الوصول مقيدة / Access Denied
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
          لوحة مؤشرات وتحليلات Cloudflare مخصصة لمدير النظام (Admin) فقط، وليست متاحة لرئيس التحرير أو المحررين.
        </p>
        <Link
          href="/admin/articles"
          prefetch={false}
          className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold transition-colors"
        >
          <span>العودة لإدارة المقالات</span>
          <span className="text-[10px] font-mono text-slate-400">/ Back to Articles</span>
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

  const tabs: Array<{ id: TabKey; labelAr: string; labelEn: string; icon: React.ElementType }> = [
    { id: 'overview', labelAr: 'نظرة عامة', labelEn: 'Overview', icon: TrendingUp },
    { id: 'articles', labelAr: 'المقالات الأكثر قراءة', labelEn: 'Top Articles', icon: Eye },
    { id: 'geography', labelAr: 'التوزيع الجغرافي', labelEn: 'Geography', icon: Globe },
    { id: 'sources', labelAr: 'مصادر الزيارات', labelEn: 'Traffic Sources', icon: Share2 },
    { id: 'devices', labelAr: 'الأجهزة والأداء', labelEn: 'Devices & Edge', icon: Smartphone },
    { id: 'setup', labelAr: 'إعدادات ومفاتيح الربط', labelEn: 'Cloudflare Secrets', icon: Key },
  ];

  return (
    <div className="space-y-6 select-none" dir="rtl">
      {/* Top Banner / Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              لوحة مؤشرات المنصة والتحليلات
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700">
              Admin Only
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>مراقبة حركة الزوار والقراءات عبر شبكة Cloudflare العالمية</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="font-mono text-[11px]" dir="ltr">SCOPE MEDIA Analytics</span>
          </p>
        </div>

        {/* Controls: Live Status, Time Range, Refresh */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border ${
              isConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
            }`}
            title={isConfigured ? 'مباشر من Cloudflare GraphQL API' : 'وضع العرض التجريبي (يحتاج إضافة Secrets)'}
          >
            <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span>{isConfigured ? 'مباشر من Cloudflare' : 'وضع تجريبي (Demo Mode)'}</span>
          </div>

          {/* Time Range Selector */}
          <div className="inline-flex rounded-lg p-0.5 bg-slate-100 dark:bg-[#121726] border border-slate-200/80 dark:border-slate-800 text-xs font-medium">
            <button
              onClick={() => setTimeRange('today')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === 'today'
                  ? 'bg-white dark:bg-[#1c2236] text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              اليوم <span className="text-[10px] opacity-70">24h</span>
            </button>
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === '7d'
                  ? 'bg-white dark:bg-[#1c2236] text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ٧ أيام <span className="text-[10px] opacity-70">7d</span>
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                timeRange === '30d'
                  ? 'bg-white dark:bg-[#1c2236] text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              ٣٠ يوماً <span className="text-[10px] opacity-70">30d</span>
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            aria-label="تحديث البيانات"
            className="p-2 rounded-lg bg-white dark:bg-[#121726] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="تحديث البيانات الآن"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Secrets Notice when in Demo Mode */}
      {!isConfigured && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/40 dark:border-amber-800/40 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                أنت تشاهد حالياً وضع المحاكاة التوضيحي (Demo Mode)
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                البيانات المعروضة مستمدة من قاعدة بيانات الموقع الحقيقية لمحاكاة القراءات. لتفعيل جلب إحصائيات Cloudflare الحية مباشرة عبر GraphQL، يلزم إضافة متغيري <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 font-mono text-amber-800 dark:text-amber-300 text-[11px]">CLOUDFLARE_API_TOKEN</code> و <code className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 font-mono text-amber-800 dark:text-amber-300 text-[11px]">CLOUDFLARE_ZONE_ID</code>.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('setup')}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shrink-0 transition-colors cursor-pointer"
          >
            طريقة الربط ←
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 bg-slate-100 dark:bg-[#0e1422] rounded-xl border border-slate-200/80 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                isActive
                  ? 'bg-white dark:bg-[#182033] text-slate-900 dark:text-white shadow-2xs border border-slate-200/60 dark:border-slate-700/80'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`} />
              <span>{tab.labelAr}</span>
              <span className="text-[10px] font-mono opacity-60 uppercase hidden sm:inline" dir="ltr">
                {tab.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* 4 Main KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Unique Visitors */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    الزوار الفعليون
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase" dir="ltr">
                    Unique Visitors
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {loading ? '...' : (data?.overview?.totalVisitors ?? 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+14.8%</span>
                </span>
              </div>
            </div>

            {/* Card 2: Total Page Views */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    إجمالي القراءات
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase" dir="ltr">
                    Total Page Views
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {loading ? '...' : (data?.overview?.totalPageViews ?? 0).toLocaleString()}
                </span>
                <span className="text-[11px] font-mono text-slate-400">
                  {data?.overview?.avgViewsPerVisitor ?? 1.0} لكل زائر
                </span>
              </div>
            </div>

            {/* Card 3: Bandwidth */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    حجم البيانات المنقولة
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase" dir="ltr">
                    Data Transferred
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                  <Server className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {loading ? '...' : formatBytes(data?.overview?.dataTransferredBytes ?? 0)}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Cloudflare Edge
                </span>
              </div>
            </div>

            {/* Card 4: Edge Cache Ratio */}
            <div className="p-4 rounded-xl bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 flex flex-col justify-between h-32">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    كفاءة التخزين المؤقت
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 uppercase" dir="ltr">
                    Edge Cache Ratio
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-purple-700 dark:text-purple-300">
                  {loading ? '...' : `${data?.overview?.cacheHitRatio ?? 95}%`}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Cache Hit Rate
                </span>
              </div>
            </div>
          </div>

          {/* Quick 2-column preview: Top Article & Top Country */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Articles Snapshot */}
            <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">المقالات الأكثر رواجاً الآن</span>
                </div>
                <button
                  onClick={() => setActiveTab('articles')}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  عرض الكل ←
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/60 mt-2">
                {(data?.topArticles || []).slice(0, 4).map((art, idx) => (
                  <div key={art.id + idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={`/news/${art.id}`}
                          prefetch={false}
                          target="_blank"
                          className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 truncate block transition-colors"
                        >
                          {art.title}
                        </Link>
                        <span className="text-[10px] text-slate-400">
                          {art.category} • {art.date || 'اليوم'}
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
            <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">أبرز الدول زيارةً</span>
                </div>
                <button
                  onClick={() => setActiveTab('geography')}
                  className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  التفاصيل الجغرافية ←
                </button>
              </div>

              <div className="space-y-3 mt-3">
                {(data?.topCountries || []).slice(0, 4).map((country) => (
                  <div key={country.code} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{country.flag}</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{country.nameAr}</span>
                        <span className="text-[10px] font-mono text-slate-400 uppercase hidden sm:inline" dir="ltr">
                          ({country.nameEn})
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        {country.visitors.toLocaleString()} <span className="text-[10px] text-slate-400 font-sans">زائر</span> ({country.percentage}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-600 dark:bg-rose-500 rounded-full transition-all duration-500"
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

      {/* TAB 2: TOP ARTICLES (WITH NAMES, TITLES, CATEGORIES & THUMBNAILS - NOT RAW URLS) */}
      {activeTab === 'articles' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-500" />
                <span>المقالات الأكثر قراءة وتفاعلاً</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                تظهر المقالات بأسمائها وعناوينها الحقيقية مصحوبة بعدد الزوار والقراءات
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400" dir="ltr">
              Ranked by Cloudflare Requests
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 font-mono">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-rose-500" />
              جاري جلب إحصائيات المقالات...
            </div>
          ) : (data?.topArticles?.length ?? 0) === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              لا توجد قراءات مسجلة للمقالات خلال هذه الفترة.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
              {data?.topArticles.map((art, idx) => (
                <div
                  key={art.id + idx}
                  className="p-3.5 sm:p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Rank Badge */}
                    <span className={`w-7 h-7 rounded-lg text-xs font-black font-mono flex items-center justify-center shrink-0 ${
                      idx === 0
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                        : idx === 1
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        : idx === 2
                        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                      #{idx + 1}
                    </span>

                    {/* Thumbnail if available */}
                    {art.imageUrl && (
                      <div className="w-14 h-10 sm:w-16 sm:h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900 border border-slate-200/60 dark:border-slate-800 relative">
                        <ScopeVisual
                          imageUrl={art.imageUrl}
                          category={art.categorySlug}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Title & Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {art.category}
                        </span>
                        {art.date && (
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{art.date}</span>
                          </span>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                        {art.title}
                      </h3>

                      {art.subtitle && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xl">
                          {art.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats & Link Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800/60">
                    <div className="text-right sm:text-left">
                      <div className="text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white">
                        {art.views.toLocaleString()} <span className="text-[10px] font-sans font-normal text-slate-500">مشاهدة</span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {art.uniques.toLocaleString()} زائر فريد
                      </div>
                    </div>

                    <Link
                      href={`/news/${art.id}`}
                      prefetch={false}
                      target="_blank"
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="فتح المقال على الموقع"
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

      {/* TAB 3: GEOGRAPHY (COUNTRIES) */}
      {activeTab === 'geography' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>التوزيع الجغرافي للزوار حسب الدول</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ترتيب الدول الأكثر زيارة للموقع بناءً على عناوين IP والشبكة المعتمدة في Cloudflare
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {(data?.topCountries || []).map((country, idx) => (
              <div key={country.code + idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{country.flag}</span>
                    <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {country.nameAr}
                    </span>
                    <span className="text-xs font-mono text-slate-400" dir="ltr">
                      ({country.nameEn})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">
                      {country.visitors.toLocaleString()} <span className="text-xs font-normal text-slate-400">زائر</span>
                    </span>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {country.percentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, country.percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TRAFFIC SOURCES & REFERRERS */}
      {activeTab === 'sources' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-500" />
              <span>مصادر حركة الزيارات (Referrers)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              منصات التواصل الاجتماعي، محركات البحث، والزيارات المباشرة للموقع
            </p>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {(data?.topReferrers || []).map((ref, idx) => (
              <div key={ref.source + idx} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-lg text-xs font-bold ${
                    ref.category === 'search'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                      : ref.category === 'social'
                      ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {ref.category === 'search' ? 'بحث' : ref.category === 'social' ? 'سوشيال' : 'مباشر'}
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
                  <div className="text-left">
                    <span className="text-sm font-mono font-bold text-slate-900 dark:text-white block">
                      {ref.count.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">زيارة</span>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {ref.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DEVICES & EDGE PERFORMANCE */}
      {activeTab === 'devices' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
          {/* Devices Breakdown */}
          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <Smartphone className="w-4 h-4 text-rose-500" />
              <span>توزيع أجهزة القراء (Devices)</span>
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
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-600 dark:bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, dev.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edge Performance & Cache */}
          <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <Server className="w-4 h-4 text-emerald-500" />
              <span>أداء شبكة التوزيع (Cloudflare Edge)</span>
            </h2>

            <div className="mt-4 space-y-3">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">حالة التخزين المؤقت</span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {data?.overview?.cacheHitRatio ?? 95}% Cache Hit
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">متوسط سرعة استجابة الـ Edge</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  &lt; 28ms Global TTFB
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">تغطية الشبكة العالمية</span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  330+ Cities in 120+ Countries
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: CLOUDFLARE SECRETS SETUP GUIDE */}
      {activeTab === 'setup' && (
        <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 animate-in fade-in duration-200">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" />
              <span>إعداد مفاتيح وسريات Cloudflare (Worker Secrets)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              لتفعيل الربط الحي والمباشر لإحصائيات الزوار عبر Cloudflare GraphQL API، يجب تزويد الـ Worker بالمتغيرات السرية التالية:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Secret 1: API Token */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e1422] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  CLOUDFLARE_API_TOKEN
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold">
                  إلزامي
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                رمز API Token مع صلاحية قراءة التحليلات:
                <br />
                <span className="font-mono text-[11px] text-slate-500">• Zone &gt; Analytics &gt; Read</span>
                <br />
                <span className="font-mono text-[11px] text-slate-500">• Account &gt; Analytics &gt; Read</span>
              </p>
              <div className="pt-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px]">
                  <span>npx wrangler secret put CLOUDFLARE_API_TOKEN</span>
                  <button
                    onClick={() => copyToClipboard('npx wrangler secret put CLOUDFLARE_API_TOKEN', 'token')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Secret 2: Zone ID */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0e1422] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  CLOUDFLARE_ZONE_ID
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold">
                  إلزامي
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                معرّف النطاق (Zone ID) لنطاقك <code className="font-mono text-[11px] text-slate-800 dark:text-slate-200">scope-media.net</code> الموجود في الشريط الجانبي الأيمن بصفحة الـ Overview في Cloudflare Dashboard.
              </p>
              <div className="pt-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px]">
                  <span>npx wrangler secret put CLOUDFLARE_ZONE_ID</span>
                  <button
                    onClick={() => copyToClipboard('npx wrangler secret put CLOUDFLARE_ZONE_ID', 'zone')}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedKey === 'zone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Local Development instructions */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>للتشغيل في البيئة المحلية (Local Development)</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              أضف المتغيرات في ملف <code className="font-mono text-slate-900 dark:text-white">.dev.vars</code> (أو <code className="font-mono text-slate-900 dark:text-white">.env.local</code>):
            </p>
            <pre className="p-3 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto" dir="ltr">
{`CLOUDFLARE_API_TOKEN="your_token_here"
CLOUDFLARE_ZONE_ID="your_zone_id_here"`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
