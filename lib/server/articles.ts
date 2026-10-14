import { cache } from 'react';
import { getCloudflareEnv } from '../cloudflare';
import { getDb } from '../../db/client';
import { articles } from '../../db/schema';
import { eq, desc, and, count } from 'drizzle-orm';
import { ScopeArticle } from '../../data/scopeData';
import { newsService } from '../../services/newsService';
import { rowToArticle } from './articleMapper';

export const getServerArticleById = cache(async (id: string): Promise<ScopeArticle | null> => {
  const env = getCloudflareEnv();
  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(articles)
        .where(and(eq(articles.id, id), eq(articles.status, 'published')))
        .limit(1);

      if (rows[0]) {
        return rowToArticle(rows[0], true);
      }
      return null;
    } catch (err) {
      console.error('[getServerArticleById] direct D1 error:', err);
    }
  }

  return newsService.getArticleById(id);
});

export const getServerArticles = cache(async (categorySlug?: string, limit = 12): Promise<ScopeArticle[]> => {
  const env = getCloudflareEnv();
  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const conditions = [eq(articles.status, 'published')];
      if (categorySlug && categorySlug !== 'home' && categorySlug !== 'all') {
        conditions.push(eq(articles.categorySlug, categorySlug));
      }

      const rows = await db
        .select({
          id: articles.id,
          title: articles.title,
          subtitle: articles.subtitle,
          category: articles.category,
          categorySlug: articles.categorySlug,
          date: articles.date,
          imageType: articles.imageType,
          imageUrl: articles.imageUrl,
          caption: articles.caption,
          authorName: articles.authorName,
          authorRole: articles.authorRole,
          authorAvatar: articles.authorAvatar,
          editorId: articles.editorId,
          status: articles.status,
          isSpecial: articles.isSpecial,
          createdAt: articles.createdAt,
          updatedAt: articles.updatedAt,
        })
        .from(articles)
        .where(and(...conditions))
        .orderBy(desc(articles.createdAt))
        .limit(limit);

      return rows.map((r) => rowToArticle(r, false));
    } catch (err) {
      console.error('[getServerArticles] direct D1 error:', err);
    }
  }

  return newsService.getArticles(categorySlug, undefined, limit);
});

export interface PaginatedServerArticles {
  articles: ScopeArticle[];
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/** One page of published articles (optionally for one category) read straight from D1. */
export const getServerArticlesPaginated = cache(
  async (categorySlug: string | undefined, page: number, limit: number): Promise<PaginatedServerArticles> => {
    const env = getCloudflareEnv();
    if (env?.DB) {
      const db = getDb(env.DB);
      const conditions = [eq(articles.status, 'published')];
      if (categorySlug && categorySlug !== 'home' && categorySlug !== 'all') {
        conditions.push(eq(articles.categorySlug, categorySlug));
      }
      const where = and(...conditions);

      const [rows, totalRows] = await Promise.all([
        db
          .select({
            id: articles.id,
            title: articles.title,
            subtitle: articles.subtitle,
            category: articles.category,
            categorySlug: articles.categorySlug,
            date: articles.date,
            imageType: articles.imageType,
            imageUrl: articles.imageUrl,
            caption: articles.caption,
            authorName: articles.authorName,
            authorRole: articles.authorRole,
            authorAvatar: articles.authorAvatar,
            editorId: articles.editorId,
            status: articles.status,
            isSpecial: articles.isSpecial,
            createdAt: articles.createdAt,
          })
          .from(articles)
          .where(where)
          .orderBy(desc(articles.createdAt))
          .limit(limit)
          .offset((page - 1) * limit),
        db.select({ count: count() }).from(articles).where(where),
      ]);

      const total = totalRows[0]?.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      return {
        articles: rows.map((r) => rowToArticle(r, false)),
        total,
        totalPages,
        hasMore: page < totalPages,
      };
    }

    // No D1 binding (plain `next dev`): fall back to the HTTP API.
    const result = await newsService.getArticlesPaginated({ category: categorySlug, limit, page });
    return {
      articles: result.articles,
      total: result.total,
      totalPages: result.totalPages,
      hasMore: result.hasMore,
    };
  },
);

/** The newest published article flagged as special (shown in the home page's tall hero box), or null. */
export const getServerSpecialArticle = cache(async (): Promise<ScopeArticle | null> => {
  const env = getCloudflareEnv();
  if (!env?.DB) return null;
  try {
    const db = getDb(env.DB);
    const rows = await db
      .select({
        id: articles.id,
        title: articles.title,
        subtitle: articles.subtitle,
        category: articles.category,
        categorySlug: articles.categorySlug,
        date: articles.date,
        imageType: articles.imageType,
        imageUrl: articles.imageUrl,
        caption: articles.caption,
        authorName: articles.authorName,
        authorRole: articles.authorRole,
        authorAvatar: articles.authorAvatar,
        editorId: articles.editorId,
        status: articles.status,
        isSpecial: articles.isSpecial,
        createdAt: articles.createdAt,
      })
      .from(articles)
      .where(and(eq(articles.status, 'published'), eq(articles.isSpecial, true)))
      .orderBy(desc(articles.createdAt))
      .limit(1);
    return rows[0] ? rowToArticle(rows[0], false) : null;
  } catch (err) {
    console.error('[getServerSpecialArticle] direct D1 error:', err);
    return null;
  }
});
