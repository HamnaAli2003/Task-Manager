"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProjectAccess, getTaskFieldAccess } from "@/lib/access.server";
import { createTask, deleteTask, getTask, updateTask } from "@/lib/data.server";
import { emitNotification } from "@/lib/notifications.server";
import { getActiveWorkspace, getUser } from "@/lib/workspace.server";
import type { Task } from "@/lib/data";
import {
  taskSchema,
  type TaskActionResult,
  type TaskFormInput,
} from "@/lib/schemas";

/** True when both lists hold the same user ids, ignoring order. */
function sameAssignees(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = new Set(a);
  return b.every((id) => left.has(id));
}

/** Formats a status change message. */
function formatStatusMessage(actorName: string, taskTitle: string, newStatus: string) {
  return `${actorName} changed status of "${taskTitle}" to ${newStatus}`;
}

/** Formats a priority change message. */
function formatPriorityMessage(actorName: string, taskTitle: string, newPriority: string) {
  return `${actorName} changed priority of "${taskTitle}" to ${newPriority}`;
}

/** Formats an assignment message. */
function formatAssignmentMessage(actorName: string, taskTitle: string, assigneeSummary: string) {
  return `${actorName} assigned "${taskTitle}" to ${assigneeSummary}`;
}

/** Formats a generic update message. */
function formatUpdateMessage(actorName: string, taskTitle: string) {
  return `${actorName} updated "${taskTitle}"`;
}

/** Formats a deletion message. */
function formatDeletionMessage(actorName: string, taskTitle: string) {
  return `${actorName} deleted "${taskTitle}"`;
}

/** Emits notifications for a task mutation, never to the actor. */
async function emitTaskMutationNotifications(
  workspaceId: string,
  taskId: string,
  actorId: string,
  actorName: string,
  mutationType:
    | "TASK_CREATED"
    | "TASK_UPDATED"
    | "TASK_STATUS_CHANGED"
    | "TASK_PRIORITY_CHANGED"
    | "TASK_ASSIGNED"
    | "TASK_DELETED",
  taskTitle: string,
  newStatus?: string,
  newPriority?: string,
  newAssigneeIds: string[] = [],
  previousAssigneeIds: string[] = []
) {
  const task = await getTask(workspaceId, taskId);
  if (!task) return;

  const creatorId = task.createdBy;

  // Determine which user IDs should receive notifications
  const notifiedUserIds = new Set<string>();

  if (mutationType === "TASK_STATUS_CHANGED" || mutationType === "TASK_PRIORITY_CHANGED") {
    // Notify task creator + current assignee (if different from actor)
    if (creatorId && creatorId !== actorId) notifiedUserIds.add(creatorId);
    for (const assignee of task.assignees) {
      if (assignee.id !== actorId) notifiedUserIds.add(assignee.id);
    }
  } else if (mutationType === "TASK_ASSIGNED") {
    // Notify new + previous assignee (exclude actor)
    for (const userId of [...newAssigneeIds, ...previousAssigneeIds]) {
      if (userId !== actorId) notifiedUserIds.add(userId);
    }
  } else {
    // TASK_CREATED, TASK_UPDATED, TASK_DELETED: notify task creator only
    if (creatorId && creatorId !== actorId) notifiedUserIds.add(creatorId);
  }

  // Build the message based on mutation type
  let message = "";
  switch (mutationType) {
    case "TASK_CREATED":
      message = `${actorName} created "${taskTitle}"`;
      break;
    case "TASK_STATUS_CHANGED":
      message = formatStatusMessage(actorName, taskTitle, newStatus ?? "unknown");
      break;
    case "TASK_PRIORITY_CHANGED":
      message = formatPriorityMessage(actorName, taskTitle, newPriority ?? "unknown");
      break;
    case "TASK_ASSIGNED":
      message = newAssigneeIds.length
        ? formatAssignmentMessage(
            actorName,
            taskTitle,
            `${newAssigneeIds.length} member${newAssigneeIds.length === 1 ? "" : "s"}`,
          )
        : `${actorName} unassigned "${taskTitle}"`;
      break;
    case "TASK_UPDATED":
      message = formatUpdateMessage(actorName, taskTitle);
      break;
    case "TASK_DELETED":
      message = formatDeletionMessage(actorName, taskTitle);
      break;
  }

  // Emit notifications for each notified user
  if (mutationType !== "TASK_STATUS_CHANGED" && mutationType !== "TASK_ASSIGNED") {
    return;
  }

  if (notifiedUserIds.size > 0) {
    for (const userId of notifiedUserIds) {
      await emitNotification({
        userId,
        type: mutationType,
        message,
        workspaceId,
        actorId,
        link: `/projects/${task.projectId}/tasks/${taskId}`,
      });
    }
  }
}

// ──────────────────────────────────────────────────────────────
// Task actions
// ──────────────────────────────────────────────────────────────

