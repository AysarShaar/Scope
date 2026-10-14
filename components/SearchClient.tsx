'use client';

import React, { useState } from 'react';
import Link from './NavLink';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  Clock,
  SlidersHorizontal,
  SearchX,
  Search as SearchIcon,
  TrendingUp,
  Tag,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { ScopeArticle } from '../data/scopeData';
import { ScopeHeader } from './ScopeHeader';
import { ScopeFooter } from './ScopeFooter';
import { ScopeVisual } from './ScopeVisual';
import { ScopeLiveModal } from './ScopeLiveModal';
import { useLanguage } from '../context/LanguageContext';

const CATEGORIES = [
  { id: 'all', labelAr: 'جميع الأقسام', labelEn: 'All Sections' },
  { id: 'news', labelAr: 'الأخبار', labelEn: 'News' },
  { id: 'economy', labelAr: 'اقتصاد', labelEn: 'Economy' },
  { id: 'culture', labelAr: 'ثقافة', labelEn: 'Culture' },
  { id: 'society', labelAr: 'مجتمع', labelEn: 'Society' },
  { id: 'science', labelAr: 'علوم', labelEn: 'Science' },
  { id: 'investigations', labelAr: 'تحقيقات خاصة', labelEn: 'Investigations' },
];

const TRENDING_TAGS = [
  'قمة الرياض',
  'الذكاء الاصطناعي',
  'طاقة متجددة',
  'اقتصاد رقمي',
  'مؤتمر المناخ',
  'سوق العمل',
  'موانئ البحر الأحمر',
];

export type SearchSortParam = 'relevance' | 'latest';

interface SearchClientProps {
  q: string;
  category: string;
  sort: SearchSortParam;
  page: number;
  articles: ScopeArticle[];
  total: number;
  totalPages: number;
  tooShort: boolean;
}

