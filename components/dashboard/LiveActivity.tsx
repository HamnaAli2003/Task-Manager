"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  activityLabel,
  useDataStore,
  type ActivityEntry,
} from "@/lib/dataStore";

const ACTIVITY_ICON: Record<ActivityEntry["type"], string> = {
  "task-created": "+",
  "task-updated": "↻",
  "task-deleted": "×",
  "task-done": "✓",
  "project-created": "▣",
  "project-updated": "↻",
  "project-deleted": "▣",
};

const ACTIVITY_COLOR: Record<ActivityEntry["type"], string> = {
  "task-created": "bg-accent",
  "task-updated": "bg-info",
  "task-deleted": "bg-danger",
  "task-done": "bg-success",
  "project-created": "bg-warning",
  "project-updated": "bg-info",
  "project-deleted": "bg-danger",
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

export default function LiveActivity() {
  const activities = useDataStore((state) => state.activities);
  const projects = useDataStore((state) => state.projects);
  const [now, setNow] = useState(() => Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setMounted(true);
    }, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const projectNames = new Map(
    projects.map((project) => [project.id, project.name])
  );

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
            No activity yet — changes you make across the app show up here
            instantly.
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <div
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${ACTIVITY_COLOR[activity.type]} text-sm font-bold text-white`}
              >
                {ACTIVITY_ICON[activity.type]}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] leading-4 text-text-secondary">
                  <span className="font-bold text-text">
                    {activityLabel(activity.type)}
                  </span>{" "}
                  <span className="font-semibold text-text">
                    {activity.detail}
                  </span>
                  {activity.projectId &&
                    projectNames.get(activity.projectId) && (
                      <span className="text-text-muted">
                        {" "}
                        · {projectNames.get(activity.projectId)}
                      </span>
                    )}
                </p>

                <p className="mt-0.5 text-[9px] text-text-muted">
                  {mounted ? timeAgo(activity.at, now) : ""}
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