export async function createTaskAction(
  projectId: string,
  input: TaskFormInput
): Promise<TaskActionResult & { task?: Task }> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const workspace = await getActiveWorkspace();
  const actor = await getUser();
  if (!actor) {
    return { ok: false, error: "Please log in to create tasks." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id },
    select: { id: true },
  });
  if (!project) {
    return { ok: false, error: "Project not found." };
  }
  const access = await getProjectAccess(actor.id, projectId);
  if (!access.canCreateTasks) {
    return { ok: false, error: "You don't have permission to create tasks in this project." };
  }

  const assigneeIds = parsed.data.assigneeIds;
  if (workspace.type === "TEAM" && assigneeIds.length === 0) {
    return { ok: false, error: "Assign this task to at least one workspace member." };
  }
  if (workspace.type === "PERSONAL" && assigneeIds.length > 0) {
    return { ok: false, error: "Personal workspace tasks cannot be assigned to members." };
  }

  const validAssignees = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id, userId: { in: assigneeIds } },
    select: {
      userId: true,
      user: { select: { name: true, image: true } },
    },
  });
  if (validAssignees.length !== assigneeIds.length) {
    return { ok: false, error: "Choose assignees from this workspace." };
  }

  const task = await createTask(workspace.id, projectId, {
    ...parsed.data,
    assignees: validAssignees.map(({ userId, user }) => ({
      id: userId,
      name: user.name ?? "Unnamed user",
      image: user.image,
    })),
    createdBy: actor.id,
  });

  // Log mutation + notify (actor excluded; creator + assignee notified for TASK_CREATED)
  await emitTaskMutationNotifications(
    workspace.id,
    task.id,
    actor.id,
    actor.name ?? "Someone",
    "TASK_CREATED",
    task.title,
    /* newStatus */ undefined,
    /* newPriority */ undefined,
    task.assignees.map((assignee) => assignee.id),
    [],
  );

  revalidatePath(`/projects/${projectId}/tasks`);
  return { ok: true, task };
}

export async function getTaskAssigneeOptionsAction(projectId: string) {
  const user = await getUser();
  if (!user) return [];

  const workspace = await getActiveWorkspace();
  const access = await getProjectAccess(user.id, projectId);
  if (!access.canView) return [];
  if (workspace.type === "PERSONAL") return [];

  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members.map(({ user: member, role }) => ({
    id: member.id,
    name: member.name ?? "Unnamed user",
    image: member.image,
    role,
  }));
}

export async function updateTaskAction(
  projectId: string,
  taskId: string,
  input: TaskFormInput
): Promise<TaskActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const workspace = await getActiveWorkspace();
  const currentUser = await getUser();
  if (!currentUser) {
    return { ok: false, error: "Please log in to update tasks." };
  }

  // The form ships every field, so authorization is decided per FIELD against
  // what is actually stored — an unchanged value needs no right to resend it.
  const access = await getTaskFieldAccess(currentUser.id, workspace.id, taskId);
  if (!access) {
    return { ok: false, error: "Task not found." };
  }
  if (!access.canEdit) {
    return { ok: false, error: "You don't have permission to update this task." };
  }

  const existingTask = await getTask(workspace.id, taskId);
  if (!existingTask) {
    return { ok: false, error: "Task not found." };
  }

  const next = parsed.data;
  const statusChanged = next.status !== existingTask.status;
  const detailsChanged =
    next.title !== existingTask.title ||
    next.description !== existingTask.description ||
    next.priority !== existingTask.priority ||
    next.due !== existingTask.due;
  const assigneesChanged = !sameAssignees(
    next.assigneeIds,
    existingTask.assignees.map((assignee) => assignee.id)
  );

  if (statusChanged && !access.canUpdateStatus) {
    return { ok: false, error: "Only an assignee can change this task's status." };
  }
  if (detailsChanged && !access.canEditDetails) {
    return { ok: false, error: "You can only change the status of this task." };
  }
  if (assigneesChanged && !access.canManageAssignees) {
    return { ok: false, error: "Only the workspace owner can change task assignees." };
  }

  // Build the patch from the groups the caller may write, so an unauthorized
  // field can never ride along with a permitted one.
  const patch: Partial<Task> = { status: next.status };
  if (access.canEditDetails) {
    patch.title = next.title;
    patch.description = next.description;
    patch.priority = next.priority;
    patch.due = next.due;
  }

  if (access.canManageAssignees) {
    if (workspace.type === "TEAM" && next.assigneeIds.length === 0) {
      return { ok: false, error: "Assign this task to at least one workspace member." };
    }
    if (workspace.type === "PERSONAL" && next.assigneeIds.length > 0) {
      return { ok: false, error: "Personal workspace tasks cannot be assigned to members." };
    }
    const validAssignees = await prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id, userId: { in: next.assigneeIds } },
      select: { userId: true, user: { select: { name: true, image: true } } },
    });
    if (validAssignees.length !== next.assigneeIds.length) {
      return { ok: false, error: "Choose assignees from this workspace." };
    }
    patch.assignees = validAssignees.map(({ userId, user }) => ({
      id: userId,
      name: user.name ?? "Unnamed user",
      image: user.image,
    }));
  }

  const result = await updateTask(workspace.id, taskId, patch);
  if (!result) {
    return { ok: false, error: "Task not found" };
  }

  const actor = await getUser();
  if (!actor) {
    return { ok: false, error: "Please log in to update tasks." };
  }
  const actorName = actor.name ?? "Someone";

  // A status move is the assignee's whole workflow, so it must reach the
  // creator and the other assignees. Everything else notifies the creator.
  const mutationType = statusChanged
    ? "TASK_STATUS_CHANGED"
    : assigneesChanged
      ? "TASK_ASSIGNED"
      : "TASK_UPDATED";

  await emitTaskMutationNotifications(
    workspace.id,
    taskId,
    actor.id,
    actorName,
    mutationType,
    result.title,
    statusChanged ? next.status : undefined,
    undefined,
    assigneesChanged ? next.assigneeIds : [],
    assigneesChanged ? existingTask.assignees.map((assignee) => assignee.id) : [],
  );

  revalidatePath(`/projects/${projectId}/tasks`);
  return { ok: true };
}

