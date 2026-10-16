'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Check,
  ArrowDown,
  ArrowUp,
  RotateCcw,
  Calendar,
  User,
  X,
  Filter,
} from 'lucide-react';
import { ScopeArticle } from '../../../data/scopeData';
import { IsoDatePicker } from './IsoDatePicker';

const PAGE_SIZE = 10;

const CATEGORIES = [
  { slug: 'news', label: 'أخبار عامة' },
  { slug: 'economy', label: 'اقتصاد' },
  { slug: 'society', label: 'مجتمع' },
  { slug: 'culture', label: 'ثقافة' },
  { slug: 'science', label: 'علوم' },
  { slug: 'investigations', label: 'تحقيقات' },
];

const ARABIC_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

export function formatArticleArabicDate(createdAt?: string, fallbackDate?: string): {
  dateAr: string;
  timeStr: string;
} {
  const raw = (createdAt || fallbackDate || '').trim();
  if (!raw) return { dateAr: '—', timeStr: '' };

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIndex = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const monthName = ARABIC_MONTH_NAMES[monthIndex] || '';
    const dayFormatted = String(day).padStart(2, '0');
    const timeStr = isoMatch[4] && isoMatch[5] ? `${isoMatch[4]}:${isoMatch[5]}` : '';
    return {
      dateAr: `${dayFormatted} ${monthName} ${year}`,
      timeStr,
    };
  }

  const d = new Date(raw);
  if (!isNaN(d.getTime())) {
    const dayFormatted = String(d.getDate()).padStart(2, '0');
    const monthName = ARABIC_MONTH_NAMES[d.getMonth()] || '';
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return {
      dateAr: `${dayFormatted} ${monthName} ${year}`,
      timeStr: `${hours}:${minutes}`,
    };
  }

  return { dateAr: raw, timeStr: '' };
}

function getLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface Props {
  articles?: ScopeArticle[];
  isLoading?: boolean;
  onCreateNew: () => void;
  onEdit: (a: ScopeArticle) => void;
  onDelete: (id: string, title: string) => void;
  onApprove?: (id: string, title: string) => Promise<void>;
  userRole: 'admin' | 'editor_in_chief' | 'editor';
  isSpecialOnly?: boolean;
}

