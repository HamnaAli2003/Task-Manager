"use client";

// Dropdown to switch between the user's workspaces + a button to
// create a new one. Calls server actions inside a transition so the
// UI can show a pending state while the cookie + revalidation happen.
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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

// The switcher always shows the fixed " Personal" label for PERSONAL
// workspaces (ignoring the stored name); TEAM workspaces show " {name}".
export function workspaceLabel(workspace: WorkspaceOption): string {
  return workspace.type === "PERSONAL"
    ? " Personal"
    : ` ${workspace.name}`;
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
  const activeWorkspace = workspaces.find(
    (workspace) => workspace.id === activeWorkspaceId,
  );

  function handleWorkspaceChange(workspaceId: string) {
    startTransition(async () => {
      const result = await switchWorkspaceAction(workspaceId);

      if (!result.ok) {
        window.alert(result.error ?? "Could not switch workspace.");
        return;
      }

      // Layout re-renders with the newly selected workspace's data.
      router.refresh();
    });
  }

  function handleCreateWorkspace() {
    setWorkspaceName("");
    setIsCreateModalOpen(true);
  }

  function handleRenameWorkspace() {
    setWorkspaceName(activeWorkspace?.name ?? "");
    setIsRenameModalOpen(true);
  }

  function handleCreateWorkspaceSubmit() {
    const name = workspaceName.trim();

    if (!name) return;

    setIsCreateModalOpen(false);

    startTransition(async () => {
      const result = await createWorkspaceAction(name);

      if (!result.ok) {
        window.alert(result.error ?? "Could not create workspace.");
        return;
      }

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
        window.alert(result.error ?? "Could not rename workspace.");
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
          onNameChange={setWorkspaceName}
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
        onNameChange={setWorkspaceName}
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
    </div>
  );
}

