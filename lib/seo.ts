import { parseArticleDateToTime } from './dates';

/** D1 stores `datetime('now')` as "YYYY-MM-DD HH:MM:SS" in UTC; search engines need real ISO 8601. */
export function sqliteToIso(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed.replace(' ', 'T')}Z`;
  }
  const time = Date.parse(trimmed);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

interface DatedArticle {
  date?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Publication / modification instants for structured data. Falls back to the Arabic display date. */
export function articleIsoDates(article: DatedArticle): { published?: string; modified?: string } {
  let published = sqliteToIso(article.createdAt);
  if (!published) {
    const fromDisplay = parseArticleDateToTime(article.date);
    if (fromDisplay !== null) published = new Date(fromDisplay).toISOString();
  }
  const modified = sqliteToIso(article.updatedAt) || published;
  return { published, modified };
}

/** Turns a stored image path or URL into an absolute URL, with the default share image as the fallback. */
export function absoluteImageUrl(siteUrl: string, imageUrl?: string | null): string {
  if (!imageUrl) return `${siteUrl}/og-default.png`;
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
}

/** Plain-text meta description: collapses whitespace and trims to a length search engines display. */
export function trimDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
}

export const SITE_NAME = 'SCOPE MEDIA | سكوب ميديا';

export interface CategorySeoConfig {
  title: string;
  description: string;
  keywords: string[];
}

export const CATEGORY_SEO_DATA: Record<string, CategorySeoConfig> = {
  news: {
    title: 'الأخبار العاجلة والتغطيات الميدانية | سكوب ميديا',
    description: 'تغطية إخبارية شاملة ومباشرة لأحدث التطورات السياسية والاقتصادية والأمنية في العالم العربي والدولي على مدار الساعة من سكوب ميديا.',
    keywords: ['أخبار عاجلة', 'تغطية مباشرة', 'سكوب ميديا', 'أحدث الأخبار', 'أخبار اليوم', 'أخبار عربية وعالمية', 'Scope Media News'],
  },
  region: {
    title: 'أخبار الشرق الأوسط والخليج العربي | سكوب ميديا',
    description: 'متابعة استراتيجية معمقة لأهم ملفات الشرق الأوسط، الخليج العربي، وشمال إفريقيا، مع تحليلات خاصة للمشهد الإقليمي من سكوب ميديا.',
    keywords: ['الشرق الأوسط', 'أخبار الخليج', 'شمال إفريقيا', 'الأمن الإقليمي', 'تحليلات سياسية عربية', 'قضايا عربية'],
  },
  world: {
    title: 'أخبار العالم والشؤون الدولية | سكوب ميديا',
    description: 'تغطية فورية لأحداث السياسة الدولية، صراعات القوى الكبرى، التحالفات الجيوسياسية، وقضايا الأمن العالمي عبر منصة سكوب ميديا.',
    keywords: ['أخبار العالم', 'الشؤون الدولية', 'جيوسياسية', 'العلاقات الدولية', 'أوروبا', 'الولايات المتحدة', 'الصين وروسيا'],
  },
  economy: {
    title: 'اقتصاد وأسواق المال والنفط والطاقة | سكوب ميديا',
    description: 'رصد دقيق لأسواق المال العالمية والخليجية، أسعار النفط والغاز، التضخم، وسياسات البنوك المركزية واستشراف الاقتصاد من سكوب ميديا.',
    keywords: ['اقتصاد', 'أسواق المال', 'أسعار النفط', 'الذهب والعملات', 'التضخم', 'الفائدة والبنوك المركزية', 'اقتصاد الخليج'],
  },
  politics: {
    title: 'سياسة ودبلوماسية وتحليلات جيوسياسية | سكوب ميديا',
    description: 'تحليلات معمقة تفكك كواليس القرارات السياسية والتحركات الدبلوماسية والانتخابات الإقليمية والعالمية على منصة سكوب ميديا.',
    keywords: ['سياسة', 'دبلوماسية', 'تحليلات سياسية', 'صناع القرار', 'الانتخابات', 'العلاقات الدبلوماسية', 'التحليل الجيوسياسي'],
  },
  society: {
    title: 'قضايا المجتمع والإنسان والتحولات الحياتية | سكوب ميديا',
    description: 'تقارير وقصص إنسانية تسلط الضوء على قضايا المجتمع العربي، التعليم، الصحة، قضايا الشباب، والتحولات الاجتماعية مع سكوب ميديا.',
    keywords: ['قضايا المجتمع', 'المجتمع العربي', 'الشباب والتعليم', 'الصحة والحياة', 'قصص إنسانية', 'تحولات اجتماعية'],
  },
  culture: {
    title: 'ثقافة وفنون وتراث وفكر إنساني | سكوب ميديا',
    description: 'متابعات للمشهد الثقافي العربي والعالمي، قراءات أدبية ونقدية، إضاءات على الفنون التشكيلية، السينما، والتراث مع سكوب ميديا.',
    keywords: ['ثقافة وفنون', 'التراث العربي', 'الأدب والفكر', 'السينما والمعارض', 'نقد فني', 'فعاليات ثقافية'],
  },
  science: {
    title: 'علوم وتكنولوجيا وذكاء اصطناعي وفضاء | سكوب ميديا',
    description: 'استكشاف لأحدث ثورات الذكاء الاصطناعي، تكنولوجيا المستقبل، بعثات الفضاء، والأبحاث العلمية والتغير المناخي مع سكوب ميديا.',
    keywords: ['علوم وتكنولوجيا', 'الذكاء الاصطناعي', 'استكشاف الفضاء', 'الابتكار والتقنية', 'الأبحاث العلمية', 'المناخ والبيئة'],
  },
  investigations: {
    title: 'تحقيقات استقصائية وملفات حصرية | سكوب ميديا',
    description: 'صحافة استقصائية مهنية تكشف الحقائق وراء العناوين، مدعومة بوثائق وأدلة ومتابعات ميدانية لملفات كبرى حصرية من سكوب ميديا.',
    keywords: ['تحقيقات استقصائية', 'ملفات حصرية', 'وثائق سرية', 'صحافة استقصائية', 'كشف الحقائق', 'ما وراء العناوين'],
  },
  programs: {
    title: 'برامج SCOPE الحصرية والحوارات السياسية | سكوب ميديا',
    description: 'دليل برامج سكوب ميديا المتنوعة، لقاءات حصرية مع صناع القرار، وسلاسل وثائقية تستعرض أهم الملفات المعاصرة عبر سكوب ميديا.',
    keywords: ['برامج سكوب', 'حوارات سياسية', 'مقابلات خاصة', 'سلسلة وثائقية', 'برامج حوارية', 'Scope Media Shows'],
  },
  videos: {
    title: 'فيديوهات إخبارية وتقارير مصورة | سكوب ميديا',
    description: 'تقارير مصورة، فيديوغرافيك، ومحتوى مرئي عالي الجودة يواكب الأحداث الإخبارية والقصص المصورة لحظة بلحظة من سكوب ميديا.',
    keywords: ['فيديوهات إخبارية', 'تقارير مصورة', 'فيديوغرافيك', 'تغطيات مرئية', 'فيديو سكوب ميديا'],
  },
  history: {
    title: 'تاريخ ووثائق وذاكرة الأحداث المفصلية | سكوب ميديا',
    description: 'قراءة توثيقية لأحداث تاريخية شكلت حاضرنا، استعراض لأهم الوثائق، وإعادة قراءة لمحطات مفصلية في تاريخ المنطقة مع سكوب ميديا.',
    keywords: ['تاريخ ووثائق', 'ذاكرة التاريخ', 'أحداث مفصلية', 'وثائق تاريخية', 'تاريخ الشرق الأوسط', 'أرشيف'],
  },
};

export function getCategorySeo(slug: string, page = 1, fallbackLabel?: string): CategorySeoConfig & { canonicalSuffix: string } {
  const config = CATEGORY_SEO_DATA[slug] || {
    title: fallbackLabel ? `${fallbackLabel} - آخر الأخبار والتقارير | ${SITE_NAME}` : `الأخبار والتقارير | ${SITE_NAME}`,
    description: fallbackLabel
      ? `تابع أحدث الأخبار والتحليلات الخاصة بـ ${fallbackLabel} عبر منصة سكوب ميديا SCOPE MEDIA.`
      : `تابع أحدث الأخبار والتحليلات عبر منصة سكوب ميديا SCOPE MEDIA.`,
    keywords: [fallbackLabel || 'أخبار', 'سكوب ميديا', 'SCOPE MEDIA'],
  };

  if (page <= 1) {
    return { ...config, canonicalSuffix: '' };
  }

  return {
    title: `${config.title} - صفحة ${page}`,
    description: `${config.description} (صفحة ${page})`,
    keywords: config.keywords,
    canonicalSuffix: `?page=${page}`,
  };
}

/**
 * Returns image URLs for NewsArticle structured data (Google News / Top Stories).
 */
export function getNewsArticleImageUrls(siteUrl: string, imageUrl?: string | null): string[] {
  return [absoluteImageUrl(siteUrl, imageUrl)];
}
