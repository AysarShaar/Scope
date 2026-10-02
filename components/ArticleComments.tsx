'use client';

import React, { useState } from 'react';
import { MessageSquare, Send, Check } from 'lucide-react';

interface ArticleCommentsProps {
  articleId: string;
}

export const ArticleComments: React.FC<ArticleCommentsProps> = ({ articleId }) => {
  const [userName, setUserName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Array<{ id: number; name: string; text: string; time: string }>>([
    {
      id: 1,
      name: 'عبد الله السالم',
      text: 'قراءة استراتيجية عميقة وموضوعية في أبعاد التحولات الراهنة. شكراً لفريق SCOPE MEDIA على هذه التغطية المتميزة.',
      time: 'منذ ساعتين',
    },
    {
      id: 2,
      name: 'د. نادية التميمي',
      text: 'طرح متوازن يسلط الضوء على الفرص والتحديات الاقتصادية دون مبالغة أو تهويل.',
      time: 'منذ 4 ساعات',
    },
  ]);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !commentText.trim()) return;

    setComments((prev) => [
      {
        id: Date.now(),
        name: userName.trim(),
        text: commentText.trim(),
        time: 'الآن',
      },
      ...prev,
    ]);

    setUserName('');
    setCommentText('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3500);
  };

  return (
    <section className="pt-8 border-t border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#dc2626]" />
          <span>آراء وتعليقات القراء ({comments.length})</span>
        </h3>
        <span className="text-xs text-slate-400">تخضع التعليقات للمراجعة والالتزام بميثاق النشر</span>
      </div>

      {/* Comment Form with Rounded Elements */}
      <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-[#0c1424] p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="اسمك الكريم..."
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            required
            className="w-full px-4 py-2 text-xs bg-white dark:bg-[#121b2d] border border-slate-300 dark:border-slate-700 rounded-full text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#dc2626] placeholder-slate-400"
          />
        </div>
        <textarea
          placeholder="اكتب تعليقك أو وجهة نظرك حول هذا التقرير..."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          required
          rows={3}
          className="w-full px-4 py-2.5 text-xs bg-white dark:bg-[#121b2d] border border-slate-300 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#dc2626] resize-none placeholder-slate-400"
        />
        <div className="flex items-center justify-between pt-1">
          {success ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>تم نشر تعليقك بنجاح!</span>
            </span>
          ) : (
            <span />
          )}
          <button
            type="submit"
            className="px-6 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-bold rounded-full flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>نشر التعليق</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {comments.map((com) => (
          <div
            key={com.id}
            className="p-4 bg-white dark:bg-[#121b2d] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                {com.name}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{com.time}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {com.text}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};
