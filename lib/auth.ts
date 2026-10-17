import { getDb } from "../db/client";
import { editors } from "../db/schema";
import { eq } from "drizzle-orm";
import { CloudflareEnv } from "./cloudflare";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export type SystemRole = "admin" | "editor_in_chief" | "editor";

export type AuthResult = {
  isValid: boolean;
  systemRole: SystemRole;
  editorId?: string;
  editorName?: string;
  email?: string;
};

export interface EditorRecord {
  id: string;
  name: string;
  role: string;
  systemRole: SystemRole;
  email: string;
}

const INVALID_AUTH_RESULT: AuthResult = { isValid: false, systemRole: "editor" };

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function findEditorByEmail(
  email: string,
  env: CloudflareEnv | null,
): Promise<EditorRecord | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !env?.DB) return null;

  try {
    const db = getDb(env.DB);
    const rows = await db
      .select()
      .from(editors)
      .where(eq(editors.email, cleanEmail))
      .limit(1);

    const match = rows[0];
    if (!match) return null;

    return {
      id: match.id,
      name: match.name,
      role: match.role,
      systemRole: (match.systemRole as SystemRole) || "editor",
      email: match.email || cleanEmail,
    };
  } catch (error) {
    console.error("[auth] DB error finding editor by email:", error);
    return null;
  }
}

export async function authenticateRequest(
  request: NextRequest,
  env: CloudflareEnv | null,
): Promise<AuthResult> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return INVALID_AUTH_RESULT;

  try {
    const token = await getToken({ req: request, secret });
    if (!token?.email) return INVALID_AUTH_RESULT;

    const email = token.email.toLowerCase().trim();
    const adminEmails = getAdminEmails();

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
  } catch (err) {
    console.error("[auth] authenticateRequest error:", err);
  }

  return INVALID_AUTH_RESULT;
}
