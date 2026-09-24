-- Additive enum values for workspace rename/delete notifications.
-- Non-destructive: existing rows keep their current values.
ALTER TYPE "NotificationType" ADD VALUE 'WORKSPACE_RENAMED';
ALTER TYPE "NotificationType" ADD VALUE 'WORKSPACE_DELETED';