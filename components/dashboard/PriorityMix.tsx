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
  const urgentCount =
    rows.find((row) => row.priority === "urgent")?.count ?? 0;
  let cumulativePercent = 0;
  const donutStops = rows.map((row) => {
    const start = cumulativePercent;
    cumulativePercent += total ? (row.count / total) * 100 : 0;
    return `var(--priority-${row.priority}) ${start}% ${cumulativePercent}%`;
  });

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

      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-center">
        <div
          className="relative size-36 shrink-0 rounded-full"
          style={{
            background: total
              ? `conic-gradient(${donutStops.join(", ")})`
              : "var(--surface-elevated)",
          }}
          role="img"
          aria-label={`${total} tasks grouped by priority`}
        >
          <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-glass-bg text-center">
            <span className="text-2xl font-bold text-text">{total}</span>
            <span className="text-[10px] text-text-muted">tasks</span>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 gap-x-4 gap-y-3 sm:max-w-44 sm:grid-cols-1">
          {rows.map((row) => (
            <div key={row.priority} className="flex items-center gap-2 text-xs">
              <span className={`size-2 shrink-0 rounded-full ${row.dot}`} />
              <span className="text-text-secondary">{row.label}</span>
              <span className="ml-auto font-medium text-text">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-glass-border pt-3 text-[10px] text-text-muted">
        <span>{total} priority tasks</span>
        <span>
          {urgentCount} {urgentCount === 1 ? "task" : "tasks"} urgent
        </span>
      </div>
    </section>
  );
}