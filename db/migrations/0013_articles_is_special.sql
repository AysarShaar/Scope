-- Marks the article shown in the home page's tall hero box ("special coverage").
-- The home page picks the newest published article that has is_special = 1.
ALTER TABLE `articles` ADD COLUMN `is_special` integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS `idx_articles_special_created` ON `articles` (`is_special`, `status`, `created_at`);
