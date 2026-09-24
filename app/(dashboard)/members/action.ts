"use server";

// Invite creation + management (M3).
// Any member can generate a one-time invite link for their workspace.
// The link carries an unguessable token; accepting it happens in
// app/invite/[token]/actions.ts (File 6).
import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/workspace.server";
import { emitInviteSentEvent } from "@/lib/notifications.server";
import { z } from "zod";

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

/** Builds the absolute invite URL from the incoming request host. */
async function buildInviteLink(token: string): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost:3000";
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}/invite/${token}`;
}

/**
 * Creates a one-time invite for the workspace and returns the shareable link.
 * If an email is provided and belongs to an existing user, an INVITE_SENT
 * notification is emitted to that user.
 */
export async function createInviteAction(
  workspaceId: string,
  email?: string
): Promise<InviteActionResult> {
  const user = await requireUser();

  // Security: only workspace members can create invites.
  const membership = await requireMembership(workspaceId, user.id);
  if (!membership) {
    return { ok: false, error: "You are not a member of this workspace." };
  }

  const parsed = inviteInputSchema.safeParse({ workspaceId, email });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const boundEmail = parsed.data.email;

  // Don't create an email-bound invite for someone who is already a member.
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
export async function listWorkspaceMembers(workspaceId: string) {
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
export async function listWorkspaceInvites(workspaceId: string) {
  const user = await requireUser();

  const membership = await requireMembership(workspaceId, user.id);
  if (!membership) return [];

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

  // Only the workspace owner or the invite creator may revoke.
  const workspace = await prisma.workspace.findUnique({
    where: { id: invite.workspaceId },
  });

  if (workspace?.ownerId !== user.id && invite.createdById !== user.id) {
    return { ok: false, error: "You are not allowed to revoke this invite." };
  }

  await prisma.invite.delete({ where: { id: inviteId } });
  return { ok: true };
}
