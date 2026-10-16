// Turns raw Cloudflare GraphQL rows into the dashboard's sections.
// Pure functions only (no fetch, no DB) so tests can replay recorded fixtures
// through exactly the code production runs.
//
// Rules this file enforces:
//  - percentages are computed against the TRUE total, never a top-N subtotal;
//    the remainder is returned explicitly as `other`
//  - nothing is invented: missing data throws, and the caller reports it as
//    "unavailable" with the reason
//  - growth is `null` (never "100%") when there is no previous baseline

import { LIMITS } from "./analyticsQueries.mjs";

export type Section<T> =
  | { status: "ok"; data: T }
  | { status: "unavailable"; reason: string };

type Dims = Record<string, string | null | undefined>;
export interface Group {
  count?: number | null;
  sum?: { visits?: number | null; edgeResponseBytes?: number | null } | null;
  dimensions?: Dims | null;
}
/** `data.viewer.zones[0]` of one query, as returned by Cloudflare. */
export type Zone = Record<string, unknown>;
export type RawResult = { ok: true; zone: Zone } | { ok: false; reason: string };
export type RawZones = Record<
  "overview" | "articles" | "sources" | "countries" | "devices" | "delivery",
  RawResult
>;

const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

function groups(zone: Zone, key: string): Group[] {
  const v = zone[key];
  if (!Array.isArray(v)) throw new Error(`Cloudflare response has no "${key}" field`);
  return v as Group[];
}

// ───────────────────────── growth ─────────────────────────

export interface Delta {
  /** Percent change vs the previous window. null when there is no baseline. */
  pct: number | null;
  kind: "new" | "up" | "down" | "flat" | "none";
}

