"use client";

import { useDataStore } from "@/lib/dataStore";
import {
  PRIORITY_LABELS,
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABELS,
} from "@/lib/taskOptions";
import { TEAM_MEMBERS_BY_ID } from "@/lib/data";
import DueTaskDoneButton from "./DueTaskDoneButton";

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
        <div className="hide-scrollbar max-h-96 overflow-auto">
          <table className="w-full min-w-145 border-collapse text-left text-xs">
            <thead className="sticky top-0 bg-glass-bg text-[10px] font-medium text-text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Task</th>
                <th className="px-3 py-2 font-medium">Deadline</th>
                <th className="px-3 py-2 font-medium">Assigned</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {upcomingTasks.map((task) => {
                const assignee = task.assigneeId
                  ? TEAM_MEMBERS_BY_ID.get(task.assigneeId)
                  : undefined;

                return (
                  <tr key={task.id} className="border-t border-border-light">
                    <td className="max-w-56 px-3 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`size-2 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-text">
                            {task.title}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-text-muted">
                            {projectNames.get(task.projectId)} · {PRIORITY_LABELS[task.priority]} priority
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-text-secondary">
                      {formatDueDate(task.due)}
                    </td>
                    <td className="px-3 py-3">
                      {assignee ? (
                        <span className="flex items-center gap-2 whitespace-nowrap text-text-secondary">
                          <span className={`flex size-6 items-center justify-center rounded-full ${assignee.color} text-[9px] font-bold text-white`}>
                            {assignee.initials}
                          </span>
                          {assignee.name.split(" ")[0]}
                        </span>
                      ) : (
                        <span className="text-text-muted">Unassigned</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${STATUS_BADGE[task.status]}`}>
                        {STATUS_LABELS[task.status]}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <DueTaskDoneButton action={() => markTaskDone(task.id)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}