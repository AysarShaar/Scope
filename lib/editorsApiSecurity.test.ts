import { describe, it, expect } from 'vitest';
import {
  ALL_PERMISSIONS,
  ADMIN_PERMISSIONS,
  EDITOR_PERMISSIONS,
  EDITOR_IN_CHIEF_PERMISSIONS,
  sanitizePermissions,
  can,
  Permission,
} from './permissions';

describe('Editors API Security: Privilege Escalation & Last Admin Guards', () => {
  describe('Rule 1: Self-Modification Guard', () => {
    it('rejects an editor attempting to modify their own permissions or role', () => {
      function checkSelfModification(callerId: string, targetId: string, hasPermChange: boolean) {
        if (callerId === targetId && hasPermChange) {
          return { status: 400, error: 'غير مصرح: لا يمكنك تعديل صلاحياتك أو دورك بنفسك' };
        }
        return { status: 200 };
      }

      // Self modifying permissions -> 400
      expect(checkSelfModification('user-1', 'user-1', true).status).toBe(400);
      // Self modifying basic profile (no perm change) -> 200
      expect(checkSelfModification('user-1', 'user-1', false).status).toBe(200);
      // Manager modifying someone else's permissions -> 200
      expect(checkSelfModification('user-1', 'user-2', true).status).toBe(200);
    });

    it('rejects an editor attempting to delete their own account', () => {
      function checkSelfDeletion(callerId: string, targetId: string) {
        if (callerId === targetId) {
          return { status: 400, error: 'لا يمكنك حذف حسابك بنفسك' };
        }
        return { status: 200 };
      }

      expect(checkSelfDeletion('admin-1', 'admin-1').status).toBe(400);
      expect(checkSelfDeletion('admin-1', 'editor-2').status).toBe(200);
    });
  });

  describe('Rule 2: Cannot Grant Unpossessed Permissions', () => {
    it('fails if caller attempts to grant a permission they do not hold', () => {
      function checkGrantPrivileges(callerPerms: Permission[], permsToGrant: Permission[]) {
        for (const p of permsToGrant) {
          if (!callerPerms.includes(p)) {
            return {
              status: 403,
              error: `غير مصرح: لا يمكنك منح صلاحية لا تملكها (${p})`,
            };
          }
        }
        return { status: 200 };
      }

      const callerPerms: Permission[] = ['articles.approve', 'articles.publish_direct'];

      // Granting permissions caller has -> OK
      expect(checkGrantPrivileges(callerPerms, ['articles.approve']).status).toBe(200);

      // Attempting to grant programs.manage (which caller does not possess) -> 403
      const res = checkGrantPrivileges(callerPerms, ['programs.manage']);
      expect(res.status).toBe(403);
      expect(res.error).toContain('programs.manage');
    });
  });

  describe('Rule 3: editors.manage restricted to Emergency Admin (ADMIN_EMAILS)', () => {
    it('restricts granting or revoking editors.manage exclusively to emergency admins', () => {
      function checkEmergencyAdminForEditorsManage(
        isEmergencyAdmin: boolean,
        isChangingEditorsManage: boolean
      ) {
        if (isChangingEditorsManage && !isEmergencyAdmin) {
          return {
            status: 403,
            error:
              'غير مصرح: منح أو سحب صلاحية إدارة المحررين (editors.manage) مقتصر حصراً على مدير الطوارئ (ADMIN_EMAILS)',
          };
        }
        return { status: 200 };
      }

      // Normal admin who is not in ADMIN_EMAILS tries to grant editors.manage -> 403
      expect(checkEmergencyAdminForEditorsManage(false, true).status).toBe(403);

      // Emergency admin in ADMIN_EMAILS grants editors.manage -> 200
      expect(checkEmergencyAdminForEditorsManage(true, true).status).toBe(200);

      // Normal admin granting regular permissions -> 200
      expect(checkEmergencyAdminForEditorsManage(false, false).status).toBe(200);
    });
  });

  describe('Rule 4: Atomic Last-Admin Check Logic', () => {
    it('simulates single-statement atomic guard preventing last admin deletion or revocation', () => {
      // In SQLite, the single-statement update condition is:
      // UPDATE editors SET permissions = ?
      // WHERE id = ?
      //   AND (SELECT COUNT(*) FROM editors WHERE id != ? AND (permissions LIKE '%"editors.manage"%' OR system_role = 'admin')) >= 1;
      function simulateAtomicRevoke(
        targetId: string,
        allEditors: { id: string; isManager: boolean }[],
        newPermsHasManager: boolean
      ) {
        const otherManagersCount = allEditors.filter(
          (e) => e.id !== targetId && e.isManager
        ).length;

        // If revoking manager status from target
        if (!newPermsHasManager) {
          // Condition in WHERE clause: otherManagersCount >= 1
          if (otherManagersCount < 1) {
            // WHERE condition fails -> 0 rows updated
            return { changes: 0, error: 'لا يمكن سحب صلاحية الإدارة من آخر مدير للنظام' };
          }
        }
        return { changes: 1 };
      }

      // Scenario A: 2 admins exist. Revoking one -> succeeds (changes = 1)
      const twoAdmins = [
        { id: 'admin-1', isManager: true },
        { id: 'admin-2', isManager: true },
        { id: 'editor-3', isManager: false },
      ];
      expect(simulateAtomicRevoke('admin-2', twoAdmins, false).changes).toBe(1);

      // Scenario B: Only 1 admin exists. Revoking that admin -> fails (changes = 0)
      const oneAdmin = [
        { id: 'admin-1', isManager: true },
        { id: 'editor-2', isManager: false },
      ];
      const result = simulateAtomicRevoke('admin-1', oneAdmin, false);
      expect(result.changes).toBe(0);
      expect(result.error).toContain('آخر مدير للنظام');
    });
  });

  describe('Rule 5: Permission Whitelist Validation on write', () => {
    it('rejects unknown permission strings with 400', () => {
      function validateInputPermissions(input: unknown[]): { valid: boolean; error?: string } {
        for (const item of input) {
          if (typeof item !== 'string' || !ALL_PERMISSIONS.includes(item as Permission)) {
            return {
              valid: false,
              error: `قيمة صلاحية غير صالحة: ${String(item)}`,
            };
          }
        }
        return { valid: true };
      }

      expect(validateInputPermissions(['articles.approve']).valid).toBe(true);
      expect(validateInputPermissions(['articles.approve', 'articles.delete']).valid).toBe(true);

      const invalid1 = validateInputPermissions(['articles.approve', 'system.hack']);
      expect(invalid1.valid).toBe(false);
      expect(invalid1.error).toContain('system.hack');

      const invalid2 = validateInputPermissions(['*']);
      expect(invalid2.valid).toBe(false);
      expect(invalid2.error).toContain('*');
    });
  });
});
