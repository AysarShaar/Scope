import { getServerArticles } from '../../lib/server/articles';
import { getSiteUrl } from '../../lib/site';
import { articleIsoDates } from '../../lib/seo';

// Google News sitemap: only articles published in the last 48 hours, as the format requires.
// Rendered per request (D1 is not available at build time); worker.ts caches it for a few minutes.
export const dynamic = 'force-dynamic';

const PUBLICATION_NAME = 'SCOPE MEDIA';
const WINDOW_MS = 48 * 60 * 60 * 1000;

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const siteUrl = getSiteUrl();
  const articles = await getServerArticles(undefined, 100).catch(() => []);
  const cutoff = Date.now() - WINDOW_MS;

  const items = articles
    .map((art) => ({ art, published: articleIsoDates(art).published }))
    .filter(({ published }) => published && Date.parse(published) >= cutoff)
    .slice(0, 1000)
    .map(
      ({ art, published }) => `  <url>
    <loc>${esc(`${siteUrl}/news/${art.id}`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${PUBLICATION_NAME}</news:name>
        <news:language>ar</news:language>
      </news:publication>
      <news:publication_date>${published}</news:publication_date>
      <news:title>${esc(art.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${items}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
