import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CategoryClient from '../../../components/CategoryClient';
import { getServerArticlesPaginated } from '../../../lib/server/articles';
import { getServerBreaking } from '../../../lib/server/breaking';
import { categoryTranslations } from '../../../lib/translations';
import { getSiteUrl } from '../../../lib/site';

function parsePage(raw?: string): number {
  const parsed = parseInt(raw || '1', 10);
  return Math.min(500, Math.max(1, Number.isNaN(parsed) ? 1 : parsed));
}

// D1 does not exist at build time, so render per request (worker.ts caches the result).
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!Object.prototype.hasOwnProperty.call(categoryTranslations, slug)) {
    return { title: 'القسم غير موجود', robots: { index: false, follow: false } };
  }
  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);
  const label = categoryTranslations[slug].AR;
  const base = `${getSiteUrl()}/category/${slug}`;
  // Page 1 is the canonical URL of the section; deeper pages are self-canonical so they stay crawlable.
  const canonical = page > 1 ? `${base}?page=${page}` : base;
  const title = page > 1 ? `${label} - الصفحة ${page}` : `${label} - آخر الأخبار والتقارير`;
  const description = `تابع أحدث أخبار وتقارير قسم ${label} على SCOPE MEDIA | سكوب ميديا: تغطيات موثقة وتحليلات معمّقة.`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website', locale: 'ar_AR', siteName: 'SCOPE MEDIA | سكوب ميديا' },
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { slug } = await params;

  // Unknown categories (bot scans, typos) are rejected before touching the database.
  if (!Object.prototype.hasOwnProperty.call(categoryTranslations, slug)) notFound();

  const { page: rawPage } = await searchParams;
  const page = parsePage(rawPage);

  const [result, breaking] = await Promise.all([
    getServerArticlesPaginated(slug, page, PAGE_SIZE),
    getServerBreaking(12),
  ]);

  return (
    <CategoryClient
      slug={slug}
      page={page}
      articles={result.articles}
      total={result.total}
      totalPages={result.totalPages}
      hasMore={result.hasMore}
      breaking={breaking}
    />
  );
}
