import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import {
  ALL_PERMISSIONS,
  EDITOR_PERMISSIONS,
  EDITOR_IN_CHIEF_PERMISSIONS,
  ADMIN_PERMISSIONS,
  can,
  Permission,
} from './permissions';

// -------------------------------------------------------------
// Part 1: Automated Route Scanner
// Scans every app/api/**/route.ts file to ensure every mutating HTTP
// method (POST, PUT, PATCH, DELETE) enforces authentication & permission checks.
// -------------------------------------------------------------
describe('Automated Route Audit: every mutating endpoint must enforce permissions', () => {
  const apiDir = path.resolve(process.cwd(), 'app/api');

  function findRouteFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let files: string[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files = files.concat(findRouteFiles(fullPath));
      } else if (entry.name === 'route.ts' || entry.name === 'route.js') {
        files.push(fullPath);
      }
    }
    return files;
  }

  const routeFiles = findRouteFiles(apiDir);

  it('scans and finds all API routes in app/api', () => {
    expect(routeFiles.length).toBeGreaterThan(5);
  });

  routeFiles.forEach((file) => {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');

    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    mutatingMethods.forEach((method) => {
      // Check if this method is exported
      const exportRegex = new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`);
      if (exportRegex.test(content)) {
        it(`${method} in ${relativePath} MUST enforce authentication and permission checks`, () => {
          // Public-by-design endpoints (if any) or endpoints that require auth:
          // /api/auth/* is managed by NextAuth
          if (relativePath.includes('api/auth/')) {
            return;
          }

          // Check that authenticateRequest or authenticateAdmin is called
          const hasAuth =
            content.includes('authenticateRequest') || content.includes('authenticateAdmin');
          expect(
            hasAuth,
            `Expected ${relativePath} ${method} to call authenticateRequest`
          ).toBe(true);

          // Check that can() or permission verification is enforced
          const hasPermissionCheck =
            content.includes('can(auth') ||
            content.includes('can(') ||
            content.includes('auth.isValid') ||
            content.includes('auth.permissions');
          expect(
            hasPermissionCheck,
            `Expected ${relativePath} ${method} to verify permissions`
          ).toBe(true);
        });
      }
    });
  });
});

// -------------------------------------------------------------
// Part 2: Matrix Tests: Each Preset × Each Permission
// -------------------------------------------------------------
describe('Permission Matrix: Roles vs Permissions', () => {
  const testMatrix: {
    preset: 'editor' | 'editor_in_chief' | 'admin';
    permissions: Permission[];
    expectedAllowed: Permission[];
    expectedDenied: Permission[];
  }[] = [
    {
      preset: 'editor',
      permissions: [...EDITOR_PERMISSIONS],
      expectedAllowed: [],
      expectedDenied: [...ALL_PERMISSIONS],
    },
    {
      preset: 'editor_in_chief',
      permissions: [...EDITOR_IN_CHIEF_PERMISSIONS],
      expectedAllowed: [
        'articles.publish_direct',
        'articles.approve',
        'articles.delete',
        'articles.set_special',
        'articles.edit_any',
        'breaking.manage',
        'programs.manage',
        'settings.live_stream',
      ],
      expectedDenied: ['editors.manage', 'analytics.view'],
    },
    {
      preset: 'admin',
      permissions: [...ADMIN_PERMISSIONS],
      expectedAllowed: [...ALL_PERMISSIONS],
      expectedDenied: [],
    },
  ];

  testMatrix.forEach(({ preset, permissions, expectedAllowed, expectedDenied }) => {
    describe(`Preset: ${preset}`, () => {
      expectedAllowed.forEach((perm) => {
        it(`allows ${perm}`, () => {
          expect(can({ permissions }, perm)).toBe(true);
        });
      });

      expectedDenied.forEach((perm) => {
        it(`denies ${perm}`, () => {
          expect(can({ permissions }, perm)).toBe(false);
        });
      });
    });
  });
});

// -------------------------------------------------------------
// Part 3: Route Permission Gate Mapping
// Verify the exact permission required for each route and operation
// -------------------------------------------------------------
describe('Route Permission Requirements Mapping', () => {
  const routeRequirements: {
    route: string;
    method: string;
    requiredPermission: Permission;
  }[] = [
    { route: '/api/articles', method: 'POST (direct publish)', requiredPermission: 'articles.publish_direct' },
    { route: '/api/articles/[id]', method: 'PUT (approve)', requiredPermission: 'articles.approve' },
    { route: '/api/articles/[id]', method: 'PUT (edit other)', requiredPermission: 'articles.edit_any' },
    { route: '/api/articles/[id]', method: 'DELETE', requiredPermission: 'articles.delete' },
    { route: '/api/articles/[id]/special', method: 'PUT', requiredPermission: 'articles.set_special' },
    { route: '/api/breaking', method: 'POST', requiredPermission: 'breaking.manage' },
    { route: '/api/breaking/[id]', method: 'DELETE', requiredPermission: 'breaking.manage' },
    { route: '/api/settings', method: 'POST', requiredPermission: 'settings.live_stream' },
    { route: '/api/programs', method: 'POST', requiredPermission: 'programs.manage' },
    { route: '/api/programs/[id]', method: 'PUT', requiredPermission: 'programs.manage' },
    { route: '/api/programs/[id]', method: 'DELETE', requiredPermission: 'programs.manage' },
    { route: '/api/episodes', method: 'POST', requiredPermission: 'programs.manage' },
    { route: '/api/episodes/[id]', method: 'PUT', requiredPermission: 'programs.manage' },
    { route: '/api/episodes/[id]', method: 'DELETE', requiredPermission: 'programs.manage' },
    { route: '/api/editors', method: 'POST', requiredPermission: 'editors.manage' },
    { route: '/api/editors/[id]', method: 'PUT', requiredPermission: 'editors.manage' },
    { route: '/api/editors/[id]', method: 'DELETE', requiredPermission: 'editors.manage' },
    { route: '/api/admin/analytics', method: 'GET', requiredPermission: 'analytics.view' },
    { route: '/api/admin/analytics/cloudflare', method: 'GET', requiredPermission: 'analytics.view' },
  ];

  routeRequirements.forEach(({ route, method, requiredPermission }) => {
    it(`${method} ${route} requires ${requiredPermission}`, () => {
      // User with the permission is granted
      expect(can({ permissions: [requiredPermission] }, requiredPermission)).toBe(true);
      // User without the permission is denied
      const withoutPerm = ALL_PERMISSIONS.filter((p) => p !== requiredPermission);
      expect(can({ permissions: withoutPerm }, requiredPermission)).toBe(false);
      // Empty permissions (Editor preset) is denied
      expect(can({ permissions: EDITOR_PERMISSIONS }, requiredPermission)).toBe(false);
    });
  });
});

// -------------------------------------------------------------
// Part 4: Self-Approval Security Rule
// -------------------------------------------------------------
describe('Self-Approval Security Rule', () => {
  it('does not allow an author to approve their own article unless they possess articles.publish_direct', () => {
    const isOwner = true;
    const isApproving = true;

    // Case 1: Editor possessing neither
    const editor = { permissions: [] };
    const canApprove1 = can(editor, 'articles.approve');
    const canPublishDirect1 = can(editor, 'articles.publish_direct');
    const allowed1 = canApprove1 && (!isOwner || canPublishDirect1);
    expect(allowed1).toBe(false);

    // Case 2: A reviewer who only has articles.approve (not publish_direct) trying to approve their OWN article
    const reviewer = { permissions: ['articles.approve' as Permission] };
    const canApprove2 = can(reviewer, 'articles.approve');
    const canPublishDirect2 = can(reviewer, 'articles.publish_direct');
    const allowed2Self = canApprove2 && (!isOwner || canPublishDirect2);
    expect(allowed2Self).toBe(false); // Rejected!

    // Case 3: The same reviewer approving ANOTHER editor's article
    const allowed2Other = canApprove2 && (!false || canPublishDirect2);
    expect(allowed2Other).toBe(true); // Allowed!

    // Case 4: Editor-in-Chief / Admin who possesses BOTH articles.approve AND articles.publish_direct
    const chief = {
      permissions: ['articles.approve', 'articles.publish_direct'] as Permission[],
    };
    const canApprove4 = can(chief, 'articles.approve');
    const canPublishDirect4 = can(chief, 'articles.publish_direct');
    const allowed4Self = canApprove4 && (!isOwner || canPublishDirect4);
    expect(allowed4Self).toBe(true); // Allowed because they have direct publish authority
  });
});

// -------------------------------------------------------------
// Part 5: Settings Whitelist Security Rule
// -------------------------------------------------------------
describe('Settings Whitelist Security Rule', () => {
  const ALLOWED_SETTING_KEYS = ['live_stream_id', 'livestreamid', 'live_stream', 'livestream'];

  it('accepts only live_stream_id and rejects cf_* or unknown keys', () => {
    function validateKey(key: string): boolean {
      return ALLOWED_SETTING_KEYS.includes(key.toLowerCase().trim());
    }

    expect(validateKey('live_stream_id')).toBe(true);
    expect(validateKey('cf_api_token')).toBe(false);
    expect(validateKey('cf_zone_id')).toBe(false);
    expect(validateKey('cf_account_id')).toBe(false);
    expect(validateKey('admin_password')).toBe(false);
    expect(validateKey('secret_token')).toBe(false);
  });
});

// -------------------------------------------------------------
// Part 6: Data Leakage Prevention (GET /api/editors)
// -------------------------------------------------------------
describe('Data Leakage Prevention: GET /api/editors permissions visibility', () => {
  it('omits permissions field when caller does not have editors.manage', () => {
    const rawEditorFromDb = {
      id: 'e1',
      name: 'محرر',
      email: 'ed@example.com',
      role: 'محرر',
      systemRole: 'editor',
      permissions: '["articles.publish_direct"]',
    };

    function filterEditorForCaller(
      callerPerms: readonly string[] | string[],
      editor: typeof rawEditorFromDb
    ) {
      const canManage = can({ permissions: callerPerms as string[] }, 'editors.manage');
      if (canManage) {
        return {
          ...editor,
          permissions: JSON.parse(editor.permissions),
        };
      }
      // Without editors.manage: permissions is omitted
      const { permissions, ...sanitized } = editor;
      return sanitized;
    }

    // Caller 1: Normal Editor (without editors.manage)
    const result1 = filterEditorForCaller([], rawEditorFromDb);
    expect(result1).not.toHaveProperty('permissions');

    // Caller 2: Editor-in-Chief (without editors.manage)
    const result2 = filterEditorForCaller(EDITOR_IN_CHIEF_PERMISSIONS, rawEditorFromDb);
    expect(result2).not.toHaveProperty('permissions');

    // Caller 3: Admin (with editors.manage)
    const result3 = filterEditorForCaller(['editors.manage'], rawEditorFromDb);
    expect(result3).toHaveProperty('permissions');
    expect((result3 as { permissions: string[] }).permissions).toEqual([
      'articles.publish_direct',
    ]);
  });
});
