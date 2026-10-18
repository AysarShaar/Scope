export type Language = 'AR' | 'EN';

export interface Translations {
  nav: {
    home: string;
    news: string;
    region: string;
    world: string;
    economy: string;
    politics: string;
    society: string;
    culture: string;
    science: string;
    investigations: string;
    programs: string;
    videos: string;
    about: string;
    newsCategories: string;
    categoriesCount: string;
    close: string;
  };
  header: {
    searchPlaceholder: string;
    searchPlatform: string;
    liveStream: string;
    watchLive: string;
    menu: string;
    switchLangTitle: string;
    currentLangDisplay: string;
  };
  sidebar: {
    breakingNews: string;
    liveUpdates: string;
    noBreakingNews: string;
    allNews: string;
    editorialTitle: string;
    editorialQuote: string;
    editorialAuthor: string;
    trendingTopics: string;
    activeTags: string;
  };
  hero: {
    exclusiveShows: string;
    fullShowsGuide: string;
    latestNews: string;
    moreNews: string;
    exclusiveReports: string;
    allInvestigations: string;
    specialBadge: string;
    minRead: string;
    readArticle: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    newsletterPlaceholder: string;
    newsletterBtn: string;
    newsletterSuccess: string;
  };
  programs: {
    hostPrefix: string;
    episodes: string;
  };
  about: {
    title: string;
    description: string;
    visionTitle: string;
    visionText: string;
    missionTitle: string;
    missionText: string;
    valuesTitle: string;
    valuesText: string;
  };
  categoryView: {
    noArticles: string;
    publishNew: string;
    prevPage: string;
    nextPage: string;
    loadMore: string;
    editorDefault: string;
  };
  drawer: {
    searchPlaceholder: string;
    searchPrompt: string;
    noResults: string;
    themeAppearance: string;
    dayMode: string;
    nightMode: string;
    light: string;
    dark: string;
    liveStream: string;
    adminPortal: string;
    settings: string;
    copyright: string;
  };
  liveModal: {
    liveBadge: string;
    studioTitle: string;
    comingSoon: string;
    viewersCount: string;
    chatTitle: string;
    chatPlaceholder: string;
    send: string;
  };
  footer: {
    mission: string;
    certifiedEthics: string;
    correspondents: string;
    newsSections: string;
    politics: string;
    economy: string;
    middleEast: string;
    international: string;
    investigations: string;
    showsAndMedia: string;
    showsSeries: string;
    videoReports: string;
    satelliteLive: string;
    audioPodcasts: string;
    rss: string;
    institution: string;
    aboutUs: string;
    editorialBoard: string;
    privacy: string;
    terms: string;
    contact: string;
    adminPortal: string;
    options: string;
    copyright: string;
    followUs: string;
  };
  searchPage: {
    title: string;
    resultsFor: string;
    resultsCount: string;
    noResults: string;
    noResultsDesc: string;
    searchPlaceholder: string;
    searchButton: string;
    allCategories: string;
    backHome: string;
    popularTags: string;
  };
}

