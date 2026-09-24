"use server";

// Workspace switch + create actions.
// Cookies can only be SET inside a Server Action (or route handler) —
// never during render. That is why these live in a "use server" file.
import { prisma } from "@/lib/prisma";
import { ensurePersonalWorkspace, requireUser } from "@/lib/workspace.server";
import {
  emitMemberJoinedEvent,
  emitWorkspaceDeletedEvent,
  emitWorkspaceRenamedEvent,
} from "@/lib/notifications.server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const WORKSPACE_COOKIE = "pmp-workspace";

// User-defined workspace names must be 3-60 characters.
const workspaceNameSchema = z
  .string()
  .trim()
  .min(3, "Workspace name must be at least 3 characters.")
  .max(60, "Workspace name must be 60 characters or fewer.");

type WorkspaceActionResult = {
  ok: boolean;
  error?: string;
  workspace?: { id: string; name: string };
};

/** Switches the active workspace after verifying membership. */
export async function switchWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionResult> {
  const user = await requireUser();

  // Verify membership BEFORE touching the cookie — never trust the client.
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: { workspaceId, userId: user.id },
    },
  });

  if (!membership) {
    return { ok: false, error: "You are not a member of this workspace." };
  }

  const cookieStore = await cookies();

  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // remember the choice for a year
  });

  // Refresh every server component under this layout with the new workspace.
  revalidatePath("/", "layout");

  return { ok: true };
}

/** Creates a new workspace (user-defined name) and switches to it. */
export async function createWorkspaceAction(
  name: string
): Promise<WorkspaceActionResult> {
  const parsed = workspaceNameSchema.safeParse(name);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid workspace name.",
    };
  }

  const user = await requireUser();

  // Workspace + OWNER membership are created together. User-created
  // workspaces from the "+ New workspace" modal are always TEAM type.
  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data,
      type: "TEAM",
      ownerId: user.id,
      members: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
  });

  // Switch to the freshly created workspace right away.
  const cookieStore = await cookies();

  cookieStore.set(WORKSPACE_COOKIE, workspace.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  // The creator is the workspace's first member. No one else exists to
  // notify yet, so this is usually a no-op — but the MEMBER_JOINED
  // pipeline is exercised end-to-end from the real membership-creation
  // site. (M3 invites reuse this same helper for real multi-member joins.)
  await emitMemberJoinedEvent(workspace.id, user.id);

  revalidatePath("/", "layout");

  return { ok: true, workspace: { id: workspace.id, name: workspace.name } };
}

/** Renames a workspace after verifying that the current user owns it. */
export async function renameWorkspaceAction(
  workspaceId: string,
  name: string,
): Promise<WorkspaceActionResult> {
  const parsed = workspaceNameSchema.safeParse(name);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid workspace name.",
    };
  }

  const user = await requireUser();
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    select: { id: true },
  });

  if (!workspace) {
    return { ok: false, error: "Only the workspace owner can rename it." };
  }

  const updatedWorkspace = await prisma.workspace.update({
    where: { id: workspace.id },
    data: { name: parsed.data },
    select: { id: true, name: true },
  });

  // Tell every OTHER member the workspace was renamed (the owner knows).
  await emitWorkspaceRenamedEvent(workspace.id, user.id, updatedWorkspace.name);

  revalidatePath("/", "layout");

  return { ok: true, workspace: updatedWorkspace };
}

/**
 * Deletes a workspace (and its projects/tasks) owner-only.
 *
 * Security: verifies the caller is the workspace OWNER before touching
 * anything. Members are ejected with a WORKSPACE_DELETED notification and
 * their cookie-backed workspace becomes stale — getActiveWorkspace then
 * falls back to the Personal workspace (no cross-user data exposure).
 * The current owner's cookie is repointed at their Personal workspace.
 */
export async function deleteWorkspaceAction(
  workspaceId: string
): Promise<WorkspaceActionResult> {
  const user = await requireUser();

  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    select: { id: true, name: true },
  });

  if (!workspace) {
    return { ok: false, error: "Only the workspace owner can delete it." };
  }

  // Eject other members BEFORE the row is deleted (the notification keeps
  // a workspace link snapshot for the feed).
  await emitWorkspaceDeletedEvent(workspace.id, user.id, workspace.name);

  // Cascade removes memberships, projects, tasks and invites; other
  // users' notifications survive (workspaceId becomes null).
  await prisma.workspace.delete({ where: { id: workspace.id } });

  // If the deleted workspace was the active one, fall back to Personal so
  // the next render loads a workspace the user still belongs to.
  const cookieStore = await cookies();
  if (cookieStore.get(WORKSPACE_COOKIE)?.value === workspace.id) {
    const personal = await ensurePersonalWorkspace(user.id);

    cookieStore.set(WORKSPACE_COOKIE, personal.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  revalidatePath("/", "layout");

  return { ok: true };
}

// Workspace logos are stored as base64 data URLs (same mechanism as the
// profile photo) so no object storage dependency is needed.
const MAX_LOGO_CHARS = 3 * 1024 * 1024; // ~3 MB of base64 text ≈ 2 MB image

/**
 * Sets (or clears) the logo ONLY for the given workspace. Owner-only.
 * Branding is strictly per-workspace — this never touches the user's
 * profile photo (User.image) or any other workspace's logoUrl.
 */
export async function updateWorkspaceLogoAction(
  workspaceId: string,
  logoUrl: string | null,
): Promise<{ ok: boolean; error?: string }> {
  if (logoUrl !== null) {
    if (!logoUrl.startsWith("data:image/")) {
      return { ok: false, error: "Invalid image. Upload an image file." };
    }

    if (logoUrl.length > MAX_LOGO_CHARS) {
      return { ok: false, error: "Image is too large. Please choose a smaller image." };
    }
  }

  const user = await requireUser();
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    select: { id: true },
  });

  if (!workspace) {
    return { ok: false, error: "Only the workspace owner can change its branding." };
  }

  await prisma.workspace.update({
    where: { id: workspace.id },
    data: { logoUrl: logoUrl ?? null },
  });

  // Refresh the sidebar switcher + all layouts that render workspace logos.
  revalidatePath("/", "layout");

  return { ok: true };
}
