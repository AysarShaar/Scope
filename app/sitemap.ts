import { MetadataRoute } from 'next';
import { getServerArticles } from '../lib/server/articles';
import { getServerPrograms } from '../lib/server/programs';
import { getSiteUrl } from '../lib/site';
import { categoryTranslations } from '../lib/translations';
import { articleIsoDates } from '../lib/seo';

// Must be rendered per request: at build time there is no D1, so a prerendered sitemap would list
// no articles or programs. The Worker page cache (worker.ts) keeps repeated hits cheap.
export const dynamic = 'force-dynamic';

const SITEMAP_ARTICLE_LIMIT = 1000;

// Google ignores <priority> and <changefreq>, so only <loc> and an honest <lastmod> are emitted.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [articles, programsList] = await Promise.all([
    getServerArticles(undefined, SITEMAP_ARTICLE_LIMIT).catch(() => []),
    getServerPrograms().catch(() => []),
  ]);

  const articleEntries: MetadataRoute.Sitemap = (articles || []).map((art) => {
    const { modified } = articleIsoDates(art);
    return { url: `${siteUrl}/news/${art.id}`, ...(modified ? { lastModified: modified } : {}) };
  });

  // The home page and the sections change whenever the newest article does.
  const newest = articleEntries.find((e) => e.lastModified)?.lastModified;
  const withNewest = newest ? { lastModified: newest } : {};

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, ...withNewest },
    ...Object.keys(categoryTranslations)
      .filter((slug) => slug !== 'programs' && slug !== 'videos')
      .map((slug) => ({ url: `${siteUrl}/category/${slug}`, ...withNewest })),
    { url: `${siteUrl}/programs` },
    { url: `${siteUrl}/videos` },
    { url: `${siteUrl}/privacy` },
    { url: `${siteUrl}/terms` },
  ];

  const programRoutes: MetadataRoute.Sitemap = (programsList || []).map((prog: { id: string }) => ({
    url: `${siteUrl}/programs/${prog.id}`,
  }));

  return [...staticRoutes, ...programRoutes, ...articleEntries];
}
