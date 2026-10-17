import { ScopeArticle } from '../data/scopeData';
import { articleIsoDates, absoluteImageUrl } from './seo';
import { escapeXml } from './newsSitemap';

export const RSS_CHANNEL_TITLE = 'سكوب ميديا | SCOPE MEDIA';
export const RSS_CHANNEL_DESCRIPTION = 'منصة إعلامية مرئية تنطلق من السويداء، تعنى بشؤون الشرق الاوسط والعالم';

function toRfc822Date(dateInput?: string | number | Date): string {
  if (!dateInput) return new Date().toUTCString();
  const d = new Date(dateInput);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

export function buildRssFeedXml(
  siteUrl: string,
  articles: ScopeArticle[],
  now = Date.now(),
): string {
  const lastBuildDate = toRfc822Date(now);

  const items = (articles || [])
    .filter((art) => Boolean(art?.id && art?.title))
    .slice(0, 50)
    .map((art) => {
      const { published } = articleIsoDates(art);
      const pubDate = toRfc822Date(published || art.createdAt || now);
      const articleUrl = `${siteUrl}/news/${art.id}`;
      const description = art.subtitle || art.caption || art.title;
      const author = art.author?.name || 'فريق تحرير سكوب ميديا';
      const category = art.category || 'أخبار';
      const imageUrl = art.imageUrl ? absoluteImageUrl(siteUrl, art.imageUrl) : undefined;

      const enclosureTag = imageUrl
        ? `\n      <enclosure url="${escapeXml(imageUrl)}" type="image/jpeg" length="0" />`
        : '';

      return `    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${escapeXml(articleUrl)}</link>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <dc:creator><![CDATA[${author}]]></dc:creator>
      <category><![CDATA[${category}]]></category>${enclosureTag}
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(RSS_CHANNEL_TITLE)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(RSS_CHANNEL_DESCRIPTION)}</description>
    <language>ar</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(`${siteUrl}/rss.xml`)}" rel="self" type="application/rss+xml" />
    <image>
      <url>${escapeXml(`${siteUrl}/og-default.png`)}</url>
      <title>${escapeXml(RSS_CHANNEL_TITLE)}</title>
      <link>${escapeXml(siteUrl)}</link>
    </image>
${items}
  </channel>
</rss>
`;
}
