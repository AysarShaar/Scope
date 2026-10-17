import { getServerArticles } from '../../lib/server/articles';
import { getSiteUrl } from '../../lib/site';
import { buildNewsSitemapXml } from '../../lib/newsSitemap';

// Google News sitemap: only articles published in the last 48 hours, as the format requires.
// Rendered per request (D1 is not available at build time); worker.ts caches it for a few minutes.
export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const articles = await getServerArticles(undefined, 100).catch(() => []);
  const xml = buildNewsSitemapXml(siteUrl, articles);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
