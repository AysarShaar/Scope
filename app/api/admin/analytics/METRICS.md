# Admin analytics: metric dictionary

Source of truth for every number on `/admin/dashboard`. Queries live in
`lib/analyticsQueries.mjs`; the arithmetic lives in `lib/analyticsMetrics.ts`.
If you change what a number means, change it here too.

**Status legend.** Nothing below has been checked against your real Cloudflare
zone yet: the sandbox this was written in has no network and no token. Every
Cloudflare field name, filter value and plan limit is therefore marked
**UNVERIFIED** until you run `node scripts/cf-analytics-probe.mjs` and the
output confirms it.

## Three different quantities (never interchangeable)

| Term | Meaning here | Where it comes from |
|---|---|---|
| **Request** | Any HTTP request from a real visitor (HTML, images, JS, API) | `delivery` query only |
| **Page view** | A real-visitor `GET` that returned a `200` `text/html` document | `PAGE_VIEW_FILTER` |
| **Visit** | Cloudflare's `sum.visits`: the start of a session arriving from an external referrer or directly | `sum { visits }` under `PAGE_VIEW_FILTER` |

There is **no "unique readers" number**. `adaptive` groups cannot count uniques;
the old dashboard labelled `visits` as "uniques" and invented a 0.72/0.75 ratio
when it was missing. Both are gone.

`PAGE_VIEW_FILTER` = `requestSource: "eyeball"`, `clientRequestHTTPMethodName: "GET"`,
`edgeResponseStatus: 200`, `edgeResponseContentTypeName: "html"`.
It excludes assets, Next.js RSC/prefetch payloads (not `text/html`), non-GET
requests, error pages and Cloudflare's own origin pulls. It does **not**
exclude bots (bot score needs Bot Management; not assumed).

## Windows

Current = `[since, until)`. Previous = the same length, immediately before:
`[prevSince, since)`. Half-open, so no instant is counted in both (the old code
used `<=` on both sides). "Today" means the **last 24 hours**, not the calendar
day, and the UI says so. Computed with millisecond arithmetic (no DST drift).

## Every number

| Dashboard number | Counts | Query / filter | Percentages are of | Caveats |
|---|---|---|---|---|
| Page views | page views in window | `overview.current`: `count`, no dimensions | n/a | Includes bots. Sampled. |
| Page views change | `(cur-prev)/prev` | `overview.current` vs `overview.previous` | n/a | `null` / "جديد" when prev is 0 (never "100%"). |
| Visits | `sum.visits` | `overview.current`: `sum { visits }` | n/a | See "visits" semantics below. |
| Pages per visit | page views / visits | derived | n/a | `null` when visits is 0. |
| Article views | page views on `/news/<id>` | `articles.current`, `clientRequestPath_like "/news/%"`, top 40 | n/a | `/news/x` and `/news/x/` merged. Articles outside the top 40 of both windows are not listed (UI says so). |
| Article trend | rising ≥ +25%, fading ≤ -25%, `new` if prev = 0 | `articles.current` vs `articles.previous` | n/a | Below 20 views in both windows is "steady" (too small to call). Thresholds are in `analyticsMetrics.ts`. |
| Sources | `sum.visits` by `clientRefererHost` | `sources.groups`, top 15 | **total visits** (overview) | Hosts merged by source (google.com + google.com.sa). Own host shown as "internal". Empty referrer = "direct". |
| Countries | page views by `clientCountryName` | `countries.groups`, top 10 | **total page views** (overview) | Names from `Intl.DisplayNames`, no hardcoded table. `XX` = unknown, `T1` = Tor. |
| Devices | page views by `clientDeviceType` | `devices.groups`, top 10 | **total page views** (overview) | |
| Cache hit, by requests | hit-like requests / all requests | `delivery.groups` by `cacheStatus`, `requestSource: "eyeball"` | all eyeball requests | Hit-like = `hit`, `stale`, `revalidated`, `updating`. |
| Cache hit, by bytes | hit-like `edgeResponseBytes` / all | same query | all eyeball bytes | Usually differs from the request ratio, which is why both are shown. |
| Data served | total `edgeResponseBytes` | same query | n/a | Edge response bytes, binary GB/MB. |

