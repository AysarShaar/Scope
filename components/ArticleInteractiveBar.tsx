'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface ArticleInteractiveBarProps {
  articleId?: string;
  url?: string;
  title: string;
  className?: string;
}

export const ArticleInteractiveBar: React.FC<ArticleInteractiveBarProps> = ({
  articleId,
  url,
  title,
  className,
}) => {
  const { lang, dir } = useLanguage();
  const [copied, setCopied] = useState(false);

  // The real address is filled in on the client (below); the server render has no way to know the domain.
  const [currentUrl, setCurrentUrl] = useState<string>(url || '');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(url || window.location.href);
    }
  }, [articleId, url]);

  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      const urlToCopy = currentUrl || window.location.href;
      try {
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(urlToCopy);
        } else {
          const ta = document.createElement('textarea');
          ta.value = urlToCopy;
          ta.style.position = 'fixed';
          ta.style.opacity = '0';
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        // fallback
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
      className={`flex flex-wrap items-center justify-between gap-3 pt-3.5 pb-3.5 border-y border-slate-200 dark:border-slate-800 my-4 ${className || ''}`}
      dir={dir}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ms-1 me-1">
          {lang === 'EN' ? 'Share:' : 'مشاركة:'}
        </span>

        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-[#1877F2] hover:text-white dark:hover:bg-[#1877F2] dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105"
          title={lang === 'EN' ? 'Share on Facebook' : 'مشاركة عبر فيسبوك'}
          aria-label={lang === 'EN' ? 'Share on Facebook' : 'مشاركة عبر فيسبوك'}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </a>

        <a
          href={`https://wa.me/?text=${encodeURIComponent(title ? `${title}\n${currentUrl}` : currentUrl)}`}
          onClick={handleWhatsAppClick}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-[#25D366] hover:text-white dark:hover:bg-[#25D366] dark:hover:text-white border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105"
          title={lang === 'EN' ? 'Share on WhatsApp' : 'مشاركة عبر واتساب'}
          aria-label={lang === 'EN' ? 'Share on WhatsApp' : 'مشاركة عبر واتساب'}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
          </svg>
        </a>

        <a
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105"
          title={lang === 'EN' ? 'Share on 𝕏' : 'مشاركة على منصة 𝕏'}
          aria-label={lang === 'EN' ? 'Share on 𝕏' : 'مشاركة على منصة 𝕏'}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        <button
          onClick={handleCopyLink}
          className={`w-9 h-9 rounded-full transition-all duration-200 flex items-center justify-center cursor-pointer border shadow-2xs hover:scale-105 ${
            copied
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 hover:bg-[#A42424] hover:text-white hover:border-[#A42424] border-slate-200/80 dark:border-slate-700/80'
          }`}
          title={copied ? (lang === 'EN' ? 'Link Copied!' : 'تم نسخ الرابط!') : (lang === 'EN' ? 'Copy Link' : 'نسخ الرابط')}
          aria-label={lang === 'EN' ? 'Copy Link' : 'نسخ الرابط'}
        >
          {copied ? <Check className="w-4 h-4 text-white" /> : <Share2 className="w-4 h-4" />}
        </button>

        {copied && (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full animate-in fade-in duration-200 border border-emerald-500/20">
            {lang === 'EN' ? 'Link copied!' : 'تم نسخ الرابط!'}
          </span>
        )}
      </div>
    </div>
  );
};

export default ArticleInteractiveBar;
