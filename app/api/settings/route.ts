import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { settings } from "../../../db/schema";
import { authenticateRequest } from "../../../lib/auth";
import { extractYouTubeId } from "../../../lib/youtube";
import { errorMessage } from '../../../lib/errors';
import { withEdgeCache } from "../../../lib/server/edgeCache";

const PUBLIC_SETTINGS_KEYS = new Set(["live_stream_id"]);

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

        const auth = await authenticateRequest(request, env);
        const isPrivileged =
          auth.isValid &&
          (auth.systemRole === "admin" || auth.systemRole === "editor_in_chief");

        const settingsMap: Record<string, string> = {
          live_stream_id: "",
        };

        for (const r of rows) {
          if (!r?.key) continue;
          if (isPrivileged || PUBLIC_SETTINGS_KEYS.has(r.key)) {
            settingsMap[r.key] = r.value;
          }
        }

        const cacheHeader = isPrivileged
          ? "no-store, no-cache, must-revalidate"
          : "public, s-maxage=300, stale-while-revalidate=600";

        return NextResponse.json(
          { success: true, data: settingsMap },
          { headers: { "Cache-Control": cacheHeader } },
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

    if (auth.systemRole !== "admin" && auth.systemRole !== "editor_in_chief") {
      return NextResponse.json(
        {
          success: false,
          error:
            "غير مصرح: تعديل الإعدادات مقتصر على رئيس التحرير ومدير النظام",
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

    const entries: [string, string][] = [];
    if (body.key && body.value !== undefined) {
      entries.push([String(body.key), String(body.value)]);
    } else {
      for (const [k, v] of Object.entries(body)) {
        if (v !== undefined && v !== null && typeof v !== "object") {
          entries.push([k, String(v)]);
        }
      }
    }

    if (entries.length === 0) {
      return NextResponse.json(
        { success: false, error: "لم يتم تحديد أي إعدادات للحفظ" },
        { status: 400 },
      );
    }

    if (env?.DB) {
      const db = getDb(env.DB);
      const now = new Date().toISOString();

      for (let [k, val] of entries) {
        if (
          k === "live_stream_id" ||
          k === "liveStreamId" ||
          k === "live_stream_url"
        ) {
          k = "live_stream_id";
          val = extractYouTubeId(val) || val.trim();
        }

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
