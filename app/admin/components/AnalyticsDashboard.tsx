'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from '../../../components/NavLink';
import {
  RefreshCw,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  Activity,
  Zap,
  Globe,
  Cloud,
  Smartphone,
  Compass,
} from 'lucide-react';
import { useAdmin } from './AdminShell';
import { formatArticleArabicDate } from './ArticlesList';
import WorldMap, { type WorldMapCountry } from './WorldMap';
import CloudflareAnalyticsDashboard from './CloudflareAnalyticsDashboard';
import type {
  AnalyticsResponse,
  ArticleRowWithMeta,
  Delta,
  Section,
  Shares,
} from '@/lib/analyticsMetrics';

type TimeRange = 'today' | '7d' | '30d';

const TIME_RANGES: Array<{ id: TimeRange; label: string }> = [
  { id: 'today', label: 'اليوم' },
  { id: '7d', label: 'آخر 7 أيام' },
  { id: '30d', label: 'آخر 30 يوماً' },
];

const CARD =
  'bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs';

const nf = (n: number) => n.toLocaleString('en-US');

function formatBytes(bytes: number) {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function formatStamp(iso: string) {
  return new Date(iso).toLocaleString('ar-EG-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short' });
}

/* ───────────────────────── small UI helpers ───────────────────────── */

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse ${className}`} />;
}

function Unavailable({ reason }: { reason: string }) {
  return (
    <div
      role="status"
      className="m-4 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60"
    >
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">غير متاح حالياً</p>
      <p dir="ltr" className="mt-1 text-[11px] font-mono text-slate-500 dark:text-slate-400 break-words text-left">
        {reason}
      </p>
    </div>
  );
}

function DeltaChip({ delta }: { delta: Delta }) {
  if (delta.kind === 'none') return <span className="text-[11px] text-slate-400">—</span>;
  if (delta.kind === 'new') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
        جديد
      </span>
    );
  }
  const pct = delta.pct ?? 0;
  const tone =
    delta.kind === 'up'
      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
      : delta.kind === 'down'
        ? 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40'
        : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
  const Icon = delta.kind === 'up' ? ArrowUpRight : delta.kind === 'down' ? ArrowDownRight : Minus;
  return (
    <span
      dir="ltr"
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-bold font-mono tabular-nums ${tone}`}
    >
      <Icon className="w-3 h-3 shrink-0" aria-hidden="true" />
      {pct > 0 ? '+' : ''}
      {pct}%
    </span>
  );
}

