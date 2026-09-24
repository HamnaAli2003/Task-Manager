"use server";

import { revalidatePath } from "next/cache";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/data.server";
import { getActiveWorkspace } from "@/lib/workspace.server";
import type { Project } from "@/lib/data";
import {
  projectSchema,
  type ProjectActionResult,
  type ProjectFormInput,
} from "@/lib/schemas";

export async function createProjectAction(
  input: ProjectFormInput
): Promise<ProjectActionResult & { project?: Project }> {
  const parsed = projectSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  // Resolve the caller's workspace on the server — the client never sends it.
  const workspace = await getActiveWorkspace();
  const project = await createProject(workspace.id, parsed.data);

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { ok: true, project };
}

export async function updateProjectAction(
  projectId: string,
  input: ProjectFormInput
): Promise<ProjectActionResult & { project?: Project }> {
  const parsed = projectSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const workspace = await getActiveWorkspace();
  const project = await updateProject(workspace.id, projectId, parsed.data);

  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");

  return { ok: true, project };
}

export async function deleteProjectAction(
  projectId: string
): Promise<ProjectActionResult> {
  const workspace = await getActiveWorkspace();
  const deleted = await deleteProject(workspace.id, projectId);

  if (!deleted) {
    return { ok: false, error: "Project not found." };
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");

  return { ok: true };
}
