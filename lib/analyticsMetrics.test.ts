import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildArticles,
  buildDelivery,
  buildSections,
  classifySource,
  classifyTrend,
  computeDelta,
  parseArticleId,
  shareOfTotal,
  type RawZones,
  type Sections,
  type Shares,
} from "./analyticsMetrics";
import { buildQueries, computeWindow, PAGE_VIEW_FILTER } from "./analyticsQueries.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_DIR = path.join(here, "__fixtures__", "analytics");
const OWN_HOSTS = ["scopes.example"];

// Sampling means two separate queries over the same traffic can disagree
// slightly, so cross-query checks allow this much slack. Same-query checks
// (parts add up to their own total) are exact.
const CROSS_QUERY_TOLERANCE = 1.05;

function loadFixtures(): Array<{ name: string; raw: RawZones }> {
  return fs
    .readdirSync(FIXTURE_DIR)
    .filter((f) => /^(synthetic|real)-.*\.json$/.test(f))
    .map((f) => ({ name: f, raw: JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, f), "utf8")).raw as RawZones }));
}

function expectSharesReconcile<T>(label: string, s: Shares<T>) {
  const listed = s.rows.reduce((a, r) => a + r.value, 0);
  const otherValue = s.other?.value ?? 0;
  // parts sum to the total, exactly
  expect(listed + otherValue, `${label}: listed + other must equal total`).toBe(s.total);
  if (s.total > 0) {
    const pctSum = s.rows.reduce((a, r) => a + r.percentage, 0) + (s.other?.percentage ?? 0);
    // each percentage is rounded to 0.1, so allow 0.1 per part
    expect(Math.abs(pctSum - 100), `${label}: percentages must sum to ~100`).toBeLessThanOrEqual(0.1 * (s.rows.length + 1));
  }
  for (const r of s.rows) {
    expect(r.percentage).toBeGreaterThanOrEqual(0);
    expect(r.percentage).toBeLessThanOrEqual(100);
  }
}

function assertInvariants(name: string, sec: Sections, raw: RawZones) {
  // A recorded fixture may legitimately contain a failed query (e.g. a field the
  // plan does not expose). That section must then be "unavailable"; every query
  // that succeeded must produce an "ok" section.
  for (const key of Object.keys(sec) as Array<keyof Sections>) {
    if (raw[key].ok) expect(sec[key].status, `${name}: section ${key} should be ok`).toBe("ok");
    else expect(sec[key].status, `${name}: failed query ${key} must be unavailable`).toBe("unavailable");
  }
  if (sec.overview.status !== "ok") return; // nothing to reconcile against
  const ov = sec.overview.data;
  if (sec.countries.status === "ok") expectSharesReconcile(`${name}/countries`, sec.countries.data);
  if (sec.devices.status === "ok") expectSharesReconcile(`${name}/devices`, sec.devices.data);
  if (sec.sources.status === "ok") expectSharesReconcile(`${name}/sources`, sec.sources.data);

  // shares are measured against the overview's true total, never a subtotal
  if (sec.countries.status === "ok") expect(sec.countries.data.total).toBeGreaterThanOrEqual(ov.pageViews);
  if (sec.sources.status === "ok") expect(sec.sources.data.total).toBeGreaterThanOrEqual(ov.visits);

  if (sec.delivery.status === "ok") {
    const d = sec.delivery.data;
    expect(d.requests.cached).toBeLessThanOrEqual(d.requests.total);
    expect(d.bytes.cached).toBeLessThanOrEqual(d.bytes.total);
    expect(d.breakdown.reduce((a, r) => a + r.requests, 0)).toBe(d.requests.total);
    expect(d.breakdown.reduce((a, r) => a + r.bytes, 0)).toBe(d.bytes.total);
    for (const r of [d.requests, d.bytes]) {
      if (r.total === 0) expect(r.percent).toBeNull();
      else {
        expect(r.percent).toBeGreaterThanOrEqual(0);
        expect(r.percent).toBeLessThanOrEqual(100);
      }
    }
  }

  if (sec.articles.status === "ok") {
    const ids = sec.articles.data.rows.map((r) => r.id);
    expect(new Set(ids).size, `${name}: article ids must be unique`).toBe(ids.length);
    const articleViews = sec.articles.data.rows.reduce((a, r) => a + r.views, 0);
    // article pages are a subset of all page views
    expect(articleViews).toBeLessThanOrEqual(Math.ceil(ov.pageViews * CROSS_QUERY_TOLERANCE));
  }
  // visits are a subset of page views under the same filter
  expect(ov.visits).toBeLessThanOrEqual(Math.ceil(ov.pageViews * CROSS_QUERY_TOLERANCE));
}