export function computeDelta(current: number, previous: number): Delta {
  if (previous <= 0) return current > 0 ? { pct: null, kind: "new" } : { pct: null, kind: "none" };
  const pct = round1(((current - previous) / previous) * 100);
  return { pct, kind: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

// ───────────────────────── shares of a true total ─────────────────────────

export interface ShareRow<T> {
  item: T;
  value: number;
  percentage: number;
}
export interface Shares<T> {
  rows: ShareRow<T>[];
  /** Everything not listed above (rows cut by the query limit). null when nothing is left. */
  other: { value: number; percentage: number } | null;
  total: number;
}

/**
 * `total` must be the real total from an un-dimensioned query. If sampling
 * noise makes the listed rows exceed it, the base becomes the listed sum so no
 * percentage ever exceeds 100.
 */
export function shareOfTotal<T>(items: Array<{ item: T; value: number }>, total: number): Shares<T> {
  const listed = items.reduce((s, r) => s + r.value, 0);
  const base = Math.max(total, listed);
  const pct = (v: number) => (base > 0 ? round1((v / base) * 100) : 0);
  const rows = items.map((r) => ({ item: r.item, value: r.value, percentage: pct(r.value) }));
  const rest = base - listed;
  return {
    rows,
    other: rest > 0 ? { value: rest, percentage: pct(rest) } : null,
    total: base,
  };
}

// ───────────────────────── overview ─────────────────────────

export interface Overview {
  pageViews: number;
  visits: number;
  /** pageViews / visits. null when there were no visits. */
  pagesPerVisit: number | null;
  pageViewsDelta: Delta;
  visitsDelta: Delta;
}

export function buildOverview(zone: Zone): Overview {
  const cur = groups(zone, "current")[0];
  const prev = groups(zone, "previous")[0];
  const pageViews = num(cur?.count);
  const visits = num(cur?.sum?.visits);
  return {
    pageViews,
    visits,
    pagesPerVisit: visits > 0 ? round1(pageViews / visits) : null,
    pageViewsDelta: computeDelta(pageViews, num(prev?.count)),
    visitsDelta: computeDelta(visits, num(prev?.sum?.visits)),
  };
}

// ───────────────────────── articles ─────────────────────────

export type Trend = "new" | "rising" | "fading" | "steady";

export interface ArticleRow {
  id: string;
  views: number;
  prevViews: number;
  delta: Delta;
  trend: Trend;
}
export interface Articles {
  rows: ArticleRow[];
  /** true when either window hit the row limit, so smaller articles are not listed */
  truncated: boolean;
}

export function parseArticleId(path: string): string | null {
  const m = /^\/news\/([^/?#]+)/.exec(path || "");
  if (!m) return null;
  try {
    return decodeURIComponent(m[1]);
  } catch {
    return m[1];
  }
}

function viewsById(rows: Group[]): Map<string, number> {
  // "/news/abc" and "/news/abc/" are the same article: merge, don't list twice.
  const out = new Map<string, number>();
  for (const r of rows) {
    const id = parseArticleId(r.dimensions?.clientRequestPath ?? "");
    if (id) out.set(id, (out.get(id) ?? 0) + num(r.count));
  }
  return out;
}

export const TREND_THRESHOLD_PCT = 25;
export const TREND_MIN_VIEWS = 20;

export function classifyTrend(views: number, prevViews: number): Trend {
  if (Math.max(views, prevViews) < TREND_MIN_VIEWS) return "steady"; // too small to call
  if (prevViews === 0) return "new";
  const pct = ((views - prevViews) / prevViews) * 100;
  if (pct >= TREND_THRESHOLD_PCT) return "rising";
  if (pct <= -TREND_THRESHOLD_PCT) return "fading";
  return "steady";
}

export function buildArticles(zone: Zone): Articles {
  const curRows = groups(zone, "current");
  const prevRows = groups(zone, "previous");
  const cur = viewsById(curRows);
  const prev = viewsById(prevRows);
  const ids = new Set([...cur.keys(), ...prev.keys()]);
  const rows: ArticleRow[] = [...ids].map((id) => {
    const views = cur.get(id) ?? 0;
    const prevViews = prev.get(id) ?? 0;
    return { id, views, prevViews, delta: computeDelta(views, prevViews), trend: classifyTrend(views, prevViews) };
  });
  rows.sort((a, b) => b.views - a.views || b.prevViews - a.prevViews);
  return {
    rows,
    truncated: curRows.length >= LIMITS.articles || prevRows.length >= LIMITS.articles,
  };
}

// ───────────────────────── countries ─────────────────────────

export interface CountryItem {
  code: string;
  nameAr: string;
  flag: string;
}

const SPECIAL_COUNTRIES: Record<string, string> = { XX: "غير معروف", T1: "شبكة Tor" };

function countryItem(raw: string): CountryItem {
  const code = (raw || "").trim().toUpperCase();
  if (SPECIAL_COUNTRIES[code]) return { code, nameAr: SPECIAL_COUNTRIES[code], flag: "🌐" };
  if (/^[A-Z]{2}$/.test(code)) {
    let nameAr = code;
    try {
      nameAr = new Intl.DisplayNames(["ar"], { type: "region" }).of(code) ?? code;
    } catch {
      /* keep the code */
    }
    const flag = String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
    return { code, nameAr, flag };
  }
  return { code: code || "??", nameAr: raw || "غير معروف", flag: "🌐" };
}

export function buildCountries(zone: Zone, totalPageViews: number): Shares<CountryItem> {
  const items = groups(zone, "groups").map((g) => ({
    item: countryItem(g.dimensions?.clientCountryName ?? ""),
    value: num(g.count),
  }));
  return shareOfTotal(items, totalPageViews);
}

// ───────────────────────── devices ─────────────────────────

export interface DeviceItem {
  type: string;
  labelAr: string;
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: "هاتف محمول",
  desktop: "حاسوب",
  tablet: "جهاز لوحي",
};

export function buildDevices(zone: Zone, totalPageViews: number): Shares<DeviceItem> {
  const items = groups(zone, "groups").map((g) => {
    const type = (g.dimensions?.clientDeviceType ?? "").toLowerCase() || "unknown";
    return { item: { type, labelAr: DEVICE_LABELS[type] ?? "غير محدد" }, value: num(g.count) };
  });
  return shareOfTotal(items, totalPageViews);
}

// ───────────────────────── sources ─────────────────────────

export type SourceCategory = "search" | "social" | "direct" | "internal" | "referral";
export interface SourceItem {
  key: string;
  labelAr: string;
  category: SourceCategory;
}

type Matcher = { test: (host: string) => boolean; key: string; labelAr: string; category: SourceCategory };

// Match on the host's labels, not on substrings: "pinterest.com" contains "t.co"
// and "netflix.com" contains "x.com", which the old substring matching got wrong.
const hasLabel = (host: string, domain: string) => host === domain || host.endsWith("." + domain);
const googleHost = (h: string) => /(^|\.)google\.[a-z.]+$/.test(h);

const MATCHERS: Matcher[] = [
  { test: (h) => /^news\.google\./.test(h), key: "google-news", labelAr: "أخبار جوجل", category: "search" },
  { test: googleHost, key: "google", labelAr: "جوجل", category: "search" },
  { test: (h) => hasLabel(h, "bing.com"), key: "bing", labelAr: "بينغ", category: "search" },
  { test: (h) => hasLabel(h, "duckduckgo.com"), key: "duckduckgo", labelAr: "دك دك جو", category: "search" },
  { test: (h) => hasLabel(h, "yahoo.com"), key: "yahoo", labelAr: "ياهو", category: "search" },
  { test: (h) => hasLabel(h, "yandex.com") || hasLabel(h, "yandex.ru"), key: "yandex", labelAr: "ياندكس", category: "search" },
  { test: (h) => hasLabel(h, "facebook.com") || hasLabel(h, "fb.com") || hasLabel(h, "fb.me"), key: "facebook", labelAr: "فيسبوك", category: "social" },
  { test: (h) => hasLabel(h, "instagram.com"), key: "instagram", labelAr: "إنستغرام", category: "social" },
  { test: (h) => h === "t.co" || hasLabel(h, "twitter.com") || h === "x.com" || hasLabel(h, "x.com"), key: "x", labelAr: "إكس (تويتر)", category: "social" },
  { test: (h) => h === "t.me" || hasLabel(h, "telegram.org") || hasLabel(h, "telegram.me"), key: "telegram", labelAr: "تيليجرام", category: "social" },
  { test: (h) => hasLabel(h, "whatsapp.com") || hasLabel(h, "wa.me"), key: "whatsapp", labelAr: "واتساب", category: "social" },
  { test: (h) => hasLabel(h, "linkedin.com") || h === "lnkd.in", key: "linkedin", labelAr: "لينكد إن", category: "social" },
  { test: (h) => hasLabel(h, "youtube.com") || h === "youtu.be", key: "youtube", labelAr: "يوتيوب", category: "social" },
  { test: (h) => hasLabel(h, "tiktok.com"), key: "tiktok", labelAr: "تيك توك", category: "social" },
  { test: (h) => hasLabel(h, "reddit.com"), key: "reddit", labelAr: "ريديت", category: "social" },
];

export function classifySource(rawHost: string | null | undefined, ownHosts: string[] = []): SourceItem {
  const host = (rawHost ?? "").trim().toLowerCase();
  if (!host) return { key: "direct", labelAr: "مباشر (بلا مرجع)", category: "direct" };
  if (ownHosts.some((o) => o && hasLabel(host, o.toLowerCase().replace(/^www\./, "")))) {
    return { key: "internal", labelAr: "داخلي (نفس الموقع)", category: "internal" };
  }
  const m = MATCHERS.find((x) => x.test(host));
  if (m) return { key: m.key, labelAr: m.labelAr, category: m.category };
  return { key: host, labelAr: host, category: "referral" };
}

export function buildSources(zone: Zone, totalVisits: number, ownHosts: string[] = []): Shares<SourceItem> {
  // Several hosts can be one source (google.com + google.com.sa): merge by key.
  const merged = new Map<string, { item: SourceItem; value: number }>();
  for (const g of groups(zone, "groups")) {
    const item = classifySource(g.dimensions?.clientRefererHost, ownHosts);
    const prev = merged.get(item.key);
    merged.set(item.key, { item, value: (prev?.value ?? 0) + num(g.sum?.visits) });
  }
  const items = [...merged.values()].sort((a, b) => b.value - a.value);
  return shareOfTotal(items, totalVisits);
}

// ───────────────────────── delivery (cache) ─────────────────────────

/** Cloudflare cacheStatus values that mean the edge answered without a full origin fetch. */
export const HIT_STATUSES = ["hit", "stale", "revalidated", "updating"];

export interface Ratio {
  cached: number;
  total: number;
  /** percent, 1 decimal. null when total is 0 (no traffic to measure). */
  percent: number | null;
}
export interface Delivery {
  requests: Ratio;
  bytes: Ratio;
  breakdown: Array<{ status: string; requests: number; bytes: number; isHit: boolean }>;
  truncated: boolean;
}

const ratio = (cached: number, total: number): Ratio => ({
  cached,
  total,
  percent: total > 0 ? round1((cached / total) * 100) : null,
});

export function buildDelivery(zone: Zone): Delivery {
  const rows = groups(zone, "groups");
  const byStatus = new Map<string, { requests: number; bytes: number }>();
  for (const g of rows) {
    const status = (g.dimensions?.cacheStatus ?? "unknown").toLowerCase() || "unknown";
    const prev = byStatus.get(status) ?? { requests: 0, bytes: 0 };
    byStatus.set(status, {
      requests: prev.requests + num(g.count),
      bytes: prev.bytes + num(g.sum?.edgeResponseBytes),
    });
  }
  const breakdown = [...byStatus.entries()]
    .map(([status, v]) => ({ status, ...v, isHit: HIT_STATUSES.includes(status) }))
    .sort((a, b) => b.requests - a.requests);
  const sum = (f: (r: (typeof breakdown)[number]) => number, hitOnly: boolean) =>
    breakdown.filter((r) => !hitOnly || r.isHit).reduce((s, r) => s + f(r), 0);
  return {
    requests: ratio(sum((r) => r.requests, true), sum((r) => r.requests, false)),
    bytes: ratio(sum((r) => r.bytes, true), sum((r) => r.bytes, false)),
    breakdown,
    truncated: rows.length >= LIMITS.cacheStatuses,
  };
}

// ───────────────────────── assembly ─────────────────────────

export interface Sections {
  overview: Section<Overview>;
  articles: Section<Articles>;
  sources: Section<Shares<SourceItem>>;
  countries: Section<Shares<CountryItem>>;
  devices: Section<Shares<DeviceItem>>;
  delivery: Section<Delivery>;
}

function guard<T>(raw: RawResult, build: (zone: Zone) => T): Section<T> {
  if (!raw.ok) return { status: "unavailable", reason: raw.reason };
  try {
    return { status: "ok", data: build(raw.zone) };
  } catch (e) {
    return { status: "unavailable", reason: e instanceof Error ? e.message : "Unexpected response shape" };
  }
}

/** Sections that need a true total inherit the overview's failure instead of guessing one. */
function dependent<T>(raw: RawResult, overview: Section<Overview>, build: (zone: Zone, ov: Overview) => T): Section<T> {
  if (overview.status !== "ok") {
    return { status: "unavailable", reason: `Needs the overview total, which is unavailable: ${overview.reason}` };
  }
  const ov = overview.data;
  return guard(raw, (zone) => build(zone, ov));
}

export function buildSections(raw: RawZones, opts: { ownHosts?: string[] } = {}): Sections {
  const overview = guard(raw.overview, buildOverview);
  return {
    overview,
    articles: guard(raw.articles, buildArticles),
    sources: dependent(raw.sources, overview, (z, ov) => buildSources(z, ov.visits, opts.ownHosts ?? [])),
    countries: dependent(raw.countries, overview, (z, ov) => buildCountries(z, ov.pageViews)),
    devices: dependent(raw.devices, overview, (z, ov) => buildDevices(z, ov.pageViews)),
    delivery: guard(raw.delivery, buildDelivery),
  };
}

// ───────────────────────── API response shape (shared by route + dashboard) ─────────────────────────

export interface ArticleMeta {
  title: string | null;
  subtitle: string | null;
  category: string | null;
  categorySlug: string | null;
  imageUrl: string | null;
  date: string | null;
  authorName: string | null;
}
export type ArticleRowWithMeta = ArticleRow & { path: string; meta: ArticleMeta | null };
export type ArticlesWithMeta = Section<{
  rows: ArticleRowWithMeta[];
  truncated: boolean;
  /** set when titles could not be resolved; rows are still real traffic data */
  metadataError?: string;
}>;
export type ResponseSections = Omit<Sections, "articles"> & { articles: ArticlesWithMeta };

export interface AnalyticsResponse {
  success: true;
  configured: boolean;
  diagnostics: { hasToken: boolean; hasZoneId: boolean; tokenSource: string };
  window: { timeRange: "today" | "7d" | "30d"; since: string; until: string; prevSince: string; prevUntil: string };
  generatedAt: string;
  sections: ResponseSections;
}
