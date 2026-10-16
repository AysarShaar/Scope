import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { getDb } from "@/db/client";
import { articles, settings } from "@/db/schema";
import { authenticateRequest } from "@/lib/auth";
import { inArray } from "drizzle-orm";
import { errorMessage } from "@/lib/errors";
import { buildQueries, computeWindow, QUERY_NAMES } from "@/lib/analyticsQueries.mjs";
import {
  buildSections,
  type AnalyticsResponse,
  type ArticleMeta,
  type ArticleRowWithMeta,
  type ArticlesWithMeta,
  type RawResult,
  type RawZones,
  type Sections,
} from "@/lib/analyticsMetrics";

export const runtime = "nodejs";

// Metric definitions, filters and unverified assumptions: see ./METRICS.md

const CF_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const CF_TIMEOUT_MS = 15_000;

async function resolveCredentials(env: ReturnType<typeof getCloudflareEnv>) {
  // 1. Check environment variables
  let apiToken = (
    process.env.CLOUDFLARE_API_TOKEN ||
    (env as unknown as Record<string, string>)?.CLOUDFLARE_API_TOKEN
  )?.trim();
  let zoneId = (
    process.env.CLOUDFLARE_ZONE_ID ||
    (env as unknown as Record<string, string>)?.CLOUDFLARE_ZONE_ID
  )?.trim();
  let tokenSource: "environment" | "database" | "none" = apiToken ? "environment" : "none";

  // 2. If not in environment, check DB settings table
  if ((!apiToken || !zoneId) && env?.DB) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(settings)
        .where(inArray(settings.key, ["cf_api_token", "cf_zone_id"]));

      for (const r of rows) {
        if (r.key === "cf_api_token" && r.value) {
          apiToken = r.value.trim();
          tokenSource = "database";
        }
        if (r.key === "cf_zone_id" && r.value) {
          zoneId = r.value.trim();
        }
      }
    } catch {
      // ignore db error
    }
  }

  return { apiToken, zoneId, tokenSource };
}


/**
 * One Cloudflare query = one independent result. A failure (e.g. a field the
 * plan does not expose) only makes THAT section unavailable, with the reason;
 * it never zeroes the page or substitutes made-up numbers.
 */
async function runQuery(
  apiToken: string,
  query: string,
  variables: Record<string, string>
): Promise<RawResult> {
  try {
    const res = await fetch(CF_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(CF_TIMEOUT_MS),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || (json?.errors && json.errors.length > 0)) {
      const msg =
        json?.errors?.map((e: { message: string }) => e.message).join("; ") ||
        `Cloudflare HTTP ${res.status}`;
      return { ok: false, reason: msg };
    }
    const zone = json?.data?.viewer?.zones?.[0];
    if (!zone) return { ok: false, reason: "Zone not found for this Zone ID / token" };
    return { ok: true, zone };
  } catch (e) {
    return { ok: false, reason: errorMessage(e) || "Request to Cloudflare failed" };
  }
}

const unavailable = (reason: string): RawResult => ({ ok: false, reason });

/** Attach titles etc. D1 allows 100 bound parameters; we pass at most 80 ids. */
async function attachArticleMeta(
  env: ReturnType<typeof getCloudflareEnv>,
  art: Sections["articles"]
): Promise<ArticlesWithMeta> {
  if (art.status !== "ok") return art;

  const ids = art.data.rows.map((r) => r.id).slice(0, 80);
  const byId = new Map<string, ArticleMeta>();
  let metadataError: string | undefined;

  if (!env?.DB) {
    metadataError = "Database unavailable: titles could not be resolved";
  } else if (ids.length > 0) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select({
          id: articles.id,
          title: articles.title,
          subtitle: articles.subtitle,
          category: articles.category,
          categorySlug: articles.categorySlug,
          imageUrl: articles.imageUrl,
          date: articles.date,
          authorName: articles.authorName,
        })
        .from(articles)
        .where(inArray(articles.id, ids));
      for (const r of rows) byId.set(r.id, r);
    } catch (e) {
      console.error("[analytics] article metadata lookup failed:", e);
      metadataError = errorMessage(e) || "Article lookup failed";
    }
  }

  const rows: ArticleRowWithMeta[] = art.data.rows.map((r) => ({
    ...r,
    path: `/news/${r.id}`,
    meta: byId.get(r.id) ?? null,
  }));
  return { status: "ok", data: { rows, truncated: art.data.truncated, metadataError } };
}

