"use client";

// Dropdown to switch between the user's workspaces + a button to
// create a new one. Calls server actions inside a transition so the
// UI can show a pending state while the cookie + revalidation happen.
// Also listens for "pmp:open-create-workspace" so the topbar upsell
// (Invite clicked while a PERSONAL workspace is active) can open the
// create-workspace modal from anywhere in the layout.
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createWorkspaceAction,
  renameWorkspaceAction,
  switchWorkspaceAction,
} from "@/app/(dashboard)/workspace/action";
import ClaySelect from "./ClaySelect";
import CreateWorkspaceModal from "./CreateWorkspaceModal";

type WorkspaceOption = { id: string; name: string; type?: string; logoUrl?: string | null };

type WorkspaceSwitcherProps = {
  workspaces: WorkspaceOption[];
  activeWorkspaceId: string;
  compact?: boolean;
  selectOnly?: boolean;
};

// The switcher always shows the fixed "🏠 Personal" label for PERSONAL
// workspaces (ignoring the stored name); TEAM workspaces show "👥 {name}".
export function workspaceLabel(workspace: WorkspaceOption): string {
  return workspace.type === "PERSONAL"
    ? "🏠 Personal"
    : `👥 ${workspace.name}`;
}

export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  compact = false,
  selectOnly = false,
}: WorkspaceSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [workspaceName, setWorkspaceName] = useState("");
  const [createError, setCreateError] = useState("");
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  // Opens the create-workspace modal when the topbar upsell CTA fires
  // (Invite clicked while a PERSONAL workspace is active).
  // Only the compact (sidebar) instance listens — the dropdown instance
  // also mounts one, so without the gate both would open their own copy.
  useEffect(() => {
    if (!compact) return;
    const openCreate = () => {
      setWorkspaceName("");
      setCreateError("");
      setIsCreateModalOpen(true);
    };
    window.addEventListener("pmp:open-create-workspace", openCreate);
    return () =>
      window.removeEventListener("pmp:open-create-workspace", openCreate);
  }, [compact]);

  function handleWorkspaceChange(workspaceId: string) {
    startTransition(async () => {
      const result = await switchWorkspaceAction(workspaceId);

      if (!result.ok) {
        setWorkspaceError(result.error ?? "Could not switch workspace.");
        return;
      }

      // Layout re-renders with the newly selected workspace's data.
      router.refresh();
    });
  }

  function handleCreateWorkspace() {
    setWorkspaceName("");
    setCreateError("");
    setIsCreateModalOpen(true);
  }

  function handleCreateWorkspaceNameChange(name: string) {
    setWorkspaceName(name);
    setCreateError("");
  }

  function handleRenameWorkspace() {
    setWorkspaceName(activeWorkspace?.name ?? "");
    setIsRenameModalOpen(true);
  }

  function handleCreateWorkspaceSubmit() {
    const name = workspaceName.trim();

    if (!name) return;

    startTransition(async () => {
      const result = await createWorkspaceAction(name);

      if (!result.ok) {
        setCreateError(result.error ?? "Could not create workspace.");
        return;
      }

      setCreateError("");
      setIsCreateModalOpen(false);
      router.refresh();
    });
  }

  function handleRenameWorkspaceSubmit() {
    const name = workspaceName.trim();

    if (!name || !activeWorkspace) return;

    setIsRenameModalOpen(false);

    startTransition(async () => {
      const result = await renameWorkspaceAction(activeWorkspace.id, name);

      if (!result.ok) {
        setWorkspaceError(result.error ?? "Could not rename workspace.");
        return;
      }

      router.refresh();
    });
  }

  if (compact) {
    return (
      <>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleCreateWorkspace}
            disabled={isPending}
            aria-label="Create new workspace"
            title="New workspace"
            className="flex size-7 items-center justify-center rounded-lg text-lg font-medium text-text-muted transition hover:bg-accent-soft hover:text-accent disabled:cursor-wait disabled:opacity-60 dark:text-slate-300 dark:hover:text-purple-300"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleRenameWorkspace}
            disabled={isPending || !activeWorkspace}
            aria-label="Rename current workspace"
            title="Rename workspace"
            className="flex size-7 items-center justify-center rounded-lg text-text-muted transition hover:bg-accent-soft hover:text-accent disabled:cursor-wait disabled:opacity-60 dark:text-slate-300 dark:hover:text-purple-300"
          >
            <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        </div>
        <CreateWorkspaceModal
          open={isCreateModalOpen}
          name={workspaceName}
          pending={isPending}
          error={createError}
          onNameChange={handleCreateWorkspaceNameChange}
          onCancel={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateWorkspaceSubmit}
        />
        <CreateWorkspaceModal
          open={isRenameModalOpen}
          name={workspaceName}
          pending={isPending}
          title="Rename workspace"
          description="Choose a new name for this workspace."
          submitLabel="Save name"
          onNameChange={setWorkspaceName}
          onCancel={() => setIsRenameModalOpen(false)}
          onSubmit={handleRenameWorkspaceSubmit}
        />

        {workspaceError && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="workspace-error-title"
            className="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          >
            <button
              type="button"
              aria-label="Close error dialog"
              onClick={() => setWorkspaceError(null)}
              className="absolute inset-0 cursor-default"
            />

            <div className="relative w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0d1117]/95 p-5 shadow-2xl shadow-black/30 sm:p-8">
              <h2
                id="workspace-error-title"
                className="break-words text-xl font-bold text-white sm:text-3xl"
              >
                {activeWorkspace ? "Workspace update" : "Workspace access"}
              </h2>

              <p className="mt-4 break-words text-sm leading-6 text-slate-200 sm:mt-5 sm:text-xl sm:leading-8">
                {workspaceError}
              </p>

              <div className="mt-6 flex justify-center sm:mt-7">
                <button
                  type="button"
                  onClick={() => setWorkspaceError(null)}
                  className="w-full rounded-full border border-[#9fe9d9] bg-[#9fe9d9] px-6 py-2.5 text-base font-bold text-slate-900 shadow-[0_0_0_2px_rgba(159,233,217,0.25)] transition hover:brightness-95 sm:w-auto sm:px-12 sm:py-3 sm:text-2xl"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${selectOnly ? "w-full" : ""}`}>
      <ClaySelect
        value={activeWorkspaceId}
        onChange={handleWorkspaceChange}
        options={workspaces.map((workspace) => ({
          value: workspace.id,
          label: workspaceLabel(workspace),
          avatar: workspace.logoUrl,
          fallback: workspace.name,
        }))}
        ariaLabel="Select workspace"
        className={selectOnly ? "w-full" : "min-w-48"}
      />

      {!selectOnly && (
        <button
          type="button"
          onClick={handleCreateWorkspace}
          disabled={isPending}
          className="
            min-w-0 max-w-40 truncate
            rounded-2xl
            border border-clay-edge
            bg-clay-bg
            px-4 py-2.5
            text-sm font-semibold text-text-secondary
            shadow-(--clay-drop)
            transition
            hover:-translate-y-0.5
            hover:text-text
            disabled:cursor-wait
            disabled:opacity-60
            dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:text-slate-100
          "
          title="New workspace"
        >
          + New workspace
        </button>
      )}
      <CreateWorkspaceModal
        open={isCreateModalOpen}
        name={workspaceName}
        pending={isPending}
        error={createError}
        onNameChange={handleCreateWorkspaceNameChange}
        onCancel={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateWorkspaceSubmit}
      />
      <CreateWorkspaceModal
        open={isRenameModalOpen}
        name={workspaceName}
        pending={isPending}
        title="Rename workspace"
        description="Choose a new name for this workspace."
        submitLabel="Save name"
        onNameChange={setWorkspaceName}
        onCancel={() => setIsRenameModalOpen(false)}
        onSubmit={handleRenameWorkspaceSubmit}
      />

      {workspaceError && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="workspace-error-title"
          className="fixed inset-0 z-999 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            aria-label="Close error dialog"
            onClick={() => setWorkspaceError(null)}
            className="absolute inset-0 cursor-default"
          />

          <div className="relative w-full max-w-xl rounded-[28px] border border-white/10 bg-[#0d1117]/95 p-8 shadow-2xl shadow-black/30">
            <h2
              id="workspace-error-title"
              className="text-3xl font-bold text-white"
            >
              {activeWorkspace ? "Workspace update" : "Workspace access"}
            </h2>

            <p className="mt-5 text-xl leading-8 text-slate-200">
              {workspaceError}
            </p>

            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => setWorkspaceError(null)}
                className="rounded-full border border-[#9fe9d9] bg-[#9fe9d9] px-12 py-3 text-2xl font-bold text-slate-900 shadow-[0_0_0_2px_rgba(159,233,217,0.25)] transition hover:brightness-95"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
