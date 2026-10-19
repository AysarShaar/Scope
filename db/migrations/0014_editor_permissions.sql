-- Migration 0014: Add permissions column to editors and create permissions_audit_log table

-- 1. Add permissions column with safe default '[]'
ALTER TABLE editors ADD COLUMN permissions text DEFAULT '[]' NOT NULL;

-- 2. Create audit log table for all permission changes
CREATE TABLE IF NOT EXISTS permissions_audit_log (
  `id` text PRIMARY KEY NOT NULL,
  `actor_id` text NOT NULL,
  `actor_email` text NOT NULL,
  `target_editor_id` text NOT NULL,
  `action` text NOT NULL,
  `permissions_before` text NOT NULL,
  `permissions_after` text NOT NULL,
  `created_at` text DEFAULT (datetime('now')) NOT NULL
);

-- 3. Seed existing editors with exact permissions matching their current systemRole
-- Admin receives all 10 explicit permissions
UPDATE editors
SET permissions = '["articles.publish_direct","articles.approve","articles.delete","articles.set_special","articles.edit_any","breaking.manage","programs.manage","settings.live_stream","editors.manage","analytics.view"]'
WHERE system_role = 'admin';

-- Editor-in-Chief receives all 8 explicit permissions
UPDATE editors
SET permissions = '["articles.publish_direct","articles.approve","articles.delete","articles.set_special","articles.edit_any","breaking.manage","programs.manage","settings.live_stream"]'
WHERE system_role = 'editor_in_chief';

-- Regular Editor receives empty array (submit for review only)
UPDATE editors
SET permissions = '[]'
WHERE system_role = 'editor' OR system_role IS NULL;
