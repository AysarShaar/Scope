import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../../lib/cloudflare";
import { getDb } from "../../../../db/client";
import { articles } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { ScopeArticle } from "../../../../data/scopeData";
import { authenticateRequest } from "../../../../lib/auth";
import { validateArticleContent } from "../../../../lib/articleContent";
import { rowToArticle } from "../../../../lib/server/articleMapper";
import { sanitizeArticleDate } from "../../../../lib/dates";
import { errorMessage } from '../../../../lib/errors';
import { withEdgeCache } from "../../../../lib/server/edgeCache";


type IdContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: IdContext) {
  return withEdgeCache(request, 120, () => getArticle(request, context));
}

async function getArticle(request: NextRequest, { params }: IdContext) {
  const { id } = await params;
  const env = getCloudflareEnv();

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(articles)
        .where(eq(articles.id, id))
        .limit(1);

      if (!rows[0]) {
        return NextResponse.json(
          { success: false, error: "المقال غير موجود" },
          { status: 404 },
        );
      }

      if (rows[0].status !== "published") {
        const auth = await authenticateRequest(request, env);
        if (!auth.isValid) {
          return NextResponse.json(
            { success: false, error: "المقال غير موجود" },
            { status: 404 },
          );
        }
      }

      const isPublished = rows[0].status === "published";
      const cacheHeader = isPublished
        ? "public, s-maxage=120, stale-while-revalidate=600"
        : "no-store, no-cache, must-revalidate";

      return NextResponse.json(
        {
          success: true,
          data: rowToArticle(rows[0]),
        },
        {
          headers: {
            "Cache-Control": cacheHeader,
          },
        },
      );
    } catch (err) {
      console.error("[articles/[id] GET] Drizzle error:", err);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "D1 binding غير متوفر في هذا التشغيل. لا يمكن قراءة المقال بدون قاعدة البيانات.",
    },
    { status: 503 },
  );
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const env = getCloudflareEnv();
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: يرجى تسجيل الدخول للمتابعة" },
      { status: 401 },
    );
  }
  const canApproveOrPublish =
    auth.systemRole === "admin" || auth.systemRole === "editor_in_chief";

  try {
    const body: Partial<ScopeArticle> & { status?: string } =
      await request.json();
    const now = new Date().toISOString();

    const updateData: Partial<typeof articles.$inferInsert> = {
      updatedAt: now,
    };
    if (body.title !== undefined) updateData.title = body.title;
    if (body.subtitle !== undefined) updateData.subtitle = body.subtitle;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.categorySlug !== undefined)
      updateData.categorySlug = body.categorySlug;
    if (body.date !== undefined) updateData.date = sanitizeArticleDate(body.date);
    if (body.imageType !== undefined) updateData.imageType = body.imageType;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.caption !== undefined) updateData.caption = body.caption;
    if (body.author?.name !== undefined)
      updateData.authorName = body.author.name;
    if (body.author?.role !== undefined)
      updateData.authorRole = body.author.role;
    if (body.authorAvatar !== undefined)
      updateData.authorAvatar = body.authorAvatar;
    if (body.editorId !== undefined)
      updateData.editorId = body.editorId;
    if (body.content !== undefined) {
      const contentCheck = validateArticleContent(body.content);
      if (!contentCheck.ok) {
        return NextResponse.json(
          { success: false, error: contentCheck.error },
          { status: 400 },
        );
      }
      updateData.content = contentCheck.value
        ? JSON.stringify(contentCheck.value)
        : null;
    }
    if (body.status !== undefined && canApproveOrPublish)
      updateData.status = body.status;
    if (body.isSpecial !== undefined && canApproveOrPublish)
      updateData.isSpecial = Boolean(body.isSpecial);

    if (env?.DB) {
      const db = getDb(env.DB);

      if (!canApproveOrPublish) {
        const existing = await db
          .select({ editorId: articles.editorId })
          .from(articles)
          .where(eq(articles.id, id))
          .limit(1);

        if (!existing[0]) {
          return NextResponse.json(
            { success: false, error: "المقال غير موجود" },
            { status: 404 },
          );
        }

        if (
          !existing[0].editorId ||
          !auth.editorId ||
          existing[0].editorId !== auth.editorId
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "غير مصرح: يمكنك فقط تعديل المقالات التابعة لحسابك، وتعديل المقالات العامة مقتصر على رئيس التحرير والمدير",
            },
            { status: 403 },
          );
        }
      }

      await db.update(articles).set(updateData).where(eq(articles.id, id));
      return NextResponse.json({
        success: true,
        message: "تم تحديث المقال بنجاح",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن تحديث المقال بدون اتصال قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const env = getCloudflareEnv();
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: يجب تسجيل الدخول" },
      { status: 401 },
    );
  }

  if (auth.systemRole !== "admin" && auth.systemRole !== "editor_in_chief") {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح: حذف المقالات مقتصر على رئيس التحرير ومدير النظام",
      },
      { status: 403 },
    );
  }

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      await db.delete(articles).where(eq(articles.id, id));
      return NextResponse.json({
        success: true,
        message: "تم حذف المقال بنجاح",
      });
    } catch (err: unknown) {
      return NextResponse.json(
        { success: false, error: errorMessage(err) },
        { status: 500 },
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "D1 binding غير متوفر. لا يمكن حذف المقال بدون اتصال قاعدة البيانات.",
    },
    { status: 503 },
  );
}
