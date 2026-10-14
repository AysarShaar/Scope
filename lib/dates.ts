// Article dates are stored as Arabic display strings ("10 أكتوبر 2026"),
// but older rows and API clients may send ISO dates. These helpers normalise both.

export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

const endOfDay = (year: number, month: number, day: number) =>
  new Date(year, month, day, 23, 59, 59, 999).getTime();

/** Returns a timestamp for an Arabic ("10 أكتوبر 2026"), ISO, or any Date-parsable string; null if unparsable. */
export function parseArticleDateToTime(dateStr?: string): number | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();

  for (let m = 0; m < ARABIC_MONTHS.length; m++) {
    const monthName = ARABIC_MONTHS[m];
    if (!trimmed.includes(monthName)) continue;
    const [dayStr, yearStr] = trimmed.replace(monthName, ' ').trim().split(/\s+/);
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);
    if (!isNaN(day) && !isNaN(year)) return endOfDay(year, m, day);
  }

  const iso = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return endOfDay(+iso[1], +iso[2] - 1, +iso[3]);

  const parsed = new Date(trimmed).getTime();
  return isNaN(parsed) ? null : parsed;
}

export function formatArabicDate(date: Date): string {
  return `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Empty input becomes today; a date in the future is clamped to today (we don't allow scheduling by date). */
export function sanitizeArticleDate(inputDate?: string | null, now = new Date()): string {
  const today = formatArabicDate(now);
  if (!inputDate || !inputDate.trim()) return today;

  const time = parseArticleDateToTime(inputDate);
  const todayEnd = endOfDay(now.getFullYear(), now.getMonth(), now.getDate());
  return time !== null && time > todayEnd ? today : inputDate.trim();
}

export interface DateParts {
  year: number;
  /** 0-based, like Date#getMonth */
  month: number;
  day: number;
}

/**
 * Calendar parts of a stored article date (Arabic text, ISO, or anything Date can parse).
 * Falls back to today when the text can't be understood, so a calendar widget always has something to show.
 */
export function parseDateParts(dateStr: string, now = new Date()): DateParts {
  const today: DateParts = { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
  if (!dateStr || !dateStr.trim()) return today;

  for (let m = 0; m < ARABIC_MONTHS.length; m++) {
    const monthName = ARABIC_MONTHS[m];
    if (!dateStr.includes(monthName)) continue;
    const [dayStr, yearStr] = dateStr.replace(monthName, ' ').trim().split(/\s+/);
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);
    if (!isNaN(day) && !isNaN(year) && day >= 1 && day <= 31 && year > 1900) {
      return { year, month: m, day };
    }
  }

  const iso = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) return { year: +iso[1], month: +iso[2] - 1, day: +iso[3] };

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return { year: parsed.getFullYear(), month: parsed.getMonth(), day: parsed.getDate() };
  }
  return today;
}

export function isFutureDate(dateStr: string, now = new Date()): boolean {
  const { year, month, day } = parseDateParts(dateStr, now);
  return endOfDay(year, month, day) > endOfDay(now.getFullYear(), now.getMonth(), now.getDate());
}