"Of the true total" matters: the old code divided by the sum of the top 12
countries / top 5 devices, so shares always added to 100 and hid everything
outside the cut. Now the remainder is shown as an explicit "أخرى" row.

## Failure behaviour

- Each query is independent. One failing (e.g. a field your plan lacks) makes
  only its card say "غير متاح" with Cloudflare's own message.
- Sources, countries and devices need the overview total; if the overview fails
  they say so rather than guess a base.
- No credentials: one banner, no numbers. There is no demo data anywhere.
- A genuinely quiet window shows real zeros and a `null` cache ratio ("no
  traffic"), not a made-up figure.

## Assumptions register (all UNVERIFIED until the probe confirms)

1. `httpRequestsAdaptiveGroups` is exposed for your zone/plan.
2. Dimensions exist: `clientRequestPath`, `clientCountryName`, `clientDeviceType`,
   `clientRefererHost`, `cacheStatus`. **Plan-restricted risk:** the original code
   commented that `clientRefererHost` is unavailable on Free; the dashboard will
   show Sources as unavailable if so.
3. Sums exist: `visits`, `edgeResponseBytes`.
4. Filter fields exist, with these exact values: `requestSource: "eyeball"`,
   `clientRequestHTTPMethodName: "GET"`, `edgeResponseStatus: 200`,
   `edgeResponseContentTypeName: "html"` (the lowercase `"html"` value is a guess),
   plus `clientRequestPath_like`, `datetime_geq`, `datetime_lt`.
5. `orderBy: [sum_visits_DESC]` and `[count_DESC]` are accepted.
6. A query with no dimensions and `limit: 1` returns one aggregate row.
7. GraphQL variables typed `String!` are accepted for `datetime_*` filters
   (the original code did this; kept).
8. **Window length is plan-dependent.** I believe the adaptive dataset limits how
   far back and how long a window you can query on lower plans, but I have not
   verified your limit. If 7d/30d are rejected, those ranges will show
   "غير متاح" with Cloudflare's message instead of zeros. The probe tests 1d, 7d,
   30d and reports it.
9. `cacheStatus` values are as in `HIT_STATUSES`; anything else (dynamic, miss,
   bypass, expired, none, unknown) counts as not cached.
10. Adaptive data is sampled, so counts are estimates and two separate queries
    over the same traffic can differ slightly. Tests allow 5% slack for
    cross-query checks only; same-query sums are exact.
11. `visits` semantics: assumed to count session starts from an external or
    direct entry, so it can never exceed page views under the same filter.
12. The probe's cross-check (`httpRequests1dGroups` fields `sum.requests`,
    `pageViews`, `cachedRequests`, `bytes`, `cachedBytes`, `uniq.uniques`, and
    filter `date_geq/date_leq`) is also unverified.

## Checking against Cloudflare's own dashboard

After running the probe, compare for the same window (Cloudflare dashboard,
your zone, Analytics & Logs, Traffic; exact labels vary by plan):

| Ours | Compare with | Reasonable agreement |
|---|---|---|
| Page views (1d range) | Cloudflare's page views for the same day(s) | Same ballpark. Definitions differ (bots, sampling, rolling vs UTC-day window), so a gap is a prompt to read the definitions, not proof of a bug. |
| Cache hit by requests | Cloudflare's cache ratio / cached requests | Should be close, since both are cached ÷ total. |
| Cache hit by bytes | Cloudflare's cached bandwidth ÷ total | Should be close. |
| Data served | Cloudflare's total bandwidth | Close; ours is edge response bytes for real visitors only. |

The "10%" tolerance people usually quote is a rule of thumb, not something
established here. Decide your own tolerance once you see the first real gap.
