import Link from "next/link";
import type { Task } from "@/lib/data";
import { TEAM_MEMBERS_BY_ID } from "@/lib/data";
import type { TaskActionResult } from "@/lib/schemas";
import {
  PRIORITY_ACCENT,
  PRIORITY_BADGE,
  PRIORITY_LABELS,
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABELS,
} from "@/lib/taskOptions";
import DeleteTaskButton from "./DeleteTaskButton";

function formatDue(date: string): string {
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

type TaskCardProps = {
  task: Task;
  projectName?: string;
  deleteAction?: (taskId: string) => Promise<TaskActionResult>;
};

export default function TaskCard({
  task,
  projectName,
  deleteAction,
}: TaskCardProps) {
  const assignee = task.assigneeId
    ? TEAM_MEMBERS_BY_ID.get(task.assigneeId)
    : undefined;

  return (
    <article
      className={`flex h-full flex-col rounded-xl border border-border-light border-l-4 bg-surface-elevated p-4 shadow-(--clay-inset-low) transition duration-200 hover:-translate-y-0.5 ${PRIORITY_ACCENT[task.priority]}`}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-start gap-3">
          <span
            className={`mt-1.5 size-2 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
          />

          <div className="flex min-w-0 flex-1 flex-col">
            <h3 className="text-sm font-semibold leading-snug text-text">
              {task.title}
            </h3>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_BADGE[task.status]}`}>
                {STATUS_LABELS[task.status]}
              </span>

              <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${PRIORITY_BADGE[task.priority]}`}>
                {PRIORITY_LABELS[task.priority]}
              </span>
            </div>

            <p className="mt-3 flex-1 text-xs leading-5 text-text-secondary">
              {task.description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex min-h-7 items-center justify-between gap-3 pl-5">
          <div className="min-w-0 flex-1 text-[11px] font-medium text-text-secondary">
            {assignee && (
              <>
                <span className="inline-flex items-center gap-1.5 align-middle">
                  <span
                    title={`${assignee.name} · ${assignee.role}`}
                    className={`inline-flex size-5 items-center justify-center rounded-full ${assignee.color} text-[8px] font-bold text-white`}
                  >
                    {assignee.initials}
                  </span>

                  <span>{assignee.name.split(" ")[0]}</span>
                </span>

                {projectName && (
                  <span aria-hidden="true" className="mx-1.5 text-text-muted">
                    •
                  </span>
                )}
              </>
            )}

            {projectName && <span>{projectName}</span>}

            {(assignee || projectName) && (
              <span aria-hidden="true" className="mx-1.5 text-text-muted">
                •
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 align-middle">
              <svg
                viewBox="0 0 24 24"
                className="size-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="17" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>Due {formatDue(task.due)}</span>
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/projects/${task.projectId}/tasks/${task.id}/edit`}
              aria-label={`Edit ${task.title}`}
              title={`Edit ${task.title}`}
              className="
                  inline-flex size-7 items-center justify-center
                  rounded-md border border-clay-edge bg-clay-bg
                  text-accent shadow-sm transition
                  hover:bg-accent-soft hover:text-accent-hover
                "
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
            </Link>

            {deleteAction && (
              <DeleteTaskButton
                action={deleteAction}
                taskId={task.id}
                taskTitle={task.title}
              />
            )}
          </div>
        </div>
      </div>
    </article>
  );
}