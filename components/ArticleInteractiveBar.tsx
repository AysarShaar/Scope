'use client';

import React, { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface ArticleInteractiveBarProps {
  articleId?: string;
  url?: string;
  title: string;
  className?: string;
  itemType?: 'article' | 'program' | 'episode' | 'video';
}

export const ArticleInteractiveBar: React.FC<ArticleInteractiveBarProps> = ({
  articleId,
  url,
  title,
  className,
}) => {
  const { lang, dir } = useLanguage();
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string>(url || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(url || window.location.href);
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        setCanNativeShare(true);
      }
    }
  }, [articleId, url]);

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: currentUrl || window.location.href,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
      }
    }
  };

  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const text = encodeURIComponent(title ? `${title}\n${currentUrl}` : currentUrl);
    const isMobile = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile) {
      e.preventDefault();
      window.location.href = `whatsapp://send?text=${text}`;
    }
  };

  return (
    <div
      className={`pt-4 pb-2 mt-4 mb-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 sm:gap-3.5 w-full ${className || ''}`}
      dir={dir}
    >
      {/* Label: strictly "مشاركة:" or "Share:" */}
      <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 shrink-0 select-none">
        {lang === 'EN' ? 'Share:' : 'مشاركة:'}
      </span>

      {/* Action Buttons: evenly fill remaining row on mobile */}
      <div className="flex-1 flex items-center gap-1.5 sm:gap-2 justify-between sm:justify-start">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(title ? `${title}\n${currentUrl}` : currentUrl)}`}
          onClick={handleWhatsAppClick}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial sm:w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-[#25D366] hover:text-white dark:hover:bg-[#25D366] dark:hover:text-white hover:border-[#25D366] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(37,211,102,0.25)]"
          title={lang === 'EN' ? 'Share on WhatsApp' : 'مشاركة عبر واتساب'}
          aria-label={lang === 'EN' ? 'Share on WhatsApp' : 'مشاركة عبر واتساب'}
        >
          <svg className="w-5 h-5 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </a>

        {/* 𝕏 (Twitter) */}
        <a
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial sm:w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black hover:border-black dark:hover:border-white border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(0,0,0,0.25)]"
          title={lang === 'EN' ? 'Share on 𝕏' : 'مشاركة على منصة 𝕏'}
          aria-label={lang === 'EN' ? 'Share on 𝕏' : 'مشاركة على منصة 𝕏'}
        >
          <svg className="w-4.5 h-4.5 sm:w-4.5 sm:h-4.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial sm:w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-[#229ED9] hover:text-white dark:hover:bg-[#229ED9] dark:hover:text-white hover:border-[#229ED9] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(34,158,217,0.25)]"
          title={lang === 'EN' ? 'Share on Telegram' : 'مشاركة عبر تيليجرام'}
          aria-label={lang === 'EN' ? 'Share on Telegram' : 'مشاركة عبر تيليجرام'}
        >
          <svg className="w-5 h-5 sm:w-5 sm:h-5 -translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.91 3.79L20.3 20.84c-.25 1.21-.98 1.5-1.99.94l-5.55-4.09-2.68 2.58c-.3.3-.55.55-1.12.55l.4-5.64 10.27-9.28c.45-.4-.1-.62-.7-.22L6.26 13.98l-5.46-1.71c-1.19-.37-1.21-1.18.25-1.75L22.4 2.45c.98-.37 1.84.23 1.51 1.34z" />
          </svg>
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 sm:flex-initial sm:w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:text-white hover:border-[#1877F2] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(24,119,242,0.25)]"
          title={lang === 'EN' ? 'Share on Facebook' : 'مشاركة عبر فيسبوك'}
          aria-label={lang === 'EN' ? 'Share on Facebook' : 'مشاركة عبر فيسبوك'}
        >
          <svg className="w-5 h-5 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.52-.14-2.71-.14-2.72 0-4.79 1.66-4.79 4.9v2.6H7v4h3V22h4v-8.5z" />
          </svg>
        </a>

        {/* Native Mobile Share Sheet Button */}
        {canNativeShare && (
          <button
            onClick={handleNativeShare}
            className="flex-1 sm:flex-initial sm:w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-[#A42424] hover:text-white dark:hover:bg-[#A42424] dark:hover:text-white hover:border-[#A42424] border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5 active:scale-95 shadow-2xs hover:shadow-[0_4px_12px_rgba(164,36,36,0.25)] cursor-pointer"
            title={lang === 'EN' ? 'More sharing options' : 'المزيد من خيارات المشاركة'}
            aria-label={lang === 'EN' ? 'More sharing options' : 'المزيد من خيارات المشاركة'}
          >
            <Share2 className="w-5 h-5 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ArticleInteractiveBar;
