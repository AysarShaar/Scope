import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../../lib/cloudflare";
import { getDb } from "../../../../db/client";
import { programs, episodes } from "../../../../db/schema";
import { eq, desc } from "drizzle-orm";
import { authenticateRequest } from "../../../../lib/auth";
import { extractYouTubeId } from "../../../../lib/youtube";
import { rowToShow } from "../../../../lib/server/programMapper";
import { errorMessage } from '../../../../lib/errors';
import { withEdgeCache } from "../../../../lib/server/edgeCache";
import { can } from "../../../../lib/permissions";

type IdContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: IdContext) {
  return withEdgeCache(request, 120, () => getProgram(context));
}

async function getProgram({ params }: IdContext) {
  try {
    const { id } = await params;
    const env = getCloudflareEnv();

    if (env?.DB) {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(programs)
        .where(eq(programs.id, id))
        .limit(1);

      if (rows[0]) {
        let episodeRows: (typeof episodes.$inferSelect)[] = [];
        try {
          episodeRows = await db
            .select()
            .from(episodes)
            .where(eq(episodes.programId, id))
            .orderBy(desc(episodes.date), desc(episodes.createdAt));
        } catch {}
        const show = rowToShow(rows[0], episodeRows);

        return NextResponse.json({ success: true, data: show });
      }
      return NextResponse.json(
        { success: false, error: "البرنامج غير موجود" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر في هذا التشغيل. لا يمكن قراءة البرنامج بدون قاعدة البيانات.",
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
        {
          success: false,
          error: "غير مصرح: رمز المصادقة غير صحيح أو غير متوفر",
        },
        { status: 401 },
      );
    }

    if (!can(auth, "programs.manage")) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: ليس لديك صلاحية تعديل البرامج",
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

    if (body.youtubeId !== undefined && body.youtubeId !== null) {
      body.youtubeId =
        extractYouTubeId(body.youtubeId) || body.youtubeId.trim();
    }

    if (env?.DB) {
      const db = getDb(env.DB);
      const existingRows = await db
        .select()
        .from(programs)
        .where(eq(programs.id, id))
        .limit(1);

      const existing = existingRows[0];
      if (!existing) {
        return NextResponse.json(
          { success: false, error: "البرنامج غير موجود" },
          { status: 404 },
        );
      }

      let existingEpisodes = [];
      try {
        if (existing.episodes) existingEpisodes = JSON.parse(existing.episodes);
      } catch {}

      const cleanYt =
        body.youtubeId !== undefined ? body.youtubeId : existing.youtubeId;

      let newEpisodes =
        body.episodes !== undefined ? body.episodes : existingEpisodes;

      if (body.episodes === undefined && cleanYt) {
        if (newEpisodes.length > 0) {
          newEpisodes[0] = {
            ...newEpisodes[0],
            youtubeId: cleanYt,
            title:
              body.latestEpisode ||
              newEpisodes[0].title ||
              existing.latestEpisode ||
              existing.title,
          };
        } else {
          newEpisodes = [
            {
              id: `ep-${Date.now()}`,
              title:
                body.latestEpisode ||
                existing.latestEpisode ||
                existing.title ||
                "الحلقة الرئيسية",
              youtubeId: cleanYt,
              date: new Date().toLocaleDateString("ar-EG"),
              description: body.description || existing.description || "",
            },
          ];
        }
      }

      const episodesJson = JSON.stringify(newEpisodes);
      const episodeCount = newEpisodes.length;
      const latestEpisode =
        body.latestEpisode !== undefined
          ? body.latestEpisode
          : newEpisodes[0]?.title || existing.latestEpisode;

      const now = new Date().toISOString();

      const updateData: Partial<typeof programs.$inferInsert> = {
        updatedAt: now,
      };
      if (body.title !== undefined) updateData.title = body.title.trim();
      if (body.subtitle !== undefined)
        updateData.subtitle = body.subtitle?.trim() || null;
      if (body.description !== undefined)
        updateData.description = body.description?.trim() || null;
      if (body.host !== undefined) updateData.host = body.host?.trim() || null;
      if (body.imageType !== undefined) updateData.imageType = body.imageType;
      if (body.imageUrl !== undefined)
        updateData.imageUrl = body.imageUrl?.trim() || null;
      updateData.episodeCount = episodeCount;
      updateData.latestEpisode = latestEpisode;
      updateData.youtubeId = cleanYt || null;
      updateData.episodes = episodesJson;

      await db.update(programs).set(updateData).where(eq(programs.id, id));

      return NextResponse.json({
        success: true,
        message: "تم تحديث البرنامج وحلقاته بنجاح",
        id,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن تحديث البرنامج بدون اتصال قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) || "خطأ في التحديث" },
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
        {
          success: false,
          error: "غير مصرح: رمز المصادقة غير صحيح أو غير متوفر",
        },
        { status: 401 },
      );
    }

    if (!can(auth, "programs.manage")) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: ليس لديك صلاحية حذف البرامج",
        },
        { status: 403 },
      );
    }

    if (env?.DB) {
      const db = getDb(env.DB);
      await db.delete(programs).where(eq(programs.id, id));
      return NextResponse.json({
        success: true,
        message: "تم حذف البرنامج بنجاح",
        id,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن حذف البرنامج بدون اتصال قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: errorMessage(error) || "خطأ في الحذف" },
      { status: 500 },
    );
  }
}
