import { Metadata } from 'next';
import Link from '../../../components/NavLink';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Clock, ChevronLeft, ShieldCheck } from 'lucide-react';
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
import { optimizeCloudinaryUrl } from '../../../lib/cloudinary';
import { getSiteUrl } from '../../../lib/site';
import { absoluteImageUrl, articleIsoDates, trimDescription, SITE_NAME } from '../../../lib/seo';

export const revalidate = 120;

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
    keywords: [article.category, 'SCOPE MEDIA', 'سكوب ميديا', 'ما وراء العناوين'],
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
      authors: [article.author?.name || 'فريق تحرير SCOPE MEDIA'],
      section: article.category,
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
    getServerArticles(undefined, 10),
    getServerArticles(article.categorySlug, 5),
    getServerBreaking(12),
  ]);

  const navArticles = allArticles.filter((a) => a.id !== article.id).slice(0, 7);
  const directRelated = (categoryArticles || []).filter((a) => a.id !== article.id);
  const fallbackRelated = (allArticles || []).filter((a) => a.id !== article.id && !directRelated.some((r) => r.id === a.id));
  const relatedArticles = [...directRelated, ...fallbackRelated].slice(0, 3);
  const siteUrl = getSiteUrl();
  const articleUrl = `${siteUrl}/news/${article.id}`;

  const articleOgImage = absoluteImageUrl(siteUrl, article.imageUrl);
  const { published, modified } = articleIsoDates(article);
  const description = trimDescription(article.subtitle || article.caption || contentToText(article.content));

  const jsonLdNewsArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: article.title,
    description,
    image: [articleOgImage],
    datePublished: published,
    dateModified: modified,
    url: articleUrl,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'فريق تحرير SCOPE MEDIA',
      jobTitle: article.author?.role || 'محرر صحفي',
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'SCOPE MEDIA | سكوب ميديا',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo-512.png`,
      },
    },
    articleSection: article.category,
    wordCount: contentToText(article.content).split(/\s+/).filter(Boolean).length,
    isAccessibleForFree: true,
    inLanguage: 'ar',
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
        <div className="max-w-[920px] mx-auto w-full px-4 sm:px-6 pt-6 sm:pt-10 pb-2">
          <article className="w-full space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80 text-xs">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-1 bg-[#A42424] text-white font-bold text-xs rounded-md shadow-2xs">
                  {article.category}
                </span>
                {article.isSpecial && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-md font-bold text-xs">
                    <span>تغطية خاصة</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{article.date}</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[42px] font-black text-slate-900 dark:text-white leading-[1.3] rtl:text-right ltr:text-left tracking-tight">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium rtl:text-right ltr:text-left">
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

            <div className="space-y-6 text-base sm:text-lg lg:text-[19px] leading-relaxed lg:leading-[2.2] text-slate-800 dark:text-slate-200 font-normal pt-2 rtl:text-right ltr:text-left">
              {article.content && article.content.length > 0 ? (
                <ArticleBody content={article.content} title={article.title} />
              ) : (
                <p>
                  تغطية استقصائية شاملة ومستمرة من غرفة أخبار SCOPE MEDIA لكافة المستجدات والتطورات المتعلقة بهذا الملف، مع متابعة دقيقة لمواقف الأطراف الفاعلة وانعكاساتها المباشرة على المشهد العام.
                </p>
              )}
            </div>

            {article.author && (
              <div className="flex items-center justify-between gap-4 py-5 mt-4 border-t border-slate-200 dark:border-slate-800/80">
                <div className="flex items-center gap-3">
                  {article.authorAvatar ? (
                    <Image
                      src={optimizeCloudinaryUrl(article.authorAvatar)}
                      alt={article.author.name}
                      width={44}
                      height={44}
                      unoptimized
                      className="w-11 h-11 rounded-full object-cover border border-slate-700 shadow-xs"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#0c1828] to-[#1e3a5f] border border-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {article.author.name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>بقلم: {article.author.name}</span>
                      <span title="محرر صحفي معتمد"><ShieldCheck className="w-3.5 h-3.5 text-rose-500" /></span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {article.author.role}
                    </div>
                  </div>
                </div>
            </div>
          )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <ArticleInteractiveBar articleId={article.id} title={article.title} />
            </div>
          </article>
        </div>

        <ArticleNavigation currentArticleId={article.id} navArticles={navArticles} />

        {relatedArticles.length > 0 && (
          <section aria-labelledby="relTitle" className="max-w-[1320px] mx-auto w-full px-4 sm:px-6 lg:px-10 pt-7 sm:pt-8 pb-2">
            <h2
              id="relTitle"
              className="mb-7 text-2xl sm:text-3xl lg:text-[2.2rem] font-black leading-snug text-[#101722] dark:text-[#f0f3f8]"
            >
              تقارير ذات صلة
            </h2>

            <div className="grid">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${rel.id}`}
                  prefetch={false}
                  className="group grid grid-cols-1 md:grid-cols-[5fr_7fr] items-center gap-4 md:gap-10 py-7 border-t border-[#d9e0e8] dark:border-[#212c3c] last:border-b"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-[10px] bg-[#0d1624]">
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]">
                      <ScopeVisual
                        imageUrl={rel.imageUrl}
                        type={rel.imageType}
                        category={rel.categorySlug}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[13px] font-extrabold text-[#A42424] dark:text-[#F27676]">{rel.category}</span>
                    <h3 className="mt-1.5 text-xl sm:text-2xl lg:text-[1.9rem] font-black leading-[1.45] text-[#101722] dark:text-[#f0f3f8] transition-colors group-hover:text-[#A42424] dark:group-hover:text-[#F27676]">
                      {rel.title}
                    </h3>
                    {rel.subtitle && (
                      <p className="mt-2.5 max-w-[56ch] text-base leading-[1.85] text-[#566274] dark:text-[#98a5b7] line-clamp-2">
                        {rel.subtitle}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-[13px] text-[#566274] dark:text-[#98a5b7]">
                      <span>{rel.date}</span>
                      <span>{rel.author?.name || 'محرر SCOPE'}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <ScopeFooter />
    </div>
  );
}
