-- CreateEnum
CREATE TYPE "ProjectAccessMode" AS ENUM ('ALL_MEMBERS', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ProjectPermission" AS ENUM ('VIEW', 'EDIT');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'TASK_STATUS_CHANGED';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "accessMode" "ProjectAccessMode" NOT NULL DEFAULT 'ALL_MEMBERS';

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN     "canCreateProject" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ProjectAccess" (
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "ProjectPermission" NOT NULL DEFAULT 'VIEW',

    CONSTRAINT "ProjectAccess_pkey" PRIMARY KEY ("projectId","userId")
);

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectAccess" ADD CONSTRAINT "ProjectAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
