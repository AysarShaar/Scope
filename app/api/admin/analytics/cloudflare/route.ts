import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "@/lib/cloudflare";
import { getDb } from "@/db/client";
import { settings } from "@/db/schema";
import { authenticateRequest } from "@/lib/auth";
import { inArray } from "drizzle-orm";
import { errorMessage } from "@/lib/errors";
import { computeWindow } from "@/lib/analyticsQueries.mjs";
import {
  parseWorkersAdaptive,
  parseR2Adaptive,
  type CloudflareAnalyticsResponse,
} from "@/lib/cloudflareAnalyticsMetrics";

import { can } from "@/lib/permissions";

export const runtime = "nodejs";

const CF_ENDPOINT = "https://api.cloudflare.com/client/v4/graphql";
const CF_TIMEOUT_MS = 15_000;

async function resolveCloudflareCredentials(env: ReturnType<typeof getCloudflareEnv>) {
  // 1. Environment variables
  let apiToken = (
    process.env.CLOUDFLARE_API_TOKEN ||
    (env as unknown as Record<string, string>)?.CLOUDFLARE_API_TOKEN
  )?.trim();
  let zoneId = (
    process.env.CLOUDFLARE_ZONE_ID ||
    (env as unknown as Record<string, string>)?.CLOUDFLARE_ZONE_ID
  )?.trim();
  let accountId = (
    process.env.CLOUDFLARE_ACCOUNT_ID ||
    (env as unknown as Record<string, string>)?.CLOUDFLARE_ACCOUNT_ID
  )?.trim();

  // 2. Auto-discover accountId if apiToken is present but accountId is missing
  if (apiToken && !accountId) {
    try {
      if (zoneId) {
        const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}`, {
          headers: { Authorization: `Bearer ${apiToken}` },
          signal: AbortSignal.timeout(6000),
        });
        const zoneJson = await zoneRes.json().catch(() => null);
        if (zoneJson?.result?.account?.id) {
          accountId = zoneJson.result.account.id;
        }
      }

      if (!accountId) {
        const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts?page=1&per_page=1`, {
          headers: { Authorization: `Bearer ${apiToken}` },
          signal: AbortSignal.timeout(6000),
        });
        const accJson = await accRes.json().catch(() => null);
        if (accJson?.result?.[0]?.id) {
          accountId = accJson.result[0].id;
        }
      }

      // Persist discovered accountId in DB settings
      if (accountId && env?.DB) {
        const db = getDb(env.DB);
        const now = new Date().toISOString();
        await db
          .insert(settings)
          .values({ key: "cf_account_id", value: accountId, updatedAt: now })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: accountId, updatedAt: now },
          })
          .catch(() => {});
      }
    } catch {
      // ignore discovery failure
    }
  }

  return { apiToken, zoneId, accountId };
}

async function runGraphQL(
  apiToken: string,
  query: string,
  variables: Record<string, string>
) {
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
    return { ok: true, data: json.data };
  } catch (e) {
    return { ok: false, reason: errorMessage(e) || "Request to Cloudflare failed" };
  }
}

export async function GET(request: NextRequest) {
  const env = getCloudflareEnv();

  // Check analytics.view permission
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: يرجى تسجيل الدخول للوصول إلى تحليلات Cloudflare." },
      { status: 401 }
    );
  }
  if (!can(auth, "analytics.view")) {
    return NextResponse.json(
      { success: false, error: "صلاحية مرفوضة: ليس لديك صلاحية عرض تحليلات Cloudflare." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const win = computeWindow(searchParams.get("timeRange") || "today");
  const { apiToken, zoneId, accountId } = await resolveCloudflareCredentials(env);
  const noStore = { headers: { "Cache-Control": "no-store" } };

  const diagnostics = {
    hasToken: Boolean(apiToken),
    hasAccountId: Boolean(accountId),
    hasZoneId: Boolean(zoneId),
    accountId: accountId ? `${accountId.slice(0, 6)}…${accountId.slice(-4)}` : undefined,
  };

  // Missing credentials
  if (!apiToken || !accountId) {
    const reason = !apiToken
      ? "مفتاح Cloudflare API Token غير متوفر. يرجى إعداده في البيئة أو قاعدة البيانات."
      : "معرّف الحساب Account ID غير متوفر. تتطلب تحليلات Workers و R2 نطاق الحساب (Account Tag).";

    const body: CloudflareAnalyticsResponse = {
      success: true,
      configured: false,
      diagnostics,
      window: {
        timeRange: win.timeRange,
        since: win.since,
        until: win.until,
      },
      generatedAt: new Date().toISOString(),
      workers: { status: "unavailable", reason },
      r2: { status: "unavailable", reason },
    };
    return NextResponse.json(body, noStore);
  }

  const variables = {
    accountTag: accountId,
    since: win.since,
    until: win.until,
  };

  // 1. Workers Invocations Query
  const workersQuery = `
    query WorkersAnalytics($accountTag: String!, $since: String!, $until: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          workersInvocationsAdaptive(
            filter: { datetime_geq: $since, datetime_lt: $until }
            limit: 1000
          ) {
            sum {
              requests
              errors
              subrequests
            }
            quantiles {
              cpuTimeP50
              cpuTimeP99
            }
            dimensions {
              status
              scriptName
            }
          }
        }
      }
    }
  `;

  // 2. R2 Operations Query
  const r2OpsQuery = `
    query R2Operations($accountTag: String!, $since: String!, $until: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          r2OperationsAdaptiveGroups(
            filter: { datetime_geq: $since, datetime_lt: $until }
            limit: 1000
          ) {
            dimensions {
              actionType
              actionStatus
              bucketName
            }
            sum {
              requests
            }
          }
        }
      }
    }
  `;

  // 3. R2 Bandwidth Query (Data Volume)
  const r2BandwidthQuery = `
    query R2Bandwidth($accountTag: String!, $since: String!, $until: String!) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          r2BandwidthUsageAdaptiveGroups(
            filter: { datetime_geq: $since, datetime_lt: $until }
            limit: 100
          ) {
            dimensions {
              bucketName
            }
            sum {
              uploadBytes
              downloadBytes
            }
          }
        }
      }
    }
  `;

  // Run in parallel
  const [workersRaw, r2OpsRaw, r2BwRaw] = await Promise.all([
    runGraphQL(apiToken, workersQuery, variables),
    runGraphQL(apiToken, r2OpsQuery, variables),
    runGraphQL(apiToken, r2BandwidthQuery, variables),
  ]);

  const workers = parseWorkersAdaptive(workersRaw);
  const r2 = parseR2Adaptive(r2OpsRaw, r2BwRaw);

  const body: CloudflareAnalyticsResponse = {
    success: true,
    configured: true,
    diagnostics,
    window: {
      timeRange: win.timeRange,
      since: win.since,
      until: win.until,
    },
    generatedAt: new Date().toISOString(),
    workers,
    r2,
  };

  return NextResponse.json(body, noStore);
}
