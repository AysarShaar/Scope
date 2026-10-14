import { ScopeArticle } from '../../data/scopeData';
import { buildMatchQuery } from '../search';
import { rowToArticle, PartialArticleRow } from './articleMapper';

export type SearchSort = 'relevance' | 'latest';

export interface SearchOptions {
  query: string;
  category?: string;
  sort?: SearchSort;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  articles: ScopeArticle[];
  total: number;
  totalPages: number;
  /** True when the text had nothing searchable (empty, one letter, only symbols). */
  tooShort: boolean;
}

const EMPTY: SearchResult = { articles: [], total: 0, totalPages: 1, tooShort: false };

/**
 * Public article search on the FTS5 index (db/migrations/0012_articles_fts.sql).
 * Relevance uses bm25 with the title weighted highest; ties go to the newest article.
 * Only published articles are returned. One D1 round trip (rows + total).
 */
export async function searchPublishedArticles(
  db: import('@cloudflare/workers-types').D1Database,
  { query, category, sort = 'relevance', page = 1, limit = 12 }: SearchOptions,
): Promise<SearchResult> {
  const match = buildMatchQuery(query);
  if (!match) return { ...EMPTY, tooShort: query.trim().length > 0 };

  const params: unknown[] = [match];
  let extra = '';
  if (category && category !== 'all') {
    extra = ' AND a.category_slug = ?';
    params.push(category);
  }

  const base = `FROM articles_fts JOIN articles a ON a.id = articles_fts.id
    WHERE articles_fts MATCH ? AND a.status = 'published'${extra}`;
  // bm25 weights follow the column order of articles_fts: id, title, subtitle, caption, author, category.
  const order =
    sort === 'latest' ? 'a.created_at DESC' : 'bm25(articles_fts, 0, 10, 4, 2, 3, 2), a.created_at DESC';

  const rowsStmt = db
    .prepare(
      `SELECT a.id, a.title, a.subtitle, a.category, a.category_slug AS categorySlug, a.date,
              a.image_type AS imageType, a.image_url AS imageUrl, a.caption,
              a.author_name AS authorName, a.author_role AS authorRole, a.author_avatar AS authorAvatar,
              a.editor_id AS editorId, a.status, a.is_special AS isSpecial, a.created_at AS createdAt
       ${base} ORDER BY ${order} LIMIT ? OFFSET ?`,
    )
    .bind(...params, limit, (page - 1) * limit);
  const countStmt = db.prepare(`SELECT COUNT(*) AS total ${base}`).bind(...params);

  const [rowsRes, countRes] = await db.batch([rowsStmt, countStmt]);

  const total = Number((countRes.results[0] as { total?: number } | undefined)?.total ?? 0);
  return {
    articles: (rowsRes.results as unknown as PartialArticleRow[]).map((r) => rowToArticle(r, false)),
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    tooShort: false,
  };
}
