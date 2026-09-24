-- Explicit workspace type: PERSONAL (auto-created default) vs TEAM (user/joint workspaces).
CREATE TYPE "WorkspaceType" AS ENUM ('PERSONAL', 'TEAM');

-- All existing workspaces default to TEAM first...
ALTER TABLE "Workspace" ADD COLUMN "type" "WorkspaceType" NOT NULL DEFAULT 'TEAM';

-- ...then backfill the auto-created personal workspaces:
-- name is still "Personal Workspace" AND the owner is (still) the only member.
UPDATE "Workspace" w
SET "type" = 'PERSONAL'
WHERE w."name" = 'Personal Workspace'
  AND (
    SELECT COUNT(*) FROM "WorkspaceMember" wm
    WHERE wm."workspaceId" = w."id"
  ) = 1
  AND EXISTS (
    SELECT 1 FROM "WorkspaceMember" wm2
    WHERE wm2."workspaceId" = w."id" AND wm2."userId" = w."ownerId"
  );