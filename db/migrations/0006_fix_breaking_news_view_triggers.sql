-- Recreate the breaking view and its insert/delete triggers
CREATE TABLE IF NOT EXISTS `breaking_news` (
  `id` text PRIMARY KEY NOT NULL,
  `time` text NOT NULL,
  `title` text NOT NULL,
  `is_special` integer DEFAULT 0,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

CREATE VIEW IF NOT EXISTS `breaking` AS
  SELECT id, time, title, is_special, created_at FROM breaking_news;

CREATE TRIGGER IF NOT EXISTS `breaking_insert_trg` INSTEAD OF INSERT ON `breaking`
BEGIN
  INSERT INTO `breaking_news` (id, time, title, is_special, created_at)
  VALUES (NEW.id, NEW.time, NEW.title, NEW.is_special, NEW.created_at);
END;

CREATE TRIGGER IF NOT EXISTS `breaking_delete_trg` INSTEAD OF DELETE ON `breaking`
BEGIN
  DELETE FROM `breaking_news` WHERE id = OLD.id;
END;
