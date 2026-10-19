import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const TABLES = [
  'articles',
  'breaking_news',
  'editors',
  'programs',
  'settings',
  'episodes',
  'social_posts',
  'd1_migrations',
];

const ROOT_DIR = process.cwd();
const DUMP_PATH = path.join(ROOT_DIR, 'db', 'remote_dump.sql');
const LOCAL_SQLITE_PATH = path.join(ROOT_DIR, 'db', 'local.sqlite');
const WRANGLER_D1_DIR = path.join(ROOT_DIR, '.wrangler', 'state', 'v3', 'd1');
const INDEXES_SQL_PATH = path.join(ROOT_DIR, 'db', 'migrations', '0011_performance_indexes.sql');
const FTS_SQL_PATH = path.join(ROOT_DIR, 'db', 'migrations', '0012_articles_fts.sql');
const MIGRATIONS_DIR = path.join(ROOT_DIR, 'db', 'migrations');

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: ROOT_DIR });
}

console.log('--- 1. Exporting data from remote Cloudflare D1 ---');
const tableFlags = TABLES.map((t) => `--table=${t}`).join(' ');
run(`npx wrangler d1 export DB --remote ${tableFlags} --output="${DUMP_PATH}" -y`);

console.log('\n--- 2. Resetting local Wrangler D1 database ---');
if (fs.existsSync(WRANGLER_D1_DIR)) {
  fs.rmSync(WRANGLER_D1_DIR, { recursive: true, force: true });
}

console.log('\n--- 3. Importing dump into local Wrangler D1 ---');
run(`npx wrangler d1 execute DB --local --file="${DUMP_PATH}"`);
run(`npx wrangler d1 execute DB --local --file="${INDEXES_SQL_PATH}"`);
run(`npx wrangler d1 execute DB --local --file="${FTS_SQL_PATH}"`);
run(`npx wrangler d1 migrations apply DB --local`);

console.log('\n--- 4. Updating db/local.sqlite for local Next.js dev ---');
if (fs.existsSync(LOCAL_SQLITE_PATH)) {
  fs.rmSync(LOCAL_SQLITE_PATH, { force: true });
}

const dumpSql = fs.readFileSync(DUMP_PATH, 'utf8');
const indexesSql = fs.readFileSync(INDEXES_SQL_PATH, 'utf8');
const ftsSql = fs.readFileSync(FTS_SQL_PATH, 'utf8');

const localDb = new DatabaseSync(LOCAL_SQLITE_PATH);
localDb.exec(dumpSql);
localDb.exec(indexesSql);
localDb.exec(ftsSql);

// Apply any migrations that weren't in remote dump
const appliedRows = localDb.prepare('SELECT name FROM d1_migrations').all();
const appliedSet = new Set(appliedRows.map((r) => r.name));

const migrationFiles = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

for (const file of migrationFiles) {
  if (!appliedSet.has(file)) {
    console.log(`Applying pending migration to local.sqlite: ${file}`);
    const migSql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    localDb.exec(migSql);
    localDb
      .prepare("INSERT INTO d1_migrations (name, applied_at) VALUES (?, datetime('now'))")
      .run(file);
  }
}

localDb.close();

console.log('\n✅ Successfully pulled and synchronized remote D1 database locally!');
