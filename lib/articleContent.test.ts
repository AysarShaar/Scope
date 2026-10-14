import { describe, it, expect } from 'vitest';
import {
  sanitizeArticleHtml,
  validateArticleContent,
  isHtmlBlock,
  MAX_CONTENT_BLOCKS,
} from './articleContent';

describe('sanitizeArticleHtml', () => {
  it('strips script tags and inline event handlers', () => {
    const out = sanitizeArticleHtml('<p onclick="x()">hi</p><script>alert(1)</script>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('onclick');
    expect(out).toContain('<p>hi</p>');
  });

  it('blocks javascript: links and forces safe rel/target on links', () => {
    expect(sanitizeArticleHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
    const out = sanitizeArticleHtml('<a href="https://example.com">x</a>');
    expect(out).toContain('rel="noopener noreferrer nofollow"');
    expect(out).toContain('target="_blank"');
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizeArticleHtml(undefined as unknown as string)).toBe('');
  });
});

describe('validateArticleContent', () => {
  it('treats null/undefined as "no content"', () => {
    expect(validateArticleContent(undefined)).toEqual({ ok: true, value: null });
    expect(validateArticleContent(null)).toEqual({ ok: true, value: null });
  });

  it('rejects non-arrays and non-string blocks', () => {
    expect(validateArticleContent('text').ok).toBe(false);
    expect(validateArticleContent([1, 2]).ok).toBe(false);
  });

  it('rejects too many blocks', () => {
    const tooMany = Array.from({ length: MAX_CONTENT_BLOCKS + 1 }, () => 'a');
    expect(validateArticleContent(tooMany).ok).toBe(false);
  });

  it('sanitizes each block it accepts', () => {
    const res = validateArticleContent(['<p>ok</p>', '<img src=x onerror=alert(1)>']);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value!.join('')).not.toContain('onerror');
  });
});

describe('isHtmlBlock', () => {
  it('detects html vs markdown-ish plain blocks', () => {
    expect(isHtmlBlock('  <p>x</p>')).toBe(true);
    expect(isHtmlBlock('# title')).toBe(false);
  });
});
