import type { Metadata } from 'next';
import SearchClient from '../../components/SearchClient';
import { getCloudflareEnv } from '../../lib/cloudflare';
import { searchPublishedArticles, SearchSort } from '../../lib/server/search';
import { MAX_QUERY_LENGTH } from '../../lib/search';

// Results come from D1, which does not exist at build time; worker.ts caches each URL for a few minutes.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'البحث',
  robots: { index: false, follow: true },
};

const PAGE_SIZE = 12;
const MAX_PAGE = 100;
const CATEGORY_IDS = ['all', 'news', 'economy', 'culture', 'society', 'science', 'investigations'];

type Params = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

export default async function SearchPage({ searchParams }: { searchParams: Params }) {
  const params = await searchParams;

  const q = first(params.q).trim().slice(0, MAX_QUERY_LENGTH);
  const rawCategory = first(params.category);
  const category = CATEGORY_IDS.includes(rawCategory) ? rawCategory : 'all';
  const sort: SearchSort = first(params.sort) === 'latest' ? 'latest' : 'relevance';
  const parsedPage = parseInt(first(params.page) || '1', 10);
  const page = Math.min(MAX_PAGE, Math.max(1, Number.isNaN(parsedPage) ? 1 : parsedPage));

  const env = getCloudflareEnv();
  const result =
    q && env?.DB
      ? await searchPublishedArticles(env.DB, { query: q, category, sort, page, limit: PAGE_SIZE })
      : { articles: [], total: 0, totalPages: 1, tooShort: false };

  return (
    <SearchClient
      q={q}
      category={category}
      sort={sort}
      page={page}
      articles={result.articles}
      total={result.total}
      totalPages={result.totalPages}
      tooShort={result.tooShort}
    />
  );
}
