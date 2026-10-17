export const ARABIC_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
] as const;

export interface DateParts {
  year: number;
  /** 0-based month index (0 = January) */
  month: number;
  day: number;
}

export function formatArabicDate(date: Date): string {
  return `${date.getDate()} ${ARABIC_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function parseArticleDateToTime(dateStr?: string): number | null {
  const parts = parseDatePartsOptional(dateStr);
  if (!parts) return null;
  return toEndOfDayTimestamp(parts.year, parts.month, parts.day);
}

export function parseDateParts(dateStr?: string, now = new Date()): DateParts {
  return parseDatePartsOptional(dateStr) ?? createDatePartsFromDate(now);
}

export function sanitizeArticleDate(inputDate?: string | null, now = new Date()): string {
  const fallbackToday = formatArabicDate(now);
  if (!inputDate || !inputDate.trim()) return fallbackToday;

  const parsedTime = parseArticleDateToTime(inputDate);
  const todayEndTime = toEndOfDayTimestamp(now.getFullYear(), now.getMonth(), now.getDate());

  const isFuture = parsedTime !== null && parsedTime > todayEndTime;
  return isFuture ? fallbackToday : inputDate.trim();
}

export function isFutureDate(dateStr: string, now = new Date()): boolean {
  const parts = parseDateParts(dateStr, now);
  const targetEndTime = toEndOfDayTimestamp(parts.year, parts.month, parts.day);
  const todayEndTime = toEndOfDayTimestamp(now.getFullYear(), now.getMonth(), now.getDate());
  return targetEndTime > todayEndTime;
}

function toEndOfDayTimestamp(year: number, month: number, day: number): number {
  return new Date(year, month, day, 23, 59, 59, 999).getTime();
}

function createDatePartsFromDate(date: Date): DateParts {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
  };
}

function parseDatePartsOptional(dateStr?: string): DateParts | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  return parseArabicDate(trimmed) ?? parseIsoDate(trimmed) ?? parseNativeDate(trimmed);
}

function parseArabicDate(trimmed: string): DateParts | null {
  for (let monthIndex = 0; monthIndex < ARABIC_MONTHS.length; monthIndex++) {
    const monthName = ARABIC_MONTHS[monthIndex];
    if (!trimmed.includes(monthName)) continue;

    const remaining = trimmed.replace(monthName, ' ').trim();
    const [dayStr, yearStr] = remaining.split(/\s+/);
    const day = parseInt(dayStr, 10);
    const year = parseInt(yearStr, 10);

    const isValidDay = !isNaN(day) && day >= 1 && day <= 31;
    const isValidYear = !isNaN(year) && year > 1900;

    if (isValidDay && isValidYear) {
      return { year, month: monthIndex, day };
    }
  }
  return null;
}

function parseIsoDate(trimmed: string): DateParts | null {
  const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);

  return { year, month, day };
}

function parseNativeDate(trimmed: string): DateParts | null {
  const parsed = new Date(trimmed);
  if (isNaN(parsed.getTime())) return null;

  return createDatePartsFromDate(parsed);
}
