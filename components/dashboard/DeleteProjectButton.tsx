"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
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
  const [error, setError] = useState("");

  // Portal-safe mount check (same pattern as CreateWorkspaceModal).
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );

  function onDelete() {
    setOpen(false);
    startTransition(async () => {
      // Safety: id kabhi undefined na ho.
      if (!projectId) {
        setError("Could not delete project: missing project id.");
        return;
      }

      const result = await action(projectId);

      // Server ne mana kiya — styled modal mein dikhao, page pe raho.
      if (!result || !result.ok) {
        setError(
          result?.error ??
            "You don't have permission to delete this project."
        );
        return;
      }

      // Success — list pe wapas.
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

      {/* Styled error modal — app ke baqi modals jaisi theme */}
      {error &&
        mounted &&
        createPortal(
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-error-title"
            className="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md"
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setError("")}
              className="absolute inset-0 cursor-default"
            />

            <div className="relative w-full max-w-md rounded-xl border border-purple-200/60 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-800">
              <div className="text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-danger/10 text-xl text-danger">
                  ⚠️
                </div>

                <h2
                  id="delete-error-title"
                  className="mt-4 text-lg font-bold text-slate-900 dark:text-slate-100"
                >
                  Cannot delete project
                </h2>

                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  {error}
                </p>

                <button
                  type="button"
                  onClick={() => setError("")}
                  className="
                    mt-6 w-full rounded-xl
                    border border-purple-500 bg-purple-500
                    px-4 py-2.5
                    text-sm font-semibold text-white
                    shadow-sm
                    transition hover:bg-purple-600
                    focus:outline-none focus:ring-0
                    focus-visible:outline-none focus-visible:ring-0
                  "
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
