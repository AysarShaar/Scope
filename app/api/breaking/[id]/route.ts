import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../../lib/cloudflare";
import { getDb } from "../../../../db/client";
import { breaking } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { authenticateRequest } from "../../../../lib/auth";
import { errorMessage } from '../../../../lib/errors';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = getCloudflareEnv();
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: يرجى تسجيل الدخول للمتابعة" },
      { status: 401 },
    );
  }
  if (auth.systemRole !== "admin" && auth.systemRole !== "editor_in_chief") {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح: يجب أن تكون مديراً أو رئيس تحرير للمتابعة",
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      await db.delete(breaking).where(eq(breaking.id, id));
      return NextResponse.json({
        success: true,
        message: "تم حذف الخبر العاجل",
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
        "D1 binding غير متوفر. لا يمكن حذف الخبر العاجل بدون اتصال قاعدة البيانات.",
    },
    { status: 503 },
  );
}
