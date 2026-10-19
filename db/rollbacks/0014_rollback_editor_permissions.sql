-- Rollback Migration 0014: Revert editor permissions and drop audit log table

-- 1. Drop the audit log table
DROP TABLE IF EXISTS permissions_audit_log;

-- 2. Drop the permissions column from editors (supported in SQLite 3.35.0+)
ALTER TABLE editors DROP COLUMN permissions;
