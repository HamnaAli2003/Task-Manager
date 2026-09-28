// Server-side notification helpers.
//
// One Notification row per recipient per event. `userId` is ALWAYS the recipient.
// List/count/mark/delete helpers are WORKSPACE-SCOPED: the caller passes the
// active workspace id, so a user only ever sees (or changes) notifications
// that belong to the workspace they are currently viewing.
import { prisma } from "@/lib/prisma";
import { Prisma, type NotificationType } from "@prisma/client";
import type {
    Project,
    ProjectInput,
    ProjectStats,
    Task,
    TaskFilters,
    TaskInput,
} from "@/lib/data";

function isNotFound(error: unknown): boolean {
    return (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
    );
}

function isoDate(daysFromNow: number): string {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().slice(0, 10);
}

function toProject(project: {
    id: string;
    name: string;
    description: string;
    progress: number;
}): Project {
    return {
        id: project.id,
        name: project.name,
        description: project.description,
        progress: project.progress,
    };
}

function toTask(task: {
    id: string;
    projectId: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    due: string;
    assigneeId: string | null;
    createdBy: string | null;
}): Task {
    return {
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status as Task["status"],
        priority: task.priority as Task["priority"],
        due: task.due,
        assigneeId: task.assigneeId ?? undefined,
        createdBy: task.createdBy ?? undefined,
    };
}

export async function getProjects(workspaceId: string): Promise<Project[]> {
    const rows = await prisma.project.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toProject);
}

export async function getProject(
    workspaceId: string,
    projectId: string,
): Promise<Project | undefined> {
    const row = await prisma.project.findFirst({
        where: { id: projectId, workspaceId },
    });
    return row ? toProject(row) : undefined;
}

export async function getTask(
    workspaceId: string,
    taskId: string,
): Promise<Task | undefined> {
    const row = await prisma.task.findFirst({
        where: { id: taskId, project: { workspaceId } },
    });
    return row ? toTask(row) : undefined;
}

function buildTaskWhere(filters: TaskFilters) {
    const { status, priority, search } = filters;
    const query = search?.trim();

    return {
        status: status || undefined,
        priority: priority || undefined,
        ...(query
            ? {
                OR: [
                    { title: { contains: query, mode: "insensitive" as const } },
                    { description: { contains: query, mode: "insensitive" as const } },
                ],
            }
            : {}),
    };
}

