"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getProjectAccess } from "@/lib/access.server";
import { createTask, deleteTask, getTask, updateTask } from "@/lib/data.server";
import { emitNotification } from "@/lib/notifications.server";
import { getActiveWorkspace, getUser } from "@/lib/workspace.server";
import type { Task } from "@/lib/data";
import {
  taskSchema,
  type TaskActionResult,
  type TaskFormInput,
} from "@/lib/schemas";

/** Permission result for a task action. */
type TaskPermissions = {
  canCreate: boolean;
  canEdit: boolean;
  canUpdateStatus: boolean;
  canDelete: boolean;
};

/** Determines what the current user can do for a given task.
 *  Caller must have already verified workspace membership (via getActiveWorkspace).
 */
async function getTaskPermissions(
  workspaceId: string,
  taskId: string,
  userId: string
): Promise<TaskPermissions> {
  const task = await getTask(workspaceId, taskId);
  if (!task) return { canCreate: false, canEdit: false, canUpdateStatus: false, canDelete: false };

  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
    select: { role: true },
  });

  const isOwner = membership?.role === "OWNER";
  const isAssignee = task.assignees.some((assignee) => assignee.id === userId);
  const access = await getProjectAccess(userId, task.projectId);

  return {
    canCreate: access.canCreateTasks,
    canEdit: isOwner || access.canEditTasks,
    canUpdateStatus: isAssignee,
    canDelete: access.canDeleteTasks,
  };
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
function formatAssignmentMessage(actorName: string, taskTitle: string, newAssigneeName: string) {
  return `${actorName} assigned "${taskTitle}" to ${newAssigneeName}`;
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
      message = `${actorName} changed status of "${taskTitle}" to ${newStatus ?? "unknown"}`;
      break;
    case "TASK_PRIORITY_CHANGED":
      message = `${actorName} changed priority of "${taskTitle}" to ${newPriority ?? "unknown"}`;
      break;
    case "TASK_ASSIGNED":
      message = `${actorName} assigned "${taskTitle}" to ${newAssigneeIds.length ? "new assignee" : "previous assignee"
        }`;
      break;
    case "TASK_UPDATED":
      message = `${actorName} updated "${taskTitle}"`;
      break;
    case "TASK_DELETED":
      message = `${actorName} deleted "${taskTitle}"`;
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

  const permissions = await getTaskPermissions(workspace.id, taskId, currentUser.id);

  if (!permissions.canEdit) {
    return { ok: false, error: "You don't have permission to edit tasks in this workspace." };
  }

  const existingTask = await getTask(workspace.id, taskId);
  if (!existingTask) {
    return { ok: false, error: "Task not found." };
  }
  if (parsed.data.status !== existingTask.status && !permissions.canUpdateStatus) {
    return { ok: false, error: "Only an assignee can change this task's status." };
  }

  const result = await updateTask(workspace.id, taskId, parsed.data);
  if (!result) {
    return { ok: false, error: "Task not found" };
  }

  const actor = await getUser();
  if (!actor) {
    return { ok: false, error: "Please log in to update tasks." };
  }
  const actorName = actor.name ?? "Someone";

  // Log mutation + notify (TASK_UPDATED — notify creator only)
  await emitTaskMutationNotifications(
    workspace.id,
    taskId,
    actor.id,
    actorName,
    "TASK_UPDATED",
    result.title,
    undefined,
    undefined,
    undefined,
    undefined,
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

  const permissions = await getTaskPermissions(workspace.id, taskId, currentUser.id);

  if (!permissions.canDelete) {
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

  const permissions = await getTaskPermissions(workspace.id, taskId, currentUser.id);

  // Only an assignee can update this task's status.
  if (!permissions.canUpdateStatus) {
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

  const permissions = await getTaskPermissions(workspace.id, taskId, currentUser.id);

  // Only an assignee can update this task's status.
  if (!permissions.canUpdateStatus) {
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