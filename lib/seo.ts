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