describe("fixture replay (every *.json in __fixtures__/analytics, synthetic and real)", () => {
  const fixtures = loadFixtures();
  it("has at least one fixture", () => expect(fixtures.length).toBeGreaterThan(0));
  for (const fx of fixtures) {
    it(`${fx.name}: reconciliation invariants hold`, () => {
      assertInvariants(fx.name, buildSections(fx.raw, { ownHosts: OWN_HOSTS }), fx.raw);
    });
  }
});

describe("synthetic edge cases: exact expected values", () => {
  const raw = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, "synthetic-edge-cases.json"), "utf8")).raw as RawZones;
  const sec = buildSections(raw, { ownHosts: OWN_HOSTS });

  it("overview keeps visits and page views separate, with real deltas", () => {
    if (sec.overview.status !== "ok") throw new Error("overview");
    const o = sec.overview.data;
    expect(o.pageViews).toBe(10000);
    expect(o.visits).toBe(4000);
    expect(o.pagesPerVisit).toBe(2.5);
    expect(o.pageViewsDelta).toEqual({ pct: 25, kind: "up" });
    expect(o.visitsDelta).toEqual({ pct: -9.1, kind: "down" });
  });

  it("countries are measured against the true total; the remainder is explicit", () => {
    if (sec.countries.status !== "ok") throw new Error("countries");
    const c = sec.countries.data;
    expect(c.total).toBe(10000);
    expect(c.rows[0].percentage).toBe(38); // 3800 / 10000, NOT 3800 / listed
    expect(c.rows.map((r) => r.item.code)).toEqual(["SA", "EG", "XX", "T1"]);
    expect(c.other).toEqual({ value: 2400, percentage: 24 });
  });

  it("devices: remainder is explicit rather than silently renormalised", () => {
    if (sec.devices.status !== "ok") throw new Error("devices");
    expect(sec.devices.data.rows.find((r) => r.item.type === "mobile")?.percentage).toBe(76);
    expect(sec.devices.data.other?.value).toBe(20);
  });

  it("sources: hosts merge by source, look-alike domains are not misclassified, own host is internal", () => {
    if (sec.sources.status !== "ok") throw new Error("sources");
    const byKey = Object.fromEntries(sec.sources.data.rows.map((r) => [r.item.key, r]));
    expect(byKey.google.value).toBe(1500); // google.com + google.com.sa
    expect(byKey.direct.item.category).toBe("direct");
    expect(byKey.x.item.category).toBe("social"); // t.co
    expect(byKey["pinterest.com"].item.category).toBe("referral"); // contains "t.co" as a substring
    expect(byKey["www.netflix.com"].item.category).toBe("referral"); // contains "x.com" as a substring
    expect(byKey.internal.item.category).toBe("internal");
  });

  it("articles: duplicate paths merge, zero baseline is 'new' not 100%, vanished articles fade to 0", () => {
    if (sec.articles.status !== "ok") throw new Error("articles");
    const rows = Object.fromEntries(sec.articles.data.rows.map((r) => [r.id, r]));
    expect(rows.a1.views).toBe(1800); // "/news/a1" + "/news/a1/"
    expect(rows.a1.trend).toBe("rising");
    expect(rows.a4.trend).toBe("new");
    expect(rows.a4.delta).toEqual({ pct: null, kind: "new" });
    expect(rows.a2.trend).toBe("fading");
    expect(rows.a3.trend).toBe("steady");
    expect(rows.tiny.trend).toBe("steady"); // too small to call
    expect(rows.gone.views).toBe(0);
    expect(rows.gone.trend).toBe("fading");
    expect(rows.gone.delta).toEqual({ pct: -100, kind: "down" });
  });

  it("delivery: cache ratio is computed from the data, by requests and by bytes", () => {
    if (sec.delivery.status !== "ok") throw new Error("delivery");
    const d = sec.delivery.data;
    expect(d.requests).toEqual({ cached: 66000, total: 100000, percent: 66 }); // hit+stale+revalidated
    expect(d.bytes.total).toBe(1815000000);
    expect(d.bytes.cached).toBe(965000000);
    expect(d.bytes.percent).toBe(53.2);
    expect(d.requests.percent).not.toBe(d.bytes.percent); // the two are genuinely different measures
  });
});

