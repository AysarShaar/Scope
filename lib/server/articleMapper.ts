import { articles } from '../../db/schema';
import { ScopeArticle } from '../../data/scopeData';
import { optimizeCloudinaryUrl } from '../cloudinary';

type ArticleRow = typeof articles.$inferSelect;

/**
 * List queries select only a subset of columns (no body, no counters),
 * so the mapper accepts a partial row as long as the identifying fields exist.
 */
export type PartialArticleRow = Pick<ArticleRow, 'id' | 'title' | 'category' | 'categorySlug' | 'date'> &
  Partial<ArticleRow>;

/** Article bodies are stored as a JSON array of blocks; very old rows hold a plain string. */
export function parseStoredContent(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (typeof value !== 'string') return value as string[];
  try {
    return JSON.parse(value);
  } catch {
    return [value];
  }
}

export function rowToArticle(row: PartialArticleRow, includeContent = true): ScopeArticle {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    category: row.category,
    categorySlug: row.categorySlug as ScopeArticle['categorySlug'],
    date: row.date,
    createdAt: row.createdAt ? String(row.createdAt) : undefined,
    updatedAt: row.updatedAt ? String(row.updatedAt) : undefined,
    imageType: (row.imageType as ScopeArticle['imageType']) ?? undefined,
    imageUrl: row.imageUrl ? optimizeCloudinaryUrl(row.imageUrl) : undefined,
    caption: row.caption ?? undefined,
    author: row.authorName ? { name: row.authorName, role: row.authorRole || '' } : undefined,
    authorAvatar: row.authorAvatar ? optimizeCloudinaryUrl(row.authorAvatar) : undefined,
    editorId: row.editorId ?? undefined,
    content: includeContent ? parseStoredContent(row.content) : undefined,
    status: row.status ?? undefined,
    isSpecial: row.isSpecial ? true : undefined,
  };
}
