"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

const POLL_INTERVAL_MS = 30_000;

export default function NotificationBell({
  unreadCount,
}: {
  unreadCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Simple polling: revalidate the server tree so the badge stays fresh.
  // Deliberately NOT a WebSocket — realtime is deferred to chat (M4).
  useEffect(() => {
    const id = setInterval(() => router.refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [router]);

  const isActive = pathname === "/notifications";

  const content = (
    <>
      <svg
        viewBox="0 0 24 24"
        className="size-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>

      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white shadow-(--clay-drop)"
          aria-label={`${unreadCount} unread notifications`}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </>
  );

  return (
    <Link
      href="/notifications"
      aria-label={`Notifications${
        unreadCount > 0 ? ` (${unreadCount} unread)` : ""
      }`}
      className={`
        relative flex size-9 shrink-0 items-center justify-center
        rounded-xl border
        transition hover:-translate-y-0.5
        ${
          isActive
            ? "border-accent bg-accent-soft text-accent dark:text-purple-300"
            : "border-glass-border bg-glass-bg text-text-secondary shadow-(--clay-inset-low) backdrop-blur-xl hover:bg-accent-soft hover:text-accent dark:text-slate-300 dark:hover:text-purple-300"
        }
      `}
    >
      {content}
    </Link>
  );
}