describe("zero traffic is zero, not invented", () => {
  const raw = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, "synthetic-zero-traffic.json"), "utf8")).raw as RawZones;
  const sec = buildSections(raw);
  it("overview", () => {
    if (sec.overview.status !== "ok") throw new Error("overview");
    expect(sec.overview.data.pageViews).toBe(0);
    expect(sec.overview.data.pagesPerVisit).toBeNull();
    expect(sec.overview.data.pageViewsDelta.kind).toBe("none");
  });
  it("cache ratio is null with no traffic (not 94.6, not 0)", () => {
    if (sec.delivery.status !== "ok") throw new Error("delivery");
    expect(sec.delivery.data.requests.percent).toBeNull();
    expect(sec.delivery.data.bytes.percent).toBeNull();
  });
});

describe("failure handling: unavailable with a reason, never made-up data", () => {
  const ok = JSON.parse(fs.readFileSync(path.join(FIXTURE_DIR, "synthetic-edge-cases.json"), "utf8")).raw as RawZones;

  it("one failed query only takes down its own section", () => {
    const sec = buildSections({ ...ok, sources: { ok: false, reason: "field clientRefererHost not available on this plan" } });
    expect(sec.sources).toEqual({ status: "unavailable", reason: "field clientRefererHost not available on this plan" });
    expect(sec.overview.status).toBe("ok");
    expect(sec.countries.status).toBe("ok");
  });

  it("sections that need a true total do not guess one when the overview fails", () => {
    const sec = buildSections({ ...ok, overview: { ok: false, reason: "quota exceeded" } });
    for (const k of ["sources", "countries", "devices"] as const) {
      const s = sec[k];
      expect(s.status).toBe("unavailable");
      if (s.status === "unavailable") expect(s.reason).toContain("quota exceeded");
    }
    expect(sec.articles.status).toBe("ok"); // does not need a total
    expect(sec.delivery.status).toBe("ok");
  });

  it("a malformed response becomes unavailable, not a crash or a zero", () => {
    const sec = buildSections({ ...ok, delivery: { ok: true, zone: {} } });
    expect(sec.delivery.status).toBe("unavailable");
  });

  it("no credentials: every section unavailable and no section carries data", () => {
    const reason = "Cloudflare credentials are not configured";
    const raw = Object.fromEntries(
      ["overview", "articles", "sources", "countries", "devices", "delivery"].map((n) => [n, { ok: false, reason }])
    ) as RawZones;
    for (const s of Object.values(buildSections(raw))) {
      expect(s.status).toBe("unavailable");
      expect("data" in s).toBe(false);
    }
  });
});

