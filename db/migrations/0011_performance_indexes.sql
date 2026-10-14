-- Public listings filter on status, optionally on category, and always sort by created_at.
-- Without these D1 scans (and sorts) the whole articles table on every list/home/category request.
CREATE INDEX IF NOT EXISTS `idx_articles_status_created` ON `articles` (`status`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_articles_status_category_created` ON `articles` (`status`, `category_slug`, `created_at`);
CREATE INDEX IF NOT EXISTS `idx_episodes_program_date` ON `episodes` (`program_id`, `date`);
CREATE INDEX IF NOT EXISTS `idx_breaking_created` ON `breaking_news` (`created_at`);
