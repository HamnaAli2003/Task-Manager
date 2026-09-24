export type TaskStatus = "todo" | "in-progress" | "review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export const TASK_STATUSES: TaskStatus[] = [
  "todo",
  "in-progress",
  "review",
  "done",
];

export const TASK_PRIORITIES: TaskPriority[] = [
  "low",
  "medium",
  "high",
  "urgent",
];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "Todo",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: "bg-status-todo/15 text-status-todo-text",
  "in-progress": "bg-status-in-progress/15 text-status-in-progress-text",
  review: "bg-status-review/15 text-status-review-text",
  done: "bg-status-done/15 text-status-done-text",
};

export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: "bg-status-todo",
  "in-progress": "bg-status-in-progress",
  review: "bg-status-review",
  done: "bg-status-done",
};

export const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-priority-low/15 text-priority-low-text",
  medium: "bg-priority-medium/15 text-priority-medium-text",
  high: "bg-priority-high/15 text-priority-high-text",
  urgent: "bg-priority-urgent/15 text-priority-urgent-text",
};

export const PRIORITY_ACCENT: Record<TaskPriority, string> = {
  low: "border-l-priority-low",
  medium: "border-l-priority-medium",
  high: "border-l-priority-high",
  urgent: "border-l-priority-urgent",
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && TASK_STATUSES.includes(value as TaskStatus);
}

export function isTaskPriority(value: unknown): value is TaskPriority {
  return (
    typeof value === "string" &&
    TASK_PRIORITIES.includes(value as TaskPriority)
  );
}