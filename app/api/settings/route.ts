import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { settings } from "../../../db/schema";
import { authenticateRequest } from "../../../lib/auth";
import { extractYouTubeId } from "../../../lib/youtube";
import { errorMessage } from '../../../lib/errors';
import { withEdgeCache } from "../../../lib/server/edgeCache";
import { can } from "../../../lib/permissions";

const PUBLIC_SETTINGS_KEYS = new Set(["live_stream_id"]);
const ALLOWED_LIVE_STREAM_KEYS = new Set([
  "live_stream_id",
  "liveStreamId",
  "live_stream_url",
]);

export async function GET(request: NextRequest) {
  // Anonymous visitors only get the public keys; logged-in requests bypass the cache (see edgeCache.ts).
  return withEdgeCache(request, 60, () => readSettings(request));
}

async function readSettings(request: NextRequest) {
  try {
    const env = getCloudflareEnv();

    if (env?.DB) {
      try {
        const db = getDb(env.DB);
        const rows = await db.select().from(settings).all();

        const settingsMap: Record<string, string> = {
          live_stream_id: "",
        };

        for (const r of rows) {
          if (!r?.key) continue;
          if (PUBLIC_SETTINGS_KEYS.has(r.key)) {
            settingsMap[r.key] = r.value;
          }
        }

        return NextResponse.json(
          { success: true, data: settingsMap },
          { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
        );
      } catch (err) {
        console.error("[settings DB read error]:", err);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر في هذا التشغيل. لا يمكن قراءة الإعدادات بدون قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error) || "خطأ في جلب الإعدادات",
        data: { live_stream_id: "" },
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const env = getCloudflareEnv();
    const auth = await authenticateRequest(request, env);

    if (!auth.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: رمز المصادقة غير صحيح أو غير متوفر",
        },
        { status: 401 },
      );
    }

    if (!can(auth, "settings.live_stream")) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: ليس لديك صلاحية تعديل البث المباشر",
        },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "بيانات غير صالحة" },
        { status: 400 },
      );
    }

    const rawEntries: [string, string][] = [];
    if (body.key && body.value !== undefined) {
      rawEntries.push([String(body.key), String(body.value)]);
    } else {
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined && v !== null && typeof v !== "object") {
          rawEntries.push([k, String(v)]);
        }
      }
    }

    if (rawEntries.length === 0) {
      return NextResponse.json(
        { success: false, error: "لم يتم تحديد أي إعدادات للحفظ" },
        { status: 400 },
      );
    }

    // Strict whitelist enforcement: under settings.live_stream, ONLY live stream keys are accepted.
    // Any other key (such as cf_* or arbitrary config) is strictly rejected.
    const normalizedEntries: [string, string][] = [];
    for (const [k, v] of rawEntries) {
      if (!ALLOWED_LIVE_STREAM_KEYS.has(k)) {
        return NextResponse.json(
          {
            success: false,
            error: `المفتاح "${k}" غير مسموح به أو يتطلب صلاحية مخصصة مستقلة.`,
          },
          { status: 400 },
        );
      }
      const val = extractYouTubeId(v) || v.trim();
      normalizedEntries.push(["live_stream_id", val]);
    }

    if (env?.DB) {
      const db = getDb(env.DB);
      const now = new Date().toISOString();

      for (const [k, val] of normalizedEntries) {
        await db
          .insert(settings)
          .values({ key: k, value: val, updatedAt: now })
          .onConflictDoUpdate({
            target: settings.key,
            set: { value: val, updatedAt: now },
          });
      }

      const rows = await db.select().from(settings).all();
      const settingsMap: Record<string, string> = {
        live_stream_id: "",
      };
      for (const r of rows) {
        if (r?.key) settingsMap[r.key] = r.value;
      }

      return NextResponse.json({
        success: true,
        message: "تم حفظ الإعدادات بنجاح",
        data: settingsMap,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن حفظ الإعدادات بدون اتصال قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: errorMessage(error) || "خطأ في حفظ الإعدادات",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
