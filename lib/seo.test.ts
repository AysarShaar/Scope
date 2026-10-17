import { describe, it, expect } from 'vitest';
import {
  sqliteToIso,
  articleIsoDates,
  absoluteImageUrl,
  trimDescription,
  CATEGORY_SEO_DATA,
  getCategorySeo,
  getNewsArticleImageUrls,
  SITE_NAME,
} from './seo';

describe('lib/seo', () => {
  describe('sqliteToIso', () => {
    it('converts SQLite datetime string to ISO 8601 UTC string', () => {
      expect(sqliteToIso('2026-10-14 12:30:00')).toBe('2026-10-14T12:30:00Z');
    });

    it('returns ISO string for standard date strings', () => {
      const iso = sqliteToIso('2026-10-14T05:00:00Z');
      expect(iso).toBe('2026-10-14T05:00:00.000Z');
    });

    it('returns undefined for invalid or empty inputs', () => {
      expect(sqliteToIso(null)).toBeUndefined();
      expect(sqliteToIso(undefined)).toBeUndefined();
      expect(sqliteToIso('')).toBeUndefined();
      expect(sqliteToIso('not-a-valid-date')).toBeUndefined();
    });
  });

  describe('articleIsoDates', () => {
    it('uses createdAt and updatedAt if present', () => {
      const dates = articleIsoDates({
        createdAt: '2026-10-10 10:00:00',
        updatedAt: '2026-10-11 12:00:00',
      });
      expect(dates.published).toBe('2026-10-10T10:00:00Z');
      expect(dates.modified).toBe('2026-10-11T12:00:00Z');
    });

    it('falls back modified to published when updatedAt is absent', () => {
      const dates = articleIsoDates({
        createdAt: '2026-10-10 10:00:00',
      });
      expect(dates.published).toBe('2026-10-10T10:00:00Z');
      expect(dates.modified).toBe('2026-10-10T10:00:00Z');
    });
  });

  describe('absoluteImageUrl', () => {
    const siteUrl = 'https://scopemedia.org';

    it('returns fallback default image when url is empty or null', () => {
      expect(absoluteImageUrl(siteUrl, null)).toBe('https://scopemedia.org/og-default.png');
      expect(absoluteImageUrl(siteUrl, '')).toBe('https://scopemedia.org/og-default.png');
    });

    it('preserves absolute URLs', () => {
      expect(absoluteImageUrl(siteUrl, 'https://cdn.example.com/photo.jpg')).toBe(
        'https://cdn.example.com/photo.jpg',
      );
    });

    it('prepends siteUrl to relative paths', () => {
      expect(absoluteImageUrl(siteUrl, '/images/test.jpg')).toBe('https://scopemedia.org/images/test.jpg');
      expect(absoluteImageUrl(siteUrl, 'images/test.jpg')).toBe('https://scopemedia.org/images/test.jpg');
    });
  });

  describe('trimDescription', () => {
    it('leaves short descriptions untouched', () => {
      expect(trimDescription('مقال إخباري قصير')).toBe('مقال إخباري قصير');
    });

    it('collapses internal extra whitespaces', () => {
      expect(trimDescription('مقال   إخباري \n\n  قصير')).toBe('مقال إخباري قصير');
    });

    it('trims on word boundary when exceeding limit', () => {
      const longText = 'هذا النص هو تقرير إخباري طويل جداً يتحدث عن قضايا سياسية واقتصادية إقليمية ودولية متعددة مع تحليلات إضافية مكثفة من فريق العمل';
      const trimmed = trimDescription(longText, 50);
      expect(trimmed.length).toBeLessThanOrEqual(50);
      expect(trimmed.endsWith('…')).toBe(true);
    });
  });

  describe('CATEGORY_SEO_DATA', () => {
    const expectedCategories = [
      'news',
      'region',
      'world',
      'economy',
      'politics',
      'society',
      'culture',
      'science',
      'investigations',
      'programs',
      'videos',
      'history',
    ];

    it('covers all standard categories with concise descriptions (<= 150 chars)', () => {
      for (const cat of expectedCategories) {
        const item = CATEGORY_SEO_DATA[cat];
        expect(item, `Category ${cat} must exist in CATEGORY_SEO_DATA`).toBeDefined();
        expect(item.title.length).toBeGreaterThan(10);
        expect(item.description.length).toBeGreaterThan(20);
        expect(item.description.length).toBeLessThanOrEqual(150);
        expect(item.keywords.length).toBeGreaterThanOrEqual(3);
      }
    });

    it('handles pagination properly in getCategorySeo', () => {
      const p1 = getCategorySeo('economy', 1);
      expect(p1.canonicalSuffix).toBe('');
      expect(p1.title).toContain('اقتصاد');

      const p2 = getCategorySeo('economy', 2);
      expect(p2.canonicalSuffix).toBe('?page=2');
      expect(p2.title).toContain('صفحة 2');
      expect(p2.description).toContain('(صفحة 2)');
    });

    it('provides sensible fallback for unknown categories', () => {
      const fb = getCategorySeo('unknown-slug', 1, 'تصنيف مجهول');
      expect(fb.title).toContain('تصنيف مجهول');
      expect(fb.title).toContain('آخر الأخبار والتقارير');
    });
  });

  describe('getNewsArticleImageUrls', () => {
    const siteUrl = 'https://scopemedia.org';

    it('returns absolute image URL array for article structured data', () => {
      const localUrl = '/images/local-article.jpg';
      const images = getNewsArticleImageUrls(siteUrl, localUrl);
      expect(images).toEqual(['https://scopemedia.org/images/local-article.jpg']);
    });

    it('returns default fallback image array when imageUrl is empty', () => {
      const images = getNewsArticleImageUrls(siteUrl, null);
      expect(images).toEqual(['https://scopemedia.org/og-default.png']);
    });
  });
});
