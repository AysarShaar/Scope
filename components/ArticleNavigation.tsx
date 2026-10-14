'use client';

import React from 'react';
import Link from './NavLink';
import { ScopeArticle } from '../data/scopeData';
import { ScopeVisual } from './ScopeVisual';
import { useLanguage } from '../context/LanguageContext';

interface ArticleNavigationProps {
  currentArticleId: string;
  navArticles: ScopeArticle[];
  className?: string;
}

/**
 * "Editor's picks": a bento grid on a tinted full-width band. One large tile plus six small ones
 * (7 cells exactly). With any other count it falls back to an even grid so no cell is left empty.
 */
export const ArticleNavigation: React.FC<ArticleNavigationProps> = ({
  currentArticleId,
  navArticles,
  className = '',
}) => {
  const { lang, dir } = useLanguage();
  const items = navArticles.filter((a) => a.id !== currentArticleId).slice(0, 7);
  if (items.length === 0) return null;

  const bento = items.length === 7;

  return (
    <section
      dir={dir}
      aria-labelledby="picksTitle"
      className={`bg-[#e8f0f7] dark:bg-[#0e1a2b] border-y border-[#d9e0e8] dark:border-[#212c3c] py-7 sm:py-8 transition-colors ${className}`}
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-10">
        <h2
          id="picksTitle"
          className="mb-7 text-2xl sm:text-3xl lg:text-[2.2rem] font-black leading-snug text-[#101722] dark:text-[#f0f3f8]"
        >
          {lang === 'AR' ? 'مختارات' : "Editor's Picks"}
        </h2>

        <div
          className={`grid grid-cols-2 gap-3 lg:gap-3.5 ${
            bento
              ? 'lg:grid-cols-4 lg:grid-rows-[repeat(3,minmax(150px,1fr))]'
              : 'lg:grid-cols-4'
          }`}
        >
          {items.map((item, index) => {
            const big = bento && index === 0;
            return (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                prefetch={false}
                className={`group relative block overflow-hidden rounded-[10px] bg-[#0d1624] text-white isolate ${
                  big ? 'col-span-2 min-h-[380px] lg:row-span-3' : 'min-h-[200px]'
                }`}
              >
                <div className="absolute inset-0 -z-20 transition-transform duration-700 ease-out group-hover:scale-105">
                  <ScopeVisual
                    imageUrl={item.imageUrl}
                    type={item.imageType}
                    category={item.categorySlug}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgba(5,9,16,.92)] via-[rgba(5,9,16,.55)] via-45% to-[rgba(5,9,16,.05)]" />

                <div className={`absolute inset-x-0 bottom-0 ${big ? 'p-5 sm:p-7' : 'p-4 sm:p-[18px]'}`}>
                  <span className={`font-extrabold text-[#ffb4b4] ${big ? 'text-[13px]' : 'text-xs'}`}>
                    {item.category}
                  </span>
                  <h3
                    className={`mt-1.5 font-extrabold ${
                      big
                        ? 'text-2xl sm:text-3xl leading-[1.4] line-clamp-4'
                        : 'text-sm sm:text-base leading-normal line-clamp-3'
                    }`}
                  >
                    {item.title}
                  </h3>
                  {big && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/80">
                      <span>{item.date}</span>
                      {item.author?.name && <span>{item.author.name}</span>}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};
