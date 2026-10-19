import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCloudflareEnv } from "../../../../../lib/cloudflare";
import { getDb } from "../../../../../db/client";
import { articles } from "../../../../../db/schema";
import { authenticateRequest } from "../../../../../lib/auth";
import { errorMessage } from "../../../../../lib/errors";
import { can } from "../../../../../lib/permissions";

type IdContext = { params: Promise<{ id: string }> };

/**
 * Turns the "special" flag of an article on or off. The newest published special article is the one
 * shown in the home page's tall hero box.
 */
export async function PUT(request: NextRequest, { params }: IdContext) {
  const { id } = await params;
  const env = getCloudflareEnv();

  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: يجب تسجيل الدخول" },
      { status: 401 },
    );
  }
  if (!can(auth, "articles.set_special")) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: ليس لديك صلاحية تمييز المقالات كتغطية خاصة" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as { isSpecial?: unknown } | null;
  if (typeof body?.isSpecial !== "boolean") {
    return NextResponse.json(
      { success: false, error: "الحقل isSpecial مطلوب (true أو false)" },
      { status: 400 },
    );
  }

  if (!env?.DB) {
    return NextResponse.json(
      { success: false, error: "D1 binding غير متوفر." },
      { status: 503 },
    );
  }

  try {
    const db = getDb(env.DB);
    const existing = await db
      .select({ id: articles.id })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);
    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "المقال غير موجود" },
        { status: 404 },
      );
    }

    await db
      .update(articles)
      .set({ isSpecial: body.isSpecial, updatedAt: new Date().toISOString() })
      .where(eq(articles.id, id));

    return NextResponse.json({ success: true, isSpecial: body.isSpecial });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(err) || "خطأ في الخادم" },
      { status: 500 },
    );
  }
}
