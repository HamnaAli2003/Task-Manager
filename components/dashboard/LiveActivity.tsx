"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getWorkspaceActivityAction } from "@/app/(dashboard)/dashboard/action";

type ActivityEventRow = {
  id: string;
  type: string;
  message: string;
  actorName: string | null;
  createdAt: string;
};

const ACTIVITY_ICON: Record<string, string> = {
  TASK_CREATED: "+",
  TASK_UPDATED: "↻",
  TASK_STATUS_CHANGED: "↻",
  TASK_ASSIGNED: "→",
  TASK_COMPLETED: "✓",
  TASK_DELETED: "×",
  PROJECT_CREATED: "▣",
  PROJECT_UPDATED: "↻",
  PROJECT_DELETED: "×",
  INVITE_SENT: "✉",
  MEMBER_JOINED: "+",
  MEMBER_REMOVED: "×",
};

const ACTIVITY_COLOR: Record<string, string> = {
  TASK_CREATED: "bg-accent",
  TASK_UPDATED: "bg-info",
  TASK_STATUS_CHANGED: "bg-warning",
  TASK_ASSIGNED: "bg-accent",
  TASK_COMPLETED: "bg-success",
  TASK_DELETED: "bg-danger",
  PROJECT_CREATED: "bg-warning",
  PROJECT_UPDATED: "bg-info",
  PROJECT_DELETED: "bg-danger",
  INVITE_SENT: "bg-info",
  MEMBER_JOINED: "bg-success",
  MEMBER_REMOVED: "bg-danger",
};

function timeAgo(iso: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LiveActivity({
  initialActivities,
}: {
  initialActivities: ActivityEventRow[];
}) {
  const [activities, setActivities] = useState(initialActivities);
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);

  // 15s poll — workspace-scoped (action filters by the ACTIVE workspace).
  const refresh = useCallback(async () => {
    try {
      const events = await getWorkspaceActivityAction();
      setActivities(events);
    } catch {
      // keep last snapshot on failure
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setMounted(true);
    }, 1_000);

    const poll = window.setInterval(() => {
      void refresh();
    }, 15_000);

    return () => {
      window.clearInterval(timer);
      window.clearInterval(poll);
    };
  }, [refresh]);

  return (
    <section className="rounded-3xl border border-glass-border bg-glass-bg bg-linear-to-br from-accent/10 via-transparent to-success/10 p-4 shadow-(--clay-deep) backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-text">Live Activity</h2>

          <p className="mt-1 text-xs text-text-muted">
            Recent workspace activity.
          </p>
        </div>

        <span className="relative flex size-2.5">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-40" />
          <span className="relative inline-flex size-2.5 rounded-full bg-success" />
        </span>
      </div>

      <div className="hide-scrollbar max-h-96 space-y-3 overflow-y-auto pr-0.5">
        {activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-light bg-surface-elevated p-4 text-center text-[11px] leading-5 text-text-muted">
            No activity yet in this workspace — invites, joins and task changes
            show up here.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  ACTIVITY_COLOR[activity.type] ?? "bg-text-muted"
                } text-sm font-bold text-white`}
              >
                {ACTIVITY_ICON[activity.type] ?? "•"}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] leading-4 text-text-secondary">
                  <span className="font-semibold text-text">
                    {activity.message}
                  </span>
                </p>

                <p className="mt-0.5 text-[9px] text-text-muted">
                  {mounted ? timeAgo(activity.createdAt, now) : ""}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4">
        <Link
          href="/activity"
          className="
            text-xs font-semibold
            text-accent
            transition hover:text-accent-2
          "
        >
          View all activity →
        </Link>
      </div>
    </section>
  );
}
