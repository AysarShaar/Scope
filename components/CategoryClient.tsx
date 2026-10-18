'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    setCurrentPage(page);
    setArticleList(articles);
    setTotalCount(total);
    setPagesCount(totalPages);
    setHasMoreItems(hasMore);
  }, [slug, page, articles, total, totalPages, hasMore]);

  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMoreItems) return;
    const nextPage = currentPage + 1;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`/api/articles?category=${encodeURIComponent(slug)}&page=${nextPage}&limit=20`);
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
        const hasMore = pagination.hasMore ?? data.hasMore ?? (incomingArticles.length === 20 && nextPage < totalPages);

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

      <main className="flex-1 max-w-[1480px] mx-auto w-full px-3 sm:px-6 py-6 sm:py-8 space-y-7">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-7 bg-[#A42424] rounded-full shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {categoryName}
            </h1>
          </div>
        </div>

        {articleList.length === 0 ? (
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
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {articleList.map((art) => (
                <Link
                  key={art.id}
                  href={`/news/${art.id}`}
                  prefetch={false}
                  className="group bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800/90 rounded-xl overflow-hidden hover:shadow-md hover:border-[#A42424] dark:hover:border-slate-700 transition-all flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-950 shrink-0">
                    <ScopeVisual
                      imageUrl={art.imageUrl}
                      type={art.imageType}
                      category={art.categorySlug}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2.5 right-2.5 rtl:right-2.5 rtl:left-auto ltr:left-2.5 ltr:right-auto px-2 py-0.5 rounded text-[10px] font-bold bg-[#A42424] text-white shadow-xs">
                      {art.category || categoryName}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1.5">
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#A42424] dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                        {art.title}
                      </h2>
                      {art.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {art.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{art.author?.name || 'محرر سكوب'}</span>
                      <span className="font-mono text-[10px]">{art.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {hasMoreItems && (
              <div className="pt-8 pb-4 flex justify-center">
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
