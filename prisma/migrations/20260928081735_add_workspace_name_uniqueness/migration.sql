-- Add normalized name column (default so existing rows pass)
ALTER TABLE "Workspace" ADD COLUMN "normalizedName" TEXT NOT NULL DEFAULT '';

-- Backfill: normalize all existing names
UPDATE "Workspace" SET "normalizedName" = LOWER(TRIM("name"));

-- Per-owner unique name (case/space-insensitive)
CREATE UNIQUE INDEX "Workspace_ownerId_normalizedName_key"
  ON "Workspace"("ownerId", "normalizedName");
