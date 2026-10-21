'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { ScopeVisual } from './ScopeVisual';

export interface RelatedArticle {
  id: string;
  category: string;
  categorySlug: string;
  title: string;
  subtitle?: string;
  date: string;
  imageUrl?: string;
  imageType?: any;
}

interface RelatedArticlesSidebarProps {
  articles: RelatedArticle[];
}

export const RelatedArticlesSidebar: React.FC<RelatedArticlesSidebarProps> = ({ articles }) => {
  const asideRef = useRef<HTMLElement>(null);
  const [topOffset, setTopOffset] = useState<number | null>(null);

  useEffect(() => {
    const updateOffset = () => {
      if (!asideRef.current) return;
      if (window.innerWidth < 1024) {
        setTopOffset(null);
        return;
      }
      const h = asideRef.current.offsetHeight;
      const v = window.innerHeight;
      const headerH = 96; // 6rem
      const bottomPad = 24; // 1.5rem
      if (h + headerH + bottomPad > v) {
        // Taller than viewport: let it scroll down with page,
        // and stick when its bottom edge reaches (v - bottomPad)
        setTopOffset(Math.round(v - h - bottomPad));
      } else {
        // Fits within viewport: stick at top below header
        setTopOffset(headerH);
      }
    };

    updateOffset();
    window.addEventListener('resize', updateOffset, { passive: true });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && asideRef.current) {
      ro = new ResizeObserver(updateOffset);
      ro.observe(asideRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateOffset);
      if (ro) ro.disconnect();
    };
  }, [articles]);

  if (!articles || articles.length === 0) return null;

  return (
    <aside
      ref={asideRef}
      style={topOffset !== null ? { top: `${topOffset}px` } : undefined}
      className="w-full lg:w-[320px] xl:w-[360px] shrink-0 pt-8 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 lg:sticky lg:self-start z-10"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
        <span className="w-1.5 h-5 bg-[#A42424] rounded-full inline-block" />
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
          تقارير ذات صلة
        </h2>
      </div>

      <div className="space-y-5">
        {articles.map((rel) => (
          <Link
            key={rel.id}
            href={`/news/${rel.id}`}
            prefetch={false}
            className="group block cursor-pointer border-b border-slate-200/80 dark:border-slate-800/80 pb-5 last:border-none last:pb-0"
          >
            {/* Image on top (Golden Ratio) */}
            <div className="relative aspect-[1.618/1] overflow-hidden rounded-[10px] bg-[#0d1624] mb-2.5">
              <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                <ScopeVisual
                  imageUrl={rel.imageUrl}
                  type={rel.imageType}
                  category={rel.categorySlug}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Category */}
            <span className="text-[11px] sm:text-xs font-extrabold text-[#A42424] dark:text-[#F27676] block mb-1">
              {rel.category}
            </span>

            {/* Title */}
            <h3 className="text-sm sm:text-[15px] font-black leading-[1.4] text-slate-900 dark:text-white transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676] line-clamp-2">
              {rel.title}
            </h3>

            {/* Subtitle */}
            {rel.subtitle && (
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                {rel.subtitle}
              </p>
            )}

            {/* Date */}
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400 font-sans">
              <Clock className="w-3.5 h-3.5 opacity-70" />
              <span>{rel.date}</span>
            </div>
          </Link>
        ))}
      </div>
    </aside>
  );
};
