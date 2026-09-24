"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskActionResult } from "@/lib/schemas";
import TaskDeleteModal from "./TaskDeleteModal";

type DeleteTaskButtonProps = {
  action: (taskId: string) => Promise<TaskActionResult>;
  taskId: string;
  taskTitle?: string;
};

export default function DeleteTaskButton({
  action,
  taskId,
  taskTitle,
}: DeleteTaskButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    setOpen(false);
    startTransition(async () => {
      await action(taskId);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-label="Delete task"
        title="Delete task"
        className="
          inline-flex size-7 items-center justify-center
          rounded-md border border-clay-edge bg-clay-bg
          text-danger shadow-sm transition
          hover:bg-danger-light hover:text-danger
          dark:hover:text-white
          disabled:cursor-wait
        "
      >
        {pending ? (
          <span className="text-xs leading-none">…</span>
        ) : (
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
            <path d="M3 6h18" />
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        )}
      </button>

      <TaskDeleteModal
        open={open}
        matchValue={taskTitle ?? ""}
        title="Delete task?"
        body={
          <>
            Are you sure you want to delete
            {taskTitle ? (
              <>
                {" "}
                <span className="font-semibold text-text">
                  &quot;{taskTitle}&quot;
                </span>
              </>
            ) : (
              " this task"
            )}
            ? This action cannot be undone.
          </>
        }
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={onDelete}
      />
    </>
  );
}