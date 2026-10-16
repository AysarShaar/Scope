import { CloudflareEnv } from './cloudflare';

export interface SemanticIdOptions {
  text: string;
  prefix?: string;
  env?: CloudflareEnv | null;
  maxLength?: number;
}

const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'إلى', 'على', 'عن', 'مع', 'هذا', 'هذه', 'تم', 'بعد', 'قبل',
  'أن', 'إن', 'لا', 'ما', 'قد', 'بين', 'حول', 'خلال', 'ضد', 'نحو', 'لدى',
  'أو', 'ثم', 'حيث', 'كل', 'ذلك', 'تلك', 'التي', 'الذي', 'الذين', 'اللواتي',
]);

const ARABIC_CHAR_MAP: Record<string, string> = {
  'ا': 'a', 'أ': 'a', 'إ': 'a', 'آ': 'a', 'ٱ': 'a',
  'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h', 'خ': 'kh',
  'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
  'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y', 'ى': 'y', 'ئ': 'y', 'ؤ': 'w', 'ء': '',
};

function randomSuffix(length = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function transliterateArabicToSlug(text: string, maxWords = 5): string {
  // Strip tashkeel and tatweel
  const clean = text
    .replace(/[\u064B-\u0655\u0670\u0640]/g, '')
    .trim();

  // If text already has substantial Latin characters, use them
  const latinWords = (clean.match(/[a-zA-Z0-9]+/g) || []).filter((w) => w.length >= 2);
  if (latinWords.length >= 2) {
    return latinWords.slice(0, maxWords).join('-').toLowerCase();
  }

  // Split Arabic words, filter stop words
  const words = (clean.match(/[\u0621-\u064A]+/g) || [])
    .filter((w) => !ARABIC_STOP_WORDS.has(w) && w.length >= 2);

  if (words.length === 0) {
    return '';
  }

  const slugWords = words.slice(0, maxWords).map((word) => {
    // Strip common leading article 'ال' if word is long enough
    let core = word;
    if (core.startsWith('ال') && core.length >= 4) {
      core = core.slice(2);
    }
    let transliterated = '';
    for (const char of core) {
      transliterated += ARABIC_CHAR_MAP[char] ?? '';
    }
    return transliterated;
  }).filter((w) => w.length > 0);

  return slugWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Generates a semantic, content-linked ID / slug.
 * Uses Cloudflare Workers AI (`env.AI`) when available to translate and summarize into
 * clean English URL slugs. Gracefully falls back to a deterministic transliteration
 * if AI is unavailable, rate-limited, or times out.
 */
export async function generateSemanticId({
  text,
  prefix,
  env,
  maxLength = 80,
}: SemanticIdOptions): Promise<string> {
  const cleanText = (text || '').trim();
  const suffix = randomSuffix(4);

  if (!cleanText) {
    const base = prefix ? `${prefix}_${Date.now()}` : `item_${Date.now()}`;
    return `${base}_${suffix}`;
  }

  // 1. Try Cloudflare Workers AI if available
  if (env?.AI && typeof env.AI.run === 'function') {
    try {
      // 3.5s timeout prevents blocking article creation if AI is slow
      // Use Llama 3.3 70B (FP8 Fast) for state-of-the-art Arabic translation and slug generation
      const aiPromise = env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          {
            role: 'system',
            content:
              'You are a translator that translates Arabic news headlines into a concise English URL slug of 3 to 7 words separated by hyphens. Output ONLY the lowercase translated words separated by hyphens. Never output explanations, quotes, punctuation, or markdown.',
          },
          {
            role: 'user',
            content: `Headline: ${cleanText.slice(0, 200)}`,
          },
        ],
        max_tokens: 60,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('AI inference timeout')), 3500)
      );

      const res = (await Promise.race([aiPromise, timeoutPromise])) as { response?: string };
      const rawSlug = (res?.response || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      if (rawSlug && rawSlug.length >= 3) {
        const trimmed = rawSlug.slice(0, maxLength).replace(/-$/, '');
        return `${trimmed}-${suffix}`;
      }
    } catch (err) {
      // Log and fall through to transliteration fallback
      console.warn('[semanticId] Workers AI unavailable, using fallback:', err);
    }
  }

  // 2. Fallback: phonetic transliteration / slugify
  const fallbackSlug = transliterateArabicToSlug(cleanText, 4);
  if (fallbackSlug && fallbackSlug.length >= 2) {
    const trimmed = fallbackSlug.slice(0, maxLength).replace(/-$/, '');
    return `${trimmed}-${suffix}`;
  }

  // 3. Absolute fallback
  const base = prefix ? `${prefix}` : 'item';
  return `${base}-${Date.now().toString(36)}-${suffix}`;
}
