import { ScopeArticle } from '../data/scopeData';
import { articleIsoDates } from './seo';

export const NEWS_PUBLICATION_NAME = 'SCOPE MEDIA';
export const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildNewsSitemapXml(
  siteUrl: string,
  articles: ScopeArticle[],
  now = Date.now(),
): string {
  const cutoff = now - NEWS_WINDOW_MS;

  const candidateArticles = (articles || [])
    .map((art) => ({
      art,
      published: articleIsoDates(art).published || (art.createdAt ? new Date(art.createdAt).toISOString() : undefined),
    }))
    .filter((entry): entry is { art: ScopeArticle; published: string } =>
      Boolean(entry.art?.id && entry.art?.title && entry.published),
    );

  // Google News guidelines suggest articles from the last 48 hours.
  let selected = candidateArticles.filter(({ published }) => {
    const time = Date.parse(published);
    return !Number.isNaN(time) && time >= cutoff;
  });

  // If no articles exist in the 48-hour window, fall back to the most recent published articles (up to 20).
  // Google Search Console rejects an empty <urlset> with "Missing XML tag: url" on line 4
  // because the sitemaps schema enforces minOccurs="1" for <url>.
  if (selected.length === 0 && candidateArticles.length > 0) {
    selected = candidateArticles.slice(0, 20);
  }

  let itemsXml = selected
    .slice(0, 1000)
    .map(
      ({ art, published }) => `  <url>
    <loc>${escapeXml(`${siteUrl}/news/${art.id}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${NEWS_PUBLICATION_NAME}</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${published}</news:publication_date>
      <news:title>${escapeXml(art.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');

  // Extreme fallback if candidateArticles is also empty: never emit an empty <urlset>.
  if (!itemsXml) {
    const nowIso = new Date(now).toISOString();
    itemsXml = `  <url>
    <loc>${escapeXml(siteUrl)}</loc>
    <news:news>
      <news:publication>
        <news:name>${NEWS_PUBLICATION_NAME}</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${nowIso}</news:publication_date>
      <news:title>${escapeXml(NEWS_PUBLICATION_NAME)}</news:title>
    </news:news>
  </url>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${itemsXml}
</urlset>
`;
}
