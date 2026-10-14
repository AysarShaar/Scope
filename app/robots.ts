import { MetadataRoute } from 'next';
import { getSiteUrl } from '../lib/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api', '/api/*', '/search'],
      },
      {
        userAgent: 'Googlebot-News',
        allow: '/',
        disallow: ['/admin', '/api', '/search'],
      },
    ],
    sitemap: [`${siteUrl}/sitemap.xml`, `${siteUrl}/news-sitemap.xml`],
  };
}
