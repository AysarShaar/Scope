-- Log of social posts. The partial unique index stops the same article being
-- posted twice to a platform (pending or success); failed rows can be retried.
CREATE TABLE IF NOT EXISTS `social_posts` (
  `id` text PRIMARY KEY NOT NULL,
  `article_id` text NOT NULL,
  `platform` text NOT NULL,
  `status` text NOT NULL,
  `external_id` text,
  `error` text,
  `created_at` text DEFAULT (datetime('now')) NOT NULL,
  `updated_at` text DEFAULT (datetime('now')) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS `social_posts_active_uq`
  ON `social_posts` (`article_id`, `platform`)
  WHERE `status` IN ('pending', 'success');