export async function getProjectTasks(
    workspaceId: string,
    projectId: string,
    filters: TaskFilters = {},
): Promise<Task[]> {
    const rows = await prisma.task.findMany({
        where: { projectId, project: { workspaceId }, ...buildTaskWhere(filters) },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toTask);
}

export async function getAllTasks(
    workspaceId: string,
    filters: TaskFilters = {},
): Promise<Task[]> {
    const rows = await prisma.task.findMany({
        where: { project: { workspaceId }, ...buildTaskWhere(filters) },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toTask);
}

export async function getUpcomingTasks(
    workspaceId: string,
    days = 7,
): Promise<Task[]> {
    const rows = await prisma.task.findMany({
        where: {
            status: { not: "done" },
            due: { gte: isoDate(0), lte: isoDate(days) },
            project: { workspaceId },
        },
        orderBy: { due: "asc" },
    });
    return rows.map(toTask);
}

export async function getProjectStats(
    workspaceId: string,
    projectId: string,
    baseline = 0,
): Promise<ProjectStats> {
    const tasks = await prisma.task.findMany({
        where: { projectId, project: { workspaceId } },
        select: { status: true },
    });
    const total = tasks.length;
    const doneCount = tasks.filter((task) => task.status === "done").length;
    return {
        taskCount: total,
        openCount: total - doneCount,
        doneCount,
        progress: total > 0 ? Math.round((doneCount / total) * 100) : baseline,
    };
}

export async function createProject(
    workspaceId: string,
    input: ProjectInput,
): Promise<Project> {
    const row = await prisma.project.create({
        data: {
            workspaceId,
            name: input.name,
            description: input.description,
            progress: input.progress ?? 0,
        },
    });
    return toProject(row);
}

export async function updateProject(
    workspaceId: string,
    id: string,
    input: ProjectInput,
): Promise<Project | undefined> {
    try {
        const existing = await prisma.project.findFirst({
            where: { id, workspaceId },
            select: { id: true },
        });
        if (!existing) return undefined;

        const row = await prisma.project.update({
            where: { id },
            data: {
                name: input.name,
                description: input.description,
                ...(input.progress !== undefined && { progress: input.progress }),
            },
        });
        return toProject(row);
    } catch (error) {
        if (isNotFound(error)) return undefined;
        throw error;
    }
}

export async function deleteProject(workspaceId: string, id: string): Promise<boolean> {
    const result = await prisma.project.deleteMany({ where: { id, workspaceId } });
    return result.count > 0;
}

export async function createTask(
    workspaceId: string,
    projectId: string,
    input: TaskInput,
): Promise<Task> {
    const project = await prisma.project.findFirst({
        where: { id: projectId, workspaceId },
        select: { id: true },
    });
    if (!project) {
        throw new Error("Project not found in this workspace.");
    }

    const row = await prisma.task.create({
        data: {
            projectId,
            title: input.title,
            description: input.description,
            status: input.status,
            priority: input.priority,
            due: input.due,
            assigneeId: input.assigneeId ?? null,
            createdBy: input.createdBy ?? null,
        },
    });
    return toTask(row);
}

export async function updateTask(
    workspaceId: string,
    id: string,
    patch: Partial<Task>,
): Promise<Task | undefined> {
    const data = {
        ...(patch.title !== undefined && { title: patch.title }),
        ...(patch.description !== undefined && { description: patch.description }),
        ...(patch.status !== undefined && { status: patch.status }),
        ...(patch.priority !== undefined && { priority: patch.priority }),
        ...(patch.due !== undefined && { due: patch.due }),
        ...(patch.assigneeId !== undefined && { assigneeId: patch.assigneeId }),
        ...(patch.createdBy !== undefined && { createdBy: patch.createdBy }),
    };

    try {
        const existing = await prisma.task.findFirst({
            where: { id, project: { workspaceId } },
            select: { id: true },
        });
        if (!existing) return undefined;

        const row = await prisma.task.update({ where: { id }, data });
        return toTask(row);
    } catch (error) {
        if (isNotFound(error)) return undefined;
        throw error;
    }
}

export async function deleteTask(workspaceId: string, id: string): Promise<boolean> {
    const result = await prisma.task.deleteMany({
        where: { id, project: { workspaceId } },
    });
    return result.count > 0;
}

export type NotificationInput = {
    userId: string; // recipient — the person whose bell shows the item
    type: NotificationType;
    message: string;
    workspaceId?: string;
    actorId?: string; // user who caused the event
    link?: string | null; // route to open when clicked
};

export type NotificationItem = Prisma.NotificationGetPayload<{
    include: { actor: { select: { name: true; image: true } } };
}>;

/** Inserts a single notification row. Base insert for every event type. */
export async function createNotification(
    input: NotificationInput
): Promise<NotificationItem> {
    return prisma.notification.create({
        data: {
            userId: input.userId,
            type: input.type,
            message: input.message,
            workspaceId: input.workspaceId ?? null,
            actorId: input.actorId ?? null,
            link: input.link ?? null,
        },
        include: { actor: { select: { name: true, image: true } } },
    });
}

/** Active-workspace notifications plus incoming invites, newest first. */
export async function listNotifications(
    userId: string,
    workspaceId: string
): Promise<NotificationItem[]> {
    return prisma.notification.findMany({
        where: {
            userId,
            OR: [{ workspaceId }, { type: "INVITE_SENT" }],
        },
        include: { actor: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
    });
}

/** Unread count for the active workspace plus incoming invites. */
export async function getUnreadNotificationCount(
    userId: string,
    workspaceId: string
): Promise<number> {
    return prisma.notification.count({
        where: {
            userId,
            readAt: null,
            OR: [{ workspaceId }, { type: "INVITE_SENT" }],
        },
    });
}

/**
 * Marks ONE notification read. Ownership and workspace visibility are
 * enforced in the query; incoming invites are visible across workspaces.
 */
export async function markNotificationRead(
    userId: string,
    workspaceId: string,
    notificationId: string
): Promise<boolean> {
    const result = await prisma.notification.updateMany({
        where: {
            id: notificationId,
            userId,
            OR: [{ workspaceId }, { type: "INVITE_SENT" }],
        },
        data: { readAt: new Date() },
    });
    return result.count > 0;
}

/** Marks active-workspace notifications and incoming invites as read. */
export async function markAllNotificationsRead(
    userId: string,
    workspaceId: string
): Promise<void> {
    await prisma.notification.updateMany({
        where: {
            userId,
            readAt: null,
            OR: [{ workspaceId }, { type: "INVITE_SENT" }],
        },
        data: { readAt: new Date() },
    });
}

/**
 * Deletes ONE notification row. Ownership and workspace visibility are
 * enforced in the query; incoming invites are visible across workspaces.
 * Rows are per-recipient, so deleting your copy NEVER touches another
 * member's copy — deletion is never synced between users.
 */
export async function deleteNotification(
    userId: string,
    workspaceId: string,
    notificationId: string
): Promise<boolean> {
    const result = await prisma.notification.deleteMany({
        where: {
            id: notificationId,
            userId,
            OR: [{ workspaceId }, { type: "INVITE_SENT" }],
        },
    });
    return result.count > 0;
}

/** Clears ALL of the user's notifications in ONE workspace. */
export async function deleteAllNotifications(
    userId: string,
    workspaceId: string
): Promise<void> {
    await prisma.notification.deleteMany({ where: { userId, workspaceId } });
}

// ──────────────────────────────────────────────────────────────────────────
// Event emissions
//
// Every event type is emitted through these helpers so the notification
// system stays the single, stable integration point. New event sources
// (invites, task assignment, chat) call these — never the raw insert above.
// ──────────────────────────────────────────────────────────────────────────

/**
 * MEMBER_JOINED — a user became a member of a workspace.
 * Notifies every CURRENT member except the person who just joined.
 */
export async function emitMemberJoinedEvent(
    workspaceId: string,
    newMemberId: string
): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
    });
    if (!workspace) return;

    // Notify every CURRENT member except the person who just joined.
    const otherMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId, userId: { not: newMemberId } },
        select: { userId: true },
    });
    if (otherMembers.length === 0) return;

    const actor = await prisma.user.findUnique({
        where: { id: newMemberId },
        select: { name: true },
    });

    const message = `${actor?.name ?? "A new member"} joined ${workspace.name}.`;

    await prisma.notification.createMany({
        data: otherMembers.map(({ userId }) => ({
            userId,
            workspaceId,
            actorId: newMemberId,
            type: "MEMBER_JOINED",
            message,
            link: "/dashboard",
        })),
    });
}

