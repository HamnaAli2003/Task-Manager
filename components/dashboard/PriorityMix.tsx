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

export default function PriorityMix() {
  const tasks = useDataStore((state) => state.tasks);

  const rows = TASK_PRIORITIES.map((priority) => ({
    priority,
    label: PRIORITY_LABELS[priority],
    count: tasks.filter((task) => task.priority === priority).length,
    percent: totalPercent(
      tasks.filter((task) => task.priority === priority).length,
      tasks.length,
    ),
    dot: PRIORITY_DOT[priority],
  }));

  const total = rows.reduce((sum, row) => sum + row.count, 0);
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

      <div className="flex flex-col items-center gap-4">
        <div
          className="relative size-44 shrink-0 rounded-full"
          style={{
            background: total
              ? `conic-gradient(${donutStops.join(", ")})`
              : "var(--surface-elevated)",
          }}
          role="img"
          aria-label={`${total} tasks grouped by priority`}
        >
          <div className="absolute inset-6 flex flex-col items-center justify-center rounded-full bg-glass-bg text-center">
            <span className="text-3xl font-bold text-text">{total}</span>
            <span className="text-xs text-text-muted">tasks</span>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-glass-border pt-3">
          {rows.map((row) => (
            <span key={row.priority} className="flex items-center gap-1.5 text-[10px] font-medium text-text-secondary">
              <span className={`size-2 shrink-0 rounded-full ${row.dot}`} />
              {row.label} {row.percent}%
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function totalPercent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100);
}