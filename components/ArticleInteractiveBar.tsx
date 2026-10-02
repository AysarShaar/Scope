'use client';

import React, { useState } from 'react';
import { Share2, Check, Bookmark, BookmarkCheck } from 'lucide-react';

interface ArticleInteractiveBarProps {
  articleId: string;
  title: string;
}

export const ArticleInteractiveBar: React.FC<ArticleInteractiveBarProps> = ({ articleId, title }) => {
  const [copied, setCopied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const getPageUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return `https://scope-media.pages.dev/news/${articleId}`;
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(getPageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleToggleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const currentUrl = getPageUrl();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 pb-3 border-y border-slate-200 dark:border-slate-800 my-4">
      {/* Social Share Buttons with Rounded-Full borders */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
          مشاركة المقال:
        </span>

        {/* WhatsApp */}
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(title + '\n' + currentUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-700 dark:text-emerald-400 hover:text-white rounded-full transition-colors font-medium text-xs flex items-center gap-1.5"
          title="مشاركة عبر واتساب"
        >
          <span>واتساب</span>
        </a>

        {/* X / Twitter */}
        <a
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(currentUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-black hover:text-white text-slate-800 dark:text-slate-200 rounded-full transition-colors font-medium text-xs flex items-center gap-1.5"
          title="مشاركة على منصة 𝕏"
        >
          <span>منصة 𝕏</span>
        </a>

        {/* Telegram */}
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500 text-sky-700 dark:text-sky-400 hover:text-white rounded-full transition-colors font-medium text-xs flex items-center gap-1.5"
          title="مشاركة عبر تلغرام"
        >
          <span>تلغرام</span>
        </a>

        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-700 dark:text-blue-400 hover:text-white rounded-full transition-colors font-medium text-xs flex items-center gap-1.5"
          title="مشاركة على لينكد إن"
        >
          <span>لينكد إن</span>
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-[#dc2626] text-slate-800 dark:text-slate-200 hover:text-white rounded-full transition-colors font-medium text-xs flex items-center gap-1.5 cursor-pointer"
          title="نسخ الرابط"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
        </button>
      </div>

      {/* Bookmark Action */}
      <button
        onClick={handleToggleBookmark}
        className={`px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer flex items-center gap-1.5 ${
          bookmarked
            ? 'border-[#dc2626] bg-rose-50 dark:bg-rose-950/40 text-[#dc2626]'
            : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
      >
        {bookmarked ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
        <span>{bookmarked ? 'محفوظ في قائمتك' : 'حفظ المقال'}</span>
      </button>
    </div>
  );
};
