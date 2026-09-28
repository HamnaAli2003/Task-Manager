"use server";

import { requireUser, getActiveWorkspace } from "@/lib/workspace.server";
import {
  deleteNotification,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/data.server";
import { revalidatePath } from "next/cache";

export type NotificationActionResult = { ok: boolean; error?: string };

export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  // Recipient and active workspace are both enforced by the query.
  await markNotificationRead(user.id, workspace.id, notificationId);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  // Scoped to the ACTIVE workspace — other workspaces stay untouched.
  await markAllNotificationsRead(user.id, workspace.id);

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Deletes ONE notification row. Ownership is enforced inside
 * deleteNotification (userId in WHERE) — a user can never delete
 * another member's copy.
 */
export async function deleteNotificationAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const user = await requireUser();

  const workspace = await getActiveWorkspace();
  const deleted = await deleteNotification(user.id, workspace.id, notificationId);
  if (!deleted) {
    return { ok: false, error: "Notification not found." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Lightweight unread count for the bell badge polling (active workspace). */
export async function getUnreadNotificationCountAction(): Promise<number> {
  const user = await requireUser();
  const workspace = await getActiveWorkspace();

  return getUnreadNotificationCount(user.id, workspace.id);
}
