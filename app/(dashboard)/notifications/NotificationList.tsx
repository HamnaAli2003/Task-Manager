"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/lib/notifications.server";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(dashboard)/notifications/actions";

const TYPE_LABEL: Record<string, string> = {
  INVITE_SENT: "Invite",
  INVITE_ACCEPTED: "Invite accepted",
  MEMBER_JOINED: "New member",
  TASK_ASSIGNED: "Assignment",
  TASK_DUE_SOON: "Due soon",
  CHAT_MESSAGE: "Message",
  WORKSPACE_RENAMED: "Workspace renamed",
  WORKSPACE_DELETED: "Workspace deleted",
};

function initialsOf(name: string | null | undefined): string {
  return (name ?? "?")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function NotificationList({
  notifications,
}: {
  notifications: NotificationItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [localRead, setLocalRead] = useState<Set<string>>(new Set());

  const unread = notifications.filter(
    (notification) => !notification.readAt && !localRead.has(notification.id)
  ).length;

  function handleOpen(notification: NotificationItem) {
    // Mark read (local-first so the list re-renders instantly).
    setLocalRead((current) => new Set(current).add(notification.id));

    startTransition(async () => {
      await markNotificationReadAction(notification.id);
      if (notification.link) {
        router.push(notification.link);
      } else {
        router.refresh();
      }
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsReadAction();
      setLocalRead(new Set());
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-surface-elevated p-8 text-center">
          <p className="text-sm font-medium text-text">No notifications yet.</p>
          <p className="mt-1 text-xs text-text-muted">
            Updates from your workspaces will appear here.
          </p>
        </div>
      ) : (
        <>
          {unread > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-text-muted">
                {unread} unread
              </p>

              <button
                type="button"
                disabled={pending}
                onClick={handleMarkAll}
                className="
                  rounded-xl px-3 py-1.5
                  text-xs font-semibold text-accent
                  transition hover:bg-accent/10
                  disabled:cursor-wait
                "
              >
                Mark all as read
              </button>
            </div>
          )}

          {notifications.map((notification) => {
            const isUnread = !notification.readAt && !localRead.has(notification.id);

            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleOpen(notification)}
                disabled={pending}
                className={`
                  flex w-full items-start gap-4 rounded-2xl border p-4 text-left
                  transition hover:-translate-y-0.5
                  disabled:cursor-wait
                  ${
                    isUnread
                      ? "border-accent/30 bg-accent-soft shadow-(--clay-inset-high)"
                      : "border-border-light bg-surface-elevated opacity-80"
                  }
                `}
              >
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                  {initialsOf(notification.actor?.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-text">{notification.message}</p>

                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`
                        rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider
                        ${
                          isUnread
                            ? "bg-accent text-white"
                            : "bg-text-muted/10 text-text-muted"
                        }
                      `}
                    >
                      {TYPE_LABEL[notification.type] ?? notification.type}
                    </span>

                    <p className="text-xs text-text-muted">
                      {notification.workspaceId ? "Workspace" : "General"} ·{" "}
                      {notification.createdAt.toLocaleString()}
                    </p>
                  </div>
                </div>

                {isUnread && (
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-accent"
                  />
                )}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}