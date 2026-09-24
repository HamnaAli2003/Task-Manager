"use server";

import { requireUser } from "@/lib/workspace.server";
import {
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications.server";
import { revalidatePath } from "next/cache";

export type NotificationActionResult = { ok: boolean; error?: string };

export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult> {
  const user = await requireUser();

  // Ownership is enforced inside markNotificationRead (userId in WHERE).
  await markNotificationRead(user.id, notificationId);

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const user = await requireUser();

  await markAllNotificationsRead(user.id);

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Lightweight unread count for the bell badge polling. */
export async function getUnreadNotificationCountAction(): Promise<number> {
  const user = await requireUser();

  return getUnreadNotificationCount(user.id);
}