import { getDb } from "../db/client";
import { editors } from "../db/schema";
import { eq } from "drizzle-orm";
import { CloudflareEnv } from "./cloudflare";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type AuthResult = {
  isValid: boolean;
  systemRole: "admin" | "editor_in_chief" | "editor";
  editorId?: string;
  editorName?: string;
  email?: string;
};

export async function findEditorByEmail(
  email: string,
  env: CloudflareEnv | null,
): Promise<{
  id: string;
  name: string;
  role: string;
  systemRole: "admin" | "editor_in_chief" | "editor";
  email: string;
} | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  if (env?.DB) {
    try {
      const db = getDb(env.DB);
      const rows = await db
        .select()
        .from(editors)
        .where(eq(editors.email, cleanEmail))
        .limit(1);

      if (rows[0]) {
        return {
          id: rows[0].id,
          name: rows[0].name,
          role: rows[0].role,
          systemRole:
            (rows[0].systemRole as "admin" | "editor_in_chief" | "editor") ||
            "editor",
          email: rows[0].email || cleanEmail,
        };
      }
    } catch (e) {
      console.error("[auth] DB error finding editor by email:", e);
    }
  }

  return null;
}

export async function authenticateRequest(
  request: NextRequest,
  env: CloudflareEnv | null,
): Promise<AuthResult> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return { isValid: false, systemRole: "editor" };
  }

  try {
    const token = await getToken({ req: request, secret });
    if (token && token.email) {
      const email = token.email.toLowerCase().trim();
      const adminEmails = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (adminEmails.includes(email)) {
        return {
          isValid: true,
          systemRole: "admin",
          editorId: (token.sub as string) || undefined,
          editorName: (token.name as string) || token.email,
          email,
        };
      }

      const editorRecord = await findEditorByEmail(email, env);
      if (editorRecord) {
        return {
          isValid: true,
          systemRole: editorRecord.systemRole,
          editorId: editorRecord.id,
          editorName: editorRecord.name,
          email,
        };
      }

      return { isValid: false, systemRole: "editor" };
    }
  } catch (err) {
    console.error("[auth] authenticateRequest error:", err);
  }

  return { isValid: false, systemRole: "editor" };
}
