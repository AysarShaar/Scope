// Cloudflare GraphQL queries for the admin analytics dashboard.
//
// Plain .mjs on purpose: the app (route.ts) and scripts/cf-analytics-probe.mjs
// import this same file, so the fixtures the probe records come from exactly
// the queries production runs. See app/api/admin/analytics/METRICS.md for what
// each query counts and which field assumptions are still UNVERIFIED.

const HOUR = 60 * 60 * 1000;
const RANGE_MS = { today: 24 * HOUR, "7d": 7 * 24 * HOUR, "30d": 30 * 24 * HOUR };

/**
 * A "page view" = a real-visitor GET that returned an HTML document with 200.
 * Excludes assets, Next.js RSC/prefetch payloads (not text/html), POSTs, errors
 * and Cloudflare's own origin-pull traffic. It does NOT exclude bots: bot score
 * needs Bot Management, which is not assumed here.
 */
export const PAGE_VIEW_FILTER =
  'requestSource: "eyeball", clientRequestHTTPMethodName: "GET", edgeResponseStatus: 200, edgeResponseContentTypeName: "html"';

export const ARTICLE_PATH_FILTER = 'clientRequestPath_like: "/news/%"';

/** Row limits. The builders flag `truncated` when a result hits its limit. */
export const LIMITS = { articles: 40, sources: 15, countries: 10, devices: 10, cacheStatuses: 20 };

/**
 * Current window is [since, until); previous window is the same length,
 * immediately before: [prevSince, since). Half-open so the boundary instant is
 * never counted twice (the old code used <= on both sides).
 * Pure millisecond arithmetic: no setDate/setHours, so no DST drift.
 */
export function computeWindow(timeRange, now = new Date()) {
  const range = Object.prototype.hasOwnProperty.call(RANGE_MS, timeRange) ? timeRange : "today";
  const ms = RANGE_MS[range];
  const until = now.getTime();
  const since = until - ms;
  const prevSince = since - ms;
  return {
    timeRange: range,
    since: new Date(since).toISOString(),
    until: new Date(until).toISOString(),
    prevSince: new Date(prevSince).toISOString(),
    prevUntil: new Date(since).toISOString(),
  };
}

const CUR = "datetime_geq: $since, datetime_lt: $until";
const PREV = "datetime_geq: $prevSince, datetime_lt: $since";

/**
 * @returns {Record<'overview'|'articles'|'sources'|'countries'|'devices'|'delivery',
 *   { query: string, variables: Record<string,string> }>}
 */
export function buildQueries(window, zoneTag) {
  const cur = { zoneTag, since: window.since, until: window.until };
  const both = { zoneTag, since: window.since, until: window.until, prevSince: window.prevSince };

  return {
    overview: {
      variables: both,
      query: `
        query Overview($zoneTag: String!, $since: String!, $until: String!, $prevSince: String!) {
          viewer { zones(filter: { zoneTag: $zoneTag }) {
            current: httpRequestsAdaptiveGroups(filter: { ${CUR}, ${PAGE_VIEW_FILTER} }, limit: 1) {
              count
              sum { visits }
            }
            previous: httpRequestsAdaptiveGroups(filter: { ${PREV}, ${PAGE_VIEW_FILTER} }, limit: 1) {
              count
              sum { visits }
            }
          } }
        }`,
    },
    articles: {
      variables: both,
      query: `
        query Articles($zoneTag: String!, $since: String!, $until: String!, $prevSince: String!) {
          viewer { zones(filter: { zoneTag: $zoneTag }) {
            current: httpRequestsAdaptiveGroups(
              filter: { ${CUR}, ${PAGE_VIEW_FILTER}, ${ARTICLE_PATH_FILTER} }
              orderBy: [count_DESC], limit: ${LIMITS.articles}
            ) { count dimensions { clientRequestPath } }
            previous: httpRequestsAdaptiveGroups(
              filter: { ${PREV}, ${PAGE_VIEW_FILTER}, ${ARTICLE_PATH_FILTER} }
              orderBy: [count_DESC], limit: ${LIMITS.articles}
            ) { count dimensions { clientRequestPath } }
          } }
        }`,
    },
    sources: {
      variables: cur,
      query: `
        query Sources($zoneTag: String!, $since: String!, $until: String!) {
          viewer { zones(filter: { zoneTag: $zoneTag }) {
            groups: httpRequestsAdaptiveGroups(
              filter: { ${CUR}, ${PAGE_VIEW_FILTER} }
              orderBy: [sum_visits_DESC], limit: ${LIMITS.sources}
            ) { sum { visits } dimensions { clientRefererHost } }
          } }
        }`,
    },
    countries: {
      variables: cur,
      query: `
        query Countries($zoneTag: String!, $since: String!, $until: String!) {
          viewer { zones(filter: { zoneTag: $zoneTag }) {
            groups: httpRequestsAdaptiveGroups(
              filter: { ${CUR}, ${PAGE_VIEW_FILTER} }
              orderBy: [count_DESC], limit: ${LIMITS.countries}
            ) { count dimensions { clientCountryName } }
          } }
        }`,
    },
    devices: {
      variables: cur,
      query: `
        query Devices($zoneTag: String!, $since: String!, $until: String!) {
          viewer { zones(filter: { zoneTag: $zoneTag }) {
            groups: httpRequestsAdaptiveGroups(
              filter: { ${CUR}, ${PAGE_VIEW_FILTER} }
              orderBy: [count_DESC], limit: ${LIMITS.devices}
            ) { count dimensions { clientDeviceType } }
          } }
        }`,
    },
    // Cache efficiency is about ALL real-visitor traffic (assets included),
    // not just page views, so it deliberately uses a different filter.
    delivery: {
      variables: cur,
      query: `
        query Delivery($zoneTag: String!, $since: String!, $until: String!) {
          viewer { zones(filter: { zoneTag: $zoneTag }) {
            groups: httpRequestsAdaptiveGroups(
              filter: { ${CUR}, requestSource: "eyeball" }
              orderBy: [count_DESC], limit: ${LIMITS.cacheStatuses}
            ) { count sum { edgeResponseBytes } dimensions { cacheStatus } }
          } }
        }`,
    },
  };
}

export const QUERY_NAMES = ["overview", "articles", "sources", "countries", "devices", "delivery"];
