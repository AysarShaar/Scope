-- Drop triggers and view referencing time and is_special
DROP TRIGGER IF EXISTS `breaking_insert_trg`;
DROP TRIGGER IF EXISTS `breaking_delete_trg`;
DROP VIEW IF EXISTS `breaking`;

-- Drop time and is_special columns from breaking_news table
ALTER TABLE `breaking_news` DROP COLUMN `time`;
ALTER TABLE `breaking_news` DROP COLUMN `is_special`;

-- Recreate view and triggers without time and is_special
CREATE VIEW IF NOT EXISTS `breaking` AS
  SELECT id, title, created_at FROM breaking_news;

CREATE TRIGGER IF NOT EXISTS `breaking_insert_trg` INSTEAD OF INSERT ON `breaking`
BEGIN
  INSERT INTO `breaking_news` (id, title, created_at)
  VALUES (NEW.id, NEW.title, NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS `breaking_delete_trg` INSTEAD OF DELETE ON `breaking`
BEGIN
  DELETE FROM `breaking_news` WHERE id = OLD.id;
END;
