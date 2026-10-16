#!/usr/bin/env node
// Verifies, against YOUR Cloudflare zone, the assumptions the analytics
// dashboard makes, and records raw responses as test fixtures.
//
//   CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ZONE_ID=... node scripts/cf-analytics-probe.mjs [--range=today|7d|30d]
//
// Needs Node 18+ (global fetch). Adds no dependencies. Never prints or writes
// the token or the zone id.
//
// What it does
//   1. Introspects the schema: which dimensions / sums / filters / orderBy
//      values exist on httpRequestsAdaptiveGroups (the dashboard's source).
//   2. Reads the plan's dataset limits (max window, max rows) if exposed.
//   3. Tries 1d / 3d / 7d / 30d windows to find which the plan allows.
//   4. Runs the exact production queries (lib/analyticsQueries.mjs) and writes
//      the raw responses to lib/__fixtures__/analytics/real-<range>-<date>.json
//      in the shape the tests replay.
//   5. Runs an INDEPENDENT cross-check (Cloudflare's own daily rollup,
//      httpRequests1dGroups) so you can compare our totals with Cloudflare's.
//
// Paste the console output back; it contains no secrets.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildQueries, computeWindow, QUERY_NAMES } from "../lib/analyticsQueries.mjs";

const token = process.env.CLOUDFLARE_API_TOKEN?.trim();
const zoneId = process.env.CLOUDFLARE_ZONE_ID?.trim();
const range = (process.argv.find((a) => a.startsWith("--range=")) || "--range=today").split("=")[1];
if (!token || !zoneId) {
  console.error("Set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ZONE_ID first.");
  process.exit(1);
}

const ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
async function gql(query, variables = {}) {
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(20000),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || json?.errors?.length) {
      return { ok: false, reason: json?.errors?.map((e) => e.message).join("; ") || `HTTP ${res.status}` };
    }
    return { ok: true, data: json.data };
  } catch (e) {
    return { ok: false, reason: String(e?.message || e) };
  }
}

const out = [];
const log = (s = "") => {
  console.log(s);
  out.push(s);
};
const mark = (b) => (b ? "OK     " : "MISSING");

// ── 1. schema ───────────────────────────────────────────────────────────────
log("== 1. SCHEMA (httpRequestsAdaptiveGroups) ==");
const typeNames = await gql(`{ __schema { types { name } } }`);
let schemaFacts = null;
if (!typeNames.ok) {
  log(`introspection failed: ${typeNames.reason}`);
} else {
  const names = typeNames.data.__schema.types.map((t) => t.name);
  const find = (re) => names.filter((n) => re.test(n));
  const groupTypes = find(/^ZoneHttpRequestsAdaptiveGroups/);
  log(`related types: ${groupTypes.join(", ") || "(none found)"}`);
  const detail = async (n) => {
    const r = await gql(`query($n:String!){ __type(name:$n){ name kind fields{name} inputFields{name} enumValues{name} } }`, { n });
    return r.ok ? r.data.__type : null;
  };
  const types = {};
  for (const n of groupTypes) types[n] = await detail(n);
  const listOf = (t) => (t?.fields || t?.inputFields || t?.enumValues || []).map((x) => x.name);
  const byName = (suffix) => Object.entries(types).find(([n]) => n.endsWith(suffix))?.[1];
  const dims = listOf(byName("Dimensions"));
  const sums = listOf(byName("Sum"));
  const filt = listOf(Object.entries(types).find(([n, t]) => /Filter/.test(n) && t?.inputFields)?.[1]);
  const order = listOf(Object.entries(types).find(([n, t]) => /OrderBy/.test(n) && t?.enumValues)?.[1]);
  schemaFacts = { dims, sums, filt, order };

  const need = {
    "dimension clientRequestPath": dims.includes("clientRequestPath"),
    "dimension clientCountryName": dims.includes("clientCountryName"),
    "dimension clientDeviceType": dims.includes("clientDeviceType"),
    "dimension clientRefererHost": dims.includes("clientRefererHost"),
    "dimension cacheStatus": dims.includes("cacheStatus"),
    "sum visits": sums.includes("visits"),
    "sum edgeResponseBytes": sums.includes("edgeResponseBytes"),
    "filter requestSource": filt.includes("requestSource"),
    "filter clientRequestHTTPMethodName": filt.includes("clientRequestHTTPMethodName"),
    "filter edgeResponseStatus": filt.includes("edgeResponseStatus"),
    "filter edgeResponseContentTypeName": filt.includes("edgeResponseContentTypeName"),
    "filter clientRequestPath_like": filt.includes("clientRequestPath_like"),
    "filter datetime_geq / datetime_lt": filt.includes("datetime_geq") && filt.includes("datetime_lt"),
    "orderBy count_DESC": order.includes("count_DESC"),
    "orderBy sum_visits_DESC": order.includes("sum_visits_DESC"),
  };
  for (const [k, v] of Object.entries(need)) log(`  ${mark(v)} ${k}`);
  log(`  (all dimensions: ${dims.join(", ")})`);
  log(`  (all sums: ${sums.join(", ")})`);
}

