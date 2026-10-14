/**
 * Public base URL of the site (no trailing slash), used for canonical links, sitemap,
 * robots.txt and Open Graph tags. Set `APP_URL` in wrangler.jsonc `vars` (or .env.local locally).
 */
export function getSiteUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
}
