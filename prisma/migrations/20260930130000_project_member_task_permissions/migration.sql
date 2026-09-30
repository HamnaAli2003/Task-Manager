ALTER TABLE "ProjectAccess"
    ADD COLUMN "canCreateTasks" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "canDeleteTasks" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "canEditProject" BOOLEAN NOT NULL DEFAULT false;

UPDATE "ProjectAccess"
SET "canCreateTasks" = true,
    "canEditProject" = ("permission" = 'EDIT');