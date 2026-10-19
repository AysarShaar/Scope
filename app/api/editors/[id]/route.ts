import { NextRequest, NextResponse } from "next/server";
import { getCloudflareEnv } from "../../../../lib/cloudflare";
import { getDb } from "../../../../db/client";
import { editors, permissionsAuditLog } from "../../../../db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
import { authenticateRequest, getAdminEmails } from "../../../../lib/auth";
import { errorMessage } from '../../../../lib/errors';
import {
  can,
  parseStoredPermissions,
  isKnownPermission,
  Permission,
} from "../../../../lib/permissions";

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

  if (!can(auth, "editors.manage")) {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح: تعديل بيانات المحررين وصلاحياتهم مقتصر على مدراء النظام المصرح لهم",
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    const body = await request.json();

    if (!env?.DB) {
      return NextResponse.json(
        {
          success: false,
          error: "D1 binding غير متوفر. لا يمكن تحديث المحرر بدون اتصال قاعدة البيانات.",
        },
        { status: 503 },
      );
    }

    const db = getDb(env.DB);

    // Fetch target editor to check current state
    const targetEditor = await db
      .select()
      .from(editors)
      .where(eq(editors.id, id))
      .get();

    if (!targetEditor) {
      return NextResponse.json(
        { success: false, error: "المحرر غير موجود" },
        { status: 404 },
      );
    }

    const currentPerms = parseStoredPermissions(targetEditor.permissions);
    let targetPerms: Permission[] | null = null;
    let permissionsChanged = false;

    // Never accept systemRole from client: systemRole is derived strictly on server from permissions
    if (body.permissions !== undefined) {
      if (!Array.isArray(body.permissions)) {
        return NextResponse.json(
          { success: false, error: "حقل permissions يجب أن يكون مصفوفة" },
          { status: 400 },
        );
      }
      for (const p of body.permissions) {
        if (!isKnownPermission(p)) {
          return NextResponse.json(
            { success: false, error: `صلاحية غير معروفة مرفوضة: ${String(p)}` },
            { status: 400 },
          );
        }
      }
      targetPerms = Array.from(new Set(body.permissions as Permission[]));
      // Compare if permissions actually changed
      permissionsChanged =
        targetPerms.length !== currentPerms.length ||
        targetPerms.some((p) => !currentPerms.includes(p));
    }

    // Privilege escalation prevention rule 1: No self-modification of permissions
    // Applies strictly when permissions actually change, not on basic profile updates
    const isSelf = Boolean(auth.editorId && auth.editorId === id);
    if (isSelf && permissionsChanged) {
      return NextResponse.json(
        {
          success: false,
          error: "غير مصرح: لا يمكنك تعديل صلاحياتك بنفسك منعاً لتصعيد الصلاحيات وتعارض المصالح",
        },
        { status: 403 },
      );
    }

    const adminEmails = getAdminEmails();
    const isEmergencyAdmin = Boolean(
      auth.email && adminEmails.includes(auth.email.toLowerCase().trim()),
    );

    if (permissionsChanged && targetPerms) {
      // Privilege escalation prevention rule 2: Cannot grant permissions actor does not possess
      for (const p of targetPerms) {
        if (!can(auth, p)) {
          return NextResponse.json(
            {
              success: false,
              error: `غير مصرح: لا يمكنك منح صلاحية لا تملكها بنفسك (${p})`,
            },
            { status: 403 },
          );
        }
      }

      // Privilege escalation prevention rule 3: Granting or revoking editors.manage is exclusive to emergency admin
      // Only accounts that actually hold editors.manage are considered managers
      const hadManage = currentPerms.includes("editors.manage");
      const willHaveManage = targetPerms.includes("editors.manage");
      if (hadManage !== willHaveManage && !isEmergencyAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "غير مصرح: منح أو سحب صلاحية إدارة المحررين (editors.manage) مقتصر حصراً على مدير الطوارئ (ADMIN_EMAILS)",
          },
          { status: 403 },
        );
      }
    }

    const updateData: Partial<typeof editors.$inferInsert> = {};
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.role !== undefined) updateData.role = body.role.trim();
    if (body.avatarUrl !== undefined)
      updateData.avatarUrl = body.avatarUrl ? body.avatarUrl.trim() : null;

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

      if (cleanEmail) {
        const existingEditor = await db
          .select({ id: editors.id })
          .from(editors)
          .where(and(eq(editors.email, cleanEmail), ne(editors.id, id)))
          .get();

        if (existingEditor) {
          return NextResponse.json(
            { success: false, error: "البريد الإلكتروني مستخدم بالفعل" },
            { status: 409 },
          );
        }
      }
    }

    if (permissionsChanged && targetPerms) {
      updateData.permissions = JSON.stringify(targetPerms);
      // Derive systemRole strictly on the server:
      updateData.systemRole = targetPerms.includes("editors.manage")
        ? "admin"
        : targetPerms.includes("articles.publish_direct") || targetPerms.includes("articles.approve")
        ? "editor_in_chief"
        : "editor";
    }

    // Atomic "Last Admin" check in a single conditional statement:
    // Only an editor who actually possesses editors.manage is counted as a manager
    const hadManage = currentPerms.includes("editors.manage");
    const wouldRevokeManage =
      permissionsChanged && targetPerms && hadManage && !targetPerms.includes("editors.manage");

    if (wouldRevokeManage) {
      const updateQuery = db
        .update(editors)
        .set(updateData)
        .where(
          and(
            eq(editors.id, id),
            sql`(SELECT COUNT(*) FROM editors WHERE id != ${id} AND (permissions LIKE '%"editors.manage"%')) >= 1`,
          ),
        );

      const auditQuery = db.insert(permissionsAuditLog).values({
        id: crypto.randomUUID(),
        actorId: auth.editorId || "emergency-admin",
        actorEmail: auth.email || "unknown",
        targetEditorId: id,
        action: "update",
        permissionsBefore: JSON.stringify(currentPerms),
        permissionsAfter: JSON.stringify(targetPerms),
        createdAt: new Date().toISOString(),
      });

      const [updateRes] = await db.batch([updateQuery, auditQuery]);
      const changes =
        updateRes.meta?.changes ??
        (updateRes as { changes?: number }).changes ??
        0;

      if (changes === 0) {
        return NextResponse.json(
          {
            success: false,
            error: "عملية مرفوضة: لا يمكن سحب صلاحيات الإدارة من آخر مدير نظام في المنصة",
          },
          { status: 400 },
        );
      }
    } else if (permissionsChanged && targetPerms) {
      const updateQuery = db.update(editors).set(updateData).where(eq(editors.id, id));
      const auditQuery = db.insert(permissionsAuditLog).values({
        id: crypto.randomUUID(),
        actorId: auth.editorId || "emergency-admin",
        actorEmail: auth.email || "unknown",
        targetEditorId: id,
        action: "update",
        permissionsBefore: JSON.stringify(currentPerms),
        permissionsAfter: JSON.stringify(targetPerms),
        createdAt: new Date().toISOString(),
      });

      await db.batch([updateQuery, auditQuery]);
    } else {
      await db.update(editors).set(updateData).where(eq(editors.id, id));
    }

    return NextResponse.json({
      success: true,
      message: "تم تحديث بيانات المحرر بنجاح",
    });
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

  if (!can(auth, "editors.manage")) {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح: حذف المحررين مقتصر فقط على مدراء النظام المصرح لهم",
      },
      { status: 403 },
    );
  }

  const { id } = await params;

  // Prevent self-deletion
  if (auth.editorId && auth.editorId === id) {
    return NextResponse.json(
      {
        success: false,
        error: "غير مصرح: لا يمكنك حذف حسابك بنفسك لمنع فقدان الوصول",
      },
      { status: 403 },
    );
  }

  if (env?.DB) {
    try {
      const db = getDb(env.DB);

      const target = await db
        .select()
        .from(editors)
        .where(eq(editors.id, id))
        .get();

      if (!target) {
        return NextResponse.json(
          { success: false, error: "المحرر غير موجود" },
          { status: 404 },
        );
      }

      const targetPerms = parseStoredPermissions(target.permissions);
      // Only an editor who actually holds editors.manage is considered a manager
      const isManager = targetPerms.includes("editors.manage");

      // Deleting a manager requires emergency admin permissions
      const adminEmails = getAdminEmails();
      const isEmergencyAdmin = Boolean(
        auth.email && adminEmails.includes(auth.email.toLowerCase().trim()),
      );
      if (isManager && !isEmergencyAdmin) {
        return NextResponse.json(
          {
            success: false,
            error: "غير مصرح: حذف عضو يحمل صلاحية إدارة المحررين مقتصر حصراً على مدير الطوارئ (ADMIN_EMAILS)",
          },
          { status: 403 },
        );
      }

      const auditQuery = db.insert(permissionsAuditLog).values({
        id: crypto.randomUUID(),
        actorId: auth.editorId || "emergency-admin",
        actorEmail: auth.email || "unknown",
        targetEditorId: id,
        action: "revoke",
        permissionsBefore: JSON.stringify(targetPerms),
        permissionsAfter: "[]",
        createdAt: new Date().toISOString(),
      });

      if (isManager) {
        // Atomic single-query delete with last-admin guard:
        // Delete ONLY if at least one other manager with editors.manage remains in DB.
        const deleteQuery = db
          .delete(editors)
          .where(
            and(
              eq(editors.id, id),
              sql`(SELECT COUNT(*) FROM editors WHERE id != ${id} AND (permissions LIKE '%"editors.manage"%')) >= 1`,
            ),
          );

        const [deleteRes] = await db.batch([deleteQuery, auditQuery]);
        const changes =
          deleteRes.meta?.changes ??
          (deleteRes as { changes?: number }).changes ??
          0;

        if (changes === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "عملية مرفوضة: لا يمكن حذف آخر مدير نظام في المنصة",
            },
            { status: 400 },
          );
        }
      } else {
        const deleteQuery = db.delete(editors).where(eq(editors.id, id));
        await db.batch([deleteQuery, auditQuery]);
      }

      return NextResponse.json({ success: true, message: "تم حذف المحرر بنجاح" });
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