export const translations: Record<Language, Translations> = {
  AR: {
    nav: {
      home: 'الرئيسية',
      news: 'الأخبار',
      region: 'إقليمي',
      world: 'دولي',
      economy: 'اقتصاد',
      politics: 'سياسة',
      society: 'مجتمع',
      culture: 'ثقافة',
      science: 'علوم',
      investigations: 'تحقيقات',
      programs: 'برامج',
      videos: 'فيديوهات',
      about: 'من نحن',
      newsCategories: 'أقسام وتصنيفات الأخبار',
      categoriesCount: '5 أقسام',
      close: 'إغلاق',
    },
    header: {
      searchPlaceholder: 'ابحث في الأخبار، التحقيقات والتقارير...',
      searchPlatform: 'بحث في المنصة',
      liveStream: 'بث مباشر',
      watchLive: 'مشاهدة البث المباشر',
      menu: 'القائمة',
      switchLangTitle: 'تبديل اللغة إلى English',
      currentLangDisplay: 'AR',
    },
    sidebar: {
      breakingNews: 'شريط الأخبار العاجلة',
      liveUpdates: 'تحديث مستمر',
      noBreakingNews: 'لا توجد تنبيهات عاجلة مسجلة حالياً',
      allNews: 'جميع الأخبار',
      editorialTitle: 'افتتاحية العدد',
      editorialQuote: '«ليست وظيفة الصحافة نقل ما حدث فحسب، بل تفسير الأسباب وتفكيك السياقات التي تجعل من الخبر بداية لفهم المستقبل.»',
      editorialAuthor: '— هيئة التحرير · SCOPE MEDIA',
      trendingTopics: 'مواضيع قيد المتابعة',
      activeTags: 'وسوم نشطة',
    },
    hero: {
      exclusiveShows: 'برامج SCOPE MEDIA الحصرية',
      fullShowsGuide: 'دليل البرامج الكامل',
      latestNews: 'أحدث الأخبار والتحليلات',
      moreNews: 'المزيد من الأخبار',
      exclusiveReports: 'تقارير وتحقيقات حصرية',
      allInvestigations: 'جميع التحقيقات',
      specialBadge: 'خاص',
      minRead: 'دقيقة قراءة',
      readArticle: 'قراءة المقال',
      newsletterTitle: 'نشرة SCOPE MEDIA البريدية',
      newsletterSubtitle: 'اشترك لتصلك أهم التحليلات الاستقصائية ورؤى الخبراء في بريدك أسبوعياً',
      newsletterPlaceholder: 'أدخل بريدك الإلكتروني...',
      newsletterBtn: 'اشتراك',
      newsletterSuccess: 'شكراً لاشتراكك في النشرة الإخبارية!',
    },
    programs: {
      hostPrefix: 'تقديم: ',
      episodes: 'حلقة',
    },
    about: {
      title: 'عن SCOPE MEDIA',
      description: 'منصة إعلامية رقمية رائدة تنطلق من قلب العالم العربي، متخصصة في تقديم صحافة استقصائية رصينة، وتغطيات إخبارية فورية، وتحليلات معمقة تتجاوز العناوين السطحية إلى استكشاف الدوافع والنتائج والتأثيرات المستقبلية.',
      visionTitle: 'الرؤية',
      visionText: 'بناء وعي معرفي حر وتقديم المعلومة الدقيقة بمصداقية مطلقة واستقلالية مهنية كاملة.',
      missionTitle: 'الرسالة',
      missionText: 'تمكين الجمهور العربي من فهم التحولات الجيوسياسية والاقتصادية المعقدة بأحدث تقنيات السرد الرقمي.',
      valuesTitle: 'القيم',
      valuesText: 'الدقة، النزاهة، الجرأة في البحث عن الحقيقة، واحترام عقل المشاهد والقارئ العربي.',
    },
    categoryView: {
      noArticles: 'لا يتوفر شيء لعرضه',
      publishNew: '',
      prevPage: 'السابق',
      nextPage: 'التالي',
      loadMore: 'عرض المزيد',
      editorDefault: 'محرر SCOPE',
    },
    drawer: {
      searchPlaceholder: 'ابحث في تغطيات وتحقيقات سكوب...',
      searchPrompt: 'اكتب أي كلمة مفتاحية للبحث الفوري في محتوى المنصة',
      noResults: 'لا توجد نتائج مطابقة لـ',
      themeAppearance: 'مظهر المنصة',
      dayMode: 'الوضع النهاري',
      nightMode: 'الوضع الليلي',
      light: 'نهاري',
      dark: 'ليلي',
      liveStream: 'بث مباشر',
      adminPortal: 'بوابة إدارة التحرير',
      settings: 'الإعدادات',
      copyright: 'SCOPE MEDIA © 2026 - ما وراء العناوين',
    },
    liveModal: {
      liveBadge: 'بث حي (( ))',
      studioTitle: 'استوديو الأخبار الرئيسي - تغطية حية عبر SCOPE MEDIA',
      comingSoon: 'البث المباشر سيبدأ قريباً',
      viewersCount: 'مشاهد الآن',
      chatTitle: 'التفاعل المباشر',
      chatPlaceholder: 'اكتب تعليقك أو سؤالك للمذيع...',
      send: 'إرسال',
    },
    footer: {
      mission: 'منصة إعلامية رقمية مستقلة متخصصة في الصحافة الاستقصائية والتحليلات السياسية والاقتصادية المعمقة، تنطلق برؤية تسعى لكشف الحقائق وتجاوز السطحية الإخبارية إلى ما وراء العناوين.',
      certifiedEthics: 'ميثاق شرف مهني معتمد',
      correspondents: 'شبكة مراسلين في 24 عاصمة',
      newsSections: 'الأقسام الإخبارية',
      politics: 'السياسة والدبلوماسية',
      economy: 'المال وأسواق الطاقة',
      middleEast: 'الشرق الأوسط والخليج',
      international: 'الشؤون الدولية',
      investigations: 'التحقيقات الاستقصائية',
      showsAndMedia: 'البرامج والوسائط',
      showsSeries: 'سلسلة برامج SCOPE',
      videoReports: 'التقارير المصورة (فيديو)',
      satelliteLive: 'البث الفضائي الحي',
      audioPodcasts: 'البودكاست الصوتي',
      rss: 'خلاصات الأخبار RSS',
      institution: 'المؤسسة والسياسات',
      aboutUs: 'عن SCOPE MEDIA',
      editorialBoard: 'هيئة التحرير والمجلس الاستشاري',
      privacy: 'سياسة الخصوصية وحماية البيانات',
      terms: 'شروط الاستخدام',
      contact: 'تواصل مع غرفة الأخبار',
      adminPortal: 'بوابة إدارة التحرير',
      options: 'الخيارات والإعدادات',
      copyright: 'جميع الحقوق محفوظة لـ SCOPE MEDIA © 2026 · ما وراء العناوين',
      followUs: 'تابعنا على المنصات:',
    },
    searchPage: {
      title: 'نتائج البحث',
      resultsFor: 'نتائج البحث عن',
      resultsCount: 'مادة صحفية',
      noResults: 'لم يتم العثور على نتائج مطابقة لـ',
      noResultsDesc: 'يرجى التحقق من صحة الكلمات المفتاحية أو تجربة مصطلحات أكثر عمومية.',
      searchPlaceholder: 'اكتب كلمة البحث...',
      searchButton: 'بحث',
      allCategories: 'جميع الأقسام',
      backHome: 'العودة للرئيسية',
      popularTags: 'مواضيع شائعة',
    },
  },
  EN: {
    nav: {
      home: 'Home',
      news: 'News',
      region: 'Regional',
      world: 'World',
      economy: 'Economy',
      politics: 'Politics',
      society: 'Society',
      culture: 'Culture',
      science: 'Science',
      investigations: 'Investigations',
      programs: 'Shows',
      videos: 'Videos',
      about: 'About Us',
      newsCategories: 'News Categories & Sections',
      categoriesCount: '5 Sections',
      close: 'Close',
    },
    header: {
      searchPlaceholder: 'Search news, investigations, and reports...',
      searchPlatform: 'Search Platform',
      liveStream: 'Live Stream',
      watchLive: 'Watch Live Broadcast',
      menu: 'Menu',
      switchLangTitle: 'Switch language to العربية',
      currentLangDisplay: 'EN',
    },
    sidebar: {
      breakingNews: 'Breaking News Feed',
      liveUpdates: 'Live Updates',
      noBreakingNews: 'No breaking alerts at the moment',
      allNews: 'All News',
      editorialTitle: 'Editorial Column',
      editorialQuote: '"The mission of journalism is not simply to report what happened, but to explain causes and dissect contexts that make today’s news the foundation for understanding the future."',
      editorialAuthor: '— Editorial Board · SCOPE MEDIA',
      trendingTopics: 'Trending Topics',
      activeTags: 'Active Tags',
    },
    hero: {
      exclusiveShows: 'Exclusive SCOPE Shows',
      fullShowsGuide: 'Full Shows Guide',
      latestNews: 'Latest News & Analyses',
      moreNews: 'More News',
      exclusiveReports: 'Exclusive Reports & Investigations',
      allInvestigations: 'All Investigations',
      specialBadge: 'EXCLUSIVE',
      minRead: 'min read',
      readArticle: 'Read Story',
      newsletterTitle: 'SCOPE MEDIA Newsletter',
      newsletterSubtitle: 'Subscribe to receive investigative deep-dives and expert analyses in your inbox weekly',
      newsletterPlaceholder: 'Enter your email address...',
      newsletterBtn: 'Subscribe',
      newsletterSuccess: 'Thank you for subscribing to our newsletter!',
    },
    programs: {
      hostPrefix: 'Host: ',
      episodes: 'Episodes',
    },
    about: {
      title: 'About SCOPE MEDIA',
      description: 'A premier digital media network rooted in the Arab world, dedicated to delivering rigorous investigative journalism, real-time news coverage, and in-depth analysis that transcends superficial headlines to explore root causes and future ramifications.',
      visionTitle: 'Our Vision',
      visionText: 'Fostering free intellectual awareness and delivering verified information with absolute credibility and editorial autonomy.',
      missionTitle: 'Our Mission',
      missionText: 'Empowering global audiences to comprehend complex geopolitical and economic shifts through state-of-the-art digital storytelling.',
      valuesTitle: 'Our Values',
      valuesText: 'Accuracy, integrity, courage in the pursuit of truth, and profound respect for our audience’s intelligence.',
    },
    categoryView: {
      noArticles: 'Nothing available to display',
      publishNew: '',
      prevPage: 'Previous',
      nextPage: 'Next',
      loadMore: 'Show More',
      editorDefault: 'SCOPE Editor',
    },
    drawer: {
      searchPlaceholder: 'Search SCOPE stories & investigations...',
      searchPrompt: 'Type any keyword for instant search across all coverage',
      noResults: 'No matching results for',
      themeAppearance: 'Theme Appearance',
      dayMode: 'Day Mode',
      nightMode: 'Dark Mode',
      light: 'Light',
      dark: 'Dark',
      liveStream: 'Live Stream',
      adminPortal: 'Editorial Admin Portal',
      settings: 'Settings',
      copyright: 'SCOPE MEDIA © 2026 - Beyond The Headlines',
    },
    liveModal: {
      liveBadge: 'LIVE ON AIR (( ))',
      studioTitle: 'Main Newsroom Studio - Live Coverage on SCOPE MEDIA',
      comingSoon: 'Live stream starting soon',
      viewersCount: 'watching now',
      chatTitle: 'Live Interaction',
      chatPlaceholder: 'Write your comment or question...',
      send: 'Send',
    },
    footer: {
      mission: 'An independent digital media platform specializing in investigative journalism and in-depth political & economic analysis, uncovering facts beyond the headlines.',
      certifiedEthics: 'Certified Code of Ethics',
      correspondents: 'Correspondents in 24 Capitals',
      newsSections: 'News Sections',
      politics: 'Politics & Diplomacy',
      economy: 'Finance & Energy Markets',
      middleEast: 'Middle East & Gulf',
      international: 'International Affairs',
      investigations: 'Investigative Reports',
      showsAndMedia: 'Shows & Media',
      showsSeries: 'SCOPE Show Series',
      videoReports: 'Video Reports',
      satelliteLive: 'Live Satellite Broadcast',
      audioPodcasts: 'Audio Podcasts',
      rss: 'RSS News Feeds',
      institution: 'Institution & Policies',
      aboutUs: 'About SCOPE MEDIA',
      editorialBoard: 'Editorial & Advisory Board',
      privacy: 'Privacy & Data Protection',
      terms: 'Terms of Use & Publishing',
      contact: 'Contact Newsroom',
      adminPortal: 'Editorial Admin Portal',
      options: 'Preferences & Settings',
      copyright: 'All rights reserved to SCOPE MEDIA © 2026 · Beyond The Headlines',
      followUs: 'Follow Us:',
    },
    searchPage: {
      title: 'Search Results',
      resultsFor: 'Search results for',
      resultsCount: 'articles found',
      noResults: 'No results found for',
      noResultsDesc: 'Please check your spelling or try different keywords.',
      searchPlaceholder: 'Type search keywords...',
      searchButton: 'Search',
      allCategories: 'All Categories',
      backHome: 'Back to Home',
      popularTags: 'Trending Topics',
    },
  },
};