export async function deleteTaskAction(
  projectId: string,
  taskId: string
): Promise<TaskActionResult> {
  const workspace = await getActiveWorkspace();
  const currentUser = await getUser();
  if (!currentUser) {
    return { ok: false, error: "Please log in to delete tasks." };
  }

  const access = await getTaskFieldAccess(currentUser.id, workspace.id, taskId);
  if (!access?.canDelete) {
    return { ok: false, error: "Only the workspace owner can delete tasks." };
  }

  const task = await getTask(workspace.id, taskId);
  if (!task) {
    return { ok: false, error: "Task not found" };
  }

  const actor = await getUser();
  if (!actor) {
    return { ok: false, error: "Please log in to delete tasks." };
  }
  const actorName = actor.name ?? "Someone";

  await deleteTask(workspace.id, taskId);

  // Log mutation + notify (TASK_DELETED — notify creator only)
  await emitTaskMutationNotifications(
    workspace.id,
    taskId,
    actor.id,
    actorName,
    "TASK_DELETED",
    task.title,
    undefined,
    undefined,
    undefined,
    undefined,
  );

  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markTaskDoneAction(
  projectId: string,
  taskId: string
): Promise<TaskActionResult> {
  const workspace = await getActiveWorkspace();
  const task = await getTask(workspace.id, taskId);
  if (!task) {
    return { ok: false, error: "Task not found" };
  }

  const currentUser = await getUser();
  if (!currentUser) {
    return { ok: false, error: "Please log in to update task status." };
  }

  const access = await getTaskFieldAccess(currentUser.id, workspace.id, taskId);

  // Only an assignee can update this task's status.
  if (!access?.canUpdateStatus) {
    return { ok: false, error: "You don't have permission to update the status of this task." };
  }

  const actor = await getUser();
  if (!actor) {
    return { ok: false, error: "Please log in to update task status." };
  }
  const actorName = actor.name ?? "Someone";

  await updateTask(workspace.id, taskId, { status: "done" });

  // Log mutation + notify (TASK_STATUS_CHANGED — notify creator + assignee)
  await emitTaskMutationNotifications(
    workspace.id,
    taskId,
    actor.id,
    actorName,
    "TASK_STATUS_CHANGED",
    task.title,
    "done",
    undefined,
    undefined,
    undefined,
  );

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath("/tasks");
  return { ok: true };
}

/** Convenient wrapper when the form submits a status-only change. */
export async function markTaskStatusAction(
  projectId: string,
  taskId: string,
  newStatus: Task["status"]
): Promise<TaskActionResult> {
  const workspace = await getActiveWorkspace();
  const task = await getTask(workspace.id, taskId);
  if (!task) {
    return { ok: false, error: "Task not found" };
  }

  const currentUser = await getUser();
  if (!currentUser) {
    return { ok: false, error: "Please log in to update task status." };
  }

  const access = await getTaskFieldAccess(currentUser.id, workspace.id, taskId);

  // Only an assignee can update this task's status.
  if (!access?.canUpdateStatus) {
    return { ok: false, error: "You don't have permission to update the status of this task." };
  }

  const actor = await getUser();
  if (!actor) {
    return { ok: false, error: "Please log in to update task status." };
  }
  const actorName = actor.name ?? "Someone";

  await updateTask(workspace.id, taskId, { status: newStatus });

  // Log mutation + notify (TASK_STATUS_CHANGED — notify creator + assignee)
  await emitTaskMutationNotifications(
    workspace.id,
    taskId,
    actor.id,
    actorName,
    "TASK_STATUS_CHANGED",
    task.title,
    newStatus,
    undefined,
    undefined,
    undefined,
  );

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath("/tasks");
  return { ok: true };
}