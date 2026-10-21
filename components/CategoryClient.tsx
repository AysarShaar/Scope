'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from './NavLink';
import {
  Newspaper,
  TrendingUp,
  Palette,
  Users,
  Atom,
  Search,
  Clock,
  ChevronDown,
  ShieldCheck,
  Compass,
  Layers,
} from 'lucide-react';
import { ScopeArticle, BreakingItem } from '../data/scopeData';
import { ScopeHeader } from './ScopeHeader';
import { ScopeFooter } from './ScopeFooter';
import { ScopeVisual } from './ScopeVisual';
import { ScopeLiveModal } from './ScopeLiveModal';
import { useLanguage } from '../context/LanguageContext';
import { categoryTranslations } from '../lib/translations';

interface CategoryClientProps {
  slug: string;
  page: number;
  articles: ScopeArticle[];
  total: number;
  totalPages: number;
  hasMore: boolean;
  breaking: BreakingItem[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  news: Newspaper,
  economy: TrendingUp,
  culture: Palette,
  society: Users,
  science: Atom,
  investigations: Search,
  region: Compass,
  world: Compass,
  politics: ShieldCheck,
  history: Layers,
};

export default function CategoryClient({
  slug,
  page,
  articles,
  total,
  totalPages,
  hasMore,
  breaking: breakingNews,
}: CategoryClientProps) {
  const { lang, dir, t, toggleLang } = useLanguage();
  const [isLiveOpen, setIsLiveOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(page);
  const [articleList, setArticleList] = useState(articles);
  const [totalCount, setTotalCount] = useState(total);
  const [pagesCount, setPagesCount] = useState(totalPages);
  const [hasMoreItems, setHasMoreItems] = useState(hasMore);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setCurrentPage(page);
    setArticleList(articles);
    setTotalCount(total);
    setPagesCount(totalPages);
    setHasMoreItems(hasMore);
  }, [slug, page, articles, total, totalPages, hasMore]);

  // Group category articles into responsive rows for tablet / desktop:
  // Desktop (4 cols): 2 rows of 4 standard, then 1 row of 2 featured (مختارات style), repeat.
  // Tablet (3 cols): 2 rows of 3 standard, then 1 row of 2 featured (مختارات style), repeat.
  const newsRows = useMemo(() => {
    const rowsList: Array<{ type: 'standard' | 'featured'; items: ScopeArticle[] }> = [];
    let idx = 0;
    const total = articleList.length;

    if (isTablet) {
      while (idx < total) {
        if (idx < total) {
          rowsList.push({ type: 'standard', items: articleList.slice(idx, idx + 3) });
          idx += 3;
        }
        if (idx < total) {
          rowsList.push({ type: 'standard', items: articleList.slice(idx, idx + 3) });
          idx += 3;
        }
        if (idx < total) {
          rowsList.push({ type: 'featured', items: articleList.slice(idx, idx + 2) });
          idx += 2;
        }
      }
    } else {
      while (idx < total) {
        if (idx < total) {
          rowsList.push({ type: 'standard', items: articleList.slice(idx, idx + 4) });
          idx += 4;
        }
        if (idx < total) {
          rowsList.push({ type: 'standard', items: articleList.slice(idx, idx + 4) });
          idx += 4;
        }
        if (idx < total) {
          rowsList.push({ type: 'featured', items: articleList.slice(idx, idx + 2) });
          idx += 2;
        }
      }
    }

    return rowsList;
  }, [articleList, isTablet]);

