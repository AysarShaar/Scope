import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Clock, ChevronLeft } from 'lucide-react';
import {
  getArticleById,
  getRelatedArticles,
  getAllArticles,
  ScopeArticle,
} from '../../../data/scopeData';
import { ScopeVisual } from '../../../components/ScopeVisual';
import { ArticleInteractiveBar } from '../../../components/ArticleInteractiveBar';
import { ArticleComments } from '../../../components/ArticleComments';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Generate static params for optimal pre-rendering and instant SEO indexing
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    id: article.id,
  }));
}

// Dynamic OpenGraph, Twitter, and SEO Metadata Generation
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const article = getArticleById(id);

  if (!article) {
    return {
      title: 'المقال غير موجود | SCOPE MEDIA',
      description: 'الصفحة المطلوبة غير متوفرة في أرشيف SCOPE MEDIA.',
    };
  }

  const siteUrl = process.env.APP_URL || 'https://scope-media.pages.dev';
  const articleUrl = `${siteUrl}/news/${article.id}`;
  const description = article.subtitle || article.caption || 'تغطية استقصائية خاصة عبر شبكة SCOPE MEDIA';

  return {
    title: `${article.title} | SCOPE MEDIA`,
    description,
    keywords: [
      article.category,
      'أخبار الشرق الأوسط',
      'تحليلات سياسية',
      'اقتصاد',
      'SCOPE MEDIA',
      'سكوب ميديا',
      'ما وراء العناوين',
    ],
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: `${article.title} | SCOPE MEDIA`,
      description,
      url: articleUrl,
      siteName: 'SCOPE MEDIA | سكوب ميديا',
      locale: 'ar_AR',
      type: 'article',
      publishedTime: article.date,
      authors: [article.author?.name || 'فريق تحرير SCOPE MEDIA'],
      section: article.category,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${article.title} | SCOPE MEDIA`,
      description,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const article = getArticleById(id);

  if (!article) {
    notFound();
  }

  const relatedArticles = getRelatedArticles(article.id, article.categorySlug, 3);
  const siteUrl = process.env.APP_URL || 'https://scope-media.pages.dev';
  const articleUrl = `${siteUrl}/news/${article.id}`;

  // Structured Data Schema.org (JSON-LD) for Google News and Rich Snippets
  const jsonLdNewsArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': articleUrl,
    },
    headline: article.title,
    description: article.subtitle || article.caption,
    datePublished: article.date,
    dateModified: article.date,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'فريق تحرير SCOPE MEDIA',
      jobTitle: article.author?.role || 'محرر صحفي',
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'SCOPE MEDIA',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    articleSection: article.category,
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
        item: `${siteUrl}/?category=${article.categorySlug}`,
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
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0f1d] text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdNewsArticle) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* Top Navigation Bar */}
      <header className="w-full bg-[#0a1526] text-white border-b border-slate-800 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-center">
          {/* SCOPE MEDIA Brand Wordmark Centered */}
          <Link href="/" className="flex flex-col items-center group cursor-pointer">
            <span className="font-black text-2xl sm:text-3xl tracking-tighter text-white font-sans uppercase leading-none">
              SCOPE
            </span>
            <div className="flex items-center gap-1 w-full justify-center mt-0.5">
              <span className="w-2.5 h-[1.5px] bg-[#dc2626]"></span>
              <span className="text-[9px] sm:text-[10px] font-black tracking-widest text-[#dc2626] uppercase leading-none">
                MEDIA
              </span>
              <span className="w-2.5 h-[1.5px] bg-[#dc2626]"></span>
            </div>
          </Link>
        </div>
      </header>

      {/* Breadcrumb Navigation for SEO & UX */}
      <nav aria-label="مسار التصفح" className="w-full bg-white/80 dark:bg-[#121b2d]/80 border-b border-slate-200 dark:border-slate-800/80 py-2.5 backdrop-blur-xs">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-slate-900 dark:hover:text-white transition-colors">
            الرئيسية
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          <Link href={`/?category=${article.categorySlug}`} className="hover:text-slate-900 dark:hover:text-white transition-colors">
            {article.category}
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 text-slate-400" />
          <span className="truncate max-w-xl text-slate-800 dark:text-slate-200 font-medium">
            {article.title}
          </span>
        </div>
      </nav>

      {/* Main Dedicated Article Content Container spanning full page container */}
      <main className="flex-1 max-w-[1480px] mx-auto w-full px-3 sm:px-6 py-8">
        <article className="w-full bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800/90 rounded-2xl shadow-sm p-6 sm:p-10 lg:p-12 space-y-7 transition-colors">
          {/* Header Metadata */}
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-bold text-[#dc2626]">
              {article.category}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 dark:text-slate-400 font-mono">
              {article.date}
            </span>
          </div>

          {/* Headline - Primary H1 for SEO */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white leading-[1.3] max-w-5xl">
            {article.title}
          </h1>

          {/* Featured Visual with High Contrast Spanning Wide Format */}
          <div className="relative aspect-[16/8] sm:aspect-[21/9] w-full rounded-xl overflow-hidden shadow-xs bg-slate-950">
            <ScopeVisual type={article.imageType} className="w-full h-full" priority />
          </div>

          {article.caption && (
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center font-sans -mt-4">
              {article.caption}
            </p>
          )}

          {/* Article Body Narrative with Drop Cap */}
          <div className="space-y-6 text-base sm:text-lg lg:text-[19px] leading-relaxed lg:leading-[2.2] text-slate-800 dark:text-slate-200 font-normal pt-2 max-w-5xl">
            {article.content ? (
              article.content.map((paragraph, idx) => (
                <p key={idx} className={`text-justify ${idx === 0 ? 'drop-cap' : ''}`}>
                  {paragraph}
                </p>
              ))
            ) : (
              <p className="text-justify drop-cap">
                تغطية استقصائية شاملة ومستمرة من غرفة أخبار SCOPE MEDIA لكافة المستجدات والتطورات المتعلقة بهذا الملف، مع متابعة دقيقة لمواقف الأطراف الفاعلة وانعكاساتها المباشرة.
              </p>
            )}
          </div>

          {/* Subtitle, Author Byline & Social Share Bar (Moved to bottom before comments) */}
          <div className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
            {/* Subtitle / Conclusion Deck */}
            {article.subtitle && (
              <p className="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-normal border-r-4 border-[#dc2626] pr-4 max-w-5xl">
                {article.subtitle}
              </p>
            )}

            {/* Author Byline & Publishing Credits */}
            {article.author && (
              <div className="flex items-center gap-3.5 pt-2">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-sm text-slate-800 dark:text-slate-200 shrink-0">
                  {article.author.name.slice(0, 2)}
                </div>
                <div>
                  <div className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                    بقلم: {article.author.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {article.author.role}
                  </div>
                </div>
              </div>
            )}

            {/* Social Share & Bookmarks Bar */}
            <ArticleInteractiveBar articleId={article.id} title={article.title} />
          </div>

          {/* Interactive Comments Section */}
          <ArticleComments articleId={article.id} />
        </article>

        {/* Related Stories Section (أخبار ذات صلة) */}
        {relatedArticles.length > 0 && (
          <section className="mt-12 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#dc2626]"></span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                تقارير وأخبار ذات صلة
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedArticles.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/news/${rel.id}`}
                  className="bg-white dark:bg-[#121b2d] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden p-3.5 group hover:border-[#dc2626] dark:hover:border-slate-600 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="relative aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden mb-3">
                      <ScopeVisual type={rel.imageType} className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <span className="text-[11px] font-bold text-[#dc2626] dark:text-rose-400 block mb-1">
                      {rel.category}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#dc2626] dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug">
                      {rel.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{rel.date}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back Link to Homepage */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0a1526] hover:bg-[#152a4e] text-white rounded-full text-xs sm:text-sm font-semibold transition-colors shadow-sm"
          >
            <ArrowRight className="w-4 h-4" />
            <span>العودة إلى الصفحة الرئيسية لمنصة SCOPE MEDIA</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#0a1526] text-slate-400 border-t border-slate-800 py-6 text-center text-xs mt-12">
        <p>جميع الحقوق محفوظة لشبكة SCOPE MEDIA © 2026 · ما وراء العناوين</p>
      </footer>
    </div>
  );
}
