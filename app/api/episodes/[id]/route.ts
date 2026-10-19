import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../../lib/cloudflare";
import { getDb } from "../../../../db/client";
import { episodes, programs } from "../../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { authenticateRequest } from "../../../../lib/auth";
import { extractYouTubeId } from "../../../../lib/youtube";
import { errorMessage } from '../../../../lib/errors';
import { can } from "../../../../lib/permissions";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const env = getCloudflareEnv();
    if (!env?.DB) {
      return NextResponse.json(
        { success: false, error: "D1 database not available" },
        { status: 503 },
      );
    }

    const db = getDb(env.DB);
    const rows = await db
      .select()
      .from(episodes)
      .where(eq(episodes.id, id))
      .limit(1);

    if (!rows[0]) {
      return NextResponse.json(
        { success: false, error: "الحلقة غير موجودة" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const env = getCloudflareEnv();
    const auth = await authenticateRequest(request, env);

    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: "غير مصرح: يرجى تسجيل الدخول للمتابعة" },
        { status: 401 },
      );
    }

    if (!can(auth, "programs.manage")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح لتعديل الحلقة" },
        { status: 403 },
      );
    }

    if (!env?.DB) {
      return NextResponse.json(
        { success: false, error: "D1 database not available" },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, error: "بيانات غير صالحة" },
        { status: 400 },
      );
    }

    const db = getDb(env.DB);
    const existing = await db
      .select()
      .from(episodes)
      .where(eq(episodes.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "الحلقة غير موجودة" },
        { status: 404 },
      );
    }

    const current = existing[0];
    const cleanYt = body.youtubeId
      ? extractYouTubeId(body.youtubeId) || body.youtubeId.trim()
      : current.youtubeId;

    await db
      .update(episodes)
      .set({
        title: body.title !== undefined ? body.title.trim() : current.title,
        youtubeId: cleanYt,
        date: body.date !== undefined ? body.date : current.date,
        description: body.description !== undefined ? body.description.trim() : current.description,
        episodeNumber: body.episodeNumber !== undefined ? Number(body.episodeNumber) : current.episodeNumber,
        duration: body.duration !== undefined ? body.duration : current.duration,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(episodes.id, id));

    return NextResponse.json({
      success: true,
      message: "تم تحديث الحلقة بنجاح",
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
  try {
    const { id } = await params;
    const env = getCloudflareEnv();
    const auth = await authenticateRequest(request, env);

    if (!auth.isValid) {
      return NextResponse.json(
        { success: false, error: "غير مصرح: يرجى تسجيل الدخول للمتابعة" },
        { status: 401 },
      );
    }

    if (!can(auth, "programs.manage")) {
      return NextResponse.json(
        { success: false, error: "غير مصرح بحذف الحلقة" },
        { status: 403 },
      );
    }

    if (!env?.DB) {
      return NextResponse.json(
        { success: false, error: "D1 database not available" },
        { status: 503 },
      );
    }

    const db = getDb(env.DB);
    const existing = await db
      .select()
      .from(episodes)
      .where(eq(episodes.id, id))
      .limit(1);

    if (!existing[0]) {
      return NextResponse.json(
        { success: false, error: "الحلقة غير موجودة" },
        { status: 404 },
      );
    }

    const programId = existing[0].programId;

    await db.delete(episodes).where(eq(episodes.id, id));

    const remainingEpisodes = await db
      .select()
      .from(episodes)
      .where(eq(episodes.programId, programId))
      .orderBy(desc(episodes.date), desc(episodes.createdAt));

    const latest = remainingEpisodes[0];

    await db
      .update(programs)
      .set({
        episodeCount: remainingEpisodes.length,
        latestEpisode: latest ? latest.title : "",
        youtubeId: latest ? latest.youtubeId : undefined,
        episodes: JSON.stringify(remainingEpisodes),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(programs.id, programId));

    return NextResponse.json({
      success: true,
      message: "تم حذف الحلقة بنجاح",
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) },
      { status: 500 },
    );
  }
}
