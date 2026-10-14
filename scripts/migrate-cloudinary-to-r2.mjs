#!/usr/bin/env node
/**
 * Moves images that are still on Cloudinary to the R2 bucket and prepares the SQL
 * that points the database at the new URLs.
 *
 *   node scripts/migrate-cloudinary-to-r2.mjs            dry run: lists what would move, changes nothing
 *   node scripts/migrate-cloudinary-to-r2.mjs --apply    downloads, uploads to R2, checks the new URLs, writes migrate.sql
 *
 * Options: --dump <file>   use an existing `wrangler d1 export` dump instead of exporting one
 *
 * Nothing is deleted from Cloudinary and the database is not touched: review
 * cloudinary-migration/migrate.sql, then run it yourself (the command is printed at the end).
 * The script can be re-run: images already in cloudinary-migration/map.json are skipped.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BUCKET = 'scope-media-images';
const NEW_BASE_URL = 'https://img.scope-media.net';
const WORK_DIR = 'cloudinary-migration';
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const D1_BINDING = 'DB';

// Text columns that can hold image URLs (JSON columns included: the URL is replaced inside the text).
const COLUMNS = [
  ['articles', 'image_url'],
  ['articles', 'author_avatar'],
  ['articles', 'content'],
  ['editors', 'avatar_url'],
  ['programs', 'image_url'],
  ['programs', 'episodes'],
  ['programs', 'description'],
  ['settings', 'value'],
];

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const URL_PATTERN = /https:\/\/res\.cloudinary\.com\/[^\s"'<>\\]+/g;

export function extractCloudinaryUrls(text) {
  return [...new Set(text.match(URL_PATTERN) ?? [])];
}

/** A URL cut short by a quote or bracket would be replaced halfway, so only URLs that end in an image extension are touched. */
export function isMigratable(url) {
  return /\.(jpe?g|png|webp|gif|avif)$/i.test(url);
}

export function keyForUrl(url, ext) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 20);
  return `legacy/${hash}.${ext}`;
}

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

export function buildSql(map) {
  const statements = [];
  for (const [url, { key }] of Object.entries(map)) {
    const oldUrl = sqlString(url);
    const newUrl = sqlString(`${NEW_BASE_URL}/${key}`);
    const like = sqlString(`%${url.replace(/[\\%_]/g, '\\$&')}%`);
    for (const [table, column] of COLUMNS) {
      statements.push(
        `UPDATE ${table} SET ${column} = REPLACE(${column}, ${oldUrl}, ${newUrl}) WHERE ${column} LIKE ${like} ESCAPE '\\';`,
      );
    }
  }
  return statements.join('\n') + '\n';
}

function wrangler(args) {
  return execFileSync('npx', ['wrangler', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
}

function readJson(path, fallback) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : fallback;
}

async function migrateOne(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`download failed (HTTP ${res.status})`);
  const mime = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = EXT_BY_MIME[mime];
  if (!ext) throw new Error(`unsupported content type "${mime}"`);

  const key = keyForUrl(url, ext);
  const tmp = join(WORK_DIR, `tmp.${ext}`);
  writeFileSync(tmp, Buffer.from(await res.arrayBuffer()));
  try {
    wrangler([
      'r2', 'object', 'put', `${BUCKET}/${key}`,
      '--file', tmp,
      '--content-type', mime,
      '--cache-control', CACHE_CONTROL,
      '--remote',
    ]);
  } finally {
    rmSync(tmp, { force: true });
  }

  const check = await fetch(`${NEW_BASE_URL}/${key}`, { method: 'HEAD' });
  if (!check.ok) throw new Error(`uploaded but ${NEW_BASE_URL}/${key} answers HTTP ${check.status}`);
  return { key, mime };
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const dumpIndex = args.indexOf('--dump');
  let dumpPath = dumpIndex >= 0 ? args[dumpIndex + 1] : null;

  mkdirSync(WORK_DIR, { recursive: true });

  if (!dumpPath) {
    dumpPath = join(WORK_DIR, `backup-${new Date().toISOString().slice(0, 10)}.sql`);
    console.log('Exporting the remote database (also kept as a backup)...');
    wrangler(['d1', 'export', D1_BINDING, '--remote', '--no-schema', `--output=${dumpPath}`]);
  }

  const allUrls = extractCloudinaryUrls(readFileSync(dumpPath, 'utf8'));
  const urls = allUrls.filter(isMigratable);
  const skipped = allUrls.filter((u) => !isMigratable(u));
  if (skipped.length) {
    console.log(`Skipping ${skipped.length} URL(s) that do not end in an image extension (handle them by hand):`);
    skipped.forEach((u) => console.log('  ' + u));
  }
  const mapPath = join(WORK_DIR, 'map.json');
  const map = readJson(mapPath, {});
  const pending = urls.filter((u) => !map[u]);

  console.log(`Found ${urls.length} Cloudinary URLs in the database (${pending.length} not yet moved).`);
  if (!apply) {
    pending.slice(0, 20).forEach((u) => console.log('  ' + u));
    if (pending.length > 20) console.log(`  ... and ${pending.length - 20} more`);
    console.log('\nDry run only. Run again with --apply to move them.');
    return;
  }

  const failures = [];
  let done = 0;
  for (const url of pending) {
    try {
      map[url] = await migrateOne(url);
      writeFileSync(mapPath, JSON.stringify(map, null, 2));
    } catch (err) {
      failures.push({ url, error: err.message });
    }
    done++;
    if (done % 10 === 0 || done === pending.length) console.log(`  ${done}/${pending.length}`);
  }

  const sqlPath = join(WORK_DIR, 'migrate.sql');
  writeFileSync(sqlPath, buildSql(map));
  console.log(`\nMoved ${Object.keys(map).length} images. ${failures.length} failed.`);
  failures.forEach((f) => console.log(`  FAILED ${f.url}\n         ${f.error}`));

  console.log(`\nNext, review ${sqlPath}, then run:`);
  console.log(`  npx wrangler d1 execute ${D1_BINDING} --remote --file=${sqlPath}`);
  console.log('Keep the Cloudinary account until you have checked the site.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
