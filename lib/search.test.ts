import { describe, it, expect } from 'vitest';
import { normalizeSearchText, buildMatchQuery } from './search';

describe('normalizeSearchText', () => {
  it('unifies alef, ya, ta-marbuta and removes tashkeel/tatweel', () => {
    expect(normalizeSearchText('أخبارٌ')).toBe('اخبار');
    expect(normalizeSearchText('إدارة')).toBe('اداره');
    expect(normalizeSearchText('مَدرسـة')).toBe('مدرسه');
    expect(normalizeSearchText('على')).toBe('علي');
  });

  it('converts Arabic-Indic digits and lower-cases Latin', () => {
    expect(normalizeSearchText('٢٠٢٦ AI')).toBe('2026 ai');
  });
});

describe('buildMatchQuery', () => {
  it('returns null when nothing is searchable', () => {
    expect(buildMatchQuery('')).toBeNull();
    expect(buildMatchQuery('  ')).toBeNull();
    expect(buildMatchQuery('ا')).toBeNull();
    expect(buildMatchQuery('"" * ()')).toBeNull();
  });

  it('matches with and without the definite article', () => {
    const q = buildMatchQuery('اقتصاد')!;
    expect(q).toContain('"اقتصاد"*');
    expect(q).toContain('"الاقتصاد"*');
    expect(q).toContain('"للاقتصاد"*');

    const q2 = buildMatchQuery('الاقتصاد')!;
    expect(q2).toContain('"اقتصاد"*');
  });

  it('requires every word', () => {
    const q = buildMatchQuery('سوريا اقتصاد')!;
    expect(q.split(' AND ')).toHaveLength(2);
  });

  it('cannot inject FTS syntax', () => {
    const q = buildMatchQuery('abc" OR title:secret NEAR(x) *')!;
    expect(q).not.toMatch(/title:/);
    // only quoted terms, OR between variants and AND between words
    expect(q.replace(/"[\p{L}\p{N}]+"\*/gu, '').replace(/[()]|\sOR\s|\sAND\s/g, '').trim()).toBe('');
  });

  it('caps the number of words', () => {
    const q = buildMatchQuery('aa bb cc dd ee ff gg hh')!;
    expect(q.split(' AND ')).toHaveLength(5);
  });
});
