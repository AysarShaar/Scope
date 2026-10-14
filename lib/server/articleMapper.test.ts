import { describe, it, expect } from 'vitest';
import { parseStoredContent, rowToArticle, type PartialArticleRow } from './articleMapper';

const row = (extra: Record<string, unknown> = {}) =>
  ({
    id: 'a1',
    title: 'عنوان',
    category: 'سياسة',
    categorySlug: 'politics',
    date: '5 مارس 2026',
    ...extra,
  }) as unknown as PartialArticleRow;

describe('parseStoredContent', () => {
  it('returns undefined for empty values', () => {
    expect(parseStoredContent(null)).toBeUndefined();
    expect(parseStoredContent('')).toBeUndefined();
  });

  it('parses a JSON array of blocks', () => {
    expect(parseStoredContent('["<p>a</p>","<p>b</p>"]')).toEqual(['<p>a</p>', '<p>b</p>']);
  });

  it('wraps legacy plain text instead of throwing', () => {
    expect(parseStoredContent('نص قديم غير JSON')).toEqual(['نص قديم غير JSON']);
  });
});

describe('rowToArticle', () => {
  it('maps the required fields and leaves missing optionals undefined', () => {
    const a = rowToArticle(row());
    expect(a).toMatchObject({ id: 'a1', title: 'عنوان', categorySlug: 'politics', date: '5 مارس 2026' });
    expect(a.author).toBeUndefined();
    expect(a.imageUrl).toBeUndefined();
    expect(a.content).toBeUndefined();
  });

  it('builds the author only when a name exists', () => {
    expect(rowToArticle(row({ authorName: 'سارة', authorRole: 'محررة' })).author).toEqual({
      name: 'سارة',
      role: 'محررة',
    });
    expect(rowToArticle(row({ authorName: 'سارة' })).author).toEqual({ name: 'سارة', role: '' });
    expect(rowToArticle(row({ authorRole: 'محررة' })).author).toBeUndefined();
  });

  it('preserves image urls directly', () => {
    const a = rowToArticle(row({ imageUrl: 'https://example.com/images/a.jpg' }));
    expect(a.imageUrl).toBe('https://example.com/images/a.jpg');
  });

  it('skips the body when includeContent is false', () => {
    const r = row({ content: '["<p>x</p>"]' });
    expect(rowToArticle(r, true).content).toEqual(['<p>x</p>']);
    expect(rowToArticle(r, false).content).toBeUndefined();
  });
});
