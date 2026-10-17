import { CloudflareEnv } from './cloudflare';

export interface SemanticIdOptions {
  text: string;
  prefix?: string;
  env?: CloudflareEnv | null;
  maxLength?: number;
}

const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const AI_TIMEOUT_MS = 3500;
const SUFFIX_LENGTH = 4;

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

export async function generateSemanticId({
  text,
  prefix,
  env,
  maxLength = 80,
}: SemanticIdOptions): Promise<string> {
  const cleanText = (text || '').trim();
  const suffix = generateRandomSuffix(SUFFIX_LENGTH);

  if (!cleanText) {
    return generateEmptyFallbackId(prefix, suffix);
  }

  const aiSlug = await tryGenerateAiSlug(cleanText, env, maxLength);
  if (aiSlug) {
    return `${aiSlug}-${suffix}`;
  }

  const transliteratedSlug = transliterateArabicToSlug(cleanText, 4);
  if (transliteratedSlug && transliteratedSlug.length >= 2) {
    const trimmed = transliteratedSlug.slice(0, maxLength).replace(/-$/, '');
    return `${trimmed}-${suffix}`;
  }

  const basePrefix = prefix || 'item';
  return `${basePrefix}-${Date.now().toString(36)}-${suffix}`;
}

export function transliterateArabicToSlug(text: string, maxWords = 5): string {
  const clean = text.replace(/[\u064B-\u0655\u0670\u0640]/g, '').trim();

  const latinWords = (clean.match(/[a-zA-Z0-9]+/g) || []).filter((w) => w.length >= 2);
  if (latinWords.length >= 2) {
    return latinWords.slice(0, maxWords).join('-').toLowerCase();
  }

  const words = (clean.match(/[\u0621-\u064A]+/g) || [])
    .filter((w) => !ARABIC_STOP_WORDS.has(w) && w.length >= 2);

  if (words.length === 0) return '';

  const slugWords = words.slice(0, maxWords).map(transliterateWord).filter((w) => w.length > 0);
  return slugWords.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function transliterateWord(word: string): string {
  let core = word;
  if (core.startsWith('ال') && core.length >= 4) {
    core = core.slice(2);
  }
  let transliterated = '';
  for (const char of core) {
    transliterated += ARABIC_CHAR_MAP[char] ?? '';
  }
  return transliterated;
}

function generateRandomSuffix(length = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function generateEmptyFallbackId(prefix: string | undefined, suffix: string): string {
  const base = prefix ? `${prefix}_${Date.now()}` : `item_${Date.now()}`;
  return `${base}_${suffix}`;
}

async function tryGenerateAiSlug(
  text: string,
  env: CloudflareEnv | null | undefined,
  maxLength: number
): Promise<string | null> {
  if (!env?.AI || typeof env.AI.run !== 'function') return null;

  try {
    const aiPromise = env.AI.run(AI_MODEL, {
      messages: [
        {
          role: 'system',
          content:
            'You are a translator that translates Arabic news headlines into a concise English URL slug of 3 to 7 words separated by hyphens. Output ONLY the lowercase translated words separated by hyphens. Never output explanations, quotes, punctuation, or markdown.',
        },
        {
          role: 'user',
          content: `Headline: ${text.slice(0, 200)}`,
        },
      ],
      max_tokens: 60,
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI inference timeout')), AI_TIMEOUT_MS)
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
      return rawSlug.slice(0, maxLength).replace(/-$/, '');
    }
  } catch (err) {
    console.warn('[semanticId] Workers AI unavailable, using fallback:', err);
  }

  return null;
}
