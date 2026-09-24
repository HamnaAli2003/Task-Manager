"use client";

import { useDataStore } from "@/lib/dataStore";
import {
  PRIORITY_ACCENT,
  PRIORITY_BADGE,
  PRIORITY_LABELS,
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABELS,
  type TaskPriority,
} from "@/lib/taskOptions";
import DueTaskDoneButton from "./DueTaskDoneButton";

const CARD_TINT: Record<TaskPriority, string> = {
  low: "bg-priority-low/10",
  medium: "bg-priority-medium/10",
  high: "bg-priority-high/10",
  urgent: "bg-priority-urgent/10",
};

function isoDate(daysFromNow: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

function formatDueDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / 86_400_000
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";

  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DueTasksClient() {
  const tasks = useDataStore((state) => state.tasks);
  const projects = useDataStore((state) => state.projects);
  const markTaskDone = useDataStore((state) => state.markTaskDone);

  const projectNames = new Map(
    projects.map((project) => [project.id, project.name])
  );

  const todayISO = isoDate(0);
  const cutoffISO = isoDate(7);

  const upcomingTasks = tasks.filter(
    (task) =>
      task.status !== "done" &&
      task.due >= todayISO &&
      task.due <= cutoffISO
  );

  return (
    <section className="rounded-2xl border border-glass-border bg-glass-bg p-5 shadow-lg backdrop-blur-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-text">
            Due Within a Week
          </h2>

          <p className="mt-1 text-xs text-text-muted">
            Tasks that need attention soon.
          </p>
        </div>

        <span className="rounded-full bg-warning-light px-2.5 py-1 text-[11px] font-medium text-warning">
          {upcomingTasks.length} tasks
        </span>
      </div>

      {upcomingTasks.length === 0 ? (
        <p className="rounded-xl border border-border-light bg-surface-elevated p-4 text-center text-xs text-text-muted">
          No tasks are due in the next 7 days.
        </p>
      ) : (
        <div className="hide-scrollbar max-h-96 space-y-3 overflow-y-auto pr-0.5">
          {upcomingTasks.map((task) => (
            <article
              key={task.id}
              className={`rounded-xl border border-border-light border-l-4 ${PRIORITY_ACCENT[task.priority]} ${CARD_TINT[task.priority]} p-4 transition-transform duration-200 hover:-translate-y-0.5`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text">
                      {task.title}
                    </h3>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_BADGE[task.status]}`}
                      >
                        {STATUS_LABELS[task.status]}
                      </span>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${PRIORITY_BADGE[task.priority]}`}
                      >
                        {PRIORITY_LABELS[task.priority]}
                      </span>
                    </div>
                  </div>

                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    {task.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-text-muted">
                      <span className="font-medium text-text-secondary">
                        {projectNames.get(task.projectId)}
                      </span>

                      <span aria-hidden="true">•</span>

                      <span>Due {formatDueDate(task.due)}</span>
                    </div>

                    <DueTaskDoneButton
                      action={() => markTaskDone(task.id)}
                    />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}