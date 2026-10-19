import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { articles, editors } from "../../../db/schema";
import { eq, desc, asc, and, count, sql } from "drizzle-orm";
import { ScopeArticle } from "../../../data/scopeData";
import { authenticateRequest } from "../../../lib/auth";
import { validateArticleContent } from "../../../lib/articleContent";
import { rowToArticle } from "../../../lib/server/articleMapper";
import { sanitizeArticleDate } from "../../../lib/dates";
import { errorMessage } from '../../../lib/errors';
import { buildMatchQuery } from "../../../lib/search";
import { withEdgeCache } from "../../../lib/server/edgeCache";
import { generateSemanticId } from "../../../lib/semanticId";
import { can } from "../../../lib/permissions";


// Public listings are cached briefly at the edge (see lib/server/edgeCache.ts); the admin view (includePending) never is.
export async function GET(request: NextRequest) {
  if (new URL(request.url).searchParams.get("includePending") === "true") {
    return listArticles(request);
  }
  return withEdgeCache(request, 60, () => listArticles(request));
}

async function listArticles(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const search = searchParams.get("search")?.trim() || undefined;
  const fromDate = searchParams.get("from") || searchParams.get("startDate") || searchParams.get("fromDate") || undefined;
  const toDate = searchParams.get("to") || searchParams.get("endDate") || searchParams.get("toDate") || undefined;
  const exactDate = searchParams.get("date") || searchParams.get("exactDate") || undefined;
  const author = searchParams.get("author") || undefined;
  const statusParam = searchParams.get("status") || undefined;
  const specialParam = searchParams.get("special") || searchParams.get("isSpecial");
  const sortParam = searchParams.get("sort") === "asc" ? "asc" : "desc";
  const isFull = searchParams.get("full") === "true";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const env = getCloudflareEnv();

  const rawIncludePending = searchParams.get("includePending") === "true";
  let includePending = false;
  if (rawIncludePending) {
    const auth = await authenticateRequest(request, env);
    includePending = auth.isValid;
  }

  const maxLimit = includePending ? 1000 : 100;
  const limit = Math.min(
    maxLimit,
    Math.max(1, parseInt(searchParams.get("limit") || "12", 10)),
  );
  const offset = (page - 1) * limit;

  if (env?.DB) {
    try {
      const db = getDb(env.DB);

      const conditions = [];
      if (!includePending) {
        conditions.push(eq(articles.status, "published"));
      } else if (statusParam && statusParam !== "all") {
        conditions.push(eq(articles.status, statusParam));
      }

      if (category && category !== "home" && category !== "all") {
        conditions.push(eq(articles.categorySlug, category));
      }

      if (author && author !== "all") {
        conditions.push(eq(articles.authorName, author));
      }

      if (fromDate) {
        conditions.push(sql`date(${articles.createdAt}) >= date(${fromDate})`);
      }
      if (toDate) {
        conditions.push(sql`date(${articles.createdAt}) <= date(${toDate})`);
      }
      if (exactDate && exactDate !== "all") {
        conditions.push(sql`date(${articles.createdAt}) = date(${exactDate})`);
      }

      if (specialParam === "true") {
        conditions.push(eq(articles.isSpecial, true));
      } else if (specialParam === "false") {
        conditions.push(eq(articles.isSpecial, false));
      }

      if (search) {
        // Full-text index (db/migrations/0012_articles_fts.sql); nothing searchable means no results.
        const match = buildMatchQuery(search);
        conditions.push(
          match
            ? sql`${articles.id} IN (SELECT id FROM articles_fts WHERE articles_fts MATCH ${match})`
            : sql`0`,
        );
      }

      const where = conditions.length > 0 ? and(...conditions) : undefined;
      const orderExpr = sortParam === "asc" ? asc(articles.createdAt) : desc(articles.createdAt);

      const querySelect = isFull
        ? db.select().from(articles)
        : db
            .select({
              id: articles.id,
              title: articles.title,
              subtitle: articles.subtitle,
              category: articles.category,
              categorySlug: articles.categorySlug,
              date: articles.date,
              imageType: articles.imageType,
              imageUrl: articles.imageUrl,
              caption: articles.caption,
              authorName: articles.authorName,
              authorRole: articles.authorRole,
              authorAvatar: articles.authorAvatar,
              editorId: articles.editorId,
              status: articles.status,
              isSpecial: articles.isSpecial,
              createdAt: articles.createdAt,
            })
            .from(articles);

      const queryPromise = querySelect
        .where(where)
        .orderBy(orderExpr)
        .limit(limit)
        .offset(offset);
      const totalPromise = db.select({ count: count() }).from(articles).where(where);
      const pendingPromise = includePending
        ? db.select({ count: count() }).from(articles).where(eq(articles.status, "pending"))
        : Promise.resolve([{ count: 0 }]);

      const [rows, totalRows, pendingRows] = await Promise.all([
        queryPromise,
        totalPromise,
        pendingPromise,
      ]);

      const total = totalRows[0]?.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));
      const pendingCount = pendingRows?.[0]?.count ?? 0;

      const cacheHeader = includePending
        ? "no-store, no-cache, must-revalidate"
        : "public, s-maxage=60, stale-while-revalidate=300";

      const mapped = rows.map((r) => rowToArticle(r, isFull));
      return NextResponse.json(
        {
          success: true,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasMore: page < totalPages,
          },
          meta: {
            pendingCount: includePending ? pendingCount : 0,
          },
          count: rows.length,
          articles: mapped,
          data: mapped,
        },
        {
          headers: {
            "Cache-Control": cacheHeader,
          },
        },
      );
    } catch (err) {
      console.error("[articles GET] Drizzle error:", err);
    }
  }

  return NextResponse.json(
    {
      success: false,
      error:
        "D1 binding غير متوفر في هذا التشغيل. يرجى تفعيل bindings المحلية أو إعداد Cloudflare env.",
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
    const canPublishDirectly = can(auth, "articles.publish_direct");
    const canSetSpecial = can(auth, "articles.set_special");
    const editorId = auth.editorId || null;

    const body: Partial<ScopeArticle> & { status?: string } =
      await request.json();

    if (!body.title || !body.category || !body.categorySlug) {
      return NextResponse.json(
        {
          success: false,
          error: "الحقول المطلوبة: title، category، categorySlug",
        },
        { status: 400 },
      );
    }

    const contentCheck = validateArticleContent(body.content);
    if (!contentCheck.ok) {
      return NextResponse.json(
        { success: false, error: contentCheck.error },
        { status: 400 },
      );
    }

    let id: string | undefined;
    if (body.id && typeof body.id === 'string') {
      const sanitized = body.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 60);
      if (sanitized.length >= 3) {
        if (env?.DB) {
          try {
            const db = getDb(env.DB);
            const existing = await db
              .select({ id: articles.id })
              .from(articles)
              .where(eq(articles.id, sanitized))
              .limit(1);
            if (existing.length === 0) {
              id = sanitized;
            }
          } catch {
            id = sanitized;
          }
        } else {
          id = sanitized;
        }
      }
    }

    if (!id) {
      id = await generateSemanticId({
        text: body.title,
        prefix: 'article',
        env,
      });
    }
    const now = new Date().toISOString();

    let finalAuthorName = body.author?.name ?? null;
    let finalAuthorRole = body.author?.role ?? null;
    let finalAuthorAvatar = body.authorAvatar ?? null;
    let finalEditorId = canPublishDirectly ? (body.editorId ?? null) : (editorId ?? null);

    if (!canPublishDirectly) {
      if (body.author?.name && body.author.name.trim()) {
        finalAuthorName = body.author.name.trim();
        finalAuthorRole = body.author.role?.trim() || null;
        if (body.authorAvatar !== undefined) {
          finalAuthorAvatar = body.authorAvatar;
        }
        if (body.editorId) {
          finalEditorId = body.editorId;
        }
      } else if (env?.DB && editorId) {
        try {
          const db = getDb(env.DB);
          const edRow = await db
            .select()
            .from(editors)
            .where(eq(editors.id, editorId))
            .limit(1);
          if (edRow[0]) {
            finalAuthorName = edRow[0].name;
            finalAuthorRole = edRow[0].role;
            finalAuthorAvatar = edRow[0].avatarUrl ?? finalAuthorAvatar;
          } else if (auth.editorName) {
            finalAuthorName = auth.editorName;
          }
        } catch {
          if (auth.editorName) finalAuthorName = auth.editorName;
        }
      } else if (auth.editorName) {
        finalAuthorName = auth.editorName;
      }
    }

    const newArticle = {
      id,
      title: body.title,
      subtitle: body.subtitle ?? null,
      category: body.category,
      categorySlug: body.categorySlug,
      date: sanitizeArticleDate(body.date),
      imageType: body.imageType || "deep_investigation",
      imageUrl: body.imageUrl ?? null,
      caption: body.caption ?? null,
      authorName: finalAuthorName,
      authorRole: finalAuthorRole,
      authorAvatar: finalAuthorAvatar,
      editorId: finalEditorId,
      content: contentCheck.value ? JSON.stringify(contentCheck.value) : null,
      status: canPublishDirectly ? body.status || "published" : "pending",
      isSpecial: canSetSpecial ? Boolean(body.isSpecial) : false,
      createdAt: now,
      updatedAt: now,
    };

    if (env?.DB) {
      const db = getDb(env.DB);
      await db.insert(articles).values(newArticle);
      return NextResponse.json(
        { success: true, message: "تم إنشاء المقال بنجاح", id },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن إنشاء المقال بدون اتصال قاعدة البيانات.",
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
