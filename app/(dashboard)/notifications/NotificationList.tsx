"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { NotificationItem } from "@/lib/notifications.server";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/(dashboard)/notifications/actions";

const TYPE_LABEL: Record<string, string> = {
  INVITE_SENT: "Invite",
  INVITE_ACCEPTED: "Invite accepted",
  MEMBER_JOINED: "New member",
  TASK_ASSIGNED: "Assignment",
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
  const [localDeleted, setLocalDeleted] = useState<Set<string>>(new Set());

  // Locally-deleted rows disappear instantly; the DB delete runs in the
  // background. Rows are per-recipient, so this NEVER affects other members.
  const visible = notifications.filter(
    (notification) => !localDeleted.has(notification.id),
  );

  const unread = visible.filter(
    (notification) => !notification.readAt && !localRead.has(notification.id),
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

  function handleDelete(notificationId: string) {
    setLocalDeleted((current) => new Set(current).add(notificationId));

    startTransition(async () => {
      await deleteNotificationAction(notificationId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-surface-elevated p-8 text-center">
          <p className="text-sm font-medium text-text">
            No notifications in this workspace.
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Updates for the active workspace will appear here.
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

          {visible.map((notification) => {
            const isUnread =
              !notification.readAt && !localRead.has(notification.id);

            return (
              <div
                key={notification.id}
                role="button"
                tabIndex={0}
                onClick={() => handleOpen(notification)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleOpen(notification);
                }}
                className={`
                  flex w-full cursor-pointer items-start gap-4 rounded-2xl border p-4 text-left
                  transition hover:-translate-y-0.5
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

                {/* Per-recipient delete — deletion is never synced. */}
                <button
                  type="button"
                  aria-label="Delete notification"
                  title="Delete notification"
                  disabled={pending}
                  onClick={(event) => {
                    event.stopPropagation(); // don't trigger open/mark-read
                    handleDelete(notification.id);
                  }}
                  className="
                    flex size-7 shrink-0 items-center justify-center
                    rounded-lg text-text-muted
                    transition hover:bg-danger/10 hover:text-danger
                    disabled:cursor-wait disabled:opacity-50
                  "
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="size-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