function Bar({ percentage, muted }: { percentage: number; muted?: boolean }) {
  return (
    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" aria-hidden="true">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          muted ? 'bg-slate-300 dark:bg-slate-600' : 'bg-[#0F4468] dark:bg-sky-500'
        }`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
}

function Card({
  title,
  subtitle,
  icon: Icon,
  badge,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
            {subtitle ? <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
          </div>
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function CardBody<T>({
  section,
  loading,
  rows = 4,
  children,
}: {
  section: Section<T> | undefined;
  loading: boolean;
  rows?: number;
  children: (data: T) => React.ReactNode;
}) {
  if (!section && !loading) {
    return <Unavailable reason="تعذر تحميل البيانات (راجع تفاصيل الخادم)" />;
  }
  if (!section) {
    return (
      <div className="p-5 space-y-4" aria-busy="true">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }
  if (section.status === 'unavailable') return <Unavailable reason={section.reason} />;
  return <div className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>{children(section.data)}</div>;
}

interface ShareRowView {
  key: string;
  label: string;
  lead?: string;
  badge?: string;
  value: number;
  percentage: number;
}

function ShareList({
  rows,
  other,
}: {
  rows: ShareRowView[];
  other: { value: number; percentage: number } | null;
}) {
  if (rows.length === 0 && !other) {
    return <p className="p-5 text-xs text-slate-500 dark:text-slate-400">لا توجد بيانات في هذه الفترة.</p>;
  }
  return (
    <ul className="p-4 space-y-3.5">
      {rows.map((r) => (
        <li key={r.key} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="min-w-0 flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
              {r.lead ? <span aria-hidden="true">{r.lead}</span> : null}
              <span className="truncate">{r.label}</span>
              {r.badge ? (
                <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-400">
                  {r.badge}
                </span>
              ) : null}
            </span>
            <span dir="ltr" className="shrink-0 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
              {nf(r.value)} <span className="text-slate-400 font-medium">· {r.percentage}%</span>
            </span>
          </div>
          <Bar percentage={r.percentage} />
        </li>
      ))}
      {other ? (
        <li className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 dark:text-slate-400">أخرى (غير مدرجة أعلاه)</span>
            <span dir="ltr" className="font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {nf(other.value)} · {other.percentage}%
            </span>
          </div>
          <Bar percentage={other.percentage} muted />
        </li>
      ) : null}
    </ul>
  );
}

function toRows<T>(s: Shares<T>, map: (item: T) => Omit<ShareRowView, 'value' | 'percentage'>): ShareRowView[] {
  return s.rows.map((r) => ({ ...map(r.item), value: r.value, percentage: r.percentage }));
}

/* ───────────────────────── Main Dashboard Component ───────────────────────── */

export default function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole } = useAdmin();

  const urlRange = searchParams.get('range') as TimeRange | null;
  const urlView = searchParams.get('view') as 'website' | 'cloudflare' | null;
  const [activeView, setActiveView] = useState<'website' | 'cloudflare'>(
    urlView === 'cloudflare' ? 'cloudflare' : 'website'
  );
  const [timeRange, setTimeRange] = useState<TimeRange>(
    urlRange && ['today', '7d', '30d'].includes(urlRange) ? urlRange : 'today'
  );
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const requestId = useRef(0);

  const handleViewChange = useCallback(
    (view: 'website' | 'cloudflare') => {
      setActiveView(view);
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', view);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range);
      const params = new URLSearchParams(searchParams.toString());
      params.set('range', range);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const fetchAnalytics = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?timeRange=${timeRange}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (id !== requestId.current) return;
      if (res.ok && json?.success) {
        setData(json as AnalyticsResponse);
        setFetchError(null);
      } else {
        setFetchError(json?.error || `HTTP ${res.status}`);
      }
    } catch {
      if (id === requestId.current) setFetchError('تعذر الاتصال بالخادم لجلب التحليلات');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    if (userRole === 'admin') fetchAnalytics();
  }, [userRole, fetchAnalytics]);

  const s = data?.sections;
  const overview = s?.overview.status === 'ok' ? s.overview.data : null;
  const delivery = s?.delivery.status === 'ok' ? s.delivery.data : null;
  const notConfigured = data !== null && !data.configured;
  const showSections = !notConfigured;

  // Filtered Articles: limited strictly to top 10 articles
  const top10Articles = useMemo(() => {
    const rows = s?.articles.status === 'ok' ? s.articles.data.rows : [];
    return rows.filter((r) => r.views > 0).slice(0, 10);
  }, [s?.articles]);

  // Calculate proportional estimated readers (القرّاء)
  const readersRatio = useMemo(() => {
    if (overview && overview.pageViews > 0 && overview.visits > 0) {
      return overview.visits / overview.pageViews;
    }
    return 0.85;
  }, [overview]);

  // Countries Data for WorldMap and Descending List
  const countryRows: WorldMapCountry[] = useMemo(() => {
    if (s?.countries.status !== 'ok') return [];
    return s.countries.data.rows
      .map((r) => ({
        code: r.item.code,
        nameAr: r.item.nameAr,
        flag: r.item.flag,
        count: r.value,
        percentage: r.percentage,
      }))
      .sort((a, b) => b.count - a.count); // Strict descending order
  }, [s?.countries]);

  const otherCountries = useMemo(() => {
    if (s?.countries.status !== 'ok') return null;
    return s.countries.data.other;
  }, [s?.countries]);

  if (userRole !== 'admin') {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center select-none" dir="rtl">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white">صلاحية الوصول مقيدة</h2>
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

  return (
    <div className="space-y-6 select-none max-w-6xl w-full mx-auto" dir="rtl">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            لوحة المؤشرات والتحليلات
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {activeView === 'website' && data
              ? `${formatStamp(data.window.since)} ← ${formatStamp(data.window.until)}`
              : activeView === 'cloudflare'
              ? 'إحصائيات المعالجة السحابية والتخزين عبر Cloudflare'
              : 'جارٍ التحميل…'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Switcher Button: website / cloudflare */}
          <div
            role="tablist"
            aria-label="نوع التحليلات"
            className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'website'}
              onClick={() => handleViewChange('website')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                activeView === 'website'
                  ? 'bg-white dark:bg-slate-800 text-[#0F4468] dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>website</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'cloudflare'}
              onClick={() => handleViewChange('cloudflare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer ${
                activeView === 'cloudflare'
                  ? 'bg-white dark:bg-slate-800 text-[#0F4468] dark:text-sky-300 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>cloudflare</span>
            </button>
          </div>

          {/* Time range selector */}
          <div
            role="group"
            aria-label="الفترة الزمنية"
            className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-medium"
          >
            {TIME_RANGES.map((range) => {
              const selected = timeRange === range.id;
              return (
                <button
                  key={range.id}
                  onClick={() => handleTimeRangeChange(range.id)}
                  aria-pressed={selected}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#0F4468] focus-visible:outline-none ${
                    selected
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold shadow-2xs'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>

          {activeView === 'website' && (
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              aria-label="تحديث البيانات"
              title="تحديث البيانات"
              className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#0F4468] focus-visible:outline-none"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0F4468]' : ''}`} />
            </button>
          )}
        </div>
      </header>

      {activeView === 'cloudflare' ? (
        <CloudflareAnalyticsDashboard timeRange={timeRange} />
      ) : (
        <>
          {/* Errors and unconfigured alerts */}
          {fetchError && (
            <div role="alert" className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
              تعذر تحديث البيانات: {fetchError}
              {data ? ' — البيانات المعروضة أدناه من آخر تحميل ناجح.' : ''}
            </div>
          )}

          {notConfigured && (
            <div role="status" className={`${CARD} p-5`}>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Cloudflare غير مربوط بعد</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                لا تُعرض أي بيانات أو تقديرات وهمية. اربط الحساب عبر مفاتيح API لتظهر المقاييس الحقيقية.
              </p>
              {s?.overview.status === 'unavailable' && (
                <p dir="ltr" className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 text-left break-words">
                  {s.overview.reason}
                </p>
              )}
            </div>
          )}

      {showSections && (
        <>
          {/* ══════════════════════════════════════════════════════════════════════════
              القسم 1: مربعين بالأعلى (الكاش والزيارات)
              ══════════════════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* مربع 1: الزيارات وحركة المرور */}
            <Card
              title="حركة المرور والزيارات"
              icon={Activity}
            >
              {loading && !overview ? (
                <div className="p-5 space-y-4">
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : s?.overview.status === 'unavailable' ? (
                <Unavailable reason={s.overview.reason} />
              ) : overview ? (
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                    {/* مشاهدات الصفحات */}
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        مشاهدات الصفحات
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span dir="ltr" className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                          {nf(overview.pageViews)}
                        </span>
                        <DeltaChip delta={overview.pageViewsDelta} />
                      </div>
                      <span className="text-[11px] text-slate-400">طلب ناجح لصفحة HTML</span>
                    </div>

                    {/* إجمالي الزيارات */}
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        إجمالي الزيارات
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span dir="ltr" className="text-2xl sm:text-3xl font-black font-mono tabular-nums text-slate-900 dark:text-white">
                          {nf(overview.visits)}
                        </span>
                        <DeltaChip delta={overview.visitsDelta} />
                      </div>
                      <span className="text-[11px] text-slate-400">جلسات فريدة من مصادر خارجية</span>
                    </div>
                  </div>

                  {/* معدل المشاهدات لكل زيارة */}
                  <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      معدل المشاهدات لكل زيارة:
                    </span>
                    <div className="flex items-center gap-2">
                      <span dir="ltr" className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                        {overview.pagesPerVisit === null ? '—' : `${overview.pagesPerVisit} صفحة`}
                      </span>
                      <span className="text-[11px] text-slate-400">/ زائر</span>
                    </div>
                  </div>
                </div>
              ) : null}
            </Card>

            {/* مربع 2: التخزين المؤقت والأداء (الكاش) */}
            <Card
              title="التخزين المؤقت وتوصيل البيانات"
              icon={Zap}
            >
              {loading && !delivery ? (
                <div className="p-5 space-y-4">
                  <Skeleton className="h-10 w-36" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ) : s?.delivery.status === 'unavailable' ? (
                <Unavailable reason={s.delivery.reason} />
              ) : delivery ? (
                <div className="p-5 space-y-4">
                  {/* نسبة الكاش للطلبات */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        نسبة الإصابة حسب الطلبات
                      </span>
                      <span dir="ltr" className="font-mono tabular-nums font-black text-slate-900 dark:text-white text-sm">
                        {delivery.requests.percent === null ? '—' : `${delivery.requests.percent}%`}
                      </span>
                    </div>
                    <Bar percentage={delivery.requests.percent ?? 0} />
                    <p dir="ltr" className="text-[11px] text-slate-400 font-mono text-right">
                      {delivery.requests.percent === null
                        ? 'لا توجد حركة في هذه الفترة'
                        : `${nf(delivery.requests.cached)} من ${nf(delivery.requests.total)} طلب`}
                    </p>
                  </div>

                  {/* نسبة الكاش بالحجم والبيانات المنقولة */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        نسبة الإصابة حسب الحجم
                      </span>
                      <span dir="ltr" className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {delivery.bytes.percent === null ? '—' : `${delivery.bytes.percent}%`}
                      </span>
                    </div>
                    <Bar percentage={delivery.bytes.percent ?? 0} />
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>إجمالي البيانات المُقدَّمة:</span>
                      <span dir="ltr" className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {formatBytes(delivery.bytes.total)}
                      </span>
                    </div>
                  </div>

                  {/* تفاصيل حالات الكاش */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <ul dir="ltr" className="flex flex-wrap gap-1.5">
                      {delivery.breakdown.slice(0, 5).map((b) => (
                        <li
                          key={b.status}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                            b.isHit
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {b.status}: {nf(b.requests)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </Card>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════════
              القسم 2: المقالات (تصميم صفحة المقالات مع عدد المشاهدات والقراء وعين المنشور - 10 مقالات)
              ══════════════════════════════════════════════════════════════════════════ */}
          <Card
            title="المقالات الأكثر قراءة"
            icon={Compass}
          >
            <CardBody section={s?.articles} loading={loading} rows={5}>
              {() => {
                if (top10Articles.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      لا توجد مشاهدات لمقالات مسجلة في هذه الفترة الزمنية.
                    </div>
                  );
                }

                return (
                  <ul className="divide-y divide-slate-100 dark:divide-slate-800/70">
                    {top10Articles.map((art: ArticleRowWithMeta, idx: number) => {
                      const { dateAr, timeStr } = formatArticleArabicDate(
                        art.meta?.createdAt || undefined,
                        art.meta?.date || undefined
                      );
                      const estimatedReaders = Math.max(1, Math.round(art.views * readersRatio));

                      return (
                        <li
                          key={art.id + idx}
                          className="p-4 sm:p-5 hover:bg-slate-50/60 dark:hover:bg-slate-900/30 transition-colors"
                        >
                          <div className="flex items-start gap-3.5 sm:gap-4">
                            <div className="relative shrink-0">
                              {art.meta?.imageUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img
                                  src={art.meta.imageUrl}
                                  alt=""
                                  className="w-16 h-16 sm:w-24 sm:h-20 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 shadow-2xs"
                                />
                              ) : (
                                <div className="w-16 h-16 sm:w-24 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800 flex items-center justify-center font-mono tabular-nums font-bold text-slate-400 text-sm">
                                  #{idx + 1}
                                </div>
                              )}
                              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#A42424] text-white text-[10px] font-bold font-mono tabular-nums flex items-center justify-center shadow-xs">
                                {idx + 1}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <Link
                                href={`/news/${art.id}`}
                                prefetch={false}
                                target="_blank"
                                className="font-bold text-[15px] sm:text-base leading-snug text-slate-900 dark:text-white line-clamp-2 hover:text-[#A42424] dark:hover:text-rose-400 transition-colors block"
                              >
                                {art.meta?.title ?? 'مقال بدون عنوان'}
                              </Link>
                              {art.meta?.subtitle && (
                                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {art.meta.subtitle}
                                </p>
                              )}
                              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                                  {art.meta?.category || 'عام'}
                                </span>
                                {art.meta?.authorName && (
                                  <>
                                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                                    <span className="text-slate-600 dark:text-slate-300 font-medium">{art.meta.authorName}</span>
                                  </>
                                )}
                                {dateAr !== '—' && (
                                  <>
                                    <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                                    <span className="font-mono text-[11px] text-slate-400">
                                      {dateAr} {timeStr ? `(${timeStr})` : ''}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Views, unique readers, and eye view button positioned under image and title */}
                          <div className="mt-3.5 flex flex-wrap items-center gap-2">
                            <div className="flex-1 sm:flex-initial h-10 sm:h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">المشاهدات:</span>
                              <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                                {art.views.toLocaleString()}
                              </span>
                              <DeltaChip delta={art.delta} />
                            </div>

                            <div className="flex-1 sm:flex-initial h-10 sm:h-9 px-3.5 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-xs text-emerald-700 dark:text-emerald-300">
                              <span className="text-[11px] font-medium">القرّاء:</span>
                              <span className="font-mono tabular-nums font-bold">
                                {estimatedReaders.toLocaleString()}
                              </span>
                            </div>

                            <a
                              href={`/news/${art.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-10 w-10 sm:h-9 sm:w-9 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-[#A42424] dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                              title="عرض المنشور"
                              aria-label="عرض المنشور"
                            >
                              <Eye size={16} />
                            </a>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                );
              }}
            </CardBody>
          </Card>

          {/* ══════════════════════════════════════════════════════════════════════════
              القسم 3: Geography (خريطة العالم وتحتها قائمة الدول تنازلياً)
              ══════════════════════════════════════════════════════════════════════════ */}
          <Card
            title="Geography"
            icon={Globe}
          >
            <CardBody section={s?.countries} loading={loading} rows={6}>
              {() => {
                if (countryRows.length === 0) {
                  return (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                      لا توجد بيانات جغرافية مسجلة في هذه الفترة الزمنية.
                    </div>
                  );
                }

                return (
                  <div className="p-4 sm:p-5 space-y-6">
                    {/* World Map Component */}
                    <WorldMap
                      countries={countryRows}
                      activeCode={selectedCountryCode}
                      onSelectCountry={(code) => setSelectedCountryCode(code)}
                    />

                    {/* Descending Countries List directly underneath */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
                      {countryRows.map((country, idx) => {
                        const isSelected = selectedCountryCode?.toUpperCase() === country.code.toUpperCase();

                        return (
                          <div
                            key={country.code + idx}
                            onClick={() => setSelectedCountryCode(isSelected ? null : country.code)}
                            className={`p-3 rounded-xl transition-all border cursor-pointer ${
                              isSelected
                                ? 'bg-sky-50/70 dark:bg-sky-950/30 border-[#0F4468] dark:border-sky-500 shadow-2xs'
                                : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/30 border-transparent hover:border-slate-200/60 dark:hover:border-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-slate-900 dark:text-slate-100 text-[13px] truncate">
                                  {country.nameAr}
                                </span>
                                <span className="text-xs font-mono text-slate-400 shrink-0" dir="ltr">
                                  ({country.code})
                                </span>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono tabular-nums font-bold text-slate-900 dark:text-white text-sm">
                                  {country.count.toLocaleString()}{' '}
                                  <span className="text-xs font-normal text-slate-400 font-sans">مشاهدة</span>
                                </span>
                                <span
                                  className="font-mono tabular-nums text-xs font-bold text-slate-600 dark:text-slate-300 w-12 text-left"
                                  dir="ltr"
                                >
                                  {country.percentage}%
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#0F4468] dark:bg-sky-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(1, country.percentage))}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}

                      {/* Other countries row if present */}
                      {otherCountries && (
                        <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              دول أخرى (خارج القائمة المباشرة)
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 text-sm">
                                {otherCountries.value.toLocaleString()} مشاهدة
                              </span>
                              <span className="font-mono tabular-nums text-xs text-slate-400 w-12 text-left" dir="ltr">
                                {otherCountries.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="mt-2 w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-300 dark:bg-slate-600 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(1, otherCountries.percentage))}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            </CardBody>
          </Card>

          {/* ══════════════════════════════════════════════════════════════════════════
              القسم 4: أجهزة المستخدمين
              ══════════════════════════════════════════════════════════════════════════ */}
          <Card
            title="أجهزة الزوار"
            subtitle="توزيع الأجهزة المستخدمة — النسبة من المشاهدات"
            icon={Smartphone}
          >
            <CardBody section={s?.devices} loading={loading} rows={3}>
              {(d) => <ShareList rows={toRows(d, (i) => ({ key: i.type, label: i.labelAr }))} other={d.other} />}
            </CardBody>
          </Card>
        </>
      )}
        </>
      )}
    </div>
  );
}
