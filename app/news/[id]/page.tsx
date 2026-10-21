import { Metadata } from 'next';
import Link from '../../../components/NavLink';
import { notFound } from 'next/navigation';
import { Clock, ChevronLeft } from 'lucide-react';
import { ScopeVisual } from '../../../components/ScopeVisual';
import { ArticleInteractiveBar } from '../../../components/ArticleInteractiveBar';
import { ArticleHeader } from '../../../components/ArticleHeader';
import { ArticleNavigation } from '../../../components/ArticleNavigation';
import { ScopeFooter } from '../../../components/ScopeFooter';
import { ArticleBody } from '../../../components/ArticleBody';
import { contentToText } from '../../../lib/articleText';
import { safeJsonLd } from '../../../lib/safeJsonLd';
import { getServerArticleById, getServerArticles } from '../../../lib/server/articles';
import { getServerBreaking } from '../../../lib/server/breaking';
import { getSiteUrl } from '../../../lib/site';
import { absoluteImageUrl, articleIsoDates, trimDescription, SITE_NAME, getNewsArticleImageUrls } from '../../../lib/seo';

// ISR: Revalidate every 120 seconds
export const revalidate = 120;
export const dynamicParams = true;

export async function generateStaticParams() {
  const articles = await getServerArticles(undefined, 20).catch(() => []);
  return articles.map((art) => ({ id: art.id }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = await getServerArticleById(id);

  if (!article) {
    return {
      title: 'المقال غير موجود',
      description: 'الصفحة المطلوبة غير متوفرة في أرشيف SCOPE MEDIA.',
      robots: { index: false, follow: false },
    };
  }

  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/news/${article.id}`;
  const bodyText = contentToText(article.content);
  const description = trimDescription(
    article.subtitle || article.caption || bodyText || 'تغطية استقصائية خاصة عبر شبكة SCOPE MEDIA',
  );
  const ogImageUrl = absoluteImageUrl(siteUrl, article.imageUrl);
  const { published, modified } = articleIsoDates(article);

  return {
    title: article.title,
    description,
    keywords: [
      article.category,
      'SCOPE MEDIA',
      'سكوب ميديا',
      ...(article.subtitle ? [article.subtitle.slice(0, 40)] : []),
    ],
    alternates: {
      canonical: articleUrl,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    openGraph: {
      title: article.title,
      description,
      url: articleUrl,
      siteName: SITE_NAME,
      locale: 'ar_AR',
      type: 'article',
      publishedTime: published,
      modifiedTime: modified,
      section: article.category,
      tags: [article.category, 'SCOPE MEDIA'],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = await getServerArticleById(id);

  if (!article) {
    notFound();
  }

  const [allArticles, categoryArticles, breakingNews] = await Promise.all([
    getServerArticles(undefined, 20),
    getServerArticles(article.categorySlug, 10),
    getServerBreaking(12),
  ]);

  const navArticles = allArticles.filter((a) => a.id !== article.id).slice(0, 7);
  const excludedIds = new Set([article.id, ...navArticles.map((a) => a.id)]);
  const directRelated = (categoryArticles || []).filter((a) => !excludedIds.has(a.id));
  const fallbackRelated = (allArticles || []).filter(
    (a) => !excludedIds.has(a.id) && !directRelated.some((r) => r.id === a.id)
  );
  const relatedArticles = [...directRelated, ...fallbackRelated].slice(0, 5);
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/news/${article.id}`;

  const articleImages = getNewsArticleImageUrls(siteUrl, article.imageUrl);
  const { published, modified } = articleIsoDates(article);
  const description = trimDescription(article.subtitle || article.caption || contentToText(article.content));
  const articleWordCount = contentToText(article.content).split(/\s+/).filter(Boolean).length;
  const publishYear = published ? new Date(published).getFullYear() : new Date().getFullYear();

  const jsonLdNewsArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: article.title,
    description,
    image: articleImages,
    datePublished: published,
    dateModified: modified || published,
    url: articleUrl,
    author: {
      '@type': 'NewsMediaOrganization',
      '@id': `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      '@id': `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo-512.png`,
        width: 512,
        height: 512,
      },
      publishingPrinciples: `${siteUrl}/about`,
    },
    articleSection: article.category,
    keywords: [
      article.category,
      'سكوب ميديا',
      'SCOPE MEDIA',
      ...(article.subtitle ? [article.subtitle.slice(0, 40)] : []),
    ].join(', '),
    wordCount: articleWordCount > 0 ? articleWordCount : undefined,
    isAccessibleForFree: true,
    inLanguage: 'ar',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-speakable="summary"]'],
    },
    copyrightHolder: {
      '@type': 'NewsMediaOrganization',
      '@id': `${siteUrl}/#organization`,
      name: SITE_NAME,
      url: siteUrl,
    },
    copyrightYear: publishYear,
  };

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: article.category,
        item: `${siteUrl}/category/${article.categorySlug}`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#080e1a] text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdNewsArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }}
      />

      <ArticleHeader currentCategorySlug={article.categorySlug} breakingNews={breakingNews} />

      <nav aria-label="مسار التصفح" className="w-full bg-white/90 dark:bg-[#0c1628]/90 border-b border-slate-200 dark:border-slate-800/80 py-2.5 backdrop-blur-xs">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 overflow-hidden whitespace-nowrap">
          <Link href="/" prefetch={false} className="hover:text-[#A42424] transition-colors shrink-0">
            الرئيسية
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
          <Link href={`/category/${article.categorySlug}`} prefetch={false} className="hover:text-[#A42424] transition-colors font-medium shrink-0">
            {article.category}
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400 rtl:rotate-0 ltr:rotate-180 shrink-0" />
          <span className="truncate text-slate-800 dark:text-slate-200 font-medium">
            {article.title}
          </span>
        </div>
      </nav>

      <main className="flex-1 w-full">
        <div className="max-w-[1480px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-10">
          <div className="flex flex-col lg:flex-row-reverse items-start justify-between gap-8 lg:gap-10 xl:gap-14 relative">
            {/* Main Article (المقال والصورة) */}
            {/* Mobile: Top. Desktop (lg): Left in RTL (Arabic), Right in LTR (English) */}
            <article className="flex-1 min-w-0 max-w-[880px] xl:max-w-[920px] w-full space-y-6 font-article">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80 text-xs">
                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/category/${article.categorySlug}`}
                    prefetch={false}
                    className="text-xs sm:text-[13px] font-bold text-[#A42424] dark:text-[#E05252] hover:opacity-80 transition-opacity"
                  >
                    {article.category}
                  </Link>
                </div>

                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-sans text-[13px]">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{article.date}</span>
                </div>
              </div>

              <h1 data-speakable="headline" className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] xl:text-[42px] font-black text-slate-900 dark:text-white leading-[1.3] rtl:text-right ltr:text-left tracking-tight">
                {article.title}
              </h1>

              {article.subtitle && (
                <p data-speakable="summary" className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium rtl:text-right ltr:text-left">
                  {article.subtitle}
                </p>
              )}

              <div className="space-y-2">
                <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden shadow-xs bg-slate-950 border border-slate-200/60 dark:border-slate-800">
                  <ScopeVisual imageUrl={article.imageUrl} type={article.imageType} className="w-full h-full object-cover" priority />
                </div>
                {article.caption && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-sans pt-1">
                    {article.caption}
                  </p>
                )}
              </div>

              <div className="space-y-6 text-base sm:text-lg lg:text-[19px] leading-relaxed lg:leading-[2.2] text-slate-800 dark:text-slate-200 font-normal pt-2 rtl:text-right ltr:text-left [word-spacing:-0.03em]">
                {article.content && article.content.length > 0 ? (
                  <ArticleBody content={article.content} title={article.title} />
                ) : (
                  <p>
                    تغطية استقصائية شاملة ومستمرة من غرفة أخبار SCOPE MEDIA لكافة المستجدات والتطورات المتعلقة بهذا الملف، مع متابعة دقيقة لمواقف الأطراف الفاعلة وانعكاساتها المباشرة على المشهد العام.
                  </p>
                )}
              </div>

              <ArticleInteractiveBar articleId={article.id} title={article.title} />
            </article>

            {/* Sidebar: Related Articles (مقالات ذات صلة) */}
            {/* Mobile: Bottom (under article). Desktop (lg): Right in RTL (Arabic), Left in LTR (English) */}
            {/* Sticky to scroll naturally with the page, without independent scrollbar */}
            {relatedArticles.length > 0 && (
              <aside className="w-full lg:w-[320px] xl:w-[360px] shrink-0 pt-8 lg:pt-0 border-t lg:border-t-0 border-slate-200 dark:border-slate-800 lg:sticky lg:top-24 lg:self-start z-10">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 mb-5">
                  <span className="w-1.5 h-5 bg-[#A42424] rounded-full inline-block" />
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    تقارير ذات صلة
                  </h2>
                </div>

                <div className="space-y-5">
                  {relatedArticles.map((rel) => (
                    <Link
                      key={rel.id}
                      href={`/news/${rel.id}`}
                      prefetch={false}
                      className="group block cursor-pointer border-b border-slate-200/80 dark:border-slate-800/80 pb-5 last:border-none last:pb-0"
                    >
                      {/* Image on top (Golden Ratio) */}
                      <div className="relative aspect-[1.618/1] overflow-hidden rounded-[10px] bg-[#0d1624] mb-2.5">
                        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                          <ScopeVisual
                            imageUrl={rel.imageUrl}
                            type={rel.imageType}
                            category={rel.categorySlug}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Category */}
                      <span className="text-[11px] sm:text-xs font-extrabold text-[#A42424] dark:text-[#F27676] block mb-1">
                        {rel.category}
                      </span>

                      {/* Title */}
                      <h3 className="text-sm sm:text-[15px] font-black leading-[1.4] text-slate-900 dark:text-white transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676] line-clamp-2">
                        {rel.title}
                      </h3>

                      {/* Subtitle */}
                      {rel.subtitle && (
                        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 line-clamp-2">
                          {rel.subtitle}
                        </p>
                      )}

                      {/* Date */}
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-400 font-sans">
                        <Clock className="w-3.5 h-3.5 opacity-70" />
                        <span>{rel.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </aside>
            )}
          </div>
        </div>

        <ArticleNavigation currentArticleId={article.id} navArticles={navArticles} />
      </main>

      <ScopeFooter />
    </div>
  );
}
