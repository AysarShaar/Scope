/**
 * Permissions System for Scope Media Platform
 *
 * NOTE: This file is shared between server and client.
 * DO NOT import server-only modules or read process.env.ADMIN_EMAILS here.
 * The server computes the user's explicit permissions list (granting full explicit
 * permissions to emergency admin emails) and passes it here.
 */

export const ALL_PERMISSIONS = [
  'articles.publish_direct',
  'articles.approve',
  'articles.delete',
  'articles.set_special',
  'articles.edit_any',
  'breaking.manage',
  'programs.manage',
  'settings.live_stream',
  'editors.manage',
  'analytics.view',
] as const;

export type Permission = (typeof ALL_PERMISSIONS)[number];

const PERMISSION_SET: ReadonlySet<string> = new Set(ALL_PERMISSIONS);

export interface PermissionDefinition {
  id: Permission;
  label: string;
  description: string;
  category: 'articles' | 'content' | 'admin';
}

export const PERMISSION_DEFINITIONS: readonly PermissionDefinition[] = [
  {
    id: 'articles.publish_direct',
    label: 'النشر المباشر للمقالات',
    description: 'نشر المواد الإخبارية مباشرة دون الحاجة لمراجعة أو اعتماد مسبق.',
    category: 'articles',
  },
  {
    id: 'articles.approve',
    label: 'اعتماد وموافقة المقالات',
    description: 'مراجعة مقالات المحررين المعلقة ونقلها إلى صفة "منشور".',
    category: 'articles',
  },
  {
    id: 'articles.delete',
    label: 'حذف المقالات',
    description: 'حذف أي مادة صحفية من المنصة بصورة نهائية.',
    category: 'articles',
  },
  {
    id: 'articles.set_special',
    label: 'تمييز المقال (تغطية خاصة)',
    description: 'تعيين المقال ليظهر في المربع الرئيسي المميز أعلى الموقع.',
    category: 'articles',
  },
  {
    id: 'articles.edit_any',
    label: 'تعديل أي مقال',
    description: 'تعديل مواد المحررين الآخرين وتحديث نصوصها وبياناتها.',
    category: 'articles',
  },
  {
    id: 'breaking.manage',
    label: 'إدارة الأخبار العاجلة',
    description: 'إضافة وتعديل وحذف تنبيهات شريط الأخبار العاجلة على مدار الساعة.',
    category: 'content',
  },
  {
    id: 'programs.manage',
    label: 'إدارة البرامج والتغطيات',
    description: 'إنشاء البرامج وتعديلها وإدارة الحلقات وروابط اليوتيوب.',
    category: 'content',
  },
  {
    id: 'settings.live_stream',
    label: 'تغيير البث المباشر',
    description: 'تحديث معرّف أو رابط البث المباشر المعروض في الهيدر وصفحة البث.',
    category: 'content',
  },
  {
    id: 'editors.manage',
    label: 'إدارة فريق التحرير والصلاحيات',
    description: 'إضافة المحررين الجدد، تعديل بياناتهم، وتوزيع صلاحيات النظام.',
    category: 'admin',
  },
  {
    id: 'analytics.view',
    label: 'لوحة المؤشرات والتحليلات',
    description: 'الاطلاع على تقارير الزوار، إحصائيات التفاعل، وأداء Cloudflare.',
    category: 'admin',
  },
];

export const PERMISSION_MAP: Record<Permission, PermissionDefinition> =
  Object.fromEntries(PERMISSION_DEFINITIONS.map((d) => [d.id, d])) as Record<Permission, PermissionDefinition>;

export const EDITOR_PERMISSIONS: readonly Permission[] = Object.freeze([]);

export const EDITOR_IN_CHIEF_PERMISSIONS: readonly Permission[] = Object.freeze([
  'articles.publish_direct',
  'articles.approve',
  'articles.delete',
  'articles.set_special',
  'articles.edit_any',
  'breaking.manage',
  'programs.manage',
  'settings.live_stream',
]);

export const ADMIN_PERMISSIONS: readonly Permission[] = Object.freeze([
  'articles.publish_direct',
  'articles.approve',
  'articles.delete',
  'articles.set_special',
  'articles.edit_any',
  'breaking.manage',
  'programs.manage',
  'settings.live_stream',
  'editors.manage',
  'analytics.view',
]);

export function isKnownPermission(value: unknown): value is Permission {
  return typeof value === 'string' && PERMISSION_SET.has(value);
}

/**
 * Filter and validate permissions strictly against the whitelist.
 * Returns only recognized permissions with duplicates removed.
 */
export function sanitizePermissions(input: unknown): Permission[] {
  if (!input) return [];
  const list = Array.isArray(input) ? input : [input];
  const result = new Set<Permission>();
  for (const item of list) {
    if (isKnownPermission(item)) {
      result.add(item);
    }
  }
  return Array.from(result);
}

/**
 * Safely parse raw JSON permissions stored in the database.
 * If raw is corrupted, invalid JSON, or not an array, returns [] (fail-closed, default deny).
 */
export function parseStoredPermissions(raw: unknown): Permission[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return sanitizePermissions(raw);
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === '[]') return [];
    try {
      const parsed = JSON.parse(trimmed);
      return sanitizePermissions(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Central permission check.
 * Default Deny: returns false if user or permissions are missing or if permission is absent.
 * No wildcard '*' is supported; every permission must be explicitly granted.
 */
export function can(
  user: { permissions?: readonly string[] | string[] | null } | null | undefined,
  permission: Permission
): boolean {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.includes(permission);
}
