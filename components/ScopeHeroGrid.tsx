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

  // Fallback cards matching the exact mockup items if articles list is empty
  const fallbackCards = useMemo(() => [
    {
      id: 'mock-1',
      title: lang === 'AR'
        ? 'الرئيس يعلن استثماراً أولياً بقيمة 115 مليون دولار في جاكسون'
        : 'The President Announces Initial $115 Million Investment in Jackson',
      subtitle: lang === 'AR' ? 'خطة تنموية استثمارية جديدة' : 'Major development infrastructure fund',
      category: lang === 'AR' ? 'سياسة دولية' : "World's Politic",
      categorySlug: 'politics' as const,
      imageType: 'photo' as const,
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
      imageType: 'photo' as const,
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
      categorySlug: 'news' as const,
      imageType: 'photo' as const,
      date: 'August 19, 2023',
      imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
    },
  ], [lang]);

  const activeHeroCards = heroCardArticles.length >= 3 ? heroCardArticles : fallbackCards;

  // Latest news list (styled like 'تقارير ذات صلة' in Article page)
  const latestNewsList = useMemo(() => {
    if (articles && articles.length > 0) {
      return articles.slice(0, 12);
    }
    return [
      {
        id: 'news-1',
        category: lang === 'AR' ? 'علوم' : 'SCIENCE',
        categorySlug: 'science',
        imageType: 'photo' as const,
        title: lang === 'AR'
          ? 'طفرة جديدة في الذكاء الاصطناعي تثير جدلاً عالمياً حول قوانين الخصوصية'
          : 'New AI Breakthrough Sparks Global Debate On Privacy Laws',
        subtitle: lang === 'AR'
          ? 'مخاوف متصاعدة بين الهيئات التنظيمية حول سلامة جمع واستخدام البيانات الرقمية في النماذج الحديثة.'
          : 'Growing scrutiny across regulatory bodies over digital data protection and ethical model standards.',
        date: lang === 'AR' ? 'منذ ساعتين' : '2 hours ago',
        imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'news-2',
        category: lang === 'AR' ? 'اقتصاد' : 'ECONOMY',
        categorySlug: 'economy',
        imageType: 'photo' as const,
        title: lang === 'AR'
          ? 'الأسواق العالمية تتقلب عقب إعلان أسعار الفائدة من بنك الاحتياطي الفيدرالي'
          : 'Global Markets Fluctuate Following Federal Reserve Interest Rates Announcement',
        subtitle: lang === 'AR'
          ? 'ردود فعل متباينة في مؤشرات الأسهم العالمية وترقب لتأثير القرارات على حركة التضخم.'
          : 'Mixed reactions across major stock indices as analysts assess the longer-term inflationary trends.',
        date: lang === 'AR' ? 'منذ 3 ساعات' : '3 hours ago',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'news-3',
        category: lang === 'AR' ? 'سياسة' : 'POLITICS',
        categorySlug: 'politics',
        imageType: 'photo' as const,
        title: lang === 'AR'
          ? 'نهائيات البطولة: الفريق غير المرشح ينتزع فوزاً تاريخياً في الوقت الإضافي'
          : 'Championship Finals: Underdog Team Clinches Historic Victory in Overtime',
        subtitle: lang === 'AR'
          ? 'أجواء حماسية وتتويج مستحق بعد أداء استثنائي أدهش الجماهير والمحللين الرياضيين.'
          : 'An astonishing display of resilience and dramatic overtime goals secure a landmark championship victory.',
        date: lang === 'AR' ? 'منذ 5 ساعات' : '5 hours ago',
        imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'news-4',
        category: lang === 'AR' ? 'ثقافة' : 'CULTURE',
        categorySlug: 'culture',
        imageType: 'photo' as const,
        title: lang === 'AR'
          ? 'معرض فني دولي يستعرض التراث المعماري القديم في العواصم التاريخية'
          : 'International Art Exhibition Showcases Ancient Architectural Heritage',
        subtitle: lang === 'AR'
          ? 'أعمال توثيقية نادرة تسلط الضوء على الفنون المعمارية العريقة وأصالة التصميم عبر العصور.'
          : 'Rare documentary artworks highlighting ancient architectural traditions across historical capitals.',
        date: lang === 'AR' ? 'منذ 6 ساعات' : '6 hours ago',
        imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'news-5',
        category: lang === 'AR' ? 'مجتمع' : 'SOCIETY',
        categorySlug: 'society',
        imageType: 'photo' as const,
        title: lang === 'AR'
          ? 'مبادرات تطوعية شبابية تعزز الاستدامة البيئية في المدن الحضرية'
          : 'Youth Volunteer Initiatives Promote Environmental Sustainability in Urban Cities',
        subtitle: lang === 'AR'
          ? 'حملات مجتمعية واسعة لزيادة المساحات الخضراء والحد من التلوث البيئي في الأحياء السكنية.'
          : 'Broad community campaigns to expand green spaces and reduce urban pollution in residential areas.',
        date: lang === 'AR' ? 'منذ 7 ساعات' : '7 hours ago',
        imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 'news-6',
        category: lang === 'AR' ? 'علوم' : 'SCIENCE',
        categorySlug: 'science',
        imageType: 'photo' as const,
        title: lang === 'AR'
          ? 'اكتشاف كوكبي جديد يفتح آفاقاً جديدة في أبحاث الفضاء والفيزياء الفلكية'
          : 'New Exoplanet Discovery Opens New Horizons in Astrophysics Research',
        subtitle: lang === 'AR'
          ? 'تلسكوبات فضائية ترصد غلافاً جوياً فريداً لكوكب خارج المجموعة الشمسية.'
          : 'Deep space observatories detect a unique atmospheric composition on an exoplanet far beyond.',
        date: lang === 'AR' ? 'منذ 8 ساعات' : '8 hours ago',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
      },
    ];
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

  // Hero headline & content matching Desktop.jpg & mobile.jpg
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
    <div className="w-full">
      {/* ============================================================ */}
      {/* 1. CINEMATIC HERO SECTION (Full width, merged with Header) */}
      {/* ============================================================ */}
      <section className="relative w-full overflow-hidden bg-slate-950 min-h-[640px] sm:min-h-[700px] md:min-h-[720px] lg:min-h-[760px] flex flex-col justify-between">
        {/* Full-bleed atmospheric background image matching Desktop.jpg / mobile.jpg */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBgImage}
            alt="Hero Background"
            className="w-full h-full object-cover object-center brightness-75 scale-100 transition-transform duration-1000 ease-out"
          />
          {/* Deep cinematic overlays for header readability at top & contrast at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/35 to-[#0b1c2b]/95 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />
        </div>

        {/* Hero Content Container (Padded at top to sit below transparent overlay header) */}
        <div className="relative z-10 w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-30 md:pt-32 pb-6 sm:pb-8 flex-1 flex flex-col justify-between">
          {/* Top/Main Lead News Content (Desktop.jpg left side) */}
          <div className="max-w-xl lg:max-w-2xl space-y-3 sm:space-y-4 pt-4 md:pt-8">
            {/* Category / Slug in Red instead of Breaking News */}
            <div className="text-xs sm:text-sm font-black text-[#E24C4C] tracking-widest uppercase">
              {leadArticle?.category || (lang === 'AR' ? 'سياسة' : 'POLITICS')}
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.18] tracking-tight drop-shadow-md">
              <Link href={heroLink} className="hover:text-slate-200 transition-colors">
                {heroTitle}
              </Link>
            </h1>

            {/* Subtitle / Excerpt */}
            <p className="text-slate-200 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl font-normal opacity-95 drop-shadow-xs line-clamp-3">
              {heroSubtitle}
            </p>

            {/* CTA Button: Read more -> */}
            <div className="pt-2">
              <Link
                href={heroLink}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-[#A42424] hover:bg-[#8B1E1E] active:scale-95 text-white font-bold text-xs sm:text-sm rounded transition-all shadow-md cursor-pointer group"
              >
                <span>{lang === 'AR' ? 'قراءة المزيد' : 'Read more'}</span>
                <span className="transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                  {dir === 'rtl' ? '←' : '→'}
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECONDARY NEWS BOX (Flush to corner, blue box reaches middle of photos) */}
        {/* ============================================================ */}
        {/* Desktop View: 3 Static cards, blue card reaches exactly 50% midpoint of photos */}
        <div className="hidden md:block absolute bottom-0 end-0 z-20">
          <div className="relative max-w-[560px] lg:max-w-[640px] px-6 lg:px-8 pb-6 lg:pb-8 pe-7 lg:pe-10">
            {/* The Blue Box background: top edge positioned at the vertical midpoint of the image */}
            <div className="absolute inset-x-0 bottom-0 top-[50px] lg:top-[56px] bg-[#163750] rounded-none shadow-2xl -z-10" />

            {/* 3 Static Cards */}
            <div className="grid grid-cols-3 gap-4 lg:gap-5 relative z-10">
              {activeHeroCards.slice(0, 3).map((card) => (
                <Link
                  key={card.id}
                  href={`/news/${card.id}`}
                  prefetch={false}
                  className="group block cursor-pointer"
                >
                  {/* Golden Ratio Thumbnail 1.6:1 (Top half overlaps hero background, bottom half sits on blue box) */}
                  <div className="relative aspect-[1.618/1] w-full rounded-none overflow-hidden bg-slate-900 shadow-md mb-2.5">
                    <ScopeVisual
                      imageUrl={card.imageUrl}
                      type={card.imageType}
                      category={card.categorySlug}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* White Category Tag Badge */}
                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-white text-[#163750] rounded-none shadow-xs mb-1.5">
                    {card.category}
                  </span>

                  {/* Title (Allowed up to 3 lines) */}
                  <h4 className="text-[11px] lg:text-xs font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-3 leading-snug">
                    {card.title}
                  </h4>

                  {/* Date */}
                  <p className="text-[9px] lg:text-[10px] text-slate-300 font-sans mt-1">
                    {card.date}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View: 3 Rotating cards with carousel navigation, blue box reaches middle of photo */}
        <div className="md:hidden absolute bottom-0 end-0 z-20">
          <div className="relative max-w-[215px] px-3.5 pb-3.5 pe-4">
            {/* The Blue Box background: top edge reaches vertical midpoint of photo */}
            <div className="absolute inset-x-0 bottom-0 top-[55px] bg-[#163750] rounded-none shadow-2xl -z-10" />

            <div className="relative z-10">
              {(() => {
                const mobileCard = activeHeroCards[carouselIndex % 3];
                return (
                  <Link
                    href={`/news/${mobileCard.id}`}
                    prefetch={false}
                    className="block group"
                  >
                    <div className="relative aspect-[1.618/1] w-full rounded-none overflow-hidden bg-slate-900 shadow-md mb-2">
                      <ScopeVisual
                        imageUrl={mobileCard.imageUrl}
                        type={mobileCard.imageType}
                        category={mobileCard.categorySlug}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-white text-[#163750] rounded-none shadow-xs mb-1">
                      {mobileCard.category}
                    </span>

                    <h4 className="text-[10px] font-bold text-white line-clamp-3 leading-tight">
                      {mobileCard.title}
                    </h4>

                    <p className="text-[9px] text-slate-300 font-sans mt-1">
                      {mobileCard.date}
                    </p>
                  </Link>
                );
              })()}

              {/* 3 Indicator Dashes for mobile */}
              <div className="flex items-center justify-center gap-1 pt-2 mt-1">
                {[0, 1, 2].map((i) => (
                  <button
                    key={i}
                    onClick={() => setCarouselIndex(i)}
                    className={`h-0.5 rounded-full transition-all cursor-pointer ${
                      carouselIndex % 3 === i ? 'w-4 bg-white' : 'w-2 bg-white/30'
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
      {/* REST OF PAGE CONTENT (Contained in max-w-[1480px]) */}
      {/* ============================================================ */}
      <div className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 space-y-10 pt-10 pb-6">
        {/* ============================================================ */}
        {/* 2. LATEST NEWS SECTION (Styled like 'تقارير ذات صلة' in Article page) */}
        {/* ============================================================ */}
        <section className="w-full space-y-6">
          {/* Section Header with Red Vertical Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-6 bg-[#A42424] rounded-full inline-block" />
              <h2 className="text-xl sm:text-2xl font-black text-[#101722] dark:text-[#f0f3f8] tracking-tight">
                {lang === 'AR' ? 'آخر الأخبار' : 'LATEST NEWS'}
              </h2>
            </div>

            <button
              onClick={onViewMoreNews}
              className="text-xs sm:text-sm text-slate-500 hover:text-[#A42424] dark:hover:text-rose-400 font-semibold transition-colors"
            >
              {lang === 'AR' ? 'عرض الكل' : 'View all'}
            </button>
          </div>

          {/* Grid of News Items: Same vertical card design as mobile, with multiple articles per line on desktop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-7">
            {latestNewsList.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                prefetch={false}
                className="group flex flex-col justify-between cursor-pointer border-b border-[#e5e9ef] dark:border-[#1e293b] pb-6 sm:border-none sm:pb-0"
              >
                <div>
                  {/* Image on top */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-[#0d1624] mb-3">
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                      <ScopeVisual
                        imageUrl={item.imageUrl}
                        type={(item as ScopeArticle).imageType}
                        category={(item as ScopeArticle).categorySlug}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Category in Red */}
                  <span className="text-[12px] sm:text-[13px] font-extrabold text-[#A42424] dark:text-[#F27676] block">
                    {item.category}
                  </span>

                  {/* Title */}
                  <h3 className="mt-1.5 text-base sm:text-lg font-black leading-[1.4] text-[#101722] dark:text-[#f0f3f8] transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676] line-clamp-2">
                    {item.title}
                  </h3>

                  {/* Subtitle */}
                  {(item as ScopeArticle).subtitle && (
                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#566274] dark:text-[#98a5b7] line-clamp-2">
                      {(item as ScopeArticle).subtitle}
                    </p>
                  )}
                </div>

                {/* Date at the bottom */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#566274] dark:text-[#98a5b7]">
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{item.date}</span>
                </div>
              </Link>
            ))}
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
    </div>
  );
};