// ── 2. plan limits ──────────────────────────────────────────────────────────
log("\n== 2. DATASET LIMITS REPORTED BY CLOUDFLARE ==");
const settingsRes = await gql(
  `query($z:String!){ viewer { zones(filter:{zoneTag:$z}) { settings { httpRequestsAdaptiveGroups { enabled maxDuration maxNumberOfFields maxPageSize notOlderThan } } } } }`,
  { z: zoneId }
);
log(settingsRes.ok ? JSON.stringify(settingsRes.data.viewer.zones[0]?.settings?.httpRequestsAdaptiveGroups ?? null) : `not exposed: ${settingsRes.reason}`);

// ── 3. window probing ───────────────────────────────────────────────────────
log("\n== 3. WHICH WINDOWS THE PLAN ACCEPTS (same page-view query, 1 row) ==");
for (const [label, key] of [["1 day", "today"], ["7 days", "7d"], ["30 days", "30d"]]) {
  const w = computeWindow(key);
  const q = buildQueries(w, zoneId).overview;
  const r = await gql(q.query, q.variables);
  log(`  ${label.padEnd(8)} ${r.ok ? "accepted" : "REJECTED: " + r.reason}`);
}
{
  const w = computeWindow("today", new Date(Date.now() - 2 * 86400000)); // a 24h window ending 2 days ago
  const q = buildQueries(w, zoneId).overview;
  const r = await gql(q.query, q.variables);
  log(`  24h window ending 2 days ago: ${r.ok ? "accepted" : "REJECTED: " + r.reason}  (tells us how far back data goes)`);
}

// ── 4. production queries -> fixtures ───────────────────────────────────────
const win = computeWindow(range);
log(`\n== 4. PRODUCTION QUERIES, range=${win.timeRange} ==`);
log(`  window ${win.since} -> ${win.until}  (previous ${win.prevSince} -> ${win.prevUntil})`);
const queries = buildQueries(win, zoneId);
const raw = {};
for (const name of QUERY_NAMES) {
  const r = await gql(queries[name].query, queries[name].variables);
  if (r.ok && r.data?.viewer?.zones?.[0]) {
    raw[name] = { ok: true, zone: r.data.viewer.zones[0] };
    const z = r.data.viewer.zones[0];
    const rows = Object.fromEntries(Object.entries(z).map(([k, v]) => [k, Array.isArray(v) ? v.length : "?"]));
    log(`  ${name.padEnd(10)} ok   rows: ${JSON.stringify(rows)}`);
  } else {
    raw[name] = { ok: false, reason: r.ok ? "Zone not found" : r.reason };
    log(`  ${name.padEnd(10)} FAILED: ${raw[name].reason}`);
  }
}

// ── 5. independent cross-check ──────────────────────────────────────────────
log("\n== 5. CROSS-CHECK: Cloudflare's own daily rollup (httpRequests1dGroups) ==");
const d0 = win.since.slice(0, 10);
const d1 = win.until.slice(0, 10);
const cross = await gql(
  `query($z:String!,$a:Date!,$b:Date!){ viewer { zones(filter:{zoneTag:$z}) {
     httpRequests1dGroups(filter:{date_geq:$a,date_leq:$b}, limit:40, orderBy:[date_ASC]) {
       dimensions{date} sum{requests pageViews cachedRequests bytes cachedBytes} uniq{uniques} } } } }`,
  { z: zoneId, a: d0, b: d1 }
);
let crossRows = null;
if (cross.ok) {
  crossRows = cross.data.viewer.zones[0]?.httpRequests1dGroups ?? [];
  const tot = crossRows.reduce(
    (s, r) => ({
      requests: s.requests + r.sum.requests,
      pageViews: s.pageViews + r.sum.pageViews,
      cachedRequests: s.cachedRequests + r.sum.cachedRequests,
      bytes: s.bytes + r.sum.bytes,
      cachedBytes: s.cachedBytes + r.sum.cachedBytes,
    }),
    { requests: 0, pageViews: 0, cachedRequests: 0, bytes: 0, cachedBytes: 0 }
  );
  log(`  UTC days ${d0}..${d1} (whole days, so it will not match a rolling window exactly)`);
  log(`  requests=${tot.requests} pageViews=${tot.pageViews} cacheRatio(requests)=${tot.requests ? ((tot.cachedRequests / tot.requests) * 100).toFixed(1) : "n/a"}% cacheRatio(bytes)=${tot.bytes ? ((tot.cachedBytes / tot.bytes) * 100).toFixed(1) : "n/a"}%`);
  log(`  daily uniques: ${crossRows.map((r) => `${r.dimensions.date}:${r.uniq.uniques}`).join(" ")}`);
} else {
  log(`  not available: ${cross.reason}`);
}

// ── write fixture ───────────────────────────────────────────────────────────
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "__fixtures__", "analytics");
fs.mkdirSync(dir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const file = path.join(dir, `real-${win.timeRange}-${stamp}.json`);
fs.writeFileSync(
  file,
  JSON.stringify({ meta: { synthetic: false, recordedAt: new Date().toISOString(), window: win, schemaFacts, crossCheckDaily: crossRows }, raw }, null, 1)
);
log(`\nwrote ${path.relative(process.cwd(), file)}  (no token / zone id inside)`);
log(`Next: run the tests (npm test). Every real-*.json is replayed through the same invariants.`);
fs.writeFileSync(path.join(dir, `probe-report-${win.timeRange}-${stamp}.txt`), out.join("\n") + "\n");
