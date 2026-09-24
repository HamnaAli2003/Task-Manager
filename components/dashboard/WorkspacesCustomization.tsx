"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteWorkspaceAction,
  renameWorkspaceAction,
  updateWorkspaceLogoAction,
} from "@/app/(dashboard)/workspace/action";
import TaskDeleteModal from "./TaskDeleteModal";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2 MB

type WorkspaceCardData = {
  id: string;
  name: string;
  logoUrl?: string | null;
  memberCount: number;
  role: string;
};

export default function WorkspacesCustomization({
  workspaces,
}: {
  workspaces: WorkspaceCardData[];
}) {
  return (
    <section
      aria-labelledby="workspaces-customization-title"
      className="
        rounded-3xl border border-clay-edge bg-clay-bg p-6
        shadow-(--clay-card)
      "
    >
      <h2
        id="workspaces-customization-title"
        className="text-base font-bold text-text"
      >
        Workspaces customization
      </h2>
      <p className="mt-1 text-sm text-text-secondary">
        Customize the branding of every workspace you belong to. Each
        workspace keeps its own name and logo — changes here never affect your
        profile photo or other workspaces.
      </p>

      {workspaces.length === 0 ? (
        <p className="mt-4 text-sm text-text-muted">
          You are not a member of any workspace yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {workspaces.map((workspace) => (
            <WorkspaceBrandingCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    </section>
  );
}

function WorkspaceBrandingCard({
  workspace,
}: {
  workspace: WorkspaceCardData;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const isOwner = workspace.role === "OWNER";

  const [name, setName] = useState(workspace.name);
  const [logoUrl, setLogoUrl] = useState<string | null>(
    workspace.logoUrl ?? null,
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [pending, startTransition] = useTransition();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const initials = workspace.name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function onPickFile(file?: File) {
    if (!file) return;

    setError("");
    setSaved("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large. Please choose a file under 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : null;
      if (!dataUrl) {
        setError("Could not read the image file.");
        return;
      }

      // Preview immediately, persist in the background.
      setLogoUrl(dataUrl);

      startTransition(async () => {
        const result = await updateWorkspaceLogoAction(workspace.id, dataUrl);
        if (result.error) {
          setError(result.error);
          setLogoUrl(workspace.logoUrl ?? null);
          return;
        }
        setSaved("Workspace logo updated.");
        router.refresh();
      });
    };
    reader.readAsDataURL(file);
  }

  function onRemoveLogo() {
    setError("");
    setSaved("");

    startTransition(async () => {
      const result = await updateWorkspaceLogoAction(workspace.id, null);
      if (result.error) {
        setError(result.error);
        return;
      }
      setLogoUrl(null);
      setSaved("Workspace logo removed.");
      router.refresh();
    });
  }

  function onSaveName() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Workspace name cannot be empty.");
      return;
    }

    setError("");
    setSaved("");

    startTransition(async () => {
      const result = await renameWorkspaceAction(workspace.id, trimmed);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(`Renamed to "${trimmed}".`);
      router.refresh();
    });
  }

  function onDeleteWorkspace() {
    setDeleteOpen(false);

    startTransition(async () => {
      const result = await deleteWorkspaceAction(workspace.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      // The active workspace (if this one) was repointed to Personal by the
      // action; refresh the profile + layout so the card disappears.
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-clay-edge bg-field-bg p-4">
      {/* Header: workspace icon/logo + status */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${workspace.name} logo`}
              className="size-14 rounded-2xl border border-clay-edge bg-clay-bg object-cover shadow-(--clay-drop)"
            />
          ) : (
            <div
              className="
                flex size-14 items-center justify-center rounded-2xl
                bg-accent text-lg font-bold text-white
                shadow-(--clay-drop)
              "
            >
              {initials}
            </div>
          )}

          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={pending}
                className="
                  absolute -bottom-1 -right-1 flex size-8 items-center justify-center
                  rounded-full border border-clay-edge bg-clay-bg text-text-muted
                  shadow-(--clay-drop) transition hover:text-accent
                  disabled:cursor-wait disabled:opacity-60
                "
                aria-label={`Upload ${workspace.name} logo`}
                title="Upload workspace logo"
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
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              </button>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => onPickFile(event.target.files?.[0])}
              />
            </>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">
            {workspace.name}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">
            {workspace.memberCount} member
            {workspace.memberCount === 1 ? "" : "s"} · {workspace.role}
          </p>

          {logoUrl && isOwner && (
            <button
              type="button"
              disabled={pending}
              onClick={onRemoveLogo}
              className="
                mt-2 inline-flex items-center gap-1.5 rounded-lg
                border border-danger/40 bg-danger/10 px-2 py-1
                text-[11px] font-semibold text-danger
                transition hover:bg-danger hover:text-white
                focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0
                disabled:cursor-wait disabled:opacity-60
              "
            >
              Remove logo
            </button>
          )}
        </div>
      </div>

      {/* Name editing (owner only) */}
      <div className="mt-4">
        {isOwner ? (
          <div className="flex items-end gap-2">
            <label htmlFor={`workspace-name-${workspace.id}`} className="sr-only">
              Workspace name
            </label>
            <input
              id={`workspace-name-${workspace.id}`}
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                setSaved("");
              }}
              maxLength={60}
              disabled={pending}
              className="
                w-full rounded-xl
                border border-field-border
                bg-clay-bg
                px-3 py-2
                text-sm text-text
                outline-none
                shadow-(--field-inset)
                transition
                focus:border-accent
                focus:ring-2
                focus:ring-accent/20
                disabled:cursor-wait disabled:opacity-60
              "
            />
            <button
              type="button"
              disabled={pending}
              onClick={onSaveName}
              className="
                shrink-0 rounded-xl
                border border-clay-edge bg-clay-bg px-3 py-2
                text-xs font-bold text-accent shadow-(--clay-drop)
                transition hover:-translate-y-0.5 hover:bg-accent hover:text-white
                disabled:cursor-wait disabled:opacity-60
              "
            >
              {pending ? "Saving..." : "Save name"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-text-muted">
            Only the workspace owner can rename it or change its logo.
          </p>
        )}

        {isOwner && (
          <div className="mt-4 flex items-center justify-between border-t border-clay-edge pt-4">
            <p className="text-xs text-text-muted">
              Permanently removes this workspace, its projects and tasks.
            </p>

            <button
              type="button"
              disabled={pending}
              onClick={() => setDeleteOpen(true)}
              className="
                shrink-0 rounded-xl
                border border-danger/40 bg-danger/10 px-3 py-2
                text-xs font-bold text-danger
                transition hover:bg-danger hover:text-white
                focus:outline-none focus:ring-0
                focus-visible:outline-none focus-visible:ring-0
                disabled:cursor-wait disabled:opacity-60
              "
            >
              Delete workspace
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-danger">{error}</p>
      )}
      {saved && (
        <p className="mt-3 text-sm font-medium text-success">{saved}</p>
      )}

      <TaskDeleteModal
        open={deleteOpen}
        matchValue={workspace.name}
        title="Delete workspace?"
        body={
          <>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-text">
              &quot;{workspace.name}&quot;
            </span>
            ? All projects and tasks in it will be permanently removed.
          </>
        }
        confirmLabel="Delete workspace"
        pending={pending}
        matchLabel="to confirm deletion"
        matchSubject="workspace name"
        ariaLabel="Type the workspace name to delete"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={onDeleteWorkspace}
      />
    </div>
  );
}