import { getServerArticles } from '../../lib/server/articles';
import { getSiteUrl } from '../../lib/site';
import { buildRssFeedXml } from '../../lib/rssFeed';

export const dynamic = 'force-dynamic';

export async function GET() {
  const siteUrl = getSiteUrl();
  const articles = await getServerArticles(undefined, 50).catch(() => []);
  const xml = buildRssFeedXml(siteUrl, articles);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
