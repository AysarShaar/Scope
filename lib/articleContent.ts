import sanitizeHtml from 'sanitize-html';

// Re-exported so existing imports (and tests) keep working. Public pages should import from './articleText'.
export { isHtmlBlock, blockToText, contentToText } from './articleText';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'strong', 'b', 'em', 'i', 'u', 's',
    'mark', 'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'a', 'img', 'span',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'loading', 'width', 'height'],
    '*': ['style', 'class', 'dir'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  transformTags: {
    a: sanitizeHtml.simpleTransform(
      'a',
      { rel: 'noopener noreferrer nofollow', target: '_blank' },
      true,
    ),
    img: (tagName, attribs) => ({
      tagName: 'img',
      attribs: {
        ...attribs,
        loading: 'lazy',
      },
    }),
  },
};

export function sanitizeArticleHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';
  try {
    return sanitizeHtml(html, SANITIZE_OPTIONS);
  } catch {
    return '';
  }
}

export const MAX_CONTENT_BLOCKS = 500;
export const MAX_CONTENT_TOTAL_CHARS = 500_000;

export type ContentValidation =
  | { ok: true; value: string[] | null }
  | { ok: false; error: string };

export function validateArticleContent(content: unknown): ContentValidation {
  if (content === undefined || content === null) return { ok: true, value: null };
  if (!Array.isArray(content)) {
    return { ok: false, error: 'محتوى المقال يجب أن يكون مصفوفة من النصوص' };
  }
  if (content.length > MAX_CONTENT_BLOCKS) {
    return { ok: false, error: 'عدد فقرات المقال يتجاوز الحد المسموح' };
  }
  let total = 0;
  const out: string[] = [];
  for (const block of content) {
    if (typeof block !== 'string') {
      return { ok: false, error: 'كل فقرة في محتوى المقال يجب أن تكون نصاً' };
    }
    total += block.length;
    if (total > MAX_CONTENT_TOTAL_CHARS) {
      return { ok: false, error: 'حجم محتوى المقال يتجاوز الحد المسموح' };
    }
    out.push(sanitizeArticleHtml(block));
  }
  return { ok: true, value: out };
}