  // Group rows into 3-row sections to alternate background every 3 rows (desktop/tablet only)
  // Even chunk (0, 2, ...): White / default background
  // Odd chunk (1, 3, ...): Blue background matching ArticleNavigation picks section
  const rowChunks = useMemo(() => {
    const chunks: Array<{
      chunkIndex: number;
      isBlueBg: boolean;
      rows: Array<{ type: 'standard' | 'featured'; items: ScopeArticle[] }>;
    }> = [];

    for (let i = 0; i < newsRows.length; i += 3) {
      const chunkRows = newsRows.slice(i, i + 3);
      const chunkIndex = Math.floor(i / 3);
      chunks.push({
        chunkIndex,
        isBlueBg: chunkIndex % 2 === 1,
        rows: chunkRows,
      });
    }

    return chunks;
  }, [newsRows]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreItems) return;
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/articles?category=${encodeURIComponent(slug)}&page=${nextPage}&limit=24`);
      if (res.ok) {
        const data = await res.json();
        const incomingArticles: ScopeArticle[] = Array.isArray(data.articles)
          ? data.articles
          : Array.isArray(data.data)
          ? data.data
          : [];

        if (incomingArticles.length > 0) {
          setArticleList((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newItems = incomingArticles.filter((a) => !existingIds.has(a.id));
            return [...prev, ...newItems];
          });
        }

        const pagination = data.pagination || {};
        const total = pagination.total ?? data.total ?? totalCount;
        const totalPages = pagination.totalPages ?? data.totalPages ?? pagesCount;
        const hasMore = pagination.hasMore ?? data.hasMore ?? (incomingArticles.length === 24 && nextPage < totalPages);

        setCurrentPage(nextPage);
        setTotalCount(total);
        setPagesCount(totalPages);
        setHasMoreItems(Boolean(hasMore && incomingArticles.length > 0));
      }
    } catch (err) {
      console.error('[CategoryClient] load more fetch error:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const categoryName = categoryTranslations[slug]?.[lang] || slug;
  const CategoryIcon = CATEGORY_ICONS[slug] || Newspaper;

  return (
    <div
      className="min-h-screen bg-[#f8fafc] dark:bg-[#080e1a] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200"
      dir={dir}
    >
      <ScopeHeader
        currentTab={slug}
        onOpenLive={() => setIsLiveOpen(true)}
        currentLang={lang}
        onToggleLang={toggleLang}
        breakingNews={breakingNews}
      />

      <main className="flex-1 w-full flex flex-col">
        {/* Category Header */}
        <div className="max-w-[1480px] mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-8 pb-4">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
            <div className="w-2.5 h-7 bg-[#A42424] rounded-full shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {categoryName}
            </h1>
          </div>
        </div>

        {articleList.length === 0 ? (
          <div className="max-w-[1480px] mx-auto w-full px-4 sm:px-6 py-12">
            <div className="bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center space-y-3 shadow-xs">
              <CategoryIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {lang === 'AR' ? `لا توجد أخبار في قسم ${categoryName} حالياً` : `No articles in ${categoryName} currently`}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {lang === 'AR'
                  ? 'تابع المنصة، ستتم إضافة تقارير وأخبار جديدة في هذا القسم قريباً.'
                  : 'Stay tuned, new articles and reports will be published in this section soon.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col">
            {/* Mobile View: Vertical list where images span full screen width (no alternating backgrounds) */}
            <div className="md:hidden max-w-[1480px] mx-auto w-full px-4 sm:px-6 space-y-7 pb-8">
              {articleList.map((item) => (
                <Link
                  key={item.id}
                  href={`/news/${item.id}`}
                  prefetch={false}
                  className="group block cursor-pointer border-b border-[#e5e9ef] dark:border-[#1e293b] pb-6 last:border-none"
                >
                  {/* Full-width image across the entire mobile screen */}
                  <div className="relative aspect-[1.618/1] -mx-4 overflow-hidden rounded-none bg-[#0d1624] mb-3.5">
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
                      <ScopeVisual
                        imageUrl={item.imageUrl}
                        type={item.imageType}
                        category={item.categorySlug || slug}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Content with natural page padding */}
                  <span className="text-[12px] font-extrabold text-[#A42424] dark:text-[#F27676] block">
                    {item.category || categoryName}
                  </span>

                  <h3 className="mt-1.5 text-base font-black leading-[1.4] text-[#101722] dark:text-[#f0f3f8] transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676] line-clamp-2">
                    {item.title}
                  </h3>

                  {item.subtitle && (
                    <p className="mt-2 text-xs leading-relaxed text-[#566274] dark:text-[#98a5b7] line-clamp-2">
                      {item.subtitle}
                    </p>
                  )}

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[#566274] dark:text-[#98a5b7]">
                    <Clock className="w-3.5 h-3.5 opacity-70" />
                    <span>{item.date}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Tablet & Desktop View: Alternating row types every 2 rows & alternating backgrounds every 3 rows */}
            <div className="hidden md:block w-full">
              {rowChunks.map((chunk) => (
                <div
                  key={`chunk-${chunk.chunkIndex}`}
                  className={
                    chunk.isBlueBg
                      ? 'w-full py-8 lg:py-10 bg-[#e8f0f7] dark:bg-[#0e1a2b] border-y border-[#d9e0e8] dark:border-[#212c3c] transition-colors my-2'
                      : 'w-full py-5 lg:py-6'
                  }
                >
                  <div className="max-w-[1480px] mx-auto px-4 sm:px-6 space-y-6 lg:space-y-7">
                    {chunk.rows.map((row, rIdx) => {
                      const rowKey = `chunk-${chunk.chunkIndex}-row-${rIdx}`;
                      if (row.type === 'featured') {
                        return (
                          <div
                            key={rowKey}
                            className="grid grid-cols-2 gap-6 lg:gap-7"
                          >
                            {row.items.map((item) => (
                              <Link
                                key={item.id}
                                href={`/news/${item.id}`}
                                prefetch={false}
                                className="group relative block overflow-hidden rounded-xl bg-[#0d1624] text-white isolate shadow-sm hover:shadow-xl transition-all aspect-[1.618/1] cursor-pointer"
                              >
                                {/* Golden ratio full-bleed background image */}
                                <div className="absolute inset-0 -z-20 transition-transform duration-700 ease-out group-hover:scale-105">
                                  <ScopeVisual
                                    imageUrl={item.imageUrl}
                                    type={item.imageType}
                                    category={item.categorySlug || slug}
                                    className="w-full h-full object-cover"
                                  />
                                </div>

                                {/* Cinematic gradient overlay matching Article Navigation */}
                                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgba(5,9,16,.96)] via-[rgba(5,9,16,.65)] via-50% to-[rgba(5,9,16,.08)] pointer-events-none" />

                                {/* Bottom-aligned content overlay */}
                                <div className="absolute inset-x-0 bottom-0 p-5 lg:p-7 flex flex-col justify-end">
                                  <span className="font-extrabold text-[#ffb4b4] uppercase tracking-wider block text-xs sm:text-[13px] mb-1.5">
                                    {item.category || categoryName}
                                  </span>
                                  <h3 className="text-base sm:text-xl lg:text-2xl font-black text-white leading-snug lg:leading-[1.3] group-hover:text-rose-200 transition-colors line-clamp-2 min-h-[2.6em]">
                                    {item.title}
                                  </h3>
                                  {item.subtitle && (
                                    <p className="mt-1.5 text-xs sm:text-sm text-slate-200 line-clamp-1 opacity-90 font-normal">
                                      {item.subtitle}
                                    </p>
                                  )}
                                  <div className="mt-2.5 flex items-center gap-1.5 text-xs text-white/80 font-sans">
                                    <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                    <span>{item.date}</span>
                                  </div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={rowKey}
                          className={`grid ${
                            isTablet ? 'grid-cols-3' : 'grid-cols-4'
                          } gap-6 lg:gap-7`}
                        >
                          {row.items.map((item) => (
                            <Link
                              key={item.id}
                              href={`/news/${item.id}`}
                              prefetch={false}
                              className="group flex flex-col justify-between h-full cursor-pointer"
                            >
                              <div className="flex-1 flex flex-col">
                                {/* Image on top: Golden Ratio 1.618/1 */}
                                <div className="relative aspect-[1.618/1] overflow-hidden rounded-[10px] bg-[#0d1624] mb-3">
                                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                                    <ScopeVisual
                                      imageUrl={item.imageUrl}
                                      type={item.imageType}
                                      category={item.categorySlug || slug}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>

                                {/* Category in Red */}
                                <span className="text-[12px] sm:text-[13px] font-extrabold text-[#A42424] dark:text-[#F27676] block">
                                  {item.category || categoryName}
                                </span>

                                {/* Title: 2 lines with consistent min-height */}
                                <h3 className="mt-1.5 text-base sm:text-lg font-black leading-[1.4] text-[#101722] dark:text-[#f0f3f8] transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676] line-clamp-2 min-h-[2.8em]">
                                  {item.title}
                                </h3>

                                {/* Subtitle */}
                                {item.subtitle && (
                                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#566274] dark:text-[#98a5b7] line-clamp-2">
                                    {item.subtitle}
                                  </p>
                                )}
                              </div>

                              {/* Date at the bottom: pinned via mt-auto so dates are 100% horizontally aligned */}
                              <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-[#566274] dark:text-[#98a5b7]">
                                <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                <span>{item.date}</span>
                              </div>
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {hasMoreItems && (
              <div className="max-w-[1480px] mx-auto w-full px-4 sm:px-6 pt-6 pb-12 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-8 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 bg-[#A42424] hover:bg-[#8B1E1E] text-white shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{lang === 'AR' ? 'جارٍ التحميل...' : 'Loading...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{t.categoryView.loadMore}</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      <ScopeFooter />

      <ScopeLiveModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
      />
    </div>
  );
}
