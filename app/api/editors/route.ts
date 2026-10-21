import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../lib/cloudflare";
import { getDb } from "../../../db/client";
import { editors, permissionsAuditLog } from "../../../db/schema";
import { authenticateRequest, getAdminEmails } from "../../../lib/auth";
import { eq } from "drizzle-orm";
import { errorMessage } from '../../../lib/errors';
import {
  can,
  parseStoredPermissions,
  isKnownPermission,
  Permission,
} from "../../../lib/permissions";

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
      const rows = await db
        .select({
          id: editors.id,
          name: editors.name,
          email: editors.email,
          role: editors.role,
          systemRole: editors.systemRole,
          permissions: editors.permissions,
          avatarUrl: editors.avatarUrl,
          createdAt: editors.createdAt,
        })
        .from(editors)
        .all();

      const canManage = can(auth, "editors.manage");

      // Prevent data leak: Only return email, systemRole, and permissions to callers holding editors.manage
      const data = rows.map((r) => {
        if (canManage) {
          return {
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role,
            systemRole: r.systemRole,
            avatarUrl: r.avatarUrl,
            createdAt: r.createdAt,
            permissions: parseStoredPermissions(r.permissions),
          };
        }
        // Non-managers receive only basic public editorial identity
        return {
          id: r.id,
          name: r.name,
          role: r.role,
          avatarUrl: r.avatarUrl,
          createdAt: r.createdAt,
        };
      });

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

  if (!can(auth, "editors.manage")) {
    return NextResponse.json(
      {
        success: false,
        error: "ليس لديك صلاحية لإدارة فريق التحرير",
      },
      { status: 403 },
    );
  }

  const adminEmails = getAdminEmails();
  const isEmergencyAdmin = Boolean(
    auth.email && adminEmails.includes(auth.email.toLowerCase().trim()),
  );

  try {
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال الاسم" },
        { status: 400 },
      );
    }

    if (!body.email || !body.email.trim()) {
      return NextResponse.json(
        { success: false, error: "يرجى إدخال البريد الإلكتروني" },
        { status: 400 },
      );
    }

    const cleanEmail = body.email.trim().toLowerCase();
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: "يرجى إدخال بريد إلكتروني صالح",
        },
        { status: 400 },
      );
    }

    let targetPermissions: Permission[] = [];
    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions)) {
        return NextResponse.json(
          { success: false, error: "تنسيق الصلاحيات غير صالح" },
          { status: 400 },
        );
      }
      for (const p of body.permissions) {
        if (!isKnownPermission(p)) {
          return NextResponse.json(
            { success: false, error: `صلاحية غير صالحة: ${String(p)}` },
            { status: 400 },
          );
        }
      }
      targetPermissions = Array.from(new Set(body.permissions as Permission[]));
    }

    // Privilege escalation prevention rule 1: No user can grant permissions they do not possess
    for (const p of targetPermissions) {
      if (!can(auth, p)) {
        return NextResponse.json(
          {
            success: false,
            error: `لا يمكنك منح صلاحية لا يمتلكها حسابك (${p})`,
          },
          { status: 403 },
        );
      }
    }

    // Privilege escalation prevention rule 2: Granting editors.manage is restricted exclusively to emergency admins (ADMIN_EMAILS)
    if (targetPermissions.includes("editors.manage") && !isEmergencyAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "منح صلاحية إدارة المحررين متاح للمدير العام فقط",
        },
        { status: 403 },
      );
    }

    // Derive systemRole strictly on the server from permissions (never accept systemRole from client)
    const resolvedSystemRole: "admin" | "editor_in_chief" | "editor" =
      targetPermissions.includes("editors.manage")
        ? "admin"
        : targetPermissions.includes("articles.publish_direct") ||
          targetPermissions.includes("articles.approve")
        ? "editor_in_chief"
        : "editor";

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

      const newEditorId = crypto.randomUUID();
      const now = new Date().toISOString();
      const permsJson = JSON.stringify(targetPermissions);

      const newEditor = {
        id: newEditorId,
        name: body.name.trim(),
        email: cleanEmail,
        role: (body.role || "محرر").trim(),
        systemRole: resolvedSystemRole,
        permissions: permsJson,
        avatarUrl: body.avatarUrl ? body.avatarUrl.trim() : null,
        createdAt: now,
      };

      const insertEditorQuery = db.insert(editors).values(newEditor);
      const insertAuditQuery = db.insert(permissionsAuditLog).values({
        id: crypto.randomUUID(),
        actorId: auth.editorId || "emergency-admin",
        actorEmail: auth.email || "unknown",
        targetEditorId: newEditorId,
        action: "grant",
        permissionsBefore: "[]",
        permissionsAfter: permsJson,
        createdAt: now,
      });

      // Atomic execution of creation and audit log
      await db.batch([insertEditorQuery, insertAuditQuery]);

      return NextResponse.json(
        {
          success: true,
          data: {
            ...newEditor,
            permissions: targetPermissions,
          },
        },
        { status: 201 },
      );
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
