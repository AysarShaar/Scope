// Arabic-aware search helpers. The normalisation below MUST stay identical to the one applied in
// db/migrations/0012_articles_fts.sql (the index is built with it), otherwise queries stop matching.

// Tashkeel (U+064B-0655), superscript alef (U+0670) and tatweel (U+0640) are dropped.
const STRIP = /[\u064B-\u0655\u0670\u0640]/g;

const LETTER_MAP: Record<string, string> = {
  '\u0623': '\u0627', // أ -> ا
  '\u0625': '\u0627', // إ -> ا
  '\u0622': '\u0627', // آ -> ا
  '\u0671': '\u0627', // ٱ -> ا
  '\u0649': '\u064A', // ى -> ي
  '\u0629': '\u0647', // ة -> ه
  '\u0624': '\u0648', // ؤ -> و
  '\u0626': '\u064A', // ئ -> ي
};

export const MAX_QUERY_LENGTH = 100;
const MAX_TERMS = 5;
const MIN_TERM_LENGTH = 2;
const MAX_TERM_LENGTH = 30;

// Prefixes Arabic attaches to a word: the article ال plus common one-letter conjunctions/prepositions.
const ARABIC_PREFIXES = ['ال', 'وال', 'بال', 'لل', 'فال', 'كال'];

export function normalizeSearchText(input: string): string {
  return input
    .toLowerCase()
    .replace(STRIP, '')
    .replace(/[\u0623\u0625\u0622\u0671\u0649\u0629\u0624\u0626]/g, (c) => LETTER_MAP[c])
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function termVariants(term: string): string[] {
  if (!/[\u0600-\u06FF]/.test(term)) return [term];

  // "الاقتصاد" and "اقتصاد" must find each other, as must "للاقتصاد", "بالاقتصاد", ...
  const base = term.startsWith('ال') && [...term].length >= 5 ? term.slice(2) : term;
  const variants = new Set<string>([term, base]);
  for (const prefix of ARABIC_PREFIXES) variants.add(prefix + base);
  return [...variants];
}

/**
 * Turns what the visitor typed into an FTS5 MATCH expression:
 * every word must appear (AND), each word is matched as a prefix, and Arabic words also match
 * with/without the definite article. Returns null when there is nothing searchable (e.g. one letter).
 * Words are reduced to letters/digits and always quoted, so user input can never inject FTS syntax.
 */
export function buildMatchQuery(raw: string): string | null {
  const cleaned = normalizeSearchText(raw.slice(0, MAX_QUERY_LENGTH));
  const words = (cleaned.match(/[\p{L}\p{N}]+/gu) ?? [])
    .map((w) => [...w].slice(0, MAX_TERM_LENGTH).join(''))
    .filter((w) => [...w].length >= MIN_TERM_LENGTH);

  const unique = [...new Set(words)].slice(0, MAX_TERMS);
  if (unique.length === 0) return null;

  return unique
    .map((word) => `(${termVariants(word).map((v) => `"${v}"*`).join(' OR ')})`)
    .join(' AND ');
}