export async function GET(request: NextRequest) {
  const env = getCloudflareEnv();

  // Admin only
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: يجب تسجيل الدخول للوصول إلى لوحة المؤشرات." },
      { status: 401 }
    );
  }
  if (auth.systemRole !== "admin") {
    return NextResponse.json(
      { success: false, error: "صلاحية مرفوضة: لوحة المؤشرات والتحليلات مخصصة لمدير النظام (Admin) فقط." },
      { status: 403 }
    );
  }

  const { searchParams, host } = new URL(request.url);
  const win = computeWindow(searchParams.get("timeRange") || "today");
  const { apiToken, zoneId, tokenSource } = await resolveCredentials(env);
  const noStore = { headers: { "Cache-Control": "no-store" } };

  const diagnostics = { hasToken: Boolean(apiToken), hasZoneId: Boolean(zoneId), tokenSource };

  // No credentials: say so. No demo numbers.
  if (!apiToken || !zoneId) {
    const reason =
      "Cloudflare credentials are not configured (CLOUDFLARE_API_TOKEN / CLOUDFLARE_ZONE_ID, or POST them to this endpoint).";
    const raw = Object.fromEntries(QUERY_NAMES.map((n) => [n, unavailable(reason)])) as RawZones;
    const built = buildSections(raw);
    const body: AnalyticsResponse = {
      success: true,
      configured: false,
      diagnostics,
      window: win,
      generatedAt: new Date().toISOString(),
      sections: { ...built, articles: await attachArticleMeta(env, built.articles) },
    };
    return NextResponse.json(body, noStore);
  }

  const queries = buildQueries(win, zoneId);
  const entries = Object.entries(queries);
  const results = await Promise.all(entries.map(([, q]) => runQuery(apiToken, q.query, q.variables)));
  const raw = Object.fromEntries(entries.map(([name], i) => [name, results[i]])) as RawZones;

  // Own hostnames, so internal navigation is not reported as an outside source.
  const ownHosts = [host.split(":")[0]];
  const built = buildSections(raw, { ownHosts });
  const body: AnalyticsResponse = {
    success: true,
    configured: true,
    diagnostics,
    window: win,
    generatedAt: new Date().toISOString(),
    sections: { ...built, articles: await attachArticleMeta(env, built.articles) },
  };
  return NextResponse.json(body, noStore);
}

// POST: Save credentials directly into DB settings table and test connection
export async function POST(request: NextRequest) {
  const env = getCloudflareEnv();
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid || auth.systemRole !== "admin") {
    return NextResponse.json({ success: false, error: "غير مصرح" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const token = (body?.apiToken || "").trim();
  const zone = (body?.zoneId || "").trim();

  if (!token || !zone) {
    return NextResponse.json(
      { success: false, error: "يرجى تقديم كل من API Token و Zone ID معاً." },
      { status: 400 }
    );
  }

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const now = new Date().toISOString();

      await db
        .insert(settings)
        .values({ key: "cf_api_token", value: token, updatedAt: now })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: token, updatedAt: now },
        });

      await db
        .insert(settings)
        .values({ key: "cf_zone_id", value: zone, updatedAt: now })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: zone, updatedAt: now },
        });

      return NextResponse.json({
        success: true,
        message: "تم حفظ مفاتيح Cloudflare بنجاح في قاعدة البيانات.",
      });
    } catch (e) {
      return NextResponse.json(
        { success: false, error: `فشل الحفظ في قاعدة البيانات: ${errorMessage(e)}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { success: false, error: "قاعدة البيانات غير متوفرة لحفظ المفاتيح." },
    { status: 503 }
  );
}
