import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const articles = sqliteTable('articles', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  category: text('category').notNull(),
  categorySlug: text('category_slug').notNull(),
  date: text('date').notNull().default(sql`(datetime('now'))`),
  imageType: text('image_type'),
  imageUrl: text('image_url'),
  caption: text('caption'),
  authorName: text('author_name'),
  authorRole: text('author_role'),
  authorAvatar: text('author_avatar'),
  editorId: text('editor_id'),
  content: text('content'), // JSON stringified string[]
  status: text('status').notNull().default('published'), // 'pending' | 'published'
  isSpecial: integer('is_special', { mode: 'boolean' }).notNull().default(false), // shown in the home page's tall hero box
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const breaking = sqliteTable('breaking_news', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const editors = sqliteTable('editors', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(),
  systemRole: text('system_role').notNull().default('editor'),
  permissions: text('permissions').notNull().default('[]'),
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const programs = sqliteTable('programs', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  description: text('description'),
  host: text('host'),
  imageType: text('image_type'),
  imageUrl: text('image_url'),
  episodeCount: integer('episode_count').default(0),
  latestEpisode: text('latest_episode'),
  youtubeId: text('youtube_id'),
  episodes: text('episodes'), // JSON stringified array of ProgramEpisode
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const episodes = sqliteTable('episodes', {
  id: text('id').primaryKey(),
  programId: text('program_id').notNull().references(() => programs.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  youtubeId: text('youtube_id').notNull(),
  date: text('date').notNull().default(sql`(datetime('now'))`),
  description: text('description'),
  episodeNumber: integer('episode_number'),
  duration: text('duration'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export const permissionsAuditLog = sqliteTable('permissions_audit_log', {
  id: text('id').primaryKey(),
  actorId: text('actor_id').notNull(),
  actorEmail: text('actor_email').notNull(),
  targetEditorId: text('target_editor_id').notNull(),
  action: text('action').notNull(), // 'grant' | 'revoke' | 'update'
  permissionsBefore: text('permissions_before').notNull(),
  permissionsAfter: text('permissions_after').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type BreakingNewsItem = typeof breaking.$inferSelect;
export type NewBreakingItem = typeof breaking.$inferInsert;
export type Editor = typeof editors.$inferSelect;
export type NewEditor = typeof editors.$inferInsert;
export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type ProgramEpisodeRow = typeof episodes.$inferSelect;
export type NewProgramEpisode = typeof episodes.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type NewSetting = typeof settings.$inferInsert;
export type PermissionsAuditLog = typeof permissionsAuditLog.$inferSelect;
export type NewPermissionsAuditLog = typeof permissionsAuditLog.$inferInsert;

