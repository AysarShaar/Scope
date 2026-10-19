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
    label: 'نشر المقالات مباشرة',
    description: 'نشر المواد الإخبارية فوراً دون الحاجة لمراجعة مسبقة.',
    category: 'articles',
  },
  {
    id: 'articles.approve',
    label: 'اعتماد المسودات',
    description: 'مراجعة مقالات المحررين والموافقة على نشرها.',
    category: 'articles',
  },
  {
    id: 'articles.delete',
    label: 'حذف المقالات',
    description: 'حذف المواد والمقالات من المنصة بشكل نهائي.',
    category: 'articles',
  },
  {
    id: 'articles.set_special',
    label: 'تغطية رئيسية (مميز)',
    description: 'تثبيت المقال في المساحة الرئيسية المميزة أعلى الموقع.',
    category: 'articles',
  },
  {
    id: 'articles.edit_any',
    label: 'تعديل مقالات الفريق',
    description: 'إمكانية تحرير وتعديل مقالات المحررين الآخرين.',
    category: 'articles',
  },
  {
    id: 'breaking.manage',
    label: 'شريط الأخبار العاجلة',
    description: 'نشر وتحديث وحذف تنبيهات شريط العاجل.',
    category: 'content',
  },
  {
    id: 'programs.manage',
    label: 'البرامج والتغطيات',
    description: 'إدارة البرامج، إضافة الحلقات، وتحديث الروابط.',
    category: 'content',
  },
  {
    id: 'settings.live_stream',
    label: 'البث المباشر',
    description: 'تحديث رابط ومعلومات البث المباشر.',
    category: 'content',
  },
  {
    id: 'editors.manage',
    label: 'إدارة فريق التحرير',
    description: 'إضافة المحررين وتعديل صلاحيات الوصول وأدوارهم.',
    category: 'admin',
  },
  {
    id: 'analytics.view',
    label: 'لوحة الإحصاءات',
    description: 'عرض إحصاءات القراءات ومؤشرات التفاعل وتقارير الأداء.',
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
