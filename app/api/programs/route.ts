import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { programs, episodes } from "../../../db/schema";
import { desc } from "drizzle-orm";
import { ScopeShow, ProgramEpisode } from "../../../data/scopeData";
import { rowToShow } from "../../../lib/server/programMapper";
import { authenticateRequest } from "../../../lib/auth";
import { extractYouTubeId } from "../../../lib/youtube";
import { errorMessage } from "../../../lib/errors";
import { withEdgeCache } from "../../../lib/server/edgeCache";
import { can } from "../../../lib/permissions";

const LIST_EPISODES_PREVIEW = 4;

export async function GET(request: NextRequest) {
  return withEdgeCache(request, 120, () => listPrograms());
}

async function listPrograms() {
  try {
    const env = getCloudflareEnv();

    if (env?.DB) {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(programs)
        .orderBy(desc(programs.createdAt));

      let episodeRows: (typeof episodes.$inferSelect)[] = [];
      try {
        episodeRows = await db
          .select()
          .from(episodes)
          .orderBy(desc(episodes.date), desc(episodes.createdAt));
      } catch {}

      const data = (rows || []).map((row) =>
        rowToShow(row, episodeRows, { maxEpisodes: LIST_EPISODES_PREVIEW }),
      );
      return NextResponse.json(
        { success: true, count: data.length, data },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر في هذا التشغيل. لا يمكن قراءة البرامج بدون قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    console.error("Error fetching programs:", error);
    return NextResponse.json({ success: true, count: 0, data: [] });
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

    if (!can(auth, "programs.manage")) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: ليس لديك صلاحية إدارة البرامج والتغطيات",
        },
        { status: 403 },
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !body.title) {
      return NextResponse.json(
        { success: false, error: "عنوان البرنامج حقل مطلوب" },
        { status: 400 },
      );
    }

    const id = body.id || `show-${Date.now()}`;
    const cleanYt = body.youtubeId
      ? extractYouTubeId(body.youtubeId) || body.youtubeId.trim()
      : "";
    const now = new Date().toISOString();

    const initialEpisodes =
      Array.isArray(body.episodes) && body.episodes.length > 0
        ? body.episodes.map((ep: ProgramEpisode) => ({
            ...ep,
            youtubeId: extractYouTubeId(ep.youtubeId) || ep.youtubeId,
          }))
        : cleanYt
          ? [
              {
                id: `ep-${Date.now()}`,
                title: body.latestEpisode || body.title,
                youtubeId: cleanYt,
                date: new Date().toLocaleDateString("ar-EG"),
                description: body.description || "",
              },
            ]
          : [];

    const episodesJson = JSON.stringify(initialEpisodes);
    const episodeCount = initialEpisodes.length;

    if (env?.DB) {
      const db = getDb(env.DB);
      const newProgram = {
        id,
        title: body.title.trim(),
        subtitle: body.subtitle?.trim() || null,
        description: body.description?.trim() || null,
        host: body.host?.trim() || "فريق إنتاج SCOPE",
        imageType: body.imageType || "anchor_studio",
        imageUrl: body.imageUrl?.trim() || null,
        episodeCount,
        latestEpisode:
          body.latestEpisode?.trim() || initialEpisodes[0]?.title || "",
        youtubeId: cleanYt || null,
        episodes: episodesJson,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(programs).values(newProgram);

      const createdShow: ScopeShow = {
        id,
        title: newProgram.title,
        subtitle: newProgram.subtitle || "",
        description: newProgram.description || "",
        host: newProgram.host,
        imageType: newProgram.imageType,
        imageUrl: newProgram.imageUrl || undefined,
        episodeCount,
        latestEpisode: newProgram.latestEpisode,
        youtubeId: newProgram.youtubeId || undefined,
        episodes: initialEpisodes,
      };

      return NextResponse.json(
        {
          success: true,
          message: "تم إضافة البرنامج بنجاح",
          data: createdShow,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن إنشاء البرنامج بدون اتصال قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (error: unknown) {
    console.error("Error creating program:", error);
    return NextResponse.json(
      { success: false, error: errorMessage(error) || "خطأ في إضافة البرنامج" },
      { status: 500 },
    );
  }
}
