import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createLocalD1Adapter, LocalD1DatabaseLike } from './localD1Adapter';
import { Permission, ADMIN_PERMISSIONS } from './permissions';

const { DatabaseSync } = require('node:sqlite');

let testSqlite: any;
let testAdapter: LocalD1DatabaseLike;
const mockAuth = vi.fn();

vi.mock('./cloudflare', () => ({
  getCloudflareEnv: () => ({ DB: testAdapter }),
  isCloudflareEdge: () => true,
}));

vi.mock('./auth', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    authenticateRequest: (...args: any[]) => mockAuth(...args),
  };
});

// Import the actual route handlers
import { PUT as articlePut } from '../app/api/articles/[id]/route';
import { GET as settingsGet } from '../app/api/settings/route';
import { GET as editorsGet, POST as editorsPost } from '../app/api/editors/route';
import { PUT as editorPut, DELETE as editorDelete } from '../app/api/editors/[id]/route';

function initTestDb() {
  testSqlite = new DatabaseSync(':memory:');
  testSqlite.exec(`
    CREATE TABLE editors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL,
      system_role TEXT NOT NULL DEFAULT 'editor',
      permissions TEXT NOT NULL DEFAULT '[]',
      avatar_url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT,
      category TEXT NOT NULL,
      category_slug TEXT,
      date TEXT,
      image_type TEXT,
      image_url TEXT,
      caption TEXT,
      author_name TEXT,
      author_role TEXT,
      author_avatar TEXT,
      editor_id TEXT,
      content TEXT,
      status TEXT NOT NULL DEFAULT 'published',
      is_special INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE permissions_audit_log (
      id TEXT PRIMARY KEY,
      actor_id TEXT NOT NULL,
      actor_email TEXT NOT NULL,
      target_editor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      permissions_before TEXT NOT NULL,
      permissions_after TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  testAdapter = createLocalD1Adapter(testSqlite);
}

describe('Real Handlers Integration Tests (End-to-End with in-memory SQLite)', () => {
  beforeEach(() => {
    initTestDb();
    mockAuth.mockReset();
    process.env.ADMIN_EMAILS = 'emergency@scopemedia.com';
  });

  // (أ) مراجع يملك approve فقط يعتمد مقال غيره (نجاح) وبعد ذلك مقاله (رفض)
  it('(A) Reviewer with articles.approve only approves another editor article (200), then own article (403)', async () => {
    const now = new Date().toISOString();
    // Insert pending article written by Author 1
    testSqlite.exec(`
      INSERT INTO articles (id, title, category, editor_id, status, created_at, updated_at)
      VALUES ('art-other', 'Other Editor Article', 'news', 'author-1', 'pending', '${now}', '${now}');
      INSERT INTO articles (id, title, category, editor_id, status, created_at, updated_at)
      VALUES ('art-own', 'Reviewer Own Article', 'news', 'reviewer-1', 'pending', '${now}', '${now}');
    `);

    // Reviewer has articles.approve but NOT articles.publish_direct
    mockAuth.mockResolvedValue({
      isValid: true,
      editorId: 'reviewer-1',
      email: 'reviewer@scopemedia.com',
      permissions: ['articles.approve' as Permission],
    });

    // 1. Approving another editor's article -> MUST SUCCEED (200)
    const reqOther = new NextRequest('http://localhost/api/articles/art-other', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    const resOther = await articlePut(reqOther, { params: Promise.resolve({ id: 'art-other' }) });
    expect(resOther.status).toBe(200);
    const bodyOther = await resOther.json();
    expect(bodyOther.success).toBe(true);

    const checkOther = testSqlite
      .prepare("SELECT status FROM articles WHERE id = 'art-other'")
      .get() as any;
    expect(checkOther.status).toBe('published');

    // 2. Approving their OWN article -> MUST BE REJECTED (403)
    const reqOwn = new NextRequest('http://localhost/api/articles/art-own', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'published' }),
    });
    const resOwn = await articlePut(reqOwn, { params: Promise.resolve({ id: 'art-own' }) });
    expect(resOwn.status).toBe(403);
    const bodyOwn = await resOwn.json();
    expect(bodyOwn.success).toBe(false);
    expect(bodyOwn.error).toContain('لا يمكنك اعتماد مقالك الخاص');

    const checkOwn = testSqlite
      .prepare("SELECT status FROM articles WHERE id = 'art-own'")
      .get() as any;
    expect(checkOwn.status).toBe('pending');
  });

  // (ب) محرر عادي يعدّل مقاله المنشور (نجاح)
  it('(B) Regular editor modifies their own published article without status rejection', async () => {
    const now = new Date().toISOString();
    testSqlite.exec(`
      INSERT INTO articles (id, title, category, editor_id, status, created_at, updated_at)
      VALUES ('art-pub-1', 'Initial Published Title', 'culture', 'editor-bob', 'published', '${now}', '${now}');
    `);

    // Regular editor has empty permissions
    mockAuth.mockResolvedValue({
      isValid: true,
      editorId: 'editor-bob',
      email: 'bob@scopemedia.com',
      permissions: [] as Permission[],
    });

    // Bob edits his published article and sends status: 'pending' (typical editor UI submission)
    const req = new NextRequest('http://localhost/api/articles/art-pub-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Updated Title By Bob',
        status: 'pending',
      }),
    });

    const res = await articlePut(req, { params: Promise.resolve({ id: 'art-pub-1' }) });
    expect(res.status).toBe(200);
    const resBody = await res.json();
    expect(resBody.success).toBe(true);

    const check = testSqlite
      .prepare("SELECT title, status FROM articles WHERE id = 'art-pub-1'")
      .get() as any;
    expect(check.title).toBe('Updated Title By Bob');
  });

  // (ج) سحب editors.manage من مدير بوجود مدير آخر (نجاح) وبغيابه (400)
  it('(C) Revoking editors.manage succeeds when another manager exists (200), and fails when last manager (400)', async () => {
    const now = new Date().toISOString();
    // Insert 2 managers
    testSqlite.exec(`
      INSERT INTO editors (id, name, email, role, system_role, permissions, created_at)
      VALUES ('admin-1', 'مدير 1', 'admin1@scopemedia.com', 'مدير', 'admin', '["articles.publish_direct","editors.manage"]', '${now}');
      INSERT INTO editors (id, name, email, role, system_role, permissions, created_at)
      VALUES ('admin-2', 'مدير 2', 'admin2@scopemedia.com', 'مدير', 'admin', '["articles.publish_direct","editors.manage"]', '${now}');
    `);

    // Emergency admin acting to revoke admin-2
    mockAuth.mockResolvedValue({
      isValid: true,
      editorId: 'emergency-id',
      email: 'emergency@scopemedia.com',
      permissions: [...ADMIN_PERMISSIONS],
    });

    // 1. Revoking admin-2 when admin-1 exists -> SUCCESS (200)
    const reqRevoke2 = new NextRequest('http://localhost/api/editors/admin-2', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permissions: ['articles.publish_direct'],
      }),
    });

    const resRevoke2 = await editorPut(reqRevoke2, { params: Promise.resolve({ id: 'admin-2' }) });
    expect(resRevoke2.status).toBe(200);

    const check2 = testSqlite
      .prepare("SELECT permissions, system_role FROM editors WHERE id = 'admin-2'")
      .get() as any;
    expect(check2.permissions).not.toContain('editors.manage');

    // 2. Now attempt to revoke admin-1 (who is the sole remaining manager holding editors.manage) -> MUST FAIL (400)
    const reqRevoke1 = new NextRequest('http://localhost/api/editors/admin-1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        permissions: ['articles.publish_direct'],
      }),
    });

    const resRevoke1 = await editorPut(reqRevoke1, { params: Promise.resolve({ id: 'admin-1' }) });
    expect(resRevoke1.status).toBe(400);
    const bodyRevoke1 = await resRevoke1.json();
    expect(bodyRevoke1.success).toBe(false);
    expect(bodyRevoke1.error).toContain('لا يمكن سحب صلاحيات الإدارة من آخر مدير نظام');

    // Verify admin-1 still has editors.manage in DB
    const check1 = testSqlite
      .prepare("SELECT permissions FROM editors WHERE id = 'admin-1'")
      .get() as any;
    expect(check1.permissions).toContain('editors.manage');
  });

  // (د) مدير غير طوارئ يرسل permissions:[] + systemRole:'admin' (يُتجاهل systemRole)
  it('(D) POST /api/editors ignores systemRole from client and derives it strictly on server', async () => {
    // Non-emergency manager with editors.manage
    mockAuth.mockResolvedValue({
      isValid: true,
      editorId: 'mgr-1',
      email: 'manager@scopemedia.com',
      permissions: ['editors.manage', 'articles.publish_direct', 'articles.approve'],
    });

    // Actor tries to send permissions: [] + systemRole: 'admin'
    const req = new NextRequest('http://localhost/api/editors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'محرر تجريبي',
        email: 'test.editor@example.com',
        role: 'محرر أخبار',
        systemRole: 'admin',
        permissions: [],
      }),
    });

    const res = await editorsPost(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);

    // systemRole MUST be derived as 'editor' because permissions are empty!
    expect(body.data.systemRole).toBe('editor');

    const inDb = testSqlite
      .prepare("SELECT system_role, permissions FROM editors WHERE email = 'test.editor@example.com'")
      .get() as any;
    expect(inDb.system_role).toBe('editor');
    expect(inDb.permissions).toBe('[]');
  });

  // (هـ) GET /api/settings لا يعيد أي مفتاح غير live_stream_id
  it('(E) GET /api/settings returns strictly live_stream_id and omits any other settings keys', async () => {
    const now = new Date().toISOString();
    testSqlite.exec(`
      INSERT INTO settings (key, value, updated_at) VALUES ('live_stream_id', 'yt_12345', '${now}');
      INSERT INTO settings (key, value, updated_at) VALUES ('cf_api_token', 'secret_token_abc', '${now}');
      INSERT INTO settings (key, value, updated_at) VALUES ('cf_zone_id', 'zone_id_xyz', '${now}');
      INSERT INTO settings (key, value, updated_at) VALUES ('internal_private_key', 'private_val', '${now}');
    `);

    // Logged in admin request
    mockAuth.mockResolvedValue({
      isValid: true,
      editorId: 'admin-id',
      email: 'admin@scopemedia.com',
      permissions: [...ADMIN_PERMISSIONS],
    });

    const req = new NextRequest('http://localhost/api/settings');
    const res = await settingsGet(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ live_stream_id: 'yt_12345' });
    expect(body.data).not.toHaveProperty('cf_api_token');
    expect(body.data).not.toHaveProperty('cf_zone_id');
    expect(body.data).not.toHaveProperty('internal_private_key');
  });

  // (و) تطبيق الهجرة 0014 كاملة على قاعدة تجريبية وإثبات أن مجلد db/migrations/ لا يحوي ملف تراجع
  it('(F) Migration 0014 executes cleanly on fresh DB and db/migrations contains no rollback file', async () => {
    const migrationsDir = path.resolve(process.cwd(), 'db/migrations');
    const migrationFiles = fs.readdirSync(migrationsDir);

    // Assert that NO rollback file exists in db/migrations/
    const hasRollback = migrationFiles.some((f) => f.toLowerCase().includes('rollback'));
    expect(hasRollback, 'db/migrations must NEVER contain rollback files').toBe(false);

    // Verify rollback file was properly placed in db/rollbacks/
    const rollbacksDir = path.resolve(process.cwd(), 'db/rollbacks');
    expect(fs.existsSync(rollbacksDir)).toBe(true);
    const rollbackFiles = fs.readdirSync(rollbacksDir);
    expect(rollbackFiles).toContain('0014_rollback_editor_permissions.sql');

    // Fresh test SQLite database: apply 0000 init then 0014 migration
    const freshDb = new DatabaseSync(':memory:');
    freshDb.exec(`
      CREATE TABLE editors (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        role text NOT NULL,
        avatar_url text,
        created_at text NOT NULL,
        email text,
        system_role text DEFAULT 'editor' NOT NULL
      );
      INSERT INTO editors (id, name, role, email, system_role, created_at)
      VALUES ('e1', 'محرر تجريبي', 'محرر', 'ed@example.com', 'editor', '2026-01-01');
      INSERT INTO editors (id, name, role, email, system_role, created_at)
      VALUES ('e2', 'رئيس تحرير تجريبي', 'رئيس تحرير', 'chief@example.com', 'editor_in_chief', '2026-01-01');
      INSERT INTO editors (id, name, role, email, system_role, created_at)
      VALUES ('e3', 'مدير تجريبي', 'مدير', 'admin@example.com', 'admin', '2026-01-01');
    `);

    // Read and run migration 0014 SQL
    const migration0014Sql = fs.readFileSync(
      path.join(migrationsDir, '0014_editor_permissions.sql'),
      'utf-8'
    );
    freshDb.exec(migration0014Sql);

    // Check migrated rows
    const editorRow = freshDb.prepare("SELECT permissions FROM editors WHERE id = 'e1'").get() as any;
    expect(JSON.parse(editorRow.permissions)).toEqual([]);

    const chiefRow = freshDb.prepare("SELECT permissions FROM editors WHERE id = 'e2'").get() as any;
    const chiefPerms = JSON.parse(chiefRow.permissions);
    expect(chiefPerms).toContain('articles.publish_direct');
    expect(chiefPerms).toContain('articles.approve');
    expect(chiefPerms).toContain('settings.live_stream');
    expect(chiefPerms).not.toContain('editors.manage');

    const adminRow = freshDb.prepare("SELECT permissions FROM editors WHERE id = 'e3'").get() as any;
    const adminPerms = JSON.parse(adminRow.permissions);
    expect(adminPerms).toHaveLength(10);
    expect(adminPerms).toContain('editors.manage');

    // Verify permissions_audit_log table exists and can be written to
    const auditCount = freshDb.prepare("SELECT count(*) as count FROM permissions_audit_log").get() as any;
    expect(auditCount.count).toBe(0);
  });
});
