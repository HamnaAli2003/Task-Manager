// Server-side notification helpers.
//
// One Notification row per recipient per event. `userId` is ALWAYS the recipient.
// All helpers require / return a userId — the caller (a page or server action)
// is responsible for binding it to the authenticated session user.
import { prisma } from "@/lib/prisma";
import type { NotificationType, Prisma } from "@prisma/client";

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

/** The user's notifications, newest first (the notifications page feed). */
export async function listNotifications(
  userId: string
): Promise<NotificationItem[]> {
  return prisma.notification.findMany({
    where: { userId },
    include: { actor: { select: { name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Unread count for the bell badge. */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

/**
 * Marks ONE notification read. Ownership is enforced in the query itself —
 * a notification can only be touched by its own recipient.
 */
export async function markNotificationRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { readAt: new Date() },
  });
  return result.count > 0;
}

/** Marks ALL of the user's notifications read. */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
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
 *
 * Wired to the workspace-membership creation path that ALREADY exists
 * today (creating a workspace adds the creator as its first member).
 * Because those are self-joins, there are no OTHER members to notify, so
 * no rows are usually produced — but the pipeline is exercised end-to-end.
 *
 * When M3 invites land, accepting an invite also calls this helper, and
 * existing members then receive the notification automatically.
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
 * TODO(M3 invites) — INVITE_SENT hook.
 *
 * Call from the invite-creation action at the exact point where an invite
 * row is created. Per the notifications plan, emit ONLY when the invited
 * email already belongs to an existing user (a real recipient exists);
 * silently skip invites addressed to unknown emails.
 *
 *   import { emitInviteSentEvent } from "@/lib/notifications.server";
 *   // after invite row is created:
 *   const recipient = await prisma.user.findUnique({ where: { email: invite.email } });
 *   if (recipient) {
 *     await emitInviteSentEvent({
 *       recipientId: recipient.id,
 *       workspaceId: invite.workspaceId,
 *       inviterId: invite.createdById,
 *     });
 *   }
 *
 * The `link` is intentionally left to the caller of this TODO flow so it can
 * point at the accept-invite route once invites exist.
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
 * TODO(M3 invites) — INVITE_ACCEPTED hook.
 *
 * Call from the invite-accept action right after the inviter creates the
 * workspace membership for the new member (i.e. when the invite is used).
 * Notifies the workspace OWNER that their invitation was accepted.
 *
 *   import { emitInviteAcceptedEvent } from "@/lib/notifications.server";
 *   // after membership is created:
 *   await emitInviteAcceptedEvent({
 *     workspaceId: invite.workspaceId,
 *     inviterId: invite.createdById,
 *     memberId: <the accepting user's id>,
 *     memberName: <the accepting user's name>,
 *   });
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
 *
 * Notify every member except the owner who performed the rename.
 * Message format (per product spec):
 *   "Workspace was renamed to '[New Name]'."
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
 * WORKSPACE_DELETED — an owner deleted a shared workspace.
 *
 * Notify every ejectee EXCEPT the owner who deleted it, BEFORE the
 * workspace row is gone so the notification's workspace link still
 * resolves. The affected members lose their cookie-backed workspace on
 * their next request (getActiveWorkspace fallback to Personal).
 * Message format (per product spec):
 *   "The workspace '[Workspace Name]' was deleted by the owner."
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