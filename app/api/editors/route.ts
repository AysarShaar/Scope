import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { editors } from "../../../db/schema";
import { authenticateRequest } from "../../../lib/auth";
import { eq } from "drizzle-orm";
import { errorMessage } from '../../../lib/errors';

export async function GET(request: NextRequest) {
  const env = getCloudflareEnv();
  const auth = await authenticateRequest(request, env);
  if (!auth.isValid) {
    return NextResponse.json(
      { success: false, error: "غير مصرح: رمز المصادقة غير صحيح أو غير متوفر" },
      { status: 401 },
    );
  }

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const data = await db
        .select({
          id: editors.id,
          name: editors.name,
          email: editors.email,
          role: editors.role,
          systemRole: editors.systemRole,
          avatarUrl: editors.avatarUrl,
          createdAt: editors.createdAt,
        })
        .from(editors)
        .all();

      return NextResponse.json({ success: true, data });
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
        "D1 binding غير متوفر في هذا التشغيل. لا يمكن قراءة المحررين دون قاعدة البيانات.",
    },
    { status: 503 },
  );
}

export async function POST(request: NextRequest) {
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
          "غير مصرح: إضافة المحررين وأعضاء الفريق مقتصرة فقط على مدير النظام (Admin)",
      },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "اسم المحرر مطلوب" },
        { status: 400 },
      );
    }

    const cleanEmail = body.email ? body.email.trim().toLowerCase() : null;
    if (!cleanEmail) {
      return NextResponse.json(
        {
          success: false,
          error:
            "البريد الإلكتروني (Google Account) مطلوب لتسجيل المحرر والسماح له بالدخول عبر Google OAuth",
        },
        { status: 400 },
      );
    }

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

    if (env?.DB) {
      const db = getDb(env.DB);

      const existingEditor = await db
        .select({ id: editors.id })
        .from(editors)
        .where(eq(editors.email, cleanEmail))
        .get();

      if (existingEditor) {
        return NextResponse.json(
          {
            success: false,
            error: "البريد الإلكتروني مستخدم بالفعل",
          },
          { status: 409 },
        );
      }

      const newEditor = {
        id: crypto.randomUUID(),
        name: body.name.trim(),
        email: cleanEmail,
        role: (body.role || "محرر").trim(),
        systemRole:
          (body.systemRole as "admin" | "editor_in_chief" | "editor") || "editor",
        avatarUrl: body.avatarUrl ? body.avatarUrl.trim() : null,
        createdAt: new Date().toISOString(),
      };

      await db.insert(editors).values(newEditor);
      return NextResponse.json({ success: true, data: newEditor }, { status: 201 });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "D1 binding غير متوفر. لا يمكن إنشاء محرر بدون اتصال قاعدة البيانات.",
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
