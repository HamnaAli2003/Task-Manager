"use server";

import { revalidatePath } from "next/cache";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/lib/data.server";
import {
  getActiveWorkspace,
  requireUser,
} from "@/lib/workspace.server";
import {
  canCreateProjectInWorkspace,
  getProjectAccess,
} from "@/lib/access.server";
import { prisma } from "@/lib/prisma";
import type { Project } from "@/lib/data";
import {
  projectSchema,
  type ProjectActionResult,
  type ProjectFormInput,
} from "@/lib/schemas";

/** Appends a PROJECT row to the workspace activity history (name snapshots). */
async function logProjectActivity(input: {
  workspaceId: string;
  type: string;
  actorName: string;
  targetName: string;
  message: string;
}): Promise<void> {
  await prisma.activityEvent.create({
    data: {
      workspaceId: input.workspaceId,
      category: "PROJECT",
      type: input.type,
      actorName: input.actorName,
      targetName: input.targetName,
      message: input.message,
    },
  });
}

export async function createProjectAction(
  input: ProjectFormInput
): Promise<ProjectActionResult & { project?: Project }> {
  // 🔍 TEMP DEBUG — test ke baad ye 3 lines delete kar dena
  console.log("🔥 createProjectAction hit:", input);

  const parsed = projectSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  // Resolve caller + workspace on the server — the client never sends them.
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  // 🔍 TEMP DEBUG — kaun, kaunsa workspace, guard ne kya kaha
  console.log("🔍 debug:", {
    userId: user.id,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    workspaceType: workspace.type,
  });

  // Workspace-level right: owner, or a member the owner granted
  // canCreateProject. Members default to DENIED until granted.
  const allowed = await canCreateProjectInWorkspace(user.id, workspace.id);

  // 🔍 TEMP DEBUG — guard ka result
  console.log("🛡️ allowed =", allowed);

  if (!allowed) {
    return {
      ok: false,
      error:
        "You don't have permission to create projects in this workspace.",
    };
  }

  const project = await createProject(workspace.id, parsed.data);

  await logProjectActivity({
    workspaceId: workspace.id,
    type: "PROJECT_CREATED",
    actorName: user.name ?? "Someone",
    targetName: project.name,
    message: `${user.name ?? "Someone"} created project "${project.name}".`,
  });

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/activity");

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

  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  const access = await getProjectAccess(user.id, projectId);
  if (!access.canView) {
    // Not a member / RESTRICTED without a row → never leak existence.
    return { ok: false, error: "Project not found." };
  }
  if (!access.canManageProject) {
    return {
      ok: false,
      error: "Only the owner (or EDIT access on restricted projects) can edit this project.",
    };
  }

  const project = await updateProject(workspace.id, projectId, parsed.data);
  if (!project) {
    return { ok: false, error: "Project not found." };
  }

  await logProjectActivity({
    workspaceId: workspace.id,
    type: "PROJECT_UPDATED",
    actorName: user.name ?? "Someone",
    targetName: project.name,
    message: `${user.name ?? "Someone"} updated project "${project.name}".`,
  });

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/dashboard");
  revalidatePath("/activity");

  return { ok: true, project };
}

export async function deleteProjectAction(
  projectId: string
): Promise<ProjectActionResult> {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  const access = await getProjectAccess(user.id, projectId);
  if (!access.canView) {
    return { ok: false, error: "Project not found." };
  }
  if (!access.canDeleteProject) {
    return {
      ok: false,
      error: "Only the workspace owner can delete this project.",
    };
  }

  // Snapshot the name BEFORE the delete (history stays readable).
  const existing = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id },
    select: { name: true },
  });

  const deleted = await deleteProject(workspace.id, projectId);
  if (!deleted) {
    return { ok: false, error: "Project not found." };
  }

  if (existing) {
    await logProjectActivity({
      workspaceId: workspace.id,
      type: "PROJECT_DELETED",
      actorName: user.name ?? "Someone",
      targetName: existing.name,
      message: `${user.name ?? "Someone"} deleted project "${existing.name}".`,
    });
  }

  revalidatePath("/projects");
  revalidatePath("/dashboard");
  revalidatePath("/activity");

  return { ok: true };
}

export type ProjectMemberPermission = {
  userId: string;
  name: string;
  email: string | null;
  canCreateTasks: boolean;
  canDeleteTasks: boolean;
  canEditProject: boolean;
};

export async function getProjectCapabilitiesAction(projectId: string) {
  const user = await requireUser();
  return getProjectAccess(user.id, projectId);
}

export async function getProjectMemberPermissionsAction(projectId: string) {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  if (workspace.ownerId !== user.id) {
    return { ok: false as const, error: "Only the workspace owner can manage project access." };
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, workspaceId: workspace.id },
    select: { accessMode: true },
  });
  if (!project) {
    return { ok: false as const, error: "Project not found." };
  }

  const [members, grants] = await Promise.all([
    prisma.workspaceMember.findMany({
      where: { workspaceId: workspace.id, role: "MEMBER" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.projectAccess.findMany({ where: { projectId } }),
  ]);
  const grantByUserId = new Map(grants.map((grant) => [grant.userId, grant]));

  return {
    ok: true as const,
    members: members.map(({ user: member }) => {
      const grant = grantByUserId.get(member.id);
      return {
        userId: member.id,
        name: member.name ?? member.email ?? "Unnamed member",
        email: member.email,
        canCreateTasks: grant?.canCreateTasks ?? project.accessMode === "ALL_MEMBERS",
        canDeleteTasks: grant?.canDeleteTasks ?? false,
        canEditProject: grant?.canEditProject ?? grant?.permission === "EDIT",
      };
    }),
  };
}

export async function setProjectMemberPermissionsAction(
  projectId: string,
  memberId: string,
  permissions: Pick<ProjectMemberPermission, "canCreateTasks" | "canDeleteTasks" | "canEditProject">,
) {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  if (workspace.ownerId !== user.id) {
    return { ok: false, error: "Only the workspace owner can manage project access." };
  }
  if (Object.values(permissions).some((value) => typeof value !== "boolean")) {
    return { ok: false, error: "Invalid project permissions." };
  }

  const [project, member] = await Promise.all([
    prisma.project.findFirst({
      where: { id: projectId, workspaceId: workspace.id },
      select: { id: true, accessMode: true },
    }),
    prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: memberId } },
      select: { role: true },
    }),
  ]);
  if (!project || !member || member.role !== "MEMBER") {
    return { ok: false, error: "Project member not found." };
  }

  const grant = {
    ...permissions,
    permission: permissions.canEditProject ? "EDIT" as const : "VIEW" as const,
  };
  if (
    project.accessMode === "RESTRICTED" &&
    !permissions.canCreateTasks &&
    !permissions.canDeleteTasks &&
    !permissions.canEditProject
  ) {
    await prisma.projectAccess.deleteMany({
      where: { projectId, userId: memberId },
    });
    revalidatePath(`/projects/${projectId}`);
    revalidatePath(`/projects/${projectId}/tasks`);
    return { ok: true };
  }
  await prisma.projectAccess.upsert({
    where: { projectId_userId: { projectId, userId: memberId } },
    create: { projectId, userId: memberId, ...grant },
    update: grant,
  });

  revalidatePath(`/projects/${projectId}`);
  revalidatePath(`/projects/${projectId}/tasks`);
  revalidatePath(`/projects/${projectId}/edit`);
  return { ok: true };
}
