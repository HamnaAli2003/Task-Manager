import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import type {
    Project,
    ProjectInput,
    ProjectStats,
    Task,
    TaskFilters,
    TaskInput,
} from "@/lib/data";

// True only when Prisma says "record not found" (P2025).
// Every other error (DB down, etc.) must be thrown, never swallowed.
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

// ---------- Row mappers (DB shape -> app shape) ----------

function toProject(p: { id: string; name: string; description: string; progress: number }): Project {
    return { id: p.id, name: p.name, description: p.description, progress: p.progress };
}

function toTask(t: {
    id: string; projectId: string; title: string; description: string;
    status: string; priority: string; due: string;
    assigneeId: string | null; createdBy: string | null;
}): Task {
    return {
        id: t.id, projectId: t.projectId, title: t.title, description: t.description,
        status: t.status as Task["status"], priority: t.priority as Task["priority"],
        due: t.due, assigneeId: t.assigneeId ?? undefined, createdBy: t.createdBy ?? undefined,
    };
}

// ---------- Reads (every query is workspace-scoped) ----------
// Security rule: a row is only visible if it belongs to the given workspace.

export async function getProjects(workspaceId: string): Promise<Project[]> {
    const rows = await prisma.project.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toProject);
}

export async function getProject(workspaceId: string, projectId: string): Promise<Project | undefined> {
    const row = await prisma.project.findFirst({
        where: { id: projectId, workspaceId }, // findFirst + both filters = membership check
    });
    return row ? toProject(row) : undefined;
}

export async function getTask(workspaceId: string, taskId: string): Promise<Task | undefined> {
    const row = await prisma.task.findFirst({
        where: { id: taskId, project: { workspaceId } }, // task -> project -> workspace
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

export async function getProjectTasks(workspaceId: string, projectId: string, filters: TaskFilters = {}): Promise<Task[]> {
    const rows = await prisma.task.findMany({
        where: { projectId, project: { workspaceId }, ...buildTaskWhere(filters) },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toTask);
}

export async function getAllTasks(workspaceId: string, filters: TaskFilters = {}): Promise<Task[]> {
    const rows = await prisma.task.findMany({
        where: { project: { workspaceId }, ...buildTaskWhere(filters) },
        orderBy: { createdAt: "asc" },
    });
    return rows.map(toTask);
}

export async function getUpcomingTasks(workspaceId: string, days = 7): Promise<Task[]> {
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

export async function getProjectStats(workspaceId: string, projectId: string, baseline = 0): Promise<ProjectStats> {
    const tasks = await prisma.task.findMany({
        where: { projectId, project: { workspaceId } },
        select: { status: true },
    });
    const total = tasks.length;
    const doneCount = tasks.filter((t) => t.status === "done").length;
    return {
        taskCount: total,
        openCount: total - doneCount,
        doneCount,
        progress: total > 0 ? Math.round((doneCount / total) * 100) : baseline,
    };
}

// ---------- Writes (every write is workspace-scoped) ----------

export async function createProject(workspaceId: string, input: ProjectInput): Promise<Project> {
    const row = await prisma.project.create({
        data: {
            workspaceId, // project is born inside this workspace
            name: input.name,
            description: input.description,
            progress: input.progress ?? 0,
        },
    });
    return toProject(row);
}

export async function updateProject(workspaceId: string, id: string, input: ProjectInput): Promise<Project | undefined> {
    try {
        // Verify the project belongs to this workspace before updating.
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
    // deleteMany with both filters = safe: 0 rows deleted if wrong workspace.
    const result = await prisma.project.deleteMany({ where: { id, workspaceId } });
    return result.count > 0;
}

export async function createTask(workspaceId: string, projectId: string, input: TaskInput): Promise<Task> {
    // Block creating a task inside another workspace's project.
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

export async function updateTask(workspaceId: string, id: string, patch: Partial<Task>): Promise<Task | undefined> {
    // Whitelist fields — never pass a raw patch to Prisma.
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
