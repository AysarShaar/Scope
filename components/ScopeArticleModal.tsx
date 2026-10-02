'use client';

import React, { useState, useEffect } from 'react';
import { X, Share2, Bookmark, BookmarkCheck, Check, MessageSquare, Send, Clock, Eye } from 'lucide-react';
import { ScopeArticle } from '../data/scopeData';
import { ScopeVisual } from './ScopeVisual';

interface ScopeArticleModalProps {
  article: ScopeArticle | null;
  onClose: () => void;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
}

export const ScopeArticleModal: React.FC<ScopeArticleModalProps> = ({
  article,
  onClose,
  isBookmarked,
  onToggleBookmark,
}) => {
  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [userName, setUserName] = useState('');
  const [userComments, setUserComments] = useState<Array<{ name: string; text: string; time: string }>>([
    { name: 'عبد الله السالم', text: 'تحليل موضوعي ومتوازن يعكس واقع المتغيرات المتسارعة.', time: 'منذ ساعتين' },
  ]);
  const [commentAdded, setCommentAdded] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !userName.trim()) return;
    setUserComments((prev) => [
      { name: userName.trim(), text: commentText.trim(), time: 'الآن' },
      ...prev,
    ]);
    setCommentText('');
    setCommentAdded(true);
    setTimeout(() => setCommentAdded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl h-[92vh] max-h-[850px] bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xs shadow-2xl flex flex-col overflow-hidden text-stone-900 dark:text-stone-100">
        {/* Top Bar */}
        <div className="px-5 py-3 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-[#e11d48] text-white text-xs font-bold px-2 py-0.5 rounded-xs">
              {article.category}
            </span>
            <span className="text-xs text-stone-400 font-mono">{article.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleBookmark(article.id)}
              className={`p-1.5 rounded-xs border transition-colors cursor-pointer ${
                isBookmarked
                  ? 'border-[#e11d48] text-[#e11d48] bg-rose-50 dark:bg-rose-950/40'
                  : 'border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white'
              }`}
              title={isBookmarked ? 'إزالة من المحفوظات' : 'حفظ المقال'}
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-xs border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors cursor-pointer relative"
              title="مشاركة الرابط"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              {copied && (
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] py-0.5 px-2 rounded-xs whitespace-nowrap shadow-md">
                  تم نسخ الرابط!
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xs bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors cursor-pointer"
              title="إغلاق (Esc)"
              aria-label="إغلاق (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white leading-snug">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed font-normal">
                {article.subtitle}
              </p>
            )}

            {/* Author info & Quick Share Bar */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
              {article.author && (
                <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2">
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    بقلم: {article.author.name}
                  </span>
                  <span>·</span>
                  <span>{article.author.role}</span>
                </div>
              )}

              {/* Social Share Bar */}
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <span className="text-[11px] font-medium text-stone-400 ml-1">مشاركة:</span>
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(article.title + '\n' + (typeof window !== 'undefined' ? window.location.href : ''))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-xs transition-colors font-medium text-[11px]"
                  title="واتساب"
                >
                  واتساب
                </a>
                {/* X / Twitter */}
                <a
                  href={`https://x.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-stone-200 dark:bg-stone-800 hover:bg-black hover:text-white text-stone-700 dark:text-stone-300 rounded-xs transition-colors font-medium text-[11px]"
                  title="إكس"
                >
                  منصة 𝕏
                </a>
                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}&text=${encodeURIComponent(article.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white rounded-xs transition-colors font-medium text-[11px]"
                  title="تلغرام"
                >
                  تلغرام
                </a>
                {/* Copy Link */}
                <button
                  onClick={handleShare}
                  className="px-2 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-[#e11d48] text-stone-700 dark:text-stone-300 hover:text-white rounded-xs transition-colors font-medium text-[11px] flex items-center gap-1 cursor-pointer"
                  title="نسخ الرابط"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Share2 className="w-3 h-3" />}
                  <span>{copied ? 'تم!' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Visual Artwork */}
          <div className="relative aspect-[16/9] w-full rounded-xs overflow-hidden shadow-xs">
            <ScopeVisual type={article.imageType} className="w-full h-full" />
          </div>

          {article.caption && (
            <p className="text-xs text-stone-500 text-center font-sans -mt-3">
              {article.caption}
            </p>
          )}

          {/* Content Paragraphs */}
          <div className="space-y-4 text-sm sm:text-base leading-relaxed text-stone-800 dark:text-stone-200 font-normal">
            {article.content ? (
              article.content.map((p, i) => <p key={i}>{p}</p>)
            ) : (
              <p>
                تفاصيل التغطية الحصرية والتحليل الإخباري المستمر من فريق عمل SCOPE MEDIA حول أبعاد هذا الملف وتأثيراته الإقليمية والدولية.
              </p>
            )}
          </div>

          {/* Comments Section */}
          <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-[#e11d48]" />
              <span>التعليقات ({userComments.length})</span>
            </div>

            <form onSubmit={handleAddComment} className="space-y-2 bg-stone-50 dark:bg-stone-800/40 p-3 rounded-xs border border-stone-200 dark:border-stone-700">
              <input
                type="text"
                placeholder="اسمك أو لقبك..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#e11d48]"
              />
              <textarea
                placeholder="أضف تعليقك على المقال..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                required
                rows={2}
                className="w-full px-3 py-1.5 text-xs bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#e11d48] resize-none"
              />
              <div className="flex justify-between items-center">
                {commentAdded ? (
                  <span className="text-xs text-emerald-500">تم نشر التعليق بنجاح!</span>
                ) : <span />}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#e11d48] hover:bg-[#be123c] text-white text-xs font-bold rounded-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>إرسال التعليق</span>
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>

            <div className="space-y-2.5">
              {userComments.map((com, idx) => (
                <div key={idx} className="p-3 bg-stone-50 dark:bg-stone-800/20 rounded-xs border border-stone-100 dark:border-stone-800">
                  <div className="flex items-center justify-between text-[11px] text-stone-400 mb-1">
                    <span className="font-bold text-stone-800 dark:text-stone-200">{com.name}</span>
                    <span>{com.time}</span>
                  </div>
                  <p className="text-xs text-stone-700 dark:text-stone-300">{com.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