function searchHref(q: string, category: string, sort: SearchSortParam, page: number): string {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (category !== 'all') params.set('category', category);
  if (sort !== 'relevance') params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/search?${qs}` : '/search';
}

export default function SearchClient({
  q,
  category,
  sort,
  page,
  articles,
  total,
  totalPages,
  tooShort,
}: SearchClientProps) {
  const router = useRouter();
  const { t, lang, toggleLang, dir } = useLanguage();
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;
  const hasQuery = q.trim().length > 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <ScopeHeader
        currentTab="news"
        onSelectTab={(tab) => {
          if (tab === 'home') router.push('/');
          else router.push(`/?tab=${tab}`);
        }}
        onOpenLive={() => setIsLiveOpen(true)}
        currentLang={lang}
        onToggleLang={toggleLang}
        initialSearchQuery={q}
      />

      <main className="flex-1 max-w-[1480px] mx-auto w-full px-3 sm:px-6 pt-6 pb-16">
        <div className="flex items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-slate-800/80 mb-6">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-[#A42424] dark:hover:text-rose-400 transition-colors"
          >
            <BackIcon className="w-3.5 h-3.5" />
            <span>{t.searchPage?.backHome || 'العودة للرئيسية'}</span>
          </Link>

          <span className="text-xs text-slate-400 font-mono">
            SCOPE MEDIA · {lang === 'AR' ? 'محرك البحث التحريري' : 'Editorial Search Wire'}
          </span>
        </div>

        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-7 bg-[#A42424] rounded-full shrink-0" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex flex-wrap items-baseline gap-2">
                <span>{t.searchPage?.resultsFor || 'نتائج البحث عن:'}</span>
                <span className="text-[#A42424] font-bold">&ldquo;{q || '...'}&rdquo;</span>
              </h1>
            </div>

            {hasQuery && !tooShort && (
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-mono">
                تم العثور على{' '}
                <strong className="text-slate-900 dark:text-white font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded">
                  {total}
                </strong>{' '}
                {t.searchPage?.resultsCount || 'مادة صحفية'}
              </p>
            )}
          </div>
        </div>

        {hasQuery && !tooShort && (
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {CATEGORIES.map((cat) => {
                const label = lang === 'AR' ? cat.labelAr : cat.labelEn;
                const isSelected = category === cat.id;
                return (
                  <Link
                    key={cat.id}
                    href={searchHref(q, cat.id, sort, 1)}
                    prefetch={false}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#A42424] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-700'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0 self-end md:self-auto">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>ترتيب حسب:</span>
              <Link
                href={searchHref(q, category, 'relevance', 1)}
                prefetch={false}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  sort === 'relevance'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                الأكثر مطابقة
              </Link>
              <span className="text-slate-400">|</span>
              <Link
                href={searchHref(q, category, 'latest', 1)}
                prefetch={false}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  sort === 'latest'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                الأحدث
              </Link>
            </div>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-xl p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-6 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-[#A42424] mx-auto flex items-center justify-center">
              {hasQuery ? <SearchX className="w-8 h-8" /> : <SearchIcon className="w-8 h-8" />}
            </div>

            <div className="space-y-2">
              {!hasQuery ? (
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  اكتب كلمة أو أكثر في خانة البحث لتبدأ
                </h2>
              ) : tooShort ? (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    كلمة البحث قصيرة جداً
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    اكتب حرفين على الأقل، أو جرّب أحد المواضيع المقترحة.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                    {t.searchPage?.noResults || 'لم يتم العثور على نتائج مطابقة لـ'}{' '}
                    <span className="text-[#A42424]">&ldquo;{q}&rdquo;</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {category !== 'all'
                      ? 'لا توجد نتائج في هذا القسم، جرّب «جميع الأقسام» أو كلمات أخرى.'
                      : t.searchPage?.noResultsDesc ||
                        'يرجى التأكد من كتابة الكلمات بشكل صحيح، أو تجربة كلمات أقل أو تصفح الأقسام الشائعة.'}
                  </p>
                  {category !== 'all' && (
                    <Link
                      href={searchHref(q, 'all', sort, 1)}
                      prefetch={false}
                      className="inline-block text-xs font-bold text-[#A42424] dark:text-rose-400 hover:underline"
                    >
                      البحث في جميع الأقسام
                    </Link>
                  )}
                </>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#A42424]" />
                <span>{t.searchPage?.popularTags || 'مواضيع مقترحة للبحث:'}</span>
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {TRENDING_TAGS.map((tag) => (
                  <Link
                    key={tag}
                    href={searchHref(tag, 'all', 'relevance', 1)}
                    prefetch={false}
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-slate-800 hover:bg-[#A42424] hover:text-white text-slate-700 dark:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    <span>#{tag}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-lg transition-all flex flex-col group hover:-translate-y-0.5 duration-200"
              >
                <Link href={`/news/${article.id}`} prefetch={false} className="block relative aspect-16/10 overflow-hidden bg-slate-900">
                  <ScopeVisual
                    type={article.imageType}
                    imageUrl={article.imageUrl}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="absolute top-3 right-3 z-10 px-2.5 py-1 text-[11px] font-bold rounded-md bg-[#A42424] text-white shadow-xs">
                    {article.category}
                  </span>
                </Link>

                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{article.date}</span>
                      </span>
                      {article.time && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{article.time}</span>
                          </span>
                        </>
                      )}
                    </div>

                    <Link href={`/news/${article.id}`} prefetch={false} className="block group-hover:text-[#A42424] transition-colors">
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white leading-snug line-clamp-2">
                        {article.title}
                      </h3>
                    </Link>

                    {article.subtitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {article.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium truncate">
                      {article.author?.name || 'فريق تحرير SCOPE MEDIA'}
                    </span>
                    <Link
                      href={`/news/${article.id}`}
                      prefetch={false}
                      className="text-[#A42424] dark:text-rose-400 font-bold hover:underline inline-flex items-center gap-0.5 shrink-0"
                    >
                      <span>قراءة المادة</span>
                      {dir === 'rtl' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            </div>

            {totalPages > 1 && (
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  الصفحة <span className="font-bold text-slate-900 dark:text-white">{page}</span> من{' '}
                  <span className="font-bold text-slate-900 dark:text-white">{totalPages}</span>
                </div>
                <div className="flex items-center gap-2">
                  {page > 1 ? (
                    <Link
                      href={searchHref(q, category, sort, page - 1)}
                      prefetch={false}
                      className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    >
                      <PrevIcon className="w-3.5 h-3.5" />
                      <span>السابقة</span>
                    </Link>
                  ) : null}
                  {page < totalPages ? (
                    <Link
                      href={searchHref(q, category, sort, page + 1)}
                      prefetch={false}
                      className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-[#A42424] hover:bg-[#8B1E1E] text-white shadow-sm"
                    >
                      <span>التالية</span>
                      <NextIcon className="w-3.5 h-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ScopeFooter
        onSelectTab={(tab) => {
          if (tab === 'home') router.push('/');
          else router.push(`/?tab=${tab}`);
        }}
      />

      <ScopeLiveModal isOpen={isLiveOpen} onClose={() => setIsLiveOpen(false)} />
    </div>
  );
}
