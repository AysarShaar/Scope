import { describe, it, expect } from 'vitest';
import { buildNewsSitemapXml, escapeXml, NEWS_PUBLICATION_NAME } from './newsSitemap';
import { ScopeArticle } from '../data/scopeData';

describe('escapeXml', () => {
  it('escapes &, <, >, ", and \'', () => {
    expect(escapeXml('A & B < C > D "E" \'F\'')).toBe('A &amp; B &lt; C &gt; D &quot;E&quot; &apos;F&apos;');
  });
});

describe('buildNewsSitemapXml', () => {
  const SITE_URL = 'https://scopemedia.org';
  const NOW = Date.parse('2026-10-17T12:00:00Z');

  it('includes articles published within the last 48 hours', () => {
    const recentArticle: ScopeArticle = {
      id: 'art-recent',
      title: 'تقرير عاجل & تغطية حصرية',
      category: 'أخبار',
      categorySlug: 'news',
      date: '17 أكتوبر 2026',
      createdAt: '2026-10-17 10:00:00',
    };

    const xml = buildNewsSitemapXml(SITE_URL, [recentArticle], NOW);

    expect(xml).toContain('<urlset');
    expect(xml).toContain('xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"');
    expect(xml).toContain(`<loc>${SITE_URL}/news/art-recent</loc>`);
    expect(xml).toContain(`<news:name>${NEWS_PUBLICATION_NAME}</news:name>`);
    expect(xml).toContain('<news:language>ar</news:language>');
    expect(xml).toContain('<news:title>تقرير عاجل &amp; تغطية حصرية</news:title>');
    expect(xml).toContain('</urlset>');
  });

  it('falls back to latest published articles when no articles are in the 48-hour window', () => {
    const oldArticle: ScopeArticle = {
      id: 'art-old',
      title: 'تحقيق استقصائي سابق',
      category: 'تحقيقات',
      categorySlug: 'investigations',
      date: '1 أكتوبر 2026',
      createdAt: '2026-10-01 08:00:00',
    };

    const xml = buildNewsSitemapXml(SITE_URL, [oldArticle], NOW);

    // Must not be empty, must contain the fallback old article
    expect(xml).toContain(`<loc>${SITE_URL}/news/art-old</loc>`);
    expect(xml).toContain('<news:title>تحقيق استقصائي سابق</news:title>');
    expect(xml).toContain('<url>');
  });

  it('provides fallback site URL when articles array is completely empty to prevent empty urlset', () => {
    const xml = buildNewsSitemapXml(SITE_URL, [], NOW);

    // Line 4 must NOT be </urlset> - there must be at least one <url>
    expect(xml).toContain('<url>');
    expect(xml).toContain(`<loc>${SITE_URL}</loc>`);
    expect(xml).toContain(`<news:name>${NEWS_PUBLICATION_NAME}</news:name>`);
    expect(xml).toContain('</urlset>');

    const lines = xml.trim().split('\n');
    expect(lines[0]).toBe('<?xml version="1.0" encoding="UTF-8"?>');
    expect(lines[1]).toContain('<urlset');
    expect(lines[2]).toContain('<url>'); // Line 3 or 4 is inside <url>, NOT </urlset>
  });

  it('handles Arabic dates with Eastern Arabic numerals', () => {
    const easternArticle: ScopeArticle = {
      id: 'art-eastern',
      title: 'خبر بالأرقام المشرقية',
      category: 'أخبار',
      categorySlug: 'news',
      date: '١٧ أكتوبر ٢٠٢٦',
    };

    const xml = buildNewsSitemapXml(SITE_URL, [easternArticle], NOW);
    expect(xml).toContain(`<loc>${SITE_URL}/news/art-eastern</loc>`);
  });
});
