import { describe, it, expect, beforeEach } from 'vitest';
import { createLocalD1Adapter, LocalD1DatabaseLike } from './localD1Adapter';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: any };

describe('localD1Adapter', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sqliteDb: any;
  let adapter: LocalD1DatabaseLike;

  beforeEach(() => {
    sqliteDb = new DatabaseSync(':memory:');
    sqliteDb.exec(`
      CREATE TABLE articles (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        views INTEGER DEFAULT 0
      );
    `);
    adapter = createLocalD1Adapter(sqliteDb);
  });

  it('runs inserts and returns metadata', async () => {
    const res = await adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-1', 'Breaking News', 'politics', 10)
      .run();

    expect(res.success).toBe(true);
    expect(res.meta.changes).toBe(1);
  });

  it('queries all matching rows with all()', async () => {
    await adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-1', 'News 1', 'politics', 5)
      .run();
    await adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-2', 'News 2', 'economy', 15)
      .run();

    const res = await adapter
      .prepare('SELECT * FROM articles WHERE category = ?')
      .bind('politics')
      .all<{ id: string; title: string }>();

    expect(res.success).toBe(true);
    expect(res.results).toHaveLength(1);
    expect(res.results[0].title).toBe('News 1');
  });

  it('retrieves single row with first() or null when not found', async () => {
    await adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-1', 'Single Article', 'tech', 1)
      .run();

    const found = await adapter
      .prepare('SELECT * FROM articles WHERE id = ?')
      .bind('art-1')
      .first<{ id: string; title: string }>();

    expect(found).not.toBeNull();
    expect(found?.title).toBe('Single Article');

    const missing = await adapter
      .prepare('SELECT * FROM articles WHERE id = ?')
      .bind('non-existent')
      .first<{ id: string }>();

    expect(missing).toBeNull();
  });

  it('returns raw array tuples with raw()', async () => {
    await adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-1', 'Tuple Article', 'sports', 100)
      .run();

    const rows = await adapter
      .prepare('SELECT id, views FROM articles WHERE id = ?')
      .bind('art-1')
      .raw();

    expect(rows).toEqual([['art-1', 100]]);
  });

  it('ensures bind() is immutable and does not mutate earlier statements', async () => {
    await adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-1', 'Article A', 'news', 1)
      .run();
    await adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-2', 'Article B', 'news', 2)
      .run();

    const baseStmt = adapter.prepare('SELECT title FROM articles WHERE id = ?');
    const stmt1 = baseStmt.bind('art-1');
    const stmt2 = baseStmt.bind('art-2');

    const res1 = await stmt1.first<{ title: string }>();
    const res2 = await stmt2.first<{ title: string }>();

    expect(res1?.title).toBe('Article A');
    expect(res2?.title).toBe('Article B');
  });

  it('throws on query errors instead of silently swallowing them', async () => {
    const invalidStmt = adapter.prepare('SELECT * FROM non_existent_table');
    await expect(invalidStmt.all()).rejects.toThrow();
    await expect(invalidStmt.first()).rejects.toThrow();
    await expect(invalidStmt.run()).rejects.toThrow();
    await expect(adapter.exec('INVALID SQL STATEMENT')).rejects.toThrow();
  });

  it('executes batch transactions atomically and rolls back on failure', async () => {
    const s1 = adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-batch-1', 'Batch 1', 'tech', 1);
    const s2 = adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-batch-2', 'Batch 2', 'tech', 2);

    const batchRes = await adapter.batch([s1, s2]);
    expect(batchRes).toHaveLength(2);

    // Failing batch: duplicate key on art-batch-1 should roll back art-batch-3
    const s3 = adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-batch-3', 'Batch 3', 'tech', 3);
    const sFail = adapter
      .prepare('INSERT INTO articles (id, title, category, views) VALUES (?, ?, ?, ?)')
      .bind('art-batch-1', 'Duplicate', 'tech', 4);

    await expect(adapter.batch([s3, sFail])).rejects.toThrow();

    // Verify rollback: art-batch-3 must not exist
    const checkRolledBack = await adapter
      .prepare('SELECT * FROM articles WHERE id = ?')
      .bind('art-batch-3')
      .first();

    expect(checkRolledBack).toBeNull();
  });
});
