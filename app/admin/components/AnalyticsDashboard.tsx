'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from '../../../components/NavLink';
import { RefreshCw, ShieldAlert, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { useAdmin } from './AdminShell';
import type {
  AnalyticsResponse,
  ArticleRowWithMeta,
  Delta,
  Section,
  Shares,
  SourceCategory,
} from '@/lib/analyticsMetrics';

type TimeRange = 'today' | '7d' | '30d';
type ArticleFilter = 'all' | 'rising' | 'fading';

const TIME_RANGES: Array<{ id: TimeRange; label: string }> = [
  { id: 'today', label: 'آخر 24 ساعة' },
  { id: '7d', label: 'آخر 7 أيام' },
  { id: '30d', label: 'آخر 30 يوماً' },
];

const CATEGORY_LABEL: Record<SourceCategory, string> = {
  search: 'بحث',
  social: 'اجتماعي',
  direct: 'مباشر',
  internal: 'داخلي',
  referral: 'موقع آخر',
};

const ARTICLE_LIST_SIZE = 10;
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

/* ───────────────────────── small building blocks ───────────────────────── */

function Skeleton({ className }: { className: string }) {
  return <div className={`bg-slate-200/80 dark:bg-slate-800/80 rounded animate-pulse ${className}`} />;
}

function Unavailable({ reason }: { reason: string }) {
  return (
    <div
      role="status"
      className="m-4 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60"
    >
      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">غير متاح</p>
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
        className={`h-full rounded-full ${muted ? 'bg-slate-300 dark:bg-slate-600' : 'bg-[#A42424] dark:bg-rose-500'}`}
        style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
      />
    </div>
  );
}

function Card({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${CARD} overflow-hidden`}>
      <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle ? <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{subtitle}</p> : null}
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
    // first load failed: say so instead of showing skeletons forever
    return <Unavailable reason="Not loaded (see the error above)" />;
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

function Kpi({
  label,
  loading,
  value,
  delta,
  hint,
}: {
  label: string;
  loading: boolean;
  value: string | null;
  delta?: Delta;
  hint?: string;
}) {
  return (
    <div className={`${CARD} p-4`}>
      <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">{label}</span>
      {loading && value === null ? (
        <Skeleton className="mt-2 h-8 w-24" />
      ) : (
        <>
          <div
            dir="ltr"
            className="mt-2 text-2xl sm:text-3xl font-black font-mono tabular-nums tracking-tight text-right text-slate-900 dark:text-white"
          >
            {value ?? '—'}
          </div>
          <div className="mt-1.5 flex items-center gap-2 min-h-[20px]">
            {delta ? <DeltaChip delta={delta} /> : null}
            {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── articles ───────────────────────── */

function ArticleRows({ rows, filter }: { rows: ArticleRowWithMeta[]; filter: ArticleFilter }) {
  const visible = useMemo(() => {
    if (filter === 'rising') {
      return rows
        .filter((r) => r.trend === 'rising' || r.trend === 'new')
        .sort((a, b) => b.views - b.prevViews - (a.views - a.prevViews));
    }
    if (filter === 'fading') {
      return rows.filter((r) => r.trend === 'fading').sort((a, b) => a.views - a.prevViews - (b.views - b.prevViews));
    }
    return rows.filter((r) => r.views > 0); // already sorted by views
  }, [rows, filter]);

  if (visible.length === 0) {
    return (
      <p className="p-5 text-xs text-slate-500 dark:text-slate-400">
        {filter === 'all' ? 'لا توجد مشاهدات لمقالات في هذه الفترة.' : 'لا توجد مقالات في هذه الفئة حالياً.'}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800/60">
      {visible.slice(0, ARTICLE_LIST_SIZE).map((art, idx) => (
        <li key={art.id} className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className="font-mono tabular-nums text-xs font-bold text-slate-400 w-5 text-center shrink-0">
              {idx + 1}
            </span>
            <div className="min-w-0">
              <Link
                href={`/news/${art.id}`}
                prefetch={false}
                target="_blank"
                className="text-[13px] font-bold text-slate-900 dark:text-white hover:text-[#A42424] dark:hover:text-rose-400 line-clamp-2 transition-colors focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
              >
                {art.meta?.title ?? 'مقال غير موجود في قاعدة البيانات'}
              </Link>
              <span className="mt-0.5 block text-[11px] text-slate-400 truncate">
                {art.meta
                  ? [art.meta.category, art.meta.authorName].filter(Boolean).join(' · ')
                  : <span dir="ltr" className="font-mono">{art.id}</span>}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-left space-y-1">
            <div dir="ltr" className="font-mono tabular-nums font-bold text-sm text-slate-900 dark:text-white text-right">
              {nf(art.views)}
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <DeltaChip delta={art.delta} />
            </div>
            <div dir="ltr" className="text-[10px] text-slate-400 font-mono tabular-nums text-right">
              كان {nf(art.prevViews)}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ───────────────────────── page ───────────────────────── */

export default function AnalyticsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userRole } = useAdmin();

  const urlRange = searchParams.get('range') as TimeRange | null;
  const [timeRange, setTimeRange] = useState<TimeRange>(
    urlRange && ['today', '7d', '30d'].includes(urlRange) ? urlRange : 'today'
  );
  const [articleFilter, setArticleFilter] = useState<ArticleFilter>('all');
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const requestId = useRef(0);

  const handleTimeRangeChange = useCallback(
    (range: TimeRange) => {
      setTimeRange(range);
      const params = new URLSearchParams(searchParams.toString());
      params.delete('tab'); // legacy param from the old tabbed layout
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
      if (id !== requestId.current) return; // a newer request superseded this one
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

  const s = data?.sections;
  const overview = s?.overview.status === 'ok' ? s.overview.data : null;
  const notConfigured = data !== null && !data.configured;
  const showSections = !notConfigured;

  const articleRows = s?.articles.status === 'ok' ? s.articles.data.rows : [];
  const risingCount = articleRows.filter((r) => r.trend === 'rising' || r.trend === 'new').length;
  const fadingCount = articleRows.filter((r) => r.trend === 'fading').length;

  return (
    <div className="space-y-5 select-none max-w-5xl w-full mx-auto" dir="rtl">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            لوحة المؤشرات والتحليلات
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {data
              ? `${formatStamp(data.window.since)} ← ${formatStamp(data.window.until)} · تُقارَن بالفترة السابقة المماثلة`
              : 'جارٍ التحميل…'}
          </p>
        </div>
        <div className="flex items-center gap-2">
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
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all duration-150 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none ${
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
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            aria-label="تحديث البيانات"
            title="تحديث البيانات"
            className="p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#A42424]' : ''}`} />
          </button>
        </div>
      </header>

      {/* Errors and configuration state */}
      {fetchError ? (
        <div role="alert" className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 text-xs text-rose-800 dark:text-rose-300">
          تعذر تحديث البيانات: {fetchError}
          {data ? ' — المعروض أدناه من آخر تحميل ناجح.' : ''}
        </div>
      ) : null}

      {notConfigured ? (
        <div role="status" className={`${CARD} p-5`}>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Cloudflare غير مربوط</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            لا تُعرض أي أرقام تقديرية. اربط الحساب لتظهر البيانات الحقيقية.
          </p>
          {s?.overview.status === 'unavailable' ? (
            <p dir="ltr" className="mt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 text-left break-words">
              {s.overview.reason}
            </p>
          ) : null}
        </div>
      ) : null}

      {showSections ? (
        <>
          {/* KPIs: three different quantities, never conflated */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {s && s.overview.status === 'unavailable' ? (
              <div className={`${CARD} col-span-2 lg:col-span-3`}>
                <Unavailable reason={s.overview.reason} />
              </div>
            ) : (
              <>
                <Kpi
                  label="مشاهدات الصفحات"
                  loading={loading}
                  value={overview ? nf(overview.pageViews) : null}
                  delta={overview?.pageViewsDelta}
                />
                <Kpi
                  label="الزيارات"
                  loading={loading}
                  value={overview ? nf(overview.visits) : null}
                  delta={overview?.visitsDelta}
                />
                <Kpi
                  label="مشاهدات لكل زيارة"
                  loading={loading}
                  value={overview ? (overview.pagesPerVisit === null ? null : String(overview.pagesPerVisit)) : null}
                  hint={overview && overview.pagesPerVisit === null ? 'لا زيارات' : undefined}
                />
              </>
            )}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 -mt-2">
            المشاهدة: طلب صفحة HTML ناجح من زائر فعلي. الزيارة: بداية جلسة قادمة من مرجع خارجي أو مباشرة. الأرقام قد تشمل
            زواحف، وقد تكون تقديرية بسبب اعتماد Cloudflare على العيّنات.
          </p>

          {/* Articles: what is rising, what is fading */}
          <Card title="المقالات" subtitle="الأعلى مشاهدةً، وما يصعد أو يتراجع مقارنةً بالفترة السابقة">
            <div className="px-4 pt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'all', label: 'الأكثر قراءة' },
                  { id: 'rising', label: `يصعد (${risingCount})` },
                  { id: 'fading', label: `يتراجع (${fadingCount})` },
                ] as Array<{ id: ArticleFilter; label: string }>
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setArticleFilter(f.id)}
                  aria-pressed={articleFilter === f.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border cursor-pointer transition-colors focus-visible:ring-2 focus-visible:ring-[#A42424] focus-visible:outline-none ${
                    articleFilter === f.id
                      ? 'border-[#A42424] text-[#A42424] dark:border-rose-500 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <CardBody section={s?.articles} loading={loading} rows={5}>
              {(d) => (
                <>
                  <ArticleRows rows={d.rows} filter={articleFilter} />
                  {d.metadataError ? (
                    <p dir="ltr" className="px-4 pb-3 text-[11px] text-amber-700 dark:text-amber-400 text-left">
                      تعذر جلب عناوين المقالات: {d.metadataError}
                    </p>
                  ) : null}
                  {d.truncated ? (
                    <p className="px-4 pb-3 text-[11px] text-slate-500 dark:text-slate-400">
                      القائمة تقتصر على أكثر 40 مقالاً في كل فترة؛ المقالات الأقل قراءة غير ظاهرة.
                    </p>
                  ) : null}
                </>
              )}
            </CardBody>
          </Card>

          {/* Where readers come from */}
          <Card title="مصادر القراء" subtitle="من أين تبدأ الزيارات — النسبة من إجمالي الزيارات">
            <CardBody section={s?.sources} loading={loading}>
              {(d) => (
                <ShareList
                  rows={toRows(d, (i) => ({ key: i.key, label: i.labelAr, badge: CATEGORY_LABEL[i.category] }))}
                  other={d.other}
                />
              )}
            </CardBody>
          </Card>

          {/* Who is reading */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card title="الدول" subtitle="النسبة من إجمالي مشاهدات الصفحات">
              <CardBody section={s?.countries} loading={loading}>
                {(d) => (
                  <ShareList
                    rows={toRows(d, (i) => ({ key: i.code, label: i.nameAr, lead: i.flag }))}
                    other={d.other}
                  />
                )}
              </CardBody>
            </Card>
            <Card title="الأجهزة" subtitle="النسبة من إجمالي مشاهدات الصفحات">
              <CardBody section={s?.devices} loading={loading} rows={3}>
                {(d) => <ShareList rows={toRows(d, (i) => ({ key: i.type, label: i.labelAr }))} other={d.other} />}
              </CardBody>
            </Card>
          </div>

          {/* Delivery */}
          <Card title="التوصيل والتخزين المؤقت" subtitle="كل طلبات الزوار (صفحات وصور وملفات)، وليس الصفحات فقط">
            <CardBody section={s?.delivery} loading={loading} rows={3}>
              {(d) => (
                <div className="p-4 space-y-4">
                  {(
                    [
                      { label: 'نسبة الإصابة حسب الطلبات', r: d.requests, detail: `${nf(d.requests.cached)} من ${nf(d.requests.total)} طلب` },
                      { label: 'نسبة الإصابة حسب الحجم', r: d.bytes, detail: `${formatBytes(d.bytes.cached)} من ${formatBytes(d.bytes.total)}` },
                    ] as const
                  ).map((row) => (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{row.label}</span>
                        <span dir="ltr" className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                          {row.r.percent === null ? '—' : `${row.r.percent}%`}
                        </span>
                      </div>
                      <Bar percentage={row.r.percent ?? 0} />
                      <p dir="ltr" className="text-[11px] text-slate-400 font-mono text-right">
                        {row.r.percent === null ? 'لا توجد حركة في هذه الفترة' : row.detail}
                      </p>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-500 dark:text-slate-400">البيانات المُقدَّمة</span>
                    <span dir="ltr" className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      {formatBytes(d.bytes.total)}
                    </span>
                  </div>
                  <ul dir="ltr" className="flex flex-wrap gap-1.5">
                    {d.breakdown.map((b) => (
                      <li
                        key={b.status}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono tabular-nums ${
                          b.isHit
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {b.status} {nf(b.requests)}
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                    تُحتسب hit وstale وrevalidated وupdating إصابةً. قد تظهر الصفحات الديناميكية بحالة dynamic، وهي غير مخزّنة ما لم
                    تُضبط قاعدة تخزين لها.
                    {d.truncated ? ' بعض الحالات النادرة غير مدرجة.' : ''}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
