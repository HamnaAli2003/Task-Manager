"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TaskActionResult } from "@/lib/schemas";

type DueTaskDoneButtonProps = {
  action: () => Promise<TaskActionResult>;
};

export default function DueTaskDoneButton({
  action,
}: DueTaskDoneButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onMarkDone() {
    startTransition(async () => {
      await action();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onMarkDone}
      disabled={pending}
      aria-label="Mark task as done"
      className="
        rounded-full border border-border-light bg-clay-bg px-3 py-1
        text-[11px] font-semibold text-text-secondary
        transition hover:border-success hover:text-success
        disabled:cursor-wait disabled:opacity-60
      "
    >
      {pending ? "Updating…" : "Mark Done"}
    </button>
  );
}