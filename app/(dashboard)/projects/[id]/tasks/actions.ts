"use server";

import { revalidatePath } from "next/cache";
import {
  createTask,
  deleteTask,
  getTask,
  updateTask,
} from "@/lib/data.server";
import { getActiveWorkspace } from "@/lib/workspace.server";
import type { Task } from "@/lib/data";
import {
  taskSchema,
  type TaskActionResult,
  type TaskFormInput,
} from "@/lib/schemas";

export async function createTaskAction(
  projectId: string,
  input: TaskFormInput
): Promise<TaskActionResult & { task?: Task }> {
  const parsed = taskSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const workspace = await getActiveWorkspace();
  // createTask itself verifies the project belongs to this workspace.
  const task = await createTask(workspace.id, projectId, parsed.data);

  revalidatePath(`/projects/${projectId}/tasks`);

  return { ok: true, task };
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
  const result = await updateTask(workspace.id, taskId, parsed.data);

  if (!result) {
    return { ok: false, error: "Task not found" };
  }

  revalidatePath(`/projects/${projectId}/tasks`);

  return { ok: true };
}

export async function deleteTaskAction(
  projectId: string,
  taskId: string
): Promise<TaskActionResult> {
  const workspace = await getActiveWorkspace();
  const deleted = await deleteTask(workspace.id, taskId);

  if (!deleted) {
    return { ok: false, error: "Task not found" };
  }

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

  await updateTask(workspace.id, taskId, { status: "done" });

  revalidatePath("/dashboard");
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath("/tasks");

  return { ok: true };
}
