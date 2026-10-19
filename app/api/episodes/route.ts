import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { episodes, programs } from "../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { authenticateRequest } from "../../../lib/auth";
import { extractYouTubeId } from "../../../lib/youtube";
import { errorMessage } from '../../../lib/errors';
import { withEdgeCache } from '../../../lib/server/edgeCache';
import { can } from "../../../lib/permissions";

export async function GET(request: NextRequest) {
  return withEdgeCache(request, 60, () => listEpisodes(request));
}

async function listEpisodes(request: NextRequest) {
  try {
    const env = getCloudflareEnv();
    if (!env?.DB) {
      return NextResponse.json(
        { success: false, error: "D1 database binding not available." },
        { status: 503 },
      );
    }

    const db = getDb(env.DB);
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get("programId");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");

    let query = db.select().from(episodes);

    if (programId) {
      const allRows = await db
        .select()
        .from(episodes)
        .where(eq(episodes.programId, programId))
        .orderBy(desc(episodes.date), desc(episodes.createdAt));

      if (pageParam || limitParam) {
        const page = Math.max(1, parseInt(pageParam || "1", 10));
        const limit = Math.max(1, Math.min(50, parseInt(limitParam || "8", 10)));
        const offset = (page - 1) * limit;
        const total = allRows.length;
        const totalPages = Math.ceil(total / limit);
        const paginated = allRows.slice(offset, offset + limit);

        return NextResponse.json({
          success: true,
          count: paginated.length,
          total,
          page,
          totalPages,
          data: paginated,
        });
      }

      return NextResponse.json({
        success: true,
        count: allRows.length,
        total: allRows.length,
        data: allRows,
      });
    }

    const rows = await db
      .select()
      .from(episodes)
      .orderBy(desc(episodes.date), desc(episodes.createdAt));

    return NextResponse.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error: unknown) {
    console.error("Error fetching episodes:", error);
    return NextResponse.json(
      { success: false, error: errorMessage(error) },
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
        { success: false, error: "غير مصرح: رمز المصادقة غير صحيح أو غير متوفر" },
        { status: 401 },
      );
    }

    if (!can(auth, "programs.manage")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح: ليس لديك صلاحية إضافة الحلقات" },
        { status: 403 },
      );
    }

    if (!env?.DB) {
      return NextResponse.json(
        { success: false, error: "D1 database binding not available." },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.programId || !body.title || !body.youtubeId) {
      return NextResponse.json(
        { success: false, error: "يرجى تعبئة جميع الحقول المطلوبة: البرنامج، عنوان الحلقة، ورابط الفيديو" },
        { status: 400 },
      );
    }

    const db = getDb(env.DB);
    const cleanYt = extractYouTubeId(body.youtubeId) || body.youtubeId.trim();
    const episodeId = body.id || `ep-${Date.now()}`;
    const dateStr = body.date || new Date().toISOString().split("T")[0];

    await db.insert(episodes).values({
      id: episodeId,
      programId: body.programId,
      title: body.title.trim(),
      youtubeId: cleanYt,
      date: dateStr,
      description: body.description?.trim() || null,
      episodeNumber: body.episodeNumber ? Number(body.episodeNumber) : null,
      duration: body.duration?.trim() || null,
    });

    const allProgramEpisodes = await db
      .select()
      .from(episodes)
      .where(eq(episodes.programId, body.programId))
      .orderBy(desc(episodes.date), desc(episodes.createdAt));

    await db
      .update(programs)
      .set({
        episodeCount: allProgramEpisodes.length,
        latestEpisode: body.title.trim(),
        youtubeId: cleanYt,
        episodes: JSON.stringify(allProgramEpisodes),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(programs.id, body.programId));

    return NextResponse.json({
      success: true,
      message: "تمت إضافة الحلقة بنجاح",
      data: {
        id: episodeId,
        programId: body.programId,
        title: body.title.trim(),
        youtubeId: cleanYt,
        date: dateStr,
        description: body.description?.trim() || null,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating episode:", error);
    return NextResponse.json(
      { success: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}
