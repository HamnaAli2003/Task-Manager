"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ProjectActionResult } from "@/lib/schemas";
import ConfirmDeleteModal from "./ConfirmDeleteModal";

type DeleteProjectButtonProps = {
  action: (projectId: string) => Promise<ProjectActionResult>;
  projectId: string;
  projectName: string;
};

export default function DeleteProjectButton({
  action,
  projectId,
  projectName,
}: DeleteProjectButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onDelete() {
    setOpen(false);
    startTransition(async () => {
      await action(projectId);
      router.push("/projects");
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        aria-label={`Delete ${projectName}`}
        title={`Delete ${projectName}`}
        className="
          rounded-xl border border-border-light bg-clay-bg
          px-4 py-2 text-sm font-semibold text-danger
          shadow-sm transition
          hover:border-black hover:text-black
          dark:hover:border-white dark:hover:text-white
          disabled:cursor-wait
        "
      >
        {pending ? "…" : "Delete project"}
      </button>

      <ConfirmDeleteModal
        open={open}
        title="Delete project?"
        body={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text">
              &quot;{projectName}&quot;
            </span>
            ? This will permanently remove the project and all of its tasks.
          </>
        }
        pending={pending}
        onCancel={() => setOpen(false)}
        onConfirm={onDelete}
      />
    </>
  );
}