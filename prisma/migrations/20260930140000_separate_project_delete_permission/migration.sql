ALTER TABLE "ProjectAccess"
    ADD COLUMN "canDeleteProject" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ProjectAccess"
SET "canDeleteProject" = ("permission" = 'EDIT');