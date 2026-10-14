import { describe, it, expect } from 'vitest';
import { parseArticleDateToTime, sanitizeArticleDate, formatArabicDate, parseDateParts, isFutureDate } from './dates';

const NOW = new Date(2026, 9, 10, 12, 0, 0); // 10 Oct 2026

describe('parseArticleDateToTime', () => {
  it('parses Arabic display dates to end of that day', () => {
    const t = parseArticleDateToTime('5 مارس 2026');
    expect(new Date(t!).getMonth()).toBe(2);
    expect(new Date(t!).getDate()).toBe(5);
  });

  it('parses ISO dates with - or /', () => {
    expect(parseArticleDateToTime('2026-03-05')).toBe(parseArticleDateToTime('2026/03/05'));
  });

  it('returns null for garbage and empty input', () => {
    expect(parseArticleDateToTime('not a date')).toBeNull();
    expect(parseArticleDateToTime('')).toBeNull();
    expect(parseArticleDateToTime(undefined)).toBeNull();
  });
});

describe('sanitizeArticleDate', () => {
  it('defaults empty input to today', () => {
    expect(sanitizeArticleDate('', NOW)).toBe(formatArabicDate(NOW));
    expect(sanitizeArticleDate(null, NOW)).toBe('10 أكتوبر 2026');
  });

  it('clamps future dates to today', () => {
    expect(sanitizeArticleDate('1 يناير 2030', NOW)).toBe('10 أكتوبر 2026');
  });

  it('keeps today and past dates as typed (trimmed)', () => {
    expect(sanitizeArticleDate('  10 أكتوبر 2026 ', NOW)).toBe('10 أكتوبر 2026');
    expect(sanitizeArticleDate('1 يناير 2020', NOW)).toBe('1 يناير 2020');
  });

  it('keeps unparsable text rather than silently replacing it', () => {
    expect(sanitizeArticleDate('الأسبوع الماضي', NOW)).toBe('الأسبوع الماضي');
  });
});

describe('parseDateParts / isFutureDate', () => {
  it('reads Arabic and ISO dates into calendar parts', () => {
    expect(parseDateParts('5 مارس 2026', NOW)).toEqual({ year: 2026, month: 2, day: 5 });
    expect(parseDateParts('2026-03-05', NOW)).toEqual({ year: 2026, month: 2, day: 5 });
  });

  it('falls back to today for empty or unreadable input', () => {
    expect(parseDateParts('', NOW)).toEqual({ year: 2026, month: 9, day: 10 });
    expect(parseDateParts('???', NOW)).toEqual({ year: 2026, month: 9, day: 10 });
  });

  it('treats today as not in the future, tomorrow as future', () => {
    expect(isFutureDate('10 أكتوبر 2026', NOW)).toBe(false);
    expect(isFutureDate('11 أكتوبر 2026', NOW)).toBe(true);
  });
});
