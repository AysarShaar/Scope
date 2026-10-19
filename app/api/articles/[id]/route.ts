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
import { can } from "../../../../lib/permissions";


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

  const canEditAny = can(auth, "articles.edit_any");
  const canApprove = can(auth, "articles.approve");
  const canPublishDirect = can(auth, "articles.publish_direct");
  const canSetSpecial = can(auth, "articles.set_special");

  try {
    const body: Partial<ScopeArticle> & { status?: string } =
      await request.json();
    const now = new Date().toISOString();

    if (!env?.DB) {
      return NextResponse.json(
        {
          success: false,
          error:
            "D1 binding غير متوفر. لا يمكن تحديث المقال بدون اتصال قاعدة البيانات.",
        },
        { status: 503 },
      );
    }

    const db = getDb(env.DB);
    const existing = await db
      .select({ editorId: articles.editorId, status: articles.status, isSpecial: articles.isSpecial })
      .from(articles)
      .where(eq(articles.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "المقال غير موجود" },
        { status: 404 },
      );
    }

    // (ج) Status whitelist: pending and published only
    if (body.status !== undefined && body.status !== "pending" && body.status !== "published") {
      return NextResponse.json(
        {
          success: false,
          error: "قيمة الحالة غير صالحة، الحالات المسموحة: pending أو published فقط",
        },
        { status: 400 },
      );
    }

    const currentArticle = existing[0];
    const isOwner = Boolean(
      currentArticle.editorId &&
      auth.editorId &&
      currentArticle.editorId === auth.editorId,
    );

    // (أ) Non-owner permission check:
    // If not owner: allowed if caller has articles.edit_any,
    // OR caller has articles.approve AND request only changes status (all other fields ignored)
    const isStatusOnlyReviewer =
      !isOwner &&
      !canEditAny &&
      canApprove &&
      body.status !== undefined;

    if (!isOwner && !canEditAny && !isStatusOnlyReviewer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "غير مصرح: يمكنك فقط تعديل المقالات التابعة لحسابك، أو امتلاك صلاحية تعديل أي مقال",
        },
        { status: 403 },
      );
    }

    // (ب) Handle status change and approval permissions:
    let updateStatus: string | undefined = undefined;
    if (body.status !== undefined && body.status !== currentArticle.status) {
      if (body.status === "published") {
        if (isOwner) {
          // Self-approval rule: author cannot approve own article unless they possess articles.publish_direct
          if (!canPublishDirect) {
            return NextResponse.json(
              {
                success: false,
                error: "غير مصرح: لا يمكنك اعتماد مقالك الخاص إلا إذا كنت تملك صلاحية النشر المباشر",
              },
              { status: 403 },
            );
          }
          updateStatus = "published";
        } else {
          // Reviewer approving someone else's article:
          if (canApprove || canPublishDirect) {
            updateStatus = "published";
          }
          // If neither, ignore status silently
        }
      } else if (body.status === "pending") {
        // Changing to pending: allowed for owner or reviewer; otherwise ignored silently
        if (isOwner || canApprove || canPublishDirect) {
          updateStatus = "pending";
        }
      }
    }

    // Special article flag check:
    // If user lacks articles.set_special, ignore isSpecial silently without rejection
    let updateSpecial: boolean | undefined = undefined;
    if (body.isSpecial !== undefined && Boolean(body.isSpecial) !== Boolean(currentArticle.isSpecial)) {
      if (canSetSpecial) {
        updateSpecial = Boolean(body.isSpecial);
      }
    }

    const updateData: Partial<typeof articles.$inferInsert> = {
      updatedAt: now,
    };

    if (updateStatus !== undefined) {
      updateData.status = updateStatus;
    }

    if (updateSpecial !== undefined) {
      updateData.isSpecial = updateSpecial;
    }

    // If caller is reviewer changing status only (not owner, no edit_any), ignore all content fields!
    if (!isStatusOnlyReviewer) {
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
      if (body.editorId !== undefined && canEditAny)
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
    }

    await db.update(articles).set(updateData).where(eq(articles.id, id));
    return NextResponse.json({
      success: true,
      message: "تم تحديث المقال بنجاح",
    });
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

  if (!can(auth, "articles.delete")) {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح: ليس لديك صلاحية حذف المقالات",
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
