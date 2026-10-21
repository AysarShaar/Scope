'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from './NavLink';
import {
  Play,
  ArrowLeft,
  ArrowRight,
  Radio,
  Clock,
} from 'lucide-react';
import { ScopeArticle, ScopeShow } from '../data/scopeData';
import { ScopeVisual } from './ScopeVisual';
import { ScopeHeroGridSkeleton, ScopeProgramsRowSkeleton } from './ScopeSkeleton';
import { useLanguage } from '../context/LanguageContext';
import { translatedShows } from '../lib/translations';
import { useLiveStreamId } from '../hooks/use-live-stream-id';

interface ScopeHeroGridProps {
  articles?: ScopeArticle[];
  special?: ScopeArticle | null;
  specialArticles?: ScopeArticle[];
  shows?: ScopeShow[];
  isLoading?: boolean;
  onOpenShow: (show: ScopeShow) => void;
  onViewMoreNews: () => void;
  onViewMoreReports: () => void;
  onViewAllShows: () => void;
  onOpenLive?: () => void;
  showProgramsInside?: boolean;
  onSelectTag?: (tag: string) => void;
}

export const ScopeProgramsRow: React.FC<{
  shows?: ScopeShow[];
  onOpenShow: (show: ScopeShow) => void;
  onViewAllShows: () => void;
  isLoading?: boolean;
  className?: string;
}> = ({ shows, onOpenShow, onViewAllShows, isLoading = false, className = '' }) => {
  const { t, dir, lang } = useLanguage();

  if (isLoading) {
    return <ScopeProgramsRowSkeleton />;
  }

  const activeShows = shows || [];
  if (activeShows.length === 0) {
    return null;
  }

  const ForwardArrow = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className={`w-full space-y-3 pt-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#A42424]"></span>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            {t.hero.exclusiveShows}
          </h3>
        </div>
        <button
          onClick={onViewAllShows}
          className="text-xs text-slate-600 dark:text-slate-300 hover:text-[#A42424] dark:hover:text-rose-400 flex items-center gap-1.5 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer font-medium"
        >
          <span>{t.hero.fullShowsGuide}</span>
          <ForwardArrow className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {activeShows.map((show) => {
          const tr = translatedShows[show.id];
          const displayTitle = tr?.title[lang] || show.title;
          const displaySubtitle = tr?.subtitle[lang] || show.subtitle;

          return (
            <Link
              key={show.id}
              href={`/programs/${show.id}`}
              prefetch={false}
              className="relative aspect-[16/11] rounded-xl overflow-hidden cursor-pointer group shadow-sm bg-slate-950 border border-slate-800/80 block"
            >
              <ScopeVisual imageUrl={show.imageUrl} type={show.imageType} className="w-full h-full" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent pointer-events-none" />

              <div
                className={`absolute bottom-2.5 ${
                  dir === 'rtl' ? 'left-2.5' : 'right-2.5'
                } w-7 h-7 rounded-full bg-[#A42424]/90 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:bg-[#A42424] transition-all z-20`}
              >
                <Play className="w-3 h-3 fill-white ml-0.5" />
              </div>

              <div
                className={`absolute bottom-2.5 ${
                  dir === 'rtl' ? 'right-2.5 left-10 text-right' : 'left-2.5 right-10 text-left'
                } z-10`}
              >
                <h5 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-200 transition-colors line-clamp-1">
                  {displayTitle}
                </h5>
                <p className="text-[10px] text-slate-300 line-clamp-1 font-normal opacity-90">
                  {displaySubtitle}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export const ScopeHeroGrid: React.FC<ScopeHeroGridProps> = ({
  articles = [],
  special = null,
  specialArticles,
  shows,
  isLoading = false,
  onOpenShow,
  onViewMoreNews,
  onViewAllShows,
  onOpenLive,
  showProgramsInside = true,
}) => {
  const { dir, lang } = useLanguage();
  const liveStreamId = useLiveStreamId();
  const [selectedCategory, setSelectedCategory] = useState<string>('latest');
  const [carouselIndex, setCarouselIndex] = useState<number>(0);

  // Lead breaking article: prioritize special / specialArticles[0] or latest article
  const leadArticle = useMemo(() => {
    if (special) return special;
    if (specialArticles && specialArticles.length > 0) return specialArticles[0];
    if (articles && articles.length > 0) return articles[0];
    return null;
  }, [special, specialArticles, articles]);

  // Featured side cards (exclude leadArticle)
  const heroCardArticles = useMemo(() => {
    const list: ScopeArticle[] = [];
    const usedIds = new Set<string>();
    if (leadArticle) usedIds.add(leadArticle.id);

    // Pick from specialArticles first
    if (specialArticles && specialArticles.length > 1) {
      for (let i = 1; i < specialArticles.length; i++) {
        const item = specialArticles[i];
        if (!usedIds.has(item.id)) {
          list.push(item);
          usedIds.add(item.id);
        }
      }
    }

    // Fill from regular articles
    if (articles && articles.length > 0) {
      for (const a of articles) {
        if (!usedIds.has(a.id)) {
          list.push(a);
          usedIds.add(a.id);
        }
      }
    }

    return list;
  }, [leadArticle, specialArticles, articles]);

  // Fallback cards if no articles exist yet
  const fallbackCards = useMemo(() => [
    {
      id: 'mock-1',
      title: lang === 'AR'
        ? 'الرئيس يعلن استثماراً أولياً بقيمة 115 مليون دولار في جاكسون'
        : 'The President Announces Initial $115 Million Investment in Jackson',
      subtitle: lang === 'AR' ? 'خطة تنموية استثمارية جديدة' : 'Major development infrastructure fund',
      category: lang === 'AR' ? 'سياسة دولية' : "World's Politic",
      categorySlug: 'politics' as const,
      date: 'August 22, 2023',
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-2',
      title: lang === 'AR'
        ? 'أعراض الأرق المتعددة ترفع خطر الإصابة بالسكتات الدماغية لمن هم دون سن الخمسين'
        : 'Multiple Insomnia Symptoms Raise Strokes Risk in People Under 50',
      subtitle: lang === 'AR' ? 'دراسة طبية حديثة تحذر من قلة النوم' : 'New clinical study reveals key neurological factors',
      category: lang === 'AR' ? 'صحة' : 'Health',
      categorySlug: 'science' as const,
      date: 'August 20, 2023',
      imageUrl: 'https://images.unsplash.com/photo-1511295742362-92c96b124e52?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'mock-3',
      title: lang === 'AR'
        ? 'نهائي الملحق: لوتون تاون يكمل صعوده التاريخي الملحمي إلى الدوري الإنجليزي الممتاز'
        : 'Play Off Final: Luton Town Completes Remarkable Rise to the Premier League',
      subtitle: lang === 'AR' ? 'انتصار درامي ومفاجأة الموسم' : 'A historic victory after overtime thriller',
      category: lang === 'AR' ? 'رياضة' : 'Sport News',
      categorySlug: 'world' as const,
      date: 'August 19, 2023',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
    },
  ], [lang]);

  const activeHeroCards = heroCardArticles.length >= 3 ? heroCardArticles : fallbackCards;

  // Categories list for the horizontal pills bar
  const categoriesList = useMemo(() => [
    { id: 'latest', label: lang === 'AR' ? 'الأحدث' : 'Latest' },
    { id: 'politics', label: lang === 'AR' ? 'سياسة' : 'Politic' },
    { id: 'science', label: lang === 'AR' ? 'تكنولوجيا' : 'Technology' },
    { id: 'society', label: lang === 'AR' ? 'لايف ستايل' : 'Lifestyle' },
    { id: 'economy', label: lang === 'AR' ? 'اقتصاد' : 'Business' },
    { id: 'world', label: lang === 'AR' ? 'رياضة ودولي' : 'Sport News' },
    { id: 'culture', label: lang === 'AR' ? 'ثقافة' : 'Culture' },
  ], [lang]);

  // Filtered latest news list
  const latestNewsList = useMemo(() => {
    let list = articles && articles.length > 0 ? articles : [];
    if (selectedCategory !== 'latest') {
      list = list.filter((a) => a.categorySlug === selectedCategory);
    }
    if (list.length === 0) {
      // Mock data matching Image 2
      return [
        {
          id: 'news-1',
          category: lang === 'AR' ? 'تكنولوجيا' : 'TECHNOLOGY',
          categorySlug: 'science',
          title: lang === 'AR'
            ? 'طفرة جديدة في الذكاء الاصطناعي تثير جدلاً عالمياً حول قوانين الخصوصية'
            : 'New AI Breakthrough Sparks Global Debate On Privacy Laws',
          date: lang === 'AR' ? 'منذ ساعتين' : '2 hours ago',
          imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: 'news-2',
          category: lang === 'AR' ? 'اقتصاد وأعمال' : 'BUSINESS',
          categorySlug: 'economy',
          title: lang === 'AR'
            ? 'الأسواق العالمية تتقلب عقب إعلان أسعار الفائدة من بنك الاحتياطي الفيدرالي'
            : 'Global Markets Fluctuate Following Federal Reserve Interest Rates Announcement',
          date: lang === 'AR' ? 'منذ 3 ساعات' : '3 hours ago',
          imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: 'news-3',
          category: lang === 'AR' ? 'أخبار الرياضة' : 'SPORT NEWS',
          categorySlug: 'world',
          title: lang === 'AR'
            ? 'نهائيات البطولة: الفريق غير المرشح ينتزع فوزاً تاريخياً في الوقت الإضافي'
            : 'Championship Finals: Underdog Team Clinches Historic Victory in Overtime',
          date: lang === 'AR' ? 'منذ 5 ساعات' : '5 hours ago',
          imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=300&q=80',
        },
      ];
    }
    return list.slice(0, 8);
  }, [articles, selectedCategory, lang]);

  // Editor's Pick article
  const editorsPickArticle = useMemo(() => {
    if (articles && articles.length > 4) return articles[4];
    return {
      id: 'pick-1',
      title: lang === 'AR'
        ? 'طفرة جديدة في الذكاء الاصطناعي تثير جدلاً عالمياً حول قوانين الخصوصية والبيانات'
        : 'New AI Breakthrough Sparks Global Debate On Privacy Laws',
      subtitle: lang === 'AR'
        ? 'تحقيق مصور يستعرض آراء الخبراء والتشريعات الرقمية المقترحة'
        : 'In-depth video analysis on global regulatory frameworks and tech impact',
      category: lang === 'AR' ? 'تكنولوجيا' : 'TECHNOLOGY',
      imageUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=1200&q=80',
    };
  }, [articles, lang]);

  // Auto rotate carousel indicators
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % 5);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return <ScopeHeroGridSkeleton />;
  }

  // Hero headline & content
  const heroTitle = leadArticle?.title || (
    lang === 'AR'
      ? 'دخان كثيف يغطي نيويورك وملايين السكان في الولايات المتحدة وكندا يعانون من حرائق كيبيك'
      : "Intense Smoke Fills New York as Millions in US and Canada Suffer from Quebec's Wildfires"
  );

  const heroSubtitle = leadArticle?.subtitle || (
    lang === 'AR'
      ? 'مع هبوط دخان حرائق الغابات من كندا إلى شمال شرق الولايات المتحدة، يتلقى الأمريكيون تنبيهات محلية حول جودة الهواء وتأثيراتها الصحية...'
      : "As wildfire smoke from Canada descends on the northeastern U.S., many Americans are getting local alerts from the Environmental Protection Agency's AQI. Here's what all those colors mean."
  );

  const heroBgImage = leadArticle?.imageUrl || 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=1920&q=80';
  const heroLink = leadArticle ? `/news/${leadArticle.id}` : '#';

  return (
    <div className="w-full space-y-10">
      {/* ============================================================ */}
      {/* 1. CINEMATIC HERO SECTION (Matching Desktop Image 3 & Mobile Image 1) */}
      {/* ============================================================ */}
      <section className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800">
        {/* Atmospheric Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImage}
            alt="Hero Background"
            className="w-full h-full object-cover object-center brightness-60"
          />
          {/* Deep cinematic overlays for crisp readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1526] via-[#0a1526]/70 to-black/50" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
        </div>

        {/* Hero Content Container */}
        <div className="relative z-10 p-5 sm:p-8 md:p-12 lg:p-14 min-h-[520px] sm:min-h-[580px] lg:min-h-[620px] flex flex-col justify-between">
          {/* Top/Main Lead News Content */}
          <div className="max-w-3xl space-y-3 sm:space-y-4 pt-2">
            {/* BREAKING NEWS Badge */}
            <div className="inline-flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-[#E24C4C] tracking-widest uppercase">
                {lang === 'AR' ? 'أخبار عاجلة' : 'BREAKING NEWS'}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.18] tracking-tight drop-shadow-md">
              <Link href={heroLink} className="hover:text-slate-200 transition-colors">
                {heroTitle}
              </Link>
            </h1>

            {/* Subtitle / Excerpt */}
            <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed max-w-2xl font-normal opacity-95 drop-shadow-xs line-clamp-3">
              {heroSubtitle}
            </p>

            {/* CTA Button: Read more -> */}
            <div className="pt-2">
              <Link
                href={heroLink}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#A42424] hover:bg-[#8B1E1E] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-md cursor-pointer group"
              >
                <span>{lang === 'AR' ? 'قراءة المزيد' : 'Read more'}</span>
                <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  {dir === 'rtl' ? '←' : '→'}
                </span>
              </Link>
            </div>
          </div>

          {/* ============================================================ */}
          {/* FEATURE CARDS CONTAINER (Deep Navy Box bg-[#18394E]) */}
          {/* ============================================================ */}
          <div className="mt-8 self-end w-full md:w-auto">
            {/* Desktop View (Image 3): 3 Cards Side-by-Side */}
            <div className="hidden md:block bg-[#163750]/95 backdrop-blur-md rounded-2xl p-4 lg:p-5 border border-white/10 shadow-2xl max-w-4xl ms-auto">
              <div className="grid grid-cols-3 gap-3.5 lg:gap-4">
                {activeHeroCards.slice(0, 3).map((card) => (
                  <Link
                    key={card.id}
                    href={`/news/${card.id}`}
                    prefetch={false}
                    className="group block cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-900 mb-2.5 shadow-sm">
                      <ScopeVisual
                        imageUrl={card.imageUrl}
                        type={card.imageType}
                        category={card.categorySlug}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    {/* Category Tag Badge */}
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-white text-[#163750] rounded-md shadow-xs mb-1.5">
                      {card.category}
                    </span>

                    {/* Title */}
                    <h4 className="text-xs lg:text-sm font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-2 leading-snug">
                      {card.title}
                    </h4>

                    {/* Date */}
                    <p className="text-[11px] text-slate-300 font-sans mt-1">
                      {card.date}
                    </p>
                  </Link>
                ))}
              </div>

              {/* Indicator Dashes below the 3 cards */}
              <div className="flex items-center justify-center gap-1.5 pt-4 mt-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`h-1.5 transition-all rounded-full cursor-pointer ${
                      carouselIndex === i
                        ? 'w-7 bg-white'
                        : 'w-3.5 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Mobile View (Image 1): Floating Single Card at Bottom-Right */}
            <div className="md:hidden w-[90%] sm:w-[75%] max-w-[320px] ms-auto bg-[#163750]/95 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 shadow-2xl">
              {(() => {
                const mobileCard =
                  activeHeroCards[carouselIndex % activeHeroCards.length];
                return (
                  <Link
                    href={`/news/${mobileCard.id}`}
                    prefetch={false}
                    className="block group"
                  >
                    <div className="relative aspect-[16/10] rounded-lg overflow-hidden bg-slate-900 mb-2">
                      <ScopeVisual
                        imageUrl={mobileCard.imageUrl}
                        type={mobileCard.imageType}
                        category={mobileCard.categorySlug}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold bg-white text-[#163750] rounded-md shadow-xs mb-1">
                      {mobileCard.category}
                    </span>

                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                      {mobileCard.title}
                    </h4>

                    <p className="text-[10px] text-slate-300 mt-1">
                      {mobileCard.date}
                    </p>
                  </Link>
                );
              })()}

              {/* Mobile Indicator Dashes */}
              <div className="flex items-center justify-center gap-1.5 pt-3">
                {[0, 1, 2, 3, 4].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`h-1.5 transition-all rounded-full cursor-pointer ${
                      carouselIndex === i
                        ? 'w-6 bg-white'
                        : 'w-3 bg-white/30 hover:bg-white/50'
                    }`}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. CATEGORY PILL FILTER BAR (Matching Mobile Image 2) */}
      {/* ============================================================ */}
      <section className="w-full">
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
          {categoriesList.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`whitespace-nowrap px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#163750] text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-[#163750] hover:text-[#163750]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. LATEST NEWS & EDITOR'S PICK SECTION (Image 2) */}
      {/* ============================================================ */}
      <section className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): LATEST NEWS List */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          {/* Section Header with Red Vertical Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-5 sm:h-6 bg-[#A42424] rounded-full inline-block" />
              <h2 className="text-base sm:text-lg font-extrabold text-[#163750] dark:text-white tracking-wide uppercase">
                {lang === 'AR' ? 'آخر الأخبار' : 'LATEST NEWS'}
              </h2>
            </div>

            <button
              onClick={onViewMoreNews}
              className="text-xs text-slate-500 hover:text-[#A42424] dark:hover:text-rose-400 font-semibold transition-colors"
            >
              {lang === 'AR' ? 'عرض الكل' : 'View all'}
            </button>
          </div>

          {/* List of News Items */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {latestNewsList.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                prefetch={false}
                className="py-3.5 sm:py-4 flex items-center justify-between gap-4 group cursor-pointer"
              >
                {/* Content Side */}
                <div className="flex-1 space-y-1">
                  <span className="text-[11px] font-bold text-[#A42424] tracking-wider uppercase block">
                    {item.category}
                  </span>
                  <h3 className="text-xs sm:text-sm md:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#A42424] transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-sans">
                    <Clock className="w-3 h-3" />
                    <span>{item.date}</span>
                  </div>
                </div>

                {/* Thumbnail Side */}
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0 bg-slate-900 shadow-2xs">
                  <ScopeVisual
                    imageUrl={item.imageUrl}
                    type={(item as ScopeArticle).imageType}
                    category={(item as ScopeArticle).categorySlug}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column (4-5 cols): EDITOR'S PICK / VIDEO / LIVE */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Live Broadcast Card if live stream is present, or Editor's Pick */}
          {liveStreamId ? (
            <div className="rounded-2xl overflow-hidden shadow-md bg-black border border-slate-800 aspect-[16/10]">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${liveStreamId}?autoplay=0&mute=1&playsinline=1&rel=0`}
                title="SCOPE MEDIA Live Stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          ) : null}

          {/* EDITOR'S PICK Card (Matching bottom of Image 2) */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl bg-slate-950 border border-slate-800 text-white p-5 sm:p-6 group">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img
                src={editorsPickArticle.imageUrl}
                alt="Editor's Pick"
                className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
            </div>

            {/* Badges on Top */}
            <div className="relative z-10 flex items-center gap-2 mb-12 sm:mb-20">
              <span className="px-2.5 py-1 rounded-md bg-[#A42424] text-white text-[11px] font-bold tracking-wider uppercase shadow-xs">
                {lang === 'AR' ? 'اختيار المحرر' : "EDITOR'S PICK"}
              </span>

              <div className="px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[11px] font-medium flex items-center gap-1.5 border border-white/20">
                <Play className="w-3 h-3 fill-white" />
                <span>{lang === 'AR' ? 'تشغيل الفيديو' : 'video play'}</span>
              </div>
            </div>

            {/* Content Bottom */}
            <div className="relative z-10 space-y-2">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-200 transition-colors leading-snug">
                {editorsPickArticle.title}
              </h3>
              {editorsPickArticle.subtitle && (
                <p className="text-xs text-slate-300 line-clamp-2 font-normal opacity-90">
                  {editorsPickArticle.subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Quick Access to Live & Programs CTA */}
          <div className="bg-[#163750] text-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-400 animate-pulse" />
                <h4 className="font-bold text-sm">
                  {lang === 'AR' ? 'بث سكوب ميديا المباشر' : 'SCOPE MEDIA Live'}
                </h4>
              </div>
              <button
                onClick={onOpenLive}
                className="text-xs bg-[#A42424] hover:bg-[#8B1E1E] text-white px-3 py-1.5 rounded-full font-bold transition-colors cursor-pointer"
              >
                {lang === 'AR' ? 'مشاهدة' : 'Watch Now'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. SHOWS & PROGRAMS ROW */}
      {/* ============================================================ */}
      {showProgramsInside && (
        <ScopeProgramsRow
          shows={shows}
          isLoading={isLoading}
          onOpenShow={onOpenShow}
          onViewAllShows={onViewAllShows}
        />
      )}
    </div>
  );
};
