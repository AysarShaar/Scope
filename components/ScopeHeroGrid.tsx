'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Clock, ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import {
  ScopeShow,
  scopeHeroArticles,
  scopeRightHeroCards,
  scopeFeaturedNews,
  scopeInvestigationSpecial,
  scopeShows,
} from '../data/scopeData';
import { ScopeVisual } from './ScopeVisual';

interface ScopeHeroGridProps {
  onOpenShow: (show: ScopeShow) => void;
  onViewMoreNews: () => void;
  onViewMoreReports: () => void;
  onViewAllShows: () => void;
  showProgramsInside?: boolean;
}

export const ScopeProgramsRow: React.FC<{
  onOpenShow: (show: ScopeShow) => void;
  onViewAllShows: () => void;
  className?: string;
}> = ({ onOpenShow, onViewAllShows, className = '' }) => {
  return (
    <div className={`w-full space-y-3 pt-2 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            برامج SCOPE MEDIA الحصرية
          </h3>
        </div>
        <button
          onClick={onViewAllShows}
          className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#dc2626] dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
        >
          <span>دليل البرامج الكامل</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {scopeShows.map((show) => (
          <div
            key={show.id}
            onClick={() => onOpenShow(show)}
            className="relative aspect-[16/11] rounded-xl overflow-hidden cursor-pointer group shadow-sm bg-slate-950 border border-slate-800/80"
          >
            <ScopeVisual type={show.imageType} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

            {/* Play Button Indicator (Rounded-full) */}
            <div className="absolute bottom-2.5 left-2.5 w-7 h-7 rounded-full bg-[#dc2626]/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#dc2626] transition-all z-20">
              <Play className="w-3 h-3 fill-white ml-0.5" />
            </div>

            {/* Title & Host Subtitle */}
            <div className="absolute bottom-2.5 right-2.5 left-10 text-right z-10">
              <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-200 transition-colors line-clamp-1">
                {show.title}
              </h5>
              <p className="text-[10px] text-slate-300 line-clamp-1 font-normal opacity-90">
                {show.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ScopeHeroGrid: React.FC<ScopeHeroGridProps> = ({
  onOpenShow,
  onViewMoreNews,
  onViewMoreReports,
  onViewAllShows,
  showProgramsInside = true,
}) => {
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const currentHero = scopeHeroArticles[activeHeroIndex];

  // Newsletter state
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  return (
    <div className="w-full space-y-7">
      {/* 1. TOP HERO SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
        {/* 1A. RIGHT COLUMN: 3 Stacked Editorial Cards (4 cols in RTL) */}
        <div className="md:col-span-4 flex flex-col justify-between gap-3 h-auto md:h-[470px] order-2 md:order-1">
          {scopeRightHeroCards.map((card) => (
            <Link
              key={card.id}
              href={`/news/${card.id}`}
              className="relative flex-1 min-h-[135px] md:min-h-0 rounded-xl overflow-hidden cursor-pointer group shadow-2xs bg-[#0b1422] border border-slate-200/80 dark:border-slate-800/80 block"
            >
              <ScopeVisual type={card.imageType} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

              {/* Category Kicker */}
              <div className="absolute top-2.5 right-3 z-10 flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-rose-400 drop-shadow-xs">
                  {card.category}
                </span>
                <span className="text-[10px] text-slate-300">· {card.date.split(' ').slice(0, 2).join(' ')}</span>
              </div>

              {/* Title & Subtitle */}
              <div className="absolute bottom-2.5 right-3 left-3 text-right z-10">
                <h3 className="text-sm font-bold text-white group-hover:text-rose-200 transition-colors leading-snug line-clamp-2">
                  {card.title}
                </h3>
                <p className="text-[11px] text-slate-300 line-clamp-1 font-normal mt-0.5 opacity-90">
                  {card.subtitle}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* 1B. CENTER COLUMN: Main Featured Broadcast Lead Story (8 cols in RTL) */}
        <div className="md:col-span-8 relative rounded-xl overflow-hidden group shadow-sm bg-[#0a0f1d] border border-slate-200/80 dark:border-slate-800/80 h-[380px] sm:h-[440px] md:h-[470px] order-1 md:order-2">
          {/* Main Visual */}
          <Link href={`/news/${currentHero.id}`} className="absolute inset-0 z-0 block">
            <ScopeVisual type={currentHero.imageType} priority className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />
          </Link>

          {/* Lead Story Content Overlay */}
          <div className="absolute bottom-5 right-5 left-5 sm:left-7 z-10 text-right space-y-2 pointer-events-none">
            {/* Unboxed Category Kicker */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-400 tracking-wider">
                {currentHero.category}
              </span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs text-slate-300 font-medium">
                تغطية استقصائية خاصة
              </span>
              <span className="text-slate-300 text-xs">·</span>
              <span className="text-xs text-slate-400 font-mono">
                {currentHero.date}
              </span>
            </div>

            {/* Dominant Headline */}
            <Link href={`/news/${currentHero.id}`} className="pointer-events-auto block">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white leading-[1.35] hover:text-slate-200 transition-colors" style={{ textWrap: 'balance' }}>
                {currentHero.title}
              </h2>
            </Link>

            {/* Deck / Subtitle */}
            <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 font-normal max-w-2xl leading-relaxed">
              {currentHero.subtitle}
            </p>

            {/* Byline and Pagination Bar with Rounded Indicators */}
            <div className="pt-2 flex items-center justify-between border-t border-white/15">
              <div className="flex items-center gap-2 text-xs text-slate-300 pointer-events-auto">
                <span className="font-semibold text-white">بقلم: {currentHero.author?.name}</span>
                <span>·</span>
                <span className="text-[11px] text-slate-300">{currentHero.author?.role}</span>
              </div>

              {/* Slider pagination indicators (Rounded-full) */}
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {scopeHeroArticles.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveHeroIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeHeroIndex === idx ? 'w-6 bg-rose-500' : 'w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`الشريحة ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE SECTION: INVESTIGATIONS & LATEST NEWS (Unified Homogeneous Rectangular Block) */}
      <div className="w-full bg-slate-100/70 dark:bg-[#0c1424] p-3.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-2xs">
        
        {/* ============================================================== */}
        {/* DESKTOP VIEW (xl: 1280px+): 4 news cards side-by-side +       */}
        {/* lengthwise newsletter under them; Investigation card stretches */}
        {/* to match the exact same bottom baseline to form a unified block*/}
        {/* ============================================================== */}
        <div className="hidden xl:grid grid-cols-12 gap-5 items-stretch">
          {/* 2A. RIGHT COLUMN: "تحقيقات خاصة" (4 cols in RTL) */}
          <div className="col-span-4 flex flex-col h-full">
            {/* Header: Exact h-10 matching News header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0 h-10 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  تحقيقات خاصة
                </h3>
              </div>
              <button
                onClick={onViewMoreReports}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#dc2626] dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
              >
                <span>المزيد</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Single tall investigation card that expands to 100% full height to match News + Newsletter */}
            <Link
              href={`/news/${scopeInvestigationSpecial.id}`}
              className="group cursor-pointer bg-white dark:bg-[#121b2d] p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-[#dc2626] dark:hover:border-slate-600 transition-all flex-1 h-full min-h-0"
            >
              <div className="flex flex-col flex-1 min-h-0">
                <div className="relative w-full flex-1 min-h-[175px] max-h-[220px] rounded-lg overflow-hidden mb-3 bg-slate-900 shadow-xs">
                  <ScopeVisual
                    type={scopeInvestigationSpecial.imageType}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-rose-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-500/30">
                    تحقيق استقصائي
                  </div>
                </div>

                <div className="space-y-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-[#dc2626] block">
                    ملف الشباب وسوق العمل
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#dc2626] transition-colors leading-snug">
                    {scopeInvestigationSpecial.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {scopeInvestigationSpecial.subtitle}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono shrink-0">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{scopeInvestigationSpecial.date}</span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">وحدة التحقيقات</span>
              </div>
            </Link>
          </div>

          {/* 2B. LEFT COLUMN: "أحدث الأخبار والتحليلات" (8 cols in RTL) */}
          <div className="col-span-8 flex flex-col h-full">
            {/* Header: Exact h-10 matching Investigation header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 shrink-0 h-10 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  أحدث الأخبار والتحليلات
                </h3>
              </div>
              <button
                onClick={onViewMoreNews}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#dc2626] dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
              >
                <span>المزيد</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4 News Cards side-by-side */}
            <div className="grid grid-cols-4 gap-3.5 flex-1 min-h-0">
              {scopeFeaturedNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#121b2d] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#dc2626] dark:hover:border-slate-600 transition-all h-full"
                >
                  <div>
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                      <ScopeVisual
                        type={news.imageType}
                        className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <span className="text-[11px] font-bold text-[#dc2626] block mb-1">
                      {news.category}
                    </span>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#dc2626] transition-colors leading-snug line-clamp-2">
                      {news.title}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      <span>{news.date.split(' ').slice(0, 2).join(' ')}</span>
                    </div>
                    {news.author && <span className="truncate max-w-[80px]">{news.author.name}</span>}
                  </div>
                </Link>
              ))}
            </div>

            {/* Lengthwise Newsletter Strip Underneath News Cards */}
            <div className="flex items-center justify-between gap-5 bg-[#0f1d35] dark:bg-[#131f36] text-white border border-[#1b3156] dark:border-slate-700/60 rounded-xl px-5 py-3 shadow-sm mt-3.5 shrink-0">
              {/* Right Side: Simple Label & Subtext */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Mail className="w-3.5 h-3.5 text-slate-200" />
                </div>
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-xs text-white shrink-0">النشرة البريدية</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-xs text-slate-300 font-normal truncate">
                    إيجاز صباحي يجمع أهم التحليلات الاستراتيجية والمؤشرات الاقتصادية قبل افتتاح الأسواق.
                  </span>
                </div>
              </div>

              {/* Left Side: Clean Simple Form */}
              <div className="shrink-0 w-72">
                {subscribed ? (
                  <div className="text-xs text-emerald-400 flex items-center justify-end gap-1.5 font-medium py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>تم الاشتراك بنجاح.</span>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="بريدك الإلكتروني..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="flex-1 h-8 px-3 text-xs bg-black/40 border border-white/20 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-white/40 transition-colors"
                    />
                    <button
                      type="submit"
                      className="h-8 px-3.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold rounded-md transition-colors shrink-0 cursor-pointer shadow-2xs"
                    >
                      اشتراك
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TABLET VIEW (md to xl: 768px - 1279px): Perfect 3x2 Grid       */}
        {/* ============================================================== */}
        <div className="hidden md:block xl:hidden">
          {/* Headers row (1 col for investigations, 2 cols for news) */}
          <div className="grid grid-cols-3 gap-3.5 mb-3.5">
            {/* Header 1: تحقيقات خاصة */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 h-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  تحقيقات خاصة
                </h3>
              </div>
              <button
                onClick={onViewMoreReports}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#dc2626] dark:hover:text-rose-400 flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
              >
                <span>المزيد</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            {/* Header 2: أحدث الأخبار والتحليلات (Spans 2 columns) */}
            <div className="col-span-2 flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 h-10">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  أحدث الأخبار والتحليلات
                </h3>
              </div>
              <button
                onClick={onViewMoreNews}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#dc2626] dark:hover:text-rose-400 flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
              >
                <span>المزيد</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Unified 3x2 Cards Grid */}
          <div className="grid grid-cols-3 gap-3.5 items-stretch">
            {/* ROW 1, COL 1: Special Investigation Card */}
            <Link
              href={`/news/${scopeInvestigationSpecial.id}`}
              className="group cursor-pointer bg-white dark:bg-[#121b2d] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between hover:border-[#dc2626] dark:hover:border-slate-600 transition-all h-full"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900 shadow-xs">
                  <ScopeVisual
                    type={scopeInvestigationSpecial.imageType}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-rose-300 text-[9px] font-bold px-2 py-0.5 rounded-full border border-rose-500/30">
                    تحقيق استقصائي
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#dc2626] block mb-1">
                  ملف الشباب وسوق العمل
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#dc2626] transition-colors leading-snug line-clamp-2">
                  {scopeInvestigationSpecial.title}
                </h4>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>{scopeInvestigationSpecial.date}</span>
                <span>وحدة التحقيقات</span>
              </div>
            </Link>

            {/* ROW 1, COL 2: News Card 1 */}
            <Link
              href={`/news/${scopeFeaturedNews[0].id}`}
              className="group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#121b2d] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#dc2626] dark:hover:border-slate-600 transition-all h-full"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                  <ScopeVisual
                    type={scopeFeaturedNews[0].imageType}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#dc2626] block mb-1">
                  {scopeFeaturedNews[0].category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#dc2626] transition-colors leading-snug line-clamp-2">
                  {scopeFeaturedNews[0].title}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{scopeFeaturedNews[0].date.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                {scopeFeaturedNews[0].author && <span className="truncate max-w-[80px]">{scopeFeaturedNews[0].author.name}</span>}
              </div>
            </Link>

            {/* ROW 1, COL 3: News Card 2 */}
            <Link
              href={`/news/${scopeFeaturedNews[1].id}`}
              className="group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#121b2d] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#dc2626] dark:hover:border-slate-600 transition-all h-full"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                  <ScopeVisual
                    type={scopeFeaturedNews[1].imageType}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#dc2626] block mb-1">
                  {scopeFeaturedNews[1].category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#dc2626] transition-colors leading-snug line-clamp-2">
                  {scopeFeaturedNews[1].title}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{scopeFeaturedNews[1].date.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                {scopeFeaturedNews[1].author && <span className="truncate max-w-[80px]">{scopeFeaturedNews[1].author.name}</span>}
              </div>
            </Link>

            {/* ROW 2, COL 1: Navy Newsletter Card */}
            <div className="flex flex-col justify-between bg-[#0f1d35] dark:bg-[#131f36] text-white border border-[#1b3156] dark:border-slate-700/60 rounded-xl p-3.5 shadow-sm h-full">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <div className="flex items-center gap-2 text-white font-bold text-xs">
                    <Mail className="w-3.5 h-3.5 text-slate-300" />
                    <span>النشرة البريدية اليومية</span>
                  </div>
                  <span className="text-[9px] bg-[#dc2626] text-white px-2 py-0.5 rounded-full font-bold">إيجاز</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-snug font-normal">
                  إيجاز صباحي يجمع أهم التحليلات الاستراتيجية والمؤشرات الاقتصادية قبل افتتاح الأسواق.
                </p>
              </div>

              {subscribed ? (
                <div className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium py-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>تم الاشتراك بنجاح.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-2 pt-2 mt-auto">
                  <input
                    type="email"
                    placeholder="بريدك الإلكتروني..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-8 px-3 text-xs bg-black/40 border border-white/20 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-white/40"
                  />
                  <button
                    type="submit"
                    className="w-full h-8 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer text-center"
                  >
                    اشتراك
                  </button>
                </form>
              )}
            </div>

            {/* ROW 2, COL 2: News Card 3 */}
            <Link
              href={`/news/${scopeFeaturedNews[2].id}`}
              className="group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#121b2d] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#dc2626] dark:hover:border-slate-600 transition-all h-full"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                  <ScopeVisual
                    type={scopeFeaturedNews[2].imageType}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#dc2626] block mb-1">
                  {scopeFeaturedNews[2].category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#dc2626] transition-colors leading-snug line-clamp-2">
                  {scopeFeaturedNews[2].title}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{scopeFeaturedNews[2].date.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                {scopeFeaturedNews[2].author && <span className="truncate max-w-[80px]">{scopeFeaturedNews[2].author.name}</span>}
              </div>
            </Link>

            {/* ROW 2, COL 3: News Card 4 */}
            <Link
              href={`/news/${scopeFeaturedNews[3].id}`}
              className="group cursor-pointer flex flex-col justify-between bg-white dark:bg-[#121b2d] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-[#dc2626] dark:hover:border-slate-600 transition-all h-full"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                  <ScopeVisual
                    type={scopeFeaturedNews[3].imageType}
                    className="w-full h-full transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <span className="text-[10px] font-bold text-[#dc2626] block mb-1">
                  {scopeFeaturedNews[3].category}
                </span>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#dc2626] transition-colors leading-snug line-clamp-2">
                  {scopeFeaturedNews[3].title}
                </h4>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono tabular-nums">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{scopeFeaturedNews[3].date.split(' ').slice(0, 2).join(' ')}</span>
                </div>
                {scopeFeaturedNews[3].author && <span className="truncate max-w-[80px]">{scopeFeaturedNews[3].author.name}</span>}
              </div>
            </Link>
          </div>
        </div>

        {/* ============================================================== */}
        {/* MOBILE VIEW (< 768px): Responsive single column stack          */}
        {/* ============================================================== */}
        <div className="block md:hidden space-y-4">
          {/* News Header & Cards */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-800 dark:bg-slate-200"></span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  أحدث الأخبار والتحليلات
                </h3>
              </div>
              <button
                onClick={onViewMoreNews}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#dc2626] flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 font-medium"
              >
                <span>المزيد</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {scopeFeaturedNews.map((news) => (
                <Link
                  key={news.id}
                  href={`/news/${news.id}`}
                  className="group cursor-pointer bg-white dark:bg-[#121b2d] p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs block"
                >
                  <div className="relative aspect-[16/10] rounded-lg overflow-hidden mb-2 bg-slate-900">
                    <ScopeVisual type={news.imageType} className="w-full h-full" />
                  </div>
                  <span className="text-[10px] font-bold text-[#dc2626] block mb-1">{news.category}</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-2 mb-1.5">{news.title}</h4>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{news.date}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* Investigation Header & Card */}
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  تحقيقات خاصة
                </h3>
              </div>
              <button
                onClick={onViewMoreReports}
                className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#dc2626] flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 font-medium"
              >
                <span>المزيد</span>
                <ArrowLeft className="w-3 h-3" />
              </button>
            </div>

            <Link
              href={`/news/${scopeInvestigationSpecial.id}`}
              className="group cursor-pointer bg-white dark:bg-[#121b2d] p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs block"
            >
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden mb-2 bg-slate-900">
                <ScopeVisual
                  type={scopeInvestigationSpecial.imageType}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] font-semibold text-[#dc2626] block mb-1">ملف الشباب وسوق العمل</span>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug mb-1">
                {scopeInvestigationSpecial.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                {scopeInvestigationSpecial.subtitle}
              </p>
            </Link>
          </div>

          {/* Mobile Newsletter */}
          <div className="bg-[#0f1d35] dark:bg-[#131f36] text-white border border-[#1b3156] dark:border-slate-700/60 rounded-xl p-3.5 shadow-sm">
            <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Mail className="w-3.5 h-3.5 text-slate-300" />
                <span>النشرة البريدية اليومية</span>
              </div>
              <span className="text-[9px] bg-[#dc2626] text-white px-2 py-0.5 rounded-full font-bold">إيجاز</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug font-normal mb-3">
              إيجاز صباحي يجمع أهم التحليلات الاستراتيجية والمؤشرات الاقتصادية قبل افتتاح الأسواق.
            </p>
            {subscribed ? (
              <div className="text-xs text-emerald-400 flex items-center justify-center gap-1.5 font-medium py-1">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>تم الاشتراك بنجاح.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-2">
                <input
                  type="email"
                  placeholder="بريدك الإلكتروني..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-8 px-3 text-xs bg-black/40 border border-white/20 rounded-md text-white placeholder-slate-400 focus:outline-none focus:border-white/40"
                />
                <button
                  type="submit"
                  className="w-full h-8 bg-[#dc2626] hover:bg-[#b91c1c] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer text-center"
                >
                  اشتراك
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 3. OPTIONAL INTERNAL PROGRAMS (Only rendered if showProgramsInside is true) */}
      {showProgramsInside && (
        <ScopeProgramsRow onOpenShow={onOpenShow} onViewAllShows={onViewAllShows} />
      )}
    </div>
  );
};