export const translatedTags: Record<string, { AR: string; EN: string }> = {
  '#قمة_الرياض': { AR: '#قمة_الرياض', EN: '#Riyadh_Summit' },
  '#الذكاء_الاصطناعي': { AR: '#الذكاء_الاصطناعي', EN: '#AI_Tech' },
  '#طاقة_متجددة': { AR: '#طاقة_متجددة', EN: '#CleanEnergy' },
  '#اقتصاد_رقمي': { AR: '#اقتصاد_رقمي', EN: '#DigitalEconomy' },
  '#استكشاف_الفضاء': { AR: '#استكشاف_الفضاء', EN: '#SpaceExploration' },
  '#تراث_عربي': { AR: '#تراث_عربي', EN: '#ArabHeritage' },
  '#أسواق_المال': { AR: '#أسواق_المال', EN: '#FinancialMarkets' },
  '#علوم': { AR: '#علوم', EN: '#Science' },
  '#تحقيقات_حصرية': { AR: '#تحقيقات_حصرية', EN: '#ExclusiveInvestigations' },
};

export const categoryTranslations: Record<string, { AR: string; EN: string }> = {
  news: { AR: 'الأخبار', EN: 'News' },
  region: { AR: 'إقليمي', EN: 'Regional' },
  world: { AR: 'دولي', EN: 'World' },
  economy: { AR: 'اقتصاد', EN: 'Economy' },
  politics: { AR: 'سياسة', EN: 'Politics' },
  society: { AR: 'مجتمع', EN: 'Society' },
  culture: { AR: 'ثقافة', EN: 'Culture' },
  science: { AR: 'علوم', EN: 'Science' },
  investigations: { AR: 'تحقيقات', EN: 'Investigations' },
  programs: { AR: 'برامج', EN: 'Shows' },
  videos: { AR: 'فيديوهات', EN: 'Videos' },
  history: { AR: 'تاريخ ووثائق', EN: 'History & Archives' },
};

export const translatedShows: Record<string, { title: { AR: string; EN: string }; subtitle: { AR: string; EN: string }; host: { AR: string; EN: string }; description: { AR: string; EN: string } }> = {};

