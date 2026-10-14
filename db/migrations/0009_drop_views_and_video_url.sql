-- Drop views and video_url columns from articles table
ALTER TABLE `articles` DROP COLUMN `views`;
ALTER TABLE `articles` DROP COLUMN `video_url`;
ALTER TABLE `articles` DROP COLUMN `content_json`;
