"use client";

import { useDataStore } from "@/lib/dataStore";
import {
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  type TaskPriority,
} from "@/lib/taskOptions";

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

const PRIORITY_BAR: Record<TaskPriority, string> = {
  low: "bg-priority-low",
  medium: "bg-priority-medium",
  high: "bg-priority-high",
  urgent: "bg-priority-urgent",
};

export default function PriorityMix() {
  const tasks = useDataStore((state) => state.tasks);

  const rows = TASK_PRIORITIES.map((priority) => ({
    priority,
    label: PRIORITY_LABELS[priority],
    count: tasks.filter((task) => task.priority === priority).length,
    dot: PRIORITY_DOT[priority],
    bar: PRIORITY_BAR[priority],
  }));

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  const safeTotal = total || 1;
  const urgentCount =
    rows.find((row) => row.priority === "urgent")?.count ?? 0;

  return (
    <section
      className="
        rounded-3xl
        border border-glass-border
        bg-glass-bg
        p-4
        shadow-(--clay-deep)
        backdrop-blur-xl
      "
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-text">
          Priority Mix
        </h2>

        <p className="mt-1 text-xs text-text-muted">
          Current tasks by priority.
        </p>
      </div>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.priority}
            className="flex items-center gap-3"
          >
            <span className={`size-2.5 rounded-full ${row.dot}`} />

            <span className="text-xs font-medium text-text-secondary">
              {row.label}
            </span>

            <span className="ml-auto">{row.count}</span>
          </div>
        ))}
      </div>

      {/* Proportional stacked bar */}
      <div className="mt-4">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-elevated">
          {rows.map((row) => (
            <div
              key={row.priority}
              className={row.bar}
              style={{ width: `${(row.count / safeTotal) * 100}%` }}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between text-[9px] font-medium text-text-muted">
          {rows.map((row) => (
            <span key={row.priority} className="flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${row.dot}`} />
              {row.label} {Math.round((row.count / safeTotal) * 100)}%
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-accent-soft p-4">
        <p className="text-xs font-bold text-accent">
          {total} priority tasks
        </p>

        <p className="mt-1 text-[10px] leading-4 text-text-muted">
          {urgentCount} {urgentCount === 1 ? "task" : "tasks"} currently need
          urgent attention.
        </p>
      </div>
    </section>
  );
}