export default function ArticlesList({
  onCreateNew,
  onEdit,
  onDelete,
  onApprove,
  userRole,
  isSpecialOnly = false,
}: Props) {
  const searchParams = useSearchParams();

  const urlQ = searchParams?.get('q') || '';
  const urlStatus = (searchParams?.get('status') as 'all' | 'published' | 'pending') || 'all';
  const urlCat = searchParams?.get('cat') || 'all';
  const urlAuthor = searchParams?.get('author') || 'all';
  const urlSort = (searchParams?.get('sort') as 'desc' | 'asc') || 'desc';
  const urlPage = parseInt(searchParams?.get('page') || '1', 10) || 1;

  const [search, setSearch] = useState(urlQ);
  const [debouncedSearch, setDebouncedSearch] = useState(urlQ);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'pending'>(urlStatus);
  const [catFilter, setCatFilter] = useState(urlCat);
  const [authorFilter, setAuthorFilter] = useState(urlAuthor);
  const [datePreset, setDatePreset] = useState<
    'all' | 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'exact' | 'custom'
  >('all');
  const [showFilters, setShowFilters] = useState(false);
  const [exactDate, setExactDate] = useState('');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>(urlSort);
  const [page, setPage] = useState(urlPage);

  // Sync state to URL without reloading
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (catFilter !== 'all') params.set('cat', catFilter);
    if (authorFilter !== 'all') params.set('author', authorFilter);
    if (sortOrder !== 'desc') params.set('sort', sortOrder);
    if (page > 1) params.set('page', String(page));
    const str = params.toString();
    const newUrl = str ? `?${str}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [debouncedSearch, statusFilter, catFilter, authorFilter, sortOrder, page]);

  const [articles, setArticles] = useState<ScopeArticle[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [isDbLoading, setIsDbLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const [authorsList, setAuthorsList] = useState<string[]>([]);

  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const canManageArticles = userRole === 'admin' || userRole === 'editor_in_chief';

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    searchDebounceTimer.current = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 350);
  };

  const handleClearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(1);
  };

  useEffect(() => {
    let isMounted = true;
    fetch('/api/editors')
      .then((r) => r.json())
      .then((d) => {
        if (isMounted && d?.success && Array.isArray(d.data)) {
          const names = d.data.map((e: { name?: string }) => e.name?.trim()).filter(Boolean);
          setAuthorsList(Array.from(new Set(names)) as string[]);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchArticlesFromDatabase = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      params.set('includePending', 'true');
      params.set('full', 'false');
      params.set('sort', sortOrder);

      if (debouncedSearch.trim()) {
        params.set('search', debouncedSearch.trim());
      }
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (catFilter !== 'all') {
        params.set('category', catFilter);
      }
      if (isSpecialOnly) {
        params.set('special', 'true');
      }
      if (authorFilter !== 'all') {
        params.set('author', authorFilter);
      }

      const today = new Date();
      const todayStr = getLocalIsoDate(today);

      if (datePreset === 'today') {
        params.set('exactDate', todayStr);
      } else if (datePreset === 'yesterday') {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        params.set('exactDate', getLocalIsoDate(y));
      } else if (datePreset === 'last7days') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        params.set('fromDate', getLocalIsoDate(d7));
        params.set('toDate', todayStr);
      } else if (datePreset === 'thisMonth') {
        const mStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        params.set('fromDate', mStart);
        params.set('toDate', todayStr);
      } else if (datePreset === 'exact' && exactDate) {
        params.set('exactDate', exactDate);
      } else if (datePreset === 'custom') {
        if (customFrom) params.set('fromDate', customFrom);
        if (customTo) params.set('toDate', customTo);
      }

      const res = await fetch(`/api/articles?${params.toString()}`);
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          setArticles(data.data || []);
          setTotalCount(data.pagination?.total ?? 0);
          setTotalPages(Math.max(1, data.pagination?.totalPages ?? 1));
          if (data.meta?.pendingCount !== undefined) {
            setPendingCount(data.meta.pendingCount);
          }
        }
      }
    } catch (err) {
      console.error('[ArticlesList] Database fetch error:', err);
    } finally {
      setIsDbLoading(false);
    }
  }, [
    page,
    sortOrder,
    debouncedSearch,
    statusFilter,
    catFilter,
    authorFilter,
    datePreset,
    exactDate,
    customFrom,
    customTo,
    isSpecialOnly,
  ]);

  const [togglingSpecialId, setTogglingSpecialId] = useState<string | null>(null);

  const handleToggleSpecial = async (art: ScopeArticle) => {
    const isCurrentlySpecial = Boolean(art.isSpecial);
    const nextVal = !isCurrentlySpecial;
    const confirmMsg = nextVal
      ? `هل تريد تعيين المقال:\n"${art.title}"\nكمقال مميز؟`
      : `هل أنت متأكد من إزالة المقال:\n"${art.title}"\nمن المقالات المميزة؟`;
    if (!confirm(confirmMsg)) return;

    setTogglingSpecialId(art.id);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(art.id)}/special`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSpecial: nextVal }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        await fetchArticlesFromDatabase();
      } else {
        alert(data?.error || 'فشل تحديث حالة المقال المميز');
      }
    } catch {
      alert('حدث خطأ أثناء الاتصال بالخادم لتحديث حالة المقال المميز');
    } finally {
      setTogglingSpecialId(null);
    }
  };

  useEffect(() => {
    fetchArticlesFromDatabase();
  }, [fetchArticlesFromDatabase]);

  const isFiltered =
    debouncedSearch.trim() !== '' ||
    statusFilter !== 'all' ||
    catFilter !== 'all' ||
    authorFilter !== 'all' ||
    datePreset !== 'all' ||
    exactDate !== '' ||
    customFrom !== '' ||
    customTo !== '' ||
    sortOrder !== 'desc';

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setStatusFilter('all');
    setCatFilter('all');
    setAuthorFilter('all');
    setDatePreset('all');
    setExactDate('');
    setCustomFrom('');
    setCustomTo('');
    setSortOrder('desc');
    setPage(1);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    setPage(1);
  };

  const handleQuickApprove = async (art: ScopeArticle) => {
    if (!onApprove) return;
    setApprovingId(art.id);
    try {
      await onApprove(art.id, art.title);
      await fetchArticlesFromDatabase();
    } finally {
      setApprovingId(null);
    }
  };

  const handleDeleteItem = async (art: ScopeArticle) => {
    onDelete(art.id, art.title);
    setTimeout(() => {
      fetchArticlesFromDatabase();
    }, 400);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {isSpecialOnly ? 'المقالات المميزة' : 'إدارة الأخبار والمقالات'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
              {totalCount} مادة
            </span>
          </div>
          <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isSpecialOnly
              ? 'عرض وإدارة المقالات المميزة المعروضة في Hero الموقع الرئيسي'
              : 'استعلام لحظي من قاعدة البيانات مع تقسيم كل 10 مواد لتسريع التصفح'}
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#A42424] hover:bg-[#8B1E1E] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus size={15} />
          <span>مقال جديد</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ابحث بالعنوان، الكاتب، القسم، أو تفاصيل المادة..."
              className="w-full pr-10 pl-9 py-2.5 max-sm:py-3 max-sm:text-base bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-[#A42424] dark:focus:border-[#A42424] transition-colors"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="مسح البحث"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-stretch gap-2 sm:contents">
          <button
            onClick={toggleSortOrder}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 max-sm:py-3 max-sm:flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer shrink-0 select-none"
            title="تبديل الترتيب الزمني"
          >
            {sortOrder === 'desc' ? (
              <>
                <ArrowDown size={14} className="text-[#A42424]" />
                <span>الأحدث إنشاءً</span>
              </>
            ) : (
              <>
                <ArrowUp size={14} className="text-[#A42424]" />
                <span>الأقدم إنشاءً</span>
              </>
            )}
          </button>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              aria-expanded={showFilters}
              className="sm:hidden relative inline-flex items-center justify-center gap-1.5 px-3.5 py-3 flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none"
            >
              <Filter size={14} className="text-[#A42424]" />
              <span>{showFilters ? 'إخفاء الفلاتر' : 'الفلاتر'}</span>
              {isFiltered && <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#A42424]" />}
            </button>
          </div>
        </div>

        <div className={`${showFilters ? 'block' : 'hidden'} sm:block space-y-3 sm:space-y-4`}>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 flex items-center gap-1.5 p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/60 dark:border-slate-800/60 text-xs">
            <button
              onClick={() => {
                setStatusFilter('all');
                setPage(1);
              }}
              className={`flex-1 py-1.5 max-sm:py-2.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              الكل
            </button>

            <button
              onClick={() => {
                setStatusFilter('published');
                setPage(1);
              }}
              className={`flex-1 py-1.5 max-sm:py-2.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center ${
                statusFilter === 'published'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              المنشورة
            </button>

            <button
              onClick={() => {
                setStatusFilter('pending');
                setPage(1);
              }}
              className={`flex-1 py-1.5 max-sm:py-2.5 px-2 rounded-lg font-semibold transition-all cursor-pointer text-center inline-flex items-center justify-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>قيد المراجعة</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          <div className="md:col-span-3">
            <select
              value={catFilter}
              onChange={(e) => {
                setCatFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 max-sm:py-3 max-sm:text-base px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-[#A42424] cursor-pointer"
            >
              <option value="all">جميع الأقسام</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={authorFilter}
              onChange={(e) => {
                setAuthorFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 max-sm:py-3 max-sm:text-base px-3 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-hidden focus:border-[#A42424] cursor-pointer"
            >
              <option value="all">جميع الكتاب والمحررين</option>
              {authorsList.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar size={13} className="text-[#A42424]" />
              <span>تصفية حسب التاريخ:</span>
            </div>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-[#A42424] dark:text-rose-400 hover:underline font-semibold cursor-pointer"
              >
                مسح جميع الفلاتر
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:flex-wrap max-sm:overflow-x-auto no-scrollbar max-sm:-mx-1 max-sm:px-1 max-sm:pb-1 text-xs">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'today', label: 'اليوم' },
              { id: 'yesterday', label: 'أمس' },
              { id: 'last7days', label: 'آخر 7 أيام' },
              { id: 'thisMonth', label: 'هذا الشهر' },
              { id: 'exact', label: 'تاريخ محدد' },
              { id: 'custom', label: 'نطاق مخصص' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setDatePreset(preset.id as typeof datePreset);
                  setPage(1);
                }}
                className={`px-3 py-1.5 max-sm:py-2 max-sm:shrink-0 max-sm:whitespace-nowrap rounded-lg font-medium transition-colors cursor-pointer ${
                  datePreset === preset.id
                    ? 'bg-[#A42424] text-white shadow-2xs font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {datePreset === 'exact' && (
            <div className="pt-1 flex max-sm:flex-col max-sm:items-stretch items-center gap-2">
              <span className="text-xs text-slate-500">اختر التاريخ:</span>
              <IsoDatePicker
                  value={exactDate}
                  onChange={(v) => {
                    setExactDate(v);
                    setPage(1);
                  }}
                />
            </div>
          )}

          {datePreset === 'custom' && (
            <div className="pt-1 flex max-sm:flex-col max-sm:items-stretch items-center gap-3 flex-wrap text-xs">
              <div className="flex max-sm:flex-col max-sm:items-stretch items-center gap-1.5">
                <span className="text-slate-500">من تاريخ:</span>
                <IsoDatePicker
                  value={customFrom}
                  onChange={(v) => {
                    setCustomFrom(v);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex max-sm:flex-col max-sm:items-stretch items-center gap-1.5">
                <span className="text-slate-500">إلى تاريخ:</span>
                <IsoDatePicker
                  value={customTo}
                  onChange={(v) => {
                    setCustomTo(v);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0c101c] border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        {isDbLoading ? (
          <div>
            {/* Desktop Table Skeletons */}
            <div className="overflow-x-auto max-sm:hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
                  <tr>
                    <th className="px-4 py-3.5 font-semibold">المادة الصحفية</th>
                    <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden sm:table-cell">القسم</th>
                    <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap">الحالة</th>
                    <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden md:table-cell">الكاتب</th>
                    <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden lg:table-cell">تاريخ الإنشاء</th>
                    <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 shrink-0" />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="h-4 w-3/4 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
                            <div className="h-3 w-1/3 bg-slate-100 dark:bg-slate-800/50 rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="px-3.5 py-3.5 hidden sm:table-cell">
                        <div className="h-5 w-16 bg-slate-200/70 dark:bg-slate-800/70 rounded-md" />
                      </td>
                      <td className="px-3.5 py-3.5">
                        <div className="h-5 w-20 bg-slate-200/70 dark:bg-slate-800/70 rounded-md" />
                      </td>
                      <td className="px-3.5 py-3.5 hidden md:table-cell">
                        <div className="h-4 w-24 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
                      </td>
                      <td className="px-3.5 py-3.5 hidden lg:table-cell">
                        <div className="h-4 w-28 bg-slate-200/70 dark:bg-slate-800/70 rounded" />
                      </td>
                      <td className="px-3.5 py-3.5 text-center">
                        <div className="h-8 w-28 mx-auto bg-slate-200/70 dark:bg-slate-800/70 rounded-lg" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Skeletons */}
            <ul className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800/70 p-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="p-3.5 space-y-3 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-lg bg-slate-200/80 dark:bg-slate-800/80 shrink-0" />
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="h-4 w-3/4 bg-slate-200/80 dark:bg-slate-800/80 rounded" />
                      <div className="h-3 w-1/2 bg-slate-100 dark:bg-slate-800/60 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg" />
                    <div className="h-10 flex-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-lg" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-20 text-slate-400 dark:text-slate-500 text-xs space-y-3">
            <p>لا توجد مواد تطابق معايير البحث والفلترة المحددة في قاعدة البيانات.</p>
            {isFiltered && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw size={12} />
                <span>إعادة ضبط جميع الفلاتر</span>
              </button>
            )}
          </div>
        ) : (
          <>
          <div className="overflow-x-auto max-sm:hidden">
            <table className="w-full text-xs text-right">
              <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
                <tr>
                  <th className="px-4 py-3.5 font-semibold">المادة الصحفية</th>
                  <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden sm:table-cell">القسم</th>
                  <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap">الحالة</th>
                  <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden md:table-cell">الكاتب</th>
                  <th
                    onClick={toggleSortOrder}
                    className="px-3.5 py-3.5 font-semibold whitespace-nowrap hidden lg:table-cell cursor-pointer select-none group hover:text-slate-900 dark:hover:text-white transition-colors"
                    title={sortOrder === 'desc' ? 'انقر للترتيب من الأقدم للأحدث' : 'انقر للترتيب من الأحدث للأقدم'}
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>تاريخ الإنشاء (اليوم · الشهر · السنة)</span>
                      {sortOrder === 'desc' ? (
                        <span className="inline-flex items-center gap-0.5 text-[#A42424] font-bold">
                          <ArrowDown size={13} className="stroke-[2.5]" />
                          <span className="text-[10px]">الأحدث</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 text-[#A42424] font-bold">
                          <ArrowUp size={13} className="stroke-[2.5]" />
                          <span className="text-[10px]">الأقدم</span>
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-3.5 py-3.5 font-semibold whitespace-nowrap text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {articles.map((art) => {
                  const { dateAr, timeStr } = formatArticleArabicDate(art.createdAt, art.date);
                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-3">
                          {art.imageUrl && (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={art.imageUrl}
                              alt=""
                              className="w-11 h-11 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-800"
                            />
                          )}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1 block text-[13px]">
                              {art.title}
                            </span>
                            {art.subtitle && (
                              <span className="text-slate-500 dark:text-slate-400 line-clamp-1 block text-xs">
                                {art.subtitle}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3.5 py-3.5 whitespace-nowrap hidden sm:table-cell">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                          {art.category || 'عام'}
                        </span>
                      </td>

                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        {art.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            <span>قيد المراجعة</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>منشور</span>
                          </span>
                        )}
                      </td>

                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 hidden md:table-cell">
                        {art.author?.name || '—'}
                      </td>

                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600 dark:text-slate-300 hidden lg:table-cell">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 inline-block" dir="rtl">
                            <bdi>{dateAr}</bdi>
                          </span>
                          {timeStr && (
                            <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                              {timeStr}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3.5 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1">
                          {art.status === 'pending' && canManageArticles && onApprove && (
                            <button
                              onClick={() => handleQuickApprove(art)}
                              disabled={approvingId === art.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                              title="اعتماد ونشر المادة"
                            >
                              <Check size={12} />
                              <span>اعتماد</span>
                            </button>
                          )}

                          {art.status !== 'pending' && (
                            <a
                              href={`/news/${art.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                              title="معاينة في الموقع"
                            >
                              <Eye size={14} />
                            </a>
                          )}

                          <button
                            onClick={() => onEdit(art)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                            title="تعديل المادة"
                          >
                            <Edit3 size={14} />
                          </button>

                          {canManageArticles && (
                            <button
                              onClick={() => handleToggleSpecial(art)}
                              disabled={togglingSpecialId === art.id}
                              className={`inline-flex items-center px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                                art.isSpecial
                                  ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60'
                                  : 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
                              }`}
                              title={art.isSpecial ? 'إزالة من المقالات المميزة' : 'تعيين كمقال مميز'}
                            >
                              <span>{art.isSpecial ? 'إزالة من المميزة' : 'تعيين كمميز'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteItem(art)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                            title="حذف المادة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <ul className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800/70">
            {articles.map((art) => {
              const { dateAr } = formatArticleArabicDate(art.createdAt, art.date);
              const isPending = art.status === 'pending';
              return (
                <li key={art.id} className="p-3.5">
                  <div className="flex gap-3">
                    {art.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={art.imageUrl}
                        alt=""
                        className="w-16 h-16 rounded-lg object-cover shrink-0 bg-slate-100 dark:bg-slate-800"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-[15px] leading-snug text-slate-900 dark:text-white line-clamp-2">
                        {art.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                        {[art.category || 'عام', art.author?.name].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            isPending ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                          {isPending ? 'قيد المراجعة' : 'منشور'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{dateAr}</span>
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {isPending && canManageArticles && onApprove && (
                      <button
                        onClick={() => handleQuickApprove(art)}
                        disabled={approvingId === art.id}
                        className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 disabled:opacity-50 cursor-pointer"
                      >
                        <Check size={14} />
                        <span>اعتماد</span>
                      </button>
                    )}
                    <button
                      onClick={() => onEdit(art)}
                      className="flex-1 h-10 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 active:bg-slate-100 dark:active:bg-slate-800 cursor-pointer"
                    >
                      <Edit3 size={14} />
                      <span>تعديل</span>
                    </button>
                    {canManageArticles && (
                      <button
                        onClick={() => handleToggleSpecial(art)}
                        disabled={togglingSpecialId === art.id}
                        className={`flex-1 h-10 inline-flex items-center justify-center rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 transition-colors ${
                          art.isSpecial
                            ? 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 active:bg-rose-200/50'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:bg-slate-100 dark:active:bg-slate-800'
                        }`}
                      >
                        <span>{art.isSpecial ? 'إزالة من المميزة' : 'تعيين كمميز'}</span>
                      </button>
                    )}
                    {!isPending && (
                      <a
                        href={`/news/${art.id}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="معاينة في الموقع"
                        className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                      >
                        <Eye size={16} />
                      </a>
                    )}
                    <button
                      onClick={() => handleDeleteItem(art)}
                      aria-label="حذف المادة"
                      className="h-10 w-10 shrink-0 inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          </>
        )}

        {!isDbLoading && articles.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div className="sm:hidden">
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)}
              </strong>
              <span> من </span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalCount}</strong>
            </div>
            <div className="max-sm:hidden">
              <span>عرض </span>
              <strong className="text-slate-800 dark:text-slate-200">
                {(page - 1) * PAGE_SIZE + 1}
              </strong>
              <span> إلى </span>
              <strong className="text-slate-800 dark:text-slate-200">
                {Math.min(page * PAGE_SIZE, totalCount)}
              </strong>
              <span> من أصل </span>
              <strong className="text-slate-800 dark:text-slate-200 font-mono">
                {totalCount}
              </strong>
              <span> مادة في قاعدة البيانات</span>
            </div>

            <div className="flex items-center gap-1.5 max-sm:w-full max-sm:justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-2.5 py-1.5 max-sm:py-2.5 max-sm:px-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
              >
                <ChevronRight size={14} />
                <span>السابق</span>
              </button>

              <span className="px-3 py-1 font-mono font-bold text-slate-700 dark:text-slate-300">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-2.5 py-1.5 max-sm:py-2.5 max-sm:px-4 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors"
              >
                <span>التالي</span>
                <ChevronLeft size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
