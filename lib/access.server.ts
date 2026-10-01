// Server-side project access guard — the SINGLE source of truth for
// every project/task permission decision. UI may hide buttons; this
// is what actually enforces the rules.
//
// Model (approved matrix):
// - OWNER: full control over everything in their workspace.
// - ALL_MEMBERS projects: every active member views + edits task details;
//   task creation/deletion and project management use explicit grants.
// - RESTRICTED projects: only users listed in ProjectAccess get in —
//   VIEW (see + create tasks) or EDIT (tasks + project settings).
// - No membership or no access row => NONE (treat as "not found").
//
// Task fields are graded separately (see getTaskFieldAccess): a member who
// is ASSIGNED to a task moves its status, but rewriting the task itself is
// an owner grant, and the assignee list is always owner-only.
import { prisma } from "@/lib/prisma";

export type ProjectAccess = {
    level: "OWNER" | "EDIT" | "VIEW" | "NONE";
    canView: boolean;
    canCreateTasks: boolean;
    canEditTasks: boolean;
    canEditTaskDetails: boolean;
    canDeleteTasks: boolean;
    canDeleteProject: boolean;
    canManageProject: boolean; // edit/delete project + access settings
};

export const DENIED_ACCESS: ProjectAccess = {
    level: "NONE",
    canView: false,
    canCreateTasks: false,
    canEditTasks: false,
    canEditTaskDetails: false,
    canDeleteTasks: false,
    canDeleteProject: false,
    canManageProject: false,
};

/** Resolves the caller's access to ONE project. */
export async function getProjectAccess(
    userId: string,
    projectId: string
): Promise<ProjectAccess> {
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { workspaceId: true, accessMode: true },
    });
    if (!project) return DENIED_ACCESS;

    const membership = await prisma.workspaceMember.findUnique({
        where: {
            workspaceId_userId: { workspaceId: project.workspaceId, userId },
        },
        select: { role: true },
    });
    if (!membership) return DENIED_ACCESS;

    // Owner bypasses everything in their own workspace.
    if (membership.role === "OWNER") {
        return {
            level: "OWNER",
            canView: true,
            canCreateTasks: true,
            canEditTasks: true,
            canEditTaskDetails: true,
            canDeleteTasks: true,
            canDeleteProject: true,
            canManageProject: true,
        };
    }

    // ALL_MEMBERS members retain task-detail edits. Creation, task deletion,
    // and project management are separately controlled by the owner.
    const access = await prisma.projectAccess.findUnique({
        where: { projectId_userId: { projectId, userId } },
    });

    // Existing ALL_MEMBERS projects keep task creation, while task editing,
    // deletion, and project management require an explicit owner grant.
    if (project.accessMode === "ALL_MEMBERS") {
        const canEditProject = Boolean(
            access?.canEditProject || access?.permission === "EDIT",
        );
        return {
            level: "EDIT",
            canView: true,
            canCreateTasks: access?.canCreateTasks ?? true,
            canEditTasks: true,
            // Task-detail edits are always opt-in, even on ALL_MEMBERS
            // projects — that is what keeps an assignee status-only.
            canEditTaskDetails: access?.canEditTaskDetails ?? false,
            canDeleteTasks: access?.canDeleteTasks ?? false,
            canDeleteProject: access?.canDeleteProject ?? false,
            canManageProject: canEditProject,
        };
    }

    // RESTRICTED: only rows in ProjectAccess grant anything.
    if (!access) return DENIED_ACCESS;

    if (access.permission === "VIEW") {
        // VIEW can look at the project and ADD tasks, but not edit others'.
        return {
            level: "VIEW",
            canView: true,
            canCreateTasks: access.canCreateTasks,
            canEditTasks: access.canEditProject,
            canEditTaskDetails: access.canEditTaskDetails,
            canDeleteTasks: access.canDeleteTasks,
            canDeleteProject: access.canDeleteProject,
            canManageProject: access.canEditProject,
        };
    }

    return {
        level: "EDIT",
        canView: true,
        canCreateTasks: access.canCreateTasks,
        canEditTasks: true,
        canEditTaskDetails: access.canEditTaskDetails,
        canDeleteTasks: access.canDeleteTasks,
        canDeleteProject: access.canDeleteProject,
        canManageProject: access.canEditProject || access.permission === "EDIT",
    };
}

/** Which parts of ONE task the caller may write. */
export type TaskFieldAccess = {
    /** The caller may open/submit the edit form at all. */
    canEdit: boolean;
    /** status — granted to assignees, plus the creator in a personal workspace. */
    canUpdateStatus: boolean;
    /** title, description, priority, due. */
    canEditDetails: boolean;
    /** the assignee list — owner only, never delegated. */
    canManageAssignees: boolean;
    canDelete: boolean;
};

/**
 * Resolves field-level access to a single task.
 *

 * An assignee is status-only by default: they can move the task through its
 * workflow but cannot rewrite what the owner wrote, and they never manage the
 * assignee list. The owner lifts the first restriction with the
 * `canEditTaskDetails` grant; the second has no grant at all.
 *
 * Returns null when the task does not exist in the caller's workspace.
 */
export async function getTaskFieldAccess(
    userId: string,
    workspaceId: string,
    taskId: string
): Promise<TaskFieldAccess | null> {
    const task = await prisma.task.findFirst({
        where: { id: taskId, project: { workspaceId } },
        select: {
            projectId: true,
            taskAssignees: { where: { userId }, select: { userId: true } },
        },
    });
    if (!task) return null;

    const [membership, workspace, access] = await Promise.all([
        prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { role: true },
        }),
        prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { type: true },
        }),
        getProjectAccess(userId, task.projectId),
    ]);

    const isOwner = membership?.role === "OWNER";
    const isAssignee = task.taskAssignees.length > 0;

    // Personal workspaces have no assignees, so the owner drives their own tasks.
    const canUpdateStatus = isAssignee || (isOwner && workspace?.type === "PERSONAL");
    // The owner grant wins outright; without it, being assigned caps the caller at
    // status so a member cannot quietly re-scope work assigned to them.
    const canEditDetails =
        isOwner ||
        access.canEditTaskDetails ||
        (!isAssignee && access.canEditTasks);

    return {
        canEdit: canEditDetails || canUpdateStatus,
        canUpdateStatus,
        canEditDetails,
        canManageAssignees: isOwner,
        canDelete: access.canDeleteTasks,
    };
}

/** Workspace-level right to CREATE projects (owner or granted member). */
export async function canCreateProjectInWorkspace(
    userId: string,
    workspaceId: string
): Promise<boolean> {
    const [membership, workspace] = await Promise.all([
        prisma.workspaceMember.findUnique({
            where: { workspaceId_userId: { workspaceId, userId } },
            select: { role: true, canCreateProject: true },
        }),
        prisma.workspace.findUnique({
            where: { id: workspaceId },
            select: { ownerId: true },
        }),
    ]);

    if (!membership || !workspace) return false;
    // Owner: role + ownership dono check (defense in depth).
    if (membership.role === "OWNER" && workspace.ownerId === userId) return true;
    return membership.canCreateProject;
}
