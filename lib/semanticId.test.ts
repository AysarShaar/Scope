import { describe, it, expect, vi } from 'vitest';
import { generateSemanticId, transliterateArabicToSlug } from './semanticId';

describe('transliterateArabicToSlug', () => {
  it('converts Arabic text to readable Latin slug words', () => {
    const slug = transliterateArabicToSlug('ارتفاع قياسي في أسعار الذهب');
    expect(slug).toContain('artfaa');
    expect(slug).toContain('qyasy');
    expect(slug).toContain('asaar');
    expect(slug).toContain('dhhb');
    // Stop word 'في' should be omitted
    expect(slug).not.toContain('fy');
  });

  it('preserves Latin words when provided', () => {
    const slug = transliterateArabicToSlug('Scope Media Breaking News');
    expect(slug).toBe('scope-media-breaking-news');
  });

  it('handles empty or symbols gracefully', () => {
    expect(transliterateArabicToSlug('--- !!! ???')).toBe('');
  });
});

describe('generateSemanticId', () => {
  it('uses Workers AI when available', async () => {
    const mockAi = {
      run: vi.fn().mockResolvedValue({
        response: 'gold-prices-record-high\n',
      }),
    };

    const id = await generateSemanticId({
      text: 'ارتفاع قياسي في أسعار الذهب',
      env: { AI: mockAi } as any,
    });

    expect(mockAi.run).toHaveBeenCalledOnce();
    expect(id).toMatch(/^gold-prices-record-high-[a-z0-9]{4}$/);
  });

  it('falls back gracefully when AI fails or throws', async () => {
    const mockAi = {
      run: vi.fn().mockRejectedValue(new Error('AI Service Unavailable')),
    };

    const id = await generateSemanticId({
      text: 'أسعار الذهب تسجل قفزة تاريخية',
      env: { AI: mockAi } as any,
    });

    // Should return a valid transliterated slug without throwing
    expect(id).toMatch(/^[a-z0-9-]+$/);
    expect(id).toContain('dhhb');
  });

  it('falls back to transliteration when no AI binding exists', async () => {
    const id = await generateSemanticId({
      text: 'تقرير اقتصادي خاص',
      env: null,
    });

    expect(id).toMatch(/^[a-z0-9-]+$/);
    expect(id).toContain('tqryr');
  });

  it('handles empty text with safe fallback', async () => {
    const id = await generateSemanticId({
      text: '',
      prefix: 'img',
      env: null,
    });

    expect(id).toMatch(/^img_\d+_[a-z0-9]{4}$/);
  });
});
