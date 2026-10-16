import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from '../../../components/CategoryClient';
import { getServerArticlesPaginated } from '../../../lib/server/articles';
import { getServerBreaking } from '../../../lib/server/breaking';
import { categoryTranslations } from '../../../lib/translations';
import { getSiteUrl } from '../../../lib/site';
import { getCategorySeo, SITE_NAME } from '../../../lib/seo';
import { safeJsonLd } from '../../../lib/safeJsonLd';

// ISR: Revalidate every 120 seconds
export const revalidate = 120;
export const dynamicParams = true;

export function generateStaticParams() {
  return Object.keys(categoryTranslations).map((slug) => ({ slug }));
}

const PAGE_SIZE = 20;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!Object.prototype.hasOwnProperty.call(categoryTranslations, slug)) {
    return { title: 'القسم غير موجود', robots: { index: false, follow: false } };
  }
  const label = categoryTranslations[slug].AR;
  const siteUrl = getSiteUrl();
  const seo = getCategorySeo(slug, 1, label);
  const canonical = `${siteUrl}/category/${slug}`;
  const ogImageUrl = `${siteUrl}/og-default.png`;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: { canonical },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: canonical,
      type: 'website',
      locale: 'ar_AR',
      siteName: SITE_NAME,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: seo.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: [ogImageUrl],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;

  // Unknown categories (bot scans, typos) are rejected before touching the database.
  if (!Object.prototype.hasOwnProperty.call(categoryTranslations, slug)) notFound();

  const label = categoryTranslations[slug].AR;
  const siteUrl = getSiteUrl();
  const seo = getCategorySeo(slug, 1, label);
  const canonicalUrl = `${siteUrl}/category/${slug}`;

  const [result, breaking] = await Promise.all([
    getServerArticlesPaginated(slug, 1, PAGE_SIZE),
    getServerBreaking(12),
  ]);

  const jsonLdCollection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: seo.title,
    description: seo.description,
    inLanguage: 'ar',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: SITE_NAME,
      url: siteUrl,
    },
    about: {
      '@type': 'Thing',
      name: label,
    },
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
        name: label,
        item: `${siteUrl}/category/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdCollection) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLdBreadcrumb) }}
      />
      <CategoryClient
        slug={slug}
        page={1}
        articles={result.articles}
        total={result.total}
        totalPages={result.totalPages}
        hasMore={result.hasMore}
        breaking={breaking}
      />
    </>
  );
}
