import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../../lib/cloudflare";
import { getDb } from "../../../../db/client";
import { editors } from "../../../../db/schema";
import { eq, and, ne } from "drizzle-orm";
import { authenticateRequest } from "../../../../lib/auth";
import { errorMessage } from '../../../../lib/errors';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = getCloudflareEnv();
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: رمز المصادقة غير صحيح أو غير متوفر" },
      { status: 401 },
    );
  }

  if (auth.systemRole !== "admin") {
    return NextResponse.json(
      {
        success: false,
        error:
          "غير مصرح: تعديل بيانات المحررين مقتصر فقط على مدير النظام (Admin)",
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updateData: Partial<typeof editors.$inferInsert> = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.email !== undefined) {
      const cleanEmail = body.email ? body.email.trim().toLowerCase() : null;
      if (cleanEmail) {
        const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
        if (!EMAIL_REGEX.test(cleanEmail)) {
          return NextResponse.json(
            {
              success: false,
              error:
                "صيغة البريد الإلكتروني غير صحيحة، يجب أن يحتوي على اسم المستخدم ورمز @ ونطاق صالح (مثال: name@domain.com)",
            },
            { status: 400 },
          );
        }
      }
      updateData.email = cleanEmail;
    }
    if (body.role !== undefined) updateData.role = body.role.trim();
    if (body.systemRole !== undefined) updateData.systemRole = body.systemRole;
    if (body.avatarUrl !== undefined)
      updateData.avatarUrl = body.avatarUrl ? body.avatarUrl.trim() : null;

    if (env?.DB) {
      const db = getDb(env.DB);

      if (updateData.email) {
        const existingEditor = await db
          .select({ id: editors.id })
          .from(editors)
          .where(and(eq(editors.email, updateData.email), ne(editors.id, id)))
          .get();

        if (existingEditor) {
          return NextResponse.json(
            { success: false, error: "البريد الإلكتروني مستخدم بالفعل" },
            { status: 409 },
          );
        }
      }

      await db.update(editors).set(updateData).where(eq(editors.id, id));
      return NextResponse.json({
        success: true,
        message: "تم تحديث بيانات المحرر بنجاح",
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن تحديث المحرر بدون اتصال قاعدة البيانات.",
      },
      { status: 503 },
    );
  } catch (err: unknown) {
    const errorMsg = String(errorMessage(err));
    if (errorMsg.includes("UNIQUE") || errorMsg.includes("unique")) {
      return NextResponse.json(
        { success: false, error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { success: false, error: errorMessage(err) },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const env = getCloudflareEnv();
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: رمز المصادقة غير صحيح أو غير متوفر" },
      { status: 401 },
    );
  }

  if (auth.systemRole !== "admin") {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح: حذف المحررين مقتصر فقط على مدير النظام (Admin)",
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      await db.delete(editors).where(eq(editors.id, id));
      return NextResponse.json({ success: true, message: "تم حذف المحرر" });
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
        "D1 binding غير متوفر. لا يمكن حذف المحرر بدون اتصال قاعدة البيانات.",
    },
    { status: 503 },
  );
}
