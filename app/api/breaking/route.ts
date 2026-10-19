import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { breaking } from "../../../db/schema";
import { desc } from "drizzle-orm";
import { BreakingItem } from "../../../data/scopeData";
import { authenticateRequest } from "../../../lib/auth";
import { errorMessage } from '../../../lib/errors';
import { withEdgeCache } from "../../../lib/server/edgeCache";
import { can } from "../../../lib/permissions";

function rowToBreaking(row: typeof breaking.$inferSelect): BreakingItem {
  return {
    id: row.id,
    title: row.title,
  };
}

export async function GET(request: NextRequest) {
  return withEdgeCache(request, 30, () => listBreaking(request));
}

async function listBreaking(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "12", 10));

  const env = getCloudflareEnv();

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(breaking)
        .orderBy(desc(breaking.createdAt))
        .limit(limit);

      return NextResponse.json(
        {
          success: true,
          count: rows.length,
          data: rows.map(rowToBreaking),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
          },
        },
      );
    } catch (err) {
      console.error("[breaking GET] Drizzle error:", err);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "D1 binding غير متوفر في هذا التشغيل. لا يمكن قراءة الأخبار العاجلة بدون قاعدة البيانات.",
    },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
  try {
    const env = getCloudflareEnv();
    const auth = await authenticateRequest(request, env);
    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: "غير مصرح: يرجى تسجيل الدخول للمتابعة" },
        { status: 401 },
      );
    }
    if (!can(auth, "breaking.manage")) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: ليس لديك صلاحية إدارة الأخبار العاجلة",
        },
        { status: 403 },
      );
    }

    const body: { title: string } =
      await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: "العنوان مطلوب" },
        { status: 400 },
      );
    }

    const now = new Date();
    const id = `breaking_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    if (env?.DB) {
      const db = getDb(env.DB);
      await db.insert(breaking).values({
        id,
        title: body.title,
        createdAt: now.toISOString(),
      });
      return NextResponse.json(
        {
          success: true,
          message: "تم إضافة الخبر العاجل بنجاح",
          data: { id, title: body.title },
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن إنشاء الخبر العاجل بدون اتصال قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) || "خطأ في الخادم" },
      { status: 500 },
    );
  }
}