/**
 * INVITE_SENT — the invite-creation action calls this ONLY when the
 * invited email belongs to an existing user (a real recipient exists);
 * invites to unknown emails produce no notification row.
 */
export async function emitInviteSentEvent(input: {
    recipientId: string;
    workspaceId: string;
    inviterId: string;
    link?: string;
}): Promise<void> {
    const [workspace, inviter] = await Promise.all([
        prisma.workspace.findUnique({ where: { id: input.workspaceId } }),
        prisma.user.findUnique({
            where: { id: input.inviterId },
            select: { name: true },
        }),
    ]);
    if (!workspace) return;

    await createNotification({
        userId: input.recipientId,
        workspaceId: input.workspaceId,
        actorId: input.inviterId,
        type: "INVITE_SENT",
        message: `${inviter?.name ?? "Someone"} invited you to ${workspace.name}.`,
        link: input.link ?? null,
    });
}

/**
 * INVITE_ACCEPTED — the invite-accept action calls this after membership is
 * created. Notifies the workspace OWNER that their invitation was accepted.
 */
export async function emitInviteAcceptedEvent(input: {
    workspaceId: string;
    inviterId: string;
    memberId: string;
    memberName?: string;
    link?: string;
}): Promise<void> {
    const workspace = await prisma.workspace.findUnique({
        where: { id: input.workspaceId },
    });
    if (!workspace) return;

    await createNotification({
        userId: input.inviterId,
        workspaceId: input.workspaceId,
        actorId: input.memberId,
        type: "INVITE_ACCEPTED",
        message: `${input.memberName ?? "Someone"} accepted your invite to ${workspace.name}.`,
        link: input.link ?? `/dashboard`,
    });
}

/**
 * WORKSPACE_RENAMED — an owner renamed a shared workspace.
 * Message: "Workspace was renamed to '[New Name]'."
 */
export async function emitWorkspaceRenamedEvent(
    workspaceId: string,
    actorUserId: string,
    newName: string
): Promise<void> {
    const otherMembers = await prisma.workspaceMember.findMany({
        where: { workspaceId, userId: { not: actorUserId } },
        select: { userId: true },
    });
    if (otherMembers.length === 0) return;

    const message = `Workspace was renamed to "${newName}".`;

    await prisma.notification.createMany({
        data: otherMembers.map(({ userId }) => ({
            userId,
            workspaceId,
            actorId: actorUserId,
            type: "WORKSPACE_RENAMED",
            message,
            link: "/dashboard",
        })),
    });
}

/**
 * WORKSPACE_DELETED — an owner deleted a shared workspace. Called BEFORE
 * the workspace row is gone so the notification's workspace link still
 * resolves. Message: "The workspace '[Name]' was deleted by the owner."
 */
export async function emitWorkspaceDeletedEvent(
    workspaceId: string,
    ownerUserId: string,
    workspaceName: string
): Promise<void> {
    const ejectees = await prisma.workspaceMember.findMany({
        where: { workspaceId, userId: { not: ownerUserId } },
        select: { userId: true },
    });
    if (ejectees.length === 0) return;

    const message = `The workspace "${workspaceName}" was deleted by the owner.`;

    await prisma.notification.createMany({
        data: ejectees.map(({ userId }) => ({
            userId,
            workspaceId,
            actorId: ownerUserId,
            type: "WORKSPACE_DELETED",
            message,
            link: "/dashboard",
        })),
    });
}
