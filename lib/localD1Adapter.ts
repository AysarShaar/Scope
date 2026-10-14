/**
 * Local development D1 adapter.
 *
 * When running `next dev` on a platform that cannot use Cloudflare workerd
 * (e.g. Android/Termux), this module provides a D1Database-compatible shim
 * backed by a local SQLite file via Node's built-in `node:sqlite` module
 * (available in Node.js v22.5+).
 *
 * The shim implements the subset of the D1 API consumed by drizzle-orm/d1:
 *   - database.prepare(sql).bind(...params).all()     → { results: Row[], success: true, meta: {} }
 *   - database.prepare(sql).bind(...params).first()   → Row | null
 *   - database.prepare(sql).bind(...params).raw()     → Row[][] (array mode)
 *   - database.prepare(sql).bind(...params).run()     → { success: boolean, meta: {} }
 *   - database.batch([stmt1, stmt2])                  → D1Result[] (atomic transaction)
 *   - database.exec(sql)                              → void
 *
 * This file is ONLY imported in development (NODE_ENV !== 'production').
 */

import path from "path";
import fs from "fs";

type D1Row = Record<string, unknown>;

export interface D1Result<T = D1Row> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  all<T = D1Row>(): Promise<D1Result<T>>;
  first<T = D1Row>(): Promise<T | null>;
  raw<T = unknown[]>(): Promise<T[]>;
  run(): Promise<D1Result<never>>;
}

export interface LocalD1DatabaseLike {
  prepare(sql: string): D1PreparedStatementLike;
  batch<T = D1Row>(statements: D1PreparedStatementLike[]): Promise<D1Result<T>[]>;
  exec(sql: string): Promise<void>;
  /** Marker so getCloudflareEnv() can recognise this adapter */
  __isLocalAdapter: true;
}

function resolveDbPath(): string {
  return path.join(process.cwd(), "db", "local.sqlite");
}

let _adapter: LocalD1DatabaseLike | null = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createLocalD1Adapter(customDb?: any): LocalD1DatabaseLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sqliteDb: any = customDb;

  if (!sqliteDb) {
    const dbPath = resolveDbPath();
    if (!fs.existsSync(dbPath)) {
      throw new Error(`[localD1Adapter] Database file not found at ${dbPath}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let DatabaseSync: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      ({ DatabaseSync } = require("node:sqlite"));
    } catch {
      throw new Error("[localD1Adapter] node:sqlite module not available");
    }

    sqliteDb = new DatabaseSync(dbPath);
    console.log(`[localD1Adapter] Using local SQLite: ${dbPath}`);
  }

  function makeStmt(sql: string, boundValues: unknown[] = []): D1PreparedStatementLike {
    const stmt: D1PreparedStatementLike = {
      bind(...values: unknown[]) {
        return makeStmt(sql, values);
      },

      async all<T = D1Row>(): Promise<D1Result<T>> {
        try {
          const prepared = sqliteDb.prepare(sql);
          const rows = (boundValues.length > 0
            ? prepared.all(...boundValues)
            : prepared.all()) as T[];
          return { results: rows, success: true, meta: {} };
        } catch (err) {
          console.error("[localD1Adapter] .all() error:", err, "\nSQL:", sql);
          throw err;
        }
      },

      async first<T = D1Row>(): Promise<T | null> {
        try {
          const prepared = sqliteDb.prepare(sql);
          const row = (boundValues.length > 0
            ? prepared.get(...boundValues)
            : prepared.get()) as T | undefined;
          return row ?? null;
        } catch (err) {
          console.error("[localD1Adapter] .first() error:", err, "\nSQL:", sql);
          throw err;
        }
      },

      async raw<T = unknown[]>(): Promise<T[]> {
        try {
          const prepared = sqliteDb.prepare(sql);
          prepared.setReturnArrays(true);
          const rows = (boundValues.length > 0
            ? prepared.all(...boundValues)
            : prepared.all()) as unknown as T[];
          return rows;
        } catch (err) {
          console.error("[localD1Adapter] .raw() error:", err, "\nSQL:", sql);
          throw err;
        }
      },

      async run(): Promise<D1Result<never>> {
        try {
          const prepared = sqliteDb.prepare(sql);
          const result =
            boundValues.length > 0
              ? prepared.run(...boundValues)
              : prepared.run();
          return {
            results: [],
            success: true,
            meta: { changes: result.changes, last_row_id: result.lastInsertRowid },
          };
        } catch (err) {
          console.error("[localD1Adapter] .run() error:", err, "\nSQL:", sql);
          throw err;
        }
      },
    };

    return stmt;
  }

  return {
    __isLocalAdapter: true,
    prepare(sql: string) {
      return makeStmt(sql, []);
    },
    async batch<T = D1Row>(statements: D1PreparedStatementLike[]): Promise<D1Result<T>[]> {
      sqliteDb.exec("BEGIN");
      try {
        const results: D1Result<T>[] = [];
        for (const s of statements) {
          const res = await s.all<T>();
          results.push(res);
        }
        sqliteDb.exec("COMMIT");
        return results;
      } catch (err) {
        sqliteDb.exec("ROLLBACK");
        console.error("[localD1Adapter] .batch() transaction rolled back:", err);
        throw err;
      }
    },
    async exec(sql: string) {
      try {
        sqliteDb.exec(sql);
      } catch (err) {
        console.error("[localD1Adapter] .exec() error:", err);
        throw err;
      }
    },
  };
}

export function getLocalD1Adapter(): LocalD1DatabaseLike | null {
  if (_adapter) return _adapter;
  try {
    _adapter = createLocalD1Adapter();
    return _adapter;
  } catch (err) {
    console.warn("[localD1Adapter] Could not initialize local adapter:", (err as Error)?.message || err);
    return null;
  }
}
