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
  const [isTablet, setIsTablet] = useState<boolean>(false);

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Set of article IDs currently featured in the hero (lead article + 3 secondary cards)
  const heroArticleIds = useMemo(() => {
    const ids = new Set<string>();
    if (leadArticle?.id) ids.add(leadArticle.id);
    activeHeroCards.slice(0, 3).forEach((card) => {
      if (card?.id) ids.add(card.id);
    });
    return ids;
  }, [leadArticle, activeHeroCards]);

  // Fallback 24 distinct news cards across all categories
  const fallbackNews24 = useMemo(() => [
    {
      id: 'news-1',
      category: lang === 'AR' ? 'علوم' : 'SCIENCE',
      categorySlug: 'science' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'طفرة جديدة في الذكاء الاصطناعي تثير جدلاً عالمياً حول قوانين الخصوصية'
        : 'New AI Breakthrough Sparks Global Debate On Privacy Laws',
      subtitle: lang === 'AR'
        ? 'مخاوف متصاعدة بين الهيئات التنظيمية حول سلامة جمع واستخدام البيانات الرقمية في النماذج الحديثة.'
        : 'Growing scrutiny across regulatory bodies over digital data protection and ethical model standards.',
      date: lang === 'AR' ? 'منذ ساعة' : '1 hour ago',
      imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-2',
      category: lang === 'AR' ? 'اقتصاد' : 'ECONOMY',
      categorySlug: 'economy' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'الأسواق العالمية تتقلب عقب إعلان أسعار الفائدة من بنك الاحتياطي الفيدرالي'
        : 'Global Markets Fluctuate Following Federal Reserve Interest Rates Announcement',
      subtitle: lang === 'AR'
        ? 'ردود فعل متباينة في مؤشرات الأسهم العالمية وترقب لتأثير القرارات على حركة التضخم.'
        : 'Mixed reactions across major stock indices as analysts assess the longer-term inflationary trends.',
      date: lang === 'AR' ? 'منذ ساعتين' : '2 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-3',
      category: lang === 'AR' ? 'سياسة' : 'POLITICS',
      categorySlug: 'politics' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'قمة دبلوماسية رفيعة تبحث اتفاقيات التهدئة والتعاون الاقتصادي الإقليمي'
        : 'High-Level Diplomatic Summit Discusses Regional De-escalation Accords',
      subtitle: lang === 'AR'
        ? 'مفاوضات مكثفة بين قادة الدول لبناء تفاهمات مشتركة تعزز الاستقرار والأمن في المنطقة.'
        : 'Intensive talks among international leaders aimed at building mutual stability frameworks.',
      date: lang === 'AR' ? 'منذ ساعتين' : '2 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-4',
      category: lang === 'AR' ? 'ثقافة' : 'CULTURE',
      categorySlug: 'culture' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'معرض فني دولي يستعرض التراث المعماري القديم في العواصم التاريخية'
        : 'International Art Exhibition Showcases Ancient Architectural Heritage',
      subtitle: lang === 'AR'
        ? 'أعمال توثيقية نادرة تسلط الضوء على الفنون المعمارية العريقة وأصالة التصميم عبر العصور.'
        : 'Rare documentary artworks highlighting ancient architectural traditions across historical capitals.',
      date: lang === 'AR' ? 'منذ 3 ساعات' : '3 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-5',
      category: lang === 'AR' ? 'مجتمع' : 'SOCIETY',
      categorySlug: 'society' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'مبادرات تطوعية شبابية تعزز الاستدامة البيئية في المدن الحضرية'
        : 'Youth Volunteer Initiatives Promote Environmental Sustainability in Urban Cities',
      subtitle: lang === 'AR'
        ? 'حملات مجتمعية واسعة لزيادة المساحات الخضراء والحد من التلوث البيئي في الأحياء السكنية.'
        : 'Broad community campaigns to expand green spaces and reduce urban pollution in residential areas.',
      date: lang === 'AR' ? 'منذ 3 ساعات' : '3 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-6',
      category: lang === 'AR' ? 'علوم' : 'SCIENCE',
      categorySlug: 'science' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'اكتشاف كوكبي جديد يفتح آفاقاً جديدة في أبحاث الفضاء والفيزياء الفلكية'
        : 'New Exoplanet Discovery Opens New Horizons in Astrophysics Research',
      subtitle: lang === 'AR'
        ? 'تلسكوبات فضائية ترصد غلافاً جوياً فريداً لكوكب خارج المجموعة الشمسية.'
        : 'Deep space observatories detect a unique atmospheric composition on an exoplanet far beyond.',
      date: lang === 'AR' ? 'منذ 4 ساعات' : '4 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-7',
      category: lang === 'AR' ? 'اقتصاد' : 'ECONOMY',
      categorySlug: 'economy' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'نمو ملحوظ في استثمارات الطاقة المتجددة والمشاريع الخضراء هذا الربع'
        : 'Strong Growth in Renewable Energy and Green Projects Investment This Quarter',
      subtitle: lang === 'AR'
        ? 'تقارير مالية تؤكد ارتفاع تدفقات رؤوس الأموال نحو حلول الطاقة الشمسية وطاقة الرياح.'
        : 'Financial data highlights increased capital flows toward sustainable power technologies.',
      date: lang === 'AR' ? 'منذ 4 ساعات' : '4 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-8',
      category: lang === 'AR' ? 'الأخبار' : 'NEWS',
      categorySlug: 'news' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'افتتاح مؤتمر التكنولوجيا والابتكار بمشاركة آلاف الخبراء والرواد حول العالم'
        : 'Tech & Innovation Conference Opens with Global Industry Leaders',
      subtitle: lang === 'AR'
        ? 'استعراض أحدث الابتكارات التقنية في الروبوتات والحوسبة الكمية وتطبيقات المستقبل.'
        : 'Showcasing breakthroughs in robotics, quantum computing, and emerging tech applications.',
      date: lang === 'AR' ? 'منذ 5 ساعات' : '5 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-9',
      category: lang === 'AR' ? 'سياسة' : 'POLITICS',
      categorySlug: 'politics' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'إصلاحات تشريعية جديدة لتعزيز الشفافية وحوكمة المؤسسات العامة'
        : 'New Legislative Reforms Aim to Strengthen Institutional Transparency',
      subtitle: lang === 'AR'
        ? 'حزمة قوانين جديدة تهدف إلى تطوير الآليات الرقابية والمساءلة المؤسسية.'
        : 'Comprehensive legal frameworks introduced to boost governance standards and accountability.',
      date: lang === 'AR' ? 'منذ 5 ساعات' : '5 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-10',
      category: lang === 'AR' ? 'مجتمع' : 'SOCIETY',
      categorySlug: 'society' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'توسع ملحوظ في برامج التعليم الرقمي والتدريب المهني للشباب'
        : 'Significant Expansion in Digital Learning and Vocational Training for Youth',
      subtitle: lang === 'AR'
        ? 'منصات تعليمية مجانية تمكّن آلاف الطلاب من اكتساب مهارات تقنية متقدمة لسوق العمل.'
        : 'Open educational programs enabling students to acquire high-demand digital skills.',
      date: lang === 'AR' ? 'منذ 6 ساعات' : '6 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-11',
      category: lang === 'AR' ? 'علوم' : 'SCIENCE',
      categorySlug: 'science' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'دراسة بيئية جديدة تحذر من تسارع انحسار الأنهار الجليدية في القطب الشمالي'
        : 'Environmental Study Warns of Accelerating Glacial Melting in Arctic',
      subtitle: lang === 'AR'
        ? 'بيانات الأقمار الصناعية تسجل درجات حرارة قياسية تؤثر على الأنظمة المناخية العالمية.'
        : 'Satellite measurements show record temperatures impacting global weather cycles.',
      date: lang === 'AR' ? 'منذ 6 ساعات' : '6 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-12',
      category: lang === 'AR' ? 'ثقافة' : 'CULTURE',
      categorySlug: 'culture' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'مهرجان سينمائي يحتفي بالأفلام الوثائقية والروايات الإنسانية المؤثرة'
        : 'Film Festival Honors Groundbreaking Documentaries and Human Stories',
      subtitle: lang === 'AR'
        ? 'عروض مميزة لأعمال تسلط الضوء على الهوية والذاكرة والتنوع الثقافي في العالم.'
        : 'A showcase of compelling storytelling examining identity, cultural diversity, and heritage.',
      date: lang === 'AR' ? 'منذ 7 ساعات' : '7 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-13',
      category: lang === 'AR' ? 'اقتصاد' : 'ECONOMY',
      categorySlug: 'economy' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'قطاع التجارة الإلكترونية يسجل أرقاماً قياسية في حجم المبيعات الشهرية'
        : 'E-Commerce Sector Sets Record Volume in Monthly Consumer Sales',
      subtitle: lang === 'AR'
        ? 'تزايد الاعتماد على حلول الدفع الرقمي والخدمات اللوجستية السريعة في الأسواق الإقليمية.'
        : 'Rapid adoption of fintech payment systems drives significant commercial expansion.',
      date: lang === 'AR' ? 'منذ 7 ساعات' : '7 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1556742049-0a67e557224f?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-14',
      category: lang === 'AR' ? 'الأخبار' : 'NEWS',
      categorySlug: 'news' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'تطوير شبكات النقل الذكي وتدشين خطوط قطارات كهربائية سريعة جديدة'
        : 'Smart Transit Expansion: New High-Speed Electric Rail Corridors Launched',
      subtitle: lang === 'AR'
        ? 'مشاريع بنية تحتية مستدامة تهدف إلى تقليل الانبعاثات وتسهيل حركة التنقل بين المدن.'
        : 'Sustainable urban transit projects reducing emissions and linking metropolitan hubs.',
      date: lang === 'AR' ? 'منذ 8 ساعات' : '8 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-15',
      category: lang === 'AR' ? 'سياسة' : 'POLITICS',
      categorySlug: 'politics' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'اتفاقات تجارية دولية جديدة تهدف إلى إزالة الحواجز الجمركية بين القارات'
        : 'New Trade Treaties Aim to Lower Tariffs Across Global Corridors',
      subtitle: lang === 'AR'
        ? 'مساعٍ دولية لتعزيز سلاسل الإمداد ومكافحة التباطؤ التجاري عبر تخفيض الرسوم.'
        : 'Strategic negotiations underway to bolster supply chain security and export volume.',
      date: lang === 'AR' ? 'منذ 8 ساعات' : '8 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-16',
      category: lang === 'AR' ? 'علوم' : 'SCIENCE',
      categorySlug: 'science' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'أبحاث جينية واعدة تفتح الباب لعلاجات مخصصة للأمراض المزمنة المعقدة'
        : 'Breakthrough Genetic Research Paves Way for Targeted Chronic Therapies',
      subtitle: lang === 'AR'
        ? 'علماء ينجحون في تحديد مسارات بيولوجية دقيقة تسهم في تسريع تطوير الأدوية الفعالة.'
        : 'Biomedical researchers map molecular pathways that speed up precision medicine design.',
      date: lang === 'AR' ? 'منذ 9 ساعات' : '9 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-17',
      category: lang === 'AR' ? 'مجتمع' : 'SOCIETY',
      categorySlug: 'society' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'حملات توعوية وطنية تركز على تعزيز الصحة النفسية والرفاه الاجتماعي'
        : 'National Campaigns Focus on Promoting Mental Health and Wellbeing',
      subtitle: lang === 'AR'
        ? 'مبادرات لتقديم الاستشارات المتخصصة وتوفير الدعم النفسي في بيئات العمل والمدارس.'
        : 'Public wellness drives providing accessible counseling resources and support networks.',
      date: lang === 'AR' ? 'منذ 10 ساعات' : '10 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-18',
      category: lang === 'AR' ? 'ثقافة' : 'CULTURE',
      categorySlug: 'culture' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'إعادة افتتاح متاحف تاريخية كبرى بعد مشاريع ترميم وتطوير تقني شاملة'
        : 'Major Historical Museums Reopen Following State-of-the-Art Restorations',
      subtitle: lang === 'AR'
        ? 'تقنيات الواقع الافتراضي والعرض التفاعلي تمنح الزوار تجربة غامرة لاكتشاف الآثار.'
        : 'Interactive digital exhibits allow visitors to explore antiquities like never before.',
      date: lang === 'AR' ? 'منذ 11 ساعة' : '11 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-19',
      category: lang === 'AR' ? 'اقتصاد' : 'ECONOMY',
      categorySlug: 'economy' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'تقرير اقتصادي يتوقع انتعاش قطاع السياحة والسفر بنسبة 18% هذا العام'
        : 'Economic Outlook Forecasts 18% Travel & Hospitality Surge This Year',
      subtitle: lang === 'AR'
        ? 'إقبال غير مسبوق على الوجهات السياحية وتوسع في رحلات الطيران الدولية.'
        : 'Rising consumer demand drives airline capacity expansions and hotel bookings.',
      date: lang === 'AR' ? 'منذ 12 ساعة' : '12 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-20',
      category: lang === 'AR' ? 'الأخبار' : 'NEWS',
      categorySlug: 'news' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'إطلاق قمر صناعي متطور لمراقبة المحيطات والتنبؤ بالعواصف المدارية'
        : 'Advanced Satellite Launched to Monitor Ocean Currents and Predict Storms',
      subtitle: lang === 'AR'
        ? 'أجهزة استشعار دقيقة توفر بيانات فورية لدعم فرق الطوارئ ومواجهة الكوارث الطبيعية.'
        : 'Precision orbital sensors deliver real-time data to bolster disaster readiness.',
      date: lang === 'AR' ? 'منذ 13 ساعة' : '13 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1517976487507-5b3b4b45f470?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-21',
      category: lang === 'AR' ? 'علوم' : 'SCIENCE',
      categorySlug: 'science' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'تطوير بطاريات مائية جديدة آمنة وعالية الكفاءة لتخزين طاقة الشبكات'
        : 'New Safe, High-Capacity Water Batteries Developed for Grid Storage',
      subtitle: lang === 'AR'
        ? 'ابتكار كيميائي يحل مشاكل الحرائق والتحلل في بطاريات الليثيوم التقليدية.'
        : 'Novel aqueous battery chemistry eliminates fire hazards in large-scale energy banks.',
      date: lang === 'AR' ? 'منذ 14 ساعة' : '14 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-22',
      category: lang === 'AR' ? 'سياسة' : 'POLITICS',
      categorySlug: 'politics' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'مؤتمر دولي للأمن السيبراني يحذر من الهجمات الموجهة للبنى التحتية الحيوية'
        : 'Global Cybersecurity Forum Warns of Coordinated Critical Infrastructure Threats',
      subtitle: lang === 'AR'
        ? 'توصيات بإنشاء خطوط دفاع رقمية مشتركة وتبادل فوري لمعلومات التهديدات السيبرانية.'
        : 'Policy experts urge cross-border incident response protocols and shared threat intelligence.',
      date: lang === 'AR' ? 'منذ 15 ساعة' : '15 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-23',
      category: lang === 'AR' ? 'مجتمع' : 'SOCIETY',
      categorySlug: 'society' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'مبادرة زراعية حضرية تحول أسطح المباني في المدن إلى حدائق منتجة'
        : 'Urban Farming Initiative Transforms Rooftops into Thriving Community Gardens',
      subtitle: lang === 'AR'
        ? 'حلول مبتكرة للزراعة العمودية تساهم في تحقيق الأمن الغذائي المحلي وتقليل البصمة الكربونية.'
        : 'Vertical farming solutions boost local produce supplies while greening urban skylines.',
      date: lang === 'AR' ? 'منذ 16 ساعة' : '16 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'news-24',
      category: lang === 'AR' ? 'ثقافة' : 'CULTURE',
      categorySlug: 'culture' as const,
      imageType: 'photo' as const,
      title: lang === 'AR'
        ? 'صدور كتاب جديد يوثق مسيرة الأدب العربي المعاصر وتأثيره في الفكر الإنساني'
        : 'New Anthology Explores Modern Arabic Literature and Global Thought',
      subtitle: lang === 'AR'
        ? 'قراءات نقدية شاملة لأبرز النصوص الأدبية التي شكلت الوعي الثقافي خلال القرن الماضي.'
        : 'Comprehensive critical essays examining landmark literary texts and cultural dialogue.',
      date: lang === 'AR' ? 'منذ 18 ساعة' : '18 hours ago',
      imageUrl: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
    },
  ], [lang]);

  // Latest news list (styled like 'تقارير ذات صلة' in Article page):
  // Strictly 24 articles on homepage, and completely excluded from hero articles (lead + 3 secondary cards)
  const latestNewsList = useMemo(() => {
    // 1. Filter out all articles that appear in the hero section
    const nonHeroArticles = (articles || []).filter((a) => !heroArticleIds.has(a.id));

    // 2. If we have at least 24 real articles from DB, use the top 24
    if (nonHeroArticles.length >= 24) {
      return nonHeroArticles.slice(0, 24);
    }

    // 3. Otherwise, merge available non-hero DB articles with distinct fallback cards to guarantee exactly 24
    const result: ScopeArticle[] = [...nonHeroArticles];
    const existingIds = new Set(result.map((a) => a.id));

    for (const fb of fallbackNews24) {
      if (result.length >= 24) break;
      if (!existingIds.has(fb.id) && !heroArticleIds.has(fb.id)) {
        result.push(fb);
        existingIds.add(fb.id);
      }
    }

    return result.slice(0, 24);
  }, [articles, heroArticleIds, fallbackNews24]);

  // Group news articles into responsive rows for tablet / desktop:
  // Desktop (4 cols): 2 rows of 4 standard, then 1 row of 2 featured (مختارات style), repeat.
  // Tablet (3 cols): 2 rows of 3 standard, then 1 row of 2 featured (مختارات style), repeat.
  const newsRows = useMemo(() => {
    const rowsList: Array<{ type: 'standard' | 'featured'; items: ScopeArticle[] }> = [];
    let idx = 0;
    const total = latestNewsList.length;

    if (isTablet) {
      while (idx < total) {
        if (idx < total) {
          rowsList.push({ type: 'standard', items: latestNewsList.slice(idx, idx + 3) as ScopeArticle[] });
          idx += 3;
        }
        if (idx < total) {
          rowsList.push({ type: 'standard', items: latestNewsList.slice(idx, idx + 3) as ScopeArticle[] });
          idx += 3;
        }
        if (idx < total) {
          rowsList.push({ type: 'featured', items: latestNewsList.slice(idx, idx + 2) as ScopeArticle[] });
          idx += 2;
        }
      }
    } else {
      while (idx < total) {
        if (idx < total) {
          rowsList.push({ type: 'standard', items: latestNewsList.slice(idx, idx + 4) as ScopeArticle[] });
          idx += 4;
        }
        if (idx < total) {
          rowsList.push({ type: 'standard', items: latestNewsList.slice(idx, idx + 4) as ScopeArticle[] });
          idx += 4;
        }
        if (idx < total) {
          rowsList.push({ type: 'featured', items: latestNewsList.slice(idx, idx + 2) as ScopeArticle[] });
          idx += 2;
        }
      }
    }

    return rowsList;
  }, [latestNewsList, isTablet]);

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
          {/* Deep cinematic overlays for header readability at top & clean transparency at bottom */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/25 to-black/35 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-transparent to-black/30 pointer-events-none" />
        </div>

        {/* Hero Content Container (Padded at top to sit below transparent overlay header) */}
        <div className="relative z-10 w-full max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-8 pt-30 sm:pt-32 md:pt-36 lg:pt-40 pb-6 sm:pb-8 flex-1 flex flex-col justify-between">
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
          <div className="relative max-w-[560px] lg:max-w-[640px] px-6 lg:px-8 pb-7 lg:pb-9 pe-8 lg:pe-12">
            {/* The Blue Box background: top edge positioned at the vertical midpoint of the image */}
            <div className="absolute inset-x-0 bottom-0 top-[50px] lg:top-[56px] bg-[#09263E]/70 rounded-none shadow-2xl -z-10" />

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
                  <div className="relative aspect-[1.618/1] w-full rounded-none overflow-hidden bg-slate-900 shadow-md mb-3.5">
                    <ScopeVisual
                      imageUrl={card.imageUrl}
                      type={card.imageType}
                      category={card.categorySlug}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  {/* White Category Tag Badge */}
                  <span className="inline-block px-1.5 py-0.5 text-[9px] font-bold bg-white text-[#09263E] rounded-none shadow-xs mb-2">
                    {card.category}
                  </span>

                  {/* Title (Allowed up to 3 lines) */}
                  <h4 className="text-[11px] lg:text-xs font-bold text-white group-hover:text-blue-200 transition-colors line-clamp-3 leading-snug">
                    {card.title}
                  </h4>

                  {/* Date */}
                  <p className="text-[9px] lg:text-[10px] text-slate-300 font-sans mt-1.5">
                    {card.date}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile View: 3 Rotating cards with carousel navigation, fixed size blue box accommodating 3 lines of title */}
        <div className="md:hidden absolute bottom-0 end-0 z-20">
          <div className="relative w-[215px] px-3.5 pb-4 pe-5">
            {/* The Blue Box background: top edge reaches vertical midpoint of photo (fixed size) */}
            <div className="absolute inset-x-0 bottom-0 top-[57px] bg-[#09263E]/70 rounded-none shadow-2xl -z-10" />

            <div className="relative z-10 flex flex-col justify-between h-[230px]">
              {(() => {
                const mobileCard = activeHeroCards[carouselIndex % 3];
                return (
                  <Link
                    href={`/news/${mobileCard.id}`}
                    prefetch={false}
                    className="block group"
                  >
                    <div className="relative aspect-[1.618/1] w-full rounded-none overflow-hidden bg-slate-900 shadow-md mb-3">
                      <ScopeVisual
                        imageUrl={mobileCard.imageUrl}
                        type={mobileCard.imageType}
                        category={mobileCard.categorySlug}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <span className="inline-block px-1.5 py-0.5 text-[8px] font-bold bg-white text-[#09263E] rounded-none shadow-xs mb-2">
                      {mobileCard.category}
                    </span>

                    {/* Fixed 3-line title: truncates with ellipsis (...) after 3 lines */}
                    <h4 className="text-[11px] font-bold text-white leading-[1.35] h-[45px] line-clamp-3 overflow-hidden text-ellipsis">
                      {mobileCard.title}
                    </h4>

                    <p className="text-[9px] text-slate-300 font-sans mt-1">
                      {mobileCard.date}
                    </p>
                  </Link>
                );
              })()}

              {/* 3 Indicator Dashes for mobile */}
              <div className="flex items-center justify-center gap-1 pt-1.5">
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

          {/* Mobile View: Vertical list where images span full screen width */}
          <div className="md:hidden space-y-7">
            {latestNewsList.map((item) => (
              <Link
                key={item.id}
                href={`/news/${item.id}`}
                prefetch={false}
                className="group block cursor-pointer border-b border-[#e5e9ef] dark:border-[#1e293b] pb-6 last:border-none"
              >
                {/* Full-width image across the entire mobile screen */}
                <div className="relative aspect-[1.618/1] -mx-4 overflow-hidden rounded-none bg-[#0d1624] mb-3.5">
                  <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.03]">
                    <ScopeVisual
                      imageUrl={item.imageUrl}
                      type={(item as ScopeArticle).imageType}
                      category={(item as ScopeArticle).categorySlug}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Content with natural page padding */}
                <span className="text-[12px] font-extrabold text-[#A42424] dark:text-[#F27676] block">
                  {item.category}
                </span>

                <h3 className="mt-1.5 text-base font-black leading-[1.4] text-[#101722] dark:text-[#f0f3f8] transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676] line-clamp-2">
                  {item.title}
                </h3>

                {(item as ScopeArticle).subtitle && (
                  <p className="mt-2 text-xs leading-relaxed text-[#566274] dark:text-[#98a5b7] line-clamp-2">
                    {(item as ScopeArticle).subtitle}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#566274] dark:text-[#98a5b7]">
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  <span>{item.date}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Tablet & Desktop View: Organized in structured rows with alternating featured "مختارات" rows */}
          <div className="hidden md:flex flex-col space-y-6 lg:space-y-7">
            {newsRows.map((row, rIdx) => {
              if (row.type === 'featured') {
                return (
                  <div
                    key={`row-featured-${rIdx}`}
                    className="grid grid-cols-2 gap-6 lg:gap-7"
                  >
                    {row.items.map((item) => (
                      <Link
                        key={item.id}
                        href={`/news/${item.id}`}
                        prefetch={false}
                        className="group relative block overflow-hidden rounded-xl bg-[#0d1624] text-white isolate shadow-sm hover:shadow-xl transition-all aspect-[1.618/1] cursor-pointer"
                      >
                        {/* Golden ratio full-bleed background image */}
                        <div className="absolute inset-0 -z-20 transition-transform duration-700 ease-out group-hover:scale-105">
                          <ScopeVisual
                            imageUrl={item.imageUrl}
                            type={item.imageType}
                            category={item.categorySlug}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Cinematic gradient overlay matching Article Navigation */}
                        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[rgba(5,9,16,.96)] via-[rgba(5,9,16,.65)] via-50% to-[rgba(5,9,16,.08)] pointer-events-none" />

                        {/* Bottom-aligned content overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-5 lg:p-7 flex flex-col justify-end">
                          <span className="font-extrabold text-[#ffb4b4] uppercase tracking-wider block text-xs sm:text-[13px] mb-1.5">
                            {item.category}
                          </span>
                          <h3 className="text-base sm:text-xl lg:text-2xl font-black text-white leading-snug lg:leading-[1.3] group-hover:text-rose-200 transition-colors line-clamp-2 min-h-[2.6em]">
                            {item.title}
                          </h3>
                          {item.subtitle && (
                            <p className="mt-1.5 text-xs sm:text-sm text-slate-200 line-clamp-1 opacity-90 font-normal">
                              {item.subtitle}
                            </p>
                          )}
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-white/80 font-sans">
                            <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                            <span>{item.date}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                );
              }

              return (
                <div
                  key={`row-standard-${rIdx}`}
                  className={`grid ${
                    isTablet ? 'grid-cols-3' : 'grid-cols-4'
                  } gap-6 lg:gap-7`}
                >
                  {row.items.map((item) => (
                    <Link
                      key={item.id}
                      href={`/news/${item.id}`}
                      prefetch={false}
                      className="group flex flex-col justify-between h-full cursor-pointer"
                    >
                      <div className="flex-1 flex flex-col">
                        {/* Image on top: Golden Ratio 1.618/1 */}
                        <div className="relative aspect-[1.618/1] overflow-hidden rounded-[10px] bg-[#0d1624] mb-3">
                          <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                            <ScopeVisual
                              imageUrl={item.imageUrl}
                              type={item.imageType}
                              category={item.categorySlug}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Category in Red */}
                        <span className="text-[12px] sm:text-[13px] font-extrabold text-[#A42424] dark:text-[#F27676] block">
                          {item.category}
                        </span>

                        {/* Title: 2 lines with consistent min-height */}
                        <h3 className="mt-1.5 text-base sm:text-lg font-black leading-[1.4] text-[#101722] dark:text-[#f0f3f8] transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676] line-clamp-2 min-h-[2.8em]">
                          {item.title}
                        </h3>

                        {/* Subtitle */}
                        {item.subtitle && (
                          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#566274] dark:text-[#98a5b7] line-clamp-2">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {/* Date at the bottom: pinned via mt-auto so dates are 100% horizontally aligned */}
                      <div className="mt-auto pt-3 flex items-center gap-1.5 text-xs text-[#566274] dark:text-[#98a5b7]">
                        <Clock className="w-3.5 h-3.5 opacity-70 shrink-0" />
                        <span>{item.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })}
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
