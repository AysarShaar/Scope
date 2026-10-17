import { describe, it, expect } from 'vitest';
import { buildRssFeedXml, RSS_CHANNEL_TITLE, RSS_CHANNEL_DESCRIPTION } from './rssFeed';
import { ScopeArticle } from '../data/scopeData';

describe('buildRssFeedXml', () => {
  const SITE_URL = 'https://scope-media.net';
  const NOW = Date.parse('2026-10-17T12:00:00Z');

  it('generates a valid RSS 2.0 XML with channel metadata', () => {
    const xml = buildRssFeedXml(SITE_URL, [], NOW);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<rss version="2.0"');
    expect(xml).toContain('xmlns:content="http://purl.org/rss/1.0/modules/content/"');
    expect(xml).toContain('xmlns:dc="http://purl.org/dc/elements/1.1/"');
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"');
    expect(xml).toContain(`<title>${RSS_CHANNEL_TITLE}</title>`);
    expect(xml).toContain(`<link>${SITE_URL}</link>`);
    expect(xml).toContain(`<description>${RSS_CHANNEL_DESCRIPTION}</description>`);
    expect(xml).toContain('<language>ar</language>');
    expect(xml).toContain(`<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`);
    expect(xml).toContain('</rss>');
  });

  it('includes articles as RSS items with required tags and enclosure', () => {
    const article: ScopeArticle = {
      id: 'art-rss-1',
      title: 'خبر رئيسي عن التطورات الجيوسياسية',
      subtitle: 'تفاصيل التقرير والتحليلات الميدانية',
      category: 'سياسة',
      categorySlug: 'politics',
      date: '17 أكتوبر 2026',
      createdAt: '2026-10-17 10:00:00',
      imageUrl: '/images/test-thumb.jpg',
      author: { name: 'سامر الأحمد', role: 'محرر الشؤون السياسية' },
    };

    const xml = buildRssFeedXml(SITE_URL, [article], NOW);

    expect(xml).toContain('<item>');
    expect(xml).toContain('<title><![CDATA[خبر رئيسي عن التطورات الجيوسياسية]]></title>');
    expect(xml).toContain(`<link>${SITE_URL}/news/art-rss-1</link>`);
    expect(xml).toContain(`<guid isPermaLink="true">${SITE_URL}/news/art-rss-1</guid>`);
    expect(xml).toContain('<pubDate>');
    expect(xml).toContain('<description><![CDATA[تفاصيل التقرير والتحليلات الميدانية]]></description>');
    expect(xml).toContain('<dc:creator><![CDATA[سامر الأحمد]]></dc:creator>');
    expect(xml).toContain('<category><![CDATA[سياسة]]></category>');
    expect(xml).toContain(`<enclosure url="${SITE_URL}/images/test-thumb.jpg" type="image/jpeg" length="0" />`);
    expect(xml).toContain('</item>');
  });
});