describe("unit rules", () => {
  it("computeDelta never reports 100% for a zero baseline", () => {
    expect(computeDelta(50, 0)).toEqual({ pct: null, kind: "new" });
    expect(computeDelta(0, 0)).toEqual({ pct: null, kind: "none" });
    expect(computeDelta(150, 100)).toEqual({ pct: 50, kind: "up" });
    expect(computeDelta(0, 100)).toEqual({ pct: -100, kind: "down" });
    expect(computeDelta(100, 100)).toEqual({ pct: 0, kind: "flat" });
  });

  it("shareOfTotal never exceeds 100% when sampling makes parts exceed the total", () => {
    const s = shareOfTotal([{ item: "a", value: 70 }, { item: "b", value: 50 }], 100);
    expect(s.total).toBe(120);
    expect(s.other).toBeNull();
    expect(s.rows.reduce((a, r) => a + r.percentage, 0)).toBeLessThanOrEqual(100.1);
  });

  it("parseArticleId handles slashes, encoding and malformed escapes", () => {
    expect(parseArticleId("/news/abc")).toBe("abc");
    expect(parseArticleId("/news/abc/")).toBe("abc");
    expect(parseArticleId("/news/%D8%AE%D8%A8%D8%B1")).toBe("خبر");
    expect(parseArticleId("/news/%E0%A4%A")).toBe("%E0%A4%A"); // malformed: no throw
    expect(parseArticleId("/news")).toBeNull();
    expect(parseArticleId("/programs/abc")).toBeNull();
  });

  it("classifyTrend thresholds", () => {
    expect(classifyTrend(125, 100)).toBe("rising");
    expect(classifyTrend(124, 100)).toBe("steady");
    expect(classifyTrend(75, 100)).toBe("fading");
    expect(classifyTrend(76, 100)).toBe("steady");
    expect(classifyTrend(19, 10)).toBe("steady");
  });

  it("classifySource", () => {
    expect(classifySource("", [])).toMatchObject({ key: "direct" });
    expect(classifySource(undefined, [])).toMatchObject({ key: "direct" });
    expect(classifySource("news.google.com")).toMatchObject({ key: "google-news" });
    expect(classifySource("www.google.com.sa")).toMatchObject({ key: "google", category: "search" });
    expect(classifySource("l.facebook.com")).toMatchObject({ key: "facebook" });
    expect(classifySource("x.com")).toMatchObject({ key: "x" });
    expect(classifySource("box.com")).toMatchObject({ category: "referral" });
    expect(classifySource("www.scopes.example", ["scopes.example"])).toMatchObject({ category: "internal" });
  });

  it("buildArticles flags truncation when a window hits the row limit", () => {
    const many = Array.from({ length: 40 }, (_, i) => ({ count: 100 - i, dimensions: { clientRequestPath: `/news/x${i}` } }));
    expect(buildArticles({ current: many, previous: [] }).truncated).toBe(true);
    expect(buildArticles({ current: many.slice(0, 5), previous: [] }).truncated).toBe(false);
  });

  it("buildDelivery treats unknown/dynamic/bypass as not cached", () => {
    const d = buildDelivery({
      groups: [
        { count: 1, sum: { edgeResponseBytes: 10 }, dimensions: { cacheStatus: "hit" } },
        { count: 1, sum: { edgeResponseBytes: 10 }, dimensions: { cacheStatus: "dynamic" } },
        { count: 1, sum: { edgeResponseBytes: 10 }, dimensions: { cacheStatus: "bypass" } },
        { count: 1, sum: { edgeResponseBytes: 10 }, dimensions: { cacheStatus: "unknown" } },
      ],
    });
    expect(d.requests.percent).toBe(25);
  });
});

describe("time windows", () => {
  const now = new Date("2026-10-16T12:00:00.000Z");
  for (const r of ["today", "7d", "30d"] as const) {
    it(`${r}: previous window is the same length and ends exactly where current begins`, () => {
      const w = computeWindow(r, now);
      expect(w.prevUntil).toBe(w.since); // half-open: no instant counted twice
      const cur = Date.parse(w.until) - Date.parse(w.since);
      const prev = Date.parse(w.prevUntil) - Date.parse(w.prevSince);
      expect(prev).toBe(cur);
    });
  }
  it("unknown range falls back to today", () => expect(computeWindow("bogus", now).timeRange).toBe("today"));
  it("queries use half-open bounds and one shared page-view definition", () => {
    const q = buildQueries(computeWindow("7d", now), "zone");
    expect(q.overview.query).toContain("datetime_lt: $until");
    expect(q.overview.query).not.toContain("datetime_leq");
    expect(q.overview.query).toContain(PAGE_VIEW_FILTER);
    for (const n of ["articles", "sources", "countries", "devices"] as const) {
      expect(q[n].query).toContain(PAGE_VIEW_FILTER);
    }
    expect(q.delivery.query).not.toContain("edgeResponseContentTypeName"); // cache = all traffic, not page views
  });
});

describe("regression guard: no hardcoded or fabricated numbers in the analytics feature", () => {
  const root = path.join(here, "..");
  const files = [
    "app/api/admin/analytics/route.ts",
    "app/admin/components/AnalyticsDashboard.tsx",
    "lib/analyticsMetrics.ts",
    "lib/analyticsQueries.mjs",
  ];
  const banned: Array<[string, RegExp]> = [
    ["static cache ratio 94.6 / 94.2", /\b94\.[26]\b/],
    ["UI fallback `?? 95`", /\?\?\s*95\b/],
    ["invented visitor ratio 0.72 / 0.75", /\*\s*0\.7[25]\b/],
    ["demo multiplier", /demoMultiplier|baseVisitors/],
    ["hardcoded TTFB claim", /30\s*ms/i],
    ["hardcoded Anycast row", /Anycast/],
  ];
  for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), "utf8");
    for (const [label, re] of banned) {
      it(`${f}: no ${label}`, () => expect(re.test(src)).toBe(false));
    }
  }
});
