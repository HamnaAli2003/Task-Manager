"use server";

// Invite creation + management (M3).
// OWNER-only invite creation. The link carries an unguessable token;
// accepting it happens in app/invite/[token]/actions.ts (File 6).
import { randomBytes } from "crypto";
import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/workspace.server";
import { emitInviteSentEvent } from "@/lib/notifications.server";
import { z } from "zod";
import { revalidatePath } from "next/cache";


// Links are valid for 7 days; tokens are 24 random bytes (~192 bits).
const INVITE_TTL_DAYS = 7;
const TOKEN_BYTES = 24;

const inviteInputSchema = z.object({
  workspaceId: z.string().min(1, "Workspace is required."),
  email: z
    .union([z.string().email("Enter a valid email address."), z.literal("")])
    .optional()
    .transform((value) => (value ? value.trim().toLowerCase() : undefined)),
});

export type InviteActionResult = {
  ok: boolean;
  error?: string;
  inviteLink?: string;
};

/** Returns the membership row, or null if this user is not a member. */
async function requireMembership(workspaceId: string, userId: string) {
  return prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
}

type WorkspaceMemberWithUser = Prisma.WorkspaceMemberGetPayload<{
  include: {
    user: { select: { id: true; name: true; email: true; image: true } };
  };
}>;

/** Builds the absolute invite URL from the incoming request host. */
async function buildInviteLink(token: string): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/invite/${token}`;
}

/**
 * Creates a one-time invite for the workspace and returns the shareable link.
 *
 * Server-side rules (enforced here, never just in the UI):
 * 1. Caller must be an active member of the workspace.
 * 2. Personal workspaces are private — no invites.
 * 3. Only the workspace OWNER can invite (extend to ADMIN later).
 * 4. No email-bound invite for someone who is already a member.
 */
export async function createInviteAction(
  workspaceId: string,
  email?: string
): Promise<InviteActionResult> {
  const user = await requireUser();

  // Rule 1: membership required.
  const membership = await requireMembership(workspaceId, user.id);
  if (!membership) {
    return { ok: false, error: "You are not a member of this workspace." };
  }

  const parsed = inviteInputSchema.safeParse({ workspaceId, email });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { type: true },
  });

  if (!workspace) {
    return { ok: false, error: "Workspace not found." };
  }

  // Rule 2: personal workspaces are private — no invites, even if the
  // request is forged directly against the server action.
  if (workspace.type === "PERSONAL") {
    return {
      ok: false,
      error:
        "Personal spaces are private. Create a team workspace to invite people.",
    };
  }

  // Rule 3: owner-only invites (extend to ADMIN when that role lands).
  if (membership.role !== "OWNER") {
    return {
      ok: false,
      error: "Only the workspace owner can invite people to this workspace.",
    };
  }

  const boundEmail = parsed.data.email;

  // Rule 4: don't invite someone who is already a member.
  if (boundEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: boundEmail },
    });

    if (existingUser) {
      const alreadyMember = await prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });

      if (alreadyMember) {
        return { ok: false, error: "This user is already a member." };
      }
    }
  }

  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);

  const invite = await prisma.invite.create({
    data: {
      token,
      email: boundEmail ?? null,
      role: "MEMBER",
      workspaceId,
      createdById: user.id,
      expiresAt,
    },
  });

  // INVITE_SENT notification — only when the email belongs to a real user.
  if (boundEmail) {
    const recipient = await prisma.user.findUnique({
      where: { email: boundEmail },
    });

    if (recipient) {
      await emitInviteSentEvent({
        recipientId: recipient.id,
        workspaceId,
        inviterId: user.id,
        link: `/invite/${invite.token}`,
      });
    }
  }
  const inviteLink = await buildInviteLink(invite.token);
  return { ok: true, inviteLink };
}

/** Members list for the members page (newest joins last). */
export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberWithUser[]> {
  const user = await requireUser();

  const membership = await requireMembership(workspaceId, user.id);
  if (!membership) return [];

  return prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { joinedAt: "asc" },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });
}

/** Pending (unused + unexpired) invites for the members page. */
export async function listWorkspaceInvites(
  workspaceId: string
): Promise<Prisma.InviteGetPayload<Prisma.InviteDefaultArgs>[]> {
  const user = await requireUser();

  const [membership, workspace] = await Promise.all([
    requireMembership(workspaceId, user.id),
    prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { ownerId: true, type: true },
    }),
  ]);
  if (
    membership?.role !== "OWNER" ||
    workspace?.ownerId !== user.id ||
    workspace.type !== "TEAM"
  ) {
    return [];
  }

  return prisma.invite.findMany({
    where: {
      workspaceId,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Deletes a pending invite — its link stops working immediately. */
export async function revokeInviteAction(
  inviteId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();

  const invite = await prisma.invite.findUnique({ where: { id: inviteId } });
  if (!invite) return { ok: false, error: "Invite not found." };

  const [workspace, membership] = await Promise.all([
    prisma.workspace.findUnique({
      where: { id: invite.workspaceId },
      select: { ownerId: true, type: true },
    }),
    requireMembership(invite.workspaceId, user.id),
  ]);

  if (
    workspace?.ownerId !== user.id ||
    membership?.role !== "OWNER" ||
    workspace.type !== "TEAM"
  ) {
    return { ok: false, error: "Only the workspace owner can revoke invites." };
  }

  await prisma.invite.delete({ where: { id: inviteId } });
  revalidatePath("/members");
  return { ok: true };
}
/**
 * Removes a member from the workspace. OWNER-only.
 *
 * Safeguards (all server-side):
 * 1. Caller's membership role must be OWNER *and* they must be the
 *    workspace.ownerId (defense in depth).
 * 2. PERSONAL workspaces can never have members removed (they are private).
 * 3. The workspace owner can never be removed from their own workspace.
 * 4. The target must be an active member.
 *
 * The removed user keeps their app account, their other workspace
 * memberships, and their created projects/tasks/activity history.
 */
export async function removeMemberAction(
  workspaceId: string,
  memberId: string
): Promise<{ ok: boolean; error?: string }> {
  const user = await requireUser();

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { ownerId: true, type: true },
  });
  if (!workspace) {
    return { ok: false, error: "Workspace not found." };
  }

  // Rule 1: caller must be the OWNER (role check + ownership check).
  const callerMembership = await requireMembership(workspaceId, user.id);
  if (
    !callerMembership ||
    callerMembership.role !== "OWNER" ||
    workspace.ownerId !== user.id
  ) {
    return { ok: false, error: "Only the workspace owner can remove members." };
  }

  // Rule 2: personal workspaces are private — nothing to remove.
  if (workspace.type === "PERSONAL") {
    return { ok: false, error: "Personal spaces have no removable members." };
  }

  // Rule 3: the owner can never be removed from their own workspace.
  if (memberId === workspace.ownerId) {
    return { ok: false, error: "The workspace owner cannot be removed." };
  }

  // Rule 4: target must be an active member.
  const membership = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: memberId } },
  });
  if (!membership) {
    return { ok: false, error: "This user is not a member of this workspace." };
  }

  // Snapshot the name before deleting the membership row.
  const targetUser = await prisma.user.findUnique({
    where: { id: memberId },
    select: { name: true, email: true },
  });

  await prisma.workspaceMember.delete({ where: { id: membership.id } });

  revalidatePath("/", "layout");
  return { ok: true };
}
