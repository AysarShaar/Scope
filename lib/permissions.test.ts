import { describe, it, expect } from 'vitest';
import {
  can,
  ALL_PERMISSIONS,
  EDITOR_PERMISSIONS,
  EDITOR_IN_CHIEF_PERMISSIONS,
  ADMIN_PERMISSIONS,
  parseStoredPermissions,
  sanitizePermissions,
  PERMISSION_DEFINITIONS,
  Permission,
} from './permissions';

describe('permissions system - unit tests', () => {
  describe('can() function', () => {
    it('returns false when user is null, undefined, or has no permissions', () => {
      expect(can(null, 'articles.approve')).toBe(false);
      expect(can(undefined, 'articles.approve')).toBe(false);
      expect(can({}, 'articles.approve')).toBe(false);
      expect(can({ permissions: [] }, 'articles.approve')).toBe(false);
      expect(can({ permissions: undefined }, 'articles.approve')).toBe(false);
    });

    it('returns true only when the specific permission is in the user list', () => {
      const user = { permissions: ['articles.approve', 'articles.delete'] };
      expect(can(user, 'articles.approve')).toBe(true);
      expect(can(user, 'articles.delete')).toBe(true);
      expect(can(user, 'articles.publish_direct')).toBe(false);
      expect(can(user, 'breaking.manage')).toBe(false);
    });

    it('strictly avoids wildcards or implicit grants', () => {
      // Even if wildcard string is somehow present, can() does not treat it as match-all
      const userWithWildcard = { permissions: ['*'] };
      expect(can(userWithWildcard, 'articles.publish_direct')).toBe(false);
      expect(can(userWithWildcard, 'editors.manage')).toBe(false);
    });

    it('verifies presets match expected capabilities', () => {
      // Editor: 0 permissions (can only draft and submit for review)
      expect(EDITOR_PERMISSIONS).toEqual([]);
      expect(can({ permissions: EDITOR_PERMISSIONS }, 'articles.publish_direct')).toBe(false);
      expect(can({ permissions: EDITOR_PERMISSIONS }, 'articles.approve')).toBe(false);

      // Editor-in-Chief: 8 permissions (including settings.live_stream for legacy exact parity), but not analytics or editors.manage
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('articles.publish_direct');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('articles.approve');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('articles.delete');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('articles.set_special');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('articles.edit_any');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('breaking.manage');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('programs.manage');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).toContain('settings.live_stream');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).not.toContain('editors.manage');
      expect(EDITOR_IN_CHIEF_PERMISSIONS).not.toContain('analytics.view');

      // Admin: all 10 permissions
      expect(ADMIN_PERMISSIONS.length).toBe(10);
      ALL_PERMISSIONS.forEach((p) => {
        expect(can({ permissions: ADMIN_PERMISSIONS }, p)).toBe(true);
      });
    });
  });

  describe('parseStoredPermissions() - fail-closed safe parser', () => {
    it('parses valid JSON array with known permissions', () => {
      const json = JSON.stringify(['articles.publish_direct', 'breaking.manage']);
      expect(parseStoredPermissions(json)).toEqual([
        'articles.publish_direct',
        'breaking.manage',
      ]);
    });

    it('filters out unknown strings in stored array', () => {
      const json = JSON.stringify([
        'articles.publish_direct',
        'invalid.permission',
        'system.root',
        '*',
      ]);
      expect(parseStoredPermissions(json)).toEqual(['articles.publish_direct']);
    });

    it('fails closed to empty array on corrupted JSON or invalid types', () => {
      expect(parseStoredPermissions('{ broken: json')).toEqual([]);
      expect(parseStoredPermissions('')).toEqual([]);
      expect(parseStoredPermissions('null')).toEqual([]);
      expect(parseStoredPermissions('123')).toEqual([]);
      expect(parseStoredPermissions('"string"')).toEqual([]);
      expect(parseStoredPermissions('{}')).toEqual([]);
      expect(parseStoredPermissions(null as unknown as string)).toEqual([]);
      expect(parseStoredPermissions(undefined as unknown as string)).toEqual([]);
    });
  });

  describe('sanitizePermissions() - whitelist validator', () => {
    it('accepts array of valid permissions and removes duplicates and unknowns', () => {
      const input = [
        'articles.publish_direct',
        'articles.publish_direct',
        'breaking.manage',
        'not_a_perm',
        123 as unknown as string,
      ];
      const result = sanitizePermissions(input);
      expect(result).toEqual(['articles.publish_direct', 'breaking.manage']);
    });

    it('returns empty array on non-array input', () => {
      expect(sanitizePermissions(null)).toEqual([]);
      expect(sanitizePermissions(undefined)).toEqual([]);
      expect(sanitizePermissions('not-array')).toEqual([]);
      expect(sanitizePermissions({ foo: 'bar' })).toEqual([]);
    });
  });

  describe('PERMISSION_DEFINITIONS & PERMISSION_MAP', () => {
    it('defines Arabic labels and descriptions for all 10 permissions', () => {
      expect(ALL_PERMISSIONS.length).toBe(10);
      expect(PERMISSION_DEFINITIONS.length).toBe(10);
      ALL_PERMISSIONS.forEach((perm) => {
        const def = PERMISSION_DEFINITIONS.find((d) => d.id === perm);
        expect(def).toBeDefined();
        expect(def?.label).toBeTruthy();
        expect(def?.description).toBeTruthy();
      });
    });
  });
});
