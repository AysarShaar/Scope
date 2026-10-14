-- Baseline schema, matching db/schema.ts.
-- Idempotent: safe on a fresh database and on one that already has these tables.

CREATE TABLE IF NOT EXISTS `articles` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `subtitle` text,
  `category` text NOT NULL,
  `category_slug` text NOT NULL,
  `date` text DEFAULT (datetime('now')) NOT NULL,
  `image_type` text,
  `image_url` text,
  `caption` text,
  `video_url` text,
  `author_name` text,
  `author_role` text,
  `author_avatar` text,
  `editor_id` text,
  `content` text,
  `content_json` text,
  `status` text DEFAULT 'published' NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `breaking_news` (
  `id` text PRIMARY KEY NOT NULL,
  `time` text NOT NULL,
  `title` text NOT NULL,
  `is_special` integer DEFAULT 0,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `editors` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `email` text NOT NULL,
  `role` text NOT NULL,
  `system_role` text DEFAULT 'editor' NOT NULL,
  `avatar_url` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `editors_email_unique` ON `editors` (`email`);

CREATE TABLE IF NOT EXISTS `programs` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `subtitle` text,
  `description` text,
  `host` text,
  `image_type` text,
  `image_url` text,
  `episode_count` integer DEFAULT 0,
  `latest_episode` text,
  `youtube_id` text,
  `episodes` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE TABLE IF NOT EXISTS `episodes` (
  `id` text PRIMARY KEY NOT NULL,
  `program_id` text NOT NULL,
  `title` text NOT NULL,
  `youtube_id` text NOT NULL,
  `date` text DEFAULT (datetime('now')) NOT NULL,
  `description` text,
  `episode_number` integer,
  `duration` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE TABLE IF NOT EXISTS `settings` (
  `key` text PRIMARY KEY NOT NULL,
  `value` text NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
